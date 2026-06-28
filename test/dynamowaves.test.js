import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

typeof globalThis.HTMLElement === 'undefined' && (globalThis.HTMLElement = class {});

typeof globalThis.customElements === 'undefined' &&
  (globalThis.customElements = {
    registry: new Map(),
    get(name) {
      return this.registry.get(name);
    },
    define(name, ctor) {
      this.registry.set(name, ctor);
    },
  });

let DynamoWave;
let generateWave;
let parsePath;
let interpolateWave;
let encodeWaveSeed;
let decodeWaveSeed;

before(async () => {
  ({ DynamoWave, generateWave, parsePath, interpolateWave, encodeWaveSeed, decodeWaveSeed } = await import('../src/dynamowaves.js'));
});

describe('generateWave', () => {
  it('creates a horizontal path with start and end anchored to height when requested', () => {
    const path = generateWave({
      width: 100,
      height: 50,
      points: 3,
      variance: 1,
      random: () => 0,
      startEndZero: true,
    });

    assert.ok(path.startsWith('M 0 50 L 0 50'));
    assert.ok(path.includes('Q 0 50, 25 47.5'));
    assert.ok(path.includes('Q 50 45, 75 47.5'));
    assert.ok(path.endsWith('Q 100 50, 100 50 L 100 50 Z'));
  });

  it('supports vertical waves while respecting start and end anchors', () => {
    const path = generateWave({
      width: 20,
      height: 10,
      points: 2,
      variance: 1,
      vertical: true,
      random: () => 0,
      startEndZero: true,
    });

    assert.ok(path.startsWith('M 20 10 L 20 10'));
    assert.ok(path.includes('Q 20 10, 20 5'));
    // With startEndZero the closing anchor sits at the base edge (x = width), not the corner.
    assert.ok(path.endsWith('Q 20 0, 20 0 L 20 0 L 20 10 Z'));
  });

  it('lets the closing anchor of a vertical wave vary in depth', () => {
    // A non-zero random pulls both anchors away from the base edge. The closing
    // anchor must keep its depth (x) instead of collapsing to the top-left corner.
    const path = generateWave({
      width: 20,
      height: 10,
      points: 2,
      variance: 1,
      vertical: true,
      random: () => 0.5,
    });

    // depth = width - width * 0.1 - 0.5 * (variance * width * 0.25) = 20 - 2 - 2.5 = 15.5
    assert.ok(path.startsWith('M 20 10 L 15.5 10'));
    assert.ok(path.endsWith('Q 15.5 0, 15.5 0 L 20 0 L 20 10 Z'));
    assert.ok(!path.includes(', 0 0'));
  });
});

describe('parsePath', () => {
  it('extracts control points and endpoints from quadratic commands', () => {
    const path = 'M 0 50 L 0 40 Q 10 20, 20 10 Q 30 5, 40 0 L 100 0 Z';
    const points = parsePath(path);

    assert.deepEqual(points, [
      { cpX: 10, cpY: 20, x: 20, y: 10 },
      { cpX: 30, cpY: 5, x: 40, y: 0 },
    ]);
  });
});

