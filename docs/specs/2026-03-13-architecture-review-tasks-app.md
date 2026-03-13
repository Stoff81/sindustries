# Tasks App Architecture Review

**Date:** 2026-03-13  
**Reviewer:** Rowan (Subagent)  
**Scope:** `/sindustries/apps/tasks` (frontend) + `/sindustries/services/tasks-api` (backend)

---

## Executive Summary

The Tasks app is a well-structured React SPA with an Express/Prisma backend. It provides task management with Kanban board and backlog views, filtering, tagging, comments, and draft persistence. The architecture is functional but has several areas for improvement.

---

## Current Architecture

### Frontend (`apps/tasks`)
- **Stack:** React 18 + Vite
- **State:** Custom hooks (`useTasks`, `useTaskDrafts`)
- **Styling:** Custom CSS (~38KB in App.css)
- **API:** REST with 3-second polling for real-time updates
- **Features:**
  - Kanban board view
  - Backlog list view
  - Task editor with inline editing
  - Draft persistence (unsaved changes warning)
  - Comments system
  - Filtering (status, priority, tag, text search)
  - Confetti celebration on "Pulse" button

### Backend (`services/tasks-api`)
- **Stack:** Express + Prisma + PostgreSQL
- **Routes:** Tasks CRUD, comments, tags, health
- **Data Model:** Task, TaskComment, Tag, TaskTag (many-to-many)

---

## Identified Issues & Recommendations

### 1. **Code Organization: Monolithic Frontend**
**Issue:** Single `App.jsx` file at ~38KB contains everything—components, logic, API calls, and confetti animations.

**Recommendation:**
- Split into feature-based modules:
  - `/components` — TaskCard, TaskEditor, Board, Backlog, FilterBar
  - `/hooks` — useTasks, useTaskDrafts (already exist, move to folder)
  - `/api` — tasksApi.js (already exists, move to folder)
  - `/utils` — confetti, date formatting
- Benefits: Improved maintainability, easier testing, better SSR readiness

---

### 2. **No Type Safety**
**Issue:** JavaScript-only codebase with no TypeScript. No PropTypes or runtime validation beyond React defaults.

**Recommendation:**
- Add TypeScript gradually:
  1. Start with `tasksApi.js` types (Task, Comment, FilterParams)
  2. Add types to components as they're split out
  3. Consider migrating full codebase if it grows
- Alternative: Use JSDoc + TypeScript in check mode for gradual adoption

---

### 3. **API Polling Instead of WebSockets/SSE**
**Issue:** Frontend polls every 3 seconds regardless of whether the user is viewing the task list. This wastes bandwidth and creates unnecessary load.

**Recommendation:**
- Implement Server-Sent Events (SSE) for push updates:
  - Lower latency than polling
  - Only active connections receive updates
  - Easier to implement than WebSockets for one-way data flow
- Fallback: Smart polling (pause when tab hidden, increase interval when no activity)

---

### 4. **No Optimistic Updates**
**Issue:** UI waits for server response before updating—creates perceived lag, especially on slow connections.

**Recommendation:**
- Implement optimistic UI updates:
  1. Update local state immediately on user action
  2. Send API request
  3. Rollback only on failure
- The `useTasks` hook already handles mutations; add rollback logic to `runMutation`

---

### 5. **CSS Architecture**
**Issue:** Single `App.css` with 38KB of styles. No CSS-in-JS or CSS modules. Styles are tightly coupled to component structure.

**Recommendation:**
- Consider CSS modules or a lightweight solution:
  - Move styles co-located with components
  - Use design tokens programmatically
- Current design tokens are in a separate package but not typed/utilized efficiently

---

### 6. **No Error Boundaries**
**Issue:** React error in any component crashes the entire app.

**Recommendation:**
- Add React Error Boundary around major sections
- Show graceful error states instead of white screens
- Log errors for debugging

---

### 7. **Missing Tests**
**Issue:** Test files exist but minimal coverage. No E2E tests running in CI visible.

**Recommendation:**
- Prioritize:
  1. E2E tests for critical flows (create task, move status, filter)
  2. Unit tests for `mapTask`, `normalizeTags`, cursor encoding
  3. Integration tests for API routes
- Run E2E in CI pipeline

---

### 8. **Backend: N+1 Query Risk**
**Issue:** The tasks list endpoint includes tags and the single task endpoint includes comments. With large datasets, could cause performance issues.

**Recommendation:**
- Add pagination cursors to comments
- Consider lazy-loading comments (not included in list view)
- Add database query logging in development to catch N+1

---

### 9. **No Input Sanitization**
**Issue:** Task titles/descriptions/comments are stored and rendered as-is. XSS risk if rendered in other contexts (e.g., email notifications, future markdown rendering).

**Recommendation:**
- Sanitize on output (React handles this by default)
- Consider sanitizing on input if HTML support is ever added
- Add a content security policy header

---

### 10. **Missing Features**
- **Due dates not editable in board view** — Only visible in backlog
- **No task duplication**
- **No bulk operations** (move multiple tasks)
- **No keyboard shortcuts** beyond Enter-to-save

---

## Quick Wins (Low Effort, High Impact)

1. **Add `loading` states** — Show spinners during API calls
2. **Debounce search** — Prevent API spam on type
3. **Persist view preference** — LocalStorage for board/backlog selection
4. **Add `aria-live` region** — Announce filter results to screen readers
5. **Add toast notifications** — Success/error feedback after mutations

---

## Summary Table

| Area | Current State | Recommended Action |
|------|---------------|-------------------|
| Code Organization | Monolithic App.jsx | Split into feature modules |
| Type Safety | None | Add TypeScript incrementally |
| Real-time Updates | 3s polling | Implement SSE |
| Updates | Pessimistic | Optimistic with rollback |
| Styling | Single CSS file | CSS modules or co-located |
| Error Handling | None | Add Error Boundaries |
| Testing | Minimal | Prioritize E2E + unit |
| Performance | Polling overhead | SSE + query optimization |

---

## Conclusion

The Tasks app is a solid MVP with good separation between frontend and backend. The main technical debt is in frontend organization (monolithic file), lack of type safety, and the polling-based real-time strategy. These are addressable incrementally without a full rewrite.

**Priority recommendations:**
1. Split `App.jsx` into components (1-2 hours)
2. Add TypeScript to API layer (2-3 hours)
3. Implement SSE for real-time (4-6 hours)
4. Add optimistic updates (2-3 hours)

---

*Review completed by Rowan, 2026-03-13*
