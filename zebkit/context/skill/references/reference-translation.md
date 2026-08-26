# Translating visual references

Use references to ask what Zebkit can express, not as implementation templates. The output is an original token recipe, a native composition, or an explicit gap.

## Open a live workspace

Resolve the actual project surface before interpreting the reference:

```bash
node ./zebkit/context/skill/scripts/zebkit-reference-translator.mjs disclosure \
  --with accordion \
  --reference https://component.gallery/components/accordion/
```

Pass `--config` or `--css` when the project uses nonstandard paths. Use `--json` when another tool will consume the inventory. The command reports whether each component, variant, and token is present in the configured build, then prints a trait-map worksheet. A package-known token that is absent from compiled CSS is not available to that project yet.

## Complete a Dial It In agent brief

When the user supplies `*.agent-brief.json`, treat it as the portable handoff from Dial It In:

1. Read its `study.source` and inspect the URL visually with browser tooling, or inspect the separately attached original screenshot. A screenshot encoded inside JSON is provenance, not a substitute for rendering the image.
2. Use `componentSurface` as the available project vocabulary. Re-run the live workspace command when the brief is stale, incomplete, or disagrees with the compiled project.
3. Preserve the starter study's component, source, schema version, and kebab-case IDs. Replace placeholder prose and add one independently testable trait per decision.
4. Map only to tokens, variants, fixtures, states, and response targets present in the brief or refreshed live inventory. Leave rendered evidence `unproven` until Dial It In measures its iframe.
5. Return a completed raw `ComponentReferenceStudy` JSON object. Dial It In can also import a `zebkit-reference-study-bundle` exported by the workbench.

The brief does not authorize project edits. The consumer reviews, previews, proves, and applies the returned study in Dial It In.

## Translate, do not imitate

1. Record the source, access date, and the distinct capability worth studying.
2. Describe visible traits in neutral terms before reading implementation code: “leading plus/minus,” “connected square rows,” or “expanded surface inversion.”
3. Separate defining traits from incidental brand color, typography, content, and trade dress.
4. Keep the native Zebkit semantic tree fixed. Appearance does not authorize a DOM rewrite.
5. Map each trait independently with the vocabulary below.
6. Preview only supported traits as an original recipe. Record fidelity loss rather than smoothing it over.

| Classification         | Use when                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `native-token`         | A current component or semantic token owns the decision                             |
| `token-variant`        | A reusable token-only variant composes the treatment                                |
| `authored-slot`        | A declared slot is the explicit mechanism for presentational content                |
| `missing-visual-token` | Semantics are correct, but a reusable CSS/state decision is unreachable             |
| `missing-component`    | The reference contains a distinct semantic or behavioral pattern Zebkit lacks       |
| `semantic-conflict`    | Matching the effect would require incorrect structure, interaction, or reading order |

Record fidelity separately as `exact`, `native-equivalent`, `partial`, or `unsupported`. “Close enough” is not a classification.

## Require token responsiveness

A token name in generated context proves vocabulary, not control. Before calling a mapped visual trait native:

1. Select a fixture and state where the trait is visible.
2. Record the relevant computed property on the element that owns it.
3. Through Component Studio or a disposable overlay, give the mapped token a valid value that is deliberately different.
4. Wait for the real preview to settle and record the property again.
5. Pass only if the expected property changes and applicable interaction states remain usable.
6. Revert the probe before authoring the final recipe.

If nothing changes, investigate the mapping, selector/state, compiled output, token consumer, and cascade in that order. Page CSS is allowed to compose layout and original artwork. It is not evidence for a component trait, and a page declaration that owns the tested component property means the token-responsiveness claim failed. This is a focused proof attached to the chosen trait, not a site-wide CSS scanner.

## Finish the study

- Validate the token recipe against the current inspiration/workbench contract.
- Exercise every applicable state, keyboard path, target, contrast pair, reflow boundary, and reduced-motion condition.
- Export supported changes as a reversible recipe or variant transaction.
- Register unsupported defining traits in the capability registry.
- Preserve provenance and evidence in the benchmark record; never copy third-party CSS, markup, assets, names, or branding.

The disclosure/accordion pilot lives in `plans/expression-system/benchmarks/BENCH-DISCLOSURE-001` through `004`. It demonstrates exact, native-equivalent, partial, unsupported, token, variant, slot, and component-gap outcomes rather than forcing every reference into a success story.
