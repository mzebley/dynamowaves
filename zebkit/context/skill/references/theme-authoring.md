# Authoring complete themes

A theme is complete when its components, prose, browser-owned controls, states,
and composition express one thesis under real accessibility constraints. A font
and palette swap is an incomplete theme.

## Start from live project truth

Run orientation and inspect the selected overlay:

```bash
node ./zebkit/context/skill/scripts/zebkit-context.mjs
node ./zebkit/context/skill/scripts/zebkit-theme-pack.mjs --theme digital-edge
```

Pass `--config path/to/zebkit.config.json` when needed. Read only the generated
component and token context implicated by the brief. Do not reproduce the
library catalog in a prompt or skill; config, compiled CSS, manifests, and
generated context are authoritative.

## Establish the creative contract first

Write a manifest outside the token override directory (for example,
`theme-packs/digital-edge.json`) and point the base theme or overlay's
`manifestPath` at it. Base themes and overlays use the same layer fields:
`name`, `tokenPath`, `manifestPath`, `options`, and `fonts`; overlays additionally
accept `rootSelector` and `destinationPath`; every emitted overlay participates in accessibility evidence.
Token directories intentionally accept only token and variant JSON. Record:

- one visual thesis and at least three anti-goals;
- mood words that can be contradicted by the result;
- explicit direction for typography, geometry, density, surface, luminance and
  chroma, controls, indicators, alignment, motion, and prose;
- existing component variants recommended as author choices, plus any operative
  defaults that should render when an instance makes no same-axis choice;
- every required evidence kind and route.

Choose a pressure profile from `theme-philosophies.md`, combine profiles
deliberately, or use `none`. The profile should constrain decisions, not provide
preselected colors, fonts, radii, or components.

## Translate references into Zebkit surfaces

Public component galleries and design systems are legitimate research inputs.
Extract neutral traits such as indicator position, density, border construction,
state delta, label hierarchy, or motion cadence. Do not copy proprietary markup,
assets, names, or CSS.

For the complete workflow, live inventory command, classification vocabulary,
and rendered token-responsiveness requirement, read
[`reference-translation.md`](reference-translation.md).

Classify each desired trait before editing:

1. existing token;
2. existing variant;
3. supported slot or composition;
4. missing reusable token or grammar surface;
5. one-off page decoration that should not masquerade as theme capability.

If a reusable component trait lands in categories 4 or 5, report the framework
gap. Do not hide it in page-local CSS. New token strata or grammar changes must
follow the repository vision and grammar contracts.

## Realize the full system

Pressure-test every component family and prose treatment, not only the hero:

- typography hierarchy, reading measure, labels, metadata, code, quotations,
  figures, definitions, and rules;
- controls at rest, hover, active, focus, disabled, selected, checked, invalid,
  expanded, open, and transition midpoint where motion changes contrast;
- shape language, border construction, surface depth, shadows, target size,
  density, indicator placement and glyph family;
- native control chrome via `options.colorScheme`, plus forced-colors behavior;
- responsive reflow, text enlargement, keyboard order, focus return, reduced
  motion, and persistence when themes switch.

Review coupled geometry as a system. A large code-block shell radius, for
example, requires enough `bar-padding-inline` to keep the label and actions out
of the corner curve; a large control radius may require more padding without
making its target smaller. Prefer the component's existing inset tokens over
page CSS, and verify the relationship at the smallest supported width and the
largest supported text scale.

Use component variants for repeated recipes and tokens for theme-wide values.
Do not change component semantics or rely on page selectors to overpower tokens.

Keep `recommendedVariants` and `defaultVariants` deliberately separate in the
manifest. Recommendations are a menu and may include several choices on one
axis. Defaults are behavior: choose at most one per axis. Project
`components.<name>.defaultVariants` wins over the manifest, `[]` suppresses the
theme choice, an authored same-axis instance variant replaces it, and
`variant=""` requests the unvaried base treatment. Zebkit delivers defaults in
theme CSS for first paint and records the resolved result in the generated
descriptor and project context; do not add variant classes in application code.

```json
{
  "components": {
    "button": {
      "recommendedVariants": ["ghost", "outline"],
      "defaultVariants": ["outline"]
    }
  }
}
```

Project config overrides manifest defaults. For example:

```json
{
  "configVersion": 3,
  "tokens": { "destinationPath": "./dist" },
  "theme": {
    "name": "digital-edge",
    "tokenPath": "./theme/digital-edge",
    "manifestPath": "./theme-packs/digital-edge.json",
    "options": { "colorScheme": "dark" },
    "overlays": [
      {
        "name": "high-contrast",
        "tokenPath": "./theme/high-contrast",
        "manifestPath": "./theme-packs/high-contrast.json"
      }
    ]
  }
}
```

Omit an option to emit no instruction. `colorScheme` uses native CSS spellings
such as `light`, `dark`, or `light dark`; do not invent an adaptive alias.

## Prove and graduate

```bash
npx zebkit build
npx zebkit check --all-components --format=json
npx zebkit verify --url http://localhost:4173
```

Also prove the generated theme stylesheet, font-head snippet, and
`zbk-<theme>.theme.json` sidecar in a small vanilla consumer. A theme remains
`candidate` until all manifest evidence is current. Distinguish compiler/static
proof, rendered proof, manual review, and unknowns; one clean signal does not
upgrade the others.

Before calling the theme `verified`, update the expression registry and
changelog with the actual artifact paths and evidence boundaries.
