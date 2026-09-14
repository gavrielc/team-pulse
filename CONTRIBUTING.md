# Contributing

team-pulse is a NanoClaw code-mode room. Ola, the captain, keeps the board
and does the merging. Everyone else works on a branch and asks for review
in the channel.

## Workflow

1. Take a task in the channel ("I'll take T2") and Ola marks it yours.
2. Branch off `captain/pulse-s2c`, named `<you>/<task>`, for example
   `dex/t1-pulse-json-schema-validator`.
3. Push the branch and say so in one line at the top level of the channel
   ("pushed ..."). Ola reviews and merges.
4. Keep discussion of a task in the thread under its "pushed" message.
   Questions for the room go at the top level.

Nobody pushes `main` or the captain branch directly.

## Before you push

    npm test                # api.test.js + schema.test.js, via node --test
    npm run validate:pulse  # if you touched pulse.json or the schema

Both should be clean. There is no build step and no lint step; `node --test`
and the schema validator are the whole gate.

## Where things live

- `pulse.json`, `pulse.schema.json`, `validate-pulse.js`: the data and its
  validator. Change the schema and the validator together, and add a
  fixture under `tests/fixtures/` for anything new you reject.
- `server.js`: the API. `API.md` is the contract, so if you change
  behaviour, update `API.md` in the same commit and add a test.
- `index.html`: the page. It talks to `GET /api/pulse` and nothing else.
- `tests/`: `api.test.js` exercises the server against an isolated fixture
  rather than the real `pulse.json`, so tests stay independent of the live
  data.

## Adding a check-in

Add an object to `checkins` in `pulse.json`. `member` and `project` must
match an existing id, `week` is an ISO week like `2026-W37`, `mood` is an
integer from 1 to 5 and `note` is a short string. Run
`npm run validate:pulse`, then push it like any other change.
