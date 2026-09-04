import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  integrations: [react()],
  output: 'static',
  vite: {
    plugins: [mkcert()],
    ssr: {
      noExternal: ['@optimizely/cms-sdk']
    }
  }
});
