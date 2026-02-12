# Command Center v4 — Security Model

## Threat Model

### Assets to Protect

| Asset | Sensitivity | Impact if Compromised |
|-------|------------|----------------------|
| Project/task data | Medium | Business context exposed. No PII. |
| Activity timeline | Medium | Communication between Paul/Watson visible |
| Watson API token | High | Full write access to all data |
| Session cookies | High | Paul's identity spoofable |
| Cloudflare API token | Critical | Infrastructure control |

### Threat Actors

| Actor | Motivation | Capability |
|-------|-----------|------------|
| Opportunistic scanner | Automated exploitation | Low — URL guessing, known CVEs |
| Curious visitor | Dashboard is on public URL | Low — read access if auth fails |
| XSS injection | Code injection via stored data | Medium — requires finding unsanitized input |

### Attack Surfaces

| Surface | Threats | Mitigations |
|---------|---------|-------------|
| API endpoints | Unauthorized access, injection | Auth required, parameterized queries, validation |
| Frontend (browser) | XSS, CSRF, clickjacking | CSP, HttpOnly cookies, SameSite, X-Frame-Options |
| Network | Eavesdropping, MITM | HTTPS (Cloudflare TLS), HSTS |
| Stored data | SQL injection | D1 prepared statements exclusively |
| Dependencies | Supply chain attacks | Minimal deps, lockfile, audit |

## Authentication Security

### Token Storage
- **Watson token**: Cloudflare Worker environment secret (`wrangler secret put`). Never in code, config, or DB.
- **Session cookie**: HTTP-only, Secure, SameSite=Strict. Not accessible via JavaScript.
- **Setup codes**: Stored in D1 `settings` table, hashed (SHA-256), single-use, 5-minute TTL.

### Session Security
- Session tokens are random 64-character hex strings (256 bits entropy)
- Session stored server-side in D1 (not in the cookie itself — cookie is the lookup key)
- Session table: `id, token_hash, actor, created_at, expires_at, last_used_at`
- Token in cookie is hashed before DB lookup (timing-safe comparison)
- Expired sessions cleaned up on each auth check

### Brute Force Protection
- Setup code endpoint: 5 attempts per IP per minute
- Invalid tokens: No information leakage (same 401 for wrong vs missing token)
- No password-based auth — eliminates credential stuffing entirely

## Input Security

### SQL Injection Prevention
**Rule: Never concatenate user input into SQL strings.**

All D1 queries use prepared statements:
```typescript
// ✅ ALWAYS
const result = await env.DB.prepare(
  'SELECT * FROM objects WHERE id = ? AND type = ?'
).bind(id, type).first();

// ❌ NEVER
const result = await env.DB.exec(
  `SELECT * FROM objects WHERE id = '${id}'`
);
```

D1's binding API handles parameterization and type conversion automatically.

### XSS Prevention

**Frontend:**
- All dynamic content rendered via `escapeHtml()` helper
- No `innerHTML` with user data — use `textContent` or escaped template literals
- CSP blocks inline scripts and eval

```javascript
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
```

**API:**
- Input sanitization on write: trim strings, reject HTML in names
- Output encoding: JSON responses are safe by default
- Comment text stored as-is but always escaped on render

### Request Validation

Every write endpoint validates:
1. **Content-Type**: Must be `application/json`
2. **Body size**: Max 64KB per request
3. **Field types**: String, number, array validated per schema
4. **Field lengths**: Name max 200 chars, description max 5000 chars, etc.
5. **Enum values**: Status, priority, type must be from allowed set
6. **ID format**: ULIDs validated by regex (`/^[0-9A-Z]{26}$/i`)

Validation failures return `400` with specific field-level error messages.

## Transport Security

### HTTPS
- All traffic encrypted by Cloudflare TLS (minimum TLS 1.2)
- HSTS header: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- No HTTP fallback — Workers.dev enforces HTTPS

