import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    env: {},
  },
  envPrefix: ['NEXT_PUBLIC_', 'SUPABASE_', 'DATABASE_', 'OPENAI_'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
