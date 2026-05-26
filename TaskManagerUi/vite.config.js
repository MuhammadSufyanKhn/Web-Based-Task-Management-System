import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.js',
    coverage: {
      provider: 'v8',                  // Ensures you are using the v8 provider
      reporter: ['text', 'lcov'],      // <-- CRITICAL: 'lcov' must be listed here
      reportsDirectory: './coverage',  // <-- Forces it into the folder you specified
    },
  },
});