import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

// No DOM shims on purpose: the module must import cleanly without
// HTMLElement/customElements globals (SSR support).

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

describe('lifecycle state handling', () => {
  it('recovers from mismatched point counts instead of deadlocking', () => {
    const width = 100;
    const height = 50;

    const wave = new DynamoWave();
    Object.assign(wave, {
      width,
      height,
      points: 4,
      variance: 2,
      vertical: false,
      random: () => 0.5,
      startEndZero: false,
      // Deliberately incompatible paths (3 vs 6 anchor points).
      currentPath: generateWave({ width, height, points: 3, variance: 2, random: () => 0.3 }),
      targetPath: generateWave({ width, height, points: 6, variance: 2, random: () => 0.7 }),
    });
    wave.dispatchEvent = () => {};
    wave.getAttribute = () => null;
    wave.setAttribute = () => {};

    let rendered = null;
    wave.path = {
      setAttribute(name, value) {
        if (name === 'd') rendered = value;
      },
      getAttribute(name) {
        return name === 'd' ? rendered : null;
      },
    };

    const originalRAF = globalThis.requestAnimationFrame;
    const originalWarn = console.warn;
    let frameCallback = null;
    globalThis.requestAnimationFrame = (cb) => {
      frameCallback = cb;
      return 1;
    };
    console.warn = () => {};

    try {
      wave.generateNewWave(800);
      frameCallback(1000); // first frame
      frameCallback(2000); // past duration: completes the morph
    } finally {
      globalThis.requestAnimationFrame = originalRAF;
      console.warn = originalWarn;
    }

    // The element must not be stranded mid-generation...
    assert.equal(wave.isGeneratingWave, false);
    assert.equal(wave.animationFrameId, null);
    // ...and must end up with tween-compatible regenerated paths.
    assert.ok(rendered.startsWith('M '));
    assert.equal(parsePath(wave.currentPath).length, parsePath(wave.targetPath).length);
  });

  it('refuses to start the play loop while a morph is in flight', () => {
    const wave = new DynamoWave();
    wave.isGeneratingWave = true;

    wave.play();

    assert.equal(wave.isAnimating, false);
  });

  it('cancels the animation loop on disconnect and flags it to resume', () => {
    const wave = new DynamoWave();
    wave.isAnimating = true;
    wave.animationFrameId = 7;

    const original = globalThis.cancelAnimationFrame;
    let cancelled = null;
    globalThis.cancelAnimationFrame = (id) => {
      cancelled = id;
    };

    try {
      wave.disconnectedCallback();
    } finally {
      globalThis.cancelAnimationFrame = original;
    }

    assert.equal(cancelled, 7);
    assert.equal(wave.isAnimating, false);
    assert.equal(wave.animationFrameId, null);
    assert.equal(wave.resumeOnConnect, true);
  });

  it('pause() cancels an in-flight morph and resets its timeline', () => {
    const wave = new DynamoWave();
    wave.isGeneratingWave = true;
    wave.animationFrameId = 3;
    wave.elapsedTime = 400;

    const original = globalThis.cancelAnimationFrame;
    let cancelled = null;
    globalThis.cancelAnimationFrame = (id) => {
      cancelled = id;
    };

    try {
      wave.pause();
    } finally {
      globalThis.cancelAnimationFrame = original;
    }

    assert.equal(cancelled, 3);
    assert.equal(wave.isGeneratingWave, false);
    assert.equal(wave.elapsedTime, 0);
    assert.equal(wave.animationFrameId, null);
  });
});

