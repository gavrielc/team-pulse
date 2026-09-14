# team-pulse

Pulse v1: a small team-health page. A JSON file holds members, projects, and
weekly check-ins (mood + a note); a tiny Node API serves it filtered by
project and week; a static page renders a card per member and a weekly mood
trend per project.

This repository is a NanoClaw code-mode room. The captain (Ry) keeps the
board and merges; everyone else works on branches and asks for review in the
room.

## Contract (settled — build against this)

### `pulse.json` (root)

```json
{
  "members": [
    { "id": "alice", "name": "Alice Kim" }
  ],
  "projects": [
    { "id": "atlas", "name": "Atlas" }
  ],
  "checkins": [
    { "member": "alice", "project": "atlas", "week": "2026-W03", "mood": 4, "note": "Shipped the API" }
  ]
}
```

- `members[].id`, `projects[].id`: unique, non-empty strings.
- `checkins[].member` / `.project`: must reference an existing member/project id.
- `checkins[].week`: ISO week string, must match `^\d{4}-W\d{2}$`.
- `checkins[].mood`: integer 1–5.
- `checkins[].note`: string, may be empty.

### Validator — owned by Dex (T1)

`validate.js` exports `validate(data) -> { valid: boolean, errors: string[] }`
checking the shape above (including the id-reference and week-regex checks),
and doubles as a CLI: `node validate.js pulse.json` exits non-zero and prints
`errors` on failure.

### API — owned by Ari (T2)

`server.js`, plain `node:http`, no framework/dependencies. Listens on
`process.env.PORT || 3000`.

`GET /api/pulse?project=<id>&week=<week>` — both query params optional.

Response `200`:

```json
{
  "members": [{ "id": "alice", "name": "Alice Kim" }],
  "projects": [{ "id": "atlas", "name": "Atlas" }],
  "checkins": [{ "member": "alice", "project": "atlas", "week": "2026-W03", "mood": 4, "note": "Shipped the API" }]
}
```

`members` and `projects` are always the full lists (the page needs them to
render cards regardless of filter); `checkins` is filtered to the given
`project` and/or `week` when present, otherwise all check-ins.

Errors: unknown `project` id → `404 { "error": "unknown project: <id>" }`;
`week` not matching the regex above → `400 { "error": "invalid week: <week>" }`.

The server also serves `index.html` and `pulse.json` statically (`GET /`,
`GET /pulse.json`), so the page works when opened through the same server.

For testability, `server.js` exports a `createServer()` that returns a plain
`http.Server` not yet listening — tests start it on an ephemeral port
(`listen(0)`) rather than importing a fixed port.

### Page — owned by Wen (T3)

`index.html`, no build step, no framework. On load, `fetch('/api/pulse')`
(no query params — the full set) and render:

- one card per member: name, latest check-in's mood and note (latest = max
  `week` string for that member across all their check-ins); "no check-ins
  yet" when a member has none.
- one weekly trend per project: weeks sorted ascending, one point per week
  (average `mood` across that project's check-ins that week).

### Tests — owned by Tess (T4)

`node --test` (built-in runner, no dependencies). `test/schema.test.js`
against `validate.js` (valid sample, and one case per validation rule above).
`test/api.test.js` starts `createServer()` on an ephemeral port and checks:
unfiltered, project-only, week-only, project+week, unknown project (404),
bad week (400).

## Layout

```
pulse.json       # T1, Dex
validate.js      # T1, Dex
server.js        # T2, Ari
index.html       # T3, Wen
test/            # T4, Tess
```
