# DESIGN AUDIT RESULTS — Command Center v3.0

**Auditor:** Watson Pierbras
**Date:** 2026-02-10
**Framework:** DESIGN-PHILOSOPHY.md (Jobs/Ive protocol)
**Screens reviewed:** Board, Agents, Costs, Pipeline, Feed, Card Detail
**Viewports:** Desktop (1440×900), Tablet (768×1024), Mobile (390×844)
**Themes:** Dark mode, Light mode

---

## Overall Assessment

Command Center v3.0 is **functionally impressive but visually overworked.** The dark mode is the stronger experience — cohesive palette, adequate contrast, cards read well. But the header area is doing too much, every card carries 5-6 pills that compete equally for attention, and light mode feels like an afterthought (inverted rather than designed). The bones are solid. This needs **restraint, hierarchy, and intentional whitespace** to feel premium.

---

## PHASE 1 — Critical (Visual Hierarchy, Usability, Responsiveness)

### 1.1 Header Information Overload
**What's wrong:** The top 120px packs in: title, last-updated, total count, completion %, status breakdown (✅6 🔄1 📋4), remaining time, progress bar, state source, updated timestamp, AND 4 action buttons. The eye has nowhere to land first. On mobile, text wraps and clips ("2d 12h", "56 AM").
**What should be:** Two-tier header. **Top bar**: title + action buttons only. **Second row**: progress bar + single key stat (e.g., "55% complete · 6 of 11 done"). Move "State source", "Updated", and "Remaining" into a collapsible details area or the hamburger menu. The progress bar should be the hero — it's the most meaningful visual.
**Why this matters:** When everything is equally prominent, nothing is prominent. Users glance at dashboards — they need one number in <1 second.

### 1.2 Light Mode Is Half-Baked
**What's wrong:** Cards barely distinguish from the background. Dashed card borders nearly disappear. Left status color borders lose impact. Overall feels washed out, thin, and cold. It wasn't designed — it was inverted.
**What should be:** Light mode needs its own design pass: subtle card shadows (not just borders), slightly warm background tint (e.g., `#F8F7F5` instead of pure `#F0F0F0`), stronger card definition through elevation (box-shadow) rather than border alone, and status colors that pop against light backgrounds.
**Why this matters:** Many users (especially on mobile in daylight) will use light mode. If it looks broken, it erodes trust in the whole product.

### 1.3 Card Pill/Tag Overload
**What's wrong:** Every card shows 5-6 pills: agent, project, priority, model, time estimate, cost estimate. They all look identical — same size, same shape, same visual weight. The card title competes with a wall of metadata.
**What should be:** Card face should show: **title** (prominent), **agent** (subtle inline), and **one** primary metadata item (priority or project). Move time, cost, and model into the card detail panel. If a user needs the estimate, they tap the card. The card face is a **summary**, not a data sheet.
**Why this matters:** "If everything is bold, nothing is bold." Cards should scan in <1 second per card. Currently each card requires reading 6 separate data points.

### 1.4 Mobile Activity Log Overlay Bug
**What's wrong:** The Activity Log panel renders at 390px mobile and doesn't properly dismiss. It sits behind/alongside content, blocking the right side of the viewport. Escape doesn't close it. Even on fresh page load it appears.
**What should be:** Activity Log on mobile should be a full-screen overlay with a clear close button, OR it should be moved to the Feed tab. It should never render without explicit user action.
**Why this matters:** This is a usability bug. Half the mobile viewport is obscured by an empty "No activity yet." panel.

### 1.5 Tablet Layout Imbalance
**What's wrong:** At 768px, the board shows 2 columns side-by-side (Done + Active). Done has 6 cards stretching full height; Active has 1 card + empty space. Planned wraps to its own row below. The layout feels lopsided and wastes space.
**What should be:** At tablet, show all 3 columns at ~33% width (like desktop but tighter), or use the mobile column-filter pattern. The 2-column wrap creates visual chaos.
**Why this matters:** Tablet is the in-between viewport. If neither the desktop nor mobile pattern works here, it feels like a broken layout rather than an intentional design.

---

## PHASE 2 — Refinement (Spacing, Typography, Color, Alignment)

### 2.1 Card Title Typography
**What's wrong:** Card titles use `h4` but they're visually similar in weight to the pill text below them. The title should be the dominant element on each card.
**What should be:** Card title: `font-size: 1rem` → `1.05rem`, `font-weight: 600` → `700`. Pill text: drop to `0.7rem` from `0.75rem`. This creates a clearer typographic hierarchy: title first, everything else secondary.
**Why this matters:** Titles are what users scan when looking for a specific task. They need to jump off the card.

