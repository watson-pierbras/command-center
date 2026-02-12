# Command Center v4 — Data Model

## Philosophy

Inspired by HubSpot's CRM architecture:
- **Everything is an object** with a type and typed properties
- **Associations** connect objects to each other with labeled relationships
- **Activities** track every interaction on every object
- The schema is generic enough to add new object types without migrations

## Core Tables

### `objects`

The universal object store. Every entity in the system is a row here.

```sql
CREATE TABLE objects (
  id          TEXT PRIMARY KEY,          -- ULID (sortable, unique)
  type        TEXT NOT NULL,             -- 'project' | 'task' | 'agent' | 'milestone'
  name        TEXT NOT NULL,             -- Display name
  status      TEXT NOT NULL DEFAULT 'active',  -- Object-type-specific status
  properties  TEXT NOT NULL DEFAULT '{}',      -- JSON blob of typed properties
  created_by  TEXT NOT NULL,             -- 'paul' | 'watson' | 'codex' | 'system'
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at  TEXT DEFAULT NULL          -- Soft delete
);

CREATE INDEX idx_objects_type ON objects(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_objects_status ON objects(type, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_objects_created ON objects(created_at DESC);
CREATE INDEX idx_objects_updated ON objects(updated_at DESC);
```

### `associations`

Links between any two objects. Bidirectional by convention (query from either side).

```sql
CREATE TABLE associations (
  id          TEXT PRIMARY KEY,          -- ULID
  from_id     TEXT NOT NULL,             -- Source object
  from_type   TEXT NOT NULL,             -- Denormalized for query performance
  to_id       TEXT NOT NULL,             -- Target object
  to_type     TEXT NOT NULL,             -- Denormalized for query performance
  label       TEXT NOT NULL,             -- Relationship type (see labels below)
  properties  TEXT NOT NULL DEFAULT '{}',-- Optional metadata (e.g., role, order)
  created_by  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at  TEXT DEFAULT NULL,         -- Soft delete (cascaded from object deletion)

  FOREIGN KEY (from_id) REFERENCES objects(id),
  FOREIGN KEY (to_id) REFERENCES objects(id),
  UNIQUE(from_id, to_id, label)         -- No duplicate associations
);

CREATE INDEX idx_assoc_from ON associations(from_id, label) WHERE deleted_at IS NULL;
CREATE INDEX idx_assoc_to ON associations(to_id, label) WHERE deleted_at IS NULL;
CREATE INDEX idx_assoc_types ON associations(from_type, to_type, label) WHERE deleted_at IS NULL;
```

### `activities`

The timeline for every object. Comments, status changes, assignments — everything.

```sql
CREATE TABLE activities (
  id          TEXT PRIMARY KEY,          -- ULID
  object_id   TEXT NOT NULL,             -- Which object this activity is on
  object_type TEXT NOT NULL,             -- Denormalized
  actor       TEXT NOT NULL,             -- 'paul' | 'watson' | 'codex' | 'system'
  action      TEXT NOT NULL,             -- See action types below
  data        TEXT NOT NULL DEFAULT '{}',-- JSON: action-specific payload
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),

  FOREIGN KEY (object_id) REFERENCES objects(id)
);

CREATE INDEX idx_activities_object ON activities(object_id, created_at DESC);
CREATE INDEX idx_activities_actor ON activities(actor, created_at DESC);
CREATE INDEX idx_activities_global ON activities(created_at DESC);
```

### `activity_reads`

Per-user read tracking. Separate from the activity itself so read state is actor-specific.

```sql
CREATE TABLE activity_reads (
  activity_id TEXT NOT NULL,
  actor       TEXT NOT NULL,             -- 'paul' | 'watson'
  read_at     TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (activity_id, actor),
  FOREIGN KEY (activity_id) REFERENCES activities(id)
);

CREATE INDEX idx_reads_actor ON activity_reads(actor);
```

### `settings`

Key-value store for system configuration (dashboard preferences, view settings, etc.).

