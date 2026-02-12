# Command Center v4 — API Specification

## Base URL

```
Production: https://command-center-api.<account>.workers.dev
Development: http://localhost:8787
```

## Authentication

All requests require a Bearer token:

```
Authorization: Bearer <token>
```

Two token types:
- **Watson token**: Full API access (stored in OpenClaw config)
- **Session token**: Browser access (stored in localStorage, rotatable)

Unauthenticated requests return `401`.

## Response Envelope

Every response follows this structure:

```json
{
  "data": {},          // Single object or array
  "meta": {            // Pagination, counts
    "total": 42,
    "cursor": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "hasMore": true
  },
  "errors": []         // Array of error objects (empty on success)
}
```

### Error Format

```json
{
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

## Pagination

Cursor-based pagination on all list endpoints:

```
GET /api/objects?limit=20&cursor=01ARZ3NDEKTSV4RRFFQ69G5FAV
```

- `limit`: 1–100 (default: 20)
- `cursor`: ULID of the last item from previous page
- Response `meta.hasMore` indicates if more pages exist

## Endpoints

---

### Objects

#### `GET /api/objects`

List objects with optional filters.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `type` | string | Filter by object type (`project`, `task`, `agent`, `milestone`) |
| `status` | string | Filter by status |
| `created_by` | string | Filter by creator |
| `q` | string | Search name and description |
| `sort` | string | Sort field: `created_at`, `updated_at`, `name` (default: `updated_at`) |
| `order` | string | `asc` or `desc` (default: `desc`) |
| `limit` | number | Results per page (default: 20) |
| `cursor` | string | Pagination cursor |
| `includeDeleted` | boolean | Include soft-deleted objects (default: false) |

**Response:**
```json
{
  "data": [
    {
      "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "type": "task",
      "name": "Design dashboard view",
      "status": "active",
      "properties": { ... },
      "created_by": "watson",
      "created_at": "2026-02-12T20:00:00Z",
      "updated_at": "2026-02-12T21:30:00Z"
    }
  ],
  "meta": { "total": 42, "hasMore": true, "cursor": "..." }
}
```

#### `GET /api/objects/:id`

Get a single object with its associations and recent activities.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `include` | string | Comma-separated: `associations`, `activities`, `stats` |
| `activityLimit` | number | Number of recent activities to include (default: 10) |

**Response:**
```json
{
  "data": {
    "id": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
    "type": "project",
    "name": "Command Center v4",
    "status": "active",
    "properties": { ... },
    "created_by": "watson",
    "created_at": "2026-02-12T20:00:00Z",
    "updated_at": "2026-02-12T21:30:00Z",
    "associations": [
      {
        "id": "01ARZ...",
        "label": "has_task",
        "object": {
          "id": "01ARZ...",
          "type": "task",
          "name": "Design dashboard",
          "status": "active"
        }
      }
    ],
    "activities": [
      {
        "id": "01ARZ...",
        "actor": "watson",
        "action": "comment",
        "data": { "text": "Dashboard wireframes complete" },
        "created_at": "2026-02-12T21:00:00Z"
      }
    ],
    "stats": {
      "taskCount": 8,
      "completedCount": 3,
      "progress": 37.5,
      "activeCount": 2,
      "blockedCount": 1
    }
  }
}
```

#### `POST /api/objects`

Create a new object.

**Request Body:**
```json
{
  "type": "task",
  "name": "Design dashboard view",
  "status": "planned",
  "properties": {
    "description": "Create the main dashboard layout",
    "priority": "high",
    "estimate": "4h"
  },
  "associations": [
    { "to_id": "01ARZ...", "label": "belongs_to" }
  ]
}
```

**Notes:**
- `created_by` is set from the auth token identity
- `id` is auto-generated (ULID)
- `associations` array is optional — creates associations in the same transaction
- Returns the created object with `201`

#### `PATCH /api/objects/:id`

Update an object's properties. Supports partial updates.

**Request Body:**
```json
{
  "name": "Design dashboard view (revised)",
  "status": "active",
  "properties": {
    "priority": "high",
    "estimate": "6h"
  }
}
```

**Headers (optional but recommended):**
```
If-Unmodified-Since: <updated_at value from GET>
```

**Notes:**
- `properties` are **merged** (not replaced) — send only changed fields
- Status changes auto-create a `status_changed` activity
- Property changes auto-create an `updated` activity with diff
- If `If-Unmodified-Since` is provided and doesn't match current `updated_at`, returns `409 CONFLICT` with the current object state
- Returns the updated object

#### `DELETE /api/objects/:id`

Soft-delete an object.

**Notes:**
- Sets `deleted_at` timestamp
- Cascade: soft-deletes orphaned associations
- Auto-creates a `deleted` activity
- Returns `204 No Content`

---

### Type-Specific Shortcuts

Convenience endpoints that wrap `/api/objects` with type filters and additional computed data.

#### `GET /api/projects`
Same as `GET /api/objects?type=project` but each project includes computed `stats`.

#### `GET /api/projects/:id`
Same as `GET /api/objects/:id?include=associations,activities,stats` for a project.

#### `GET /api/projects/:id/tasks`
Get all tasks associated with a project.

#### `GET /api/projects/:id/milestones`
Get all milestones associated with a project.

#### `GET /api/tasks`
Same as `GET /api/objects?type=task`.

**Additional filters:**
| Param | Type | Description |
|-------|------|-------------|
| `project` | string | Filter by project ID |
| `agent` | string | Filter by assigned agent ID |
| `priority` | string | Filter by priority |

#### `GET /api/agents`
Same as `GET /api/objects?type=agent`.

---

### Associations

#### `POST /api/associations`

Create an association between two objects.

**Request Body:**
```json
{
  "from_id": "01ARZ...",
  "to_id": "01ARZ...",
  "label": "blocks"
}
```

**Notes:**
- Automatically creates the inverse association (e.g., `blocks` creates `blocked_by`)
- Validates that both objects exist and the association label is valid for the object types
- Returns `201` with the created association(s)

#### `DELETE /api/associations/:id`

Remove an association.

**Notes:**
- Also removes the inverse association
- Returns `204 No Content`

#### `GET /api/objects/:id/associations`

List all associations for an object.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `label` | string | Filter by association label |
| `direction` | string | `from`, `to`, or `both` (default: `both`) |

---

### Activities

#### `GET /api/objects/:id/activities`

Get the activity timeline for an object.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `action` | string | Filter by action type |
| `actor` | string | Filter by actor |
| `limit` | number | Results per page (default: 20) |
| `cursor` | string | Pagination cursor |

#### `POST /api/objects/:id/activities`

Add an activity (comment, note, time log) to an object.

**Request Body:**
```json
{
  "action": "comment",
  "data": {
    "text": "Dashboard wireframes look good. Moving to implementation."
  }
}
```

**Notes:**
- `actor` is set from auth token identity
- Only `comment`, `time_logged`, and `attachment` actions can be manually created
- Other actions (`status_changed`, `created`, etc.) are system-generated

#### `GET /api/activities`

Global activity feed across all objects.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `actor` | string | Filter by actor |
| `action` | string | Filter by action type |
| `object_type` | string | Filter by object type |
| `unread` | boolean | Only activities without a read receipt for the current actor |
| `limit` | number | Results per page (default: 20) |
| `cursor` | string | Pagination cursor |

#### `POST /api/activities/:id/read`

Mark an activity as read for the current actor.

**Notes:**
- Creates a row in `activity_reads` table
- Actor determined from auth token
- Idempotent — calling again is a no-op
- Returns `204 No Content`

#### `POST /api/activities/read-bulk`

Mark multiple activities as read.

**Request Body:**
```json
{
  "ids": ["01ARZ...", "01ARZ..."]
}
```

**Notes:**
- Batch operation, max 100 IDs per request
- Returns `204 No Content`

---

### Dashboard

#### `GET /api/dashboard`

Aggregated dashboard data in a single request.

**Response:**
```json
{
  "data": {
    "summary": {
      "totalProjects": 4,
      "activeProjects": 3,
      "totalTasks": 11,
      "completedTasks": 6,
      "activeTasks": 1,
      "blockedTasks": 1,
      "overallProgress": 55
    },
    "projects": [
      {
        "id": "...",
        "name": "Command Center v4",
        "status": "active",
        "progress": 0,
        "taskCount": 0,
        "activeCount": 0,
        "color": "#4F46E5"
      }
    ],
    "recentActivity": [
      {
        "id": "...",
        "actor": "watson",
        "action": "status_changed",
        "objectName": "Design dashboard",
        "objectType": "task",
        "data": { "from": "planned", "to": "active" },
        "created_at": "2026-02-12T21:00:00Z"
      }
    ],
    "unreadCount": 3,
    "agentStatus": [
      {
        "id": "...",
        "name": "Watson",
        "status": "active",
        "currentTask": "Design dashboard"
      }
    ]
  }
}
```

---

### System

#### `GET /api/health`

Health check endpoint.

```json
{
  "status": "ok",
  "version": "4.0.0",
  "d1": "connected",
  "timestamp": "2026-02-12T21:00:00Z"
}
```

#### `POST /api/migrate`

Run database migrations. Admin only (Watson token).

#### `POST /api/import`

Import data from v3 format (board.json, projects.json, agents.json). Admin only.

**Request Body:**
```json
{
  "board": { ... },
  "projects": { ... },
  "agents": { ... }
}
```

## Rate Limiting

- Global: 1000 requests/minute per token
- Write operations: 100/minute per token
- Burst: up to 50 concurrent requests

These are generous for a single-user system but prevent accidental loops.

## Versioning

API version is included in the response header:
```
X-API-Version: 4.0.0
```

No URL versioning — the API is versioned by the Worker deployment. Breaking changes trigger a new major version.
