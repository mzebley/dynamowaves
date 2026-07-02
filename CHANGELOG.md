# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries prior to the first entry below were reconstructed from git history and
release tags.

## [Unreleased]

## [2.1.4] - 2026-07-01

### Added

- Observed attributes: changing any supported `data-*` attribute after render
  now takes effect immediately. Geometry attributes (`data-wave-points`,
  `data-wave-variance`, `data-wave-face`, `data-start-end-zero`,
  `data-wave-seed`) re-render the wave, `data-wave-speed` retimes a running
  loop in place from the shape currently on screen, `data-wave-animate`
  starts/stops the loop, and `data-wave-observe` reconfigures the
  IntersectionObserver. A loop that was running resumes after a geometry
  change. Geometry changes also invalidate a recorded path snapshot in
  `data-wave-seed` (it is dropped and re-recorded for the new shape), while
  plain PRNG seed strings are kept.

### Fixed

- Importing the module in non-DOM environments (SSR, Node tests) no longer
  throws `HTMLElement is not defined`; the class extends a stub base class when
  the DOM is unavailable.
- Removing an animating element from the DOM now cancels its animation frame
  loop instead of animating a detached node forever. Re-attaching the element
  resumes the loop automatically.
- A point-count mismatch between current and target paths (e.g. a
  `data-wave-seed` recorded with a different `data-wave-points` value) no
  longer permanently deadlocks `play()` and `generateNewWave()`; both paths are
  regenerated, rendered, and animation continues.
- Seed strings that happen to be decodable base64 but are not wave paths
  (e.g. `data-wave-seed="test"`) no longer render a garbage path; they are now
  treated as deterministic PRNG seeds as intended.
- Calling `play()` while a `generateNewWave()` morph is in flight no longer
  starts a second competing animation loop; it is ignored until the morph
  completes (listen for `dynamo-wave-complete` to chain them).
- `pause()` now also cancels an in-flight `generateNewWave()` morph.
- The inner SVG no longer duplicates the host element's `id`; it gets a unique
  `-svg`-suffixed id, and the random fallback id can no longer be empty.
- `data-wave-speed="0"` and `play(0)` no longer silently fall back mid-parse;
  durations must be finite and positive, otherwise the default applies.

### Changed

- Path coordinates are rounded to 2 decimals, roughly halving the size of
  every rendered `d` attribute and encoded `data-wave-seed` value with no
  visual difference.

## [2.1.3] - 2026-06-28

### Fixed

- A wave's start anchor no longer jumps to a non-zero value on the first
  animation frame. `interpolateWave` anchored its opening line to the first
  curve segment's endpoint (the midpoint between anchors 0 and 1) instead of the
  start anchor, so the statically rendered path and the first tweened frame
  disagreed. Most visible with `data-start-end-zero="true"`, where the anchor
  visibly left the base edge; affected both horizontal and vertical waves.

## [2.1.2] - 2026-06-28

### Fixed

- Vertical waves (`data-wave-face="left"` / `"right"`) no longer pin the closing
  (top) anchor to the top-left corner. That anchor now varies in depth on each
  render, matching the start anchor and the behavior of horizontal waves.
  `data-start-end-zero="true"` now also anchors the closing point of vertical
  waves to the base edge as intended. Affects `generateWave` and
  `interpolateWave`.
- `generateNewWave()` no longer jumps straight to the target when a wave has
  already animated (notably while paused). A leftover `elapsedTime` from the
  play/pause resume timeline was carried into the new transition, starting it at
  full progress; the timeline is now reset and the tween is anchored to the shape
  currently on screen so regeneration always morphs smoothly.

### Changed

- Documentation site migrated to the [zebkit](https://github.com/mzebley/zebkit)
  CLI with prebuilt mark↓ content, a dark/light theme toggle, improved keyboard
  navigation, and clearer focus visibility. (Demo site only; no package changes.)

## [2.1.1] - 2025-11-19

### Added

- Exported the wave-seed helpers (`encodeWaveSeed`, `decodeWaveSeed`) from the
  bundle for reuse.
- Automated test suite covering the wave utilities.

### Changed

- SVG fill now uses `currentColor` so waves inherit text color by default.
- Host element respects the stylesheet `display` value and applies fill based on
  the parent element.
- Refined wave-seed generation and documented seed reuse.

## [2.1.0] - 2025-11-09

### Added

- `data-start-end-zero` attribute to anchor a wave's start and end points to the
  base edge (zero amplitude).
- Deterministic generation via `data-wave-seed` for reproducible waves.

### Changed

- Hardened wave generation against invalid inputs (point counts, variance, etc.).

## [2.0.1] - 2024-12-22

### Changed

- Rollup build improvements, better TypeScript typings, and assorted polish.

## [2.0.0] - 2024-12-11

### Changed

- Full rewrite around dynamically generated wave geometry (the
  `generateWave` / `interpolateWave` model), replacing the earlier static
  template approach.

## [1.0.0] - 2024-05-05

### Added

- Initial public release on npm: a dependency-free `<dynamo-wave>` custom element
  that renders animated, self-generating SVG waves. (Project originated in 2022;
  jQuery was dropped earlier that year, making it fully standalone.)
- `data-wave-*` configuration attributes for direction, point count, variance,
  speed, and animation.
- `data-wave-observe` attribute to regenerate waves via `IntersectionObserver`.

[Unreleased]: https://github.com/mzebley/dynamowaves/compare/v2.1.3...HEAD
[2.1.3]: https://github.com/mzebley/dynamowaves/compare/v2.1.2...v2.1.3
[2.1.2]: https://github.com/mzebley/dynamowaves/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/mzebley/dynamowaves/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/mzebley/dynamowaves/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/mzebley/dynamowaves/releases/tag/v2.0.1
