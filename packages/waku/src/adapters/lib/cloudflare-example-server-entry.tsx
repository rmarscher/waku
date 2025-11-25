/**
 * Example: Simplified Cloudflare Server Entry
 *
 * This file demonstrates the recommended pattern for using Waku with Cloudflare Workers.
 * With the new architecture, you don't need a special Cloudflare template - just set
 * CLOUDFLARE=1 in your environment and create a server-entry.tsx like this.
 *
 * Features:
 * - Automatic adapter selection via CLOUDFLARE env var
 * - Built-in middleware for Wrangler dev encoding issues
 * - Optional dev server with workerd runtime
 * - Support for custom Cloudflare handlers (scheduled, queue, etc.)
 * - Support for Durable Objects
 */

/// <reference types="vite/client" />
import { contextStorage, getContext } from 'hono/context-storage';
import { fsRouter } from 'waku';
import adapter, {
  cloudflareMiddleware,
  patchFetchForDev,
} from 'waku/adapters/cloudflare';

// Basic setup - just use the adapter with your router and middleware
const serverEntry = adapter(
  fsRouter(import.meta.glob('./**/*.tsx', { base: './pages' })),
  {
    middlewareFns: [
      contextStorage, // Enable Hono context storage
      cloudflareMiddleware, // Fix Wrangler dev encoding issues
    ],
    // If you have Durable Objects, list them here:
    // durableObjects: ['Counter', 'ChatRoom'],
  },
);

// Export the server entry with optional dev server wrapper
// IMPORTANT: Custom handlers must be part of the default export object
export default {
  ...serverEntry,
  // Optionally wrap fetch with dev server for local development
  fetch: patchFetchForDev(serverEntry.fetch, {
    persist: { path: '.wrangler/state/v3' },
  }),

  // ADVANCED: Add custom Cloudflare Workers handlers here
  // These must be part of the default export, not separate named exports
  // See: https://developers.cloudflare.com/workers/runtime-apis/handlers/

  // Example: Scheduled handler (cron jobs)
  // scheduled: async (event, env, ctx) => {
  //   console.log('Cron job running at', new Date(event.scheduledTime));
  // },

  // Example: Queue consumer
  // queue: async (batch, env, ctx) => {
  //   for (const message of batch.messages) {
  //     console.log('Processing message:', message.body);
  //   }
  // },

  // Example: Tail consumer (for logging)
  // tail: async (events, env, ctx) => {
  //   for (const event of events) {
  //     console.log(event);
  //   }
  // },

  // Example: Trace handler (for observability)
  // trace: async (traces, env, ctx) => {
  //   for (const trace of traces) {
  //     console.log(trace);
  //   }
  // },
};

// Export Hono context getter for use in components
export const getHonoContext = ((globalThis as any).__WAKU_GET_HONO_CONTEXT__ ||=
  getContext);

/**
 * ADVANCED: Durable Objects
 *
 * IMPORTANT: Durable Objects must be exported as named exports (not part of default export)
 *
 * Steps to add Durable Objects:
 * 1. Export the class as a named export from this file
 * 2. Add the class name to the durableObjects array in adapter options above
 * 3. Configure the Durable Object in wrangler.jsonc
 */

// Example: Counter Durable Object (exported as named export)
// export class Counter {
//   state: DurableObjectState;
//   value: number = 0;
//
//   constructor(state: DurableObjectState, env: Env) {
//     this.state = state;
//   }
//
//   async fetch(request: Request) {
//     const url = new URL(request.url);
//     if (url.pathname === '/increment') {
//       this.value++;
//       return new Response(String(this.value));
//     }
//     return new Response(String(this.value));
//   }
// }
//
// Then add 'Counter' to durableObjects array above, and configure in wrangler.jsonc:
// {
//   "durable_objects": {
//     "bindings": [
//       { "name": "COUNTER", "class_name": "Counter", "script_name": "waku-project" }
//     ]
//   }
// }

/**
 * DEPLOYMENT:
 *
 * The build process will automatically:
 * 1. Bundle your app to dist/worker/
 * 2. Separate static assets to dist/assets/
 * 3. Generate dist/worker/serve-cloudflare.js with all your exports
 * 4. Create a wrangler.jsonc if one doesn't exist
 *
 * All exports from this file will be available in the final worker bundle.
 *
 * To deploy:
 * ```bash
 * CLOUDFLARE=1 npm run build
 * npx wrangler deploy
 * ```
 */
