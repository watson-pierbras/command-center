# 21 — UX Revision Plan: Project-Centric Navigation

## Context

Paul's feedback (2026-02-12): The prototype feels task-centric when it should feel project-centric. Projects are the primary objects — like Companies in HubSpot or Projects in Jira. Tasks and subtasks live inside them, not the other way around.

## The Problem

The current prototype treats tasks as the primary navigation unit:
- Dashboard shows a flat activity feed of task-level changes
- Board dumps ALL tasks from ALL projects into one kanban
- Stat cards (Active Projects, Total Tasks, etc.) are static text — not interactive

This makes it feel like a task tracker with project labels, rather than a project management system where you drill into projects to see their work.

## The HubSpot Mental Model

In HubSpot, the hierarchy is clear:
- **Companies** (≈ Projects) are the organizing objects
- **Contacts/Deals/Tickets** (≈ Tasks) are associated to Companies
- You browse Companies, click into one, see its associated objects
- Every object has its own detail page with associations + activity timeline
- Pipeline/Board views are scoped to a pipeline (not all objects globally)

## Design Principles for the Revision

1. **Projects are the primary navigation object.** You pick a project first, then see its work.
2. **The Board is project-scoped by default.** Selecting a project shows that project's kanban.
3. **Global views exist but aren't the default.** "All Projects" is an option, not the landing.
4. **Stat cards are entry points.** Every number is a link to the data behind it.
5. **Tasks live inside projects.** Subtasks live inside tasks. The hierarchy is always visible.

---

## Revision 1: Dashboard Stat Cards → Clickable Navigation

### Current
Four static boxes: Active Projects (3), Total Tasks (13), Completion (31%), Blocked (1).

### Revised
Each card is tappable and navigates to a relevant view:

| Card | Tap Action |
|------|-----------|
| **Active Projects: 3** | → `/projects` (projects list, filtered to active) |
| **Total Tasks: 13** | → `/board` (global board, all projects) |
| **Completion: 31%** | → `/projects` (projects list, sorted by completion) |
| **Blocked: 1** | → Scroll to Needs Attention section; if only 1, open the task directly |

Visual cues: subtle hover lift, cursor pointer, maybe a tiny → arrow in the corner.

### Implementation
- `dashboard.js`: Wrap each stat card in a clickable element with `data-stat-action`
- Add click handler with navigation logic
- Add `interactive` class for hover/press feedback
- Minimal changes — 1 file modified

---

## Revision 2: Board View → Project-Centric

### Current
`/board` shows a flat kanban of ALL tasks from ALL projects in status columns. An "All Projects" dropdown exists but filtering still feels like an afterthought.

### Revised Architecture

**Route structure (already in spec):**
- `/board` — Project picker + the selected project's kanban
- `/board/:projectId` — Direct link to a specific project's board

**Default behavior:**
1. Landing on `/board` shows a **project selector bar** at the top (pills/tabs, not a dropdown)
2. First project is auto-selected (or last-viewed, stored in localStorage)
3. The kanban below shows ONLY that project's tasks in columns
4. An "All Projects" option exists as the last pill — shows cross-project view with project color indicators

**Project selector bar:**
```
[ Command Center v4 ] [ CoachFinder Core ] [ Watson Tools ] [ Lead Intel ] [ All ▾ ]
```
- Horizontally scrollable on mobile
- Active project has accent underline/highlight
- Each pill shows project color dot
- Tap to switch — kanban updates instantly (no page reload)

