export interface PageSettledOptions {
	/** Consecutive on-time frames that count as "the main thread has gone quiet". */
	quietFrames?: number;
	/** Frame budget in ms. Anything slower means the page is still working. */
	frameBudget?: number;
	/** Resolve regardless after this long, so a page that never goes quiet still fires. */
	timeout?: number;
	/** Hold until the tab is actually being looked at. */
	requireVisible?: boolean;
}
/**
 * Resolves once the page has stopped loading *and* rendering.
 *
 * `load` only says the subresources arrived — the layout and paint work they
 * trigger lands after it, and that work is what drops frames. So this also waits
 * out webfont swaps and then watches for a run of frames delivered on time,
 * which is the part an animation actually cares about.
 *
 * Never resolves during SSR. Always resolves in the browser: `timeout` is a hard
 * cap, so a page that never goes quiet still gets its callback.
 *
 * ```ts
 * whenPageSettled().then(() => nib.getAnimations()[0]?.play());
 * ```
 */
export function whenPageSettled({
	quietFrames = 4,
	frameBudget = 24,
	timeout = 3000,
	requireVisible = true
}: PageSettledOptions = {}): Promise<void> {
	if (typeof window === 'undefined') return new Promise<void>(() => {});

	return new Promise<void>((resolve) => {
		let done = false;
		let raf = 0;
		let cap: ReturnType<typeof setTimeout>;

		function onVisible() {
			if (document.hidden) return;
			document.removeEventListener('visibilitychange', onVisible);
			resolve();
		}

		function finish() {
			if (done) return;
			done = true;
			clearTimeout(cap);
			cancelAnimationFrame(raf);
			window.removeEventListener('load', afterLoad);
			// A flourish nobody is looking at is a flourish wasted.
			if (requireVisible && document.hidden) {
				document.addEventListener('visibilitychange', onVisible);
				return;
			}
			resolve();
		}

		function watchFrames() {
			if (done) return;
			let streak = 0;
			let last = performance.now();
			raf = requestAnimationFrame(function tick(now) {
				if (done) return;
				streak = now - last <= frameBudget ? streak + 1 : 0;
				last = now;
				if (streak >= quietFrames) finish();
				else raf = requestAnimationFrame(tick);
			});
		}

		function afterLoad() {
			// Webfonts reflow the page well after `load`; let them land first.
			const fonts = document.fonts?.ready ?? Promise.resolve();
			fonts.then(watchFrames, watchFrames);
		}

		cap = setTimeout(finish, timeout);
		if (document.readyState === 'complete') afterLoad();
		else window.addEventListener('load', afterLoad, { once: true });
	});
}