### CORS
```typescript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': env.FRONTEND_ORIGIN,  // Specific origin, never '*'
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',  // Required for cookies
  'Access-Control-Max-Age': '86400'  // Preflight cache 24h
};
```

- Origin is restricted to the frontend domain only
- Credentials mode enabled for cookie-based auth
- Preflight responses cached to minimize OPTIONS requests

### Security Headers (Frontend)
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://command-center-api.*.workers.dev; frame-ancestors 'none'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Data Security

### What's Stored in D1
- Object names, descriptions, properties (project management data)
- Activity text (comments between Paul and Watson)
- Session metadata (hashed tokens, expiry)
- Settings (preferences, setup code hashes)

### What's NOT Stored in D1
- API keys or tokens (in Cloudflare secrets)
- Passwords (no password auth)
- PII (no personal data beyond Paul's name in activities)
- Financial data (budgets are for project tracking, not real transactions)
- Source code (lives in Git)

### Data at Rest
- D1 data encrypted at rest by Cloudflare
- No additional application-level encryption needed (data sensitivity is medium)

### Data Retention
- Active objects: retained indefinitely
- Soft-deleted objects: retained 90 days, then eligible for hard-delete cleanup
- Activities: retained indefinitely (audit trail)
- Expired sessions: cleaned up on access (lazy cleanup)

## Dependency Security

### Backend Dependencies
- **Minimal**: Only what Cloudflare Workers runtime provides + ULID library
- No Express, no ORM, no middleware frameworks — reduces attack surface
- `package-lock.json` committed — deterministic installs
- `npm audit` run before every deploy

### Frontend Dependencies
- **Zero external dependencies** — vanilla JS, no npm packages
- Inter font loaded from self-hosted or Google Fonts CDN (subresource integrity)
- No jQuery, no lodash, no moment — nothing to exploit

### Supply Chain Protections
1. Lock files committed
2. Exact versions (no ranges)
3. `npm audit` in pre-deploy check
4. Minimal dependency count (target: <5 backend, 0 frontend)

## Rate Limiting

Implemented in Worker middleware:

| Scope | Limit | Window | Action |
|-------|-------|--------|--------|
| Global (per IP) | 1000 requests | 1 minute | 429 Too Many Requests |
| Auth attempts | 5 requests | 1 minute | 429 + 60s cooldown |
| Write operations | 100 requests | 1 minute | 429 |
| Import endpoint | 1 request | 5 minutes | 429 |

Rate limit state stored in D1 or Workers KV (if needed for performance).

## Incident Response

### If Watson Token is Compromised
1. Rotate immediately: `wrangler secret put WATSON_TOKEN`
2. Audit recent activities for unauthorized changes
3. Worker redeploys with new token automatically
4. No user-facing downtime

### If Session Cookie is Compromised
1. Watson rotates Paul's session: `POST /api/auth/rotate {target: "paul"}`
2. All existing sessions invalidated
3. Paul re-authenticates via new setup code
4. Audit activities for unauthorized Paul actions

### If Cloudflare API Token is Compromised
1. Revoke in Cloudflare dashboard immediately
2. Generate new token
3. Update GitHub Actions secret (if CI/CD enabled)
4. Audit Cloudflare audit log for unauthorized changes

## Security Checklist (Pre-Launch)

- [ ] All endpoints require authentication (except /health and /auth/session)
- [ ] All queries use prepared statements (grep for `.exec(` — should only be in migrations)
- [ ] CSP header present on all frontend responses
- [ ] CORS restricted to frontend origin
- [ ] No secrets in code, config, or repo
- [ ] Input validation on all write endpoints
- [ ] Rate limiting active
- [ ] HTTPS enforced
- [ ] Session cookies are HttpOnly + Secure + SameSite=Strict
- [ ] `escapeHtml()` used on all dynamic frontend content
- [ ] `npm audit` clean
- [ ] Error responses don't leak stack traces or internal details
