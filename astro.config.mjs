import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), sitemap()],
  
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
    plugins: [tailwindcss()],

    build: {
      // CSS code splitting
      cssCodeSplit: true,

      // Generate sourcemaps for debugging
      sourcemap: false,
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
