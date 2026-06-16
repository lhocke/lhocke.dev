import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://lhocke.dev',
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
