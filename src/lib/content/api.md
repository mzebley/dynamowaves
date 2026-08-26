<span id="data-attributes" aria-hidden="true"></span>

<h2 id="api-reference">API reference</h2>

Version 2.2.0 exposes nine observed attributes, three instance methods, one completion event, and six runtime module exports. Attribute changes take effect after the element is connected: geometry changes rebuild the wave, while speed, animation, and observation changes update their active behavior.

<h3 id="attributes">Attributes</h3>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (Scrollable reference table must remain keyboard reachable.) -->
<div class="table-container" tabindex="0">
  <table aria-label="Dynamowaves attribute reference">
    <thead>
      <tr>
        <th scope="col">Attribute</th>
        <th scope="col">Default</th>
        <th scope="col">Accepted values</th>
        <th scope="col">Runtime behavior</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>data-wave-face</code></td>
        <td><code>top</code></td>
        <td><code>top</code>, <code>bottom</code>, <code>left</code>, or <code>right</code>. Any other value behaves like <code>top</code>.</td>
        <td>Rebuilds the SVG with horizontal or vertical geometry and the requested orientation.</td>
      </tr>
      <tr>
        <td><code>data-wave-points</code></td>
        <td><code>6</code></td>
        <td>A numeric string. It is parsed as an integer and clamped to a minimum of <code>2</code>; invalid values use the default.</td>
        <td>Regenerates the current and target paths with the new point count.</td>
      </tr>
      <tr>
        <td><code>data-wave-variance</code></td>
        <td><code>3</code></td>
        <td>Any finite number, including decimals. Positive values are the useful range for ordinary wave depth.</td>
        <td>Regenerates the wave with the new amount of anchor deviation.</td>
      </tr>
      <tr>
        <td><code>data-variance</code></td>
        <td>Unset</td>
        <td>Legacy alias for <code>data-wave-variance</code>. The preferred attribute wins when both are present.</td>
        <td>Regenerates the wave. Retained for existing markup.</td>
      </tr>
      <tr>
        <td><code>data-wave-speed</code></td>
        <td><code>7500</code></td>
        <td>A finite number greater than zero, in milliseconds. Invalid values use the default.</td>
        <td>Updates a stopped wave immediately. A running loop restarts from the displayed shape at the new speed.</td>
      </tr>
      <tr>
        <td><code>data-wave-animate</code></td>
        <td><code>false</code></td>
        <td>The exact string <code>true</code> starts the loop; any other value stops it.</td>
        <td>Starts or pauses continuous morphing, subject to the viewer's reduced-motion preference.</td>
      </tr>
      <tr>
        <td><code>data-wave-observe</code></td>
        <td>Unset</td>
        <td><code>once</code> or <code>repeat</code>, optionally followed by an IntersectionObserver root margin such as <code>repeat:100px</code>.</td>
        <td>Replaces the active observer. Regeneration occurs when the wave is outside the adjusted viewport.</td>
      </tr>
      <tr>
        <td><code>data-wave-seed</code></td>
        <td>Generated</td>
        <td>An encoded path snapshot produced by Dynamowaves, or any nonempty string for deterministic generation.</td>
        <td>Rebuilds the wave from the supplied seed. Every render reflects its resulting path back to this attribute.</td>
      </tr>
      <tr>
        <td><code>data-start-end-zero</code></td>
        <td>False</td>
        <td>An empty value, <code>true</code>, <code>1</code>, <code>yes</code>, or <code>on</code> enables it. Any other value disables it.</td>
        <td>Regenerates the wave with both visible endpoints anchored to the base edge.</td>
      </tr>
    </tbody>
  </table>
</div>

Geometry changes discard an existing encoded path snapshot because it no longer describes the requested shape. If the wave was looping, it resumes after rebuilding.

```html
<dynamo-wave
  data-wave-face="bottom"
  data-wave-points="8"
  data-wave-variance="2.5"
  data-start-end-zero
></dynamo-wave>
```

<h3 id="seed-modes">Recorded and deterministic seeds</h3>

Dynamowaves supports two seed forms:

- **Recorded path:** after every render, the element writes an unpadded Base64 representation of its current SVG path to `data-wave-seed`. Copy that value when another wave must use the exact same shape. This is ordinary Base64, not a URL-safe encoding.
- **Deterministic string:** a nonempty value that is not an encoded Dynamowaves path seeds the internal random-number generator. After rendering, the string is replaced by the recorded path it produced.

