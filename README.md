# team-pulse

Pulse v1 is a small team-health page. Members record a weekly check-in (a
mood from 1 to 5 and a short note) against a project. A tiny Node API serves
that data, and a single page shows a card per member plus a weekly mood
trend per project.

All the data lives in `pulse.json` at the repository root. There is no
database.

## Quick start

    npm install
    npm start               # run the server (API and page) on http://localhost:3000
    npm test                # api.test.js + schema.test.js, via node --test
    npm run validate:pulse  # check pulse.json against the schema

## The data file

`pulse.json` holds three lists:

- `members`: `{id, name}`
- `projects`: `{id, name}`
- `checkins`: `{member, project, week, mood, note}`

`mood` is an integer from 1 to 5, `note` is a string and may be empty, and
`week` is an ISO week such as `2026-W37`. Every `checkin.member` and
`checkin.project` must reference an id that exists in `members` or
`projects`.

`pulse.schema.json` is the JSON Schema for that shape. `validate-pulse.js`
checks a file against the schema and also enforces those references; run it
with `npm run validate:pulse` after editing the data.

Set `PULSE_DATA_FILE` to point the server at a different file.

Set `PORT` to serve on a different port (default 3000).

## The API

`GET /api/pulse` returns members, projects and check-ins. Narrow the
check-ins with the optional `member`, `project` and `week` query
parameters, which are combined with AND. Members and projects always come
back in full, so a client can resolve names without a second request.

[API.md](API.md) is the source of truth for the response shape and the
error codes; read it before changing `server.js`.

## The page

`index.html` shows a card per member with their latest check-in, plus a
weekly average-mood trend per project, fetched from `GET /api/pulse`.
`server.js` serves it at `/` (and `/index.html`).

## Layout

- `pulse.json`: the data
- `pulse.schema.json`: its JSON Schema
- `validate-pulse.js`: schema and referential-integrity validator
- `server.js`: the API
- `API.md`: the API contract
- `index.html`: the page, served by `server.js` at `/`
- `tests/`: `api.test.js`, `schema.test.js` and fixtures
- `NOTES.md`: working notes

## Contributing

Branch off `captain/pulse-s2c`, push, and ask for review in the channel.
See [CONTRIBUTING.md](CONTRIBUTING.md).