### 2.2 Pill Semantic Differentiation
**What's wrong:** Priority, project, model, agent, time, and cost all use identical pill styling. "high" (priority) looks exactly like "Infrastructure" (project) looks exactly like "gpt-5.3-codex" (model).
**What should be:** If pills remain on the card face (see 1.3), differentiate by type:
- **Priority**: filled background (green/amber/red for high/medium/low)
- **Project/category**: outlined pill (border only, no fill)
- **Time/cost**: plain text with icon prefix, no pill shape at all
**Why this matters:** Same styling implies same importance. These are fundamentally different data types.

### 2.3 Header Stats Grouping
**What's wrong:** Stats flow left-to-right with no visual grouping: "Total 11 | 55% complete | ✅6 🔄1 📋4 | ⏱ Remaining 1w 2d 12h". All at the same text size, same color, separated by nothing but space.
**What should be:** Group into a single stats strip: `55% · 6 done · 1 active · 4 planned`. Use the progress bar as the primary visual. "Remaining time" goes to a secondary position or tooltip. Kill the redundant "Total 11" (it's the sum of the breakdown).
**Why this matters:** Grouping related information reduces cognitive load.

### 2.4 Tab Active State
**What's wrong:** Active tab pill has slightly different background but at a glance all 5 tabs look the same. On mobile bottom bar, the active indicator is also subtle.
**What should be:** Active tab: solid filled background with brand color + text color change. Inactive: ghost/outline style. The difference should be obvious at arm's length (mobile in hand).
**Why this matters:** Users need instant spatial orientation — "which tab am I on?"

### 2.5 Column Header Consistency
**What's wrong:** Column headers show emoji + text + count badge. The count badge is right-aligned in a small circle. This is fine but the emoji (✅🔄📋) does all the color work — the header itself is all the same dark text on dark background.
**What should be:** Add a subtle background tint to each column header matching its status color (green tint for Done, blue for Active, amber for Planned). This reinforces the color language without needing emoji.
**Why this matters:** Color should be structural, not just decorative. Status color in headers anchors the entire column's meaning.

### 2.6 Spacing Pass
**What's wrong:** Inconsistent vertical gaps: header-to-tabs, tabs-to-board, card-to-card gaps vary. The header area is particularly cramped (progress bar touching stat lines).
**What should be:** Standardize on a 4px base unit:
- Header sections: `16px` gap
- Tabs to board: `20px`
- Card-to-card within column: `12px`
- Card internal padding: `16px`
- Pill-to-pill gap: `6px`
**Why this matters:** Consistent rhythm makes layouts feel intentional. Irregular spacing feels haphazard.

---

## PHASE 3 — Polish (Micro-interactions, Transitions, Empty States, Premium Feel)

### 3.1 Card Hover & Focus States
**What's wrong:** Cards are clickable (they open the detail panel) but show no visual hover feedback beyond cursor change. No elevation shift, no border highlight, no subtle glow.
**What should be:** On hover: subtle `box-shadow` increase (dark mode: `0 4px 12px rgba(0,0,0,0.3)`; light mode: `0 4px 12px rgba(0,0,0,0.08)`) + `translateY(-1px)` transform. Transition: `150ms ease`. On focus: visible focus ring for keyboard navigation (accessibility).
**Why this matters:** Hover states confirm interactivity. Cards that respond to attention feel alive.

### 3.2 Empty States
**What's wrong:** "No activity yet.", "No attachments.", "No notes." — bland placeholders with no guidance.
**What should be:**
- Activity Log empty: "Activity will appear here as tasks are created, moved, and completed."
- No attachments: "Drop files onto a card or use the + button to attach documents."
- No notes: "Add notes to capture context, decisions, or links."
Each with a subtle muted icon above the text.
**Why this matters:** Empty states are an opportunity to educate. They should make the app feel thoughtful, not hollow.

### 3.3 Transition Consistency
**What's wrong:** Card detail panel likely slides in but tab switches are instant. Menu opening is instant. There's no cohesive motion language.
**What should be:** All panel/overlay transitions: `250ms cubic-bezier(0.4, 0, 0.2, 1)` (Material ease). Tab content: quick crossfade (`150ms opacity`). Keep it subtle — motion should orient, not entertain.
**Why this matters:** Consistent motion makes the app feel like one cohesive product, not assembled parts.

### 3.4 Card Detail Panel Polish
**What's wrong:** The detail panel is functional but dense. Section headers (NOTES, ATTACHMENTS, COMMENTS) are all-caps orange — competing for attention equally. The comment input at the bottom is plain.
**What should be:** Section headers: `text-transform: none`, slightly larger (`1rem`), with a thin horizontal rule below. Use font weight (600) and color (primary text color) instead of all-caps and accent color. Comment input: add a subtle background, rounded corners, more padding — make it feel like a message composer, not a form field.
**Why this matters:** The detail panel is where users spend the most time. It should feel calm and organized, not loud.

### 3.5 Agent Badges Polish
**What's wrong:** Agent indicators use emoji (🔍🤖🦙) which look different across platforms and can't be color-controlled. On some platforms they render as colored emoji, on others as text.
**What should be:** Replace emoji with styled icon-text badges: a small colored circle (Watson=blue, Codex=green, Ollama=amber) + text. This gives consistent cross-platform rendering and lets you control the exact color.
**Why this matters:** Emoji are convenient but uncontrollable. A premium app controls every pixel.

### 3.6 Progress Bar Enhancement
**What's wrong:** The progress bar is a simple colored bar. It works but it doesn't feel special for being the most important visual element.
**What should be:** Add a subtle gradient to the progress fill (e.g., done portion in solid green, transitioning to blue for active). Add a thin highlight line at the top of the bar for depth. Consider showing task count markers on the bar itself.
**Why this matters:** The progress bar is the single most glanceable element. It should reward attention.

### 3.7 Dark/Light Mode Refinement
**What's wrong:** Dark mode is the primary design; light mode needs its own identity (see 1.2). Dark mode itself could benefit from: slightly warmer dark backgrounds, more contrast between card and column backgrounds.
**What should be:** Dark mode: card background `#1E2235` → `#1F2337` (slightly warmer). Column background: keep at current `#171B2E` for contrast. Light mode: complete redesign per Phase 1.2 notes — shadows, warm tint, stronger card definition.
**Why this matters:** Dark mode is 90% there. Light mode is 50%. Both should feel like intentional products.

---

## DESIGN SYSTEM UPDATES REQUIRED

### New/Modified Tokens
| Token | Current | Proposed |
|-------|---------|----------|
| `--card-shadow-hover` | (none) | `0 4px 12px rgba(0,0,0,0.3)` |
| `--card-shadow-hover-light` | (none) | `0 4px 12px rgba(0,0,0,0.08)` |
| `--card-lift` | (none) | `translateY(-1px)` |
| `--transition-panel` | (none) | `250ms cubic-bezier(0.4, 0, 0.2, 1)` |
| `--transition-quick` | (none) | `150ms ease` |
| `--bg-light` | ~`#F0F0F0` | `#F8F7F5` (warmer) |
| `--card-bg-dark` | ~`#1E2235` | `#1F2337` (warmer) |
| `--card-title-weight` | `600` | `700` |
| `--card-title-size` | `1rem` | `1.05rem` |
| `--pill-font-size` | `0.75rem` | `0.7rem` |
| `--priority-high` | (none) | `#22C55E` (green fill) |
| `--priority-medium` | (none) | `#F59E0B` (amber fill) |
| `--priority-low` | (none) | `#94A3B8` (slate fill) |

### New Components Proposed
- **Stat strip** — compact horizontal stats display for header
- **Agent badge** — colored dot + text, replacing emoji
- **Empty state** — icon + message + optional action link
- **Priority pill** — filled variant of tag pill

---

## IMPLEMENTATION NOTES FOR BUILD AGENT

**CRITICAL: CSS-only changes. Do not modify any JavaScript logic, data flow, API calls, or functionality.**

### Phase 1 Implementation
1. **Header restructure**: Move stats into a condensed single-line format. Hide "State source", "Updated" behind hamburger or make collapsible. Kill "Total 11" (redundant). CSS grid/flexbox reflow.
2. **Light mode overhaul**: Add `box-shadow: 0 1px 3px rgba(0,0,0,0.08)` to cards in light mode. Change `--bg-surface` to `#F8F7F5`. Increase card border opacity. Ensure status color borders are `3px` not `2px` in light mode.
3. **Card pill reduction**: Add CSS class `card-secondary-meta` with `display: none` on card face; show only in detail panel. Apply to: model pill, time pill, cost pill. Keep: title, agent, priority, project.
4. **Activity Log fix**: On `<720px`, set `.activity-log` to `display: none` by default. Only show on explicit toggle (this may require minimal JS to add a toggle — flag for build agent if so).
5. **Tablet layout**: At `768px`, use `grid-template-columns: repeat(3, 1fr)` instead of current 2-column wrap. Cards will be narrower but 3-column is more balanced.

### Phase 2 Implementation
All values exact — reference proposed token table above.

### Phase 3 Implementation
1. Card hover: `.task-card:hover { box-shadow: var(--card-shadow-hover); transform: var(--card-lift); transition: var(--transition-quick); }`
2. Empty states: Update innerHTML of empty containers with descriptive text + `opacity: 0.5` styling.
3. Panel transitions: Add `transition: transform var(--transition-panel)` to `.card-detail-panel`.
4. Section headers in detail panel: Remove `text-transform: uppercase`. Set `font-weight: 600; font-size: 1rem; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 8px;`

---

## APPROVAL REQUEST

Paul — review each phase above. You can:
- ✅ Approve a phase as-is
- ✏️ Modify specific items
- ❌ Cut items you don't want
- 🔀 Reorder phases

I'll execute each approved phase surgically via Codex, one at a time, with a review checkpoint between each.
