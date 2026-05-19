# ADR 0003: Explicit Opposing Observer Units

## Status

Accepted.

## Date

2026-05-16

## Context

Detection must feel explainable rather than arbitrary. Abstract threat zones are faster to implement, but they risk making AAR feedback feel like the map punished the player without a concrete cause.

The product also needs three contact frames: friendly ambush, simultaneous detection, and ambushed. Those frames are easier to explain and test when detection comes from actual opposing entities in world state.

## Decision

Use explicit opposing units from Phase 1.

Opposing units are simple world entities with position, posture, facing, field of view, cover/concealment context, detection probability, and minimal behavior. They can observe, become alerted, move into cover, and create abstract return-fire/contact-pressure events.

Return fire is modeled abstractly. Phase 1 must not introduce detailed weapon simulation, ballistics, ammunition modeling, or doctrine-heavy behavior.

## Simple Enemy Heuristics

Phase 1 opposing units should support:

- scan field of view
- probabilistically detect visible player units
- become alerted when detection/contact occurs
- move to nearby cover if exposed
- orient toward perceived contact
- produce abstract return-fire/contact-pressure events when alerted and oriented
- emit events that can be replayed in AAR

## Consequences

This increases Phase 1 scope, but it improves explainability. The AAR can point to a real observer, line of sight, posture, cover/concealment, and probability factors.

Tests must cover enemy observation, detection probability inputs, alert transitions, cover-seeking heuristics, abstract return-fire events, and deterministic replay from the event log.

