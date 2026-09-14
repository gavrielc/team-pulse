# team-pulse

A small dashboard that shows the team building it: a tiny API over this
repository's own GitHub activity, and a single page with a few tiles and one
chart of contributions by author.

This repository is a NanoClaw code-mode room. The captain keeps the board and
merges; everyone else works on branches and asks for review in the room.

## Pulse v1 contract

A team-health page: a member card per project/week check-in, and a weekly
mood trend per project.

### `pulse.json`

```json
{
  "members": [
    { "id": "amy", "name": "Amy Chen", "role": "backend" }
  ],
  "projects": [
    { "id": "team-pulse", "name": "Team Pulse" }
  ],
  "checkins": [
    {
      "member": "amy",
      "project": "team-pulse",
      "week": "2026-W37",
      "mood": 4,
      "note": "shipped the API stub"
    }
  ]
}
```

- `week` is an ISO week string, `YYYY-Www` (e.g. `2026-W37`).
- `mood` is an integer 1–5.
- `member` and `project` reference `members[].id` / `projects[].id`.
- The validator checks: required fields present and correctly typed, `mood`
  in range, `week` matches the ISO week pattern, and every check-in's
  `member`/`project` resolves to a known id.

### API: `GET /api/pulse`

Query params: `project` (required, a `projects[].id`), `week` (optional, a
`week` string as above).

- **With `week`**: returns that week's check-ins for the project, one entry
  per member who checked in — the shape a member card needs.

  ```json
  {
    "project": "team-pulse",
    "week": "2026-W37",
    "checkins": [
      { "member": "amy", "name": "Amy Chen", "mood": 4, "note": "shipped the API stub" }
    ]
  }
  ```

- **Without `week`**: returns the project's mood trend across all weeks it
  has check-ins for, one point per week — the shape the trend chart needs.

  ```json
  {
    "project": "team-pulse",
    "trend": [
      { "week": "2026-W36", "averageMood": 3.5 },
      { "week": "2026-W37", "averageMood": 4 }
    ]
  }
  ```

- Unknown `project`: `404` with `{ "error": "unknown project" }`. Known
  `project` with no check-ins for the given `week`: `200` with an empty
  `checkins` array (not a `404`).
