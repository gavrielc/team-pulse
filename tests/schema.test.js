import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validate } from '../schema.js';

const fixture = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/pulse.sample.json', import.meta.url)), 'utf8')
);

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

test('accepts the documented pulse.json shape', () => {
  const result = validate(fixture);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('rejects a missing top-level key', () => {
  const data = clone(fixture);
  delete data.projects;
  const result = validate(data);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('rejects members/projects/checkins that are not arrays', () => {
  const data = clone(fixture);
  data.checkins = 'not-an-array';
  const result = validate(data);
  assert.equal(result.valid, false);
});

for (const badWeek of ['2026-37', '26-W37', '2026-W1', '2026W37', 'week-37']) {
  test(`rejects a malformed week id: ${badWeek}`, () => {
    const data = clone(fixture);
    data.checkins[0].week = badWeek;
    const result = validate(data);
    assert.equal(result.valid, false);
  });
}

test('accepts a zero-padded week id', () => {
  const data = clone(fixture);
  data.checkins[0].week = '2026-W05';
  const result = validate(data);
  assert.equal(result.valid, true);
});

for (const badMood of [0, 6, -1, 3.5, '4', null]) {
  test(`rejects an out-of-range or non-integer mood: ${JSON.stringify(badMood)}`, () => {
    const data = clone(fixture);
    data.checkins[0].mood = badMood;
    const result = validate(data);
    assert.equal(result.valid, false);
  });
}

for (const mood of [1, 2, 3, 4, 5]) {
  test(`accepts a mood of ${mood}`, () => {
    const data = clone(fixture);
    data.checkins[0].mood = mood;
    const result = validate(data);
    assert.equal(result.valid, true);
  });
}

test('rejects a checkin missing a required field', () => {
  const data = clone(fixture);
  delete data.checkins[0].note;
  const result = validate(data);
  assert.equal(result.valid, false);
});

test('rejects a member missing an id or name', () => {
  const data = clone(fixture);
  delete data.members[0].name;
  const result = validate(data);
  assert.equal(result.valid, false);
});

test('rejects a non-string note', () => {
  const data = clone(fixture);
  data.checkins[0].note = 42;
  const result = validate(data);
  assert.equal(result.valid, false);
});

test('accepts an empty checkins array (no check-ins yet)', () => {
  const data = clone(fixture);
  data.checkins = [];
  const result = validate(data);
  assert.equal(result.valid, true);
});
