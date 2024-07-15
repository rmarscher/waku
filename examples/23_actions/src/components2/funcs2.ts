'use server';

import { unstable_getCustomContext as getCustomContext } from '@rmarscher/waku/server';

export const greet = async (name: string) => {
  await Promise.resolve();
  console.log('Custom Context:', getCustomContext()); // ---> {}
  return `Hello ${name} from server!`;
};
