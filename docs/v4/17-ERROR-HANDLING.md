# Command Center v4 — Error Handling & Logging

## Philosophy

Errors are expected. Crashes are not. Every error is caught, categorized, and either recovered from or surfaced cleanly to the user. No raw stack traces. No mysterious failures.

## Error Categories

### Backend (Worker)

| Category | HTTP Status | User Message | Watson Action |
|----------|------------|--------------|---------------|
| Validation | 400 | Field-level error messages | Fix input and retry |
| Authentication | 401 | "Authentication required" | Re-authenticate |
| Authorization | 403 | "Not authorized for this action" | Use correct token |
| Not Found | 404 | "Resource not found" | Check ID |
| Conflict | 409 | "Resource was modified" / "Duplicate" / "Cycle detected" | Re-fetch and retry |
| Rate Limited | 429 | "Too many requests. Try again in Xs" | Wait and retry |
| Server Error | 500 | "Something went wrong. Try again." | Alert Paul, check logs |
| D1 Error | 500 | "Database error" | Alert Paul, check D1 metrics |

### Frontend (Browser)

| Category | Behavior |
|----------|----------|
| Network error | Toast: "Unable to connect. Check your connection." + retry button |
| API 4xx | Toast with human-readable message from error response |
| API 5xx | Toast: "Something went wrong. Try again." |
| Auth expired | Redirect to settings with "Session expired" message |
| Render error | Caught by global error handler, shows fallback UI |
| JS exception | Logged to console, non-fatal — page continues working |

## Backend Error Response Format

All errors follow the standard envelope:

```json
{
  "data": null,
  "meta": {},
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "field": "name",
      "message": "Name is required and must be 1-200 characters"
    }
  ]
}
```

**Multiple errors returned when possible** (e.g., multiple validation failures in one response).

**Error codes** (machine-readable, for programmatic handling):
See 13-VALIDATION-RULES.md for the full error code catalog.

**Messages** (human-readable, for display):
- Written in plain English, not technical jargon
- Actionable: tell the user what to fix
- Never expose internal details (table names, SQL errors, stack traces)

## Backend Error Implementation

```typescript
// src/lib/errors.ts

class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    public userMessage: string,
    public field?: string
  ) {
    super(userMessage);
  }
}

class ValidationError extends AppError {
  constructor(field: string, message: string) {
    super(400, 'VALIDATION_ERROR', message, field);
  }
}

class NotFoundError extends AppError {
  constructor(type: string, id: string) {
    super(404, 'NOT_FOUND', `${type} not found`);
  }
}

class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(409, code, message);
  }
}

// Global error handler in router
async function handleRequest(request: Request, env: Env): Promise<Response> {
  try {
    return await route(request, env);
  } catch (error) {
    if (error instanceof AppError) {
      return jsonResponse(error.statusCode, {
        data: null,
        meta: {},
        errors: [{ code: error.code, field: error.field, message: error.userMessage }]
      });
    }
    // Unknown error — log full details, return generic message
    console.error('Unhandled error:', {
      message: error.message,
      stack: error.stack,
      path: new URL(request.url).pathname,
      method: request.method
    });
    return jsonResponse(500, {
      data: null,
      meta: {},
      errors: [{ code: 'INTERNAL_ERROR', message: 'Something went wrong. Try again.' }]
    });
  }
}
```

## Frontend Error Handling

### Global Error Boundary

```javascript
// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled rejection:', event.reason);
  event.preventDefault(); // Don't crash the page
});

// Catch JS errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Don't crash the page — show toast if it affects visible UI
});
```

### API Error Handling

```javascript
// api.js — errors are caught and surfaced as toasts
async function request(method, path, body) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { ... });

    if (!res.ok) {
      const error = await res.json();
      const messages = error.errors?.map(e => e.message).join('. ') || 'Unknown error';

      if (res.status === 401) {
        navigate('/settings'); // Session expired
        showToast('Session expired. Please re-authenticate.', 'warning');
        return;
      }

      showToast(messages, 'error');
      throw new ApiError(res.status, error.errors);
    }

    return res.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Network error
    showToast('Unable to connect. Check your connection.', 'error');
    throw error;
  }
}
```

### Toast System

```javascript
function showToast(message, type = 'info', duration = null) {
  const durations = { info: 3000, warning: 4000, error: 5000 };
  // Create toast element, animate in, auto-dismiss after duration
  // Error toasts: show a "Retry" button when applicable
}
```

## Logging Strategy

### Backend (Worker)

**What to log:**
- All errors (full context: path, method, actor, error details)
- Slow queries (>100ms)
- Auth failures (IP, attempted token prefix)
- Rate limit hits
- Import operations

**What NOT to log:**
- Successful reads (too noisy)
- Request/response bodies (may contain sensitive data)
- Full tokens or secrets

**Log format** (structured JSON for Cloudflare):
```json
{
  "level": "error",
  "timestamp": "2026-02-12T21:00:00Z",
  "requestId": "01ARZ...",
  "method": "POST",
  "path": "/api/objects",
  "actor": "watson",
  "statusCode": 400,
  "error": "VALIDATION_ERROR",
  "message": "Name is required",
  "durationMs": 12
}
```

**View logs:**
- Real-time: `wrangler tail` (streams Worker logs)
- Historical: Cloudflare Dashboard → Workers → Logs
- Watson: Periodically review during heartbeats if error rate is elevated

### Frontend (Browser)

- Console errors only (no external logging service — single-user app)
- Watson can check console via browser automation: `browser evaluate: () => window.__errors`
- No user tracking, no analytics, no telemetry

## Retry Strategy

### Watson API Client

| Error Type | Retry? | Strategy |
|-----------|--------|----------|
| Network error | Yes | 3 retries, exponential backoff (1s, 2s, 4s) |
| 429 Rate Limited | Yes | Wait for `Retry-After` header value |
| 409 Conflict | Yes | Re-fetch latest, re-apply mutation |
| 500 Server Error | Yes | 2 retries, 5s delay |
| 400 Validation | No | Fix input |
| 401/403 Auth | No | Re-authenticate |
| 404 Not Found | No | Resource doesn't exist |

### Frontend

| Error Type | Retry? | Strategy |
|-----------|--------|----------|
| Network error | Yes | Show "Retry" button in toast |
| 429 | Yes | Auto-retry after delay with loading indicator |
| 500 | Yes | Show "Retry" button |
| 400/401/403/404 | No | Show error message |

## Graceful Degradation

| Failure | User Experience |
|---------|----------------|
| API down | Cached data shown (read-only). "Offline" indicator in header. |
| D1 down | Worker returns 503. Frontend shows "Service temporarily unavailable." |
| Slow API (>2s) | Loading skeleton shown. No timeout — let it complete. |
| JS error in one view | Other views still work. Affected view shows fallback. |
| CSS fails to load | Content still readable (semantic HTML). Unstyled but functional. |
