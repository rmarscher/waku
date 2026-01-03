// @ts-expect-error ignore type here for now
import serverEntry from 'virtual:vite-rsc-waku/server-entry'; // eslint-disable-line import/no-unresolved
import handlers from "./platform-entry";
export * from "./platform-entry";

export default {
  ...(handlers ? handlers : {}),
  fetch: serverEntry.fetch,
}
