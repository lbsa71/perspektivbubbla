export type Direction = "N" | "NE" | "SE" | "S" | "SW" | "NW";
export type TerrainType = "field" | "grass" | "forest" | "ditch" | "wall" | "road";
export type Posture = "standing" | "crouched" | "prone" | "moving" | "helping" | "injured";
export type Side = "friendly" | "opposing";
export type Formation = "column" | "line" | "file" | "wedge" | "dispersed" | "regroup";
export type CommunicationMethod = "voice" | "gesture" | "radio";
export type UnitRole = "leader" | "deputy_leader" | "soldier" | "observer";
export type GroupElement = "command" | "tat_1" | "tat_2";
export type HexVisibility = "visible" | "memory" | "unknown";
export type FormationPhase = "forming" | "advancing";

export type HexCoord = {
  q: number;
  r: number;
};

export type MapPoint = {
  x: number;
  y: number;
};

export type MapVector = MapPoint;

export type HexTile = {
  coord: HexCoord;
  terrain: TerrainType;
  moveCost: number;
  cover: 0 | 1 | 2 | 3;
  concealment: 0 | 1 | 2 | 3;
  blocksSight: boolean;
  exposure: 0 | 1 | 2 | 3;
};

export type ProjectedHexTile = HexTile & {
  visibility: HexVisibility;
  lastSeenAt?: number;
  memoryAge?: number;
  memoryOpacity?: number;
};

export type InformationMode = "training" | "normal" | "realistic";

export type EffectZoneProjection = {
  unitId: string;
  facing: Direction;
  lookDirection: Direction;
  hexes: HexCoord[];
  blockedByUnitId?: string;
  blockedAt?: HexCoord;
  severity?: "low" | "medium" | "high";
};

export type FriendlyBlockingProjection = {
  unitId: string;
  blockingUnitId: string;
  coord: HexCoord;
  distanceHexes: number;
  severity: "low" | "medium" | "high";
  reason: "friendly_in_effect_zone";
};

export type CoverageCheckProjection = {
  element: GroupElement;
  covered: boolean;
  coveringUnitIds: string[];
  expectedDirection: Direction;
  reason?: "no_members" | "poor_orientation" | "blocked_effect_zone";
};

export type PerceivedUnitProjection = {
  unitId: string;
  name: string;
  side: Side;
  role: UnitRole;
  element?: GroupElement;
  elementPosition?: number;
  perceivedCoord?: HexCoord;
  visible: boolean;
  lastSeenAt?: number;
  age?: number;
  confidence: "high" | "medium" | "low" | "unknown";
  perceivedStatus: "ok" | "possibly_injured" | "injured" | "unknown";
  source: "visual" | "memory" | "report" | "roster";
};

export type HeardEventProjection = {
  id: string;
  time: number;
  kind: "order" | "movement" | "contact" | "report";
  sourceUnitId?: string;
  approximateDirection: Direction;
  clarity: "clear" | "partial" | "muffled";
  text: string;
};

export type ReportProjection = {
  id: string;
  time: number;
  sourceUnitId: string;
  kind: "status" | "movement_wait" | "blocking";
  message: string;
  coord: HexCoord;
  confidence: "high" | "medium" | "low";
};

export type UnitIntent =
  | { type: "idle" }
  | { type: "moving"; target: HexCoord; targetPoint: MapPoint; path: HexCoord[]; progress: number };

type PathOptions = {
  blocked?: Set<string>;
  allowTarget?: boolean;
  maxVisited?: number;
};

type ForwardFormationPlan = {
  phase: FormationPhase;
  advanceTarget: HexCoord;
  advanceTargetPoint: MapPoint;
};

export type Unit = {
  id: string;
  name: string;
  side: Side;
  role: UnitRole;
  element?: GroupElement;
  elementPosition?: number;
  position: MapPoint;
  coord: HexCoord;
  facing: Direction;
  lookDirection: Direction;
  health: number;
  stamina: number;
  stress: number;
  posture: Posture;
  status: string[];
  intent: UnitIntent;
  alerted: boolean;
  currentOrderId?: string;
};

export type GameMap = {
  width: number;
  height: number;
  hexSizeMeters: number;
  tiles: HexTile[];
  tilesByKey: Record<string, HexTile>;
};

export type WorldState = {
  id: string;
  seed: string;
  time: number;
  objective: ObjectiveState;
  map: GameMap;
  units: Unit[];
  unitsById: Record<string, Unit>;
  visibilityMemory: Record<string, Record<string, number>>;
  activeFormation?: FormationState;
};

export type FormationState = {
  orderId: string;
  orderKind: "formation" | "forward";
  phase?: FormationPhase;
  formation: Formation;
  target: HexCoord;
  targetPoint: MapPoint;
  advanceTarget?: HexCoord;
  advanceTargetPoint?: MapPoint;
  direction: Direction;
  directionVector?: MapVector;
  communication: CommunicationMethod;
  issuedAt: number;
};

export type ObjectiveState = {
  id: string;
  title: string;
  description: string;
  target: HexCoord;
  status: "active" | "succeeded" | "failed" | "transitioned";
};

export type DomainEvent = {
  id: string;
  sessionId: string;
  sequence: number;
  time: number;
  type: string;
  payload: Record<string, unknown>;
};

export type Session = {
  id: string;
  seed: string;
  events: DomainEvent[];
  world: WorldState;
};

export type PlayerCommand =
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

export type PhaseOneOverrides = {
  player?: Partial<Pick<Unit, "coord" | "facing" | "lookDirection" | "posture">>;
  opposing?: Array<Partial<Pick<Unit, "id" | "coord" | "facing" | "lookDirection" | "posture">>>;
  terrainPatches?: Array<{ coord: HexCoord; terrain: TerrainType }>;
};

export type CreateSessionOptions = {
  seed?: string;
  scenario?: "soldier" | "group_commander";
  overrides?: PhaseOneOverrides;
};

export type AdvanceOptions = {
  random?: () => number;
};

export type Projection = {
  sessionId: string;
  time: number;
  objective: ObjectiveState;
  activeFormation?: FormationState;
  map: {
    width: number;
    height: number;
    hexSizeMeters: number;
    visibleHexes: HexCoord[];
    tiles: ProjectedHexTile[];
  };
  player: Unit;
  units: Unit[];
  events: DomainEvent[];
  risk: {
    effectZones: EffectZoneProjection[];
    blocking: FriendlyBlockingProjection[];
    coverage: CoverageCheckProjection[];
  };
  perception: {
    informationMode: InformationMode;
    lastKnownUnits: PerceivedUnitProjection[];
    heardEvents: HeardEventProjection[];
    reports: ReportProjection[];
  };
  aar: {
    route: HexCoord[];
    exposureSamples: Array<{ time: number; unitId: string; exposure: number }>;
    contactEvents: DomainEvent[];
    blockingEvents: DomainEvent[];
    reportEvents: DomainEvent[];
    heardEvents: HeardEventProjection[];
  };
};

const DIRECTIONS: Record<Direction, HexCoord> = {
  N: { q: 0, r: -1 },
  NE: { q: 1, r: -1 },
  SE: { q: 1, r: 0 },
  S: { q: 0, r: 1 },
  SW: { q: -1, r: 1 },
  NW: { q: -1, r: 0 },
};

const DIRECTION_ORDER: Direction[] = ["N", "NE", "SE", "S", "SW", "NW"];
const HEX_CENTER_STEP = Math.sqrt(3);
const COHESION_MAX_FORWARD_LEAD = 1;
const COHESION_MAX_NEIGHBOUR_DISTANCE_HEXES = 3.25;
const FORMATION_READY_TOLERANCE_HEXES = 0.35;
const FORMATION_LINE_SPACING_HEXES = 1.25;
const FORWARD_TARGET_EDGE_MARGIN = 8;
const FORMATION_SLOT_WEIGHT = 4;
const FORMATION_CENTER_WEIGHT = 0.35;
const FORMATION_NEIGHBOUR_WEIGHT = 2.4;
const FORMATION_FORWARD_WEIGHT = 0.9;
const FORMATION_TERRAIN_WEIGHT = 0.4;
const VISIBILITY_MEMORY_SECONDS = 10;
const EFFECT_ZONE_RANGE_HEXES = 6;
const HEARD_EVENT_WINDOW_SECONDS = 12;

export function createPhaseOneSession(options: CreateSessionOptions = {}): Session {
  const seed = options.seed ?? "phase-one";
  const sessionId = `session_${hashString(seed).toString(16)}`;
  let sequence = 0;
  const initialWorld = buildInitialWorld(sessionId, seed, options.scenario ?? "soldier", options.overrides);
  const events: DomainEvent[] = [
    {
      id: `${sessionId}_${sequence}`,
      sessionId,
      sequence: sequence++,
      time: 0,
      type: "session_started",
      payload: { seed },
    },
    {
      id: `${sessionId}_${sequence}`,
      sessionId,
      sequence: sequence++,
      time: 0,
      type: "scenario_generated",
      payload: { world: clone(initialWorld) },
    },
  ];
  return {
    id: sessionId,
    seed,
    events,
    world: initialWorld,
  };
}

export function replayEvents(events: DomainEvent[]): Session {
  if (events.length === 0) {
    return createPhaseOneSession();
  }

  const scenario = events.find((event) => event.type === "scenario_generated");
  if (!scenario) {
    throw new Error("cannot replay session without scenario_generated event");
  }

  let world = clone(scenario.payload.world as WorldState);
  world = indexWorld(world);
  const replayed: Session = {
    id: events[0].sessionId,
    seed: String(events[0].payload.seed ?? world.seed),
    events: [],
    world,
  };

  for (const event of events) {
    replayed.events.push(clone(event));
    if (event.type !== "scenario_generated" && event.type !== "session_started") {
      replayed.world = applyEvent(replayed.world, event);
    }
  }

  return replayed;
}

export function dispatchCommand(session: Session, command: PlayerCommand): Session {
  const unit = session.world.unitsById[command.unitId];
  if (!unit) {
    return appendAndApply(session, [
      buildEvent(session, "command_rejected", {
        reason: "unknown_unit",
        command,
      }),
    ]);
  }

  if (command.type === "move_to_hex") {
    const targetPoint = axialToMapPoint(command.target);
    const pathResult = nearestPath(session.world, unit.coord, command.target, {
      blocked: occupiedHexes(session.world, unit.id),
      allowTarget: true,
    });
    const events: DomainEvent[] = [
      buildEvent(session, "command_accepted", { command }),
      ...interruptIfMoving(session, unit.id, "move_command"),
    ];

    if (pathResult.path.length === 0) {
      events.push(
        buildEvent(session, "movement_blocked", {
          unitId: unit.id,
          from: unit.coord,
          target: command.target,
          reason: "no_path",
        }),
      );
    } else {
      events.push(
        buildEvent(session, "movement_started", {
          unitId: unit.id,
          target: command.target,
          targetPoint,
          path: pathResult.path,
        }),
      );
    }
    return appendAndApply(session, events);
  }

  if (command.type === "issue_formation_order") {
    return dispatchFormationOrder(session, unit, command);
  }

  if (command.type === "issue_forward_order") {
    return dispatchForwardOrder(session, unit, command);
  }

  if (command.type === "halt_group") {
    return dispatchHaltGroup(session, unit, command);
  }

  if (command.type === "set_posture") {
    return appendAndApply(session, [
      buildEvent(session, "command_accepted", { command }),
      ...interruptIfMoving(session, unit.id, "posture_change"),
      buildEvent(session, "posture_changed", {
        unitId: unit.id,
        posture: command.posture,
      }),
    ]);
  }

  if (command.type === "face_direction") {
    return appendAndApply(session, [
      buildEvent(session, "command_accepted", { command }),
      ...interruptIfMoving(session, unit.id, "body_orientation_change"),
      buildEvent(session, "body_orientation_changed", {
        unitId: unit.id,
        direction: command.direction,
      }),
      buildEvent(session, "field_of_view_refreshed", {
        unitId: unit.id,
        direction: command.direction,
      }),
    ]);
  }

  const crossesBodyThreshold = directionDelta(unit.facing, command.direction) > 1;
  return appendAndApply(session, [
    buildEvent(session, "command_accepted", { command }),
    buildEvent(session, "look_changed", {
      unitId: unit.id,
      direction: command.direction,
    }),
    ...(crossesBodyThreshold
      ? [
          ...interruptIfMoving(session, unit.id, "look_threshold"),
          buildEvent(session, "body_orientation_changed", {
            unitId: unit.id,
            direction: command.direction,
          }),
        ]
      : []),
    buildEvent(session, "field_of_view_refreshed", {
      unitId: unit.id,
      direction: command.direction,
    }),
  ]);
}

export function advanceSession(session: Session, seconds: number, options: AdvanceOptions = {}): Session {
  const random = options.random ?? seededRandom(`${session.seed}:${session.world.time}:${session.events.length}`);
  const events: DomainEvent[] = [
    buildEvent(session, "time_advanced", {
      seconds,
      to: roundTime(session.world.time + seconds),
    }),
  ];

  const movementEvents = collectMovementEvents(session.world, seconds);
  events.push(...movementEvents.map((event) => buildEvent(session, event.type, event.payload)));

  let next = appendAndApply(session, events);
  const exposureEvents = collectExposureEvents(next.world);
  next = appendAndApply(next, exposureEvents.map((event) => buildEvent(next, event.type, event.payload)));

  const shouldSampleRisk =
    Math.floor(next.world.time) !== Math.floor(session.world.time) ||
    movementEvents.some((event) => event.type === "movement_waiting" || event.type === "movement_blocked");
  if (shouldSampleRisk) {
    const riskAndInformationEvents = collectRiskAndInformationEvents(next, movementEvents);
    next = appendAndApply(next, riskAndInformationEvents.map((event) => buildEvent(next, event.type, event.payload)));
  }

  const opposingEvents = collectOpposingUnitEvents(next.world, random);
  return appendAndApply(next, opposingEvents.map((event) => buildEvent(next, event.type, event.payload)));
}

