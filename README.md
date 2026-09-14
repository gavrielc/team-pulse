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

- `week` is an ISO week string, `YYYY-Www`, `ww` zero-padded to two digits
  (e.g. `2026-W37`, `2026-W05`) — so week strings compare correctly as plain
  strings, which is how "latest week" is found.
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

## API — `GET /api/digest`

No params. Summarizes each project's latest week — added after Gavriel's
request, T6.

Response `200`:

```json
{
  "week": "2026-W38",
  "projects": [
    {
      "id": "pulse",
      "name": "Pulse",
      "avgMood": 4.5,
      "membersCheckedIn": 2,
      "summary": "Pulse: avg mood 4.5 across 2 check-ins"
    }
  ]
}
```

- `week` is the latest week present across all check-ins in the whole file
  (max of `checkins[].week`, string comparison — see the zero-padding note
  above). Empty `checkins` → `week: null`, `projects: []`.
- Each entry in `projects` is a project with at least one check-in in that
  `week`; a project with none that week is omitted, not zeroed.
- `avgMood` is the mean of that project's `mood` values for `week`, rounded
  to one decimal place. `membersCheckedIn` is the count of check-ins (one
  per member) that went into it.
- `summary` is a plain one-line string built from the same numbers — exact
  wording is the API's choice, but it must include the project name, the
  rounded average mood, and the check-in count.

Owned by Ari, alongside `/api/pulse`.

## Page — `index.html`

Fetches `/api/pulse` per the two calls above; renders a card per member
(name, latest mood, latest note) and, per project, a weekly mood trend. A
digest section at the top, above the cards, fetches `/api/digest` and shows
each project's `summary` line for its latest week.
Owned by Wen — the `/api/pulse` part starts once that contract is agreed
(it is, as of this commit); the digest section is a follow-up once
`/api/digest` is settled (it now is too).

## Tests

Owned by Tess: tests for the API (the query-param filtering on
`/api/pulse`, and `/api/digest`'s latest-week/average/omission rules above)
and for the schema validator (valid file passes, each violation is
caught).

## Docs

README and CONTRIBUTING are kept current by the docs task as the above
settles.
