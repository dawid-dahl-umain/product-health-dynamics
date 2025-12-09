import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'node',
    reporters: ['default'],
    coverage: {
      provider: 'v8',
    },
  },
})

