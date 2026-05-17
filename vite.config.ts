import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  base: '/',
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ], 

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Build optimizations
  build: {
    // Target modern browsers for smaller bundle
    target: 'es2020',
    // Enable minification with esbuild (faster than terser)
    minify: 'esbuild',   
    // Split CSS for better caching
    cssCodeSplit: true,
    // Reduce chunk size
    chunkSizeWarningLimit: 500,
    // Enable code splitting
    rollupOptions: {
      output: {
        // Aggressive code splitting for better caching
        manualChunks(id) {
          // Core React libraries (smallest possible)
          if (id.includes('node_modules/react/') && !id.includes('react-dom') && !id.includes('react-router')) {
            return 'react-core';
          }
          if (id.includes('node_modules/react-dom/')) {
            return 'react-dom';
          }
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }
          // Charts library (lazy load)
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          // UI components
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          if (id.includes('node_modules/sonner')) {
            return 'toast';
          }
          // Radix UI - split by component
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          // Helmet and SEO
          if (id.includes('node_modules/react-helmet-async')) {
            return 'helmet';
          }
          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }
          // All other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name ?? '';
          const info = name.split('.');
          const ext = info[info.length - 1] ?? '';
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2/.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Disable source maps for smaller bundle
    sourcemap: false,
    // Report compressed size
    reportCompressedSize: true,
  },

  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router',
      'react-helmet-async'
    ],
    exclude: ['@mui/material', '@mui/icons-material'],
  },

  // Server configuration
  server: {
    // Enable compression
    middlewareMode: false,
  },
})
