# ADR 0001: Backend State Store and Headless Simulation Core

## Status

Accepted.

## Date

2026-05-16

## Context

Perspektivbubbla needs strict separation between game state, game logic, and rendering. The UI should be replaceable without changing simulation rules, and the project should leave room for future multiplayer, multi-session review, and instructor overview features.

Phase 1 is still a one-soldier movement slice, but it should not be built as a throwaway local-only frontend game. It should establish the architectural boundary that later phases can keep.

## Decision

The backend is the authoritative state store from Phase 1.

The simulation core is headless and framework-independent. It owns domain rules such as movement, facing, visibility, exposure, perception aging, event logging, and AAR inputs. It must not import UI framework code or depend on browser APIs.

The backend owns sessions and world state. It accepts commands, advances simulated time, applies game logic through the core, stores the resulting state/events, and exposes role-filtered projections to clients.

The UI is intentionally dumb and terminal-style: dense, operational, and focused on showing the current projection and available commands. It renders backend projections, collects player commands, and displays AAR output. It must not contain game rules beyond transient presentation concerns such as hover states, viewport pan/zoom, and input affordances.

Initial persistence may be in memory, but the code should isolate the state-store interface so durable storage or multi-session state can be added later without changing the simulation core or UI contract.

## Phase 1 Implications

- Use a client/server development setup from the start.
- Keep a shared/core package or module for pure simulation logic.
- Model player input as commands, not direct state mutation.
- Use simulated realtime, where movement is constrained by movement rate over time.
- Require the player to click or otherwise issue each movement/orientation intent; no destination autopilot for Phase 1.
- Update facing automatically from movement, but also support explicit orientation changes.
- Render a larger map with pan/zoom rather than a tiny full-board toy map. Scenario A should be able to represent roughly 300x300 meters, which means about 60-100 hexes across depending on final hex scale.
- Apply exposure using terrain, cover, concealment, and posture.
- Make difficulty affect how much terrain/protection information the UI reveals.
- Update field of view immediately from facing/orientation; perceived information then ages over time.

## Consequences

This adds more upfront architecture than a pure frontend prototype, but prevents early coupling between rules and rendering. It also makes AAR, replay, multiplayer, instructor overview, and alternate UI clients easier to add later.

Phase 1 tests should focus first on core logic and backend command/state transitions. UI tests should verify rendering and command dispatch without duplicating game-rule assertions.
