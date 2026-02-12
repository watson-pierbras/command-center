# Command Center Fix Plan

## Critical Fixes (Immediate)

### 1. Fix Time Tracking Math (Task 0007)
**Issue:** Sessions total 7.5h, but actual shows 8.5h
**Fix:** Correct session durations or actual time value
**File:** board.json
**Effort:** 5 min

### 2. Remove testGithubPat() Function
**Issue:** Exposed diagnostic function in production
**Fix:** Remove or gate behind debug flag
**File:** index.html
**Effort:** 2 min

### 3. Fix DATA_VERSION Constant
**Issue:** index.html uses "3.0", board.json uses "3.1"
**Fix:** Align constants
**File:** index.html
**Effort:** 1 min

### 4. Migrate Legacy Tasks
**Issue:** 8 of 11 tasks lack cost/time objects
**Fix:** Add default cost/time structures to all legacy tasks
**File:** board.json
**Effort:** 15 min

## High Priority Fixes (Next)

### 5. Add Event Listener Cleanup
**Issue:** 57 addEventListener, 0 removeEventListener = memory leaks
**Fix:** Implement cleanup or use event delegation
**File:** index.html
**Effort:** 30 min

### 6. Remove Console/Debug Statements
**Issue:** console.log and diagnostic code in production
**Fix:** Clean up debug code
**File:** index.html
**Effort:** 10 min

### 7. Remove "Coming Soon" Placeholders
**Issue:** 4 alert("Coming soon!") buttons exposed to users
**Fix:** Hide buttons or implement features
**File:** index.html
**Effort:** 10 min

### 8. Add Theme Variable Consistency
**Issue:** Hardcoded colors instead of CSS variables
**Fix:** Convert to CSS custom properties
**File:** index.html
**Effort:** 20 min

### 9. Add Bidirectional Relationship Validation
**Issue:** Relationships not validated both ways
**Fix:** Check that blockedBy references exist
**File:** board-ops.sh or sync.sh
**Effort:** 15 min

### 10. Fix Missing Error Boundaries
**Issue:** normalizeTask can crash entire app
**Fix:** Add try-catch with fallback
**File:** index.html
**Effort:** 10 min

## Implementation Order

1. ✅ Data fixes (board.json) - 20 min
2. ✅ Security fixes (index.html) - 5 min
3. ✅ Code cleanup (index.html) - 20 min
4. ⏳ Memory leak fixes - 30 min
5. ⏳ UI polish - 30 min

Total estimated time: ~2 hours
