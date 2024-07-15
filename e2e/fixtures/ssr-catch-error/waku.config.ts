/** @type {import('@rmarscher/waku/config').Config} */
export default {
  middleware: () => [
    import('@rmarscher/waku/middleware/dev-server'),
    import('./src/middleware/validator.js'),
    import('@rmarscher/waku/middleware/rsc'),
    import('@rmarscher/waku/middleware/fallback'),
  ],
  /**
   * Prefix for HTTP requests to indicate RSC requests.
   * Defaults to "RSC".
   */
  rscPath: 'RSC', // Just for clarification in tests
};