export function projectSession(session: Session, role: "player" | "observer" = "player"): Projection {
  const player = clone(session.world.units.find((unit) => unit.side === "friendly") ?? session.world.units[0]);
  const visibleHexes = visibleHexesFor(session.world, player);
  const visibleKeys = new Set(visibleHexes.map(hexKey));
  const rememberedHexes = session.world.visibilityMemory?.[player.id] ?? {};
  const events = projectionEvents(session).map(summarizeEventForProjection);
  const risk = riskProjection(session.world);
  const heardEvents = heardEventsFor(session, player, role);
  const reports = reportProjection(session);

  return {
    sessionId: session.id,
    time: session.world.time,
    objective: clone(session.world.objective),
    activeFormation: session.world.activeFormation ? clone(session.world.activeFormation) : undefined,
    map: {
      width: session.world.map.width,
      height: session.world.map.height,
      hexSizeMeters: session.world.map.hexSizeMeters,
      visibleHexes,
      tiles: session.world.map.tiles.map((tile) =>
        role === "observer"
          ? { ...clone(tile), visibility: "visible", lastSeenAt: session.world.time, memoryAge: 0, memoryOpacity: 1 }
          : projectTileVisibility(session.world, tile, visibleKeys, rememberedHexes),
      ),
    },
    player,
    units:
      role === "observer"
        ? session.world.units.map(clone)
        : session.world.units.filter((unit) => unit.side === "friendly" || visibleKeys.has(hexKey(unit.coord))).map(clone),
    events,
    risk,
    perception: {
      informationMode: "training",
      lastKnownUnits: perceivedUnitsFor(session, player, visibleKeys, rememberedHexes, role),
      heardEvents,
      reports,
    },
    aar: {
      route: session.events
        .filter((event) => event.type === "unit_moved" && event.payload.unitId === player.id)
        .map((event) => clone(event.payload.to as HexCoord)),
      exposureSamples: session.events
        .filter((event) => event.type === "exposure_sampled")
        .map((event) => ({
          time: event.time,
          unitId: String(event.payload.unitId),
          exposure: Number(event.payload.exposure),
        })),
      contactEvents: session.events
        .filter((event) => event.type === "probabilistic_detection_resolved" || event.type === "contact_pressure_emitted")
        .map(clone),
      blockingEvents: session.events.filter((event) => event.type === "friendly_effect_blocked" || event.type === "tat_coverage_gap").map(clone),
      reportEvents: session.events.filter((event) => event.type === "status_report_emitted").map(clone),
      heardEvents,
    },
  };
}

function projectTileVisibility(
  world: WorldState,
  tile: HexTile,
  visibleKeys: Set<string>,
  rememberedHexes: Record<string, number>,
): ProjectedHexTile {
  const key = hexKey(tile.coord);
  if (visibleKeys.has(key)) {
    return { ...clone(tile), visibility: "visible", lastSeenAt: world.time, memoryAge: 0, memoryOpacity: 1 };
  }

  const lastSeenAt = rememberedHexes[key];
  if (typeof lastSeenAt === "number") {
    const memoryAge = Math.max(0, world.time - lastSeenAt);
    if (memoryAge < VISIBILITY_MEMORY_SECONDS) {
      return {
        ...clone(tile),
        visibility: "memory",
        lastSeenAt,
        memoryAge: round(memoryAge),
        memoryOpacity: round(clamp(1 - memoryAge / VISIBILITY_MEMORY_SECONDS, 0, 1)),
      };
    }
  }

  return {
    coord: clone(tile.coord),
    terrain: "field",
    moveCost: 1,
    cover: 0,
    concealment: 0,
    blocksSight: false,
    exposure: 0,
    visibility: "unknown",
  };
}

function projectionEvents(session: Session): DomainEvent[] {
  const byId = new Map<string, DomainEvent>();
  for (const event of session.events.slice(-40)) {
    byId.set(event.id, event);
  }
  for (const event of session.events.filter(isOrderFlowEvent).slice(-80)) {
    byId.set(event.id, event);
  }
  return [...byId.values()].sort((a, b) => a.sequence - b.sequence);
}

function isOrderFlowEvent(event: DomainEvent): boolean {
  return (
    event.type === "command_accepted" ||
    event.type === "command_rejected" ||
    event.type === "formation_order_issued" ||
    event.type === "formation_advance_started" ||
    event.type === "formation_movement_diagnostic" ||
    event.type === "order_delivery_resolved" ||
    event.type === "group_halted" ||
    event.type === "movement_started" ||
    event.type === "movement_interrupted" ||
    event.type === "movement_blocked" ||
    event.type === "movement_waiting" ||
    event.type === "movement_completed" ||
    event.type === "friendly_effect_blocked" ||
    event.type === "poor_orientation_detected" ||
    event.type === "tat_coverage_gap" ||
    event.type === "status_report_emitted"
  );
}

function summarizeEventForProjection(event: DomainEvent): DomainEvent {
  if (event.type === "scenario_generated") {
    const world = event.payload.world as WorldState;
    return {
      ...event,
      payload: {
        map: {
          width: world.map.width,
          height: world.map.height,
          hexSizeMeters: world.map.hexSizeMeters,
        },
        units: world.units.map((unit) => ({
          id: unit.id,
          side: unit.side,
          coord: unit.coord,
        })),
      },
    };
  }
  return clone(event);
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = -a.q - a.r - (-b.q - b.r);
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
}

function dispatchFormationOrder(
  session: Session,
  issuer: Unit,
  command: Extract<PlayerCommand, { type: "issue_formation_order" }>,
): Session {
  return dispatchFormationToTarget(
    session,
    issuer,
    command,
    command.target,
    command.formation,
    command.communication,
    command.issuedAt,
    "formation",
    command.direction,
    command.directionTarget,
    undefined,
    command.directionTargetPoint,
  );
}

function dispatchForwardOrder(
  session: Session,
  issuer: Unit,
  command: Extract<PlayerCommand, { type: "issue_forward_order" }>,
): Session {
  if (issuer.side !== "friendly" || issuer.role !== "leader") {
    return appendAndApply(session, [
      buildEvent(session, "command_rejected", {
        reason: "forward_order_requires_leader",
        command,
      }),
    ]);
  }

  const activeFormation = session.world.activeFormation;
  const direction = command.direction ?? activeFormation?.direction ?? directionBetween(issuer.coord, command.directionTarget ?? issuer.coord) ?? issuer.facing;
  const directionVector =
    directionVectorFromTargetPoint(issuer.position, command.directionTargetPoint) ??
    directionVectorFromTarget(issuer.position, command.directionTarget) ??
    activeFormation?.directionVector ??
    directionVectorFromHexDirection(direction);
  const movementFormation =
    command.formation === "regroup"
      ? activeFormation && activeFormation.formation !== "regroup"
        ? activeFormation.formation
        : "column"
      : command.formation;
  const formUpPoint = forwardFormUpPoint(session.world, activeFormation, movementFormation, issuer, directionVector);
  const formUpTarget = mapPointToHex(formUpPoint);
  const forwardTarget = forwardTargetFromPoint(session.world.map, formUpPoint, directionVector);

  return dispatchFormationToTarget(
    session,
    issuer,
    command,
    formUpTarget,
    movementFormation,
    command.communication,
    command.issuedAt,
    "forward",
    direction,
    command.directionTarget,
    formUpPoint,
    command.directionTargetPoint,
    {
      phase: "forming",
      advanceTarget: forwardTarget.target,
      advanceTargetPoint: forwardTarget.targetPoint,
    },
  );
}

function forwardTargetInDirection(map: GameMap, from: HexCoord, directionVector: MapVector): { target: HexCoord; targetPoint: MapPoint } {
  return forwardTargetFromPoint(map, axialToMapPoint(from), directionVector);
}

function forwardTargetFromPoint(map: GameMap, start: MapPoint, directionVector: MapVector): { target: HexCoord; targetPoint: MapPoint } {
  const path: Array<{ coord: HexCoord; point: MapPoint }> = [];
  const vector = normalizeVector(directionVector);
  let previousKey = hexKey(mapPointToHex(start));

  for (let distance = HEX_CENTER_STEP; distance < Math.max(map.width, map.height) * HEX_CENTER_STEP * 3; distance += HEX_CENTER_STEP / 2) {
    const point = {
      x: start.x + vector.x * distance,
      y: start.y + vector.y * distance,
    };
    const next = mapPointToHex(point);
    if (!inBounds(map, next)) {
      break;
    }
    const key = hexKey(next);
    if (key !== previousKey) {
      path.push({ coord: next, point });
      previousKey = key;
    }
  }

  const selected = path[Math.max(0, path.length - 1 - FORWARD_TARGET_EDGE_MARGIN)];
  const fallback = mapPointToHex(start);
  return selected ? { target: selected.coord, targetPoint: selected.point } : { target: fallback, targetPoint: start };
}

function forwardFormUpPoint(
  world: WorldState,
  activeFormation: FormationState | undefined,
  formation: Formation,
  issuer: Unit,
  directionVector: MapVector,
): MapPoint {
  if (
    activeFormation &&
    activeFormation.formation === formation &&
    (activeFormation.orderKind === "formation" || activeFormation.phase === "forming")
  ) {
    return clone(activeFormation.targetPoint);
  }
  const receivers = formationReceivers(world, issuer.id);
  if (activeFormation?.phase === "advancing" && receivers.some((unit) => unit.intent.type === "moving")) {
    const issuerProgress = forwardProgress(issuer.position, directionVector);
    const groupFrontProgress = Math.max(...receivers.map((unit) => forwardProgress(unit.position, directionVector)));
    const forwardShift = Math.max(0, groupFrontProgress - issuerProgress);
    return addMapPoint(issuer.position, scaleVector(normalizeVector(directionVector), forwardShift));
  }
  return clone(issuer.position);
}

function dispatchHaltGroup(
  session: Session,
  issuer: Unit,
  command: Extract<PlayerCommand, { type: "halt_group" }>,
): Session {
  if (issuer.side !== "friendly" || issuer.role !== "leader") {
    return appendAndApply(session, [
      buildEvent(session, "command_rejected", {
        reason: "halt_requires_leader",
        command,
      }),
    ]);
  }

  const receivers = formationReceivers(session.world, issuer.id);
  return appendAndApply(session, [
    buildEvent(session, "command_accepted", { command }),
    buildEvent(session, "group_halted", {
      issuerId: issuer.id,
      unitIds: receivers.map((receiver) => receiver.id),
    }),
    ...receivers.flatMap((receiver) => interruptIfMoving(session, receiver.id, "halt_order")),
  ]);
}

function dispatchFormationToTarget(
  session: Session,
  issuer: Unit,
  command: PlayerCommand,
  target: HexCoord,
  formation: Formation,
  communication: CommunicationMethod,
  issuedAt: number,
  orderKind: "formation" | "forward" = "formation",
  explicitDirection?: Direction,
  explicitDirectionTarget?: HexCoord,
  explicitTargetPoint?: MapPoint,
  explicitDirectionTargetPoint?: MapPoint,
  forwardPlan?: ForwardFormationPlan,
): Session {
  if (issuer.side !== "friendly" || issuer.role !== "leader") {
    return appendAndApply(session, [
      buildEvent(session, "command_rejected", {
        reason: "formation_order_requires_leader",
        command,
      }),
    ]);
  }

  const orderId = `${session.id}_order_${session.events.length}`;
  const receivers = formationReceivers(session.world, issuer.id);
  const direction = explicitDirection ?? directionBetween(issuer.coord, target) ?? session.world.activeFormation?.direction ?? issuer.facing;
  const targetPoint = explicitTargetPoint ?? axialToMapPoint(target);
  const directionVector =
    directionVectorFromTargetPoint(issuer.position, explicitDirectionTargetPoint) ??
    directionVectorFromTarget(issuer.position, explicitDirectionTarget) ??
    (orderKind === "forward" ? session.world.activeFormation?.directionVector : undefined) ??
    directionVectorFromHexDirection(direction);
  const assignments = formationAssignments(session.world, receivers, formation, targetPoint, direction, directionVector);
  const receptions = resolveOrderReceptions(session.world, issuer, receivers, communication);
  const events: DomainEvent[] = [
    buildEvent(session, "command_accepted", { command }),
    buildEvent(session, "formation_order_issued", {
      orderId,
      orderKind,
      issuerId: issuer.id,
      receiverIds: receivers.map((receiver) => receiver.id),
      formation,
      target,
      targetPoint,
      phase: forwardPlan?.phase,
      advanceTarget: forwardPlan?.advanceTarget,
      advanceTargetPoint: forwardPlan?.advanceTargetPoint,
      direction,
      directionVector,
      communication,
      issuedAt,
    }),
  ];

  for (const assignment of assignments) {
    const reception = receptions.get(assignment.unit.id) ?? {
      status: "missed",
      reason: "relay_path_unreached",
      distance: hexDistance(issuer.coord, assignment.unit.coord),
      hops: 0,
    };
    events.push(
      buildEvent(session, "order_delivery_resolved", {
        orderId,
        unitId: assignment.unit.id,
        status: reception.status,
        reason: reception.reason,
        relayedBy: reception.relayedBy,
        hops: reception.hops,
        target: assignment.target,
        targetPoint: assignment.targetPoint,
        distance: reception.distance,
      }),
    );

    if (reception.status !== "received") {
      continue;
    }

    events.push(...interruptIfMoving(session, assignment.unit.id, "formation_order"));
    const pathResult = nearestPath(session.world, assignment.unit.coord, assignment.target, {
      blocked: occupiedHexes(session.world, assignment.unit.id),
      allowTarget: true,
    });
    if (sameCoord(assignment.unit.coord, assignment.target)) {
      events.push(
        buildEvent(session, "movement_completed", {
          unitId: assignment.unit.id,
          at: assignment.target,
          targetPoint: assignment.targetPoint,
          orderId,
        }),
      );
    } else if (pathResult.path.length === 0) {
      events.push(
        buildEvent(session, "movement_blocked", {
          unitId: assignment.unit.id,
          from: assignment.unit.coord,
          target: assignment.target,
          reason: "no_path",
        }),
      );
    } else {
      events.push(
        buildEvent(session, "movement_started", {
          unitId: assignment.unit.id,
          target: assignment.target,
          targetPoint: assignment.targetPoint,
          path: pathResult.path,
          orderId,
        }),
      );
    }
  }

  return appendAndApply(session, events);
}

