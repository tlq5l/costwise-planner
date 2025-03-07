import react from "@vitejs/plugin-react-swc";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Specific vendor chunks
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }

          // UI components chunk
          if (id.includes('node_modules/@radix-ui/') ||
              id.includes('src/components/ui/')) {
            return 'ui-components';
          }

          // Data layer chunks
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'data-layer';
          }

          // AI model chunks
          if (id.includes('node_modules/@google/generative-ai')) {
            return 'gemini-ai';
          }

          // Date formatting
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }

          // Animation libraries
          if (id.includes('node_modules/framer-motion')) {
            return 'animations';
          }

          // Charts and visualization - separate recharts and d3 to avoid initialization conflicts
          if (id.includes('node_modules/recharts')) {
            return 'recharts';
          }
          if (id.includes('node_modules/d3')) {
            return 'd3';
          }
          // Recharts dependencies that need to be bundled together
          if (id.includes('node_modules/victory') || 
              id.includes('node_modules/react-smooth') ||
              id.includes('node_modules/recharts-scale') ||
              id.includes('node_modules/resize-observer-polyfill')) {
            return 'chart-utils';
          }

          // Keep project pages in separate chunks (they are already lazily loaded)
          return undefined;
        }
      }
    }
  }
}));