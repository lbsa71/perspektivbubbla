# Agent Rules

These rules apply to implementation work in this repository.

## Incremental Implementation

- Build one thin vertical slice at a time.
- Start with the smallest playable loop: hex map, one soldier, movement, exposure logging, and minimal AAR.
- Keep each change scoped to one behavior or one infrastructure need.
- Do not expand v0.1 scope without updating the planning docs.
- Prefer domain behavior over UI polish until the core loop is proven.
- Update docs when implementation decisions change product behavior.

## Strict TDD

- Write a failing test before production code for every behavior change.
- Use red-green-refactor: fail for the right reason, make it pass simply, then clean up.
- Do not skip, weaken, or delete tests to make a change pass.
- Cover core algorithms with deterministic unit tests before wiring them to UI.
- Add integration or component tests when UI starts depending on domain behavior.
- Regression fixes must include a failing test that reproduces the bug.
- If a change is pure docs/config/bootstrap and cannot reasonably have a test, state that explicitly in the change summary.

## Core Code Policy

- Keep simulation core separate from React/Next/UI code.
- Keep actual world state separate from perceived state.
- Keep AAR/event recording in the core model, not as a UI afterthought.
- Make core systems deterministic: inject clocks, random seeds, and scenario fixtures.
- Prefer pure functions and explicit state transitions for movement, perception, communication, orders, injury, and AAR.
- Avoid hidden global state in core modules.
- Keep data models small, typed, and serializable.
- Keep scenario data in JSON or similarly inspectable fixtures.
- Do not implement detailed weapons, ballistics, medical instruction, or doctrine-heavy behavior in v0.1.
- Favor clear names and boring code over clever abstractions.