function buildInitialWorld(
  sessionId: string,
  seed: string,
  scenario: "soldier" | "group_commander",
  overrides?: PhaseOneOverrides,
): WorldState {
  const map = buildMap(seed, overrides?.terrainPatches ?? []);
  const player: Unit = {
    id: "FRIENDLY_1",
    name: "Andersson",
    side: "friendly",
    role: "soldier",
    element: "command",
    position: axialToMapPoint(overrides?.player?.coord ?? { q: 8, r: 50 }),
    coord: overrides?.player?.coord ?? { q: 8, r: 50 },
    facing: overrides?.player?.facing ?? "SE",
    lookDirection: overrides?.player?.lookDirection ?? overrides?.player?.facing ?? "SE",
    health: 100,
    stamina: 100,
    stress: 10,
    posture: overrides?.player?.posture ?? "standing",
    status: [],
    intent: { type: "idle" },
    alerted: false,
  };
  const friendlies = scenario === "group_commander" ? buildGroupCommanderUnits(overrides) : [player];
  const opposingOverrides = overrides?.opposing ?? [
    { id: "OP_1", coord: { q: 64, r: 45 }, facing: "NW", posture: "crouched" },
    { id: "OP_2", coord: { q: 72, r: 58 }, facing: "NW", posture: "standing" },
  ];
  const opposing = opposingOverrides.map((unit, index): Unit => ({
    id: unit.id ?? `OP_${index + 1}`,
    name: `Observer ${index + 1}`,
    side: "opposing",
    role: "observer",
    position: axialToMapPoint(unit.coord ?? { q: 60 + index * 4, r: 45 + index * 4 }),
    coord: unit.coord ?? { q: 60 + index * 4, r: 45 + index * 4 },
    facing: unit.facing ?? "NW",
    lookDirection: unit.lookDirection ?? unit.facing ?? "NW",
    health: 100,
    stamina: 100,
    stress: 0,
    posture: unit.posture ?? "crouched",
    status: [],
    intent: { type: "idle" },
    alerted: false,
  }));

  return refreshVisibilityMemory(indexWorld({
    id: sessionId,
    seed,
    time: 0,
    objective: {
      id: scenario === "group_commander" ? "move_group_to_cover" : "reach_cover",
      title: scenario === "group_commander" ? "För gruppen till skydd" : "Ta dig till skyddspunkten",
      description:
        scenario === "group_commander"
          ? "Ge en formationsorder och för gruppen från den utsatta startplatsen till den markerade skyddspunkten."
          : "Förflytta dig från den utsatta startplatsen till den markerade skyddspunkten utan att motståndarobservatörer bygger kontakttryck.",
      target: { q: 30, r: 50 },
      status: "active",
    },
    map,
    units: [...friendlies, ...opposing],
    unitsById: {},
    visibilityMemory: {},
  }));
}

function buildGroupCommanderUnits(overrides?: PhaseOneOverrides): Unit[] {
  const leader: Unit = {
    id: "LEADER_1",
    name: "Lind",
    side: "friendly",
    role: "leader",
    element: "command",
    elementPosition: 1,
    position: axialToMapPoint(overrides?.player?.coord ?? { q: 8, r: 50 }),
    coord: overrides?.player?.coord ?? { q: 8, r: 50 },
    facing: overrides?.player?.facing ?? "SE",
    lookDirection: overrides?.player?.lookDirection ?? overrides?.player?.facing ?? "SE",
    health: 100,
    stamina: 100,
    stress: 12,
    posture: overrides?.player?.posture ?? "standing",
    status: [],
    intent: { type: "idle" },
    alerted: false,
  };

  const deputy: Unit = {
    id: "DEPUTY_1",
    name: "Nordin",
    side: "friendly",
    role: "deputy_leader",
    element: "command",
    elementPosition: 2,
    position: axialToMapPoint({ q: leader.coord.q, r: leader.coord.r + 1 }),
    coord: { q: leader.coord.q, r: leader.coord.r + 1 },
    facing: leader.facing,
    lookDirection: leader.lookDirection,
    health: 100,
    stamina: 100,
    stress: 11,
    posture: "standing",
    status: [],
    intent: { type: "idle" },
    alerted: false,
  };

  const soldierSpecs: Array<Pick<Unit, "id" | "name" | "coord" | "element" | "elementPosition">> = [
    { id: "FRIENDLY_1", name: "Andersson", coord: { q: 7, r: 51 }, element: "tat_1", elementPosition: 1 },
    { id: "FRIENDLY_2", name: "Berg", coord: { q: 7, r: 50 }, element: "tat_1", elementPosition: 2 },
    { id: "FRIENDLY_3", name: "Ceder", coord: { q: 6, r: 51 }, element: "tat_1", elementPosition: 3 },
    { id: "FRIENDLY_4", name: "Dahl", coord: { q: 9, r: 50 }, element: "tat_2", elementPosition: 1 },
    { id: "FRIENDLY_5", name: "Ek", coord: { q: 9, r: 49 }, element: "tat_2", elementPosition: 2 },
    { id: "FRIENDLY_6", name: "Falk", coord: { q: 10, r: 49 }, element: "tat_2", elementPosition: 3 },
  ];

  const soldiers = soldierSpecs.map(
    (spec): Unit => ({
      id: spec.id,
      name: spec.name,
      side: "friendly",
      role: "soldier",
      element: spec.element,
      elementPosition: spec.elementPosition,
      position: axialToMapPoint(spec.coord),
      coord: spec.coord,
      facing: leader.facing,
      lookDirection: leader.lookDirection,
      health: 100,
      stamina: 100,
      stress: 10,
      posture: "standing",
      status: [],
      intent: { type: "idle" },
      alerted: false,
    }),
  );

  return [leader, deputy, ...soldiers];
}

function buildMap(seed: string, patches: Array<{ coord: HexCoord; terrain: TerrainType }>): GameMap {
  const width = 100;
  const height = 100;
  const tiles: HexTile[] = [];

  for (let r = 0; r < height; r += 1) {
    for (let q = 0; q < width; q += 1) {
      const value = hashString(`${seed}:${q}:${r}`) % 100;
      const terrain: TerrainType =
        q === 15 && r > 30 && r < 70
          ? "road"
          : value < 8
            ? "forest"
            : value < 16
              ? "grass"
              : value < 20
                ? "ditch"
                : value < 23
                  ? "wall"
                  : "field";
      tiles.push(tileFromTerrain({ q, r }, terrain));
    }
  }

  for (const patch of patches) {
    const index = tiles.findIndex((tile) => sameCoord(tile.coord, patch.coord));
    if (index >= 0) {
      tiles[index] = tileFromTerrain(patch.coord, patch.terrain);
    }
  }

  for (let r = 46; r <= 54; r += 1) {
    for (let q = 0; q <= 30; q += 1) {
      const index = tiles.findIndex((tile) => sameCoord(tile.coord, { q, r }));
      if (index >= 0) {
        tiles[index] = tileFromTerrain({ q, r }, q === 15 ? "road" : "field");
      }
    }
  }

  return indexMap({ width, height, hexSizeMeters: 3, tiles, tilesByKey: {} });
}

function tileFromTerrain(coord: HexCoord, terrain: TerrainType): HexTile {
  const values: Record<TerrainType, Omit<HexTile, "coord" | "terrain">> = {
    field: { moveCost: 1, cover: 0, concealment: 0, blocksSight: false, exposure: 3 },
    grass: { moveCost: 1.5, cover: 0, concealment: 2, blocksSight: false, exposure: 2 },
    forest: { moveCost: 2, cover: 1, concealment: 2, blocksSight: true, exposure: 1 },
    ditch: { moveCost: 2, cover: 2, concealment: 2, blocksSight: false, exposure: 1 },
    wall: { moveCost: 3, cover: 3, concealment: 1, blocksSight: true, exposure: 0 },
    road: { moveCost: 0.75, cover: 0, concealment: 0, blocksSight: false, exposure: 3 },
  };
  return { coord, terrain, ...values[terrain] };
}

function appendAndApply(session: Session, newEvents: DomainEvent[]): Session {
  let world = session.world;
  const events = [...session.events];
  for (const event of newEvents) {
    const sequenced = { ...event, sequence: events.length, id: `${session.id}_${events.length}` };
    events.push(sequenced);
    world = applyEvent(world, sequenced);
  }
  return { ...session, events, world };
}

function applyEvent(world: WorldState, event: DomainEvent): WorldState {
  const next = clone(world);
  if (event.type === "time_advanced") {
    next.time = Number(event.payload.to);
  }
  if (event.type === "movement_started") {
    const unit = mutableUnit(next, String(event.payload.unitId));
    unit.intent = {
      type: "moving",
      target: clone(event.payload.target as HexCoord),
      targetPoint: clone((event.payload.targetPoint as MapPoint | undefined) ?? axialToMapPoint(event.payload.target as HexCoord)),
      path: clone(event.payload.path as HexCoord[]),
      progress: 0,
    };
    if (typeof event.payload.orderId === "string") {
      unit.currentOrderId = event.payload.orderId;
    }
  }
  if (event.type === "movement_interrupted") {
    const unit = mutableUnit(next, String(event.payload.unitId));
    unit.intent = { type: "idle" };
  }
  if (event.type === "movement_rerouted") {
    const unit = mutableUnit(next, String(event.payload.unitId));
    unit.intent = {
      type: "moving",
      target: clone(event.payload.target as HexCoord),
      targetPoint: clone((event.payload.targetPoint as MapPoint | undefined) ?? axialToMapPoint(event.payload.target as HexCoord)),
      path: clone(event.payload.path as HexCoord[]),
      progress: 0,
    };
  }
  if (event.type === "unit_moved") {
    const unit = mutableUnit(next, String(event.payload.unitId));
    unit.coord = clone(event.payload.to as HexCoord);
    unit.position = clone((event.payload.position as MapPoint | undefined) ?? axialToMapPoint(event.payload.to as HexCoord));
    unit.facing = String(event.payload.facing) as Direction;
    unit.lookDirection = unit.facing;
    unit.intent = clone(event.payload.intent as UnitIntent);
  }
  if (event.type === "movement_completed" || event.type === "movement_blocked") {
    const unit = maybeMutableUnit(next, String(event.payload.unitId));
    if (unit) {
      if (event.type === "movement_completed" && event.payload.at) {
        unit.coord = clone(event.payload.at as HexCoord);
        if (event.payload.targetPoint) {
          unit.position = clone(event.payload.targetPoint as MapPoint);
        }
      }
      unit.intent = { type: "idle" };
    }
  }
  if (event.type === "posture_changed") {
    const unit = mutableUnit(next, String(event.payload.unitId));
    unit.posture = String(event.payload.posture) as Posture;
  }
  if (event.type === "look_changed") {
    const unit = mutableUnit(next, String(event.payload.unitId));
    unit.lookDirection = String(event.payload.direction) as Direction;
  }
  if (event.type === "body_orientation_changed") {
    const unit = mutableUnit(next, String(event.payload.unitId));
    unit.facing = String(event.payload.direction) as Direction;
    unit.lookDirection = unit.facing;
  }
  if (event.type === "formation_order_issued") {
    next.activeFormation = {
      orderId: String(event.payload.orderId),
      orderKind: event.payload.orderKind === "forward" ? "forward" : "formation",
      phase:
        event.payload.phase === "forming" || event.payload.phase === "advancing"
          ? (String(event.payload.phase) as FormationPhase)
          : undefined,
      formation: String(event.payload.formation) as Formation,
      target: clone(event.payload.target as HexCoord),
      targetPoint: clone((event.payload.targetPoint as MapPoint | undefined) ?? axialToMapPoint(event.payload.target as HexCoord)),
      advanceTarget: event.payload.advanceTarget ? clone(event.payload.advanceTarget as HexCoord) : undefined,
      advanceTargetPoint: event.payload.advanceTargetPoint ? clone(event.payload.advanceTargetPoint as MapPoint) : undefined,
      direction: String(event.payload.direction) as Direction,
      directionVector: event.payload.directionVector ? clone(event.payload.directionVector as MapVector) : undefined,
      communication: String(event.payload.communication) as CommunicationMethod,
      issuedAt: Number(event.payload.issuedAt),
    };
  }
  if (event.type === "formation_advance_started" && next.activeFormation) {
    next.activeFormation = {
      ...next.activeFormation,
      phase: "advancing",
      target: clone(event.payload.target as HexCoord),
      targetPoint: clone((event.payload.targetPoint as MapPoint | undefined) ?? axialToMapPoint(event.payload.target as HexCoord)),
      advanceTarget: event.payload.advanceTarget
        ? clone(event.payload.advanceTarget as HexCoord)
        : clone(event.payload.target as HexCoord),
      advanceTargetPoint: event.payload.advanceTargetPoint
        ? clone(event.payload.advanceTargetPoint as MapPoint)
        : clone((event.payload.targetPoint as MapPoint | undefined) ?? axialToMapPoint(event.payload.target as HexCoord)),
    };
  }
  if (event.type === "order_delivery_resolved" && event.payload.status === "received") {
    const unit = maybeMutableUnit(next, String(event.payload.unitId));
    if (unit) {
      unit.currentOrderId = String(event.payload.orderId);
    }
  }
  if (event.type === "probabilistic_detection_resolved" || event.type === "opposing_unit_alerted") {
    const unit = maybeMutableUnit(next, String(event.payload.observerId));
    if (unit) {
      unit.alerted = true;
      unit.status = Array.from(new Set([...unit.status, "alerted"]));
    }
  }
  if (event.type === "opposing_unit_moved_to_cover") {
    const unit = mutableUnit(next, String(event.payload.unitId));
    unit.coord = clone(event.payload.to as HexCoord);
    unit.position = axialToMapPoint(unit.coord);
    unit.posture = "crouched";
  }
  return refreshVisibilityMemory(indexWorld(next));
}

function buildEvent(session: Session, type: string, payload: Record<string, unknown>): DomainEvent {
  return {
    id: `${session.id}_pending`,
    sessionId: session.id,
    sequence: session.events.length,
    time: session.world.time,
    type,
    payload,
  };
}

function interruptIfMoving(session: Session, unitId: string, reason: string): DomainEvent[] {
  const unit = session.world.unitsById[unitId];
  return unit.intent.type === "moving" ? [buildEvent(session, "movement_interrupted", { unitId, reason })] : [];
}

