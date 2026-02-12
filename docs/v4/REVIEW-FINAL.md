# Command Center v4 Spec Final Review (Remaining Gaps)

Reviewed all docs in `docs/v4/` with focus on cross-document consistency, implementation blockers, edge cases, technical accuracy, and completeness.

## Overall Verdict

The suite is much stronger than the prior review, but there are still **significant remaining gaps** that can cause implementation drift. Most issues are consistency and contract-definition gaps, not architecture flaws.

## Findings

### 1) Auth model is still contradictory across core docs (blocker)
- `01-ARCHITECTURE.md` defines Paul session auth as a token in `localStorage` (`## API Design > Authentication`, lines 61-64).
- `03-API-SPEC.md` says all requests require `Authorization: Bearer <token>` and says session token is in `localStorage` (`## Authentication`, lines 12-21).
- `07-FRONTEND-GUIDELINES.md` API client always injects Bearer header (`## API Client`, lines 193-199).
- But `12-AUTH-SPEC.md` defines Paul auth as HTTP-only cookie `__cc_session` (`## Paul Session Token`, lines 24-32) and identity resolution by cookie (`## Actor Identity Flow`, lines 174-176).

Why this blocks implementation:
- Frontend request behavior, CORS credentials mode, CSRF posture, and auth middleware behavior differ materially between bearer-token and cookie session models.

### 2) Session persistence schema is referenced but not specified in the data model (blocker)
- `12-AUTH-SPEC.md` requires validating cookie sessions in a D1 `sessions` table (`## Actor Identity Flow`, line 175).
- `15-SECURITY.md` defines expected session table columns (`## Session Security`, line 43).
- `02-DATA-MODEL.md` core tables do not include a `sessions` table (`## Core Tables`).

Why this blocks implementation:
- Auth cannot be implemented deterministically without a canonical DDL contract and indexes for sessions.

### 3) Association storage semantics are inconsistent (blocker)
- `02-DATA-MODEL.md` says canonical single-row storage with inverse labels derived at query time (`## Canonical Direction`, lines 239-254).
- `03-API-SPEC.md` says creating an association auto-creates inverse association rows and deletes remove inverse rows (`## Associations`, lines 275-286).
- `10-MIGRATION-PLAN.md` expects importing paired inverse labels (`## What Gets Migrated`, lines 34-35; `## Data Integrity Checks`, line 171).

Why this blocks implementation:
- DB writes, uniqueness constraints, migration logic, and query behavior are fundamentally different depending on whether inverse rows are stored.

### 4) `has_task` vs `belongs_to` write semantics are unclear (blocker)
- `13-VALIDATION-RULES.md` requires each task to have exactly one `belongs_to -> Project` (`## Task`, lines 62-64).
- `03-API-SPEC.md` object-create example uses `belongs_to` (`## POST /api/objects`, lines 177-179).
- `02-DATA-MODEL.md` canonical stored direction says project-task is stored as `has_task` and `belongs_to` is inverse-derived (`## Canonical Direction`, lines 243-244).
- `20-QUERY-PLANS.md` project-task queries rely on `has_task` rows (`## 1`, line 23; `## 5`, line 135).

Why this blocks implementation:
- It is unclear which label clients may submit and what normalization the API must do before persistence.

### 5) Activity read endpoint contract still drifts across docs (high)
- Current API is `POST /api/activities/:id/read` and `POST /api/activities/read-bulk` (`03-API-SPEC.md`, lines 347-370).
- `01-ARCHITECTURE.md` still describes `PATCH /api/activities/:id {read:true}` (`## Data Flow`, line 142).
- `08-TESTING-PLAN.md` test scenario still uses `PATCH /api/activities/:id {is_read:true}` (`## Test Scenarios`, line 78).

Impact:
- Tests and implementation will diverge unless old PATCH references are removed.

