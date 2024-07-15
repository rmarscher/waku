import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Root, Slot } from '@rmarscher/waku/client';

const rootElement = (
  <StrictMode>
    <Root>
      <Slot id="App" />
    </Root>
  </StrictMode>
);

createRoot(document.body).render(rootElement);
