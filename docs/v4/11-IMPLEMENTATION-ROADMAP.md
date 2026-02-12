# Command Center v4 — Implementation Roadmap

## Phase 1: Design Prototype (Frontend with Mock Data)

**Goal**: Clickable prototype deployed to GitHub Pages. Paul can see and interact with every view. No backend required.

### 1A: Foundation (Est. 4-6 hours)
- [ ] Set up file structure (`index.html`, `css/`, `js/`)
- [ ] Implement design tokens (`tokens.css`)
- [ ] CSS reset and base layout (`reset.css`, `layout.css`)
- [ ] Sidebar navigation + mobile bottom tabs
- [ ] Hash-based router
- [ ] Theme toggle (light/dark/system)
- [ ] Mock data store (static JSON matching v4 data model)

### 1B: Core Views (Est. 6-8 hours)
- [ ] Dashboard view (KPI cards, project summary, recent activity, needs attention)
- [ ] Projects list (card grid with progress bars)
- [ ] Project detail (header, tabs: Overview, Tasks, Activity, Settings)
- [ ] Global board (Kanban columns: Planned, Active, In Review, Done)
- [ ] Activity feed (global timeline)
- [ ] Agents list

### 1C: Interactions (Est. 4-6 hours)
- [ ] Task detail slide-over panel
- [ ] Comment input on task detail
- [ ] Create project form
- [ ] Create task form
- [ ] Filter controls (board, task lists)
- [ ] Search (client-side on mock data)

### 1D: Polish (Est. 4-6 hours)
- [ ] All empty states
- [ ] All loading states (skeletons)
- [ ] Error states
- [ ] Dark mode pass (verify every view)
- [ ] Mobile pass (verify every view at 375px)
- [ ] Accessibility pass (keyboard, ARIA, contrast)
- [ ] Microinteractions (hover, focus, transitions)

### 1E: Design Audit (Est. 2-4 hours)
- [ ] Run full Design Audit Protocol (from DESIGN-PHILOSOPHY.md)
- [ ] Apply Jobs Filter to every screen
- [ ] Compile Design Audit Results
- [ ] Present to Paul for review
- [ ] Iterate based on feedback

**Deliverable**: Live prototype at GitHub Pages URL. Paul reviews on phone.

---

## Phase 2: Backend (Cloudflare Workers + D1)

**Goal**: Working API with all endpoints. Fully tested.

**Prerequisite**: Paul creates Cloudflare account, provides Account ID + API Token.

### 2A: Infrastructure (Est. 2-3 hours)
- [ ] Set up Wrangler project
- [ ] Configure D1 database
- [ ] Set up Worker with routing
- [ ] Implement auth middleware (Bearer token)
- [ ] Deploy to `*.workers.dev`

### 2B: Data Layer (Est. 4-6 hours)
- [ ] D1 schema migration (objects, associations, activities, settings)
- [ ] ULID generation
- [ ] CRUD operations for objects
- [ ] Association management (create, delete, inverse handling)
- [ ] Activity auto-logging (on mutations)
- [ ] Dashboard aggregation query

### 2C: API Endpoints (Est. 4-6 hours)
- [ ] All object endpoints (list, get, create, update, delete)
- [ ] Type-specific shortcuts (projects, tasks, agents)
- [ ] Association endpoints
- [ ] Activity endpoints (timeline, comment, mark read)
- [ ] Dashboard endpoint
- [ ] Search endpoint
- [ ] Import endpoint (for v3 migration)
- [ ] Health check

### 2D: API Testing (Est. 2-4 hours)
- [ ] Full CRUD cycle test for each object type
- [ ] Association lifecycle test
- [ ] Activity auto-creation verification
- [ ] Pagination test
- [ ] Filter test
- [ ] Error handling test (validation, auth, not found)
- [ ] Edge cases (long names, empty properties, concurrent writes)

**Deliverable**: Working API at `*.workers.dev`. All endpoints verified.

---

## Phase 3: Connect Frontend to Backend

**Goal**: Replace mock data with live API calls. Full integration.

### 3A: API Integration (Est. 3-4 hours)
- [ ] Replace mock store with API client
- [ ] Wire all views to API data
- [ ] Implement optimistic updates
- [ ] Add loading states for real network latency
- [ ] Error handling for API failures

### 3B: Real-time Features (Est. 2-3 hours)
- [ ] Comment submission (create activity via API)
- [ ] Task creation form (create object + associations)
- [ ] Project creation form
- [ ] Status change on board (drag & drop → API call)
- [ ] Task assignment

### 3C: Integration Testing (Est. 2-3 hours)
- [ ] End-to-end test: create project → add task → assign → complete
- [ ] Browser test every view with live data
- [ ] Mobile test with live data
- [ ] Dark mode test with live data
- [ ] Performance test (API response times)

**Deliverable**: Fully functional app with live backend.

---

## Phase 4: Migration & Deploy

**Goal**: Migrate v3 data, deploy to production, Watson integration live.

### 4A: Data Migration (Est. 1-2 hours)
- [ ] Run v3 → v4 import
- [ ] Verify data integrity (counts, associations, progress)
- [ ] Screenshot comparison (v3 vs v4 dashboard)

### 4B: Watson Integration (Est. 2-3 hours)
- [ ] Update Watson's heartbeat to use v4 API
- [ ] Replace board-ops.sh with API calls
- [ ] Replace .watson-inbox.json with activity polling
- [ ] Test Watson's full workflow (read comments → act → update → comment)

### 4C: Production Deploy (Est. 1-2 hours)
- [ ] Deploy frontend to Cloudflare Pages (or final hosting)
- [ ] Configure custom domain (if desired)
- [ ] Final verification on live site
- [ ] Update WIP.md, MEMORY.md with new architecture

### 4D: Cutover (Est. 1 hour)
- [ ] Point Watson to production API
- [ ] Archive v3 repo (read-only)
- [ ] Update all documentation references
- [ ] Notify Paul: v4 is live

**Deliverable**: Command Center v4 in production. v3 archived.

---

## Phase 5: Polish & Iterate

**Goal**: Ongoing refinement based on daily use.

- [ ] Service worker for offline support
- [ ] Notification system (Watson → Paul alerts)
- [ ] Keyboard shortcuts
- [ ] Bulk actions (multi-select tasks)
- [ ] Dashboard customization (reorder sections)
- [ ] Export data (CSV, JSON)
- [ ] Performance optimization
- [ ] Whatever Paul requests

---

## Estimated Total

| Phase | Estimate | Dependencies |
|-------|----------|-------------|
| Phase 1: Design | 20-30 hours | None |
| Phase 2: Backend | 12-19 hours | Cloudflare account |
| Phase 3: Connect | 7-10 hours | Phase 1 + 2 |
| Phase 4: Migrate | 5-8 hours | Phase 3 |
| Phase 5: Polish | Ongoing | Phase 4 |

**Total to MVP**: ~45-65 hours of development work.

Watson + Codex working in parallel can compress this significantly. Codex handles implementation, Watson handles architecture + QA. Multiple Codex sessions can run simultaneously on independent files.

## Build Order Priority

1. **Foundation + Router + Theme** → everything else depends on this
2. **Dashboard** → Paul's primary view, validates the design
3. **Projects + Project Detail** → core object, validates the data model
4. **Board** → validates task management workflow
5. **Task Detail** → validates association and activity model
6. **Activity Feed** → validates the timeline
7. **Backend** → built to serve exactly what the frontend needs
8. **Integration** → connecting the two
9. **Migration** → bringing v3 data into v4