<zbk-code-block label="HTML" show-preview="on" split-control="off">

```html bare
<dynamo-wave id="hero-wave" data-wave-seed="homepage-hero-v1"></dynamo-wave>

<script>
  const hero = document.getElementById('hero-wave');
  const footer = document.createElement('dynamo-wave');

  // Read after the hero has connected so this is its recorded path.
  footer.dataset.waveSeed = hero.dataset.waveSeed;
  document.body.appendChild(footer);
</script>
```

<div
  slot="preview"
  id="seed-match-preview"
  aria-label="Two waves rendered from the same recorded path"
  style="display:grid;gap:var(--zbk-spacing-1);width:100%;padding:var(--zbk-spacing-1)"
>
  <div>
    <strong>Original deterministic seed</strong>
    <dynamo-wave
      data-wave-seed="homepage-hero-v1"
      style="display:block;width:100%;height:4rem;fill:var(--zbk-brand-canvas)"
    ></dynamo-wave>
  </div>
  <div>
    <strong>Copied recorded path</strong>
    <dynamo-wave
      data-wave-seed="TSAwIDE2MCBMIDAgNzguNTcgUSAwIDc4LjU3LCAxNDQgNjMuNzcgUSAyODggNDguOTcsIDQzMiA0NS44MSBRIDU3NiA0Mi42NCwgNzIwIDU3LjIyIFEgODY0IDcxLjc5LCAxMDA4IDUwLjI0IFEgMTE1MiAyOC42OSwgMTI5NiAzOS4zNyBRIDE0NDAgNTAuMDQsIDE0NDAgNTAuMDQgTCAxNDQwIDE2MCBa"
      style="display:block;width:100%;height:4rem;fill:var(--zbk-brand-canvas)"
    ></dynamo-wave>
  </div>
</div>

</zbk-code-block>

If you later change a geometry attribute, reapply the original deterministic string if you want that new geometry to remain tied to the same human-readable seed.

<h3 id="observation">Viewport observation</h3>

`data-wave-observe="once"` regenerates on the first non-intersecting observation and then disconnects. `repeat` stays connected and regenerates whenever the observer reports the element outside its root.

```html
<!-- Regenerate once when outside the viewport. -->
<dynamo-wave data-wave-observe="once"></dynamo-wave>

<!-- The positive margin expands the observed viewport, so the wave must move
     farther away before it becomes non-intersecting. -->
<dynamo-wave data-wave-observe="repeat:100px"></dynamo-wave>

<!-- A negative margin contracts it, so non-intersection happens sooner. -->
<dynamo-wave data-wave-observe="once:-50px"></dynamo-wave>
```

The margin uses the same syntax as `IntersectionObserver.rootMargin`, including multi-value forms such as `100px 0px`. If `IntersectionObserver` is unavailable, Dynamowaves warns once for that setup and leaves viewport regeneration disabled; the wave itself still renders.

<span id="usage-functions" aria-hidden="true"></span>

<h3 id="javascript-api">JavaScript API</h3>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (Scrollable reference table must remain keyboard reachable.) -->
<div class="table-container" tabindex="0">
  <table aria-label="Dynamowaves instance method reference">
    <thead>
      <tr>
        <th scope="col">Method</th>
        <th scope="col">Behavior</th>
        <th scope="col">While another animation is active</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>generateNewWave(duration = 800)</code></td>
        <td>Morphs once from the displayed path to a new path. Durations below one millisecond, and reduced motion, resolve in one millisecond.</td>
        <td>Ignored while another morph or animation frame is active.</td>
      </tr>
      <tr>
        <td><code>play(duration?)</code></td>
        <td>Starts continuous morphing. A finite positive duration overrides <code>data-wave-speed</code> for that loop.</td>
        <td>Ignored while already playing, while a one-off morph is active, or while reduced motion is enabled.</td>
      </tr>
      <tr>
        <td><code>pause()</code></td>
        <td>Stops a loop and preserves its current tween position for a later <code>play()</code>.</td>
        <td>Cancels an active one-off morph and clears that morph's timeline.</td>
      </tr>
    </tbody>
  </table>
</div>

All three methods return `void`. Use the completion event rather than internal state such as `isAnimating` when sequencing work.

```javascript
const wave = document.querySelector('dynamo-wave');

wave.addEventListener('dynamo-wave-complete', () => {
  console.log('The requested morph finished.');
}, { once: true });

wave.generateNewWave(500);
```

