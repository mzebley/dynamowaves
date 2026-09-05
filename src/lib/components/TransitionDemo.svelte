<script lang="ts">
  import { onMount } from "svelte";
  import { waitForWave } from "$lib/waitForWave";
  import SsrDynamoWave from "./SsrDynamoWave.svelte";

  type WaveElement = HTMLElement & {
    generateNewWave(duration?: number): void;
  };

  const lifecycle = new AbortController();
  const slides = ["Content 1", "Content 2", "Content 3", "Content 4"];
  let wave = $state<WaveElement>();
  let activeIndex = $state(0);
  let busy = $state(false);
  let reducedMotion = $state(false);
  let button = $state<HTMLElement & { focus(): void }>();
  let status = $derived(
    activeIndex === slides.length - 1
      ? "Transition complete. Content 4 of 4 is visible; restart is available."
      : `Content ${activeIndex + 1} of ${slides.length} is visible.`,
  );

  async function next() {
    if (busy || lifecycle.signal.aborted) return;

    busy = true;
    activeIndex = activeIndex >= slides.length - 1 ? 0 : activeIndex + 1;
    const duration = reducedMotion ? 1 : 500;

    if (wave) {
      await waitForWave(wave, () => wave?.generateNewWave(duration), duration + 150, lifecycle.signal);
    }
    if (lifecycle.signal.aborted) return;

    busy = false;
    button?.focus();
  }

  onMount(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion = mediaQuery.matches;

    const handleMotionPreference = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
    };

    mediaQuery.addEventListener("change", handleMotionPreference);
    return () => {
      lifecycle.abort();
      mediaQuery.removeEventListener("change", handleMotionPreference);
    };
  });
</script>

<div class="transition-demo widget" id="widget_example_2">
  <div
    class="transition-track"
    style={`--active-slide: ${activeIndex}`}
    aria-live="off"
  >
    {#each slides as slide, index}
      <div
        class="transition-slide"
        inert={index !== activeIndex}
        aria-hidden={index !== activeIndex}
      >
        <strong>{slide}</strong>
      </div>
    {/each}
  </div>
  <div class="transition-footer">
    <SsrDynamoWave
      bind:element={wave}
      class="transition-wave"
      id="transition-wave-example"
    />
    <div class="transition-action">
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <zbk-button
        bind:this={button}
        data-transition-next
        variant="wave-action-strong lg"
        loading={busy ? true : undefined}
        onclick={next}
      >
        <span id="transition-wave-label"
          >{activeIndex === slides.length - 1 ? "Restart" : "Next"}</span
        >
        <span slot="icon" data-position="end" aria-hidden="true">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            {#if activeIndex === slides.length - 1}
              <path
                d="M22 12C22 17.5228 17.5229 22 12 22C6.4772 22 2 17.5228 2 12C2 6.47715 6.4772 2 12 2V4C7.5817 4 4 7.58172 4 12C4 16.4183 7.5817 20 12 20C16.4183 20 20 16.4183 20 12C20 9.25022 18.6127 6.82447 16.4998 5.38451L16.5 8H14.5V2L20.5 2V4L18.0008 3.99989C20.4293 5.82434 22 8.72873 22 12Z"
              ></path>
            {:else}
              <path d="M19.1642 12L12.9571 5.79291L11.5429 7.20712L16.3358 12L11.5429 16.7929L12.9571 18.2071L19.1642 12ZM13.5143 12L7.30722 5.79291L5.89301 7.20712L10.6859 12L5.89301 16.7929L7.30722 18.2071L13.5143 12Z"></path>
            {/if}
          </svg>
        </span>
      </zbk-button>
    </div>
  </div>
  <p class="visually-hidden" role="status" aria-live="polite">{status}</p>
</div>

<style>
  .transition-demo {
    block-size: var(--zbk-spacing-15);
    margin: var(--zbk-spacing-3) auto;
    overflow: hidden;
  }

  .transition-track {
    display: flex;
    flex: 1;
    inline-size: 400%;
    transform: translateX(calc(var(--active-slide) * -25%));
    transition: transform var(--zbk-transition-duration-slow, 500ms)
      var(--zbk-transition-playful-motion-function-default, ease);
  }

  .transition-slide {
    display: grid;
    place-items: center;
    inline-size: 25%;
    padding: var(--zbk-spacing-1, 1rem);
    color: var(--zbk-accent-primary-ink, currentColor);
    font-family: var(--zbk-font-family-alt, sans-serif);
    font-size: var(--zbk-font-size-lg, 1.25rem);
  }

  .transition-footer {
    position: sticky;
    inset-block-end: 0;
  }

  :global(dynamo-wave.transition-wave) {
    display: block;
    inline-size: 100%;
    block-size: var(--zbk-spacing-3, 3rem);
    margin-block-end: -2px;
    fill: var(--zbk-brand-canvas-emphasis, #c5d8d7);
  }

  .transition-action {
    display: flex;
    justify-content: center;
    padding: var(--zbk-spacing-025, 0.25rem) var(--zbk-spacing-1, 1rem)
      var(--zbk-spacing-1, 1rem);
    background: var(--zbk-brand-canvas-emphasis, #c5d8d7);
  }

  svg {
    inline-size: var(--zbk-spacing-105);
    block-size: var(--zbk-spacing-105);
    fill: currentColor;
  }

  @media (prefers-reduced-motion: reduce) {
    .transition-track {
      transition-duration: 0.01ms;
    }
  }
</style>
