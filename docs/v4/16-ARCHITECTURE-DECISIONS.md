# Command Center v4 — Architecture Decision Record

## Purpose

This document records every major architecture decision for Command Center v4, the reasoning behind each, alternatives considered, a consultant's critical challenge, and the final verdict. It also maps each decision to how it will be tested and verified per our Testing Plan (08-TESTING-PLAN.md) and Verification Framework (09-VERIFICATION.md).

**Date**: 2026-02-12
**Participants**: Paul Sanford (product owner), Watson (architect)
**Method**: Independent consultant review + collaborative decision

---

## Decision Framework

For each decision:
1. **What we chose** — the decision
2. **Why** — the reasoning
3. **Alternatives considered** — what else was on the table
4. **Consultant challenge** — honest critique from a "fresh eyes" perspective
5. **Final verdict** — what we're doing and why
6. **Verification** — how we test that this decision is correct

---

## ADR-001: Cloudflare Workers + D1 (Backend Platform)

### Decision
Use Cloudflare Workers as the API layer and Cloudflare D1 (edge SQLite) as the database.

### Why
- **$0/month** — free tier covers our usage by 100x (100K req/day, 5GB storage, 5M reads/day)
- **Zero cold start** — unlike AWS Lambda, Workers respond instantly
- **Co-located compute and data** — D1 runs at the edge alongside the Worker
- **Managed infrastructure** — no servers to patch, no Docker, no VPS
- **HTTPS + DDoS + CDN** included out of the box
- **`enam` location hint** — puts data in Eastern North America, closest to Paul in Georgia

### Alternatives Considered
| Alternative | Pros | Cons |
|---|---|---|
| Self-hosted VPS (Postgres) | Full control, no vendor lock-in | $5-10/month, ops burden, security patches |
| AWS Lambda + DynamoDB | Mature ecosystem | Cold starts, complex IAM, DynamoDB awkward for relational data |
| Supabase | Built-in auth, realtime, Postgres | Overkill features we'd never use, not free forever |
| Firebase | Easy setup | Data model lock-in, NoSQL limitations |
| Fly.io + SQLite/Litestream | Real filesystem, WebSocket support, no vendor lock-in | $3-5/month, more setup |
| Turso (libSQL) | Distributed SQLite, works from Workers AND anywhere else | Extra dependency, newer service |
| Stay on GitHub Pages + JSON | Already working | No API, no search, no real-time, fragile |

### Consultant Challenge
> "Cloudflare is fine but D1 is the weakest link. It's young — limited SQL support, no `ALTER TABLE DROP COLUMN`, no `RETURNING *` on all queries, 1MB response limit. A $5 Fly.io box with Litestream would give you more power."

### Final Verdict
**Keep Cloudflare Workers + D1 for Phase 1.** The free tier and zero-ops overhead are correct for a single-user system. D1 is the risk factor — if we hit its limitations, **Plan B is Turso on Fly.io** ($3-5/month). The API layer is designed to be database-agnostic: all D1 calls go through model functions, so swapping the database is a 1-day migration, not a rewrite.

### Verification
| Check | Method | Frequency |
|---|---|---|
| D1 responds correctly | `/api/health` endpoint includes `d1: "connected"` | Every heartbeat |
| Query performance | Dashboard load < 200ms | Every deploy |
| D1 limitations hit | Watson logs any SQL failures in activity feed | Continuous |
| Free tier usage | Check Cloudflare dashboard metrics | Weekly |

---

## ADR-002: CRM-Style Object-Association Data Model

### Decision
Use a generic `objects` table with a `type` discriminator and `properties` JSON blob, connected via an `associations` table and tracked via an `activities` table. Inspired by HubSpot's architecture.

### Why
- **Uniform API** — one set of CRUD endpoints handles all entity types
- **Uniform UI components** — cards, detail views, and timelines work for any object type
- **Extensible without migrations** — adding "goals," "documents," or "sprints" is a config change, not a schema change
- **Associations are explicit and typed** — can model any relationship (blocks, subtask_of, assigned_to, etc.)
- **Activity timeline per object** — full audit trail, every action traceable to an actor and timestamp

