#!/usr/bin/env node
// Validates a pulse.json file against the team-pulse schema:
//   { team: string, members: [{ name, role, moods: { "YYYY-Wnn": 1-5 } }] }
// Exits 0 when valid, 1 when the file is missing/malformed/invalid, printing
// every problem found (not just the first) to stderr.

const fs = require('fs');
const path = require('path');

const WEEK_KEY_RE = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateMoods(moods, errors, where) {
  if (!isPlainObject(moods)) {
    errors.push(`${where}.moods must be an object`);
    return;
  }
  for (const [week, score] of Object.entries(moods)) {
    if (!WEEK_KEY_RE.test(week)) {
      errors.push(`${where}.moods has an invalid week key "${week}" (expected "YYYY-Wnn")`);
    }
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      errors.push(`${where}.moods["${week}"] must be an integer 1-5, got ${JSON.stringify(score)}`);
    }
  }
}

function validateMember(member, index, errors) {
  const where = `members[${index}]`;
  if (!isPlainObject(member)) {
    errors.push(`${where} must be an object`);
    return;
  }
  if (typeof member.name !== 'string' || member.name.length === 0) {
    errors.push(`${where}.name must be a non-empty string`);
  }
  if (typeof member.role !== 'string' || member.role.length === 0) {
    errors.push(`${where}.role must be a non-empty string`);
  }
  if (!('moods' in member)) {
    errors.push(`${where}.moods is required`);
  } else {
    validateMoods(member.moods, errors, where);
  }
}

function validatePulse(data) {
  const errors = [];

  if (!isPlainObject(data)) {
    return ['root value must be a JSON object'];
  }

  if (typeof data.team !== 'string' || data.team.length === 0) {
    errors.push('"team" must be a non-empty string');
  }

  if (!Array.isArray(data.members) || data.members.length === 0) {
    errors.push('"members" must be a non-empty array');
  } else {
    data.members.forEach((member, index) => validateMember(member, index, errors));
  }

  return errors;
}

function main() {
  const file = process.argv[2] || 'pulse.json';
  const filePath = path.resolve(process.cwd(), file);

  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    console.error(`error: cannot read ${filePath}: ${err.message}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`error: ${filePath} is not valid JSON: ${err.message}`);
    process.exit(1);
  }

  const errors = validatePulse(data);
  if (errors.length > 0) {
    console.error(`${filePath} is invalid:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(`${filePath} is valid`);
  process.exit(0);
}

main();
