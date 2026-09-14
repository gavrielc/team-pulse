# Tests

`npm test` (or `node --test tests/*.test.js`) runs:

- `schema.test.js` — the `pulse.json` validator (T1, Dex): a valid fixture
  passes, and one fixture per violation from the README's schema section is
  rejected (unknown member/project reference, duplicate check-in, mood out
  of 1-5, non-integer mood, bad week format, a missing field, a member
  missing an id).
- `api.test.js` — `GET /api/pulse` (T2, Ari): no-params returns everything,
  `project=` and `week=` filter (alone and combined), an unknown filter
  value returns `200` with an empty `checkins` array, an unknown route
  returns `404`. `GET /api/digest` (T6) has no coverage yet — open.

Fixtures live in `tests/fixtures/`.

## Entry points

- **Validator** — `validate-pulse.js` at the repo root, run as
  `node validate-pulse.js <path-to-json>` (`argv[2]`, defaulting to
  `pulse.json` in `cwd` when omitted). Exits `0` for a valid file; exits
  non-zero with a message (stdout or stderr) naming the violation for an
  invalid one.
- **Server** — `server.js` at the repo root, run as `node server.js`.
  Listens on `process.env.PORT`. Reads the data file from
  `process.env.PULSE_DATA_FILE` (falling back to `pulse.json` in `cwd`),
  so tests can point it at a fixture instead of the real data file.
