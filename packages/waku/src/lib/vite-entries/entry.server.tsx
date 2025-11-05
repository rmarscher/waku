import serverEntry from 'virtual:vite-rsc-waku/server-entry';
import { INTERNAL_setAllEnv } from '../../server.js';

// Re-export named exports from the server entry (e.g., Durable Objects)
// Note: Do not use export * here as it could conflict with our own exports
export * from 'virtual:vite-rsc-waku/server-entry';

export { serverEntry as unstable_serverEntry };

export async function INTERNAL_runFetch(
  env: Readonly<Record<string, string>>,
  req: Request,
  ...args: any[]
) {
  INTERNAL_setAllEnv(env);
  return serverEntry.fetch(req, ...args);
}

// Export a properly configured Cloudflare Worker object
// This wraps all handlers with env setup and merges custom handlers from serverEntry
export const cloudflareWorker = {
  fetch: (request: Request, env: any, ctx: any) =>
    INTERNAL_runFetch(env, request, env, ctx),

  // Conditionally include scheduled handler if it exists
  ...(typeof (serverEntry as any).scheduled === 'function' && {
    scheduled: async (event: any, env: any, ctx: any) => {
      INTERNAL_setAllEnv(env);
      return (serverEntry as any).scheduled(event, env, ctx);
    },
  }),

  // Conditionally include queue handler if it exists
  ...(typeof (serverEntry as any).queue === 'function' && {
    queue: async (batch: any, env: any, ctx: any) => {
      INTERNAL_setAllEnv(env);
      return (serverEntry as any).queue(batch, env, ctx);
    },
  }),

  // Conditionally include tail handler if it exists
  ...(typeof (serverEntry as any).tail === 'function' && {
    tail: async (events: any, env: any, ctx: any) => {
      INTERNAL_setAllEnv(env);
      return (serverEntry as any).tail(events, env, ctx);
    },
  }),

  // Conditionally include trace handler if it exists
  ...(typeof (serverEntry as any).trace === 'function' && {
    trace: async (traces: any, env: any, ctx: any) => {
      INTERNAL_setAllEnv(env);
      return (serverEntry as any).trace(traces, env, ctx);
    },
  }),
};
