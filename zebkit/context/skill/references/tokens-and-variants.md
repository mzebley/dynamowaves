# Tokens, themes, and variants

Read this for visual changes, theme work, token errors, overlay themes, component
filters, custom variants, or any proposal to add CSS.

## The three strata

References flow downward:

```text
component token -> semantic alias -> primitive
```

- **Primitive:** reusable values and scales, such as color, spacing, and type.
- **Alias:** meaning, such as app canvas, action ink, or status.
- **Component:** the complete visual surface for one component.

A component token that reaches directly into a reusable primitive skips the
design language. Closed, typed CSS grammar values such as `center`, `flex-start`,
or `none` are different: they may be authored directly on the component token
that owns the property when an alias would add no meaning.

The vocabulary is closed; values are open and contextual. Change the value of
an existing token freely, but do not invent a `--zbk-*` name that no shipped
contract reads. A token-source override is theme-wide; consumer CSS may scope
the same existing custom property to one runtime context.

## Find the correct token

Use live lookup first:

```bash
node <skill-dir>/scripts/zebkit-lookup.mjs --zbk-button-canvas
node <skill-dir>/scripts/zebkit-lookup.mjs --zbk-button-
```

Authority:

1. compiled CSS: whether this project emits the custom property;
2. `dist/editor/zebkit.css-data.json`: names and descriptions;
3. copied token files: this project's overrides;
4. installed default token snapshot: shipped fallback;
5. token source modules and schemas when contributing upstream.

Do not predict a name and ship it. Undefined `var()` references can fail as a
silent unset or fallback.

## Edit authorable token files

`zebkit init` and `zebkit pull` create unwrapped
`zbk-<module>.tokens.json` files. Entries use the DTCG 2025.10 profile:

```json
{
  "canvas": {
    "$value": "{action.canvas-muted}",
    "$type": "color",
    "$description": "Default button background."
  }
}
```

Preserve `$type`, `$description`, and Zebkit extensions when editing a copied
entry. Prefer an alias reference for reusable design values. Use a literal for
an owner-specific, schema-validated CSS keyword when that is the clearest value.

Then rebuild:

```bash
npx zebkit build
```

Never edit the compiled CSS, generated token exports, editor data, generated
runtime module, Custom Elements Manifest, or generated agent context.

## Check the entire state family

A request for one color can affect default, hover, active, focus, disabled, and
semantic states through references. After editing a base or alias token:

```bash
node <skill-dir>/scripts/zebkit-lookup.mjs --zbk-button-
npx zebkit check --format=json
```

Inspect related states and every configured overlay. Static evidence can prove
declared token relationships; transparent colors, unvisited combinations, and
runtime content may remain unknown until rendered verification.

Instance-scoped CSS does not get the build's dependency closure. Root-declared
component tokens have already resolved their references, so carry the complete
affected state family when overriding one locally. Components also declare
`color` from their ink tokens; a parent `color` affects ordinary content but
does not automatically recolor a component.

For example, a theme-wide focus change belongs in `focus.color`. If only one
special canvas needs it, scope the existing value and its component dependents:

```css
.promo-surface {
  --zbk-focus-color: var(--zbk-app-ink-inverse);
  --zbk-button-focus-color: var(--zbk-focus-color);
}
```

Do not invent `--zbk-focus-on-promo`; verify at least 3:1 against every
background and state the scoped ring reaches.

## Overlay themes

An overlay token directory is compiled into selector-scoped declarations. It
contains only differences from the base theme and relies on the base CSS for the
rest of the graph.

Do not:

- set an overlay root selector to `:root`;
- load an overlay without the base stylesheet;
- assume a base-only inspection covers overlay contrast or state behavior;
- copy a full theme into an overlay when a small override expresses the change.

Reference closure cannot infer semantic siblings. When an overlay changes a
canvas tier, audit the corresponding ink and border tiers plus action, accent,
status, disabled, and focus roles used on it. With
`tokens.extendedTokens.colors: "smart"`, only primitive families referenced by
the merged base/overlay graph or explicitly overridden primitives are emitted;
use an existing-token reference or `"all"` for a family read only by consumer
CSS.

## Raw headings and prose tokens

`font-*` / `text-*` utilities set only font size. Raw `h1`–`h6` elements receive
their full `--zbk-h*-*` token treatment as direct children of `.prose` (or with
`class="prose"`); `<zbk-heading>` maps that treatment through its component
contract.

## Variants

A variant is a named partial remapping of component tokens:

```json
{
  "button": {
    "quiet": {
      "axis": "style",
      "description": "Low-emphasis action treatment.",
      "overrides": {
        "canvas": "transparent",
        "ink": "{action.ink}"
      }
    }
  }
}
```

