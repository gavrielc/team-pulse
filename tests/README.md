# Tests

`npm test` runs these with Node's built-in test runner. No dependencies.

They import two modules that don't exist yet — T1 and T2 land them:

- `../schema.js` exporting `validate(data)` → `{ valid: boolean, errors: string[] }`,
  checking the `pulse.json` shape documented in the root `README.md`.
- `../api.js` exporting `getPulse(data, { project, week })` → the response body
  documented in the root `README.md`'s `GET /api/pulse` section, or `null` for
  an unknown project (the HTTP layer maps that to a 404).

Until those exist, `npm test` fails on the import — that's expected, not a
broken test suite. `tests/fixtures/pulse.sample.json` is the sample data the
tests run against.
