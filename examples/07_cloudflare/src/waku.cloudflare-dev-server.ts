/**
 * NOTE: This dev server wrapper is now built into waku/adapters/cloudflare
 *
 * You can import it directly:
 * import { cloudflareDevServer, patchFetchForDev } from 'waku/adapters/cloudflare';
 *
 * This file is kept as an example of how the dev server works.
 */

import type { Hono } from 'hono';
import type { BlankEnv, BlankSchema } from 'hono/types';

export const cloudflareDevServer = (cfOptions: any) => {
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
