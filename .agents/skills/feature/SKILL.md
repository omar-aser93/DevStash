---
name: feature
description: Manage current feature workflow - load, start, review, explain, test or complete
argument-hint: load|start|review|explain|test|complete
---

## Context

Read the file at `context/current-feature.md` before doing anything else. If it does not exist, create it with an empty `# Current Feature` heading and the sections below.

## File Structure

current-feature.md has these sections:

- `# Current Feature` - H1 heading with feature name when active
- `## Status` - Not Started | In Progress | Complete
- `## Goals` - Bullet points of what success looks like
- `## Notes` - Additional context, constraints, or details from spec
- `## History` - Completed features (append only)

## Task

The user invoked this skill with a request. Parse it as follows:

- The **action** is the first word of the request (e.g. "load", "start", "test", "review", "explain", "complete").
- The **argument** is everything after the action word, if any.
- If the request is empty or doesn't match a known action, treat action as "help".

Execute the requested action using the sections below.

---

### If action is "load":

1. Check the argument (the text after "load"):
   - If it looks like a filename (single word, no spaces): Look for `context/features/{name}.md` OR `context/fixes/{name}.md`
   - If it's multiple words: Use as inline feature description, generate goals
   - If empty: Error - "load" requires a spec filename or feature description
2. Update current-feature.md:
   - Update H1 heading to include feature name (e.g., `# Current Feature: Add Navbar`)
   - Write goals as bullet points under ## Goals
   - Write any additional notes/context under ## Notes
   - Set Status to "Not Started"
3. Confirm spec loaded and show the feature summary

---

### If action is "start":

1. Read current-feature.md - verify Goals are populated
2. If empty, error: "Run this skill with 'load' first"
3. Set Status to "In Progress"
4. Create and checkout the feature branch (derive name from H1 heading)
5. List the goals, then implement them one by one

---

### If action is "test":

1. Read current-feature.md to understand what was implemented
2. Identify server actions and utility functions added/modified for this feature
3. Check if tests already exist for these functions
4. For functions without tests that have testable logic, write unit tests:
   - Create unit tests using Vitest
   - Focus on server actions and utilities (not components)
   - Test happy path and error cases
   - Do not write tests just to write them. Use your best judgement
5. Run `npm test` to verify all tests pass
6. Report test coverage for the new feature code

---

### If action is "review":

1. Read current-feature.md to understand the goals
2. Review all code changes made for this feature
3. Check for:
   - ✅ Goals met
   - ❌ Goals missing or incomplete
   - ⚠️ Code quality issues or bugs
   - 🚫 Scope creep (code beyond goals)
   - 🧪 Adequate test coverage for new code
4. Final verdict: Ready to complete or needs changes

---

### If action is "explain":

1. Read current-feature.md to understand what was implemented
2. Run `git diff main --name-only` to get list of files changed
3. For each file created or modified:
   - Show the file path
   - Give a 1-2 sentence explanation of what it does / what changed
   - Highlight any key functions, components, or patterns used
4. End with a brief summary of how the pieces fit together

Output format:

## Files Changed

**path/to/file.ts** (new)
Brief explanation of what this file does and why it was added.

**path/to/other.ts** (modified)
What changed and why.

## How It All Connects

Brief summary of the data/control flow between these files.

---

### If action is "complete":

# Complete Action

1. Stage all changes and commit with a descriptive message
2. Switch to main/master and merge the feature branch (no push yet)
3. Delete the local feature branch
4. Reset current-feature.md:
   - Change H1 back to `# Current Feature`
   - Clear Goals and Notes sections (keep placeholder comments)
   - Add feature summary to the END of History
5. Commit the reset: `chore: reset current-feature.md after completing [feature]`
6. Push main/master to origin ONCE (single push with all changes)
7. If feature branch was previously pushed, delete it from origin
---

If no action provided, or action is "help": explain the available options — load, start, review, test, complete — and how to invoke each on this platform (e.g. `/feature start`, `$feature start`, or "use the feature skill to start").