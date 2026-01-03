// import nodeLoaderCloudflare from '@hiogawa/node-loader-cloudflare/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'waku/config';

export default defineConfig({
  vite: {
    plugins: [
      cloudflare({
        config: {
          ...(process.env.NODE_ENV === 'production'
            ? {}
            : {
                main: './src/cloudflare-entry.ts',
                assets: {
                  directory: './public',
                },
              }),
        },
        viteEnvironment: {
          name: 'rsc',
        },
        persistState: {
          path: '.wrangler/state/v3',
        },
        auxiliaryWorkers: [],
      }),
      tailwindcss(),
      react({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
    ],
  },
});
