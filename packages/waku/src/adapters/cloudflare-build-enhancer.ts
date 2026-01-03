import fs from 'node:fs';
import path from 'node:path';

export type BuildOptions = {
  assetsDir: string;
  distDir: string;
  rscBase: string;
  privateDir: string;
  basePath: string;
  DIST_PUBLIC: string;
  serverless: boolean;
};

async function postBuild({ distDir, DIST_PUBLIC, serverless }: BuildOptions) {
  const indexFile = path.resolve(path.join(distDir, 'server', 'index.js'));
  const wakuFile = path.resolve(path.join(distDir, 'server', 'waku.js'));

  // Move existing index.js to waku.js
  fs.renameSync(indexFile, wakuFile);

  // Write new index.js
  fs.writeFileSync(
    indexFile,
    `\
import { INTERNAL_runFetch, unstable_serverEntry as serverEntry } from './waku.js';

export default {
  ...(serverEntry.handlers ? serverEntry.handlers : {}),
  fetch: (request, env, ...args) => INTERNAL_runFetch(env, request, env, ...args),
};
`,
  );

  const wranglerTomlFile = path.resolve('wrangler.toml');
  const wranglerJsonFile = path.resolve('wrangler.json');
  const wranglerJsoncFile = path.resolve('wrangler.jsonc');
  if (
    !fs.existsSync(wranglerTomlFile) &&
    !fs.existsSync(wranglerJsonFile) &&
    !fs.existsSync(wranglerJsoncFile)
  ) {
    let projectName = 'waku-project';
    try {
      const packageJsonPath = path.resolve('package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.name && typeof packageJson.name === 'string') {
        projectName = packageJson.name;
      }
    } catch {
      // Fall back to default if package.json can't be read or parsed
    }
    fs.writeFileSync(
      wranglerJsoncFile,
      `\
{
  "name": ${JSON.stringify(projectName)},
  ${
    serverless
      ? `"main": "waku/adapters/cloudflare-entry",
  // nodejs_als is required for Waku server-side request context
  // It can be removed if only building static pages
  "compatibility_flags": ["nodejs_als"],
  `
      : ''
  }// https://developers.cloudflare.com/workers/platform/compatibility-dates
  "compatibility_date": "2025-11-17",
  "assets": {
    ${
      serverless
        ? `// https://developers.cloudflare.com/workers/static-assets/binding/
    "binding": "ASSETS",
    `
        : ''
    }"directory": "./${distDir}/${DIST_PUBLIC}",
    "html_handling": "drop-trailing-slash"
  }
}
`,
    );
  }
}

export default async function buildEnhancer(
  build: (utils: unknown, options: BuildOptions) => Promise<void>,
): Promise<typeof build> {
  return async (utils: unknown, options: BuildOptions) => {
    await build(utils, options);
    await postBuild(options);
  };
}
