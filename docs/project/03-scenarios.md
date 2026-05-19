# Scenarios

## Scenario A: Soldier - From Cover to Cover

### Purpose

Validate whether micro-movement with a perspective bubble is interesting and understandable.

### Setup

- One soldier.
- Hex map large enough to represent roughly 300x300 meters.
- At 3 meters per hex, this implies roughly 100 hexes across.
- The player view should support pan/zoom instead of showing the full map at once.
- Start behind cover.
- Goal at another cover position.
- Intermediate field with varied cover and concealment.

### Events

- The player starts moving.
- Sound or observation is triggered.
- The player can be detected probabilistically by explicit opposing observer units based on exposure, cover, concealment, posture, and line of sight.
- The player must choose the nearest reasonable cover/concealment.
- Detection consequences depend on the active objective.

### Measurement

- time exposed
- number of steps in open terrain
- choice of cover versus concealment
- unnecessary facing changes
- final position

### AAR

Shows:

- best alternative route
- exposure curve
- chosen cover positions
- time in critical exposure

### Contact Frames

The first scenario family should support three contact frames:

1. **Friendly ambush:** friendly side observes first and the player tries to preserve initiative.
2. **Simultaneous detection:** both sides detect at roughly the same time and the player must improvise immediately.
3. **Ambushed:** opposing units observe first and the player starts from disadvantage.

### Outcome Transitions

Failure should not always end the session. If a stealth objective fails because the player is detected, the scenario can transition into a new objective such as saving the situation. That objective can then succeed, fail, or transition into retreat. The AAR should explain the chain instead of only showing a binary win/loss.

Scenario JSON should define core objectives and important static markers. Transitory objectives are implicit and arise from player choices and scenario state rather than being exhaustively authored as a state machine.

## Scenario B: Two Soldiers - Risk Zone and Blocking

### Purpose

Validate visualization of facing, effect/risk cone, and friendly blocking.

### Setup

- Two soldiers.
- Simple map with cover.
- Soldiers should move forward without blocking each other.

### Events

- One soldier changes direction.
- The other ends up in the risk zone.
- The player must adjust movement/facing.

### Measurement

- time with blocked effect
- distance between soldiers
- exposure
- whether both reach cover

### AAR

Shows:

- cones over time
- when a teammate blocked effect
- better positioning alternatives

## Scenario C: Group Leader - Injured Soldier and Lost Situation Picture

### Purpose

Validate the main concept: leading a group with limited information.

### Setup

- Group leader plus 4 soldiers.
- Terrain with forest edge, field, ditch, and road.
- Mission: move the group from A to B.

### Event Chain

1. The group moves in formation.
2. Unclear observation or contact appears front/left.
3. One soldier is injured or immobilized.
4. Another soldier shouts and starts helping.
5. The group leader does not see the whole situation.
6. A new possible route is discovered.
7. The player must choose: continue, gather, report, regroup, help, or break.

### Measurement

- mission progress
- group cohesion
- time with unknown status
- orders that arrived
- injured soldier handled/followed up
- risk-zone blocking
- exposure
- lost contact

### AAR

Shows:

- actual sequence of events
- leader's perceived sequence of events
- who heard/sent information
- how long Andersson's status was unknown
- which orders were missed
- when the group split
- consequences of continuing or stopping

## Scenario Design Principles

- Each scenario should be short enough to replay immediately.
- Each scenario should isolate one or two learning mechanics before combining them.
- Every scenario must produce an AAR with at least three concrete observations.
- Scenario content should be stored as JSON once implementation begins.
- Scenarios should remain procedural and perception-focused, not detailed tactical doctrine.
- Important markers and objectives should be static, while surrounding terrain can be generated deterministically.

## Threat Model

Threats are explicit opposing units in world state. They have position, facing, posture, field of view, detection probability, and simple heuristics. In Phase 1 they can observe, become alerted, move into cover, orient toward contact, and create abstract return-fire/contact-pressure events.

Scenario JSON should place important opposing-unit markers. Surrounding terrain can still be generated deterministically.
