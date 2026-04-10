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
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunking - only for node_modules, app code stays together
        manualChunks: (id) => {
          // Keep all app code (src/) in main chunk to avoid circular dependency issues
          if (!id.includes('node_modules')) {
            return 'index';
          }

          // Vendor chunks - only split node_modules
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react-vendor';
          }
          if (id.includes('@radix-ui')) {
            return 'ui-vendor';
          }
          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
            return 'form-vendor';
          }
          if (id.includes('@supabase/supabase-js')) {
            return 'supabase-vendor';
          }
          if (id.includes('recharts')) {
            return 'charts';
          }
          if (id.includes('lucide-react')) {
            return 'icons';
          }
        },
      },
    },
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console.logs for debugging
        drop_debugger: true,
      },
    },
  },
});
