import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

export default [
  // Main JavaScript bundle configuration
  {
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
  },
  // Types bundle configuration
  {
    input: './src/dynamowaves.d.ts',
    output: [
      {
        file: 'dist/dynamowaves.d.ts',
        format: 'es',
      },
    ],
    plugins: [dts()],
  },
];