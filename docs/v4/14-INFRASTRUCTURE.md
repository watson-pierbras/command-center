# Command Center v4 — Infrastructure & DevOps

## Project Structure

```
command-center-api/
├── wrangler.jsonc              # Cloudflare Worker config
├── package.json                # Dependencies (minimal)
├── tsconfig.json               # TypeScript config
├── migrations/
│   ├── 001-initial.sql         # Core tables (objects, associations, activities, etc.)
│   └── 002-seed.sql            # Default agent objects (Watson, Codex, Ollama)
├── src/
│   ├── index.ts                # Worker entry point + router
│   ├── router.ts               # Request routing
│   ├── middleware/
│   │   ├── auth.ts             # Authentication middleware
│   │   ├── cors.ts             # CORS headers
│   │   ├── rateLimit.ts        # Rate limiting
│   │   └── security.ts         # Security headers (CSP, etc.)
│   ├── handlers/
│   │   ├── objects.ts          # CRUD for objects
│   │   ├── associations.ts     # Association management
│   │   ├── activities.ts       # Activity timeline + comments
│   │   ├── dashboard.ts        # Dashboard aggregation
│   │   ├── auth.ts             # Auth endpoints (setup-code, session, rotate)
│   │   ├── import.ts           # v3 data import
│   │   └── health.ts           # Health check
│   ├── models/
│   │   ├── object.ts           # Object queries + validation
│   │   ├── association.ts      # Association queries + validation
│   │   ├── activity.ts         # Activity queries
│   │   └── settings.ts         # Settings key-value
│   ├── validation/
│   │   ├── schemas.ts          # Type-specific property schemas
│   │   ├── transitions.ts      # Status transition rules
│   │   └── associations.ts     # Association cardinality + cycle detection
│   ├── lib/
│   │   ├── ulid.ts             # ULID generation
│   │   ├── response.ts         # Response envelope helpers
│   │   ├── errors.ts           # Error types and codes
│   │   └── pagination.ts       # Cursor pagination helpers
│   └── types.ts                # TypeScript type definitions
├── test/
│   ├── objects.test.ts         # Object CRUD tests
│   ├── associations.test.ts    # Association tests
│   ├── activities.test.ts      # Activity tests
│   ├── auth.test.ts            # Auth tests
│   ├── dashboard.test.ts       # Dashboard aggregation tests
│   └── helpers.ts              # Test utilities
└── scripts/
    ├── deploy.sh               # Deploy script
    ├── export-db.sh            # D1 export for backup
    └── seed-dev.sh             # Seed development database
```

## Wrangler Configuration

```jsonc
// wrangler.jsonc
{
  "name": "command-center-api",
  "main": "src/index.ts",
  "compatibility_date": "2026-02-01",
  "compatibility_flags": ["nodejs_compat"],

  // D1 database binding
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "command-center",
      "database_id": "<from-d1-create>",
      "migrations_dir": "migrations"
    }
  ],

  // Environment variables (secrets set via wrangler secret)
  "vars": {
    "ENVIRONMENT": "production",
    "FRONTEND_ORIGIN": "https://watson-pierbras.github.io",
    "API_VERSION": "4.0.0"
  },

  // Development
  "dev": {
    "port": 8787,
    "local_protocol": "http"
  },

  // Environments
  "env": {
    "staging": {
      "name": "command-center-api-staging",
      "d1_databases": [
        {
          "binding": "DB",
          "database_name": "command-center-staging",
          "database_id": "<staging-db-id>",
          "migrations_dir": "migrations"
        }
      ],
      "vars": {
        "ENVIRONMENT": "staging",
        "FRONTEND_ORIGIN": "https://staging.command-center.pages.dev"
      }
    }
  }
}
```

## Environment Strategy

| Environment | Purpose | URL | Database |
|------------|---------|-----|----------|
| **Local** | Development + testing | `http://localhost:8787` | Local D1 (SQLite file) |
| **Staging** | Pre-production validation | `command-center-api-staging.*.workers.dev` | `command-center-staging` D1 |
| **Production** | Live | `command-center-api.*.workers.dev` | `command-center` D1 |

### Secret Management

Secrets are never in code, config files, or repos. Managed via Wrangler CLI:

```bash
# Set Watson API token
wrangler secret put WATSON_TOKEN
# (Prompts for value, stores in Cloudflare)

# Set session signing key
wrangler secret put SESSION_SECRET

# List secrets (values hidden)
wrangler secret list
```

**Secrets needed:**
| Secret | Purpose | Set By |
|--------|---------|--------|
| `WATSON_TOKEN` | Watson API authentication | Watson (generated) |
| `SESSION_SECRET` | Session cookie signing/encryption | Watson (generated) |

## Deployment Pipeline

### Manual Deploy (current)
```bash
# Deploy to production
wrangler deploy

# Deploy to staging
wrangler deploy --env staging

# Run D1 migrations
wrangler d1 migrations apply command-center --remote
wrangler d1 migrations apply command-center-staging --remote --env staging
```

### Automated Deploy (future)
```
Push to main → GitHub Actions → wrangler deploy
Push to staging → GitHub Actions → wrangler deploy --env staging
```

GitHub Actions workflow (for later):
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy
```

## Database Management

### Backups

D1 provides automatic point-in-time restore. Additionally:

```bash
# Manual export (full database)
wrangler d1 export command-center --remote --output=./backups/$(date +%Y-%m-%d).sql

# Export single table
wrangler d1 export command-center --remote --table=objects --output=./backups/objects-$(date +%Y-%m-%d).sql
```

**Backup schedule** (Watson cron job):
- Daily: Full database export to local filesystem
- Weekly: Export pushed to private git repo
- Before any migration: Snapshot taken

### Migrations

D1 uses sequential SQL migration files:

```bash
# Create new migration
wrangler d1 migrations create command-center "add-tags-table"
# Creates: migrations/003-add-tags-table.sql

# Apply locally
wrangler d1 migrations apply command-center --local

# Apply to production
wrangler d1 migrations apply command-center --remote
```

**Migration rules:**
1. Migrations are append-only — never edit an applied migration
2. Each migration includes both up and down logic (commented rollback SQL)
3. Test locally before applying to production
4. Backup before every production migration

### Data Location

D1 database location hint: `enam` (Eastern North America) — closest to Paul in Georgia.

```bash
wrangler d1 create command-center --location=enam
```

## Monitoring

### Built-in (Cloudflare Dashboard)
- Request count, errors, latency (Workers Analytics)
- D1 metrics: queries/second, rows read/written, storage used
- Error logs (Worker exceptions)

### Watson Health Check (Heartbeat)
Watson checks `/api/health` during heartbeat cycles:

```javascript
// Returns:
{
  "status": "ok",
  "version": "4.0.0",
  "environment": "production",
  "d1": "connected",
  "uptime": "...",
  "timestamp": "2026-02-12T21:00:00Z"
}
```

If health check fails, Watson alerts Paul via Telegram immediately.

### Error Tracking

Worker catches all unhandled errors and logs structured JSON:
```javascript
{
  "level": "error",
  "message": "Failed to create object",
  "error": "D1_ERROR",
  "path": "/api/objects",
  "method": "POST",
  "actor": "watson",
  "timestamp": "2026-02-12T21:00:00Z",
  "requestId": "01ARZ..."
}
```

View logs: `wrangler tail` (real-time) or Cloudflare Dashboard → Workers → Logs.

## Domain & DNS (Future)

Options:
1. **Subdomain of existing domain** (if Paul has one): `api.command.example.com`
2. **Workers.dev subdomain** (default): `command-center-api.paul.workers.dev`
3. **Custom domain** (buy one): `commandcenter.app` or similar

For now: use Workers.dev subdomain. Custom domain is a future nice-to-have.

## Cost

All within Cloudflare free tier:

| Resource | Free Tier | Our Expected Usage |
|----------|-----------|-------------------|
| Workers | 100K requests/day | <1K requests/day |
| D1 Storage | 5GB | <10MB |
| D1 Reads | 5M rows/day | <50K rows/day |
| D1 Writes | 100K rows/day | <5K rows/day |
| Pages | Unlimited bandwidth | Minimal |

**Estimated monthly cost: $0.00**

## TypeScript

The backend uses TypeScript for type safety:
- D1 binding types generated by `wrangler types`
- Custom types for objects, associations, activities
- Request/response types for all endpoints
- Validation schemas enforce runtime type safety

No TypeScript on the frontend (vanilla JS) — keeps the frontend zero-build-step.
