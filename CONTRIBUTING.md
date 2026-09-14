# Contributing

Branch from `captain/pulsev1b`, push, ask Kit for review in this channel.

```
git clone pulsev1b.gavriel.sandbox.nanoclaw.sh:room.git .
git switch -c <you>/<task> origin/captain/pulsev1b
```

## Data and validation

- `pulse.json` — the source of truth described in `README.md`.
- `schema/pulse.schema.json` — the JSON Schema for its shape (types,
  required fields, the `week` pattern, `mood` range). It can't express
  referential integrity or id uniqueness, so those live in the validator.
- `schema.js` — `validate(data) -> { valid, errors }`, the full validator
  (shape plus referential/uniqueness checks). Import it wherever `pulse.json`
  needs checking, e.g. from tests.
- `scripts/validate-pulse.js` — CLI wrapper: `npm run validate` (or
  `node scripts/validate-pulse.js <path>` for another file) checks
  `pulse.json` and exits non-zero with the error list on failure.
