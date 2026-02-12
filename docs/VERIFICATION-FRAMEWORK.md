# Testing & Verification Framework

## Philosophy

**Every deliverable must be verified before it's "done."** No exceptions.

Verification is not optional. It's the difference between "it should work" and "it works."

---

## Verification Levels

### Level 1: Automated Checks (Always Run)
**Who:** Watson (automated)  
**When:** Before any commit  
**Time:** ~30 seconds

**Checks:**
- [ ] JSON files validate (`jq empty`)
- [ ] No syntax errors in modified files
- [ ] Required files exist
- [ ] Git status shows expected changes
- [ ] No secrets/credentials in diff

**Script:** `scripts/verify-auto.sh`

---

### Level 2: Functional Verification (Feature-Dependent)
**Who:** Spawned "Verifier" agent or Watson  
**When:** After implementation, before user review  
**Time:** 2-5 minutes

**Checks by Feature Type:**

**Data Schema Changes:**
- [ ] Sample data queries return expected results
- [ ] All required fields present
- [ ] Relationships/references valid
- [ ] Migration path documented

**UI Changes:**
- [ ] Visual elements render (screenshot comparison)
- [ ] Interactive elements respond to events
- [ ] No console errors
- [ ] Responsive at mobile/desktop breakpoints

**API/Integration Changes:**
- [ ] Endpoints return expected responses
- [ ] Error handling works
- [ ] Authentication/permissions enforced

**Script:** Feature-specific verification prompts

---

### Level 3: Integration Testing (Complex Features)
**Who:** Separate testing agent or manual  
**When:** Multi-component features  
**Time:** 5-15 minutes

**Checks:**
- [ ] End-to-end workflow completes
- [ ] Data flows correctly between components
- [ ] Edge cases handled
- [ ] Performance acceptable

---

### Level 4: User Acceptance (Final Gate)
**Who:** Paul (the user)  
**When:** After Levels 1-3 pass  
**Time:** User's discretion

**Checks:**
- [ ] Feature meets requirements
- [ ] UX feels right
- [ ] No regressions in existing functionality

---

## Verification Workflow

```
┌─────────────────┐
│  Implementation │
│    Complete     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  Level 1 Auto   │────►│    FAIL      │──► Fix & Retry
│   Checks        │     └──────────────┘
└────────┬────────┘
         │ PASS
         ▼
┌─────────────────┐     ┌──────────────┐
│  Level 2 Func   │────►│    FAIL      │──► Fix & Retry
│  Verification   │     └──────────────┘
└────────┬────────┘
         │ PASS
         ▼
┌─────────────────┐     ┌──────────────┐
│ Level 3 Integ   │────►│    FAIL      │──► Fix & Retry
│   (if needed)   │     └──────────────┘
└────────┬────────┘
         │ PASS
         ▼
┌─────────────────┐
│  Commit & Push  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Level 4 User    │
│   Acceptance    │
└─────────────────┘
```

---

## Verification Agents

### Auto-Verifier (Level 1)
```bash
#!/bin/bash
# scripts/verify-auto.sh

echo "🔍 Running automated verification..."

# JSON validation
for file in *.json; do
  if ! jq empty "$file" 2>/dev/null; then
    echo "❌ $file is invalid JSON"
    exit 1
  fi
done

# Check required files exist
required=("board.json" "projects.json" "agents.json" "index.html")
for file in "${required[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "❌ Required file missing: $file"
    exit 1
  fi
done

# Check for secrets in diff
if git diff | grep -iE "(api_key|apikey|password|secret|token)" | grep -v "example\|placeholder"; then
  echo "⚠️  Potential secret in diff"
  exit 1
fi

echo "✅ Level 1 verification passed"
```

### Functional Verifier (Level 2)
Spawned Codex session with prompt:
```
Verify the implementation of [FEATURE].

REQUIREMENTS:
- [List requirements from original task]

IMPLEMENTATION:
- [File paths modified]

VERIFICATION STEPS:
1. Check that [specific requirement 1] is met
2. Check that [specific requirement 2] is met
3. Test [specific scenario]
4. Verify no regressions in [related functionality]

OUTPUT:
- Pass/Fail for each check
- Specific findings
- Recommendations if issues found
```

---

## Testing Checklists

