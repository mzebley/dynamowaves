---
name: zebkit
description: >-
  Build, change, debug, and review interfaces in projects that use Zebkit,
  recognizable by the `zebkit` npm alias or `@mzebley/zebkit` package,
  `zebkit.config.json`, `zbk-*` custom elements, `--zbk-*` custom properties, or
  `zbk-*` utility classes. Use for any task that touches Zebkit markup,
  components, variants, component options, tokens, themes, utilities, CSS,
  accessibility behavior, pruning, setup, upgrades, or generated runtime
  wiring. Also use when a visual request appears routine: Zebkit's available
  components, variants, utilities, tokens, and breakpoints are project-specific,
  and plausible CSS-framework guesses can silently do nothing. Orient from the
  live project, read only the generated context relevant to the task, preserve
  native semantics and token strata, then prove the result with `zebkit build`,
  `zebkit check`, and rendered verification where appropriate.
---

# Working with Zebkit

Treat Zebkit as a compiler-backed component grammar, not a catalog to memorize.
The project already ships machine-readable component, utility, token, variant,
and accessibility truth. Load the relevant truth, make the smallest source
change, and let commands contradict bad assumptions.

## 1. Orient before editing

Run the project detector from the skill directory:

```bash
node ./zebkit/context/skill/scripts/zebkit-context.mjs
```

It reports the installed version, config, active component filters, token source,
runtime module, compiled CSS, generated context, and evidence state. If the
project uses a nonstandard config or CSS path:

```bash
node ./zebkit/context/skill/scripts/zebkit-context.mjs \
  --config path/to/zebkit.config.json \
  --css path/to/zbk-theme.min.css
```

Read the reported `llms.txt`, then only the component or utility files needed for
the task. Do not load the full library when a focused generated file exists.
The default path is copied by `zebkit init` or `zebkit pull`; use `<skill-dir>`
instead when your project stores the skill elsewhere.

Use lookup rather than analogy:

```bash
node ./zebkit/context/skill/scripts/zebkit-lookup.mjs zbk-button
node ./zebkit/context/skill/scripts/zebkit-lookup.mjs button:ghost
node ./zebkit/context/skill/scripts/zebkit-lookup.mjs padding-inline-4 --zbk-button-canvas
node ./zebkit/context/skill/scripts/zebkit-lookup.mjs gap- --list-components
```

The compiled CSS is final authority for what this project emitted. Package
metadata says what Zebkit can provide; config and compiled output say what this
project actually has.

## 2. Choose the correct surface

Work down this ladder and stop at the first fit:

1. **A component fits:** use the `<zbk-*>` element and read its generated context
   file. Do not hand-author its rendered `.zbk-*` skeleton.
2. **Layout or presentation only:** compose token-bound utilities. Read the
   relevant `utilities-*.md` file and verify the exact class in compiled CSS.
3. **A design value changes:** edit the token source and rebuild. Do not add a
   selector to restyle a component instance.
4. **A named visual recipe repeats:** add or patch a token-only component
   variant. Keep behavior in attributes or component options.
5. **Nothing fits:** report the missing token, utility, component surface, or
   behavior contract. A local CSS/JS escape hatch is explicit debt, not an
   invisible substitute for a Zebkit primitive.

Read [references/tokens-and-variants.md](references/tokens-and-variants.md) for
token strata, authorable files, overlays, and variant delivery. Read
[references/setup-and-runtime.md](references/setup-and-runtime.md) when setup,
registration, imports, framework rendering, or upgrade behavior is involved.

## 3. Preserve the grammar

- Use custom elements as the authoring API. Rendered classes are compilation
  targets, not a second component API.
- Put native attributes and `aria-*` on the Zebkit element. The component
  forwards or relocates them to the native control.
- Put utilities, `class`, and `style` on the Zebkit element. The host is
  `display: contents`; Zebkit copies styling to the actual style root.
- Listen for native `click`, `input`, and `change`. Do not proxy them as custom
  events.
- Use `variant="ghost lg"` for registered visual recipes. Use `appearance` only
  to borrow another component's complete style contract.
- Use `toggles`, `shows`, and `hides` with bare target ids. Same-name radio
  panels require `toggles`; one-way verbs make panels accumulate.
- Keep raw visual values in primitive tokens only. Component tokens reference
  aliases; aliases reference primitives.
- Keep accessibility automatic. Fixed text containers, clipped overflow,
  untracked CSS, and bespoke interaction code can escape runtime scaling or
  rendered evidence even when they look correct at one viewport.

## 4. Avoid the silent traps

These failures are easy to ship because markup still renders or CSS fails as a
no-op:

- **A plausible class is not evidence.** Zebkit utilities are not Tailwind;
  `px-4` is not a substitute for a verified `padding-inline-*` class.
- **Package availability is not project availability.** Component filters,
  breakpoint filters, smart color emission, variants, and pruning change the
  final CSS surface.
- **Token and config edits do nothing until `zebkit build`.** Never patch
  compiled CSS, copied agent context, generated runtime modules, CEM output, or
  generated SCSS.
- **Runtime config must apply before components are defined.** Otherwise project
  options and custom variant vocabulary arrive after upgrade.
- **A new variant has two deliveries.** The build emits its CSS; the runtime must
  register its name. The generated runtime module handles both when used as
  instructed.
- **An unregistered component can look like missing content.** Zebkit hides
  custom elements until definition to prevent a flash of unstyled authored
  children. Confirm the definition import ran.
- **`id`, ARIA, class, and style move during upgrade.** Test public behavior
  after `updateComplete`; use `nativeControl` for native-only integrations, not
  internal selectors.
- **Static checking is deliberately honest about blind spots.** Dynamic class
  expressions are counted as unresolvable, not guessed. A zero-error report with
  unvisited or dynamic surface is not rendered proof.
- **Pruning cannot infer arbitrary runtime strings.** Safelist dynamic classes
  and variants or generate statically discoverable vocabulary.

## 5. Build, check, and verify

After token, variant, component-filter, option, or config changes:

```bash
npx zebkit build
```

After markup, component, utility, token-use, or style changes:

```bash
npx zebkit check --format=json
```

Fix every error and review warnings plus dynamic/unvisited counts. Before release,
or whenever behavior, focus, reflow, themes, states, or runtime accessibility is
material, run the application and use:

```bash
npx zebkit verify --url http://localhost:4173
```

Read [references/verification.md](references/verification.md) for evidence
boundaries, pruning, reports, and what a clean exit code does not prove.

## Source-of-truth order

1. This project's compiled CSS and `zebkit-a11y-input.json`
2. This project's `zebkit.config.json`, token/variant sources, and generated
   runtime config
3. The copied, project-filtered `llms.txt` and focused context files
4. Installed package CEM, editor data, default registries, and schemas
5. General documentation or training priors

When two layers disagree, stop and identify stale generated output, missing
runtime delivery, or a real upstream contract defect. Do not silently choose the
more convenient story.
