# Task Relationships Migration Guide - v3.0 to v3.1

## Overview

This guide details how to migrate existing tasks from Command Center v3.0 to the new relationships structure in v3.1.

---

## Current State (v3.0)

Tasks have no relationship fields:

```json
{
  "id": "task-abc12345-0001",
  "title": "Example Task",
  "column": "active",
  "priority": "high",
  "project": "Infrastructure",
  "notes": "Task description...",
  "dueDate": "2026-02-15",
  "assignedAgent": "watson",
  "model": "gpt-4",
  "estimatedTime": "4h",
  "estimatedCost": 2.50,
  "comments": [],
  "history": []
}
```

## Target State (v3.1)

Tasks gain a `relationships` object:

```json
{
  "id": "task-abc12345-0001",
  "title": "Example Task",
  "column": "active",
  "priority": "high",
  "project": "Infrastructure",
  "notes": "Task description...",
  "dueDate": "2026-02-15",
  "assignedAgent": "watson",
  "model": "gpt-4",
  "estimatedTime": "4h",
  "estimatedCost": 2.50,
  "comments": [],
  "history": [],
  "relationships": {
    "parent": null,
    "subtasks": [],
    "dependencies": {
      "blocks": [],
      "blockedBy": [],
      "related": [],
      "duplicates": [],
      "supersedes": []
    }
  }
}
```

---

## Migration Steps

### Step 1: Backup Existing Data

```bash
# Create backup before migration
cp tasks.json tasks.v3.0.backup.json
cp board.json board.v3.0.backup.json
```

### Step 2: Add Relationships to All Tasks

For each task in `tasks.json` or `board.json`, add the default relationships structure:

```javascript
// Migration script pseudo-code
for (const task of tasks) {
  // Add relationships if not present
  if (!task.relationships) {
    task.relationships = {
      parent: null,
      subtasks: [],
      dependencies: {
        blocks: [],
        blockedBy: [],
        related: [],
        duplicates: [],
        supersedes: []
      }
    };
  }
  
  // Update metadata version
  if (!task.metadata) {
    task.metadata = {};
  }
  task.metadata.version = (task.metadata.version || 0) + 1;
}
```

### Step 3: Handle Project Reference Migration

If also migrating project references:

```javascript
// Convert project string to object (optional, separate migration)
if (typeof task.project === 'string') {
  task.project = {
    id: `proj-${slugify(task.project)}-2024`,
    name: task.project,
    slug: slugify(task.project)
  };
}
```

### Step 4: Validate Migration

Run validation checks:

```javascript
// Validation checklist
const errors = [];

for (const task of tasks) {
  // Check relationships object exists
  if (!task.relationships) {
    errors.push(`${task.id}: Missing relationships object`);
  }
  
  // Check required sub-fields
  const rel = task.relationships || {};
  if (!('parent' in rel)) errors.push(`${task.id}: Missing relationships.parent`);
  if (!Array.isArray(rel.subtasks)) errors.push(`${task.id}: relationships.subtasks must be an array`);
  if (!rel.dependencies || typeof rel.dependencies !== 'object') {
    errors.push(`${task.id}: Missing or invalid relationships.dependencies`);
  }
}

if (errors.length > 0) {
  console.error('Migration validation failed:', errors);
  process.exit(1);
}
```

---

## Backward Compatibility

### For v3.0 Clients

- New `relationships` field is **optional** - clients can ignore it
- Existing fields remain unchanged
- Tasks without relationships are treated as standalone (no parent, no subtasks, no dependencies)

### Compatibility Shims

```javascript
// Client-side shim for v3.0 compatibility
function getTaskRelationships(task) {
  // Return default relationships if not present
  return task.relationships || {
    parent: null,
    subtasks: [],
    dependencies: {
      blocks: [],
      blockedBy: [],
      related: [],
      duplicates: [],
      supersedes: []
    }
  };
}

function isTaskBlocked(task) {
  const rel = getTaskRelationships(task);
  const hasBlockers = rel.dependencies?.blockedBy?.length > 0;
  // Check if blockers are completed
  if (hasBlockers) {
    return rel.dependencies.blockedBy.some(blockerId => {
      const blocker = findTaskById(blockerId);
      return blocker && blocker.column !== 'done';
    });
  }
  return false;
}
```

---

## Data Integrity Rules

After migration, enforce these constraints:

| Rule | Enforcement | Severity |
|------|-------------|----------|
| No self-reference | Task cannot be its own parent/subtask/dependency | ERROR |
| Parent must exist | If parent !== null, referenced task must exist | ERROR |
| Subtasks must exist | All subtask IDs must reference valid tasks | WARNING |
| Dependency targets exist | Referenced dependencies should exist | WARNING |
| No cyclic dependencies | A cannot block B if B blocks A (direct or indirect) | ERROR |
| Hierarchy depth ≤ 5 | Parent-child chain cannot exceed 5 levels | ERROR |
| Bidirectional consistency | If A.blocks includes B, B.blockedBy should include A | AUTO-FIX |

---

## Migration Commands

### Automated Migration Script

```bash
# Run the migration tool
node scripts/migrate-tasks-v3.1.js \
  --input tasks.json \
  --output tasks.v3.1.json \
  --validate \
  --backup

# Options:
#   --dry-run       Preview changes without writing
#   --validate      Run validation after migration
#   --backup        Create timestamped backup
#   --verbose       Show detailed progress
```

### Rollback Procedure

```bash
# Restore from backup
cp tasks.v3.0.backup.json tasks.json

# Or use migration rollback
node scripts/migrate-tasks-v3.1.js --rollback --backup-file tasks.v3.0.backup.json
```

---

## Post-Migration Checklist

- [ ] All tasks have `relationships` object
- [ ] No validation errors on migrated data
- [ ] v3.0 clients can still read tasks
- [ ] New v3.1 features work with migrated tasks
- [ ] Backup files stored safely
- [ ] Migration log reviewed for warnings

---

## API Versioning

Use `Accept-Version` header for backward compatibility:

```http
# v3.0 client - receives flat structure
GET /api/tasks/task-abc12345-0001
Accept-Version: 3.0

# v3.1 client - receives full structure
GET /api/tasks/task-abc12345-0001
Accept-Version: 3.1
```

Server strips `relationships` field for v3.0 requests if needed.
