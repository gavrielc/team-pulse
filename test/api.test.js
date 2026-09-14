// Tests for server.js (T2: Ari), against the /api/pulse contract in
// README.md. Assumes CommonJS, that server.js reads the listen port from
// the PORT env var (for test isolation), and that it reads pulse.json from
// the repo root — so these tests swap that file for a known fixture and
// restore it afterwards.
'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PULSE_JSON_PATH = path.join(ROOT, 'pulse.json');
const SERVER_PATH = path.join(ROOT, 'server.js');

const FIXTURE = {
  members: [
    { id: 'alice', name: 'Alice Kim' },
    { id: 'bob', name: 'Bob Lee' },
  ],
  projects: [
    { id: 'atlas', name: 'Atlas' },
    { id: 'zephyr', name: 'Zephyr' },
  ],
  checkins: [
    { member: 'alice', project: 'atlas', week: '2026-W06', mood: 3, note: 'Slow start' },
    { member: 'bob', project: 'atlas', week: '2026-W06', mood: 5, note: 'Great' },
    { member: 'alice', project: 'atlas', week: '2026-W07', mood: 4, note: 'Good sprint' },
    { member: 'bob', project: 'zephyr', week: '2026-W07', mood: 2, note: 'Blocked' },
  ],
};

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function waitForPort(port, timeoutMs = 5000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function attempt() {
      const socket = net.connect(port, '127.0.0.1');
      socket.once('connect', () => {
        socket.end();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error(`server never listened on ${port}`));
        else setTimeout(attempt, 100);
      });
    })();
  });
}

function get(port, urlPath) {
  return new Promise((resolve, reject) => {
    http
      .get({ host: '127.0.0.1', port, path: urlPath }, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let json;
          try {
            json = JSON.parse(body);
          } catch {
            json = undefined;
          }
          resolve({ status: res.statusCode, body, json });
        });
      })
      .on('error', reject);
  });
}

function writePulseJson(content) {
  const hadFile = fs.existsSync(PULSE_JSON_PATH);
  const original = hadFile ? fs.readFileSync(PULSE_JSON_PATH) : null;
  fs.writeFileSync(PULSE_JSON_PATH, content);
  return () => {
    if (hadFile) fs.writeFileSync(PULSE_JSON_PATH, original);
    else fs.rmSync(PULSE_JSON_PATH, { force: true });
  };
}

async function startServer() {
  const port = await freePort();
  const child = spawn(process.execPath, [SERVER_PATH], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore',
  });
  await waitForPort(port);
  return { port, child };
}

function stopServer(child) {
  if (child && child.exitCode === null) child.kill();
}

describe('GET /api/pulse', () => {
  let restorePulseJson;
  let server;
  let port;

  before(async () => {
    restorePulseJson = writePulseJson(JSON.stringify(FIXTURE, null, 2));
    ({ port, child: server } = await startServer());
  });

  after(() => {
    stopServer(server);
    restorePulseJson();
  });

  it("returns a project/week's check-ins with member names joined in", async () => {
    const res = await get(port, '/api/pulse?project=atlas&week=2026-W07');
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, {
      project: 'atlas',
      week: '2026-W07',
      checkins: [{ member: 'alice', name: 'Alice Kim', mood: 4, note: 'Good sprint' }],
    });
  });

  it('returns an empty checkins list for a known project/week with no data', async () => {
    const res = await get(port, '/api/pulse?project=zephyr&week=2026-W09');
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, { project: 'zephyr', week: '2026-W09', checkins: [] });
  });

  it('returns the weekly trend, oldest week first, when week is omitted', async () => {
    const res = await get(port, '/api/pulse?project=atlas');
    assert.equal(res.status, 200);
    assert.equal(res.json.project, 'atlas');
    assert.deepEqual(res.json.trend, [
      { week: '2026-W06', averageMood: 4, count: 2 },
      { week: '2026-W07', averageMood: 4, count: 1 },
    ]);
  });

  it('400s when project is missing', async () => {
    const res = await get(port, '/api/pulse');
    assert.equal(res.status, 400);
  });

  it('400s when project is unknown', async () => {
    const res = await get(port, '/api/pulse?project=ghost');
    assert.equal(res.status, 400);
  });

  it('serves pulse.json statically', async () => {
    const res = await get(port, '/pulse.json');
    assert.equal(res.status, 200);
    assert.deepEqual(res.json, FIXTURE);
  });
});

describe('GET /api/pulse with an unreadable pulse.json', () => {
  let restorePulseJson;
  let server;
  let port;

  before(async () => {
    restorePulseJson = writePulseJson('{ this is not valid json');
    ({ port, child: server } = await startServer());
  });

  after(() => {
    stopServer(server);
    restorePulseJson();
  });

  it('responds 500 instead of crashing', async () => {
    const res = await get(port, '/api/pulse?project=atlas');
    assert.equal(res.status, 500);
    assert.equal(server.exitCode, null);
  });
});
