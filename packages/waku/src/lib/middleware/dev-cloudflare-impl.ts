import type { Middleware } from "waku/config"
import { unstable_getPlatformObject } from "waku/server"
import type { GetPlatformProxyOptions } from "wrangler"

export const cloudflareDevServer = (cfOptions: GetPlatformProxyOptions | undefined): Middleware => {
  const wsAssign = import("miniflare").then(({ WebSocketPair }) => {
    Object.assign(globalThis, { WebSocketPair })
  })
  return (options) => {
    let env: Record<string, unknown> = options.env || {}
    const platform = unstable_getPlatformObject()
    const proxy = import("wrangler").then(({ getPlatformProxy }) =>
      getPlatformProxy(cfOptions).then((proxy) => {
        platform.env = proxy.env;
        env = { ...env, ...}
        env = { ...env, ...proxy.env }
        return proxy
      }),
    )

    return async (ctx, next) => {
      await wsAssign
      const awaitedProxy = await proxy
      Object.assign(ctx.req, { cf: awaitedProxy.cf })
      Object.assign(globalThis, {
        caches: awaitedProxy.caches,
        __WAKU_PRIVATE_ENV__: { ...env, executionContext: awaitedProxy.ctx },
      })
      await next()
    }
  }
}

export default cloudflareDevServer
