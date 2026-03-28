# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Start dev server (Vite, default http://localhost:5173)
npm run build          # Type-check + production build
npm run lint           # ESLint
npm run preview        # Preview production build locally
npm test               # Run tests in watch mode
npm run test:coverage  # Single run with V8 coverage report
```

## Environment

Copy `.env.local.example` to `.env.local` and set `VITE_API_BASE_URL` to the Java backend URL (default `http://localhost:8080`). All API calls go through `src/api/client.ts`, which reads this variable. In `.env.local` the variable is set to empty string so the Vite dev proxy handles routing (`/api` → `http://ringbearer`).

## Testing

Vitest with jsdom, `@testing-library/react`, `@testing-library/user-event`, and `@testing-library/jest-dom`. Globals are enabled (no need to import `describe`/`it`/`expect`). Setup file: `src/test/setup.ts`.

Test env overrides `VITE_API_BASE_URL` to `http://localhost:8080` via `vite.config.ts` `test.env`. Mock the API client with:
```ts
vi.mock('../api/client', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
```

When testing components that use `NavLink` or other router hooks, wrap renders in `<MemoryRouter>`.

## Architecture

React 19 + Vite 7 + TypeScript SPA styled with Tailwind CSS v4 (`@tailwindcss/vite` plugin — no `tailwind.config.js`). Dark mode uses a custom `@variant dark (&:where(.dark, .dark *))` rule driven by the `.dark` class on `<html>`.

**Routing:** `react-router-dom` v7. `BrowserRouter` wraps the app in `src/main.tsx`. Two routes:
- `/` → `EmployeeView` (extracted from App.tsx, defined in same file)
- `/attributes` → `src/pages/AttributeEditor.tsx`

Navigation tabs live in the persistent header in `App.tsx` using `NavLink`.

**API layer:** `src/api/client.ts` exports a thin `api` object (`get`, `post`, `put`, `delete`) wrapping `fetch`. Base URL from `VITE_API_BASE_URL || ''`. Errors thrown as `Error` with the HTTP status message.

**Employee view:** `EmployeeView` in `App.tsx` fetches `GET /api/employees` on mount. Selecting an employee fetches `GET /api/employees/:id/snapshot` and renders the snapshot in a detail panel.

**Attribute editor:** `src/pages/AttributeEditor.tsx` fetches `GET /api/attribute-definitions`. Supports Add (`POST /api/attribute-definitions`) and Edit (`PUT /api/attribute-definitions/:name`) via a modal form. `name` is the primary key and is read-only on edit.

**Theming:** `ThemeToggle` component sets the `dark` class on `<html>` and persists to `localStorage`. State is initialized via `useState` lazy initializer (no flicker).

## Hooks

A `PostToolUse` hook fires after every `Edit`/`Write` tool call on `.ts`/`.tsx` source files (excluding test files). It injects context prompting the unit-test-writer agent to add or update tests for the modified file. Hook script: `.claude/hooks/suggest-tests.sh`. Requires `jq` in PATH.
