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
        <em>Version 2.2.1 · 12.0 KB minified · 3.6 KB gzip.</em>
      </p>
    </div>
  </div>
</header>

<WaveControlsDemo compact />

<style>
  .header-actions {
    align-items: center;
  }
</style>