### Alternatives Considered
| Alternative | Pros | Cons |
|---|---|---|
| Fixed tables per entity (projects, tasks, agents, milestones) | Type-safe columns, real constraints, simpler queries | Every new entity = new table + endpoints + UI components. Rigid. |
| Document store (MongoDB-style) | Flexible nesting | Denormalization hell, updating nested objects is painful |
| Flat JSON files (current v3) | Already working | No relationships, no queries, no audit trail |
| Graph database (Neo4j) | Natural for associations | Overkill, unfamiliar ops, no free edge hosting |

### Consultant Challenge
> "You're building HubSpot's data layer for a system with ~20 objects. Four tables with foreign keys would take 1/5 the code. The generic model loses type safety and makes every query need `WHERE type = ?`."

### Final Verdict
**Keep the object-association model.** It's a bet on growth — if Command Center stays at 20 objects, we overbuilt. If it grows to 200+ objects with complex relationships, we nailed it. Paul's directive: "I don't care how long it takes so long as it's right." The overhead is in implementation time, not runtime cost. Once built, it's no harder to use than a simple model.

**Mitigation**: Strict typed validation per object type (13-VALIDATION-RULES.md) provides the safety that fixed tables would give. The generic table is the storage layer; the validation layer acts like separate schemas.

### Verification
| Check | Method | Frequency |
|---|---|---|
| Type validation works | Attempt to create invalid object (wrong properties for type) → 400 | Per deploy |
| Associations correct | Create association → query from both sides → verify inverse resolution | Per deploy |
| Activity auto-created | Create/update object → verify activity row exists with correct actor | Per deploy |
| No orphan associations | Soft-delete object → verify associations also soft-deleted | Per deploy |
| Performance at scale | Seed 500 objects, measure query time | Phase 2 |

---

## ADR-003: Vanilla JavaScript Frontend (No Framework)

### Decision
Build the frontend as a multi-file vanilla JS SPA with ES modules. No React, no Vue, no Svelte, no build step.

### Why
- **Single-user app, <20 views** — doesn't justify framework overhead
- **Zero build step** — edit a file, refresh the browser, deploy
- **No dependency updates** — no npm security advisories, no breaking changes
- **Full control** — every byte sent to the browser is intentional
- **v3 proved vanilla JS works** (the issue was single-file, not vanilla)

### Alternatives Considered
| Alternative | Pros | Cons |
|---|---|---|
| React | Component model, ecosystem, hiring familiarity | Bundle tooling, node_modules, build step, framework updates |
| Svelte/Preact | Tiny bundle, reactive state | Still needs build step, still a dependency |
| Lit (web components) | Native standard, no build step optional, component lifecycle | 5KB overhead, learning curve |
| HTMX + SSR | Simple, progressive enhancement | Need server-side rendering, less rich interactions |

### Consultant Challenge
> "As the app grows, you'll reinvent a half-broken framework. `renderProjectDetail()` functions are basically React components without the framework. At 15+ views with shared state, you'll want reactive bindings."

### Final Verdict
**Start vanilla. Watch the component count.** If we hit 10+ components with shared state, introduce **Lit** (5KB, web components, no build step required). It's a progressive enhancement, not a rewrite. The decision to avoid a build step is firm — Paul deploys via git push, Watson deploys via commit. No npm, no webpack, no Vite.

### Verification
| Check | Method | Frequency |
|---|---|---|
| No console errors | Browser automation: `window.__errors` or console check | Every deploy |
| All views render | Browser screenshot of each view | Every deploy |
| Mobile works | Resize to 375px viewport, screenshot | Every deploy |
| Dark mode works | Toggle theme, screenshot | Every deploy |
| No framework needed yet | Component count < 10 | Every phase review |

---

## ADR-004: REST API

### Decision
Standard REST API with JSON request/response bodies, resource-based routing, and consistent response envelope.

### Why
- **Universal** — debuggable with `curl`, callable from any language
- **Watson compatibility** — Watson can call it from CLI tools, scripts, or OpenClaw
- **Well-understood patterns** — no learning curve
- **Cloudflare Workers native** — request/response model maps perfectly

### Alternatives Considered
| Alternative | Pros | Cons |
|---|---|---|
| GraphQL | Flexible queries, single endpoint | Schema overhead, resolver complexity, parser needed |
| tRPC | Type-safe end-to-end | Couples frontend to TypeScript, requires build step |
| gRPC | High performance, streaming | Binary protocol, no browser support without proxy |

### Consultant Challenge
> "REST is fine. The only addition worth considering is a WebSocket endpoint for real-time notifications instead of polling."

