# Command Center v4 — Verification Framework

## The Rule

**If Paul finds a bug, Watson failed.**

This is not a suggestion. It is the operating principle. Every feature, every fix, every change goes through verification before it reaches production. No exceptions.

## Verification Protocol

### Before Any Commit

```
1. Code written (by Codex or Watson)
2. Syntax check: node --check on all JS files
3. Reference check: all IDs and associations valid
4. Watson browser-tests the change
5. Screenshot captured as evidence
6. Commit only after verification passes
```

### Before Any Deploy

```
1. All commits verified individually
2. Full dashboard screenshot (catches aggregate data issues)
3. Mobile viewport screenshot
4. Dark mode screenshot (if UI change)
5. Console error check (browser evaluate)
6. Push to production
7. Post-deploy health check
8. Post-deploy screenshot of live site
```

### Watson's QA Checklist

Every pull from Codex goes through this:

- [ ] **Does it compile?** — `node --check` on all JS files
- [ ] **Does it render?** — Open in browser, screenshot
- [ ] **Does it work?** — Click through the feature, verify interactions
- [ ] **Does it handle errors?** — Test with bad data, network off
- [ ] **Does it look right?** — Compare to design spec
- [ ] **Does it work on mobile?** — Resize viewport, test touch targets
- [ ] **Does it work in dark mode?** — Toggle theme, verify
- [ ] **Are there console errors?** — Check browser console
- [ ] **Is the code clean?** — No debug logs, no dead code, no TODOs

## Evidence Collection

Watson saves screenshots for every verification pass:

```
verification/
├── 2026-02-12/
│   ├── dashboard-light.png
│   ├── dashboard-dark.png
│   ├── dashboard-mobile.png
│   ├── projects-list.png
│   ├── project-detail.png
│   └── board-view.png
```

Screenshots serve as:
1. Proof of testing
2. Visual regression baseline
3. Record of what was deployed

## Bug Response Protocol

If Paul reports a bug:

1. **Acknowledge immediately** — Don't defend, don't explain. Acknowledge.
2. **Reproduce** — Open the exact same view Paul saw, screenshot the bug
3. **Fix** — Identify root cause, implement fix
4. **Verify** — Browser-test the fix, screenshot the resolution
5. **Deploy** — Push fix to production
6. **Confirm** — Screenshot live site showing the fix
7. **Post-mortem** — Why did this get through verification? Update the checklist.

**Never say "it works on my end"**. If Paul sees a bug, it's real.

## Design Compliance

Every UI change is checked against the Design Philosophy (DESIGN-PHILOSOPHY.md):

1. **Jobs Filter**: "Would this exist if Steve Jobs were reviewing it?"
2. **Removal test**: "Can this be removed without losing meaning?"
3. **Inevitability test**: "Does this feel like no other design was possible?"
4. **Precision test**: "Is every element aligned to the grid?"
5. **Calm test**: "Does this feel premium and quiet, or busy and cheap?"

## API Verification

For every API endpoint change:

```bash
# Health check
curl -s https://api.example.com/api/health | jq .

# CRUD cycle
curl -s -X POST https://api.example.com/api/objects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"task","name":"Test task","status":"planned"}' | jq .

# Verify created
curl -s https://api.example.com/api/objects/$ID \
  -H "Authorization: Bearer $TOKEN" | jq .

# Delete
curl -s -X DELETE https://api.example.com/api/objects/$ID \
  -H "Authorization: Bearer $TOKEN"
```

## Continuous Verification (Heartbeat)

Watson periodically verifies the live site during heartbeat checks:

1. Open live URL in browser
2. Screenshot dashboard
3. Check that numbers match expected data
4. Verify no visual regressions
5. Check API health endpoint
6. Report any issues to Paul immediately

## Rollback Plan

If a deploy breaks production:

1. Revert commit: `git revert HEAD && git push`
2. Cloudflare Pages auto-deploys the reverted state
3. Worker: `wrangler rollback` to previous deployment
4. Verify rollback worked (screenshot)
5. Notify Paul

## Definition of Done

A feature is "done" when:

1. ✅ Code is written and passes syntax checks
2. ✅ Watson has browser-tested it and captured screenshots
3. ✅ It works on desktop, mobile, light mode, and dark mode
4. ✅ It handles empty states and error states
5. ✅ It matches the design spec (DESIGN-SYSTEM.md, APP-FLOW.md)
6. ✅ It has no console errors
7. ✅ It's been deployed to production
8. ✅ The live site has been verified post-deploy
9. ✅ Watson would bet his reputation that Paul won't find a bug

If any of these fail, it's not done. Period.
