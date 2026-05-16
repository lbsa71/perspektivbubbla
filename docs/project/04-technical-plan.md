# Technical Plan

## Recommended Stack

- React or Next.js
- TypeScript
- SVG or Canvas for the hex map
- Zustand or reducer-based state management
- JSON-based scenarios
- No server for the first proof of concept

## Core Architecture Principle

Separate actual world state from perceived state.

The simulation owns the truth. The player UI receives only a role-filtered perceived state. The AAR records enough information to compare the two afterward.

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

1. `HexMap`
2. `UnitModel`
3. `PerceptionSystem`
4. `MovementSystem`
5. `CommunicationSystem`
6. `OrderSystem`
7. `EventSystem`
8. `ScenarioRunner`
9. `AARRecorder`
10. `AARViewer`

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
- Inject time/randomness when needed so tests can be deterministic.
- Log domain events as they happen so AAR does not have to reconstruct truth from UI state.
- Prefer explicit data transformations over hidden mutation.
- Keep scenario fixtures small, named, and easy to inspect.
- Do not encode exact tactical or medical instruction beyond the abstract training scope in the product brief.

## First Vertical Slice

The first implementation slice should include:

1. A tiny static hex map.
2. One soldier with position and facing.
3. Click-to-move or step movement.
4. Terrain movement cost.
5. Cover/concealment values.
6. Exposure logging.
7. A minimal AAR summary showing route and exposure.

This slice should be production-tested before adding group movement, communication, injury, or advanced perception.

