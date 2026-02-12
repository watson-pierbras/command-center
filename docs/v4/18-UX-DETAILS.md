# Command Center v4 — UX Details

## Responsive Behavior

### Mobile (0–639px)

| Element | Behavior |
|---------|----------|
| Sidebar | Hidden. Bottom tab bar replaces it. |
| Bottom tabs | 5 tabs: Dashboard, Projects, Board, Activity, More |
| Content | Full-width, `--space-4` horizontal padding |
| KPI cards | 2×2 grid |
| Project cards | Single column, full width |
| Board columns | Horizontal scroll (swipe between columns) |
| Task detail | Full-screen slide-over (from bottom on mobile) |
| Tables | Horizontal scroll with sticky first column |
| Forms | Full-width inputs, stacked vertically |
| Typography | Same scale — no reduction |

### Tablet (640–1023px)

| Element | Behavior |
|---------|----------|
| Sidebar | Collapsible (64px icons when collapsed, 240px expanded). Toggle via hamburger. |
| Content | Fluid width minus sidebar |
| KPI cards | 4 in a row |
| Project cards | 2 columns |
| Board columns | 3 visible, 4th scrollable |
| Task detail | 480px slide-over from right |
| Forms | Max-width 560px, centered |

### Desktop (1024px+)

| Element | Behavior |
|---------|----------|
| Sidebar | Always visible, 240px fixed |
| Content | Fluid, max-width 1200px (1400px on wide) |
| KPI cards | 4 in a row |
| Project cards | 3 columns |
| Board columns | All visible |
| Task detail | 480px slide-over from right |
| Forms | Max-width 560px |

## Touch Targets

All interactive elements meet minimum touch target sizes:

| Element | Minimum Size | Implementation |
|---------|-------------|----------------|
| Buttons | 44×44px | Padding expands hit area |
| Tab bar items | 44×48px | Full tab width, 48px height |
| Card click area | Full card | Entire card is clickable |
| Status pills (clickable) | 44×32px | Padding around pill |
| Close button (×) | 44×44px | Padding around icon |
| Comment submit | 44×44px | Icon button size |
| Dropdown items | Full width × 44px | Row height |
| Checkbox/toggle | 44×44px | Hit area extends beyond visual |

## Keyboard Shortcuts

### Global
| Key | Action |
|-----|--------|
| `1` | Go to Dashboard |
| `2` | Go to Projects |
| `3` | Go to Board |
| `4` | Go to Activity |
| `n` | New task (opens create form) |
| `p` | New project (opens create form) |
| `/` | Focus search |
| `Escape` | Close panel/modal/dropdown |
| `?` | Show keyboard shortcuts help |

### Board View
| Key | Action |
|-----|--------|
| `←` / `→` | Navigate between columns |
| `↑` / `↓` | Navigate between cards in column |
| `Enter` | Open selected card detail |
| `m` | Move card (then arrow keys to target column, Enter to confirm) |

### Task Detail Panel
| Key | Action |
|-----|--------|
| `c` | Focus comment input |
| `s` | Quick status change (opens dropdown) |
| `Escape` | Close panel |

**Shortcut hint**: shown as tooltip on hover over UI elements that have shortcuts.

## Confirmation Dialogs

### Delete Confirmation
```
┌─────────────────────────────────────┐
│                                     │
│  Delete "Task Name"?                │
│                                     │
│  This will archive the task and     │
│  its associations. Activities are   │
│  preserved. You can restore it      │
│  from settings.                     │
│                                     │
│          [Cancel]  [Delete]         │
│                                     │
└─────────────────────────────────────┘
```

- "Delete" button uses `--color-status-danger` background
- Cancel is secondary button (default focus)
- No double-confirmation — single click confirms
- Uses the word "archive" not "delete" since it's soft-delete

### Status Change (No Confirmation)
- Status changes are instant (no dialog)
- Undo available via toast: "Status changed to Done. [Undo]" (5s window)

### Project Archival
```
Archive "Project Name"?

This will archive the project and all its tasks.
Existing activity history is preserved.

        [Cancel]  [Archive]
```

## Toast Messages

### Catalog

