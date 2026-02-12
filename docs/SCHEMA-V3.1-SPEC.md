# Command Center v3.1 — Schema Architecture Spec

## Overview

This document defines the comprehensive schema design for Command Center v3.1, transitioning from derived project names to full project entities, and from hardcoded agents to a dynamic agent registry.

**Current State:**
- Projects are implicit (derived from `task.project` string field)
- Agents are hardcoded (`watson`, `codex`, `ollama`) with minimal metadata
- Tasks have basic fields without dependencies, subtasks, or granular cost tracking

**Target State:**
- Full project entities with budgets, timelines, and team management
- Dynamic agent registry with skills, capabilities, and performance metrics
- Enhanced tasks with dependencies, subtasks, multi-agent assignment, and time/cost tracking

---

## 1. PROJECTS — Full Project Entity

### 1.1 Core Schema

```json
{
  "id": "proj-cf-2024",
  "slug": "coachfinder",
  "name": "CoachFinder",
  "description": "Complete lead intelligence and outreach automation platform",
  "status": "active",
  "visibility": "private",
  
  "metadata": {
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2026-02-12T14:37:00Z",
    "createdBy": "watson",
    "tags": ["lead-gen", "automation", "hubspot"],
    "category": "product",
    "priority": 1
  },
  
  "timeline": {
    "startDate": "2024-01-15",
    "targetDate": "2026-03-01",
    "completedAt": null,
    "sprints": [
      {
        "id": "sprint-1",
        "name": "MVP",
        "startDate": "2024-01-15",
        "endDate": "2024-03-15",
        "status": "completed"
      }
    ]
  },
  
  "budget": {
    "allocated": 1000.00,
    "currency": "USD",
    "spent": 742.50,
    "projected": 950.00,
    "billing": {
      "model": "actual",
      "alertThreshold": 0.80,
      "alertsEnabled": true
    }
  },
  
  "team": {
    "lead": "watson",
    "members": ["watson", "codex", "ollama"],
    "stakeholders": ["paul"],
    "defaultModel": "gpt-5.3-codex"
  },
  
  "settings": {
    "autoAssign": true,
    "defaultTaskPriority": "medium",
    "notificationChannels": ["telegram", "feed"],
    "costTrackingEnabled": true,
    "timeTrackingEnabled": true
  },
  
  "progress": {
    "taskCount": 24,
    "completedTasks": 18,
    "percentComplete": 75,
    "currentPhase": "integration",
    "blocked": false
  },
  
  "integrations": {
    "github": {
      "repo": "coachfinder-core",
      "enabled": true
    },
    "hubspot": {
      "enabled": true,
      "syncStatus": "active"
    },
    "telegram": {
      "channel": "@coachfinder_updates",
      "enabled": true
    }
  }
}
```

### 1.2 Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique project ID (prefixed, e.g., `proj-`) |
| `slug` | string | Yes | URL-friendly identifier, unique |
| `name` | string | Yes | Display name |
| `description` | string | No | Full project description |
| `status` | enum | Yes | `planned`, `active`, `paused`, `completed`, `archived` |
| `visibility` | enum | Yes | `private`, `internal`, `public` |
| `metadata` | object | Yes | Timestamps, tags, categorization |
| `timeline` | object | No | Dates, sprints, milestones |
| `budget` | object | No | Financial tracking and alerts |
| `team` | object | Yes | Lead, members, stakeholders |
| `settings` | object | Yes | Project-specific configuration |
| `progress` | object | Computed | Derived metrics from tasks |
| `integrations` | object | No | External service connections |

### 1.3 Status Values

- `planned` — Project defined, not yet started
- `active` — Work in progress
- `paused` — Temporarily halted
- `completed` — All tasks done, project closed
- `archived` — Historical reference only

---

## 2. TASKS — Enhanced Task Schema

### 2.1 Core Schema

