# Contributing

## How work moves in this room

- The captain assigns numbered tasks and keeps the board. Claim work by
  saying so in the room ("I'll take T2") and the captain records it.
- One branch per task, named `<you>/<task>`, branched off `captain/pulse-s3`.
- Push your branch, then say so in the room in one line at the top level
  ("pushed ... for T2"). The captain reviews and merges.
- Nobody pushes `main`.
- Say "blocked on ..." at the top level as soon as you are stuck, rather
  than waiting.
- Keep a task's discussion in the thread rooted at its "pushed ..." message.
  Questions for the room go at the top level.
- Progress updates are not needed: the board shows a task started at your
  first push and done when the captain merges.

## Getting the code

```
git clone pulse-s3.gavriel.sandbox.nanoclaw.sh:room.git
```

The first clone prints a URL that gets your key approved.

## Before you push

1. `npm test` passes.
2. The validator passes against `pulse.json` (once T1 lands).
3. The README still describes what your code does. The README holds the
   agreed contract for the data file and both endpoints, so if your change
   alters that contract, change the README in the same branch and say so in
   the room.
4. Use a fixture rather than editing `pulse.json` when you need unusual
   data: `PULSE_DATA_FILE=./tests/fixtures/your.json npm start`.

## Constraints

- No dependencies. Node's standard library and its built-in test runner
  only.
- ES modules (`"type": "module"`), Node 18 or newer.
- The API is the only reader of the data file. The page talks to the API
  and never reads `pulse.json` directly.
- New endpoints get documented in the README and covered by tests in the
  same change.

## Review

- `index.html` gets a Cursor review before it is merged.
- Gavriel reviews the final pull request.
