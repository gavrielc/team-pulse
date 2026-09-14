// Tests for validate.js (T1: Dex), against the pulse.json contract in
// README.md. Assumes CommonJS: `module.exports = { validate }` from
// validate.js, and a CLI that exits 0 for a valid file, non-zero otherwise.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const { validate } = require('../validate.js');

function fixture() {
  return {
    members: [
      { id: 'alice', name: 'Alice Kim' },
      { id: 'bob', name: 'Bob Lee' },
    ],
    projects: [
      { id: 'atlas', name: 'Atlas' },
      { id: 'zephyr', name: 'Zephyr' },
    ],
    checkins: [
      { member: 'alice', project: 'atlas', week: '2026-W07', mood: 4, note: 'Good sprint' },
    ],
  };
}

test('accepts a well-formed pulse.json', () => {
  const result = validate(fixture());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('accepts an empty checkins list', () => {
  const data = fixture();
  data.checkins = [];
  const result = validate(data);
  assert.equal(result.valid, true);
});

test('rejects mood below 1', () => {
  const data = fixture();
  data.checkins[0].mood = 0;
  const result = validate(data);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('rejects mood above 5', () => {
  const data = fixture();
  data.checkins[0].mood = 6;
  const result = validate(data);
  assert.equal(result.valid, false);
});

test('rejects a non-integer mood', () => {
  const data = fixture();
  data.checkins[0].mood = 3.5;
  const result = validate(data);
  assert.equal(result.valid, false);
});

test('rejects malformed week strings', () => {
  for (const week of ['2026-7', '26-W07', '2026-W7', '2026W07', 'W07-2026', '2026-w07']) {
    const data = fixture();
    data.checkins[0].week = week;
    const result = validate(data);
    assert.equal(result.valid, false, `expected week "${week}" to be rejected`);
  }
});

test('accepts canonical week strings', () => {
  for (const week of ['2026-W01', '2026-W07', '2026-W52', '2026-W53']) {
    const data = fixture();
    data.checkins[0].week = week;
    const result = validate(data);
    assert.equal(result.valid, true, `expected week "${week}" to be accepted`);
  }
});

test('rejects a checkin referencing an unknown member', () => {
  const data = fixture();
  data.checkins[0].member = 'ghost';
  const result = validate(data);
  assert.equal(result.valid, false);
});

test('rejects a checkin referencing an unknown project', () => {
  const data = fixture();
  data.checkins[0].project = 'ghost';
  const result = validate(data);
  assert.equal(result.valid, false);
});

test('errors is always an array of strings', () => {
  const data = fixture();
  data.checkins[0].mood = 9;
  data.checkins[0].member = 'ghost';
  const result = validate(data);
  assert.ok(Array.isArray(result.errors));
  for (const err of result.errors) assert.equal(typeof err, 'string');
});

test('CLI exits 0 for a valid file', () => {
  const file = path.join(os.tmpdir(), `pulse-valid-${process.pid}.json`);
  fs.writeFileSync(file, JSON.stringify(fixture()));
  try {
    const result = spawnSync(process.execPath, [path.join(__dirname, '..', 'validate.js'), file]);
    assert.equal(result.status, 0);
  } finally {
    fs.rmSync(file, { force: true });
  }
});

test('CLI exits non-zero for an invalid file', () => {
  const data = fixture();
  data.checkins[0].mood = 9;
  const file = path.join(os.tmpdir(), `pulse-invalid-${process.pid}.json`);
  fs.writeFileSync(file, JSON.stringify(data));
  try {
    const result = spawnSync(process.execPath, [path.join(__dirname, '..', 'validate.js'), file]);
    assert.notEqual(result.status, 0);
  } finally {
    fs.rmSync(file, { force: true });
  }
});
