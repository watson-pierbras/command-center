# UI Changes for Task Relationships - v3.1

This document outlines the UI/UX changes required to support task relationships in Command Center v3.1.

---

## 1. Board View Changes

### 1.1 Visual Indicators for Blocked Tasks

**Blocked Task Card:**
```
┌─────────────────────────────────────┐
│ 🔴 BLOCKED - 2 dependencies         │  ← New: Blocked status banner
├─────────────────────────────────────┤
│ 📋 Task Title                       │
│ ⏱️ 2h 30m | 💰 $4.20               │
│                                     │
│ 🚫 Blocked by: #123, #124          │  ← New: Blocker list (hoverable)
│ 📎 3 subtasks (1/3 done)           │  ← New: Subtask progress
└─────────────────────────────────────┘
```

**Indicator Icons:**
| Icon | Meaning | Location |
|------|---------|----------|
| 🔴 | Task is blocked | Top-left corner |
| 🚫 | Has blockers | Below title |
| 📎 | Has subtasks | Footer |
| 🔗 | Has related tasks | Footer |
| ⬆️ | Has parent | Top-right |
| ⬇️ | Is parent (has subtasks) | Top-right |

### 1.2 Card Footer Enhancements

Add relationship badges to task cards:

```css
.task-card-footer {
  display: flex;
  gap: 8px;
  align-items: center;
}

.relationship-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  background: var(--badge-bg);
}

.relationship-badge.subtasks {
  --badge-bg: #e0f2fe;
  color: #0369a1;
}

.relationship-badge.blocked {
  --badge-bg: #fee2e2;
  color: #dc2626;
}
```

### 1.3 Drag-and-Drop Restrictions

**Blocked tasks cannot be moved to "Done":**
- Show tooltip: "Cannot complete - blocked by Task #123"
- Highlight blocker tasks in red when dragging

**Parent task auto-completion:**
- When all subtasks complete, show suggestion to complete parent
- Visual indicator on parent when subtasks are 100% complete

---

## 2. Task Detail View Changes

### 2.1 New "Relationships" Tab/Section

```
┌─────────────────────────────────────────────────────┐
│ Task Title                              [Edit]      │
├─────────────────────────────────────────────────────┤
│ [Details] [Comments] [History] [Relationships] ★   │  ← New tab
├─────────────────────────────────────────────────────┤
│                                                     │
│  📊 DEPENDENCY GRAPH                        [View]  │  ← New section
│  ┌─────────────────────────────────────────────┐   │
│  │  [Parent Epic]                              │   │
│  │       ↓                                     │   │
│  │   [This Task] → blocks → [Task A]          │   │
│  │       ↑              ↓                     │   │
│  │  [blocked by]    [blocks]                  │   │
│  │       ↓              ↓                     │   │
│  │   [Task B]       [Task C]                  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  📋 PARENT                                          │
│  Epic: Command Center v3.1                    [×]   │
│                                                     │
│  📎 SUBTASKS (3)                           [+ Add]  │
│  ☑️ Subtask 1 - Complete                     [→]   │
│  ☐ Subtask 2 - In Progress                   [→]   │
│  ☐ Subtask 3 - Backlog                       [→]   │
│  Progress: [████████░░░░░░░░░░] 33%                 │
│                                                     │
│  🔗 DEPENDENCIES                                    │
│                                                     │
│  🚫 BLOCKED BY (1)                         [+ Link] │
│  • Task #123 - Database Migration              [×]  │
│                                                     │
│  ⛔ BLOCKS (2)                             [+ Link] │
│  • Task #456 - API Integration                 [×]  │
│  • Task #789 - Frontend Update                 [×]  │
│                                                     │
│  💡 RELATED (1)                            [+ Link] │
│  • Task #321 - Similar feature in Project X    [×]  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 2.2 Dependency Management UI

**Add Dependency Dialog:**
```
┌─────────────────────────────────────────┐
│ Add Dependency                           │
├─────────────────────────────────────────┤
│ Type: [blocks ▼]                        │
│                                         │
│ Search tasks: [________________]        │
│                                         │
│ ☐ Task #101 - Setup database           │
│ ☐ Task #102 - Configure API            │
│ ☑ Task #103 - Write tests              │
│ ☐ Task #104 - Deploy to staging        │
│                                         │
│          [Cancel]  [Add Selected]       │
└─────────────────────────────────────────┘
```

**Dependency Type Selector:**
- `blocks` - This task must complete first
- `blockedBy` - Cannot start until selected completes
- `related` - Associated but no dependency
- `duplicates` - Same work elsewhere
- `supersedes` - Replaces selected task

### 2.3 Subtask Management

**Subtask List Features:**
- Drag to reorder subtasks
- Checkbox to mark complete
- Click to open subtask detail
- Progress bar showing % complete
- "Add Subtask" button creates child task

**Create Subtask Inline:**
```
📎 SUBTASKS (3)
[Quick add: _______________________] [+]
☑️ Subtask 1
☑️ Subtask 2  
☐ Subtask 3
```

---

## 3. New Views

### 3.1 Dependency Graph View

**Full-screen graph visualization:**

```
┌────────────────────────────────────────────────────────────┐
│ Dependency Graph                    [List View] [Export]   │
├────────────────────────────────────────────────────────────┤
│  Filter: [All ▼]  Layout: [Hierarchical ▼]  Zoom: [100%]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                    ┌──────────────┐                       │
│                    │  Epic: v3.1  │                       │
│                    └──────┬───────┘                       │
│                           │                               │
│         ┌─────────────────┼─────────────────┐             │
│         ↓                 ↓                 ↓             │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐       │
│   │ Feature 1 │────→│ Feature 2 │←────│ Feature 3 │       │
│   └─────┬─────┘     └─────┬─────┘     └─────┬─────┘       │
│         │                 │                 │              │
│         ↓                 ↓                 ↓              │
│   ┌───────────┐     ┌───────────┐     ┌───────────┐       │
│   │  Task A   │     │  Task B   │     │  Task C   │       │
│   └───────────┘     └───────────┘     └───────────┘       │
│                                                            │
│  Legend: ──→ blocks  ───→ related  ─ ─ → duplicates       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Graph Controls:**
- Pan and zoom
- Node selection (click to view task)
- Filter by dependency type
- Color-code by status (green=done, blue=active, red=blocked)
- Export as PNG/SVG

