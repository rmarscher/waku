# Waku Cloudflare Example

This example demonstrates how to use Waku with Cloudflare Workers and Pages.

## Key Features

- **No Special Template Required**: With `CLOUDFLARE=1` env var, the Cloudflare adapter is automatically selected
- **Built-in Middleware**: Encoding workaround middleware is included in the adapter
- **Dev Server Support**: Optional Cloudflare workerd runtime for local development via wrangler
- **Custom Handlers**: Support for scheduled handlers, queue consumers, and more
- **Durable Objects**: Export Durable Object classes directly from your server entry

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Development

Run the dev server:

```bash
npm run dev
```

The dev server will use Cloudflare's workerd runtime via wrangler's `getPlatformProxy`, giving you access to:
- Environment variables and bindings
- KV, D1, R2, and other Cloudflare services
- Durable Objects
- Caches API

### 3. Build

Build for production:

```bash
CLOUDFLARE=1 npm run build
```

This will:
- Bundle your application to `dist/worker/`
- Separate static assets to `dist/assets/`
- Generate `dist/worker/serve-cloudflare.js` with all your exports
- Create a `wrangler.jsonc` if one doesn't exist

### 4. Deploy

Deploy to Cloudflare:

```bash
npx wrangler deploy
```

## Server Entry Structure

The `src/server-entry.tsx` file is simplified and uses built-in utilities:

```tsx
import { contextStorage, getContext } from 'hono/context-storage';
import { fsRouter } from 'waku';
import adapter, {
  cloudflareMiddleware,
  patchFetchForDev,
} from 'waku/adapters/cloudflare';

const serverEntry = adapter(
  fsRouter(import.meta.glob('./**/*.tsx', { base: './pages' })),
  {
    middlewareFns: [
      contextStorage,       // Enable Hono context storage
      cloudflareMiddleware, // Fix Wrangler dev encoding issues
    ],
  },
);

export default {
  ...serverEntry,
  fetch: patchFetchForDev(serverEntry.fetch, {
    persist: { path: '.wrangler/state/v3' },
  }),
};
```

## Advanced: Custom Handlers

You can export additional Cloudflare Workers handlers from `src/server-entry.tsx`:

```tsx
// Scheduled handler (cron jobs)
export async function scheduled(
  event: ScheduledEvent,
  env: Env,
  ctx: ExecutionContext,
) {
  console.log('Cron job running at', new Date(event.scheduledTime));
}

// Queue consumer
export async function queue(
  batch: MessageBatch,
  env: Env,
  ctx: ExecutionContext,
) {
  for (const message of batch.messages) {
    console.log('Processing message:', message.body);
  }
}
```

## Advanced: Durable Objects

Export Durable Object classes directly:

```tsx
export class Counter {
  state: DurableObjectState;
  value: number = 0;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname === '/increment') {
      this.value++;
      return new Response(String(this.value));
    }
    return new Response(String(this.value));
  }
}
```

Don't forget to configure the Durable Object in your `wrangler.jsonc`:

```jsonc
{
  "name": "waku-project",
  "main": "./dist/worker/serve-cloudflare.js",
  "durable_objects": {
    "bindings": [
      {
        "name": "COUNTER",
        "class_name": "Counter",
        "script_name": "waku-project"
      }
    ]
  }
}
```

## Files in This Example

- `src/server-entry.tsx` - Main server entry using built-in utilities
- `src/middleware/cloudflare.ts` - Example custom middleware (now built-in)
- `src/waku.cloudflare-dev-server.ts` - Example dev server wrapper (now built-in)
- `wrangler.jsonc` - Cloudflare Workers configuration

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
