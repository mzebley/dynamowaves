# Verification and evidence

Read this when finishing UI work, configuring CI, pruning, reviewing an
accessibility report, or deciding what a successful command proves.

## The normal loop

Build after token, variant, component-filter, runtime-option, or config changes:

```bash
npx zebkit build
```

Check authored source and compiled static evidence:

```bash
npx zebkit check --format=json
```

Before release or after behavior, focus, theme, state, reflow, or runtime
accessibility changes, run the application:

```bash
npx zebkit verify --url http://localhost:4173
```

## What `check` proves

`check` binds its conclusions to the current compiled CSS, config, check rules,
and `zebkit-a11y-input.json` identities. It stops on stale or mismatched
artifacts and names the rebuild command.

It can detect anchored source such as:

- static `class`, `variant`, `appearance`, `style`, and attribute values;
- unknown `<zbk-*>` tags, tokens, utilities, variants, and closed attribute
  values;
- missing accessible names and required slots;
- visibility-composite grammar errors;
- raw visual literals in Zebkit markup;
- static token contrast and focus evidence carried by the build.

JSON findings include mechanical replacements when the correction is
unambiguous.

## What `check` does not prove

It does not render or execute the application. Dynamic expressions are counted
as unresolvable rather than guessed. A clean exit can still contain:

- dynamic classes, variants, attributes, or tokens;
- unvisited theme/variant/state combinations;
- transparent or runtime-resolved visual relationships;
- CSS/JS escape hatches outside compiler provenance;
- behavior, focus travel, clipping, reflow, or actual browser semantics.

Read the closing counts and evidence statuses. Do not collapse
`unknown-or-unvisited` or human review into pass.

## Reports

Write canonical JSON and a deterministic Markdown rendering:

```bash
npx zebkit check \
  --report dist/zebkit-a11y-check.json \
  --summary reports/zebkit-a11y.md
```

Keep JSON as the machine-readable source of truth. Markdown and HTML are
renderings for review, not independent evidence models.

## Rendered verification

`verify` reruns source/static checks, reads delivery evidence, and inspects the
configured routes, viewports, themes, and scenarios in Chromium. Install the
optional browser peer when needed:

```bash
npm i -D playwright
npx playwright install chromium
```

Declare a matrix broad enough to visit the behavior under review. Missing
routes, selectors, actions, browser surfaces, or states remain unknown.

## Pruning

Pruning sees statically discoverable vocabulary. Dynamic construction such as
`"padding-" + size` can be valid at runtime and absent from the scan.

Before enabling or changing pruning:

```bash
npx zebkit prune --dry-run --report dist/zebkit-prune-report.json
```

Safelist finite dynamic vocabulary, then inspect kept/dropped components,
variants, utility families, and tokens. Do not infer production availability
from the canonical unpruned CSS when the application serves a pruned sibling.

## Exit codes and vacuous success

- `0`: the command completed without configured failures.
- `1`: errors were reported.
- `2`: warning budget exceeded where supported.

Also confirm that files were scanned and that the dynamic/unvisited totals are
appropriate. “Zero findings” and “zero readable input” are different outcomes.
