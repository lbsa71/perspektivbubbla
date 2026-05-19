# Technical Plan

## Recommended Stack

- React or Next.js
- TypeScript
- SVG or Canvas for the hex map
- Node-based backend API for authoritative sessions
- WebSocket session channel for realtime commands and projections
- Shared/headless simulation core
- Client state limited to view/input state
- JSON-based scenarios
- In-memory backend event store initially, behind replaceable service/provider/repository interfaces
- Event-sourced session log from Phase 1

## Core Architecture Principle

Separate actual world state from perceived state.

The backend owns the truth. The simulation core applies rules to backend-held state. The player UI receives only a role-filtered perceived projection and sends commands back to the backend. The AAR records enough information to compare actual state and perceived state afterward.

See [ADR 0001](../adr/0001-backend-state-store-and-headless-core.md), [ADR 0002](../adr/0002-realtime-websocket-and-event-sourced-sessions.md), and [ADR 0003](../adr/0003-explicit-opposing-observer-units.md) for accepted architecture decisions.

## Runtime Boundaries

- **Core simulation:** pure or near-pure TypeScript modules for movement, facing, perception, exposure, events, and AAR inputs.
- **Backend:** owns sessions, WebSocket connections, command handling, simulated time, event storage, and role-filtered projections.
- **Client:** renders projections in a dumb terminal-style interface, handles pan/zoom/input, sends commands, and displays AAR output.

The client must not directly mutate game state or duplicate game rules.

```ts
type WorldState = {
  units: Unit[];
  events: GameEvent[];
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
15. `EventSystem`
16. `ScenarioRunner`
17. `AARRecorder`
18. `AARViewer`

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

Phase 1 should record at least:

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
    };
```

For Phase 1, a movement click starts moving toward the selected hex. New movement, posture, or body-facing commands interrupt current movement. Look/sweep commands refresh field of view without interrupting movement, unless the sweep crosses the body-orientation threshold and becomes an orientation change. The UI should not compute or own pathfinding rules.

The player may click any target hex. The backend owns pathing and computes a simple nearest path. If the path hits an obstacle, movement stops and the event log records why.

## Simulated Realtime

- Server-owned clock.
- Initial tick rate: 5-10 simulation ticks per second.
- Client renders latest projections but does not own simulation time.
- Standing movement: 1 hex/second before terrain modifiers.
- Crouched movement: 0.6 hex/second before terrain modifiers.
- Prone movement: 0.25 hex/second before terrain modifiers.
- Terrain movement cost divides effective movement rate.

## Map Scale

- Phase 1 target scale: 3 meters per hex.
- A 300x300 meter scenario map is therefore roughly 100x100 hexes.
- Important scenario markers should be static.
- Surrounding terrain should be deterministic generated content.

## Opposing Unit and Detection Model

Detection should be probabilistic in Phase 1. Inputs should include exposure, cover, concealment, posture, line of sight, and opposing-unit observer state.

Threats are explicit opposing units. They should support simple heuristics only:

- scan field of view
- probabilistically detect visible player units
- become alerted on detection/contact
- move to nearby cover when exposed
- orient toward perceived contact
- emit abstract return-fire/contact-pressure events

Return fire must remain abstract. It should drive pressure, exposure, scenario state, and AAR, not detailed weapons simulation.

## Future Observer Client

Phase 1 does not need a separate observer/instructor client. It should still keep projections role-scoped so an observer projection can be added later if the MVP bears fruit.

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

type Unit = {
  id: string;
  name: string;
  side: "friendly" | "opposing";
  role: "leader" | "soldier";
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
  communication: "voice" | "gesture" | "radio";
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

## First Vertical Slice

The first implementation slice should include:

1. Backend session creation and in-memory authoritative state.
2. WebSocket command/projection channel.
3. Event-sourced session log with deterministic projections.
4. One player soldier with position, facing, look direction, and posture.
5. A larger Scenario A map with viewport pan/zoom, representing roughly 300x300 meters at 3 meters per hex.
6. Hybrid map generation: static important markers and deterministic generated terrain.
7. Explicit opposing observer units with simple heuristics.
8. Click-issued movement commands to any target hex, with backend-owned simple nearest pathing.
9. Movement stops if the path hits an obstacle.
10. Free look/sweep through mouse and keyboard, with large sweeps bleeding into orientation change.
11. Explicit posture and orientation commands.
12. Terrain movement cost and movement rate over simulated time.
13. Probabilistic detection model driven by opposing units.
14. Abstract return-fire/contact-pressure events.
15. Cover/concealment/posture-aware exposure logging.
16. Difficulty-dependent display of terrain/protection hints.
17. Immediate field-of-view update with perceived information aging over time.
18. Objective transitions after detection/failure.
19. A minimal AAR summary projected from the event log.

This slice should be production-tested before adding group movement, communication, injury, or advanced perception.
