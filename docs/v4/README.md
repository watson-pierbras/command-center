# Command Center v4 — Complete Specification

## Document Index

| # | Document | Scope | Lines |
|---|----------|-------|-------|
| 00 | [VISION.md](00-VISION.md) | What we're building, why, for whom, success criteria | 86 |
| 01 | [ARCHITECTURE.md](01-ARCHITECTURE.md) | System design: Workers + D1 + Pages, data flow, security model | 182 |
| 02 | [DATA-MODEL.md](02-DATA-MODEL.md) | Database schema: objects, associations, activities, reads tables | 290+ |
| 03 | [API-SPEC.md](03-API-SPEC.md) | Full REST API: endpoints, request/response, pagination, filtering | 460+ |
| 04 | [DESIGN-SYSTEM.md](04-DESIGN-SYSTEM.md) | Visual tokens: colors, typography, spacing, shadows, breakpoints | 255 |
| 05 | [APP-FLOW.md](05-APP-FLOW.md) | Every screen, route, user journey, wireframes, empty states | 323 |
| 06 | [LEGOS.md](06-LEGOS.md) | Component specs: buttons, cards, pills, inputs, all states | 269 |
| 07 | [FRONTEND-GUIDELINES.md](07-FRONTEND-GUIDELINES.md) | Frontend architecture: vanilla JS, file structure, state, routing | 244 |
| 08 | [TESTING-PLAN.md](08-TESTING-PLAN.md) | Test strategy: automated, manual QA, integration, edge cases | 143 |
| 09 | [VERIFICATION.md](09-VERIFICATION.md) | QA framework: protocol, checklists, bug response, definition of done | 151 |
| 10 | [MIGRATION-PLAN.md](10-MIGRATION-PLAN.md) | v3 → v4: data mapping, import process, integrity checks, rollback | 199 |
| 11 | [IMPLEMENTATION-ROADMAP.md](11-IMPLEMENTATION-ROADMAP.md) | 5-phase build plan with estimates and priorities | 195 |
| 12 | [AUTH-SPEC.md](12-AUTH-SPEC.md) | Authentication: tokens, sessions, HTTP-only cookies, setup codes | 130+ |
| 13 | [VALIDATION-RULES.md](13-VALIDATION-RULES.md) | Type schemas, status transitions, association constraints, error codes | 160+ |
| 14 | [INFRASTRUCTURE.md](14-INFRASTRUCTURE.md) | DevOps: project structure, wrangler config, environments, deployment, backups | 200+ |
| 15 | [SECURITY.md](15-SECURITY.md) | Threat model, attack surfaces, mitigations, incident response, checklist | 200+ |
| 16 | [WATSON-INTEGRATION.md](16-WATSON-INTEGRATION.md) | How Watson talks to the API, replaces v3 git workflow, notification flow | 160+ |
| 17 | [ERROR-HANDLING.md](17-ERROR-HANDLING.md) | Error categories, backend/frontend handling, logging, retry strategy | 200+ |
| 18 | [UX-DETAILS.md](18-UX-DETAILS.md) | Responsive behavior, touch targets, keyboard shortcuts, toasts, drag & drop | 230+ |
| 19 | [CODE-STANDARDS.md](19-CODE-STANDARDS.md) | Style guide, git workflow, commit conventions, dependency policy, review process | 200+ |
| 20 | [QUERY-PLANS.md](20-QUERY-PLANS.md) | SQL for critical paths, index strategy, D1 batch patterns, performance budget | 180+ |
| — | [DESIGN-PHILOSOPHY.md](DESIGN-PHILOSOPHY.md) | Jobs/Ive design principles, audit protocol, design system governance | 257 |
| — | [REVIEW.md](REVIEW.md) | Codex architectural review: 14 findings, 5 categories, priority order | 200+ |

## Total Coverage

- **21 documents** covering every layer of the system
- **~5,000+ lines** of specification
- **Zero gaps** in the path from idea to production

## Reading Order

**For understanding the system**: 00 → 01 → 02 → 03 → 05 → 04 → 06

**For building**: 11 (roadmap) → 14 (infrastructure) → 19 (code standards) → 02 (data model) → 03 (API) → 07 (frontend) → 08 (testing)

**For security review**: 15 → 12 → 13 → 17

**For design review**: DESIGN-PHILOSOPHY → 04 → 06 → 18 → 05
