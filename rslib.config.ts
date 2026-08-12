import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2021',
      dts: { bundle: true },
      output: { distPath: { root: 'dist' } },
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
