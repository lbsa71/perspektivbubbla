# Roadmap

This roadmap reflects the prototype as of 2026-05-20. The original plan treated group command and communication as a later phase, but the working slice now already contains a tested group commander sandbox. Future phases should therefore harden the group-command model instead of returning to a strictly one-soldier progression.

## Current Implementation Snapshot

Implemented enough to treat as foundation:

- Backend-authoritative session state with command handling in the TypeScript core.
- Event-sourced session history and deterministic replay projection.
- WebSocket command/projection channel.
- Vite-served browser client that renders backend projections and sends commands.
- 100x100 hex map at 3 meters per hex.
- True map coordinates as the source of truth for unit position, direction, formation targeting, and movement; hexes are the pathing/rendering/data layer.
- Full-grid map projection so non-visible cells remain clickable.
- Visibility memory that fades recently seen cells before they return to unknown.
- One-soldier movement, facing, look/sweep, posture, exposure, detection, and contact-pressure events.
- Explicit opposing observer units with simple scan/alert/cover/orient behavior.
- Group commander scenario with 8 friendly soldiers: grpc, stf grpc, and two tät.
- Formation orders for line, file, column, wedge, dispersed, and regroup.
- `framåt` and `halt` as explicit group movement commands.
- Voice and gesture as communication modes for command propagation.
- Soldier-level order delivery events, including relays through neighbours.
- Two-phase forward movement: form up, then advance.
- Hard invariant that no two soldiers occupy the same hex at the same time.
- Collision-aware reformation around occupied friendly hexes.
- Cohesion checks so soldiers wait when formation neighbours lag or separate.
- Minimal commander UI with hover panels, direction marker, and formation diagnostics.
- Tests for group order delivery, formation slots, no shared hexes, true-bearing movement, halt, no-halt turns, neighbour cohesion, projections, replay, and WebSocket behavior.

Still missing or incomplete:

- Radio is not modeled in the core.
- Risk/effect zones and friendly blocking are not implemented.
- Shout/report/status uncertainty is not yet a real information system.
- Injury and buddy aid are not implemented.
- AAR is still a minimal event summary rather than an instructive replay.
- Scenario content is not yet JSON-authored.
- Difficulty modes are not implemented.
- The grpc is not yet fully treated as an embodied soldier for group advance: `framåt` should set formation intent, but the player should still click-move the grpc through terrain.
- The group movement model works, but still needs play-feel hardening around turns, command delay, terrain, and neighbour motivation.

## Phase 1: Foundation and Group Commander Sandbox

### Purpose

Establish the final architectural shape and a playable command sandbox: backend-held truth, headless simulation, event log, dumb rendering client, one-soldier basics, and an initial group commander view.

### Status

Mostly implemented. Keep this phase open only for defects that threaten the foundation.

### Included Features

- Backend session with authoritative game state.
- WebSocket command/projection channel.
- Event-sourced session log.
- Headless core for movement, facing, perception, opposing units, exposure, orders, and AAR inputs.
- Dumb operational UI that renders projections and sends commands.
- Scrollable/zoomable pointy-top hex map.
- 100x100 map at 3 meters per hex.
- Click-issued movement and orientation commands.
- Backend-owned pathing and simulated realtime movement.
- Terrain movement cost and cover/concealment values.
- Opposing observer units, probabilistic detection, and abstract contact pressure.
- Field of view and fading visibility memory.
- Group commander scenario with 8 friendly soldiers.
- Basic formation orders, `framåt`, `halt`, voice/gesture propagation, and regroup.

### Exit Criteria

- Client can be replaced without changing core game logic.
- Backend command/state transitions are covered by tests.
- Event log can rebuild the same final projection deterministically.
- A commander can issue a formation, set direction, order `framåt`, and stop with `halt`.
- No two soldiers can occupy the same hex.
- A no-halt turn propagates to both tät and does not make soldiers walk backwards just to satisfy a stale formation center.

