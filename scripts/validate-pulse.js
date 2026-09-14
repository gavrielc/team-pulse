#!/usr/bin/env node
// CLI wrapper around schema.js's validate() for validating pulse.json from
// the command line. See CONTRIBUTING.md.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { validate } from "../schema.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataPath = process.argv[2] ?? path.join(root, "pulse.json");

let raw;
try {
  raw = readFileSync(dataPath, "utf8");
} catch (err) {
  console.error(`could not read ${dataPath}: ${err.message}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error(`${dataPath} is not valid JSON: ${err.message}`);
  process.exit(1);
}

const { valid, errors } = validate(data);
if (!valid) {
  console.error(`${dataPath} failed validation:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`${dataPath} is valid.`);
