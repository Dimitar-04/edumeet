import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/support/setup.ts',
    maxWorkers: 1,
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
})
