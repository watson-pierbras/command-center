# Command Center v4 — Component Specifications (Legos)

## Philosophy

Components are the Lego bricks of the UI. Each brick has exactly one purpose, consistent behavior across every screen, and defined states for every possible interaction. No ambiguity.

---

## Buttons

### Primary Button
- **Use**: One per screen section. The main action.
- **Background**: `var(--color-accent)`
- **Text**: `var(--color-text-inverse)`, `--font-weight-medium`, `--font-size-sm`
- **Padding**: `--space-2` vertical, `--space-4` horizontal
- **Border-radius**: `--radius-sm`
- **Height**: 36px
- **States**:
  - Default: `--color-accent` bg
  - Hover: `--color-accent-hover` bg, `--shadow-sm`
  - Active: `--color-accent-hover` bg, scale(0.98)
  - Disabled: 50% opacity, cursor not-allowed
  - Loading: Text replaced with 16px spinner, same dimensions

### Secondary Button
- **Use**: Supporting actions.
- **Background**: transparent
- **Border**: 1px solid `--color-border-primary`
- **Text**: `--color-text-primary`, `--font-weight-medium`, `--font-size-sm`
- **Same dimensions as Primary**
- **States**:
  - Hover: `--color-bg-tertiary` bg
  - Active: `--color-bg-tertiary` bg, scale(0.98)
  - Disabled: 50% opacity

### Ghost Button
- **Use**: Tertiary actions, inline actions, navigation.
- **Background**: transparent
- **Border**: none
- **Text**: `--color-text-secondary`, `--font-weight-medium`, `--font-size-sm`
- **Padding**: `--space-1` vertical, `--space-2` horizontal
- **States**:
  - Hover: `--color-bg-tertiary` bg, `--color-text-primary` text
  - Active: `--color-bg-tertiary` bg

### Icon Button
- **Use**: Compact actions (close, menu, more).
- **Size**: 32px × 32px
- **Icon**: 16px, `--color-text-secondary`
- **Border-radius**: `--radius-sm`
- **States**:
  - Hover: `--color-bg-tertiary` bg
  - Active: `--color-bg-tertiary` bg, scale(0.95)

---

## Cards

### Project Card
- **Background**: `--color-bg-secondary`
- **Border**: 1px solid `--color-border-primary`
- **Border-left**: 3px solid `[project color]`
- **Border-radius**: `--radius-md`
- **Padding**: `--space-4`
- **Shadow**: `--shadow-sm`
- **Content**:
  - Project name: `--font-size-lg`, `--font-weight-semibold`
  - Status pill (inline, right-aligned)
  - Progress bar: 4px height, `--radius-full`, `[project color]` fill
  - Task counts: `--font-size-xs`, `--color-text-secondary`
  - Last activity: `--font-size-xs`, `--color-text-tertiary`
- **States**:
  - Hover: `--shadow-md`, border-color darkens slightly
  - Active: scale(0.99)

### Task Card (Board View)
- **Background**: `--color-bg-primary`
- **Border**: 1px solid `--color-border-primary`
- **Border-left**: 3px solid `[priority color]` (high=accent, medium=warning, low=neutral)
- **Border-radius**: `--radius-md`
- **Padding**: `--space-3`
- **Shadow**: `--shadow-xs`
- **Content**:
  - Task name: `--font-size-sm`, `--font-weight-medium`
  - Project dot (8px circle, project color) + project name: `--font-size-xs`
  - Agent avatar/initial (20px circle, bottom-right)
  - Blocked badge: subtle red overlay if blocked
- **States**:
  - Hover: `--shadow-sm`, slight lift
  - Dragging: `--shadow-lg`, scale(1.02), slight rotation (±1deg)
  - Drop target: dashed border, subtle pulse

### KPI Card (Dashboard)
- **Background**: `--color-bg-secondary`
- **Border**: 1px solid `--color-border-primary`
- **Border-radius**: `--radius-xl`
- **Padding**: `--space-5`
- **Content**:
  - Value: `--font-size-3xl`, `--font-weight-semibold`, `--color-text-primary`
  - Label: `--font-size-xs`, `--font-weight-medium`, `--color-text-secondary`
- **No hover state** — informational only

---

## Pills / Badges

### Status Pill
- **Height**: 22px
- **Padding**: `--space-1` vertical, `--space-2` horizontal
- **Border-radius**: `--radius-full`
- **Font**: `--font-size-xs`, `--font-weight-medium`
- **Variants** (by status):
  - Active: `--color-status-info-bg` bg, `--color-status-info` text
  - Planned: `--color-status-warning-bg` bg, `--color-status-warning` text
  - Done: `--color-status-success-bg` bg, `--color-status-success` text
  - Blocked: `--color-status-danger-bg` bg, `--color-status-danger` text
  - In Review: `--color-accent-subtle` bg, `--color-accent` text
  - Paused/Idle: `--color-bg-tertiary` bg, `--color-text-tertiary` text

### Priority Indicator
- **Not a pill** — a subtle left-border color on the parent card
- High: `--color-accent`
- Medium: `--color-status-warning`
- Low: `--color-text-tertiary`

### Count Badge
- **Size**: 20px × 20px (min-width, expands for 2+ digits)
- **Shape**: Circle (`--radius-full`)
- **Background**: `--color-bg-tertiary`
- **Text**: `--font-size-xs`, `--font-weight-medium`, `--color-text-secondary`
- **Use**: Task counts on project cards, unread counts

