import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { Hono } from 'hono';
import { streamHandle } from 'hono/aws-lambda';

import { runner } from '../hono/runner.js';

const loadEntries = () => import(import.meta.env.WAKU_ENTRIES_FILE!);

const env = process.env as Record<string, string>;

const app = new Hono();
app.use('*', runner({ cmd: 'start', loadEntries, env }));
app.notFound(async (c) => {
  if (c.req.path === '/') {
    const indexFile = path.join('public', 'index.html');
    if (existsSync(indexFile)) {
      return c.html(readFileSync(indexFile, 'utf8'), 200);
    }
  }
  const file = path.join('public', '404.html');
  if (existsSync(file)) {
    return c.html(readFileSync(file, 'utf8'), 404);
  }
  return c.text('404 Not Found', 404);
});

export const handler: ReturnType<typeof streamHandle> = streamHandle(app);