```sql
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,             -- JSON
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## Object Types

### Project

The top-level container. All work is organized under projects.

```json
{
  "type": "project",
  "name": "Command Center v4",
  "status": "active",          // active | paused | completed | archived
  "properties": {
    "description": "Complete UI/UX overhaul with CRM-style architecture",
    "color": "#4F46E5",        // Accent color for visual identification
    "icon": "terminal",        // Optional icon identifier
    "budget": {
      "allocated": 500.00,
      "currency": "USD"
    },
    "startDate": "2026-02-12",
    "targetDate": "2026-03-15",
    "priority": "high"         // high | medium | low
  }
}
```

**Associations from Project:**
- `has_task` → Task
- `has_milestone` → Milestone
- `has_member` → Agent (team members)

### Task

Individual work items. Always belong to a project.

```json
{
  "type": "task",
  "name": "Design the dashboard view",
  "status": "active",          // planned | active | in_review | done | blocked
  "properties": {
    "description": "Create the main dashboard layout with KPI cards",
    "priority": "high",        // high | medium | low
    "estimate": "4h",          // Time estimate string
    "timeSpent": 0,            // Minutes tracked
    "dueDate": "2026-02-15",
    "blockedReason": null,     // String when status is 'blocked'
    "tags": ["design", "frontend"]
  }
}
```

**Associations from Task:**
- `belongs_to` → Project (required, exactly one)
- `assigned_to` → Agent (one or more)
- `blocks` → Task (this task blocks another)
- `blocked_by` → Task (this task is blocked by another)
- `subtask_of` → Task (parent task)
- `has_subtask` → Task (child tasks)
- `related_to` → Task (loose association)
- `part_of` → Milestone

### Agent

Entities that do work. Watson, Codex, Ollama, or future agents.

```json
{
  "type": "agent",
  "name": "Watson",
  "status": "active",          // active | idle | offline
  "properties": {
    "role": "architect",       // architect | coder | local
    "description": "System architect, orchestrator, and QA gate",
    "model": "claude-opus-4-6",
    "avatar": "🔍",
    "capabilities": ["design", "review", "orchestration", "testing"],
    "currentTask": null        // Task ID or null
  }
}
```

**Associations from Agent** (queried via inverse):
- Agents don't create associations directly. Tasks are `assigned_to` agents, and projects `have_member` agents. Query agents' associations by looking at `to_id` where `to_type = 'agent'`.

### Milestone

Checkpoints within a project. Group related tasks into phases.

```json
{
  "type": "milestone",
  "name": "MVP Launch",
  "status": "active",          // active | completed | missed
  "properties": {
    "description": "Minimum viable product ready for daily use",
    "targetDate": "2026-03-01",
    "completedDate": null
  }
}
```

**Associations from Milestone:**
- `belongs_to` → Project (required, exactly one)
- `includes` → Task (tasks in this milestone)

## Association Labels

| Label | From → To | Meaning |
|-------|-----------|---------|
| `has_task` | Project → Task | Project contains this task |
| `belongs_to` | Task → Project | Task is part of this project |
| `has_milestone` | Project → Milestone | Project has this milestone |
| `has_member` | Project → Agent | Agent is on this project team |
| `member_of` | Agent → Project | Agent belongs to this project |
| `assigned_to` | Task → Agent | Task is assigned to this agent |
| `blocks` | Task → Task | Source blocks target |
| `blocked_by` | Task → Task | Source is blocked by target |
| `subtask_of` | Task → Task | Source is subtask of target |
| `has_subtask` | Task → Task | Source has this subtask |
| `related_to` | Task → Task | Loose relationship |
| `part_of` | Task → Milestone | Task belongs to this milestone |
| `includes` | Milestone → Task | Milestone includes this task |

### Canonical Direction

Each association is stored **once** with a canonical direction. The API returns associations from both sides but only one physical row exists per relationship.

| Stored Label | Canonical Direction | Inverse (derived at query time) |
|---|---|---|
| `has_task` | Project → Task | Task belongs_to Project |
| `has_milestone` | Project → Milestone | Milestone belongs_to Project |
| `has_member` | Project → Agent | Agent member_of Project |
| `assigned_to` | Task → Agent | Agent has_assignment Task |
| `blocks` | Task → Task | Task blocked_by Task |
| `subtask_of` | Task (child) → Task (parent) | Task has_subtask Task |
| `related_to` | Task → Task | Task related_to Task (symmetric) |
| `part_of` | Task → Milestone | Milestone includes Task |

**No inverse rows are stored.** The API resolves inverse labels at query time by swapping `from`/`to` perspective. This eliminates data drift and halves write operations.

When querying `/api/objects/:id/associations`, the API searches both `from_id = :id` and `to_id = :id`, applying the correct label perspective.

## Activity Action Types

| Action | Actor | Data Payload |
|--------|-------|--------------|
| `created` | any | `{}` |
| `updated` | any | `{ changes: [{ field, from, to }] }` |
| `deleted` | any | `{}` |
| `comment` | paul, watson | `{ text: "..." }` |
| `status_changed` | any | `{ from: "active", to: "done" }` |
| `assigned` | watson, paul | `{ agentId: "...", agentName: "..." }` |
| `unassigned` | watson, paul | `{ agentId: "...", agentName: "..." }` |
| `blocked` | any | `{ reason: "...", blockerId: "..." }` |
| `unblocked` | any | `{ blockerId: "..." }` |
| `milestone_completed` | system | `{ milestoneId: "...", milestoneName: "..." }` |
| `time_logged` | any | `{ minutes: 30, note: "..." }` |
| `attachment` | any | `{ url: "...", filename: "...", type: "..." }` |

## IDs

All IDs use **ULID** (Universally Unique Lexicographically Sortable Identifier):
- 26 characters, case-insensitive
- Sortable by creation time
- No coordination needed (Watson and Paul can both create without conflicts)
- Example: `01ARYZ6S41TSV4RRFFQ69G5FAV`

## Soft Deletes

**Policy**: Soft-delete everywhere. No hard deletes in the application layer.

- **Objects**: `deleted_at` set on the object row. All queries filter `WHERE deleted_at IS NULL` by default.
- **Associations**: When an object is soft-deleted, its associations are also soft-deleted (set `deleted_at` on association rows where `from_id` or `to_id` matches). Associations have their own `deleted_at` column.
- **Activities**: Never deleted. Activities are the audit trail — they persist even when the parent object is soft-deleted.
- **Restore**: Restoring an object (clearing `deleted_at`) also restores its associations. Activities don't need restoration since they're never deleted.
- **`?includeDeleted=true`**: Param on list endpoints allows viewing soft-deleted objects.
- **No CASCADE**: Foreign keys have no CASCADE action. Soft-delete cascade is handled in application logic within a D1 batch transaction.

## Migration from v3

See MIGRATION-PLAN.md for the full migration strategy. Summary:
- `board.json` tasks → `objects` (type: task)
- `projects.json` → `objects` (type: project) + associations
- `agents.json` → `objects` (type: agent)
- Task-project links → `associations` (belongs_to/has_task)
- Task-agent assignments → `associations` (assigned_to)
- Dependencies → `associations` (blocks/blocked_by)
