# Roadmap

## Phase 1: Hex Map and One Soldier

### Purpose

Create playable realtime micro-movement on the final architectural shape: backend-held state, headless simulation logic, and a dumb rendering client.

### Features

- Backend session with authoritative game state.
- WebSocket command/projection channel.
- Event-sourced session log from the start.
- In-memory event store behind pluggable service/provider/repository interfaces.
- Headless core for movement, facing, perception, opposing units, exposure, and AAR events.
- Dumb terminal-style UI that renders projections and sends commands.
- Render scrollable/zoomable pointy-top hex map.
- Map scale large enough to represent roughly 300x300 meters, or about 100 hexes across at 3 meters per hex.
- Click any target hex to start moving toward it.
- Backend-owned simple nearest pathing; stop if an obstacle blocks the path.
- New movement/orientation/posture commands interrupt current movement.
- Simulated realtime movement rate at 5-10 ticks/second.
- Terrain with movement cost.
- Cover/concealment values.
- Cover/concealment/posture-aware exposure calculation.
- Explicit opposing observer units.
- Simple opposing-unit heuristics: observe, alert, move to cover, orient toward contact, and emit abstract return-fire/contact-pressure events.
- Automatic facing from movement.
- Free mouse and keyboard look/sweep, with sweeps over 90 degrees bleeding into orientation change.
- Explicit orientation changes while stationary or in cover.
- Immediate FOV update from orientation.
- Perceived information withers over time.
- Difficulty-dependent terrain/protection hints.
- AAR with route and exposure.
- Probabilistic detection.
- Objective transition after detection or failure.
- Role-scoped projections that prepare for a future observer/instructor client without implementing one in Phase 1.

### Scenario

Scenario A: From Cover to Cover.

### Question

Is it fun and understandable to choose a route between cover under uncertainty?

### Exit Criteria

- Player makes meaningful route choices.
- Player understands cover versus concealment after AAR.
- Scenario can be replayed in under 5 minutes.
- Client can be replaced without changing core game logic.
- Backend command/state transitions are covered by tests.
- Opposing-unit detection and simple behavior are covered by tests.
- Event log can rebuild the same final projection deterministically.

## Phase 2: Facing and Risk Zone

### Purpose

Validate whether the risk/effect cone creates learning.

### Features

- Show facing.
- Show risk/effect zone.
- Two soldiers.
- Detect friendly soldier in risk zone.
- Mark blocking in training mode.
- Log blocking in AAR.

### Scenario

Scenario B: Two Soldiers - Risk Zone and Blocking.

### Question

Do positioning and direction become intuitively important?

### Exit Criteria

- Player notices that soldiers can block each other.
- AAR clearly shows when and why.
- Player improves on the second attempt.

## Phase 3: Perception and Information Age

### Purpose

Build the key mechanic: the perspective bubble as a real system.

### Features

- Visible hexes.
- Last known positions.
- Information age.
- Sound events with direction.
- Limited status display.
- Toggle between training and normal.

### Question

Does limited information feel interesting instead of merely frustrating?

### Exit Criteria

- Player understands why information is missing.
- Player starts actively checking and following up.
- Player accepts uncertainty as a game mechanic.

## Phase 4: Orders and Communication

### Purpose

Make the group-leader role playable.

### Features

- Group leader plus 3-4 soldiers.
- Orders to everyone or individuals.
- Voice orders with range.
- Visual orders with sight requirements.
- Orders can be missed or delayed.
- Received orders affect soldier behavior.
- AAR shows order flow.

### Question

Does communication become a meaningful challenge?

### Exit Criteria

- Player notices that orders are not magic.
- Player starts gathering, checking, or choosing communication method.
- AAR shows missed/delayed orders clearly.

## Phase 5: Injury and Buddy Aid

### Purpose

Introduce capacity loss and need for follow-up.

### Features

- A soldier can be injured.
- Injury is visible only to those who see, hear, or receive a report.
- Another soldier can help.
- Help binds that soldier.
- Moving injured affects tempo.
- Group leader must remember/follow up.
- AAR shows time to follow-up.

### Scenario

Scenario C: Group Leader - Injured Soldier and Lost Situation Picture.

### Question

Does an injured soldier create relevant cognitive load without becoming too much?

### Exit Criteria

- Player loses or follows up status in a meaningful way.
- AAR shows a clear learning point.
- Player wants to replay to handle the injury better.

## Phase 6: First Complete v0.1

### Purpose

Combine all mechanics into a testable proof of concept.

### Contents

- 3 scenarios.
- 2 roles: soldier and group leader.
- 3 difficulty levels: training, normal, realistic.
- AAR with replay.
- Simple start screen.
- JSON scenario files.

### Question

Does the concept work as an educational game?

### Exit Criteria

- 5 test players can play without the developer beside them.
- At least 3 of 5 want to play again.
- At least 3 of 5 can name one concrete learning point.
- An experienced user judges the AAR as relevant.

## Implementation Priorities

### Must Have

- hex map
- soldier tokens
- facing
- terrain
- movement
- perspective bubble
- information age
- cover/concealment
- simple order
- simple AAR

### Should Have

- risk zone
- blocked effect
- injury
- shout/hearing
- last known positions
- training/normal mode

### Can Wait

- radio
- advanced enemy
- AI behavior
- multiple weapon types
- inventory
- campaign
- multiplayer
- scenario editor

## First Backlog

### Epic 1: Hex Map

- Create hex grid.
- Render terrain.
- Click hex.
- Show coordinates in debug.
- Import map from JSON.

### Epic 2: Soldier

- Render soldier token.
- Position.
- Facing.
- Movement.
- Posture.
- Simple internal status.

### Epic 3: Terrain and Movement

- Movement cost.
- Path preview.
- Stamina use.
- Cover/concealment values.
- Exposure calculation.

### Epic 4: Perspective Bubble

- Visible hexes.
- Fog outside bubble.
- Last known friendlies.
- Information age.
- Sound indicator.

### Epic 5: Risk Zone

- Facing cone.
- Show cone in training mode.
- Detect friendly in cone.
- Log blocking.

### Epic 6: Orders

- Order panel.
- Receiver.
- Action.
- Target hex.
- Communication method.
- Order reception.

### Epic 7: Injury

- Injury event.
- Limited visibility.
- Help injured.
- Move injured.
- Log time to follow-up.

### Epic 8: AAR

- Record events.
- Timeline.
- Replay.
- Show actual versus perceived.
- Learning points.
