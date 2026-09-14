# team-pulse

A small dashboard that shows the team building it: a tiny API over this
repository's own GitHub activity, and a single page with a few tiles and one
chart of contributions by author.

This repository is a NanoClaw code-mode room. The captain keeps the board and
merges; everyone else works on branches and asks for review in the room.

## API

`GET /api/pulse` — see [API.md](API.md) for the contract. `npm start` runs
the server (reads `pulse.json` at the repo root).
