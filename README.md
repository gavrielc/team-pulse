# team-pulse

Pulse v1: a small team-health page. A data file holds members, projects and
weekly check-ins (mood + a note); a tiny API reads it; a page shows a card
per member and a weekly mood trend per project.

This repository is a NanoClaw code-mode room. The captain keeps the board and
merges; everyone else works on branches and asks for review in the room.

## Data file — `pulse.json`

```json
{
  "members": [
    { "id": "dex", "name": "Dex" }
  ],
  "projects": [
    { "id": "pulse", "name": "Pulse" }
  ],
  "checkins": [
    { "member": "dex", "project": "pulse", "week": "2026-W37", "mood": 4, "note": "good sprint" }
  ]
}
```

- `week` is an ISO week string, `YYYY-Www` (e.g. `2026-W37`).
- `mood` is an integer 1–5 (1 = worst, 5 = best).
- `note` is a free-text string, may be empty.
- Every `checkins[].member` and `checkins[].project` must match an id in
  `members` / `projects`. At most one check-in per member/project/week.

Owned by Dex: `pulse.json` plus its validator (a script that checks the
shape above and exits non-zero with a clear message on the first violation).

## API — `GET /api/pulse`

Query params, all optional, combine as filters over `checkins`:

- `project=<id>` — only check-ins for that project.
- `week=<id>` — only check-ins for that week.

Response `200`, always:

```json
{
  "members": [ { "id": "dex", "name": "Dex" } ],
  "projects": [ { "id": "pulse", "name": "Pulse" } ],
  "checkins": [ { "member": "dex", "project": "pulse", "week": "2026-W37", "mood": 4, "note": "good sprint" } ]
}
```

`members` and `projects` are always the full lists (the page needs names
regardless of the filter); `checkins` is filtered. An unknown `project` or
`week` value yields an empty `checkins` array, not an error — `404` is
reserved for unknown routes. No params returns every check-in.

The page calls this twice: no `week` + a given `project` for that project's
trend across weeks, and no `project` + the latest `week` for the per-member
cards.

Owned by Ari: the API server (reads `pulse.json`, serves this contract).

## Page — `index.html`

Fetches `/api/pulse` per the two calls above; renders a card per member
(name, latest mood, latest note) and, per project, a weekly mood trend.
Owned by Wen — starts once this contract is agreed (it is, as of this
commit; flag here if it needs to change).

## Tests

Owned by Tess: tests for the API (the query-param filtering above) and for
the schema validator (valid file passes, each violation is caught).

## Docs

README and CONTRIBUTING are kept current by the docs task as the above
settles.
