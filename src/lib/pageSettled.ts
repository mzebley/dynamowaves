export interface PageSettledOptions {
	/** Consecutive on-time frames that count as "the main thread has gone quiet". */
	quietFrames?: number;
	/** Frame budget in ms. Anything slower means the page is still working. */
	frameBudget?: number;
	/** Cap load/font/frame waiting; requireVisible may delay completion further. */
	timeout?: number;
	/** Hold until visible, even after timeout. Abort to dispose a hidden-page wait. */
	requireVisible?: boolean;
	/** Abort resolves false and releases all scheduled work. */
	signal?: AbortSignal;
}
/**
 * Resolves once the page has stopped loading *and* rendering.
 *
 * `load` only says the subresources arrived — the layout and paint work they
 * trigger lands after it, and that work is what drops frames. So this also waits
 * out webfont swaps and then watches for a run of frames delivered on time,
 * which is the part an animation actually cares about.
 *
 * Resolves true when ready, false on abort or during SSR. The timeout caps
 * settling work; with requireVisible, completion still waits for visibility.
 * Callers should pass their lifecycle signal and check the result before acting.
 */
export function whenPageSettled({
	quietFrames = 4,
	frameBudget = 24,
	timeout = 3000,
	requireVisible = true,
	signal
}: PageSettledOptions = {}): Promise<boolean> {
	if (typeof window === 'undefined' || signal?.aborted) return Promise.resolve(false);

	return new Promise<boolean>((resolve) => {
		let done = false;
		let raf = 0;
		let cap: ReturnType<typeof setTimeout>;

		let settled = false;

		function stopSettling() {
			clearTimeout(cap);
			cancelAnimationFrame(raf);
			window.removeEventListener('load', afterLoad);
		}

		function complete(ready: boolean) {
			if (done) return;
			done = true;
			stopSettling();
			document.removeEventListener('visibilitychange', onVisible);
			signal?.removeEventListener('abort', onAbort);
			resolve(ready);
		}

		function onAbort() { complete(false); }
		function onVisible() {
			if (!document.hidden) complete(true);
		}

		function finish() {
			if (done || settled) return;
			settled = true;
			stopSettling();
			if (requireVisible && document.hidden) {
				document.addEventListener('visibilitychange', onVisible);
			} else complete(true);
		}

		function watchFrames() {
			if (done || settled) return;
			let streak = 0;
			let last = performance.now();
			raf = requestAnimationFrame(function tick(now) {
				if (done || settled) return;
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

		signal?.addEventListener('abort', onAbort, { once: true });
		cap = setTimeout(finish, timeout);
		if (document.readyState === 'complete') afterLoad();
		else window.addEventListener('load', afterLoad, { once: true });
	});
}