### 3.2 Hierarchy Tree View

**Alternative to board view for complex hierarchies:**

```
📁 Command Center v3.1 (Epic)
├── 📁 Task Relationships (Feature)
│   ├── ☑️ Schema Design (Task)
│   ├── ☐ Migration Script (Task)
│   └── ☐ UI Components (Task)
├── 📁 Agent Registry (Feature)
│   ├── ☐ Agent Schema (Task)
│   └── ☐ Capability System (Task)
└── 📁 Project Entities (Feature)
    ├── ☐ Project Model (Task)
    └── ☐ Budget Tracking (Task)
```

---

## 4. Notifications & Alerts

### 4.1 New Notification Types

| Event | Message | Action |
|-------|---------|--------|
| Task unblocked | "Task #123 is no longer blocked - ready to start" | [View Task] |
| Subtask complete | "Subtask 'Write tests' completed (2/3 done)" | [View Parent] |
| Circular dependency | "Warning: Adding this dependency would create a cycle" | [Cancel] |
| Parent complete ready | "All subtasks complete - ready to finish epic?" | [Complete] |
| Duplicate detected | "This task may duplicate #456" | [Compare] |

### 4.2 Alert UI

**Inline validation alerts:**
```
┌────────────────────────────────────────┐
│ ⚠️ Cannot add dependency               │
│ This would create a circular loop:     │
│ A → B → C → A                          │
└────────────────────────────────────────┘
```

---

## 5. Search & Filter Enhancements

### 5.1 New Filters

```
Filter Tasks:
─────────────
☐ Show only blocked tasks
☐ Show only tasks with subtasks  
☐ Show only orphan tasks (no parent)
☐ Show dependency chain for: [________]

Dependency Depth: [Any ▼]
☐ Direct only
☐ 1 level deep
☐ All levels
```

### 5.2 Search Syntax

```
# Search by relationship
parent:epic-123                    # Tasks with specific parent
has:subtasks                       # Tasks with subtasks
is:blocked                         # Currently blocked tasks
blocks:task-456                    # Tasks blocking specific task
related:task-789                   # Tasks related to specific task

# Combined
project:Infrastructure is:blocked  # Blocked infra tasks
```

---

## 6. Mobile/Responsive Considerations

### 6.1 Mobile Task Card

```
┌─────────────────────────┐
│ 📋 Task Title        ⬆️ │  ← Parent indicator
├─────────────────────────┤
│ ⏱️ 2h | 💰 $4.20       │
│                         │
│ 🔴 Blocked by #123     │  ← Tap to see blockers
│ 📎 3 subtasks (33%)    │  ← Tap for subtask list
└─────────────────────────┘
```

### 6.2 Mobile Detail View

- Collapsible relationship sections
- Swipe between tabs
- Full-screen graph view on rotate

---

## 7. Accessibility

### 7.1 ARIA Labels

```html
<div class="task-card" aria-label="Task: Database Migration, Blocked">
  <span aria-label="Blocked by 2 tasks">🔴</span>
  <span aria-label="Has 3 subtasks, 1 complete">📎 3 (33%)</span>
</div>
```

### 7.2 Keyboard Navigation

- `Tab` - Navigate between relationship links
- `Enter` - Open linked task
- `Ctrl+Shift+P` - Jump to parent task
- `Ctrl+Shift+S` - View subtasks list

---

## 8. Implementation Priority

| Priority | Feature | Effort |
|----------|---------|--------|
| P0 | Blocked task indicators | 1 day |
| P0 | Subtask list in detail view | 1 day |
| P0 | Add/remove dependencies | 2 days |
| P1 | Dependency graph visualization | 3 days |
| P1 | Drag-drop restrictions | 1 day |
| P2 | Hierarchy tree view | 2 days |
| P2 | Search syntax extensions | 1 day |
| P3 | Graph export functionality | 1 day |

---

## 9. Design Assets Needed

- [ ] Blocked task banner component
- [ ] Relationship badge icons (set of 6)
- [ ] Dependency graph node designs
- [ ] Graph edge/arrow styles (4 types)
- [ ] Empty state illustrations for:
  - No dependencies
  - No subtasks
  - Circular dependency warning

---

## 10. Success Metrics

Track these after release:
- % of tasks using relationships (target: >30%)
- Average subtasks per parent (target: 2-4)
- Reduction in "stuck" tasks (blocked without visibility)
- User engagement with graph view
