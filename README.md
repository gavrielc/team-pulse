# team-pulse

Pulse v1 — a small team-health page. Members check in weekly per project with
a mood and a note; the page shows a card per member and a weekly mood trend
per project.

This repository is a NanoClaw code-mode room. The captain keeps the board and
merges; everyone else works on branches and asks for review in the room.

## Layout and ownership

| Path                  | Owns                                      | Who  |
|------------------------|--------------------------------------------|------|
| `pulse.json`           | the data                                    | Dex  |
| `validate.js`          | schema + validator for `pulse.json`         | Dex  |
| `server.js`            | the API (`GET /api/pulse`)                  | Ari  |
| `index.html`           | the page                                    | Wen  |
| `test/`                | tests for the API and the schema            | Tess |
| `package.json`, docs   | shared scripts, README, CONTRIBUTING        | Kai  |

Plain Node, no framework and no dependencies: `server.js` uses the built-in
`http` module, tests use the built-in `node:test` runner.

```
npm start      # node server.js        — serves the API and index.html on :8080
npm test       # node --test           — runs everything under test/
npm run validate  # node validate.js pulse.json
```

## Data schema — `pulse.json`

```json
{
  "members": [
    { "id": "dex", "name": "Dex" }
  ],
  "projects": [
    { "id": "pulse", "name": "Team Pulse" }
  ],
  "checkins": [
    { "member": "dex", "project": "pulse", "week": "2026-W07", "mood": 4, "note": "shipped the schema" }
  ]
}
```

- `members[].id`, `projects[].id`: unique strings, referenced by check-ins.
- `checkins[].week`: ISO week, `YYYY-Www` (e.g. `2026-W07`, week `01`-`53`).
- `checkins[].mood`: integer `1`-`5`.
- `checkins[].note`: string, may be empty.
- A `(member, project, week)` triple is unique — one check-in per member per
  project per week.
- Every `checkins[].member` and `checkins[].project` must reference an entry
  in `members`/`projects`.

`validate.js` exports `validatePulse(data)` returning `{ ok: true }` or
`{ ok: false, errors: [string, ...] }`, and doubles as a CLI:
`node validate.js pulse.json` exits non-zero and prints the errors when
invalid.

## API contract — `GET /api/pulse`

Query params:

- `project` (required) — a `projects[].id`. Missing or unknown → `400`.
- `week` (optional) — `YYYY-Www`. Malformed → `400`. Defaults to the latest
  week that has any check-in for the project.

```
GET /api/pulse?project=pulse&week=2026-W07
```

```json
{
  "project": { "id": "pulse", "name": "Team Pulse" },
  "week": "2026-W07",
  "members": [
    { "id": "dex", "name": "Dex", "mood": 4, "note": "shipped the schema" }
  ],
  "trend": [
    { "week": "2026-W06", "avgMood": 3.5 },
    { "week": "2026-W07", "avgMood": 4.0 }
  ]
}
```

- `members`: one entry per member who checked in for that project/week; a
  member with no check-in that week is omitted (no zero-filling).
- `trend`: one entry per week that has at least one check-in for the project,
  ascending by week, `avgMood` the mean of that week's moods rounded to one
  decimal place.
- Errors are `400 { "error": "<message>" }`.

## Page — `index.html`

Fetches `GET /api/pulse` (project and week from query params or a page
control — Wen's call) and renders a card per member (name, mood, note) plus
the weekly trend for the project. No build step: plain HTML/CSS/JS served
statically by `server.js`.
