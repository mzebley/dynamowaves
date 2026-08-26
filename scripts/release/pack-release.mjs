import {
  appendFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const expectedFiles = [
  "README.md",
  "dist/dynamowaves.cjs",
  "dist/dynamowaves.d.ts",
  "dist/dynamowaves.esm.js",
  "dist/dynamowaves.js",
  "dist/dynamowaves.min.js",
  "package.json",
];

const outputDirectory = process.argv[2];
const releaseVersion = process.env.RELEASE_VERSION;

if (!outputDirectory || !releaseVersion) {
  throw new Error(
    "Usage: RELEASE_VERSION=x.y.z node scripts/release/pack-release.mjs OUTPUT_DIR",
  );
}

if (!/^\d+\.\d+\.\d+$/.test(releaseVersion)) {
  throw new Error(`Stable releases require x.y.z; received ${releaseVersion}.`);
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const changelog = readFileSync("CHANGELOG.md", "utf8");

for (const [source, version] of [
  ["package.json", packageJson.version],
  ["package-lock.json", packageLock.version],
  ['package-lock.json packages[""]', packageLock.packages?.[""]?.version],
]) {
  if (version !== releaseVersion) {
    throw new Error(
      `${source} contains ${version}, expected ${releaseVersion}.`,
    );
  }
}

const escapedVersion = releaseVersion.replaceAll(".", "\\.");
const releaseHeading = new RegExp(
  `^## \\[${escapedVersion}\\] - \\d{4}-\\d{2}-\\d{2}$`,
  "m",
);
if (!releaseHeading.test(changelog)) {
  throw new Error(
    `CHANGELOG.md is missing a dated ${releaseVersion} release heading.`,
  );
}

mkdirSync(outputDirectory, { recursive: true });
const packed = spawnSync(
  "npm",
  ["pack", "--ignore-scripts", "--json", "--pack-destination", outputDirectory],
  { encoding: "utf8" },
);

if (packed.status !== 0) {
  process.stderr.write(packed.stderr);
  process.exit(packed.status ?? 1);
}

const [artifact] = JSON.parse(packed.stdout);
const actualFiles = artifact.files.map(({ path }) => path).sort();
const expected = [...expectedFiles].sort();

if (artifact.name !== "dynamowaves" || artifact.version !== releaseVersion) {
  throw new Error(
    `Packed ${artifact.name}@${artifact.version}, expected dynamowaves@${releaseVersion}.`,
  );
}

if (JSON.stringify(actualFiles) !== JSON.stringify(expected)) {
  throw new Error(
    `Unexpected package contents.\nExpected: ${expected.join(", ")}\nActual: ${actualFiles.join(", ")}`,
  );
}

if (artifact.entryCount !== expected.length || artifact.bundled.length !== 0) {
  throw new Error(
    "Package entry count or bundled dependency boundary is incorrect.",
  );
}

const packReport = join(outputDirectory, "pack.json");
writeFileSync(packReport, `${JSON.stringify([artifact], null, 2)}\n`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `version=${releaseVersion}\ntarball=${join(outputDirectory, artifact.filename)}\nintegrity=${artifact.integrity}\n`,
  );
}

console.log(
  `Release package: ${artifact.id}, ${artifact.entryCount} files, ${artifact.size} bytes, ${artifact.integrity}`,
);