function collectMovementEvents(world: WorldState, seconds: number): Array<{ type: string; payload: Record<string, unknown> }> {
  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const phaseEvents = collectForwardFormationPhaseEvents(world);
  if (phaseEvents.length > 0) {
    return phaseEvents;
  }

  events.push(...collectEmbodiedLeaderFormationEvents(world));

  const motivatedFormation = collectMotivatedFormationMovementEvents(world, seconds);
  events.push(...motivatedFormation.events);

  const occupied = new Map(world.units.map((unit) => [hexKey(unit.coord), unit.id]));
  const claimedDestinations = new Set<string>();
  const cohesionStops = collectCohesionStops(world);
  for (const unit of world.units) {
    if (motivatedFormation.handledUnitIds.has(unit.id)) {
      continue;
    }
    if (unit.intent.type !== "moving" || unit.intent.path.length === 0) {
      continue;
    }

    const cohesionStop = cohesionStops.get(unit.id);
    if (cohesionStop) {
      events.push({
        type: "movement_waiting",
        payload: {
          unitId: unit.id,
          from: unit.coord,
          target: unit.intent.target,
          reason: cohesionStop.reason,
          neighbourId: cohesionStop.neighbourId,
          leadHexes: cohesionStop.leadHexes,
        },
      });
      continue;
    }

    const nextCoord = unit.intent.path[0];
    const nextKey = hexKey(nextCoord);
    const tile = world.map.tilesByKey[hexKey(nextCoord)];
    if (!tile || isImpassable(tile)) {
      events.push({ type: "movement_blocked", payload: { unitId: unit.id, from: unit.coord, target: unit.intent.target } });
      continue;
    }

    const speed = movementRate(unit) / tile.moveCost;
    const progress = unit.intent.progress + seconds * speed;
    if (progress >= 1) {
      const occupantId = occupied.get(nextKey);
      if ((occupantId && occupantId !== unit.id) || claimedDestinations.has(nextKey)) {
        const rerouted = rerouteAroundOccupied(world, unit, occupied, claimedDestinations);
        events.push(
          rerouted.path.length > 0
            ? {
                type: "movement_rerouted",
                payload: {
                  unitId: unit.id,
                  from: unit.coord,
                  target: unit.intent.target,
                  targetPoint: unit.intent.targetPoint,
                  path: rerouted.path,
                  reason: "occupied",
                },
              }
            : {
                type: "movement_waiting",
                payload: {
                  unitId: unit.id,
                  from: unit.coord,
                  target: unit.intent.target,
                  waitingAt: nextCoord,
                  reason: "occupied",
                },
              },
        );
        continue;
      }
      claimedDestinations.add(nextKey);
      const remainingPath = unit.intent.path.slice(1);
      const facing = directionBetween(unit.coord, nextCoord) ?? unit.facing;
      const nextPosition = sameCoord(nextCoord, unit.intent.target)
        ? unit.intent.targetPoint
        : moveMapPointToward(unit.position, unit.intent.targetPoint, HEX_CENTER_STEP);
      events.push({
        type: "unit_moved",
        payload: {
          unitId: unit.id,
          from: unit.coord,
          to: nextCoord,
          position: nextPosition,
          facing,
          intent:
            remainingPath.length > 0
              ? { type: "moving", target: unit.intent.target, targetPoint: unit.intent.targetPoint, path: remainingPath, progress: progress - 1 }
              : { type: "idle" },
        },
      });
      if (remainingPath.length === 0) {
        events.push({ type: "movement_completed", payload: { unitId: unit.id, at: nextCoord } });
      }
    } else {
      events.push({
        type: "unit_moved",
        payload: {
          unitId: unit.id,
          from: unit.coord,
          to: unit.coord,
          position: moveMapPointToward(unit.position, unit.intent.targetPoint, seconds * speed * HEX_CENTER_STEP),
          facing: unit.facing,
          intent: { ...unit.intent, progress },
        },
      });
    }
  }
  return events;
}

function collectForwardFormationPhaseEvents(world: WorldState): Array<{ type: string; payload: Record<string, unknown> }> {
  const activeFormation = world.activeFormation;
  if (
    !activeFormation ||
    activeFormation.orderKind !== "forward" ||
    activeFormation.phase !== "forming" ||
    !activeFormation.advanceTarget ||
    !activeFormation.advanceTargetPoint
  ) {
    return [];
  }

  const leader = world.units.find((unit) => unit.side === "friendly" && unit.role === "leader");
  if (!leader) {
    return [];
  }

  const receivers = formationReceivers(world, leader.id);
  if (!formationIsReadyToAdvance(world, activeFormation, receivers)) {
    return [];
  }

  const directionVector = activeFormation.directionVector ?? directionVectorFromHexDirection(activeFormation.direction);
  const events: Array<{ type: string; payload: Record<string, unknown> }> = [
    {
      type: "formation_advance_started",
      payload: {
        orderId: activeFormation.orderId,
        formation: activeFormation.formation,
        target: leader.coord,
        targetPoint: leader.position,
        advanceTarget: activeFormation.advanceTarget,
        advanceTargetPoint: activeFormation.advanceTargetPoint,
        direction: activeFormation.direction,
        directionVector,
      },
    },
  ];

  return events;
}

function collectEmbodiedLeaderFormationEvents(world: WorldState): Array<{ type: string; payload: Record<string, unknown> }> {
  const activeFormation = world.activeFormation;
  if (!activeFormation || activeFormation.orderKind !== "forward" || activeFormation.phase !== "advancing") {
    return [];
  }

  const leader = world.units.find((unit) => unit.side === "friendly" && unit.role === "leader");
  if (!leader || leader.currentOrderId !== activeFormation.orderId || leader.intent.type !== "moving") {
    return [];
  }

  const receivers = formationReceivers(world, leader.id).filter((unit) => unit.currentOrderId === activeFormation.orderId);
  const assignments = formationAssignments(
    world,
    receivers,
    activeFormation.formation,
    leader.position,
    activeFormation.direction,
    activeFormation.directionVector ?? directionVectorFromHexDirection(activeFormation.direction),
  );
  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];

  for (const assignment of assignments) {
    if (assignment.unit.id === leader.id) {
      continue;
    }

    const unit = world.unitsById[assignment.unit.id];
    if (!unit || unit.intent.type === "moving" || formationTargetIsCurrent(unit, assignment.target, assignment.targetPoint)) {
      continue;
    }

    if (sameCoord(unit.coord, assignment.target)) {
      continue;
    }

    const pathResult = nearestPath(world, unit.coord, assignment.target, {
      blocked: occupiedHexes(world, unit.id),
      allowTarget: true,
      maxVisited: 900,
    });
    if (pathResult.path.length === 0) {
      events.push({
        type: "movement_waiting",
        payload: {
          unitId: unit.id,
          from: unit.coord,
          target: assignment.target,
          reason: "embodied_leader_follow_no_path",
        },
      });
      continue;
    }

    events.push({
      type: "movement_started",
      payload: {
        unitId: unit.id,
        target: assignment.target,
        targetPoint: assignment.targetPoint,
        path: pathResult.path,
        orderId: activeFormation.orderId,
        reason: "embodied_leader_follow",
        leaderId: leader.id,
      },
    });
  }

  return events;
}

function formationTargetIsCurrent(unit: Unit, target: HexCoord, targetPoint: MapPoint): boolean {
  return (
    unit.intent.type === "moving" &&
    sameCoord(unit.intent.target, target) &&
    mapDistanceInHexes(unit.intent.targetPoint, targetPoint) <= 0.25
  );
}

function formationIsReadyToAdvance(world: WorldState, activeFormation: FormationState, receivers: Unit[]): boolean {
  const directionVector = activeFormation.directionVector ?? directionVectorFromHexDirection(activeFormation.direction);
  const localAssignments = formationAssignments(
    world,
    receivers,
    activeFormation.formation,
    activeFormation.targetPoint,
    activeFormation.direction,
    directionVector,
  );

  return localAssignments.every((assignment) => {
    const unit = world.unitsById[assignment.unit.id];
    return (
      unit.currentOrderId === activeFormation.orderId &&
      unit.intent.type === "idle" &&
      sameCoord(unit.coord, assignment.target) &&
      mapDistanceInHexes(unit.position, assignment.targetPoint) <= FORMATION_READY_TOLERANCE_HEXES
    );
  });
}

function collectMotivatedFormationMovementEvents(
  world: WorldState,
  seconds: number,
): { events: Array<{ type: string; payload: Record<string, unknown> }>; handledUnitIds: Set<string> } {
  const activeFormation = world.activeFormation;
  const handledUnitIds = new Set<string>();
  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
  if (!activeFormation || activeFormation.orderKind !== "forward" || activeFormation.phase !== "advancing") {
    return { events, handledUnitIds };
  }

  const leader = world.units.find((unit) => unit.side === "friendly" && unit.role === "leader");
  if (!leader) {
    return { events, handledUnitIds };
  }

  const movingUnits = world.units
    .filter(
      (unit): unit is Unit & { intent: Extract<UnitIntent, { type: "moving" }> } =>
        unit.side === "friendly" &&
        unit.role !== "leader" &&
        unit.currentOrderId === activeFormation.orderId &&
        unit.intent.type === "moving" &&
        unit.intent.path.length > 0,
    )
    .sort(
      (a, b) =>
        forwardProgress(b.position, activeFormation.directionVector ?? activeFormation.direction) -
          forwardProgress(a.position, activeFormation.directionVector ?? activeFormation.direction) ||
        formationReceiverRank(a) - formationReceiverRank(b),
    );

  if (movingUnits.length === 0) {
    return { events, handledUnitIds };
  }

  const occupied = new Map(world.units.map((unit) => [hexKey(unit.coord), unit.id]));
  const simulatedCoords = new Map(world.units.map((unit) => [unit.id, unit.coord]));
  const simulatedPositions = new Map<string, MapPoint>();
  const plannedPositions = plannedFormationStepPositions(movingUnits, seconds);
  const claimedDestinations = new Set<string>();
  const cohesionStops = collectCohesionStops(world);
  const neighboursByUnit = neighboursByFormationUnit(world, leader.id);
  const formationCenter = averageMapPoint(world.units.filter((unit) => unit.side === "friendly").map((unit) => unit.position));
  const waitDiagnostics: Array<Record<string, unknown>> = [];
  let movedUnitCount = 0;

  for (const unit of movingUnits) {
    handledUnitIds.add(unit.id);
    const progress = unit.intent.progress + seconds * movementRate(unit);
    const cohesionStop = cohesionStops.get(unit.id);
    if (cohesionStop) {
      events.push({
        type: "movement_waiting",
        payload: {
          unitId: unit.id,
          from: unit.coord,
          target: unit.intent.target,
          reason: cohesionStop.reason,
          neighbourId: cohesionStop.neighbourId,
          leadHexes: cohesionStop.leadHexes,
        },
      });
      waitDiagnostics.push({
        unitId: unit.id,
        reason: cohesionStop.reason,
        neighbourId: cohesionStop.neighbourId,
        leadHexes: cohesionStop.leadHexes,
      });
      continue;
    }

    if (progress < 1) {
      const nextPosition = moveMapPointToward(unit.position, unit.intent.targetPoint, seconds * movementRate(unit) * HEX_CENTER_STEP);
      const laggingNeighbour = firstLaggingNeighbourFromPosition(
        nextPosition,
        neighboursByUnit.get(unit.id) ?? [],
        simulatedPositions,
        plannedPositions,
        activeFormation.directionVector ?? activeFormation.direction,
      );
      if (laggingNeighbour) {
        claimedDestinations.add(hexKey(unit.coord));
        events.push({
          type: "movement_waiting",
          payload: {
            unitId: unit.id,
            from: unit.coord,
            target: unit.intent.target,
            reason: "neighbour_lagging",
            neighbourId: laggingNeighbour.neighbour.id,
            leadHexes: laggingNeighbour.leadHexes,
          },
        });
        waitDiagnostics.push({
          unitId: unit.id,
          reason: "neighbour_lagging",
          neighbourId: laggingNeighbour.neighbour.id,
          leadHexes: laggingNeighbour.leadHexes,
        });
        continue;
      }
      events.push({
        type: "unit_moved",
        payload: {
          unitId: unit.id,
          from: unit.coord,
          to: unit.coord,
          position: nextPosition,
          facing: unit.facing,
          intent: { ...unit.intent, progress },
        },
      });
      simulatedPositions.set(unit.id, nextPosition);
      claimedDestinations.add(hexKey(unit.coord));
      movedUnitCount += 1;
      continue;
    }

    const choice = chooseMotivatedFormationStep(
      world,
      unit,
      activeFormation,
      occupied,
      claimedDestinations,
      simulatedCoords,
      simulatedPositions,
      plannedPositions,
      neighboursByUnit.get(unit.id) ?? [],
      formationCenter,
    );

    if (!choice || sameCoord(choice.coord, unit.coord)) {
      claimedDestinations.add(hexKey(unit.coord));
      events.push({
        type: "movement_waiting",
        payload: {
          unitId: unit.id,
          from: unit.coord,
          target: unit.intent.target,
          reason: "formation_motivation",
        },
      });
      waitDiagnostics.push({
        unitId: unit.id,
        reason: !choice ? "no_candidate" : "hold_position_best_candidate",
      });
      continue;
    }

    const fromKey = hexKey(unit.coord);
    const toKey = hexKey(choice.coord);
    occupied.delete(fromKey);
    occupied.set(toKey, unit.id);
    claimedDestinations.add(toKey);
    simulatedCoords.set(unit.id, choice.coord);

    const facing = directionBetween(unit.coord, choice.coord) ?? unit.facing;
    const nextPosition = choice.arrived ? unit.intent.targetPoint : choice.position;
    simulatedPositions.set(unit.id, nextPosition);
    const pathResult = nearestPath(world, choice.coord, unit.intent.target, {
      blocked: new Set([...occupied.keys()].filter((key) => occupied.get(key) !== unit.id)),
      allowTarget: true,
      maxVisited: 900,
    });
    const arrived = choice.arrived || sameCoord(choice.coord, unit.intent.target);
    const nextPath = pathResult.path.length > 0 ? pathResult.path : arrived ? [] : [unit.intent.target];
    events.push({
      type: "unit_moved",
      payload: {
          unitId: unit.id,
          from: unit.coord,
          to: choice.coord,
          position: nextPosition,
          facing,
        intent: arrived
          ? { type: "idle" }
          : { type: "moving", target: unit.intent.target, targetPoint: unit.intent.targetPoint, path: nextPath, progress: progress - 1 },
      },
    });
    movedUnitCount += 1;
    if (arrived) {
      events.push({ type: "movement_completed", payload: { unitId: unit.id, at: choice.coord } });
    }
  }

  if (movingUnits.length > 0 && movedUnitCount === 0) {
    events.push({
      type: "formation_movement_diagnostic",
      payload: {
        orderId: activeFormation.orderId,
        phase: activeFormation.phase,
        reason: "advance_stalled",
        movingUnits: movingUnits.map((unit) => unit.id),
        waits: waitDiagnostics,
      },
    });
  }

  return { events, handledUnitIds };
}

