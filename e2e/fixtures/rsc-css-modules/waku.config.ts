/** @type {import('@rmarscher/waku/config').Config} */
export default {
  middleware: () => [
    import('@rmarscher/waku/middleware/dev-server'),
    import('@rmarscher/waku/middleware/rsc'),
    import('@rmarscher/waku/middleware/fallback'),
  ],
};
