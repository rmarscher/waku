import { defineEntries } from '@rmarscher/waku/server';
import { Slot } from '@rmarscher/waku/client';

import Layout from './components/layout';
import App from './components/app';

export default defineEntries(
  // renderEntries
  async (input) => {
    return {
      App: (
        <Layout>
          <App name={input || 'Waku'} />
        </Layout>
      ),
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
