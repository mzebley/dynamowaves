#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {
  bootstrap,
  componentFilter,
  indexCss,
  loadComponents,
  readJson,
  summarizeCandidates,
} from "./lib/resolve.mjs";

const args = process.argv.slice(2);
const valueFor = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

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
const projectPackage = readJson(path.join(state.projectDir, "package.json"));
const declared = Boolean(
  projectPackage?.dependencies?.zebkit ||
    projectPackage?.devDependencies?.zebkit ||
    projectPackage?.peerDependencies?.zebkit ||
    projectPackage?.dependencies?.["@mzebley/zebkit"] ||
    projectPackage?.devDependencies?.["@mzebley/zebkit"] ||
    projectPackage?.peerDependencies?.["@mzebley/zebkit"]
);

if (!declared && !state.configPath && !state.packageDir) process.exit(0);

const rel = (file) =>
  file ? path.relative(state.projectDir, file) || "." : "(not found)";
const lines = ["This project uses Zebkit."];

if (state.packageDir) {
  const pkg = readJson(path.join(state.packageDir, "package.json"));
  lines.push(
    `Package: ${rel(state.packageDir)}${pkg?.version ? ` (v${pkg.version})` : ""}`
  );
} else {
  lines.push("Package: not resolved. Install zebkit before relying on package contracts.");
}

if (!state.configPath) {
  lines.push("Config: not found. Run `npx zebkit init` before authoring against a project build.");
} else if (state.config?.__error) {
  lines.push(`Config: ${rel(state.configPath)} could not be read: ${state.config.__error}`);
  console.error(lines.join("\n"));
  process.exit(2);
} else {
  const tokens = state.config?.tokens ?? {};
  const components = loadComponents(state.packageDir);
  const { excluded, included } = componentFilter(state.config, components);
  const breakpoints = tokens.extendedTokens?.breakpoints ?? true;
  lines.push(`Config: ${rel(state.configPath)}`);
  lines.push(
    `Theme: ${tokens.themeName ?? tokens.basePreset ?? "zebkit"} from ${
      tokens.basePreset ?? "default"
    } · tokens ${tokens.tokenPath ?? "(package defaults only)"} · destination ${
      tokens.destinationPath ?? "./dist"
    }`
  );
  lines.push(
    `Build surface: ${included.size} included component(s), ${excluded.size} excluded · breakpoints ${JSON.stringify(
      breakpoints
    )} · colors ${tokens.extendedTokens?.colors ?? "all"} · prune ${
      tokens.prune?.enabled ? "enabled" : "off"
    }`
  );
  if (excluded.size) lines.push(`Excluded components: ${[...excluded].sort().join(", ")}`);
}

if (state.cssPath) {
  const index = indexCss(state.cssPath);
  lines.push(
    `Compiled CSS: ${rel(state.cssPath)} · ${index.classes.size} class(es), ${
      index.properties.size
    } --zbk-* properties. This is final authority for the project build.`
  );
  const evidencePath = path.join(path.dirname(state.cssPath), "zebkit-a11y-input.json");
  lines.push(
    fs.existsSync(evidencePath)
      ? `Static evidence: ${rel(evidencePath)}`
      : "Static evidence: not found beside CSS; rebuild before treating `zebkit check` as current."
  );
} else {
  const css = state.cssResolution;
  if (css.status === "ambiguous") {
    lines.push(
      `Compiled CSS: ambiguous; ${css.candidates.length} candidates including ${summarizeCandidates(css.candidates, rel)}. Pass \`--css\` or configure tokens before lookup or check.`
    );
  } else if (css.status === "configured-missing") {
    lines.push(
      `Compiled CSS: configured artifact missing at ${rel(css.candidates[0])}. Run \`npx zebkit build\`; a different theme will not be selected.`
    );
  } else {
    lines.push("Compiled CSS: not found. Run `npx zebkit build` before class/token lookup or check.");
  }
}

lines.push(
  state.runtimePath
    ? `Runtime config: ${rel(state.runtimePath)} — apply it before defining components.`
    : state.config?.runtime === false
      ? "Runtime config: explicitly disabled; the consumer owns option and custom-variant registration."
      : "Runtime config: not found; run `npx zebkit pull` or `npx zebkit init`."
);
lines.push(
  state.contextDir
    ? state.contextSource === "package"
      ? `Agent context: ${rel(state.contextDir)}/llms.txt — package reference only; it is unfiltered and not project-specific truth.`
      : `Agent context: ${rel(state.contextDir)}/llms.txt — load only the task-relevant component/utility files.`
    : "Agent context: not found; enable context.path and run `npx zebkit pull`."
);
lines.push(
  "Rules: author <zbk-*> elements, compose verified token-bound utilities, edit token/variant source rather than generated CSS, and preserve native semantics."
);
lines.push(
  "Finish: `npx zebkit build` after source/config changes, then `npx zebkit check --format=json`; use `zebkit verify` for rendered behavior and accessibility."
);

console.log(lines.join("\n"));
