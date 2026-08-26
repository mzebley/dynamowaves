#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  bootstrap,
  componentFilter,
  indexCss,
  loadComponents,
  loadCustomElements,
  loadTokenDocs,
  loadVariants,
  summarizeCandidates,
} from "./lib/resolve.mjs";

const argv = process.argv.slice(2);
const valueFor = (flag) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
};
const consumed = new Set();
for (const flag of ["--config", "--css", "--with", "--reference"]) {
  const index = argv.indexOf(flag);
  if (index >= 0) {
    consumed.add(index);
    consumed.add(index + 1);
  }
}
const positional = argv.filter(
  (argument, index) => !argument.startsWith("-") && !consumed.has(index),
);
const requested = [
  positional[0],
  ...(valueFor("--with") ?? "").split(","),
]
  .map((value) => value?.replace(/^zbk-/, "").trim())
  .filter(Boolean);

if (requested.length === 0) {
  console.error(
    "Usage: node zebkit-reference-translator.mjs <component> [--with related,components] " +
      "[--reference URL] [--config path] [--css path] [--json]",
  );
  process.exit(2);
}

const state = bootstrap({
  config: valueFor("--config"),
  css: valueFor("--css"),
});
if (!state.packageDir) {
  console.error(
    "Zebkit is not installed or resolvable here. Run from a Zebkit project root.",
  );
  process.exit(2);
}
if (valueFor("--config") && !state.configPath) {
  console.error(`Config not found: ${path.resolve(state.projectDir, valueFor("--config"))}`);
  process.exit(2);
}
if (valueFor("--css") && !state.cssPath) {
  console.error(`Compiled CSS not found: ${path.resolve(state.projectDir, valueFor("--css"))}`);
  process.exit(2);
}
if (state.config?.__error) {
  console.error(`Cannot read ${state.configPath}: ${state.config.__error}`);
  process.exit(2);
}

const components = loadComponents(state.packageDir);
const { excluded } = componentFilter(state.config, components);
const elements = loadCustomElements(state.packageDir);
const variants = loadVariants(state.packageDir);
const tokenDocs = loadTokenDocs(state.packageDir);
const cssIndex = state.cssPath
  ? indexCss(state.cssPath)
  : { css: "", classes: new Set(), properties: new Set() };
const unknown = requested.filter((component) => !components.includes(component));
if (unknown.length > 0) {
  console.error(
    `Unknown Zebkit component(s): ${unknown.join(", ")}. ` +
      `Available: ${components.join(", ")}.`,
  );
  process.exit(1);
}

const uniqueRequested = [...new Set(requested)];
const result = {
  schemaVersion: 1,
  reference: valueFor("--reference") ?? null,
  project: {
    package: relative(state.packageDir),
    config: relative(state.configPath),
    css: relative(state.cssPath),
    context: relative(state.contextDir),
    contextSource: state.contextSource,
    cssStatus: state.cssResolution.status,
  },
  components: uniqueRequested.map(componentRecord),
  classificationVocabulary: [
    "native-token",
    "token-variant",
    "authored-slot",
    "missing-visual-token",
    "missing-component",
    "semantic-conflict",
  ],
  fidelityVocabulary: ["exact", "native-equivalent", "partial", "unsupported"],
  tokenResponsiveness: {
    required: true,
    method: [
      "Choose the fixture and state that expose the mapped trait.",
      "Record the owned element's relevant computed property before the change.",
      "Apply a deliberately distinct, valid value through the mapped token in Component Studio or a disposable overlay.",
      "Wait for the preview to settle and record the same computed property again.",
      "Pass only when the expected property changes and the component remains usable in every applicable state.",
      "Revert the probe. A no-change result is a mapping or framework gap to investigate, not proof of support.",
    ],
  },
};

if (argv.includes("--json")) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

renderMarkdown(result);

