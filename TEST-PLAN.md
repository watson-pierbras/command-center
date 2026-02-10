# Command Center — Feature Verification & Test Plan

> Created: 2026-02-10 13:10 EST
> Status: Ready for review

---

## 🔴 CRITICAL BUG FOUND: Service Worker Caching board.json Stale

**This is almost certainly why things feel "not synced."**

The service worker (`sw.js`) has a **cache-first** strategy for all same-origin requests except `state.json` and navigation requests. That means `board.json` gets cached after its first fetch and is **never refreshed from the network** — the SW always serves the stale cached copy.

**Root cause** (sw.js lines ~50-65):
```js
// For state.json → networkFirst ✅
// For navigation (index.html) → networkFirst ✅
// For everything else (including board.json!) → cache-first ❌
event.respondWith(
  caches.match(event.request).then(cached => {
    if (cached) return cached;  // ← returns stale board.json forever
    return fetch(event.request)...
  })
);
```

Additionally, the SW cache name is still `command-center-v2-1` — hasn't been updated since v2.1. None of the v3.0 or design work touched `sw.js`.

**Fix required:**
1. Add `board.json` to the networkFirst handler (like state.json)
2. Bump CACHE_NAME to `command-center-v3-0` to bust old caches
3. Consider networkFirst for ALL `.json` files

**Priority: P0 — must fix before any other testing.**

---

## Test Categories

### A. Data Layer (Infrastructure)
### B. Board Tab (Kanban)
### C. Card Detail Panel
### D. Card Edit/Create Modal
### E. Comment System (Two-Way)
### F. GitHub Write-Back (PAT)
### G. Agents Tab
### H. Costs Tab
### I. Pipeline Tab
### J. Feed Tab
### K. Theme Toggle
### L. Sync Infrastructure (Backend)
### M. Service Worker & Caching
### N. Mobile Responsiveness
### O. Design Compliance (Phase 1-4)

---

## A. Data Layer

| # | Test | How to Verify | Pass? |
|---|------|---------------|-------|
| A1 | `state.json` loads from GitHub Pages | Open dev console → Network tab → check `state.json` request returns 200 with fresh data | |
| A2 | `board.json` loads from GitHub Pages | Network tab → check `board.json` returns 200 with current tasks | |
| A3 | 60-second auto-refresh fires | Wait 60s, watch Network tab for new `state.json` + `board.json` requests | |
| A4 | Manual refresh button works | Click ↻ in header → both files re-fetched → sync indicator updates | |
| A5 | localStorage fallback | Disable network in devtools → reload → app still loads with cached tasks | |
| A6 | Fingerprint-based skip | If data hasn't changed, DOM should NOT re-render (check console for activity log) | |
| A7 | "Last updated" timestamp | Header shows "Last updated: [date/time]" and refreshes every 30s | |

## B. Board Tab (Kanban)

| # | Test | How to Verify | Pass? |
|---|------|---------------|-------|
| B1 | Cards appear in correct columns | Planned/Active/Done columns match `board.json` column values | |
| B2 | Column card counts match | Header shows correct count per column | |
| B3 | Card shows agent + priority pills | Each card has agent name (colored dot) and priority badge | |
| B4 | Card left border = column color | Active cards have accent border, Done have green, Planned have default | |
| B5 | Board sub-tabs filter correctly | Click "Active" → only active cards shown; "All" → all cards | |
| B6 | Add Card button per column | "+" button exists per column → opens blank modal with that column pre-selected | |
| B7 | Card title font-weight 700 | Card titles are bold (not thin/normal) | |
| B8 | Empty column shows message | If a column has no cards, shows "No tasks yet" or similar | |

## C. Card Detail Panel