### 6) Authorization matrix conflicts with endpoint-specific rules (high)
- `12-AUTH-SPEC.md` says both actors have full access and marks all POST/PATCH/DELETE as allowed for Paul (`## Authorization Matrix`, lines 136 and 142).
- Same doc says `POST /api/auth/rotate` is Watson-token auth (`## Endpoints`, line 88).
- `03-API-SPEC.md` marks `POST /api/import` as admin-only (`## System`, line 451), while auth matrix allows Paul (`12-AUTH-SPEC.md`, line 145).

Impact:
- Security boundary for privileged operations is ambiguous and can result in over-permissive implementation.

### 7) Response contract is not fully normalized for no-content and system endpoints (medium)
- `03-API-SPEC.md` says every response uses `{ data, meta, errors }` (`## Response Envelope`, line 26).
- Same doc defines several `204 No Content` responses (`DELETE /api/objects/:id`, `POST /api/activities/:id/read`, bulk read) and a non-enveloped `/api/health` response shape (`## System`, lines 432-443).
- `17-ERROR-HANDLING.md` standardizes full envelope for errors (`## Backend Error Response Format`, lines 35-49).

Gap:
- Success-response policy needs explicit rules: which endpoints are envelope exceptions and whether `204` is preferred over `200` envelope for idempotent writes.

### 8) Cursor pagination contract is underspecified/inconsistent with query plans (medium)
- `03-API-SPEC.md` defines cursor as ULID of last item (`## Pagination`, line 63) and allows sorting by `created_at`, `updated_at`, `name` (`GET /api/objects`, lines 83-84).
- `20-QUERY-PLANS.md` object list cursor note suggests `updated_at < ?` (`## 2`, line 78).

Gap:
- Cursor encoding/tie-break rules are not specified per sort mode (especially for duplicate timestamps and `name` sort), risking skipped/duplicated rows.

### 9) Technical accuracy risk: FK behavior assumptions need explicit D1/SQLite setting (medium)
- `02-DATA-MODEL.md` relies on FK relations and app-layer soft-delete policy (`## Soft Deletes`, lines 283-290), but does not specify FK enforcement setting.

Gap:
- SQLite FK constraints are not reliable unless FK enforcement is explicitly enabled in runtime behavior. The spec should explicitly require FK enforcement strategy in Worker/D1 interaction to avoid orphan records.

### 10) Search behavior remains inconsistent between API and UX docs (medium)
- `03-API-SPEC.md` says `q` searches name and description (`GET /api/objects`, line 82).
- `18-UX-DETAILS.md` says search includes object names, descriptions, and activity text (`## Search > Behavior`, line 231).
- `18-UX-DETAILS.md` also says no full search page for MVP (`## No Search Page`, lines 237-239), but behavior section says Enter opens full search results page (line 235).

Impact:
- Frontend and backend will not agree on search scope or UX behavior.

### 11) Settings token UX conflicts with security model (medium)
- `05-APP-FLOW.md` includes “View/rotate Watson token” in Settings (`## 8. Settings`, line 277).
- `15-SECURITY.md` says Watson token is secret material and never in client code/DB (`## Token Storage`, lines 36-38; `## What's NOT Stored in D1`, line 144).

Gap:
- UI should not expose raw Watson token to browser users unless a narrowly defined, one-time privileged flow is explicitly specified.

## Notable SQL / query checks

- Query structures in `20-QUERY-PLANS.md` are generally valid SQLite/D1 SQL.
- The main risk is not syntax but contract mismatch (association label semantics and pagination cursor semantics) which can make otherwise-valid SQL return incorrect application behavior.

## Recommended Priority Fix Order

1. Resolve auth model inconsistency (cookie vs bearer for Paul) and align `01`, `03`, `07`, `12`, `15`.
2. Add canonical `sessions` DDL to `02-DATA-MODEL.md` (+ migration reference in `14/10`).
3. Choose one association persistence model (canonical-only vs stored inverses) and update `02`, `03`, `10`, `13`, `20` accordingly.
4. Normalize privileged endpoint authorization matrix (`/auth/rotate`, `/import`, possibly `/migrate`).
5. Finalize pagination and response-envelope contracts, then update tests (`08`, `09`).
6. Align search scope and MVP UX behavior between `03` and `18`.

