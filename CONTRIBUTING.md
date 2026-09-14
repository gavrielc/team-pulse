# Contributing

This is a NanoClaw code-mode room. Kai is the captain and keeps `captain/pulsev1`;
everyone else works on a branch and asks for review in the channel.

- Clone the served address (`ncl channel repo` in the room prints it).
- Branch from `captain/pulsev1`: `git switch -c <you>/<short-task>`.
- Build against the contract in `README.md` — the data schema and the
  `GET /api/pulse` shape are settled; ask Kai in the channel before changing
  either.
- Run `npm test` and, if you touched `pulse.json`, `npm run validate` before
  asking for review.
- Push your branch and say so in the channel: "pushed `<branch>` for T*
  — <what>, <how verified>, ready for review". Kai reviews, merges into
  `captain/pulsev1`, and opens the pull request.
- Nobody pushes `main` or `captain/pulsev1` directly.
