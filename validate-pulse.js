#!/usr/bin/env node
// Validates a pulse.json data file against the schema in README.md's
// "Data file" section. Usage: node validate-pulse.js [path/to/pulse.json]

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const WEEK_RE = /^\d{4}-W\d{2}$/;

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Returns an array of violation messages; empty means the file is valid.
// Checks run in schema order (members, projects, checkins) and stop as
// soon as a section's shape is too broken to check further within it.
function validatePulse(data) {
  const errors = [];

  if (!isPlainObject(data)) {
    return ['root must be an object with "members", "projects" and "checkins"'];
  }

  const memberIds = new Set();
  if (!Array.isArray(data.members)) {
    errors.push('"members" must be an array');
  } else {
    data.members.forEach((member, i) => {
      if (!isPlainObject(member)) {
        errors.push(`members[${i}] must be an object`);
        return;
      }
      if (typeof member.id !== 'string' || member.id === '') {
        errors.push(`members[${i}].id must be a non-empty string`);
      } else if (memberIds.has(member.id)) {
        errors.push(`members[${i}].id "${member.id}" is a duplicate`);
      } else {
        memberIds.add(member.id);
      }
      if (typeof member.name !== 'string' || member.name === '') {
        errors.push(`members[${i}].name must be a non-empty string`);
      }
    });
  }

  const projectIds = new Set();
  if (!Array.isArray(data.projects)) {
    errors.push('"projects" must be an array');
  } else {
    data.projects.forEach((project, i) => {
      if (!isPlainObject(project)) {
        errors.push(`projects[${i}] must be an object`);
        return;
      }
      if (typeof project.id !== 'string' || project.id === '') {
        errors.push(`projects[${i}].id must be a non-empty string`);
      } else if (projectIds.has(project.id)) {
        errors.push(`projects[${i}].id "${project.id}" is a duplicate`);
      } else {
        projectIds.add(project.id);
      }
      if (typeof project.name !== 'string' || project.name === '') {
        errors.push(`projects[${i}].name must be a non-empty string`);
      }
    });
  }

  if (!Array.isArray(data.checkins)) {
    errors.push('"checkins" must be an array');
  } else {
    const seen = new Set();
    data.checkins.forEach((checkin, i) => {
      if (!isPlainObject(checkin)) {
        errors.push(`checkins[${i}] must be an object`);
        return;
      }

      if (typeof checkin.member !== 'string' || checkin.member === '') {
        errors.push(`checkins[${i}].member must be a non-empty string`);
      } else if (memberIds.size > 0 && !memberIds.has(checkin.member)) {
        errors.push(`checkins[${i}].member "${checkin.member}" is not a known member id`);
      }

      if (typeof checkin.project !== 'string' || checkin.project === '') {
        errors.push(`checkins[${i}].project must be a non-empty string`);
      } else if (projectIds.size > 0 && !projectIds.has(checkin.project)) {
        errors.push(`checkins[${i}].project "${checkin.project}" is not a known project id`);
      }

      if (typeof checkin.week !== 'string' || !WEEK_RE.test(checkin.week)) {
        errors.push(`checkins[${i}].week must match YYYY-Www, got ${JSON.stringify(checkin.week)}`);
      }

      if (!Number.isInteger(checkin.mood) || checkin.mood < 1 || checkin.mood > 5) {
        errors.push(`checkins[${i}].mood must be an integer 1-5, got ${JSON.stringify(checkin.mood)}`);
      }

      if (typeof checkin.note !== 'string') {
        errors.push(`checkins[${i}].note must be a string`);
      }

      const key = `${checkin.member} ${checkin.project} ${checkin.week}`;
      if (seen.has(key)) {
        errors.push(`checkins[${i}] duplicates an earlier check-in for member "${checkin.member}", project "${checkin.project}", week "${checkin.week}"`);
      } else {
        seen.add(key);
      }
    });
  }

  return errors;
}

function main() {
  const path = process.argv[2] || 'pulse.json';
  let raw;
  try {
    raw = fs.readFileSync(path, 'utf8');
  } catch (err) {
    console.error(`cannot read ${path}: ${err.message}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`${path} is not valid JSON: ${err.message}`);
    process.exit(1);
  }

  const errors = validatePulse(data);
  if (errors.length > 0) {
    console.error(`${path} is invalid: ${errors[0]}`);
    process.exit(1);
  }

  console.log(`${path} is valid`);
}

export { validatePulse };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
