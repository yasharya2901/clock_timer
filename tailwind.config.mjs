/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'bg-black': '#0a0a0a',
        'cream': '#f5f1e3',
        'yellow-custom': '#ffd700',
        'yellow-dark': '#ccaa00',
      },
      fontFamily: {
        'mono': ['Space Mono', 'monospace'],
        'jet': ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'yellow-sm': '0 2px 0 #ccaa00',
        'yellow': '0 4px 0 #ccaa00',
        'yellow-lg': '0 6px 0 #ccaa00',
      },
    },
  },
  plugins: [],
}
