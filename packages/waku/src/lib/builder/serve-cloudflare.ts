import { Hono } from 'hono';
import { runner } from '../hono/runner.js';

const loadEntries = () => import(import.meta.env.WAKU_ENTRIES_FILE!);
let serveWaku: ReturnType<typeof runner> | undefined;
fetch
export interface CloudflareEnv {
  ASSETS: {
    fetch: (input: RequestInit | URL, init?: RequestInit) => Promise<Response>
  };
}

export interface CloudflareEnv {
  ASSETS: {
    fetch: (input: RequestInit | URL, init?: RequestInit) => Promise<Response>
  };
}

export const app = new Hono < { Bindings: CloudflareEnv & { [k: string]: unknown } } >();
app.use('*', (c, next) => serveWaku!(c, next));
app.notFound(async (c) => {
  const assetsFetcher = c.env.ASSETS;
  // First check public folder
  const url = new URL(c.req.raw.url);
  const publicPath = `${url.origin}/public${url.pathname}`;
  const assetsResponse = await assetsFetcher.fetch(new Request(publicPath, c.req.raw));
  if (assetsResponse) {
    return assetsResponse;
  }
  // Look for custom 404
  const notFoundStaticAssetResponse = await assetsFetcher.fetch(new URL("/404.html"));
  if (notFoundStaticAssetResponse) {
    return new Response(notFoundStaticAssetResponse.body, {
      status: 404,
      statusText: "Not Found",
      headers: notFoundStaticAssetResponse.headers
    });
  }
  // Default 404
  return c.text('404 Not Found', 404);
});

export default {
  async fetch(
    request: Request,
    env: Record<string, string>,
    ctx: Parameters<typeof app.fetch>[2],
  ) {
    if (!serveWaku) {
      serveWaku = runner({ cmd: 'start', loadEntries, env });
    }
    return app.fetch(request, env, ctx);
  },
};
