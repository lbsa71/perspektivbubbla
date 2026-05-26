export type Direction = "N" | "NE" | "SE" | "S" | "SW" | "NW";
export type TerrainType = "field" | "grass" | "forest" | "ditch" | "wall" | "road" | "water" | "bridge";
export type Posture = "standing" | "crouched" | "prone" | "moving" | "helping" | "injured";
export type Side = "friendly" | "opposing";
export type Formation = "column" | "line" | "file" | "wedge" | "dispersed" | "regroup";
export type CommunicationMethod = "voice" | "gesture" | "radio";
export type UnitRole = "leader" | "deputy_leader" | "soldier" | "observer";
export type GroupElement = "command" | "tat_1" | "tat_2";
export type HexVisibility = "visible" | "memory" | "unknown";
export type FormationPhase = "forming" | "advancing";
export type DifficultyLevel = "training" | "normal" | "realistic";
export type ScenarioId =
  | "cover_to_cover"
  | "cover_to_cover_hasty"
  | "cover_to_cover_observed"
  | "risk_zone_blocking"
  | "leader_lost_picture"
  | "river_bridge_crossing"
  | "ditch_line_contact"
  | "casualty_retreat";
type ScenarioKind = "soldier" | "risk_zone" | "group_commander";
type ScenarioMapPlan = {
  clearings?: Array<{ center: HexCoord; radius: number; terrain?: TerrainType }>;
  fieldCorridors?: Array<{ from: HexCoord; to: HexCoord; width: number; bend?: number }>;
  roads?: Array<{ from: HexCoord; to: HexCoord; width?: number; bend?: number }>;
  ditches?: Array<{ from: HexCoord; to: HexCoord; width?: number; bend?: number }>;
  rivers?: Array<{ from: HexCoord; to: HexCoord; width?: number; bend?: number; bridges?: Array<{ coord: HexCoord; radius?: number }> }>;
  forests?: Array<{ center: HexCoord; radius: number }>;
};
type OpposingUnitSeed = Partial<Pick<Unit, "id" | "coord" | "facing" | "lookDirection" | "posture" | "alerted" | "status">>;

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

export type InformationMode = DifficultyLevel;

export type ScenarioTroopPreview = {
  id: string;
  name: string;
  role: UnitRole;
  element?: GroupElement;
  elementPosition?: number;
};

export type U3TAxis = "uppgiften" | "tiden" | "truppen" | "terrangen";

export type U3TBrief = Record<U3TAxis, string>;

export type ExposureSampleThreshold = {
  exposureAtLeast: 1 | 2 | 3;
  samples: number;
  hard?: boolean;
};

export type CumulativeExposureThreshold = {
  exposure: number;
  hard?: boolean;
};

export type TrainingConstraints = {
  timeLimitSeconds?: number;
  maxExposureSamples?: ExposureSampleThreshold;
  maxCumulativeExposure?: CumulativeExposureThreshold;
  maxContactEvents?: number;
  maxDetectionEvents?: number;
  maxWounded?: number;
};

export type ScenarioTraining = {
  u3t: U3TBrief;
  constraints?: TrainingConstraints;
  aarFocus?: string[];
};

export type ScenarioOption = {
  id: ScenarioId;
  title: string;
  subtitle: string;
  description: string;
  troop: ScenarioTroopPreview[];
  goal: {
    title: string;
    description: string;
    target: HexCoord;
  };
  defaultDifficulty: DifficultyLevel;
  recommendedFormation?: Formation;
  training?: ScenarioTraining;
};

export type ScenarioRuntime = {
  id: ScenarioId;
  title: string;
  subtitle: string;
  description: string;
  difficulty: DifficultyLevel;
  troop: ScenarioTroopPreview[];
  goal: {
    title: string;
    description: string;
    target: HexCoord;
  };
  recommendedFormation?: Formation;
  training?: ScenarioTraining;
};

export type TrainingMetricState = "good" | "warn" | "bad";

export type TrainingMetric = {
  id: string;
  label: string;
  value: string;
  state: TrainingMetricState;
  detail?: string;
};

export type TrainingMetrics = {
  elapsedSeconds: number;
  distanceHexes: number;
  exposureSamples: number;
  highExposureSamples: number;
  highExposureThreshold?: number;
  severeExposureSamples: number;
  cumulativeExposure: number;
  contactEvents: number;
  detectionEvents: number;
  incomingFireEvents: number;
  wounded: number;
  thresholdsExceeded: string[];
  hardFailures: string[];
  metrics: TrainingMetric[];
};

export type U3TObservation = {
  axis: U3TAxis;
  label: string;
  state: TrainingMetricState;
  text: string;
};

export type TrainingAssessment = {
  brief: U3TBrief;
  constraints?: TrainingConstraints;
  aarFocus: string[];
  metrics: TrainingMetrics;
  observations: U3TObservation[];
};

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

export type TacticalManeuverType = "alternating_forward" | "alternating_retreat" | "zipper_retreat" | "casualty_recovery";
export type TacticalManeuverPhase = "covering" | "moving" | "handoff" | "completed";
export type ZipperSide = "left" | "right";
export type CasualtyTeamMode =
  | "advancing_with_group"
  | "retreating_with_group"
  | "handoff";
export type CasualtyTeamIntent = "holding" | "moving" | "handoff" | "blocked";
export type CasualtyTeamWaitReason =
  | "covering_bound"
  | "casualty_team_blocked"
  | "carrier_missing"
  | "handoff_pending"
  | "spacing_blocked";

export type TacticalManeuverState = {
  orderId: string;
  type: TacticalManeuverType;
  phase: TacticalManeuverPhase;
  direction: Direction;
  directionVector?: MapVector;
  communication: CommunicationMethod;
  coveringUnitIds: string[];
  movingUnitIds: string[];
  casualtyUnitId?: string;
  carrierUnitIds?: string[];
  requestedReinforcement?: { unitId?: string; forUnitId: string; requestedAt: number };
  zipperSide?: ZipperSide;
  stepIndex?: number;
  boundIndex?: number;
  boundStartedUnitIds?: string[];
  issuedAt: number;
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
  suppression: number;
  fireCooldown: number;
  lastFiredAt?: number;
  posture: Posture;
  status: string[];
  intent: UnitIntent;
  alerted: boolean;
  currentOrderId?: string;
};

export type UnitActivityProjection = {
  state: "moving" | "waiting" | "blocked" | "holding" | "injured" | "idle";
  target: HexCoord;
  targetPoint?: MapPoint;
  reason?: string;
  relatedUnitId?: string;
  relatedUnitIds?: string[];
  tacticalRole?: "covering" | "moving" | "carrier" | "casualty" | "handoff" | "reinforcement" | "resting";
  orderId?: string;
  progress?: number;
  pathLength?: number;
  updatedAt?: number;
};

export type ProjectedUnit = Unit & {
  activity: UnitActivityProjection;
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
  scenario: ScenarioRuntime;
  difficulty: DifficultyLevel;
  time: number;
  objective: ObjectiveState;
  map: GameMap;
  units: Unit[];
  unitsById: Record<string, Unit>;
  visibilityMemory: Record<string, Record<string, number>>;
  activeFormation?: FormationState;
  activeManeuver?: TacticalManeuverState;
  casualtyEvacuation?: CasualtyEvacuationState;
  casualtyTeam?: CasualtyTeamState;
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
  constraints?: TrainingConstraints;
};

export type CasualtyCollectionPointId = "asa1" | "asa2";

export type CasualtyCollectionPointState = {
  id: CasualtyCollectionPointId;
  label: string;
  coord: HexCoord;
  point: MapPoint;
  setAt?: number;
};

export type CasualtyEvacuationState = {
  collectionPointId?: CasualtyCollectionPointId;
  activeCollectionPointId?: CasualtyCollectionPointId;
  collectionPoints?: Partial<Record<CasualtyCollectionPointId, CasualtyCollectionPointState>>;
  collectionPoint?: HexCoord;
  collectionPointPoint?: MapPoint;
  orderId?: string;
  casualtyUnitId?: string;
  helperUnitIds: string[];
  carrierUnitIds?: string[];
  underFire?: boolean;
  requestedReinforcement?: { unitId?: string; forUnitId: string; requestedAt: number };
  phase: "idle" | "moving_to_casualty" | "dragging" | "completed";
  issuedAt?: number;
};

export type CasualtyTeamState = {
  casualtyUnitId: string;
  carrierUnitIds: string[];
  assignedElement?: GroupElement;
  mode: CasualtyTeamMode;
  teamIntent: CasualtyTeamIntent;
  teamTarget?: HexCoord;
  teamTargetPoint?: MapPoint;
  carrierSlots: Record<string, HexCoord>;
  carrierSlotPoints: Record<string, MapPoint>;
  casualtySlot?: HexCoord;
  casualtySlotPoint?: MapPoint;
  waitReason?: CasualtyTeamWaitReason;
  updatedAt?: number;
};

export type DomainEvent = {
  id: string;
  sessionId: string;
  sequence: number;
  time: number;
  type: string;
  payload: Record<string, unknown>;
};

type PendingDomainEvent = Pick<DomainEvent, "type" | "payload">;

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
    }
  | {
      type: "issue_alternating_forward_order";
      unitId: string;
      direction: Direction;
      directionTarget?: HexCoord;
      directionTargetPoint?: MapPoint;
      communication: CommunicationMethod;
      issuedAt: number;
    }
  | {
      type: "issue_alternating_retreat_order";
      unitId: string;
      direction: Direction;
      directionTarget?: HexCoord;
      directionTargetPoint?: MapPoint;
      communication: CommunicationMethod;
      issuedAt: number;
    }
  | {
      type: "issue_zipper_retreat_order";
      unitId: string;
      side: ZipperSide;
      direction: Direction;
      directionTarget?: HexCoord;
      directionTargetPoint?: MapPoint;
      communication: CommunicationMethod;
      issuedAt: number;
    }
  | {
      type: "set_casualty_collection_point";
      unitId: string;
      collectionPointId?: CasualtyCollectionPointId;
      target: HexCoord;
      issuedAt: number;
    }
  | {
      type: "start_casualty_evacuation";
      unitId: string;
      collectionPointId?: CasualtyCollectionPointId;
      casualtyUnitId?: string;
      target?: HexCoord;
      issuedAt: number;
    };

export type PhaseOneOverrides = {
  player?: Partial<Pick<Unit, "coord" | "facing" | "lookDirection" | "posture">>;
  opposing?: Array<Partial<Pick<Unit, "id" | "coord" | "facing" | "lookDirection" | "posture">>>;
  terrainPatches?: Array<{ coord: HexCoord; terrain: TerrainType }>;
};

export type CreateSessionOptions = {
  seed?: string;
  scenario?: "soldier" | "group_commander" | "risk_zone" | ScenarioId;
  scenarioId?: ScenarioId;
  difficulty?: DifficultyLevel;
  overrides?: PhaseOneOverrides;
};

export type AdvanceOptions = {
  random?: () => number;
};

