# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries prior to the first entry below were reconstructed from git history and
release tags.

## [Unreleased]

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

[Unreleased]: https://github.com/mzebley/dynamowaves/compare/v2.1.2...HEAD
[2.1.2]: https://github.com/mzebley/dynamowaves/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/mzebley/dynamowaves/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/mzebley/dynamowaves/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/mzebley/dynamowaves/releases/tag/v2.0.1
