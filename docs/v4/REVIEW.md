# Command Center v4 Spec Review

## 1. STRENGTHS — What Is Well-Designed

- Clear product intent and scope discipline.
  - `00-VISION.md` sharply defines users (Paul + Watson), what this is, and what it is not.
  - This reduces feature creep and keeps architecture decisions grounded.

- Strong architectural direction for v4 vs v3.
  - Moving from static JSON + git sync to Worker + D1 + API is the right foundational shift.
  - Object-association + activities model is a meaningful upgrade over flat Kanban entities.

- Good separation of concerns across docs.
  - Vision, architecture, schema, API, app flow, design system, testing, migration, roadmap are distinct and reasonably coherent.

- Data model is flexible and future-friendly.
  - Generic `objects` table with typed `properties` and explicit `associations` enables new object types without heavy schema churn.
  - ULID choice is strong for distributed creation and timeline-friendly sorting.

- API shape is mostly pragmatic.
  - Consistent endpoint families (objects, associations, activities, dashboard).
  - Cursor pagination, filtering, and aggregate dashboard endpoint are practical for mobile-first UX.

- UI system has strong baseline consistency.
  - Tokens are detailed and semantically named.
  - Component catalog in `06-LEGOS.md` is concrete enough to implement.
  - App flow defines core screens, journeys, and empty states well.

- Testing and verification culture is explicit.
  - `08-TESTING-PLAN.md` and `09-VERIFICATION.md` establish quality expectations clearly.
  - Includes behavioral checks, visual checks, and post-deploy checks.

- Migration is treated as first-class work.
  - `10-MIGRATION-PLAN.md` includes mapping rules, sequence, integrity queries, and rollback.

## 2. GAPS — Missing or Underspecified Areas

- Authentication lifecycle is incomplete.
  - No endpoint contract for token issuance, refresh, revocation, rotation, expiry policy, or token metadata.
  - Session management is mentioned but not specified end-to-end.

- Authorization rules are missing.
  - “Paul vs Watson token” is stated, but per-endpoint permissions and admin operations are not formally defined.

- Validation contract is underspecified.
  - Required fields and enum validation by object type are only partially described.
  - No machine-readable schema for `properties` per type.
  - No explicit rules for invalid status transitions (e.g., `planned -> done` directly).

- Association invariants are not enforceable as written.
  - “Task belongs to exactly one project” and milestone membership rules are not specified as DB constraints or strict API rules.
  - Cardinality constraints and conflict handling are missing.

- Search behavior is vague.
  - `q` exists, but tokenization, fields searched, ranking, case sensitivity, partial matching, and JSON property search semantics are undefined.

- Concurrency/conflict handling is shallow.
  - “Last write wins” is mentioned, but no optimistic concurrency control (`updated_at` precondition, version field, ETag) is specified.

- Activity/read model is incomplete.
  - `is_read` is global on activity rows, but read state is user-specific in practice.
  - No recipient/assignee concept for inbox semantics.

- Offline strategy is aspirational but underspecified.
  - Mutation queue format, retry/backoff policy, idempotency keys, conflict reconciliation, and failure UX are not defined.

- Operational concerns are thin.
  - No backup/restore plan for D1, no retention policy, no migration rollback mechanics at schema/data level beyond “revert integration.”
  - No formal SLOs, alerting thresholds, or incident playbook.

- Frontend implementation details have unresolved decisions.
  - No clear rendering boundary strategy (full rerender vs keyed partial updates).
  - No formal event architecture (custom events/message bus) despite “components emit events.”

- Security hardening details are absent.
  - No CSP, no token storage hardening strategy, no XSS threat model beyond `escapeHtml`.
  - No brute-force/abuse policy beyond rate limits.

- API documentation lacks complete status code matrix.
  - Some endpoints describe behavior but not full success/error codes and error codes list.

## 3. INCONSISTENCIES — Contradictions Between Documents

