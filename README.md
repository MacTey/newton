# Newton

A React application built with Vite, TypeScript, and Tailwind CSS. Designed to consume data from a Java API backend at `http://ringbearer`.

## Tech Stack

- **React** + **TypeScript**
- **Vite** (build tool / dev server)
- **Tailwind CSS** (styling)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure the API URL:
   ```bash
   cp .env.local.example .env.local
   ```
   `.env.local` is already configured with `VITE_API_BASE_URL=` (empty, uses Vite proxy).

3. Start the dev server:
   ```bash
   npm run dev
   ```

## API Integration

All API calls go through `src/api/client.ts`. The base URL is controlled by the `VITE_API_BASE_URL` environment variable.

Vite proxies `/api` requests to `http://ringbearer` (configured in `vite.config.ts`), avoiding CORS issues in development.

## Current Features

- **Split-panel layout** — employee list on the left, detail panel on the right
- **Employee list** — fetches from `GET /api/employees`, displays Employee ID, First Name, Last Name
- **Employee snapshot** — clicking an employee fetches `GET /api/employees/{id}/snapshot` and displays:
  - Name, job title, and department header
  - All scalar fields in a key/value table
  - Skills as blue tags
  - Certifications as green tags
  - Snapshot timestamp
- **Light/dark mode toggle** — persisted in `localStorage`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
