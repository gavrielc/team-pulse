# Tests

`npm test` runs these with Node's built-in test runner. No dependencies.

They import three modules from T1 and T2's branches:

- `../schema.js` (T1) exporting `validate(data)` → `{ valid: boolean, errors: string[] }`.
- `../lib/pulse-api.js` (T2) exporting `computePulseResponse(data, { project, week })`
  → `{ status, body }` (400 with no project, 404 for an unknown project, else 200
  with the `GET /api/pulse` shape from the root `README.md`).
- `../server.js` (T2) exporting `createServer(dataPath)` for an end-to-end
  HTTP check of the same endpoint.

Verified against both branches as pushed (`pulse-data/t1-pulse-json-members-projects`,
`pulse-api/t2-get-api-pulse-by`); this branch doesn't merge them, so `npm test`
only passes once they land. `tests/fixtures/pulse.sample.json` is the sample
data the tests run against.
