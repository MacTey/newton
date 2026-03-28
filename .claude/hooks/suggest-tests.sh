#!/bin/bash
# PostToolUse hook: fires after Edit or Write tool calls.
# Injects context prompting Claude to invoke the unit-test-writer agent
# when a source file (not a test file itself) is modified.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only act on TS/TSX/JS/JSX files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
  exit 0
fi

# Skip test files — no need to write tests for tests
if [[ "$FILE_PATH" =~ \.(test|spec)\.(ts|tsx|js|jsx)$ ]]; then
  exit 0
fi

printf '{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "Source file modified: %s. Use the unit-test-writer agent to add or update unit tests for the changed code."
  }
}' "$FILE_PATH"

exit 0
