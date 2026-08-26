# Releasing Dynamowaves

Stable releases publish only from the reviewed `main` branch through the GitHub **Release** workflow. The workflow rebuilds the package and documentation, runs the runtime and source checks, rejects generated drift, and inspects the exact npm tarball before publication.

## Prepare a release

Update `package.json`, both version fields in `package-lock.json`, and `CHANGELOG.md` on a pull request. Keep an empty `Unreleased` section above a dated `## [x.y.z] - YYYY-MM-DD` heading. Merge only after the package and documentation changes are approved.

From GitHub Actions, run **Release** on `main` and enter the exact stable version. The workflow requires that version to match every local release contract. It then:

1. Runs the 27-test runtime/package-export suite.
2. Rebuilds the Rollup package, Zebkit outputs, and prerendered documentation.
3. Runs the Svelte and Zebkit source checks and rejects stale generated files.
4. Packs the seven-file npm artifact and retains it for 90 days.
5. Publishes through npm trusted publishing with OIDC and provenance—no npm token or OTP is stored in GitHub.
6. Creates the immutable `vX.Y.Z` tag and GitHub Release only after npm succeeds.

Retries are integrity-aware. An existing package with matching contents is accepted; different contents under the same immutable version fail. Do not bump a version solely because a later tag or GitHub Release step had a transient failure.

## One-time npm setup

The `dynamowaves` npm package trusts repository `mzebley/dynamowaves`, workflow `release.yml`, environment `npm`, with publish-only permission. GitHub must contain an environment named `npm`, and the workflow's publish job must retain `id-token: write`.

Changing the repository, workflow filename, environment, or publish permission requires an explicit npm trusted-publisher update. Do not add a long-lived npm token as a fallback.
