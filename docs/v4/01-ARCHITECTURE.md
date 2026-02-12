# Command Center v4 — System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloudflare Edge                          │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  Pages (CDN) │    │   Worker     │    │    D1 (SQLite)   │  │
│  │  Static SPA  │───▶│   REST API   │───▶│  Objects         │  │
│  │  HTML/CSS/JS │    │  Auth        │    │  Associations    │  │
│  └──────────────┘    │  Validation  │    │  Activities      │  │
│                      └──────────────┘    └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         │                     │
         │                     │
    ┌────┴─────┐         ┌─────┴──────┐
    │  Paul    │         │  Watson    │
    │ (Browser)│         │ (API/CLI)  │
    └──────────┘         └────────────┘
```

## Components

### 1. Cloudflare Pages — Frontend Host

- **What**: Static SPA (HTML, CSS, JS) served from Cloudflare's CDN
- **Why**: Global edge delivery, zero-config HTTPS, free tier
- **Deploy**: Git push to repo triggers automatic build + deploy
- **During design phase**: May use GitHub Pages first, migrate to Cloudflare Pages later

### 2. Cloudflare Worker — API Layer

- **What**: Serverless JavaScript runtime at the edge
- **Why**: Zero cold start, global distribution, free tier (100K req/day)
- **Responsibilities**:
  - REST API for all CRUD operations
  - Authentication and authorization
  - Input validation
  - Business logic (association rules, cascade deletes)
  - Activity logging (automatic on mutations)

### 3. Cloudflare D1 — Database

- **What**: SQLite at the edge, managed by Cloudflare
- **Why**: SQL (relational model fits object-association pattern), free tier (5GB, 5M reads/day), co-located with Worker
- **Schema**: See DATA-MODEL.md

## API Design

### Authentication

Two auth modes:

1. **API Token** (Watson, programmatic access)
   - Bearer token in `Authorization` header
   - Full read/write access
   - Stored in OpenClaw config, never exposed to frontend

2. **Session Token** (Paul, browser access)
   - Simple token-based auth (no OAuth complexity for a single-user system)
   - Token stored in localStorage
   - Can be rotated from Watson's API

### Endpoints

See API-SPEC.md for full specification. Summary:

```
# Objects
GET    /api/objects                    # List objects (filtered by type, status, etc.)
GET    /api/objects/:id                # Get single object with associations
POST   /api/objects                    # Create object
PATCH  /api/objects/:id                # Update object properties
DELETE /api/objects/:id                # Soft-delete object

# Shorthand by type
GET    /api/projects                   # List projects
GET    /api/projects/:id               # Get project with tasks, milestones
GET    /api/tasks                      # List tasks
GET    /api/agents                     # List agents

# Associations
POST   /api/associations               # Create association
DELETE /api/associations/:id           # Remove association
GET    /api/objects/:id/associations   # List associations for an object

# Activities
GET    /api/objects/:id/activities     # Activity timeline for an object
POST   /api/objects/:id/activities     # Add comment/note to an object
GET    /api/activities                 # Global activity feed

# Dashboard
GET    /api/dashboard                  # Aggregated dashboard data

# System
GET    /api/health                     # Health check
POST   /api/migrate                    # Run migrations
```

### Request/Response Format

- JSON throughout
- Consistent envelope: `{ data, meta, errors }`
- Pagination: cursor-based (`?cursor=xxx&limit=20`)
- Filtering: query params (`?type=task&status=active&project=xxx`)
- Sorting: `?sort=created_at&order=desc`

## Data Flow

### Paul creates a task (browser):
```
Browser → POST /api/objects {type:"task", ...}
  → Worker validates + writes to D1
  → Worker auto-creates activity {action:"created", actor:"paul"}
  → Response with created object + activity
  → Browser updates UI
```

### Watson updates task status (API):
```
Watson CLI → PATCH /api/objects/:id {properties:{status:"done"}}
  → Worker validates + writes to D1
  → Worker auto-creates activity {action:"status_changed", actor:"watson", data:{from:"active",to:"done"}}
  → Response with updated object
```

### Paul comments on a task (browser):
```
Browser → POST /api/objects/:id/activities {action:"comment", data:{text:"..."}}
  → Worker writes activity to D1
  → Worker creates notification for Watson (optional webhook/queue)
  → Response with created activity
```

### Watson processes comments (heartbeat/poll):
```
Watson → GET /api/activities?actor=paul&unread=true
  → Worker queries D1 for unread Paul activities
  → Watson processes each, takes action
  → Watson marks as read: PATCH /api/activities/:id {read:true}
```

## Security

- **Single-user system** — Paul and Watson are the only users
- **API tokens** — Simple bearer tokens, rotatable
- **HTTPS everywhere** — Cloudflare handles TLS
- **No sensitive data in D1** — No credentials, API keys, or PII stored in the database
- **CORS** — Restricted to frontend domain
- **Rate limiting** — Cloudflare's built-in, plus custom per-token limits if needed

## Scalability

Current scale: ~4 projects, ~11 tasks, ~3 agents. Even 10x this is trivial for D1.

- D1 free tier: 5GB storage, 5M row reads/day, 100K writes/day
- Worker free tier: 100K requests/day
- Pages free tier: unlimited bandwidth

This is a single-user system. Scalability is not a concern. Simplicity is.

## Offline / Fallback

- Frontend is a static SPA — works offline for viewing cached data
- Service worker caches API responses for offline read access
- Mutations queue locally and sync when connection returns
- If Cloudflare is down (rare), Watson can fall back to local JSON files

## Monitoring

- Cloudflare Workers analytics (free) — request count, errors, latency
- Worker logs for debugging
- Watson can health-check via `/api/health` in heartbeats

## Migration Path

1. **Design phase**: Frontend on GitHub Pages with static mock data
2. **Backend phase**: Deploy Worker + D1, import data from v3 JSON files
3. **Connect phase**: Frontend talks to live API
4. **Cutover**: DNS switch to Cloudflare Pages, retire old GitHub Pages site
