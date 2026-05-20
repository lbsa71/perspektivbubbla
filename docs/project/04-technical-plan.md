# Technical Plan

## Current Stack

- TypeScript across core, server, and browser client.
- Node-based backend API for authoritative sessions.
- WebSocket session channel for realtime commands and projections.
- Shared/headless simulation core.
- Static browser client served by Vite.
- SVG-rendered pointy-top hex map.
- Client state limited to view/input state.
- In-memory session/event state initially, with the code shaped so durable storage can replace it later.
- Event-sourced session log from the first implementation slice.
- JSON-based scenarios remain planned, but are not yet the current scenario source.

## Core Architecture Principle

Separate actual world state from perceived state.

The backend owns the truth. The simulation core applies rules to backend-held state. The player UI receives only a role-filtered perceived projection and sends commands back to the backend. The AAR records enough information to compare actual state and perceived state afterward.

See [ADR 0001](../adr/0001-backend-state-store-and-headless-core.md), [ADR 0002](../adr/0002-realtime-websocket-and-event-sourced-sessions.md), and [ADR 0003](../adr/0003-explicit-opposing-observer-units.md) for accepted architecture decisions.

## Runtime Boundaries

- **Core simulation:** pure or near-pure TypeScript modules for movement, facing, perception, exposure, events, and AAR inputs.
- **Backend:** owns sessions, WebSocket connections, command handling, simulated time, event storage, and role-filtered projections.
- **Client:** renders projections in a dumb terminal-style interface, handles pan/zoom/input, sends commands, and displays AAR output.

The client must not directly mutate game state or duplicate game rules.

## Current Implementation Notes

The prototype has moved beyond the original one-soldier slice. The current core supports both a one-soldier scenario and a group commander scenario. The group commander scenario contains 8 friendly soldiers: grpc, stf grpc, and two tät.

Important current constraints:

- True map coordinates are the source of truth for unit position, direction vectors, formation slots, and advance targets.
- Hex coordinates are derived for pathing, occupancy, terrain lookup, visibility projection, and rendering.
- Formation orders and forward movement are separate concepts. A formation order means "get into this formation"; `framåt` means "prepare to advance using the current or supplied formation and direction"; `halt` stops the group.
- Communication mode is a modifier on an order, not an action by itself.
- Voice and gesture exist in the core. Radio is still planned.
- The grpc must remain an embodied soldier. Group advance should be driven by the player's normal click-movement through terrain after `framåt`, not by a detached group autopilot.
- No two soldiers may occupy the same hex at the same time.
- Soldiers may route around each other while reforming, but must preserve formation-neighbour cohesion while advancing.
- Visibility uses the soldier's true position and fades recently seen hexes before they become unknown again.

```ts
type WorldState = {
  units: Unit[];
  events: GameEvent[];
  activeFormation?: FormationState;
};

type PerceivedState = {
  visibleUnits: PerceivedUnit[];
  lastKnownUnits: LastKnownUnit[];
  heardEvents: HeardEvent[];
  visibleHexes: HexCoord[];
};
```

## Core Modules

1. `SessionStore`
2. `EventStore`
3. `EventProjector`
4. `RealtimeGateway`
5. `CommandHandler`
6. `SimulationClock`
7. `HexMap`
8. `UnitModel`
9. `OpposingUnitSystem`
10. `DetectionSystem`
11. `PerceptionSystem`
12. `MovementSystem`
13. `CommunicationSystem`
14. `OrderSystem`
15. `FormationSystem`
16. `CohesionSystem`
17. `EventSystem`
18. `ScenarioRunner`
19. `AARRecorder`
20. `AARViewer`

## Game State

```ts
type GameState = {
  time: number;
  map: HexTile[];
  units: Unit[];
  playerRole: "soldier" | "leader";
  selectedUnitId: string;
  scenario: Scenario;
  events: GameEvent[];
  orders: Order[];
  perception: PerceptionState;
  aar: AARRecord;
};
```

## Event Sourcing

The append-only event log is the authoritative session history. World state, perceived state, AAR summaries, and future instructor views should be projections from events.

```ts
type DomainEvent = {
  id: string;
  sessionId: string;
  sequence: number;
  time: number;
  type: string;
  payload: unknown;
};
```

The current foundation should record at least:

- session started
- scenario generated
- command accepted/rejected
- movement started/interrupted/completed
- facing/look changed
- posture changed
- field of view refreshed
- perceived information aged
- exposure sampled
- opposing unit observed/scanned
- probabilistic detection resolved
- opposing unit alerted
- opposing unit moved to cover
- abstract return-fire/contact-pressure event emitted
- objective succeeded/failed/transitioned
- formation order issued
- order delivery resolved, including relay sender and failure reason
- formation movement assigned
- formation advance started
- group halted
- movement waiting, including cohesion or separation reason

The first event store can be in memory, but it must sit behind interfaces that make durable storage pluggable later.

## Command Model

