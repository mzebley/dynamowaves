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
for (const flag of ["--config", "--css"]) {
  const index = argv.indexOf(flag);
  if (index >= 0) {
    consumed.add(index);
    consumed.add(index + 1);
  }
}
const flags = new Set(argv.filter((arg) => arg.startsWith("--list-")));
const queries = argv.filter((arg, index) => !consumed.has(index) && !flags.has(arg));
const state = bootstrap({
  config: valueFor("--config"),
  css: valueFor("--css"),
});

if (valueFor("--config") && !state.configPath) {
  console.error(`Config not found: ${path.resolve(state.projectDir, valueFor("--config"))}`);
  process.exit(2);
}
if (valueFor("--css") && !state.cssPath) {
  console.error(`Compiled CSS not found: ${path.resolve(state.projectDir, valueFor("--css"))}`);
  process.exit(2);
}
if (!state.packageDir) {
  console.error(
    "Zebkit is not installed or resolvable here. Check package.json and run from the project root."
  );
  process.exit(2);
}
if (state.config?.__error) {
  console.error(`Cannot read ${state.configPath}: ${state.config.__error}`);
  process.exit(2);
}

const rel = (file) =>
  file ? path.relative(state.projectDir, file) || "." : "(not found)";
const cssIndex = state.cssPath
  ? indexCss(state.cssPath)
  : { classes: new Set(), properties: new Set() };
const components = loadComponents(state.packageDir);
const { excluded } = componentFilter(state.config, components);
const elements = loadCustomElements(state.packageDir);
const variants = loadVariants(state.packageDir);
const tokenDocs = loadTokenDocs(state.packageDir);

console.log(`package : ${rel(state.packageDir)}`);
console.log(`config  : ${rel(state.configPath)}`);
console.log(`css     : ${rel(state.cssPath)}`);
console.log(`context : ${rel(state.contextDir)}`);
if (state.contextSource === "package") {
  console.log("          ! package reference only; context is unfiltered and cannot confirm project-specific truth.");
}
if (!state.cssPath) {
  const detail = state.cssResolution.status === "ambiguous"
    ? `ambiguous CSS candidates: ${summarizeCandidates(state.cssResolution.candidates, rel)}; pass --css or configure tokens`
    : state.cssResolution.status === "configured-missing"
      ? `configured CSS missing: ${rel(state.cssResolution.candidates[0])}; rebuild instead of selecting another theme`
      : "no compiled CSS found";
  console.log(`          ! ${detail}; package vocabulary can be shown, but project availability cannot be confirmed.`);
}
console.log("");

if (flags.has("--list-components")) {
  for (const component of components) {
    const tag = `zbk-${component}`;
    const status = excluded.has(component) ? "excluded by config" : "included";
    const candidateDoc = state.contextDir && path.join(state.contextDir, `${tag}.md`);
    const doc = candidateDoc && fs.existsSync(candidateDoc) ? candidateDoc : null;
    console.log(`${tag.padEnd(24)} ${status.padEnd(18)} ${doc ? rel(doc) : ""}`);
  }
  if (queries.length === 0) process.exit(0);
}

if (queries.length === 0) {
  console.log(
    "Usage: node zebkit-lookup.mjs <class|--zbk-token|component|component:variant> [...]\n" +
      "       node zebkit-lookup.mjs --list-components\n" +
      "       append '-' or '*' for a prefix search"
  );
  process.exit(0);
}

let missing = 0;
let unconfirmed = 0;

