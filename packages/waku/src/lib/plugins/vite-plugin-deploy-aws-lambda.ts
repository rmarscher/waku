import path from 'node:path';
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import type { Plugin } from 'vite';

import { unstable_getPlatformObject } from '../../server.js';
import { SRC_ENTRIES } from '../constants.js';
import {
  DIST_ASSETS,
  DIST_ENTRIES_JS,
  DIST_PUBLIC,
} from '../builder/constants.js';

const SERVE_JS = 'serve-aws-lambda.js';

const getServeJsContent = (
  distDir: string,
  distPublic: string,
  srcEntriesFile: string,
) => `
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { runner, importHono, importHonoNodeServerServeStatic, importHonoAwsLambda } from 'waku/unstable_hono';
import { Agent, request, setGlobalDispatcher } from "undici";

const agent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

setGlobalDispatcher(agent);

const { Hono } = await importHono();
const { serveStatic } = await importHonoNodeServerServeStatic();
const { streamHandle } = await importHonoAwsLambda();
let contextStorage;
try {
 ({ contextStorage } = await import('hono/context-storage'));
} catch {}

const distDir = '${distDir}';
const publicDir = '${distPublic}';
const loadEntries = () => import('${srcEntriesFile}');
const wakuMiddleware = runner({ cmd: 'start', loadEntries, env: process.env });
export const app = new Hono();
if (contextStorage) {
  app.use(contextStorage());
}
app.use('*', serveStatic({ root: distDir + '/' + publicDir }));
app.use('/RSC/*', wakuMiddleware);
app.use('/assets/*', wakuMiddleware);
app.use('/guests/*', wakuMiddleware);
app.use('/staff/*', wakuMiddleware);
app.use('/account/*', wakuMiddleware);
app.use("*", async (c, next) => {
  if (c.finalized) {
    return next();
  }
  const url = new URL(c.req.url);
  url.hostname = "prod-guests.playalunapresents.com";
  url.port = "";
  url.protocol = "https:";
  try {
    console.log('making proxy request to', url.toString());
    const resp = await request(url, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.raw.body,
    });
    c.status(resp.statusCode);
    for (const [key, value] of Object.entries(resp.headers)) {
      c.header(key, value);
    }
    // console.log("got response status", resp.statusCode, resp.headers);
    if ((resp.statusCode < 300 || resp.statusCode >= 400) && resp.statusCode !== 204) {
      return c.body(resp.body);
    }
    return c.body(null);
  } catch (e) {
    console.error(e);
    c.status(500);
    return c.text("Unexpected error");
  }
});
// app.use('*', runner({ cmd: 'start', loadEntries, env: process.env }));
app.notFound(async (c) => {
  const file = path.join(distDir, publicDir, '404.html');
  if (existsSync(file)) {
    return c.html(readFileSync(file, 'utf8'), 404);
  }
  return c.text('404 Not Found', 404);
});

export const handler = streamHandle(app);
`;

export function deployAwsLambdaPlugin(opts: {
  srcDir: string;
  distDir: string;
  privateDir: string;
}): Plugin {
  const platformObject = unstable_getPlatformObject();
  let entriesFile: string;
  return {
    name: 'deploy-aws-lambda-plugin',
    config(viteConfig) {
      const { deploy, unstable_phase } = platformObject.buildOptions || {};
      if (unstable_phase !== 'buildServerBundle' || deploy !== 'aws-lambda') {
        return;
      }
      const { input } = viteConfig.build?.rollupOptions ?? {};
      if (input && !(typeof input === 'string') && !(input instanceof Array)) {
        input[SERVE_JS.replace(/\.js$/, '')] = `${opts.srcDir}/${SERVE_JS}`;
      }
    },
    configResolved(config) {
      entriesFile = `${config.root}/${opts.srcDir}/${SRC_ENTRIES}`;
      const { deploy } = platformObject.buildOptions || {};
      if (deploy === 'aws-lambda' && Array.isArray(config.ssr.external)) {
        config.ssr.external = config.ssr.external.filter(
          (item) => item !== 'hono/context-storage',
        );
      }
    },
    resolveId(source) {
      if (source === `${opts.srcDir}/${SERVE_JS}`) {
        return source;
      }
    },
    load(id) {
      if (id === `${opts.srcDir}/${SERVE_JS}`) {
        return getServeJsContent(opts.distDir, DIST_PUBLIC, entriesFile);
      }
    },
    closeBundle() {
      const { deploy, unstable_phase } = platformObject.buildOptions || {};
      if (unstable_phase !== 'buildDeploy' || deploy !== 'aws-lambda') {
        return;
      }

      writeFileSync(
        path.join(opts.distDir, 'package.json'),
        JSON.stringify({ type: 'module' }, null, 2),
      );

      // Move the distDir so we can move files back to different locations
      renameSync(opts.distDir, '_dist');
      mkdirSync(opts.distDir);

      const functionDir = path.join(opts.distDir, 'function');
      const functionPublicDir = path.join(functionDir, DIST_PUBLIC);
      const publicDir = path.join(opts.distDir, 'public');

      // Move everything to the function folder
      renameSync('_dist', functionDir);
      // Then move the function public folder
      renameSync(functionPublicDir, publicDir);

      if (existsSync(opts.privateDir)) {
        cpSync(opts.privateDir, path.join(functionDir, opts.privateDir), {
          recursive: true,
        });
      }

      appendFileSync(
        path.join(functionDir, DIST_ENTRIES_JS),
        `export const buildData = ${JSON.stringify(platformObject.buildData)};`,
      );

      // Assume that any user files in public do not need to be bundled
      // with the lambda function but public/assets/*.js and css do.
      // We'll also copy any html files to the function public folder
      // for use as custom error pages.
      mkdirSync(functionPublicDir);
      const publicAssetsDir = path.join(publicDir, DIST_ASSETS);
      const files = readdirSync(publicAssetsDir).filter(
        (file) => file.endsWith('.css') || file.endsWith('.js'),
      );
      for (const file of files) {
        cpSync(
          path.join(publicAssetsDir, file),
          path.join(functionPublicDir, DIST_ASSETS, file),
        );
      }
      const htmlFiles = readdirSync(publicDir).filter((file) =>
        file.endsWith('.html'),
      );
      for (const file of htmlFiles) {
        cpSync(path.join(publicDir, file), path.join(functionPublicDir, file));
      }
    },
  };
}
