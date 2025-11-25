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
<dynamo-wave class="fill-theme"></dynamo-wave>

<style>
  .fill-theme { fill: var(--theme); }
</style>
```

## Data attributes
| Attribute | Default | Purpose |
| --- | --- | --- |
| `data-wave-points` | `6` | Number of anchor points. |
| `data-wave-variance` | `3` | Max point deviation. |
| `data-wave-seed` | _unset_ | Encoded deterministic path. |
| `data-start-end-zero` | _false_ | Anchors endpoints on baseline. |
| `data-wave-face` | `top` | Orientation of the wave. |
| `data-wave-speed` | `7500` | Loop duration. |
| `data-wave-animate` | `false` | Auto-animate. |
| `data-wave-observe` | _unset_ | Regenerate on viewport changes. |

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
| Method | Description |
| --- | --- |
| `generateNewWave(duration?)` | Morph to a new random path. |
| `play(duration?)` | Start loop. |
| `pause()` | Stop loop. |

## Practical ideas
See `www/snippets/practical-application/examples.md` or the docs site.

## Accessibility
- Decorative by default.
- Respects reduced-motion.
- Seeds for SSR consistency.

## Development
```bash
git clone https://github.com/mzebley/dynamowaves.git
cd dynamowaves
npm install
npm run build
```

Docs use **mark↓**.  
Use:
- `npm run docs:manifest`
- `npm run docs:build`
- `npm run docs:watch`

## License
ISC © Mark Zebley
