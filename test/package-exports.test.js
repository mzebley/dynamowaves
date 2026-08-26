import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import { runInNewContext } from 'node:vm';

const publicRuntimeExports = [
  'DynamoWave',
  'decodeWaveSeed',
  'encodeWaveSeed',
  'generateWave',
  'interpolateWave',
  'parsePath',
];

describe('package exports', () => {
  it('provides the complete public runtime API to ES modules', async () => {
    const module = await import('dynamowaves');

    assert.deepEqual(Object.keys(module).sort(), publicRuntimeExports);
  });

  it('provides the same public runtime API to CommonJS', () => {
    const require = createRequire(import.meta.url);
    const module = require('dynamowaves');

    assert.deepEqual(Object.keys(module).sort(), publicRuntimeExports);
  });

  it('keeps the direct-script global and custom-element registration', () => {
    const definitions = new Map();
    const context = {
      HTMLElement: class HTMLElement {},
      customElements: {
        define(name, constructor) {
          definitions.set(name, constructor);
        },
        get(name) {
          return definitions.get(name);
        },
      },
    };
    context.window = context;
    context.self = context;

    const bundle = readFileSync(new URL('../dist/dynamowaves.js', import.meta.url), 'utf8');
    runInNewContext(bundle, context);

    assert.deepEqual(Object.keys(context.Dynamowaves).sort(), publicRuntimeExports);
    assert.equal(definitions.get('dynamo-wave'), context.Dynamowaves.DynamoWave);
  });
});