Use the established filenames:

- `zbk-button.variants.json`
- `zbk-button.variant.quiet.json`
- any `*-variants.json` multi-component collection

Rules:

- overrides use aliases or structural values such as `transparent`, `none`, `0`,
  and `currentColor`;
- never create `--zbk-button-quiet-*` tokens; the variant sets the base component
  surface under its class;
- same-axis variants are alternatives, not combinations;
- different axes promise composability and should not collide on the same token;
- shipped variants remain token-only; consumer inline/stylesheet escape hatches
  are explicit unknown evidence.

When two useful variants collide only because they both neutralize a third
concern, extract that concern into its own variant on the axis that owns it. For
example, keep a compact `style` variant focused on shape and color, and compose
it with a `flat` `motion` variant that alone owns shadow and transform tokens:

```html
<zbk-button variant="chip sm flat">Filter</zbk-button>
```

This preserves composability and gives the shared concern one owner. If the two
variants genuinely express alternatives for the same concern, align their axes
instead.

### Consumer-only style escapes

Use `styles.inline` or `styles.stylesheetPaths` only for a genuine local gap
that cannot yet be modeled by the component token surface. They are invalid in
zebkit-shipped variants, bypass token and accessibility guarantees, and require
rendered verification rather than a clean static result.

```json
{
  "button": {
    "promo": {
      "axis": "style",
      "description": "Temporary campaign treatment.",
      "overrides": {},
      "styles": {
        "stylesheetPaths": ["./promo-button.css"]
      }
    }
  }
}
```

An empty `overrides` object is valid: the stylesheet owns this one-off treatment.
`inline` is also available for declarations only and is emitted under the variant
class. Stylesheet paths are relative to their variant JSON file (or absolute)
and are included as global styles: scope their selectors yourself. They cannot
be safely scoped in an overlay theme. Keep either escape small, document why it
exists, and replace it with a token or component-surface improvement when the
pattern repeats.

## Deliver both halves of a new or renamed variant

A custom variant change needs:

1. **CSS delivery:** the token build compiles `.zbk-button--quiet`.
2. **Vocabulary delivery:** the runtime registers `quiet` before the element
   upgrades.

The runtime module generated by `zebkit init`, `zebkit build`, or `zebkit pull` carries consumer
variant JSON automatically. After adding, removing, or renaming a variant, run
`npx zebkit build` to refresh both CSS and that module. Apply it before
`defineZebkitComponents()`. Use `pull` for package/default or context
synchronization, not as a required second variant command.

If runtime generation is deliberately disabled, register manually before
definition:

```ts
import { ZebkitElement, defineZebkitComponents } from 'zebkit/components';
import variants from './tokens/zbk-button.variants.json';

ZebkitElement.registerVariants(variants);
defineZebkitComponents();
```

Confirm the class exists in compiled CSS and the name appears in runtime
diagnostics or generated project context. One half without the other produces a
component that silently falls back or warns.

## Complete a component-filter migration

Treat every `components` exclusion and shipped-variant allowlist as a required
delivery audit:

1. Make intent explicit in `zebkit.config.json`: use `false` for an excluded
   component and `{ "variants": ["..."] }` for the shipped vocabulary that
   remains. Wholly new consumer variants survive that allowlist; patches of its
   filtered-out shipped variants are skipped.
2. Search authored markup/templates for `<zbk-{component}>`, `variant="..."`,
   and framework equivalents. Remove or migrate excluded tags and old/filtered
   variant names.
3. Search runtime entry points for `defineZbk*`, component imports, and manual
   `registerVariants` calls. Remove unreachable registrations/imports and make
   sure the generated runtime module is applied before definition.
4. Run `npx zebkit build`, inspect the generated context and compiled CSS, then
   run `npx zebkit check --format=json`. The emitted surface—not package
   availability—is the contract.
5. Audit dynamic tags, imports, and variant strings separately. Retain each
   real dynamic path in the component/variant config and render-test it; static
   checking deliberately reports dynamic values as unresolvable. Pruning
   safelists are separate and cannot resurrect a hard component exclusion or
   shipped-variant allowlist removal.

Custom variant files that patch an excluded component or an allowlisted-out
shipped variant warn and are skipped; fix the config or remove the stale patch.

## Escalate gaps upstream

If a desired visual property cannot be reached through the component's token
surface, that is a component defect. Propose the missing token at the correct
stratum and extend its schema, styles, manifest/workbench metadata, generated
context, and tests together. Do not normalize the gap into project CSS.
