<script lang="ts">
	import { onMount } from 'svelte';
	import {
		TEXT_SIZE_LABELS,
		TEXT_SIZE_LEVELS,
		TEXT_SIZE_SCALE,
		applyTextSize,
		isTextSize,
		type TextSize,
	} from '$lib/fontScaling';

	const storageKey = 'dynamowaves-text-size';
	let textSize = $state<TextSize>('md');
	let currentIndex = $derived(TEXT_SIZE_LEVELS.indexOf(textSize));
	let canDecrease = $derived(currentIndex > 0);
	let canIncrease = $derived(currentIndex < TEXT_SIZE_LEVELS.length - 1);
	let currentLabel = $derived(TEXT_SIZE_LABELS[textSize]);
	let currentPercent = $derived(Math.round(TEXT_SIZE_SCALE[textSize] * 100));

	function storeTextSize(value: TextSize) {
		try {
			window.localStorage.setItem(storageKey, value);
		} catch (error) {
			// The selected size still applies for this page when storage is unavailable.
		}
	}

	function setTextSize(value: TextSize) {
		textSize = value;
		applyTextSize(document.documentElement, value, window.innerWidth);
		storeTextSize(value);
	}

	function stepTextSize(direction: -1 | 1) {
		const next = TEXT_SIZE_LEVELS[currentIndex + direction];
		if (next) setTextSize(next);
	}

	onMount(() => {
		const root = document.documentElement;
		if (isTextSize(root.dataset.a11yTextSize)) textSize = root.dataset.a11yTextSize;
		applyTextSize(root, textSize, window.innerWidth);

		const handleResize = () => applyTextSize(root, textSize, window.innerWidth);
		window.addEventListener('resize', handleResize, { passive: true });
		return () => window.removeEventListener('resize', handleResize);
	});
</script>

<div class="display-flex align-items-center wrapper" role="group" aria-label="Font size">
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<zbk-button
		variant="ghost sm"
		aria-label="Decrease font size"
		aria-describedby="font-size-value"
		disabled={!canDecrease ? true : undefined}
		onclick={() => stepTextSize(-1)}
	>
		<span slot="icon" aria-hidden="true">
			<svg
				aria-hidden="true"
				focusable="false"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				class="width-1"
			>
				<path d="M5 12h14" />
			</svg>
		</span>
	</zbk-button>

	<output id="font-size-value" class="ink-brand-emphasis display-flex justify-content-center flex-shrink-0 width-2" aria-live="polite">
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" class="width-105"><path d="M10 6V21H8V6H2V4H16V6H10ZM18 14V21H16V14H13V12H21V14H18Z"></path></svg>
		<span class="visually-hidden">Font size: {currentLabel}, {currentPercent}%</span>
	</output>

	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<zbk-button
		variant="ghost sm"
		aria-label="Increase font size"
		aria-describedby="font-size-value"
		disabled={!canIncrease ? true : undefined}
		onclick={() => stepTextSize(1)}
	>
		<span slot="icon" aria-hidden="true">
			<svg
				aria-hidden="true"
				focusable="false"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				class="width-1"
			>
				<path d="M12 5v14" />
				<path d="M5 12h14" />
			</svg>
		</span>
	</zbk-button>
</div>
