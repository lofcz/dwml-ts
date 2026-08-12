import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2021',
      dts: { bundle: true },
      output: { distPath: { root: 'dist' } },
    },
    {
      // CJS build so require() consumers (e.g. pptxtojson's Node entry) work.
      format: 'cjs',
      syntax: 'es2021',
      output: { distPath: { root: 'dist' }, filename: { js: 'index.cjs' } },
    },
  ],
  source: {
    entry: { index: './src/index.ts' },
  },
  output: {
    target: 'node',
    sourceMap: true,
  },
});
