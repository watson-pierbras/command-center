# Command Center v4 — Watson Integration Spec

## Overview

Watson (me) is both an operator and a user of Command Center v4. This document specifies exactly how Watson interacts with the system — replacing the current git-based workflow with API calls.

## Current Workflow (v3) — What We're Replacing

```
Watson reads board.json from filesystem
Watson edits board.json directly
Watson runs git add/commit/push
sync.sh runs every 5 minutes via launchd
Paul sees changes on GitHub Pages (with cache delay)
Paul comments on board.json via browser → sync.sh picks up changes
Watson checks .watson-inbox.json during heartbeat
```

**Problems**: Slow (5min sync), fragile (git conflicts), no real-time communication, no activity tracking.

## New Workflow (v4)

```
Watson calls REST API directly (instant)
Paul interacts via browser (instant)
Activities auto-logged on every mutation
Watson polls /api/activities?unread=true during heartbeat
Paul sees changes immediately (API-driven frontend)
Comments are activities on objects (real-time)
```

## Watson's API Usage Patterns

### 1. Morning Startup (Session Start)

```
Watson wakes up
→ GET /api/health (verify API is up)
→ GET /api/activities?actor=paul&unread=true (check Paul's inbox)
→ GET /api/dashboard (get overview)
→ Process any unread comments from Paul
→ POST /api/activities/:id/read (mark processed)
```

### 2. Heartbeat Check (Every 30 min)

```
→ GET /api/activities?actor=paul&unread=true
→ If unread comments exist:
    → Read each comment
    → Take action (update tasks, respond, etc.)
    → POST /api/objects/:id/activities {action: "comment", data: {text: "..."}}
    → POST /api/activities/:id/read (mark as read)
→ GET /api/dashboard (check for anomalies)
→ Report to Paul via Telegram if anything needs attention
```

### 3. Task Management

**Create a task:**
```javascript
POST /api/objects
{
  type: "task",
  name: "Implement dashboard view",
  status: "planned",
  properties: {
    description: "Build the main dashboard layout per spec",
    priority: "high",
    estimate: "4h"
  },
  associations: [
    { to_id: "<project-id>", label: "has_task" },
    { to_id: "<agent-id>", label: "assigned_to" }
  ]
}
```

**Update task status (e.g., after Codex completes work):**
```javascript
PATCH /api/objects/<task-id>
Headers: If-Unmodified-Since: <current-updated_at>
{
  status: "done",
  properties: {
    timeSpent: 120  // minutes
  }
}
```

**Add completion note:**
```javascript
POST /api/objects/<task-id>/activities
{
  action: "comment",
  data: {
    text: "Dashboard view implemented. Commit abc1234. Tested in browser — all KPI cards render correctly."
  }
}
```

### 4. Project Management

**Check project health:**
```javascript
GET /api/projects/<id>?include=associations,activities,stats
```

**Create milestone:**
```javascript
POST /api/objects
{
  type: "milestone",
  name: "MVP Launch",
  status: "active",
  properties: {
    targetDate: "2026-03-01"
  },
  associations: [
    { to_id: "<project-id>", label: "has_milestone" }
  ]
}
```

### 5. Responding to Paul

When Paul comments on a task, Watson sees it via activity polling:

```javascript
// Paul's comment appears as:
{
  id: "01ARZ...",
  object_id: "01ARZ...",
  actor: "paul",
  action: "comment",
  data: { text: "Can you prioritize this over the dashboard work?" },
  created_at: "2026-02-13T14:30:00Z"
}

// Watson responds:
POST /api/objects/<same-object-id>/activities
{
  action: "comment",
  data: {
    text: "On it. Reprioritizing now. Moving dashboard to next sprint."
  }
}

// Watson marks Paul's comment as read:
POST /api/activities/<paul-comment-id>/read
```

## Watson's HEARTBEAT.md Update

Replace current board inbox check with API check:

```markdown
## Quick Checks (every heartbeat)
- GET /api/health — verify API is up
- GET /api/activities?actor=paul&unread=true — process Paul's comments
- Check WIP.md — is there active work that needs progress?

## Rotating Checks
- GET /api/dashboard — verify numbers look right
- Email scan (gog CLI)
- Calendar check (gog CLI)
```

## Watson's Tools Configuration

Watson stores the API token in OpenClaw config (not in workspace files):

```jsonc
// In openclaw.json (via config.patch)
{
  "agents": {
    "defaults": {
      // API base URL stored in TOOLS.md for reference
    }
  }
}
```

The token is stored in `.secrets/command-center-api-token.txt` (gitignored) and Watson reads it at runtime.

## Notification Flow

```
Paul comments on task in browser
  → POST /api/objects/:id/activities (browser → API)
  → Activity created in D1
  → Watson polls during next heartbeat
  → GET /api/activities?actor=paul&unread=true
  → Watson reads comment, takes action
  → Watson posts response comment
  → Watson messages Paul on Telegram if urgent
```

For urgent notifications (future enhancement):
- Cloudflare Worker could call Watson's OpenClaw webhook on new Paul activities
- This would enable real-time response instead of 30-minute polling

## Error Handling

If API is unavailable during Watson's operations:
1. Log the error in daily memory file
2. Retry on next heartbeat
3. If down for >1 hour, alert Paul via Telegram
4. Fall back to direct Telegram messaging for critical updates

## Migration from v3 Workflow

| v3 Pattern | v4 Replacement |
|-----------|---------------|
| Read `board.json` | `GET /api/objects?type=task` |
| Edit `board.json` + git push | `PATCH /api/objects/:id` |
| Check `.watson-inbox.json` | `GET /api/activities?actor=paul&unread=true` |
| Run `board-ops.sh add-comment` | `POST /api/objects/:id/activities` |
| Run `board-ops.sh mark-processed` | `POST /api/activities/:id/read` |
| `sync.sh` (git sync every 5m) | No equivalent needed — API is real-time |
| GitHub Pages + cache busting | Cloudflare Pages (instant deploy) |

## Codex Integration

When Watson spawns Codex for coding tasks:
1. Watson creates a task via API
2. Watson assigns task to Codex agent
3. Watson spawns Codex CLI with task description
4. When Codex completes, Watson:
   - Commits code (since Codex can't write to .git)
   - Updates task status to "done" via API
   - Adds completion comment with commit hash
   - Logs time spent
