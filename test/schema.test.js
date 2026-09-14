const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('../validate.js');

function validSample() {
  return {
    members: [
      { id: 'alice', name: 'Alice Kim' },
      { id: 'bob', name: 'Bob Lee' },
    ],
    projects: [
      { id: 'atlas', name: 'Atlas' },
      { id: 'zeta', name: 'Zeta' },
    ],
    checkins: [
      { member: 'alice', project: 'atlas', week: '2026-W03', mood: 4, note: 'Shipped the API' },
      { member: 'bob', project: 'zeta', week: '2026-W04', mood: 2, note: '' },
    ],
  };
}

test('valid sample passes', () => {
  const result = validate(validSample());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('duplicate member id is invalid', () => {
  const data = validSample();
  data.members.push({ id: 'alice', name: 'Alice Duplicate' });
  const result = validate(data);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('empty member id is invalid', () => {
  const data = validSample();
  data.members[0].id = '';
  const result = validate(data);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('duplicate project id is invalid', () => {
  const data = validSample();
  data.projects.push({ id: 'atlas', name: 'Atlas Duplicate' });
  const result = validate(data);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('empty project id is invalid', () => {
  const data = validSample();
  data.projects[0].id = '';
  const result = validate(data);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('checkin referencing unknown member is invalid', () => {
  const data = validSample();
  data.checkins[0].member = 'nobody';
  const result = validate(data);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('checkin referencing unknown project is invalid', () => {
  const data = validSample();
  data.checkins[0].project = 'nowhere';
  const result = validate(data);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('checkin with malformed week is invalid', () => {
  const data = validSample();
  data.checkins[0].week = '2026-3';
  const result = validate(data);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('checkin with non-integer mood is invalid', () => {
  const data = validSample();
  data.checkins[0].mood = 3.5;
  const result = validate(data);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('checkin with out-of-range mood is invalid', () => {
  const data = validSample();
  data.checkins[0].mood = 6;
  const result = validate(data);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);

  const data2 = validSample();
  data2.checkins[0].mood = 0;
  const result2 = validate(data2);
  assert.equal(result2.valid, false);
  assert.ok(result2.errors.length > 0);
});

test('checkin with non-string note is invalid', () => {
  const data = validSample();
  data.checkins[0].note = 42;
  const result = validate(data);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('checkin with empty note is valid', () => {
  const data = validSample();
  data.checkins[0].note = '';
  const result = validate(data);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});