describe('attribute reactivity', () => {
  // Minimal element stub that mirrors the DOM contract the component relies
  // on: attribute storage that invokes attributeChangedCallback, innerHTML
  // capture, and querySelector for the svg/path references.
  function createStubWave(initialAttrs = {}) {
    const wave = new DynamoWave();
    const attributes = { ...initialAttrs };

    wave.style = {};
    wave.isConnected = true;
    wave.dispatchEvent = () => {};

    wave.getAttribute = (name) => (name in attributes ? attributes[name] : null);
    wave.setAttribute = (name, value) => {
      const old = name in attributes ? attributes[name] : null;
      attributes[name] = String(value);
      wave.attributeChangedCallback(name, old, String(value));
    };
    wave.removeAttribute = (name) => {
      if (!(name in attributes)) return;
      const old = attributes[name];
      delete attributes[name];
      wave.attributeChangedCallback(name, old, null);
    };

    let html = '';
    Object.defineProperty(wave, 'innerHTML', {
      set(value) {
        html = value;
      },
      get() {
        return html;
      },
    });

    let rendered = null;
    const pathStub = {
      setAttribute(name, value) {
        if (name === 'd') rendered = value;
      },
      getAttribute(name) {
        return name === 'd' ? rendered : null;
      },
    };
    wave.querySelector = (sel) => (sel === 'path' ? pathStub : { id: 'stub-svg' });

    return { wave, attributes, getHtml: () => html };
  }

  it('ignores attribute changes before the first render', () => {
    const { wave } = createStubWave();

    wave.setAttribute('data-wave-points', '9');

    assert.equal(wave.points, undefined);
  });

  it('re-renders with the new point count and refreshes the recorded seed', () => {
    const { wave, attributes } = createStubWave({ 'data-wave-points': '4' });
    wave.connectedCallback();
    assert.equal(parsePath(wave.currentPath).length, 4);

    wave.setAttribute('data-wave-points', '8');

    assert.equal(parsePath(wave.currentPath).length, 8);
    assert.equal(parsePath(wave.targetPath).length, 8);
    // The recorded seed snapshot must describe the new shape, not the old one.
    assert.equal(decodeWaveSeed(attributes['data-wave-seed']), wave.currentPath);
  });

  it('switches orientation when data-wave-face changes', () => {
    const { wave, getHtml } = createStubWave();
    wave.connectedCallback();
    assert.equal(wave.vertical, false);

    wave.setAttribute('data-wave-face', 'left');

    assert.equal(wave.vertical, true);
    assert.ok(getHtml().includes('0 0 160 1440'));
  });

  it('applies a new speed without touching a stopped wave', () => {
    const { wave } = createStubWave();
    wave.connectedCallback();

    wave.setAttribute('data-wave-speed', '3000');

    assert.equal(wave.duration, 3000);
    assert.equal(wave.isAnimating, false);
  });

  it('starts and stops the loop when data-wave-animate is toggled', () => {
    const { wave } = createStubWave();
    wave.connectedCallback();

    const originalRAF = globalThis.requestAnimationFrame;
    const originalCAF = globalThis.cancelAnimationFrame;
    globalThis.requestAnimationFrame = () => 42;
    globalThis.cancelAnimationFrame = () => {};

    try {
      wave.setAttribute('data-wave-animate', 'true');
      assert.equal(wave.isAnimating, true);

      wave.setAttribute('data-wave-animate', 'false');
      assert.equal(wave.isAnimating, false);
    } finally {
      globalThis.requestAnimationFrame = originalRAF;
      globalThis.cancelAnimationFrame = originalCAF;
    }
  });

  it('resumes a running loop after a geometry change', () => {
    const { wave } = createStubWave();
    wave.connectedCallback();

    const originalRAF = globalThis.requestAnimationFrame;
    const originalCAF = globalThis.cancelAnimationFrame;
    globalThis.requestAnimationFrame = () => 42;
    globalThis.cancelAnimationFrame = () => {};

    try {
      wave.play();
      assert.equal(wave.isAnimating, true);

      wave.setAttribute('data-wave-points', '7');

      assert.equal(wave.isAnimating, true);
      assert.equal(parsePath(wave.currentPath).length, 7);
    } finally {
      globalThis.requestAnimationFrame = originalRAF;
      globalThis.cancelAnimationFrame = originalCAF;
    }
  });

  it('re-renders from a user-provided seed change', () => {
    const { wave } = createStubWave();
    wave.connectedCallback();

    const other = createStubWave({ 'data-wave-points': '6' });
    other.wave.connectedCallback();

    wave.setAttribute('data-wave-seed', other.attributes['data-wave-seed']);

    assert.equal(wave.currentPath, other.wave.currentPath);
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

  it('treats seeds that decode to non-path garbage as PRNG seeds', () => {
    // "test" is decodable base64, but the result is not a wave path.
    assert.equal(decodeWaveSeed('test'), null);
    assert.equal(decodeWaveSeed(btoa('not a wave path')), null);
  });
});