<h4 id="completion-event">dynamo-wave-complete</h4>

The element dispatches `dynamo-wave-complete` after a one-off morph and after every completed cycle of `play()`. It is a non-bubbling, non-composed `CustomEvent`.

```typescript
wave.addEventListener('dynamo-wave-complete', (event) => {
  event.detail.duration;  // number, milliseconds
  event.detail.direction; // 'horizontal' | 'vertical'
});
```

The event reports orientation rather than the authored face: `top` and `bottom` are horizontal; `left` and `right` are vertical.

<h3 id="module-exports">Module and helper exports</h3>

Importing the package registers `<dynamo-wave>` when a custom-element registry is available. The same entry point also exposes the component class and its lower-level path helpers.

```javascript
import {
  DynamoWave,
  generateWave,
  parsePath,
  interpolateWave,
  encodeWaveSeed,
  decodeWaveSeed,
} from 'dynamowaves';
```

<!-- svelte-ignore a11y_no_noninteractive_tabindex (Scrollable reference table must remain keyboard reachable.) -->
<div class="table-container" tabindex="0">
  <table aria-label="Dynamowaves module export reference">
    <thead>
      <tr>
        <th scope="col">Export</th>
        <th scope="col">Purpose</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><code>DynamoWave</code></td><td>The custom-element class registered as <code>dynamo-wave</code> in browser environments.</td></tr>
      <tr><td><code>generateWave(options)</code></td><td>Creates a complete SVG path string from width, height, point, variance, orientation, random-source, and endpoint options.</td></tr>
      <tr><td><code>parsePath(path)</code></td><td>Extracts the quadratic control points and endpoints used by the interpolator.</td></tr>
      <tr><td><code>interpolateWave(current, target, progress, vertical, height, width)</code></td><td>Builds the path for one interpolation progress value between compatible point arrays. Orientation and dimensions are required so the returned path closes against the correct base edge.</td></tr>
      <tr><td><code>encodeWaveSeed(path)</code></td><td>Normalizes a path and returns its unpadded Base64 snapshot, or an empty string when it cannot encode.</td></tr>
      <tr><td><code>decodeWaveSeed(seed)</code></td><td>Returns a validated Dynamowaves path or <code>null</code>. Plain deterministic seed strings intentionally return <code>null</code>.</td></tr>
    </tbody>
  </table>
</div>

These helpers are available from both ESM and CommonJS. A direct browser script exposes the same names on `globalThis.Dynamowaves`.

<h4 id="generate-wave-options">generateWave options</h4>

`generateWave()` is the low-level geometry API. It does not create or modify DOM; it returns a closed SVG path string.

<!-- svelte-ignore a11y_no_noninteractive_tabindex (Scrollable reference table must remain keyboard reachable.) -->
<div class="table-container" tabindex="0">
  <table aria-label="generateWave option reference">
    <thead>
      <tr>
        <th scope="col">Option</th>
        <th scope="col">Required</th>
        <th scope="col">Purpose</th>
      </tr>
    </thead>
    <tbody>
      <tr><td><code>width</code></td><td>Yes</td><td>Numeric width used by the generated coordinate system.</td></tr>
      <tr><td><code>height</code></td><td>Yes</td><td>Numeric height used by the generated coordinate system.</td></tr>
      <tr><td><code>points</code></td><td>Yes</td><td>Anchor count. Finite values are floored and clamped to at least <code>2</code>.</td></tr>
      <tr><td><code>variance</code></td><td>Yes</td><td>Multiplier controlling how far randomized anchors can deviate across the wave depth.</td></tr>
      <tr><td><code>vertical</code></td><td>No</td><td><code>false</code> for top/bottom geometry; <code>true</code> for left/right geometry.</td></tr>
      <tr><td><code>random</code></td><td>No</td><td>A function returning a number. Defaults to <code>Math.random</code>; inject a seeded or fixed source for repeatable output.</td></tr>
      <tr><td><code>startEndZero</code></td><td>No</td><td>Anchors both visible endpoints to the base edge when <code>true</code>.</td></tr>
    </tbody>
  </table>
</div>

<zbk-code-block label="JavaScript" show-preview="on" split-control="off">

