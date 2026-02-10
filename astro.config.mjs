import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind({ applyBaseStyles: false })],
  
  // Your production site URL
  site: 'https://clocktimer.in',
  
  // Compress HTML in production
  compressHTML: true,
  
  // Build configuration
  build: {
    // Inline stylesheets smaller than this size (in bytes)
    inlineStylesheets: 'auto',
    
    // Output directory
    outDir: './dist',
    
    // Assets directory
    assets: '_assets',
  },
  
  // SEO-friendly settings
  vite: {
    build: {
      // CSS code splitting
      cssCodeSplit: true,
      
      // Generate sourcemaps for debugging
      sourcemap: false,
      
      // Minification
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.logs in production
        },
      },
    },
    
    // CSS preprocessing
    css: {
      devSourcemap: true,
    },
  },
  
  // Server configuration for development
  server: {
    port: 3000,
    host: true,
  },
  
  // Preview server configuration
  preview: {
    port: 4321,
    host: true,
  },
});
