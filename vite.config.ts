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

          if (id.includes('react-dom'))       return 'react-vendor';
          if (id.includes('react-router'))    return 'react-vendor';
          if (id.includes('react'))           return 'react-vendor';  // core react after dom/router
          if (id.includes('@supabase'))       return 'supabase-vendor';
          if (id.includes('recharts') || id.includes('d3-'))  return 'charts';
          if (id.includes('posthog'))         return 'posthog';
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) return 'form-vendor';
          if (id.includes('@radix-ui'))       return 'ui-vendor';
          if (id.includes('@tanstack'))       return 'query-vendor';
          if (id.includes('lucide-react'))    return 'icons';
        },
      },
    },
    minify: 'esbuild',
  },
});
