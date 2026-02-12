# Verification Framework

## Philosophy

> **"Watson is the QA gate. Paul receives finished products only."**

If Paul finds a bug, Watson failed.

---

## How It Works

### Step 1: Pre-Commit Hook (Automatic)

Every `git commit` runs `.git/hooks/pre-commit` automatically.

**Checks:**
- ✅ JSON syntax valid
- ✅ Required files exist (board.json, index.html)
- ✅ Reference integrity (board project names exist in projects.json)
- ✅ No obvious secrets in diff

**If this fails, you cannot commit.** Fix the issues first.

**Time:** 5-10 seconds

---

### Step 2: Watson QA Review (Mandatory)

**Before any code reaches Paul, Watson reviews:**

#### Code Quality
- [ ] Follows existing patterns and conventions
- [ ] No obvious bugs or logic errors
- [ ] Proper error handling
- [ ] No security issues

#### Completeness
- [ ] All requirements from spec implemented
- [ ] Edge cases handled
- [ ] No TODO comments or unfinished code
- [ ] Documentation updated if needed

#### Functionality
- [ ] Feature works as designed
- [ ] No console errors
- [ ] Works on mobile and desktop (if UI)
- [ ] Responsive design intact

#### Integration
- [ ] Doesn't break existing features
- [ ] References valid (no orphaned data)
- [ ] Schema changes backward compatible

#### Polish
- [ ] Visual design consistent
- [ ] Text copy correct (no placeholders)
- [ ] No debug code left in

**Tools Watson uses:**
- Browser automation for UI testing
- JSON validation for data
- Git diff review for code quality
- Console monitoring for JS errors

**If fails:** Return to Codex with specific fixes  
**If passes:** Proceed to delivery

**Time:** 2-10 minutes depending on change

---

### Step 3: Paul Approval (Strategic)

**Paul's role:**
- [ ] Confirms feature meets business need
- [ ] Approves direction and tradeoffs
- [ ] Decides next steps

**Not Paul's role:**
- ❌ Finding bugs (Watson should have caught them)
- ❌ Testing functionality (Watson already tested)
- ❌ Reporting console errors (unacceptable)

---

## The Golden Rule

> **Paul should never receive broken code.**

If Paul has to:
- Test if a feature works → Watson failed
- Report a console error → Watson failed
- Find an incomplete implementation → Watson failed
- Discover a visual glitch → Watson failed

**Watson's job is to be the filter.**

---

## Examples

### Example 1: Add a task to board.json
```
Paul: "Add a task for the new feature"

Watson:
  1. Design: Where does it fit? What priority?
  2. Implement: Add to board.json
  3. Verify: JSON valid? References correct?
  4. Deliver: "Task added. Here's what I created..."

Paul: "Looks good" → APPROVED
```

### Example 2: New UI feature (JavaScript)
```
Paul: "Add a filter to the board"

Watson:
  1. Design: How should filter work? Where in UI?
  2. Orchestrate: Spawn Codex with spec
  3. Receive: Codex returns implementation
  4. Review: Check code quality
  5. Test: Open browser, test filter works
  6. Test: Check mobile
  7. Test: Verify no console errors
  8. Deliver: "Filter added. Tested on desktop and mobile. Screenshot attached..."

Paul: "Perfect" → APPROVED
```

### Example 3: Bug found (the failure case)
```
Paul: "The filter doesn't work on mobile"

Watson: FAILED — should have tested mobile
  1. Acknowledge failure
  2. Fix the bug
  3. Re-test thoroughly
  4. Re-deliver

Paul: "Now it works" → APPROVED
```

---

## What Each Level Catches

### Pre-Commit Hook (Automatic)
✅ Broken JSON syntax
✅ Missing required files
✅ Orphaned references
✅ Obvious secrets

### Watson QA Review
✅ Logic errors
✅ Incomplete implementations
✅ Console errors
✅ UI/UX issues
✅ Integration problems
✅ Security issues
✅ Performance problems

### Paul Approval
✅ Strategic direction
✅ Business requirements
✅ Priority decisions

---

## When to Escalate to Paul

Watson should ask Paul when:
- Requirements are unclear
- Multiple valid approaches exist
- Technical tradeoffs need input
- Scope needs to change
- External approval needed (payments, public posts)

**Not for bugs.** Watson handles bugs.

---

## Commands

### Run pre-commit hook manually
```bash
.git/hooks/pre-commit
```

### Skip verification (emergency only)
```bash
git commit --no-verify -m "emergency fix"
```
⚠️ Watson should never need this. If using, explain why.

### Check JSON file
```bash
jq empty board.json && echo "Valid" || echo "Invalid"
```

### Find orphaned references
```bash
jq -r '.tasks[].project' board.json | sort -u
jq -r '.projects[].name' projects.json | sort -u
```

---

## Success Metrics

Target:
- **100%** of delivered features work on first try
- **0** bugs reported by Paul
- **<5%** of work needs rework after Watson review

---

## Comparison: Before vs After

| Aspect | Before | After (Watson as QA Gate) |
|--------|--------|---------------------------|
| Who tests? | Paul | Watson |
| Bug discovery | By Paul | By Watson (before delivery) |
| Paul's role | QA tester | Product owner |
| Delivery quality | Variable | Polished, working |
| Paul's time | Testing and reporting bugs | Strategic direction |

---

*"The best code is code that works. The best process delivers working code."*
