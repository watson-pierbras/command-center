# Command Center v4 — Query Plans & Index Strategy

## Critical Queries

These are the most frequently executed queries. Each must perform within target latency.

### 1. Dashboard Aggregation (`GET /api/dashboard`)

**Target**: <200ms

```sql
-- Project summary with task counts (single query)
SELECT
  p.id,
  p.name,
  p.status,
  json_extract(p.properties, '$.color') as color,
  COUNT(t.id) as task_count,
  SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_count,
  SUM(CASE WHEN t.status = 'active' THEN 1 ELSE 0 END) as active_count,
  SUM(CASE WHEN t.status = 'blocked' THEN 1 ELSE 0 END) as blocked_count
FROM objects p
LEFT JOIN associations a ON a.from_id = p.id AND a.label = 'has_task' AND a.deleted_at IS NULL
LEFT JOIN objects t ON t.id = a.to_id AND t.deleted_at IS NULL
WHERE p.type = 'project' AND p.deleted_at IS NULL
GROUP BY p.id
ORDER BY p.updated_at DESC;
```

**Indexes used**: `idx_objects_type`, `idx_assoc_from`

```sql
-- Recent activity (global, last 10)
SELECT
  act.id, act.object_id, act.object_type, act.actor, act.action, act.data, act.created_at,
  obj.name as object_name
FROM activities act
JOIN objects obj ON obj.id = act.object_id
ORDER BY act.created_at DESC
LIMIT 10;
```

**Index used**: `idx_activities_global`

```sql
-- Blocked/attention items
SELECT
  o.id, o.name, o.status, o.updated_at,
  json_extract(o.properties, '$.blockedReason') as blocked_reason
FROM objects o
WHERE o.type = 'task'
  AND o.status = 'blocked'
  AND o.deleted_at IS NULL
ORDER BY o.updated_at ASC;
```

**Index used**: `idx_objects_status`

**Strategy**: Dashboard handler executes these 3 queries in a D1 batch for single round-trip:
```typescript
const [projects, recentActivity, blocked] = await env.DB.batch([
  projectsStmt,
  activityStmt,
  blockedStmt,
]);
```

### 2. Object List (`GET /api/objects?type=task&status=active`)

**Target**: <150ms

```sql
SELECT *
FROM objects
WHERE type = ? AND status = ? AND deleted_at IS NULL
ORDER BY updated_at DESC
LIMIT ? OFFSET 0;
-- (cursor-based: WHERE updated_at < ? for pagination)
```

**Index**: `idx_objects_status` (type, status, WHERE deleted_at IS NULL)

### 3. Object Detail with Associations (`GET /api/objects/:id?include=associations,activities`)

**Target**: <200ms

```sql
-- Object
SELECT * FROM objects WHERE id = ? AND deleted_at IS NULL;

-- Associations (both directions)
SELECT
  a.*,
  o.name as related_name,
  o.type as related_type,
  o.status as related_status
FROM associations a
JOIN objects o ON o.id = CASE WHEN a.from_id = ? THEN a.to_id ELSE a.from_id END
WHERE (a.from_id = ? OR a.to_id = ?) AND a.deleted_at IS NULL;

-- Recent activities
SELECT * FROM activities
WHERE object_id = ?
ORDER BY created_at DESC
LIMIT 10;
```

**Indexes**: Primary key lookup, `idx_assoc_from`, `idx_assoc_to`, `idx_activities_object`

**Strategy**: Batch all 3 queries.

### 4. Unread Activities for Watson (`GET /api/activities?actor=paul&unread=true`)

**Target**: <100ms

```sql
SELECT act.*
FROM activities act
LEFT JOIN activity_reads ar ON ar.activity_id = act.id AND ar.actor = 'watson'
WHERE act.actor = 'paul'
  AND ar.activity_id IS NULL  -- Not read by watson
ORDER BY act.created_at DESC
LIMIT 20;
```

**Indexes**: `idx_activities_actor`, `idx_reads_actor`

### 5. Project Tasks List (`GET /api/projects/:id/tasks`)

**Target**: <150ms

```sql
SELECT t.*
FROM objects t
JOIN associations a ON a.to_id = t.id AND a.label = 'has_task' AND a.deleted_at IS NULL
WHERE a.from_id = ?
  AND t.deleted_at IS NULL
ORDER BY
  CASE t.status
    WHEN 'blocked' THEN 0
    WHEN 'active' THEN 1
    WHEN 'in_review' THEN 2
    WHEN 'planned' THEN 3
    WHEN 'done' THEN 4
  END,
  t.updated_at DESC;
```

**Indexes**: `idx_assoc_from`

### 6. Search (`GET /api/objects?q=dashboard`)

**Target**: <300ms

```sql
SELECT *
FROM objects
WHERE deleted_at IS NULL
  AND (
    name LIKE '%' || ? || '%'
    OR json_extract(properties, '$.description') LIKE '%' || ? || '%'
  )
ORDER BY
  CASE WHEN name LIKE ? || '%' THEN 0 ELSE 1 END,  -- Prefix matches first
  updated_at DESC
LIMIT 20;
```

**Note**: LIKE with leading `%` can't use standard indexes. For our scale (<1000 objects), this is fine. If it becomes slow, add FTS5:

```sql
-- Future optimization: Full-text search
CREATE VIRTUAL TABLE objects_fts USING fts5(name, description, content=objects, content_rowid=rowid);
```

## Index Summary

```sql
-- Objects
CREATE INDEX idx_objects_type ON objects(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_objects_status ON objects(type, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_objects_created ON objects(created_at DESC);
CREATE INDEX idx_objects_updated ON objects(updated_at DESC);

-- Associations
CREATE INDEX idx_assoc_from ON associations(from_id, label) WHERE deleted_at IS NULL;
CREATE INDEX idx_assoc_to ON associations(to_id, label) WHERE deleted_at IS NULL;
CREATE INDEX idx_assoc_types ON associations(from_type, to_type, label) WHERE deleted_at IS NULL;

-- Activities
CREATE INDEX idx_activities_object ON activities(object_id, created_at DESC);
CREATE INDEX idx_activities_actor ON activities(actor, created_at DESC);
CREATE INDEX idx_activities_global ON activities(created_at DESC);

-- Activity reads
CREATE INDEX idx_reads_actor ON activity_reads(actor);
```

## D1 Batch Strategy

D1 supports batching multiple queries in a single round-trip. Use this for:
- Dashboard (3 queries → 1 batch)
- Object detail with includes (3 queries → 1 batch)
- Create object with associations (insert + N association inserts → 1 batch)
- Soft-delete cascade (object update + association updates → 1 batch)

```typescript
// All queries execute in a single round-trip to D1
const results = await env.DB.batch([
  env.DB.prepare('SELECT ...').bind(...),
  env.DB.prepare('SELECT ...').bind(...),
  env.DB.prepare('INSERT ...').bind(...),
]);
```

## Performance Budget

| Operation | Target | Measured | Status |
|-----------|--------|----------|--------|
| Dashboard load | <200ms | TBD | — |
| Object list (20 items) | <150ms | TBD | — |
| Object detail + associations | <200ms | TBD | — |
| Create object + associations | <100ms | TBD | — |
| Update object | <50ms | TBD | — |
| Activity feed (20 items) | <150ms | TBD | — |
| Search (LIKE) | <300ms | TBD | — |

Will be filled in during Phase 2 (backend implementation) with actual measurements.
