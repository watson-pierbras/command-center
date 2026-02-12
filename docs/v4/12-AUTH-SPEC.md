# Command Center v4 — Authentication & Authorization

## Overview

Single-user system with two access modes:
1. **Watson (API)** — Programmatic access via long-lived API token
2. **Paul (Browser)** — Interactive access via session token

Both are simple bearer tokens. No OAuth, no user management, no SSO. Complexity not justified for 2 actors.

## Token Types

### Watson API Token

- **Format**: Random 64-character hex string (256 bits of entropy)
- **Storage**: Cloudflare Worker environment variable (`WATSON_TOKEN`)
- **Lifetime**: No expiry. Rotatable on demand.
- **Permissions**: Full read/write access to all endpoints
- **Identity**: Requests with this token have `actor = "watson"`

### Paul Session Token

- **Format**: Random 64-character hex string
- **Storage**: HTTP-only secure cookie (`__cc_session`) set by the Worker
  - `HttpOnly`: Prevents XSS access
  - `Secure`: HTTPS only
  - `SameSite=Strict`: CSRF protection
  - `Path=/api`: Only sent to API endpoints
- **Lifetime**: 30 days. Auto-refreshed on use (sliding window).
- **Permissions**: Full read/write access to all endpoints
- **Identity**: Requests with this token have `actor = "paul"`
- **Issuance**: Via `/api/auth/session` with a setup code

### Setup Code (Bootstrap)

One-time setup to link Paul's browser:
1. Watson generates a setup code via API: `POST /api/auth/setup-code`
2. Code is a 6-digit numeric code, valid for 5 minutes
3. Paul enters code in the browser settings page
4. Browser sends code to `POST /api/auth/session`
5. Worker validates code, returns session cookie
6. Code is invalidated after use

This avoids storing credentials in localStorage entirely.

## Endpoints

### `POST /api/auth/setup-code`

Generate a one-time setup code for browser authentication.

**Auth**: Watson token only.

**Response:**
```json
{
  "data": {
    "code": "847291",
    "expiresAt": "2026-02-12T21:05:00Z"
  }
}
```

### `POST /api/auth/session`

Exchange a setup code for a session cookie.

**Auth**: None (public endpoint, rate-limited: 5 attempts/minute).

**Request:**
```json
{
  "code": "847291"
}
```

**Response (success):**
- Sets `__cc_session` cookie
- Returns `{ "data": { "actor": "paul", "expiresAt": "..." } }`

**Response (failure):**
- `401` with `{ "errors": [{ "code": "INVALID_CODE" }] }`

### `POST /api/auth/rotate`

Rotate Watson's API token or Paul's session.

**Auth**: Watson token.

**Request:**
```json
{
  "target": "watson"  // or "paul"
}
```

**Response:**
```json
{
  "data": {
    "token": "new-token-value",  // Only for Watson rotation
    "rotatedAt": "2026-02-12T21:00:00Z"
  }
}
```

**Note**: Rotating Paul's session invalidates all existing session cookies. Paul must re-authenticate via setup code.

### `DELETE /api/auth/session`

Log out (clear session cookie).

**Auth**: Session cookie.

**Response**: `204`, clears cookie.

### `GET /api/auth/me`

Get current authenticated identity.

**Auth**: Any valid token/session.

**Response:**
```json
{
  "data": {
    "actor": "paul",
    "authMethod": "session",
    "expiresAt": "2026-03-14T21:00:00Z"
  }
}
```

## Authorization Matrix

Both actors have full access. No endpoint is restricted to one actor (except setup-code generation, which is Watson-only since it's a bootstrap operation).

| Endpoint | Watson | Paul | Unauthenticated |
|----------|--------|------|-----------------|
| `GET /api/health` | ✅ | ✅ | ✅ |
| All other `GET` | ✅ | ✅ | ❌ 401 |
| All `POST/PATCH/DELETE` | ✅ | ✅ | ❌ 401 |
| `POST /api/auth/setup-code` | ✅ | ❌ 403 | ❌ 401 |
| `POST /api/auth/session` | N/A | N/A | ✅ (rate-limited) |
| `POST /api/import` | ✅ | ✅ | ❌ 401 |

## Security Measures

### Request Security
- **HTTPS only** — Cloudflare terminates TLS
- **CORS** — `Access-Control-Allow-Origin` restricted to frontend domain
- **Rate limiting** — 5 auth attempts/minute, 1000 requests/minute general
- **Input validation** — All inputs validated before processing
- **SQL parameterization** — D1 prepared statements, never string concatenation

### Token Security
- **Watson token**: Stored as Worker env var, never in D1 or client code
- **Paul session**: HTTP-only secure cookie, not accessible via JavaScript
- **No localStorage tokens** — Eliminates XSS token theft vector
- **Setup codes**: Single-use, 5-minute expiry, rate-limited

### Content Security
- **CSP header**: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://command-center-api.*.workers.dev`
- **X-Content-Type-Options**: `nosniff`
- **X-Frame-Options**: `DENY`
- **Referrer-Policy**: `strict-origin-when-cross-origin`

## Actor Identity Flow

```
Request arrives at Worker
  → Check Authorization header for Bearer token
    → Match against WATSON_TOKEN env var → actor = "watson"
  → Check __cc_session cookie
    → Validate session in D1 sessions table → actor = "paul"
  → Neither → 401 Unauthorized

Actor identity attached to:
  - object.created_by on creation
  - activity.actor on activity logging
```
