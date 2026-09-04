import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  integrations: [react()],
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  vite: {
    plugins: [mkcert()],
    ssr: {
      noExternal: ['@optimizely/cms-sdk'],
    },
  },
  server: {
    port: 3000,
  },
});

