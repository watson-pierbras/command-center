# Command Center v4 — Vision

## What Is This?

Command Center v4 is a **project management system built on a CRM-style object-association architecture**. It is the primary operating system for managing projects, tasks, agents, and communication between Paul (human) and Watson (AI architect).

It is not a lead CRM. It is not a task board with extra steps. It is a system where **everything is an object, every object can relate to any other object, and every interaction is tracked**. Think HubSpot's data model applied to project management.

## Why Rebuild?

Command Center v3 was a good start — a Kanban board with projects, agents, costs, and a feed. But it hit architectural limits:

1. **Flat data model** — Tasks are cards in columns. Projects are labels on cards. There's no real structure connecting them.
2. **No communication layer** — Paul and Watson can't have conversations *about* specific objects. Comments exist but aren't first-class.
3. **Single-file PWA** — 5,400+ lines of HTML/CSS/JS in one file. Unmaintainable.
4. **Static hosting** — JSON files on GitHub Pages. No real-time sync, no search, no API.
5. **Design debt** — Accumulated features without cohesive design vision.

## What Changes?

### Data Architecture
- **Everything is an object** with typed properties
- **Associations link objects** — a task belongs to a project, is assigned to an agent, blocks another task, belongs to a milestone
- **Activities are first-class** — every comment, status change, creation, and update is logged on a timeline attached to its object
- **The database is relational** (D1/SQLite), not flat JSON files

### Communication Model
- Paul comments on any object → Watson processes it and acts
- Watson posts updates, questions, and status changes on objects
- Every object has an activity timeline — full audit trail
- The inbox pattern (`.watson-inbox.json`) becomes a proper notification/queue system

### Technical Stack
- **Backend**: Cloudflare Workers (serverless edge compute) + D1 (SQLite)
- **Frontend**: Modern SPA deployed to Cloudflare Pages (or GitHub Pages during design phase)
- **Auth**: Token-based (Watson API key for programmatic access, session for browser)
- **Sync**: Real-time via Workers, replacing the 5-minute git sync

### Design Philosophy
- Steve Jobs / Jony Ive design principles (see DESIGN-PHILOSOPHY.md)
- Mobile-first, responsive
- Calm, confident, quiet UI
- Every element justifies its existence
- Simplicity is architecture, not style

## Who Uses This?

### Paul (Human)
- Views dashboard on mobile (primarily via browser, linked from Telegram)
- Comments on objects to communicate with Watson
- Reviews project health, task status, agent activity
- Creates and prioritizes work

### Watson (AI Architect)
- Reads and processes comments/instructions via API
- Updates task status, adds activities, creates objects
- Orchestrates Codex and other agents
- Reports progress and surfaces blockers

### Codex (Coding Agent)
- Assigned to tasks by Watson
- Status tracked via agent activity logs
- Work output linked to tasks

## Success Criteria

1. **Paul can open the dashboard on his phone and instantly understand project health** — no clicking, no scrolling, no thinking
2. **Paul can comment on any object and Watson acts on it** — the command center IS the communication channel
3. **Every action is traceable** — who did what, when, on which object, and why
4. **Watson can programmatically manage everything via API** — no more editing JSON files and git pushing
5. **The design feels inevitable** — calm, premium, like no other design was possible

## What This Is NOT

- Not a lead CRM (no contacts, no deals, no sales pipeline)
- Not a replacement for HubSpot (Paul's company uses HubSpot for actual CRM)
- Not a general-purpose project management tool for teams (it's for Paul + Watson)
- Not a feature showcase — every feature must serve the two users above

## Phases

1. **Design** — UI/UX prototyped with static data, iterated until right
2. **Backend** — Cloudflare Workers + D1 API built to serve exactly what the frontend needs
3. **Connect** — Frontend wired to live API
4. **Migrate** — Data from v3 (board.json, projects.json, agents.json) imported
5. **Deploy** — Live on Cloudflare, Watson integrated via API