---

## Inputs

### Text Input
- **Height**: 36px
- **Background**: `--color-bg-primary`
- **Border**: 1px solid `--color-border-primary`
- **Border-radius**: `--radius-sm`
- **Padding**: 0 `--space-3`
- **Font**: `--font-size-sm`
- **Placeholder**: `--color-text-tertiary`
- **States**:
  - Focus: `--color-border-focus` border, 0 0 0 3px `--color-accent-subtle` ring
  - Error: `--color-status-danger` border, error message below
  - Disabled: `--color-bg-tertiary` bg, 50% opacity

### Textarea
- Same as Text Input but multi-line
- Min-height: 80px
- Resize: vertical only

### Select / Dropdown
- Same styling as Text Input
- Chevron icon right-aligned, `--color-text-tertiary`
- Dropdown panel: `--color-bg-primary` bg, `--shadow-md`, `--radius-md`
- Options: `--space-2` padding, hover bg `--color-bg-tertiary`

### Comment Input
- **Background**: `--color-bg-secondary`
- **Border**: 1px solid `--color-border-primary`
- **Border-radius**: `--radius-md`
- **Padding**: `--space-3`
- **Placeholder**: "Add a comment..."
- **Submit**: Enter or button (right-aligned icon)
- **Focus**: Expands from single line to multi-line

---

## Progress Bar

- **Track**: `--color-bg-tertiary`, `--radius-full`, height 4px (small) or 8px (large)
- **Fill**: `[project color]` or `--color-accent`, `--radius-full`
- **Animation**: Width transitions with `--transition-normal`
- **Label**: Optional percentage right-aligned, `--font-size-xs`, `--font-weight-medium`

---

## Activity Entry

- **Layout**: Icon (left, 32px) + Content (right, fluid)
- **Icon**: Actor avatar or action icon in 32px circle
  - Paul: initials "PS" in `--color-accent` circle
  - Watson: 🔍 or "W" in accent circle
  - Codex: "CX" in green circle
  - System: gear icon in neutral circle
- **Content**:
  - Action text: `--font-size-sm`, `--color-text-primary`
  - Actor name bold, object name as link (underline on hover)
  - Timestamp: `--font-size-xs`, `--color-text-tertiary`
- **Comment variant**: Same layout but with a `--color-bg-secondary` content bubble, `--radius-md`
- **Divider**: None between entries — spacing handles separation (`--space-4`)

---

## Navigation

### Sidebar
- **Width**: 240px (desktop), 64px (collapsed), hidden (mobile)
- **Background**: `--color-bg-secondary`
- **Border-right**: 1px solid `--color-border-primary`
- **Items**:
  - Icon (20px) + Label (`--font-size-sm`, `--font-weight-medium`)
  - Padding: `--space-2` vertical, `--space-3` horizontal
  - Border-radius: `--radius-sm`
  - Active: `--color-accent-subtle` bg, `--color-accent` text
  - Hover: `--color-bg-tertiary` bg

### Bottom Tab Bar (Mobile)
- **Height**: 56px + safe area inset
- **Background**: `--color-bg-primary`
- **Border-top**: 1px solid `--color-border-primary`
- **Items**: Icon (24px) + Label (`--font-size-xs`)
  - Active: `--color-accent`
  - Inactive: `--color-text-tertiary`
- **Max 5 tabs**: Dashboard, Projects, Board, Activity, More

### Breadcrumbs
- **Font**: `--font-size-sm`, `--color-text-secondary`
- **Separator**: `/` in `--color-text-tertiary`
- **Current page**: `--color-text-primary`, `--font-weight-medium`
- **Links**: underline on hover

---

## Slide-Over Panel (Task/Object Detail)

- **Width**: 480px (desktop), full-width (mobile)
- **Background**: `--color-bg-primary`
- **Shadow**: `--shadow-xl`
- **Overlay**: rgba(0, 0, 0, 0.3)
- **Animation**: Slide in from right, `--transition-slow`
- **Close**: X button (top-right) or click overlay or Escape key
- **Scroll**: Independent scroll from main content

---

## Toast / Notification

- **Position**: Bottom-right (desktop), bottom-center (mobile)
- **Background**: `--color-bg-inverse`
- **Text**: `--color-text-inverse`, `--font-size-sm`
- **Border-radius**: `--radius-md`
- **Shadow**: `--shadow-lg`
- **Padding**: `--space-3` vertical, `--space-4` horizontal
- **Duration**: 3s (info), 5s (error), persistent (action required)
- **Animation**: Slide up + fade in, slide down + fade out

---

## Loading States

### Skeleton
- Replaces content with animated placeholder shapes
- Background: `--color-bg-tertiary`
- Animation: Subtle shimmer (left-to-right gradient sweep, 1.5s loop)
- Matches exact dimensions of the content it replaces

### Spinner
- 16px (inline), 24px (button), 32px (section)
- Color: `--color-accent` (on light bg) or `--color-text-inverse` (on accent bg)
- Animation: Rotate 360deg, 0.8s linear infinite
- Stroke-based (ring, not filled circle)

### Full-page loader
- Centered spinner (32px) + optional "Loading..." text below
- Only shown on initial app load, never on navigation between views