Player interaction should be modeled as commands submitted to the backend:

```ts
type PlayerCommand =
  | {
      type: "move_to_hex";
      unitId: string;
      target: HexCoord;
      issuedAt: number;
    }
  | {
      type: "face_direction";
      unitId: string;
      direction: Direction;
      issuedAt: number;
    }
  | {
      type: "look_direction";
      unitId: string;
      direction: Direction;
      issuedAt: number;
    }
  | {
      type: "set_posture";
      unitId: string;
      posture: "standing" | "crouched" | "prone";
      issuedAt: number;
    }
  | {
      type: "issue_formation_order";
      unitId: string;
      target: HexCoord;
      formation: Formation;
      communication: CommunicationMethod;
      direction?: Direction;
      directionTarget?: HexCoord;
      directionTargetPoint?: MapPoint;
      issuedAt: number;
    }
  | {
      type: "issue_forward_order";
      unitId: string;
      formation: Formation;
      communication: CommunicationMethod;
      direction?: Direction;
      directionTarget?: HexCoord;
      directionTargetPoint?: MapPoint;
      issuedAt: number;
    }
  | {
      type: "halt_group";
      unitId: string;
      issuedAt: number;
    };
```

For the one-soldier loop, a movement click starts moving toward the selected hex. New movement, posture, or body-facing commands interrupt current movement. Look/sweep commands refresh field of view without interrupting movement, unless the sweep crosses the body-orientation threshold and becomes an orientation change. The UI should not compute or own pathfinding rules.

The player may click any target hex. The backend owns pathing and computes a simple nearest path. If the path hits an obstacle, movement stops and the event log records why.

For the group-commander loop, formation and movement must remain explicit:

- `issue_formation_order` assigns formation slots and starts reformation only.
- `issue_forward_order` may first form up, then arms an advance state along the indicated true-map bearing.
- `halt_group` interrupts received group movement.
- `communication` controls propagation and reliability; it must not initiate behavior by itself.
- `directionTargetPoint` is preferred when available so true map bearings do not collapse into hex-axis approximations.
- Once advance is armed, the player still moves the grpc with ordinary movement clicks. Followers derive their desired positions from the embodied grpc, the formation direction, their element/position, and neighbour cohesion. If the grpc stops, nearby soldiers should stop for the same cohesion reasons they would stop for any other formation neighbour.

## Simulated Realtime

- Server-owned clock.
- Initial tick rate: 5-10 simulation ticks per second.
- Client renders latest projections but does not own simulation time.
- Standing movement: 1 hex/second before terrain modifiers.
- Crouched movement: 0.6 hex/second before terrain modifiers.
- Prone movement: 0.25 hex/second before terrain modifiers.
- Terrain movement cost divides effective movement rate.

## Map Scale

- Current target scale: 3 meters per hex.
- A 300x300 meter scenario map is therefore roughly 100x100 hexes.
- Important scenario markers should be static.
- Surrounding terrain should be deterministic generated content.

## Opposing Unit and Detection Model

Detection should remain probabilistic in the current foundation. Inputs should include exposure, cover, concealment, posture, line of sight, and opposing-unit observer state.

Threats are explicit opposing units. They should support simple heuristics only:

- scan field of view
- probabilistically detect visible player units
- become alerted on detection/contact
- move to nearby cover when exposed
- orient toward perceived contact
- emit abstract return-fire/contact-pressure events

Return fire must remain abstract. It should drive pressure, exposure, scenario state, and AAR, not detailed weapons simulation.

## Group Orders and Formation Movement

Group orders are first-class domain events, not UI conveniences. The core should keep enough information to explain which soldier received an order, who relayed it, why it failed, and which movement motivation caused a soldier to move or wait.

Current order model:

- Formation order: assigns local formation targets around the group.
- Forward order: uses the current or supplied formation, forms up if needed, then arms group advance along a true-map bearing.
- Halt order: stops every friendly soldier that received it.
- Communication mode: currently voice or gesture; radio remains planned.

Current formation model:

- A group has 8 friendly soldiers.
- grpc and stf grpc stay close.
- The rest of the group is split into `tat_1` and `tat_2`.
- Each soldier has an element and element position.
- Formations produce true-coordinate offsets that are later snapped to passable hex targets.
- During advance, soldiers resolve several motivations: embodied grpc position and movement intent, assigned slot, formation center, advance direction, neighbours, occupied hexes, and terrain/pathing.
- The grpc participates in cohesion like any other soldier. Being the commander gives the player authority to issue orders, not exemption from movement, terrain, or neighbour tempo.

Design rule: the no-shared-hex invariant is absolute for actual soldier positions. Movement planning may consider crossing/route-around behavior, but committed world state must never place two soldiers in the same hex.

## Future Observer Client

The current prototype does not need a separate observer/instructor client. It should still keep projections role-scoped so an observer projection can be added later if the MVP bears fruit.

## Minimal TypeScript Data Model