```javascript bare
import { generateWave } from 'dynamowaves';

// A fixed sequence keeps the example repeatable without flattening the wave.
const samples = [0.25, 0.85, 0.15, 0.7, 0.35, 0.9, 0.2, 0.6];
let sample = 0;

const path = generateWave({
  width: 1440,
  height: 160,
  points: 8,
  variance: 2.5,
  random: () => samples[sample++ % samples.length],
  startEndZero: true,
});

document.querySelector('#generated-wave path').setAttribute('d', path);
```

<svg
  slot="preview"
  id="generated-wave"
  viewBox="0 0 1440 160"
  preserveAspectRatio="none"
  role="img"
  aria-labelledby="generated-wave-title"
  style="display:block;width:100%;height:10rem;fill:var(--zbk-brand-canvas)"
>
  <title id="generated-wave-title">Wave generated from eight varied points with anchored endpoints</title>
  <path d="M 0 160 L 0 160 Q 0 160, 102.86 109.5 Q 205.71 59, 308.57 94 Q 411.43 129, 514.29 101.5 Q 617.14 74, 720 91.5 Q 822.86 109, 925.71 81.5 Q 1028.57 54, 1131.43 89 Q 1234.29 124, 1337.15 142 Q 1440 160, 1440 160 L 1440 160 Z"></path>
</svg>

</zbk-code-block>

<h4 id="path-helper-example">Parsing and interpolating paths</h4>

`parsePath()` understands the quadratic path format emitted by Dynamowaves. `interpolateWave()` expects two parsed arrays with the same number of segments, a progress value from `0` to `1`, the orientation, and the same height and width used to generate the paths.

<zbk-code-block label="JavaScript" show-preview="on" split-control="off">

```javascript bare
import { generateWave, interpolateWave, parsePath } from 'dynamowaves';

const options = { width: 1440, height: 160, points: 6, variance: 3 };
const sequence = (samples) => {
  let sample = 0;
  return () => samples[sample++ % samples.length];
};

const startPath = generateWave({
  ...options,
  random: sequence([0.15, 0.8, 0.35, 0.95, 0.25, 0.65]),
});
const endPath = generateWave({
  ...options,
  random: sequence([0.75, 0.45, 0.9, 0.2, 0.6, 0.1]),
});

const halfwayPath = interpolateWave(
  parsePath(startPath),
  parsePath(endPath),
  0.5,
  false,
  options.height,
  options.width,
);
```

<div
  slot="preview"
  id="interpolation-preview"
  aria-label="Start, halfway, and target wave paths"
  style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr));gap:var(--zbk-spacing-1);width:100%;padding:var(--zbk-spacing-1)"
>
  <div>
    <strong>Start</strong>
    <svg viewBox="0 0 1440 160" preserveAspectRatio="none" role="img" aria-labelledby="interpolation-start-title" style="display:block;width:100%;height:7rem;fill:var(--zbk-brand-canvas)">
      <title id="interpolation-start-title">Starting wave path</title>
      <path d="M 0 160 L 0 126 Q 0 126, 144 87 Q 288 48, 432 75 Q 576 102, 720 66 Q 864 30, 1008 72 Q 1152 114, 1296 90 Q 1440 66, 1440 66 L 1440 160 Z"></path>
    </svg>
  </div>
  <div>
    <strong>Halfway</strong>
    <svg viewBox="0 0 1440 160" preserveAspectRatio="none" role="img" aria-labelledby="interpolation-halfway-title" style="display:block;width:100%;height:7rem;fill:var(--zbk-brand-canvas)">
      <title id="interpolation-halfway-title">Wave path halfway between start and target</title>
      <path d="M 0 160 L 0 90 Q 0 90, 144 79.5 Q 288 69, 432 69 Q 576 69, 720 72 Q 864 75, 1008 84 Q 1152 93, 1296 96 Q 1440 99, 1440 99 L 1440 160 Z"></path>
    </svg>
  </div>
  <div>
    <strong>Target</strong>
    <svg viewBox="0 0 1440 160" preserveAspectRatio="none" role="img" aria-labelledby="interpolation-target-title" style="display:block;width:100%;height:7rem;fill:var(--zbk-brand-canvas)">
      <title id="interpolation-target-title">Target wave path</title>
      <path d="M 0 160 L 0 54 Q 0 54, 144 72 Q 288 90, 432 63 Q 576 36, 720 78 Q 864 120, 1008 96 Q 1152 72, 1296 102 Q 1440 132, 1440 132 L 1440 160 Z"></path>
    </svg>
  </div>
</div>

</zbk-code-block>

