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
  },
);

// Export the server entry with optional dev server wrapper
export default {
  ...serverEntry,
  // Optionally wrap fetch with dev server for local development
  fetch: patchFetchForDev(serverEntry.fetch, {
    persist: { path: '.wrangler/state/v3' },
  }),
};

// Export Hono context getter for use in components
export const getHonoContext = ((globalThis as any).__WAKU_GET_HONO_CONTEXT__ ||=
  getContext);

/**
 * ADVANCED: Custom Cloudflare Handlers
 *
 * You can export additional handlers for Cloudflare Workers features:
 */

// Example: Scheduled handler (cron jobs)
// export async function scheduled(
//   event: ScheduledEvent,
//   env: Env,
//   ctx: ExecutionContext,
// ) {
//   // Run scheduled tasks
//   console.log('Cron job running at', new Date(event.scheduledTime));
// }

// Example: Queue consumer
// export async function queue(
//   batch: MessageBatch,
//   env: Env,
//   ctx: ExecutionContext,
// ) {
//   for (const message of batch.messages) {
//     console.log('Processing message:', message.body);
//   }
// }

/**
 * ADVANCED: Durable Objects
 *
 * Export Durable Object classes directly:
 */

// Example: Counter Durable Object
// export class Counter {
//   state: DurableObjectState;
//   value: number = 0;
//
//   constructor(state: DurableObjectState) {
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
