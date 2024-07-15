/// <reference types="react/experimental" />

import { defineEntries } from '@rmarscher/waku/server';
import { Slot } from '@rmarscher/waku/client';

import App from './components/app.js';

export default defineEntries(
  // renderEntries
  async () => {
    return {
      App: <App />,
    };
  },
  // getBuildConfig
  async () => [{ pathname: '/', entries: [{ input: '' }] }],
  // getSsrConfig
  async (pathname) => {
    switch (pathname) {
      case '/':
        return {
          input: '',
          body: <Slot id="App" />,
        };
      default:
        return null;
    }
  },
);
