import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['iife'],
  globalName: 'RealEstateAIWidget',
  outDir: '../public',
  outExtension: () => ({ js: '.js' }),
  minify: true,
  clean: false,
  target: 'es2017',
  platform: 'browser',
  esbuildOptions(options) {
    options.outExtension = { '.js': '.js' }
  },
})
