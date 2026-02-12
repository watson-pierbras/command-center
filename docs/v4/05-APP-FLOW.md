# Command Center v4 — App Flow

## Navigation Structure

```
┌──────────────────────────────────────────┐
│  Command Center                    [◐] [≡]│
├──────────────────────────────────────────┤
│                                          │
│  ┌──────────┐  ┌──────────────────────┐  │
│  │ Sidebar  │  │    Content Area      │  │
│  │          │  │                      │  │
│  │ Dashboard│  │  (active view)       │  │
│  │ Projects │  │                      │  │
│  │ Board    │  │                      │  │
│  │ Activity │  │                      │  │
│  │ Agents   │  │                      │  │
│  │          │  │                      │  │
│  │ ──────── │  │                      │  │
│  │ Settings │  │                      │  │
│  └──────────┘  └──────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

### Mobile
- Sidebar collapses to bottom tab bar (5 items max)
- Bottom tabs: Dashboard, Projects, Board, Activity, More (→ Agents, Settings)
- Content area is full-width

### Tablet
- Sidebar is collapsible (hamburger toggle)
- When collapsed: icon-only sidebar
- Content area takes remaining width

### Desktop
- Sidebar always visible (240px)
- Content area fluid with max-width

## Routes

| Route | View | Description |
|-------|------|-------------|
| `/` | Dashboard | Home — KPI summary, project health, recent activity |
| `/projects` | Projects List | All projects as cards |
| `/projects/:id` | Project Detail | Single project with tabs |
| `/projects/:id/tasks` | Project Tasks | Task list/board for a project |
| `/board` | Global Board | Kanban view across all projects (or filtered) |
| `/board/:projectId` | Project Board | Kanban view for a single project |
| `/activity` | Activity Feed | Global timeline of all activities |
| `/agents` | Agents List | All agents with status and assignments |
| `/agents/:id` | Agent Detail | Agent profile, assigned tasks, activity |
| `/tasks/:id` | Task Detail | Opens task slide-over panel (not a standalone page — redirects to parent project board with panel open) |
| `/settings` | Settings | Preferences, tokens, theme, account |

## Screen Specifications

---

### 1. Dashboard (`/`)

**Purpose**: Answer "What's happening?" in 2 seconds.

**Layout**:
```
┌─────────────────────────────────────────────────┐
│  Good afternoon, Paul                           │
│                                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │  4   │ │  11  │ │  55% │ │  1   │          │
│  │Proj. │ │Tasks │ │Done  │ │Block │          │
│  └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                 │
│  Projects                          [View All →] │
│  ┌──────────────┐ ┌──────────────┐              │
│  │ CC v4    75% │ │ CoachF.  67% │              │
│  │ ████████░░░░ │ │ ██████░░░░░ │              │
│  │ 3 active     │ │ 1 planned   │              │
│  └──────────────┘ └──────────────┘              │
│                                                 │
│  Recent Activity                                │
│  ┌─────────────────────────────────────────┐   │
│  │ 🔍 Watson changed "Design DB" → active  │   │
│  │    2 minutes ago · Command Center v4     │   │
│  │                                          │   │
│  │ 💬 Paul commented on "API Spec"          │   │
│  │    15 minutes ago · Command Center v4    │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Needs Attention                                │
│  ┌─────────────────────────────────────────┐   │
│  │ ⚠ Dashboard docs — Blocked (2 days)     │   │
│  │ ● CoachFinder pipeline — No agent       │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**KPI Cards**:
- Total Projects (active)
- Total Tasks
- Completion % (done / total)
- Blocked count (0 = hidden)

**Sections**:
1. **Projects** — Horizontal scroll of project cards (progress bar, task count). Max 6 shown, "View All" link.
2. **Recent Activity** — Last 10 activities globally. Actor icon, action description, timestamp, project context.
3. **Needs Attention** — Blocked tasks, overdue items, unassigned high-priority tasks. Only shown when items exist.

---

### 2. Projects List (`/projects`)

**Purpose**: See all projects at a glance, navigate to detail.

**Layout**: Card grid (2 cols tablet, 3 cols desktop).

**Each Card**:
- Project name (semibold)
- Status pill (active/paused/completed)
- Progress bar with percentage
- Task counts: X active, Y planned, Z done
- Project color accent (left border or top stripe)
- Last activity timestamp

**Actions**: Click card → Project Detail. "New Project" button (top right).

---

### 3. Project Detail (`/projects/:id`)

**Purpose**: Everything about one project. The "company page" in HubSpot terms.

**Header**:
- Project name (2xl, semibold)
- Status pill
- Progress bar
- Quick stats: tasks, completion %, time remaining

**Tabs**:
| Tab | Content |
|-----|---------|
| **Overview** | Description, milestones timeline, team (agents), budget |
| **Tasks** | Task list with filters (status, priority, agent) + optional board view toggle |
| **Activity** | Full activity timeline for this project and all its objects |
| **Settings** | Project properties, color, dates, danger zone (archive/delete) |

