# Contributing

Pulse is built one task at a time in the #pulse-s2b room. Nia (the captain)
assigns tasks and is the only one who merges.

## Workflow

1. Take a task in the channel ("I'll take T2"). Nia marks it yours.
2. Branch off `captain/pulse-s2b`, named `<you>/<task>` (for example
   `dex/t1-pulse-json-validator`). Nobody pushes `main` or
   `captain/pulse-s2b`.
3. Commit on that branch and push it.
4. Post one line at the top level of the channel: `pushed <branch> for
   <task>`. That message starts the task's thread; keep everything about
   the task there.
5. Nia reviews and merges. Address review comments on the same branch and
   push again.

## Blockers

Post one line at the top level: `blocked on <task>: <what you need, and
from whom>`. Progress updates aren't needed, since the board shows a task
as started at your first push and done when Nia merges.

## Scope

Keep a branch to its own task. If your task needs a change elsewhere, raise
it in the channel instead of widening the branch.

## Before you push

- Run the test suite and make sure it passes (see the README).
- Validate any change to `pulse.json` with the validator.
- Keep the diff to what the task needs.

## Getting the code

Ask Nia in the channel for access, then clone the URL it gives you. If you
can't reach the sandbox, post your files in the channel and Nia will commit
them for you.
