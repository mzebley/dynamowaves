<script lang="ts">
  import ThemeToggle from "./ThemeToggle.svelte";
  import FontSizeStepper from "./FontSizeStepper.svelte";
  import MarkSignature from "./MarkSignature.svelte";
  import WaveControlsDemo from "./WaveControlsDemo.svelte";
  import WaveWordmark from "./WaveWordmark.svelte";
</script>

<header
  class="width-full display-flex canvas-brand-emphasis-inverse padding-inline-105 tablet:padding-inline-4 padding-block-105"
>
  <div
    class="display-flex width-full align-items-center gap-1 flex-direction-column"
  >
    <div
      class="header-actions display-flex width-full gap-1 max-width-widescreen"
    >
      <span class="display-flex width-full"
        ><MarkSignature class="width-2 height-2" /></span
      >
      <FontSizeStepper />
      <span class="display-flex width-full justify-content-end">
        <ThemeToggle />
      </span>
    </div>
    <div class="brand-lockup width-full padding-block-start-105 max-width-30">
      <h1 id="heading" class="visually-hidden">Dynamowaves</h1>
      <WaveWordmark
        waveColor="var(--zbk-accent-primary-ink)"
        baseColor="var(--zbk-accent-primary-ink-muted)"
      />
      <p class="prose font-lg text-center ink-brand margin-block-start-1">
        A dependency-free <strong class="ink-accent-primary-emphasis">HTML custom element</strong>
        for <strong class="ink-accent-primary-emphasis">responsive SVG waves</strong>
        that generate and morph on demand.
      </p>
      <p class="prose font-md text-center ink-brand margin-block-1">
        <em>Version 2.2.0 · 12.0 KB minified · 3.6 KB gzip.</em>
      </p>
    </div>
  </div>
</header>

<WaveControlsDemo compact />

<style>
  .header-actions {
    align-items: center;
  }

  .signature-mark {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* The header keeps its light brand canvas in both app themes. Keep the
     signature and the link's generated new-tab affordance on the matching
     fixed-light ink ramp instead of inheriting dark-surface semantic inks. */
  :global(html[data-zbk-theme="dark"] .signature-link) {
    --zbk-link-ink: var(--zbk-color-deepcurrent-500);
    --zbk-link-ink-hover: var(--zbk-color-blue-800);
    --zbk-link-ink-active: var(--zbk-color-blue-800);
    --zbk-link-ink-focus: var(--zbk-color-deepcurrent-500);
    --zbk-link-focus-color: var(--zbk-color-blue-800);
    --zbk-focus-color: var(--zbk-color-blue-800);
  }

  :global(html[data-zbk-theme="dark"]) .signature-mark {
    --sig-ink: var(--zbk-brand-700);
    --sig-ink-action: var(--zbk-color-deepcurrent-500);
    --sig-ink-action-active: var(--zbk-color-blue-800);
  }

  .signature-mark :global(svg) {
    inline-size: var(--zbk-spacing-2);
    block-size: var(--zbk-spacing-2);
    transition: transform var(--zbk-transition-playful-motion-duration-fast)
      var(--zbk-transition-playful-motion-function-fast);
  }

  :global(a:hover) .signature-mark :global(svg),
  :global(a:focus-visible) .signature-mark :global(svg) {
    transform: scale(1.08);
  }

  :global(a:active) .signature-mark :global(svg) {
    transform: scale(1);
  }

  @media (prefers-reduced-motion: reduce) {
    .signature-mark :global(svg) {
      transition: none;
    }
  }
</style>
