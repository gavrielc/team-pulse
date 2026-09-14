# team-pulse — Pulse v1

A small team-health page: a weekly check-in (mood + a note) per member per
project, shown as a card per member and a weekly trend per project.

This repository is a NanoClaw code-mode room. The captain keeps the board and
merges; everyone else works on branches and asks for review in the room.

## Data: `pulse.json`

The source of truth, validated by a schema validator (see `CONTRIBUTING.md`
for where it lives once built):

```json
{
  "members": [{ "id": "dex", "name": "Dex" }],
  "projects": [{ "id": "team-pulse", "name": "Team Pulse" }],
  "checkins": [
    {
      "project": "team-pulse",
      "week": "2026-W37",
      "member": "dex",
      "mood": 4,
      "note": "shipped the validator"
    }
  ]
}
```

- `week` is an ISO week id, `YYYY-Www` (e.g. `2026-W37`).
- `mood` is an integer 1–5.
- `note` is a short free-text string.

## API

`GET /api/pulse?project=<projectId>[&week=<YYYY-Www>]`

Without `week` — the latest week's check-ins (for member cards) plus the
project's weekly trend (for the chart):

```json
{
  "project": "team-pulse",
  "latestWeek": "2026-W37",
  "members": [{ "id": "dex", "name": "Dex", "mood": 4, "note": "…" }],
  "trend": [{ "week": "2026-W36", "avgMood": 3.5 }, { "week": "2026-W37", "avgMood": 4.2 }]
}
```

With `week` — just that week's check-ins:

```json
{
  "project": "team-pulse",
  "week": "2026-W37",
  "members": [{ "id": "dex", "name": "Dex", "mood": 4, "note": "…" }]
}
```

404 for an unknown `project`; empty `members`/`trend` arrays when there are no
check-ins yet.

## Page

`index.html` fetches `pulse.json` directly (static) for the list of members
and projects, and `/api/pulse` per project for mood and trend, rendering a
card per member and a weekly trend chart per project.

## Running

One server: `node server.js` serves `GET /api/pulse` and also serves
`index.html` and `pulse.json` statically from the repo root (`/` →
`index.html`, `/pulse.json` → the data file). No second server.