| # | Test | How to Verify | Pass? |
|---|------|---------------|-------|
| C1 | Click card → panel slides in | Smooth cubic-bezier animation from right | |
| C2 | Project badge shows at top | e.g., "Infrastructure" or "CoachFinder" | |
| C3 | Title renders correctly | Full task title displayed | |
| C4 | Metadata pills render | Agent, priority, estimated time, estimated cost, status pills visible | |
| C5 | Notes section populated | Shows task notes or "No notes yet" empty state | |
| C6 | Attachments section shows | Shows attachment links or "No attachments yet" | |
| C7 | Comments render chronologically | Oldest first, with author name (colored dot for agents) + relative time | |
| C8 | History renders reverse-chronological | Newest first, shows created/moved/edited events | |
| C9 | Section headers NOT all-caps | "Notes", "Attachments", "Comments", "History" — normal case | |
| C10 | Detail pills are visible/strong | Not ghostly — should have background, border, 600 weight | |
| C11 | Close button works | × button or backdrop click closes panel | |
| C12 | Escape key closes panel | Press Esc → panel closes | |
| C13 | Edit button → opens modal | Click Edit → edit modal opens with task data pre-filled | |
| C14 | Delete button → removes task | Click Delete → task removed from board + board.json (if PAT) | |
| C15 | Panel fullscreen on mobile | On <720px viewport, panel takes full screen | |

## D. Card Edit/Create Modal

| # | Test | How to Verify | Pass? |
|---|------|---------------|-------|
| D1 | New card modal opens blank | Click "+" → all fields empty, column pre-selected | |
| D2 | Edit modal pre-fills data | Open existing card → Edit → all fields match task data | |
| D3 | Title required | Try saving with empty title → focus stays on title field | |
| D4 | All fields editable | Title, Project, Priority, Column, Agent, Model, Time, Cost, Due, Notes | |
| D5 | Save creates/updates task | Save → task appears/updates on board | |
| D6 | Save triggers GitHub write | If PAT configured, board.json written to GitHub (check Network tab) | |
| D7 | Delete removes task | Delete → task gone from board + written to GitHub | |
| D8 | History event logged | Save/create adds "edited"/"created" history entry to task | |
| D9 | Modal fullscreen on mobile | On small viewport, modal takes full width/height | |
| D10 | Escape key closes modal | Press Esc → modal closes | |

## E. Comment System

| # | Test | How to Verify | Pass? |
|---|------|---------------|-------|
| E1 | Comment input is textarea | Multi-line input with message-composer styling (not single-line input) | |
| E2 | Add comment works | Type text → click Send → comment appears in list as "Paul" | |
| E3 | Comment written to board.json | Check GitHub repo → board.json → task comments array updated | |
| E4 | Watson reads comment | Run `board-ops.sh list-comments --new-only` → new comment shows | |
| E5 | Watson replies via board-ops | Run `board-ops.sh add-comment TASK_ID "reply text"` → commit + push | |
| E6 | Watson's reply shows in PWA | After push + refresh cycle → Watson comment visible with agent dot | |
| E7 | Comment author icons correct | Paul = plain name, Watson = colored dot + "Watson", Codex = colored dot + "Codex" | |
| E8 | Relative timestamps | Shows "2h ago", "just now", etc. — not raw ISO timestamps | |
| E9 | Empty comment prevented | Clicking Send with empty input does nothing | |

## F. GitHub Write-Back (PAT Integration)

| # | Test | How to Verify | Pass? |
|---|------|---------------|-------|
| F1 | Settings gear icon visible | ⋮ or gear icon in header area opens settings | |
| F2 | Settings modal opens | Shows PAT input field + Save/Clear buttons | |
| F3 | PAT saves to localStorage | Enter PAT → Save → check localStorage for stored token | |
| F4 | PAT masked in display | Shows `ghp_****...****` not full token | |
| F5 | GitHub write status indicator | Header shows connection status (e.g., "GitHub: Connected" or similar) | |
| F6 | Write triggers on save | Save a task → Network tab shows PUT to GitHub Contents API | |
| F7 | Write triggers on comment | Add comment → PUT to GitHub | |
| F8 | Write triggers on delete | Delete task → PUT to GitHub | |
| F9 | SHA conflict handling | If board.json changed server-side between reads, write should handle 409 | |
| F10 | Clear PAT works | Clear → removes from localStorage → write status shows disconnected | |
| F11 | Read-only without PAT | No PAT → app works but doesn't attempt GitHub writes | |
| F12 | Escape key closes settings | Press Esc → settings modal closes | |

## G. Agents Tab