for (const rawQuery of queries) {
  const query = rawQuery.replace(/^<|>$/g, "");
  console.log(`── ${rawQuery}`);

  if (query.endsWith("-") || query.endsWith("*")) {
    const prefix = query.replace(/\*$/, "");
    const classHits = [...cssIndex.classes].filter((value) => value.startsWith(prefix)).sort();
    const propertyHits = [...cssIndex.properties]
      .filter((value) => value.startsWith(prefix))
      .sort();
    const documentedHits = [...tokenDocs.keys()]
      .filter((value) => value.startsWith(prefix))
      .sort();
    if (classHits.length) {
      console.log(`   classes in project (${classHits.length}) ${classHits.join(" ")}`);
    }
    if (propertyHits.length) {
      console.log(
        `   tokens in project (${propertyHits.length}) ${propertyHits.join(" ")}`
      );
    } else if (documentedHits.length) {
      console.log(
        `   package tokens not confirmed in project (${documentedHits.length}) ${documentedHits.join(
          " "
        )}`
      );
    }
    if (!classHits.length && !propertyHits.length && !documentedHits.length) {
      console.log(`   nothing starts with "${prefix}"`);
      missing++;
    }
    continue;
  }

  if (query.startsWith("--zbk-")) {
    const documented = tokenDocs.has(query);
    if (!state.cssPath) {
      console.log(
        `   token   ${documented ? "known to the package" : "not in package editor data"}`
      );
      console.log("   project cannot confirm without compiled CSS; build and re-run.");
      unconfirmed++;
    } else if (cssIndex.properties.has(query)) {
      console.log("   token   defined in this project's compiled CSS");
    } else {
      console.log("   token   NOT defined in this project's compiled CSS");
      const near = nearest(cssIndex.properties, query);
      if (near.length) console.log(`   near    ${near.join(" ")}`);
      console.log("   fix     rebuild or choose an emitted token; undefined var() use can fail silently.");
      missing++;
    }
    if (documented) console.log(`   doc     ${tokenDocs.get(query)}`);
    continue;
  }

  if (query.includes(":") && !query.startsWith("http")) {
    const [component, variantName] = query.split(":", 2);
    const tag = component.startsWith("zbk-") ? component : `zbk-${component}`;
    const componentName = tag.slice(4);
    const entry = variants.find(
      (variant) => variant.component === componentName && variant.name === variantName
    );
    const className = `zbk-${componentName}--${variantName}`;
    console.log(`   variant ${entry ? "known to the package registry" : "not in package defaults"}`);
    if (entry?.axis) console.log(`   axis    ${entry.axis}`);
    if (entry?.description) console.log(`   doc     ${entry.description}`);
    if (excluded.has(componentName)) {
      console.log("   project component is excluded by zebkit.config.json");
      missing++;
    } else if (!state.cssPath) {
      console.log(`   class   .${className} cannot be confirmed without compiled CSS`);
      unconfirmed++;
    } else if (cssIndex.classes.has(className)) {
      console.log(`   class   .${className} is emitted in this project`);
    } else {
      console.log(`   class   .${className} is NOT emitted in this project`);
      missing++;
    }
    continue;
  }

  const componentName = query.startsWith("zbk-") ? query.slice(4) : query;
  if (components.includes(componentName)) {
    const tag = `zbk-${componentName}`;
    const cem = elements.get(tag);
    console.log(`   element <${tag}> ${excluded.has(componentName) ? "is EXCLUDED by config" : "is included"}`);
    if (cem?.description) console.log(`   doc     ${oneLine(cem.description)}`);
    if (cem?.attributes?.length) {
      console.log(`   attrs   ${cem.attributes.map((attribute) => attribute.name).join(" ")}`);
    }
    const candidateDoc = state.contextDir && path.join(state.contextDir, `${tag}.md`);
    const contextDoc =
      candidateDoc && fs.existsSync(candidateDoc) ? candidateDoc : null;
    if (contextDoc) console.log(`   context ${rel(contextDoc)}`);
    const names = variants
      .filter((variant) => variant.component === componentName)
      .map((variant) => variant.name)
      .sort();
    if (names.length) console.log(`   package variants ${names.join(" ")}`);
    if (excluded.has(componentName)) missing++;
    continue;
  }

  if (!state.cssPath) {
    console.log("   class   cannot verify without compiled CSS; build and re-run.");
    unconfirmed++;
  } else if (cssIndex.classes.has(query)) {
    console.log("   class   present in this project's compiled CSS");
  } else {
    console.log("   class   NOT present in this project's compiled CSS");
    const near = nearest(cssIndex.classes, query);
    if (near.length) console.log(`   near    ${near.join(" ")}`);
    missing++;
  }
}

if (missing > 0) {
  console.log(
    `\n${missing} lookup(s) failed against the project. Do not ship those names; choose emitted vocabulary or report the gap.`
  );
  process.exit(1);
}
if (unconfirmed > 0) {
  console.log(
    `\n${unconfirmed} lookup(s) could not be confirmed because compiled CSS is unavailable.`
  );
  process.exit(2);
}

function nearest(values, query) {
  const normalized = query.replace(/^--/, "");
  const stem = normalized.split("-").slice(0, 2).join("-");
  return [...values]
    .filter((value) => value.replace(/^--/, "").startsWith(stem))
    .sort()
    .slice(0, 16);
}

function oneLine(value) {
  return String(value).replace(/\s+/g, " ").trim();
}
