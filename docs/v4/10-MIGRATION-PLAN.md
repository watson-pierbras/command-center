# Command Center v4 — Migration Plan

## Overview

Migrate from Command Center v3 (static JSON files on GitHub Pages) to v4 (Cloudflare Workers + D1 + Pages).

## What Gets Migrated

### From `board.json` (11 tasks)

Each task becomes an object in D1:

```
board.json task → objects row (type: "task")
  - id: generate new ULID (keep old ID in properties.legacyId for reference)
  - name: task.title
  - status: map from v3 status (done/active/planned/blocked)
  - properties: {
      description: task.notes,
      priority: task.priority,
      estimate: task.estimate,
      timeSpent: task.timeTracking.totalMinutes,
      tags: task.tags,
      legacyId: task.id
    }
  - created_by: task.agent (mapped to actor name)
  - created_at: task.createdAt
  - updated_at: task.updatedAt
```

Associations created for each task:
- `belongs_to` → project (mapped from task.project)
- `assigned_to` → agent (mapped from task.agent)
- `blocked_by` / `blocks` → other tasks (mapped from task.dependencies)
- `subtask_of` / `has_subtask` → parent/child tasks (mapped from task.subtasks)

### From `projects.json` (4 projects)

Each project becomes an object:

```
projects.json project → objects row (type: "project")
  - name: project.name
  - status: "active" (default, adjust based on task states)
  - properties: {
      description: project.description,
      color: assign from project color palette,
      budget: project.budget,
      startDate: project.startDate,
      targetDate: project.targetDate,
      legacyId: project.id
    }
```

### From `agents.json` (3 agents)

Each agent becomes an object:

```
agents.json agent → objects row (type: "agent")
  - name: agent.name
  - status: "active"
  - properties: {
      role: agent.role,
      description: agent.description,
      model: agent.model,
      avatar: agent.avatar,
      capabilities: agent.capabilities,
      legacyId: agent.id
    }
```

## Status Mapping

### v3 → v4 Task Status
| v3 Status | v4 Status |
|-----------|-----------|
| `done` | `done` |
| `active` | `active` |
| `planned` | `planned` |
| `blocked` | `blocked` |

### v3 → v4 Priority
| v3 Priority | v4 Priority |
|-------------|-------------|
| `high` | `high` |
| `medium` | `medium` |
| `low` | `low` |

## Migration Steps

### Step 1: Export v3 Data

```bash
# Capture current state
cp board.json board-v3-backup.json
cp projects.json projects-v3-backup.json
cp agents.json agents-v3-backup.json
```

### Step 2: Deploy D1 Schema

```bash
# Create D1 database
wrangler d1 create command-center

# Run migrations
wrangler d1 execute command-center --file=./migrations/001-initial.sql
```

### Step 3: Run Import Script

Watson runs the import via the `/api/import` endpoint:

```javascript
// Import v3 data
const response = await fetch('https://api.example.com/api/import', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${WATSON_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    board: boardJson,
    projects: projectsJson,
    agents: agentsJson
  })
});
```

The import endpoint handles:
1. Create agent objects first (referenced by tasks)
2. Create project objects (referenced by tasks)
3. Create task objects
4. Create all associations (belongs_to, assigned_to, blocks, subtasks)
5. Create initial activities (type: "created", actor: "system", data: { note: "Migrated from v3" })

### Step 4: Verify

1. Count objects: should match v3 totals (4 projects, 11 tasks, 3 agents)
2. Check associations: each task linked to its project and agent
3. Check dashboard: progress percentages should match v3
4. Screenshot v4 dashboard, compare to v3

### Step 5: Cutover

1. Update Watson's API integration to use v4 endpoints
2. Update HEARTBEAT.md to check v4 instead of v3
3. Redirect old GitHub Pages URL to new Cloudflare Pages URL
4. Keep v3 repo as read-only archive for 30 days
5. After 30 days with no issues, archive v3

## Rollback Plan

If migration fails:
1. v3 is untouched (different hosting, different data)
2. Simply revert Watson's integration to v3 endpoints
3. v3 continues working as before

## Data Integrity Checks

Post-migration verification queries:

```sql
-- Object counts
SELECT type, COUNT(*) FROM objects WHERE deleted_at IS NULL GROUP BY type;
-- Expected: project=4, task=11, agent=3

-- Association counts
SELECT label, COUNT(*) FROM associations GROUP BY label;
-- Expected: belongs_to=11, assigned_to=11, blocks/blocked_by pairs for dependencies

-- Orphan check
SELECT id, name FROM objects
WHERE type = 'task'
AND id NOT IN (SELECT from_id FROM associations WHERE label = 'belongs_to');
-- Expected: 0 rows (all tasks belong to a project)

-- Progress check per project
SELECT p.name,
  COUNT(t.id) as total,
  SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done
FROM objects p
JOIN associations a ON a.from_id = p.id AND a.label = 'has_task'
JOIN objects t ON t.id = a.to_id
WHERE p.type = 'project'
GROUP BY p.id;
```

## Timeline

| Phase | Timing | Dependency |
|-------|--------|------------|
| Schema design | Done (this doc) | — |
| D1 deployment | After Cloudflare account setup | Paul creates account |
| Import script | After D1 deployed | D1 ready |
| Data migration | After import script tested | Script verified |
| Frontend cutover | After frontend v4 approved | Design approved |
| Full cutover | After everything verified | All tests pass |
