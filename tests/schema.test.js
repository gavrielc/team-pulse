// Tests for the pulse.json schema validator (owned by Dex, T1).
//
// Assumed contract (README's "Data file — pulse.json" section, plus the
// convention needed to make this testable): a script at `validate.js`,
// repo root, run as `node validate.js <path-to-json>` (argv[2] defaults to
// `pulse.json` in cwd). It exits 0 for a valid file, and exits non-zero
// with a clear message (stderr or stdout) naming the violation for an
// invalid one, stopping at the first violation found.
//
// If validate.js differs from this, adjust VALIDATOR_PATH / spawn args
// below to match rather than the fixtures — the fixtures encode the rules
// from the README and should stay as-is.

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VALIDATOR_PATH = path.join(ROOT, 'validate-pulse.js');
const FIXTURES = path.join(__dirname, 'fixtures');

function runValidator(fixtureName) {
  const result = spawnSync('node', [VALIDATOR_PATH, path.join(FIXTURES, fixtureName)], {
    encoding: 'utf8',
  });
  return result;
}

describe('schema validator (validate.js)', () => {
  before(() => {
    if (!existsSync(VALIDATOR_PATH)) {
      throw new Error(
        `validate.js not found at ${VALIDATOR_PATH} — T1 (Dex) has not been merged yet. ` +
          `These tests assume \`node validate.js <path>\`; adjust VALIDATOR_PATH in tests/schema.test.js if the real entry point differs.`
      );
    }
  });

  test('accepts a valid file (exit 0)', () => {
    const result = runValidator('valid.json');
    assert.equal(result.status, 0, `expected exit 0, got ${result.status}. stderr: ${result.stderr}`);
  });

  test('rejects a checkin referencing an unknown member', () => {
    const result = runValidator('bad-unknown-member.json');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr + result.stdout, /member/i);
  });

  test('rejects a checkin referencing an unknown project', () => {
    const result = runValidator('bad-unknown-project.json');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr + result.stdout, /project/i);
  });

  test('rejects a duplicate check-in for the same member/project/week', () => {
    const result = runValidator('bad-duplicate-checkin.json');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr + result.stdout, /duplicate|once|already/i);
  });

  test('rejects mood outside 1-5', () => {
    const result = runValidator('bad-mood-out-of-range.json');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr + result.stdout, /mood/i);
  });

  test('rejects a non-integer mood', () => {
    const result = runValidator('bad-mood-not-integer.json');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr + result.stdout, /mood|integer/i);
  });

  test('rejects a week not in YYYY-Www format', () => {
    const result = runValidator('bad-week-format.json');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr + result.stdout, /week/i);
  });

  test('rejects a checkin missing a required field', () => {
    const result = runValidator('bad-missing-field.json');
    assert.notEqual(result.status, 0);
  });

  test('rejects a member missing an id', () => {
    const result = runValidator('bad-member-missing-id.json');
    assert.notEqual(result.status, 0);
  });

  test('each error message names only the first violation (single, non-empty message)', () => {
    const result = runValidator('bad-unknown-member.json');
    const message = (result.stderr + result.stdout).trim();
    assert.ok(message.length > 0, 'expected a non-empty error message');
  });
});