## Phase 2: Group Command and Formation Fidelity

### Purpose

Turn the group commander sandbox into a believable, inspectable command-and-movement loop.

### Features

- Treat communication mode as a modifier only; voice/gesture/radio must never initiate action by themselves.
- Keep the command grammar explicit:
  - set communication mode
  - set direction reference
  - choose formation
  - issue `framåt`
  - issue `halt`
- Add radio as a core communication mode with its own range/reliability assumptions.
- Make every soldier repeat relevant commands so command propagation is visible and debuggable.
- Model delayed, missed, repeated, and stale command reception.
- Treat the grpc as a soldier first and a commander second:
  - the player still click-moves the grpc through terrain
  - `framåt` authorizes/sets the formation's advance intent and direction, but does not create a detached autopilot to the map edge
  - soldiers maintain formation relative to the moving grpc and their neighbours
  - if the grpc stops, the soldiers behind/alongside stop for the same cohesion reasons they would stop for any other neighbour
- Keep grpc and stf grpc close while preserving two distinct tät chains.
- Preserve fixed soldier positions inside each tät.
- Improve motivated movement scoring:
  - assigned formation slot
  - embodied grpc position and movement intent
  - current and future formation center
  - advance direction
  - neighbour distance
  - neighbour forward/behind tolerance
  - collision avoidance
  - terrain cost
- Allow soldiers to route around each other without violating the no-shared-hex invariant.
- Avoid unnecessary backwards movement during turns and re-forming.
- Add clearer diagnostics for stopped movement, missed orders, stale order ids, and cohesion waits.
- Keep the left panel minimal; move detail to soldier, map-cell, Unit, Group, Goal, and Orders hovers.

### Question

Does issuing and observing group orders feel understandable, tactical, and corrigible?

### Exit Criteria

- A player can form line, file, column, wedge, dispersed, and regroup without confusing side effects.
- `framåt` sets an advance intent in the indicated true-map bearing, but the player still navigates the grpc through terrain with normal movement clicks.
- `halt` immediately stops all friendlies that received the order.
- Turning while moving updates both tät through propagation.
- A soldier stops or slows when a neighbour, including the grpc, is too far behind, too far ahead, stopped, or has not received the same order.
- The event log can explain why a soldier moved, waited, missed an order, or stopped.
- Playtesters can predict what `gesture + direction + line + framåt` will do.

## Phase 3: Facing, Risk Zones, and Mutual Interference

### Purpose

Make direction and spacing matter beyond formation neatness.

### Features

- Show facing and look direction clearly.
- Add abstract risk/effect zones.
- Detect when a friendly soldier blocks another soldier's effect zone.
- Mark blocking clearly in training mode and subtly in normal mode.
- Log blocking and poor orientation in the AAR.
- Integrate risk/effect zones with formation spacing and movement.
- Add simple coverage checks for the two tät.

### Scenario

Scenario B: Two Soldiers and Group Line - Risk Zone and Blocking.

### Question

Do positioning, facing, and neighbour placement become intuitively important?

### Exit Criteria

- Player notices when friendlies block each other.
- AAR clearly shows when and why blocking happened.
- Player improves placement and orientation on a second attempt.

## Phase 4: Perspective Bubble, Reports, and Status Uncertainty

### Purpose

Turn limited perception from a visibility effect into the central decision problem.

### Features

- Perceived unit status separate from actual unit status.
- Last-known friendly positions with confidence and age.
- Sound events with approximate direction and clarity.
- Shouts and short reports as information events.
- Orders and reports that can be heard, misunderstood, delayed, missed, or relayed.
- Limited status display; no perfect omniscient roster.
- Training, normal, and realistic information modes.
- UI affordances for checking uncertainty without exposing hidden truth.

### Question

Does limited information feel interesting instead of merely frustrating?

### Exit Criteria

- Player understands why information is missing or stale.
- Player starts actively checking, gathering, reporting, or following up.
- AAR can compare actual state against perceived state at key moments.

