# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite, default http://localhost:5173)
npm run build      # Type-check + production build
npm run lint       # ESLint
npm run preview    # Preview production build locally
```

No test runner is configured.

## Environment

Copy `.env.local.example` to `.env.local` and set `VITE_API_BASE_URL` to the Java backend URL (default `http://localhost:8080`). All API calls go through `src/api/client.ts`, which reads this variable.

## Architecture

This is a single-page React + Vite + TypeScript app styled with Tailwind CSS v4.

**Data flow:** `App.tsx` fetches `/api/employees` on mount to populate the employee list. Selecting an employee triggers a fetch to `/api/employees/:id/snapshot` and renders the snapshot inline.

**API layer:** `src/api/client.ts` exports a thin `api` object (`get`, `post`, `put`, `delete`) wrapping `fetch`. All requests include `Content-Type: application/json`. Errors are thrown as `Error` with the HTTP status message.

**Theming:** Dark mode is toggled by `ThemeToggle` component, which sets the `dark` class on `<html>` and persists the preference to `localStorage`. Tailwind's dark variant is used throughout.