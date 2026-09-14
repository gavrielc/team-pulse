import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from '../server.js';

const fixturePath = fileURLToPath(new URL('./fixtures/pulse.sample.json', import.meta.url));

async function withServer(t, run) {
  const server = createServer(fixturePath);
  await new Promise((resolve) => server.listen(0, resolve));
  t.after(() => server.close());
  const { port } = server.address();
  await run(`http://localhost:${port}`);
}

test('GET /api/pulse over HTTP: a specific week', async (t) => {
  await withServer(t, async (base) => {
    const res = await fetch(`${base}/api/pulse?project=team-pulse&week=2026-W36`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/json');
    const body = await res.json();
    assert.equal(body.week, '2026-W36');
    assert.equal(body.members.length, 2);
  });
});

test('GET /api/pulse over HTTP: an unknown project is a 404', async (t) => {
  await withServer(t, async (base) => {
    const res = await fetch(`${base}/api/pulse?project=nope`);
    assert.equal(res.status, 404);
  });
});

test('GET /api/pulse over HTTP: a missing project is a 400', async (t) => {
  await withServer(t, async (base) => {
    const res = await fetch(`${base}/api/pulse`);
    assert.equal(res.status, 400);
  });
});

test('an unknown route is a 404', async (t) => {
  await withServer(t, async (base) => {
    const res = await fetch(`${base}/nope`);
    assert.equal(res.status, 404);
  });
});
