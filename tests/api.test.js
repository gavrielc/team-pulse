import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(here, 'fixtures', 'api-server-data.json');
const validContent = await readFile(path.join(here, 'fixtures', 'valid.json'), 'utf8');

await writeFile(dataFile, validContent);
process.env.PULSE_DATA_FILE = dataFile;

// Imported after PULSE_DATA_FILE is set: server.js reads the env var once,
// at module load, to compute its data path.
const { createServer } = await import('../server.js');

let server;
let baseUrl;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await writeFile(dataFile, validContent);
});

test('GET /api/pulse returns 200 with members, projects, checkins', async () => {
  const res = await fetch(`${baseUrl}/api/pulse`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8');
  const body = await res.json();
  const expected = JSON.parse(validContent);
  assert.deepEqual(body.members, expected.members);
  assert.deepEqual(body.projects, expected.projects);
  assert.deepEqual(body.checkins, expected.checkins);
});

test('members and projects are returned in full regardless of filters', async () => {
  const res = await fetch(`${baseUrl}/api/pulse?member=dex`);
  const body = await res.json();
  assert.equal(body.members.length, 2);
  assert.equal(body.projects.length, 2);
});

test('filters checkins by member', async () => {
  const res = await fetch(`${baseUrl}/api/pulse?member=dex`);
  const body = await res.json();
  assert.equal(body.checkins.length, 2);
  assert.ok(body.checkins.every((c) => c.member === 'dex'));
});

test('filters checkins by project', async () => {
  const res = await fetch(`${baseUrl}/api/pulse?project=atlas`);
  const body = await res.json();
  assert.equal(body.checkins.length, 1);
  assert.ok(body.checkins.every((c) => c.project === 'atlas'));
});

test('filters checkins by week', async () => {
  const res = await fetch(`${baseUrl}/api/pulse?week=2026-W37`);
  const body = await res.json();
  assert.equal(body.checkins.length, 2);
  assert.ok(body.checkins.every((c) => c.week === '2026-W37'));
});

test('combines multiple filters with AND', async () => {
  const res = await fetch(`${baseUrl}/api/pulse?member=dex&week=2026-W37`);
  const body = await res.json();
  assert.equal(body.checkins.length, 1);
  assert.equal(body.checkins[0].member, 'dex');
  assert.equal(body.checkins[0].week, '2026-W37');
});

test('a filter matching no checkin returns an empty array, not an error', async () => {
  const res = await fetch(`${baseUrl}/api/pulse?member=nobody`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.checkins, []);
  assert.equal(body.members.length, 2);
  assert.equal(body.projects.length, 2);
});

test('non-GET method returns 405', async () => {
  const res = await fetch(`${baseUrl}/api/pulse`, { method: 'POST' });
  assert.equal(res.status, 405);
  assert.deepEqual(await res.json(), { error: 'method not allowed' });
});

test('unknown path returns 404', async () => {
  const res = await fetch(`${baseUrl}/nope`);
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: 'not found' });
});

test('invalid JSON in the data file returns 500', async () => {
  await writeFile(dataFile, '{ not valid json');
  try {
    const res = await fetch(`${baseUrl}/api/pulse`);
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { error: 'failed to read pulse data' });
  } finally {
    await writeFile(dataFile, validContent);
  }
});
