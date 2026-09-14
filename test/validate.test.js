'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { validatePulse } = require('../validate.js');

function baseData() {
  return {
    members: [
      { id: 'dex', name: 'Dex' },
      { id: 'ari', name: 'Ari' },
    ],
    projects: [
      { id: 'pulse', name: 'Team Pulse' },
    ],
    checkins: [
      { member: 'dex', project: 'pulse', week: '2026-W07', mood: 4, note: 'shipped the schema' },
      { member: 'ari', project: 'pulse', week: '2026-W07', mood: 3, note: '' },
    ],
  };
}

function runCli(file) {
  return spawnSync(process.execPath, [path.join(__dirname, '..', 'validate.js'), file]);
}

test('accepts valid data', () => {
  assert.deepEqual(validatePulse(baseData()), { ok: true });
});

test('rejects a duplicate member id', () => {
  const data = baseData();
  data.members.push({ id: 'dex', name: 'Dex again' });
  const result = validatePulse(data);
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);
});

test('rejects a duplicate project id', () => {
  const data = baseData();
  data.projects.push({ id: 'pulse', name: 'Duplicate' });
  assert.equal(validatePulse(data).ok, false);
});

test('rejects a check-in referencing an unknown member', () => {
  const data = baseData();
  data.checkins.push({ member: 'wen', project: 'pulse', week: '2026-W07', mood: 3, note: '' });
  assert.equal(validatePulse(data).ok, false);
});

test('rejects a check-in referencing an unknown project', () => {
  const data = baseData();
  data.checkins.push({ member: 'dex', project: 'ghost', week: '2026-W07', mood: 3, note: '' });
  assert.equal(validatePulse(data).ok, false);
});

test('rejects malformed weeks', () => {
  for (const week of ['2026-07', '26-W07', '2026-W7', 'not-a-week', '2026-W00', '2026-W54']) {
    const data = baseData();
    data.checkins[0].week = week;
    assert.equal(validatePulse(data).ok, false, `expected ${week} to be rejected`);
  }
});

test('accepts the week boundaries W01 and W53', () => {
  for (const week of ['2026-W01', '2026-W53']) {
    const data = baseData();
    data.checkins = [{ member: 'dex', project: 'pulse', week, mood: 3, note: '' }];
    assert.equal(validatePulse(data).ok, true, `expected ${week} to be accepted`);
  }
});

test('rejects a mood outside 1-5 or non-integer', () => {
  for (const mood of [0, 6, 3.5, -1, '4']) {
    const data = baseData();
    data.checkins[0].mood = mood;
    assert.equal(validatePulse(data).ok, false, `expected mood ${JSON.stringify(mood)} to be rejected`);
  }
});

test('accepts the mood boundaries 1 and 5', () => {
  for (const mood of [1, 5]) {
    const data = baseData();
    data.checkins[0].mood = mood;
    assert.equal(validatePulse(data).ok, true, `expected mood ${mood} to be accepted`);
  }
});

test('accepts an empty note', () => {
  const data = baseData();
  data.checkins[0].note = '';
  assert.equal(validatePulse(data).ok, true);
});

test('rejects a non-string note', () => {
  const data = baseData();
  data.checkins[0].note = 42;
  assert.equal(validatePulse(data).ok, false);
});

test('rejects a duplicate (member, project, week) triple', () => {
  const data = baseData();
  data.checkins.push({ member: 'dex', project: 'pulse', week: '2026-W07', mood: 2, note: 'again' });
  assert.equal(validatePulse(data).ok, false);
});

test('an invalid result carries a non-empty array of string errors', () => {
  const data = baseData();
  data.checkins[0].mood = 9;
  const result = validatePulse(data);
  assert.equal(result.ok, false);
  assert.ok(Array.isArray(result.errors));
  assert.ok(result.errors.length > 0);
  for (const err of result.errors) assert.equal(typeof err, 'string');
});

test('CLI exits 0 on valid data', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-valid-'));
  try {
    const file = path.join(tmp, 'pulse.json');
    fs.writeFileSync(file, JSON.stringify(baseData()));
    const result = runCli(file);
    assert.equal(result.status, 0);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('CLI exits non-zero and prints errors on invalid data', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pulse-invalid-'));
  try {
    const file = path.join(tmp, 'pulse.json');
    const bad = baseData();
    bad.checkins[0].mood = 99;
    fs.writeFileSync(file, JSON.stringify(bad));
    const result = runCli(file);
    assert.notEqual(result.status, 0);
    const output = result.stdout.toString() + result.stderr.toString();
    assert.ok(output.length > 0);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
