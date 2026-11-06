import { test, expect, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('agents', () => ({ routeAgentRequest: async () => null }));
vi.mock('@cloudflare/ai-chat', () => ({
  AIChatAgent: class {
    protected env!: never;
    protected messages!: never[];
    constructor() {}
  },
}));

import server from '../src/server';
import { makeMockDb } from './mockdb';

const here = dirname(fileURLToPath(import.meta.url));
const publicFile = (name: string) => resolve(here, '../public', name);

const env = {
  DB: makeMockDb(),
  AI: null,
  ADMIN_PASSWORD: 'test',
  ASSETS: {
    fetch: async (req: Request) => {
      const name = new URL(req.url).pathname.replace(/^\//, '');
      const path = publicFile(name);
      if (!existsSync(path)) return new Response('Not found', { status: 404 });
      return new Response(readFileSync(path, 'utf8'), {
        headers: { 'content-type': 'text/html;charset=UTF-8' },
      });
    },
  },
} as never;

test('patient widget calls the chat API', () => {
  const html = readFileSync(publicFile('index.html'), 'utf8');
  expect(html).toContain('/api/chat');
  expect(html).toContain('localStorage');
});

test('admin dashboard calls the admin APIs', () => {
  const html = readFileSync(publicFile('admin.html'), 'utf8');
  expect(html).toContain('/api/admin/appointments');
});

test('static asset routes serve the widgets', async () => {
  for (const path of ['/index.html', '/admin.html']) {
    const res = await server.fetch(new Request(`http://localhost${path}`), env);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  }
});

test('unknown static path is 404', async () => {
  const res = await server.fetch(
    new Request('http://localhost/missing.html'),
    env,
  );
  expect(res.status).toBe(404);
});