```json
{
  "id": "task-a1b2c3d4-0007",
  "slug": "command-center-v3",
  "title": "Command Center v3",
  "description": "Major expansion: project memory system with card details, comments, file attachments, and live sync.",
  
  "classification": {
    "type": "feature",
    "category": "infrastructure",
    "priority": "high",
    "complexity": 3,
    "risk": "medium"
  },
  
  "project": {
    "id": "proj-infra-2024",
    "name": "Infrastructure",
    "slug": "infrastructure"
  },
  
  "status": {
    "state": "active",
    "column": "active",
    "blocked": false,
    "blockedReason": null,
    "ready": true
  },
  
  "relationships": {
    "parent": null,
    "subtasks": ["task-a1b2c3d4-0071", "task-a1b2c3d4-0072"],
    "dependencies": {
      "blocks": [],
      "blockedBy": ["task-a1b2c3d4-0002"],
      "related": []
    }
  },
  
  "assignment": {
    "primary": "codex",
    "contributors": ["watson"],
    "reviewer": null,
    "model": "gpt-5.3-codex"
  },
  
  "time": {
    "createdAt": "2026-02-08T18:30:00-05:00",
    "updatedAt": "2026-02-12T14:09:04Z",
    "startedAt": "2026-02-08T19:00:00Z",
    "completedAt": null,
    "dueDate": "2026-02-15",
    "estimate": { "value": 6, "unit": "hours", "formatted": "6h" },
    "actual": { "value": 8.5, "unit": "hours", "formatted": "8h 30m" },
    "tracking": {
      "sessions": [
        {
          "id": "sess-001",
          "agent": "codex",
          "startedAt": "2026-02-10T09:00:00Z",
          "endedAt": "2026-02-10T12:00:00Z",
          "duration": 180,
          "cost": 1.25
        }
      ]
    }
  },
  
  "cost": {
    "estimated": 2.70,
    "actual": 4.15,
    "currency": "USD",
    "breakdown": [
      { "model": "gpt-5.3-codex", "provider": "openai", "cost": 3.20, "tokensIn": 45000, "tokensOut": 8500 },
      { "model": "claude-opus-4-6", "provider": "anthropic", "cost": 0.95, "tokensIn": 12000, "tokensOut": 3200 }
    ]
  },
  
  "content": {
    "notes": "Implementation notes...",
    "acceptanceCriteria": ["User can upload documents", "Comments sync across sessions"],
    "attachments": []
  },
  
  "communication": {
    "comments": []
  },
  
  "history": [],
  
  "metadata": {
    "version": 12,
    "source": "manual",
    "autoGenerated": false
  }
}
```

### 2.2 Key Enhancements

| Feature | Current | New |
|---------|---------|-----|
| Project reference | String name | Full object with id, name, slug |
| Assignment | Single agent | Primary + contributors + reviewer |
| Dependencies | None | Full dependency graph |
| Time tracking | Simple estimate | Sessions with actual duration |
| Cost tracking | Single estimate | Breakdown by model/provider |
| Subtasks | None | Parent-child relationships |

### 2.3 Task States

- `backlog` — Not yet scheduled
- `planned` — Scheduled but not started
- `active` — In progress
- `review` — Under review
- `done` — Completed
- `cancelled` — Will not be done

### 2.4 Dependency Types

- `blocks` — This task must complete before others can start
- `blockedBy` — Cannot start until these tasks complete
- `related` — Associated but no dependency
- `duplicates` — Same work captured elsewhere
- `supersedes` — Replaces/renders obsolete

---

## 3. AGENTS — Agent Registry & Capabilities

### 3.1 Core Schema

