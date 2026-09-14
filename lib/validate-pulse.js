'use strict';

const WEEK_PATTERN = /^\d{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$/;

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkString(value, path, errors) {
  if (typeof value !== 'string' || value.length === 0) {
    errors.push(`${path}: expected a non-empty string, got ${JSON.stringify(value)}`);
    return false;
  }
  return true;
}

function validateMembers(members, errors) {
  const ids = new Set();
  if (!Array.isArray(members)) {
    errors.push('members: expected an array');
    return ids;
  }
  members.forEach((member, i) => {
    const path = `members[${i}]`;
    if (!isPlainObject(member)) {
      errors.push(`${path}: expected an object`);
      return;
    }
    if (checkString(member.id, `${path}.id`, errors)) ids.add(member.id);
    checkString(member.name, `${path}.name`, errors);
    checkString(member.role, `${path}.role`, errors);
  });
  return ids;
}

function validateProjects(projects, errors) {
  const ids = new Set();
  if (!Array.isArray(projects)) {
    errors.push('projects: expected an array');
    return ids;
  }
  projects.forEach((project, i) => {
    const path = `projects[${i}]`;
    if (!isPlainObject(project)) {
      errors.push(`${path}: expected an object`);
      return;
    }
    if (checkString(project.id, `${path}.id`, errors)) ids.add(project.id);
    checkString(project.name, `${path}.name`, errors);
  });
  return ids;
}

function validateCheckins(checkins, memberIds, projectIds, errors) {
  if (!Array.isArray(checkins)) {
    errors.push('checkins: expected an array');
    return;
  }
  checkins.forEach((checkin, i) => {
    const path = `checkins[${i}]`;
    if (!isPlainObject(checkin)) {
      errors.push(`${path}: expected an object`);
      return;
    }

    if (checkString(checkin.member, `${path}.member`, errors) && !memberIds.has(checkin.member)) {
      errors.push(`${path}.member: unknown member id ${JSON.stringify(checkin.member)}`);
    }

    if (checkString(checkin.project, `${path}.project`, errors) && !projectIds.has(checkin.project)) {
      errors.push(`${path}.project: unknown project id ${JSON.stringify(checkin.project)}`);
    }

    if (checkString(checkin.week, `${path}.week`, errors) && !WEEK_PATTERN.test(checkin.week)) {
      errors.push(`${path}.week: ${JSON.stringify(checkin.week)} does not match YYYY-Www`);
    }

    if (!Number.isInteger(checkin.mood) || checkin.mood < 1 || checkin.mood > 5) {
      errors.push(`${path}.mood: expected an integer 1-5, got ${JSON.stringify(checkin.mood)}`);
    }

    if ('note' in checkin && typeof checkin.note !== 'string') {
      errors.push(`${path}.note: expected a string, got ${JSON.stringify(checkin.note)}`);
    }
  });
}

function validatePulse(data) {
  const errors = [];

  if (!isPlainObject(data)) {
    return { valid: false, errors: ['pulse.json: expected a top-level object'] };
  }

  const memberIds = validateMembers(data.members, errors);
  const projectIds = validateProjects(data.projects, errors);
  validateCheckins(data.checkins, memberIds, projectIds, errors);

  return { valid: errors.length === 0, errors };
}

module.exports = { validatePulse, WEEK_PATTERN };

if (require.main === module) {
  const fs = require('fs');
  const path = require('path');
  const target = process.argv[2] || path.join(__dirname, '..', 'data', 'pulse.json');

  let raw;
  try {
    raw = fs.readFileSync(target, 'utf8');
  } catch (err) {
    console.error(`could not read ${target}: ${err.message}`);
    process.exit(2);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`${target}: invalid JSON — ${err.message}`);
    process.exit(2);
  }

  const { valid, errors } = validatePulse(data);
  if (valid) {
    console.log(`${target}: valid`);
    process.exit(0);
  }

  console.error(`${target}: invalid`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
