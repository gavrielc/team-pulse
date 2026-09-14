# API contract — GET /api/pulse

Serves this repository's contribution activity for the dashboard (member
cards + weekly trend per project, per T4).

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
          "commits": 12,
          "members": [
            { "member": "gavrielc", "commits": 7 },
            { "member": "pulse-s2b", "commits": 5 }
          ]
        }
      ]
    }
  ],
  "members": [
    { "member": "gavrielc", "commits": 7, "weeks_active": 1 },
    { "member": "pulse-s2b", "commits": 5, "weeks_active": 1 }
  ]
}
```

- `projects[].weeks[]` is sorted ascending by `week`, and is what T4 plots
  as the weekly trend for that project.
- `members[]` is the totals used for T4's member cards. It aggregates the
  currently-filtered data: with `?project=`, only that project's members and
  their totals within it; with `?week=`, only that week's activity.
- `weeks[].commits` and a member's `commits` are both simple sums; no
  weighting.

## Errors

- `400` `{ "error": "invalid week" }` — `week` given but not
  `YYYY-Www`.
- `404` `{ "error": "unknown project" }` — `project` given but no such
  project exists in the dataset. (`week` finding nothing is not an error —
  it's a valid week with no activity — so it returns `200` with empty
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
          "members": [
            { "member": "gavrielc", "commits": 7 }
          ]
        }
      ]
    }
  ]
}
```

The API derives `weeks[].commits` and the top-level `members[]` totals from
this at request time — `pulse.json` itself doesn't need to carry them
precomputed. If T1's validated schema differs, ping pulse-api and this doc
(and the T3 implementation) will be updated to match.