**Kanban cards within a project:**
- Task name (primary)
- Priority indicator (left border color)
- Assignee avatar/icon
- Subtask count if any (e.g., "2/5 subtasks")
- Blocked indicator
- **No project name needed** (you already know which project you're in)

**"All Projects" mode:**
- Shows all tasks across projects
- Each card gets a small project color dot + abbreviated project name
- Useful for Watson's cross-project triage, not Paul's daily use

### Implementation
- `board.js`: Add project selector bar, filter tasks by selected project
- `router.js`: Support `/board/:projectId` route parameter
- `components.css`: Styles for project selector pills
- `mock-data.js`: No changes needed (already has projectId on tasks)
- Estimated: ~3 files modified

---

## Revision 3: Project Detail → The "Home Base" for Each Project

### Current
Project Detail has Overview / Tasks / Activity tabs. The Tasks tab shows a list. This is already close to right.

### Revised
The Tasks tab in Project Detail should offer **two view modes**:
1. **List view** (current) — Sortable/filterable task list
2. **Board view** — Kanban columns for just this project's tasks (same as `/board/:projectId`)

This means the Board view is accessible from two entry points:
- `/board` → global board with project selector
- `/projects/:id` → Tasks tab → Board toggle

The board rendering logic is shared — same component, just filtered by project.

### Subtask Support (Visual)
When a task has subtasks:
- Task card shows a subtask indicator: "☐ 2/5" (2 of 5 subtasks done)
- In the task slide-over detail panel, subtasks are listed as nested items
- Subtasks inherit their parent's project association

This is a **visual/data display** change only for now. Creating subtasks requires the API (Phase 2). In the prototype, we'll show the hierarchy with mock data.

### Implementation
- `project-detail.js`: Add board/list toggle to Tasks tab
- `board.js`: Extract board rendering into a shared function
- `mock-data.js`: Add subtask mock data to demonstrate hierarchy
- `task-detail.js`: Show subtask list in slide-over
- Estimated: ~4 files modified

---

## Revision 4: Navigation Flow Improvements

### Dashboard → Project is the primary flow
The dashboard project cards already navigate to Project Detail (Revision from commit `73965c4`). This is correct — projects are the main entry point.

### Board → Project context is always visible
The project selector bar (Revision 2) ensures you always know which project you're viewing.

### Activity → Project grouping
The activity feed should group entries by project context. Currently it shows a flat chronological list. Consider:
- Adding a "Group by project" toggle
- Or showing project section headers between entries from different projects
- Lower priority — current flat list is fine for now

---

## Implementation Order

| Priority | Change | Effort | Files |
|----------|--------|--------|-------|
| **P0** | Stat cards clickable | Small | dashboard.js |
| **P0** | Board project selector | Medium | board.js, router.js, components.css |
| **P1** | Board route `/board/:projectId` | Small | router.js |
| **P1** | Project Detail Tasks tab board toggle | Medium | project-detail.js, board.js |
| **P2** | Subtask mock data + display | Medium | mock-data.js, task-detail.js |
| **P2** | Activity grouping by project | Small | activity.js |

**P0 = addresses Paul's direct feedback.** Build these first.
**P1 = completes the project-centric architecture.** Natural next step.
**P2 = enriches the CRM feel.** Nice-to-have for Phase 1.

---

## What This Does NOT Change

- **Data model** — Already supports all of this (02-DATA-MODEL.md is correct)
- **API spec** — Already supports project-scoped queries
- **Overall architecture** — CRM object-association model is validated by this feedback
- **Design system** — Tokens, colors, typography stay the same
- **Existing features** — Command palette, slide-over, theme toggle, all preserved

Paul's feedback doesn't mean we got the architecture wrong — it means the **UI wasn't expressing the architecture properly**. The CRM bones are right. The skin needs adjustment.

---

## Mockup: Revised Board View (Mobile)

```
┌─────────────────────────────────┐
│ Board                           │
│                                 │
│ [● CC v4] [● CoachF] [● Tools] │
│                                 │
│ ┌─────────┐ ┌─────────┐        │
│ │ Planned │ │ Active  │        │
│ │    2    │ │    3    │        │
│ ├─────────┤ ├─────────┤        │
│ │         │ │         │        │
│ │ Build   │ │ Design  │        │
│ │ API     │ │ dashb.. │        │
│ │ ⚡Codex  │ │ 🔍Watson│        │
│ │ ☐ 0/3  │ │ ☐ 2/5  │        │
│ │         │ │         │        │
│ │ Auth    │ │ Router  │        │
│ │ flow    │ │ + side..│        │
│ │ 🔍Watson │ │ ⚡Codex  │        │
│ │         │ │ ☐ 1/2  │        │
│ │         │ │         │        │
│ └─────────┘ └─────────┘        │
│                                 │
│ [Dash] [Proj] [Board] [Act] [⋯]│
└─────────────────────────────────┘
```

---

*This plan was written by Watson after reviewing the full v4 spec suite (00-VISION, 02-DATA-MODEL, 05-APP-FLOW) against Paul's feedback. The CRM architecture is sound — the frontend needs to express it better.*
