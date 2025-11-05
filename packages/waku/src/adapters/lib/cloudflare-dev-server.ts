import type { Hono } from 'hono';
import type { BlankEnv, BlankSchema } from 'hono/types';

export interface CloudflareDevServerOptions {
  /**
   * Options to pass to Cloudflare's getPlatformProxy
   * @see https://developers.cloudflare.com/workers/wrangler/api/#parameters-1
   */
  persist?: {
    path?: string;
  };
  [key: string]: any;
}

/**
 * Creates a development server wrapper that uses Cloudflare's workerd runtime
 * via wrangler's getPlatformProxy. This allows testing with bindings, KV, D1, etc. in dev.
 *
 * @param cfOptions - Options to pass to getPlatformProxy
 * @returns A fetch handler that wraps the app's fetch with Cloudflare context
 *
 * @example
 * ```ts
 * import { cloudflareDevServer } from 'waku/adapters/cloudflare';
 *
 * const devHandler = cloudflareDevServer({
 *   persist: { path: '.wrangler/state/v3' }
 * });
 * ```
 */
export const cloudflareDevServer = (cfOptions?: CloudflareDevServerOptions) => {
  const wranglerPromise = import('wrangler').then(({ getPlatformProxy }) =>
    getPlatformProxy({ ...(cfOptions || {}) }),
  );
  const miniflarePromise = import('miniflare').then(({ WebSocketPair }) => {
    Object.assign(globalThis, { WebSocketPair });
  });
  return async (req: Request, fetch: Hono<BlankEnv, BlankSchema>['fetch']) => {
    const [proxy, _] = await Promise.all([wranglerPromise, miniflarePromise]);
    Object.assign(req, { cf: proxy.cf });
    Object.assign(globalThis, {
      caches: proxy.caches,
    });
    return fetch(req, proxy.env, proxy.ctx);
  };
};

/**
 * Helper to wrap a fetch handler with the Cloudflare dev server in development
 * and use the original handler in production.
 *
 * @param fetch - The fetch handler to wrap
 * @param options - Options for the dev server
 * @returns The wrapped fetch handler
 *
 * @example
 * ```ts
 * import { patchFetchForDev } from 'waku/adapters/cloudflare';
 *
 * export default {
 *   ...serverEntry,
 *   fetch: patchFetchForDev(serverEntry.fetch, {
 *     persist: { path: '.wrangler/state/v3' }
 *   })
 * };
 * ```
 */
export const patchFetchForDev = (
  fetch: (req: Request) => Response | Promise<Response>,
  options?: CloudflareDevServerOptions,
) => {
  if (import.meta.env && !import.meta.env.PROD) {
    const handlerPromise = cloudflareDevServer(options);
    return async (req: Request) => {
      const devHandler = await handlerPromise;
      return devHandler(req, fetch);
    };
  }
  return fetch;
};
