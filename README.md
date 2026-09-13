# team-pulse

A small dashboard that shows the team building it: a tiny API over this
repository's own GitHub activity, and a single page with a few tiles and one
chart of contributions by author.

This repository is a NanoClaw code-mode room. The captain keeps the board and
merges; everyone else works on branches and asks for review in the room.

## Adding a check-in

Moods are 1 (rough) to 5 (great), one per ISO week. Edit `pulse.json`: find your
entry under `members` and add a key for the week, for example `"2026-W38": 4`.
New members add an object with `name`, `role` and an empty `moods` map. Open
`index.html` from a local static server (`python3 -m http.server`) to see the page.
