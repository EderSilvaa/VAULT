import { defineConfig } from "vite";
/// <reference types="vitest" />
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined; // let Vite split app code via lazy()

          // Only split clearly independent vendor libs — let Vite handle the rest
          if (id.includes('@supabase'))       return 'supabase-vendor';
          if (id.includes('posthog'))         return 'posthog';
          if (id.includes('xlsx'))            return 'xlsx';
        },
      },
    },
    minify: 'esbuild',
  },
});
