#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { bootstrap, readJson, slugifyFileSegment } from "./lib/resolve.mjs";

const args = process.argv.slice(2);
const valueFor = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const positional = args.find((arg, index) => !arg.startsWith("-") && args[index - 1]?.startsWith("-") !== true);
const selectedTheme = valueFor("--theme") ?? positional;
const state = bootstrap({ config: valueFor("--config") });

if (!state.configPath) {
  console.error("Zebkit config not found. Pass --config or run from a configured project.");
  process.exit(2);
}
if (state.config?.__error) {
  console.error(`Unable to read ${state.configPath}: ${state.config.__error}`);
  process.exit(2);
}

const theme = state.config?.theme ?? {};
const layers = [theme, ...(theme.overlays ?? [])];
const configDir = path.dirname(state.configPath);
const resolveFromConfig = (target) => path.isAbsolute(target) ? target : path.resolve(configDir, target);
const candidates = layers
  .filter((layer) => layer?.manifestPath)
  .map((layer) => {
    const manifestPath = resolveFromConfig(layer.manifestPath);
    const manifest = readJson(manifestPath);
    return {
      layer,
      manifestPath,
      manifest,
      name: layer.name ?? (manifest && !manifest.__error ? manifest.id : undefined),
    };
  });
if (!selectedTheme) {
  if (candidates.length === 0) {
    console.error("No theme layers with manifestPath are configured.");
    process.exit(2);
  }
  console.log(candidates.map((candidate) => candidate.name).filter(Boolean).sort().join("\n"));
  process.exit(0);
}

const candidate = candidates.find((entry) => entry.name === selectedTheme);
if (!candidate) {
  console.error(`Theme "${selectedTheme}" is not configured with a manifest. Available: ${candidates.map((entry) => entry.name).filter(Boolean).sort().join(", ") || "(none)"}.`);
  process.exit(2);
}
const { layer, manifestPath, manifest } = candidate;
if (!manifest || manifest.__error) {
  console.error(`Unable to read ${manifestPath}: ${manifest?.__error ?? "not found"}`);
  process.exit(2);
}

const configuredComponents = state.config?.components ?? {};
const configuredByName = new Map(
  Object.entries(configuredComponents).map(([name, entry]) => [name.trim().toLowerCase(), entry])
);
const componentNames = new Set([
  ...Object.keys(manifest.components ?? {}),
  ...configuredByName.keys(),
]);
const componentDefaults = {};
for (const name of [...componentNames].sort()) {
  const configured = configuredByName.get(name);
  if (configured === false) continue;
  const projectDefaults = configured && typeof configured === "object" && !Array.isArray(configured)
    ? configured.defaultVariants
    : undefined;
  const defaults = projectDefaults ?? manifest.components?.[name]?.defaultVariants;
  if (defaults !== undefined) componentDefaults[name] = defaults;
}

const destination = resolveFromConfig(layer.destinationPath ?? state.config?.tokens?.destinationPath ?? "./dist");
const result = {
  themeName: candidate.name,
  selector: layer === theme ? ":root" : layer.rootSelector?.trim() || `[data-zbk-theme="${candidate.name}"]`,
  tokenPath: layer.tokenPath ? resolveFromConfig(layer.tokenPath) : null,
  manifestPath,
  output: path.join(destination, `zbk-${slugifyFileSegment(candidate.name)}.theme.json`),
  componentDefaults,
  manifest,
};

if (args.includes("--json")) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

const relative = (target) => path.relative(configDir, target) || ".";
console.log(`Theme pack: ${manifest.label ?? candidate.name} (${manifest.status ?? "unknown"})`);
console.log(`Profile: ${manifest.creativeDirection?.profile ?? "missing"}`);
console.log(`Thesis: ${manifest.creativeDirection?.thesis ?? "missing"}`);
console.log(`Selector: ${result.selector} · color scheme ${layer.options?.colorScheme ?? manifest.options?.colorScheme ?? "inherit"}`);
console.log(`Tokens: ${result.tokenPath ? relative(result.tokenPath) : "package defaults only"}`);
console.log(`Manifest: ${relative(manifestPath)}`);
console.log(`Generated descriptor: ${relative(result.output)}`);
for (const component of [...componentNames].sort()) {
  const recommendation = manifest.components?.[component] ?? {};
  const recommended = (recommendation.recommendedVariants ?? []).join(", ") || "none";
  const defaults = componentDefaults[component]?.join(", ") || "none";
  console.log(`${component}: recommended ${recommended}; effective defaults ${defaults}`);
}
console.log(`Evidence (${manifest.evidence?.status ?? "unknown"}): ${(manifest.evidence?.required ?? []).join(", ")}`);