function componentRecord(component) {
  const tag = `zbk-${component}`;
  const declaration = elements.get(tag);
  const prefix = `--zbk-${component}-`;
  const tokens = [...tokenDocs.entries()]
    .filter(([name]) => name.startsWith(prefix))
    .map(([name, description]) => ({
      name,
      description: oneLine(description),
      emitted: state.cssPath ? cssIndex.properties.has(name) : null,
      consumed: state.cssPath ? varUseCount(cssIndex.css, name) > 0 : null,
      useCount: state.cssPath ? varUseCount(cssIndex.css, name) : null,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
  const contextPath = state.contextDir && path.join(state.contextDir, `${tag}.md`);
  return {
    component,
    tag,
    included: !excluded.has(component),
    description: oneLine(declaration?.description ?? ""),
    attributes: (declaration?.attributes ?? []).map((attribute) => ({
      name: attribute.name,
      description: oneLine(attribute.description ?? ""),
    })),
    slots: (declaration?.slots ?? []).map((slot) => ({
      name: slot.name || "default",
      description: oneLine(slot.description ?? ""),
    })),
    variants: variants
      .filter((variant) => variant.component === component)
      .map((variant) => ({
        name: variant.name,
        axis: variant.axis ?? null,
        description: oneLine(variant.description ?? ""),
        emitted: state.cssPath
          ? cssIndex.classes.has(
              String(variant.className ?? `zbk-${component}--${variant.name}`).replace(/^\./, ""),
            )
          : null,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    tokens,
    context: contextPath && fs.existsSync(contextPath) ? relative(contextPath) : null,
  };
}

function renderMarkdown(data) {
  console.log("# Zebkit reference translation workspace\n");
  if (data.reference) console.log(`Reference: ${data.reference}\n`);
  console.log(`- Package: ${data.project.package}`);
  console.log(`- Config: ${data.project.config}`);
  console.log(`- Compiled CSS: ${data.project.css}`);
  console.log(`- Generated context: ${data.project.context} (${data.project.contextSource})`);
  if (!state.cssPath) {
    const detail = state.cssResolution.status === "ambiguous"
      ? `ambiguous candidates: ${summarizeCandidates(state.cssResolution.candidates, relative)}`
      : state.cssResolution.status === "configured-missing"
        ? `configured artifact missing: ${relative(state.cssResolution.candidates[0])}`
        : "no compiled CSS found";
    console.log(`- Warning: ${detail}. Build or pass --css before claiming project support.`);
  }

  for (const component of data.components) {
    console.log(`\n## <${component.tag}>`);
    console.log(`\n${component.description || "No component description is available."}`);
    console.log(`\n- Project status: ${component.included ? "included" : "EXCLUDED"}`);
    console.log(`- Focused context: ${component.context ?? "not found"}`);
    console.log(`- Attributes: ${component.attributes.map((entry) => entry.name).join(", ") || "none"}`);
    console.log(`- Slots: ${component.slots.map((entry) => entry.name).join(", ") || "none"}`);
    console.log(
      `- Variants: ${component.variants.map((entry) => `${entry.name}${entry.axis ? ` (${entry.axis})` : ""}${entry.emitted === false ? " [not emitted]" : ""}`).join(", ") || "none"}`,
    );
    console.log("\n| Token | Project CSS | Runtime consumer | Intent |");
    console.log("| --- | --- | --- | --- |");
    for (const token of component.tokens) {
      console.log(
        `| \`${token.name}\` | ${truth(token.emitted)} | ${truth(token.consumed)} | ${escapeCell(token.description)} |`,
      );
    }
  }

  console.log("\n## Neutral trait map\n");
  console.log("Describe what is visible before choosing Zebkit vocabulary. Add one row per trait; do not merge an unsupported detail into a supported one.\n");
  console.log("| Importance | Area | Neutral observed trait | Classification | Zebkit artifact or gap | Fidelity | Evidence |");
  console.log("| --- | --- | --- | --- | --- | --- | --- |");
  console.log("| defining/supporting | geometry/state/etc. |  | native-token/etc. |  | exact/etc. |  |");
  console.log("\nClassification: " + data.classificationVocabulary.map((value) => `\`${value}\``).join(", ") + ".");
  console.log("Fidelity: " + data.fidelityVocabulary.map((value) => `\`${value}\``).join(", ") + ".");

  console.log("\n## Token-responsiveness proof\n");
  for (const [index, step] of data.tokenResponsiveness.method.entries()) {
    console.log(`${index + 1}. ${step}`);
  }
  console.log("\nStatic `emitted` and `consumed` results are orientation only. They do not replace this rendered before/after proof.");
}

function relative(file) {
  return file ? path.relative(state.projectDir, file) || "." : "(not found)";
}

function oneLine(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function escapeCell(value) {
  return oneLine(value).replace(/\|/g, "\\|");
}

function truth(value) {
  if (value === null) return "unconfirmed";
  return value ? "yes" : "no";
}

function varUseCount(css, token) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return [...css.matchAll(new RegExp(`var\\(\\s*${escaped}(?:\\s*[,)]|\\s*$)`, "g"))].length;
}
