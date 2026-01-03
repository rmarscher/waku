// import nodeLoaderCloudflare from '@hiogawa/node-loader-cloudflare/vite';
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'waku/config';

export default defineConfig({
  unstable_adapter: 'waku/adapters/cloudflare',
  vite: {
    plugins: [
      cloudflare({
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
      // nodeLoaderCloudflare({
      //   environments: ['rsc'],
      //   build: true,
      //   // https://developers.cloudflare.com/workers/wrangler/api/#getplatformproxy
      //   getPlatformProxyOptions: {
      //     persist: {
      //       path: '.wrangler/state/v3',
      //     },
      //   },
      // }),
    ],
  },
});
