<span id="installation-header" aria-hidden="true"></span>

<h2 id="installationHeader" class="margin-block-start-0">Installation</h2>

Dynamowaves is a dependency-free custom element. It keeps the authored `<dynamo-wave>` host in the document and renders a generated SVG path inside it.

<h3 id="npm-installation">npm</h3>

```bash
npm install dynamowaves
```

A side-effect import is enough when you only need the element:

```javascript
import 'dynamowaves';
```

Then author the element in ordinary HTML and give its host a visible height and fill:

```html show-preview=on
<dynamo-wave class="hero-wave" data-wave-points="8"></dynamo-wave>

<style>
  .hero-wave {
    display: block;
    width: 100%;
    height: 5rem;
    fill: rebeccapurple;
  }
</style>
```

The package also provides named ESM exports:

```javascript
import { DynamoWave, generateWave, encodeWaveSeed } from 'dynamowaves';
```

CommonJS receives the same runtime API:

```javascript
const { DynamoWave, generateWave, encodeWaveSeed } = require('dynamowaves');
```

Importing the package is safe during SSR: it does not require browser globals to evaluate. The custom element registers only in a browser environment with `customElements`; its SVG is created after client-side upgrade.

<h3 id="framework-installation">Bundlers and frameworks</h3>

Import `dynamowaves` once from the browser entry point used by your application, then use `<dynamo-wave>` directly in HTML, JSX, or a framework template. Attributes remain strings in markup; use an element reference for `generateNewWave()`, `play()`, and `pause()`.

If framework code may run before the custom element has upgraded, wait for its definition before calling methods:

```typescript
import 'dynamowaves';
import type { DynamoWave } from 'dynamowaves';

await customElements.whenDefined('dynamo-wave');

const wave = document.querySelector<DynamoWave>('dynamo-wave');
wave?.generateNewWave(500);
```

Server-rendered frameworks may emit the `<dynamo-wave>` host normally. Importing the module during SSR is safe, but method calls and DOM queries still belong in the framework's client lifecycle. For an identical server and first-client shape, render a previously recorded `data-wave-seed`; otherwise the SVG is generated when the element upgrades.

<h3 id="script-installation">Direct script or CDN</h3>

The UMD files remain available for projects that load scripts directly. They register `<dynamo-wave>` and expose the helper API as `globalThis.Dynamowaves`.

```html
<!-- Local copy -->
<script src="/path/to/dynamowaves.min.js"></script>

<!-- Latest compatible 2.x release from npm through jsDelivr -->
<script
  src="https://cdn.jsdelivr.net/npm/dynamowaves@2/dist/dynamowaves.min.js"
  crossorigin="anonymous"
></script>

<script>
  const path = Dynamowaves.generateWave({
    width: 1440,
    height: 160,
    points: 6,
    variance: 3,
  });
</script>
```

Replace `@2` with an exact published version when a deployment must not move to a newer compatible release automatically.

<h3 id="angular-installation">Angular</h3>

After installing from npm, add the browser bundle to the `scripts` array in `angular.json`:

```json
"scripts": [
  "node_modules/dynamowaves/dist/dynamowaves.js"
]
```

Then enable custom-element markup in the owning module:

```typescript
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';

@NgModule({
  // ...
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
```