```ts
type HexCoord = { q: number; r: number };

type TerrainType = "field" | "grass" | "forest" | "ditch" | "wall" | "road";

type HexTile = {
  coord: HexCoord;
  terrain: TerrainType;
  moveCost: number;
  cover: 0 | 1 | 2 | 3;
  concealment: 0 | 1 | 2 | 3;
  blocksSight: boolean;
  exposure: 0 | 1 | 2 | 3;
};

type Direction = "N" | "NE" | "SE" | "S" | "SW" | "NW";
type MapPoint = { x: number; y: number };
type Formation = "column" | "line" | "file" | "wedge" | "dispersed" | "regroup";
type CommunicationMethod = "voice" | "gesture" | "radio";
type GroupElement = "command" | "tat_1" | "tat_2";

type Unit = {
  id: string;
  name: string;
  side: "friendly" | "opposing";
  role: "leader" | "deputy_leader" | "soldier" | "observer";
  element?: GroupElement;
  elementPosition?: number;
  position: MapPoint;
  coord: HexCoord;
  facing: Direction;
  lookDirection?: Direction;
  health: number;
  stamina: number;
  stress: number;
  posture: "standing" | "crouched" | "prone" | "moving" | "helping" | "injured";
  status: string[];
  currentOrderId?: string;
};

type FormationState = {
  orderId: string;
  orderKind: "formation" | "forward";
  phase?: "forming" | "advancing";
  formation: Formation;
  target: HexCoord;
  targetPoint: MapPoint;
  advanceTarget?: HexCoord;
  advanceTargetPoint?: MapPoint;
  direction: Direction;
  directionVector?: MapPoint;
  communication: CommunicationMethod;
  issuedAt: number;
};

type PerceivedUnit = {
  unitId: string;
  perceivedCoord: HexCoord;
  lastSeenAt: number;
  confidence: "high" | "medium" | "low";
  visibleStatus?: "ok" | "possibly_injured" | "injured" | "unknown";
};

type HeardEvent = {
  id: string;
  time: number;
  approximateDirection: Direction;
  clarity: "clear" | "partial" | "muffled";
  text?: string;
};

type Order = {
  id: string;
  time: number;
  issuerId: string;
  receiverIds: string[] | "all";
  action:
    | "move"
    | "halt"
    | "take_cover"
    | "change_formation"
    | "face"
    | "help_injured"
    | "move_injured"
    | "report"
    | "regroup";
  targetCoord?: HexCoord;
  direction?: Direction;
  communication: CommunicationMethod;
};

type AAREvent = {
  time: number;
  type: string;
  worldDescription: string;
  perceivedBy: Record<string, string>;
};
```

## Core Code Policy

- Put deterministic simulation logic in framework-independent modules.
- Keep rendering, input, and UI state separate from simulation rules.
- Keep backend state mutation behind command handling and state-store interfaces.
- Treat events as the source of truth; projections are rebuildable.
- Inject time/randomness when needed so tests can be deterministic.
- Log domain events as they happen so AAR does not have to reconstruct truth from UI state.
- Prefer explicit data transformations over hidden mutation.
- Keep scenario fixtures small, named, and easy to inspect.
- Do not encode exact tactical or medical instruction beyond the abstract training scope in the product brief.

## Implemented Vertical Slice

The implemented foundation now includes:

1. Backend session creation and in-memory authoritative state.
2. WebSocket command/projection channel.
3. Event-sourced session log with deterministic projections.
4. One-soldier scenario with position, true position, facing, look direction, posture, and movement.
5. Group commander scenario with 8 friendly soldiers, grpc/stf grpc, and two tät.
6. 100x100 map with viewport pan/zoom at 3 meters per hex.
7. Hybrid map generation with static markers and deterministic generated terrain.
8. Explicit opposing observer units with simple heuristics.
9. Click-issued movement commands to any target hex, with backend-owned nearest pathing.
10. Formation orders, forward orders, halt, regroup, and basic voice/gesture propagation.
11. True-bearing direction targeting before snapping to hex pathing.
12. Collision-aware reformation with no shared friendly hexes.
13. Formation advance with neighbour cohesion.
14. Immediate field-of-view update with perceived information aging over time.
15. Probabilistic detection and abstract contact-pressure events.
16. Minimal AAR/event summary projected from the event log.

## Next Technical Slice

The next slice should make group command robust enough to become the base scenario loop:

1. Add radio to the core command model.
2. Record and expose full command propagation chains.
3. Add command delay, missed order, and stale-order diagnostics.
4. Rework group advance so `framåt` arms formation following around the embodied grpc, while grpc terrain movement still comes from player clicks.
5. Expand movement motivation tests for sharp turns, re-forming, terrain, grpc stops, and neighbour catch-up.
6. Add risk/effect zones and friendly blocking.
7. Add perceived status, shouts, and report events.
8. Move scenarios to JSON fixtures.
9. Upgrade AAR from event feed to actual/perceived/commanded replay.
