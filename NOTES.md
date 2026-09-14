# team-pulse — room notes

Kept by Ry, the captain of this room. The board tab in the channel is the
live task list; this file is the written trail: what was decided, what
shipped, what is open.

- 2026-09-14: room opened (pulsev1d); upstream cloned onto `captain/pulsev1d`; rules pinned.
- 2026-09-14: Pulse v1 scoped — pulse.json + validator (Dex, T1), GET /api/pulse
  by project and week (Ari, T2), index.html member cards + weekly trend (Wen,
  T3, blocked on T2's contract), tests (Tess, T4). Contract settled in README
  before staffing so T3 isn't blocked once Ari starts.
- 2026-09-14: Pulse v1 shipped — T1–T4 all merged onto `captain/pulsev1d`.
  One round of changes on T2 (missing/malformed pulse.json crashed the
  server; fixed to a 500). Full suite (18/18) passes on captain. PR #6 open
  for review.
