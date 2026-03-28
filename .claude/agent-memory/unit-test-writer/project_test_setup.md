---
name: Project test setup
description: Vitest configuration, installed packages, and conventions for this React/Vite/TypeScript project
type: project
---

Vitest is fully configured and working. No additional setup is needed before writing tests.

**Configuration:** `vite.config.ts` contains the vitest block with `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./src/test/setup.ts']`, and `env: { VITE_API_BASE_URL: 'http://localhost:8080' }`.

**Setup file:** `src/test/setup.ts` imports `@testing-library/jest-dom` only.

**Installed dev deps:** vitest, @vitest/coverage-v8, jsdom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event.

**Test scripts:** `"test": "vitest"` (watch), `"test:coverage": "vitest run --coverage"`. To run once non-interactively use `npx vitest run`.

**Why:** Framework was set up prior to this session; all packages already present in package.json.

**How to apply:** Skip any framework-installation steps; jump straight to writing tests.
