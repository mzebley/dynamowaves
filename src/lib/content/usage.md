<script lang="ts">
	import WaveControlsDemo from '$lib/components/WaveControlsDemo.svelte';
</script>

<span id="usage-header" aria-hidden="true"></span>

<h2 id="usageHeader">Usage</h2>

Add the custom element anywhere a responsive SVG wave belongs:

```html show-preview=on
<dynamo-wave
  style="display:block;height:5rem;fill:rebeccapurple"
></dynamo-wave>
```

Without configuration, the wave faces `top`, uses six points and variance `3`, and renders one static shape. Add `data-wave-animate="true"` for continuous motion or call the public methods when motion should respond to an interaction.

<h3 id="shape-and-direction">Shape and direction</h3>

Use `data-wave-face` to choose the edge the filled portion occupies, `data-wave-points` to change the number of anchors, and `data-wave-variance` to control their deviation. `data-start-end-zero` is useful when the wave must join a straight edge cleanly.

```html show-preview=on
<dynamo-wave
  data-wave-face="bottom"
  data-wave-points="8"
  data-wave-variance="2.5"
  data-start-end-zero
  style="display:block;height:5rem;fill:slateblue"
></dynamo-wave>
```

The complete accepted values, defaults, and live-update behavior are in the <zbk-link href="#attributes">attribute reference</zbk-link>.

<h3 id="basic-styling">Basic styling</h3>

The `<dynamo-wave>` host remains in the document, so its `class`, `id`, and `style` stay available for layout and styling. Set a height on the host and use `fill` to color the generated path.

```html show-preview=on
<!-- Example 1 -->
<dynamo-wave style="fill:slateblue"></dynamo-wave>

<!-- Example 2 -->
<style>
  .fill-theme {
    fill: var(--zbk-brand-canvas);
  }
</style>
<dynamo-wave class="fill-theme"></dynamo-wave>

<!-- Example 3 -->
<style>
  #special_wave {
    height: 3rem;
    width: 80%;
    transform: translateX(10%);
  }
</style>
<dynamo-wave id="special_wave" class="fill-theme fill-light"></dynamo-wave>
```

The SVG stretches to the host with `preserveAspectRatio="none"`. That makes the wave responsive, but it also means the host's dimensions are the layout contract. Style the host rather than the generated `svg` or `path` children.

<h3 id="updating-attributes">Updating a connected wave</h3>

All nine public attributes are observed. Changing one after upgrade updates the element without replacing it:

```javascript
await customElements.whenDefined('dynamo-wave');

const wave = document.querySelector('dynamo-wave');
wave.dataset.wavePoints = '10';
wave.dataset.waveFace = 'left';
wave.dataset.waveAnimate = 'true';
```

Geometry changes rebuild the wave. Speed, automatic animation, and viewport observation are reconfigured in place; an active loop resumes when a geometry rebuild finishes.

<h3 id="playing-with-motion">Playing with motion</h3>

Use `generateNewWave()` for a one-off morph, or `play()` and `pause()` for a continuous loop. The interactive examples below use the same public methods described in the <zbk-link href="#javascript-api">JavaScript API reference</zbk-link>.

<WaveControlsDemo />