Malformed or unrelated path strings produce an empty array from `parsePath()`. The helpers do not repair mismatched point arrays; validate compatibility before calling `interpolateWave()`.

<h4 id="seed-helper-example">Encoding and decoding snapshots</h4>

```javascript
import { decodeWaveSeed, encodeWaveSeed } from 'dynamowaves';

const seed = encodeWaveSeed(path);
const restoredPath = decodeWaveSeed(seed); // string
const plainSeed = decodeWaveSeed('homepage-hero-v1'); // null
```

`decodeWaveSeed()` only accepts encoded strings that decode to the Dynamowaves path format. Returning `null` for a plain deterministic seed is expected; the custom element, rather than this helper, turns that string into a seeded random source.

<h4 id="typescript-exports">TypeScript exports</h4>

The package declarations export `DynamoWave`, `DynamoWaveAttributes`, `DynamoWaveCompleteDetail`, `DynamoWaveEventMap`, `WaveDirection`, `WaveGenerationOptions`, `WaveObserverOptions`, `WaveOrientation`, and `WavePoint`. They also add `<dynamo-wave>` to `HTMLElementTagNameMap`, type the completion event on `HTMLElementEventMap`, and provide the custom element's JSX attributes.

<h3 id="styling-layout">Styling and layout</h3>

The custom-element host stays in the document. Its `id`, classes, inline styles, and data attributes remain on that host; Dynamowaves renders a light-DOM SVG inside it.

```html show-preview=on
<dynamo-wave class="section-wave"></dynamo-wave>

<style>
  .section-wave {
    display: block;
    width: 100%;
    height: 5rem;
    fill: rebeccapurple;
    stroke: transparent;
  }
</style>
```

The generated SVG fills the host with `width: 100%`, `height: 100%`, and `preserveAspectRatio="none"`. Its path inherits `fill` and `stroke`; text `color` alone does not set the wave fill. When an unstyled host computes to `display: inline`, Dynamowaves gives it an inline `display: block` default. An authored display value wins.

Style the host rather than depending on the generated `svg` and `path` structure as a selector contract.

<h3 id="lifecycle-accessibility">Lifecycle, SSR, and accessibility</h3>

- The module can be imported during SSR or in Node without `HTMLElement` or `customElements`. Registration happens only where a browser custom-element registry exists.
- Server output contains the authored `<dynamo-wave>` host; the SVG is created when the element upgrades in the browser. Reuse a recorded `data-wave-seed` when the first client-rendered shape must be identical across pages or environments.
- The generated SVG is decorative: it uses `aria-hidden="true"` and `role="presentation"`. Do not use the wave as the only carrier of meaningful information.
- `prefers-reduced-motion: reduce` prevents continuous playback and reduces one-off morphs to one millisecond. A running authored loop pauses when the preference changes live and resumes when motion is allowed again, unless animation was explicitly disabled in the meantime.
- Removing an active element cancels its animation frame and disconnects its observers. Reattaching it resumes a loop that had been running; an interrupted one-off morph does not resume.
- Changing geometry while a loop is active rebuilds the paths and resumes the loop with the new configuration.
- The baseline browser requirements are Custom Elements and `requestAnimationFrame`. `IntersectionObserver` is only required for `data-wave-observe`; the wave still renders when observation is unavailable.

<h3 id="troubleshooting">Troubleshooting</h3>

- **The element takes up no useful space:** give the `<dynamo-wave>` host an explicit or layout-derived height. Its generated SVG is `height: 100%` and cannot invent the surrounding layout.
- **The wave is present but invisible:** set `fill` on the host and check that it is not the same color as the surface behind it. `color` alone does not set the path fill.
- **A method is undefined:** make sure the package was imported, then wait for the custom element definition before calling instance methods. The framework example above shows the exact `customElements.whenDefined()` pattern.
- **A parent listener never sees completion:** `dynamo-wave-complete` does not bubble or cross a shadow boundary. Attach the listener directly to the `<dynamo-wave>` element.
- **A readable seed string changes after render:** that is expected. The element replaces it with the encoded snapshot it generated. Save the original string separately if you need to reapply it after changing geometry.
- **Animation does not start:** `data-wave-animate` only accepts the exact string `true`, and continuous animation is intentionally disabled while the viewer requests reduced motion.
- **Viewport regeneration feels early or late:** positive `data-wave-observe` margins expand the observed viewport and delay non-intersection; negative margins contract it and make non-intersection happen sooner.
