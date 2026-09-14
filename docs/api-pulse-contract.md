# API contract — GET /api/pulse

Serves the team's weekly check-ins (mood + note per member) for the
dashboard (member cards + weekly mood trend per project, per T4).

## Request

```
GET /api/pulse
GET /api/pulse?project=<project>
GET /api/pulse?week=<YYYY-Www>
GET /api/pulse?project=<project>&week=<YYYY-Www>
```

- `project` (optional) — a project id as it appears in `pulse.json`.
- `week` (optional) — an ISO week, e.g. `2026-W37`. Must match
  `^\d{4}-W\d{2}$`.

Both params are filters over the same dataset: omit either to get
everything.

## Response

`200 application/json`, always this shape (arrays empty, never omitted,
when a filter matches nothing):

```json
{
  "projects": [
    {
      "project": "team-pulse",
      "weeks": [
        {
          "week": "2026-W37",
          "average_mood": 3.7,
          "checkins": [
            { "member": "gavrielc", "mood": 4, "note": "shipped the schema" },
            { "member": "pulse-s2b", "mood": 3, "note": "context switching a lot" }
          ]
        }
      ]
    }
  ],
  "members": [
    { "member": "gavrielc", "mood": 4, "note": "shipped the schema", "week": "2026-W37" },
    { "member": "pulse-s2b", "mood": 3, "note": "context switching a lot", "week": "2026-W37" }
  ]
}
```

- `projects[].weeks[]` is sorted ascending by `week`, and `week.average_mood`
  (mean of that week's `mood` values, rounded to 1 decimal) is what T4 plots
  as the weekly trend for that project.
- `members[]` is what T4's member cards render: each member's *latest*
  check-in within the currently-filtered scope (`?project=` narrows to that
  project's check-ins; `?week=` narrows to that week, so "latest" collapses
  to it) — not an aggregate. `week` on each entry says which week that
  mood/note is from.
- `mood` is an integer 1–5 (1 = struggling, 5 = great). `note` is free text,
  `""` if a member skipped it. Scale/fields to be confirmed against T1's
  schema.

## Errors

- `400` `{ "error": "invalid week" }` — `week` given but not
  `YYYY-Www`.
- `404` `{ "error": "unknown project" }` — `project` given but no such
  project exists in the dataset. (`week` finding nothing is not an error —
  it's a valid week with no check-ins — so it returns `200` with empty
  arrays.)

## Source data (assumption, for T1 to confirm)

The API reads a `pulse.json` at the repo root, shaped as:

```json
{
  "projects": [
    {
      "project": "team-pulse",
      "weeks": [
        {
          "week": "2026-W37",
          "checkins": [
            { "member": "gavrielc", "mood": 4, "note": "shipped the schema" }
          ]
        }
      ]
    }
  ]
}
```

The API derives `average_mood` and the top-level `members[]` latest-checkin
view from this at request time — `pulse.json` itself doesn't need to carry
them precomputed. Field names here (`member`, `mood`, `note`) are what T3's
implementation expects; if T1's validated schema differs, ping pulse-api and
this doc (and the T3 implementation) will be updated to match.
