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

let generateWave;
let parsePath;
let interpolateWave;
let encodeWaveSeed;
let decodeWaveSeed;

before(async () => {
  ({ generateWave, parsePath, interpolateWave, encodeWaveSeed, decodeWaveSeed } = await import('../src/dynamowaves.js'));
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
    assert.ok(path.endsWith('Q 20 0, 0 0 L 20 0 L 20 10 Z'));
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

    const expected = 'M 0 80 L 0 40 Q 5 15, 20 40 Q 45 25, 60 50 L 100 80 Z';
    assert.equal(path, expected);
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
