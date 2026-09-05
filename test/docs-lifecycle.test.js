import assert from 'node:assert/strict';
import { getEventListeners } from 'node:events';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

async function loadHelper(path) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
}
const { whenPageSettled } = await loadHelper('../src/lib/pageSettled.ts');
const { waitForWave } = await loadHelper('../src/lib/waitForWave.ts');

function environment(t, { hidden = false, readyState = 'complete', fonts } = {}) {
  const window = new EventTarget();
  const document = Object.assign(new EventTarget(), { hidden, readyState, fonts });
  const frames = new Map();
  const timers = new Map();
  let id = 0;
  const values = {
    window, document,
    requestAnimationFrame: (callback) => { frames.set(++id, callback); return id; },
    cancelAnimationFrame: (key) => frames.delete(key),
    setTimeout: (callback) => { timers.set(++id, callback); return id; },
    clearTimeout: (key) => timers.delete(key),
  };
  for (const [key, value] of Object.entries(values)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    t.after(() => original ? Object.defineProperty(globalThis, key, original) : delete globalThis[key]);
  }
  return { window, document, frames, timers, expire: () => [...timers.values()][0]() };
}

test('page settling abort cleans loading, frame and hidden visibility waits', async (t) => {
  for (const readyState of ['loading', 'complete']) {
    for (const hidden of [false, true]) {
      await t.test(`${readyState}, hidden=${hidden}`, async (t) => {
        const env = environment(t, { readyState, hidden });
        const controller = new AbortController();
        const result = whenPageSettled({ signal: controller.signal });
        await Promise.resolve();
        if (hidden) env.expire();
        controller.abort();
        assert.equal(await result, false);
        assert.equal(env.frames.size, 0);
        assert.equal(env.timers.size, 0);
        assert.equal(getEventListeners(env.window, 'load').length, 0);
        assert.equal(getEventListeners(env.document, 'visibilitychange').length, 0);
        assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
      });
    }
  }
});

test('settling timeout preserves visibility policy and ignores late fonts', async (t) => {
  let resolveFonts;
  const env = environment(t, { hidden: true, fonts: { ready: new Promise((resolve) => { resolveFonts = resolve; }) } });
  const result = whenPageSettled();
  env.expire();
  resolveFonts();
  await Promise.resolve();
  assert.equal(env.frames.size, 0);
  assert.equal(getEventListeners(env.document, 'visibilitychange').length, 1);
  env.document.hidden = false;
  env.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(await result, true);
  assert.equal(getEventListeners(env.document, 'visibilitychange').length, 0);
  const immediate = whenPageSettled({ requireVisible: false });
  env.document.hidden = true;
  env.expire();
  assert.equal(await immediate, true);
});

test('completion waits dispose listeners and timers on complete, timeout, abort and throw', async (t) => {
  const env = environment(t);
  for (const outcome of ['complete', 'timeout', 'aborted', 'throw']) {
    const wave = new EventTarget();
    const controller = new AbortController();
    const result = waitForWave(wave, () => {
      if (outcome === 'complete') wave.dispatchEvent(new Event('dynamo-wave-complete'));
      if (outcome === 'throw') throw new Error('failed');
    }, 100, controller.signal);
    if (outcome === 'timeout') env.expire();
    if (outcome === 'aborted') controller.abort();
    if (outcome === 'throw') await assert.rejects(result, /failed/);
    else assert.equal(await result, outcome);
    assert.equal(env.timers.size, 0);
    assert.equal(getEventListeners(wave, 'dynamo-wave-complete').length, 0);
    assert.equal(getEventListeners(controller.signal, 'abort').length, 0);
  }
});
