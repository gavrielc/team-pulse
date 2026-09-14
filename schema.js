// Validates pulse data against the shape in schema/pulse.schema.json, plus
// the referential and uniqueness rules a JSON Schema can't express (ids
// unique, checkins point at known members/projects). See CONTRIBUTING.md.

const WEEK_RE = /^\d{4}-W\d{2}$/;

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateEntity(list, kind, errors) {
  if (!Array.isArray(list)) {
    errors.push(`${kind}: must be an array`);
    return new Set();
  }
  const seen = new Set();
  list.forEach((entry, i) => {
    const at = `${kind}[${i}]`;
    if (!isPlainObject(entry)) {
      errors.push(`${at}: must be an object`);
      return;
    }
    for (const key of Object.keys(entry)) {
      if (key !== "id" && key !== "name") errors.push(`${at}: unexpected field "${key}"`);
    }
    if (typeof entry.id !== "string" || entry.id.length === 0) {
      errors.push(`${at}.id: must be a non-empty string`);
    } else if (seen.has(entry.id)) {
      errors.push(`${at}.id: duplicate id "${entry.id}"`);
    } else {
      seen.add(entry.id);
    }
    if (typeof entry.name !== "string" || entry.name.length === 0) {
      errors.push(`${at}.name: must be a non-empty string`);
    }
  });
  return seen;
}

function validateCheckins(list, memberIds, projectIds, errors) {
  if (!Array.isArray(list)) {
    errors.push("checkins: must be an array");
    return;
  }
  list.forEach((entry, i) => {
    const at = `checkins[${i}]`;
    if (!isPlainObject(entry)) {
      errors.push(`${at}: must be an object`);
      return;
    }
    for (const key of Object.keys(entry)) {
      if (!["project", "week", "member", "mood", "note"].includes(key)) {
        errors.push(`${at}: unexpected field "${key}"`);
      }
    }
    if (typeof entry.project !== "string" || entry.project.length === 0) {
      errors.push(`${at}.project: must be a non-empty string`);
    } else if (!projectIds.has(entry.project)) {
      errors.push(`${at}.project: unknown project "${entry.project}"`);
    }
    if (typeof entry.member !== "string" || entry.member.length === 0) {
      errors.push(`${at}.member: must be a non-empty string`);
    } else if (!memberIds.has(entry.member)) {
      errors.push(`${at}.member: unknown member "${entry.member}"`);
    }
    if (typeof entry.week !== "string" || !WEEK_RE.test(entry.week)) {
      errors.push(`${at}.week: must match YYYY-Www`);
    }
    if (!Number.isInteger(entry.mood) || entry.mood < 1 || entry.mood > 5) {
      errors.push(`${at}.mood: must be an integer 1-5`);
    }
    if (typeof entry.note !== "string" || entry.note.length > 280) {
      errors.push(`${at}.note: must be a string of at most 280 characters`);
    }
  });
}

export function validate(data) {
  const errors = [];
  if (!isPlainObject(data)) {
    return { valid: false, errors: ["root: must be an object"] };
  }
  for (const key of Object.keys(data)) {
    if (!["members", "projects", "checkins"].includes(key)) {
      errors.push(`root: unexpected field "${key}"`);
    }
  }
  const memberIds = validateEntity(data.members, "members", errors);
  const projectIds = validateEntity(data.projects, "projects", errors);
  validateCheckins(data.checkins, memberIds, projectIds, errors);
  return { valid: errors.length === 0, errors };
}