- Soft delete strategy conflicts with schema and endpoint notes.
  - `02-DATA-MODEL.md`: “Objects are never hard-deleted.”
  - Schema uses `FOREIGN KEY ... ON DELETE CASCADE` for `associations`/`activities`, implying hard-delete behavior if delete occurs.
  - `03-API-SPEC.md` says delete is soft and cascades soft-delete to associations, but `associations` table has no `deleted_at`.

- Assignment direction mismatches.
  - `02-DATA-MODEL.md` Task associations list: `assigned_to -> Agent`.
  - Same doc Agent associations list also says `assigned_to -> Task` (directionally inconsistent; should be inverse label or query convention).

- Route model mismatch between app flow and frontend router.
  - `05-APP-FLOW.md` includes `/tasks/:id`.
  - `07-FRONTEND-GUIDELINES.md` router sample omits `/tasks/:id`.
  - `05` says task detail is usually slide-over (not page) while still defining a full route.

- Response envelope consistency vs endpoint behavior.
  - `03-API-SPEC.md` says every response uses `{ data, meta, errors }`.
  - Same doc defines `204 No Content` on deletes, which has no envelope.
  - Error format example shows only `{ errors: [...] }` without `data/meta`.

- API surface mismatch between architecture summary and full spec.
  - `01-ARCHITECTURE.md` endpoint summary includes `POST /api/migrate`.
  - `03-API-SPEC.md` adds `POST /api/import` and `PATCH /api/activities/:id`, not in architecture summary.

- “No sensitive data in D1” vs settings/token UX.
  - `01-ARCHITECTURE.md` says no credentials/API keys in D1.
  - `05-APP-FLOW.md` Settings includes token viewing/rotation UX, but storage location and security model are unspecified and potentially contradictory.

- Testing references do not fully match chosen architecture.
  - `08-TESTING-PLAN.md` includes JSON syntax checks for data files despite v4 being API + DB-driven.

- Design-system rules conflict with component breadth.
  - `04-DESIGN-SYSTEM.md`: “Maximum 3 font sizes per screen.”
  - `05` + `06` imply many heterogeneous elements on complex screens (dashboard/project detail) likely requiring >3 sizes.

## 4. TECHNICAL CONCERNS — Feasibility Risks, Anti-Patterns, Scalability Traps

- LocalStorage bearer tokens are high-risk for XSS.
  - Any script injection compromises full API access.
  - For a system with admin-level mutations, this is a material risk even for single-user usage.

- JSON blob overuse may create query/perf and integrity issues.
  - Heavy reliance on `properties` JSON without indexed generated columns makes filtering/sorting harder and less predictable.
  - Search and aggregation over JSON fields in SQLite can become fragile.

- Inverse association auto-creation can produce data drift.
  - Without strict transactional logic and canonical direction rules, duplicate/inconsistent inverse edges are likely.
  - Bidirectional edges also double write load and complicate dedupe.

- Read/unread inbox model is likely incorrect for multi-actor activity.
  - `is_read` on activity row cannot represent per-user read state.
  - Watson polling `actor=paul&unread=true` is semantically fragile and easy to break.

- Offline mutation queue + last-write-wins can silently lose intent.
  - No idempotency keys or conflict strategy means retries or concurrent updates may create duplicate activities or overwrite newer data.

- “No build step” with modular multi-file app can become maintenance bottleneck.
  - Manual module loading and lack of lint/type tooling can slow reliability over time.
  - Not fatal, but likely underestimates implementation and QA effort.

- Performance targets may be optimistic without query/index plan.
  - `<200ms dashboard API` and `<300ms list` are achievable but need concrete SQL plans and indexes (especially with activity joins and filters).

- Import/migration trust boundary is weak.
  - `POST /api/import` accepting large raw payloads needs strict auth, size limits, validation, idempotence, and one-time execution controls.

- Assumed “single-user” may drift into multi-actor reality.
  - Spec includes Paul/Watson/Codex/system actors; collaboration-like behavior exists.
  - Certain “single-user simplifications” (auth/read-state/conflict model) may fail early.

