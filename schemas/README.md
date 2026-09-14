# pulse.json

`pulse.schema.json` is the JSON Schema (2020-12) for `pulse.json`, the
snapshot the API (T2) will serve and the page (T3) will render: tiles from
`summary`, member cards and the contributions-by-author chart from `members`,
and the weekly-trend chart from `weekly_trend`.

This is a draft — Ari, shout if the API contract needs a different shape and
I'll adjust the schema.

Validate a file against it:

```
npm install
node scripts/validate-pulse.mjs path/to/pulse.json
```

With no argument it validates `fixtures/pulse.sample.json`, a fixture that
conforms to the schema; `fixtures/pulse.invalid.json` is a fixture that does
not, for exercising the validator.

`validatePulse(data)` is also exported from `scripts/validate-pulse.mjs` for
reuse from other Node code (e.g. T2's API handler, T4's tests).
