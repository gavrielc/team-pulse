// Tests for the /api/pulse endpoint (owned by Ari, T2), per the README's
// "API — GET /api/pulse" contract.
//
// Assumed contract (needed to make this testable in isolation, since the
// README doesn't specify how to launch the server for tests): a script at
// `server.js`, repo root, that on `node server.js` starts an HTTP server
// listening on `process.env.PORT` (falls back to some default when unset)
// and reads the data file from `process.env.PULSE_DATA_FILE` (falls back to
// `pulse.json` in cwd when unset). If the real server differs — a fixed
// port, no data-file override — adjust SERVER_PATH/env below to match
// rather than the expectations, which follow the README contract.

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER_PATH = path.join(ROOT, 'server.js');
const FIXTURE = path.join(__dirname, 'fixtures', 'valid.json');
const PORT = 4173;
const BASE = `http://localhost:${PORT}`;

let serverProcess;

async function waitForServer(timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/api/pulse`);
      if (res.ok || res.status) return;
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(
    `server.js did not become reachable on ${BASE} within ${timeoutMs}ms. Last error: ${lastError}`
  );
}

describe('API — GET /api/pulse', () => {
  before(async () => {
    if (!existsSync(SERVER_PATH)) {
      throw new Error(
        `server.js not found at ${SERVER_PATH} — T2 (Ari) has not been merged yet. ` +
          `These tests assume \`node server.js\` listens on $PORT and reads $PULSE_DATA_FILE; adjust tests/api.test.js if the real entry point differs.`
      );
    }
    serverProcess = spawn('node', [SERVER_PATH], {
      env: { ...process.env, PORT: String(PORT), PULSE_DATA_FILE: FIXTURE },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    await waitForServer();
  });

  after(() => {
    if (serverProcess) serverProcess.kill();
  });

  test('no params returns full members, full projects, and every checkin', async () => {
    const res = await fetch(`${BASE}/api/pulse`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.members.length, 2);
    assert.equal(body.projects.length, 2);
    assert.equal(body.checkins.length, 4);
  });

  test('project= filters checkins to that project, keeps full members/projects', async () => {
    const res = await fetch(`${BASE}/api/pulse?project=sky`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.members.length, 2);
    assert.equal(body.projects.length, 2);
    assert.ok(body.checkins.every((c) => c.project === 'sky'));
    assert.equal(body.checkins.length, 1);
  });

  test('week= filters checkins to that week', async () => {
    const res = await fetch(`${BASE}/api/pulse?week=2026-W37`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(body.checkins.every((c) => c.week === '2026-W37'));
    assert.equal(body.checkins.length, 3);
  });

  test('project= and week= combine as filters', async () => {
    const res = await fetch(`${BASE}/api/pulse?project=pulse&week=2026-W37`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.checkins.length, 2);
    assert.ok(body.checkins.every((c) => c.project === 'pulse' && c.week === '2026-W37'));
  });

  test('unknown project value yields 200 with an empty checkins array, not an error', async () => {
    const res = await fetch(`${BASE}/api/pulse?project=nonexistent`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.checkins, []);
    assert.equal(body.members.length, 2);
    assert.equal(body.projects.length, 2);
  });

  test('unknown week value yields 200 with an empty checkins array, not an error', async () => {
    const res = await fetch(`${BASE}/api/pulse?week=2099-W01`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body.checkins, []);
  });

  test('unknown route returns 404', async () => {
    const res = await fetch(`${BASE}/api/does-not-exist`);
    assert.equal(res.status, 404);
  });

  test('response shape includes id+name for members and projects', async () => {
    const res = await fetch(`${BASE}/api/pulse`);
    const body = await res.json();
    for (const m of body.members) {
      assert.ok('id' in m && 'name' in m);
    }
    for (const p of body.projects) {
      assert.ok('id' in p && 'name' in p);
    }
  });
});
