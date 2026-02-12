# Command Center v4 — Code Standards & Process

## Code Style

### Backend (TypeScript)

- **Formatting**: 2-space indent, single quotes, semicolons, trailing commas
- **Naming**: camelCase for variables/functions, PascalCase for types/classes, UPPER_SNAKE for constants
- **Files**: kebab-case (`object-handlers.ts`, `rate-limit.ts`)
- **Functions**: Async functions use explicit return types
- **Exports**: Named exports only (no default exports)
- **Comments**: JSDoc for public functions. Inline comments for non-obvious logic only.
- **Max line length**: 100 characters (soft limit)

```typescript
// ✅ Good
export async function createObject(
  db: D1Database,
  input: CreateObjectInput,
  actor: string,
): Promise<DbObject> {
  const id = generateUlid();
  // ...
}

// ❌ Bad
export default async function(db, input, actor) { /* ... */ }
```

### Frontend (JavaScript)

- **Formatting**: Same as backend (2-space, single quotes, semicolons)
- **Naming**: Same conventions
- **Files**: kebab-case
- **Modules**: ES modules (`import`/`export`) loaded via `<script type="module">`
- **DOM**: Always use `escapeHtml()` for user-generated content
- **Events**: Use `addEventListener`, never inline `onclick` attributes
- **Selectors**: Prefer `data-` attributes for JS hooks, classes for styling

```javascript
// ✅ Good — separation of styling and behavior
<button class="btn-primary" data-action="create-task">New Task</button>
document.querySelector('[data-action="create-task"]').addEventListener('click', ...);

// ❌ Bad — styling classes used for JS, inline handler
<button class="btn-primary" onclick="createTask()">New Task</button>
```

### CSS

- **Methodology**: BEM-inspired (Block__Element--Modifier)
- **Custom properties**: All values reference design tokens. No hardcoded colors/spacing.
- **Selectors**: Max specificity 0-2-0 (class + modifier). No IDs, no `!important`.
- **Order**: Properties sorted logically (position → box model → typography → visual → misc)
- **Mobile-first**: Base styles are mobile. Enhance with `@media (min-width:)`.

```css
/* ✅ Good */
.project-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  transition: box-shadow var(--transition-fast);
}

.project-card:hover {
  box-shadow: var(--shadow-md);
}

.project-card__name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

/* ❌ Bad — hardcoded values, high specificity */
#project-card .name {
  font-size: 18px !important;
  color: #111;
}
```

## Git Workflow

### Branch Strategy (Simple)

```
main ← production (deployed automatically or manually)
  └── feature/<name> ← feature work
  └── fix/<name> ← bug fixes
```

No staging branch. Staging environment deploys from `main` with `--env staging`.

### Commit Messages

Format: `<type>: <description>`

Types:
| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | CSS/formatting (no logic change) |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Test additions/changes |
| `chore` | Build, config, dependency updates |

Examples:
```
feat: add project detail view with tabs
fix: prevent cycle in task dependencies
docs: add security model specification
style: align KPI cards to grid
refactor: extract validation into schemas module
test: add CRUD tests for objects endpoint
chore: update wrangler to v3.x
```

### Commit Rules
1. Each commit is a single logical change
2. Commit message describes the **what**, not the **how**
3. No WIP commits on main
4. All commits pass pre-commit checks (syntax, validation)

## Code Review Process

Since Watson is both architect and QA gate:

### Codex Output Review
1. Codex completes task
2. Watson reads the code changes (`git diff`)
3. Watson checks against:
   - Does it match the spec?
   - Does it follow code standards?
   - Are there security issues (unescaped HTML, raw SQL)?
   - Are design tokens used (no hardcoded values)?
   - Is error handling present?
4. Watson browser-tests the result
5. Only then: commit and push

### Self-Review Checklist
Before any commit:
- [ ] Code follows style guide
- [ ] All CSS values use design tokens
- [ ] All dynamic content is escaped
- [ ] All SQL uses prepared statements
- [ ] Error handling is present for all API calls
- [ ] No `console.log` debug statements left
- [ ] No TODO comments (either fix it or file a task)
- [ ] Responsive: tested at mobile, tablet, desktop
- [ ] Dark mode: tested (if UI change)
- [ ] Accessibility: keyboard navigable, ARIA labels present

## Dependency Policy

### Backend
- **Target**: <5 runtime dependencies
- **Required**: None (Cloudflare Workers runtime provides everything)
- **Allowed**: ULID library (if not implementing from scratch)
- **Forbidden**: Express, ORMs, heavy middleware frameworks
- **Dev deps**: Wrangler, TypeScript, Vitest (for testing)

### Frontend
- **Target**: 0 runtime dependencies
- **Required**: None
- **Allowed**: Inter font (CDN or self-hosted)
- **Forbidden**: React, Vue, Angular, jQuery, lodash, moment, any framework
- **Rationale**: Zero dependencies = zero supply chain risk, zero bundle bloat

### Adding a Dependency
Before adding any dependency:
1. Can we implement it in <50 lines? If yes, do that instead.
2. Is it maintained? Check last commit date, open issues, download count.
3. What's the bundle impact? Run `npx bundlephobia <package>`.
4. Are there known vulnerabilities? Run `npm audit`.
5. Document the decision in a commit message.

## File Organization Rules

1. **One concern per file** — a file should do one thing
2. **Max 300 lines per file** — if it's longer, split it
3. **Flat structure preferred** — avoid deep nesting (`components/cards/project/header.js` is too deep)
4. **Co-locate tests** — `test/objects.test.ts` tests `src/handlers/objects.ts`
5. **Index files for exports** — avoid if possible (prefer direct imports)

## Documentation in Code

### Required JSDoc
- All exported functions (parameters, return type, description)
- Complex algorithms (cycle detection, pagination)
- Non-obvious business rules

### Not Required
- Self-explanatory functions (`escapeHtml`, `formatDate`)
- Private/internal helpers
- CSS (design system docs cover the tokens)

### Example
```typescript
/**
 * Create a new object in D1 with optional associations.
 *
 * @param db - D1 database binding
 * @param input - Validated object creation input
 * @param actor - Authenticated actor ("paul" | "watson" | "codex" | "system")
 * @returns Created object with generated ULID and timestamps
 * @throws {ValidationError} If input fails schema validation
 * @throws {NotFoundError} If association target doesn't exist
 */
export async function createObject(
  db: D1Database,
  input: CreateObjectInput,
  actor: Actor,
): Promise<DbObject> {
  // ...
}
```
