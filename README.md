# Dynamowaves
Lightweight, dependency-free SVG wave templates that generate a new path every time they render. Each wave is a standard [custom element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) (`<dynamo-wave>`) that swaps itself into the DOM, inherits your styling, and can morph or animate on demand.

[Documentation + live examples](https://dynamowaves.markzebley.com)

## Features
- **Drop-in custom element** – include `<dynamo-wave>` anywhere in your markup; classes, styles, and IDs flow through automatically.
- **Deterministic or generative** – seed waves for reproducible shapes, or let them randomize and re-render via Intersection Observer triggers.
- **Rich data attributes** – configure direction, variance, anchoring, animation speed, observation behavior, and more without writing JS.
- **Runtime controls** – programmatic API (`generateNewWave`, `play`, `pause`) with TypeScript definitions plus a `dynamo-wave-complete` event hook.
- **Animation aware** – honors `prefers-reduced-motion` and pauses observers/loops when the element leaves the DOM.

## Installation
### npm
```bash
npm install dynamowaves
```

```js
// Registers the <dynamo-wave> custom element globally
import 'dynamowaves';
```

### CDN or direct script
```html
<!-- Local copy -->
<script src="/path/to/dynamowaves.js"></script>

<!-- jsDelivr CDN -->
<script src="https://cdn.jsdelivr.net/gh/mzebley/dynamowaves/dist/dynamowaves.min.js" crossorigin="anonymous"></script>
```

### Angular
1. Add the script to the `angular.json` `scripts` array:
   ```json
   "scripts": [
     "node_modules/dynamowaves/dist/dynamowaves.js"
   ]
   ```
2. Opt in to custom elements support:
   ```ts
   import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

   @NgModule({
     // ...
     schemas: [CUSTOM_ELEMENTS_SCHEMA]
   })
   export class AppModule {}
   ```

## Quick start
```html
<!-- Without attributes you get a top-facing wave that inherits its parent color -->
<dynamo-wave class="fill-theme"></dynamo-wave>

<style>
  .fill-theme { fill: var(--theme); }
</style>
```

Waves fill the width of their container by default. Use inline styles, classes, or utility frameworks to control height, width, transforms, and colors just as you would with any other SVG.

## Data attributes
| Attribute | Default | Purpose |
| --- | --- | --- |
| `data-wave-points` | `6` | Number of anchor points that make up the path. Higher = smoother detail. |
| `data-wave-variance` | `3` | Maximum deviation for each point. Accepts legacy `data-variance`. |
| `data-wave-seed` | _unset_ | Provide any string/number to make the wave deterministic across renders. |
| `data-start-end-zero` | _false_ | Keeps the first and last points pinned to the baseline (works for vertical waves too). |
| `data-wave-face` | `top` | Controls orientation: `top`, `bottom`, `left`, or `right`. |
| `data-wave-speed` | `7500` | Milliseconds for the animation loop when using `.play()` or `data-wave-animate="true"`. |
| `data-wave-animate` | `false` | `"true"` starts a continuous morphing loop (unless `prefers-reduced-motion` is enabled). |
| `data-wave-observe` | _unset_ | Automatically regenerate when the element leaves the viewport. Use `once`, `repeat`, or either with a custom root margin (`repeat:100px`, `once:-50px`). |

Examples:
```html
<!-- Deterministic bottom wave -->
<dynamo-wave
  data-wave-face="bottom"
  data-wave-seed="brand-home-hero">
</dynamo-wave>

<!-- Vertical wave with anchored endpoints -->
<dynamo-wave
  class="fill-theme"
  data-wave-face="left"
  data-start-end-zero
  style="height: 100%; width: 1rem;">
</dynamo-wave>

<!-- Animated hero background -->
<dynamo-wave
  data-wave-animate="true"
  data-wave-speed="5000"
  data-wave-points="120"
  data-wave-variance="2">
</dynamo-wave>
```

## JavaScript API
Every `<dynamo-wave>` instance exposes runtime helpers once it has connected to the DOM:

| Method | Description |
| --- | --- |
| `generateNewWave(duration?: number)` | Smoothly morphs to a brand-new randomized path. Optional duration defaults to 800 ms. |
| `play(duration?: number)` | Starts a continuous animation loop. Uses `data-wave-speed` unless a custom duration is provided. |
| `pause()` | Stops the loop and saves progress so `play()` resumes smoothly. |

Listen for `dynamo-wave-complete` to react when an animation loop finishes:

```js
const wave = document.querySelector('dynamo-wave');

wave.addEventListener('dynamo-wave-complete', (event) => {
  console.log('Wave finished animating', event.detail);
});
```

## Practical ideas
- Sticky card headers that keep refreshing their divider when scrolled away (`data-wave-face="bottom"` + `position: sticky`).
- Animated transitions that re-render between steps—call `wave.generateNewWave(500)` when a stepper advances.
- Image reveals using `data-wave-face="left"` plus `position:absolute` to fake a mask-edge over hero photography.

Find more recipes in [`www/snippets/practical-application/examples.md`](www/snippets/practical-application/examples.md) or on the [docs site](https://dynamowaves.markzebley.com).

## Accessibility
- Waves are decorative by default (`aria-hidden="true"`/`role="presentation"`).
- `data-wave-animate="true"` respects system reduced-motion preferences and will not start if users opt out.
- Use deterministic seeds if you need identical visuals for screenshots or server-side rendering.

## Development
```bash
git clone https://github.com/mzebley/dynamowaves.git
cd dynamowaves
npm install
npm run build
```

The docs under `www/` pull their copy from Markdown snippets maintained with [@mzebley/mark-down](https://www.npmjs.com/package/@mzebley/mark-down).  
Use `npm run snippets:build` for a one-off compile or `npm run snippets:watch` while editing files inside `www/snippets/`.

## License
ISC © Mark Zebley
