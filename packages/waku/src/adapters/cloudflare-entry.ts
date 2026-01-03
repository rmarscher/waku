// eslint-disable-next-line import/no-unresolved
import serverEntry from 'virtual:vite-rsc-waku/server-entry';

export default {
  ...(serverEntry.handlers || {}),
  fetch: serverEntry.fetch,
};