function plannedFormationStepPositions(
  movingUnits: Array<Unit & { intent: Extract<UnitIntent, { type: "moving" }> }>,
  seconds: number,
): Map<string, MapPoint> {
  const planned = new Map<string, MapPoint>();
  for (const unit of movingUnits) {
    const progress = unit.intent.progress + seconds * movementRate(unit);
    const distance = progress >= 1 ? HEX_CENTER_STEP : seconds * movementRate(unit) * HEX_CENTER_STEP;
    planned.set(unit.id, moveMapPointToward(unit.position, unit.intent.targetPoint, distance));
  }
  return planned;
}

function chooseMotivatedFormationStep(
  world: WorldState,
  unit: Unit & { intent: Extract<UnitIntent, { type: "moving" }> },
  activeFormation: FormationState,
  occupied: Map<string, string>,
  claimedDestinations: Set<string>,
  simulatedCoords: Map<string, HexCoord>,
  simulatedPositions: Map<string, MapPoint>,
  plannedPositions: Map<string, MapPoint>,
  neighbours: Unit[],
  formationCenter: MapPoint,
): { coord: HexCoord; position: MapPoint; arrived: boolean; score: number } | undefined {
  const desiredPosition = moveMapPointToward(unit.position, unit.intent.targetPoint, HEX_CENTER_STEP);
  const arrived = mapDistanceInHexes(desiredPosition, unit.intent.targetPoint) < 0.2;
  const nextPosition = arrived ? unit.intent.targetPoint : desiredPosition;
  if (arrived) {
    const targetKey = hexKey(unit.intent.target);
    const occupantId = occupied.get(targetKey);
    if (inBounds(world.map, unit.intent.target) && (!occupantId || occupantId === unit.id) && !claimedDestinations.has(targetKey)) {
      return {
        coord: unit.intent.target,
        position: unit.intent.targetPoint,
        arrived: true,
        score: Number.NEGATIVE_INFINITY,
      };
    }
  }
  const candidates = [unit.coord, ...neighbors(unit.coord)]
    .filter((coord) => inBounds(world.map, coord))
    .filter((coord) => {
      const tile = world.map.tilesByKey[hexKey(coord)];
      return tile && !isImpassable(tile);
    })
    .filter((coord) => {
      if (sameCoord(coord, unit.coord)) return true;
      const key = hexKey(coord);
      const occupantId = occupied.get(key);
      return (!occupantId || occupantId === unit.id) && !claimedDestinations.has(key);
    })
    .filter(() => {
      return !firstLaggingNeighbourFromPosition(
        nextPosition,
        neighbours,
        simulatedPositions,
        plannedPositions,
        activeFormation.directionVector ?? activeFormation.direction,
      );
    });

  return candidates
    .map((coord) => ({
      coord,
      position: nextPosition,
      arrived,
      score: formationMotivationScore(
        world,
        unit,
        coord,
        nextPosition,
        activeFormation,
        simulatedCoords,
        simulatedPositions,
        plannedPositions,
        neighbours,
        formationCenter,
      ),
    }))
    .sort(
      (a, b) =>
        a.score - b.score ||
        mapDistanceInHexes(axialToMapPoint(a.coord), unit.intent.targetPoint) -
          mapDistanceInHexes(axialToMapPoint(b.coord), unit.intent.targetPoint),
    )[0];
}

function firstLaggingNeighbourFromPosition(
  position: MapPoint,
  neighbours: Unit[],
  simulatedPositions: Map<string, MapPoint>,
  plannedPositions: Map<string, MapPoint>,
  direction: Direction | MapVector,
): { neighbour: Unit; leadHexes: number } | undefined {
  for (const neighbour of neighbours) {
    const neighbourPosition = simulatedPositions.get(neighbour.id) ?? plannedPositions.get(neighbour.id) ?? neighbour.position;
    const leadHexes = forwardLeadInHexes(position, neighbourPosition, direction);
    if (leadHexes > COHESION_MAX_FORWARD_LEAD) {
      return { neighbour, leadHexes: round(leadHexes) };
    }
  }
  return undefined;
}

function formationMotivationScore(
  world: WorldState,
  unit: Unit & { intent: Extract<UnitIntent, { type: "moving" }> },
  candidate: HexCoord,
  desiredPosition: MapPoint,
  activeFormation: FormationState,
  simulatedCoords: Map<string, HexCoord>,
  simulatedPositions: Map<string, MapPoint>,
  plannedPositions: Map<string, MapPoint>,
  neighbours: Unit[],
  formationCenter: MapPoint,
): number {
  const tile = world.map.tilesByKey[hexKey(candidate)];
  const candidatePoint = axialToMapPoint(candidate);
  const currentProgress = forwardProgress(unit.position, activeFormation.directionVector ?? activeFormation.direction);
  const candidateProgress = forwardProgress(desiredPosition, activeFormation.directionVector ?? activeFormation.direction);
  let score = 0;

  score += mapDistanceInHexes(candidatePoint, desiredPosition) * FORMATION_SLOT_WEIGHT * 1.2;
  score += mapDistanceInHexes(candidatePoint, unit.intent.targetPoint) * FORMATION_SLOT_WEIGHT;
  score += mapDistanceInHexes(candidatePoint, activeFormation.targetPoint) * FORMATION_CENTER_WEIGHT;
  score += mapDistanceInHexes(candidatePoint, formationCenter) * FORMATION_CENTER_WEIGHT;
  score -= Math.max(0, candidateProgress - currentProgress) * FORMATION_FORWARD_WEIGHT;
  score += (tile?.moveCost ?? 1) * FORMATION_TERRAIN_WEIGHT;
  score += effectZoneInterferencePenalty(world, unit.id, candidate);
  if (sameCoord(candidate, unit.coord) && !sameCoord(candidate, unit.intent.target)) {
    score += 1.25;
  }
  if (sameCoord(candidate, unit.intent.target)) {
    score -= 2;
  }

  for (const neighbour of neighbours) {
    const neighbourCoord = simulatedCoords.get(neighbour.id) ?? neighbour.coord;
    const neighbourPosition = simulatedPositions.get(neighbour.id) ?? plannedPositions.get(neighbour.id) ?? neighbour.position;
    const distance = hexDistance(candidate, neighbourCoord);
    const lead = candidateProgress - forwardProgress(neighbourPosition, activeFormation.directionVector ?? activeFormation.direction);
    score += Math.max(0, distance - 2) * FORMATION_NEIGHBOUR_WEIGHT;
    score += Math.max(0, lead - COHESION_MAX_FORWARD_LEAD * HEX_CENTER_STEP) * FORMATION_NEIGHBOUR_WEIGHT * 2;
    if (distance === 1) {
      score -= 0.4;
    }
  }

  for (const other of world.units.filter((otherUnit) => otherUnit.side === "friendly" && otherUnit.id !== unit.id)) {
    if (neighbours.some((neighbour) => neighbour.id === other.id)) {
      continue;
    }
    const otherCoord = simulatedCoords.get(other.id) ?? other.coord;
    if (hexDistance(candidate, otherCoord) <= 1) {
      score += 1.3;
    }
  }

  return score;
}

function rerouteAroundOccupied(
  world: WorldState,
  unit: Unit & { intent: Extract<UnitIntent, { type: "moving" }> },
  occupied: Map<string, string>,
  claimedDestinations: Set<string>,
): { path: HexCoord[]; blocked: boolean } {
  const blocked = new Set<string>();
  for (const [key, unitId] of occupied) {
    if (unitId !== unit.id) {
      blocked.add(key);
    }
  }
  for (const key of claimedDestinations) {
    blocked.add(key);
  }
  return nearestPath(world, unit.coord, unit.intent.target, {
    blocked,
    allowTarget: true,
  });
}

function collectCohesionStops(world: WorldState): Map<string, { neighbourId: string; leadHexes: number; reason: string }> {
  const stops = new Map<string, { neighbourId: string; leadHexes: number; reason: string }>();
  const activeFormation = world.activeFormation;
  if (!activeFormation || activeFormation.orderKind !== "forward" || activeFormation.phase !== "advancing") {
    return stops;
  }

  const leader = world.units.find((unit) => unit.side === "friendly" && unit.role === "leader");
  if (!leader) {
    return stops;
  }

  for (const [unit, neighbour] of cohesionPairs(world, leader.id)) {
    if (
      unit.intent.type === "moving" &&
      unit.currentOrderId !== neighbour.currentOrderId &&
      isTooFarFromNeighbour(unit, neighbour)
    ) {
      stops.set(unit.id, {
        neighbourId: neighbour.id,
        leadHexes: round(mapDistanceInHexes(unit.position, neighbour.position)),
        reason: "neighbour_separated",
      });
    }
    if (
      neighbour.intent.type === "moving" &&
      neighbour.currentOrderId !== unit.currentOrderId &&
      isTooFarFromNeighbour(neighbour, unit)
    ) {
      stops.set(neighbour.id, {
        neighbourId: unit.id,
        leadHexes: round(mapDistanceInHexes(neighbour.position, unit.position)),
        reason: "neighbour_separated",
      });
    }
    if (!stops.has(unit.id) && unit.intent.type === "moving" && isTooFarAhead(unit, neighbour, activeFormation.directionVector ?? activeFormation.direction)) {
      stops.set(unit.id, {
        neighbourId: neighbour.id,
        leadHexes: round(forwardLeadInHexes(unit.position, neighbour.position, activeFormation.directionVector ?? activeFormation.direction)),
        reason: "neighbour_lagging",
      });
    }
    if (!stops.has(neighbour.id) && neighbour.intent.type === "moving" && isTooFarAhead(neighbour, unit, activeFormation.directionVector ?? activeFormation.direction)) {
      stops.set(neighbour.id, {
        neighbourId: unit.id,
        leadHexes: round(forwardLeadInHexes(neighbour.position, unit.position, activeFormation.directionVector ?? activeFormation.direction)),
        reason: "neighbour_lagging",
      });
    }
  }

  return stops;
}

function cohesionPairs(world: WorldState, leaderId: string): Array<[Unit, Unit]> {
  const receivers = formationReceivers(world, leaderId);
  const leader = receivers.find((unit) => unit.role === "leader");
  const deputy = receivers.find((unit) => unit.role === "deputy_leader");
  const tatOne = receivers.filter((unit) => unit.element === "tat_1");
  const tatTwo = receivers.filter((unit) => unit.element === "tat_2");
  const pairs: Array<[Unit, Unit]> = [];

  if (leader && deputy) {
    pairs.push([leader, deputy]);
  }
  appendChainPairs(pairs, leader ? [leader, ...tatOne] : tatOne);
  appendChainPairs(pairs, deputy ? [deputy, ...tatTwo] : tatTwo);

  return pairs;
}

function neighboursByFormationUnit(world: WorldState, leaderId: string): Map<string, Unit[]> {
  const neighbours = new Map<string, Unit[]>();
  for (const [a, b] of cohesionPairs(world, leaderId)) {
    neighbours.set(a.id, [...(neighbours.get(a.id) ?? []), b]);
    neighbours.set(b.id, [...(neighbours.get(b.id) ?? []), a]);
  }
  return neighbours;
}

function appendChainPairs(pairs: Array<[Unit, Unit]>, units: Unit[]): void {
  for (let index = 0; index < units.length - 1; index += 1) {
    pairs.push([units[index], units[index + 1]]);
  }
}

function isTooFarAhead(unit: Unit, neighbour: Unit, direction: Direction | MapVector): boolean {
  return forwardLeadInHexes(unit.position, neighbour.position, direction) > COHESION_MAX_FORWARD_LEAD;
}

function isTooFarFromNeighbour(unit: Unit, neighbour: Unit): boolean {
  return mapDistanceInHexes(unit.position, neighbour.position) > COHESION_MAX_NEIGHBOUR_DISTANCE_HEXES;
}

function forwardLeadInHexes(a: MapPoint, b: MapPoint, direction: Direction | MapVector): number {
  return (forwardProgress(a, direction) - forwardProgress(b, direction)) / HEX_CENTER_STEP;
}

function forwardProgress(coordOrPoint: HexCoord | MapPoint, direction: Direction | MapVector): number {
  const point = "q" in coordOrPoint ? axialToMapPoint(coordOrPoint) : coordOrPoint;
  const vector = typeof direction === "string" ? directionVectorFromHexDirection(direction) : normalizeVector(direction);
  return point.x * vector.x + point.y * vector.y;
}

function collectExposureEvents(world: WorldState): Array<{ type: string; payload: Record<string, unknown> }> {
  return world.units
    .filter((unit) => unit.side === "friendly")
    .map((unit) => {
      const tile = world.map.tilesByKey[hexKey(unit.coord)];
      const postureModifier = unit.posture === "standing" ? 0 : unit.posture === "crouched" ? -0.75 : -1.5;
      const exposure = Math.max(0, (tile?.exposure ?? 0) - (tile?.cover ?? 0) * 0.5 - (tile?.concealment ?? 0) * 0.25 + postureModifier);
      return {
        type: "exposure_sampled",
        payload: {
          unitId: unit.id,
          coord: unit.coord,
          exposure: round(exposure),
        },
      };
    });
}

