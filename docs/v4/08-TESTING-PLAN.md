# Command Center v4 — Testing Plan

## Philosophy

**If Paul finds a bug, Watson failed.** Every feature is verified before it reaches production. Testing is not optional — it's the QA gate.

## Test Levels

### Level 1: Automated (Pre-commit)

Runs automatically on every commit via git pre-commit hook.

| Check | Tool | What It Catches |
|-------|------|-----------------|
| JSON syntax | `node --check` / `jq` | Broken data files |
| JS syntax | `node --check` on all `.js` files | Syntax errors |
| CSS validation | Stylelint (minimal config) | Invalid CSS, typos in custom properties |
| HTML validation | Basic structure check | Unclosed tags, missing attributes |
| Reference integrity | Custom script | Broken object references, orphaned associations |
| Secret scan | `grep` for patterns | Leaked API keys, tokens |
| Token usage | Custom script | CSS properties not in design system |

### Level 2: Watson QA (Pre-deploy)

Watson manually verifies every feature before it goes live.

**Browser automation protocol:**
1. Open the app in the OpenClaw browser (`profile="openclaw"`)
2. Navigate to the affected view
3. Screenshot the result
4. Verify visual correctness against spec
5. Test interactions (click, type, navigate)
6. Check console for errors (`browser evaluate: () => window.__errors`)
7. Test on mobile viewport (resize browser)
8. Verify dark mode if applicable

**Checklist per feature:**
- [ ] Renders correctly (visual match to spec)
- [ ] Interactive elements work (buttons, links, forms)
- [ ] Data displays correctly (numbers, dates, text)
- [ ] Empty states show correctly
- [ ] Error states handle gracefully
- [ ] Mobile viewport works
- [ ] Dark mode works (if applicable)
- [ ] No console errors
- [ ] Keyboard navigation works
- [ ] Performance acceptable (no jank, no long loads)

### Level 3: Integration (Post-deploy)

After deploying to production (Cloudflare):

1. **Health check**: `GET /api/health` returns OK
2. **Auth check**: Token-based auth works
3. **CRUD cycle**: Create object → Read → Update → Delete → Verify
4. **Dashboard data**: Numbers match expected totals
5. **Cross-browser**: Verify in Safari, Chrome (via screenshots)
6. **Mobile**: Open on actual mobile device (Paul's phone)

## Test Scenarios

### Data Layer (API)

| Scenario | Method | Expected |
|----------|--------|----------|
| Create project | POST /api/objects | 201, object returned with ULID |
| Create task with association | POST /api/objects + associations | 201, task + association created |
| Update task status | PATCH /api/objects/:id | 200, activity auto-created |
| Delete object | DELETE /api/objects/:id | 204, soft-deleted (deleted_at set) |
| List with filters | GET /api/objects?type=task&status=active | 200, filtered results |
| Pagination | GET /api/objects?limit=2&cursor=xxx | 200, 2 results, hasMore=true |
| Invalid input | POST /api/objects (empty body) | 400, validation errors |
| Unauthorized | GET /api/objects (no token) | 401 |
| Create duplicate association | POST /api/associations (same pair) | 409, conflict |
| Dashboard aggregate | GET /api/dashboard | 200, correct totals |
| Activity feed | GET /api/activities | 200, ordered by created_at DESC |
| Comment on object | POST /api/objects/:id/activities | 201, comment created |
| Mark activity read | PATCH /api/activities/:id {is_read:true} | 200 |
| Search | GET /api/objects?q=dashboard | 200, matching results |

### Frontend (UI)

| Scenario | View | Verification |
|----------|------|-------------|
| Dashboard loads | `/` | KPI cards show correct numbers |
| Project list | `/projects` | All projects visible as cards |
| Project detail | `/projects/:id` | Tabs work, data correct |
| Task board | `/board` | Columns render, cards in correct columns |
| Drag task | `/board` | Card moves, status updates via API |
| Create task | `/projects/:id` | Form validates, task appears in list |
| Comment on task | Task detail | Comment appears in timeline |
| Filter tasks | `/board` | Only matching tasks shown |
| Theme toggle | Settings | All views re-render correctly |
| Empty project | `/projects/:id` | Empty state shown, not blank |
| Blocked task | Board/detail | Blocked indicator visible |
| Progress bar | Project card | Accurate percentage, correct color |
| Mobile nav | All | Bottom tabs work, no overflow |
| Slide-over | Task detail | Opens/closes, scroll independent |
| Search | Global | Results match query |
| Error handling | Any API failure | Toast shown, no crash |
| Offline | Disconnect network | Cached data shown, mutations queued |

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Very long project name | Truncated with ellipsis, full on hover/detail |
| 0 tasks in project | Empty state, not "0%" progress bar |
| 100% complete project | Full green bar, "Completed" status |
| All tasks blocked | Dashboard "Needs Attention" shows all |
| Rapid status changes | Last write wins, no race conditions |
| Token expired | Redirect to settings, re-auth prompt |
| D1 unavailable | Graceful error message, retry option |
| Concurrent Paul + Watson edits | Optimistic UI with conflict resolution (last write wins) |

## Regression Testing

After any code change:
1. Run Level 1 checks (automated)
2. Watson browser-tests the changed view
3. Watson browser-tests dashboard (it aggregates everything, catches data issues)
4. Screenshot before and after for visual comparison

## Performance Benchmarks

| Metric | Target | Method |
|--------|--------|--------|
| First paint | < 1s | Lighthouse |
| Interactive | < 2s | Lighthouse |
| Dashboard load (API) | < 200ms | Network timing |
| List load (20 items) | < 300ms | Network timing |
| Board render (50 cards) | < 100ms | Performance API |
| Slide-over open | < 200ms | Visual (no jank) |

## CI/CD Pipeline (Future)

When we move to a proper repo with CI:
1. Push to branch → automated tests run
2. PR → Watson reviews code + screenshots
3. Merge to main → auto-deploy to Cloudflare
4. Post-deploy → health check + smoke test

For now: Watson IS the CI/CD pipeline. Every commit is reviewed and tested before push.