**Right Panel (desktop only)**:
- Quick actions: Add Task, Add Milestone, Add Comment
- Associated objects summary

---

### 4. Global Board (`/board`)

**Purpose**: Kanban view of tasks across projects.

**Layout**: Horizontal columns for each status.

**Columns**: Planned → Active → In Review → Done (Blocked shown as overlay indicator, not separate column)

**Cards**:
- Task name
- Project color dot + project name
- Priority indicator (subtle left border color)
- Agent avatar/icon
- Blocked indicator (if applicable)

**Filters** (top bar):
- By project (multi-select)
- By agent
- By priority

**Drag & drop**: Moves task between columns (updates status via API).

---

### 5. Activity Feed (`/activity`)

**Purpose**: Full audit trail. What happened, when, by whom.

**Layout**: Chronological list, most recent first.

**Each Entry**:
- Actor icon/avatar
- Action description (natural language: "Watson changed status of 'Design DB' from planned to active")
- Object link (clickable → opens object detail)
- Project context
- Timestamp (relative: "2m ago", absolute on hover)

**Filters**:
- By actor (Paul, Watson, Codex, System)
- By action type (comments, status changes, all)
- By project
- Date range

---

### 6. Agents (`/agents`)

**Purpose**: Who's working on what.

**Layout**: Cards or list view.

**Each Agent**:
- Name + avatar/emoji
- Status (active/idle/offline)
- Role
- Current task (if any)
- Task count (assigned, completed)
- Recent activity summary

**Click → Agent Detail**: Full profile, all assigned tasks, activity timeline.

---

### 7. Task Detail (Slide-over panel)

**Purpose**: Full view of a single task. Opens as a slide-over panel from the right (not a new page) to maintain context.

**Layout**:
```
┌───────────────────────────────────┐
│ ← Back                    [Edit] │
│                                   │
│ Design the dashboard view         │
│ ████████ Active · High priority   │
│                                   │
│ Project: Command Center v4        │
│ Assigned: Watson                  │
│ Estimate: 4h · Spent: 2h 15m     │
│ Due: Feb 15, 2026                 │
│                                   │
│ ─────────────────────────────────│
│                                   │
│ Description                       │
│ Create the main dashboard layout  │
│ with KPI cards, project summary...│
│                                   │
│ ─────────────────────────────────│
│                                   │
│ Associations                      │
│ ● Blocks: "Implement dashboard"   │
│ ● Subtask of: "Frontend redesign" │
│ ● Milestone: "MVP Launch"         │
│                                   │
│ ─────────────────────────────────│
│                                   │
│ Activity                          │
│ 💬 Paul: "Make sure the KPI..."   │
│    10m ago                        │
│ 🔍 Watson: Status → Active        │
│    1h ago                         │
│ ⚙ Created by Watson               │
│    2h ago                         │
│                                   │
│ ┌─────────────────────────────┐  │
│ │ Add a comment...            │  │
│ └─────────────────────────────┘  │
└───────────────────────────────────┘
```

**Key Features**:
- Inline comment box at bottom (like HubSpot's activity input)
- Associations section showing all related objects (clickable)
- Activity timeline showing full history
- Quick status change (dropdown or pill click)
- Time tracking (log time button)

---

### 8. Settings (`/settings`)

**Purpose**: System configuration.

**Sections**:
- **Appearance**: Theme toggle (light/dark/system), density
- **API Tokens**: View/rotate Watson token, browser session token
- **Data**: Export, import, danger zone
- **About**: Version, links

---

## User Journeys

### Journey 1: Paul checks project status (30 seconds)
1. Opens dashboard on phone
2. Sees KPI cards — 55% complete, 1 blocked task
3. Taps "Needs Attention" → sees blocked task
4. Taps blocked task → reads blocker reason
5. Adds comment: "Watson, prioritize unblocking this"
6. Done

### Journey 2: Watson processes morning inbox (2 minutes)
1. GET /api/activities?actor=paul&unread=true
2. Reads Paul's comments
3. For each: takes action (updates status, assigns agent, etc.)
4. Marks activities as read
5. Posts status update comments on affected objects

### Journey 3: Paul creates a new project
1. Navigates to Projects
2. Taps "New Project"
3. Fills: name, description, color, target date
4. Created → redirected to empty project detail
5. Adds first task via "Add Task" quick action

### Journey 4: Watson reports completion
1. PATCH task status to "done"
2. POST comment with summary of what was done
3. System auto-updates project progress
4. Paul sees updated dashboard on next visit

## Empty States

Every view has a helpful empty state:

- **No projects**: "No projects yet. Create your first project to get started." + Create button
- **No tasks in project**: "This project has no tasks. Add one to start tracking work." + Add Task button
- **No activity**: "No activity yet. Actions on objects will appear here."
- **No blocked items**: "Needs Attention" section is hidden entirely (not shown empty)
- **No agents**: "No agents configured. Add your team members."

Empty states are **helpful**, not decorative. They explain what goes here and how to fill it.
