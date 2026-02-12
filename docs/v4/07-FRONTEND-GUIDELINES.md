# Command Center v4 — Frontend Guidelines

## Architecture

### Tech Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | **Vanilla JS** (no framework) | Single-user app, <20 views, no build step needed. Keep it simple. Framework overhead isn't justified. |
| Bundling | **None** (single entry point) | Static files on CDN. No webpack, no vite, no build pipeline. |
| Styling | **CSS custom properties** (design tokens) | All tokens defined in `:root`. Theme switching via `[data-theme]` attribute on `<html>`. |
| Routing | **Hash-based** (`#/projects`, `#/projects/:id`) | Works with static hosting, no server-side routing needed. |
| State | **Simple store pattern** | Single `state` object, render functions read from it, mutations go through `setState()`. |
| API Client | **Fetch wrapper** | Thin wrapper around `fetch()` with auth header injection, error handling, retry. |
| Offline | **Service Worker** (optional, Phase 3) | Cache API responses for offline read. Queue mutations for sync. |

### Why Not React/Vue/Svelte?

This is a single-user project management tool. The entire UI is <20 distinct views. A framework adds:
- Build step complexity
- Bundle size
- Learning curve for Codex
- Dependency management

Vanilla JS with a clean component pattern gives us everything we need. If the app grows significantly, we can migrate — but the current scope doesn't justify it.

### File Structure

```
command-center/
├── index.html              # Shell: viewport meta, font links, app mount point
├── css/
│   ├── tokens.css          # Design system tokens (colors, spacing, typography)
│   ├── reset.css           # Minimal CSS reset
│   ├── layout.css          # Sidebar, content area, grid, responsive
│   ├── components.css      # All component styles (buttons, cards, inputs, etc.)
│   └── views.css           # View-specific overrides (minimal — most styling is component-level)
├── js/
│   ├── app.js              # Entry point: init, router, auth check
│   ├── router.js           # Hash-based router
│   ├── store.js            # State management
│   ├── api.js              # API client (fetch wrapper)
│   ├── auth.js             # Token management
│   ├── utils.js            # Helpers (dates, formatting, ULID, escapeHtml)
│   ├── components/
│   │   ├── sidebar.js      # Navigation sidebar
│   │   ├── card.js         # Project card, task card, KPI card
│   │   ├── activity.js     # Activity entry, activity feed
│   │   ├── progress.js     # Progress bar
│   │   ├── pill.js         # Status pill, count badge
│   │   ├── modal.js        # Slide-over panel, modals
│   │   ├── input.js        # Form inputs, comment box
│   │   ├── toast.js        # Toast notifications
│   │   └── skeleton.js     # Loading skeletons
│   └── views/
│       ├── dashboard.js    # Dashboard view
│       ├── projects.js     # Projects list
│       ├── project.js      # Project detail
│       ├── board.js        # Kanban board
│       ├── activity.js     # Global activity feed
│       ├── agents.js       # Agents list/detail
│       ├── task.js         # Task detail (slide-over)
│       └── settings.js     # Settings
├── assets/
│   ├── icons/              # SVG icons (inline, not font)
│   └── fonts/              # Inter font files (if self-hosted)
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (Phase 3)
└── docs/
    └── v4/                 # All specification documents
```

### Why Multiple Files (Not Single-File)?

v3 was a 5,400-line single file. That's unmaintainable. v4 uses logical separation:
- Each file has one responsibility
- Files are small enough to understand in one read
- Codex can work on one file without touching others
- CSS is tokenized — changing a color changes it everywhere

No build step needed. `index.html` loads CSS files in `<head>` and JS files with `type="module"` or deferred `<script>` tags. Browser handles the rest.

## State Management

### Store Pattern

```javascript
// store.js
const state = {
  user: null,           // Current user context
  projects: [],         // Cached projects
  tasks: [],            // Cached tasks
  agents: [],           // Cached agents
  dashboard: null,      // Dashboard aggregate data
  activeProject: null,  // Currently viewed project
  activeTask: null,     // Currently viewed task (slide-over)
  ui: {
    theme: 'system',    // light | dark | system
    sidebarOpen: true,
    loading: {},        // { [key]: boolean } — per-section loading
    toasts: []
  }
};

function setState(patch) {
  Object.assign(state, patch);
  // Trigger re-render of affected views
  emitChange(Object.keys(patch));
}
```

