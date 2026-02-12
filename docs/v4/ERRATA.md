# ERRATA — Resolving Spec Contradictions

This document resolves the 4 blocking inconsistencies found in REVIEW-FINAL.md.
**This file is the source of truth where it contradicts earlier docs.**

## 1. Auth Model — RESOLVED

**Decision:** HTTP-only cookie for Paul, Bearer token for Watson.
- `12-AUTH-SPEC.md` is canonical. 
- `01-ARCHITECTURE.md` lines 61-64 (localStorage), `03-API-SPEC.md` lines 12-21 (localStorage/Bearer for Paul), and `07-FRONTEND-GUIDELINES.md` lines 193-199 (Bearer injection) are WRONG.
- **MVP simplification:** Phase 1 (frontend prototype) uses mock data — no auth. Phase 2 (backend) implements Bearer token for Watson + simple server-set cookie for Paul. No setup codes, no rotation endpoints, no sliding window for MVP. Those are Phase 3 hardening.

## 2. Sessions Table — RESOLVED

**Decision:** Add `sessions` table to data model. Canonical DDL:

```sql
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,           -- Random 64-char hex
  actor       TEXT NOT NULL DEFAULT 'paul',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL,
  last_used   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

This belongs in `02-DATA-MODEL.md` under Core Tables, after `settings`.

## 3. Association Storage — RESOLVED

**Decision:** Canonical single-row. One physical row per relationship. No inverse rows stored.
- `02-DATA-MODEL.md` is canonical.
- `03-API-SPEC.md` references to "auto-creates inverse association rows" are WRONG. The API stores one row and resolves inverses at query time.
- `10-MIGRATION-PLAN.md` should import one canonical row per relationship, not paired rows.

## 4. Label Normalization — RESOLVED

**Decision:** 
- Clients MUST submit the **canonical** label (see Canonical Direction table in `02-DATA-MODEL.md`).
- If a client submits an inverse label (e.g., `belongs_to` instead of `has_task`), the API returns `400 Bad Request` with a message indicating the canonical label to use.
- This keeps the API simple and explicit. No silent normalization.

## 5. Additional Simplifications (Consultant Review)

- **Activity timeline = audit trail only for MVP.** No comment input UI in v4 MVP. Paul communicates via Telegram. The activity timeline shows system-generated events (status changes, assignments, creation). Comment support is Phase 3.
- **Auth MVP = simple Bearer token for Watson + server-set cookie for Paul.** No setup codes, no token rotation UI, no sliding window. Add later.
- **No more spec documents.** The code is the spec now.
