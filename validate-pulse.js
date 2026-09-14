#!/usr/bin/env node
// Validate a pulse.json file against pulse.schema.json.
// Usage: node validate-pulse.js [file]   (defaults to ./pulse.json)

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(here, "pulse.schema.json");

async function loadSchema() {
  return JSON.parse(await readFile(schemaPath, "utf8"));
}

// Schema-shape checks plus the referential integrity ajv can't express:
// every checkin must point at a member and a project that actually exist.
export async function validatePulse(data) {
  const schema = await loadSchema();
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(data);
  const errors = (validate.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`);

  if (valid) {
    const memberIds = new Set(data.members.map((m) => m.id));
    const projectIds = new Set(data.projects.map((p) => p.id));
    data.checkins.forEach((c, i) => {
      if (!memberIds.has(c.member)) errors.push(`/checkins/${i}/member "${c.member}" is not a known members[].id`);
      if (!projectIds.has(c.project)) errors.push(`/checkins/${i}/project "${c.project}" is not a known projects[].id`);
    });
  }

  return { valid: errors.length === 0, errors };
}

async function main() {
  const file = process.argv[2] ?? path.join(here, "pulse.json");
  const data = JSON.parse(await readFile(path.resolve(file), "utf8"));
  const { valid, errors } = await validatePulse(data);

  if (valid) {
    console.log(`${file}: OK`);
  } else {
    console.error(`${file}: INVALID`);
    for (const e of errors) console.error(`  ${e}`);
  }
  process.exit(valid ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
