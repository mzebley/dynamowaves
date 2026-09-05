import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

const publicRuntimeExports = [
  'DynamoWave',
  'decodeWaveSeed',
  'encodeWaveSeed',
  'generateWave',
  'interpolateWave',
  'parsePath',
];

describe('package exports', () => {
  it('types JSX host props and the completion event without weakening wave attributes', () => {
    const filename = fileURLToPath(new URL('./jsx-contract.tsx', import.meta.url));
    const source = `
      import type { DynamoWave } from '../src/dynamowaves.js';
      const wave = <dynamo-wave id="hero" class="fill-theme" className="hero"
        style={{ fill: 'currentColor', height: 80 }} tabIndex={-1}
        aria-hidden={true} data-purpose="decoration" data-wave-face="left"
        ref={(element) => element?.play()} />;
      const inline = <dynamo-wave style="height:5rem;fill:blue" />;
      declare const element: DynamoWave;
      element.addEventListener('dynamo-wave-complete', (event) => {
        const duration: number = event.detail.duration;
        const direction: 'horizontal' | 'vertical' = event.detail.direction;
      });
      // @ts-expect-error: public face values remain a closed vocabulary.
      const invalidFace = <dynamo-wave data-wave-face="diagonal" />;
      // @ts-expect-error: ordinary host attributes keep their native value type.
      const invalidId = <dynamo-wave id={123} />;
    `;
    const options = {
      noEmit: true,
      strict: true,
      skipLibCheck: true,
      types: [],
      jsx: ts.JsxEmit.Preserve,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
    };
    const host = ts.createCompilerHost(options);
    const readFile = host.readFile.bind(host);
    const fileExists = host.fileExists.bind(host);
    host.readFile = (path) => path === filename ? source : readFile(path);
    host.fileExists = (path) => path === filename || fileExists(path);
    const program = ts.createProgram([filename], options, host);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => process.cwd(),
      getCanonicalFileName: (path) => path,
      getNewLine: () => '\n',
    }));
  });

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
