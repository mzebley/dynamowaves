import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const PACKAGE_SPECIFIERS = ["zebkit/package.json", "@mzebley/zebkit/package.json"];
const PACKAGE_NAMES = new Set(["zebkit", "@mzebley/zebkit"]);

export function readJson(file) {
  if (!file) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    return { __error: error instanceof Error ? error.message : String(error) };
  }
}

export function findConfig(cwd = process.cwd(), explicit) {
  if (explicit) {
    const resolved = path.resolve(cwd, explicit);
    return fs.existsSync(resolved) ? resolved : null;
  }

  let dir = path.resolve(cwd);
  for (;;) {
    const candidate = path.join(dir, "zebkit.config.json");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function resolvePackageDir(cwd = process.cwd()) {
  try {
    const request = createRequire(path.join(path.resolve(cwd), "package.json"));
    for (const specifier of PACKAGE_SPECIFIERS) {
      try {
        return path.dirname(request.resolve(specifier));
      } catch {}
    }
  } catch {}

  let dir = path.resolve(cwd);
  for (;;) {
    const localPackage = readJson(path.join(dir, "package.json"));
    if (
      localPackage &&
      !localPackage.__error &&
      PACKAGE_NAMES.has(localPackage.name) &&
      (fs.existsSync(path.join(dir, "src", "components")) ||
        fs.existsSync(path.join(dir, "dist", "cli")))
    ) {
      return dir;
    }

    for (const packagePath of [
      path.join(dir, "node_modules", "zebkit"),
      path.join(dir, "node_modules", "@mzebley", "zebkit"),
    ]) {
      if (fs.existsSync(path.join(packagePath, "package.json"))) return packagePath;
    }

    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function slugifyFileSegment(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-");
}

export function resolveCssPath(cwd, config, explicit) {
  return resolveCss(cwd, config, explicit).path;
}

export function resolveCss(cwd, config, explicit) {
  if (explicit) {
    const resolved = path.resolve(cwd, explicit);
    return {
      path: fs.existsSync(resolved) ? resolved : null,
      status: fs.existsSync(resolved) ? "explicit" : "explicit-missing",
      candidates: [resolved],
    };
  }
  if (config?.__error) return { path: null, status: "config-invalid", candidates: [] };
  if (!config) return discoverCss(cwd);

  const tokens = config.tokens ?? {};
  const destination = tokens.destinationPath ?? "./dist";
  const theme = tokens.themeName ?? tokens.basePreset ?? "zebkit";
  const minifySuffix = tokens.minify === false ? "" : ".min";
  const candidate = path.resolve(
    cwd,
    destination,
    `zbk-${slugifyFileSegment(theme)}${minifySuffix}.css`
  );
  return {
    path: fs.existsSync(candidate) ? candidate : null,
    status: fs.existsSync(candidate) ? "configured" : "configured-missing",
    candidates: [candidate],
  };
}

function discoverCss(cwd) {
  const candidates = findCssCandidates(cwd);
  return {
    path: candidates.length === 1 ? candidates[0] : null,
    status: candidates.length === 1 ? "discovered" : candidates.length ? "ambiguous" : "not-found",
    candidates,
  };
}

function findCssCandidates(cwd, destination = ".") {
  const root = path.resolve(cwd, destination);
  const candidates = [];
  const skip = new Set(["node_modules", ".git", ".svelte-kit", ".next", "coverage"]);

  const walk = (dir, depth) => {
    if (depth > 4) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!skip.has(entry.name)) walk(full, depth + 1);
      } else if (/^zbk-.*(?:\.min)?\.css$/.test(entry.name) && !entry.name.includes(".pruned.")) {
        candidates.push(full);
      }
    }
  };
  walk(root, 0);
  return candidates.sort();
}

/**
 * Renders a candidate list at a length an agent will actually read. An ambiguous
 * result in a repository with several build outputs can run to dozens of paths;
 * the count still tells the reader how much was elided.
 */
export function summarizeCandidates(candidates, format = (value) => value, limit = 5) {
  const shown = candidates.slice(0, limit).map(format);
  const remaining = candidates.length - shown.length;
  return remaining > 0 ? `${shown.join(", ")} (and ${remaining} more)` : shown.join(", ");
}

export function indexCss(cssPath) {
  const css = fs.readFileSync(cssPath, "utf8");
  const classes = new Set();
  const properties = new Set();
  for (const match of css.matchAll(/\.((?:[\w-]|\\.)+)/g)) {
    classes.add(match[1].replace(/\\(.)/g, "$1"));
  }
  for (const match of css.matchAll(/(--zbk-[\w-]+)\s*:/g)) {
    properties.add(match[1]);
  }
  return { css, classes, properties };
}

export function resolveContextDir(cwd, packageDir, config) {
  return resolveContext(cwd, packageDir, config).dir;
}

export function resolveContext(cwd, packageDir, config) {
  const configured = config?.context?.path;
  if (configured && typeof configured === "string") {
    const candidate = path.resolve(cwd, configured);
    if (fs.existsSync(path.join(candidate, "llms.txt"))) {
      return { dir: candidate, source: "project" };
    }
  }
  const packageContext = packageDir && path.join(packageDir, "dist", "cli", "context");
  if (packageContext && fs.existsSync(path.join(packageContext, "llms.txt"))) {
    return { dir: packageContext, source: "package" };
  }
  return { dir: null, source: "not-found" };
}

export function resolveRuntimePath(cwd, config) {
  if (config?.runtime === false) return null;
  const configured =
    typeof config?.runtime?.path === "string" && config.runtime.path.trim()
      ? config.runtime.path.trim()
      : "./zebkit/zebkit.runtime.js";
  const candidate = path.resolve(cwd, configured);
  return fs.existsSync(candidate) ? candidate : null;
}

export function loadComponents(packageDir) {
  const snapshot = readJson(
    packageDir && path.join(packageDir, "dist", "cli", "defaults", "components.json")
  );
  if (Array.isArray(snapshot)) return snapshot.map(String).sort();

  const componentsDir = packageDir && path.join(packageDir, "src", "components");
  try {
    return fs
      .readdirSync(componentsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && entry.name !== "base")
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

export function loadVariants(packageDir) {
  const snapshot = readJson(
    packageDir && path.join(packageDir, "dist", "cli", "defaults", "variants.json")
  );
  return Array.isArray(snapshot) ? snapshot : [];
}

export function loadTokenDocs(packageDir) {
  const data = readJson(
    packageDir && path.join(packageDir, "dist", "editor", "zebkit.css-data.json")
  );
  const docs = new Map();
  for (const property of data?.properties ?? []) {
    if (typeof property?.name === "string") {
      docs.set(property.name, property.description ?? "");
    }
  }
  return docs;
}

export function loadCustomElements(packageDir) {
  const cem = readJson(packageDir && path.join(packageDir, "custom-elements.json"));
  const elements = new Map();
  for (const module of cem?.modules ?? []) {
    for (const declaration of module.declarations ?? []) {
      if (!declaration?.customElement || !declaration.tagName) continue;
      elements.set(declaration.tagName, {
        name: declaration.name,
        description: declaration.description ?? "",
        attributes: declaration.attributes ?? [],
        events: declaration.events ?? [],
        slots: declaration.slots ?? [],
      });
    }
  }
  return elements;
}

export function componentFilter(config, components) {
  const excluded = new Set();
  const included = new Set();
  const configured = new Map(
    Object.entries(config?.components ?? {}).map(([name, value]) => [
      String(name).trim().toLowerCase(),
      value,
    ])
  );
  for (const component of components) {
    if (configured.get(component.trim().toLowerCase()) === false) excluded.add(component);
    else included.add(component);
  }
  return { excluded, included };
}

export function bootstrap({ cwd = process.cwd(), config: explicitConfig, css } = {}) {
  const projectDir = path.resolve(cwd);
  const packageDir = resolvePackageDir(projectDir);
  const configPath = findConfig(projectDir, explicitConfig);
  const config = readJson(configPath);
  const cssResolution = resolveCss(projectDir, config, css);
  const contextResolution = resolveContext(projectDir, packageDir, config);
  const runtimePath = resolveRuntimePath(projectDir, config);
  return {
    projectDir,
    packageDir,
    configPath,
    config,
    cssPath: cssResolution.path,
    cssResolution,
    contextDir: contextResolution.dir,
    contextSource: contextResolution.source,
    runtimePath,
  };
}