function collectRiskAndInformationEvents(
  session: Session,
  movementEvents: Array<{ type: string; payload: Record<string, unknown> }>,
): Array<{ type: string; payload: Record<string, unknown> }> {
  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const world = session.world;
  const risk = riskProjection(world);

  for (const blocking of risk.blocking) {
    const alreadyLogged = hasPriorEvent(
      session,
      "friendly_effect_blocked",
      (event) =>
        event.payload.unitId === blocking.unitId &&
        event.payload.blockingUnitId === blocking.blockingUnitId &&
        event.payload.severity === blocking.severity,
    );
    if (alreadyLogged) {
      continue;
    }
    events.push({
      type: "friendly_effect_blocked",
      payload: {
        unitId: blocking.unitId,
        blockingUnitId: blocking.blockingUnitId,
        coord: blocking.coord,
        distanceHexes: blocking.distanceHexes,
        severity: blocking.severity,
        reason: blocking.reason,
      },
    });
    if (
      blocking.severity === "high" &&
      !hasPriorEvent(
        session,
        "status_report_emitted",
        (event) =>
          event.payload.kind === "blocking" &&
          event.payload.sourceUnitId === blocking.unitId &&
          event.payload.relatedUnitId === blocking.blockingUnitId,
      )
    ) {
      events.push({
        type: "status_report_emitted",
        payload: {
          sourceUnitId: blocking.unitId,
          kind: "blocking",
          message: "fri sikt/effektzon blockerad av kamrat",
          coord: blocking.coord,
          confidence: "high",
          relatedUnitId: blocking.blockingUnitId,
        },
      });
    }
  }

  for (const coverage of risk.coverage) {
    if (coverage.covered) {
      continue;
    }
    if (
      hasPriorEvent(
        session,
        "tat_coverage_gap",
        (event) =>
          event.payload.element === coverage.element &&
          event.payload.expectedDirection === coverage.expectedDirection &&
          event.payload.reason === (coverage.reason ?? "poor_orientation"),
      )
    ) {
      continue;
    }
    events.push({
      type: "tat_coverage_gap",
      payload: {
        element: coverage.element,
        expectedDirection: coverage.expectedDirection,
        reason: coverage.reason ?? "poor_orientation",
      },
    });
  }

  for (const event of movementEvents) {
    if (event.type !== "movement_waiting") {
      continue;
    }
    const unit = world.unitsById[String(event.payload.unitId)];
    if (!unit || unit.side !== "friendly") {
      continue;
    }
    const reason = String(event.payload.reason ?? "okänd orsak");
    if (
      hasRecentEvent(
        session,
        "status_report_emitted",
        3,
        (candidate) =>
          candidate.payload.kind === "movement_wait" &&
          candidate.payload.sourceUnitId === unit.id &&
          candidate.payload.message === `väntar: ${reason}`,
      )
    ) {
      continue;
    }
    events.push({
      type: "status_report_emitted",
      payload: {
        sourceUnitId: unit.id,
        kind: "movement_wait",
        message: `väntar: ${reason}`,
        coord: unit.coord,
        confidence: "medium",
        relatedUnitId: event.payload.neighbourId,
      },
    });
  }

  const expectedDirection = world.activeFormation?.direction;
  if (expectedDirection) {
    for (const unit of world.units.filter((candidate) => candidate.side === "friendly")) {
      if (directionDelta(unit.lookDirection, expectedDirection) <= 1) {
        continue;
      }
      if (
        hasPriorEvent(
          session,
          "poor_orientation_detected",
          (event) =>
            event.payload.unitId === unit.id &&
            event.payload.lookDirection === unit.lookDirection &&
            event.payload.expectedDirection === expectedDirection,
        )
      ) {
        continue;
      }
      events.push({
        type: "poor_orientation_detected",
        payload: {
          unitId: unit.id,
          lookDirection: unit.lookDirection,
          expectedDirection,
          reason: "poor_orientation",
        },
      });
    }
  }

  return events;
}

function hasPriorEvent(session: Session, type: string, predicate: (event: DomainEvent) => boolean): boolean {
  return session.events.some((event) => event.type === type && predicate(event));
}

function hasRecentEvent(
  session: Session,
  type: string,
  seconds: number,
  predicate: (event: DomainEvent) => boolean,
): boolean {
  return session.events.some(
    (event) => event.type === type && session.world.time - event.time <= seconds && predicate(event),
  );
}

function riskProjection(world: WorldState): Projection["risk"] {
  const effectZones = world.units
    .filter((unit) => unit.side === "friendly")
    .map((unit) => effectZoneForUnit(world, unit));
  const blocking = effectZones
    .filter(
      (
        zone,
      ): zone is EffectZoneProjection & {
        blockedByUnitId: string;
        blockedAt: HexCoord;
        severity: "low" | "medium" | "high";
      } => Boolean(zone.blockedByUnitId && zone.blockedAt && zone.severity),
    )
    .map((zone) => ({
      unitId: zone.unitId,
      blockingUnitId: zone.blockedByUnitId,
      coord: zone.blockedAt,
      distanceHexes: hexDistance(world.unitsById[zone.unitId].coord, zone.blockedAt),
      severity: zone.severity,
      reason: "friendly_in_effect_zone" as const,
    }));

  return {
    effectZones,
    blocking,
    coverage: coverageChecks(world, effectZones),
  };
}

function effectZoneForUnit(world: WorldState, unit: Unit): EffectZoneProjection {
  const hexes = coordsWithinRadius(unit.coord, EFFECT_ZONE_RANGE_HEXES)
    .filter((coord) => inBounds(world.map, coord))
    .filter((coord) => !sameCoord(coord, unit.coord))
    .filter((coord) => isDirectionVisibleFromPoint(unit.lookDirection, unit.position, axialToMapPoint(coord)))
    .filter((coord) => hasLineOfSight(world, unit.coord, coord))
    .sort((a, b) => hexDistance(a, unit.coord) - hexDistance(b, unit.coord));
  const blocker = hexes
    .map((coord) => world.units.find((candidate) => candidate.side === "friendly" && candidate.id !== unit.id && sameCoord(candidate.coord, coord)))
    .find((candidate): candidate is Unit => Boolean(candidate));
  const blockedAt = blocker?.coord;
  const distance = blockedAt ? hexDistance(unit.coord, blockedAt) : undefined;

  return {
    unitId: unit.id,
    facing: unit.facing,
    lookDirection: unit.lookDirection,
    hexes,
    blockedByUnitId: blocker?.id,
    blockedAt: blockedAt ? clone(blockedAt) : undefined,
    severity: typeof distance === "number" ? blockingSeverity(distance) : undefined,
  };
}

function coverageChecks(world: WorldState, effectZones: EffectZoneProjection[]): CoverageCheckProjection[] {
  const expectedDirection = world.activeFormation?.direction ?? world.units.find((unit) => unit.role === "leader")?.facing ?? "SE";
  return (["tat_1", "tat_2"] as GroupElement[]).map((element) => {
    const members = world.units.filter((unit) => unit.side === "friendly" && unit.element === element);
    if (members.length === 0) {
      return { element, covered: false, coveringUnitIds: [], expectedDirection, reason: "no_members" };
    }
    const coveringUnitIds = members
      .filter((unit) => directionDelta(unit.lookDirection, expectedDirection) <= 1)
      .filter((unit) => !effectZones.find((zone) => zone.unitId === unit.id && zone.severity === "high"))
      .map((unit) => unit.id);
    const reason =
      coveringUnitIds.length > 0
        ? undefined
        : members.some((unit) => directionDelta(unit.lookDirection, expectedDirection) <= 1)
          ? "blocked_effect_zone"
          : "poor_orientation";
    return {
      element,
      covered: coveringUnitIds.length > 0,
      coveringUnitIds,
      expectedDirection,
      reason,
    };
  });
}

function blockingSeverity(distanceHexes: number): "low" | "medium" | "high" {
  if (distanceHexes <= 2) return "high";
  if (distanceHexes <= 4) return "medium";
  return "low";
}

function effectZoneInterferencePenalty(world: WorldState, unitId: string, candidate: HexCoord): number {
  let penalty = 0;
  for (const other of world.units.filter((unit) => unit.side === "friendly" && unit.id !== unitId)) {
    if (!isDirectionVisibleFromPoint(other.lookDirection, other.position, axialToMapPoint(candidate))) {
      continue;
    }
    if (!hasLineOfSight(world, other.coord, candidate)) {
      continue;
    }
    const distance = hexDistance(other.coord, candidate);
    if (distance > EFFECT_ZONE_RANGE_HEXES) {
      continue;
    }
    penalty += distance <= 2 ? 2.4 : distance <= 4 ? 1.4 : 0.7;
  }
  return penalty;
}

function perceivedUnitsFor(
  session: Session,
  observer: Unit,
  visibleKeys: Set<string>,
  rememberedHexes: Record<string, number>,
  role: "player" | "observer",
): PerceivedUnitProjection[] {
  return session.world.units
    .filter((unit) => role === "observer" || unit.side === "friendly" || visibleKeys.has(hexKey(unit.coord)))
    .map((unit) => perceivedUnitFor(session, observer, visibleKeys, rememberedHexes, unit, role));
}

function perceivedUnitFor(
  session: Session,
  observer: Unit,
  visibleKeys: Set<string>,
  rememberedHexes: Record<string, number>,
  unit: Unit,
  role: "player" | "observer",
): PerceivedUnitProjection {
  const key = hexKey(unit.coord);
  const visible = role === "observer" || unit.id === observer.id || visibleKeys.has(key);
  const rememberedAt = rememberedHexes[key];
  const latestReport = latestReportForUnit(session, unit.id);
  const hasMemory = typeof rememberedAt === "number" && session.world.time - rememberedAt <= VISIBILITY_MEMORY_SECONDS;
  const lastSeenAt = visible ? session.world.time : hasMemory ? rememberedAt : latestReport?.time;
  const age = typeof lastSeenAt === "number" ? round(session.world.time - lastSeenAt) : undefined;
  const source = visible ? "visual" : hasMemory ? "memory" : latestReport ? "report" : "roster";
  const confidence =
    visible || role === "observer"
      ? "high"
      : typeof age === "number" && age <= 5
        ? "medium"
        : typeof age === "number" && age <= VISIBILITY_MEMORY_SECONDS
          ? "low"
          : latestReport
            ? latestReport.confidence
            : "unknown";

  return {
    unitId: unit.id,
    name: unit.name,
    side: unit.side,
    role: unit.role,
    element: unit.element,
    elementPosition: unit.elementPosition,
    perceivedCoord: visible || hasMemory ? clone(unit.coord) : latestReport?.coord,
    visible,
    lastSeenAt,
    age,
    confidence,
    perceivedStatus: perceivedStatusFor(unit, visible, latestReport),
    source,
  };
}

function perceivedStatusFor(
  unit: Unit,
  visible: boolean,
  latestReport: ReportProjection | undefined,
): PerceivedUnitProjection["perceivedStatus"] {
  if (visible) {
    return unit.posture === "injured" || unit.health <= 0 || unit.status.includes("injured") ? "injured" : "ok";
  }
  if (latestReport?.message.includes("skad")) {
    return "possibly_injured";
  }
  return "unknown";
}

function heardEventsFor(session: Session, listener: Unit, role: "player" | "observer"): HeardEventProjection[] {
  return session.events
    .filter((event) => session.world.time - event.time <= HEARD_EVENT_WINDOW_SECONDS)
    .flatMap((event) => heardEventForDomainEvent(session, listener, role, event))
    .slice(-12);
}

function heardEventForDomainEvent(
  session: Session,
  listener: Unit,
  role: "player" | "observer",
  event: DomainEvent,
): HeardEventProjection[] {
  if (event.type === "order_delivery_resolved" && event.payload.status === "received") {
    const source = session.world.unitsById[String(event.payload.unitId)];
    if (!source) return [];
    return [
      heardEventFromSource(session, listener, role, event, source, "order", `${source.name} uppfattade ordern`),
    ];
  }
  if (event.type === "status_report_emitted") {
    const source = session.world.unitsById[String(event.payload.sourceUnitId)];
    if (!source) return [];
    return [
      heardEventFromSource(
        session,
        listener,
        role,
        event,
        source,
        "report",
        `${source.name}: ${String(event.payload.message ?? "statusrapport")}`,
      ),
    ];
  }
  if (event.type === "movement_waiting") {
    const source = session.world.unitsById[String(event.payload.unitId)];
    if (!source) return [];
    return [
      heardEventFromSource(session, listener, role, event, source, "movement", `${source.name} stannar upp`),
    ];
  }
  if (event.type === "contact_pressure_emitted") {
    const source = session.world.unitsById[String(event.payload.targetId)] ?? listener;
    return [
      heardEventFromSource(session, listener, role, event, source, "contact", "kontakttryck hörs i terrängen"),
    ];
  }
  return [];
}

function heardEventFromSource(
  session: Session,
  listener: Unit,
  role: "player" | "observer",
  event: DomainEvent,
  source: Unit,
  kind: HeardEventProjection["kind"],
  text: string,
): HeardEventProjection {
  const distance = mapDistanceInHexes(listener.position, source.position);
  const clarity = role === "observer" || distance <= 4 ? "clear" : distance <= 9 ? "partial" : "muffled";
  return {
    id: event.id,
    time: event.time,
    kind,
    sourceUnitId: source.id,
    approximateDirection: directionFromMapVector(subtractMapPoint(source.position, listener.position)),
    clarity,
    text,
  };
}

function reportProjection(session: Session): ReportProjection[] {
  return session.events
    .filter((event) => event.type === "status_report_emitted")
    .map((event) => ({
      id: event.id,
      time: event.time,
      sourceUnitId: String(event.payload.sourceUnitId),
      kind:
        event.payload.kind === "movement_wait" || event.payload.kind === "blocking"
          ? (String(event.payload.kind) as ReportProjection["kind"])
          : "status",
      message: String(event.payload.message ?? "statusrapport"),
      coord: clone((event.payload.coord as HexCoord | undefined) ?? { q: 0, r: 0 }),
      confidence:
        event.payload.confidence === "low" || event.payload.confidence === "medium" || event.payload.confidence === "high"
          ? (String(event.payload.confidence) as ReportProjection["confidence"])
          : "medium",
    }))
    .slice(-12);
}

function latestReportForUnit(session: Session, unitId: string): ReportProjection | undefined {
  return [...reportProjection(session)].reverse().find((report) => report.sourceUnitId === unitId);
}

