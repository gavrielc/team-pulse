# Tests

`npm test` (or `node --test tests/`) runs:

- `schema.test.js` — the `pulse.json` validator (T1, Dex): a valid fixture
  passes, and one fixture per violation from the README's schema section is
  rejected (unknown member/project reference, duplicate check-in, mood out
  of 1-5, non-integer mood, bad week format, a missing field, a member
  missing an id).
- `api.test.js` — `GET /api/pulse` (T2, Ari): no-params returns everything,
  `project=` and `week=` filter (alone and combined), an unknown filter
  value returns `200` with an empty `checkins` array, an unknown route
  returns `404`.

Fixtures live in `tests/fixtures/`.

## Assumed entry points

Neither T1 nor T2 was merged when these were written, so the following is
assumed rather than verified against real code. If the real entry point
differs, adjust the test file's `VALIDATOR_PATH`/`SERVER_PATH`/env handling
to match — the fixtures and assertions encode the README contract and
should stay as-is.

- **Validator** — `validate.js` at the repo root, run as
  `node validate.js <path-to-json>` (`argv[2]`, defaulting to `pulse.json`
  in `cwd` when omitted). Exits `0` for a valid file; exits non-zero with a
  message (stdout or stderr) naming the violation for an invalid one.
- **Server** — `server.js` at the repo root, run as `node server.js`.
  Listens on `process.env.PORT`. Reads the data file from
  `process.env.PULSE_DATA_FILE` (falling back to `pulse.json` in `cwd`),
  so tests can point it at a fixture instead of the real data file.
