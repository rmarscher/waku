import path from 'node:path';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { normalizePath } from 'vite';
import type { Plugin } from 'vite';

// HACK: Depending on a different plugin isn't ideal.
// Maybe we could put in vite config object?
import { SRC_ENTRIES } from './vite-plugin-rsc-managed.js';

import { unstable_getPlatformObject } from '../../server.js';
import { EXTENSIONS } from '../config.js';
import {
  decodeFilePathFromAbsolute,
  extname,
  fileURLToFilePath,
  joinPath,
} from '../utils/path.js';
import {
  DIST_SERVE_JS,
  DIST_PUBLIC,
  DIST_ASSETS,
} from '../builder/constants.js';

const resolveFileName = (fname: string) => {
  for (const ext of EXTENSIONS) {
    const resolvedName = fname.slice(0, -extname(fname).length) + ext;
    if (existsSync(resolvedName)) {
      return resolvedName;
    }
  }
  return fname; // returning the default one
};

const srcServeFile = decodeFilePathFromAbsolute(
  joinPath(
    fileURLToFilePath(import.meta.url),
    '../../builder/serve-aws-lambda-sst.js',
  ),
);

export function deployAwsLambdaSstPlugin(opts: {
  srcDir: string;
  distDir: string;
  privateDir: string;
}): Plugin {
  const platformObject = unstable_getPlatformObject();
  return {
    name: 'deploy-aws-lambda-plugin',
    config(viteConfig) {
      const { deploy, unstable_phase } = platformObject.buildOptions || {};
      if (
        unstable_phase !== 'buildServerBundle' ||
        deploy !== 'aws-lambda-sst'
      ) {
        return;
      }

      // FIXME This seems too hacky (The use of viteConfig.root, '.', path.resolve and resolveFileName)
      const entriesFile = normalizePath(
        resolveFileName(
          path.resolve(
            viteConfig.root || '.',
            opts.srcDir,
            SRC_ENTRIES + '.jsx',
          ),
        ),
      );
      const { input } = viteConfig.build?.rollupOptions ?? {};
      if (input && !(typeof input === 'string') && !(input instanceof Array)) {
        input[DIST_SERVE_JS.replace(/\.js$/, '')] = srcServeFile;
      }
      viteConfig.define = {
        ...viteConfig.define,
        'import.meta.env.WAKU_ENTRIES_FILE': JSON.stringify(entriesFile),
        'import.meta.env.WAKU_CONFIG_PUBLIC_DIR': JSON.stringify(DIST_PUBLIC),
      };
    },
    closeBundle() {
      const { deploy, unstable_phase } = platformObject.buildOptions || {};
      if (unstable_phase !== 'buildDeploy' || deploy !== 'aws-lambda-sst') {
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
