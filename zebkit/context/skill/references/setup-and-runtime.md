# Setup and runtime delivery

Read this when Zebkit is not initialized, components stay hidden, project options
or variants do not apply, a framework behaves differently after navigation, or
package/runtime wiring is part of the task.

## Install and initialize

The private prerelease is commonly installed through the public `zebkit` alias:

```bash
npm install zebkit@npm:@mzebley/zebkit@dev lit
npx zebkit init
npx zebkit build
```

`lit` is a peer dependency. `init` writes `zebkit.config.json`, can copy
authorable token and variant files, generates the runtime config module, configures
editor support, and installs project-filtered agent context.

After upgrading:

```bash
npx zebkit pull
npx zebkit build
```

Commit `.zebkit/pull-state.json`. It lets later pulls update untouched defaults
without overwriting project customizations.

## Load the CSS

Read `tokens.destinationPath`, `tokens.themeName`, and `tokens.minify` from the
config. The normal output is:

```html
<link rel="stylesheet" href="/path/to/zbk-my-theme.min.css">
```

If `minify` is `false`, the filename has no `.min` segment. Overlay themes are
separate selector-scoped CSS files and must be loaded after the base stylesheet.
Font strategies other than `import` may write a `*.fonts.html` sidecar whose
links belong in the document head.

## Apply project config before definition

The generated runtime module carries component filters, behavior options,
accessibility delivery, and consumer variant registration into the browser.
Call it before defining elements:

```ts
import { applyZebkitConfig } from './zebkit/zebkit.runtime.js';
import { defineZebkitComponents } from 'zebkit/components';

applyZebkitConfig();
defineZebkitComponents();
```

Use the actual generated-module path from `config.runtime.path` or the `init`
output. If runtime generation is disabled, the consumer owns equivalent setup
and must register new variants before any matching element upgrades.

## Register components

Register everything:

```ts
import { defineZebkitComponents } from 'zebkit/components';

defineZebkitComponents();
```

Or tree-shake by component:

```ts
import { defineZbkButton } from 'zebkit/components/button';

defineZbkButton();
```

The package import alone is not the definition call. Zebkit intentionally hides
its undefined elements to prevent a flash of unstyled children, so a missing call
often presents as blank content rather than an obvious unstyled tag.

## Author the host, integrate through the native control

Write the public surface on the custom element:

```html
<zbk-button
  id="save"
  class="margin-inline-auto"
  variant="outline lg"
  aria-describedby="save-help"
>
  Save
</zbk-button>
```

At upgrade:

- native/global attributes and ARIA land on the semantic native element;
- `id` relocates so labels and IDREFs resolve once;
- `class` and `style` copy to the style root because the host is
  `display: contents`;
- native events bubble through light DOM;
- `focus()` and `blur()` forward.

When an integration truly needs the native element:

```ts
const button = document.querySelector('zbk-button');
await button.updateComplete;
button.nativeControl?.focus();
```

Do not query `.zbk-*` internal skeleton classes. They are stable compilation
targets, not the consumer integration API.

## Framework and SSR notes

- Prefer HTML attributes using the documented kebab-case spelling. Zebkit
  reflects attributes that its runtime must read after framework property
  assignment.
- Import definitions from a client-capable entrypoint when the framework
  prerenders on the server.
- Keep authored children semantically sensible before upgrade. Light DOM and
  progressive enhancement are one requirement, not separate modes.
- Test client navigation as well as first-page SSR. A value that works only when
  serialized as an initial attribute usually indicates runtime wiring or
  reflection drift.

## Diagnose a blank or base-styled component

1. Run `zebkit-context.mjs`; confirm config, CSS, runtime module, and component
   inclusion.
2. Confirm the CSS link points at the current build.
3. Confirm `applyZebkitConfig()` ran before the component definition.
4. Confirm the relevant `defineZbk*()` or `defineZebkitComponents()` call ran in
   the browser.
5. Inspect dev-mode diagnostics; each should name the invalid value and valid
   vocabulary.
6. Rebuild and run `npx zebkit check --format=json`.