function collectOpposingUnitEvents(
  world: WorldState,
  random: () => number,
): Array<{ type: string; payload: Record<string, unknown> }> {
  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const friendlyUnits = world.units.filter((unit) => unit.side === "friendly");
  const opposingUnits = world.units.filter((unit) => unit.side === "opposing");

  for (const observer of opposingUnits) {
    events.push({ type: "opposing_unit_scanned", payload: { unitId: observer.id, direction: observer.lookDirection } });
    for (const target of friendlyUnits) {
      if (!canSee(world, observer, target)) {
        continue;
      }
      const probability = detectionProbability(world, observer, target);
      const roll = random();
      if (roll <= probability) {
        events.push({
          type: "probabilistic_detection_resolved",
          payload: { observerId: observer.id, targetId: target.id, probability: round(probability), roll: round(roll) },
        });
        events.push({ type: "opposing_unit_alerted", payload: { observerId: observer.id, targetId: target.id } });
        const cover = nearestCover(world, observer.coord);
        if (cover && !sameCoord(cover, observer.coord)) {
          events.push({ type: "opposing_unit_moved_to_cover", payload: { unitId: observer.id, from: observer.coord, to: cover } });
        }
        events.push({
          type: "contact_pressure_emitted",
          payload: { unitId: observer.id, targetId: target.id, kind: "abstract_return_fire" },
        });
      }
    }
  }

  return events;
}

function formationReceivers(world: WorldState, leaderId: string): Unit[] {
  const friendlies = world.units.filter((unit) => unit.side === "friendly");
  return friendlies
    .filter((unit) => unit.id === leaderId || unit.role !== "leader")
    .sort((a, b) => formationReceiverRank(a) - formationReceiverRank(b) || a.id.localeCompare(b.id));
}

function formationReceiverRank(unit: Unit): number {
  if (unit.role === "leader") return 0;
  if (unit.role === "deputy_leader") return 1;
  if (unit.element === "tat_1") return 10 + (unit.elementPosition ?? 9);
  if (unit.element === "tat_2") return 20 + (unit.elementPosition ?? 9);
  return 30;
}

function formationAssignments(
  world: WorldState,
  receivers: Unit[],
  formation: Formation,
  targetPoint: MapPoint,
  direction: Direction,
  directionVector: MapVector = directionVectorFromHexDirection(direction),
): Array<{ unit: Unit; target: HexCoord; targetPoint: MapPoint }> {
  const offsets = formationOffsets(formation, direction, receivers, directionVector);
  const receiverIds = new Set(receivers.map((unit) => unit.id));
  const reserved = new Set(
    world.units
      .filter((unit) => !receiverIds.has(unit.id))
      .map((unit) => hexKey(unit.coord)),
  );
  return receivers.map((unit) => {
    const assignedTargetPoint = addMapPoint(targetPoint, offsets.get(unit.id) ?? { x: 0, y: 0 });
    const assignedTarget = nearestPassableFormationTarget(world, mapPointToHex(assignedTargetPoint), (coord) => {
      const key = hexKey(coord);
      return !reserved.has(key);
    });
    reserved.add(hexKey(assignedTarget));
    return { unit, target: assignedTarget, targetPoint: assignedTargetPoint };
  });
}

function formationOffsets(formation: Formation, direction: Direction, receivers: Unit[], directionVector: MapVector): Map<string, MapVector> {
  const offsets = new Map<string, MapVector>();
  const rankedReceivers = [...receivers].sort((a, b) => formationReceiverRank(a) - formationReceiverRank(b) || a.id.localeCompare(b.id));
  const back = rotateDirection(direction, 3);
  const left = rotateDirection(direction, -2);
  const right = rotateDirection(direction, 2);
  const backLeft = rotateDirection(direction, -2);
  const backRight = rotateDirection(direction, 2);
  const frontLeft = rotateDirection(direction, -1);
  const frontRight = rotateDirection(direction, 1);

  if (formation === "line") {
    for (const unit of rankedReceivers) {
      offsets.set(unit.id, lineOffsetForUnit(unit, directionVector));
    }
    return offsets;
  }

  const offsetsByFormation: Record<Formation, HexCoord[]> = {
    column: [
      { q: 0, r: 0 },
      DIRECTIONS[right],
      coordInDirection({ q: 0, r: 0 }, back, 1),
      coordInDirection({ q: 0, r: 0 }, back, 2),
      coordInDirection({ q: 0, r: 0 }, back, 3),
      addCoord(DIRECTIONS[right], coordInDirection({ q: 0, r: 0 }, back, 1)),
      addCoord(DIRECTIONS[right], coordInDirection({ q: 0, r: 0 }, back, 2)),
      addCoord(DIRECTIONS[right], coordInDirection({ q: 0, r: 0 }, back, 3)),
    ],
    file: [
      { q: 0, r: 0 },
      coordInDirection({ q: 0, r: 0 }, back, 1),
      coordInDirection({ q: 0, r: 0 }, back, 2),
      coordInDirection({ q: 0, r: 0 }, back, 3),
      coordInDirection({ q: 0, r: 0 }, back, 4),
      coordInDirection({ q: 0, r: 0 }, back, 5),
      coordInDirection({ q: 0, r: 0 }, back, 6),
      coordInDirection({ q: 0, r: 0 }, back, 7),
    ],
    line: [
      { q: 0, r: 0 },
      perpendicularLineOffset(direction, "right", 1),
      perpendicularLineOffset(direction, "left", 1),
      perpendicularLineOffset(direction, "left", 2),
      perpendicularLineOffset(direction, "left", 3),
      perpendicularLineOffset(direction, "right", 2),
      perpendicularLineOffset(direction, "right", 3),
      perpendicularLineOffset(direction, "right", 4),
    ],
    wedge: [
      { q: 0, r: 0 },
      DIRECTIONS[back],
      DIRECTIONS[backLeft],
      addCoord(DIRECTIONS[backLeft], DIRECTIONS[back]),
      addCoord(DIRECTIONS[backLeft], DIRECTIONS[backLeft]),
      DIRECTIONS[backRight],
      addCoord(DIRECTIONS[backRight], DIRECTIONS[back]),
      addCoord(DIRECTIONS[backRight], DIRECTIONS[backRight]),
    ],
    dispersed: [
      { q: 0, r: 0 },
      DIRECTIONS[right],
      addCoord(coordInDirection({ q: 0, r: 0 }, left, 2), DIRECTIONS[back]),
      addCoord(coordInDirection({ q: 0, r: 0 }, left, 3), DIRECTIONS[back]),
      addCoord(coordInDirection({ q: 0, r: 0 }, left, 2), DIRECTIONS[frontLeft]),
      addCoord(coordInDirection({ q: 0, r: 0 }, right, 2), DIRECTIONS[back]),
      addCoord(coordInDirection({ q: 0, r: 0 }, right, 3), DIRECTIONS[back]),
      addCoord(coordInDirection({ q: 0, r: 0 }, right, 2), DIRECTIONS[frontRight]),
    ],
    regroup: [
      { q: 0, r: 0 },
      DIRECTIONS[right],
      DIRECTIONS[left],
      DIRECTIONS[back],
      DIRECTIONS[direction],
      DIRECTIONS[frontLeft],
      DIRECTIONS[frontRight],
      addCoord(DIRECTIONS[back], DIRECTIONS[left]),
    ],
  };

  const genericOffsets = offsetsByFormation[formation].slice(0, rankedReceivers.length).map(hexOffsetToMapVector);

  for (let index = genericOffsets.length; index < rankedReceivers.length; index += 1) {
    genericOffsets.push(hexOffsetToMapVector(addCoord(coordInDirection({ q: 0, r: 0 }, back, index - 3), DIRECTIONS[right])));
  }

  rankedReceivers.forEach((unit, index) => offsets.set(unit.id, genericOffsets[index] ?? { x: 0, y: 0 }));
  return offsets;
}

function lineOffsetForUnit(unit: Unit, directionVector: MapVector): MapVector {
  const right = rightPerpendicular(directionVector);
  const left = { x: -right.x, y: -right.y };
  const spacing = HEX_CENTER_STEP * FORMATION_LINE_SPACING_HEXES;
  if (unit.role === "leader") {
    return { x: 0, y: 0 };
  }
  if (unit.role === "deputy_leader") {
    return scaleVector(right, spacing);
  }
  if (unit.element === "tat_1") {
    return scaleVector(left, Math.max(1, unit.elementPosition ?? 1) * spacing);
  }
  if (unit.element === "tat_2") {
    return scaleVector(right, Math.max(2, (unit.elementPosition ?? 1) + 1) * spacing);
  }
  return scaleVector(left, spacing);
}

function perpendicularLineOffset(direction: Direction, side: "left" | "right", distance: number): HexCoord {
  const steps =
    side === "left"
      ? [rotateDirection(direction, -2), rotateDirection(direction, -1)]
      : [rotateDirection(direction, 1), rotateDirection(direction, 2)];
  let offset = { q: 0, r: 0 };
  for (let step = 0; step < distance; step += 1) {
    offset = addCoord(offset, DIRECTIONS[steps[step % steps.length]]);
  }
  return offset;
}

type OrderReception = {
  status: "received" | "missed";
  reason: string;
  relayedBy?: string;
  distance: number;
  hops: number;
};

function resolveOrderReceptions(
  world: WorldState,
  issuer: Unit,
  receivers: Unit[],
  communication: CommunicationMethod,
): Map<string, OrderReception> {
  const receptions = new Map<string, OrderReception>();
  const receiverIds = new Set(receivers.map((receiver) => receiver.id));
  receptions.set(issuer.id, {
    status: "received",
    reason: "issuer",
    distance: 0,
    hops: 0,
  });

  const pairs = relayPairs(world, receivers, issuer.id, communication).filter(([a, b]) => receiverIds.has(a.id) && receiverIds.has(b.id));
  const queue: Unit[] = [issuer];
  while (queue.length > 0) {
    const sender = queue.shift();
    if (!sender) break;
    const senderReception = receptions.get(sender.id);
    if (!senderReception || senderReception.status !== "received") {
      continue;
    }

    for (const receiver of relayNeighbours(sender, pairs)) {
      if (receptions.has(receiver.id)) {
        continue;
      }
      const reception = orderRelayReception(world, sender, receiver, communication, senderReception.hops + 1);
      if (reception.status === "received") {
        receptions.set(receiver.id, reception);
        queue.push(receiver);
      }
    }
  }

  for (const receiver of receivers) {
    if (receptions.has(receiver.id)) {
      continue;
    }
    receptions.set(receiver.id, missedRelayReception(world, receiver, receptions, pairs, communication));
  }

  return receptions;
}

function relayNeighbours(unit: Unit, pairs: Array<[Unit, Unit]>): Unit[] {
  return pairs.flatMap(([a, b]) => (a.id === unit.id ? [b] : b.id === unit.id ? [a] : []));
}

function relayPairs(world: WorldState, receivers: Unit[], leaderId: string, communication: CommunicationMethod): Array<[Unit, Unit]> {
  const pairs = new Map<string, [Unit, Unit]>();
  const addPair = (a: Unit, b: Unit) => {
    const key = [a.id, b.id].sort().join(":");
    if (!pairs.has(key)) {
      pairs.set(key, [a, b]);
    }
  };

  for (const [a, b] of cohesionPairs(world, leaderId)) {
    addPair(a, b);
  }

  for (let i = 0; i < receivers.length; i += 1) {
    for (let j = i + 1; j < receivers.length; j += 1) {
      const a = receivers[i];
      const b = receivers[j];
      const distance = mapDistanceInHexes(a.position, b.position);
      if (communication === "voice" && distance <= 10) {
        addPair(a, b);
      }
      if (communication === "gesture" && distance <= 8 && hasLineOfSight(world, mapPointToHex(a.position), mapPointToHex(b.position))) {
        addPair(a, b);
      }
      if (communication === "radio") {
        addPair(a, b);
      }
    }
  }

  return [...pairs.values()];
}

function missedRelayReception(
  world: WorldState,
  receiver: Unit,
  receptions: Map<string, OrderReception>,
  pairs: Array<[Unit, Unit]>,
  communication: CommunicationMethod,
): OrderReception {
  const senders = relayNeighbours(receiver, pairs).filter((unit) => receptions.get(unit.id)?.status === "received");
  if (senders.length === 0) {
    return {
      status: "missed",
      reason: "relay_path_unreached",
      distance: 0,
      hops: 0,
    };
  }

  const nearest = senders
    .map((sender) => ({
      sender,
      reception: orderRelayReception(world, sender, receiver, communication, (receptions.get(sender.id)?.hops ?? 0) + 1),
    }))
    .sort((a, b) => a.reception.distance - b.reception.distance)[0];
  return nearest?.reception ?? { status: "missed", reason: "relay_path_unreached", distance: 0, hops: 0 };
}

function orderRelayReception(
  world: WorldState,
  sender: Unit,
  receiver: Unit,
  communication: CommunicationMethod,
  hops: number,
): OrderReception {
  const distance = round(mapDistanceInHexes(sender.position, receiver.position));

  if (communication === "voice") {
    return distance <= 10
      ? { status: "received", reason: "audible_relay", relayedBy: sender.id, distance, hops }
      : { status: "missed", reason: "out_of_voice_range", relayedBy: sender.id, distance, hops };
  }

  if (communication === "radio") {
    return { status: "received", reason: "radio_relay", relayedBy: sender.id, distance, hops };
  }

  if (distance > 8) {
    return { status: "missed", reason: "out_of_gesture_range", relayedBy: sender.id, distance, hops };
  }

  return hasLineOfSight(world, mapPointToHex(receiver.position), mapPointToHex(sender.position))
    ? { status: "received", reason: "visual_relay", relayedBy: sender.id, distance, hops }
    : { status: "missed", reason: "no_visual_contact", relayedBy: sender.id, distance, hops };
}

function nearestPassableFormationTarget(world: WorldState, target: HexCoord, isAvailable: (coord: HexCoord) => boolean): HexCoord {
  const candidates = coordsWithinRadius(target, 8);
  const passable = candidates
    .filter((coord) => inBounds(world.map, coord))
    .filter(isAvailable)
    .filter((coord) => !isImpassable(world.map.tilesByKey[hexKey(coord)]))
    .sort((a, b) => hexDistance(a, target) - hexDistance(b, target))[0];
  return passable ?? target;
}

function coordsWithinRadius(center: HexCoord, radius: number): HexCoord[] {
  const coords: HexCoord[] = [];
  for (let dq = -radius; dq <= radius; dq += 1) {
    for (let dr = -radius; dr <= radius; dr += 1) {
      const coord = { q: center.q + dq, r: center.r + dr };
      if (hexDistance(center, coord) <= radius) {
        coords.push(coord);
      }
    }
  }
  return coords;
}

