#!/usr/bin/env node
// Validate one or more pulse.json files against schemas/pulse.schema.json.
// Usage: node scripts/validate-pulse.mjs <file.json> [more.json ...]
//        node scripts/validate-pulse.mjs        (defaults to fixtures/pulse.sample.json)

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const here = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(here, "..", "schemas", "pulse.schema.json");

async function loadSchema() {
  return JSON.parse(await readFile(schemaPath, "utf8"));
}

export async function validatePulse(data) {
  const schema = await loadSchema();
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(data);
  return { valid, errors: validate.errors ?? [] };
}

async function main() {
  const args = process.argv.slice(2);
  const files = args.length > 0 ? args : [path.join(here, "..", "fixtures", "pulse.sample.json")];

  let allValid = true;
  for (const file of files) {
    const abs = path.resolve(file);
    let data;
    try {
      data = JSON.parse(await readFile(abs, "utf8"));
    } catch (err) {
      allValid = false;
      console.error(`${file}: could not read/parse JSON — ${err.message}`);
      continue;
    }

    const { valid, errors } = await validatePulse(data);
    if (valid) {
      console.log(`${file}: OK`);
    } else {
      allValid = false;
      console.error(`${file}: INVALID`);
      for (const e of errors) {
        console.error(`  ${e.instancePath || "/"} ${e.message}`);
      }
    }
  }

  process.exit(allValid ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
