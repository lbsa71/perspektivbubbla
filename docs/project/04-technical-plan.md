# Technical Plan

## Recommended Stack

- React or Next.js
- TypeScript
- SVG or Canvas for the hex map
- Node-based backend API for authoritative sessions
- Shared/headless simulation core
- Client state limited to view/input state
- JSON-based scenarios
- In-memory backend store initially, behind a replaceable state-store interface

## Core Architecture Principle

Separate actual world state from perceived state.

The backend owns the truth. The simulation core applies rules to backend-held state. The player UI receives only a role-filtered perceived projection and sends commands back to the backend. The AAR records enough information to compare actual state and perceived state afterward.

See [ADR 0001](../adr/0001-backend-state-store-and-headless-core.md) for the accepted architecture decision.

## Runtime Boundaries

- **Core simulation:** pure or near-pure TypeScript modules for movement, facing, perception, exposure, events, and AAR inputs.
- **Backend:** owns sessions, command handling, simulated time, state storage, and role-filtered projections.
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
2. `CommandHandler`
3. `SimulationClock`
4. `HexMap`
5. `UnitModel`
6. `PerceptionSystem`
7. `MovementSystem`
8. `CommunicationSystem`
9. `OrderSystem`
10. `EventSystem`
11. `ScenarioRunner`
12. `AARRecorder`
13. `AARViewer`

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

## Command Model

Player interaction should be modeled as commands submitted to the backend:

```ts
type PlayerCommand =
  | {
      type: "move_to_adjacent_hex";
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
      type: "set_posture";
      unitId: string;
      posture: "standing" | "crouched" | "prone";
      issuedAt: number;
    };
```

For Phase 1, movement requires repeated player intent. Clicking a far destination should not autopilot the soldier across the map.

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
  role: "leader" | "soldier";
  coord: HexCoord;
  facing: Direction;
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
- Inject time/randomness when needed so tests can be deterministic.
- Log domain events as they happen so AAR does not have to reconstruct truth from UI state.
- Prefer explicit data transformations over hidden mutation.
- Keep scenario fixtures small, named, and easy to inspect.
- Do not encode exact tactical or medical instruction beyond the abstract training scope in the product brief.

## First Vertical Slice

The first implementation slice should include:

1. Backend session creation and in-memory authoritative state.
2. One soldier with position and facing.
3. A larger Scenario A map with viewport pan/zoom, representing roughly 300x300 meters.
4. Click-issued adjacent movement commands.
5. Explicit facing/orientation commands.
6. Terrain movement cost and movement rate over simulated time.
7. Cover/concealment/posture-aware exposure logging.
8. Difficulty-dependent display of terrain/protection hints.
9. Immediate field-of-view update with perceived information aging over time.
10. A minimal AAR summary showing route and exposure.

This slice should be production-tested before adding group movement, communication, injury, or advanced perception.