## 5. RECOMMENDATIONS — Specific Improvements With Rationale

1. Define a normative contract doc for auth + authorization.
   - Add token types, TTL/expiry, rotation flow, revocation, storage model, and endpoint permissions matrix.
   - Rationale: removes security ambiguity and prevents inconsistent implementation.

2. Resolve delete model explicitly and update schema.
   - Choose one:
     - A) True soft-delete everywhere (add `deleted_at` to `associations`/possibly `activities`, remove hard delete assumptions), or
     - B) Soft-delete objects + hard-delete associations/activities with clear policy.
   - Rationale: current model is internally contradictory and can corrupt expected behavior.

3. Normalize association semantics.
   - Define canonical stored direction per label and whether inverse rows are physically stored or derived at query time.
   - Enforce uniqueness on canonical edge, and generate inverse views in API response if needed.
   - Rationale: avoids drift, double writes, and label confusion.

4. Enforce type-specific schemas and lifecycle rules at API boundary.
   - Add JSON Schema (or equivalent) for each object type’s `properties`.
   - Define required fields, allowed enums, and legal status transitions.
   - Rationale: protects data integrity and simplifies frontend assumptions.

5. Redesign activity read model to be per-user.
   - Replace `activities.is_read` with an `activity_reads(activity_id, actor, read_at)` table or inbox table.
   - Rationale: correct semantics for “Watson unread” without mutating shared activity truth.

6. Add optimistic concurrency control.
   - Require `If-Unmodified-Since`/`updated_at` or version number on PATCH/DELETE.
   - Return `409` on conflict with current server state.
   - Rationale: prevents silent clobber during concurrent edits and retry scenarios.

7. Specify offline sync protocol before implementation.
   - Define queued mutation envelope (idempotency key, timestamp, actor, retry count), replay order, and merge/conflict UX.
   - Rationale: avoids shipping unreliable offline behavior that is expensive to retrofit.

8. Harden client security baseline.
   - Prefer HTTP-only secure cookies for browser sessions where possible.
   - Add CSP, strict input sanitization policy, and explicit XSS/CSRF mitigations.
   - Rationale: mitigates highest-impact threat path.

9. Add missing API definitions and make examples executable.
   - Include endpoint for session/token issuance/rotation.
   - Add full status/error code matrix per endpoint.
   - Make response envelope policy consistent (including error and 204 conventions).
   - Rationale: reduces integration churn and test ambiguity.

10. Add query/index plan for critical endpoints.
    - For `/api/dashboard`, `/api/activities`, `/api/objects?q=...`, define SQL patterns and supporting indexes.
    - Rationale: ensures target latency is realistic, not aspirational.

11. Update router/app-flow alignment.
    - Decide canonical task detail behavior: route-backed panel (`/tasks/:id`) or purely contextual overlay.
    - Reflect decision consistently in `05` and `07`.
    - Rationale: avoids navigation/state bugs and implementation rework.

12. Tighten migration safety.
    - Add import idempotence rules, dry-run mode, checksums, size limits, and explicit “already migrated” guards.
    - Add post-migration reconciliation report format.
    - Rationale: prevents duplicate imports and hard-to-debug data discrepancies.

13. Re-baseline roadmap estimates.
    - Increase estimates for backend correctness (validation, auth, migration hardening, test harness) and integration QA.
    - Rationale: current schedule appears optimistic relative to specified breadth and quality bar.

14. Convert critical spec rules to testable acceptance criteria.
    - For each core invariant (e.g., “task has exactly one project”), define automated API tests and verification steps.
    - Rationale: ensures spec intent survives implementation.

## Suggested Priority Order

- **P0 before build starts**: auth/authorization spec, delete model resolution, association semantics, validation schemas, read-state redesign.
- **P1 before backend completion**: concurrency model, API consistency/status matrix, query/index plan, migration hardening.
- **P2 before production**: offline sync protocol, security hardening, roadmap/time re-estimation, expanded automated regression suite.

