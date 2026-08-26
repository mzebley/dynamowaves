<script lang="ts">
	import SsrDynamoWave from '$lib/components/SsrDynamoWave.svelte';
	import TransitionDemo from '$lib/components/TransitionDemo.svelte';
</script>

<span id="examples" aria-hidden="true"></span>

<h2 id="practicalApplicationHeader">Practical examples</h2>

Dynamowaves supplies geometry and motion while your layout supplies the size, color, and placement. These recipes use only the public host attributes, methods, and completion event.

<h3 id="sticky-header-divider">Sticky header divider</h3>

Keep a labeled header pinned inside a scrolling panel and let a bottom-facing wave soften its edge:

```html
<div class="scrolling-panel">
  <div class="panel-header">
    <h2>Wave settings</h2>
    <dynamo-wave
      data-wave-face="bottom"
      style="display:block;height:3rem;fill:var(--header-background)"
    ></dynamo-wave>
  </div>
  <div class="panel-content">...</div>
</div>

<style>
  .scrolling-panel {
    --header-background: #dbeafe;
    max-height: 24rem;
    overflow: auto;
  }

  .panel-header {
    position: sticky;
    top: 0;
    background: var(--header-background);
  }
</style>
```

<div class="widget" id="widget_example_1">
  <div class="header">
    <h4 id="im-the-heading">I'm the heading!</h4>
    <SsrDynamoWave class="fill-brand-canvas-emphasis" face="bottom" />
  </div>
  <div class="content">
    A top or bottom wave uses horizontal geometry. Use <code>data-wave-face="bottom"</code> when the filled portion should remain attached to the header above it.
    <br /><br />
    The wave stretches to its host. Set that host's height deliberately rather than selecting the generated SVG.
    <br /><br />
    Fill inherits from the custom element, so the same surface token can color both the header and its divider.
    <br /><br />
    Add <code>data-start-end-zero</code> when the wave must meet a straight adjoining edge at both ends.
    <br /><br />
    The content keeps scrolling while the header and its generated divider stay pinned.
  </div>
</div>

<h3 id="event-driven-transition">Event-driven transition</h3>

Pair `generateNewWave()` with the completion event when interface state should settle after a morph. Listen on the wave itself because the event does not bubble.

```html
<dynamo-wave
  id="transition-wave"
  style="display:block;height:4rem;fill:rebeccapurple"
></dynamo-wave>
<button id="next" type="button">Next</button>
```

```javascript
const wave = document.querySelector('#transition-wave');
const nextButton = document.querySelector('#next');

nextButton.addEventListener('click', () => {
  nextButton.disabled = true;

  wave.addEventListener('dynamo-wave-complete', () => {
    nextButton.disabled = false;
    nextButton.focus();
  }, { once: true });

  wave.generateNewWave(500);
});
```

<TransitionDemo />

<h3 id="image-edge-divider">Responsive image-edge divider</h3>

Place a vertical wave over the edge of an image or visual panel. A small negative overlap prevents a one-pixel seam while the layout resizes.

```html
<div class="feature-card">
  <div class="feature-image">
    <img src="/path/to/image.jpeg" alt="A school of fish" />
    <dynamo-wave
      data-wave-face="left"
      style="fill:var(--card-background)"
    ></dynamo-wave>
  </div>
  <div class="content">...</div>
</div>

<style>
  .feature-card {
    --card-background: white;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(12rem, 1fr);
    background: var(--card-background);
  }

  .feature-image {
    position: relative;
    min-height: 16rem;
  }

  .feature-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .feature-image dynamo-wave {
    position: absolute;
    inset: -1px -1px -1px auto;
    width: 3rem;
  }
</style>
```

<div class="widget horizontal" id="widget_example_3" style="min-height:max-content">
  <div class="image-wrapper">
  <img src="/example-image.jpg" alt="A school of orange fish swimming through blue water" />
	<SsrDynamoWave
  id="example-widget-wave_desktop"
	  face="left"
	  style="position:absolute;right:-2px;top:-2px;bottom:-2px;width:var(--zbk-spacing-205);fill:var(--zbk-app-canvas-subtle)"
	/>
	<SsrDynamoWave
  id="example-widget-wave_mobile"
	  face="top"
	  style="position:absolute;right:-2px;left:-2px;bottom:-2px;height:var(--zbk-spacing-205);fill:var(--zbk-app-canvas-subtle);min-width: calc(100% + 4px);"
	/>
  </div>
  <div class="content padding-105" style="align-self: center;">
    <h4 id="eye-catching-headline" class="margin-0 font-alt ink-brand">Eye-catching headline.</h4>
    <p>Further information to draw interest.</p>
    <zbk-link href="#installationHeader">Explore Dynamowaves <span slot="icon" data-position="end" aria-hidden="true">&rarr;</span></zbk-link>
  </div>
</div>
