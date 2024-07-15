import { defineEntries } from '@rmarscher/waku/server';
import { Slot } from '@rmarscher/waku/client';

import App from './components/App';

export default defineEntries(
  // renderEntries
  async (input) => {
    return {
      App: <App name={input || 'Waku'} />,
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
