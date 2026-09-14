import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getPulse } from '../api.js';

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/pulse.sample.json', import.meta.url)), 'utf8')
);

test('without a week: returns the latest week plus the trend', () => {
  const res = getPulse(fixture, { project: 'team-pulse' });
  assert.equal(res.project, 'team-pulse');
  assert.equal(res.latestWeek, '2026-W37');

  const byId = Object.fromEntries(res.members.map((m) => [m.id, m]));
  assert.equal(res.members.length, 3);
  assert.deepEqual(byId.dex, { id: 'dex', name: 'Dex', mood: 4, note: 'shipped the validator' });
  assert.deepEqual(byId.ari, { id: 'ari', name: 'Ari', mood: 5, note: 'great' });
  assert.deepEqual(byId.tess, { id: 'tess', name: 'Tess', mood: 3, note: 'busy' });

  assert.deepEqual(res.trend, [
    { week: '2026-W36', avgMood: 3.5 },
    { week: '2026-W37', avgMood: 4 },
  ]);
});

test('with a week: returns just that week, no trend', () => {
  const res = getPulse(fixture, { project: 'team-pulse', week: '2026-W36' });
  assert.equal(res.project, 'team-pulse');
  assert.equal(res.week, '2026-W36');
  assert.equal('trend' in res, false);
  assert.equal('latestWeek' in res, false);

  const byId = Object.fromEntries(res.members.map((m) => [m.id, m]));
  assert.equal(res.members.length, 2);
  assert.deepEqual(byId.dex, { id: 'dex', name: 'Dex', mood: 3, note: 'steady' });
  assert.deepEqual(byId.ari, { id: 'ari', name: 'Ari', mood: 4, note: 'good week' });
});

test('with a week that has no check-ins: empty members array', () => {
  const res = getPulse(fixture, { project: 'team-pulse', week: '2026-W99' });
  assert.equal(res.week, '2026-W99');
  assert.deepEqual(res.members, []);
});

test('a project with no check-ins yet: empty members and trend', () => {
  const res = getPulse(fixture, { project: 'empty-project' });
  assert.equal(res.project, 'empty-project');
  assert.deepEqual(res.members, []);
  assert.deepEqual(res.trend, []);
});

test('an unknown project resolves to nothing, for the caller to turn into a 404', () => {
  const res = getPulse(fixture, { project: 'does-not-exist' });
  assert.equal(res, null);
});

test('trend is ordered oldest week first', () => {
  const res = getPulse(fixture, { project: 'team-pulse' });
  const weeks = res.trend.map((t) => t.week);
  assert.deepEqual(weeks, [...weeks].sort());
});
