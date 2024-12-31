'use server';

export const throws = async (): Promise<string> => {
  throw 'Something unexpected happened';
  // new Error('Something unexpected happened');
};
