import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/dynamowaves.js',
  output: [
    {
      file: 'dist/dynamowaves.js',
      format: 'umd',
      name: 'Dynamowaves',
    },
    {
      file: 'dist/dynamowaves.min.js',
      format: 'umd',
      name: 'Dynamowaves',
      plugins: [terser()],
    },
    {
      file: 'www/dynamowaves.min.js',
      format: 'umd',
      name: 'Dynamowaves',
      plugins: [terser()],
    },
  ],
  plugins: [
    {
      name: 'copy-declaration',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'dynamowaves.d.ts',
          source: `export * from '../src/dynamowaves';`,
        });
      },
    },
  ],
};