## Phase 5: Injury and Buddy Aid

### Purpose

Introduce capacity loss, tempo loss, and follow-up pressure without becoming a medical simulator.

### Features

- A soldier can become injured.
- Injury is visible only to those who see, hear, or receive a report.
- Another soldier can help.
- Helping binds that soldier and changes movement tempo.
- Moving an injured soldier affects group tempo and cohesion.
- The group leader must remember, follow up, or explicitly delegate.
- AAR shows injury time, perception time, reporting path, and follow-up time.

### Scenario

Scenario C: Group Leader - Injured Soldier and Lost Situation Picture.

### Question

Does an injured soldier create useful cognitive load without overwhelming the prototype?

### Exit Criteria

- Player can lose or recover status awareness in a meaningful way.
- AAR shows a clear learning point.
- Player wants to replay to handle the injury better.

## Phase 6: v0.1 Scenario Package and Playtest Loop

### Purpose

Combine the mechanics into a testable proof of concept.

### Contents

- Scenario A: From Cover to Cover.
- Scenario B: Risk Zone and Blocking.
- Scenario C: Injured Soldier and Lost Situation Picture.
- Two roles: soldier and group leader.
- Three difficulty levels: training, normal, realistic.
- JSON-authored scenario content.
- Simple start screen.
- AAR with replay and key learning points.
- Regression test suite for each scenario's critical path.

### Question

Does the concept work as an educational game?

### Exit Criteria

- 5 test players can play without the developer beside them.
- At least 3 of 5 want to play again.
- At least 3 of 5 can name one concrete learning point.
- An experienced user judges the AAR as relevant.

## Current Focus Backlog

### Group Command

- Add radio to the command model, not only the UI.
- Persist and visualize command propagation per soldier.
- Make order delay and missed relay visible in hovers/AAR.
- Add command-id diagnostics to every movement wait/stop.
- Split "set direction" from "advance" everywhere in UI and tests.
- Rework `framåt` so it arms formation advance around the embodied grpc instead of issuing an autonomous long-range group move.

### Formation Movement

- Tune motivated movement weights for turns, re-forming, and neighbour catch-up.
- Make follower movement derive from the grpc's actual clicked movement path plus the formation direction.
- Add terrain-aware formation movement.
- Expand tests for 90-degree and 180-degree moving turns.
- Test each formation with both tät and grpc/stf grpc constraints.
- Keep true map coordinates as source of truth and hexes as pathing/rendering.

### UI and Feedback

- Keep always-visible left-panel information minimal.
- Move Unit, Group, Goal, Orders, soldier, and hex details into hovers.
- Show direction reference as a dotted true-bearing line.
- Show why a soldier is waiting without revealing hidden world truth in normal mode.
- Keep development diagnostics available through console logs and optional overlays.

### Scenario and AAR

- Move scenario definitions into JSON fixtures.
- Add replayable AAR projections from the event log.
- Add learning-point summaries for movement, orders, perception, and contact pressure.

## Priority Cut

### Must Have for v0.1

- Hex map and terrain.
- Soldier and group tokens.
- Facing/look direction.
- True-coordinate movement with hex pathing.
- Perspective bubble and information age.
- Cover/concealment and exposure.
- Group orders, formations, `framåt`, and `halt`.
- Voice/gesture/radio communication with relay/miss/delay.
- Risk/effect zone and friendly blocking.
- Injury and simplified buddy aid.
- AAR comparing actual, perceived, and commanded state.

### Should Have

- Training/normal/realistic information modes.
- Sound and shout clarity.
- Last-known friendly confidence.
- Formation diagnostics and replay overlays.
- Scenario JSON validation.

### Can Wait

- Advanced enemy AI.
- Detailed weapons or ballistics.
- Detailed medical instruction.
- Inventory.
- Campaign.
- Multiplayer.
- Scenario editor.
