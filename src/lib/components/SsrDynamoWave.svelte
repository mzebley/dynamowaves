<script lang="ts">
	import { onMount } from 'svelte';

	type WaveFace = 'top' | 'bottom' | 'left' | 'right';
	type WavePoints = 6 | 8;
	type WaveElement = HTMLElement & {
		generateNewWave(duration?: number): void;
	};

	type SsrDynamoWaveProps = {
		element?: WaveElement;
		id?: string;
		class?: string;
		style?: string;
		face?: WaveFace;
		points?: WavePoints;
		speed?: number | string;
		animate?: boolean;
		observe?: string;
	};

	type WaveSnapshot = {
		path: string;
		seed: string;
		viewBox: string;
	};

	const horizontalSixPointWave: WaveSnapshot = {
		path: 'M 0 160 L 0 99.98 Q 0 99.98, 144 114.84 Q 288 129.69, 432 122.01 Q 576 114.32, 720 89.04 Q 864 63.76, 1008 67.78 Q 1152 71.79, 1296 83.46 Q 1440 95.12, 1440 95.12 L 1440 160 Z',
		seed: 'TSAwIDE2MCBMIDAgOTkuOTggUSAwIDk5Ljk4LCAxNDQgMTE0Ljg0IFEgMjg4IDEyOS42OSwgNDMyIDEyMi4wMSBRIDU3NiAxMTQuMzIsIDcyMCA4OS4wNCBRIDg2NCA2My43NiwgMTAwOCA2Ny43OCBRIDExNTIgNzEuNzksIDEyOTYgODMuNDYgUSAxNDQwIDk1LjEyLCAxNDQwIDk1LjEyIEwgMTQ0MCAxNjAgWg',
		viewBox: '0 0 1440 160',
	};

	const horizontalEightPointWave: WaveSnapshot = {
		path: 'M 0 160 L 0 99.94 Q 0 99.94, 102.86 109.37 Q 205.71 118.8, 308.57 75.47 Q 411.43 32.15, 514.29 45.74 Q 617.14 59.32, 720 85.57 Q 822.86 111.82, 925.71 118.61 Q 1028.57 125.4, 1131.43 113.03 Q 1234.29 100.66, 1337.15 83.95 Q 1440 67.24, 1440 67.24 L 1440 160 Z',
		seed: 'TSAwIDE2MCBMIDAgOTkuOTQgUSAwIDk5Ljk0LCAxMDIuODYgMTA5LjM3IFEgMjA1LjcxIDExOC44LCAzMDguNTcgNzUuNDcgUSA0MTEuNDMgMzIuMTUsIDUxNC4yOSA0NS43NCBRIDYxNy4xNCA1OS4zMiwgNzIwIDg1LjU3IFEgODIyLjg2IDExMS44MiwgOTI1LjcxIDExOC42MSBRIDEwMjguNTcgMTI1LjQsIDExMzEuNDMgMTEzLjAzIFEgMTIzNC4yOSAxMDAuNjYsIDEzMzcuMTUgODMuOTUgUSAxNDQwIDY3LjI0LCAxNDQwIDY3LjI0IEwgMTQ0MCAxNjAgWg',
		viewBox: '0 0 1440 160',
	};

	const verticalSixPointWave: WaveSnapshot = {
		path: 'M 160 1440 L 99.89 1440 Q 99.89 1440, 103.91 1296 Q 107.92 1152, 88.96 1008 Q 69.99 864, 62.44 720 Q 54.88 576, 43.36 432 Q 31.84 288, 33.76 144 Q 35.67 0, 35.67 0 L 160 0 L 160 1440 Z',
		seed: 'TSAxNjAgMTQ0MCBMIDk5Ljg5IDE0NDAgUSA5OS44OSAxNDQwLCAxMDMuOTEgMTI5NiBRIDEwNy45MiAxMTUyLCA4OC45NiAxMDA4IFEgNjkuOTkgODY0LCA2Mi40NCA3MjAgUSA1NC44OCA1NzYsIDQzLjM2IDQzMiBRIDMxLjg0IDI4OCwgMzMuNzYgMTQ0IFEgMzUuNjcgMCwgMzUuNjcgMCBMIDE2MCAwIEwgMTYwIDE0NDAgWg',
		viewBox: '0 0 160 1440',
	};

	const verticalEightPointWave: WaveSnapshot = {
		path: 'M 160 1440 L 99.84 1440 Q 99.84 1440, 98.44 1337.15 Q 97.03 1234.29, 102.43 1131.43 Q 107.82 1028.57, 79.13 925.71 Q 50.44 822.86, 61.16 720 Q 71.87 617.14, 68.91 514.29 Q 65.95 411.43, 91.58 308.57 Q 117.21 205.71, 102.29 102.86 Q 87.36 0, 87.36 0 L 160 0 L 160 1440 Z',
		seed: 'TSAxNjAgMTQ0MCBMIDk5Ljg0IDE0NDAgUSA5OS44NCAxNDQwLCA5OC40NCAxMzM3LjE1IFEgOTcuMDMgMTIzNC4yOSwgMTAyLjQzIDExMzEuNDMgUSAxMDcuODIgMTAyOC41NywgNzkuMTMgOTI1LjcxIFEgNTAuNDQgODIyLjg2LCA2MS4xNiA3MjAgUSA3MS44NyA2MTcuMTQsIDY4LjkxIDUxNC4yOSBRIDY1Ljk1IDQxMS40MywgOTEuNTggMzA4LjU3IFEgMTE3LjIxIDIwNS43MSwgMTAyLjI5IDEwMi44NiBRIDg3LjM2IDAsIDg3LjM2IDAgTCAxNjAgMCBMIDE2MCAxNDQwIFo',
		viewBox: '0 0 160 1440',
	};

	let {
		element = $bindable(),
		id,
		class: className,
		style,
		face = 'top',
		points = 6,
		speed,
		animate = false,
		observe,
	}: SsrDynamoWaveProps = $props();

	const vertical = $derived(face === 'left' || face === 'right');
	const snapshot = $derived(
		vertical
			? points === 8
				? verticalEightPointWave
				: verticalSixPointWave
			: points === 8
				? horizontalEightPointWave
				: horizontalSixPointWave,
	);
	const transform = $derived(
		face === 'right' ? 'scaleX(-1)' : face === 'bottom' ? 'scaleY(-1)' : undefined,
	);

	onMount(() => {
		let cancelled = false;
		let frameId: number | undefined;

		void customElements.whenDefined('dynamo-wave').then(() => {
			if (cancelled) return;

			// Keep the server snapshot for first paint, then demonstrate that each
			// instance is generative once Svelte and the custom element are ready.
			frameId = requestAnimationFrame(() => {
				if (!cancelled) element?.generateNewWave();
			});
		});

		return () => {
			cancelled = true;
			if (frameId !== undefined) cancelAnimationFrame(frameId);
		};
	});
</script>

<dynamo-wave
	bind:this={element}
	{id}
	class={className}
	{style}
	data-wave-face={face}
	data-wave-points={String(points)}
	data-wave-speed={speed === undefined ? undefined : String(speed)}
	data-wave-animate={animate ? 'true' : undefined}
	data-wave-observe={observe}
	data-wave-seed={snapshot.seed}
>
	<svg
		viewBox={snapshot.viewBox}
		preserveAspectRatio="none"
		style={`width:100%;height:100%;display:block;${transform ? `transform:${transform};` : ''}`}
		aria-hidden="true"
		role="presentation"
		focusable="false"
	>
		<path d={snapshot.path} style="stroke:inherit;fill:inherit"></path>
	</svg>
</dynamo-wave>