### Final Verdict
**REST is correct. No debate needed.** WebSocket for real-time push notifications is a Phase 3 enhancement, not a foundation change. For now, Watson polls via heartbeat.

### Verification
| Check | Method | Frequency |
|---|---|---|
| All endpoints respond correctly | Automated CRUD cycle test | Per deploy |
| Response envelope consistent | `{ data, meta, errors }` on all endpoints | Per deploy |
| Error codes correct | Test 400, 401, 404, 409 responses | Per deploy |
| Pagination works | Request with cursor, verify next page | Per deploy |

---

## ADR-005: HTTP-Only Cookies for Paul's Auth

### Decision
Paul's browser session uses an HTTP-only, Secure, SameSite=Strict cookie (`__cc_session`). Watson uses a Bearer token in the `Authorization` header.

### Why
- **XSS can't steal the token** — JavaScript cannot access HTTP-only cookies
- **Browser sends it automatically** — no token management code needed in frontend
- **SameSite=Strict prevents CSRF** without extra tokens
- **This is the actual security best practice** for browser auth

### Alternatives Considered
| Alternative | Pros | Cons |
|---|---|---|
| localStorage Bearer token | Simple, stateless | XSS can steal it, requires manual header injection |
| JWT in cookie | Stateless verification | JWTs are complex, can't easily revoke, still need cookie |
| Simple shared secret | Minimal code | In client JS source = visible to anyone viewing source |

### Consultant Challenge
> "Your frontend is a static SPA you wrote yourself with zero third-party JavaScript. Who's injecting the XSS? You? A single shared secret Bearer token would work fine."

### Final Verdict
**Keep HTTP-only cookies for Paul, Bearer token for Watson.** The consultant is right that XSS risk is low today, but this is a security foundation decision. If we ever add third-party scripts (analytics, error tracking) or if someone finds a stored XSS in activity text, the cookie model protects us. The implementation cost difference is trivial.

**MVP Simplification (ERRATA.md)**: Phase 1 (frontend prototype) uses mock data — no auth at all. Phase 2 implements Bearer for Watson + simple server-set cookie for Paul. No setup codes or rotation for MVP.

### Verification
| Check | Method | Frequency |
|---|---|---|
| Cookie is HttpOnly | Inspect Set-Cookie header in browser dev tools | Phase 2 deploy |
| Cookie is Secure | Verify HTTPS-only flag | Phase 2 deploy |
| Cookie is SameSite=Strict | Inspect header | Phase 2 deploy |
| Unauthenticated requests rejected | Call API without cookie → 401 | Per deploy |
| XSS can't read cookie | `document.cookie` in console → no `__cc_session` | Phase 2 deploy |

---

## ADR-006: ULID for Object IDs

### Decision
All object IDs use ULID (Universally Unique Lexicographically Sortable Identifier).

### Why
- **Sortable by creation time** — unlike UUIDv4, you can sort by ID to get chronological order
- **Globally unique without coordination** — Paul and Watson both create objects without collisions
- **Compact** — 26 characters (vs 36 for UUID with dashes)
- **Encodes timestamp** — useful for debugging and cursor-based pagination

### Alternatives Considered
| Alternative | Pros | Cons |
|---|---|---|
| Auto-increment integer | Simple, short, human-memorable | Requires single authority (database), no offline creation |
| UUIDv7 | Also time-sortable, more widely supported | Longer (36 chars), functionally equivalent |
| NanoID | Shorter, customizable | Not sortable |

### Final Verdict
**ULID is correct.** UUIDv7 would also work. The choice is locked in and there's no reason to change.

### Verification
| Check | Method | Frequency |
|---|---|---|
| IDs are valid ULIDs | Regex validation on all created objects | Per deploy |
| IDs sort chronologically | Create 3 objects, verify ID order matches creation order | Phase 2 |
| No collisions | Create objects from two actors simultaneously, verify uniqueness | Phase 2 |

---

## ADR-007: Soft Deletes Everywhere

### Decision
All deletions are soft deletes (`deleted_at` timestamp). No hard deletes in the application layer. Activities are never deleted.

### Why
- **Recoverable** — undo is built in
- **Audit trail integrity** — activities reference objects that shouldn't vanish
- **Associations survive** — soft-delete cascades to associations, restore brings them back
- **No data loss** — worst case is "too much data," never "missing data"

