# Verification Framework (Simplified)

## Philosophy

> **"Verify what matters, skip what doesn't."**

The best verification is the one that actually runs. This framework is designed to catch real bugs without bureaucratic overhead.

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

### Step 2: Targeted Verification (Manual)

After implementation, verify based on what you changed:

| If you changed... | Verify this... | How |
|-------------------|----------------|-----|
| **CSS only** | Visual appearance | Open browser, check the change |
| **board.json data** | Data integrity | Run `jq '.tasks[0]' board.json` |
| **JavaScript logic** | Functionality | Test the feature manually |
| **HTML structure** | Renders correctly | Check mobile + desktop |
| **Schema/relationships** | References valid | Check related files load |
| **New feature** | End-to-end works | Full user flow test |

**Time:** 1-5 minutes depending on change

---

### Step 3: User Acceptance (You)

**Required before marking "done":**
- [ ] Feature works as expected
- [ ] No obvious bugs
- [ ] UX feels right

**Time:** Your discretion

---

## Quick Decision Tree

```
Is it a data-only change (no code)?
├── Yes → Pre-commit hook handles it
└── No → Does it change JavaScript/HTML?
    ├── Yes → Manual test the feature
    └── No → Visual check only
```

---

## Examples

### Example 1: Add a task to board.json
```bash
# Edit board.json
git add board.json
git commit -m "add: new task for feature X"
# Pre-commit hook runs automatically → PASS
# No manual testing needed (data only)
# Paul reviews → APPROVED
```

### Example 2: Change CSS for cards
```bash
# Edit index.html (CSS)
git add index.html
git commit -m "style: improve card spacing"
# Pre-commit hook runs → PASS
# Manual: Open browser, check cards look right
# Paul reviews → APPROVED
```

### Example 3: New JavaScript feature
```bash
# Edit index.html (JS)
git add index.html
git commit -m "feat: add filter to board"
# Pre-commit hook runs → PASS
# Manual: Open browser, test filter works
# Manual: Test on mobile
# Paul reviews → APPROVED
```

---

## What This Catches

✅ **Definitely catches:**
- Broken JSON (syntax errors, missing commas)
- Missing required files
- Deleted files accidentally
- Orphaned references (project in board that doesn't exist)
- Obvious secrets committed by mistake

✅ **Probably catches (with manual testing):**
- JavaScript runtime errors
- UI rendering issues
- Broken functionality

❌ **Won't catch:**
- Logic errors in complex algorithms
- Performance issues
- Accessibility problems
- Cross-browser quirks

---

## When to Worry

**Stop and think harder if:**
- You're changing the schema (adds new fields)
- You're modifying sync.sh or critical infrastructure
- You're deleting data or files
- You're changing authentication/security code

In these cases, add explicit verification steps.

---

## Commands

### Run verification manually
```bash
.git/hooks/pre-commit
```

### Skip verification (emergency only)
```bash
git commit --no-verify -m "emergency fix"
```
⚠️ Only use if you know what you're doing.

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

## Maintenance

**Update this framework when:**
- New file types added to project
- New required files introduced
- New security patterns discovered

**Keep it simple.** If verification takes longer than 5 minutes, it's too heavy.

---

## Success Metrics

Target:
- 100% of commits pass pre-commit hook
- <5% need follow-up fixes after commit
- Verification overhead < 1 minute per typical change

---

## Comparison: Old vs New

| Aspect | Old (4 Levels) | New (Simplified) |
|--------|----------------|------------------|
| Levels | 4 | 2 (hook + manual) |
| Time | 7-20 min | 1-5 min |
| Mandatory | L1 only | L1 automatic |
| Actually used | Rarely | Every commit |
| Catches bugs | Sometimes | Most syntax/reference |

---

*"The best code is code that ships. The best verification is verification that runs."*
