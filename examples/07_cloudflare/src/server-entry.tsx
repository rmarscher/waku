/// <reference types="vite/client" />
import { contextStorage, getContext } from 'hono/context-storage';
import { fsRouter } from 'waku';
import adapter, {
  cloudflareMiddleware,
  patchFetchForDev,
} from 'waku/adapters/cloudflare';

// Simplified server entry using built-in utilities
const serverEntry = adapter(
  fsRouter(import.meta.glob('./**/*.tsx', { base: './pages' })),
  {
    middlewareFns: [
      contextStorage, // Enable Hono context storage
      cloudflareMiddleware, // Fix Wrangler dev encoding issues
    ],
  },
);

export default {
  ...serverEntry,
  // Use built-in dev server wrapper
  fetch: patchFetchForDev(serverEntry.fetch, {
    persist: { path: '.wrangler/state/v3' },
  }),
};

export const getHonoContext = ((globalThis as any).__WAKU_GET_HONO_CONTEXT__ ||=
  getContext);