describe('interpolateWave', () => {
  it('interpolates between point sets', () => {
    const current = [
      { cpX: 0, cpY: 10, x: 20, y: 30 },
      { cpX: 40, cpY: 20, x: 60, y: 40 },
    ];
    const target = [
      { cpX: 10, cpY: 20, x: 30, y: 50 },
      { cpX: 50, cpY: 30, x: 70, y: 60 },
    ];

    const path = interpolateWave(current, target, 0.5, false, 80, 100);

    // The opening line reaches the first anchor (cpY), not the first segment's
    // endpoint, so it stays continuous with the curve that follows.
    const expected = 'M 0 80 L 0 15 Q 5 15, 20 40 Q 45 25, 60 50 L 100 80 Z';
    assert.equal(path, expected);
  });

  it('interpolates vertical waves without collapsing the closing anchor', () => {
    const current = [
      { cpX: 15, cpY: 10, x: 17, y: 5 },
      { cpX: 16, cpY: 0, x: 16, y: 0 },
    ];
    const target = [
      { cpX: 5, cpY: 10, x: 7, y: 5 },
      { cpX: 6, cpY: 0, x: 6, y: 0 },
    ];

    const path = interpolateWave(current, target, 0.5, true, 10, 20);

    // The opening line reaches the first anchor (cpX), not the first segment's
    // endpoint, so it stays continuous with the curve that follows.
    const expected = 'M 20 10 L 10 10 Q 10 10, 12 5 Q 11 0, 11 0 L 20 0 L 20 10 Z';
    assert.equal(path, expected);
    assert.ok(!path.includes(' L 0 0'));
  });

  it('anchors the first frame to the generated path so start-end-zero waves do not jump', () => {
    // Regression: the opening L command used the first segment's endpoint
    // (the midpoint between anchors 0 and 1) instead of the start anchor, so
    // the start anchor of a start-end-zero wave jumped off the base edge on
    // the very first animation frame. The progress-0 frame must reproduce the
    // path generateWave drew statically, for both orientations.
    for (const vertical of [false, true]) {
      const opts = {
        width: vertical ? 160 : 1440,
        height: vertical ? 1440 : 160,
        points: 6,
        variance: 3,
        vertical,
        startEndZero: true,
      };

      const startPath = generateWave({ ...opts, random: () => 0.5 });
      const targetPath = generateWave({ ...opts, random: () => 0.3 });
      const frameZero = interpolateWave(
        parsePath(startPath),
        parsePath(targetPath),
        0,
        vertical,
        opts.height,
        opts.width
      );

      assert.equal(frameZero, startPath);
    }
  });
});

describe('generateNewWave', () => {
  it('tweens from a clean timeline even after a play/pause left elapsed time behind', () => {
    const width = 100;
    const height = 50;
    const opts = { width, height, points: 4, variance: 2 };

    const currentPath = generateWave({ ...opts, random: () => 0.3 });
    const targetPath = generateWave({ ...opts, random: () => 0.7 });

    const start = parsePath(currentPath);
    const end = parsePath(targetPath);
    const progressZeroFrame = interpolateWave(start, end, 0, false, height, width);
    const progressOneFrame = interpolateWave(start, end, 1, false, height, width);

    const wave = new DynamoWave();
    Object.assign(wave, {
      width,
      height,
      points: opts.points,
      variance: opts.variance,
      vertical: false,
      random: () => 0.5,
      startEndZero: false,
      currentPath,
      targetPath,
    });
    wave.dispatchEvent = () => {};

    // Minimal path element that echoes back the last rendered "d".
    let rendered = currentPath;
    wave.path = {
      setAttribute(name, value) {
        if (name === 'd') rendered = value;
      },
      getAttribute(name) {
        return name === 'd' ? rendered : null;
      },
    };

    // Simulate the state left by play() then pause(): a large leftover elapsedTime.
    wave.elapsedTime = 100000;
    wave.startTime = null;

    const originalRAF = globalThis.requestAnimationFrame;
    let frameCallback = null;
    globalThis.requestAnimationFrame = (cb) => {
      frameCallback = cb;
      return 1;
    };

    try {
      wave.generateNewWave(800);
      // Render the first frame at an arbitrary timestamp.
      frameCallback(5000);
    } finally {
      globalThis.requestAnimationFrame = originalRAF;
    }

    // The first frame must be the START of the tween, not an instant snap to the end.
    assert.equal(rendered, progressZeroFrame);
    assert.notEqual(rendered, progressOneFrame);
  });
});

describe('wave seed encoding', () => {
  it('round-trips seeds even with non-breaking spaces removed', () => {
    const basePath = 'M 0 80 L 0 40   Q 5 15, 25 40';
    const encoded = encodeWaveSeed(basePath);
    const decoded = decodeWaveSeed(encoded);

    assert.equal(decoded, 'M 0 80 L 0 40 Q 5 15, 25 40');
  });

  it('returns null for invalid input', () => {
    assert.equal(decodeWaveSeed(''), null);
    assert.equal(decodeWaveSeed('%%%'), null);
  });
});
