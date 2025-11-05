import serverEntry from 'virtual:vite-rsc-waku/server-entry';
import { INTERNAL_setAllEnv } from '../../server.js';

// Re-export everything from the server entry to allow custom exports
// (e.g., Cloudflare Durable Objects, scheduled handlers, etc.)
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
