import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { computePulseResponse } from '../lib/pulse-api.js';

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/pulse.sample.json', import.meta.url)), 'utf8')
);

test('without a week: 200 with the latest week plus the trend', () => {
  const { status, body } = computePulseResponse(fixture, { project: 'team-pulse' });
  assert.equal(status, 200);
  assert.equal(body.project, 'team-pulse');
  assert.equal(body.latestWeek, '2026-W37');

  const byId = Object.fromEntries(body.members.map((m) => [m.id, m]));
  assert.equal(body.members.length, 3);
  assert.deepEqual(byId.dex, { id: 'dex', name: 'Dex', mood: 4, note: 'shipped the validator' });
  assert.deepEqual(byId.ari, { id: 'ari', name: 'Ari', mood: 5, note: 'great' });
  assert.deepEqual(byId.tess, { id: 'tess', name: 'Tess', mood: 3, note: 'busy' });

  assert.deepEqual(body.trend, [
    { week: '2026-W36', avgMood: 3.5 },
    { week: '2026-W37', avgMood: 4 },
  ]);
});

test('with a week: 200 with just that week, no trend', () => {
  const { status, body } = computePulseResponse(fixture, { project: 'team-pulse', week: '2026-W36' });
  assert.equal(status, 200);
  assert.equal(body.project, 'team-pulse');
  assert.equal(body.week, '2026-W36');
  assert.equal('trend' in body, false);
  assert.equal('latestWeek' in body, false);

  const byId = Object.fromEntries(body.members.map((m) => [m.id, m]));
  assert.equal(body.members.length, 2);
  assert.deepEqual(byId.dex, { id: 'dex', name: 'Dex', mood: 3, note: 'steady' });
  assert.deepEqual(byId.ari, { id: 'ari', name: 'Ari', mood: 4, note: 'good week' });
});

test('a week with no check-ins: 200 with an empty members array', () => {
  const { status, body } = computePulseResponse(fixture, { project: 'team-pulse', week: '2026-W99' });
  assert.equal(status, 200);
  assert.equal(body.week, '2026-W99');
  assert.deepEqual(body.members, []);
});

test('a project with no check-ins yet: empty members and trend', () => {
  const { status, body } = computePulseResponse(fixture, { project: 'empty-project' });
  assert.equal(status, 200);
  assert.equal(body.project, 'empty-project');
  assert.deepEqual(body.members, []);
  assert.deepEqual(body.trend, []);
});

test('an unknown project: 404', () => {
  const { status, body } = computePulseResponse(fixture, { project: 'does-not-exist' });
  assert.equal(status, 404);
  assert.ok(body.error);
});

test('no project given: 400', () => {
  const { status, body } = computePulseResponse(fixture, {});
  assert.equal(status, 400);
  assert.ok(body.error);
});

test('trend is ordered oldest week first', () => {
  const { body } = computePulseResponse(fixture, { project: 'team-pulse' });
  const weeks = body.trend.map((t) => t.week);
  assert.deepEqual(weeks, [...weeks].sort());
});
