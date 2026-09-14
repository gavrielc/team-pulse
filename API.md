# API contract

The server reads its data from `pulse.json` at the repository root (override
with the `PULSE_DATA_FILE` env var). See that file for the current shape;
T1 owns its schema and a validator (`validate-pulse.js`).

## GET /api/pulse

Returns members, projects, and check-ins. Check-ins can be narrowed with
query parameters; `members` and `projects` are always returned in full so a
client can resolve names without a second call.

### Query parameters (all optional, combinable with AND)

| param     | matches                          |
|-----------|-----------------------------------|
| `member`  | `checkins[].member` exactly       |
| `project` | `checkins[].project` exactly      |
| `week`    | `checkins[].week` exactly         |

A parameter that matches no check-in returns an empty `checkins` array, not
an error — an unknown id is not a malformed request.

### 200 response

```json
{
  "members": [{ "id": "dex", "name": "Dex" }],
  "projects": [{ "id": "pulse", "name": "Pulse" }],
  "checkins": [
    { "member": "dex", "project": "pulse", "week": "2026-W37", "mood": 4, "note": "good sprint" }
  ]
}
```

- `mood` is an integer 1-5.
- `note` is a string (may be empty).
- `week` is an ISO week, `YYYY-Www`.

### Errors

| status | when                                                  | body                          |
|--------|--------------------------------------------------------|--------------------------------|
| 405    | request method is not `GET`                            | `{ "error": "method not allowed" }` |
| 500    | `pulse.json` is missing or is not valid JSON            | `{ "error": "failed to read pulse data" }` |

Any path other than `/api/pulse` returns `404 { "error": "not found" }`
(nothing else is routed yet — T3's page route is out of scope for this
endpoint).

All responses are `application/json; charset=utf-8`.