### Alternatives Considered
| Alternative | Pros | Cons |
|---|---|---|
| Hard delete | Clean tables, simple queries | No undo, breaks activity references |
| Hard delete + archive table | Clean main table | Complicates restore, two tables to query |
| Event sourcing | Full history by design | Massively complex to implement and query |

### Final Verdict
**Soft delete is correct for our scale.** The `WHERE deleted_at IS NULL` tax on every query is negligible for a few hundred rows. Activities are the permanent audit trail and are never deleted.

### Verification
| Check | Method | Frequency |
|---|---|---|
| Delete sets deleted_at | Delete object → query with `includeDeleted=true` → verify timestamp | Per deploy |
| Default queries exclude deleted | Delete object → list → verify not present | Per deploy |
| Associations cascade | Delete object → verify associations have `deleted_at` set | Per deploy |
| Restore works | Clear `deleted_at` → verify object and associations return | Per deploy |
| Activities survive deletion | Delete object → verify activities still queryable | Per deploy |

---

## ADR-008: Canonical Single-Row Association Storage

### Decision
Each association is stored as one physical row with a canonical direction. Inverse labels are derived at query time, not stored.

### Why
- **No data drift** — `Project → Task` and `Task → Project` can't disagree because there's only one row
- **Half the writes** — one INSERT per relationship, not two
- **Simpler transactions** — no need to atomically create two rows

### Alternatives Considered
| Alternative | Pros | Cons |
|---|---|---|
| Dual-row (store both directions) | Simpler reads — always query from_id | Double writes, risk of data drift, more storage |

### Consultant Challenge
> "The canonical direction is slightly cleverer than it needs to be. Dual-row storage would be simpler to implement and query, and at our scale the waste is literally 50 extra rows."

### Final Verdict
**Keep canonical single-row.** It's already specced and the inverse resolution logic is straightforward. The consistency guarantee matters more than the minor query simplification of dual-row. This decision is resolved in ERRATA.md as the authoritative approach — all docs now align.

### Verification
| Check | Method | Frequency |
|---|---|---|
| Only one row per relationship | Create association → count rows with same object pair → exactly 1 | Per deploy |
| Inverse resolution works | Query associations from `to_id` → verify correct inverse label returned | Per deploy |
| UNIQUE constraint enforced | Attempt duplicate association → 409 Conflict | Per deploy |

---

## ADR-009: Activity Timeline as Audit Trail (Not Communication Channel)

### Decision
The activity timeline on each object is a system-generated audit trail. No user-facing comment input UI in the MVP. Paul communicates with Watson via Telegram.

### Why
- **Telegram already works** — Paul monitors everything from mobile, Watson receives messages instantly
- **Two communication channels = confusion** — Paul shouldn't need to check both Telegram and in-app comments
- **Audit trail is the real value** — "who changed what, when, and why" is more important than chat
- **Simpler MVP** — no rich text input, no markdown rendering, no notification system for comments

### Consultant Challenge
> "If Paul comments on a task in the app, does Watson even see it in real-time? You'd need polling or WebSockets. Telegram is already real-time. Building a second communication channel that you're recommending the user doesn't use is waste."

### Final Verdict
**Activity timeline = audit trail only for MVP.** System-generated events (status changes, assignments, creation, updates) are logged automatically. No comment input UI. Paul talks to Watson via Telegram. Watson logs important decisions to the timeline programmatically. Comment support can be added in Phase 3 if there's a demonstrated need.

### Verification
| Check | Method | Frequency |
|---|---|---|
| Activities auto-created on status change | Change task status → verify activity exists | Per deploy |
| Activities auto-created on creation | Create object → verify "created" activity | Per deploy |
| No comment input UI exists | Screenshot task detail → verify no text input | Phase 1 QA |
| Activity feed shows correct actor | Verify watson/codex/system attribution | Per deploy |

---

## ADR-010: TypeScript Backend, Vanilla JS Frontend

### Decision
The Cloudflare Worker API is written in TypeScript. The frontend is vanilla JavaScript with no build step.

### Why
- **Backend TS**: Type-safe D1 queries, API contracts, validation logic — where bugs are expensive and hard to find
- **Frontend vanilla JS**: No build step, zero tooling, instant deploy via git push
- **Cloudflare Workers tooling is TS-native**: `wrangler types` generates D1 binding types automatically

### Alternatives Considered
| Alternative | Pros | Cons |
|---|---|---|
| TypeScript everywhere | Shared types, no contract drift | Requires build step for frontend |
| JavaScript everywhere | Consistent, no build step | Lose type safety on backend D1 queries |

