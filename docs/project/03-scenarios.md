# Scenarios

## Scenario A: Soldier - From Cover to Cover

### Purpose

Validate whether micro-movement with a perspective bubble is interesting and understandable.

### Setup

- One soldier.
- Hex map large enough to represent roughly 300x300 meters.
- At 3-5 meters per hex, this implies roughly 60-100 hexes across depending on final scale.
- The player view should support pan/zoom instead of showing the full map at once.
- Start behind cover.
- Goal at another cover position.
- Intermediate field with varied cover and concealment.

### Events

- The player starts moving.
- Sound or observation is triggered.
- The player becomes "detected" if exposure is too high.
- The player must choose the nearest reasonable cover/concealment.

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
