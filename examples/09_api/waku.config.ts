/** @type {import('@rmarscher/waku/config').Config} */
export default {
  middleware: () => [
    import('./src/middleware/api.js'),
    import('@rmarscher/waku/middleware/dev-server'),
    import('@rmarscher/waku/middleware/headers'),
    import('@rmarscher/waku/middleware/ssr'),
    import('@rmarscher/waku/middleware/rsc'),
  ],
};
