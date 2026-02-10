#!/usr/bin/env bash
# board-ops.sh — Watson's board.json operations toolkit
# Usage:
#   board-ops.sh list-comments [--new-only]   List all or unprocessed comments
#   board-ops.sh add-comment TASK_ID TEXT      Add Watson comment to a task
#   board-ops.sh move-card TASK_ID COLUMN      Move card to column (planned|active|done)
#   board-ops.sh update-notes TASK_ID TEXT     Replace task notes
#   board-ops.sh mark-processed ID [ID...]     Mark comment IDs as processed
#   board-ops.sh inbox                         Show new Watson-directed comments

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BOARD="$REPO_DIR/board.json"
STATE_FILE="$REPO_DIR/scripts/.board-watch-state.json"
INBOX_FILE="$REPO_DIR/scripts/.watson-inbox.json"

# Ensure state file exists
if [ ! -f "$STATE_FILE" ]; then
  echo '{"processedCommentIds":[]}' > "$STATE_FILE"
fi

now_iso() {
  date -u +"%Y-%m-%dT%H:%M:%S.000Z"
}

cmd="${1:-help}"
shift || true

case "$cmd" in
  list-comments)
    NEW_ONLY=false
    [ "${1:-}" = "--new-only" ] && NEW_ONLY=true
    
    if $NEW_ONLY; then
      PROCESSED=$(cat "$STATE_FILE")
      jq -r --argjson state "$PROCESSED" '
        .tasks[] | 
        select(.comments != null and (.comments | length) > 0) |
        .id as $tid | .title as $ttitle |
        .comments[] |
        select(.author != "watson") |
        select(.id as $cid | ($state.processedCommentIds | index($cid)) == null) |
        "[\($tid)] \($ttitle) | \(.author) (\(.timestamp)): \(.text)"
      ' "$BOARD"
    else
      jq -r '
        .tasks[] | 
        select(.comments != null and (.comments | length) > 0) |
        .id as $tid | .title as $ttitle |
        .comments[] |
        "[\($tid)] \($ttitle) | \(.author) (\(.timestamp)): \(.text)"
      ' "$BOARD"
    fi
    ;;

  add-comment)
    TASK_ID="$1"
    TEXT="$2"
    COMMENT_ID="wc-$(date +%s)-$(( RANDOM % 9999 ))"
    NOW=$(now_iso)
    
    jq --arg tid "$TASK_ID" \
       --arg cid "$COMMENT_ID" \
       --arg text "$TEXT" \
       --arg now "$NOW" '
      .lastModified = $now |
      .modifiedBy = "watson" |
      (.tasks[] | select(.id == $tid)).comments += [{
        "id": $cid,
        "author": "watson",
        "authorLabel": "🔍 Watson",
        "text": $text,
        "timestamp": $now
      }] |
      (.tasks[] | select(.id == $tid)).history += [{
        "action": "edited",
        "field": "comments",
        "by": "watson",
        "at": $now
      }]
    ' "$BOARD" > "${BOARD}.tmp" && mv "${BOARD}.tmp" "$BOARD"
    
    echo "Comment added to task $TASK_ID (comment: $COMMENT_ID)"
    ;;

  move-card)
    TASK_ID="$1"
    NEW_COLUMN="$2"
    NOW=$(now_iso)
    
    # Validate column
    case "$NEW_COLUMN" in
      planned|active|done) ;;
      *) echo "Invalid column: $NEW_COLUMN (use planned|active|done)" >&2; exit 1 ;;
    esac
    
    OLD_COLUMN=$(jq -r --arg tid "$TASK_ID" '.tasks[] | select(.id == $tid) | .column' "$BOARD")
    
    if [ "$OLD_COLUMN" = "$NEW_COLUMN" ]; then
      echo "Card already in $NEW_COLUMN"
      exit 0
    fi
    
    COMPLETED_AT="null"
    [ "$NEW_COLUMN" = "done" ] && COMPLETED_AT="\"$NOW\""
    
    jq --arg tid "$TASK_ID" \
       --arg col "$NEW_COLUMN" \
       --arg old "$OLD_COLUMN" \
       --arg now "$NOW" \
       --argjson completed "$COMPLETED_AT" '
      .lastModified = $now |
      .modifiedBy = "watson" |
      (.tasks[] | select(.id == $tid)).column = $col |
      (.tasks[] | select(.id == $tid)).completedAt = $completed |
      (.tasks[] | select(.id == $tid)).history += [{
        "action": "moved",
        "from": $old,
        "to": $col,
        "by": "watson",
        "at": $now
      }]
    ' "$BOARD" > "${BOARD}.tmp" && mv "${BOARD}.tmp" "$BOARD"
    
    echo "Moved task $TASK_ID: $OLD_COLUMN → $NEW_COLUMN"
    ;;

  update-notes)
    TASK_ID="$1"
    TEXT="$2"
    NOW=$(now_iso)
    
    jq --arg tid "$TASK_ID" \
       --arg notes "$TEXT" \
       --arg now "$NOW" '
      .lastModified = $now |
      .modifiedBy = "watson" |
      (.tasks[] | select(.id == $tid)).notes = $notes |
      (.tasks[] | select(.id == $tid)).history += [{
        "action": "edited",
        "field": "notes",
        "by": "watson",
        "at": $now
      }]
    ' "$BOARD" > "${BOARD}.tmp" && mv "${BOARD}.tmp" "$BOARD"
    
    echo "Updated notes for task $TASK_ID"
    ;;

  mark-processed)
    for CID in "$@"; do
      jq --arg cid "$CID" '.processedCommentIds += [$cid] | .processedCommentIds |= unique' \
        "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"
    done
    echo "Marked $# comment(s) as processed"
    ;;

  inbox)
    # Check for new Watson-directed comments and write to inbox
    PROCESSED=$(cat "$STATE_FILE")
    RESULT=$(jq -c --argjson state "$PROCESSED" '[
      .tasks[] | 
      select(.comments != null and (.comments | length) > 0) |
      .id as $tid | .title as $ttitle |
      .comments[] |
      select(.author != "watson") |
      select(.id as $cid | ($state.processedCommentIds | index($cid)) == null) |
      { taskId: $tid, taskTitle: $ttitle, commentId: .id, author: .author, text: .text, timestamp: .timestamp }
    ]' "$BOARD")
    
    COUNT=$(echo "$RESULT" | jq 'length')
    
    if [ "$COUNT" -gt 0 ]; then
      echo "$RESULT" > "$INBOX_FILE"
      echo "$COUNT new comment(s) for Watson"
      echo "$RESULT" | jq -r '.[] | "  [\(.taskTitle)] \(.author): \(.text)"'
      exit 0
    else
      # Clear inbox if empty
      echo '[]' > "$INBOX_FILE"
      echo "No new comments"
      exit 1
    fi
    ;;

  help|*)
    echo "Usage: board-ops.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  list-comments [--new-only]   List all or unprocessed comments"
    echo "  add-comment TASK_ID TEXT      Add Watson comment to a task"
    echo "  move-card TASK_ID COLUMN      Move card (planned|active|done)"
    echo "  update-notes TASK_ID TEXT     Replace task notes"
    echo "  mark-processed ID [ID...]     Mark comment IDs as processed"
    echo "  inbox                         Check for new Watson-directed comments"
    ;;
esac
