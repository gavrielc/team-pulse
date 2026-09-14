'use strict';

const WEEK_RE = /^\d{4}-W\d{2}$/;

function validate(data) {
  const errors = [];

  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['root: must be an object'] };
  }

  const memberIds = new Set();
  const projectIds = new Set();

  if (!Array.isArray(data.members)) {
    errors.push('members: must be an array');
  } else {
    data.members.forEach((m, i) => {
      if (!m || typeof m !== 'object') {
        errors.push(`members[${i}]: must be an object`);
        return;
      }
      if (typeof m.id !== 'string' || m.id.length === 0) {
        errors.push(`members[${i}].id: must be a non-empty string`);
      } else if (memberIds.has(m.id)) {
        errors.push(`members[${i}].id: duplicate id "${m.id}"`);
      } else {
        memberIds.add(m.id);
      }
      if (typeof m.name !== 'string' || m.name.length === 0) {
        errors.push(`members[${i}].name: must be a non-empty string`);
      }
    });
  }

  if (!Array.isArray(data.projects)) {
    errors.push('projects: must be an array');
  } else {
    data.projects.forEach((p, i) => {
      if (!p || typeof p !== 'object') {
        errors.push(`projects[${i}]: must be an object`);
        return;
      }
      if (typeof p.id !== 'string' || p.id.length === 0) {
        errors.push(`projects[${i}].id: must be a non-empty string`);
      } else if (projectIds.has(p.id)) {
        errors.push(`projects[${i}].id: duplicate id "${p.id}"`);
      } else {
        projectIds.add(p.id);
      }
      if (typeof p.name !== 'string' || p.name.length === 0) {
        errors.push(`projects[${i}].name: must be a non-empty string`);
      }
    });
  }

  if (!Array.isArray(data.checkins)) {
    errors.push('checkins: must be an array');
  } else {
    data.checkins.forEach((c, i) => {
      if (!c || typeof c !== 'object') {
        errors.push(`checkins[${i}]: must be an object`);
        return;
      }
      if (typeof c.member !== 'string' || c.member.length === 0) {
        errors.push(`checkins[${i}].member: must be a non-empty string`);
      } else if (!memberIds.has(c.member)) {
        errors.push(`checkins[${i}].member: unknown member id "${c.member}"`);
      }
      if (typeof c.project !== 'string' || c.project.length === 0) {
        errors.push(`checkins[${i}].project: must be a non-empty string`);
      } else if (!projectIds.has(c.project)) {
        errors.push(`checkins[${i}].project: unknown project id "${c.project}"`);
      }
      if (typeof c.week !== 'string' || !WEEK_RE.test(c.week)) {
        errors.push(`checkins[${i}].week: must match ^\\d{4}-W\\d{2}$, got ${JSON.stringify(c.week)}`);
      }
      if (!Number.isInteger(c.mood) || c.mood < 1 || c.mood > 5) {
        errors.push(`checkins[${i}].mood: must be an integer 1-5, got ${JSON.stringify(c.mood)}`);
      }
      if (typeof c.note !== 'string') {
        errors.push(`checkins[${i}].note: must be a string`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('usage: node validate.js <path-to-pulse.json>');
    process.exit(2);
  }

  const fs = require('fs');
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(`errors: ["failed to read/parse ${path}: ${err.message}"]`);
    process.exit(1);
  }

  const { valid, errors } = validate(data);
  if (!valid) {
    console.error('errors:');
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log('valid');
}

if (require.main === module) {
  main();
}

module.exports = { validate };
