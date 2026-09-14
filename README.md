# team-pulse

Pulse v1: a small team-health page. A data file holds members, projects and
weekly check-ins (mood + a note); a tiny API reads it; a page shows a digest,
a card per member, and a weekly mood trend per project.

This repository is a NanoClaw code-mode room. The captain keeps the board and
merges; everyone else works on branches and asks for review in the room. See
CONTRIBUTING.md.

## Layout

- `pulse.json` + `validate-pulse.js` — the data file and a CLI that checks
  it against the schema below (T1).
- `server.js` — the HTTP server: `GET /api/pulse`, `GET /api/digest` (T2,
  T6), and `index.html` at `GET /`.
- `index.html` — the page (T3, in review).
- `tests/*.test.js` — API and schema tests (T4).

## Running

Node 18 or newer. Nothing to install.

```
npm start   # node server.js, listens on $PORT (default 3000)
npm test    # node --test tests/*.test.js
```

`server.js` reads its data from `$PULSE_DATA_FILE`, falling back to
`pulse.json` in the working directory — point it at a fixture instead of
editing the real file:

```
PORT=4000 PULSE_DATA_FILE=./tests/fixtures/valid.json npm start
```

`server.js` also serves `index.html` at `GET /` (and `GET /index.html`), so
the page and the API share an origin: `npm start` and open
`http://localhost:3000/`.

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

Owned by Dex: `pulse.json` plus its validator — a CLI that checks the shape
above and exits non-zero with a clear message on the first violation.

### Validator

```
node validate-pulse.js              # checks pulse.json
node validate-pulse.js other.json   # checks the file you name
```

`validate-pulse.js` checks the file against the shape above and exits
non-zero with a clear message on the first violation. With no argument it
checks `pulse.json` in the working directory; the schema tests pass a path
to run it against the fixtures in `tests/fixtures/`.

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

No params. Summarizes each project's latest week.

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

## Errors

- `405` with `{"error": "method not allowed"}` for any method other than
  `GET` on a documented route.
- `500` with `{"error": "failed to read pulse data"}` when the data file is
  missing, unreadable or not valid JSON.
- `404` with `{"error": "not found"}` for an unknown route. `GET /` also
  returns this until `index.html` lands with T3.

## Page — `index.html`

Fetches `/api/pulse` and `/api/digest`; renders a digest section at the top
(each project's `summary` for its latest week), a card per member (name,
latest mood, latest note), and, per project, a weekly mood trend.
Owned by Wen.

## Tests

Owned by Tess. Merged: `/api/pulse` query-param filtering and the `404` for
unknown routes (`tests/api.test.js`), and the schema validator
(`tests/schema.test.js`, a valid file passes and each violation is caught).
Tests for `/api/digest`'s latest-week, average and omission rules are still
open.

## Docs

README and CONTRIBUTING are kept current by the docs task as the above
settles.
