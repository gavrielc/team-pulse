// Tests for GET /api/digest (owned by Ari, T6), per the README's
// "API — GET /api/digest" contract: summarizes, for the latest week present
// across all check-ins, each project that has at least one check-in that
// week (a project with none that week is omitted, not zeroed).
//
// Same server contract as tests/api.test.js: `node server.js`, listening on
// $PORT, reading data from $PULSE_DATA_FILE (falls back to pulse.json).
// Each describe block below starts its own server instance on its own port
// against its own fixture, since the data file is fixed at process start.

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER_PATH = path.join(ROOT, 'server.js');
const FIXTURES = path.join(__dirname, 'fixtures');

async function waitForServer(base, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${base}/api/digest`);
      if (res.status) return;
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`server.js did not become reachable on ${base} within ${timeoutMs}ms. Last error: ${lastError}`);
}

function startServer(fixtureName, port) {
  return spawn('node', [SERVER_PATH], {
    env: { ...process.env, PORT: String(port), PULSE_DATA_FILE: path.join(FIXTURES, fixtureName) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

describe('GET /api/digest', () => {
  before(() => {
    if (!existsSync(SERVER_PATH)) {
      throw new Error(`server.js not found at ${SERVER_PATH} — T6 (Ari) has not been merged yet.`);
    }
  });

  describe('latest week, per-project averages, and omission', () => {
    const PORT = 4174;
    const BASE = `http://localhost:${PORT}`;
    let proc;

    before(async () => {
      proc = startServer('digest-basic.json', PORT);
      await waitForServer(BASE);
    });
    after(() => proc.kill());

    test('picks the latest week across all check-ins (max, not per-project)', async () => {
      const res = await fetch(`${BASE}/api/digest`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.week, '2026-W38');
    });

    test('omits a project with no check-in in the latest week (sky, only in W37)', async () => {
      const res = await fetch(`${BASE}/api/digest`);
      const body = await res.json();
      const ids = body.projects.map((p) => p.id);
      assert.ok(!ids.includes('sky'), `expected sky to be omitted, got projects: ${ids}`);
    });

    test('includes every project with a check-in that week', async () => {
      const res = await fetch(`${BASE}/api/digest`);
      const body = await res.json();
      const ids = body.projects.map((p) => p.id).sort();
      assert.deepEqual(ids, ['pulse', 'void']);
    });

    test('avgMood is the mean of that week\'s moods, membersCheckedIn is the count', async () => {
      const res = await fetch(`${BASE}/api/digest`);
      const body = await res.json();
      const byId = Object.fromEntries(body.projects.map((p) => [p.id, p]));

      assert.equal(byId.pulse.avgMood, 4.5); // dex(5) + ari(4) in W38
      assert.equal(byId.pulse.membersCheckedIn, 2);

      assert.equal(byId.void.avgMood, 2); // wen(2) in W38
      assert.equal(byId.void.membersCheckedIn, 1);
    });

    test('summary names the project, the average mood, and the check-in count', async () => {
      const res = await fetch(`${BASE}/api/digest`);
      const body = await res.json();
      const pulse = body.projects.find((p) => p.id === 'pulse');
      assert.match(pulse.summary, /Pulse/);
      assert.match(pulse.summary, /4\.5/);
      assert.match(pulse.summary, /2/);
    });
  });

  describe('average rounding', () => {
    const PORT = 4175;
    const BASE = `http://localhost:${PORT}`;
    let proc;

    before(async () => {
      proc = startServer('digest-rounding.json', PORT);
      await waitForServer(BASE);
    });
    after(() => proc.kill());

    test('rounds a repeating decimal average to one decimal place', async () => {
      const res = await fetch(`${BASE}/api/digest`);
      const body = await res.json();
      // (3 + 4 + 4) / 3 = 3.666... -> 3.7
      assert.equal(body.projects[0].avgMood, 3.7);
      assert.equal(body.projects[0].membersCheckedIn, 3);
    });
  });

  describe('no check-ins at all', () => {
    const PORT = 4176;
    const BASE = `http://localhost:${PORT}`;
    let proc;

    before(async () => {
      proc = startServer('digest-empty.json', PORT);
      await waitForServer(BASE);
    });
    after(() => proc.kill());

    test('week is null and projects is empty when there are no check-ins', async () => {
      const res = await fetch(`${BASE}/api/digest`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.week, null);
      assert.deepEqual(body.projects, []);
    });
  });

  describe('week comparison across a year boundary', () => {
    const PORT = 4177;
    const BASE = `http://localhost:${PORT}`;
    let proc;

    before(async () => {
      proc = startServer('digest-cross-year.json', PORT);
      await waitForServer(BASE);
    });
    after(() => proc.kill());

    test('2026-W05 sorts after 2025-W48 (year, not just week number, decides latest)', async () => {
      const res = await fetch(`${BASE}/api/digest`);
      const body = await res.json();
      assert.equal(body.week, '2026-W05');
      assert.equal(body.projects[0].avgMood, 5);
    });
  });
});
