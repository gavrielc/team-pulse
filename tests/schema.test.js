import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePulse } from '../validate-pulse.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => path.join(here, 'fixtures', name);

async function loadFixture(name) {
  return JSON.parse(await readFile(fixture(name), 'utf8'));
}

test('pulse.json at the repo root is valid', async () => {
  const rootPulse = path.join(here, '..', 'pulse.json');
  const data = JSON.parse(await readFile(rootPulse, 'utf8'));
  const { valid, errors } = await validatePulse(data);
  assert.equal(valid, true, `expected pulse.json to be valid, got errors: ${errors.join(', ')}`);
});

test('accepts a well-formed pulse document', async () => {
  const data = await loadFixture('valid.json');
  const { valid, errors } = await validatePulse(data);
  assert.equal(valid, true, errors.join(', '));
  assert.deepEqual(errors, []);
});

test('rejects a checkin missing a required field (note)', async () => {
  const data = await loadFixture('bad-missing-field.json');
  const { valid, errors } = await validatePulse(data);
  assert.equal(valid, false);
  assert.ok(errors.length > 0);
});

test('rejects an unknown property on a checkin', async () => {
  const data = await loadFixture('bad-additional-property.json');
  const { valid } = await validatePulse(data);
  assert.equal(valid, false);
});

test('rejects mood above the 1-5 range', async () => {
  const data = await loadFixture('bad-mood-out-of-range.json');
  const { valid } = await validatePulse(data);
  assert.equal(valid, false);
});

test('rejects a non-integer mood', async () => {
  const data = await loadFixture('bad-mood-not-integer.json');
  const { valid } = await validatePulse(data);
  assert.equal(valid, false);
});

test('rejects a week that is not YYYY-Www', async () => {
  const data = await loadFixture('bad-week-format.json');
  const { valid } = await validatePulse(data);
  assert.equal(valid, false);
});

test('rejects a week number outside 01-53', async () => {
  const data = await loadFixture('bad-week-out-of-range.json');
  const { valid } = await validatePulse(data);
  assert.equal(valid, false);
});

test('rejects a checkin referencing an unknown member id', async () => {
  const data = await loadFixture('bad-unknown-member.json');
  const { valid, errors } = await validatePulse(data);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('not a known members[].id')));
});

test('rejects a checkin referencing an unknown project id', async () => {
  const data = await loadFixture('bad-unknown-project.json');
  const { valid, errors } = await validatePulse(data);
  assert.equal(valid, false);
  assert.ok(errors.some((e) => e.includes('not a known projects[].id')));
});

test('rejects an entity (member/project) missing an id', async () => {
  const data = await loadFixture('bad-entity-missing-id.json');
  const { valid } = await validatePulse(data);
  assert.equal(valid, false);
});

test('rejects a document missing a top-level required key', async () => {
  const { valid } = await validatePulse({ members: [], projects: [] });
  assert.equal(valid, false);
});