```json
{
  "id": "agent-watson-001",
  "slug": "watson",
  "name": "Watson",
  "displayName": "🔍 Watson",
  
  "classification": {
    "type": "orchestrator",
    "tier": "premium",
    "autonomy": "high"
  },
  
  "identity": {
    "description": "Strategic orchestrator and architect",
    "avatar": "/avatars/watson.png",
    "color": "#3B82F6"
  },
  
  "configuration": {
    "defaultModel": "anthropic/claude-opus-4-6",
    "fallbackModels": ["moonshot/kimi-k2.5", "openai/gpt-4"],
    "maxConcurrentTasks": 5,
    "costBudget": { "daily": 50.00, "perTask": 10.00 }
  },
  
  "capabilities": {
    "skills": [
      { "id": "architecture", "name": "System Architecture", "level": 5, "verified": true },
      { "id": "orchestration", "name": "Multi-Agent Orchestration", "level": 5, "verified": true },
      { "id": "code-review", "name": "Code Review", "level": 4, "verified": true }
    ],
    "domains": ["infrastructure", "strategy", "integration"],
    "taskTypes": ["epic", "feature", "spike"],
    "languages": ["typescript", "python", "bash"],
    "integrations": ["github", "telegram", "hubspot"]
  },
  
  "runtime": {
    "provider": "anthropic",
    "endpoint": "api.anthropic.com",
    "contextWindow": 200000,
    "supportsTools": true,
    "supportsVision": false
  },
  
  "availability": {
    "status": "online",
    "currentLoad": 2,
    "maxLoad": 5,
    "available": true,
    "schedule": {
      "timezone": "America/New_York",
      "workHours": { "start": "09:00", "end": "18:00" },
      "workDays": ["mon", "tue", "wed", "thu", "fri"]
    }
  },
  
  "performance": {
    "metrics": {
      "tasksCompleted": 47,
      "tasksSuccessRate": 0.94,
      "avgTaskDuration": "2.3h",
      "avgCostPerTask": 2.01,
      "reviewRating": 4.8,
      "reworkRate": 0.06
    },
    "history": {
      "lastActive": "2026-02-12T09:33:39Z",
      "currentStreak": 12
    }
  },
  
  "costProfile": {
    "baseRate": 0.08,
    "rateUnit": "per-1k-tokens",
    "avgCostPerHour": 0.87,
    "efficiencyScore": 0.92
  },
  
  "collaboration": {
    "canDelegateTo": ["codex", "ollama"],
    "canReview": ["codex", "ollama"],
    "requiresReviewFor": ["deployment", "architectural-decision"],
    "preferredPartners": ["codex"],
    "mentees": ["ollama"]
  }
}
```

### 3.2 Agent Types

- `orchestrator` — Strategy, planning, coordination (Watson)
- `coder` — Code generation, implementation (Codex)
- `analyst` — Data analysis, research (future)
- `reviewer` — Code review, QA (future)
- `specialist` — Domain-specific expertise (future)
- `local` — On-device, lightweight (Ollama)

### 3.3 Skill Levels

Scale of 1-5: Beginner → Developing → Competent → Advanced → Expert

---

## 4. MIGRATION PATH

### 4.1 From Current Schema

**Projects:** Extract unique `task.project` strings → create `projects.json`

**Tasks:** Transform flat structure → nested objects (status, time, cost, assignment, relationships)

**Agents:** Hardcoded state.json → dynamic `agents.json` registry

### 4.2 Implementation Priority

1. **Phase 1:** Create `projects.json`, update task.project to object reference
2. **Phase 2:** Create `agents.json`, migrate from hardcoded agents
3. **Phase 3:** Add task relationships (dependencies, subtasks)
4. **Phase 4:** Add time tracking sessions
5. **Phase 5:** Add granular cost breakdown

### 4.3 Backward Compatibility

- Keep `task.project` as string for v3.0 clients
- Add `task.project.id` for v3.1+ clients
- Version API responses based on client capabilities

---

## 5. FILES CREATED

- `projects.json` — Project registry
- `agents.json` — Agent registry with capabilities
- `tasks.json` — Enhanced task data (or keep in board.json v3.1)
- `task-dependencies.json` — Dependency graph (normalized)
- `task-assignments.json` — Agent-task assignments (normalized)

---

*Spec created by Codex for Command Center v3.1 architecture.*