### Data Flow

```
User Action → API Call → Update Store → Re-render View
                ↓
         (optimistic update optional)
```

- **Read**: Views read directly from `state`
- **Write**: Always go through API first, then update store on success
- **Optimistic updates**: Optional for fast UX (update store immediately, rollback on API error)
- **Cache**: Store acts as client-side cache. TTL-based invalidation on navigation.

## Component Pattern

Components are functions that return DOM elements. No virtual DOM, no diffing.

```javascript
// components/card.js
export function ProjectCard(project) {
  const el = document.createElement('button');
  el.className = 'project-card';
  el.setAttribute('aria-label', `Open project ${project.name}`);
  el.innerHTML = `
    <div class="project-card__header">
      <h3 class="project-card__name">${escapeHtml(project.name)}</h3>
      ${StatusPill(project.status)}
    </div>
    ${ProgressBar(project.stats?.progress || 0, project.properties?.color)}
    <div class="project-card__meta">
      <span>${project.stats?.activeCount || 0} active</span>
      <span>${project.stats?.completedCount || 0} done</span>
    </div>
  `;
  el.addEventListener('click', () => navigate(`/projects/${project.id}`));
  return el;
}
```

### Rules

1. **Components are pure functions** — same input, same output
2. **No component-internal state** — all state lives in the store
3. **Events bubble up** — components emit events or call navigation, never mutate state directly
4. **Always escape user content** — `escapeHtml()` on all dynamic text
5. **Semantic HTML** — buttons are `<button>`, links are `<a>`, lists are `<ul>`
6. **ARIA labels** — all interactive elements have accessible names

## Routing

### Hash-based Router

```javascript
// router.js
const routes = [
  { path: '/',                    view: 'dashboard' },
  { path: '/projects',            view: 'projects' },
  { path: '/projects/:id',        view: 'project' },
  { path: '/projects/:id/tasks',  view: 'projectTasks' },
  { path: '/board',               view: 'board' },
  { path: '/board/:projectId',    view: 'projectBoard' },
  { path: '/activity',            view: 'activity' },
  { path: '/agents',              view: 'agents' },
  { path: '/agents/:id',          view: 'agentDetail' },
  { path: '/settings',            view: 'settings' },
];

window.addEventListener('hashchange', handleRoute);
```

- URL format: `https://command-center.example.com/#/projects/01ARZ3NDEK`
- Route params extracted and passed to view render functions
- Navigation via `navigate(path)` helper (sets `location.hash`)

## API Client

```javascript
// api.js
const BASE_URL = 'https://command-center-api.example.workers.dev';

async function request(method, path, body = null) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : null
  });

  if (!res.ok) {
    const error = await res.json();
    throw new ApiError(res.status, error.errors);
  }

  return res.json();
}

// Convenience methods
export const api = {
  get:    (path) => request('GET', path),
  post:   (path, body) => request('POST', path, body),
  patch:  (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};
```

## Error Handling

- **API errors**: Caught by API client, shown as toast notification
- **Network errors**: "Unable to connect" toast, retry button
- **Validation errors**: Inline field-level messages
- **404**: Shown inline in content area ("Object not found"), not a separate page
- **Auth errors**: Redirect to settings page with re-auth prompt

## Performance

- **No framework** — minimal JS footprint
- **CSS in `<head>`** — render-blocking by design (prevents FOUC)
- **JS deferred** — `<script defer>` or `type="module"`
- **Lazy loading**: Views loaded on navigation, not upfront
- **Minimal repaints**: Batch DOM updates, use `documentFragment` for lists
- **Image-free**: All icons are inline SVG. No image requests.

## Accessibility

- **Keyboard navigation**: All interactive elements focusable, logical tab order
- **Focus management**: When slide-over opens, focus moves to it. On close, returns.
- **ARIA**: Roles, labels, live regions for dynamic content
- **Color contrast**: All text meets WCAG AA (4.5:1 normal, 3:1 large)
- **Reduced motion**: `prefers-reduced-motion` disables all transitions
- **Screen reader**: Meaningful headings hierarchy, landmark regions
