const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createServer } = require('../server.js');

const pulseData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'pulse.json'), 'utf8')
);
const someProject = pulseData.projects[0].id;
const someWeek = pulseData.checkins.find((c) => c.project === someProject).week;

let server;
let baseUrl;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function getPulse(query) {
  const res = await fetch(`${baseUrl}/api/pulse${query}`);
  const body = await res.json();
  return { status: res.status, body };
}

test('unfiltered returns full members, projects, and all checkins', async () => {
  const { status, body } = await getPulse('');
  assert.equal(status, 200);
  assert.deepEqual(body.members, pulseData.members);
  assert.deepEqual(body.projects, pulseData.projects);
  assert.equal(body.checkins.length, pulseData.checkins.length);
});

test('project-only filters checkins to that project, keeps full members/projects', async () => {
  const { status, body } = await getPulse(`?project=${someProject}`);
  assert.equal(status, 200);
  assert.deepEqual(body.members, pulseData.members);
  assert.deepEqual(body.projects, pulseData.projects);
  assert.ok(body.checkins.length > 0);
  assert.ok(body.checkins.every((c) => c.project === someProject));
});

test('week-only filters checkins to that week, keeps full members/projects', async () => {
  const { status, body } = await getPulse(`?week=${someWeek}`);
  assert.equal(status, 200);
  assert.deepEqual(body.members, pulseData.members);
  assert.deepEqual(body.projects, pulseData.projects);
  assert.ok(body.checkins.length > 0);
  assert.ok(body.checkins.every((c) => c.week === someWeek));
});

test('project+week filters checkins to both', async () => {
  const { status, body } = await getPulse(`?project=${someProject}&week=${someWeek}`);
  assert.equal(status, 200);
  assert.deepEqual(body.members, pulseData.members);
  assert.deepEqual(body.projects, pulseData.projects);
  assert.ok(body.checkins.every((c) => c.project === someProject && c.week === someWeek));
});

test('unknown project id returns 404 with error message', async () => {
  const { status, body } = await getPulse('?project=does-not-exist');
  assert.equal(status, 404);
  assert.equal(body.error, 'unknown project: does-not-exist');
});

test('malformed week returns 400 with error message', async () => {
  const { status, body } = await getPulse('?week=not-a-week');
  assert.equal(status, 400);
  assert.equal(body.error, 'invalid week: not-a-week');
});
