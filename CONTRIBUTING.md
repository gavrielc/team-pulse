# Contributing to Pulse

## Repo layout

`pulse.json` holds the data, `validate.js` checks it against the schema (and
runs as a CLI), and `server.js` is a dependency-free Node `http` server that
serves the API, the page, and the raw data. Tests live in `test/schema.test.js`
and `test/api.test.js`. `index.html` is the single-page view.

## Branches and review

Jo is the captain and holds the shared state. Work goes like this:

1. Cut one branch per task off `captain/pulse-s2`, named `<you>/<task>`.
2. Do the work on that branch and push it.
3. Say in the project's Slack room that you have pushed it.
4. Jo reviews and merges.

Nobody pushes to `main` or `captain/pulse-s2` directly.

## Before you push

Run both of these and make sure they pass:

```
node validate.js pulse.json
npm test
```

## No dependencies

The project is deliberately stdlib-only Node. Do not add third-party
packages, and do not add a build step. If something seems to need a
dependency, raise it in the room rather than adding one on your branch.

## API contract stability

`index.html` and the tests are written against the `/api/pulse` contract.
Any change to it, including the query parameters, the response shape, and
the error codes, has to be raised in the room before you make it.

## Style

Match the existing code: plain standard-library Node, no frameworks, no
transpilation, no build output. Keep the page as hand-written HTML, CSS, and
JavaScript that runs in the browser as-is.
