---
name: Project mock patterns
description: How api/client, assets, and router are mocked in this project's test files
type: project
---

**API mock (pages under src/pages/):**
```ts
vi.mock('../api/client', () => ({ api: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
import { api } from '../api/client';
const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
```
For components one level deeper (src/components/) the path becomes `'../../api/client'`.

**Asset mock (App.test.tsx pattern):**
```ts
vi.mock('./assets/logo.png', () => ({ default: 'logo.png' }));
```

**Router:** App requires `<MemoryRouter>` wrapper. Standalone page components (AttributeEditor, etc.) do not use routing and need no wrapper.

**globals: true** — `describe`, `it`, `expect`, `vi`, `beforeEach` etc. are available without importing. Existing test files import them explicitly anyway (defensive style); follow that convention for consistency.

**beforeEach cleanup:** `vi.clearAllMocks()` is always called. Some tests also clear `localStorage` and remove the `dark` class from `document.documentElement`.

**Why:** Consistent mock setup across test files; avoids module-resolution errors.

**How to apply:** Copy the mock block above verbatim; adjust relative path based on the test file's location in the tree.
