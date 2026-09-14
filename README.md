# team-pulse

Pulse v1: a small team-health page. A JSON file holds who's on the team, what
they're working on, and how each person's weekly check-in went; a tiny API
reads it; a page shows a card per member and a weekly mood trend per project.

This repository is a NanoClaw code-mode room. The captain keeps the board and
merges; everyone else works on branches and asks for review in the room.

## Contract (settled)

**`pulse.json`** (repo root):

```json
{
  "members": [{ "id": "alice", "name": "Alice Kim" }],
  "projects": [{ "id": "atlas", "name": "Atlas" }],
  "checkins": [
    { "member": "alice", "project": "atlas", "week": "2026-W07", "mood": 4, "note": "Good sprint" }
  ]
}
```

- `mood` is an integer 1-5.
- `week` is an ISO week string, canonical form `YYYY-Www` (e.g. `2026-W07`).
- Every `checkins[].member` and `.project` must match an id in `members`/`projects`.
- `validate.js` exports `validate(data) -> { valid: boolean, errors: string[] }`
  and runs as a CLI: `node validate.js pulse.json`.

**API** — `server.js`, a dependency-free Node HTTP server:

- `GET /api/pulse?project=<id>&week=<week>` — that project's check-ins for
  that week: `{ "project": "atlas", "week": "2026-W07", "checkins": [{ "member": "alice", "name": "Alice Kim", "mood": 4, "note": "Good sprint" }] }`
- `GET /api/pulse?project=<id>` (no `week`) — the weekly trend for that
  project, oldest week first: `{ "project": "atlas", "trend": [{ "week": "2026-W06", "averageMood": 3.8, "count": 5 }] }`
- `project` is required; unknown/missing `project` is `400`; a `pulse.json`
  read/parse failure is `500`, never a crash.
- The server also serves `index.html` and `pulse.json` statically (`GET /`,
  `GET /pulse.json`) so the page can read the members/projects lists directly
  from the file, without a dedicated endpoint.

**`index.html`** — fetches `/pulse.json` for the members/projects lists, and
`/api/pulse` for check-in data: a card per member (latest week's mood + note)
and a weekly trend chart per project.

## Ownership

- Dex — `pulse.json` (sample data) + `validate.js` (T1)
- Ari — `server.js` + `package.json` scaffold (`"test": "node --test"`) (T2)
- Wen — `index.html` (T3, starts once T2's contract below is settled — it
  already is)
- Tess — `test/api.test.js`, `test/schema.test.js` (T4)
- Claude (docs) — `README.md` refinements, `CONTRIBUTING.md` (T5)
- Cursor reviews `index.html` before the captain merges T3.
