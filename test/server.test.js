'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..');
const PORT = 8080;
const BASE_URL = `http://localhost:${PORT}`;

const FIXTURE = {
  members: [
    { id: 'dex', name: 'Dex' },
    { id: 'ari', name: 'Ari' },
  ],
  projects: [
    { id: 'pulse', name: 'Team Pulse' },
  ],
  checkins: [
    { member: 'dex', project: 'pulse', week: '2026-W06', mood: 3, note: '' },
    { member: 'ari', project: 'pulse', week: '2026-W06', mood: 4, note: '' },
    { member: 'dex', project: 'pulse', week: '2026-W07', mood: 4, note: 'shipped the schema' },
    { member: 'ari', project: 'pulse', week: '2026-W07', mood: 5, note: '' },
  ],
};

let tmpDir;
let child;

async function waitForServer(timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      await fetch(`${BASE_URL}/api/pulse?project=pulse`);
      return;
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error(`server did not start in time: ${lastError}`);
}

before(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-server-'));
  fs.copyFileSync(path.join(REPO_ROOT, 'server.js'), path.join(tmpDir, 'server.js'));
  const indexPath = path.join(REPO_ROOT, 'index.html');
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, path.join(tmpDir, 'index.html'));
  }
  fs.writeFileSync(path.join(tmpDir, 'pulse.json'), JSON.stringify(FIXTURE));
  child = spawn(process.execPath, ['server.js'], { cwd: tmpDir, stdio: 'ignore' });
  await waitForServer();
});

after(() => {
  if (child) child.kill();
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('400s when project is missing', async () => {
  const res = await fetch(`${BASE_URL}/api/pulse`);
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(typeof body.error, 'string');
});

test('400s for an unknown project', async () => {
  const res = await fetch(`${BASE_URL}/api/pulse?project=ghost`);
  assert.equal(res.status, 400);
});

test('400s for a malformed week', async () => {
  const res = await fetch(`${BASE_URL}/api/pulse?project=pulse&week=not-a-week`);
  assert.equal(res.status, 400);
});

test('returns the requested week for a known project', async () => {
  const res = await fetch(`${BASE_URL}/api/pulse?project=pulse&week=2026-W07`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') || '', /application\/json/);
  const body = await res.json();
  assert.deepEqual(body.project, { id: 'pulse', name: 'Team Pulse' });
  assert.equal(body.week, '2026-W07');
  assert.deepEqual(
    [...body.members].sort((a, b) => a.id.localeCompare(b.id)),
    [
      { id: 'ari', name: 'Ari', mood: 5, note: '' },
      { id: 'dex', name: 'Dex', mood: 4, note: 'shipped the schema' },
    ],
  );
});

test('defaults to the latest week with a check-in when week is omitted', async () => {
  const res = await fetch(`${BASE_URL}/api/pulse?project=pulse`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.week, '2026-W07');
});

test('omits members with no check-in for the week, no zero-filling', async () => {
  const res = await fetch(`${BASE_URL}/api/pulse?project=pulse&week=2026-W06`);
  const body = await res.json();
  const ids = body.members.map((m) => m.id).sort();
  assert.deepEqual(ids, ['ari', 'dex']);
});

test('trend is ascending by week, avgMood rounded to one decimal place', async () => {
  const res = await fetch(`${BASE_URL}/api/pulse?project=pulse&week=2026-W07`);
  const body = await res.json();
  assert.deepEqual(body.trend, [
    { week: '2026-W06', avgMood: 3.5 },
    { week: '2026-W07', avgMood: 4.5 },
  ]);
});
