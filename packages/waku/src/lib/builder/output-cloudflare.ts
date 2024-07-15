import path from 'node:path';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';

import type { ResolvedConfig } from '../config.js';
import { DIST_PUBLIC } from './constants.js';

const WORKER_JS_NAME = '_worker.js'
const ROUTES_JSON_NAME = '_routes.json';

type StaticRoutes = { version: number; include: string[]; exclude: string[] }

export const emitCloudflareOutput = async (
  rootDir: string,
  config: ResolvedConfig,
  serveJs: string,
) => {
  const outDir = path.join(rootDir, config.distDir);
  const publicDir = path.join(outDir, DIST_PUBLIC);

  const workerEntrypoint = path.join(outDir, WORKER_JS_NAME);
  if (!existsSync(workerEntrypoint)) {
    writeFileSync(
      workerEntrypoint,
      `
import server from './${serveJs}'

export default {
  ...server
}
`,
    );
  }

  // https://developers.cloudflare.com/pages/functions/routing/#functions-invocation-routes
  const routesFile = path.join(outDir, ROUTES_JSON_NAME);
  if (!existsSync(routesFile)) {
    // TODO if this is too aggressive, try adding just DIST_ASSETS
    const staticPaths: string[] = [];
    const paths = readdirSync(outDir, {
      withFileTypes: true,
    })
    paths.forEach((p) => {
      if (p.isDirectory() && p.name !== DIST_PUBLIC) {
        staticPaths.push(`/${p.name}/*`)
      } else {
        if (p.name === WORKER_JS_NAME) {
          return
        }
        staticPaths.push(`/${p.name}`)
      }
    })
    const publicPaths = readdirSync(publicDir, {
      withFileTypes: true,
    })
    publicPaths.forEach((p) => {
      if (p.isDirectory()) {
        staticPaths.push(`/${p.name}/*`)
      } else {
        if (p.name === WORKER_JS_NAME) {
          return
        }
        staticPaths.push(`/${p.name}`)
      }
    })
    const staticRoutes: StaticRoutes = {
      version: 1,
      include: ['/*'],
      exclude: staticPaths,
    }
    writeFileSync(routesFile, JSON.stringify(staticRoutes))
  }

  const wranglerTomlFile = path.join(rootDir, 'wrangler.toml');
  if (!existsSync(wranglerTomlFile)) {
    writeFileSync(
      wranglerTomlFile,
      `
name = "waku-project"
compatibility_date = "2024-04-03"
compatibility_flags = [ "nodejs_compat" ]
pages_build_output_dir = "./dist"
`,
    );
  }
};