### Schema Changes Checklist
```markdown
## Schema Verification: [Feature Name]

### Data Integrity
- [ ] All required fields present in sample records
- [ ] Field types match specification
- [ ] No null values where not allowed
- [ ] Relationships valid (foreign keys exist)

### Sample Queries Tested
- [ ] Query 1: [description] → Result: [expected]
- [ ] Query 2: [description] → Result: [expected]

### Migration
- [ ] Old data still accessible
- [ ] New fields have sensible defaults
- [ ] Rollback possible

### Performance
- [ ] Query time < 100ms for typical operations
```

### UI Changes Checklist
```markdown
## UI Verification: [Feature Name]

### Visual
- [ ] Renders correctly in Chrome/Safari/Firefox
- [ ] Mobile responsive (320px, 768px, 1440px)
- [ ] Dark/light theme compatible
- [ ] No layout shifts on load

### Functional
- [ ] All interactive elements respond
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] No console errors

### Accessibility
- [ ] ARIA labels present
- [ ] Color contrast sufficient
- [ ] Screen reader compatible (basic)
```

---

## When to Use Each Level

| Change Type | Level 1 | Level 2 | Level 3 | Level 4 |
|-------------|---------|---------|---------|---------|
| CSS only | ✅ | Optional | ❌ | ✅ |
| Single file edit | ✅ | ✅ | ❌ | ✅ |
| Schema change | ✅ | ✅ | Optional | ✅ |
| Multi-file feature | ✅ | ✅ | ✅ | ✅ |
| Breaking change | ✅ | ✅ | ✅ | ✅ |
| Critical path | ✅ | ✅ | ✅ | ✅ |

---

## Regression Prevention

### Before Commit Checklist
- [ ] Run Level 1 automated checks
- [ ] Verify feature still works (manual or Level 2)
- [ ] Check related features unaffected
- [ ] Review diff for unintended changes

### Post-Deploy Monitoring
- [ ] Verify GitHub Pages deployment successful
- [ ] Check console for errors
- [ ] Confirm critical user paths work
- [ ] Watch for user-reported issues

---

## Failure Handling

### If Verification Fails:
1. **Document the failure** — what check failed, why
2. **Don't commit** — fix first
3. **Re-run verification** — after fix
4. **Escalate if stuck** — ask user for direction

### Common Failure Patterns:
- **"It works on my machine"** → Environment mismatch, need containerization
- **"The test is wrong"** → Test is the spec; update implementation
- **"It's just a small change"** → Small changes break things too; verify anyway

---

## Success Metrics

**Target:**
- 100% of commits pass Level 1
- 95% of features pass Level 2 on first try
- <5% regression rate in production
- Zero security credential leaks

---

## Implementation Plan

### Phase A: Immediate (This Session)
1. Create `scripts/verify-auto.sh` (Level 1)
2. Document verification workflow
3. Apply to remaining schema phases

### Phase B: Next Sprint
1. Create reusable verification agent prompts
2. Build screenshot comparison for UI tests
3. Add automated GitHub Actions CI

### Phase C: Future
1. Full test suite with coverage reporting
2. Staging environment for pre-prod testing
3. Automated regression testing on PRs

---

## Verification Log Template

```markdown
## Verification: [Feature Name] - [Date]

**Implementer:** [Agent name]  
**Verifier:** [Watson or agent name]  

### Level 1: Automated
- [ ] JSON validation
- [ ] File existence
- [ ] Secret scan
**Result:** PASS / FAIL

### Level 2: Functional
**Checks:**
1. [Check description]: PASS / FAIL
2. [Check description]: PASS / FAIL
3. [Check description]: PASS / FAIL

**Findings:**
- [Any issues found]

**Result:** PASS / FAIL

### Level 3: Integration (if applicable)
**Result:** N/A / PASS / FAIL

### Level 4: User Acceptance
**Tester:** Paul  
**Result:** APPROVED / CHANGES REQUESTED

### Notes
[Any additional context]
```

---

## Current Project Status

| Feature | L1 | L2 | L3 | L4 | Status |
|---------|----|----|----|----|--------|
| Phase 1: Projects | ✅ | ❌ | N/A | ❌ | MERGED |
| Phase 2: Agents | ✅ | ❌ | N/A | ❌ | MERGED |
| Phase 3: Relationships | ✅ | ❌ | N/A | ❌ | MERGED |
| Phase 4: Time Tracking | ✅ | ❌ | N/A | ❌ | MERGED |
| Phase 5: Cost Breakdown | - | - | - | - | PENDING |

**Action:** Apply verification framework starting with Phase 5.

---

*"Test what you fly, fly what you test."* — NASA
