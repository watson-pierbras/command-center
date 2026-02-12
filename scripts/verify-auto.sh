#!/bin/bash
# Automated Verification Script (Level 1)
# Run before every commit

set -e

echo "🔍 Running Level 1 automated verification..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# 1. JSON Validation
echo ""
echo "📋 Checking JSON files..."
for file in *.json; do
  if [[ -f "$file" ]]; then
    if ! jq empty "$file" 2>/dev/null; then
      echo -e "${RED}❌ $file is invalid JSON${NC}"
      ERRORS=$((ERRORS + 1))
    else
      echo -e "${GREEN}✓${NC} $file valid"
    fi
  fi
done

# 2. Required Files Exist
echo ""
echo "📁 Checking required files..."
REQUIRED=("board.json" "index.html" "scripts/sync.sh")
OPTIONAL=("projects.json" "agents.json")

for file in "${REQUIRED[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo -e "${RED}❌ Required file missing: $file${NC}"
    ERRORS=$((ERRORS + 1))
  else
    echo -e "${GREEN}✓${NC} $file exists"
  fi
done

for file in "${OPTIONAL[@]}"; do
  if [[ -f "$file" ]]; then
    echo -e "${GREEN}✓${NC} $file exists (optional)"
  fi
done

# 3. Check for secrets in staged changes
echo ""
echo "🔐 Checking for secrets in diff..."
if git diff --cached | grep -iE "(api[_-]?key|apikey|password|secret|token|github_pat)" | grep -vE "(example|placeholder|XXXX|your-)" 2>/dev/null; then
  echo -e "${YELLOW}⚠️  Potential secret detected in staged changes${NC}"
  echo "Review carefully before committing"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✓${NC} No obvious secrets detected"
fi

# 4. Check index.html for basic issues
echo ""
echo "🌐 Checking index.html..."
if [[ -f "index.html" ]]; then
  # Check for unclosed tags (basic)
  if grep -c '<script' index.html | xargs -I {} test {} -eq $(grep -c '</script>' index.html) 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Script tags balanced"
  else
    echo -e "${YELLOW}⚠️  Potential unclosed script tags${NC}"
  fi
  
  # Check file size not crazy
  SIZE=$(stat -f%z index.html 2>/dev/null || stat -c%s index.html 2>/dev/null || echo 0)
  if [[ $SIZE -gt 500000 ]]; then
    echo -e "${YELLOW}⚠️  index.html is large (${SIZE} bytes)${NC}"
  else
    echo -e "${GREEN}✓${NC} index.html size OK"
  fi
fi

# 5. Check board.json structure
echo ""
echo "📊 Checking board.json structure..."
if [[ -f "board.json" ]]; then
  # Check version field
  if jq -e '.version' board.json >/dev/null 2>&1; then
    VERSION=$(jq -r '.version' board.json)
    echo -e "${GREEN}✓${NC} board.json version: $VERSION"
  else
    echo -e "${YELLOW}⚠️  board.json missing version field${NC}"
  fi
  
  # Check tasks array exists
  if jq -e '.tasks' board.json >/dev/null 2>&1; then
    TASK_COUNT=$(jq '.tasks | length' board.json)
    echo -e "${GREEN}✓${NC} Tasks count: $TASK_COUNT"
  else
    echo -e "${RED}❌ board.json missing tasks array${NC}"
    ERRORS=$((ERRORS + 1))
  fi
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [[ $ERRORS -eq 0 ]]; then
  echo -e "${GREEN}✅ Level 1 verification PASSED${NC}"
  echo "Ready for Level 2 functional verification"
  exit 0
else
  echo -e "${RED}❌ Level 1 verification FAILED ($ERRORS errors)${NC}"
  echo "Fix issues before proceeding"
  exit 1
fi
