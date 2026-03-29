---
name: Component testing conventions for this project
description: Patterns for testing modals, table rows, selects, and backdrop clicks in this codebase
type: project
---

**Table row isolation:** Use `screen.getByText('cellValue').closest('tr')` + `within(row).getByRole(...)` to scope button queries to a specific row when multiple rows exist.

**Modal backdrop click:** The backdrop is the outermost fixed `div`; the modal panel is its direct child. To click the backdrop without hitting the panel, get the panel via `closest('div[class*="rounded-xl"]')` then access `.parentElement`.

**Select queries:** Use `screen.getAllByRole('combobox')` when multiple selects are present; in AttributeEditor: index 0 = dataType, index 1 = isRequired, index 2 = allowsMultiple.

**Submit button label:** "Add" in add mode, "Save" in edit mode, "Saving…" while submitting. Query by exact name to distinguish from other buttons.

**Re-fetch verification:** After a successful save, `api.get` is called a second time. Asserting `mockGet.toHaveBeenCalledTimes(2)` + `toHaveBeenLastCalledWith('/api/attribute-definitions')` confirms both the count and the correct endpoint.

**Helper functions:** Extract `renderAndOpenAddModal()` and `renderAndOpenEditModal()` helpers to avoid repetition across many tests in the same file. These helpers call `mockGet.mockResolvedValue(ATTR_LIST)` internally, so individual tests only need to set up `mockPost`/`mockPut` overrides before calling them.

**Why:** Keeps tests readable and avoids duplicating render + interaction boilerplate across 50+ tests.

**How to apply:** Follow the helper pattern for any component that has a modal requiring several setup steps to open.