| # | Test | How to Verify | Pass? |
|---|------|---------------|-------|
| G1 | Shows all 3 agents | Watson, Codex, Ollama listed | |
| G2 | Status dots (not emoji) | Colored dots for online/offline, no emoji | |
| G3 | Correct models shown | Watson: claude-opus-4-6, Codex: gpt-5.3-codex, Ollama: 3 models | |
| G4 | Last activity timestamps | Shows when each agent was last active | |
| G5 | Task assignments shown | Cards assigned to each agent listed or counted | |
| G6 | Data matches state.json | All values match what's in state.json agents section | |

## H. Costs Tab

| # | Test | How to Verify | Pass? |
|---|------|---------------|-------|
| H1 | Summary cards show | Today / This Week / This Month costs | |
| H2 | Amounts formatted correctly | Dollar signs, 2 decimal places (e.g., "$1.38") | |
| H3 | Cost entries table renders | Date, Agent, Model, Tokens, Cost, Note columns | |
| H4 | Labels NOT all-caps | "Today", "This Week" etc. — normal case, no uppercase | |
| H5 | Cost bar visualization | If present, bars scale correctly relative to each other | |
| H6 | Data matches state.json | All cost values match state.json costs section | |

## I. Pipeline Tab

| # | Test | How to Verify | Pass? |
|---|------|---------------|-------|
| I1 | CoachFinder stats show | Schools: 4, Coaches: 1, Target: 130,000 | |
| I2 | Pipeline components listed | scraper, discovery, extractor, verifier, hubspot, etc. with status | |
| I3 | Completion percentage | Shows 85% with progress bar | |
| I4 | Progress bar has gradient | Linear gradient (green → blue) | |
| I5 | Stat labels NOT all-caps | "Schools", "Coaches", "Target" — normal case | |
| I6 | Data matches state.json | All values from state.json coachfinder section | |

## J. Feed Tab

| # | Test | How to Verify | Pass? |
|---|------|---------------|-------|
| J1 | Feed entries render | Activity feed with descriptions + timestamps | |
| J2 | Refresh button works | Click → re-fetches data | |
| J3 | Pull-to-refresh on mobile | Swipe down on feed tab → triggers refresh | |
| J4 | Entries in chronological order | Newest entries at top | |
| J5 | Data from state.json | Feed entries match state.json feed section | |

## K. Theme Toggle

| # | Test | How to Verify | Pass? |
|---|------|---------------|-------|
| K1 | Toggle button visible | ◐ icon in header | |
| K2 | Dark → Light switch | Click → background, cards, text all change to light palette | |
| K3 | Light → Dark switch | Click again → back to dark palette | |
| K4 | Theme persists | Reload page → same theme as before | |
| K5 | All elements render in light | No invisible text, no lost borders, cards visible | |
| K6 | All elements render in dark | Same check for dark mode | |
| K7 | Header adapts | Header background blur works in both themes | |

## L. Sync Infrastructure (Backend)

| # | Test | How to Verify | Pass? |
|---|------|---------------|-------|
| L1 | sync.sh runs every 5 min | `launchctl list | grep watson` → shows loaded plist | |
| L2 | state.json freshness | Check `lastUpdated` in state.json → within last 5 minutes | |
| L3 | state.json auto-commits | `git log --oneline -5` → recent "sync: auto-update" commits | |
| L4 | board-ops.sh list-comments | Run command → lists all comments from board.json | |
| L5 | board-ops.sh add-comment | Add a test comment → appears in board.json → committed | |
| L6 | board-ops.sh move-card | Move a card → column updates in board.json | |
| L7 | board-ops.sh inbox | Shows new unprocessed comments (if any) | |
| L8 | .watson-inbox.json exists | File present in scripts/ directory | |
| L9 | Board watch cron fires | Check cron job exists and runs every 30 min | |
| L10 | Git push succeeds | `git status` clean, `git push` works | |

## M. Service Worker & Caching

| # | Test | How to Verify | Pass? |
|---|------|---------------|-------|
| M1 | **FIX: board.json uses networkFirst** | After fix → board.json always fetched from network | |
| M2 | **FIX: CACHE_NAME updated to v3** | sw.js shows `command-center-v3-0` or similar | |
| M3 | Old SW cache purged | Activate event deletes caches with old names | |
| M4 | index.html uses networkFirst | Navigation requests always try network first | |
| M5 | state.json uses networkFirst | state.json requests always try network first | |
| M6 | Offline fallback works | Kill network → app still loads from cache | |
| M7 | Fresh deploy reaches users | After pushing sw.js update, `skipWaiting()` activates immediately | |

