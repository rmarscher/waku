import serverEntry from 'virtual:vite-rsc-waku/server-entry';
import { INTERNAL_setAllEnv } from '../../server.js';

// Re-export named exports from the server entry (e.g., Durable Objects)
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
