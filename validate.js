'use strict';

const WEEK_RE = /^\d{4}-W(\d{2})$/;

function validatePulse(data) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, errors: ['root value must be an object'] };
  }

  const errors = [];
  for (const key of ['members', 'projects', 'checkins']) {
    if (!Array.isArray(data[key])) {
      errors.push(`"${key}" must be an array`);
    }
  }
  if (errors.length) return { ok: false, errors };

  const memberIds = new Set();
  data.members.forEach((m, i) => {
    if (typeof m !== 'object' || m === null) {
      errors.push(`members[${i}] must be an object`);
      return;
    }
    if (typeof m.id !== 'string' || m.id === '') {
      errors.push(`members[${i}].id must be a non-empty string`);
    } else if (memberIds.has(m.id)) {
      errors.push(`members[${i}].id "${m.id}" is not unique`);
    } else {
      memberIds.add(m.id);
    }
    if (typeof m.name !== 'string' || m.name === '') {
      errors.push(`members[${i}].name must be a non-empty string`);
    }
  });

  const projectIds = new Set();
  data.projects.forEach((p, i) => {
    if (typeof p !== 'object' || p === null) {
      errors.push(`projects[${i}] must be an object`);
      return;
    }
    if (typeof p.id !== 'string' || p.id === '') {
      errors.push(`projects[${i}].id must be a non-empty string`);
    } else if (projectIds.has(p.id)) {
      errors.push(`projects[${i}].id "${p.id}" is not unique`);
    } else {
      projectIds.add(p.id);
    }
    if (typeof p.name !== 'string' || p.name === '') {
      errors.push(`projects[${i}].name must be a non-empty string`);
    }
  });

  const seenTriples = new Set();
  data.checkins.forEach((c, i) => {
    if (typeof c !== 'object' || c === null) {
      errors.push(`checkins[${i}] must be an object`);
      return;
    }
    const loc = `checkins[${i}]`;

    const memberOk = typeof c.member === 'string' && memberIds.has(c.member);
    if (!memberOk) {
      errors.push(`${loc}.member must reference a members[].id`);
    }

    const projectOk = typeof c.project === 'string' && projectIds.has(c.project);
    if (!projectOk) {
      errors.push(`${loc}.project must reference a projects[].id`);
    }

    let weekOk = false;
    if (typeof c.week !== 'string' || !WEEK_RE.test(c.week)) {
      errors.push(`${loc}.week must match YYYY-Www`);
    } else {
      const weekNum = Number(WEEK_RE.exec(c.week)[1]);
      if (weekNum < 1 || weekNum > 53) {
        errors.push(`${loc}.week number must be between 01 and 53`);
      } else {
        weekOk = true;
      }
    }

    if (!Number.isInteger(c.mood) || c.mood < 1 || c.mood > 5) {
      errors.push(`${loc}.mood must be an integer between 1 and 5`);
    }

    if (typeof c.note !== 'string') {
      errors.push(`${loc}.note must be a string`);
    }

    if (memberOk && projectOk && weekOk) {
      const triple = `${c.member} ${c.project} ${c.week}`;
      if (seenTriples.has(triple)) {
        errors.push(`${loc}: duplicate check-in for (${c.member}, ${c.project}, ${c.week})`);
      } else {
        seenTriples.add(triple);
      }
    }
  });

  return errors.length ? { ok: false, errors } : { ok: true };
}

module.exports = { validatePulse };

if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('usage: node validate.js <pulse.json>');
    process.exit(2);
  }

  const fs = require('fs');
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`could not read/parse ${filePath}: ${err.message}`);
    process.exit(1);
  }

  const result = validatePulse(data);
  if (!result.ok) {
    for (const error of result.errors) console.error(error);
    process.exit(1);
  }
  console.log(`${filePath}: ok`);
}