| Action | Toast | Type | Duration |
|--------|-------|------|----------|
| Object created | "Task created" | info | 3s |
| Object updated | "Status changed to Done. [Undo]" | info | 5s |
| Object deleted | "Task archived. [Undo]" | info | 5s |
| Comment added | (no toast — comment appears inline) | — | — |
| Network error | "Unable to connect. [Retry]" | error | persistent |
| Validation error | "Name is required" | error | 5s |
| Auth expired | "Session expired. Redirecting..." | warning | 3s |
| Rate limited | "Too many requests. Try again in 30s." | warning | 5s |
| Import success | "Data imported: 4 projects, 11 tasks, 3 agents" | info | 5s |
| Copy to clipboard | "Copied!" | info | 2s |

### Undo Pattern

For destructive actions (delete, status change):
1. Action executes immediately (optimistic)
2. Toast appears with "Undo" link
3. If user clicks Undo within 5 seconds:
   - API call to reverse the action
   - Toast: "Undone"
4. After 5 seconds: toast disappears, action is final

## Empty States

### Dashboard — No Projects
```
Welcome to Command Center

Create your first project to get started.

        [+ New Project]
```

### Project — No Tasks
```
No tasks yet

Add tasks to start tracking work on this project.

        [+ Add Task]
```

### Activity Feed — Empty
```
No activity yet

When you or Watson make changes, they'll appear here.
```

### Board — No Tasks (specific column)
```
(column header)

No tasks

Drag a task here or create one.
```

### Search — No Results
```
No results for "query"

Try a different search term or clear filters.
```

**Rules for empty states:**
- Always explain what will go here
- Always provide a call-to-action when applicable
- Never show a blank page
- Use secondary text color, not primary
- No decorative illustrations (stays clean)

## Loading Behavior

### Initial Page Load
1. HTML shell renders instantly (static, from CDN)
2. CSS loads → layout appears with correct colors/spacing
3. JS loads → router initializes, sidebar renders
4. API calls fire → skeleton loaders appear in content area
5. Data arrives → content replaces skeletons

### View Navigation
1. View function called immediately
2. Skeleton renders for data-dependent areas
3. API call fires (or cache hit)
4. Content replaces skeleton (fade transition, 150ms)

### Mutations
1. User clicks action → optimistic UI update (instant)
2. API call fires in background
3. On success: no visible change (already updated)
4. On failure: revert UI, show error toast

## Search

### Behavior
- Search input in header (desktop) or accessible via `/` shortcut
- Debounced: 300ms after last keystroke
- Searches: object names, descriptions, activity text
- Results grouped by type (Projects, Tasks, Agents)
- Max 5 results per type shown inline
- Click result → navigate to object
- Press Enter → full search results page

### No Search Page (MVP)
For MVP, search is client-side filtering of cached data. Server-side search with the `q` param comes in Phase 3 when the API is connected.

## Date/Time Display

| Context | Format | Example |
|---------|--------|---------|
| Within 1 hour | Relative | "5m ago" |
| Within 24 hours | Relative | "3h ago" |
| Within 7 days | Day + time | "Mon 2:30 PM" |
| Older | Date | "Feb 8, 2026" |
| Hover tooltip | Full datetime | "February 8, 2026 at 2:30:15 PM EST" |
| Due dates | Date only | "Feb 15, 2026" |
| Overdue | Date + "overdue" badge | "Feb 10, 2026 · Overdue" |

All times in Paul's timezone (America/New_York). No UTC display.

## Drag & Drop (Board)

### Visual Feedback
1. **Grab**: Card lifts slightly (scale 1.02, shadow increases)
2. **Drag**: Card follows cursor, slight rotation (±1deg), reduced opacity (0.9)
3. **Over drop zone**: Column background subtly highlights, gap opens for card
4. **Drop**: Card animates into position (spring transition)
5. **Invalid drop**: Card returns to original position (bounce back)

### Touch Support
- Long press (200ms) initiates drag on mobile
- Vibration feedback on drag start (if supported)
- Drop zones enlarge on mobile for easier targeting

### Accessibility Alternative
- Keyboard: Select card → press `m` → arrow keys → Enter to confirm
- Screen reader: "Move task 'Design dashboard' from Planned to Active"
