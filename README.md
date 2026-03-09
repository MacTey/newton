# Newton

A React application built with Vite, TypeScript, and Tailwind CSS. Designed to consume data from a Java API backend.

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
   # Edit .env.local and set VITE_API_BASE_URL to your Java API
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

## API Integration

All API calls go through `src/api/client.ts`. The base URL is controlled by the `VITE_API_BASE_URL` environment variable (defaults to `http://localhost:8080`).

To add a new API module, create a file under `src/api/` that uses the `api` client:

```ts
import { api } from './client';

export const getItems = () => api.get<Item[]>('/api/items');
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
