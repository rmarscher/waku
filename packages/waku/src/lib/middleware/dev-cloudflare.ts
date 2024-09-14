import type { GetPlatformProxyOptions } from 'wrangler';
import type { Middleware } from './types.js';

declare global {
  interface ImportMeta {
    readonly env: Record<string, string>;
  }
}

const DO_NOT_BUNDLE = '';

export const devCloudflare = (
  cfOptions: GetPlatformProxyOptions,
): Middleware => {
  if (import.meta.env && import.meta.env.MODE === 'production') {
    // pass through
    return (_options) => (_ctx, next) => next();
  }
  const devCloudflareImplPromise = import(
    /* @vite-ignore */ DO_NOT_BUNDLE + './dev-cloudflare-impl.js'
  ).then(({ cloudflareDevServer }) => cloudflareDevServer(cfOptions));
  return (options) => {
    return async (ctx, next) => {
      const devCloudflareImpl = await devCloudflareImplPromise;
      return devCloudflareImpl(options)(ctx, next);
    };
  };
};
