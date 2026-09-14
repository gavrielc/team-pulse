# Pulse v1

A team-health page for team-pulse. Members post a weekly check-in against a
project with a mood score and a short note. A small Node server reads that
data from `pulse.json` and serves it over a JSON API, plus a single-page view
that shows the latest mood per member and a weekly trend per project.

## Requirements

- Node 18 or newer.
- No dependencies. The server uses only the Node standard library, and the
  page has no build step.

## Data model

All data lives in `pulse.json`: a list of members, a list of projects, and a
flat list of checkins.

Abridged example (the file in the repo is larger, with several weeks of
check-ins and at least one member who has not checked in yet):

```json
{
  "members": [
    { "id": "alice", "name": "Alice Kim" },
    { "id": "bob", "name": "Bob Diaz" },
    { "id": "carol", "name": "Carol Nguyen" }
  ],
  "projects": [
    { "id": "atlas", "name": "Atlas" },
    { "id": "nova", "name": "Nova" }
  ],
  "checkins": [
    { "member": "alice", "project": "atlas", "week": "2026-W05", "mood": 4, "note": "Kicked off the sprint" }
  ]
}
```

Schema rules:

1. `mood` is an integer from 1 to 5.
2. `week` matches `^\d{4}-W\d{2}$`, the ISO-style `YYYY-Www` form (for example
   `2026-W05`).
3. Every check-in's `member` and `project` must reference an id that exists
   in `members` and `projects` respectively.

## Running the server

```
npm start
```

The server listens on port 3000 by default. Set the `PORT` environment
variable to override it.

Then open http://localhost:3000/ for the page. The server also serves the
raw data at `GET /pulse.json`.

Note: `index.html` is still under review and not merged yet, so `GET /` may
have nothing to serve in your checkout. The API below works regardless.

## API

### `GET /api/pulse?project=<id>&week=<week>`

Check-ins for one project in one week.

```
curl 'http://localhost:3000/api/pulse?project=atlas&week=2026-W05'
```

Response format:

```json
{
  "project": "atlas",
  "week": "2026-W05",
  "checkins": [
    { "member": "alice", "name": "Alice Kim", "mood": 4, "note": "Kicked off the sprint" }
  ]
}
```

### `GET /api/pulse?project=<id>`

With no `week`, the weekly trend for the project, oldest week first.

```
curl 'http://localhost:3000/api/pulse?project=atlas'
```

Response format:

```json
{
  "project": "atlas",
  "trend": [
    { "week": "2026-W05", "averageMood": 4, "count": 1 }
  ]
}
```

### Errors

- 400 when `project` is missing, or when it is not the id of a known project.
- 500 when `pulse.json` cannot be read or parsed.

A known project with a week that has no check-ins is not an error. The
response is 200 with an empty `checkins` array.

## Validating the data

`validate.js` checks `pulse.json` against the schema rules above. Run it as
a CLI:

```
node validate.js pulse.json
```

The CLI exits 0 when the file is valid and 1 when it is invalid or cannot be
read, so it works in a pre-push check.