### Final Verdict
**This split is pragmatic and correct.** Backend gets type safety where it matters most. Frontend stays zero-build-step. No shared types between frontend and backend — the API contract (03-API-SPEC.md) is the type boundary.

### Verification
| Check | Method | Frequency |
|---|---|---|
| Backend compiles | `wrangler deploy --dry-run` | Per deploy |
| Frontend has no build step | Files served directly, no transpilation | Continuous |
| API contract matches frontend expectations | Frontend mock data matches API response shape | Phase 3 integration |

---

## ADR-011: MVP Simplifications (Post-Consultant Review)

### Decision
The following features are deferred from MVP to reduce implementation time without sacrificing architecture:

| Feature | MVP Approach | Full Approach (Later) |
|---|---|---|
| Auth for Paul | Simple server-set cookie, no ceremony | Setup codes, rotation, sliding window (12-AUTH-SPEC.md) |
| Comment UI | No comment input in UI | Rich text comment box on object detail |
| Drag-and-drop board | Visual-only Kanban columns | Full drag-and-drop with status update |
| Search | Client-side filter on loaded data | Server-side full-text search across objects + activities |
| Offline mode | No offline support | Service worker cache + mutation queue |
| Real-time updates | Watson polls via heartbeat | WebSocket push notifications |
| Token rotation | Not in UI | Settings page with rotate button |

### Why
The consultant's core advice: "Stop speccing, start building. Ship something Paul can see on his phone." These deferrals let us get a working prototype live faster without compromising the underlying architecture. Every deferred feature has a clear path to implementation because the architecture supports it.

### Verification
| Check | Method | Frequency |
|---|---|---|
| Deferred features don't block usage | Paul can view dashboard, projects, board on mobile | Phase 1 QA |
| Architecture supports future features | Review spec docs for each deferred feature | Per phase |

---

## Verification Integration

### Per the Testing Plan (08-TESTING-PLAN.md):

**Level 1 (Automated, pre-commit):**
- `node --check` on all JS files
- CSS custom property validation (no hardcoded values)
- HTML structure check
- Secret scan (grep for API keys/tokens)

**Level 2 (Watson QA, pre-deploy):**
- Browser automation: open each view, screenshot, verify against spec
- Mobile viewport (375px): screenshot and verify
- Dark mode: toggle and screenshot
- Console error check: `browser evaluate`
- Every feature tested against its ADR verification table above

**Level 3 (Integration, post-deploy):**
- Live URL loads correctly
- All routes navigate correctly
- Mock data renders accurately
- Theme persists across navigation

### Per the Verification Framework (09-VERIFICATION.md):

**Before any commit:**
1. Code written (by Codex) → Watson reviews
2. Syntax check passes
3. Watson browser-tests the change
4. Screenshot captured as evidence
5. Commit only after verification passes

**Before any deploy:**
1. All commits verified individually
2. Full dashboard screenshot
3. Mobile viewport screenshot
4. Dark mode screenshot
5. Console error check
6. Push to production
7. Post-deploy screenshot of live site

**Definition of Done** (from 09-VERIFICATION.md):
- ✅ Code passes syntax checks
- ✅ Watson has browser-tested and captured screenshots
- ✅ Works on desktop, mobile, light mode, and dark mode
- ✅ Handles empty states and error states
- ✅ Matches design spec
- ✅ No console errors
- ✅ Deployed to production
- ✅ Live site verified post-deploy
- ✅ Watson would bet his reputation that Paul won't find a bug

---

## Document Index

This ADR references and is governed by:
- **02-DATA-MODEL.md** — Object, association, activity table definitions
- **03-API-SPEC.md** — API endpoint contracts
- **04-DESIGN-SYSTEM.md** — CSS tokens and visual specifications
- **08-TESTING-PLAN.md** — Testing levels and scenarios
- **09-VERIFICATION.md** — QA protocol and definition of done
- **12-AUTH-SPEC.md** — Authentication implementation details
- **13-VALIDATION-RULES.md** — Type-specific validation schemas
- **14-INFRASTRUCTURE.md** — Deployment, environments, costs
- **15-SECURITY.md** — Threat model and security controls
- **ERRATA.md** — Contradiction resolutions (auth, sessions, associations, labels)
- **DESIGN-PHILOSOPHY.md** — Jobs/Ive audit protocol