export type Projection = {
  sessionId: string;
  time: number;
  scenario: ScenarioRuntime;
  objective: ObjectiveState;
  casualtyEvacuation?: CasualtyEvacuationState;
  casualtyTeam?: CasualtyTeamState;
  activeFormation?: FormationState;
  activeManeuver?: TacticalManeuverState;
  map: {
    width: number;
    height: number;
    hexSizeMeters: number;
    visibleHexes: HexCoord[];
    tiles: ProjectedHexTile[];
  };
  player: ProjectedUnit;
  units: ProjectedUnit[];
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
    orderEvents: DomainEvent[];
    reportEvents: DomainEvent[];
    heardEvents: HeardEventProjection[];
    u3t?: TrainingAssessment;
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
const FORMATION_FILE_SPACING_HEXES = 2;
const FORWARD_TARGET_EDGE_MARGIN = 8;
const FORMATION_SLOT_WEIGHT = 4;
const FORMATION_CENTER_WEIGHT = 0.35;
const FORMATION_NEIGHBOUR_WEIGHT = 2.4;
const FORMATION_FORWARD_WEIGHT = 0.9;
const FORMATION_TERRAIN_WEIGHT = 0.4;
const VISIBILITY_MEMORY_SECONDS = 10;
const EFFECT_ZONE_RANGE_HEXES = 6;
const HEARD_EVENT_WINDOW_SECONDS = 12;
const OBJECTIVE_SINGLE_RADIUS_HEXES = 1;
const OBJECTIVE_GROUP_RADIUS_HEXES = 3;
const OBJECTIVE_GROUP_REQUIRED_RATIO = 0.75;
const FIRE_RESOLUTION_WINDOW_SECONDS = 2.5;
const SUPPRESSED_FIRE_INTERVAL_MULTIPLIER = 2.5;
const RETREAT_BOUND_HEXES = 2;
const ALTERNATING_FORWARD_SLOT_SPACING_HEXES = 2;
const ALTERNATING_FORWARD_BOUND_HEXES = 2;
const RETREAT_FIRE_INTERVAL_SECONDS = 1.5;
const RETREAT_STAMINA_COST_PER_HEX = 2.2;
const COVERING_FIRE_STAMINA_COST = 2.5;
const CASUALTY_DRAG_STAMINA_COST_PER_SECOND = 6;
const CASUALTY_REINFORCEMENT_STAMINA_THRESHOLD = 45;
const SUPPRESSION_DECAY_PER_SECOND = 0.18;
const FRIENDLY_FIRE_SUPPRESSION = 0.34;
const FRIENDLY_FIRE_MAX_CASUALTY_PROBABILITY = 0.5;
const SUPPRESSION_CASUALTY_RISK_REDUCTION = 0.18;

const SCENARIO_OPTIONS: Array<ScenarioOption & { kind: ScenarioKind; start: HexCoord; facing: Direction; map: ScenarioMapPlan }> = [
  {
    id: "cover_to_cover",
    kind: "soldier",
    title: "Från skydd till skydd",
    subtitle: "En soldat",
    description: "Rör dig från ett utsatt läge till nästa skydd utan att tappa orienteringen eller bygga onödig exponering.",
    start: { q: 8, r: 50 },
    facing: "SE",
    troop: [
      { id: "FRIENDLY_1", name: "Andersson", role: "soldier", element: "command" },
    ],
    goal: {
      title: "Ta dig till skyddspunkten",
      description: "Välj väg, håll koll på siktfältet och använd terrängens skydd och skyl.",
      target: { q: 30, r: 50 },
    },
    defaultDifficulty: "training",
    training: {
      u3t: {
        uppgiften: "Ta dig från startläget till skyddspunkten och kunna förklara vilket skydd du valde härnäst.",
        tiden: "Ingen hård tidsgräns. Tempot bedöms mot hur mycket exponering rutten byggde upp.",
        truppen: "En soldat. Motståndaren finns på djupet och reagerar främst på onödig exponering.",
        terrangen: "Väg och öppen mark är snabbare men synliga. Dike och skog ger skydd och skyl.",
      },
      constraints: {
        maxExposureSamples: { exposureAtLeast: 2, samples: 18 },
        maxCumulativeExposure: { exposure: 35 },
        maxContactEvents: 0,
        maxWounded: 0,
      },
      aarFocus: ["Val av nästa skydd", "Exponeringstid", "Sikt mot trolig fiende", "Tempo kontra skydd"],
    },
    map: {
      fieldCorridors: [{ from: { q: 6, r: 50 }, to: { q: 32, r: 50 }, width: 4, bend: 1 }],
      roads: [{ from: { q: 4, r: 52 }, to: { q: 34, r: 48 }, bend: 2 }],
      ditches: [{ from: { q: 16, r: 46 }, to: { q: 18, r: 56 }, bend: 1 }],
      forests: [{ center: { q: 30, r: 50 }, radius: 2 }],
      clearings: [{ center: { q: 8, r: 50 }, radius: 3 }],
    },
  },
  {
    id: "cover_to_cover_hasty",
    kind: "soldier",
    title: "Från skydd till skydd: tidspress",
    subtitle: "En soldat / tid",
    description: "Lös samma förflyttning när tiden är styrande: välj när det är värt att ta snabbare men mer exponerad terräng.",
    start: { q: 8, r: 54 },
    facing: "SE",
    troop: [
      { id: "FRIENDLY_1", name: "Andersson", role: "soldier", element: "command" },
    ],
    goal: {
      title: "Nå skyddet före tidsgränsen",
      description: "Ta dig till skogskanten innan tiden går ut, utan att fastna i kontakt eller bli utslagen.",
      target: { q: 29, r: 50 },
    },
    defaultDifficulty: "training",
    training: {
      u3t: {
        uppgiften: "Nå nästa skydd innan tidsgränsen utan att bli bunden av fiendens observation.",
        tiden: "55 sekunder. Sen ankomst är ett misslyckat genomförande, även om rutten var försiktig.",
        truppen: "En soldat mot observerande fiende längre fram. Du kan acceptera kort exponering men inte skada.",
        terrangen: "Vägen ger fart. Diket och skogskanterna ger lägre risk men kan kosta tid.",
      },
      constraints: {
        timeLimitSeconds: 55,
        maxExposureSamples: { exposureAtLeast: 3, samples: 10 },
        maxContactEvents: 1,
        maxWounded: 0,
      },
      aarFocus: ["Tidsmarginal", "När du valde snabb mark", "Kontakttryck", "Sista skyddet före målet"],
    },
    map: {
      fieldCorridors: [{ from: { q: 6, r: 54 }, to: { q: 31, r: 50 }, width: 4, bend: 1 }],
      roads: [{ from: { q: 5, r: 55 }, to: { q: 31, r: 49 }, bend: 1 }],
      ditches: [{ from: { q: 14, r: 51 }, to: { q: 22, r: 53 }, bend: 1 }],
      forests: [
        { center: { q: 17, r: 52 }, radius: 2 },
        { center: { q: 29, r: 50 }, radius: 2 },
      ],
      clearings: [{ center: { q: 8, r: 54 }, radius: 3 }],
    },
  },
  {
    id: "cover_to_cover_observed",
    kind: "soldier",
    title: "Från skydd till skydd: observerad terräng",
    subtitle: "En soldat / fiende",
    description: "Förflytta dig genom terräng där fiendens blickfält gör vägen dit viktigare än att bara nå målhexen.",
    start: { q: 8, r: 50 },
    facing: "SE",
    troop: [
      { id: "FRIENDLY_1", name: "Andersson", role: "soldier", element: "command" },
    ],
    goal: {
      title: "Nå skyddet utan att bli upptäckt",
      description: "Använd döda vinklar, dike och skog så att exponeringen aldrig blir rutten som förklarar fiendekontakten.",
      target: { q: 31, r: 50 },
    },
    defaultDifficulty: "normal",
    training: {
      u3t: {
        uppgiften: "Nå målskyddet utan upptäckt. Rutten ska kunna motiveras utifrån fiendens observation.",
        tiden: "Ingen fast tidsgräns. Tiden i observerbar terräng är däremot begränsad.",
        truppen: "En soldat mot två observatörer. Upptäckt, kontakt eller skada bryter övningens syfte.",
        terrangen: "Öppen korridor och väg är farliga. Dike, skog och flankförflyttning håller exponeringen nere.",
      },
      constraints: {
        maxExposureSamples: { exposureAtLeast: 2, samples: 8, hard: true },
        maxCumulativeExposure: { exposure: 28, hard: true },
        maxDetectionEvents: 0,
        maxContactEvents: 0,
        maxWounded: 0,
      },
      aarFocus: ["Fiendens blickfält", "Exponerade hexar", "Död mark", "Varför rutten inte blev upptäckt"],
    },
    map: {
      fieldCorridors: [{ from: { q: 6, r: 50 }, to: { q: 33, r: 50 }, width: 5, bend: 1 }],
      roads: [{ from: { q: 5, r: 52 }, to: { q: 35, r: 48 }, bend: 1 }],
      ditches: [
        { from: { q: 14, r: 47 }, to: { q: 22, r: 55 }, bend: 1 },
        { from: { q: 24, r: 53 }, to: { q: 31, r: 50 }, bend: 1 },
      ],
      forests: [
        { center: { q: 13, r: 49 }, radius: 2 },
        { center: { q: 22, r: 47 }, radius: 2 },
        { center: { q: 31, r: 50 }, radius: 2 },
      ],
      clearings: [{ center: { q: 8, r: 50 }, radius: 2 }],
    },
  },
  {
    id: "risk_zone_blocking",
    kind: "risk_zone",
    title: "Riskzon och blockering",
    subtitle: "Två soldater",
    description: "För två soldater framåt utan att de skymmer varandras effektzoner eller tappar täckning.",
    start: { q: 8, r: 50 },
    facing: "SE",
    troop: [
      { id: "LEADER_1", name: "Lind", role: "leader", element: "tat_1", elementPosition: 1 },
      { id: "FRIENDLY_1", name: "Andersson", role: "soldier", element: "tat_1", elementPosition: 2 },
    ],
    goal: {
      title: "Passera utan att blockera",
      description: "Justera rörelse och blick så att båda kan bidra framåt.",
      target: { q: 24, r: 50 },
    },
    defaultDifficulty: "training",
    recommendedFormation: "line",
    map: {
      fieldCorridors: [{ from: { q: 6, r: 50 }, to: { q: 28, r: 50 }, width: 4, bend: 1 }],
      roads: [{ from: { q: 4, r: 51 }, to: { q: 30, r: 49 }, bend: 2 }],
      ditches: [{ from: { q: 18, r: 45 }, to: { q: 22, r: 56 }, bend: 1 }],
      forests: [{ center: { q: 24, r: 50 }, radius: 2 }],
      clearings: [{ center: { q: 8, r: 50 }, radius: 3 }],
    },
  },
  {
    id: "leader_lost_picture",
    kind: "group_commander",
    title: "Skadad soldat och tappad lägesbild",
    subtitle: "Gruppchef",
    description: "Led en åttamannagrupp när rapporter, blockeringar och status inte längre är helt säkra.",
    start: { q: 8, r: 50 },
    facing: "SE",
    troop: [
      { id: "LEADER_1", name: "Lind", role: "leader", element: "tat_1", elementPosition: 1 },
      { id: "DEPUTY_1", name: "Nordin", role: "deputy_leader", element: "tat_2", elementPosition: 1 },
      { id: "FRIENDLY_1", name: "Andersson", role: "soldier", element: "tat_1", elementPosition: 2 },
      { id: "FRIENDLY_2", name: "Berg", role: "soldier", element: "tat_1", elementPosition: 3 },
      { id: "FRIENDLY_3", name: "Ceder", role: "soldier", element: "tat_1", elementPosition: 4 },
      { id: "FRIENDLY_4", name: "Dahl", role: "soldier", element: "tat_2", elementPosition: 2 },
      { id: "FRIENDLY_5", name: "Ek", role: "soldier", element: "tat_2", elementPosition: 3 },
      { id: "FRIENDLY_6", name: "Falk", role: "soldier", element: "tat_2", elementPosition: 4 },
    ],
    goal: {
      title: "För gruppen till skydd",
      description: "För gruppen över öppen mark och behåll tillräcklig lägesbild för att följa upp tappad status.",
      target: { q: 30, r: 50 },
    },
    defaultDifficulty: "normal",
    recommendedFormation: "line",
    map: {
      fieldCorridors: [{ from: { q: 8, r: 50 }, to: { q: 34, r: 50 }, width: 5, bend: 1 }],
      roads: [{ from: { q: 2, r: 52 }, to: { q: 38, r: 48 }, bend: 2 }],
      ditches: [
        { from: { q: 14, r: 47 }, to: { q: 18, r: 52 }, bend: 1 },
        { from: { q: 24, r: 54 }, to: { q: 29, r: 57 }, bend: 1 },
      ],
      forests: [{ center: { q: 30, r: 50 }, radius: 2 }],
      clearings: [{ center: { q: 8, r: 50 }, radius: 4 }],
    },
  },
  {
    id: "casualty_retreat",
    kind: "group_commander",
    title: "Skadad under reträtt",
    subtitle: "Växelvis bakåt",
    description: "Öva växelvis bakåt, blixtlås och omhändertagande under eld. ÅSA markerar när gruppen är i säkerhet för sjukvård.",
    start: { q: 22, r: 52 },
    facing: "SE",
    troop: [
      { id: "LEADER_1", name: "Lind", role: "leader", element: "tat_1", elementPosition: 1 },
      { id: "DEPUTY_1", name: "Nordin", role: "deputy_leader", element: "tat_2", elementPosition: 1 },
      { id: "FRIENDLY_1", name: "Andersson", role: "soldier", element: "tat_1", elementPosition: 2 },
      { id: "FRIENDLY_2", name: "Berg", role: "soldier", element: "tat_1", elementPosition: 3 },
      { id: "FRIENDLY_3", name: "Ceder", role: "soldier", element: "tat_1", elementPosition: 4 },
      { id: "FRIENDLY_4", name: "Dahl", role: "soldier", element: "tat_2", elementPosition: 2 },
      { id: "FRIENDLY_5", name: "Ek", role: "soldier", element: "tat_2", elementPosition: 3 },
      { id: "FRIENDLY_6", name: "Falk", role: "soldier", element: "tat_2", elementPosition: 4 },
    ],
    goal: {
      title: "Få skadad till ÅSA",
      description: "Släpa skadad kamrat till ÅSA och dra tillbaka gruppen utan att lämna någon exponerad utan täckning.",
      target: { q: 13, r: 56 },
    },
    defaultDifficulty: "training",
    recommendedFormation: "line",
    training: {
      u3t: {
        uppgiften: "Bryt kontakt bakåt, omhänderta skadad soldat och få gruppen till ÅSA utan otäckt exponering.",
        tiden: "Tempot ska växla: täckning först, rörelse därefter. För lång dragning utan avlösning ger trötthet.",
        truppen: "Åtta soldater med grpc och stf grpc nära varandra. En soldat är skadad från start och bärare kan behöva förstärkning.",
        terrangen: "Öppen mark straffar otäckt reträtt. Diken och skog ger skydd men kan sinka dragning.",
      },
      constraints: {
        maxExposureSamples: { exposureAtLeast: 2, samples: 14 },
        maxCumulativeExposure: { exposure: 42 },
        maxContactEvents: 8,
        maxWounded: 1,
      },
      aarFocus: ["Växelvis bakåt", "Täckande eld", "Bärartrötthet", "Förstärkning och avlösning", "ÅSA"],
    },
    map: {
      fieldCorridors: [{ from: { q: 12, r: 56 }, to: { q: 28, r: 50 }, width: 6, bend: 1 }],
      roads: [{ from: { q: 8, r: 58 }, to: { q: 34, r: 48 }, bend: 2 }],
      ditches: [
        { from: { q: 14, r: 54 }, to: { q: 24, r: 52 }, bend: 1 },
        { from: { q: 17, r: 59 }, to: { q: 30, r: 56 }, bend: 1 },
      ],
      forests: [
        { center: { q: 13, r: 56 }, radius: 3 },
        { center: { q: 27, r: 49 }, radius: 2 },
      ],
      clearings: [
        { center: { q: 22, r: 52 }, radius: 4 },
        { center: { q: 13, r: 56 }, radius: 2 },
      ],
    },
  },
  {
    id: "river_bridge_crossing",
    kind: "group_commander",
    title: "Broövergång under observation",
    subtitle: "Å och bro",
    description: "För gruppen över en å där vattnet stoppar rörelse och bron blir den tydliga, farliga passagen.",
    start: { q: 10, r: 62 },
    facing: "NE",
    troop: [
      { id: "LEADER_1", name: "Lind", role: "leader", element: "tat_1", elementPosition: 1 },
      { id: "DEPUTY_1", name: "Nordin", role: "deputy_leader", element: "tat_2", elementPosition: 1 },
      { id: "FRIENDLY_1", name: "Andersson", role: "soldier", element: "tat_1", elementPosition: 2 },
      { id: "FRIENDLY_2", name: "Berg", role: "soldier", element: "tat_1", elementPosition: 3 },
      { id: "FRIENDLY_3", name: "Ceder", role: "soldier", element: "tat_1", elementPosition: 4 },
      { id: "FRIENDLY_4", name: "Dahl", role: "soldier", element: "tat_2", elementPosition: 2 },
      { id: "FRIENDLY_5", name: "Ek", role: "soldier", element: "tat_2", elementPosition: 3 },
      { id: "FRIENDLY_6", name: "Falk", role: "soldier", element: "tat_2", elementPosition: 4 },
    ],
    goal: {
      title: "Säkra andra sidan",
      description: "Ta över bron med bibehållen sammanhållning och undvik att fastna i flaskhalsen.",
      target: { q: 36, r: 42 },
    },
    defaultDifficulty: "normal",
    recommendedFormation: "file",
    map: {
      fieldCorridors: [{ from: { q: 10, r: 62 }, to: { q: 36, r: 42 }, width: 4, bend: 3 }],
      roads: [{ from: { q: 6, r: 64 }, to: { q: 40, r: 40 }, bend: 2 }],
      rivers: [
        {
          from: { q: 2, r: 48 },
          to: { q: 62, r: 48 },
          width: 1,
          bridges: [{ coord: { q: 30, r: 48 }, radius: 1 }],
        },
      ],
      forests: [
        { center: { q: 18, r: 58 }, radius: 3 },
        { center: { q: 34, r: 44 }, radius: 3 },
      ],
      clearings: [
        { center: { q: 10, r: 62 }, radius: 4 },
        { center: { q: 36, r: 42 }, radius: 3 },
      ],
    },
  },
  {
    id: "ditch_line_contact",
    kind: "group_commander",
    title: "Dikeslinjen",
    subtitle: "Sammanhängande dike",
    description: "Bryt igenom en sammanhängande dikeslinje där motståndaren får skydd men gruppen kan utnyttja döda vinklar.",
    start: { q: 12, r: 62 },
    facing: "NE",
    troop: [
      { id: "LEADER_1", name: "Lind", role: "leader", element: "tat_1", elementPosition: 1 },
      { id: "DEPUTY_1", name: "Nordin", role: "deputy_leader", element: "tat_2", elementPosition: 1 },
      { id: "FRIENDLY_1", name: "Andersson", role: "soldier", element: "tat_1", elementPosition: 2 },
      { id: "FRIENDLY_2", name: "Berg", role: "soldier", element: "tat_1", elementPosition: 3 },
      { id: "FRIENDLY_3", name: "Ceder", role: "soldier", element: "tat_1", elementPosition: 4 },
      { id: "FRIENDLY_4", name: "Dahl", role: "soldier", element: "tat_2", elementPosition: 2 },
      { id: "FRIENDLY_5", name: "Ek", role: "soldier", element: "tat_2", elementPosition: 3 },
      { id: "FRIENDLY_6", name: "Falk", role: "soldier", element: "tat_2", elementPosition: 4 },
    ],
    goal: {
      title: "Ta terrängen bakom diket",
      description: "Håll ihop linjen, hitta passagen genom diket och samla gruppen på andra sidan.",
      target: { q: 36, r: 50 },
    },
    defaultDifficulty: "normal",
    recommendedFormation: "line",
    map: {
      fieldCorridors: [{ from: { q: 12, r: 62 }, to: { q: 36, r: 50 }, width: 5, bend: 2 }],
      roads: [{ from: { q: 8, r: 64 }, to: { q: 42, r: 60 }, bend: 2 }],
      ditches: [{ from: { q: 8, r: 52 }, to: { q: 48, r: 55 }, width: 1, bend: 2 }],
      forests: [
        { center: { q: 20, r: 59 }, radius: 3 },
        { center: { q: 39, r: 49 }, radius: 2 },
      ],
      clearings: [
        { center: { q: 12, r: 62 }, radius: 4 },
        { center: { q: 36, r: 50 }, radius: 3 },
      ],
    },
  },
];

export function listScenarioOptions(): ScenarioOption[] {
  return SCENARIO_OPTIONS.map(({ kind: _kind, start: _start, facing: _facing, map: _map, ...option }) => clone(option));
}

export function createPhaseOneSession(options: CreateSessionOptions = {}): Session {
  const scenarioOption = resolveScenarioOption(options);
  const difficulty = options.difficulty ?? scenarioOption.defaultDifficulty;
  const seed = options.seed ?? `${scenarioOption.id}:${difficulty}`;
  const sessionId = `session_${hashString(seed).toString(16)}`;
  let sequence = 0;
  const initialWorld = buildInitialWorld(sessionId, seed, scenarioOption, difficulty, options.overrides);
  const events: DomainEvent[] = [
    {
      id: `${sessionId}_${sequence}`,
      sessionId,
      sequence: sequence++,
      time: 0,
      type: "session_started",
      payload: { seed, scenarioId: scenarioOption.id, difficulty },
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

function resolveScenarioOption(options: CreateSessionOptions): (typeof SCENARIO_OPTIONS)[number] {
  const requested = options.scenarioId ?? options.scenario ?? "cover_to_cover";
  if (requested === "soldier") {
    return scenarioOptionById("cover_to_cover");
  }
  if (requested === "risk_zone") {
    return scenarioOptionById("risk_zone_blocking");
  }
  if (requested === "group_commander") {
    return scenarioOptionById("leader_lost_picture");
  }
  return scenarioOptionById(requested as ScenarioId);
}

function scenarioOptionById(id: ScenarioId): (typeof SCENARIO_OPTIONS)[number] {
  return SCENARIO_OPTIONS.find((scenario) => scenario.id === id) ?? SCENARIO_OPTIONS[0];
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

  if (command.type === "issue_alternating_forward_order") {
    return dispatchAlternatingForwardOrder(session, unit, command);
  }

  if (command.type === "issue_alternating_retreat_order") {
    return dispatchAlternatingRetreatOrder(session, unit, command);
  }

  if (command.type === "issue_zipper_retreat_order") {
    return dispatchZipperRetreatOrder(session, unit, command);
  }

  if (command.type === "set_casualty_collection_point") {
    return dispatchCasualtyCollectionPoint(session, unit, command);
  }

  if (command.type === "start_casualty_evacuation") {
    return dispatchCasualtyEvacuation(session, unit, command);
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

  const movementEvents = collectMovementEvents(session.world, seconds, random);
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

  const opposingEvents = collectOpposingUnitEvents(next, random);
  next = appendAndApply(next, opposingEvents.map((event) => buildEvent(next, event.type, event.payload)));

  const contactReactionEvents = collectFriendlyContactReactionEvents(next.world, opposingEvents, random);
  next = appendAndApply(next, contactReactionEvents.map((event) => buildEvent(next, event.type, event.payload)));

  const objectiveEvents = collectObjectiveEvents(next);
  return appendAndApply(next, objectiveEvents.map((event) => buildEvent(next, event.type, event.payload)));
}

export function projectSession(session: Session, role: "player" | "observer" = "player"): Projection {
  const playerUnit = session.world.units.find((unit) => unit.side === "friendly") ?? session.world.units[0];
  const player = projectUnit(session, playerUnit);
  const visibleHexes = visibleHexesFor(session.world, player);
  const visibleKeys = new Set(visibleHexes.map(hexKey));
  const rememberedHexes = session.world.visibilityMemory?.[player.id] ?? {};
  const events = projectionEvents(session).map(summarizeEventForProjection);
  const risk = riskProjection(session.world);
  const heardEvents = heardEventsFor(session, player, role);
  const reports = reportProjection(session);
  const trainingAssessment = trainingAssessmentFor(session);

  return {
    sessionId: session.id,
    time: session.world.time,
    scenario: clone(session.world.scenario),
    objective: clone(session.world.objective),
    casualtyEvacuation: session.world.casualtyEvacuation ? clone(session.world.casualtyEvacuation) : undefined,
    casualtyTeam: session.world.casualtyTeam ? clone(session.world.casualtyTeam) : undefined,
    activeFormation: session.world.activeFormation ? clone(session.world.activeFormation) : undefined,
    activeManeuver: session.world.activeManeuver ? clone(session.world.activeManeuver) : undefined,
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
        ? session.world.units.map((unit) => projectUnit(session, unit))
        : session.world.units.filter((unit) => unit.side === "friendly" || visibleKeys.has(hexKey(unit.coord))).map((unit) => projectUnit(session, unit)),
    events,
    risk,
    perception: {
      informationMode: session.world.difficulty,
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
        .filter(
          (event) =>
            event.type === "probabilistic_detection_resolved" ||
            event.type === "contact_pressure_emitted" ||
            event.type === "incoming_fire_resolved" ||
            event.type === "friendly_fire_resolved" ||
            event.type === "unit_wounded",
        )
        .map(clone),
      blockingEvents: session.events.filter((event) => event.type === "friendly_effect_blocked" || event.type === "tat_coverage_gap").map(clone),
      orderEvents: session.events.filter(isOrderFlowEvent).slice(-500).map(clone),
      reportEvents: session.events.filter((event) => event.type === "status_report_emitted").map(clone),
      heardEvents,
      u3t: trainingAssessment,
    },
  };
}

function projectUnit(session: Session, unit: Unit): ProjectedUnit {
  return {
    ...clone(unit),
    activity: unitActivityFor(session, unit),
  };
}

function unitActivityFor(session: Session, unit: Unit): UnitActivityProjection {
  const waitEvent = latestUnitEvent(session, unit.id, "movement_waiting");
  const blockedEvent = latestUnitEvent(session, unit.id, "movement_blocked");
  const completedEvent = latestUnitEvent(session, unit.id, "movement_completed");
  const recentWait = waitEvent && session.world.time - waitEvent.time <= 4 ? waitEvent : undefined;
  const recentBlock = blockedEvent && session.world.time - blockedEvent.time <= 8 ? blockedEvent : undefined;
  const casualtyTeam = session.world.casualtyTeam;

  if (unit.status.includes("being_dragged") && casualtyTeam?.casualtyUnitId === unit.id) {
    const target = casualtyTeam.teamIntent === "moving"
      ? casualtyTeam.teamTarget ?? casualtyTeam.casualtySlot ?? unit.coord
      : casualtyTeam.casualtySlot ?? casualtyTeam.teamTarget ?? unit.coord;
    const targetPoint = casualtyTeam.teamIntent === "moving"
      ? casualtyTeam.teamTargetPoint ?? casualtyTeam.casualtySlotPoint ?? unit.position
      : casualtyTeam.casualtySlotPoint ?? casualtyTeam.teamTargetPoint ?? unit.position;
    return {
      state: casualtyTeam.teamIntent === "moving" ? "moving" : casualtyTeam.teamIntent === "blocked" ? "waiting" : "holding",
      target: clone(target),
      targetPoint: clone(targetPoint),
      reason: casualtyTeam.teamIntent === "moving" ? "casualty_team_bound" : casualtyTeam.waitReason ?? "casualty_team_wait",
      relatedUnitId: casualtyTeam.carrierUnitIds[0],
      relatedUnitIds: clone(casualtyTeam.carrierUnitIds),
      tacticalRole: "casualty",
      orderId: unit.currentOrderId,
    };
  }

  if (unit.status.includes("evac_helper") && casualtyTeam?.carrierUnitIds.includes(unit.id)) {
    const target = casualtyTeam.carrierSlots[unit.id] ?? casualtyTeam.teamTarget ?? unit.coord;
    const targetPoint = casualtyTeam.carrierSlotPoints[unit.id] ?? casualtyTeam.teamTargetPoint ?? unit.position;
    return {
      state: unit.intent.type === "moving" ? "moving" : casualtyTeam.teamIntent === "blocked" ? "waiting" : "holding",
      target: clone(unit.intent.type === "moving" ? unit.intent.target : target),
      targetPoint: clone(unit.intent.type === "moving" ? unit.intent.targetPoint : targetPoint),
      reason: unit.intent.type === "moving" ? "casualty_team_bound" : casualtyTeam.waitReason ?? "casualty_team_wait",
      relatedUnitId: casualtyTeam.casualtyUnitId,
      relatedUnitIds: [casualtyTeam.casualtyUnitId, ...casualtyTeam.carrierUnitIds.filter((unitId) => unitId !== unit.id)],
      tacticalRole: "carrier",
      orderId: unit.currentOrderId,
      progress: unit.intent.type === "moving" ? round(unit.intent.progress) : undefined,
      pathLength: unit.intent.type === "moving" ? unit.intent.path.length : undefined,
    };
  }

  if (unit.status.includes("being_dragged")) {
    return {
      state: "holding",
      target: clone(unit.coord),
      targetPoint: clone(unit.position),
      reason: "casualty_drag_wait",
      relatedUnitId: session.world.casualtyEvacuation?.helperUnitIds[0],
      tacticalRole: "casualty",
      orderId: unit.currentOrderId,
    };
  }

  if (unit.status.includes("evac_helper")) {
    return {
      state: unit.intent.type === "moving" ? "moving" : "holding",
      target: clone(unit.intent.type === "moving" ? unit.intent.target : unit.coord),
      targetPoint: unit.intent.type === "moving" ? clone(unit.intent.targetPoint) : clone(unit.position),
      reason: unit.intent.type === "moving" ? "casualty_helper_drag" : "casualty_helper_wait",
      relatedUnitId: session.world.casualtyEvacuation?.casualtyUnitId,
      tacticalRole: "carrier",
      orderId: unit.currentOrderId,
      progress: unit.intent.type === "moving" ? round(unit.intent.progress) : undefined,
      pathLength: unit.intent.type === "moving" ? unit.intent.path.length : undefined,
    };
  }

  if (isUnitInjured(unit)) {
    return {
      state: "injured",
      target: clone(unit.coord),
      reason: "injured",
      orderId: unit.currentOrderId,
      updatedAt: latestUnitEvent(session, unit.id, "unit_wounded")?.time,
    };
  }

  if (recentWait) {
    return {
      state: "waiting",
      target: clone((recentWait.payload.target as HexCoord | undefined) ?? (unit.intent.type === "moving" ? unit.intent.target : unit.coord)),
      targetPoint: unit.intent.type === "moving" ? clone(unit.intent.targetPoint) : undefined,
      reason: String(recentWait.payload.reason ?? "waiting"),
      relatedUnitId: typeof recentWait.payload.neighbourId === "string" ? recentWait.payload.neighbourId : undefined,
      orderId: unit.currentOrderId,
      progress: unit.intent.type === "moving" ? round(unit.intent.progress) : undefined,
      pathLength: unit.intent.type === "moving" ? unit.intent.path.length : undefined,
      updatedAt: recentWait.time,
    };
  }

  if (recentBlock) {
    return {
      state: "blocked",
      target: clone((recentBlock.payload.target as HexCoord | undefined) ?? (unit.intent.type === "moving" ? unit.intent.target : unit.coord)),
      targetPoint: unit.intent.type === "moving" ? clone(unit.intent.targetPoint) : undefined,
      reason: String(recentBlock.payload.reason ?? "blocked"),
      orderId: unit.currentOrderId,
      updatedAt: recentBlock.time,
    };
  }

  if (unit.status.includes("reinforcement")) {
    return {
      state: unit.intent.type === "moving" ? "moving" : "holding",
      target: clone(unit.intent.type === "moving" ? unit.intent.target : unit.coord),
      targetPoint: unit.intent.type === "moving" ? clone(unit.intent.targetPoint) : undefined,
      reason: unit.intent.type === "moving" ? "casualty_reinforcement" : "reinforcement_wait",
      relatedUnitId: session.world.casualtyEvacuation?.casualtyUnitId,
      orderId: unit.currentOrderId,
      progress: unit.intent.type === "moving" ? round(unit.intent.progress) : undefined,
      pathLength: unit.intent.type === "moving" ? unit.intent.path.length : undefined,
    };
  }

  if (unit.status.includes("retreat_moving")) {
    return {
      state: unit.intent.type === "moving" ? "moving" : "holding",
      target: clone(unit.intent.type === "moving" ? unit.intent.target : unit.coord),
      targetPoint: unit.intent.type === "moving" ? clone(unit.intent.targetPoint) : undefined,
      reason: unit.intent.type === "moving" ? "retreat_bound" : "retreat_bound_complete",
      orderId: unit.currentOrderId,
      progress: unit.intent.type === "moving" ? round(unit.intent.progress) : undefined,
      pathLength: unit.intent.type === "moving" ? unit.intent.path.length : undefined,
    };
  }

  if (unit.status.includes("forward_moving")) {
    return {
      state: unit.intent.type === "moving" ? "moving" : "holding",
      target: clone(unit.intent.type === "moving" ? unit.intent.target : unit.coord),
      targetPoint: unit.intent.type === "moving" ? clone(unit.intent.targetPoint) : undefined,
      reason: unit.intent.type === "moving" ? "alternating_forward_bound" : "alternating_forward_bound_complete",
      orderId: unit.currentOrderId,
      progress: unit.intent.type === "moving" ? round(unit.intent.progress) : undefined,
      pathLength: unit.intent.type === "moving" ? unit.intent.path.length : undefined,
    };
  }

  if (unit.status.includes("covering_fire")) {
    return {
      state: "holding",
      target: clone(unit.coord),
      reason: "covering_fire",
      orderId: unit.currentOrderId,
      updatedAt: latestUnitEvent(session, unit.id, "friendly_fire_delivered")?.time,
    };
  }

  if (unit.intent.type === "moving") {
    return {
      state: "moving",
      target: clone(unit.intent.target),
      targetPoint: clone(unit.intent.targetPoint),
      reason: unit.currentOrderId ? "moving_to_order_target" : "moving_to_selected_hex",
      orderId: unit.currentOrderId,
      progress: round(unit.intent.progress),
      pathLength: unit.intent.path.length,
    };
  }

  if (completedEvent && session.world.time - completedEvent.time <= 6) {
    return {
      state: "holding",
      target: clone((completedEvent.payload.at as HexCoord | undefined) ?? unit.coord),
      reason: "movement_completed",
      orderId: unit.currentOrderId,
      updatedAt: completedEvent.time,
    };
  }

  const activeFormation = session.world.activeFormation;
  if (unit.side === "friendly" && activeFormation) {
    if (unit.currentOrderId === activeFormation.orderId) {
      return {
        state: "holding",
        target: clone(unit.coord),
        reason:
          activeFormation.orderKind === "forward" && activeFormation.phase === "advancing"
            ? unit.role === "leader"
              ? "leader_holding"
              : "formation_position_holding"
            : "waiting_for_formation",
        orderId: unit.currentOrderId,
      };
    }

    return {
      state: "idle",
      target: clone(unit.coord),
      reason: "no_current_order",
      orderId: unit.currentOrderId,
    };
  }

  return {
    state: "idle",
    target: clone(unit.coord),
    reason: "no_order",
    orderId: unit.currentOrderId,
  };
}

function latestUnitEvent(session: Session, unitId: string, type: string): DomainEvent | undefined {
  for (let index = session.events.length - 1; index >= 0; index -= 1) {
    const event = session.events[index];
    if (event.type === type && (event.payload.unitId === unitId || event.payload.sourceUnitId === unitId)) {
      return event;
    }
  }
  return undefined;
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
    const memoryWindow = visibilityMemorySeconds(world.difficulty);
    if (memoryAge < memoryWindow) {
      return {
        ...clone(tile),
        visibility: "memory",
        lastSeenAt,
        memoryAge: round(memoryAge),
        memoryOpacity: round(clamp(1 - memoryAge / memoryWindow, 0, 1)),
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

function visibilityMemorySeconds(difficulty: DifficultyLevel): number {
  if (difficulty === "realistic") return 4;
  if (difficulty === "normal") return 8;
  return VISIBILITY_MEMORY_SECONDS;
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
    event.type === "tactical_maneuver_started" ||
    event.type === "tactical_maneuver_phase_changed" ||
    event.type === "friendly_fire_delivered" ||
    event.type === "friendly_fire_resolved" ||
    event.type === "suppression_applied" ||
    event.type === "stamina_changed" ||
    event.type === "casualty_collection_point_set" ||
    event.type === "casualty_evacuation_started" ||
    event.type === "casualty_drag_started" ||
    event.type === "casualty_evacuation_completed" ||
    event.type === "casualty_reinforcement_requested" ||
    event.type === "casualty_carrier_relieved" ||
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
    event.type === "status_report_emitted" ||
    event.type === "contact_pressure_emitted" ||
    event.type === "incoming_fire_resolved" ||
    event.type === "unit_wounded" ||
    event.type === "objective_succeeded" ||
    event.type === "objective_failed"
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

function trainingAssessmentFor(session: Session): TrainingAssessment | undefined {
  const training = session.world.scenario.training;
  if (!training) return undefined;
  const constraints = session.world.objective.constraints ?? training.constraints;
  const metrics = trainingMetricsFor(session, constraints);
  return {
    brief: clone(training.u3t),
    constraints: constraints ? clone(constraints) : undefined,
    aarFocus: clone(training.aarFocus ?? []),
    metrics,
    observations: u3tObservationsFor(session, metrics, constraints),
  };
}

function trainingMetricsFor(session: Session, constraints?: TrainingConstraints): TrainingMetrics {
  const world = session.world;
  const friendlyIds = new Set(world.units.filter((unit) => unit.side === "friendly").map((unit) => unit.id));
  const exposureValues = session.events
    .filter((event) => event.type === "exposure_sampled" && friendlyIds.has(String(event.payload.unitId)))
    .map((event) => Number(event.payload.exposure))
    .filter(Number.isFinite);
  const highExposureThreshold = constraints?.maxExposureSamples?.exposureAtLeast ?? 2;
  const highExposureSamples = exposureValues.filter((exposure) => exposure >= highExposureThreshold).length;
  const severeExposureSamples = exposureValues.filter((exposure) => exposure >= 3).length;
  const cumulativeExposure = round(exposureValues.reduce((total, exposure) => total + Math.max(0, exposure), 0));
  const contactEvents = session.events.filter((event) => event.type === "contact_pressure_emitted").length;
  const detectionEvents = session.events.filter((event) => event.type === "probabilistic_detection_resolved").length;
  const incomingFireEvents = session.events.filter((event) => event.type === "incoming_fire_resolved").length;
  const wounded = world.units.filter((unit) => unit.side === "friendly" && isUnitInjured(unit)).length;
  const player = world.units.find((unit) => unit.side === "friendly") ?? world.units[0];
  const distanceHexes = player ? hexDistance(player.coord, world.objective.target) : 0;
  const thresholdsExceeded: string[] = [];
  const hardFailures: string[] = [];
  const noteExceeded = (code: string, hard = true) => {
    thresholdsExceeded.push(code);
    if (hard) hardFailures.push(code);
  };

  if (constraints?.timeLimitSeconds !== undefined && world.time > constraints.timeLimitSeconds) {
    noteExceeded("time_limit_exceeded");
  }
  if (
    constraints?.maxExposureSamples &&
    highExposureSamples > constraints.maxExposureSamples.samples
  ) {
    noteExceeded("exposure_threshold_exceeded", constraints.maxExposureSamples.hard === true);
  }
  if (
    constraints?.maxCumulativeExposure &&
    cumulativeExposure > constraints.maxCumulativeExposure.exposure
  ) {
    noteExceeded("cumulative_exposure_exceeded", constraints.maxCumulativeExposure.hard === true);
  }
  if (constraints?.maxContactEvents !== undefined && contactEvents > constraints.maxContactEvents) {
    noteExceeded("contact_threshold_exceeded");
  }
  if (constraints?.maxDetectionEvents !== undefined && detectionEvents > constraints.maxDetectionEvents) {
    noteExceeded("detection_threshold_exceeded");
  }
  if (constraints?.maxWounded !== undefined && wounded > constraints.maxWounded) {
    noteExceeded("casualty_threshold_exceeded");
  }

  const metrics: TrainingMetric[] = [
    distanceTrainingMetric(world, distanceHexes),
    timeTrainingMetric(world.time, constraints?.timeLimitSeconds),
    exposureTrainingMetric(highExposureSamples, highExposureThreshold, constraints?.maxExposureSamples),
    cumulativeExposureTrainingMetric(cumulativeExposure, constraints?.maxCumulativeExposure),
    boundedCountMetric("detections", "Upptäckt", detectionEvents, constraints?.maxDetectionEvents),
    boundedCountMetric("contacts", "Kontakt", contactEvents, constraints?.maxContactEvents, incomingFireEvents > 0 ? `${incomingFireEvents} eldutfall` : undefined),
    boundedCountMetric("wounded", "Skadade", wounded, constraints?.maxWounded),
  ];

  return {
    elapsedSeconds: round(world.time),
    distanceHexes,
    exposureSamples: exposureValues.length,
    highExposureSamples,
    highExposureThreshold,
    severeExposureSamples,
    cumulativeExposure,
    contactEvents,
    detectionEvents,
    incomingFireEvents,
    wounded,
    thresholdsExceeded,
    hardFailures,
    metrics,
  };
}

function distanceTrainingMetric(world: WorldState, distanceHexes: number): TrainingMetric {
  const radius = isCoverToCoverScenarioId(world.scenario.id)
    ? OBJECTIVE_SINGLE_RADIUS_HEXES
    : world.scenario.id === "risk_zone_blocking"
      ? 2
      : OBJECTIVE_GROUP_RADIUS_HEXES;
  return {
    id: "distance",
    label: "Målavstånd",
    value: `${distanceHexes} hex`,
    state: distanceHexes <= radius ? "good" : distanceHexes <= radius + 5 ? "warn" : "bad",
    detail: `krav ${radius} hex`,
  };
}

function timeTrainingMetric(elapsedSeconds: number, limitSeconds?: number): TrainingMetric {
  if (limitSeconds === undefined) {
    return {
      id: "time",
      label: "Tid",
      value: `${round(elapsedSeconds)} s`,
      state: elapsedSeconds <= 75 ? "good" : elapsedSeconds <= 120 ? "warn" : "bad",
    };
  }
  const remaining = round(limitSeconds - elapsedSeconds);
  return {
    id: "time",
    label: "Tid",
    value: `${round(elapsedSeconds)}/${limitSeconds} s`,
    state: elapsedSeconds <= limitSeconds ? (remaining >= 10 ? "good" : "warn") : "bad",
    detail: remaining >= 0 ? `${remaining} s marginal` : `${Math.abs(remaining)} s över`,
  };
}

function exposureTrainingMetric(
  highExposureSamples: number,
  highExposureThreshold: number,
  threshold?: ExposureSampleThreshold,
): TrainingMetric {
  if (!threshold) {
    return {
      id: "exposure",
      label: "Exponering",
      value: `${highExposureSamples} prov`,
      state: highExposureSamples === 0 ? "good" : highExposureSamples <= 8 ? "warn" : "bad",
      detail: `nivå ${highExposureThreshold}+`,
    };
  }
  return {
    id: "exposure",
    label: "Exponering",
    value: `${highExposureSamples}/${threshold.samples}`,
    state: highExposureSamples <= threshold.samples ? "good" : threshold.hard ? "bad" : "warn",
    detail: `nivå ${threshold.exposureAtLeast}+${threshold.hard ? ", hård gräns" : ""}`,
  };
}

function cumulativeExposureTrainingMetric(
  cumulativeExposure: number,
  threshold?: CumulativeExposureThreshold,
): TrainingMetric {
  if (!threshold) {
    return {
      id: "cumulative_exposure",
      label: "Ack. risk",
      value: String(cumulativeExposure),
      state: cumulativeExposure <= 12 ? "good" : cumulativeExposure <= 30 ? "warn" : "bad",
    };
  }
  return {
    id: "cumulative_exposure",
    label: "Ack. risk",
    value: `${cumulativeExposure}/${threshold.exposure}`,
    state: cumulativeExposure <= threshold.exposure ? "good" : threshold.hard ? "bad" : "warn",
    detail: threshold.hard ? "hård gräns" : undefined,
  };
}

function boundedCountMetric(
  id: string,
  label: string,
  count: number,
  limit?: number,
  detail?: string,
): TrainingMetric {
  if (limit === undefined) {
    return {
      id,
      label,
      value: String(count),
      state: count === 0 ? "good" : count <= 2 ? "warn" : "bad",
      detail,
    };
  }
  return {
    id,
    label,
    value: `${count}/${limit}`,
    state: count <= limit ? "good" : "bad",
    detail,
  };
}

function u3tObservationsFor(
  session: Session,
  metrics: TrainingMetrics,
  constraints?: TrainingConstraints,
): U3TObservation[] {
  const status = session.world.objective.status;
  const timeMetric = metrics.metrics.find((metric) => metric.id === "time");
  const exposureMetric = metrics.metrics.find((metric) => metric.id === "exposure");
  const cumulativeMetric = metrics.metrics.find((metric) => metric.id === "cumulative_exposure");
  const truppState: TrainingMetricState =
    metrics.wounded > (constraints?.maxWounded ?? 0) ||
    metrics.contactEvents > (constraints?.maxContactEvents ?? Number.POSITIVE_INFINITY) ||
    metrics.detectionEvents > (constraints?.maxDetectionEvents ?? Number.POSITIVE_INFINITY)
      ? "bad"
      : metrics.detectionEvents > 0 || metrics.contactEvents > 0
        ? "warn"
        : "good";
  const terrainState: TrainingMetricState =
    exposureMetric?.state === "bad" || cumulativeMetric?.state === "bad"
      ? "bad"
      : exposureMetric?.state === "warn" || cumulativeMetric?.state === "warn"
        ? "warn"
        : "good";

  return [
    {
      axis: "uppgiften",
      label: "Uppgiften",
      state: status === "succeeded" ? "good" : status === "failed" ? "bad" : metrics.distanceHexes <= 5 ? "warn" : "bad",
      text: status === "succeeded"
        ? "Uppgiften löstes: soldaten nådde målskyddet."
        : status === "failed"
          ? "Uppgiften bröts av en hård gräns innan målskyddet säkrades."
          : `${metrics.distanceHexes} hex kvar till målskyddet.`,
    },
    {
      axis: "tiden",
      label: "Tiden",
      state: timeMetric?.state ?? "good",
      text: constraints?.timeLimitSeconds
        ? `Tid ${metrics.elapsedSeconds}/${constraints.timeLimitSeconds} sekunder.`
        : `Förbrukad tid ${metrics.elapsedSeconds} sekunder; bedöm om tempot var rimligt för risken.`,
    },
    {
      axis: "truppen",
      label: "Truppen",
      state: truppState,
      text: `${metrics.detectionEvents} upptäckter, ${metrics.contactEvents} kontakttryck, ${metrics.incomingFireEvents} eldutfall, ${metrics.wounded} skadade.`,
    },
    {
      axis: "terrangen",
      label: "Terrängen",
      state: terrainState,
      text: `${metrics.highExposureSamples} exponeringsprov på nivå ${metrics.highExposureThreshold ?? 2}+ och ${metrics.cumulativeExposure} ackumulerad risk.`,
    },
  ];
}

function isCoverToCoverScenarioId(id: ScenarioId): boolean {
  return id === "cover_to_cover" || id === "cover_to_cover_hasty" || id === "cover_to_cover_observed";
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
  const receivers = formationReceivers(world, issuer.id);
  let basePoint: MapPoint;
  if (
    activeFormation &&
    activeFormation.formation === formation &&
    (activeFormation.orderKind === "formation" || activeFormation.phase === "forming")
  ) {
    basePoint = clone(activeFormation.targetPoint);
  } else if (activeFormation?.phase === "advancing" && receivers.some((unit) => unit.intent.type === "moving")) {
    const issuerProgress = forwardProgress(issuer.position, directionVector);
    const groupFrontProgress = Math.max(...receivers.map((unit) => forwardProgress(unit.position, directionVector)));
    const forwardShift = Math.max(0, groupFrontProgress - issuerProgress);
    basePoint = addMapPoint(issuer.position, scaleVector(normalizeVector(directionVector), forwardShift));
  } else {
    basePoint = clone(issuer.position);
  }
  return formation === "file" ? fileFormationTargetPointForCasualtyBlock(world, receivers, basePoint, directionVector) : basePoint;
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

function dispatchAlternatingRetreatOrder(
  session: Session,
  issuer: Unit,
  command: Extract<PlayerCommand, { type: "issue_alternating_retreat_order" }>,
): Session {
  return dispatchTacticalManeuverOrder(session, issuer, command, "alternating_retreat");
}

function dispatchAlternatingForwardOrder(
  session: Session,
  issuer: Unit,
  command: Extract<PlayerCommand, { type: "issue_alternating_forward_order" }>,
): Session {
  return dispatchTacticalManeuverOrder(session, issuer, command, "alternating_forward");
}

function dispatchZipperRetreatOrder(
  session: Session,
  issuer: Unit,
  command: Extract<PlayerCommand, { type: "issue_zipper_retreat_order" }>,
): Session {
  return dispatchTacticalManeuverOrder(session, issuer, command, "zipper_retreat", command.side);
}

function dispatchTacticalManeuverOrder(
  session: Session,
  issuer: Unit,
  command: Extract<PlayerCommand, { type: "issue_alternating_forward_order" | "issue_alternating_retreat_order" | "issue_zipper_retreat_order" }>,
  type: "alternating_forward" | "alternating_retreat" | "zipper_retreat",
  zipperSide?: ZipperSide,
): Session {
  if (issuer.side !== "friendly" || issuer.role !== "leader") {
    return appendAndApply(session, [
      buildEvent(session, "command_rejected", {
        reason: "tactical_maneuver_requires_leader",
        command,
      }),
    ]);
  }

  session = ensureCasualtyTeamForTacticalManeuver(session, issuer, type, command.issuedAt);
  issuer = session.world.unitsById[issuer.id];

  const receivers = formationReceivers(session.world, issuer.id).filter((unit) => !isUnitInjured(unit));
  const directionVector =
    directionVectorFromTargetPoint(issuer.position, command.directionTargetPoint) ??
    directionVectorFromTarget(issuer.position, command.directionTarget) ??
    directionVectorFromHexDirection(command.direction);
  const initialBoundIndex = initialTacticalManeuverBoundIndex(session.world, type);
  let movingUnitIds =
    type === "zipper_retreat"
      ? zipperRetreatMovingUnitIds(receivers, directionVector, zipperSide ?? "left", 0)
      : alternatingBoundMovingUnitIds(receivers, initialBoundIndex);
  let coveringUnitIds = receivers.map((unit) => unit.id).filter((unitId) => !movingUnitIds.includes(unitId));
  ({ movingUnitIds, coveringUnitIds } = applyCasualtyTeamBoundOwnership(session.world, type, initialBoundIndex, movingUnitIds, coveringUnitIds));
  const activeCasualtyUnitId =
    session.world.casualtyEvacuation?.phase === "dragging" ? session.world.casualtyEvacuation.casualtyUnitId : undefined;
  const activeCarrierUnitIds =
    session.world.casualtyEvacuation?.phase === "dragging"
      ? uniqueIds(session.world.casualtyEvacuation.carrierUnitIds ?? session.world.casualtyEvacuation.helperUnitIds)
      : undefined;
  const orderId = `${session.id}_${type === "alternating_forward" ? "afw" : "ret"}_${session.events.length}`;
  const startedMovingUnitIds: string[] = [];
  const maneuverStarted = buildEvent(session, "tactical_maneuver_started", {
    orderId,
    type,
    phase: "moving",
    direction: command.direction,
    directionVector,
    communication: command.communication,
    coveringUnitIds,
    movingUnitIds,
    casualtyUnitId: activeCasualtyUnitId,
    carrierUnitIds: activeCarrierUnitIds,
    boundStartedUnitIds: startedMovingUnitIds,
    zipperSide,
    stepIndex: 0,
    boundIndex: initialBoundIndex,
    issuedAt: command.issuedAt,
  });
  const events: DomainEvent[] = [
    buildEvent(session, "command_accepted", { command }),
  ];

  const reserved = new Set(
    session.world.units
      .filter((unit) => !movingUnitIds.includes(unit.id))
      .map((unit) => hexKey(unit.coord)),
  );
  const threatDirection = maneuverThreatDirection(type, command.direction);
  for (const unitId of coveringUnitIds) {
    const covering = session.world.unitsById[unitId];
    if (!covering) continue;
    events.push(...interruptIfMoving(session, covering.id, type === "alternating_forward" ? "alternating_forward_cover" : "retreat_cover"));
    events.push(
      buildEvent(session, "body_orientation_changed", {
        unitId,
        direction: threatDirection,
        reason: "covering_fire",
      }),
    );
  }
  for (const unitId of activeCarrierUnitIds ?? []) {
    if (movingUnitIds.includes(unitId)) continue;
    events.push(...interruptIfMoving(session, unitId, "casualty_team_hold"));
  }
  events.push(maneuverStarted);
  const maneuverDraft: TacticalManeuverState = {
    orderId,
    type,
    phase: "moving",
    direction: command.direction,
    directionVector,
    communication: command.communication,
    coveringUnitIds,
    movingUnitIds,
    casualtyUnitId: activeCasualtyUnitId,
    carrierUnitIds: activeCarrierUnitIds,
    zipperSide,
    stepIndex: 0,
    boundIndex: initialBoundIndex,
    boundStartedUnitIds: [],
    issuedAt: command.issuedAt,
  };
  const teamPlan = casualtyTeamManeuverMovementPlan(session.world, maneuverDraft, movingUnitIds, reserved);
  const teamHandledUnitIds = teamPlan?.handledUnitIds ?? new Set<string>();
  if (teamPlan) {
    events.push(...teamPlan.events.map((event) => buildEvent(session, event.type, event.payload)));
    for (const unitId of tacticalManeuverStartedUnitIds(teamPlan.events)) {
      startedMovingUnitIds.push(unitId);
    }
    for (const coord of teamPlan.reservedCoords) {
      reserved.add(hexKey(coord));
    }
  }
  const handledMovingUnitIds = teamPlan?.blocked ? [] : movingUnitIds.filter((unitId) => !teamHandledUnitIds.has(unitId));
  const assignments = tacticalManeuverTargetAssignments(
    session.world,
    type,
    handledMovingUnitIds,
    coveringUnitIds,
    command.direction,
    directionVector,
    reserved,
  );
  for (const unitId of handledMovingUnitIds) {
    const unit = session.world.unitsById[unitId];
    if (!unit) continue;
    events.push(...interruptIfMoving(session, unit.id, type === "alternating_forward" ? "alternating_forward_order" : "retreat_order"));
    const assignment = assignments.get(unitId);
    const target = assignment?.target ?? unit.coord;
    const targetPoint = assignment?.targetPoint ?? axialToMapPoint(target);
    if (assignment?.waitReason) {
      events.push(
        buildEvent(session, "movement_waiting", {
          unitId: unit.id,
          from: unit.coord,
          target,
          reason: assignment.waitReason,
        }),
      );
      continue;
    }
    if (!tacticalMoveHasCover(session.world, unit, coveringUnitIds, threatDirection)) {
      events.push(
        buildEvent(session, "movement_waiting", {
          unitId: unit.id,
          from: unit.coord,
          target,
          reason: type === "alternating_forward" ? "advance_cover_missing" : "retreat_cover_missing",
        }),
      );
      continue;
    }
    const pathResult = nearestPath(session.world, unit.coord, target, {
      blocked: occupiedHexes(session.world, unit.id),
      allowTarget: true,
      maxVisited: 1200,
    });
    if (pathResult.path.length > 0) {
      startedMovingUnitIds.push(unit.id);
      events.push(
        buildEvent(session, "movement_started", {
          unitId: unit.id,
          target,
          targetPoint,
          path: pathResult.path,
          orderId,
          reason: type === "alternating_forward" ? "alternating_forward_bound" : "retreat_bound",
        }),
      );
    } else {
      events.push(
        buildEvent(session, "movement_waiting", {
          unitId: unit.id,
          from: unit.coord,
          target,
          reason: type === "alternating_forward" ? "advance_no_path" : "retreat_no_path",
        }),
      );
    }
  }
  maneuverStarted.payload.boundStartedUnitIds = [...startedMovingUnitIds];

  return appendAndApply(session, events);
}

function ensureCasualtyTeamForTacticalManeuver(
  session: Session,
  issuer: Unit,
  type: TacticalManeuverType,
  issuedAt: number,
): Session {
  const evacuation = session.world.casualtyEvacuation;
  if (evacuation && evacuation.phase !== "completed") {
    return session;
  }
  const casualty = casualtyForEvacuation(session.world, issuer.coord);
  if (!casualty || casualty.side !== "friendly" || !isUnitInjured(casualty)) {
    return session;
  }
  const helpers = casualtyHelpers(session.world, casualty, issuer.id);
  if (helpers.length < 2 || !helpers.every((helper) => hexDistance(helper.coord, casualty.coord) <= 1)) {
    return session;
  }

  const orderId = `${session.id}_cas_auto_${session.events.length}`;
  const casualtyTarget = draggedCasualtyFollowCoord(session.world, casualty, helpers) ?? casualty.coord;
  const helperTargets = helperEscortTargets(session.world, casualty.coord, helpers, casualtyTarget);
  const mode = casualtyTeamModeForManeuver(type) ?? casualtyTeamModeForWorld(session.world);
  const helperUnitIds = helpers.map((helper) => helper.id);

  return appendAndApply(session, [
    buildEvent(session, "casualty_evacuation_started", {
      orderId,
      issuerId: issuer.id,
      casualtyUnitId: casualty.id,
      helperUnitIds,
      carrierUnitIds: helperUnitIds,
      underFire: true,
      phase: "moving_to_casualty",
      issuedAt,
    }),
    buildEvent(session, "casualty_drag_started", {
      orderId,
      casualtyUnitId: casualty.id,
      helperUnitIds,
      carrierUnitIds: helperUnitIds,
      assignedElement: tacticalTeamElement(casualty.element),
      mode,
      teamIntent: "holding",
      teamTarget: casualtyTarget,
      teamTargetPoint: axialToMapPoint(casualtyTarget),
      carrierSlots: Object.fromEntries([...helperTargets.entries()]),
      carrierSlotPoints: Object.fromEntries([...helperTargets.entries()].map(([unitId, coord]) => [unitId, axialToMapPoint(coord)])),
      casualtySlot: casualtyTarget,
      casualtySlotPoint: axialToMapPoint(casualtyTarget),
    }),
    buildEvent(session, "status_report_emitted", {
      sourceUnitId: helpers[0].id,
      kind: "status",
      message: `${casualty.name} bärs med gruppen`,
      coord: helpers[0].coord,
      confidence: "high",
      relatedUnitId: casualty.id,
    }),
  ]);
}

function casualtyCollectionPointLabel(id: CasualtyCollectionPointId | undefined): string {
  return id === "asa2" ? "ÅSA2" : "ÅSA1";
}

function selectedCasualtyCollectionPointId(
  evacuation: CasualtyEvacuationState | undefined,
  requested: CasualtyCollectionPointId | undefined,
): CasualtyCollectionPointId | undefined {
  if (requested) return requested;
  if (evacuation?.activeCollectionPointId) return evacuation.activeCollectionPointId;
  if (evacuation?.collectionPointId) return evacuation.collectionPointId;
  if (evacuation?.collectionPoints?.asa1) return "asa1";
  if (evacuation?.collectionPoints?.asa2) return "asa2";
  return evacuation?.collectionPoint ? "asa1" : undefined;
}

function dispatchCasualtyCollectionPoint(
  session: Session,
  issuer: Unit,
  command: Extract<PlayerCommand, { type: "set_casualty_collection_point" }>,
): Session {
  if (issuer.side !== "friendly" || issuer.role !== "leader") {
    return appendAndApply(session, [
      buildEvent(session, "command_rejected", {
        reason: "casualty_collection_requires_leader",
        command,
      }),
    ]);
  }

  const tile = session.world.map.tilesByKey[hexKey(command.target)];
  if (!tile || isImpassable(tile)) {
    return appendAndApply(session, [
      buildEvent(session, "command_rejected", {
        reason: "casualty_collection_not_passable",
        command,
      }),
    ]);
  }

  const collectionPointId = command.collectionPointId ?? "asa1";
  return appendAndApply(session, [
    buildEvent(session, "command_accepted", { command }),
    buildEvent(session, "casualty_collection_point_set", {
      issuerId: issuer.id,
      collectionPointId,
      label: casualtyCollectionPointLabel(collectionPointId),
      target: command.target,
      targetPoint: axialToMapPoint(command.target),
      issuedAt: command.issuedAt,
    }),
  ]);
}

function dispatchCasualtyEvacuation(
  session: Session,
  issuer: Unit,
  command: Extract<PlayerCommand, { type: "start_casualty_evacuation" }>,
): Session {
  if (issuer.side !== "friendly" || issuer.role !== "leader") {
    return appendAndApply(session, [
      buildEvent(session, "command_rejected", {
        reason: "casualty_evacuation_requires_leader",
        command,
      }),
    ]);
  }

  const collectionPointId = selectedCasualtyCollectionPointId(session.world.casualtyEvacuation, command.collectionPointId);
  const storedCollectionPoint = collectionPointId
    ? session.world.casualtyEvacuation?.collectionPoints?.[collectionPointId]
    : undefined;
  const collectionPoint = command.target ?? storedCollectionPoint?.coord ?? session.world.casualtyEvacuation?.collectionPoint;

  const collectionTile = collectionPoint ? session.world.map.tilesByKey[hexKey(collectionPoint)] : undefined;
  if (collectionPoint && (!collectionTile || isImpassable(collectionTile))) {
    return appendAndApply(session, [
      buildEvent(session, "command_rejected", {
        reason: "casualty_collection_not_passable",
        command,
      }),
    ]);
  }

  const casualty = casualtyForEvacuation(session.world, issuer.coord, command.casualtyUnitId);
  if (!casualty || casualty.side !== "friendly" || !isUnitInjured(casualty)) {
    return appendAndApply(session, [
      buildEvent(session, "command_rejected", {
        reason: "no_wounded_soldier",
        command,
      }),
    ]);
  }

  const helpers = casualtyHelpers(session.world, casualty, issuer.id);
  if (helpers.length < 2) {
    return appendAndApply(session, [
      buildEvent(session, "command_rejected", {
        reason: "not_enough_helpers",
        command,
        casualtyUnitId: casualty.id,
      }),
    ]);
  }

  const orderId = `${session.id}_cas_${session.events.length}`;
  const helperAssignments = casualtyHelperAssignments(session.world, casualty, helpers);
  const receivers = formationReceivers(session.world, issuer.id);
  const events: DomainEvent[] = [
    buildEvent(session, "command_accepted", { command }),
    buildEvent(session, "group_halted", {
      issuerId: issuer.id,
      unitIds: receivers.map((receiver) => receiver.id),
      reason: "casualty_evacuation",
    }),
    ...receivers.flatMap((receiver) => interruptIfMoving(session, receiver.id, "casualty_evacuation")),
    buildEvent(session, "casualty_evacuation_started", {
      orderId,
      issuerId: issuer.id,
      casualtyUnitId: casualty.id,
      helperUnitIds: helpers.map((helper) => helper.id),
      carrierUnitIds: helpers.map((helper) => helper.id),
      underFire: true,
      collectionPointId,
      label: collectionPoint ? casualtyCollectionPointLabel(collectionPointId) : undefined,
      collectionPoint,
      collectionPointPoint: collectionPoint ? (storedCollectionPoint?.point ?? axialToMapPoint(collectionPoint)) : undefined,
      phase: "moving_to_casualty",
      issuedAt: command.issuedAt,
    }),
    buildEvent(session, "status_report_emitted", {
      sourceUnitId: issuer.id,
      kind: "status",
      message: `${casualty.name} omhändertas av bärarlag`,
      coord: issuer.coord,
      confidence: "high",
      relatedUnitId: casualty.id,
    }),
  ];

  for (const assignment of helperAssignments) {
    events.push(...interruptIfMoving(session, assignment.unit.id, "casualty_evacuation"));
    const pathResult = nearestPath(session.world, assignment.unit.coord, assignment.target, {
      blocked: occupiedHexes(session.world, assignment.unit.id),
      allowTarget: true,
      maxVisited: 1200,
    });
    if (sameCoord(assignment.unit.coord, assignment.target)) {
      events.push(
        buildEvent(session, "movement_completed", {
          unitId: assignment.unit.id,
          at: assignment.target,
          targetPoint: assignment.targetPoint,
          orderId,
          reason: "moving_to_casualty",
        }),
      );
    } else if (pathResult.path.length === 0) {
      events.push(
        buildEvent(session, "movement_blocked", {
          unitId: assignment.unit.id,
          from: assignment.unit.coord,
          target: assignment.target,
          reason: "no_path_to_casualty",
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
          reason: "moving_to_casualty",
        }),
      );
    }
  }

  return appendAndApply(session, events);
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

  const casualtyBlocked = rejectOrderForUnsecuredCasualty(session, issuer, command);
  if (casualtyBlocked) {
    return casualtyBlocked;
  }

  const orderId = `${session.id}_order_${session.events.length}`;
  const receivers = commandableFormationReceivers(session.world, issuer.id);
  const direction = explicitDirection ?? directionBetween(issuer.coord, target) ?? session.world.activeFormation?.direction ?? issuer.facing;
  const directionVector =
    directionVectorFromTargetPoint(issuer.position, explicitDirectionTargetPoint) ??
    directionVectorFromTarget(issuer.position, explicitDirectionTarget) ??
    (orderKind === "forward" ? session.world.activeFormation?.directionVector : undefined) ??
    directionVectorFromHexDirection(direction);
  const rawTargetPoint = explicitTargetPoint ?? axialToMapPoint(target);
  const targetPoint =
    formation === "file"
      ? fileFormationTargetPointForCasualtyBlock(session.world, receivers, rawTargetPoint, directionVector)
      : rawTargetPoint;
  const effectiveTarget = mapPointToHex(targetPoint);
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
      target: effectiveTarget,
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

function rejectOrderForUnsecuredCasualty(session: Session, issuer: Unit, command: PlayerCommand): Session | undefined {
  const casualty = unsecuredFriendlyCasualty(session.world);
  if (!casualty) {
    return undefined;
  }

  const receivers = commandableFormationReceivers(session.world, issuer.id);
  const movingUnits = receivers.filter((unit) => unit.intent.type === "moving");
  const events: DomainEvent[] = [
    buildEvent(session, "command_rejected", {
      reason: "unsecured_casualty",
      command,
      casualtyUnitId: casualty.id,
    }),
  ];

  if (session.world.activeFormation || session.world.activeManeuver || movingUnits.length > 0) {
    events.push(
      buildEvent(session, "group_halted", {
        issuerId: issuer.id,
        unitIds: session.world.units.filter((unit) => unit.side === "friendly").map((unit) => unit.id),
        reason: "unsecured_casualty",
        relatedUnitId: casualty.id,
      }),
    );
  }

  for (const unit of receivers) {
    events.push(
      buildEvent(session, "movement_waiting", {
        unitId: unit.id,
        from: unit.coord,
        target: unit.intent.type === "moving" ? unit.intent.target : unit.coord,
        reason: "unsecured_casualty",
        relatedUnitId: casualty.id,
      }),
    );
  }

  for (const unit of movingUnits) {
    events.push(
      buildEvent(session, "movement_interrupted", {
        unitId: unit.id,
        reason: "unsecured_casualty",
        relatedUnitId: casualty.id,
      }),
    );
  }

  events.push(
    buildEvent(session, "status_report_emitted", {
      sourceUnitId: issuer.id,
      kind: "status",
      message: `${casualty.name} skadad, starta bärarlag innan ny förflyttning`,
      coord: casualty.coord,
      confidence: "high",
      relatedUnitId: casualty.id,
    }),
  );

  return appendAndApply(session, events);
}

function buildInitialWorld(
  sessionId: string,
  seed: string,
  scenarioOption: (typeof SCENARIO_OPTIONS)[number],
  difficulty: DifficultyLevel,
  overrides?: PhaseOneOverrides,
): WorldState {
  const map = buildMap(seed, [...scenarioTerrainPatches(scenarioOption, seed), ...(overrides?.terrainPatches ?? [])]);
  const start = overrides?.player?.coord ?? scenarioOption.start;
  const player: Unit = {
    id: "FRIENDLY_1",
    name: "Andersson",
    side: "friendly",
    role: "soldier",
    element: "tat_1",
    position: axialToMapPoint(start),
    coord: start,
    facing: overrides?.player?.facing ?? scenarioOption.facing,
    lookDirection: overrides?.player?.lookDirection ?? overrides?.player?.facing ?? scenarioOption.facing,
    health: 100,
    stamina: 100,
    stress: 10,
    suppression: 0,
    fireCooldown: 0,
    posture: overrides?.player?.posture ?? "standing",
    status: [],
    intent: { type: "idle" },
    alerted: false,
  };
  const friendlies =
    scenarioOption.kind === "group_commander"
      ? buildGroupCommanderUnits(overrides, scenarioOption)
      : scenarioOption.kind === "risk_zone"
        ? buildRiskZoneUnits(overrides, scenarioOption)
        : [player];
  if (scenarioOption.id === "casualty_retreat") {
    const wounded = friendlies.find((unit) => unit.id === "FRIENDLY_6");
    if (wounded) {
      wounded.health = 35;
      wounded.posture = "injured";
      wounded.stamina = 35;
      wounded.status = Array.from(new Set([...wounded.status, "injured", "primary_casualty"]));
    }
  }
  const opposingOverrides = overrides?.opposing ?? defaultOpposingForScenario(scenarioOption.id);
  const opposing = opposingOverrides.map((unit, index): Unit => {
    const coord = unit.coord ?? { q: 60 + index * 4, r: 45 + index * 4 };
    const facing = unit.facing ?? "NW";
    const tile = map.tilesByKey[hexKey(coord)];
    return {
      id: unit.id ?? `OP_${index + 1}`,
      name: `Observer ${index + 1}`,
      side: "opposing",
      role: "observer",
      position: axialToMapPoint(coord),
      coord,
      facing,
      lookDirection: unit.lookDirection ?? facing,
      health: 100,
      stamina: 100,
      stress: 0,
      suppression: 0,
      fireCooldown: 0,
      posture: unit.posture ?? "crouched",
      status: initialOpposingStatus(tile, unit.status ?? []),
      intent: { type: "idle" },
      alerted: unit.alerted ?? false,
    };
  });

  return refreshVisibilityMemory(indexWorld({
      id: sessionId,
      seed,
      scenario: {
        id: scenarioOption.id,
        title: scenarioOption.title,
        subtitle: scenarioOption.subtitle,
        description: scenarioOption.description,
        difficulty,
        troop: scenarioOption.troop,
        goal: scenarioOption.goal,
        recommendedFormation: scenarioOption.recommendedFormation,
        training: scenarioOption.training ? clone(scenarioOption.training) : undefined,
      },
      difficulty,
      time: 0,
      objective: {
        id: scenarioOption.id,
        title: scenarioOption.goal.title,
        description: scenarioOption.goal.description,
        target: scenarioOption.goal.target,
        status: "active",
        constraints: scenarioOption.training?.constraints ? clone(scenarioOption.training.constraints) : undefined,
      },
    map,
    units: [...friendlies, ...opposing],
    unitsById: {},
    visibilityMemory: {},
  }));
}

function scenarioTerrainPatches(
  scenarioOption: (typeof SCENARIO_OPTIONS)[number],
  seed: string,
): Array<{ coord: HexCoord; terrain: TerrainType }> {
  const patches = new Map<string, { coord: HexCoord; terrain: TerrainType }>();
  const setPatch = (coord: HexCoord, terrain: TerrainType) => {
    if (coord.q < 0 || coord.r < 0 || coord.q >= 100 || coord.r >= 100) return;
    patches.set(hexKey(coord), { coord, terrain });
  };
  const paintRadius = (center: HexCoord, radius: number, terrain: TerrainType) => {
    for (const coord of coordsWithinRadius(center, radius)) {
      setPatch(coord, terrain);
    }
  };
  const paintBridge = (center: HexCoord, radius: number) => {
    const waterCoords = coordsWithinRadius(center, radius).filter((coord) => patches.get(hexKey(coord))?.terrain === "water");
    const bridgeCoords = waterCoords.length > 0 ? waterCoords : [center];
    for (const coord of bridgeCoords) {
      setPatch(coord, "bridge");
    }
  };
  const paintPath = (label: string, from: HexCoord, to: HexCoord, terrain: TerrainType, width = 0, bend = 0) => {
    const path = proceduralFeaturePath(from, to, seed, `${scenarioOption.id}:${label}`, bend);
    for (const coord of path) {
      paintRadius(coord, width, terrain);
    }
  };

  for (const clearing of scenarioOption.map.clearings ?? []) {
    paintRadius(clearing.center, clearing.radius, clearing.terrain ?? "field");
  }
  for (const corridor of scenarioOption.map.fieldCorridors ?? []) {
    paintPath("field", corridor.from, corridor.to, "field", corridor.width, corridor.bend ?? 0);
  }
  for (const forest of scenarioOption.map.forests ?? []) {
    paintRadius(forest.center, forest.radius, "forest");
  }
  for (const ditch of scenarioOption.map.ditches ?? []) {
    paintPath("ditch", ditch.from, ditch.to, "ditch", ditch.width ?? 0, ditch.bend ?? 0);
  }
  for (const road of scenarioOption.map.roads ?? []) {
    paintPath("road", road.from, road.to, "road", road.width ?? 0, road.bend ?? 0);
  }
  for (const river of scenarioOption.map.rivers ?? []) {
    paintPath("river", river.from, river.to, "water", river.width ?? 0, river.bend ?? 0);
    for (const bridge of river.bridges ?? []) {
      paintBridge(bridge.coord, bridge.radius ?? 0);
    }
  }
  for (const prepared of preparedOpposingPositionsForScenario(scenarioOption.id)) {
    paintRadius(prepared.coord, prepared.radius ?? 0, prepared.terrain);
  }

  return [...patches.values()];
}

function preparedOpposingPositionsForScenario(
  scenarioId: ScenarioId,
): Array<{ coord: HexCoord; terrain: TerrainType; radius?: number }> {
  if (scenarioId === "leader_lost_picture") {
    return [
      { coord: { q: 16, r: 49 }, terrain: "ditch", radius: 1 },
      { coord: { q: 26, r: 55 }, terrain: "ditch", radius: 1 },
    ];
  }
  if (scenarioId === "casualty_retreat") {
    return [
      { coord: { q: 30, r: 49 }, terrain: "ditch", radius: 1 },
      { coord: { q: 31, r: 54 }, terrain: "ditch", radius: 1 },
    ];
  }
  if (scenarioId === "ditch_line_contact") {
    return [
      { coord: { q: 28, r: 54 }, terrain: "ditch", radius: 1 },
      { coord: { q: 36, r: 55 }, terrain: "ditch", radius: 1 },
    ];
  }
  if (scenarioId === "river_bridge_crossing") {
    return [
      { coord: { q: 29, r: 45 }, terrain: "ditch", radius: 1 },
      { coord: { q: 36, r: 44 }, terrain: "forest", radius: 1 },
    ];
  }
  return [];
}

function initialOpposingStatus(tile: HexTile | undefined, requestedStatus: string[]): string[] {
  const status = new Set(requestedStatus);
  if (tile && tile.cover > 0) status.add("in_cover");
  if (tile && tile.concealment > 0) status.add("concealed");
  if (status.has("prepared_position")) {
    status.add("alerted");
  }
  return [...status];
}

function defaultOpposingForScenario(scenarioId: ScenarioId): OpposingUnitSeed[] {
  if (scenarioId === "river_bridge_crossing") {
    return [
      { id: "OP_1", coord: { q: 29, r: 45 }, facing: "SW", lookDirection: "SW", posture: "crouched", alerted: true, status: ["prepared_position"] },
      { id: "OP_2", coord: { q: 36, r: 44 }, facing: "SW", lookDirection: "SW", posture: "crouched", alerted: true, status: ["prepared_position"] },
    ];
  }
  if (scenarioId === "ditch_line_contact") {
    return [
      { id: "OP_1", coord: { q: 28, r: 54 }, facing: "SW", lookDirection: "SW", posture: "crouched", alerted: true, status: ["prepared_position"] },
      { id: "OP_2", coord: { q: 36, r: 55 }, facing: "SW", lookDirection: "SW", posture: "crouched", alerted: true, status: ["prepared_position"] },
    ];
  }
  if (scenarioId === "leader_lost_picture") {
    return [
      { id: "OP_1", coord: { q: 16, r: 49 }, facing: "NW", lookDirection: "NW", posture: "crouched", alerted: true, status: ["prepared_position"] },
      { id: "OP_2", coord: { q: 26, r: 55 }, facing: "NW", lookDirection: "NW", posture: "crouched", alerted: true, status: ["prepared_position"] },
    ];
  }
  if (scenarioId === "casualty_retreat") {
    return [
      { id: "OP_1", coord: { q: 30, r: 49 }, facing: "SW", lookDirection: "SW", posture: "crouched", alerted: true, status: ["prepared_position"] },
      { id: "OP_2", coord: { q: 31, r: 54 }, facing: "NW", lookDirection: "NW", posture: "crouched", alerted: true, status: ["prepared_position"] },
    ];
  }
  if (scenarioId === "risk_zone_blocking") {
    return [{ id: "OP_1", coord: { q: 30, r: 48 }, facing: "NW", lookDirection: "NW", posture: "crouched" }];
  }
  if (scenarioId === "cover_to_cover_hasty") {
    return [
      { id: "OP_1", coord: { q: 35, r: 47 }, facing: "SW", lookDirection: "SW", posture: "crouched" },
      { id: "OP_2", coord: { q: 42, r: 52 }, facing: "NW", lookDirection: "NW", posture: "standing" },
    ];
  }
  if (scenarioId === "cover_to_cover_observed") {
    return [
      { id: "OP_1", coord: { q: 33, r: 47 }, facing: "SW", lookDirection: "SW", posture: "crouched" },
      { id: "OP_2", coord: { q: 25, r: 54 }, facing: "NW", lookDirection: "NW", posture: "crouched" },
    ];
  }
  return [
    { id: "OP_1", coord: { q: 64, r: 45 }, facing: "NW", posture: "crouched" },
    { id: "OP_2", coord: { q: 72, r: 58 }, facing: "NW", posture: "standing" },
  ];
}

function proceduralFeaturePath(from: HexCoord, to: HexCoord, seed: string, label: string, bend: number): HexCoord[] {
  if (bend <= 0) return lineBetween(from, to);
  const fromPoint = axialToMapPoint(from);
  const toPoint = axialToMapPoint(to);
  const midpoint = averageMapPoint([fromPoint, toPoint]);
  const direction = normalizeVector(subtractMapPoint(toPoint, fromPoint));
  const normal = rightPerpendicular(direction);
  const signed = ((hashString(`${seed}:${label}:bend`) % 2001) / 1000 - 1) * bend;
  const waypoint = mapPointToHex(addMapPoint(midpoint, scaleVector(normal, signed)));
  return dedupeCoords([...lineBetween(from, waypoint), ...lineBetween(waypoint, to)]);
}

function buildGroupCommanderUnits(overrides?: PhaseOneOverrides, scenarioOption = scenarioOptionById("leader_lost_picture")): Unit[] {
  const start = overrides?.player?.coord ?? scenarioOption.start;
  const leader: Unit = {
    id: "LEADER_1",
    name: "Lind",
    side: "friendly",
    role: "leader",
    element: "tat_1",
    elementPosition: 1,
    position: axialToMapPoint(start),
    coord: start,
    facing: overrides?.player?.facing ?? scenarioOption.facing,
    lookDirection: overrides?.player?.lookDirection ?? overrides?.player?.facing ?? scenarioOption.facing,
    health: 100,
    stamina: 100,
    stress: 12,
    suppression: 0,
    fireCooldown: 0,
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
    element: "tat_2",
    elementPosition: 1,
    position: axialToMapPoint({ q: leader.coord.q, r: leader.coord.r + 1 }),
    coord: { q: leader.coord.q, r: leader.coord.r + 1 },
    facing: leader.facing,
    lookDirection: leader.lookDirection,
    health: 100,
    stamina: 100,
    stress: 11,
    suppression: 0,
    fireCooldown: 0,
    posture: "standing",
    status: [],
    intent: { type: "idle" },
    alerted: false,
  };

  const soldierSpecs: Array<Pick<Unit, "id" | "name" | "coord" | "element" | "elementPosition">> = [
    { id: "FRIENDLY_1", name: "Andersson", coord: addCoord(start, { q: -1, r: 1 }), element: "tat_1", elementPosition: 2 },
    { id: "FRIENDLY_2", name: "Berg", coord: addCoord(start, { q: -1, r: 0 }), element: "tat_1", elementPosition: 3 },
    { id: "FRIENDLY_3", name: "Ceder", coord: addCoord(start, { q: -2, r: 1 }), element: "tat_1", elementPosition: 4 },
    { id: "FRIENDLY_4", name: "Dahl", coord: addCoord(start, { q: 1, r: 0 }), element: "tat_2", elementPosition: 2 },
    { id: "FRIENDLY_5", name: "Ek", coord: addCoord(start, { q: 1, r: -1 }), element: "tat_2", elementPosition: 3 },
    { id: "FRIENDLY_6", name: "Falk", coord: addCoord(start, { q: 2, r: -1 }), element: "tat_2", elementPosition: 4 },
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
      suppression: 0,
      fireCooldown: 0,
      posture: "standing",
      status: [],
      intent: { type: "idle" },
      alerted: false,
    }),
  );

  return [leader, deputy, ...soldiers];
}

function buildRiskZoneUnits(overrides?: PhaseOneOverrides, scenarioOption = scenarioOptionById("risk_zone_blocking")): Unit[] {
  const start = overrides?.player?.coord ?? scenarioOption.start;
  const leaderFacing = overrides?.player?.facing ?? scenarioOption.facing;
  const leader: Unit = {
    id: "LEADER_1",
    name: "Lind",
    side: "friendly",
    role: "leader",
    element: "tat_1",
    elementPosition: 1,
    position: axialToMapPoint(start),
    coord: start,
    facing: leaderFacing,
    lookDirection: overrides?.player?.lookDirection ?? leaderFacing,
    health: 100,
    stamina: 100,
    stress: 8,
    suppression: 0,
    fireCooldown: 0,
    posture: overrides?.player?.posture ?? "standing",
    status: [],
    intent: { type: "idle" },
    alerted: false,
  };
  const wingmanCoord = { q: start.q + 1, r: start.r };
  const wingman: Unit = {
    id: "FRIENDLY_1",
    name: "Andersson",
    side: "friendly",
    role: "soldier",
    element: "tat_1",
    elementPosition: 2,
    position: axialToMapPoint(wingmanCoord),
    coord: wingmanCoord,
    facing: leader.facing,
    lookDirection: leader.lookDirection,
    health: 100,
    stamina: 100,
    stress: 10,
    suppression: 0,
    fireCooldown: 0,
    posture: "standing",
    status: [],
    intent: { type: "idle" },
    alerted: false,
  };
  return [leader, wingman];
}

function buildMap(seed: string, patches: Array<{ coord: HexCoord; terrain: TerrainType }>): GameMap {
  const width = 100;
  const height = 100;
  const tiles: HexTile[] = [];
  const tileIndexes = new Map<string, number>();

  for (let r = 0; r < height; r += 1) {
    for (let q = 0; q < width; q += 1) {
      const value = hashString(`${seed}:${q}:${r}`) % 100;
      const terrain: TerrainType =
        value < 9
          ? "forest"
          : value < 20
            ? "grass"
            : "field";
      tileIndexes.set(hexKey({ q, r }), tiles.length);
      tiles.push(tileFromTerrain({ q, r }, terrain));
    }
  }

  for (const patch of patches) {
    const index = tileIndexes.get(hexKey(patch.coord)) ?? -1;
    if (index >= 0) {
      tiles[index] = tileFromTerrain(patch.coord, patch.terrain);
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
    water: { moveCost: 99, cover: 0, concealment: 0, blocksSight: false, exposure: 0 },
    bridge: { moveCost: 0.85, cover: 0, concealment: 0, blocksSight: false, exposure: 3 },
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
  const next = mutableWorldForEvent(world);
  if (event.type === "time_advanced") {
    const seconds = Number(event.payload.seconds ?? 0);
    next.time = Number(event.payload.to);
    for (const unit of next.units) {
      unit.suppression = clamp((unit.suppression ?? 0) - seconds * SUPPRESSION_DECAY_PER_SECOND, 0, 1);
      unit.fireCooldown = Math.max(0, (unit.fireCooldown ?? 0) - seconds);
      if (unit.suppression <= 0) {
        unit.status = unit.status.filter((status) => status !== "suppressed");
      }
    }
  }
  if (event.type === "movement_started") {
    const unit = mutableUnit(next, String(event.payload.unitId));
    if (isUnitInjured(unit) || next.casualtyTeam?.casualtyUnitId === unit.id || unit.status.includes("being_dragged")) {
      unit.intent = { type: "idle" };
      syncCasualtyTeamCarriedUnit(next);
      return refreshVisibilityMemory(next);
    }
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
    syncDraggedCasualtyWithCarriers(next, unit.id);
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
      syncDraggedCasualtyWithCarriers(next, unit.id);
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
  if (event.type === "group_halted" && next.activeFormation) {
    const leader = maybeMutableUnit(next, String(event.payload.issuerId));
    next.activeFormation = {
      ...next.activeFormation,
      orderKind: "formation",
      phase: undefined,
      target: clone(leader?.coord ?? next.activeFormation.target),
      targetPoint: clone(leader?.position ?? next.activeFormation.targetPoint),
      advanceTarget: undefined,
      advanceTargetPoint: undefined,
    };
  }
  if (event.type === "group_halted" && next.activeManeuver) {
    next.activeManeuver = { ...next.activeManeuver, phase: "completed", movingUnitIds: [], coveringUnitIds: [] };
    for (const unit of next.units.filter((candidate) => candidate.side === "friendly")) {
      unit.status = unit.status.filter(
        (status) => status !== "covering_fire" && status !== "retreat_moving" && status !== "forward_moving" && status !== "reinforcement",
      );
    }
    updateCasualtyTeamState(next, { mode: casualtyTeamModeForWorld(next), teamIntent: "holding", waitReason: undefined });
  }
  if (event.type === "tactical_maneuver_started" || event.type === "tactical_maneuver_phase_changed") {
    const movingUnitIds = clone((event.payload.movingUnitIds as string[] | undefined) ?? []);
    const coveringUnitIds = clone((event.payload.coveringUnitIds as string[] | undefined) ?? []);
    const existing = next.activeManeuver;
    next.activeManeuver = {
      orderId: String(event.payload.orderId ?? existing?.orderId),
      type: String(event.payload.type ?? existing?.type ?? "alternating_retreat") as TacticalManeuverType,
      phase: String(event.payload.phase ?? "moving") as TacticalManeuverPhase,
      direction: String(event.payload.direction ?? existing?.direction ?? "SW") as Direction,
      directionVector: event.payload.directionVector ? clone(event.payload.directionVector as MapVector) : existing?.directionVector,
      communication: String(event.payload.communication ?? existing?.communication ?? "voice") as CommunicationMethod,
      coveringUnitIds,
      movingUnitIds,
      casualtyUnitId: event.payload.casualtyUnitId ? String(event.payload.casualtyUnitId) : existing?.casualtyUnitId,
      carrierUnitIds: event.payload.carrierUnitIds ? clone(event.payload.carrierUnitIds as string[]) : existing?.carrierUnitIds,
      requestedReinforcement: event.payload.requestedReinforcement
        ? clone(event.payload.requestedReinforcement as TacticalManeuverState["requestedReinforcement"])
        : existing?.requestedReinforcement,
      zipperSide: event.payload.zipperSide === "right" ? "right" : event.payload.zipperSide === "left" ? "left" : existing?.zipperSide,
      stepIndex: Number(event.payload.stepIndex ?? existing?.stepIndex ?? 0),
      boundIndex: Number(event.payload.boundIndex ?? existing?.boundIndex ?? 0),
      boundStartedUnitIds: clone((event.payload.boundStartedUnitIds as string[] | undefined) ?? []),
      issuedAt: Number(event.payload.issuedAt ?? existing?.issuedAt ?? event.time),
    };
    const moving = new Set(movingUnitIds);
    const covering = new Set(coveringUnitIds);
    const movingStatus = next.activeManeuver.type === "alternating_forward" ? "forward_moving" : "retreat_moving";
    for (const unit of next.units.filter((candidate) => candidate.side === "friendly")) {
      const base = unit.status.filter((status) => status !== "covering_fire" && status !== "retreat_moving" && status !== "forward_moving");
      if (moving.has(unit.id)) base.push(movingStatus);
      if (covering.has(unit.id)) base.push("covering_fire");
      unit.status = Array.from(new Set(base));
      if (covering.has(unit.id)) {
        unit.posture = unit.posture === "injured" ? unit.posture : "crouched";
      }
    }
    updateCasualtyTeamState(next);
  }
  if (event.type === "casualty_team_updated") {
    const carrierUnitIds = clone((event.payload.carrierUnitIds as string[] | undefined) ?? next.casualtyTeam?.carrierUnitIds ?? []);
    const carrierSlots = clone((event.payload.carrierSlots as Record<string, HexCoord> | undefined) ?? next.casualtyTeam?.carrierSlots ?? {});
    const carrierSlotPoints = clone((event.payload.carrierSlotPoints as Record<string, MapPoint> | undefined) ?? next.casualtyTeam?.carrierSlotPoints ?? {});
    updateCasualtyTeamState(next, {
      casualtyUnitId: String(event.payload.casualtyUnitId ?? next.casualtyTeam?.casualtyUnitId ?? next.casualtyEvacuation?.casualtyUnitId),
      carrierUnitIds,
      assignedElement: event.payload.assignedElement ? String(event.payload.assignedElement) as GroupElement : next.casualtyTeam?.assignedElement,
      mode: String(event.payload.mode ?? next.casualtyTeam?.mode ?? casualtyTeamModeForWorld(next)) as CasualtyTeamMode,
      teamIntent: String(event.payload.teamIntent ?? next.casualtyTeam?.teamIntent ?? "holding") as CasualtyTeamIntent,
      teamTarget: event.payload.teamTarget ? clone(event.payload.teamTarget as HexCoord) : next.casualtyTeam?.teamTarget,
      teamTargetPoint: event.payload.teamTargetPoint ? clone(event.payload.teamTargetPoint as MapPoint) : next.casualtyTeam?.teamTargetPoint,
      carrierSlots,
      carrierSlotPoints,
      casualtySlot: event.payload.casualtySlot ? clone(event.payload.casualtySlot as HexCoord) : next.casualtyTeam?.casualtySlot,
      casualtySlotPoint: event.payload.casualtySlotPoint ? clone(event.payload.casualtySlotPoint as MapPoint) : next.casualtyTeam?.casualtySlotPoint,
      waitReason: event.payload.waitReason ? String(event.payload.waitReason) as CasualtyTeamWaitReason : undefined,
      updatedAt: Number(event.payload.updatedAt ?? event.time),
    });
    syncCasualtyTeamCarriedUnit(next);
  }
  if (event.type === "friendly_fire_delivered") {
    const unit = maybeMutableUnit(next, String(event.payload.unitId));
    if (unit) {
      unit.lastFiredAt = event.time;
      unit.fireCooldown = RETREAT_FIRE_INTERVAL_SECONDS;
      unit.stamina = clamp(unit.stamina - COVERING_FIRE_STAMINA_COST, 0, 100);
      unit.status = Array.from(new Set([...unit.status, "covering_fire"]));
    }
  }
  if (event.type === "suppression_applied") {
    const unit = maybeMutableUnit(next, String(event.payload.unitId));
    if (unit) {
      unit.suppression = clamp(unit.suppression + Number(event.payload.amount ?? FRIENDLY_FIRE_SUPPRESSION), 0, 1);
      unit.status = Array.from(new Set([...unit.status, "suppressed"]));
      if (unit.side === "opposing") {
        const tile = next.map.tilesByKey[hexKey(unit.coord)];
        if (unit.posture === "standing" || unit.posture === "moving") {
          unit.posture = "crouched";
        }
        unit.status = initialOpposingStatus(tile, unit.status);
      }
    }
  }
  if (event.type === "stamina_changed") {
    const unit = maybeMutableUnit(next, String(event.payload.unitId));
    if (unit) {
      unit.stamina = clamp(unit.stamina + Number(event.payload.delta ?? 0), 0, 100);
      if (unit.stamina < CASUALTY_REINFORCEMENT_STAMINA_THRESHOLD) {
        unit.status = Array.from(new Set([...unit.status, "tired"]));
      } else {
        unit.status = unit.status.filter((status) => status !== "tired");
      }
    }
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
  if (event.type === "unit_wounded") {
    const unit = maybeMutableUnit(next, String(event.payload.unitId));
    if (unit) {
      unit.health = Math.min(unit.health, Number(event.payload.health ?? 35));
      unit.posture = "injured";
      unit.intent = { type: "idle" };
      unit.currentOrderId = undefined;
      unit.status = Array.from(
        new Set([
          ...unit.status.filter((status) => status !== "covering_fire" && status !== "retreat_moving" && status !== "forward_moving"),
          "injured",
        ]),
      );
    }
  }
  if (event.type === "casualty_collection_point_set") {
    const collectionPointId: CasualtyCollectionPointId = event.payload.collectionPointId === "asa2" ? "asa2" : "asa1";
    const coord = clone(event.payload.target as HexCoord);
    const point = clone((event.payload.targetPoint as MapPoint | undefined) ?? axialToMapPoint(event.payload.target as HexCoord));
    const existing = next.casualtyEvacuation ?? { helperUnitIds: [], phase: "idle" as const };
    next.casualtyEvacuation = {
      ...existing,
      collectionPointId,
      activeCollectionPointId: collectionPointId,
      collectionPoints: {
        ...(existing.collectionPoints ?? {}),
        [collectionPointId]: {
          id: collectionPointId,
          label: casualtyCollectionPointLabel(collectionPointId),
          coord,
          point,
          setAt: Number(event.payload.issuedAt ?? event.time),
        },
      },
      collectionPoint: coord,
      collectionPointPoint: point,
      phase: next.casualtyEvacuation?.phase === "dragging" || next.casualtyEvacuation?.phase === "moving_to_casualty"
        ? next.casualtyEvacuation.phase
        : "idle",
    };
  }
  if (event.type === "casualty_evacuation_started") {
    const helperUnitIds = clone((event.payload.helperUnitIds as string[] | undefined) ?? []);
    const collectionPointId: CasualtyCollectionPointId | undefined =
      event.payload.collectionPointId === "asa2" ? "asa2" : event.payload.collectionPointId === "asa1" ? "asa1" : undefined;
    const coord = event.payload.collectionPoint ? clone(event.payload.collectionPoint as HexCoord) : undefined;
    const point = coord
      ? clone((event.payload.collectionPointPoint as MapPoint | undefined) ?? axialToMapPoint(coord))
      : undefined;
    const existing = next.casualtyEvacuation ?? { helperUnitIds: [], phase: "idle" as const };
    next.casualtyEvacuation = {
      ...existing,
      collectionPointId,
      activeCollectionPointId: collectionPointId,
      collectionPoints: coord && collectionPointId
        ? {
            ...(existing.collectionPoints ?? {}),
            [collectionPointId]: {
              id: collectionPointId,
              label: casualtyCollectionPointLabel(collectionPointId),
              coord,
              point,
              setAt: Number(event.payload.issuedAt ?? event.time),
            },
          }
        : existing.collectionPoints,
      collectionPoint: coord,
      collectionPointPoint: point,
      orderId: String(event.payload.orderId),
      casualtyUnitId: String(event.payload.casualtyUnitId),
      helperUnitIds,
      carrierUnitIds: clone((event.payload.carrierUnitIds as string[] | undefined) ?? helperUnitIds),
      underFire: event.payload.underFire === true,
      phase: "moving_to_casualty",
      issuedAt: Number(event.payload.issuedAt ?? event.time),
    };
    for (const unitId of [String(event.payload.casualtyUnitId), ...helperUnitIds]) {
      const unit = maybeMutableUnit(next, unitId);
      if (!unit) continue;
      unit.currentOrderId = String(event.payload.orderId);
      unit.status = Array.from(new Set([...unit.status, unitId === String(event.payload.casualtyUnitId) ? "evac_pending" : "evac_helper"]));
    }
  }
  if (event.type === "casualty_drag_started") {
    const helperUnitIds = clone((event.payload.helperUnitIds as string[] | undefined) ?? next.casualtyEvacuation?.helperUnitIds ?? []);
    next.casualtyEvacuation = {
      ...(next.casualtyEvacuation ?? { helperUnitIds, phase: "dragging" }),
      orderId: String(event.payload.orderId ?? next.casualtyEvacuation?.orderId),
      casualtyUnitId: String(event.payload.casualtyUnitId ?? next.casualtyEvacuation?.casualtyUnitId),
      helperUnitIds,
      carrierUnitIds: clone((event.payload.carrierUnitIds as string[] | undefined) ?? next.casualtyEvacuation?.carrierUnitIds ?? helperUnitIds),
      phase: "dragging",
    };
    const casualty = maybeMutableUnit(next, String(event.payload.casualtyUnitId));
    if (casualty) {
      casualty.status = Array.from(new Set([...casualty.status.filter((status) => status !== "evac_pending"), "being_dragged"]));
      casualty.currentOrderId = String(event.payload.orderId ?? casualty.currentOrderId);
      casualty.intent = { type: "idle" };
    }
    for (const helperId of helperUnitIds) {
      const helper = maybeMutableUnit(next, helperId);
      if (!helper) continue;
      helper.posture = "helping";
      helper.status = Array.from(new Set([...helper.status, "evac_helper"]));
      helper.currentOrderId = String(event.payload.orderId ?? helper.currentOrderId);
    }
    updateCasualtyTeamState(next, {
      casualtyUnitId: String(event.payload.casualtyUnitId),
      carrierUnitIds: helperUnitIds,
      assignedElement: event.payload.assignedElement ? String(event.payload.assignedElement) as GroupElement : undefined,
      mode: String(event.payload.mode ?? casualtyTeamModeForWorld(next)) as CasualtyTeamMode,
      teamIntent: String(event.payload.teamIntent ?? "holding") as CasualtyTeamIntent,
      teamTarget: event.payload.teamTarget ? clone(event.payload.teamTarget as HexCoord) : undefined,
      teamTargetPoint: event.payload.teamTargetPoint ? clone(event.payload.teamTargetPoint as MapPoint) : undefined,
      carrierSlots: event.payload.carrierSlots ? clone(event.payload.carrierSlots as Record<string, HexCoord>) : undefined,
      carrierSlotPoints: event.payload.carrierSlotPoints ? clone(event.payload.carrierSlotPoints as Record<string, MapPoint>) : undefined,
      casualtySlot: event.payload.casualtySlot ? clone(event.payload.casualtySlot as HexCoord) : undefined,
      casualtySlotPoint: event.payload.casualtySlotPoint ? clone(event.payload.casualtySlotPoint as MapPoint) : undefined,
    });
    syncCasualtyTeamCarriedUnit(next);
  }
  if (event.type === "casualty_reinforcement_requested") {
    if (next.casualtyEvacuation) {
      next.casualtyEvacuation = {
        ...next.casualtyEvacuation,
        requestedReinforcement: {
          unitId: event.payload.unitId ? String(event.payload.unitId) : undefined,
          forUnitId: String(event.payload.forUnitId),
          requestedAt: Number(event.payload.requestedAt ?? event.time),
        },
      };
    }
    const unit = maybeMutableUnit(next, String(event.payload.unitId));
    if (unit) {
      unit.status = Array.from(new Set([...unit.status, "reinforcement"]));
    }
  }
  if (event.type === "casualty_carrier_relieved") {
    const oldCarrierId = String(event.payload.oldCarrierId);
    const newCarrierId = String(event.payload.newCarrierId);
    const reliefReason = String(event.payload.reason ?? "carrier_tired");
    const isHandoffRelief = reliefReason.includes("handoff");
    if (next.casualtyEvacuation) {
      const existingHelperUnitIds = uniqueIds(next.casualtyEvacuation.helperUnitIds);
      const newCarrierAlreadyHelping = existingHelperUnitIds.includes(newCarrierId);
      const helperUnitIds = existingHelperUnitIds.flatMap((unitId) => {
        if (unitId !== oldCarrierId) return [unitId];
        return newCarrierAlreadyHelping ? [] : [newCarrierId];
      });
      next.casualtyEvacuation = {
        ...next.casualtyEvacuation,
        helperUnitIds,
        carrierUnitIds: helperUnitIds,
        requestedReinforcement: undefined,
      };
    }
    const oldCarrier = maybeMutableUnit(next, oldCarrierId);
    if (oldCarrier) {
      const oldCarrierInjured = isUnitInjured(oldCarrier);
      oldCarrier.posture = oldCarrierInjured ? oldCarrier.posture : "crouched";
      const reliefStatuses = isHandoffRelief ? ["covering_fire"] : ["tired"];
      oldCarrier.status = Array.from(
        new Set([
          ...oldCarrier.status.filter((status) => status !== "evac_helper" && status !== "forward_moving" && status !== "retreat_moving" && status !== "reinforcement"),
          ...(oldCarrierInjured ? [] : reliefStatuses),
        ]),
      );
    }
    const newCarrier = maybeMutableUnit(next, newCarrierId);
    if (newCarrier) {
      newCarrier.posture = "helping";
      const newCarrierReliefStatuses = isHandoffRelief ? ["evac_helper", "covering_fire"] : ["evac_helper"];
      newCarrier.status = Array.from(
        new Set([
          ...newCarrier.status.filter((status) => status !== "reinforcement" && (isHandoffRelief || status !== "covering_fire")),
          ...newCarrierReliefStatuses,
        ]),
      );
      newCarrier.currentOrderId = String(event.payload.orderId ?? newCarrier.currentOrderId);
    }
    updateCasualtyTeamState(next);
    syncCasualtyTeamCarriedUnit(next);
  }
  if (event.type === "casualty_evacuation_completed") {
    if (next.casualtyEvacuation) {
      next.casualtyEvacuation = {
        ...next.casualtyEvacuation,
        phase: "completed",
      };
    }
    next.casualtyTeam = undefined;
    const helperUnitIds = (event.payload.helperUnitIds as string[] | undefined) ?? [];
    for (const unitId of [String(event.payload.casualtyUnitId), ...helperUnitIds]) {
      const unit = maybeMutableUnit(next, unitId);
      if (!unit) continue;
      unit.intent = { type: "idle" };
      unit.status = unit.status.filter((status) => status !== "being_dragged" && status !== "evac_pending" && status !== "evac_helper");
      if (unit.posture === "helping") unit.posture = "crouched";
    }
  }
  if (event.type === "objective_succeeded") {
    next.objective.status = "succeeded";
  }
  if (event.type === "objective_failed") {
    next.objective.status = "failed";
  }
  return refreshVisibilityMemory(next);
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

function collectMovementEvents(world: WorldState, seconds: number, random: () => number): PendingDomainEvent[] {
  const events: PendingDomainEvent[] = [];
  const noOneLeftBehindEvents = collectNoOneLeftBehindEvents(world);
  if (noOneLeftBehindEvents.length > 0) {
    return noOneLeftBehindEvents;
  }

  const phaseEvents = collectForwardFormationPhaseEvents(world);
  if (phaseEvents.length > 0) {
    return phaseEvents;
  }

  events.push(...collectTacticalManeuverEvents(world, seconds, random));
  events.push(...collectFatigueEvents(world, seconds));
  events.push(...collectCasualtyEvacuationEvents(world));
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
    if (world.casualtyTeam?.casualtyUnitId === unit.id || unit.status.includes("being_dragged")) {
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
    const dragSpacingStop = casualtyDragSpacingStop(world, unit, nextCoord);
    if (dragSpacingStop) {
      events.push({
        type: "movement_waiting",
        payload: {
          unitId: unit.id,
          from: unit.coord,
          target: unit.intent.target,
          waitingAt: nextCoord,
          reason: dragSpacingStop.reason,
          relatedUnitId: dragSpacingStop.relatedUnitId,
        },
      });
      continue;
    }
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

function collectNoOneLeftBehindEvents(world: WorldState): Array<{ type: string; payload: Record<string, unknown> }> {
  const casualty = unsecuredFriendlyCasualty(world);
  if (!casualty) {
    return [];
  }

  const maneuverActive = Boolean(world.activeManeuver && world.activeManeuver.phase !== "completed");
  const formationActive = Boolean(world.activeFormation && (world.activeFormation.phase === "advancing" || world.activeFormation.orderKind === "forward"));
  const orderedMovementActive = maneuverActive || formationActive;
  const movingUnits = world.units.filter((unit) => unit.side === "friendly" && unit.intent.type === "moving" && !isUnitInjured(unit));
  const interruptibleMovingUnits = movingUnits.filter((unit) => orderedMovementActive || !isCasualtyCareMovement(world, unit));
  if (!orderedMovementActive && interruptibleMovingUnits.length === 0) {
    return [];
  }

  const leader = world.units.find((unit) => unit.side === "friendly" && unit.role === "leader") ?? world.units.find((unit) => unit.side === "friendly");
  const activeUnitIds = orderedMovementActive
    ? world.units.filter((unit) => unit.side === "friendly" && !isUnitInjured(unit)).map((unit) => unit.id)
    : interruptibleMovingUnits.map((unit) => unit.id);
  const waitingUnitIds = uniqueIds([
    ...activeUnitIds,
    ...interruptibleMovingUnits.map((unit) => unit.id),
    ...(world.activeManeuver?.movingUnitIds ?? []),
  ]).filter((unitId) => {
    const unit = world.unitsById[unitId];
    return Boolean(unit && unit.side === "friendly" && !isUnitInjured(unit) && (orderedMovementActive || !isCasualtyCareMovement(world, unit)));
  });

  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
  if (orderedMovementActive) {
    events.push({
      type: "group_halted",
      payload: {
        issuerId: leader?.id ?? casualty.id,
        unitIds: world.units.filter((unit) => unit.side === "friendly").map((unit) => unit.id),
        reason: "unsecured_casualty",
        relatedUnitId: casualty.id,
      },
    });
  }

  for (const unitId of waitingUnitIds) {
    const unit = world.unitsById[unitId];
    if (!unit) continue;
    events.push({
      type: "movement_waiting",
      payload: {
        unitId: unit.id,
        from: unit.coord,
        target: unit.intent.type === "moving" ? unit.intent.target : unit.coord,
        reason: "unsecured_casualty",
        relatedUnitId: casualty.id,
      },
    });
  }

  for (const unit of interruptibleMovingUnits) {
    events.push({
      type: "movement_interrupted",
      payload: {
        unitId: unit.id,
        reason: "unsecured_casualty",
        relatedUnitId: casualty.id,
      },
    });
  }

  events.push({
    type: "status_report_emitted",
    payload: {
      sourceUnitId: leader?.id ?? casualty.id,
      kind: "status",
      message: `${casualty.name} skadad, ingen lämnas efter`,
      coord: casualty.coord,
      confidence: "high",
      relatedUnitId: casualty.id,
    },
  });
  return events;
}

function unsecuredFriendlyCasualty(world: WorldState): Unit | undefined {
  const protectedCasualtyIds = new Set<string>();
  if (world.casualtyEvacuation?.phase !== "completed" && world.casualtyEvacuation?.casualtyUnitId) {
    protectedCasualtyIds.add(world.casualtyEvacuation.casualtyUnitId);
  }
  if (world.casualtyTeam?.casualtyUnitId) {
    protectedCasualtyIds.add(world.casualtyTeam.casualtyUnitId);
  }

  return world.units
    .filter((unit) => unit.side === "friendly" && isUnitInjured(unit))
    .filter((unit) => !protectedCasualtyIds.has(unit.id))
    .filter((unit) => friendlyCarrierCapacityFor(world, unit) >= 2)
    .sort((a, b) => {
      const aPrimary = a.status.includes("primary_casualty") ? -1 : 0;
      const bPrimary = b.status.includes("primary_casualty") ? -1 : 0;
      return aPrimary - bPrimary || formationReceiverRank(a) - formationReceiverRank(b);
    })[0];
}

function friendlyCarrierCapacityFor(world: WorldState, casualty: Unit): number {
  return world.units.filter((unit) => unit.side === "friendly" && unit.id !== casualty.id && !isUnitInjured(unit)).length;
}

function isCasualtyCareMovement(world: WorldState, unit: Unit): boolean {
  const evacuationOrderId = world.casualtyEvacuation?.orderId;
  return (
    unit.status.includes("evac_helper") ||
    unit.status.includes("reinforcement") ||
    (Boolean(evacuationOrderId) && unit.currentOrderId === evacuationOrderId)
  );
}

function casualtyDragSpacingStop(world: WorldState, unit: Unit, nextCoord: HexCoord): { reason: string; relatedUnitId?: string } | undefined {
  const evacuation = world.casualtyEvacuation;
  const helperUnitIds = evacuation ? uniqueIds(evacuation.helperUnitIds) : [];
  if (!evacuation || evacuation.phase !== "dragging" || !helperUnitIds.includes(unit.id) || !evacuation.casualtyUnitId) {
    return undefined;
  }
  const casualty = world.unitsById[evacuation.casualtyUnitId];
  if (!casualty) {
    return undefined;
  }
  const helpers = helperUnitIds.map((unitId) => world.unitsById[unitId]).filter((candidate): candidate is Unit => Boolean(candidate));
  const simulatedHelpers = helpers.map((helper) =>
    helper.id === unit.id ? { ...helper, coord: nextCoord, position: axialToMapPoint(nextCoord) } : helper,
  );
  const followCoord = draggedCasualtyFollowCoord(world, casualty, simulatedHelpers);
  if (!followCoord || simulatedHelpers.some((helper) => hexDistance(helper.coord, followCoord) > 2)) {
    return { reason: "casualty_drag_spacing", relatedUnitId: casualty.id };
  }
  const otherHelper = simulatedHelpers.find((candidate) => candidate.id !== unit.id && hexDistance(nextCoord, candidate.coord) > 4);
  return otherHelper ? { reason: "casualty_drag_spacing", relatedUnitId: otherHelper.id } : undefined;
}

function collectTacticalManeuverEvents(world: WorldState, _seconds: number, random: () => number): PendingDomainEvent[] {
  const maneuver = world.activeManeuver;
  if (!maneuver || maneuver.phase === "completed") {
    return [];
  }

  const events: PendingDomainEvent[] = [];
  const threatDirection = maneuverThreatDirection(maneuver.type, maneuver.direction);
  const target = nearestVisibleOpposingUnit(world, maneuver.coveringUnitIds);
  const neutralizedTargetIds = new Set<string>();
  for (const unitId of maneuver.coveringUnitIds) {
    const unit = world.unitsById[unitId];
    if (!unit || isUnitInjured(unit) || unit.fireCooldown > 0) continue;
    if (target && !neutralizedTargetIds.has(target.id)) {
      const result = friendlyFireResolutionEvents(world, unit, target, threatDirection, random, {
        deliveredReason: "covering_fire",
        effectReason: "covering_fire",
        maneuverOrderId: maneuver.orderId,
      });
      events.push(...result.events);
      if (result.hit) {
        neutralizedTargetIds.add(target.id);
      }
      continue;
    }
    events.push({
      type: "friendly_fire_delivered",
      payload: {
        unitId,
        targetId: target?.id,
        direction: threatDirection,
        reason: "covering_fire",
        maneuverOrderId: maneuver.orderId,
      },
    });
  }

  if (maneuver.type !== "alternating_forward") {
    const handoffEvents = tacticalCasualtyHandoffEvents(world, maneuver);
    if (handoffEvents.length > 0) {
      return [...events, ...handoffEvents];
    }
  }

  if (maneuver.phase === "handoff") {
    if (maneuver.type === "alternating_forward") {
      const handoffEvents = tacticalCasualtyHandoffEvents(world, maneuver);
      if (handoffEvents.length > 0) {
        return [...events, ...handoffEvents];
      }
    }
    if (!coveringFireReadyForManeuverBound(world, maneuver, events)) {
      return events;
    }
    return [...events, ...tacticalManeuverNextBoundEvents(world, maneuver)];
  }

  const boundStartedUnitIds = (maneuver.boundStartedUnitIds ?? []).filter((unitId) => maneuver.movingUnitIds.includes(unitId));
  if (boundStartedUnitIds.length === 0) {
    if (!coveringFireReadyForManeuverBound(world, maneuver, events)) {
      return events;
    }
    const startEvents = tacticalManeuverMovementStartEvents(world, maneuver, maneuver.movingUnitIds, maneuver.coveringUnitIds);
    const startedUnitIds = tacticalManeuverStartedUnitIds(startEvents);
    if (startedUnitIds.length === 0) {
      return [...events, ...startEvents];
    }
    events.push({
      type: "tactical_maneuver_phase_changed",
      payload: {
        orderId: maneuver.orderId,
        type: maneuver.type,
        phase: "moving",
        direction: maneuver.direction,
        directionVector: maneuver.directionVector,
        communication: maneuver.communication,
        coveringUnitIds: maneuver.coveringUnitIds,
        movingUnitIds: maneuver.movingUnitIds,
        boundStartedUnitIds: startedUnitIds,
        zipperSide: maneuver.zipperSide,
        stepIndex: maneuver.stepIndex ?? 0,
        boundIndex: maneuver.boundIndex ?? 0,
      },
    });
    events.push(...startEvents);
    return events;
  }

  const movingUnits = boundStartedUnitIds.map((unitId) => world.unitsById[unitId]).filter(Boolean);
  const movingComplete = movingUnits.length > 0 && movingUnits.every((unit) => unit.intent.type === "idle");
  if (!movingComplete) {
    return events;
  }
  if (maneuver.type === "alternating_forward") {
    return [
      ...events,
      tacticalManeuverHandoffEvent(world, maneuver, boundStartedUnitIds),
      tacticalManeuverHandoffStatusEvent(world, maneuver, boundStartedUnitIds),
    ];
  }
  if (!coveringFireReadyForManeuverBound(world, maneuver, events)) {
    return events;
  }
  return [...events, ...tacticalManeuverNextBoundEvents(world, maneuver)];
}

function tacticalManeuverHandoffEvent(
  world: WorldState,
  maneuver: TacticalManeuverState,
  completedUnitIds: string[],
): { type: string; payload: Record<string, unknown> } {
  const receivers = formationReceivers(world, world.units.find((unit) => unit.role === "leader")?.id ?? "")
    .filter((unit) => !isUnitInjured(unit));
  const coveringUnitIds = receivers.map((unit) => unit.id);
  const sourceUnitId = completedUnitIds[0] ?? maneuver.movingUnitIds[0] ?? maneuver.coveringUnitIds[0];
  return {
    type: "tactical_maneuver_phase_changed",
    payload: {
      orderId: maneuver.orderId,
      type: maneuver.type,
      phase: "handoff",
      direction: maneuver.direction,
      directionVector: maneuver.directionVector,
      communication: maneuver.communication,
      coveringUnitIds,
      movingUnitIds: [],
      boundStartedUnitIds: [],
      zipperSide: maneuver.zipperSide,
      stepIndex: maneuver.stepIndex ?? 0,
      boundIndex: maneuver.boundIndex ?? 0,
      statusMessage: "ELDSTÄLLNINGAR",
      sourceUnitId,
    },
  };
}

function tacticalManeuverHandoffStatusEvent(
  world: WorldState,
  maneuver: TacticalManeuverState,
  completedUnitIds: string[],
): { type: string; payload: Record<string, unknown> } {
  const sourceUnitId = completedUnitIds[0] ?? maneuver.movingUnitIds[0] ?? maneuver.coveringUnitIds[0];
  const source = sourceUnitId ? world.unitsById[sourceUnitId] : undefined;
  return {
    type: "status_report_emitted",
    payload: {
      sourceUnitId,
      kind: "status",
      message: "ELDSTÄLLNINGAR",
      coord: source?.coord,
      confidence: "high",
      reason: "alternating_forward_handoff",
    },
  };
}

function tacticalManeuverNextBoundEvents(
  world: WorldState,
  maneuver: TacticalManeuverState,
): Array<{ type: string; payload: Record<string, unknown> }> {
  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const nextBoundIndex = (maneuver.boundIndex ?? 0) + 1;
  const receivers = formationReceivers(world, world.units.find((unit) => unit.role === "leader")?.id ?? "");
  const effectiveReceivers = receivers.filter((unit) => !isUnitInjured(unit));
  const plannedMovingUnitIds =
    maneuver.type === "zipper_retreat"
      ? zipperRetreatMovingUnitIds(
          effectiveReceivers,
          maneuver.directionVector ?? directionVectorFromHexDirection(maneuver.direction),
          maneuver.zipperSide ?? "left",
          (maneuver.stepIndex ?? 0) + 1,
        )
      : alternatingBoundMovingUnitIds(effectiveReceivers, nextBoundIndex);
  const plannedCoveringUnitIds = effectiveReceivers.map((unit) => unit.id).filter((unitId) => !plannedMovingUnitIds.includes(unitId));
  const { movingUnitIds: nextMovingUnitIds, coveringUnitIds: nextCoveringUnitIds } = applyCasualtyTeamBoundOwnership(
    world,
    maneuver.type,
    nextBoundIndex,
    plannedMovingUnitIds,
    plannedCoveringUnitIds,
  );
  const nextStepIndex = maneuver.type === "zipper_retreat" ? (maneuver.stepIndex ?? 0) + 1 : maneuver.stepIndex ?? 0;
  if (nextMovingUnitIds.length === 0) {
    events.push({
      type: "tactical_maneuver_phase_changed",
      payload: {
        orderId: maneuver.orderId,
        type: maneuver.type,
        phase: "completed",
        direction: maneuver.direction,
        directionVector: maneuver.directionVector,
        communication: maneuver.communication,
        coveringUnitIds: nextCoveringUnitIds,
        movingUnitIds: [],
        boundStartedUnitIds: [],
        zipperSide: maneuver.zipperSide,
        stepIndex: nextStepIndex,
        boundIndex: nextBoundIndex,
      },
    });
    return events;
  }

  const startEvents = tacticalManeuverMovementStartEvents(world, maneuver, nextMovingUnitIds, nextCoveringUnitIds);
  const startedUnitIds = tacticalManeuverStartedUnitIds(startEvents);
  if (startedUnitIds.length === 0) {
    return [...events, ...startEvents];
  }

  events.push({
    type: "tactical_maneuver_phase_changed",
    payload: {
      orderId: maneuver.orderId,
      type: maneuver.type,
      phase: "moving",
      direction: maneuver.direction,
      directionVector: maneuver.directionVector,
      communication: maneuver.communication,
      coveringUnitIds: nextCoveringUnitIds,
      movingUnitIds: nextMovingUnitIds,
      boundStartedUnitIds: startedUnitIds,
      zipperSide: maneuver.zipperSide,
      stepIndex: nextStepIndex,
      boundIndex: nextBoundIndex,
    },
  });
  events.push(...startEvents);
  return events;
}

function tacticalManeuverStartedUnitIds(events: Array<{ type: string; payload: Record<string, unknown> }>): string[] {
  return events
    .filter((event) => event.type === "movement_started" || event.type === "movement_completed")
    .map((event) => String(event.payload.unitId))
    .filter(Boolean);
}

function applyCasualtyTeamBoundOwnership(
  world: WorldState,
  type: TacticalManeuverType,
  boundIndex: number,
  movingUnitIds: string[],
  coveringUnitIds: string[],
): { movingUnitIds: string[]; coveringUnitIds: string[] } {
  if (type !== "alternating_forward" && type !== "alternating_retreat") {
    return { movingUnitIds, coveringUnitIds };
  }
  const team = world.casualtyTeam ?? derivedCasualtyTeamState(world);
  if (!team || team.carrierUnitIds.length < 2) {
    return { movingUnitIds, coveringUnitIds };
  }

  const carrierUnitIds = uniqueIds(team.carrierUnitIds)
    .filter((unitId) => Boolean(world.unitsById[unitId] && !isUnitInjured(world.unitsById[unitId])));
  if (carrierUnitIds.length < 2) {
    return { movingUnitIds, coveringUnitIds };
  }

  const carrierSet = new Set(carrierUnitIds);
  const teamElement = casualtyTeamBoundElement(world, team);
  const movingElement = alternatingBoundElement(boundIndex);
  const moving = new Set(movingUnitIds.filter((unitId) => !carrierSet.has(unitId)));
  const covering = new Set(coveringUnitIds.filter((unitId) => !carrierSet.has(unitId)));

  if (teamElement && teamElement === movingElement) {
    for (const unitId of carrierUnitIds) {
      moving.add(unitId);
    }
  }

  return {
    movingUnitIds: sortUnitIdsByFormation(world, [...moving]),
    coveringUnitIds: sortUnitIdsByFormation(world, [...covering]),
  };
}

function initialTacticalManeuverBoundIndex(world: WorldState, type: TacticalManeuverType): number {
  if (type !== "alternating_forward") {
    return 0;
  }
  const team = world.casualtyTeam ?? derivedCasualtyTeamState(world);
  const teamElement = team ? casualtyTeamBoundElement(world, team) : undefined;
  return teamElement === "tat_2" ? 1 : 0;
}

function alternatingBoundElement(boundIndex: number): GroupElement {
  return boundIndex % 2 === 0 ? "tat_1" : "tat_2";
}

function casualtyTeamBoundElement(world: WorldState, team: Pick<CasualtyTeamState, "assignedElement" | "casualtyUnitId">): GroupElement | undefined {
  if (team.assignedElement === "tat_1" || team.assignedElement === "tat_2") {
    return team.assignedElement;
  }
  const casualtyElement = world.unitsById[team.casualtyUnitId]?.element;
  return casualtyElement === "tat_1" || casualtyElement === "tat_2" ? casualtyElement : undefined;
}

function sortUnitIdsByFormation(world: WorldState, unitIds: string[]): string[] {
  return uniqueIds(unitIds)
    .map((unitId) => world.unitsById[unitId])
    .filter((unit): unit is Unit => Boolean(unit))
    .sort((a, b) => formationReceiverRank(a) - formationReceiverRank(b))
    .map((unit) => unit.id);
}

function coveringFireReadyForManeuverBound(
  world: WorldState,
  maneuver: TacticalManeuverState,
  pendingEvents: Array<{ type: string; payload: Record<string, unknown> }>,
): boolean {
  const coveringUnits = maneuver.coveringUnitIds
    .map((unitId) => world.unitsById[unitId])
    .filter((unit): unit is Unit => Boolean(unit && !isUnitInjured(unit)));
  if (coveringUnits.length === 0) {
    return true;
  }
  const firedThisTick = new Set(
    pendingEvents
      .filter((event) => event.type === "friendly_fire_delivered")
      .map((event) => String(event.payload.unitId)),
  );
  return coveringUnits.some(
    (unit) =>
      firedThisTick.has(unit.id) ||
      (typeof unit.lastFiredAt === "number" && world.time - unit.lastFiredAt <= RETREAT_FIRE_INTERVAL_SECONDS + 0.35),
  );
}

function tacticalCasualtyHandoffEvents(
  world: WorldState,
  maneuver: TacticalManeuverState,
): Array<{ type: string; payload: Record<string, unknown> }> {
  if (maneuver.type !== "alternating_forward" && maneuver.type !== "alternating_retreat") {
    return [];
  }
  const evacuation = world.casualtyEvacuation;
  if (!evacuation || evacuation.phase !== "dragging" || !evacuation.casualtyUnitId) {
    return [];
  }
  const casualty = world.unitsById[evacuation.casualtyUnitId];
  if (!casualty) {
    return [];
  }
  if (maneuver.type === "alternating_forward") {
    return tacticalForwardCasualtyPickupEvents(world, maneuver, casualty, evacuation);
  }

  const movingCarrierIds = uniqueIds(evacuation.helperUnitIds).filter((unitId) => maneuver.movingUnitIds.includes(unitId));
  if (movingCarrierIds.length === 0) {
    return [];
  }
  const activeCarrierIds = new Set(uniqueIds(evacuation.helperUnitIds));
  const replacementCandidates = maneuver.coveringUnitIds
    .map((unitId) => world.unitsById[unitId])
    .filter((unit): unit is Unit => Boolean(unit && !isUnitInjured(unit)))
    .filter((unit) => !activeCarrierIds.has(unit.id))
    .filter((unit) => hexDistance(unit.coord, casualty.coord) <= 2 && unit.intent.type === "idle")
    .sort((a, b) => hexDistance(a.coord, casualty.coord) - hexDistance(b.coord, casualty.coord) || formationReceiverRank(a) - formationReceiverRank(b));
  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const replacements = [...replacementCandidates];

  for (const oldCarrierId of movingCarrierIds) {
    const newCarrier = replacements.shift();
    if (!newCarrier) break;
    events.push({
      type: "casualty_carrier_relieved",
      payload: {
        orderId: evacuation.orderId,
        casualtyUnitId: casualty.id,
        oldCarrierId,
        newCarrierId: newCarrier.id,
        reason: "alternating_handoff",
      },
    });
    events.push({
      type: "status_report_emitted",
      payload: {
        sourceUnitId: newCarrier.id,
        kind: "status",
        message: "tar över släpning",
        coord: newCarrier.coord,
        confidence: "high",
        relatedUnitId: oldCarrierId,
      },
    });
  }

  return events;
}

function tacticalForwardCasualtyPickupEvents(
  world: WorldState,
  maneuver: TacticalManeuverState,
  casualty: Unit,
  evacuation: CasualtyEvacuationState,
): Array<{ type: string; payload: Record<string, unknown> }> {
  const nextBoundIndex = (maneuver.boundIndex ?? 0) + 1;
  const receivers = formationReceivers(world, world.units.find((unit) => unit.role === "leader")?.id ?? "")
    .filter((unit) => !isUnitInjured(unit));
  const nextMovingUnitIds = alternatingBoundMovingUnitIds(receivers, nextBoundIndex);
  const nextMovingSet = new Set(nextMovingUnitIds);
  const activeCarrierIds = uniqueIds(evacuation.helperUnitIds);
  if (activeCarrierIds.length < 2 || activeCarrierIds.every((unitId) => nextMovingSet.has(unitId))) {
    return [];
  }

  const replacements = nextMovingUnitIds
    .map((unitId) => world.unitsById[unitId])
    .filter((unit): unit is Unit => Boolean(unit && unit.id !== casualty.id && !isUnitInjured(unit)))
    .filter((unit) => !activeCarrierIds.includes(unit.id))
    .sort((a, b) => casualtyCarrierSortScore(a, casualty) - casualtyCarrierSortScore(b, casualty));
  if (replacements.length < activeCarrierIds.length) {
    return [];
  }

  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const nextReplacements = [...replacements];
  for (const oldCarrierId of activeCarrierIds) {
    const newCarrier = nextReplacements.shift();
    if (!newCarrier) break;
    events.push({
      type: "casualty_carrier_relieved",
      payload: {
        orderId: evacuation.orderId,
        casualtyUnitId: casualty.id,
        oldCarrierId,
        newCarrierId: newCarrier.id,
        reason: "alternating_forward_handoff",
      },
    });
    events.push({
      type: "status_report_emitted",
      payload: {
        sourceUnitId: newCarrier.id,
        kind: "status",
        message: "tar över släpning för nästa framryckning",
        coord: newCarrier.coord,
        confidence: "high",
        relatedUnitId: oldCarrierId,
      },
    });
  }
  return events;
}

function collectFatigueEvents(world: WorldState, seconds: number): Array<{ type: string; payload: Record<string, unknown> }> {
  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
  for (const unit of world.units.filter((candidate) => candidate.side === "friendly")) {
    if (unit.status.includes("evac_helper") && world.casualtyEvacuation?.phase === "dragging") {
      events.push({
        type: "stamina_changed",
        payload: { unitId: unit.id, delta: -seconds * CASUALTY_DRAG_STAMINA_COST_PER_SECOND, reason: "casualty_drag" },
      });
    } else if ((unit.status.includes("retreat_moving") || unit.status.includes("forward_moving")) && unit.intent.type === "moving") {
      events.push({
        type: "stamina_changed",
        payload: {
          unitId: unit.id,
          delta: -seconds * RETREAT_STAMINA_COST_PER_HEX,
          reason: unit.status.includes("forward_moving") ? "alternating_forward_bound" : "retreat_bound",
        },
      });
    } else if (unit.intent.type === "idle" && unit.stamina < 100 && !unit.status.includes("evac_helper")) {
      events.push({
        type: "stamina_changed",
        payload: { unitId: unit.id, delta: seconds * 1.2, reason: "resting" },
      });
    }
  }
  return events;
}

function tacticalManeuverMovementStartEvents(
  world: WorldState,
  maneuver: TacticalManeuverState,
  movingUnitIds: string[],
  coveringUnitIds: string[],
): Array<{ type: string; payload: Record<string, unknown> }> {
  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const threatDirection = maneuverThreatDirection(maneuver.type, maneuver.direction);
  for (const unitId of coveringUnitIds) {
    const covering = world.unitsById[unitId];
    if (!covering || isUnitInjured(covering)) continue;
    events.push({
      type: "body_orientation_changed",
      payload: {
        unitId,
        direction: threatDirection,
        reason: "covering_fire",
      },
    });
  }
  const reserved = new Set(
    world.units
      .filter((unit) => !movingUnitIds.includes(unit.id))
      .map((unit) => hexKey(unit.coord)),
  );
  const teamPlan = casualtyTeamManeuverMovementPlan(world, maneuver, movingUnitIds, reserved);
  if (teamPlan?.blocked) {
    return [...events, ...teamPlan.events];
  }
  const teamHandledUnitIds = teamPlan?.handledUnitIds ?? new Set<string>();
  if (teamPlan) {
    events.push(...teamPlan.events);
    for (const coord of teamPlan.reservedCoords) {
      reserved.add(hexKey(coord));
    }
  }
  const assignments = tacticalManeuverTargetAssignments(
    world,
    maneuver.type,
    movingUnitIds.filter((unitId) => !teamHandledUnitIds.has(unitId)),
    coveringUnitIds,
    maneuver.direction,
    maneuver.directionVector ?? directionVectorFromHexDirection(maneuver.direction),
    reserved,
  );
  for (const unitId of movingUnitIds) {
    if (teamHandledUnitIds.has(unitId)) {
      continue;
    }
    const unit = world.unitsById[unitId];
    if (!unit || isUnitInjured(unit)) continue;
    const assignment = assignments.get(unitId);
    const target = assignment?.target ?? unit.coord;
    const targetPoint = assignment?.targetPoint ?? axialToMapPoint(target);
    if (assignment?.waitReason) {
      events.push({
        type: "movement_waiting",
        payload: {
          unitId,
          from: unit.coord,
          target,
          reason: assignment.waitReason,
        },
      });
      continue;
    }
    if (!tacticalMoveHasCover(world, unit, coveringUnitIds, threatDirection)) {
      events.push({
        type: "movement_waiting",
        payload: {
          unitId,
          from: unit.coord,
          target,
          reason: maneuver.type === "alternating_forward" ? "advance_cover_missing" : "retreat_cover_missing",
        },
      });
      continue;
    }
    const pathResult = nearestPath(world, unit.coord, target, {
      blocked: occupiedHexes(world, unit.id),
      allowTarget: true,
      maxVisited: 1200,
    });
    events.push(
      pathResult.path.length > 0
        ? {
            type: "movement_started",
            payload: {
              unitId,
              target,
              targetPoint,
              path: pathResult.path,
              orderId: maneuver.orderId,
              reason: maneuver.type === "alternating_forward" ? "alternating_forward_bound" : "retreat_bound",
            },
          }
        : {
            type: "movement_waiting",
            payload: {
              unitId,
              from: unit.coord,
              target,
              reason: maneuver.type === "alternating_forward" ? "advance_no_path" : "retreat_no_path",
            },
          },
    );
  }
  return events;
}

type CasualtyTeamManeuverPlan = {
  events: Array<{ type: string; payload: Record<string, unknown> }>;
  handledUnitIds: Set<string>;
  reservedCoords: HexCoord[];
  blocked?: boolean;
};

type CasualtyTeamLayout = {
  casualtySlot: HexCoord;
  casualtySlotPoint: MapPoint;
  carrierSlots: Record<string, HexCoord>;
  carrierSlotPoints: Record<string, MapPoint>;
  teamTarget: HexCoord;
  teamTargetPoint: MapPoint;
};

function casualtyTeamManeuverMovementPlan(
  world: WorldState,
  maneuver: TacticalManeuverState,
  movingUnitIds: string[],
  reserved: Set<string>,
): CasualtyTeamManeuverPlan | undefined {
  const team = world.casualtyTeam ?? derivedCasualtyTeamState(world);
  const evacuation = world.casualtyEvacuation;
  if (!team || !evacuation || evacuation.phase !== "dragging") {
    return undefined;
  }
  const casualty = world.unitsById[team.casualtyUnitId];
  const carrierUnitIds = uniqueIds(team.carrierUnitIds);
  const carriers = carrierUnitIds.map((unitId) => world.unitsById[unitId]).filter((unit): unit is Unit => Boolean(unit && !isUnitInjured(unit)));
  const mode = casualtyTeamModeForManeuver(maneuver.type) ?? casualtyTeamModeForWorld(world);
  if (!casualty || carriers.length < 2) {
    return casualtyTeamBlockedPlan(world, team, movingUnitIds, "carrier_missing", mode);
  }

  const movingCarrierIds = carrierUnitIds.filter((unitId) => movingUnitIds.includes(unitId));
  if (movingCarrierIds.length === 0) {
    return undefined;
  }
  if (movingCarrierIds.length < carrierUnitIds.length) {
    return casualtyTeamBlockedPlan(world, team, movingUnitIds, "carrier_missing", mode);
  }

  const layout = casualtyTeamLayoutForManeuver(world, maneuver, team, carriers, movingUnitIds, reserved);
  if (!layout) {
    return casualtyTeamBlockedPlan(world, team, movingUnitIds, "casualty_team_blocked", mode);
  }

  const events: CasualtyTeamManeuverPlan["events"] = [
    {
      type: "casualty_team_updated",
      payload: {
        casualtyUnitId: team.casualtyUnitId,
        carrierUnitIds,
        assignedElement: team.assignedElement,
        mode,
        teamIntent: "moving",
        teamTarget: layout.teamTarget,
        teamTargetPoint: layout.teamTargetPoint,
        carrierSlots: layout.carrierSlots,
        carrierSlotPoints: layout.carrierSlotPoints,
        casualtySlot: layout.casualtySlot,
        casualtySlotPoint: layout.casualtySlotPoint,
      },
    },
  ];

  const teamUnitIds = new Set([team.casualtyUnitId, ...carrierUnitIds]);
  const blockedForPath = new Set(
    world.units
      .filter((unit) => !teamUnitIds.has(unit.id) && !movingUnitIds.includes(unit.id))
      .map((unit) => hexKey(unit.coord)),
  );
  for (const carrier of carriers) {
    const target = layout.carrierSlots[carrier.id];
    if (!target) {
      return casualtyTeamBlockedPlan(world, team, movingUnitIds, "carrier_missing", mode);
    }
    const pathResult = nearestPath(world, carrier.coord, target, {
      blocked: blockedForPath,
      allowTarget: true,
      maxVisited: 1600,
    });
    if (pathResult.path.length === 0 && !sameCoord(carrier.coord, target)) {
      return casualtyTeamBlockedPlan(world, team, movingUnitIds, "casualty_team_blocked", mode);
    }
    events.push(
      sameCoord(carrier.coord, target)
        ? {
            type: "movement_completed",
            payload: {
              unitId: carrier.id,
              at: target,
              targetPoint: layout.carrierSlotPoints[carrier.id],
              orderId: maneuver.orderId,
              reason: "casualty_team_bound",
            },
          }
        : {
            type: "movement_started",
            payload: {
              unitId: carrier.id,
              target,
              targetPoint: layout.carrierSlotPoints[carrier.id],
              path: pathResult.path,
              orderId: maneuver.orderId,
              reason: "casualty_team_bound",
            },
          },
    );
  }

  return {
    events,
    handledUnitIds: new Set(carrierUnitIds),
    reservedCoords: [layout.casualtySlot, ...Object.values(layout.carrierSlots)],
  };
}

function casualtyTeamBlockedPlan(
  world: WorldState,
  team: CasualtyTeamState,
  movingUnitIds: string[],
  waitReason: CasualtyTeamWaitReason,
  mode = casualtyTeamModeForWorld(world),
): CasualtyTeamManeuverPlan {
  const target = team.teamTarget ?? team.casualtySlot ?? world.unitsById[team.casualtyUnitId]?.coord ?? { q: 0, r: 0 };
  return {
    blocked: true,
    handledUnitIds: new Set(movingUnitIds),
    reservedCoords: [],
    events: [
      {
        type: "casualty_team_updated",
        payload: {
          casualtyUnitId: team.casualtyUnitId,
          carrierUnitIds: team.carrierUnitIds,
          assignedElement: team.assignedElement,
          mode,
          teamIntent: "blocked",
          teamTarget: target,
          teamTargetPoint: axialToMapPoint(target),
          carrierSlots: team.carrierSlots,
          carrierSlotPoints: team.carrierSlotPoints,
          casualtySlot: team.casualtySlot,
          casualtySlotPoint: team.casualtySlotPoint,
          waitReason,
        },
      },
      ...movingUnitIds.map((unitId) => ({
        type: "movement_waiting",
        payload: {
          unitId,
          from: world.unitsById[unitId]?.coord ?? target,
          target,
          reason: waitReason,
          relatedUnitId: team.casualtyUnitId,
        },
      })),
    ],
  };
}

function casualtyTeamLayoutForManeuver(
  world: WorldState,
  maneuver: TacticalManeuverState,
  team: CasualtyTeamState,
  carriers: Unit[],
  movingUnitIds: string[],
  reserved: Set<string>,
): CasualtyTeamLayout | undefined {
  const casualty = world.unitsById[team.casualtyUnitId];
  if (!casualty || carriers.length < 2) return undefined;
  const directionVector = normalizeVector(maneuver.directionVector ?? directionVectorFromHexDirection(maneuver.direction));
  const lateral = rightPerpendicular(directionVector);
  const currentCenter = averageMapPoint([casualty.position, ...carriers.map((carrier) => carrier.position)]);
  const desiredCenter = casualtyTeamDesiredCenterForManeuver(world, maneuver, movingUnitIds, directionVector, lateral, currentCenter);
  const desiredCoord = mapPointToHex(desiredCenter);
  const teamUnitIds = new Set([team.casualtyUnitId, ...carriers.map((carrier) => carrier.id)]);
  const movingIdSet = new Set(movingUnitIds);
  const baseReserved = new Set(
    [...reserved].filter((key) => !teamUnitIds.has(world.units.find((unit) => hexKey(unit.coord) === key)?.id ?? "")),
  );
  for (const unit of world.units) {
    if (!teamUnitIds.has(unit.id) && !movingIdSet.has(unit.id)) {
      baseReserved.add(hexKey(unit.coord));
    }
  }

  const casualtyCandidates = coordsWithinRadius(desiredCoord, 4)
    .filter((coord) => inBounds(world.map, coord))
    .filter((coord) => !baseReserved.has(hexKey(coord)))
    .filter((coord) => {
      const tile = world.map.tilesByKey[hexKey(coord)];
      return tile && !isImpassable(tile);
    })
    .sort((a, b) => mapDistanceInHexes(axialToMapPoint(a), desiredCenter) - mapDistanceInHexes(axialToMapPoint(b), desiredCenter));

  for (const casualtySlot of casualtyCandidates) {
    const casualtyPoint = axialToMapPoint(casualtySlot);
    const firstCarrierPoint = addMapPoint(casualtyPoint, scaleVector(lateral, -HEX_CENTER_STEP));
    const secondCarrierPoint = addMapPoint(casualtyPoint, scaleVector(lateral, HEX_CENTER_STEP));
    const excluded = new Set([hexKey(casualtySlot)]);
    const firstCarrierSlot = nearestCasualtyTeamSlot(world, casualtySlot, firstCarrierPoint, baseReserved, excluded);
    if (!firstCarrierSlot) continue;
    excluded.add(hexKey(firstCarrierSlot));
    const secondCarrierSlot = nearestCasualtyTeamSlot(world, casualtySlot, secondCarrierPoint, baseReserved, excluded);
    if (!secondCarrierSlot) continue;

    const carrierSlots: Record<string, HexCoord> = {
      [carriers[0].id]: firstCarrierSlot,
      [carriers[1].id]: secondCarrierSlot,
    };
    const carrierSlotPoints: Record<string, MapPoint> = {
      [carriers[0].id]: axialToMapPoint(firstCarrierSlot),
      [carriers[1].id]: axialToMapPoint(secondCarrierSlot),
    };
    return {
      casualtySlot,
      casualtySlotPoint: casualtyPoint,
      carrierSlots,
      carrierSlotPoints,
      teamTarget: casualtySlot,
      teamTargetPoint: casualtyPoint,
    };
  }

  return undefined;
}

function casualtyTeamDesiredCenterForManeuver(
  world: WorldState,
  maneuver: TacticalManeuverState,
  movingUnitIds: string[],
  directionVector: MapVector,
  lateral: MapVector,
  currentCenter: MapPoint,
): MapPoint {
  if (maneuver.type === "alternating_forward") {
    const spacing = HEX_CENTER_STEP * ALTERNATING_FORWARD_SLOT_SPACING_HEXES;
    const lineAnchor = alternatingForwardAnchorPoint(world, new Set(movingUnitIds), directionVector, lateral, spacing);
    return addMapPoint(lineAnchor, scaleVector(directionVector, -HEX_CENTER_STEP));
  }

  return addMapPoint(currentCenter, scaleVector(directionVector, HEX_CENTER_STEP * RETREAT_BOUND_HEXES));
}

function nearestCasualtyTeamSlot(
  world: WorldState,
  casualtySlot: HexCoord,
  preferredPoint: MapPoint,
  reserved: Set<string>,
  excluded: Set<string>,
): HexCoord | undefined {
  return coordsWithinRadius(casualtySlot, 2)
    .filter((coord) => inBounds(world.map, coord))
    .filter((coord) => !reserved.has(hexKey(coord)) && !excluded.has(hexKey(coord)))
    .filter((coord) => hexDistance(coord, casualtySlot) >= 1 && hexDistance(coord, casualtySlot) <= 2)
    .filter((coord) => {
      const tile = world.map.tilesByKey[hexKey(coord)];
      return tile && !isImpassable(tile);
    })
    .sort((a, b) => mapDistanceInHexes(axialToMapPoint(a), preferredPoint) - mapDistanceInHexes(axialToMapPoint(b), preferredPoint))[0];
}

function nearestVisibleOpposingUnit(world: WorldState, sourceUnitIds: string[]): Unit | undefined {
  const sources = sourceUnitIds.map((unitId) => world.unitsById[unitId]).filter(Boolean);
  return world.units
    .filter((unit) => unit.side === "opposing" && !isUnitInjured(unit))
    .map((opposing) => ({
      opposing,
      distance: Math.min(...sources.map((source) => mapDistanceInHexes(source.position, opposing.position))),
      visible: sources.some((source) => canSee(world, source, opposing)),
    }))
    .filter((candidate) => candidate.visible)
    .sort((a, b) => a.distance - b.distance)[0]?.opposing;
}

function collectCasualtyEvacuationEvents(world: WorldState): Array<{ type: string; payload: Record<string, unknown> }> {
  const evacuation = world.casualtyEvacuation;
  if (!evacuation || !evacuation.orderId || !evacuation.casualtyUnitId || evacuation.phase === "completed") {
    return [];
  }

  const casualty = world.unitsById[evacuation.casualtyUnitId];
  const allHelpers = uniqueIds(evacuation.helperUnitIds).map((unitId) => world.unitsById[unitId]).filter(Boolean);
  const unavailableReliefEvents = casualty && allHelpers.length > 0
    ? casualtyUnavailableCarrierReliefEvents(world, evacuation, casualty, allHelpers)
    : [];
  if (unavailableReliefEvents.length > 0) {
    return unavailableReliefEvents;
  }
  const helpers = allHelpers.filter((unit) => !isUnitInjured(unit));
  if (!casualty || helpers.length < 2) {
    return [];
  }

  if (evacuation.phase === "moving_to_casualty") {
    const helpersReady = helpers.every((helper) => hexDistance(helper.coord, casualty.coord) <= 1 && helper.intent.type === "idle");
    if (!helpersReady) {
      return [];
    }

    const casualtyTarget = draggedCasualtyFollowCoord(world, casualty, helpers) ?? casualty.coord;
    const helperTargets = helperEscortTargets(world, casualty.coord, helpers, casualtyTarget);
    const collectionPointId = selectedCasualtyCollectionPointId(evacuation, undefined);
    const mode = casualtyTeamModeForWorld(world);
    const events: Array<{ type: string; payload: Record<string, unknown> }> = [
      {
        type: "casualty_drag_started",
        payload: {
          orderId: evacuation.orderId,
          casualtyUnitId: casualty.id,
          helperUnitIds: helpers.map((helper) => helper.id),
          carrierUnitIds: helpers.map((helper) => helper.id),
          collectionPointId,
          label: undefined,
          collectionPoint: evacuation.collectionPoint,
          casualtyTarget,
          mode,
          teamIntent: "holding",
          teamTarget: casualtyTarget,
          teamTargetPoint: axialToMapPoint(casualtyTarget),
          carrierSlots: Object.fromEntries([...helperTargets.entries()]),
          carrierSlotPoints: Object.fromEntries([...helperTargets.entries()].map(([unitId, coord]) => [unitId, axialToMapPoint(coord)])),
          casualtySlot: casualtyTarget,
          casualtySlotPoint: axialToMapPoint(casualtyTarget),
        },
      },
      {
        type: "status_report_emitted",
        payload: {
          sourceUnitId: helpers[0].id,
          kind: "status",
          message: `${casualty.name} bärs med gruppen`,
          coord: helpers[0].coord,
          confidence: "high",
          relatedUnitId: casualty.id,
        },
      },
    ];

    for (const helper of helpers) {
      const helperTarget = helperTargets.get(helper.id) ?? helper.coord;
      if (sameCoord(helper.coord, helperTarget)) {
        continue;
      }
      events.push(...movementEventsForCasualtyUnit(world, helper, helperTarget, evacuation.orderId, "casualty_helper_drag"));
    }
    return events;
  }

  if (evacuation.phase === "dragging") {
    const reinforcementEvents = casualtyReinforcementEvents(world, evacuation, casualty, helpers);
    if (reinforcementEvents.length > 0) {
      return reinforcementEvents;
    }

    if (world.activeManeuver?.type === "alternating_forward" && world.activeManeuver.phase !== "completed") {
      return [];
    }

    return [];
  }

  return [];
}

function casualtyReinforcementEvents(
  world: WorldState,
  evacuation: CasualtyEvacuationState,
  casualty: Unit,
  helpers: Unit[],
): Array<{ type: string; payload: Record<string, unknown> }> {
  const tiredCarrier = helpers
    .filter((helper) => helper.stamina <= CASUALTY_REINFORCEMENT_STAMINA_THRESHOLD)
    .sort((a, b) => a.stamina - b.stamina)[0];
  if (!tiredCarrier) {
    return [];
  }

  const requested = evacuation.requestedReinforcement;
  if (requested?.unitId) {
    const reinforcement = world.unitsById[requested.unitId];
    if (!reinforcement) {
      return [];
    }
    if (unitBusyWithActiveManeuver(world, reinforcement)) {
      return [];
    }
    if (hexDistance(reinforcement.coord, casualty.coord) <= 1 && reinforcement.intent.type === "idle") {
      return [
        {
          type: "casualty_carrier_relieved",
          payload: {
            orderId: evacuation.orderId,
            casualtyUnitId: casualty.id,
            oldCarrierId: tiredCarrier.id,
            newCarrierId: reinforcement.id,
            reason: "carrier_tired",
          },
        },
        {
          type: "status_report_emitted",
          payload: {
            sourceUnitId: reinforcement.id,
            kind: "status",
            message: `avlöser ${tiredCarrier.name}`,
            coord: reinforcement.coord,
            confidence: "high",
            relatedUnitId: tiredCarrier.id,
          },
        },
      ];
    }
    if (reinforcement.intent.type === "idle") {
      const target = nearestAvailableCoordAround(
        world,
        casualty.coord,
        reinforcement.coord,
        new Set(world.units.filter((unit) => unit.id !== reinforcement.id).map((unit) => hexKey(unit.coord))),
        1,
      );
      return movementEventsForCasualtyUnit(world, reinforcement, target, evacuation.orderId ?? "", "casualty_reinforcement");
    }
    return [];
  }

  const helperIds = new Set([casualty.id, ...helpers.map((helper) => helper.id)]);
  const availableReinforcements = world.units
    .filter((unit) => unit.side === "friendly" && !helperIds.has(unit.id) && !isUnitInjured(unit))
    .filter((unit) => !unitBusyWithActiveManeuver(world, unit));
  const nonCommandAvailable = availableReinforcements.filter((unit) => unit.role !== "leader" && unit.role !== "deputy_leader");
  const reinforcementCandidates = (nonCommandAvailable.length > 0 ? nonCommandAvailable : availableReinforcements)
    .filter((unit) => unit.stamina > CASUALTY_REINFORCEMENT_STAMINA_THRESHOLD);
  const reinforcement = reinforcementCandidates.sort((a, b) => casualtyCarrierSortScore(a, casualty) - casualtyCarrierSortScore(b, casualty))[0];
  if (!reinforcement) {
    return [];
  }
  const target = nearestAvailableCoordAround(
    world,
    casualty.coord,
    reinforcement.coord,
    new Set(world.units.filter((unit) => unit.id !== reinforcement.id).map((unit) => hexKey(unit.coord))),
    1,
  );
  const requestEvents: Array<{ type: string; payload: Record<string, unknown> }> = [
    {
      type: "casualty_reinforcement_requested",
      payload: {
        orderId: evacuation.orderId,
        casualtyUnitId: casualty.id,
        forUnitId: tiredCarrier.id,
        unitId: reinforcement.id,
        requestedAt: world.time,
      },
    },
    {
      type: "status_report_emitted",
      payload: {
        sourceUnitId: tiredCarrier.id,
        kind: "status",
        message: "förstärkning",
        coord: tiredCarrier.coord,
        confidence: "high",
        relatedUnitId: reinforcement.id,
      },
    },
  ];
  if (hexDistance(reinforcement.coord, casualty.coord) <= 1 && reinforcement.intent.type === "idle") {
    return [
      ...requestEvents,
      {
        type: "casualty_carrier_relieved",
        payload: {
          orderId: evacuation.orderId,
          casualtyUnitId: casualty.id,
          oldCarrierId: tiredCarrier.id,
          newCarrierId: reinforcement.id,
          reason: "carrier_tired",
        },
      },
    ];
  }
  return [...requestEvents, ...movementEventsForCasualtyUnit(world, reinforcement, target, evacuation.orderId ?? "", "casualty_reinforcement")];
}

function casualtyUnavailableCarrierReliefEvents(
  world: WorldState,
  evacuation: CasualtyEvacuationState,
  casualty: Unit,
  helpers: Unit[],
): Array<{ type: string; payload: Record<string, unknown> }> {
  const unavailable = helpers.find((helper) => isUnitInjured(helper));
  if (!unavailable) {
    return [];
  }
  const activeIds = new Set([casualty.id, ...evacuation.helperUnitIds]);
  const replacement = world.units
    .filter((unit) => unit.side === "friendly" && !activeIds.has(unit.id) && !isUnitInjured(unit))
    .filter((unit) => !unitBusyWithActiveManeuver(world, unit))
    .sort((a, b) => casualtyCarrierSortScore(a, casualty) - casualtyCarrierSortScore(b, casualty))[0];
  if (!replacement) {
    return [];
  }
  const reserved = new Set(world.units.filter((unit) => unit.id !== replacement.id).map((unit) => hexKey(unit.coord)));
  const target = nearestAvailableCoordAround(world, casualty.coord, replacement.coord, reserved, 1);
  return [
    {
      type: "casualty_carrier_relieved",
      payload: {
        orderId: evacuation.orderId,
        casualtyUnitId: casualty.id,
        oldCarrierId: unavailable.id,
        newCarrierId: replacement.id,
        reason: "carrier_unavailable",
      },
    },
    {
      type: "status_report_emitted",
      payload: {
        sourceUnitId: replacement.id,
        kind: "status",
        message: `avlöser ${unavailable.name}`,
        coord: replacement.coord,
        confidence: "high",
        relatedUnitId: unavailable.id,
      },
    },
    ...movementEventsForCasualtyUnit(world, replacement, target, evacuation.orderId ?? "", "casualty_reinforcement"),
  ];
}

function unitBusyWithActiveManeuver(world: WorldState, unit: Unit): boolean {
  const maneuver = world.activeManeuver;
  if (!maneuver || maneuver.phase === "completed") {
    return false;
  }
  return maneuver.movingUnitIds.includes(unit.id) || maneuver.coveringUnitIds.includes(unit.id);
}

function movementEventsForCasualtyUnit(
  world: WorldState,
  unit: Unit,
  target: HexCoord,
  orderId: string,
  reason: string,
): Array<{ type: string; payload: Record<string, unknown> }> {
  if (sameCoord(unit.coord, target)) {
    return [
      {
        type: "movement_completed",
        payload: { unitId: unit.id, at: target, targetPoint: axialToMapPoint(target), orderId, reason },
      },
    ];
  }

  const pathResult = nearestPath(world, unit.coord, target, {
    blocked: occupiedHexes(world, unit.id),
    allowTarget: true,
    maxVisited: 1600,
  });
  if (pathResult.path.length === 0) {
    return [
      {
        type: "movement_blocked",
        payload: { unitId: unit.id, from: unit.coord, target, reason: "no_path_to_casualty" },
      },
    ];
  }
  return [
    {
      type: "movement_started",
      payload: { unitId: unit.id, target, targetPoint: axialToMapPoint(target), path: pathResult.path, orderId, reason },
    },
  ];
}

function syncDraggedCasualtyWithCarriers(world: WorldState, movedUnitId: string): void {
  const evacuation = world.casualtyEvacuation;
  const helperUnitIds = evacuation ? uniqueIds(evacuation.helperUnitIds) : [];
  if (!evacuation || evacuation.phase !== "dragging" || !evacuation.casualtyUnitId || !helperUnitIds.includes(movedUnitId)) {
    return;
  }
  const casualty = maybeMutableUnit(world, evacuation.casualtyUnitId);
  const helpers = helperUnitIds
    .map((unitId) => world.unitsById[unitId])
    .filter((unit): unit is Unit => Boolean(unit && !isUnitInjured(unit)));
  if (!casualty || helpers.length < 2) {
    return;
  }
  updateCasualtyTeamState(world);
  const followCoord = draggedCasualtyFollowCoord(world, casualty, helpers);
  if (!followCoord) {
    casualty.intent = { type: "idle" };
    updateCasualtyTeamState(world, { teamIntent: "blocked", waitReason: "spacing_blocked" });
    return;
  }
  const followPoint = draggedCasualtyFollowPoint(followCoord, helpers);
  updateCasualtyTeamState(world, {
    casualtySlot: followCoord,
    casualtySlotPoint: followPoint,
  });
  casualty.coord = followCoord;
  casualty.position = followPoint;
  casualty.facing = helpers[0]?.facing ?? casualty.facing;
  casualty.lookDirection = casualty.facing;
  casualty.intent = { type: "idle" };
  casualty.status = Array.from(new Set([...casualty.status.filter((status) => status !== "evac_pending"), "being_dragged"]));
}

function draggedCasualtyFollowPoint(followCoord: HexCoord, helpers: Unit[]): MapPoint {
  const hexCenter = axialToMapPoint(followCoord);
  const carrierAverage = averageMapPoint(helpers.map((helper) => helper.position));
  return {
    x: hexCenter.x * 0.35 + carrierAverage.x * 0.65,
    y: hexCenter.y * 0.35 + carrierAverage.y * 0.65,
  };
}

function draggedCasualtyFollowCoord(
  world: WorldState,
  casualty: Unit,
  helpers: Unit[],
  preferredTarget?: HexCoord,
): HexCoord | undefined {
  const anchor = mapPointToHex(averageMapPoint(helpers.map((helper) => helper.position)));
  const reserved = new Set(
    world.units
      .filter((unit) => unit.id !== casualty.id)
      .map((unit) => hexKey(unit.coord)),
  );
  const helperKeys = new Set(helpers.map((helper) => hexKey(helper.coord)));
  return coordsWithinRadius(anchor, 2)
    .filter((coord) => inBounds(world.map, coord))
    .filter((coord) => !reserved.has(hexKey(coord)))
    .filter((coord) => !helperKeys.has(hexKey(coord)))
    .filter((coord) => helpers.every((helper) => hexDistance(coord, helper.coord) <= 2))
    .filter((coord) => {
      const tile = world.map.tilesByKey[hexKey(coord)];
      return tile && !isImpassable(tile);
    })
    .sort((a, b) => {
      const maxDistanceA = Math.max(...helpers.map((helper) => hexDistance(a, helper.coord)));
      const maxDistanceB = Math.max(...helpers.map((helper) => hexDistance(b, helper.coord)));
      return (
        maxDistanceA - maxDistanceB ||
        (preferredTarget ? hexDistance(a, preferredTarget) - hexDistance(b, preferredTarget) : 0) ||
        hexDistance(a, anchor) - hexDistance(b, anchor) ||
        hexDistance(a, casualty.coord) - hexDistance(b, casualty.coord)
      );
    })[0];
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

  const receivers = commandableFormationReceivers(world, leader.id);
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

  const receivers = commandableFormationReceivers(world, leader.id).filter((unit) => unit.currentOrderId === activeFormation.orderId);
  const leaderFormationPoint = leader.intent.type === "moving" ? leader.intent.targetPoint : leader.position;
  const assignments = formationAssignments(
    world,
    receivers,
    activeFormation.formation,
    leaderFormationPoint,
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
        !isUnitInjured(unit) &&
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
        world,
        unit,
        nextPosition,
        neighboursByUnit.get(unit.id) ?? [],
        simulatedPositions,
        plannedPositions,
        activeFormation,
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
        world,
        unit,
        nextPosition,
        neighbours,
        simulatedPositions,
        plannedPositions,
        activeFormation,
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
  world: WorldState,
  unit: Unit,
  position: MapPoint,
  neighbours: Unit[],
  simulatedPositions: Map<string, MapPoint>,
  plannedPositions: Map<string, MapPoint>,
  activeFormation: FormationState,
  direction: Direction | MapVector,
): { neighbour: Unit; leadHexes: number } | undefined {
  for (const neighbour of neighbours) {
    const neighbourPosition = simulatedPositions.get(neighbour.id) ?? plannedPositions.get(neighbour.id) ?? neighbour.position;
    const leadHexes = forwardLeadInHexes(position, neighbourPosition, direction);
    if (leadHexes > forwardLeadLimit(world, activeFormation, unit, neighbour)) {
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
    const leadLimit = forwardLeadLimit(world, activeFormation, unit, neighbour) * HEX_CENTER_STEP;
    score += Math.max(0, distance - 2) * FORMATION_NEIGHBOUR_WEIGHT;
    score += Math.max(0, lead - leadLimit) * FORMATION_NEIGHBOUR_WEIGHT * 2;
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
    if (
      !stops.has(unit.id) &&
      unit.intent.type === "moving" &&
      isTooFarAhead(unit, neighbour, activeFormation.directionVector ?? activeFormation.direction, forwardLeadLimit(world, activeFormation, unit, neighbour))
    ) {
      stops.set(unit.id, {
        neighbourId: neighbour.id,
        leadHexes: round(forwardLeadInHexes(unit.position, neighbour.position, activeFormation.directionVector ?? activeFormation.direction)),
        reason: "neighbour_lagging",
      });
    }
    if (
      !stops.has(neighbour.id) &&
      neighbour.intent.type === "moving" &&
      isTooFarAhead(neighbour, unit, activeFormation.directionVector ?? activeFormation.direction, forwardLeadLimit(world, activeFormation, neighbour, unit))
    ) {
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
  const receivers = commandableFormationReceivers(world, leaderId);
  if (world.activeFormation?.formation === "file") {
    const pairs: Array<[Unit, Unit]> = [];
    appendChainPairs(pairs, fileFormationOrderUnits(world, receivers));
    return pairs;
  }

  const leader = receivers.find((unit) => unit.role === "leader");
  const deputy = receivers.find((unit) => unit.role === "deputy_leader");
  const tatOne = orderedElementUnits(receivers, "tat_1");
  const tatTwo = orderedElementUnits(receivers, "tat_2");
  const pairs: Array<[Unit, Unit]> = [];

  if (leader && deputy) {
    pairs.push([leader, deputy]);
  }
  appendChainPairs(pairs, tatOne);
  appendChainPairs(pairs, tatTwo);

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

function isTooFarAhead(unit: Unit, neighbour: Unit, direction: Direction | MapVector, maxForwardLead = COHESION_MAX_FORWARD_LEAD): boolean {
  return forwardLeadInHexes(unit.position, neighbour.position, direction) > maxForwardLead;
}

function isTooFarFromNeighbour(unit: Unit, neighbour: Unit): boolean {
  return mapDistanceInHexes(unit.position, neighbour.position) > COHESION_MAX_NEIGHBOUR_DISTANCE_HEXES;
}

function forwardLeadInHexes(a: MapPoint, b: MapPoint, direction: Direction | MapVector): number {
  return (forwardProgress(a, direction) - forwardProgress(b, direction)) / HEX_CENTER_STEP;
}

function forwardLeadLimit(world: WorldState, activeFormation: FormationState, unit: Unit, neighbour: Unit): number {
  return COHESION_MAX_FORWARD_LEAD + expectedForwardLeadBetween(world, activeFormation, unit, neighbour);
}

function expectedForwardLeadBetween(world: WorldState, activeFormation: FormationState, unit: Unit, neighbour: Unit): number {
  if (activeFormation.formation !== "file") {
    return 0;
  }
  return Math.max(0, formationFileOrderIndex(world, neighbour) - formationFileOrderIndex(world, unit)) * FORMATION_FILE_SPACING_HEXES;
}

function formationFileOrderIndex(world: WorldState, unit: Unit): number {
  if (world.activeFormation?.formation === "file") {
    const leader = world.units.find((candidate) => candidate.side === "friendly" && candidate.role === "leader");
    const ordered = fileFormationOrderUnits(world, commandableFormationReceivers(world, leader?.id ?? unit.id));
    const index = ordered.findIndex((candidate) => candidate.id === unit.id);
    if (index >= 0) {
      return index;
    }
  }
  if (unit.role === "leader") return 0;
  if (unit.role === "deputy_leader") return 1;
  if (unit.element === "tat_1") return 1 + (unit.elementPosition ?? 1);
  if (unit.element === "tat_2") return 4 + (unit.elementPosition ?? 1);
  return formationReceiverRank(unit);
}

function alternatingBoundMovingUnitIds(units: Unit[], boundIndex: number): string[] {
  const moving = boundIndex % 2 === 0
    ? orderedElementUnits(units, "tat_1")
    : orderedElementUnits(units, "tat_2");
  return moving
    .filter((unit) => !isUnitInjured(unit))
    .sort((a, b) => formationReceiverRank(a) - formationReceiverRank(b))
    .map((unit) => unit.id);
}

function orderedElementUnits(units: Unit[], element: "tat_1" | "tat_2"): Unit[] {
  return units
    .filter((unit) => unit.element === element)
    .sort((a, b) => formationReceiverRank(a) - formationReceiverRank(b));
}

function maneuverThreatDirection(type: TacticalManeuverType, direction: Direction): Direction {
  return type === "alternating_forward" ? direction : rotateDirection(direction, 3);
}

function zipperRetreatOrder(units: Unit[], directionVector: MapVector, side: ZipperSide): Unit[] {
  const threatVector = scaleVector(normalizeVector(directionVector), -1);
  const lateral = side === "left" ? leftPerpendicular(threatVector) : rightPerpendicular(threatVector);
  return [...units]
    .filter((unit) => !isUnitInjured(unit))
    .sort(
      (a, b) =>
        dotMapPoint(b.position, lateral) - dotMapPoint(a.position, lateral) ||
        formationReceiverRank(a) - formationReceiverRank(b),
    );
}

function zipperRetreatMovingUnitIds(units: Unit[], directionVector: MapVector, side: ZipperSide, stepIndex: number): string[] {
  const ordered = zipperRetreatOrder(units, directionVector, side);
  const preferred = ordered.filter((unit) => unit.role !== "leader" && unit.role !== "deputy_leader");
  const command = ordered.filter((unit) => unit.role === "leader" || unit.role === "deputy_leader");
  const sequence = [...preferred, ...command];
  if (stepIndex >= sequence.length) {
    return [];
  }
  const unit = sequence[stepIndex];
  return unit ? [unit.id] : [];
}

type TacticalTargetAssignment = {
  target: HexCoord;
  targetPoint: MapPoint;
  waitReason?: string;
};

function tacticalManeuverTargetAssignments(
  world: WorldState,
  type: TacticalManeuverType,
  movingUnitIds: string[],
  coveringUnitIds: string[],
  direction: Direction,
  directionVector: MapVector,
  reserved: Set<string>,
): Map<string, TacticalTargetAssignment> {
  if (type === "alternating_forward") {
    return alternatingForwardTargetAssignments(world, movingUnitIds, coveringUnitIds, directionVector, reserved);
  }

  const assignments = new Map<string, TacticalTargetAssignment>();
  for (const unitId of movingUnitIds) {
    const unit = world.unitsById[unitId];
    if (!unit || isUnitInjured(unit)) continue;
    const target = retreatTargetForUnit(world, unit, direction, reserved);
    reserved.add(hexKey(target));
    assignments.set(unit.id, { target, targetPoint: axialToMapPoint(target) });
  }
  return assignments;
}

function alternatingForwardTargetAssignments(
  world: WorldState,
  movingUnitIds: string[],
  coveringUnitIds: string[],
  directionVector: MapVector,
  reserved: Set<string>,
): Map<string, TacticalTargetAssignment> {
  const movingIdSet = new Set(movingUnitIds);
  const assignedTargets: HexCoord[] = [];
  const assignments = new Map<string, TacticalTargetAssignment>();
  const forward = normalizeVector(directionVector);
  const right = rightPerpendicular(forward);
  const spacing = HEX_CENTER_STEP * ALTERNATING_FORWARD_SLOT_SPACING_HEXES;
  const anchor = alternatingForwardAnchorPoint(world, movingIdSet, forward, right, spacing);
  const orderedMovingUnits = movingUnitIds
    .map((unitId) => world.unitsById[unitId])
    .filter((unit): unit is Unit => Boolean(unit && !isUnitInjured(unit)))
    .sort((a, b) => formationReceiverRank(a) - formationReceiverRank(b));

  for (const unit of orderedMovingUnits) {
    const slotPoint = alternatingForwardSlotPoint(unit, anchor, right, spacing);
    const assignment = nearestAlternatingForwardTarget(
      world,
      unit,
      slotPoint,
      coveringUnitIds,
      directionVector,
      reserved,
      assignedTargets,
    );
    reserved.add(hexKey(assignment.target));
    assignedTargets.push(assignment.target);
    assignments.set(unit.id, assignment);
  }

  return assignments;
}

function alternatingForwardAnchorPoint(
  world: WorldState,
  movingUnitIds: Set<string>,
  forward: MapVector,
  right: MapVector,
  spacing: number,
): MapPoint {
  const leader = world.units.find((unit) => unit.side === "friendly" && unit.role === "leader");
  const deputy = world.units.find((unit) => unit.side === "friendly" && unit.role === "deputy_leader");
  const boundVector = scaleVector(forward, HEX_CENTER_STEP * ALTERNATING_FORWARD_BOUND_HEXES);

  if (leader && movingUnitIds.has(leader.id)) {
    return addMapPoint(leader.position, boundVector);
  }
  if (leader) {
    return clone(leader.position);
  }
  if (deputy && movingUnitIds.has(deputy.id)) {
    return addMapPoint(addMapPoint(deputy.position, boundVector), scaleVector(right, -spacing));
  }
  const movingUnits = Array.from(movingUnitIds)
    .map((unitId) => world.unitsById[unitId])
    .filter((unit): unit is Unit => Boolean(unit));
  return addMapPoint(averageMapPoint(movingUnits.map((unit) => unit.position)), boundVector);
}

function alternatingForwardSlotPoint(unit: Unit, anchor: MapPoint, right: MapVector, spacing: number): MapPoint {
  return addMapPoint(anchor, scaleVector(right, formationLateralSlot(unit) * spacing));
}

function nearestAlternatingForwardTarget(
  world: WorldState,
  unit: Unit,
  slotPoint: MapPoint,
  coveringUnitIds: string[],
  directionVector: MapVector,
  reserved: Set<string>,
  assignedTargets: HexCoord[],
): TacticalTargetAssignment {
  const desired = mapPointToHex(slotPoint);
  const candidates = coordsWithinRadius(desired, 5)
    .filter((coord) => inBounds(world.map, coord))
    .filter((coord) => !reserved.has(hexKey(coord)))
    .filter((coord) => {
      const tile = world.map.tilesByKey[hexKey(coord)];
      return tile && !isImpassable(tile);
    })
    .map((coord) => ({
      coord,
      blockRisk: coveringEffectBlockRisk(world, coord, coveringUnitIds, directionVector),
      spacingRisk: alternatingForwardSpacingRisk(coord, assignedTargets),
      distance: mapDistanceInHexes(axialToMapPoint(coord), slotPoint),
      terrainCost: world.map.tilesByKey[hexKey(coord)]?.moveCost ?? 1,
    }))
    .sort(
      (a, b) =>
        a.blockRisk - b.blockRisk ||
        a.spacingRisk - b.spacingRisk ||
        a.distance - b.distance ||
        a.terrainCost - b.terrainCost,
    );

  const safe = candidates.find((candidate) => candidate.blockRisk === 0 && candidate.spacingRisk === 0);
  const nonBlocking = candidates.find((candidate) => candidate.blockRisk === 0);
  const selected = safe ?? nonBlocking;
  if (!selected) {
    return {
      target: clone(unit.coord),
      targetPoint: clone(unit.position),
      waitReason: "effect_zone_block_risk",
    };
  }

  return {
    target: selected.coord,
    targetPoint: sameCoord(mapPointToHex(slotPoint), selected.coord) ? slotPoint : axialToMapPoint(selected.coord),
  };
}

function alternatingForwardSpacingRisk(candidate: HexCoord, assignedTargets: HexCoord[]): number {
  const assignedSpacingRisk = assignedTargets.reduce((risk, target) => risk + (hexDistance(candidate, target) <= 1 ? 1 : 0), 0);
  return assignedSpacingRisk;
}

function coveringEffectBlockRisk(world: WorldState, candidate: HexCoord, coveringUnitIds: string[], directionVector: MapVector): number {
  const candidatePoint = axialToMapPoint(candidate);
  const forward = normalizeVector(directionVector);
  const lateral = rightPerpendicular(forward);
  let risk = 0;

  for (const unitId of coveringUnitIds) {
    const covering = world.unitsById[unitId];
    if (!covering || isUnitInjured(covering)) continue;
    const delta = subtractMapPoint(candidatePoint, covering.position);
    const forwardHexes = dotMapPoint(delta, forward) / HEX_CENTER_STEP;
    const lateralHexes = Math.abs(dotMapPoint(delta, lateral)) / HEX_CENTER_STEP;
    if (forwardHexes <= ALTERNATING_FORWARD_BOUND_HEXES + 0.25 || forwardHexes > EFFECT_ZONE_RANGE_HEXES) continue;
    if (lateralHexes > 0.75) continue;
    if (!hasLineOfSight(world, covering.coord, candidate)) continue;
    risk += forwardHexes <= 4 ? 2 : 1;
  }

  return risk;
}

function retreatTargetForUnit(world: WorldState, unit: Unit, direction: Direction, reserved: Set<string>): HexCoord {
  const desired = coordInDirection(unit.coord, direction, RETREAT_BOUND_HEXES);
  const tile = world.map.tilesByKey[hexKey(desired)];
  if (inBounds(world.map, desired) && tile && !isImpassable(tile) && !reserved.has(hexKey(desired))) {
    return desired;
  }
  return nearestAvailableCoordAround(world, desired, unit.coord, reserved, 2);
}

function tacticalMoveHasCover(world: WorldState, unit: Unit, coveringUnitIds: string[], threatDirection: Direction): boolean {
  const tile = world.map.tilesByKey[hexKey(unit.coord)];
  if ((tile?.cover ?? 0) >= 1 || (tile?.exposure ?? 0) <= 1) {
    return true;
  }
  if (coveringUnitIds.some((unitId) => {
    const covering = world.unitsById[unitId];
    return covering && !isUnitInjured(covering) && covering.intent.type !== "moving";
  })) {
    return true;
  }
  return coveringUnitIds
    .map((unitId) => world.unitsById[unitId])
    .some((covering) => covering && !isUnitInjured(covering) && directionDelta(covering.lookDirection, threatDirection) <= 1);
}

function dotMapPoint(a: MapPoint, b: MapPoint): number {
  return a.x * b.x + a.y * b.y;
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
  const memoryWindow = visibilityMemorySeconds(session.world.difficulty);
  const hasMemory = typeof rememberedAt === "number" && session.world.time - rememberedAt <= memoryWindow;
  const lastSeenAt = visible ? session.world.time : hasMemory ? rememberedAt : latestReport?.time;
  const age = typeof lastSeenAt === "number" ? round(session.world.time - lastSeenAt) : undefined;
  const source = visible ? "visual" : hasMemory ? "memory" : latestReport ? "report" : "roster";
  const confidence =
    visible || role === "observer"
      ? "high"
      : typeof age === "number" && age <= 5
        ? "medium"
        : typeof age === "number" && age <= memoryWindow
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
  if (event.type === "incoming_fire_resolved") {
    const source = session.world.unitsById[String(event.payload.targetId)] ?? listener;
    return [
      heardEventFromSource(session, listener, role, event, source, "contact", "inkommande eld"),
    ];
  }
  if (event.type === "unit_wounded") {
    const source = session.world.unitsById[String(event.payload.unitId)] ?? listener;
    return [
      heardEventFromSource(session, listener, role, event, source, "report", `${source.name} är skadad`),
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

function objectiveTrainingFailure(session: Session): { reason: string; assessment: TrainingAssessment } | undefined {
  const assessment = trainingAssessmentFor(session);
  const reason = assessment?.metrics.hardFailures[0];
  return reason && assessment ? { reason, assessment } : undefined;
}

function collectObjectiveEvents(session: Session): Array<{ type: string; payload: Record<string, unknown> }> {
  const world = session.world;
  if (world.objective.status !== "active") return [];
  const friendlies = world.units.filter((unit) => unit.side === "friendly");
  const effectiveFriendlies = friendlies.filter((unit) => !isUnitInjured(unit));
  if (effectiveFriendlies.length === 0) {
    return [
      {
        type: "objective_failed",
        payload: { objectiveId: world.objective.id, reason: "no_effective_friendlies" },
      },
    ];
  }

  const trainingFailure = objectiveTrainingFailure(session);
  if (trainingFailure) {
    return [
      {
        type: "objective_failed",
        payload: {
          objectiveId: world.objective.id,
          reason: trainingFailure.reason,
          thresholdsExceeded: trainingFailure.assessment.metrics.thresholdsExceeded,
          metrics: trainingFailure.assessment.metrics,
        },
      },
    ];
  }

  if (isCoverToCoverScenarioId(world.scenario.id)) {
    const player = effectiveFriendlies[0];
    const distance = hexDistance(player.coord, world.objective.target);
    return distance <= OBJECTIVE_SINGLE_RADIUS_HEXES
      ? [
          {
            type: "objective_succeeded",
            payload: {
              objectiveId: world.objective.id,
              reason: "player_reached_objective",
              unitId: player.id,
              radiusHexes: OBJECTIVE_SINGLE_RADIUS_HEXES,
              distanceHexes: distance,
            },
          },
        ]
      : [];
  }

  if (world.scenario.id === "casualty_retreat") {
    const primaryCasualty = friendlies.find((unit) => isUnitInjured(unit) && unit.status.includes("primary_casualty"));
    const casualtyId = primaryCasualty?.id ?? world.casualtyEvacuation?.casualtyUnitId ?? friendlies.find((unit) => isUnitInjured(unit))?.id;
    const casualty = casualtyId ? world.unitsById[casualtyId] : undefined;
    const target = world.casualtyEvacuation?.collectionPoint ?? world.objective.target;
    const casualtyArrived = casualty ? hexDistance(casualty.coord, target) <= 1 : false;
    const leader = effectiveFriendlies.find((unit) => unit.role === "leader");
    const deputy = effectiveFriendlies.find((unit) => unit.role === "deputy_leader");
    const commandPairArrived =
      Boolean(leader && hexDistance(leader.coord, target) <= OBJECTIVE_GROUP_RADIUS_HEXES) &&
      Boolean(deputy && hexDistance(deputy.coord, target) <= OBJECTIVE_GROUP_RADIUS_HEXES);
    const arrived = effectiveFriendlies.filter((unit) => hexDistance(unit.coord, target) <= OBJECTIVE_GROUP_RADIUS_HEXES);
    const required = Math.max(1, Math.ceil(effectiveFriendlies.length * OBJECTIVE_GROUP_REQUIRED_RATIO));
    if (!casualtyArrived || !commandPairArrived || arrived.length < required) {
      return [];
    }
    return [
      {
        type: "objective_succeeded",
        payload: {
          objectiveId: world.objective.id,
          reason: "casualty_reached_asa",
          target,
          casualtyUnitId: casualty?.id,
          radiusHexes: OBJECTIVE_GROUP_RADIUS_HEXES,
          arrived: arrived.length,
          required,
          effectiveFriendlies: effectiveFriendlies.length,
          injured: friendlies.length - effectiveFriendlies.length,
          leaderId: leader?.id,
          deputyId: deputy?.id,
        },
      },
    ];
  }

  const radius = world.scenario.id === "risk_zone_blocking" ? 2 : OBJECTIVE_GROUP_RADIUS_HEXES;
  const arrived = effectiveFriendlies.filter((unit) => hexDistance(unit.coord, world.objective.target) <= radius);
  const leader = effectiveFriendlies.find((unit) => unit.role === "leader") ?? effectiveFriendlies[0];
  const leaderArrived = hexDistance(leader.coord, world.objective.target) <= radius;
  const required = world.scenario.id === "risk_zone_blocking"
    ? effectiveFriendlies.length
    : Math.max(1, Math.ceil(effectiveFriendlies.length * OBJECTIVE_GROUP_REQUIRED_RATIO));

  if (!leaderArrived || arrived.length < required) {
    return [];
  }

  return [
    {
      type: "objective_succeeded",
      payload: {
        objectiveId: world.objective.id,
        reason: world.scenario.id === "risk_zone_blocking" ? "team_reached_objective" : "group_reached_objective",
        radiusHexes: radius,
        arrived: arrived.length,
        required,
        effectiveFriendlies: effectiveFriendlies.length,
        injured: friendlies.length - effectiveFriendlies.length,
        leaderId: leader.id,
      },
    },
  ];
}

function collectOpposingUnitEvents(
  session: Session,
  random: () => number,
): Array<{ type: string; payload: Record<string, unknown> }> {
  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const world = session.world;
  const friendlyUnits = world.units.filter((unit) => unit.side === "friendly");
  const opposingUnits = world.units.filter((unit) => unit.side === "opposing" && !isUnitInjured(unit));
  const woundedTargetIdsThisTick = new Set<string>();

  for (const observer of opposingUnits) {
    events.push({ type: "opposing_unit_scanned", payload: { unitId: observer.id, direction: observer.lookDirection } });
    const target = friendlyUnits
      .filter((unit) => !isUnitInjured(unit))
      .filter((unit) => !woundedTargetIdsThisTick.has(unit.id))
      .filter((unit) => canSee(world, observer, unit))
      .sort((a, b) => contactTargetScore(world, observer, b) - contactTargetScore(world, observer, a))[0];
    if (!target) {
      continue;
    }

    const probability = detectionProbability(world, observer, target);
    const detectionRoll = random();
    const detected = observer.alerted || detectionRoll <= probability;
    if (!detected) {
      continue;
    }

    if (!observer.alerted) {
      events.push({
        type: "probabilistic_detection_resolved",
        payload: { observerId: observer.id, targetId: target.id, probability: round(probability), roll: round(detectionRoll) },
      });
      events.push({ type: "opposing_unit_alerted", payload: { observerId: observer.id, targetId: target.id } });
      const cover = nearestCover(world, observer.coord);
      if (cover && !sameCoord(cover, observer.coord)) {
        events.push({ type: "opposing_unit_moved_to_cover", payload: { unitId: observer.id, from: observer.coord, to: cover } });
      }
    }

    if (
      hasRecentEvent(
        session,
        "contact_pressure_emitted",
        opposingFireIntervalSeconds(observer),
        (event) => event.payload.unitId === observer.id,
      )
    ) {
      continue;
    }

    events.push({
      type: "contact_pressure_emitted",
      payload: { unitId: observer.id, targetId: target.id, kind: "direct_fire" },
    });

    const casualtyRisk = fireCasualtyProbability(world, observer, target);
    const casualtyRoll = random();
    events.push({
      type: "incoming_fire_resolved",
      payload: {
        unitId: observer.id,
        targetId: target.id,
        probability: round(casualtyRisk),
        roll: round(casualtyRoll),
        suppression: round(observer.suppression ?? 0),
      },
    });
    if (casualtyRoll <= casualtyRisk) {
      woundedTargetIdsThisTick.add(target.id);
      events.push({
        type: "unit_wounded",
        payload: {
          unitId: target.id,
          byUnitId: observer.id,
          health: 35,
          reason: "direct_fire",
          probability: round(casualtyRisk),
        },
      });
      events.push({
        type: "status_report_emitted",
        payload: {
          sourceUnitId: target.id,
          kind: "status",
          message: "skadad, kan inte fortsätta framryckning",
          coord: target.coord,
          confidence: "medium",
          relatedUnitId: observer.id,
        },
      });
    }
  }

  return events;
}

function collectFriendlyContactReactionEvents(
  world: WorldState,
  contactEvents: Array<{ type: string; payload: Record<string, unknown> }>,
  random: () => number,
): Array<{ type: string; payload: Record<string, unknown> }> {
  const activeOpposingUnitIds = new Set<string>();
  for (const event of contactEvents) {
    if (event.type === "contact_pressure_emitted" || event.type === "incoming_fire_resolved") {
      activeOpposingUnitIds.add(String(event.payload.unitId));
    }
    if (event.type === "unit_wounded" && typeof event.payload.byUnitId === "string") {
      activeOpposingUnitIds.add(event.payload.byUnitId);
    }
  }
  if (activeOpposingUnitIds.size === 0) {
    return [];
  }

  const events: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const neutralizedTargetIds = new Set<string>();
  for (const unit of world.units.filter((candidate) => candidate.side === "friendly" && !isUnitInjured(candidate))) {
    const tile = world.map.tilesByKey[hexKey(unit.coord)];
    if (unit.posture === "standing" || unit.posture === "moving") {
      events.push({
        type: "posture_changed",
        payload: {
          unitId: unit.id,
          posture: "crouched",
          reason: "contact_reaction",
          terrain: tile?.terrain,
          cover: tile?.cover ?? 0,
          concealment: tile?.concealment ?? 0,
          exposure: tile?.exposure ?? 0,
        },
      });
    }

    if (unit.fireCooldown > 0) {
      continue;
    }
    const target = reactiveFireTargetForUnit(world, unit, activeOpposingUnitIds, neutralizedTargetIds);
    if (!target) {
      continue;
    }
    const direction = directionBetween(unit.coord, target.coord) ?? unit.facing;
    if (unit.facing !== direction || unit.lookDirection !== direction) {
      events.push({
        type: "body_orientation_changed",
        payload: {
          unitId: unit.id,
          direction,
          reason: "contact_reaction",
          targetId: target.id,
        },
      });
    }
    const result = friendlyFireResolutionEvents(world, unit, target, direction, random, {
      deliveredReason: "contact_reaction",
      effectReason: "return_fire",
    });
    events.push(...result.events);
    if (result.hit) {
      neutralizedTargetIds.add(target.id);
    }
  }

  return events;
}

function friendlyFireResolutionEvents(
  world: WorldState,
  unit: Unit,
  target: Unit,
  direction: Direction,
  random: () => number,
  options: { deliveredReason: string; effectReason: string; maneuverOrderId?: string },
): { events: PendingDomainEvent[]; hit: boolean } {
  const suppressionAmount = friendlySuppressionAmountForTarget(world, target);
  const hitProbability = friendlyFireCasualtyProbability(world, unit, target, suppressionAmount);
  const hitRoll = random();
  const events: PendingDomainEvent[] = [
    {
      type: "friendly_fire_delivered",
      payload: {
        unitId: unit.id,
        targetId: target.id,
        direction,
        reason: options.deliveredReason,
        maneuverOrderId: options.maneuverOrderId,
      },
    },
    {
      type: "suppression_applied",
      payload: {
        unitId: target.id,
        byUnitId: unit.id,
        amount: suppressionAmount,
        reason: options.effectReason,
      },
    },
    {
      type: "friendly_fire_resolved",
      payload: {
        unitId: unit.id,
        targetId: target.id,
        probability: round(hitProbability),
        roll: round(hitRoll),
        suppression: round(clamp((target.suppression ?? 0) + suppressionAmount, 0, 1)),
        reason: options.effectReason,
      },
    },
  ];
  const hit = hitRoll <= hitProbability;
  if (hit) {
    events.push({
      type: "unit_wounded",
      payload: {
        unitId: target.id,
        byUnitId: unit.id,
        health: 0,
        reason: options.effectReason,
        probability: round(hitProbability),
      },
    });
  }

  return { events, hit };
}

function reactiveFireTargetForUnit(
  world: WorldState,
  unit: Unit,
  activeOpposingUnitIds: Set<string>,
  excludedTargetIds: Set<string> = new Set(),
): Unit | undefined {
  return Array.from(activeOpposingUnitIds)
    .map((unitId) => world.unitsById[unitId])
    .filter(
      (candidate): candidate is Unit =>
        Boolean(candidate) && candidate.side === "opposing" && !isUnitInjured(candidate) && !excludedTargetIds.has(candidate.id),
    )
    .map((target) => ({
      target,
      distance: mapDistanceInHexes(unit.position, target.position),
    }))
    .filter((candidate) => candidate.distance <= 10)
    .filter((candidate) => canAcquireReactiveFireTarget(world, unit, candidate.target, candidate.distance))
    .sort((a, b) => a.distance - b.distance)[0]?.target;
}

function canAcquireReactiveFireTarget(world: WorldState, unit: Unit, target: Unit, distance: number): boolean {
  if (!canSee(world, unit, target)) {
    return false;
  }
  const protection = targetProtectionScore(world, target);
  if (protection < 3) {
    return true;
  }
  const isAssignedCoveringFire =
    unit.status.includes("covering_fire") || Boolean(world.activeManeuver?.coveringUnitIds.includes(unit.id));
  return isAssignedCoveringFire || distance <= 3.5;
}

function friendlySuppressionAmountForTarget(world: WorldState, target: Unit): number {
  const protection = targetProtectionScore(world, target);
  return clamp(FRIENDLY_FIRE_SUPPRESSION - protection * 0.045, 0.12, FRIENDLY_FIRE_SUPPRESSION);
}

function friendlyFireCasualtyProbability(world: WorldState, unit: Unit, target: Unit, suppressionAmount: number): number {
  const distance = mapDistanceInHexes(unit.position, target.position);
  const protection = targetProtectionScore(world, target);
  const range = distance <= 3.5 ? 0.18 : distance <= 6 ? 0.08 : -0.04;
  const coveringFireBonus =
    unit.status.includes("covering_fire") || Boolean(world.activeManeuver?.coveringUnitIds.includes(unit.id)) ? 0.08 : 0;
  const suppressionBonus = clamp((target.suppression ?? 0) + suppressionAmount, 0, 1) * 0.24;
  return clamp(0.18 + range + coveringFireBonus + suppressionBonus - protection * 0.07, 0.02, FRIENDLY_FIRE_MAX_CASUALTY_PROBABILITY);
}

function targetProtectionScore(world: WorldState, target: Unit): number {
  const tile = world.map.tilesByKey[hexKey(target.coord)];
  const postureProtection = target.posture === "prone" ? 2 : target.posture === "crouched" ? 1 : 0;
  const preparedProtection = target.status.includes("prepared_position") ? 1 : 0;
  return (tile?.cover ?? 0) + (tile?.concealment ?? 0) + postureProtection + preparedProtection;
}

function isUnitInjured(unit: Unit): boolean {
  return unit.posture === "injured" || unit.health <= 0 || unit.status.includes("injured");
}

function contactTargetScore(world: WorldState, observer: Unit, target: Unit): number {
  const tile = world.map.tilesByKey[hexKey(target.coord)];
  const distance = mapDistanceInHexes(observer.position, target.position);
  return (tile?.exposure ?? 1) * 2 - (tile?.cover ?? 0) - (tile?.concealment ?? 0) * 0.5 - distance * 0.05;
}

function fireCasualtyProbability(world: WorldState, observer: Unit, target: Unit): number {
  const tile = world.map.tilesByKey[hexKey(target.coord)];
  const distance = mapDistanceInHexes(observer.position, target.position);
  const posture = target.posture === "standing" ? 0.12 : target.posture === "crouched" ? -0.08 : -0.18;
  const terrain = (tile?.exposure ?? 1) * 0.1 - (tile?.cover ?? 0) * 0.12 - (tile?.concealment ?? 0) * 0.08;
  const range = distance <= 8 ? 0.12 : distance <= 16 ? 0.04 : -0.05;
  const alertBonus = observer.alerted ? 0.06 : 0;
  const suppressionPenalty = (observer.suppression ?? 0) * SUPPRESSION_CASUALTY_RISK_REDUCTION;
  return clamp(0.08 + posture + terrain + range + alertBonus - suppressionPenalty, 0.01, 0.65);
}

function opposingFireIntervalSeconds(observer: Unit): number {
  return FIRE_RESOLUTION_WINDOW_SECONDS * (1 + (observer.suppression ?? 0) * SUPPRESSED_FIRE_INTERVAL_MULTIPLIER);
}

function formationReceivers(world: WorldState, leaderId: string): Unit[] {
  const friendlies = world.units.filter((unit) => unit.side === "friendly");
  return friendlies
    .filter((unit) => unit.id === leaderId || unit.role !== "leader")
    .sort((a, b) => formationReceiverRank(a) - formationReceiverRank(b) || a.id.localeCompare(b.id));
}

function commandableFormationReceivers(world: WorldState, leaderId: string): Unit[] {
  return formationReceivers(world, leaderId).filter((unit) => !isUnitInjured(unit));
}

function formationReceiverRank(unit: Unit): number {
  if (unit.role === "leader") return 0;
  if (unit.role === "deputy_leader") return 1;
  if (unit.element === "tat_1") return 10 + (unit.elementPosition ?? 9);
  if (unit.element === "tat_2") return 20 + (unit.elementPosition ?? 9);
  return 30;
}

type FormationAssignment = { unit: Unit; target: HexCoord; targetPoint: MapPoint };

function formationAssignments(
  world: WorldState,
  receivers: Unit[],
  formation: Formation,
  targetPoint: MapPoint,
  direction: Direction,
  directionVector: MapVector = directionVectorFromHexDirection(direction),
): FormationAssignment[] {
  const receiverIds = new Set(receivers.map((unit) => unit.id));
  const reserved = new Set(
    world.units
      .filter((unit) => !receiverIds.has(unit.id))
      .map((unit) => hexKey(unit.coord)),
  );
  if (formation === "file") {
    const casualtyBlockAssignments = fileFormationAssignmentsWithCasualtyBlock(world, receivers, targetPoint, directionVector, reserved);
    if (casualtyBlockAssignments) {
      return casualtyBlockAssignments;
    }
  }

  const offsets = formationOffsets(formation, direction, receivers, directionVector);
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

function fileFormationAssignmentsWithCasualtyBlock(
  world: WorldState,
  receivers: Unit[],
  targetPoint: MapPoint,
  directionVector: MapVector,
  reserved: Set<string>,
): FormationAssignment[] | undefined {
  const block = activeFormationCasualtyBlock(world, receivers);
  if (!block) {
    return undefined;
  }

  const rankedReceivers = fileFormationOrderUnits(world, receivers);
  const carrierIds = new Set(block.carriers.map((carrier) => carrier.id));
  const commandLead = rankedReceivers.filter((unit) => !carrierIds.has(unit.id) && (unit.role === "leader" || unit.role === "deputy_leader"));
  const tail = rankedReceivers.filter((unit) => !carrierIds.has(unit.id) && unit.role !== "leader" && unit.role !== "deputy_leader");
  const teamUnitIds = new Set([block.casualty.id, ...carrierIds]);
  const occupantByCoord = new Map(world.units.map((unit) => [hexKey(unit.coord), unit.id]));
  const localReserved = new Set(
    [...reserved].filter((key) => !teamUnitIds.has(occupantByCoord.get(key) ?? "")),
  );
  const assignments: FormationAssignment[] = [];
  const backVector = scaleVector(normalizeVector(directionVector), -HEX_CENTER_STEP * FORMATION_FILE_SPACING_HEXES);
  const slotPoint = (index: number) => addMapPoint(targetPoint, scaleVector(backVector, index));
  const assignNormalSlot = (unit: Unit, index: number): void => {
    const point = slotPoint(index);
    const target = nearestPassableFormationTarget(world, mapPointToHex(point), (coord) => !localReserved.has(hexKey(coord)));
    localReserved.add(hexKey(target));
    assignments.push({ unit, target, targetPoint: axialToMapPoint(target) });
  };

  let slotIndex = 0;
  for (const unit of commandLead) {
    assignNormalSlot(unit, slotIndex);
    slotIndex += 1;
  }

  const casualtySlotPoint = slotPoint(slotIndex);
  const casualtySlot = nearestPassableFormationTarget(world, mapPointToHex(casualtySlotPoint), (coord) => !localReserved.has(hexKey(coord)));
  localReserved.add(hexKey(casualtySlot));
  const lateral = rightPerpendicular(directionVector);
  const casualtyCenter = axialToMapPoint(casualtySlot);
  const excluded = new Set([hexKey(casualtySlot)]);
  const firstCarrierSlot = nearestCasualtyTeamSlot(
    world,
    casualtySlot,
    addMapPoint(casualtyCenter, scaleVector(lateral, -HEX_CENTER_STEP)),
    localReserved,
    excluded,
  );
  if (!firstCarrierSlot) {
    return undefined;
  }
  localReserved.add(hexKey(firstCarrierSlot));
  excluded.add(hexKey(firstCarrierSlot));
  const secondCarrierSlot = nearestCasualtyTeamSlot(
    world,
    casualtySlot,
    addMapPoint(casualtyCenter, scaleVector(lateral, HEX_CENTER_STEP)),
    localReserved,
    excluded,
  );
  if (!secondCarrierSlot) {
    return undefined;
  }
  localReserved.add(hexKey(secondCarrierSlot));
  assignments.push(
    { unit: block.carriers[0], target: firstCarrierSlot, targetPoint: axialToMapPoint(firstCarrierSlot) },
    { unit: block.carriers[1], target: secondCarrierSlot, targetPoint: axialToMapPoint(secondCarrierSlot) },
  );
  slotIndex += 1;

  for (const unit of tail) {
    assignNormalSlot(unit, slotIndex);
    slotIndex += 1;
  }

  return assignments;
}

function activeFormationCasualtyBlock(
  world: WorldState,
  receivers: Unit[],
): { casualty: Unit; carriers: [Unit, Unit] } | undefined {
  const evacuation = world.casualtyEvacuation;
  const team = world.casualtyTeam ?? derivedCasualtyTeamState(world);
  if (!evacuation || evacuation.phase !== "dragging" || !team) {
    return undefined;
  }
  const casualty = world.unitsById[team.casualtyUnitId];
  if (!casualty || !casualty.status.includes("being_dragged")) {
    return undefined;
  }
  const receiverIds = new Set(receivers.map((unit) => unit.id));
  const carriers = uniqueIds(team.carrierUnitIds)
    .map((unitId) => world.unitsById[unitId])
    .filter((unit): unit is Unit => Boolean(unit && receiverIds.has(unit.id) && !isUnitInjured(unit)));
  return carriers.length >= 2 ? { casualty, carriers: [carriers[0], carriers[1]] } : undefined;
}

function fileFormationTargetPointForCasualtyBlock(
  world: WorldState,
  receivers: Unit[],
  targetPoint: MapPoint,
  directionVector: MapVector,
): MapPoint {
  const block = activeFormationCasualtyBlock(world, receivers);
  if (!block) {
    return targetPoint;
  }
  const ordered = fileFormationOrderUnits(world, receivers);
  const carrierIds = new Set(block.carriers.map((carrier) => carrier.id));
  const blockSlotIndex = ordered.findIndex((unit) => carrierIds.has(unit.id));
  if (blockSlotIndex < 0) {
    return targetPoint;
  }
  const backVector = scaleVector(normalizeVector(directionVector), -HEX_CENTER_STEP * FORMATION_FILE_SPACING_HEXES);
  const currentCasualtyPoint = world.casualtyTeam?.casualtySlotPoint ?? block.casualty.position;
  return addMapPoint(currentCasualtyPoint, scaleVector(backVector, -blockSlotIndex));
}

function fileFormationOrderUnits(world: WorldState, receivers: Unit[]): Unit[] {
  const rankedReceivers = [...receivers].sort((a, b) => formationReceiverRank(a) - formationReceiverRank(b) || a.id.localeCompare(b.id));
  const block = activeFormationCasualtyBlock(world, rankedReceivers);
  if (!block) {
    return rankedReceivers;
  }
  const carrierIds = new Set(block.carriers.map((carrier) => carrier.id));
  const commandLead = rankedReceivers.filter((unit) => !carrierIds.has(unit.id) && (unit.role === "leader" || unit.role === "deputy_leader"));
  const tail = rankedReceivers.filter((unit) => !carrierIds.has(unit.id) && unit.role !== "leader" && unit.role !== "deputy_leader");
  return [...commandLead, ...block.carriers, ...tail];
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

  if (formation === "file") {
    const backVector = scaleVector(normalizeVector(directionVector), -HEX_CENTER_STEP * FORMATION_FILE_SPACING_HEXES);
    rankedReceivers.forEach((unit, index) => offsets.set(unit.id, scaleVector(backVector, index)));
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
    file: [],
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
  const spacing = HEX_CENTER_STEP * FORMATION_LINE_SPACING_HEXES;
  return scaleVector(right, formationLateralSlot(unit) * spacing);
}

function formationLateralSlot(unit: Unit): number {
  if (unit.role === "leader") {
    return 0;
  }
  if (unit.role === "deputy_leader") {
    return 1;
  }
  if (unit.element === "tat_1") {
    return -Math.max(1, (unit.elementPosition ?? 2) - 1);
  }
  if (unit.element === "tat_2") {
    return Math.max(2, unit.elementPosition ?? 2);
  }
  return -1;
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
  const center = mapPointToHex(unit.position);
  return coordsWithinRadius(center, radius + 1)
    .filter((coord) => inBounds(world.map, coord))
    .filter((coord) => {
      const point = axialToMapPoint(coord);
      return mapDistanceInHexes(unit.position, point) <= radius && isDirectionVisibleFromPoint(unit.lookDirection, unit.position, point);
    });
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

function nearestWoundedFriendly(world: WorldState, from: HexCoord): Unit | undefined {
  return world.units
    .filter((unit) => unit.side === "friendly" && isUnitInjured(unit))
    .sort((a, b) => hexDistance(a.coord, from) - hexDistance(b.coord, from))[0];
}

function casualtyForEvacuation(
  world: WorldState,
  from: HexCoord,
  requestedUnitId?: string,
): Unit | undefined {
  const wounded = world.units.filter((unit) => unit.side === "friendly" && isUnitInjured(unit));
  const activeCasualty =
    world.casualtyEvacuation?.phase !== "completed" && world.casualtyEvacuation?.casualtyUnitId
      ? world.unitsById[world.casualtyEvacuation.casualtyUnitId]
      : undefined;
  if (activeCasualty && isUnitInjured(activeCasualty)) {
    return activeCasualty;
  }

  const primaryCasualty = wounded.find((unit) => unit.status.includes("primary_casualty"));
  if (primaryCasualty) {
    return primaryCasualty;
  }

  const requestedCasualty = requestedUnitId ? world.unitsById[requestedUnitId] : undefined;
  if (requestedCasualty && requestedCasualty.side === "friendly" && isUnitInjured(requestedCasualty)) {
    return requestedCasualty;
  }

  return wounded
    .sort((a, b) => hexDistance(a.coord, from) - hexDistance(b.coord, from))[0] ?? nearestWoundedFriendly(world, from);
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids.filter(Boolean)));
}

function casualtyHelpers(world: WorldState, casualty: Unit, leaderId: string): Unit[] {
  const candidates = world.units
    .filter((unit) => unit.side === "friendly" && unit.id !== casualty.id && !isUnitInjured(unit))
    .sort((a, b) => casualtyCarrierSortScore(a, casualty, leaderId) - casualtyCarrierSortScore(b, casualty, leaderId));
  return candidates.slice(0, 2);
}

function casualtyCarrierSortScore(unit: Unit, casualty: Unit, leaderId?: string): number {
  const commandPenalty = unit.role === "leader" || unit.role === "deputy_leader" ? 1000 : 0;
  const issuerPenalty = leaderId && unit.id === leaderId ? 100 : 0;
  return commandPenalty + issuerPenalty + hexDistance(unit.coord, casualty.coord) + formationReceiverRank(unit) * 0.01;
}

function casualtyHelperAssignments(world: WorldState, casualty: Unit, helpers: Unit[]): Array<{ unit: Unit; target: HexCoord; targetPoint: MapPoint }> {
  const reserved = new Set(world.units.filter((unit) => unit.id !== casualty.id && !helpers.some((helper) => helper.id === unit.id)).map((unit) => hexKey(unit.coord)));
  return helpers.map((helper) => {
    const target = nearestAvailableCoordAround(world, casualty.coord, helper.coord, reserved, 1, new Set([hexKey(casualty.coord)]));
    reserved.add(hexKey(target));
    return { unit: helper, target, targetPoint: axialToMapPoint(target) };
  });
}

function helperEscortTargets(world: WorldState, collectionPoint: HexCoord, helpers: Unit[], casualtyTarget: HexCoord): Map<string, HexCoord> {
  const reserved = new Set([hexKey(casualtyTarget)]);
  const targets = new Map<string, HexCoord>();
  for (const helper of helpers) {
    const target = nearestAvailableCoordAround(world, collectionPoint, helper.coord, reserved, 1, new Set([hexKey(casualtyTarget)]));
    reserved.add(hexKey(target));
    targets.set(helper.id, target);
  }
  return targets;
}

function updateCasualtyTeamState(world: WorldState, patch: Partial<CasualtyTeamState> = {}): void {
  const evacuation = world.casualtyEvacuation;
  if (!evacuation || evacuation.phase === "completed" || !evacuation.casualtyUnitId) {
    world.casualtyTeam = undefined;
    return;
  }

  const casualty = maybeMutableUnit(world, evacuation.casualtyUnitId);
  if (!casualty) {
    world.casualtyTeam = undefined;
    return;
  }

  const carrierUnitIds = uniqueIds(patch.carrierUnitIds ?? evacuation.carrierUnitIds ?? evacuation.helperUnitIds)
    .filter((unitId) => Boolean(world.unitsById[unitId] && !isUnitInjured(world.unitsById[unitId])));
  if (carrierUnitIds.length < 2) {
    world.casualtyTeam = {
      casualtyUnitId: casualty.id,
      carrierUnitIds,
      assignedElement: casualty.element,
      mode: patch.mode ?? casualtyTeamModeForWorld(world),
      teamIntent: "blocked",
      carrierSlots: {},
      carrierSlotPoints: {},
      casualtySlot: clone(casualty.coord),
      casualtySlotPoint: clone(casualty.position),
      waitReason: "carrier_missing",
      updatedAt: world.time,
    };
    return;
  }

  const carriers = carrierUnitIds.map((unitId) => world.unitsById[unitId]).filter((unit): unit is Unit => Boolean(unit));
  const mode = patch.mode ?? casualtyTeamModeForWorld(world);
  const carrierSlots = patch.carrierSlots ?? Object.fromEntries(carriers.map((carrier) => [carrier.id, clone(carrier.coord)]));
  const carrierSlotPoints = patch.carrierSlotPoints ?? Object.fromEntries(carriers.map((carrier) => [carrier.id, clone(carrier.position)]));
  const casualtySlot = patch.casualtySlot ?? draggedCasualtyFollowCoord(world, casualty, carriers) ?? casualty.coord;
  const casualtySlotPoint = patch.casualtySlotPoint ?? draggedCasualtyFollowPoint(casualtySlot, carriers);
  const carrierElements = new Set(carriers.map((carrier) => carrier.element).filter(Boolean));
  const sharedCarrierElement = carrierElements.size === 1 ? carriers[0].element : undefined;
  const assignedElement =
    patch.assignedElement ??
    tacticalTeamElement(sharedCarrierElement) ??
    tacticalTeamElement(casualty.element) ??
    sharedCarrierElement;
  const derivedIntent = casualtyTeamIntentForWorld(world, carrierUnitIds);
  const teamIntent = patch.teamIntent ?? derivedIntent.teamIntent;
  const waitReason =
    patch.waitReason ??
    derivedIntent.waitReason ??
    casualtyTeamBoundWaitReason(world, assignedElement, teamIntent);

  world.casualtyTeam = {
    casualtyUnitId: casualty.id,
    carrierUnitIds,
    assignedElement,
    mode,
    teamIntent,
    teamTarget: patch.teamTarget ?? casualtySlot,
    teamTargetPoint: patch.teamTargetPoint ?? casualtySlotPoint,
    carrierSlots,
    carrierSlotPoints,
    casualtySlot,
    casualtySlotPoint,
    waitReason,
    updatedAt: world.time,
  };
}

function derivedCasualtyTeamState(world: WorldState): CasualtyTeamState | undefined {
  const evacuation = world.casualtyEvacuation;
  if (!evacuation || evacuation.phase === "completed" || !evacuation.casualtyUnitId) {
    return undefined;
  }
  const casualty = world.unitsById[evacuation.casualtyUnitId];
  if (!casualty) {
    return undefined;
  }
  const carrierUnitIds = uniqueIds(evacuation.carrierUnitIds ?? evacuation.helperUnitIds)
    .filter((unitId) => Boolean(world.unitsById[unitId] && !isUnitInjured(world.unitsById[unitId])));
  const carriers = carrierUnitIds.map((unitId) => world.unitsById[unitId]).filter((unit): unit is Unit => Boolean(unit));
  const mode = casualtyTeamModeForWorld(world);
  const intent = casualtyTeamIntentForWorld(world, carrierUnitIds);
  const casualtySlot = carriers.length >= 2
    ? draggedCasualtyFollowCoord(world, casualty, carriers) ?? casualty.coord
    : casualty.coord;
  const casualtySlotPoint = carriers.length >= 2 ? draggedCasualtyFollowPoint(casualtySlot, carriers) : casualty.position;
  return {
    casualtyUnitId: casualty.id,
    carrierUnitIds,
    assignedElement: casualty.element,
    mode,
    teamIntent: carrierUnitIds.length >= 2 ? intent.teamIntent : "blocked",
    teamTarget: casualtySlot,
    teamTargetPoint: casualtySlotPoint,
    carrierSlots: Object.fromEntries(carriers.map((carrier) => [carrier.id, clone(carrier.coord)])),
    carrierSlotPoints: Object.fromEntries(carriers.map((carrier) => [carrier.id, clone(carrier.position)])),
    casualtySlot,
    casualtySlotPoint,
    waitReason: carrierUnitIds.length >= 2 ? intent.waitReason : "carrier_missing",
    updatedAt: world.time,
  };
}

function casualtyTeamModeForWorld(world: WorldState): CasualtyTeamMode {
  const maneuver = world.activeManeuver;
  if (maneuver && maneuver.phase !== "completed") {
    const maneuverMode = casualtyTeamModeForManeuver(maneuver.type);
    if (maneuverMode) return maneuverMode;
  }
  return "handoff";
}

function casualtyTeamModeForManeuver(type: TacticalManeuverType): CasualtyTeamMode | undefined {
  if (type === "alternating_forward") {
    return "advancing_with_group";
  }
  if (type === "alternating_retreat" || type === "zipper_retreat") {
    return "retreating_with_group";
  }
  if (type === "casualty_recovery") {
    return "handoff";
  }
  return undefined;
}

function tacticalTeamElement(element: GroupElement | undefined): GroupElement | undefined {
  return element === "tat_1" || element === "tat_2" ? element : undefined;
}

function casualtyTeamBoundWaitReason(
  world: WorldState,
  assignedElement: GroupElement | undefined,
  teamIntent: CasualtyTeamIntent,
): CasualtyTeamWaitReason | undefined {
  const maneuver = world.activeManeuver;
  if (
    teamIntent !== "holding" ||
    !maneuver ||
    (maneuver.type !== "alternating_forward" && maneuver.type !== "alternating_retreat") ||
    maneuver.phase === "completed"
  ) {
    return undefined;
  }
  const teamElement = tacticalTeamElement(assignedElement);
  if (!teamElement) {
    return undefined;
  }
  return alternatingBoundElement(maneuver.boundIndex ?? 0) === teamElement ? undefined : "covering_bound";
}

function casualtyTeamIntentForWorld(
  world: WorldState,
  carrierUnitIds: string[],
): { teamIntent: CasualtyTeamIntent; waitReason?: CasualtyTeamWaitReason } {
  const maneuver = world.activeManeuver;
  if (maneuver && maneuver.phase !== "completed") {
    if (carrierUnitIds.some((unitId) => maneuver.movingUnitIds.includes(unitId))) {
      return { teamIntent: "moving" };
    }
    if (carrierUnitIds.some((unitId) => maneuver.coveringUnitIds.includes(unitId))) {
      return { teamIntent: "holding", waitReason: "covering_bound" };
    }
  }
  if (carrierUnitIds.some((unitId) => world.unitsById[unitId]?.intent.type === "moving")) {
    return { teamIntent: "moving" };
  }
  return { teamIntent: "holding" };
}

function syncCasualtyTeamCarriedUnit(world: WorldState): void {
  const team = world.casualtyTeam;
  if (!team) return;
  const casualty = maybeMutableUnit(world, team.casualtyUnitId);
  const carriers = team.carrierUnitIds
    .map((unitId) => world.unitsById[unitId])
    .filter((unit): unit is Unit => Boolean(unit && !isUnitInjured(unit)));
  if (!casualty || carriers.length < 2) return;
  const casualtySlot = draggedCasualtyFollowCoord(world, casualty, carriers, team.teamTarget);
  if (!casualtySlot) return;
  const casualtySlotPoint = draggedCasualtyFollowPoint(casualtySlot, carriers);
  world.casualtyTeam = {
    ...team,
    carrierSlots: Object.fromEntries(carriers.map((carrier) => [carrier.id, clone(carrier.coord)])),
    carrierSlotPoints: Object.fromEntries(carriers.map((carrier) => [carrier.id, clone(carrier.position)])),
    casualtySlot,
    casualtySlotPoint,
    updatedAt: world.time,
  };
  casualty.coord = clone(casualtySlot);
  casualty.position = clone(casualtySlotPoint);
  casualty.facing = carriers[0]?.facing ?? casualty.facing;
  casualty.lookDirection = casualty.facing;
  casualty.intent = { type: "idle" };
  casualty.status = Array.from(new Set([...casualty.status.filter((status) => status !== "evac_pending"), "being_dragged"]));
}

function nearestAvailableCoordAround(
  world: WorldState,
  center: HexCoord,
  from: HexCoord,
  reserved: Set<string>,
  radius: number,
  excluded: Set<string> = new Set(),
): HexCoord {
  return coordsWithinRadius(center, radius)
    .filter((coord) => inBounds(world.map, coord))
    .filter((coord) => !reserved.has(hexKey(coord)) && !excluded.has(hexKey(coord)))
    .filter((coord) => {
      const tile = world.map.tilesByKey[hexKey(coord)];
      return tile && !isImpassable(tile);
    })
    .sort((a, b) => hexDistance(a, from) - hexDistance(b, from) || hexDistance(a, center) - hexDistance(b, center))[0] ?? center;
}

function movementRate(unit: Unit): number {
  if (unit.status.includes("being_dragged")) {
    return 0.35;
  }
  if (unit.status.includes("evac_helper")) {
    return 0.45;
  }
  if (unit.status.includes("reinforcement")) {
    return 0.8;
  }
  if (isUnitInjured(unit)) {
    return 0;
  }
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

function leftPerpendicular(vector: MapVector): MapVector {
  const normalized = normalizeVector(vector);
  return { x: normalized.y, y: -normalized.x };
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

function mutableWorldForEvent(world: WorldState): WorldState {
  const units = world.units.map((unit) => ({
    ...clone(unit),
    position: clone(unit.position ?? axialToMapPoint(unit.coord)),
  }));
  return {
    ...world,
    map: world.map.tilesByKey ? world.map : indexMap(world.map),
    activeFormation: world.activeFormation ? clone(world.activeFormation) : undefined,
    activeManeuver: world.activeManeuver ? clone(world.activeManeuver) : undefined,
    casualtyEvacuation: world.casualtyEvacuation ? clone(world.casualtyEvacuation) : undefined,
    casualtyTeam: world.casualtyTeam ? clone(world.casualtyTeam) : undefined,
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
  return tile.terrain === "water" || (tile.terrain === "wall" && tile.moveCost >= 3);
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
