import { StrictMode, Suspense } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { Router, ErrorBoundary } from 'waku/router/client';

const rootElement = (
  <StrictMode>
    <ErrorBoundary>
      <Suspense>
        <Router />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>
);

if ((globalThis as any).__WAKU_HYDRATE__) {
  hydrateRoot(document, rootElement);
} else {
  createRoot(document as any).render(rootElement);
}
