---
name: Use exact strings for placeholder queries, not case-insensitive regexes
description: Gotcha: case-insensitive regex placeholders collide when two inputs share the same word with different casing
type: feedback
---

Use exact string literals — not `/regex/i` — when querying by placeholder text, especially when multiple inputs on the same page have similar placeholder values.

**Why:** `screen.getByPlaceholderText(/e\.g\. department/i)` matched BOTH `"e.g. department"` and `"e.g. Department"` because the `i` flag made them identical. This caused a "Found multiple elements" error in the AttributeEditor test.

**How to apply:** When writing `getByPlaceholderText` queries, prefer the exact string form: `screen.getByPlaceholderText('e.g. department')`. Only use regex when you genuinely need partial matching and have verified no collisions exist.
