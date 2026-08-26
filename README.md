# Dynamowaves
Lightweight, dependency-free SVG wave templates that generate a new path every time they render. Each wave is a standard [custom element](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements) (`<dynamo-wave>`) that keeps its authored host in the DOM, renders an SVG inside it, and can morph or animate on demand.

[Documentation + live examples](https://dynamowaves.markzebley.com)

## Features
- **Drop-in custom element** – include `<dynamo-wave>` anywhere in your markup; classes, styles, and IDs flow through automatically.
- **Deterministic or generative** – seed waves for reproducible shapes, or let them randomize and re-render via Intersection Observer triggers.
- **Rich data attributes** – configure direction, variance, anchoring, animation speed, observation behavior, and more without writing JS.
- **Runtime controls** – programmatic API (`generateNewWave`, `play`, `pause`) with TypeScript definitions plus a `dynamo-wave-complete` event hook.
- **Animation aware** – responds to live `prefers-reduced-motion` changes and cancels animation/observer work while detached.

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

<!-- jsDelivr CDN, pinned to the compatible 2.x line -->
<script src="https://cdn.jsdelivr.net/npm/dynamowaves@2/dist/dynamowaves.min.js" crossorigin="anonymous"></script>
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
<dynamo-wave class="fill-theme"></dynamo-wave>

<style>
  .fill-theme { fill: var(--theme); }
</style>
```

## Data attributes
| Attribute | Default | Purpose |
| --- | --- | --- |
| `data-wave-points` | `6` | Integer anchor count, clamped to at least two. |
| `data-wave-variance` | `3` | Finite numeric point deviation. |
| `data-variance` | _unset_ | Legacy alias for `data-wave-variance`. |
| `data-wave-seed` | generated | Recorded Base64 path or plain deterministic seed. |
| `data-start-end-zero` | _false_ | Anchors endpoints on the base edge. |
| `data-wave-face` | `top` | Orientation of the wave. |
| `data-wave-speed` | `7500` | Positive loop duration in milliseconds. |
| `data-wave-animate` | `false` | The exact string `true` enables automatic playback. |
| `data-wave-observe` | _unset_ | `once` or `repeat`, with an optional root margin. |

All attributes are observed at runtime: changing one after render re-renders or reconfigures the wave immediately (a running loop resumes with the new settings).

## Reusing wave seeds
```html
<dynamo-wave id="hero-wave" data-wave-animate="true"></dynamo-wave>
<script>
  const heroSeed = document.getElementById('hero-wave')?.getAttribute('data-wave-seed');
  if (heroSeed) {
    const footerWave = document.createElement('dynamo-wave');
    footerWave.setAttribute('data-wave-seed', heroSeed);
    document.body.appendChild(footerWave);
  }
</script>
```

## JavaScript API

```js
import {
  DynamoWave,
  generateWave,
  parsePath,
  interpolateWave,
  encodeWaveSeed,
  decodeWaveSeed,
} from 'dynamowaves';
```

ESM and CommonJS expose the same six names. Direct browser scripts expose them on `globalThis.Dynamowaves`.

| Instance method | Description |
| --- | --- |
| `generateNewWave(duration = 800)` | Morph once to a new random path. |
| `play(duration?)` | Start a continuous loop. |
| `pause()` | Stop a loop or cancel an active one-off morph. |

`dynamo-wave-complete` fires after a one-off morph and after every completed loop cycle. Its detail is `{ duration, direction: 'horizontal' | 'vertical' }`.

## Practical ideas
See [`src/lib/content/examples.md`](src/lib/content/examples.md) or the docs site.

## Accessibility
- Generated SVGs are decorative and hidden from assistive technology.
- Continuous motion stops when reduced motion is enabled; one-off morphs resolve in one millisecond.
- The module imports safely during SSR. Reuse a recorded seed when the first client-rendered shape must be identical.

## Development
```bash
git clone https://github.com/mzebley/dynamowaves.git
cd dynamowaves
npm install
npm run build
```

`npm run build` remains the publishable library build. The documentation is a
fully prerendered SvelteKit/mdsvex site that imports the local library source:

```bash
npm run dev:docs       # local docs development
npm run build:docs     # library, Zebkit, and prerendered docs
npm run check:docs     # Svelte and Zebkit authored-markup checks
npm run preview:docs   # preview the production docs build
npm run verify:docs    # rendered Zebkit verification against the preview
```

Run generated Zebkit steps serially: build before check, and restart the
preview after the generated runtime or CSS changes.

## License
ISC © Mark Zebley
