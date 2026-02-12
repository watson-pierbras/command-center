# Command Center v4 — Validation Rules

## Object Validation

### Common Rules (all object types)

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `type` | string | ✅ | Must be one of: `project`, `task`, `agent`, `milestone` |
| `name` | string | ✅ | 1–200 characters, trimmed |
| `status` | string | ✅ | Must be valid for the object type (see below) |
| `properties` | object | No | Validated per type schema |

### Project

**Allowed statuses**: `active`, `paused`, `completed`, `archived`

**Status transitions**:
```
active → paused, completed, archived
paused → active, archived
completed → active, archived
archived → active
```

**Properties schema**:
| Property | Type | Required | Validation |
|----------|------|----------|------------|
| `description` | string | No | Max 5000 chars |
| `color` | string | No | Must be one of 8 project colors |
| `icon` | string | No | Max 50 chars |
| `budget.allocated` | number | No | >= 0 |
| `budget.currency` | string | No | 3-letter ISO code (default: "USD") |
| `startDate` | string | No | ISO 8601 date (YYYY-MM-DD) |
| `targetDate` | string | No | ISO 8601 date, must be >= startDate |
| `priority` | string | No | `high`, `medium`, `low` |

### Task

**Allowed statuses**: `planned`, `active`, `in_review`, `done`, `blocked`

**Status transitions**:
```
planned → active, blocked
active → in_review, done, blocked, planned
in_review → active, done, blocked
done → active (reopen)
blocked → planned, active (when unblocked)
```

**Properties schema**:
| Property | Type | Required | Validation |
|----------|------|----------|------------|
| `description` | string | No | Max 5000 chars |
| `priority` | string | No | `high`, `medium`, `low` (default: `medium`) |
| `estimate` | string | No | Duration string (e.g., "4h", "2d", "30m") |
| `timeSpent` | number | No | Minutes, >= 0 |
| `dueDate` | string | No | ISO 8601 date |
| `blockedReason` | string | No | Required when status is `blocked` |
| `tags` | array | No | Array of strings, max 10, each max 50 chars |

**Association constraints**:
- Must have exactly one `belongs_to → Project` association (enforced on creation)
- May have zero or more `assigned_to → Agent` associations
- `blocks` / `subtask_of` / `related_to` cannot reference self

### Agent

**Allowed statuses**: `active`, `idle`, `offline`

**Status transitions**: Any → Any (no restrictions)

**Properties schema**:
| Property | Type | Required | Validation |
|----------|------|----------|------------|
| `role` | string | No | Max 100 chars |
| `description` | string | No | Max 1000 chars |
| `model` | string | No | Max 100 chars |
| `avatar` | string | No | Max 10 chars (emoji or short string) |
| `capabilities` | array | No | Array of strings, max 20 |
| `currentTask` | string | No | Valid task ID or null |

### Milestone

**Allowed statuses**: `active`, `completed`, `missed`

**Status transitions**:
```
active → completed, missed
completed → active (reopen)
missed → active (reopen)
```

**Properties schema**:
| Property | Type | Required | Validation |
|----------|------|----------|------------|
| `description` | string | No | Max 2000 chars |
| `targetDate` | string | No | ISO 8601 date |
| `completedDate` | string | No | ISO 8601 date, set when status → completed |

**Association constraints**:
- Must have exactly one `belongs_to → Project` association

## Association Validation

### Creation Rules

| Label | From Type | To Type | Cardinality | Notes |
|-------|-----------|---------|-------------|-------|
| `has_task` | project | task | 1:N | Project can have many tasks |
| `has_milestone` | project | milestone | 1:N | Project can have many milestones |
| `has_member` | project | agent | 1:N | Project can have many agents |
| `assigned_to` | task | agent | N:M | Task can have multiple assignees |
| `blocks` | task | task | N:M | No self-reference, no cycles |
| `subtask_of` | task | task | N:1 | Task has at most one parent; no cycles |
| `related_to` | task | task | N:M | No self-reference |
| `part_of` | task | milestone | N:M | Task can be in multiple milestones |

### Cycle Detection

For `blocks` and `subtask_of`, the API must check for cycles before creating:
- Walk the chain from `to_id` following the same label
- If `from_id` is encountered, reject with `409 CYCLE_DETECTED`
- Maximum chain depth: 10 (prevent performance issues)

### Duplicate Prevention

The `UNIQUE(from_id, to_id, label)` constraint prevents duplicate associations. Attempting to create a duplicate returns `409 DUPLICATE_ASSOCIATION`.

## Activity Validation

### Manual Activity Creation

Only these action types can be created manually via `POST /api/objects/:id/activities`:

| Action | Required Data Fields |
|--------|---------------------|
| `comment` | `text` (1–5000 chars) |
| `time_logged` | `minutes` (> 0), optional `note` |
| `attachment` | `url` (valid URL), `filename`, optional `type` |

All other action types (`created`, `updated`, `status_changed`, `assigned`, etc.) are system-generated only. Attempting to create them returns `400 SYSTEM_ACTION_ONLY`.

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Field-level validation failure |
| `INVALID_STATUS_TRANSITION` | 400 | Status change not allowed |
| `SYSTEM_ACTION_ONLY` | 400 | Cannot manually create system activities |
| `MISSING_ASSOCIATION` | 400 | Required association missing (e.g., task without project) |
| `SELF_REFERENCE` | 400 | Association from/to same object |
| `INVALID_ASSOCIATION` | 400 | Association label not valid for object types |
| `NOT_FOUND` | 404 | Object or association not found |
| `DUPLICATE_ASSOCIATION` | 409 | Association already exists |
| `CYCLE_DETECTED` | 409 | Association would create a dependency cycle |
| `CONFLICT` | 409 | Optimistic concurrency conflict (stale `updated_at`) |
