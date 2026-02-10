# Phase 1 — Critical Design Changes

**You are a premium UI/UX architect implementing approved design changes.**
**Read DESIGN-PHILOSOPHY.md and DESIGN-AUDIT.md first. Internalize them.**

## Scope
- **CSS and HTML structure ONLY** — do NOT modify any JavaScript logic, data flow, API calls, or functionality
- File: `index.html` (single-file PWA, ~3300 lines)
- All changes must use CSS custom properties (`:root` tokens) where possible

## Changes Required

### 1. Header Restructure
The header currently packs too much info into a cramped space. Restructure it:

**Current state:** Title row + stats (total, %, breakdown, remaining) + progress bar + state source + updated time — all stacked tight.

**Target:**
- **Top bar**: Title + action buttons + "Last updated" only
- **Stats strip**: Consolidate into one clean line: `55% · 6 done · 1 active · 4 planned`
- Remove "Total 11" (redundant — it's the sum of the breakdown)
- Move "State source: Live" and "⏱ Remaining 1w 2d 12h" into a collapsible section or smaller font below the progress bar
- Progress bar stays prominent — it's the hero element
- Add `16px` gap between header sections
- **IMPORTANT**: The JavaScript references specific DOM element IDs and classes to update stats. Do NOT rename or remove IDs/classes — only restructure visual layout via CSS reordering, font sizing, and spacing. If you must move HTML elements, keep all existing `id` and `class` attributes intact.

### 2. Light Mode Overhaul
Light mode currently feels washed out. Fix the token values:

```css
[data-theme="light"] {
  --bg: #F8F7F5;           /* warmer, not cold blue-gray */
  --surface: #ffffff;
  --card: #ffffff;          /* white cards on warm bg = clear separation */
  --border: #e2e8f0;        /* softer border, not harsh #94a3b8 */
  --shell-bg: #ffffff;
  --chip-bg: #f1f5f9;
  --chip-border: #cbd5e1;
  --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
}
```

Also for light mode cards specifically:
- Add `box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)` to `.card`
- Increase card left border from `4px` → `4px` (keep same) but ensure status colors are vivid
- Remove the `font-weight: 700` blanket override on everything in light mode — that rule makes ALL light mode text heavy:
```css
/* REMOVE THIS RULE — it makes everything bold in light mode */
body[data-theme='light'] .card,
body[data-theme='light'] .card h4,
body[data-theme='light'] .pill,
body[data-theme='light'] .agent-badge,
...
```
Instead, only keep `font-weight: 700` on `.card h4` in light mode.

### 3. Card Pill Reduction
Cards currently show 5-6 pills (agent, project, priority, model, time, cost). Reduce the card face to essentials:

- **Keep visible on card face**: title, agent badge, project pill, priority pill
- **Hide on card face**: model pill, time pill, cost pill — add class `card-detail-only` and hide with CSS:
```css
.card .card-detail-only { display: none; }
```
- In the card rendering JavaScript, add class `card-detail-only` to model, time estimate, and cost estimate pills. **Find the function that creates card HTML** (likely `renderCard` or similar) and add the class to those specific pills.
- These pills should still appear in the card detail panel (they're shown separately there already)

**IMPORTANT**: To identify which pills to hide, look at the card rendering code. The pills typically follow this order: project, priority, model, time, cost. The model pill contains text like "gpt-5.3-codex", time pill starts with "⏱", cost pill starts with "est $". Add `card-detail-only` class to these three.

### 4. Activity Log Fix (Mobile)
The Activity Log overlay appears on mobile without user action and blocks the viewport.

- On screens `< 720px`, the activity log should be `display: none` by default
- Only show when explicitly toggled (the 🗂️ button)
- If needed, add a small JS addition: toggle a class on the activity log container when the 🗂️ button is clicked, and default to hidden on mobile
- This is the ONE exception where minimal JS is allowed — but keep it to a toggle class

### 5. Tablet Layout (768px)
Currently at tablet width, columns wrap into a 2-column grid creating lopsided layout.

- Change the tablet media query to show 3 columns:
```css
@media (min-width: 720px) {
  .columns {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .column {
    min-width: auto; /* override the mobile 100% */
  }
}
```
- This may need adjustment to ensure column shells look good at ~240px each
- Remove the board-subtabs (column filter pills) at tablet+ since all columns are visible

### 6. Spacing Consistency Pass
Standardize gaps throughout:
- Header internal sections: `16px` gap
- Tabs to board content: `20px`
- Card-to-card within column: `12px`
- Card internal padding: `16px` (currently `12px`)
- Pill-to-pill gap: `6px` horizontal, `6px` vertical (currently `6px 8px` — tighten horizontal)

## Validation
After all changes:
1. Run `node --check` on extracted JS (extract between `<script>` tags, save to temp file, validate)
2. Verify all existing CSS custom properties still exist in `:root`
3. Verify dark mode still works (toggle theme)
4. Check that cards still render with all expected information
5. Test at 390px, 768px, and 1440px widths mentally

## Files to Read First
1. `DESIGN-PHILOSOPHY.md` — design principles and audit framework
2. `DESIGN-AUDIT.md` — the full audit results with rationale
3. `index.html` — the entire single-file PWA

## Output
Modify `index.html` in place. Make surgical, precise changes. Do not rewrite the entire file.
Commit message: `Design Phase 1: header restructure, light mode, card cleanup, tablet layout`
