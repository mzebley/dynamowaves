<script lang="ts">
	import { onMount } from 'svelte';
	import SsrDynamoWave from './SsrDynamoWave.svelte';

	type WaveElement = HTMLElement & {
		generateNewWave(duration?: number): void;
		play(duration?: number): void;
		pause(): void;
	};

	let { compact = false }: { compact?: boolean } = $props();
	let headerWave = $state<WaveElement>();
	let regenWave = $state<WaveElement>();
	let playbackWave = $state<WaveElement>();
	let playing = $state(false);
	let reducedMotion = $state(false);
	let regenerating = $state(false);
	let updateCount = $state(0);
	let status = $state('Wave controls ready.');

	async function regenerate() {
		const wave = compact ? headerWave : regenWave;
		if (!wave || regenerating) return;

		regenerating = true;
		status = 'Generating a new wave.';
		const duration = reducedMotion ? 1 : compact ? 800 : 500;

		await new Promise<void>((resolve) => {
			const fallback = window.setTimeout(resolve, duration + 150);
			wave.addEventListener(
				'dynamo-wave-complete',
				() => {
					window.clearTimeout(fallback);
					resolve();
				},
				{ once: true },
			);
			wave.generateNewWave(duration);
		});

		updateCount += 1;
		status = `Wave ${updateCount} generated.`;
		regenerating = false;
	}

	function play() {
		if (!playbackWave) return;
		if (reducedMotion) {
			playbackWave.generateNewWave(1);
			status = 'Reduced motion is enabled, so the wave changed without continuous animation.';
			return;
		}

		playbackWave.play(5000);
		playing = true;
		status = 'Wave animation playing.';
	}

	function pause() {
		playbackWave?.pause();
		playing = false;
		status = 'Wave animation paused.';
	}

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = mediaQuery.matches;

		const handleMotionPreference = (event: MediaQueryListEvent) => {
			reducedMotion = event.matches;
			if (reducedMotion && playing) {
				playbackWave?.pause();
				playing = false;
				status = 'Wave animation paused because reduced motion was enabled.';
			}
		};

		mediaQuery.addEventListener('change', handleMotionPreference);
		return () => {
			mediaQuery.removeEventListener('change', handleMotionPreference);
			playbackWave?.pause();
		};
	});
</script>

<div class:compact class="wave-controls-demo">
	{#if compact}
		<div class="wave-surface" id="header_wave_wrapper">
			<SsrDynamoWave
				bind:element={headerWave}
				class="demo-wave"
				id="header_wave"
				face="bottom"
				points={8}
				speed={5000}
			/>
		</div>
		<div class="wave-actions" role="group" aria-label="Header wave controls">
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<zbk-button
				data-header-regenerate
				variant="wave-action wave-pop lg"
				loading={regenerating ? true : undefined}
				onclick={regenerate}
			>
				<span slot="icon" data-position="start" aria-hidden="true">
					<svg aria-hidden="true" viewBox="0 0 24 24">
						<path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
					</svg>
				</span>
				Regen Header
			</zbk-button>
		</div>
	{:else}
		<div class="control-example">
			<div class="wave-surface">
				<SsrDynamoWave bind:element={regenWave} class="demo-wave" id="regen-example-wave" />
			</div>
			<div class="wave-actions" role="group" aria-label="New wave example controls">
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<zbk-button
					data-wave-regenerate
					variant="wave-action wave-pop lg"
					loading={regenerating ? true : undefined}
					onclick={regenerate}
				>
					<span slot="icon" data-position="start" aria-hidden="true">
						<svg aria-hidden="true" viewBox="0 0 24 24">
							<path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
						</svg>
					</span>
					New Wave
				</zbk-button>
			</div>
		</div>

		<div class="control-example">
			<div class="wave-surface">
				<SsrDynamoWave
					bind:element={playbackWave}
					class="demo-wave"
					id="play-example-wave"
					speed={5000}
				/>
			</div>
			<div class="wave-actions" role="group" aria-label="Wave animation example controls">
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<zbk-button data-wave-play variant="wave-action wave-pop lg" onclick={play}>
					<span slot="icon" data-position="start" aria-hidden="true">
						<svg aria-hidden="true" viewBox="0 0 24 24">
							<path d="m8 5 11 7-11 7V5Z" />
						</svg>
					</span>
					Play Wave
				</zbk-button>
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<zbk-button data-wave-pause variant="wave-action wave-pop lg" onclick={pause}>
					<span slot="icon" data-position="start" aria-hidden="true">
						<svg aria-hidden="true" viewBox="0 0 24 24">
							<path d="M8 5v14M16 5v14" />
						</svg>
					</span>
					Pause Wave
				</zbk-button>
			</div>
		</div>
	{/if}
	<p class="visually-hidden" role="status" aria-live="polite">{status}</p>
</div>

<style>
	.wave-controls-demo {
		inline-size: 100%;
		margin-block: var(--zbk-spacing-105, 1.5rem) var(--zbk-spacing-2, 2rem);
	}

	.wave-surface {
		min-block-size: var(--zbk-spacing-4, 4rem);
		color: var(--zbk-brand-canvas-inverse-emphasis, #6a9a99);
	}

	.control-example + .control-example {
		margin-block-start: var(--zbk-spacing-2, 2rem);
	}

	:global(dynamo-wave.demo-wave) {
		display: block;
		inline-size: 100%;
		block-size: var(--zbk-spacing-4, 4rem);
		fill: currentColor;
	}

	.wave-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: var(--zbk-spacing-105, 0.5rem);
		padding-block-start: var(--zbk-spacing-1, 1rem);
	}

	svg {
		inline-size: 1em;
		block-size: 1em;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-width: 2;
	}

	.compact {
		margin: 0;
	}

	.compact .wave-surface,
	.compact :global(dynamo-wave.demo-wave) {
		block-size: clamp(3rem, 8vw, 5.5rem);
	}

	.compact .wave-actions {
		background: var(--zbk-app-canvas, #fff);
		padding-block: var(--zbk-spacing-2, 2rem);
	}
</style>
