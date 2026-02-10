#!/usr/bin/env bash
# Command Center State Sync
# Collects system data and writes state.json — zero AI/API cost
# Runs via launchd every 5 minutes

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STATE_FILE="$REPO_DIR/state.json"
OPENCLAW_DIR="$HOME/.openclaw"
OPENCLAW_CONFIG="$OPENCLAW_DIR/openclaw.json"
WORKSPACE="$OPENCLAW_DIR/workspace"
LOGFILE="$REPO_DIR/scripts/sync.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOGFILE"
}

log "Sync started"

# ── Agent Status ─────────────────────────────────────────────

# Watson (OpenClaw)
watson_status="offline"
watson_model="unknown"
if pgrep -qf "openclaw" 2>/dev/null; then
  watson_status="online"
fi
if [[ -f "$OPENCLAW_CONFIG" ]]; then
  # Check for runtime override first, then default
  watson_model=$(jq -r '
    (.agents.defaults.models // {} | to_entries | map(select(.value.alias)) | first | .key)
    // .agents.defaults.model.primary
    // "unknown"
  ' "$OPENCLAW_CONFIG" 2>/dev/null || echo "unknown")
  # If we got the aliased model (opus = claude-opus-4-6), use it
  # Fallback: check if anthropic provider is configured in auth
  auth_model=$(jq -r '.auth.profiles[]? | select(.provider == "anthropic") | .provider' "$OPENCLAW_CONFIG" 2>/dev/null || true)
  if [[ -n "$auth_model" ]]; then
    # Anthropic is configured — get the actual model from aliases
    aliased=$(jq -r '.agents.defaults.models // {} | to_entries[] | select(.value.alias == "opus") | .key' "$OPENCLAW_CONFIG" 2>/dev/null || true)
    [[ -n "$aliased" ]] && watson_model="$aliased"
  fi
fi

# Watson last activity
watson_last_activity=""
latest_memory=$(ls -t "$WORKSPACE/memory/"*.md 2>/dev/null | head -1 || true)
if [[ -n "$latest_memory" ]]; then
  watson_last_activity=$(date -r "$latest_memory" -u +"%Y-%m-%dT%H:%M:%SZ")
fi

# Codex CLI
codex_status="offline"
codex_model="gpt-5.3-codex"
if command -v codex &>/dev/null; then
  codex_status="idle"
  codex_config="$HOME/.codex/config.toml"
  if [[ -f "$codex_config" ]]; then
    extracted=$(grep -E '^model\s*=' "$codex_config" 2>/dev/null | head -1 | sed 's/^model[[:space:]]*=[[:space:]]*"\(.*\)"/\1/' || true)
    [[ -n "$extracted" ]] && codex_model="$extracted"
  fi
  if pgrep -qf "codex" 2>/dev/null; then
    codex_status="online"
  fi
fi

# Codex last activity
codex_last_activity=""
codex_last=$(cd "$REPO_DIR" && git log --all --format="%aI" -1 2>/dev/null || true)
if [[ -n "$codex_last" ]]; then
  codex_last_activity="$codex_last"
fi

# Ollama
ollama_status="offline"
ollama_models='[]'
if command -v ollama &>/dev/null; then
  if pgrep -qf "ollama" 2>/dev/null; then
    ollama_status="online"
  else
    ollama_status="idle"
  fi
  ollama_models=$(ollama list 2>/dev/null | tail -n +2 | awk '{print $1}' | head -5 | jq -R . | jq -s . 2>/dev/null || true)
  if [[ -z "$ollama_models" ]] || ! jq -e . >/dev/null 2>&1 <<<"$ollama_models"; then
    ollama_models='[]'
  fi
fi

# ── CoachFinder Status ───────────────────────────────────────
cf_py_files=0
cf_py_lines=0
cf_security='[]'
cf_dir="$WORKSPACE/coachfinder-core"

if [[ -d "$cf_dir" ]]; then
  cf_py_files=$(find "$cf_dir" -name "*.py" 2>/dev/null | wc -l | tr -d ' ')
  cf_py_lines=$(find "$cf_dir" -name "*.py" -exec cat {} + 2>/dev/null | wc -l | tr -d ' ')
  
  issues=()
  if [[ -f "$cf_dir/.env" ]] && git -C "$cf_dir" ls-files --error-unmatch .env &>/dev/null 2>&1; then
    issues+=(".env with HubSpot API keys committed to git")
  fi
  if git -C "$cf_dir" ls-files node_modules 2>/dev/null | head -1 | grep -q .; then
    issues+=("node_modules committed in hubspot-ui-extension")
  fi
  
  cf_security=$(printf '%s\n' "${issues[@]}" 2>/dev/null | jq -R . | jq -s . 2>/dev/null || echo '[]')
fi

# ── Cost Tracking ─────────────────────────────────────────────
SESSIONS_DIR="$HOME/.openclaw/agents/main/sessions"
TODAY_DATE=$(date -u +"%Y-%m-%d")
WEEK_AGO=$(date -u -v-7d +"%Y-%m-%dT00:00:00Z" 2>/dev/null || date -u -d "7 days ago" +"%Y-%m-%dT00:00:00Z")
MONTH_AGO=$(date -u -v-30d +"%Y-%m-%dT00:00:00Z" 2>/dev/null || date -u -d "30 days ago" +"%Y-%m-%dT00:00:00Z")

if [ -d "$SESSIONS_DIR" ] && ls "$SESSIONS_DIR"/*.jsonl 1>/dev/null 2>&1; then
  COSTS_JSON=$(cat "$SESSIONS_DIR"/*.jsonl | jq -s --arg today "$TODAY_DATE" --arg weekAgo "$WEEK_AGO" --arg monthAgo "$MONTH_AGO" '
    def round2: (. * 100 | round / 100);
    def tokens_in($u): (($u.input // 0) + ($u.cacheRead // 0) + ($u.cacheWrite // 0));
    [.[] | select(.message?.usage?)] |
    sort_by(.timestamp) as $records |
    {
      today: ([$records[] | select((.timestamp // "")[:10] == $today) | (.message.usage.cost.total // 0)] | add // 0),
      week: ([$records[] | select((.timestamp // "") >= $weekAgo) | (.message.usage.cost.total // 0)] | add // 0),
      month: ([$records[] | select((.timestamp // "") >= $monthAgo) | (.message.usage.cost.total // 0)] | add // 0),
      byModel: (
        $records |
        group_by((.message.provider // "unknown") + "/" + (.message.model // "unknown")) |
        map({
          model: ((.[0].message.provider // "unknown") + "/" + (.[0].message.model // "unknown")),
          cost: ([.[].message.usage.cost.total // 0] | add // 0),
          tokensIn: ([.[].message.usage | tokens_in(.)] | add // 0),
          tokensOut: ([.[].message.usage.output // 0] | add // 0),
          cacheRead: ([.[].message.usage.cacheRead // 0] | add // 0),
          cacheWrite: ([.[].message.usage.cacheWrite // 0] | add // 0),
          calls: length,
          avgCost: (if length > 0 then (([.[].message.usage.cost.total // 0] | add // 0) / length) else 0 end)
        }) |
        sort_by(.cost) | reverse
      ),
      activity: (
        $records |
        map(
          select(
            ((.timestamp // "") != "") and
            (((.timestamp | sub("\\.[0-9]+Z$"; "Z") | fromdateiso8601?) // -1) >= (now - (48 * 3600)))
          ) |
          {
            hour: ((.timestamp[0:13]) + ":00Z"),
            model: (.message.model // "unknown"),
            calls: 1,
            tokensIn: (.message.usage | tokens_in(.)),
            tokensOut: (.message.usage.output // 0),
            cost: (.message.usage.cost.total // 0)
          }
        ) |
        group_by(.hour + "|" + .model) |
        map({
          hour: .[0].hour,
          model: .[0].model,
          calls: ([.[].calls] | add // 0),
          tokensIn: ([.[].tokensIn] | add // 0),
          tokensOut: ([.[].tokensOut] | add // 0),
          cost: ([.[].cost] | add // 0)
        }) |
        sort_by(.hour, .model) | reverse
      )
    } |
    .today = (.today | round2) |
    .week = (.week | round2) |
    .month = (.month | round2) |
    .byModel = (.byModel | map(.cost = (.cost | round2) | .avgCost = (.avgCost | round2))) |
    .activity = (.activity | map(.cost = (.cost | round2)))
  ')
else
  COSTS_JSON='{"today":0,"week":0,"month":0,"byModel":[],"activity":[]}'
fi

existing_feed='[]'
if [[ -f "$STATE_FILE" ]] && jq empty "$STATE_FILE" 2>/dev/null; then
  ef=$(jq -c '.feed // empty' "$STATE_FILE" 2>/dev/null || true)
  [[ -n "$ef" ]] && existing_feed="$ef"
fi

# ── Build state.json with jq ────────────────────────────────
jq -n \
  --arg ts "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --arg ws "$watson_status" \
  --arg wm "$watson_model" \
  --arg wla "$watson_last_activity" \
  --arg cs "$codex_status" \
  --arg cm "$codex_model" \
  --arg cla "$codex_last_activity" \
  --arg os "$ollama_status" \
  --argjson om "$ollama_models" \
  --argjson costs "$COSTS_JSON" \
  --argjson cfpf "$cf_py_files" \
  --argjson cfpl "$cf_py_lines" \
  --argjson cfsec "$cf_security" \
  --argjson feed "$existing_feed" \
'{
  lastUpdated: $ts,
  agents: {
    watson: {
      status: $ws,
      model: $wm,
      lastActivity: (if $wla == "" then null else $wla end)
    },
    codex: {
      status: $cs,
      model: $cm,
      lastActivity: (if $cla == "" then null else $cla end)
    },
    ollama: {
      status: $os,
      models: $om,
      lastActivity: null
    }
  },
  costs: $costs,
  coachfinder: {
    status: "development",
    completion: 85,
    database: { schools: 4, coaches: 1, targetSchools: 130000 },
    pipeline: {
      scraper: "built", discovery: "built", extractor: "built",
      verifier: "built", hubspot: "built", celeryWorker: "needs-work",
      changeDetection: "built", deduplication: "built", telegram: "built"
    },
    codebase: { pythonFiles: $cfpf, totalLines: $cfpl },
    securityIssues: $cfsec,
    lastScrapeRun: null,
    lastHubSpotSync: null
  },
  feed: $feed
}' > "$STATE_FILE.tmp"

# Validate before replacing
if jq empty "$STATE_FILE.tmp" 2>/dev/null; then
  mv "$STATE_FILE.tmp" "$STATE_FILE"
else
  log "ERROR: Generated invalid JSON, aborting"
  rm -f "$STATE_FILE.tmp"
  exit 1
fi

# ── Git commit & push ────────────────────────────────────────
cd "$REPO_DIR"

if git diff --quiet state.json 2>/dev/null; then
  log "No changes to state.json, skipping commit"
else
  git add state.json
  git commit -m "sync: auto-update state.json [$(date '+%H:%M')]" --no-verify 2>/dev/null
  
  if git push origin main --no-verify 2>/dev/null; then
    log "Pushed state.json update"
  else
    log "WARNING: Push failed (will retry next cycle)"
  fi
fi

# ── Board watch: check for new Watson-directed comments ──────
BOARD_OPS="$REPO_DIR/scripts/board-ops.sh"
INBOX_FILE="$REPO_DIR/scripts/.watson-inbox.json"

if [ -x "$BOARD_OPS" ]; then
  if bash "$BOARD_OPS" inbox > /dev/null 2>&1; then
    INBOX_COUNT=$(jq 'length' "$INBOX_FILE" 2>/dev/null || echo 0)
    if [ "$INBOX_COUNT" -gt 0 ]; then
      log "Board watch: $INBOX_COUNT new comment(s) for Watson"
    fi
  else
    log "Board watch: no new comments"
  fi
fi

log "Sync complete"
