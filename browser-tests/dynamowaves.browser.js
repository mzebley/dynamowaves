import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Separate from node --test: CI must install Chromium before running this file.
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ reducedMotion: 'no-preference' });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('about:blank');
  await page.addScriptTag({ content: await readFile(new URL('../dist/dynamowaves.js', import.meta.url), 'utf8') });
  await page.evaluate(() => customElements.whenDefined('dynamo-wave'));
  const setMotion = async (reducedMotion) => {
    await page.evaluate(() => {
      window.motionChange = new Promise((resolve) => {
        matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => resolve(), { once: true });
      });
    });
    await page.emulateMedia({ reducedMotion });
    await page.evaluate(() => window.motionChange);
  };
  const result = await page.evaluate(() => {
    let now = 0, sequence = 0;
    const frames = new Map();
    window.requestAnimationFrame = (callback) => { frames.set(++sequence, callback); return sequence; };
    window.cancelAnimationFrame = (id) => frames.delete(id);
    performance.now = () => now;
    const tick = (time) => { now = time; const pending = [...frames.values()]; frames.clear(); pending.forEach((callback) => callback(time)); };
    const make = (attributes = {}) => {
      const wave = document.createElement('dynamo-wave');
      for (const [name, value] of Object.entries(attributes)) wave.setAttribute(name, value);
      document.body.append(wave);
      return wave;
    };
    const outcomes = {};
    const malicious = make({ id: 'x" onclick="window.injected=true', 'data-wave-seed': btoa('M 0 160 L 0 100 Q 0 100, 200 100 Q 300 100, 1440 100 L 1440 160 Z" onclick="window.injected=true') });
    outcomes.safe = malicious.children.length === 1 && malicious.querySelectorAll('[onclick]').length === 0 && !malicious.querySelector('path').getAttribute('d').includes('onclick');
    malicious.remove();
    const wave = make();
    wave.play(1000); tick(0); tick(200); wave.pause();
    const firstElapsed = wave.elapsedTime;
    wave.play(); tick(500); tick(700); wave.pause();
    outcomes.elapsed = [firstElapsed, wave.elapsedTime];
    wave.generateNewWave(1000); tick(800); tick(1100); wave.pause();
    const partial = wave.path.getAttribute('d');
    wave.play(1000); tick(1300);
    outcomes.continuous = partial === wave.path.getAttribute('d');
    wave.remove(); wave.play(); wave.generateNewWave();
    outcomes.detached = frames.size === 0 && !wave.isAnimating && !wave.isGeneratingWave;
    wave.pause(); wave.setAttribute('data-wave-points', '8'); document.body.append(wave);
    outcomes.reconnected = wave.path.getAttribute('d').match(/ Q /g).length === 8 && !wave.isAnimating;
    wave.remove();
    const preconnect = document.createElement('dynamo-wave');
    preconnect.setAttribute('data-wave-animate', 'true'); preconnect.pause(); document.body.append(preconnect);
    outcomes.preconnectPause = !preconnect.isAnimating;
    preconnect.play(); preconnect.remove(); preconnect.setAttribute('data-wave-animate', 'false'); document.body.append(preconnect);
    outcomes.detachedOptout = !preconnect.isAnimating;
    preconnect.remove();
    for (const duration of [NaN, Infinity, -Infinity, -4]) {
      const invalid = make(); invalid.generateNewWave(duration); tick(now + 1); tick(now + 1000);
      outcomes[`duration:${duration}`] = !invalid.isGeneratingWave && !/NaN|Infinity/.test(invalid.path.getAttribute('d'));
      invalid.remove();
    }
    const auto = make({ 'data-wave-animate': 'true' }); auto.pause(); auto.setAttribute('data-wave-points', '9');
    outcomes.pausedGeometry = !auto.isAnimating;
    auto.remove();
    const extreme = make({ 'data-wave-points': '1000000000', 'data-wave-variance': '1e308' });
    outcomes.finiteGeometry = !/NaN|Infinity/.test(extreme.path.getAttribute('d')) && extreme.path.getAttribute('d').match(/ Q /g).length === 1000;
    extreme.remove();
    const deferred = document.createElement('dynamo-wave'); deferred.play(1200);
    outcomes.preconnectIdle = frames.size === 0;
    document.body.append(deferred);
    outcomes.preconnectResume = deferred.isAnimating && deferred.loopDuration === 1200;
    deferred.remove();
    for (let i = 0; i < 100; i++) {
      const transient = make(); transient.play(); transient.remove(); transient.play(); transient.pause();
    }
    outcomes.emptyQueue = frames.size === 0;
    return outcomes;
  });
  assert.deepEqual(result.elapsed, [200, 400]);
  for (const [name, passed] of Object.entries(result)) if (name !== 'elapsed') assert.equal(passed, true, name);
  await page.evaluate(() => {
    window.motionWave = document.createElement('dynamo-wave');
    document.body.append(motionWave);
    window.completions = 0;
    motionWave.addEventListener('dynamo-wave-complete', () => completions++);
    motionWave.generateNewWave(500);
    window.morphTarget = motionWave.targetPath;
  });
  await setMotion('reduce');
  await page.waitForFunction(() => completions === 1);
  assert.equal(await page.evaluate(() => !motionWave.isGeneratingWave && motionWave.path.getAttribute('d') === morphTarget), true);
  await setMotion('no-preference');
  await page.evaluate(() => motionWave.play());
  await setMotion('reduce');
  await page.waitForFunction(() => !motionWave.isAnimating);
  await page.evaluate(() => motionWave.pause());
  await setMotion('no-preference');
  assert.equal(await page.evaluate(() => motionWave.isAnimating), false);
  await page.evaluate(() => motionWave.remove());
  assert.deepEqual(pageErrors, []);
  console.log('Chromium runtime regressions passed: seed/ID safety, repeated timing, morph continuity, detached/preconnect intent, reconnect geometry, finite durations, motion completion and explicit pause.');
} finally {
  await browser.close();
}
