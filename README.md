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

To add a new API module, create a file under `src/api/` that uses the `api` client:

```ts
import { api } from './client';

export const getItems = () => api.get<Item[]>('/api/items');
```

## Current Features

- **Home page** — fetches and displays a list of employees from `GET /api/employees`
  - Columns: Employee ID, First Name, Last Name
  - Handles loading, error, and empty states

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
