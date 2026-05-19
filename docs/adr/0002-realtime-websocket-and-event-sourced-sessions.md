# ADR 0002: Realtime WebSocket and Event-Sourced Sessions

## Status

Accepted.

## Date

2026-05-16

## Context

Perspektivbubbla is about realtime pressure, uncertainty, and improvisation. The player should issue commands under stress, the backend should advance simulated time, and AAR/replay should be able to explain what happened after the fact.

The project also needs future room for multiplayer, instructor views, multi-session overviews, replay, and scenario branches after failure.

## Decision

Use WebSockets for Phase 1 client/backend session communication.

Use event sourcing as the authoritative session history from the start. Commands are accepted over the realtime channel, converted into domain events by the backend/core, appended to the session event log, and projected into world state, perceived state, and AAR views.

The backend may keep the first event store in memory, but the code must model an append-only event log behind an interface so durable storage can replace it later. Use service/provider/repository boundaries around event storage and projections so persistence can be swapped without changing the core simulation or client contract.

## Input and Time Semantics

- The simulation advances on a server-owned simulated clock.
- Initial target tick rate is 5-10 simulation ticks per second.
- The client may render at any rate, but it does not own simulation time.
- A movement click means "start moving to this hex."
- The player may click any target hex.
- The backend computes a simple nearest path toward the target. If an obstacle blocks the path, movement stops.
- New movement or orientation commands interrupt current movement.
- Facing updates automatically from movement.
- The player can freely sweep/look around with mouse and keyboard controls, like moving the neck.
- Looking more than 90 degrees away from body orientation bleeds into body orientation change.
- Standing, crouched, and prone postures are part of Phase 1.

## Scenario and Outcome Semantics

Detection/failure is scenario-specific and probabilistic. A stealth objective may fail immediately when detected, but the session should then transition into a new improvisation objective such as saving the situation or retreating. Those follow-on objectives can also succeed, fail, or branch again.

The first scenario family should support three contact frames:

1. Friendly ambush: friendly side observes first.
2. Simultaneous detection: both sides detect at roughly the same time.
3. Ambushed: opposing units observe first.

Detection comes from explicit opposing observer units, as defined in [ADR 0003](0003-explicit-opposing-observer-units.md).

## Consequences

Event sourcing increases implementation discipline, but it is directly aligned with AAR and replay. It also makes branching outcomes easier to explain because the system can point to the exact sequence of commands, movements, detections, posture changes, exposure changes, and scenario transitions.

Phase 1 should prepare the backend for future observer/instructor clients by keeping projections role-scoped, but it does not need to implement a separate observer client yet.

Tests should verify command validation, event emission, projection rebuilding, interruption semantics, and deterministic replay from the event log.