## N. Mobile Responsiveness

| # | Test | How to Verify | Pass? |
|---|------|---------------|-------|
| N1 | Bottom tab bar renders | On <720px → fixed tab bar at bottom | |
| N2 | Tab bar labels fit | All tab labels visible, no overflow (flex: 1 1 0, min-width: 0) | |
| N3 | Cards full-width | Cards stretch to fill column on narrow screens | |
| N4 | Detail panel fullscreen | Card detail takes full viewport on mobile | |
| N5 | Modal fullscreen | Edit modal takes full viewport on mobile | |
| N6 | No horizontal scroll | Page content stays within viewport | |
| N7 | Touch gestures work | Swipe between tabs on mobile | |
| N8 | Tablet 3-column layout | On medium viewports (~768-1024px), board shows 3 columns | |

## O. Design Compliance (All 4 Phases)

| # | Test | How to Verify | Pass? |
|---|------|---------------|-------|
| O1 | Zero emoji anywhere | No 🔍, 🤖, 📎, 💬, 📜, ✅ etc. — all replaced with dots/text | |
| O2 | No ALL-CAPS text | No `text-transform: uppercase` anywhere in rendered output | |
| O3 | Colored status dots | Agent dots, status indicators use colored circles not emoji | |
| O4 | Priority pills semantic | high=warm, medium=neutral, low=cool color scheme | |
| O5 | Solid active tabs | Active tab has accent background + white text (not outlined) | |
| O6 | Card hover states | Cards lift slightly on hover (translateY + shadow) | |
| O7 | Panel transitions smooth | Detail panel, settings, activity panel use CSS transitions | |
| O8 | Progress bar gradient | Green-to-blue gradient on pipeline progress bar | |
| O9 | White-first light mode | Clean, bright, minimal — not gray or dull | |
| O10 | Inter font loads | Google Fonts Inter loads — check for FOUT | |

---

## Execution Plan

### Phase 1: Fix Critical Bug (Watson + Codex, ~30 min)
1. Update `sw.js`:
   - Change CACHE_NAME to `command-center-v3-0`
   - Add `board.json` to networkFirst handler
   - Consider making ALL `.json` files networkFirst
2. Commit + push
3. On live site: unregister old SW, clear caches, hard refresh
4. Verify board.json now fetches fresh from network

### Phase 2: Automated Smoke Tests (Watson, ~20 min)
1. Curl-test all data endpoints on GitHub Pages:
   - `https://watson-pierbras.github.io/command-center/state.json`
   - `https://watson-pierbras.github.io/command-center/board.json`
   - `https://watson-pierbras.github.io/command-center/index.html`
2. Validate JSON structure of state.json and board.json
3. Verify sync.sh is running (launchd status)
4. Run all board-ops.sh commands against current board.json
5. Check git status is clean

### Phase 3: Browser Testing (Watson via browser tool, ~30 min)
1. Open Command Center in browser
2. Screenshot each tab (Board, Agents, Costs, Pipeline, Feed)
3. Open a card detail panel → screenshot
4. Test theme toggle → screenshot both modes
5. Open settings modal → screenshot
6. Check mobile viewport → screenshot

### Phase 4: End-to-End Flow (Watson + Paul, ~20 min)
1. Paul adds a comment in the PWA
2. Watson reads it via board-ops.sh
3. Watson replies via board-ops.sh
4. Paul sees Watson's reply in the PWA after refresh
5. Paul creates a new card → verify it persists in board.json
6. Paul edits a card → verify changes in board.json

### Phase 5: Report
- Compile results into pass/fail table
- Fix any remaining issues (Codex sessions as needed)
- Final screenshot gallery of working features

---

## Time Estimate

| Phase | Effort | Who |
|-------|--------|-----|
| Phase 1: SW Fix | ~30 min | Codex |
| Phase 2: Smoke Tests | ~20 min | Watson |
| Phase 3: Browser Tests | ~30 min | Watson |
| Phase 4: E2E Flow | ~20 min | Watson + Paul |
| Phase 5: Report | ~15 min | Watson |
| **Total** | **~2 hours** | |

---

*The service worker bug (Section M) is almost certainly the root cause of "features not synced." Fixing it first will likely resolve most of Paul's concerns.*