function nearestPath(world: WorldState, from: HexCoord, target: HexCoord, options: PathOptions = {}): { path: HexCoord[]; blocked: boolean } {
  if (sameCoord(from, target)) {
    return { path: [], blocked: false };
  }

  const fromKey = hexKey(from);
  const targetKey = hexKey(target);
  const frontier: Array<{ coord: HexCoord; priority: number }> = [{ coord: from, priority: 0 }];
  const cameFrom = new Map<string, string | undefined>([[fromKey, undefined]]);
  const coords = new Map<string, HexCoord>([[fromKey, from]]);
  const costSoFar = new Map<string, number>([[fromKey, 0]]);
  const maxVisited = options.maxVisited ?? 2500;

  while (frontier.length > 0 && cameFrom.size < maxVisited) {
    frontier.sort((a, b) => a.priority - b.priority);
    const current = frontier.shift();
    if (!current) break;
    const currentKey = hexKey(current.coord);
    if (currentKey === targetKey) {
      return { path: rebuildPath(cameFrom, coords, fromKey, targetKey), blocked: false };
    }

    for (const next of neighbors(current.coord)) {
      const nextKey = hexKey(next);
      if (!inBounds(world.map, next)) continue;
      if (options.blocked?.has(nextKey) && !(options.allowTarget && nextKey === targetKey)) continue;

      const tile = world.map.tilesByKey[nextKey];
      if (!tile || isImpassable(tile)) continue;

      const newCost = (costSoFar.get(currentKey) ?? 0) + tile.moveCost;
      if (newCost >= (costSoFar.get(nextKey) ?? Number.POSITIVE_INFINITY)) continue;

      costSoFar.set(nextKey, newCost);
      cameFrom.set(nextKey, currentKey);
      coords.set(nextKey, next);
      frontier.push({ coord: next, priority: newCost + hexDistance(next, target) });
    }
  }

  return { path: [], blocked: true };
}

function rebuildPath(cameFrom: Map<string, string | undefined>, coords: Map<string, HexCoord>, fromKey: string, targetKey: string): HexCoord[] {
  const path: HexCoord[] = [];
  let currentKey: string | undefined = targetKey;
  while (currentKey && currentKey !== fromKey) {
    const coord = coords.get(currentKey);
    if (!coord) return [];
    path.push(coord);
    currentKey = cameFrom.get(currentKey);
  }
  return path.reverse();
}

function visibleHexesFor(world: WorldState, unit: Unit): HexCoord[] {
  const radius = unit.posture === "prone" ? 4 : unit.posture === "crouched" ? 6 : 8;
  return world.map.tiles
    .filter((tile) => mapDistanceInHexes(unit.position, axialToMapPoint(tile.coord)) <= radius)
    .filter((tile) => isDirectionVisibleFromPoint(unit.lookDirection, unit.position, axialToMapPoint(tile.coord)))
    .map((tile) => tile.coord);
}

function refreshVisibilityMemory(world: WorldState): WorldState {
  const visibilityMemory: Record<string, Record<string, number>> = Object.fromEntries(
    Object.entries(world.visibilityMemory ?? {}).map(([unitId, memory]) => [unitId, { ...memory }]),
  );
  const next = { ...world, visibilityMemory };
  for (const unit of next.units.filter((candidate) => candidate.side === "friendly")) {
    const memory = visibilityMemory[unit.id] ?? {};
    for (const coord of visibleHexesFor(next, unit)) {
      memory[hexKey(coord)] = next.time;
    }
    visibilityMemory[unit.id] = memory;
  }
  return next;
}

function canSee(world: WorldState, observer: Unit, target: Unit): boolean {
  if (mapDistanceInHexes(observer.position, target.position) > 10) {
    return false;
  }
  if (!isDirectionVisibleFromPoint(observer.lookDirection, observer.position, target.position)) {
    return false;
  }
  return hasLineOfSight(world, mapPointToHex(observer.position), mapPointToHex(target.position));
}

function hasLineOfSight(world: WorldState, from: HexCoord, to: HexCoord): boolean {
  return !lineBetween(from, to).some((coord) => {
    if (sameCoord(coord, from) || sameCoord(coord, to)) {
      return false;
    }
    return world.map.tilesByKey[hexKey(coord)]?.blocksSight;
  });
}

function detectionProbability(world: WorldState, _observer: Unit, target: Unit): number {
  const tile = world.map.tilesByKey[hexKey(target.coord)];
  const posture = target.posture === "standing" ? 0.25 : target.posture === "crouched" ? -0.1 : -0.25;
  const terrain = (tile?.exposure ?? 1) * 0.18 - (tile?.cover ?? 0) * 0.12 - (tile?.concealment ?? 0) * 0.1;
  return clamp(0.1 + posture + terrain, 0.05, 0.95);
}

function nearestCover(world: WorldState, from: HexCoord): HexCoord | undefined {
  const occupied = new Set(world.units.filter((unit) => !sameCoord(unit.coord, from)).map((unit) => hexKey(unit.coord)));
  return neighbors(from)
    .filter((coord) => inBounds(world.map, coord))
    .filter((coord) => !occupied.has(hexKey(coord)))
    .sort((a, b) => {
      const tileA = world.map.tilesByKey[hexKey(a)];
      const tileB = world.map.tilesByKey[hexKey(b)];
      return (tileB?.cover ?? 0) - (tileA?.cover ?? 0);
    })
    .find((coord) => (world.map.tilesByKey[hexKey(coord)]?.cover ?? 0) > (world.map.tilesByKey[hexKey(from)]?.cover ?? 0));
}

function occupiedHexes(world: WorldState, exceptUnitId?: string): Set<string> {
  return new Set(world.units.filter((unit) => unit.id !== exceptUnitId).map((unit) => hexKey(unit.coord)));
}

function movementRate(unit: Unit): number {
  if (unit.posture === "prone") {
    return 0.25;
  }
  if (unit.posture === "crouched") {
    return 0.6;
  }
  return 1;
}

function isDirectionVisible(direction: Direction, from: HexCoord, to: HexCoord): boolean {
  if (sameCoord(from, to)) {
    return true;
  }
  const targetDirection = directionBetween(from, to);
  if (!targetDirection) {
    return true;
  }
  return directionDelta(direction, targetDirection) <= 1;
}

function isDirectionVisibleFromPoint(direction: Direction, from: MapPoint, to: MapPoint): boolean {
  if (mapDistanceInHexes(from, to) < 0.05) {
    return true;
  }
  const targetDirection = directionFromMapVector(subtractMapPoint(to, from));
  return directionDelta(direction, targetDirection) <= 1;
}

function directionFromMapVector(vector: MapVector): Direction {
  const normalized = normalizeVector(vector);
  return DIRECTION_ORDER.map((direction) => {
    const directionVector = directionVectorFromHexDirection(direction);
    return {
      direction,
      dot: normalized.x * directionVector.x + normalized.y * directionVector.y,
    };
  }).sort((a, b) => b.dot - a.dot)[0].direction;
}

function directionBetween(from: HexCoord, to: HexCoord): Direction | undefined {
  if (sameCoord(from, to)) {
    return undefined;
  }
  const best = DIRECTION_ORDER.map((direction) => ({
    direction,
    distance: hexDistance(addCoord(from, DIRECTIONS[direction]), to),
  })).sort((a, b) => a.distance - b.distance)[0];
  return best?.direction;
}

function directionDelta(a: Direction, b: Direction): number {
  const ai = DIRECTION_ORDER.indexOf(a);
  const bi = DIRECTION_ORDER.indexOf(b);
  const raw = Math.abs(ai - bi);
  return Math.min(raw, DIRECTION_ORDER.length - raw);
}

function rotateDirection(direction: Direction, steps: number): Direction {
  const index = DIRECTION_ORDER.indexOf(direction);
  return DIRECTION_ORDER[(index + steps + DIRECTION_ORDER.length * 2) % DIRECTION_ORDER.length];
}

function coordInDirection(from: HexCoord, direction: Direction, distance: number): HexCoord {
  let next = from;
  for (let step = 0; step < distance; step += 1) {
    next = addCoord(next, DIRECTIONS[direction]);
  }
  return next;
}

function directionVectorFromTarget(from: HexCoord | MapPoint, target: HexCoord | undefined): MapVector | undefined {
  const fromPoint = "q" in from ? axialToMapPoint(from) : from;
  if (!target) {
    return undefined;
  }
  const targetPoint = axialToMapPoint(target);
  return directionVectorFromTargetPoint(fromPoint, targetPoint);
}

function directionVectorFromTargetPoint(fromPoint: MapPoint, targetPoint: MapPoint | undefined): MapVector | undefined {
  if (!targetPoint) {
    return undefined;
  }
  if (mapDistanceInHexes(fromPoint, targetPoint) < 0.05) {
    return undefined;
  }
  return normalizeVector(subtractMapPoint(targetPoint, fromPoint));
}

function directionVectorFromHexDirection(direction: Direction): MapVector {
  return normalizeVector(hexOffsetToMapVector(DIRECTIONS[direction]));
}

function hexOffsetToMapVector(offset: HexCoord): MapVector {
  return axialToMapPoint(offset);
}

function axialToMapPoint(coord: HexCoord): MapPoint {
  return {
    x: Math.sqrt(3) * (coord.q + coord.r / 2),
    y: 1.5 * coord.r,
  };
}

function mapPointToHex(point: MapPoint): HexCoord {
  const q = (Math.sqrt(3) / 3) * point.x - point.y / 3;
  const r = (2 / 3) * point.y;
  return cubeRound({ x: q, y: -q - r, z: r });
}

function addMapPoint(a: MapPoint, b: MapVector): MapPoint {
  return { x: a.x + b.x, y: a.y + b.y };
}

function subtractMapPoint(a: MapPoint, b: MapPoint): MapVector {
  return { x: a.x - b.x, y: a.y - b.y };
}

function mapDistanceInHexes(a: MapPoint, b: MapPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y) / HEX_CENTER_STEP;
}

function moveMapPointToward(from: MapPoint, to: MapPoint, distance: number): MapPoint {
  const delta = subtractMapPoint(to, from);
  const length = Math.hypot(delta.x, delta.y);
  if (length <= distance || length === 0) {
    return clone(to);
  }
  const vector = normalizeVector(delta);
  return { x: from.x + vector.x * distance, y: from.y + vector.y * distance };
}

function averageMapPoint(points: MapPoint[]): MapPoint {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }
  const sum = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}

function scaleVector(vector: MapVector, scalar: number): MapVector {
  return { x: vector.x * scalar, y: vector.y * scalar };
}

function normalizeVector(vector: MapVector): MapVector {
  const length = Math.hypot(vector.x, vector.y);
  return length > 0 ? { x: vector.x / length, y: vector.y / length } : { x: 0, y: -1 };
}

function rightPerpendicular(vector: MapVector): MapVector {
  const normalized = normalizeVector(vector);
  return { x: -normalized.y, y: normalized.x };
}

function averageCoord(coords: HexCoord[]): HexCoord {
  if (coords.length === 0) {
    return { q: 0, r: 0 };
  }
  const sum = coords.reduce(
    (acc, coord) => ({
      q: acc.q + coord.q,
      r: acc.r + coord.r,
    }),
    { q: 0, r: 0 },
  );
  return { q: Math.round(sum.q / coords.length), r: Math.round(sum.r / coords.length) };
}

function neighbors(coord: HexCoord): HexCoord[] {
  return DIRECTION_ORDER.map((direction) => addCoord(coord, DIRECTIONS[direction]));
}

function lineBetween(from: HexCoord, to: HexCoord): HexCoord[] {
  const distance = hexDistance(from, to);
  if (distance === 0) {
    return [from];
  }
  const results: HexCoord[] = [];
  for (let i = 0; i <= distance; i += 1) {
    const t = i / distance;
    results.push(cubeRound(lerpCube(axialToCube(from), axialToCube(to), t)));
  }
  return dedupeCoords(results);
}

function axialToCube(coord: HexCoord): { x: number; y: number; z: number } {
  return { x: coord.q, z: coord.r, y: -coord.q - coord.r };
}

function lerpCube(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
  t: number,
): { x: number; y: number; z: number } {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

function cubeRound(cube: { x: number; y: number; z: number }): HexCoord {
  let rx = Math.round(cube.x);
  let ry = Math.round(cube.y);
  let rz = Math.round(cube.z);
  const xDiff = Math.abs(rx - cube.x);
  const yDiff = Math.abs(ry - cube.y);
  const zDiff = Math.abs(rz - cube.z);
  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }
  return { q: rx, r: rz };
}

function dedupeCoords(coords: HexCoord[]): HexCoord[] {
  const seen = new Set<string>();
  return coords.filter((coord) => {
    const key = hexKey(coord);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function indexMap(map: GameMap): GameMap {
  return {
    ...map,
    tilesByKey: Object.fromEntries(map.tiles.map((tile) => [hexKey(tile.coord), tile])),
  };
}

function indexWorld(world: WorldState): WorldState {
  const units = world.units.map((unit) => ({
    ...clone(unit),
    position: clone(unit.position ?? axialToMapPoint(unit.coord)),
  }));
  return {
    ...world,
    map: indexMap(world.map),
    units,
    unitsById: Object.fromEntries(units.map((unit) => [unit.id, unit])),
    visibilityMemory: clone(world.visibilityMemory ?? {}),
  };
}

function mutableUnit(world: WorldState, unitId: string): Unit {
  const unit = maybeMutableUnit(world, unitId);
  if (!unit) {
    throw new Error(`unknown unit: ${unitId}`);
  }
  return unit;
}

function maybeMutableUnit(world: WorldState, unitId: string): Unit | undefined {
  return world.units.find((unit) => unit.id === unitId);
}

function isImpassable(tile: HexTile): boolean {
  return tile.terrain === "wall" && tile.moveCost >= 3;
}

function inBounds(map: GameMap, coord: HexCoord): boolean {
  return coord.q >= 0 && coord.r >= 0 && coord.q < map.width && coord.r < map.height;
}

function addCoord(a: HexCoord, b: HexCoord): HexCoord {
  return { q: a.q + b.q, r: a.r + b.r };
}

function sameCoord(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

function hexKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string): () => number {
  let state = hashString(seed);
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return ((state >>> 0) % 10000) / 10000;
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function roundTime(value: number): number {
  return Math.round(value * 1000) / 1000;
}
