<script lang="ts">
	import { onMount } from 'svelte';
	import { WORDMARK_PATH_D } from './waveWordmark.path';

	type WaveElement = HTMLElement & {
		pause(): void;
	};

	type WaveWordmarkProps = {
		baseColor?: string;
		waveColor?: string;
		animated?: boolean;
		speed?: number;
	};

	const initialPath =
		'M 0 160 L 0 126 Q 0 126, 102.86 91.8 Q 205.71 57.6, 308.57 80.4 Q 411.43 103.2, 514.29 70.8 Q 617.14 38.4, 720 63.6 Q 822.86 88.8, 925.71 78.6 Q 1028.57 68.4, 1131.43 91.8 Q 1234.29 115.2, 1337.15 82.2 Q 1440 49.2, 1440 49.2 L 1440 160 Z';
	const initialSeed =
		'TSAwIDE2MCBMIDAgMTI2IFEgMCAxMjYsIDEwMi44NiA5MS44IFEgMjA1LjcxIDU3LjYsIDMwOC41NyA4MC40IFEgNDExLjQzIDEwMy4yLCA1MTQuMjkgNzAuOCBRIDYxNy4xNCAzOC40LCA3MjAgNjMuNiBRIDgyMi44NiA4OC44LCA5MjUuNzEgNzguNiBRIDEwMjguNTcgNjguNCwgMTEzMS40MyA5MS44IFEgMTIzNC4yOSAxMTUuMiwgMTMzNy4xNSA4Mi4yIFEgMTQ0MCA0OS4yLCAxNDQwIDQ5LjIgTCAxNDQwIDE2MCBa';

	let {
		baseColor,
		waveColor,
		animated = true,
		speed = 7000,
	}: WaveWordmarkProps = $props();

	const instanceId = $props.id();
	const wordmarkPathId = `dynamowaves-wordmark-path-${instanceId}`;
	const clipId = `dynamowaves-wordmark-${instanceId}`;
	let generator = $state<WaveElement>();
	let visibleWavePath = $state<SVGPathElement>();

	onMount(() => {
		if (!generator || !visibleWavePath) return;

		let sourcePath: SVGPathElement | null = null;
		let pathObserver: MutationObserver | null = null;

		const syncPath = () => {
			const pathData = sourcePath?.getAttribute('d');
			if (pathData) visibleWavePath?.setAttribute('d', pathData);
		};

		const connectSourcePath = () => {
			const nextPath = generator?.querySelector<SVGPathElement>('path') ?? null;
			if (!nextPath || nextPath === sourcePath) return;

			pathObserver?.disconnect();
			sourcePath = nextPath;
			syncPath();

			pathObserver = new MutationObserver(syncPath);
			pathObserver.observe(sourcePath, {
				attributes: true,
				attributeFilter: ['d'],
			});
		};

		const hostObserver = new MutationObserver(connectSourcePath);
		hostObserver.observe(generator, { childList: true, subtree: true });
		connectSourcePath();

		return () => {
			hostObserver.disconnect();
			pathObserver?.disconnect();
			generator?.pause();
		};
	});
</script>

<div
	class="wave-wordmark"
	data-wave-wordmark
	data-wave-wordmark-animated={animated ? 'true' : 'false'}
	style:--dynamo-wordmark-base-color={baseColor}
	style:--dynamo-wordmark-wave-color={waveColor}
>
	<svg viewBox="0 0 1440 260" aria-hidden="true" focusable="false">
		<defs>
			<path id={wordmarkPathId} d={WORDMARK_PATH_D}></path>
			<clipPath id={clipId} clipPathUnits="userSpaceOnUse">
				<use href={`#${wordmarkPathId}`}></use>
			</clipPath>
		</defs>

		<use class="wordmark-base" href={`#${wordmarkPathId}`}></use>

		<g clip-path={`url(#${clipId})`}>
			<path
				bind:this={visibleWavePath}
				class="wordmark-wave"
				d={initialPath}
				transform="translate(0 -5) scale(1 1.65)"
			></path>
		</g>
	</svg>

	<dynamo-wave
		bind:this={generator}
		class="wave-generator"
		data-wave-points="8"
		data-wave-variance="3"
		data-wave-speed={String(speed)}
		data-wave-animate={animated ? 'true' : undefined}
		data-wave-seed={initialSeed}
	></dynamo-wave>
</div>

<style>
	.wave-wordmark {
		position: relative;
		inline-size: 100%;
		color: var(--dynamo-wordmark-base-color, var(--zbk-brand-ink-emphasis, #2b4444));
	}

	svg {
		display: block;
		inline-size: 100%;
		block-size: 100%;
		overflow: visible;
	}

	.wordmark-base {
		fill: currentColor;
	}

	.wordmark-wave {
		fill: var(--dynamo-wordmark-wave-color, var(--zbk-brand-canvas, #fff));
	}

	.wave-generator {
		position: absolute;
		inline-size: 1px;
		block-size: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		pointer-events: none;
	}
</style>
