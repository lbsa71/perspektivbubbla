type Direction = "N" | "NE" | "SE" | "S" | "SW" | "NW";
type Formation = "column" | "line" | "file" | "wedge" | "dispersed" | "regroup";
type CommunicationMethod = "voice" | "gesture" | "radio";
type DifficultyLevel = "training" | "normal" | "realistic";
type ScenarioId =
  | "cover_to_cover"
  | "cover_to_cover_hasty"
  | "cover_to_cover_observed"
  | "risk_zone_blocking"
  | "leader_lost_picture"
  | "casualty_retreat"
  | "river_bridge_crossing"
  | "ditch_line_contact";

const FIRE_BURST_VISIBLE_SECONDS = 1.8;

type HexCoord = {
  q: number;
  r: number;
};

type MapPoint = {
  x: number;
  y: number;
};

type HexTileProjection = {
  coord: HexCoord;
  terrain: string;
  visibility?: "visible" | "memory" | "unknown";
  lastSeenAt?: number;
  memoryAge?: number;
  memoryOpacity?: number;
  moveCost?: number;
  cover?: number;
  concealment?: number;
  blocksSight?: boolean;
  exposure?: number;
};

type UnitActivityProjection = {
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

type CasualtyCollectionPointId = "asa1" | "asa2";

type CasualtyCollectionPointProjection = {
  id?: CasualtyCollectionPointId;
  label?: string;
  coord: HexCoord;
  point?: MapPoint;
  setAt?: number;
};

type CasualtyEvacuationProjection = {
  collectionPointId?: CasualtyCollectionPointId;
  activeCollectionPointId?: CasualtyCollectionPointId;
  collectionPoints?: Partial<Record<CasualtyCollectionPointId, CasualtyCollectionPointProjection>>;
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

type CasualtyTeamProjection = {
  casualtyUnitId: string;
  carrierUnitIds: string[];
  assignedElement?: "command" | "tat_1" | "tat_2";
  mode: "advancing_with_group" | "retreating_with_group" | "handoff";
  teamIntent: "holding" | "moving" | "handoff" | "blocked";
  teamTarget?: HexCoord;
  teamTargetPoint?: MapPoint;
  carrierSlots: Record<string, HexCoord>;
  carrierSlotPoints: Record<string, MapPoint>;
  casualtySlot?: HexCoord;
  casualtySlotPoint?: MapPoint;
  waitReason?: "covering_bound" | "casualty_team_blocked" | "carrier_missing" | "handoff_pending" | "spacing_blocked";
  updatedAt?: number;
};

type TacticalManeuverProjection = {
  orderId: string;
  type: "alternating_forward" | "alternating_retreat" | "zipper_retreat" | "casualty_recovery";
  phase: "covering" | "moving" | "handoff" | "completed";
  direction: Direction;
  directionVector?: MapPoint;
  communication: CommunicationMethod;
  coveringUnitIds: string[];
  movingUnitIds: string[];
  casualtyUnitId?: string;
  carrierUnitIds?: string[];
  requestedReinforcement?: { unitId?: string; forUnitId: string; requestedAt: number };
  zipperSide?: "left" | "right";
  stepIndex?: number;
  boundIndex?: number;
  boundStartedUnitIds?: string[];
  issuedAt: number;
};

type UnitProjection = {
  id: string;
  name: string;
  side: "friendly" | "opposing";
  role: "leader" | "deputy_leader" | "soldier" | "observer";
  element?: "command" | "tat_1" | "tat_2";
  elementPosition?: number;
  position?: MapPoint;
  coord: HexCoord;
  facing: Direction;
  lookDirection: Direction;
  posture: string;
  health: number;
  stamina: number;
  suppression?: number;
  fireCooldown?: number;
  lastFiredAt?: number;
  intent: { type: string; target?: HexCoord; targetPoint?: MapPoint };
  status: string[];
  currentOrderId?: string;
  activity?: UnitActivityProjection;
};

type EventProjection = {
  id?: string;
  sequence?: number;
  time: number;
  type: string;
  payload?: {
    orderId?: string;
    unitId?: string;
    issuerId?: string;
    formation?: Formation;
    target?: HexCoord;
    collectionPoint?: HexCoord;
    collectionPointId?: CasualtyCollectionPointId;
    casualtyUnitId?: string;
    helperUnitIds?: string[];
    targetPoint?: MapPoint;
    direction?: Direction;
    communication?: CommunicationMethod;
    status?: string;
    reason?: string;
    type?: string;
    side?: "left" | "right";
    zipperSide?: "left" | "right";
    targetId?: string;
    byUnitId?: string;
    amount?: number;
    oldCarrierId?: string;
    newCarrierId?: string;
    forUnitId?: string;
    requestedAt?: number;
    probability?: number;
    roll?: number;
    suppression?: number;
    severity?: "low" | "medium" | "high";
    message?: string;
    neighbourId?: string;
    blockingUnitId?: string;
    sourceUnitId?: string;
    element?: "command" | "tat_1" | "tat_2";
    leadHexes?: number;
    relayedBy?: string;
    hops?: number;
    phase?: "forming" | "advancing" | "covering" | "moving" | "handoff" | "completed";
    coveringUnitIds?: string[];
    movingUnitIds?: string[];
    carrierUnitIds?: string[];
    carrierSlots?: Record<string, HexCoord>;
    carrierSlotPoints?: Record<string, MapPoint>;
    casualtySlot?: HexCoord;
    casualtySlotPoint?: MapPoint;
    teamTarget?: HexCoord;
    teamTargetPoint?: MapPoint;
    teamIntent?: string;
    waitReason?: string;
    movingUnits?: string[];
    waits?: Array<Record<string, unknown>>;
    units?: Array<Record<string, unknown>>;
    command?: {
      type?: string;
      target?: HexCoord;
      direction?: string;
      directionTarget?: HexCoord;
      directionTargetPoint?: MapPoint;
      posture?: string;
      formation?: Formation;
      communication?: CommunicationMethod;
      side?: "left" | "right";
      collectionPointId?: CasualtyCollectionPointId;
      casualtyUnitId?: string;
    };
  };
};

type EffectZoneProjection = {
  unitId: string;
  facing: Direction;
  lookDirection: Direction;
  hexes: HexCoord[];
  blockedByUnitId?: string;
  blockedAt?: HexCoord;
  severity?: "low" | "medium" | "high";
};

type FriendlyBlockingProjection = {
  unitId: string;
  blockingUnitId: string;
  coord: HexCoord;
  distanceHexes: number;
  severity: "low" | "medium" | "high";
  reason: "friendly_in_effect_zone";
};

type CoverageCheckProjection = {
  element: "command" | "tat_1" | "tat_2";
  covered: boolean;
  coveringUnitIds: string[];
  expectedDirection: Direction;
  reason?: "no_members" | "poor_orientation" | "blocked_effect_zone";
};

type PerceivedUnitProjection = {
  unitId: string;
  name: string;
  side: "friendly" | "opposing";
  role: "leader" | "deputy_leader" | "soldier" | "observer";
  element?: "command" | "tat_1" | "tat_2";
  elementPosition?: number;
  perceivedCoord?: HexCoord;
  visible: boolean;
  lastSeenAt?: number;
  age?: number;
  confidence: "high" | "medium" | "low" | "unknown";
  perceivedStatus: "ok" | "possibly_injured" | "injured" | "unknown";
  source: "visual" | "memory" | "report" | "roster";
};

type HeardEventProjection = {
  id: string;
  time: number;
  kind: "order" | "movement" | "contact" | "report";
  sourceUnitId?: string;
  approximateDirection: Direction;
  clarity: "clear" | "partial" | "muffled";
  text: string;
};

type ReportProjection = {
  id: string;
  time: number;
  sourceUnitId: string;
  kind: "status" | "movement_wait" | "blocking";
  message: string;
  coord: HexCoord;
  confidence: "high" | "medium" | "low";
};

type ScenarioTroopPreview = {
  id: string;
  name: string;
  role: "leader" | "deputy_leader" | "soldier" | "observer";
  element?: "command" | "tat_1" | "tat_2";
  elementPosition?: number;
};

type U3TAxis = "uppgiften" | "tiden" | "truppen" | "terrangen";

type U3TBrief = Record<U3TAxis, string>;

type TrainingConstraints = {
  timeLimitSeconds?: number;
  maxExposureSamples?: { exposureAtLeast: 1 | 2 | 3; samples: number; hard?: boolean };
  maxCumulativeExposure?: { exposure: number; hard?: boolean };
  maxContactEvents?: number;
  maxDetectionEvents?: number;
  maxWounded?: number;
};

type ScenarioTraining = {
  u3t: U3TBrief;
  constraints?: TrainingConstraints;
  aarFocus?: string[];
};

type TrainingMetric = {
  id: string;
  label: string;
  value: string;
  state: "good" | "warn" | "bad";
  detail?: string;
};

type TrainingMetrics = {
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

type U3TObservation = {
  axis: U3TAxis;
  label: string;
  state: "good" | "warn" | "bad";
  text: string;
};

type TrainingAssessment = {
  brief: U3TBrief;
  constraints?: TrainingConstraints;
  aarFocus: string[];
  metrics: TrainingMetrics;
  observations: U3TObservation[];
};

type ScenarioOption = {
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

type DifficultyOption = {
  id: DifficultyLevel;
  label: string;
  description: string;
};

type Projection = {
  sessionId: string;
  scenario: {
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
  time: number;
  activeFormation?: {
    orderId: string;
    orderKind: "formation" | "forward";
    phase?: "forming" | "advancing";
    formation: Formation;
    target: HexCoord;
    targetPoint?: MapPoint;
    advanceTarget?: HexCoord;
    advanceTargetPoint?: MapPoint;
    direction: Direction;
    communication: CommunicationMethod;
  };
  activeManeuver?: TacticalManeuverProjection;
  objective: {
    title: string;
    description: string;
    target: HexCoord;
    status: string;
    constraints?: TrainingConstraints;
  };
  casualtyEvacuation?: CasualtyEvacuationProjection;
  casualtyTeam?: CasualtyTeamProjection;
  map: {
    tiles: HexTileProjection[];
  };
  player: UnitProjection;
  units: UnitProjection[];
  events: EventProjection[];
  risk: {
    effectZones: EffectZoneProjection[];
    blocking: FriendlyBlockingProjection[];
    coverage: CoverageCheckProjection[];
  };
  perception: {
    informationMode: "training" | "normal" | "realistic";
    lastKnownUnits: PerceivedUnitProjection[];
    heardEvents: HeardEventProjection[];
    reports: ReportProjection[];
  };
  aar?: {
    orderEvents?: EventProjection[];
    u3t?: TrainingAssessment;
  };
};

type ClientState = {
  projection?: Projection;
  gameId: string;
  scenarios: ScenarioOption[];
  difficulties: DifficultyOption[];
  selectedScenarioId?: ScenarioId;
  selectedDifficulty: DifficultyLevel;
  showScenarioChooser: boolean;
  showIntro: boolean;
  showHelp: boolean;
  orientationMode: boolean;
  startingScenario: boolean;
  socket?: WebSocket;
  zoom: number;
  pan: { x: number; y: number };
  hasCentered: boolean;
  selectedFormation: Formation;
  selectedCommunication: CommunicationMethod;
  selectedDirection?: Direction;
  directionCue?: HexCoord;
  directionCuePoint?: MapPoint;
  casualtyPlacementMode?: CasualtyCollectionPointId;
  showAarFeed: boolean;
  loggedDiagnostics: Set<string>;
  eventHistory: EventProjection[];
};

type CoachStep = {
  step: string;
  title: string;
  body: string;
  action: string;
  tone: "ready" | "wait" | "warning";
};

type DebriefSummary = {
  score: number;
  grade: string;
  metrics: Array<{ label: string; value: string; state: "good" | "warn" | "bad" }>;
  lessons: string[];
};

type PanDragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPan: { x: number; y: number };
};

type DirectScenarioRequest = {
  scenarioId: ScenarioId;
  difficulty?: DifficultyLevel;
  autoStart: boolean;
};

const directions: Direction[] = ["N", "NE", "SE", "S", "SW", "NW"];
const formations: Formation[] = ["line", "file", "column", "wedge", "dispersed", "regroup"];
const communications: CommunicationMethod[] = ["voice", "gesture", "radio"];
const formationLabels: Record<Formation, string> = {
  line: "Skyttelinje",
  file: "Skytteled",
  column: "Skyttekolonn",
  wedge: "Skytteplog",
  dispersed: "Skyttevarn",
  regroup: "Samling",
};
const communicationLabels: Record<CommunicationMethod, string> = {
  voice: "Röst",
  gesture: "Tecken",
  radio: "Radio",
};
const baseHexSize = 8;
const minZoom = 0.35;
const maxZoom = 2.5;
const directionVectors: Record<Direction, HexCoord> = {
  N: { q: 0, r: -1 },
  NE: { q: 1, r: -1 },
  SE: { q: 1, r: 0 },
  S: { q: 0, r: 1 },
  SW: { q: -1, r: 1 },
  NW: { q: -1, r: 0 },
};

const directScenarioRequest = readDirectScenarioRequest();
const initialIntroVisible = shouldShowIntro();
const gameId = readGameId();

const state: ClientState = {
  projection: undefined,
  gameId,
  scenarios: [],
  difficulties: [],
  selectedScenarioId: directScenarioRequest?.scenarioId,
  selectedDifficulty: directScenarioRequest?.difficulty ?? "training",
  showScenarioChooser: directScenarioRequest ? !directScenarioRequest.autoStart : !initialIntroVisible,
  showIntro: directScenarioRequest ? false : initialIntroVisible,
  showHelp: false,
  orientationMode: true,
  startingScenario: false,
  socket: undefined,
  zoom: 1,
  pan: { x: 0, y: 0 },
  hasCentered: false,
  selectedFormation: "line",
  selectedCommunication: "voice",
  selectedDirection: undefined,
  directionCue: undefined,
  directionCuePoint: undefined,
  casualtyPlacementMode: undefined,
  showAarFeed: false,
  loggedDiagnostics: new Set(),
  eventHistory: [],
};
let panDrag: PanDragState | undefined;
let mapRenderFrame: number | undefined;
let directScenarioStartAttempted = false;

void loadScenarios();
connect();
bindControls();
renderAarFeedVisibility();
renderProductModals();
renderScenarioChooser();
renderGameLink();

function shouldShowIntro(): boolean {
  const introParam = new URLSearchParams(location.search).get("intro");
  if (introParam === "1") return true;
  if (introParam === "0") return false;
  try {
    return localStorage.getItem("perspektivbubbla:intro-seen") !== "true";
  } catch {
    return true;
  }
}

function readGameId(): string {
  const params = new URLSearchParams(location.search);
  const explicitGameId = cleanGameId(params.get("game") ?? params.get("gameId") ?? params.get("g"));
  return explicitGameId ?? "main";
}

function cleanGameId(value: string | null | undefined): string | undefined {
  const cleaned = (value ?? "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 64);
  return cleaned || undefined;
}

function readDirectScenarioRequest(): DirectScenarioRequest | undefined {
  const params = new URLSearchParams(location.search);
  const pathParts = location.pathname.split("/").filter(Boolean).map((part) => decodeURIComponent(part));
  const isScenarioPath = normalizeUrlToken(pathParts[0]) === "scenario";
  const scenarioValue = params.get("scenario") ?? params.get("s") ?? (isScenarioPath ? pathParts[1] : undefined);
  const scenarioId = scenarioIdFromUrlToken(scenarioValue);
  if (!scenarioId) return undefined;

  const difficultyValue = params.get("difficulty") ?? params.get("d") ?? (isScenarioPath ? pathParts[2] : undefined);
  const difficulty = difficultyFromUrlToken(difficultyValue);
  const autoStartValue = params.get("autostart") ?? params.get("start");

  return {
    scenarioId,
    difficulty,
    autoStart: !isFalseUrlToken(autoStartValue),
  };
}

function scenarioIdFromUrlToken(value: string | null | undefined): ScenarioId | undefined {
  if (isScenarioId(value ?? undefined)) return value as ScenarioId;
  const aliases: Record<string, ScenarioId> = {
    cover: "cover_to_cover",
    cover_to_cover: "cover_to_cover",
    en_soldat: "cover_to_cover",
    fran_skydd_till_skydd: "cover_to_cover",
    skydd_till_skydd: "cover_to_cover",
    cover_hasty: "cover_to_cover_hasty",
    cover_to_cover_hasty: "cover_to_cover_hasty",
    hasty: "cover_to_cover_hasty",
    tidspress: "cover_to_cover_hasty",
    snabb: "cover_to_cover_hasty",
    skydd_till_skydd_tidspress: "cover_to_cover_hasty",
    fran_skydd_till_skydd_tidspress: "cover_to_cover_hasty",
    cover_observed: "cover_to_cover_observed",
    cover_to_cover_observed: "cover_to_cover_observed",
    observed: "cover_to_cover_observed",
    observerad: "cover_to_cover_observed",
    smyg: "cover_to_cover_observed",
    skydd_till_skydd_observerad: "cover_to_cover_observed",
    fran_skydd_till_skydd_observerad: "cover_to_cover_observed",
    risk: "risk_zone_blocking",
    risk_zone: "risk_zone_blocking",
    risk_zone_blocking: "risk_zone_blocking",
    riskzon: "risk_zone_blocking",
    riskzon_blockering: "risk_zone_blocking",
    skadad: "leader_lost_picture",
    skadad_soldat: "leader_lost_picture",
    injured: "leader_lost_picture",
    injured_soldier: "leader_lost_picture",
    group: "leader_lost_picture",
    group_commander: "leader_lost_picture",
    gruppchef: "leader_lost_picture",
    leader_lost_picture: "leader_lost_picture",
    skadad_retratt: "casualty_retreat",
    skadad_under_retratt: "casualty_retreat",
    casualty_retreat: "casualty_retreat",
    injured_retreat: "casualty_retreat",
    vaxelvis_bakat: "casualty_retreat",
    blixtlas: "casualty_retreat",
    bro: "river_bridge_crossing",
    broovergang: "river_bridge_crossing",
    broövergång: "river_bridge_crossing",
    river: "river_bridge_crossing",
    river_bridge: "river_bridge_crossing",
    river_bridge_crossing: "river_bridge_crossing",
    dike: "ditch_line_contact",
    dikeslinjen: "ditch_line_contact",
    ditch_line: "ditch_line_contact",
    ditch_line_contact: "ditch_line_contact",
  };
  return aliases[normalizeUrlToken(value)];
}

function difficultyFromUrlToken(value: string | null | undefined): DifficultyLevel | undefined {
  if (isDifficulty(value ?? undefined)) return value as DifficultyLevel;
  const aliases: Record<string, DifficultyLevel> = {
    easy: "training",
    e: "training",
    training: "training",
    traning: "training",
    latt: "training",
    normal: "normal",
    medium: "normal",
    n: "normal",
    hard: "realistic",
    h: "realistic",
    realistic: "realistic",
    realistisk: "realistic",
    svar: "realistic",
  };
  return aliases[normalizeUrlToken(value)];
}

function normalizeUrlToken(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isFalseUrlToken(value: string | null | undefined): boolean {
  const token = normalizeUrlToken(value);
  return token === "0" || token === "false" || token === "no" || token === "nej" || token === "off";
}

function hasPendingDirectScenarioStart(): boolean {
  return Boolean(directScenarioRequest?.autoStart && !directScenarioStartAttempted);
}

function rememberIntroSeen(): void {
  try {
    localStorage.setItem("perspektivbubbla:intro-seen", "true");
  } catch {
    // localStorage can be unavailable in hardened browser contexts.
  }
}

function connect() {
  const socket = new WebSocket(websocketUrl());
  state.socket = socket;
  setConnection("ANSLUTER");

  socket.addEventListener("open", () => setConnection("ANSLUTEN"));
  socket.addEventListener("close", () => {
    setConnection("FRÅNKOPPLAD");
    setTimeout(connect, 1000);
  });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "projection") {
      state.projection = message.projection;
      mergeEventHistory(message.projection.events);
      if (!state.showScenarioChooser && !state.startingScenario && !hasPendingDirectScenarioStart()) {
        state.selectedScenarioId = message.projection.scenario?.id ?? state.selectedScenarioId;
        state.selectedDifficulty = message.projection.scenario?.difficulty ?? state.selectedDifficulty;
      } else {
        state.selectedScenarioId = state.selectedScenarioId ?? message.projection.scenario?.id;
        state.selectedDifficulty = state.selectedDifficulty ?? message.projection.scenario?.difficulty ?? "training";
      }
      logFormationDiagnostics(message.projection);
      centerOnPlayerOnce();
      render();
    }
  });
}

function websocketUrl(): string {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const host = location.port === "5173" ? devBackendHost() : location.host;
  return `${protocol}//${host}/ws?game=${encodeURIComponent(state.gameId)}`;
}

function devBackendHost(): string {
  const hostname = location.hostname === "localhost" || location.hostname === "::1" ? "127.0.0.1" : location.hostname;
  return `${hostname}:5174`;
}

function mergeEventHistory(events: EventProjection[]): void {
  const byKey = new Map(state.eventHistory.map((event) => [eventHistoryKey(event), event]));
  for (const event of events) {
    byKey.set(eventHistoryKey(event), event);
  }
  state.eventHistory = [...byKey.values()]
    .sort((a, b) => (a.sequence ?? a.time) - (b.sequence ?? b.time) || a.time - b.time)
    .slice(-500);
}

function eventHistoryKey(event: EventProjection): string {
  return event.id ?? `${event.sequence ?? "?"}:${event.time}:${event.type}:${JSON.stringify(event.payload ?? {})}`;
}

async function loadScenarios(): Promise<void> {
  try {
    const response = await fetch("/api/scenarios");
    const payload = (await response.json()) as { scenarios: ScenarioOption[]; difficulties: DifficultyOption[] };
    state.scenarios = payload.scenarios;
    state.difficulties = payload.difficulties;
    const currentScenarioId = state.projection?.scenario.id;
    const directScenario = directScenarioRequest
      ? state.scenarios.find((scenario) => scenario.id === directScenarioRequest.scenarioId)
      : undefined;
    const selected = directScenario ?? state.scenarios.find((scenario) => scenario.id === currentScenarioId) ?? state.scenarios[0];
    state.selectedScenarioId = selected?.id;
    state.selectedDifficulty =
      directScenarioRequest?.difficulty ?? state.projection?.scenario.difficulty ?? selected?.defaultDifficulty ?? "training";
    renderScenarioChooser();
    if (directScenarioRequest?.autoStart && !directScenarioStartAttempted && directScenario) {
      directScenarioStartAttempted = true;
      state.showIntro = false;
      state.showScenarioChooser = false;
      await startSelectedScenario("direct-link");
    }
  } catch (error) {
    console.warn("[scenario] failed to load scenario list", error);
  }
}

function logFormationDiagnostics(projection: Projection): void {
  const recentEvents = projection.events.filter((event) => projection.time - event.time <= 1.2);
  for (const event of recentEvents) {
    if (
      event.type !== "formation_movement_diagnostic" &&
      event.type !== "movement_blocked" &&
      event.type !== "movement_waiting"
    ) {
      continue;
    }
    const key = [
      event.type,
      event.time.toFixed(1),
      event.payload?.unitId ?? event.payload?.orderId ?? "group",
      event.payload?.reason ?? "unknown",
      event.payload?.neighbourId ?? "",
    ].join(":");
    if (state.loggedDiagnostics.has(key)) {
      continue;
    }
    state.loggedDiagnostics.add(key);
    console.warn("[formation diagnostic]", {
      time: event.time,
      type: event.type,
      phase: projection.activeFormation?.phase,
      formation: projection.activeFormation?.formation,
      direction: projection.activeFormation?.direction,
      target: projection.activeFormation?.target,
      moving: projection.units.filter((unit) => unit.side === "friendly" && unit.intent.type === "moving").length,
      payload: event.payload,
    });
  }

  const friendlies = projection.units.filter((unit) => unit.side === "friendly");
  const moving = friendlies.filter((unit) => unit.intent.type === "moving");
  if (projection.activeFormation?.orderKind === "forward" && projection.activeFormation.phase === "advancing" && moving.length === 0) {
    const key = `advancing-no-moving:${projection.activeFormation.orderId}:${projection.time.toFixed(1)}`;
    if (!state.loggedDiagnostics.has(key)) {
      state.loggedDiagnostics.add(key);
      console.warn("[formation diagnostic]", {
        time: projection.time,
        type: "advancing_no_moving_units",
        formation: projection.activeFormation,
        friendlies: friendlies.map((unit) => ({
          id: unit.id,
          coord: unit.coord,
          intent: unit.intent.type,
        })),
      });
    }
  }
}

function bindControls() {
  const map = document.querySelector("#map");
  if (map instanceof SVGSVGElement) {
    map.addEventListener("contextmenu", (event) => event.preventDefault());
    map.addEventListener("pointerdown", handleMapPointerDown);
    map.addEventListener("pointermove", handleMapPointerMove);
    map.addEventListener("pointerup", handleMapPointerEnd);
    map.addEventListener("click", handleMapHexClick);
    map.addEventListener("pointercancel", handleMapPointerEnd);
    map.addEventListener("lostpointercapture", handleMapPointerEnd);
    map.addEventListener("wheel", handleMapWheel, { passive: false });
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const commandTarget = target.closest("[data-command]");
    if (!(commandTarget instanceof HTMLElement)) return;
    if (commandTarget.dataset.command === "open-intro") {
      state.showIntro = true;
      renderProductModals();
      return;
    }
    if (commandTarget.dataset.command === "close-intro") {
      state.showIntro = false;
      rememberIntroSeen();
      renderProductModals();
      return;
    }
    if (commandTarget.dataset.command === "start-from-intro") {
      state.showIntro = false;
      state.showScenarioChooser = true;
      rememberIntroSeen();
      renderProductModals();
      renderScenarioChooser();
      return;
    }
    if (commandTarget.dataset.command === "toggle-help") {
      state.showHelp = !state.showHelp;
      if (state.showHelp && state.showIntro) {
        state.showIntro = false;
        rememberIntroSeen();
      }
      renderProductModals();
      return;
    }
    if (commandTarget.dataset.command === "close-help") {
      state.showHelp = false;
      renderProductModals();
      return;
    }
    if (commandTarget.dataset.command === "toggle-orientation") {
      state.orientationMode = !state.orientationMode;
      renderOrientationMode();
      renderCoachPanel();
      renderProductModals();
      return;
    }
    if (commandTarget.dataset.command === "toggle-aar") {
      state.showAarFeed = !state.showAarFeed;
      renderAarFeedVisibility();
      renderMapIfReady();
      return;
    }
    if (commandTarget.dataset.command === "open-scenario") {
      state.showScenarioChooser = true;
      renderScenarioChooser();
      return;
    }
    if (commandTarget.dataset.command === "close-scenario") {
      state.showScenarioChooser = false;
      renderScenarioChooser();
      return;
    }
    if (commandTarget.dataset.command === "select-scenario" && isScenarioId(commandTarget.dataset.scenarioId)) {
      const scenario = state.scenarios.find((candidate) => candidate.id === commandTarget.dataset.scenarioId);
      state.selectedScenarioId = commandTarget.dataset.scenarioId;
      state.selectedDifficulty = scenario?.defaultDifficulty ?? state.selectedDifficulty;
      if (scenario?.recommendedFormation) {
        state.selectedFormation = scenario.recommendedFormation;
      }
      renderScenarioChooser();
      renderControls();
      return;
    }
    if (commandTarget.dataset.command === "select-difficulty" && isDifficulty(commandTarget.dataset.difficulty)) {
      state.selectedDifficulty = commandTarget.dataset.difficulty;
      renderScenarioChooser();
      return;
    }
    if (commandTarget.dataset.command === "start-scenario") {
      void startSelectedScenario();
      return;
    }
    if (commandTarget.dataset.command === "look") {
      send({
        type: "look_direction",
        unitId: state.projection?.player.id,
        direction: commandTarget.dataset.direction,
        issuedAt: state.projection?.time ?? 0,
      });
    }
    if (commandTarget.dataset.command === "posture") {
      send({
        type: "set_posture",
        unitId: state.projection?.player.id,
        posture: commandTarget.dataset.posture,
        issuedAt: state.projection?.time ?? 0,
      });
    }
    if (commandTarget.dataset.command === "formation" && isFormation(commandTarget.dataset.formation)) {
      state.selectedFormation = commandTarget.dataset.formation;
      console.info("[formation-mode] selected", {
        formation: state.selectedFormation,
        communication: state.selectedCommunication,
        direction: state.projection ? selectedOrderDirection(state.projection) : undefined,
      });
      issueFormationOrder();
      renderControls();
      render();
    }
    if (commandTarget.dataset.command === "forward") {
      issueForwardOrder();
    }
    if (commandTarget.dataset.command === "alternating-forward") {
      issueAlternatingForwardOrder();
    }
    if (commandTarget.dataset.command === "alternating-retreat") {
      issueAlternatingRetreatOrder();
    }
    if (commandTarget.dataset.command === "zipper-retreat") {
      issueZipperRetreatOrder(commandTarget.dataset.side === "right" ? "right" : "left");
    }
    if (commandTarget.dataset.command === "halt") {
      issueHaltOrder();
    }
    if (commandTarget.dataset.command === "set-casualty-point") {
      const collectionPointId = isCasualtyCollectionPointId(commandTarget.dataset.casualtyPoint)
        ? commandTarget.dataset.casualtyPoint
        : "asa1";
      state.casualtyPlacementMode = state.casualtyPlacementMode === collectionPointId ? undefined : collectionPointId;
      console.info("[casualty] ÅSA placement mode", {
        active: Boolean(state.casualtyPlacementMode),
        collectionPointId: state.casualtyPlacementMode,
      });
      renderControls();
      render();
    }
    if (commandTarget.dataset.command === "evacuate-casualty") {
      issueCasualtyEvacuationOrder();
    }
    if (
      commandTarget.dataset.command === "communication" &&
      isCommunication(commandTarget.dataset.communication)
    ) {
      state.selectedCommunication = commandTarget.dataset.communication;
      console.info("[communication-mode] selected", {
        communication: state.selectedCommunication,
        formation: state.selectedFormation,
        direction: state.projection ? selectedOrderDirection(state.projection) : undefined,
      });
      renderControls();
      render();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "w") state.pan.y -= 36;
    if (event.key === "s") state.pan.y += 36;
    if (event.key === "a") state.pan.x -= 36;
    if (event.key === "d") state.pan.x += 36;
    if (event.key === "+" || event.key === "=") zoomMap(state.zoom + 0.1, mapCenter());
    if (event.key === "-") zoomMap(state.zoom - 0.1, mapCenter());
    if (event.key.toLowerCase() === "q") lookRelative(-1);
    if (event.key.toLowerCase() === "e") lookRelative(1);
    render();
  });
}

function handleMapWheel(event: WheelEvent): void {
  event.preventDefault();
  const svg = event.currentTarget;
  if (!(svg instanceof SVGSVGElement)) return;

  const rect = svg.getBoundingClientRect();
  const focalPoint = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
  const nextZoom = state.zoom * Math.exp(-wheelDeltaPixels(event, svg) * 0.0015);
  zoomMap(nextZoom, focalPoint);
  render();
}

function handleMapPointerDown(event: PointerEvent): void {
  if (event.button !== 2) return;
  event.preventDefault();
  hideHexTooltip();
  const svg = event.currentTarget;
  if (!(svg instanceof SVGSVGElement)) return;

  panDrag = {
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startPan: { ...state.pan },
  };
  svg.setPointerCapture(event.pointerId);
  svg.classList.add("is-panning");
}

function handleMapPointerMove(event: PointerEvent): void {
  if (!panDrag || event.pointerId !== panDrag.pointerId) return;
  if ((event.buttons & 2) !== 2) {
    finishMapPan(event);
    return;
  }

  event.preventDefault();
  state.pan = {
    x: panDrag.startPan.x - (event.clientX - panDrag.startClientX),
    y: panDrag.startPan.y - (event.clientY - panDrag.startClientY),
  };
  renderMapIfReady();
}

function handleMapPointerEnd(event: PointerEvent): void {
  if (!panDrag || event.pointerId !== panDrag.pointerId) return;
  finishMapPan(event);
}

function handleMapHexClick(event: MouseEvent): void {
  if (event.button !== 0 || panDrag) return;
  const projection = state.projection;
  if (!projection) return;

  const resolvedTarget = hexCoordFromPointerEvent(event, projection);
  if (!resolvedTarget) {
    console.warn("[hex-click] failed", { reason: "outside_grid", clientX: event.clientX, clientY: event.clientY });
    return;
  }

  const { coord: target, source } = resolvedTarget;
  if (!isValidCoord(target)) {
    console.warn("[hex-click] failed", { reason: "invalid_hex_coord", target, source });
    return;
  }
  if (source === "geometry") {
    console.info("[hex-click] resolved by geometry", { target });
  }
  console.log("[hex-click] accepted", { target, source });

  if (state.casualtyPlacementMode && projection.player.role === "leader") {
    const collectionPointId = state.casualtyPlacementMode;
    send({
      type: "set_casualty_collection_point",
      unitId: projection.player.id,
      collectionPointId,
      target,
      issuedAt: projection.time,
    });
    state.casualtyPlacementMode = undefined;
    console.info("[casualty] ÅSA set", { collectionPointId, label: casualtyCollectionPointLabel(collectionPointId), target });
    showHexTooltip(projection, target, event.clientX, event.clientY);
    renderControls();
    return;
  }

  if (projection.player.role === "leader" && (!isEmbodiedAdvanceActive(projection) || event.shiftKey)) {
    const result = setDirectionCue(target, projection);
    logHexDirectionClick(result, projection, target);
    showHexTooltip(projection, target, event.clientX, event.clientY);
    return;
  }

  send({
    type: "move_to_hex",
    unitId: projection.player.id,
    target,
    issuedAt: projection.time,
  });
  console.info("[hex-click] move command sent", {
    unitId: projection.player.id,
    target,
    time: projection.time,
    embodiedAdvance: isEmbodiedAdvanceActive(projection),
  });
}

function hexCoordFromPointerEvent(event: MouseEvent, projection: Projection): { coord: HexCoord; source: "element" | "geometry" } | undefined {
  const targetElement = hexElementFromPoint(event);
  if (targetElement) {
    const coord = coordFromDataset(targetElement);
    if (isValidCoord(coord) && tileAt(projection, coord)) {
      return { coord, source: "element" };
    }
  }

  const point = svgPointFromPointerEvent(event);
  if (!point) return undefined;
  const coord = pixelToHex(point, baseHexSize * state.zoom);
  if (!tileAt(projection, coord)) return undefined;
  return { coord, source: "geometry" };
}

function hexElementFromPoint(event: MouseEvent): SVGElement | undefined {
  const directTarget = event.target instanceof Element ? event.target.closest(".hex, .objective-hitbox") : undefined;
  if (directTarget instanceof SVGElement) {
    return directTarget;
  }

  const hitTarget = document.elementFromPoint(event.clientX, event.clientY);
  const hexTarget = hitTarget instanceof Element ? hitTarget.closest(".hex, .objective-hitbox") : undefined;
  return hexTarget instanceof SVGElement ? hexTarget : undefined;
}

function svgPointFromPointerEvent(event: MouseEvent): { x: number; y: number } | undefined {
  const svg = document.querySelector("#map");
  if (!(svg instanceof SVGSVGElement)) return undefined;
  const rect = svg.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return undefined;
  const viewBox = svg.viewBox.baseVal;
  const width = viewBox.width || svg.clientWidth || rect.width;
  const height = viewBox.height || svg.clientHeight || rect.height;
  return {
    x: viewBox.x + ((event.clientX - rect.left) / rect.width) * width,
    y: viewBox.y + ((event.clientY - rect.top) / rect.height) * height,
  };
}

function finishMapPan(event: PointerEvent): void {
  const svg = event.currentTarget;
  if (svg instanceof SVGSVGElement) {
    if (svg.hasPointerCapture(event.pointerId)) {
      svg.releasePointerCapture(event.pointerId);
    }
    svg.classList.remove("is-panning");
  }
  panDrag = undefined;
}

function wheelDeltaPixels(event: WheelEvent, svg: SVGSVGElement): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * (svg.clientHeight || 600);
  return event.deltaY;
}

function zoomMap(nextZoom: number, focalPoint: { x: number; y: number }): void {
  const clampedZoom = clamp(nextZoom, minZoom, maxZoom);
  if (clampedZoom === state.zoom) return;

  const ratio = clampedZoom / state.zoom;
  state.pan = {
    x: (state.pan.x + focalPoint.x) * ratio - focalPoint.x,
    y: (state.pan.y + focalPoint.y) * ratio - focalPoint.y,
  };
  state.zoom = clampedZoom;
}

function mapCenter(): { x: number; y: number } {
  const svg = document.querySelector("#map");
  if (!(svg instanceof SVGSVGElement)) return { x: 400, y: 300 };
  return {
    x: (svg.clientWidth || 800) / 2,
    y: (svg.clientHeight || 600) / 2,
  };
}

function lookRelative(offset: number): void {
  const current = state.projection?.player.lookDirection ?? "SE";
  const index = directions.indexOf(current);
  const next = directions[(index + offset + directions.length) % directions.length];
  send({
    type: "look_direction",
    unitId: state.projection?.player.id,
    direction: next,
    issuedAt: state.projection?.time ?? 0,
  });
}

function render(): void {
  const projection = state.projection;
  if (!projection) return;

  document.body.dataset.difficulty = projection.scenario.difficulty;
  document.querySelector("#time").textContent = `t=${projection.time.toFixed(1)}`;
  renderGameLink();
  renderInfoWords(projection);
  renderGroup(projection);
  renderDebrief(projection);
  renderEvents(state.eventHistory.length > 0 ? state.eventHistory : projection.events);
  renderAarFeedVisibility();
  renderControls();
  renderOrientationMode();
  renderCoachPanel();
  renderProductModals();
  renderScenarioChooser();
  renderMap(projection);
}

function renderGameLink(): void {
  const link = document.querySelector("#game-link");
  if (!(link instanceof HTMLAnchorElement)) return;
  const href = gameHref();
  link.href = href;
  link.textContent = `spel ${state.gameId}`;
  link.title = `Dela spel ${state.gameId}`;
}

function gameHref(): string {
  return `/?game=${encodeURIComponent(state.gameId)}&intro=0`;
}

function renderAarFeedVisibility(): void {
  const layout = document.querySelector(".layout");
  const panel = document.querySelector("#aar-panel");
  const toggle = document.querySelector("#aar-toggle");
  if (!(layout instanceof HTMLElement) || !(panel instanceof HTMLElement) || !(toggle instanceof HTMLElement)) {
    return;
  }
  layout.classList.toggle("is-aar-open", state.showAarFeed);
  panel.hidden = !state.showAarFeed;
  toggle.classList.toggle("is-active", state.showAarFeed);
  toggle.setAttribute("aria-expanded", String(state.showAarFeed));
}

function renderOrientationMode(): void {
  document.body.dataset.orientation = state.orientationMode ? "on" : "off";
  const toggle = document.querySelector("[data-command='toggle-orientation']");
  if (!(toggle instanceof HTMLElement)) return;
  toggle.classList.toggle("is-active", state.orientationMode);
  toggle.setAttribute("aria-pressed", String(state.orientationMode));
  toggle.textContent = state.orientationMode ? "Orientering på" : "Orientering av";
}

function renderProductModals(): void {
  renderIntroModal();
  renderHelpModal();
}

function renderIntroModal(): void {
  const modal = document.querySelector("#intro-modal");
  if (!(modal instanceof HTMLElement)) return;
  modal.hidden = !state.showIntro;
  if (!state.showIntro) {
    modal.innerHTML = "";
    return;
  }

  const selectedScenario =
    state.scenarios.find((scenario) => scenario.id === state.selectedScenarioId) ??
    state.scenarios[0] ??
    state.projection?.scenario;
  const scenarioTitle = selectedScenario?.title ?? "Gruppchefens lägesbild";
  const scenarioGoal = selectedScenario?.goal.description ?? "Led gruppen med begränsad information och lär av debriefen.";

  modal.innerHTML = `
    <section class="product-modal intro-modal" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div class="product-modal-header">
        <div>
          <p class="eyebrow">Träningsslice v0.1</p>
          <h2 id="intro-title">Perspektivbubbla</h2>
        </div>
        <button type="button" class="icon-button" data-command="close-intro" title="Stäng intro">
          <span aria-hidden="true">×</span>
          <span class="sr-only">Stäng intro</span>
        </button>
      </div>
      <div class="intro-body">
        <p class="intro-lead">Öva gruppchefens viktigaste friktion: du ger enkla order, soldaterna uppfattar dem genom röst, tecken eller radio, och gruppen rör sig bara så bra som lägesbilden och sammanhållningen tillåter.</p>
        <div class="intro-cards">
          <article>
            <strong>1. Ta ut riktning</strong>
            <span>Klicka en hex för att lägga riktmärket. Linjen är referens för formationen, inte en automatisk marschorder.</span>
          </article>
          <article>
            <strong>2. Ge ordern</strong>
            <span>Välj metod, välj formation, och säg sedan <em>Framåt</em>. Metoden påverkar hur ordern sprids.</span>
          </article>
          <article>
            <strong>3. Led som soldat</strong>
            <span>Gruppchefen är också en soldat. När framryckningen är igång klickar du dig genom terrängen och gruppen följer.</span>
          </article>
        </div>
        <div class="intro-mission">
          <span>Aktuell start</span>
          <strong>${escapeHtml(scenarioTitle)}</strong>
          <p>${escapeHtml(scenarioGoal)}</p>
        </div>
      </div>
      <div class="product-modal-actions">
        <button type="button" data-command="toggle-help">Öppna hjälp</button>
        <button type="button" data-command="start-from-intro">Välj scenario</button>
      </div>
    </section>`;
}

function renderHelpModal(): void {
  const modal = document.querySelector("#help-modal");
  if (!(modal instanceof HTMLElement)) return;
  modal.hidden = !state.showHelp;
  if (!state.showHelp) {
    modal.innerHTML = "";
    return;
  }

  modal.innerHTML = `
    <section class="product-modal help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div class="product-modal-header">
        <div>
          <p class="eyebrow">Fälthjälp</p>
          <h2 id="help-title">Så spelar du</h2>
        </div>
        <button type="button" class="icon-button" data-command="close-help" title="Stäng hjälp">
          <span aria-hidden="true">×</span>
          <span class="sr-only">Stäng hjälp</span>
        </button>
      </div>
      <div class="help-grid">
        <article>
          <h3>Orderflöde</h3>
          <ol>
            <li>Välj röst, tecken eller radio.</li>
            <li>Klicka en hex för att sätta riktning.</li>
            <li>Klicka formation för att gruppera.</li>
            <li>Klicka <strong>Framåt!</strong> för framryckning.</li>
            <li>Klicka kartan för att flytta gruppchefen.</li>
            <li>Klicka <strong>Halt!</strong> när gruppen ska stanna.</li>
          </ol>
        </article>
        <article>
          <h3>Svårighet</h3>
          <p><strong>Träning</strong> visar fler stödmarkeringar och text på tecken. <strong>Normal</strong> döljer teckentexterna. <strong>Realistisk</strong> gör minne och överlägg stramare.</p>
        </article>
        <article>
          <h3>Karta</h3>
          <p>Vänsterklick sätter riktning innan framryckning. Under framryckning flyttar vänsterklick gruppchefen. Shift-klick sätter ny riktning. Högerdrag panorerar och muswheel zoomar.</p>
        </article>
        <article>
          <h3>Debrief</h3>
          <p>Öppna loggknappen för score, lärpunkter och händelser. Poängen är inte facit; den pekar på orderkedja, sammanhållning, blockeringar och kontakttryck.</p>
        </article>
      </div>
      <div class="product-modal-actions">
        <button type="button" data-command="toggle-orientation">${state.orientationMode ? "Stäng orientering" : "Starta orientering"}</button>
        <button type="button" data-command="close-help">Tillbaka</button>
      </div>
    </section>`;
}

function renderCoachPanel(projection = state.projection): void {
  const panel = document.querySelector("#coach-panel");
  if (!(panel instanceof HTMLElement)) return;
  if (!projection || !state.orientationMode) {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }

  const step = coachStepFor(projection);
  const progress = coachProgress(projection);
  panel.hidden = false;
  panel.className = `coach-panel coach-${step.tone}`;
  panel.innerHTML = `
    <div class="coach-kicker">Orienteringsläge</div>
    <div class="coach-title">${escapeHtml(step.step)} · ${escapeHtml(step.title)}</div>
    <p>${escapeHtml(step.body)}</p>
    <div class="coach-action">${escapeHtml(step.action)}</div>
    <div class="coach-progress">
      ${progress
        .map((item) => `<span class="${item.done ? "is-done" : ""}">${escapeHtml(item.label)}</span>`)
        .join("")}
    </div>`;
}

function coachStepFor(projection: Projection): CoachStep {
  if (projection.player.role !== "leader") {
    return {
      step: "Soldat",
      title: "Ta dig till skydd",
      body: "Du styr en enskild soldat. Kartklick skickar förflyttning, Q/E sveper blicken och händelseloggen visar vad som hände.",
      action: "Klicka mot skydd och håll koll på siktlinjer.",
      tone: "ready",
    };
  }

  if (projection.scenario.id === "casualty_retreat") {
    const casualtyPoint = selectedCasualtyCollectionPoint(projection);
    const wounded = projection.units.find((unit) => unit.side === "friendly" && (unit.posture === "injured" || unit.status.includes("injured")));
    if (!casualtyPoint) {
      return {
        step: "1/5",
        title: "Sätt ÅSA",
        body: "Retrettbanan kräver en uppsamlingsplats där bärarlaget kan få in den skadade innan gruppen räknas som ordnad.",
        action: "Klicka Sätt ÅSA1 och välj en skyddad hex bakom gruppen.",
        tone: "ready",
      };
    }
    if (wounded && projection.casualtyEvacuation?.phase !== "dragging" && projection.casualtyEvacuation?.phase !== "completed") {
      return {
        step: "2/5",
        title: "Starta bärarlag",
        body: "Två soldater går till den skadade. Om de blir trötta ropar de förstärkning och avlösning sker lokalt.",
        action: "Klicka Släpa skadad.",
        tone: "ready",
      };
    }
    if (!projection.activeManeuver || projection.activeManeuver.phase === "completed") {
      return {
        step: "3/5",
        title: "Bryt kontakt bakåt",
        body: "Växelvis bakåt delar gruppen i två tät. Blixtlås släpper soldater från flank i ordning. Ingen rör sig om täckning saknas.",
        action: "Sätt reträttriktning på kartan och klicka Växelvis bakåt eller Blixtlås.",
        tone: "ready",
      };
    }
    const reinforcement = projection.casualtyEvacuation?.requestedReinforcement?.unitId;
    return {
      step: "4/5",
      title: "Håll täckning",
      body: `${displayManeuverState(projection.activeManeuver)}. Täckande soldater trycker ner fienden medan rörlig del eller bärare går bakåt.`,
      action: reinforcement
        ? `${displayUnitId(reinforcement)} går som förstärkning. Vänta in avlösningen innan nästa riskabla steg.`
        : "Ge Halt! om täckning glappar, annars låt manövern växla vidare.",
      tone: projection.risk.blocking.length > 0 ? "warning" : "wait",
    };
  }

  const distanceToGoal = hexDistance(projection.player.coord, projection.objective.target);
  if (distanceToGoal <= 3) {
    return {
      step: "6/6",
      title: "Debriefa",
      body: "Gruppchefen är nära målområdet. Nu är lärloopen viktigare än fler klick.",
      action: "Öppna debriefen och se vad orderkedja, sammanhållning och riskzoner säger.",
      tone: projection.risk.blocking.length > 0 ? "warning" : "ready",
    };
  }

  if (!state.selectedDirection) {
    return {
      step: "1/6",
      title: "Ta ut riktning",
      body: "Formationerna använder riktmärket som referens. Det är inte samma sak som att börja gå.",
      action: "Klicka en hex i den riktning gruppen ska orientera mot.",
      tone: "ready",
    };
  }

  if (!projection.activeFormation) {
    return {
      step: "2/6",
      title: "Ge formationsorder",
      body: `${displayCommunication(state.selectedCommunication)} är valt. Formationer är riktiga order och soldaterna repeterar dem genom orderkedjan.`,
      action: `Klicka ${displayFormation(state.selectedFormation)} eller välj en annan formation.`,
      tone: "ready",
    };
  }

  if (projection.activeFormation.orderKind === "formation") {
    const moving = projection.units.filter((unit) => unit.side === "friendly" && unit.intent.type === "moving").length;
    return {
      step: "3/6",
      title: moving > 0 ? "Gruppen formerar" : "Klar för framåt",
      body:
        moving > 0
          ? "Soldaterna tar sina platser utan att gå mot mål ännu. Ingen ska dela hex med en kamrat."
          : "Formationens platser är satta. Framåt gör detta till en framryckning.",
      action: moving > 0 ? "Vänta in formeringen eller ge halt om något ser fel ut." : "Klicka Framåt! när du vill börja röra gruppen.",
      tone: moving > 0 ? "wait" : "ready",
    };
  }

  if (projection.activeFormation.phase === "forming") {
    return {
      step: "4/6",
      title: "Formerar före rörelse",
      body: "Framåt är mottaget, men gruppen prioriterar att komma i formation innan framryckningen startar.",
      action: "Titta efter stragglers, väntande soldater och blockerade effektzoner.",
      tone: "wait",
    };
  }

  if (projection.activeFormation.phase === "advancing" && projection.player.intent.type !== "moving") {
    return {
      step: "5/6",
      title: "Led framryckningen",
      body: "Nu är gruppchefen ankaret. Soldaterna följer din rörelse och stoppar om grannar tappar sammanhållning.",
      action: "Klicka nästa terrängpunkt för gruppchefen. Shift-klick ändrar riktning.",
      tone: projection.risk.blocking.length > 0 ? "warning" : "ready",
    };
  }

  return {
    step: "5/6",
    title: "Håll ihop gruppen",
    body: "Gruppen rör sig. Om en granne blir för långt efter väntar soldaterna hellre än att spräcka formationen.",
    action: "Fortsätt styra gruppchefen, byt riktning med shift-klick eller ge Halt! vid behov.",
    tone: projection.risk.blocking.length > 0 ? "warning" : "wait",
  };
}

function coachProgress(projection: Projection): Array<{ label: string; done: boolean }> {
  return [
    { label: "riktning", done: Boolean(state.selectedDirection) },
    { label: "metod", done: Boolean(state.selectedCommunication) },
    { label: "formation", done: Boolean(projection.activeFormation) },
    { label: "framåt", done: projection.activeFormation?.orderKind === "forward" },
    { label: "rörelse", done: projection.activeFormation?.phase === "advancing" },
    { label: "debrief", done: hexDistance(projection.player.coord, projection.objective.target) <= 3 },
  ];
}

function renderDebrief(projection: Projection): void {
  const container = document.querySelector("#debrief");
  if (!(container instanceof HTMLElement)) return;
  const summary = buildDebriefSummary(projection);
  container.innerHTML = `
    <div class="score-card grade-${summary.grade.toLowerCase()}">
      <span>Score</span>
      <strong>${summary.score}</strong>
      <em>${escapeHtml(summary.grade)}</em>
    </div>
    <div class="metric-grid">
      ${summary.metrics
        .map(
          (metric) => `<div class="metric metric-${metric.state}">
            <span>${escapeHtml(metric.label)}</span>
            <strong>${escapeHtml(metric.value)}</strong>
          </div>`,
        )
        .join("")}
    </div>
    ${renderU3TDebrief(projection.aar?.u3t)}
    <div class="lesson-list">
      <strong>Lärpunkter</strong>
      <ul>
        ${summary.lessons.map((lesson) => `<li>${escapeHtml(lesson)}</li>`).join("")}
      </ul>
    </div>`;
}

function buildDebriefSummary(projection: Projection): DebriefSummary {
  const events =
    projection.aar?.orderEvents && projection.aar.orderEvents.length > 0
      ? projection.aar.orderEvents
      : state.eventHistory.length > 0
        ? state.eventHistory
        : projection.events;
  const issuedOrders = events.filter((event) => event.type === "formation_order_issued");
  const distance = hexDistance(projection.player.coord, projection.objective.target);
  const deliveries = events.filter((event) => event.type === "order_delivery_resolved");
  const received = deliveries.filter((event) => event.payload?.status === "received").length;
  const waits = events.filter((event) => event.type === "movement_waiting").length;
  const blocks = events.filter((event) => event.type === "friendly_effect_blocked").length + projection.risk.blocking.length;
  const coverageGaps = events.filter((event) => event.type === "tat_coverage_gap").length + projection.risk.coverage.filter((check) => !check.covered).length;
  const contacts = events.filter((event) => event.type === "contact_pressure_emitted" || event.type === "probabilistic_detection_resolved").length;
  const orderRatio = deliveries.length > 0 ? received / deliveries.length : 0;
  const trainingAssessment = projection.aar?.u3t;

  let score = 100;
  score -= Math.min(25, distance * 2);
  score -= deliveries.length === 0 ? 12 : Math.round((1 - orderRatio) * 22);
  score -= Math.min(16, waits * 2);
  score -= Math.min(18, blocks * 3);
  score -= Math.min(14, coverageGaps * 3);
  score -= Math.min(18, contacts * 6);
  score -= projection.time > 90 ? 8 : projection.time > 45 ? 3 : 0;
  if (trainingAssessment) {
    const hardFailures = trainingAssessment.metrics.hardFailures.length;
    const softThresholds = Math.max(0, trainingAssessment.metrics.thresholdsExceeded.length - hardFailures);
    score -= Math.min(30, hardFailures * 15 + softThresholds * 5);
  }
  score = clamp(score, 0, 100);

  const metrics: DebriefSummary["metrics"] =
    trainingAssessment?.metrics.metrics.length
      ? trainingAssessment.metrics.metrics.slice(0, 6).map((metric) => ({
          label: metric.label,
          value: metric.value,
          state: metric.state,
        }))
      : [
          { label: "Målavstånd", value: `${distance} hex`, state: distance <= 3 ? "good" : distance <= 10 ? "warn" : "bad" },
          {
            label: "Orderkedja",
            value: deliveries.length > 0 ? `${received}/${deliveries.length}` : "ingen",
            state: deliveries.length > 0 && orderRatio === 1 ? "good" : deliveries.length > 0 && orderRatio >= 0.75 ? "warn" : "bad",
          },
          { label: "Väntan", value: String(waits), state: waits === 0 ? "good" : waits <= 4 ? "warn" : "bad" },
          { label: "Blockering", value: String(blocks), state: blocks === 0 ? "good" : blocks <= 3 ? "warn" : "bad" },
          { label: "Täckningsgap", value: String(coverageGaps), state: coverageGaps === 0 ? "good" : coverageGaps <= 2 ? "warn" : "bad" },
          { label: "Kontakttryck", value: String(contacts), state: contacts === 0 ? "good" : "bad" },
        ];

  const lessons: string[] = [];
  if (trainingAssessment) {
    const routeFinding = trainingAssessment.observations.find((observation) => observation.state === "bad")
      ?? trainingAssessment.observations.find((observation) => observation.state === "warn");
    if (routeFinding) lessons.push(`${routeFinding.label}: ${routeFinding.text}`);
    if (trainingAssessment.metrics.thresholdsExceeded.length > 0) {
      lessons.push(`Gränser passerade: ${trainingAssessment.metrics.thresholdsExceeded.map(displayThresholdReason).join(", ")}.`);
    }
  }
  if (!state.selectedDirection) lessons.push("Sätt riktning innan formation och framåt så tätens linje får en tydlig referens.");
  if (issuedOrders.length === 0) lessons.push("Ge en formationsorder före framåt, så orderkedjan syns i debriefen.");
  if (deliveries.length > 0 && orderRatio < 1) lessons.push("Alla uppfattade inte ordern. Byt metod, minska avstånd eller använd radio när läget kräver det.");
  if (waits > 0) lessons.push("Sammanhållningen styr tempo. När någon hamnar efter väntar grannarna hellre än att spräcka tätet.");
  if (blocks > 0) lessons.push("Blockerade effektzoner tyder på för tät gruppering eller fel blickriktning.");
  if (coverageGaps > 0) lessons.push("Minst ett tät saknade täckning. Vänd, sprid eller stanna upp innan nästa rörelse.");
  if (contacts > 0) lessons.push("Motståndaren fick kontakttryck. Använd skydd, kortare exponering och bättre orientering.");
  if (distance <= 3 && contacts === 0 && blocks === 0) lessons.push("Snyggt: du nådde målområdet utan kontakttryck eller blockerade effektzoner.");
  if (lessons.length === 0) lessons.push("Fortsätt spela fram till målområdet och öppna debriefen igen.");

  return {
    score,
    grade: score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "E",
    metrics,
    lessons: lessons.slice(0, 4),
  };
}

function renderU3TDebrief(assessment: TrainingAssessment | undefined): string {
  if (!assessment) return "";
  return `
    <div class="u3t-debrief">
      <strong>U3T</strong>
      <div class="u3t-observations">
        ${assessment.observations
          .map(
            (observation) => `<div class="u3t-observation metric-${observation.state}">
              <span>${escapeHtml(observation.label)}</span>
              <p>${escapeHtml(observation.text)}</p>
            </div>`,
          )
          .join("")}
      </div>
    </div>`;
}

function displayThresholdReason(reason: string): string {
  const labels: Record<string, string> = {
    time_limit_exceeded: "tid",
    exposure_threshold_exceeded: "exponering",
    cumulative_exposure_exceeded: "ackumulerad risk",
    contact_threshold_exceeded: "kontakt",
    detection_threshold_exceeded: "upptäckt",
    casualty_threshold_exceeded: "skada",
  };
  return labels[reason] ?? reason;
}

function renderScenarioU3T(training: ScenarioTraining | undefined): string {
  if (!training) return "";
  const axes: U3TAxis[] = ["uppgiften", "tiden", "truppen", "terrangen"];
  const constraints = trainingConstraintLines(training.constraints);
  return `
    <section class="scenario-u3t" aria-label="U3T">
      <h3>U3T</h3>
      <div class="scenario-u3t-grid">
        ${axes
          .map(
            (axis) => `<div>
              <span>${escapeHtml(displayU3TAxis(axis))}</span>
              <p>${escapeHtml(training.u3t[axis])}</p>
            </div>`,
          )
          .join("")}
      </div>
      ${
        constraints.length > 0
          ? `<div class="scenario-thresholds">
              <span>Gränser</span>
              <p>${constraints.map(escapeHtml).join("<br>")}</p>
            </div>`
          : ""
      }
    </section>`;
}

function trainingConstraintLines(constraints: TrainingConstraints | undefined): string[] {
  if (!constraints) return [];
  const lines: string[] = [];
  if (constraints.timeLimitSeconds !== undefined) lines.push(`tid: ${constraints.timeLimitSeconds} s`);
  if (constraints.maxExposureSamples) {
    lines.push(
      `exponering: max ${constraints.maxExposureSamples.samples} prov på nivå ${constraints.maxExposureSamples.exposureAtLeast}+${
        constraints.maxExposureSamples.hard ? " (hård)" : ""
      }`,
    );
  }
  if (constraints.maxCumulativeExposure) {
    lines.push(`ackumulerad risk: max ${constraints.maxCumulativeExposure.exposure}${constraints.maxCumulativeExposure.hard ? " (hård)" : ""}`);
  }
  if (constraints.maxDetectionEvents !== undefined) lines.push(`upptäckter: max ${constraints.maxDetectionEvents}`);
  if (constraints.maxContactEvents !== undefined) lines.push(`kontakttryck: max ${constraints.maxContactEvents}`);
  if (constraints.maxWounded !== undefined) lines.push(`skadade: max ${constraints.maxWounded}`);
  return lines;
}

function displayU3TAxis(axis: U3TAxis): string {
  const labels: Record<U3TAxis, string> = {
    uppgiften: "Uppgiften",
    tiden: "Tiden",
    truppen: "Truppen",
    terrangen: "Terrängen",
  };
  return labels[axis];
}

function renderScenarioChooser(): void {
  const chooser = document.querySelector("#scenario-chooser");
  if (!(chooser instanceof HTMLElement)) return;

  chooser.hidden = !state.showScenarioChooser;
  const selectedScenario =
    state.scenarios.find((scenario) => scenario.id === state.selectedScenarioId) ??
    state.scenarios[0] ??
    state.projection?.scenario;
  if (!selectedScenario) {
    chooser.innerHTML = `<div class="scenario-modal"><div class="scenario-empty">Laddar scenarier...</div></div>`;
    return;
  }

  const difficultyOptions =
    state.difficulties.length > 0
      ? state.difficulties
      : [
          { id: "training" as const, label: "Träning", description: "Tydliga överlägg och förklaringar." },
          { id: "normal" as const, label: "Normal", description: "Mindre hjälp och mer osäker lägesbild." },
          { id: "realistic" as const, label: "Realistisk", description: "Kortare minne och färre markeringar." },
        ];
  const activeDifficulty = state.selectedDifficulty ?? selectedScenario.defaultDifficulty;
  const troopRows = selectedScenario.troop
    .map(
      (unit) => `<li>
        <strong>${escapeHtml(unit.name)}</strong>
        <span>${escapeHtml(displayScenarioRole(unit))}</span>
      </li>`,
    )
    .join("");
  const difficultyCards = difficultyOptions
    .map(
      (difficulty) => `<button
        type="button"
        class="difficulty-card ${difficulty.id === activeDifficulty ? "is-active" : ""}"
        data-command="select-difficulty"
        data-difficulty="${difficulty.id}"
      >
        <strong>${escapeHtml(difficulty.label)}</strong>
        <span>${escapeHtml(difficulty.description)}</span>
      </button>`,
    )
    .join("");
  const directLink = directScenarioHref(selectedScenario.id, activeDifficulty);

  chooser.innerHTML = `
    <div class="scenario-modal" role="dialog" aria-modal="true" aria-labelledby="scenario-title">
      <div class="scenario-header">
        <div>
          <h2 id="scenario-title">Scenario</h2>
          <p>${escapeHtml(selectedScenario.title)} - ${escapeHtml(displayDifficulty(activeDifficulty))}</p>
        </div>
        <button type="button" class="icon-button" data-command="close-scenario" title="Stäng scenario-väljaren">
          <span aria-hidden="true">×</span>
          <span class="sr-only">Stäng scenario-väljaren</span>
        </button>
      </div>

      <div class="scenario-body">
        <div class="scenario-list" aria-label="Scenarier">
          ${state.scenarios
            .map(
              (scenario) => `<button
                type="button"
                class="scenario-card ${scenario.id === selectedScenario.id ? "is-active" : ""}"
                data-command="select-scenario"
                data-scenario-id="${scenario.id}"
              >
                <span>${escapeHtml(scenario.subtitle)}</span>
                <strong>${escapeHtml(scenario.title)}</strong>
              </button>`,
            )
            .join("")}
        </div>

        <section class="scenario-detail">
          <p class="scenario-description">${escapeHtml(selectedScenario.description)}</p>
          <div class="scenario-brief">
            <div>
              <span>Lektionsfokus</span>
              <strong>${escapeHtml(scenarioLesson(selectedScenario.id))}</strong>
            </div>
            <div>
              <span>Första rimliga order</span>
              <strong>${escapeHtml(firstOrderHint(selectedScenario, activeDifficulty))}</strong>
            </div>
          </div>
          ${renderScenarioU3T(selectedScenario.training)}
          <div class="scenario-columns">
            <div>
              <h3>Trupp</h3>
              <ol class="scenario-troop">${troopRows}</ol>
            </div>
            <div>
              <h3>Mål</h3>
              <p class="scenario-goal-title">${escapeHtml(selectedScenario.goal.title)}</p>
              <p>${escapeHtml(selectedScenario.goal.description)}</p>
              <p class="scenario-hex">hex ${selectedScenario.goal.target.q},${selectedScenario.goal.target.r}</p>
            </div>
          </div>
        </section>
      </div>

      <div class="scenario-actions">
        <div class="scenario-difficulty-chooser" role="group" aria-label="Svårighet">
          <span class="scenario-actions-label">Svårighet</span>
          <div class="difficulty-grid">${difficultyCards}</div>
        </div>
        <div class="scenario-start-actions">
          <a class="scenario-direct-link" href="${escapeAttribute(directLink)}">Direktlänk</a>
          <button type="button" data-command="start-scenario" ${state.startingScenario ? "disabled" : ""}>
            ${state.startingScenario ? "Startar..." : "Starta scenario"}
          </button>
        </div>
      </div>
    </div>`;
}

async function startSelectedScenario(source = "picker"): Promise<void> {
  if (!state.selectedScenarioId || state.startingScenario) return;
  state.startingScenario = true;
  renderScenarioChooser();
  try {
    console.info("[scenario] start requested", {
      scenarioId: state.selectedScenarioId,
      difficulty: state.selectedDifficulty,
      source,
    });
    const response = await fetch(sessionApiUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenarioId: state.selectedScenarioId,
        difficulty: state.selectedDifficulty,
      }),
    });
    if (!response.ok) {
      throw new Error(`Scenario start failed with ${response.status}`);
    }
    const projection = (await response.json()) as Projection;
    state.projection = projection;
    state.selectedScenarioId = projection.scenario.id;
    state.selectedDifficulty = projection.scenario.difficulty;
    state.selectedFormation = projection.scenario.recommendedFormation ?? "line";
    state.hasCentered = false;
    state.directionCue = undefined;
    state.directionCuePoint = undefined;
    state.selectedDirection = undefined;
    state.loggedDiagnostics.clear();
    state.eventHistory = [];
    mergeEventHistory(projection.events);
    state.showScenarioChooser = false;
    centerOnPlayerOnce();
    render();
    console.info("[scenario] started", {
      scenarioId: projection.scenario.id,
      difficulty: projection.scenario.difficulty,
      units: projection.units.length,
      source,
    });
  } catch (error) {
    console.warn("[scenario] failed to start scenario", error);
  } finally {
    state.startingScenario = false;
    renderScenarioChooser();
  }
}

function sessionApiUrl(): string {
  return `/api/session?game=${encodeURIComponent(state.gameId)}`;
}

function renderMapIfReady(): void {
  if (!state.projection || mapRenderFrame !== undefined) return;
  mapRenderFrame = requestAnimationFrame(() => {
    mapRenderFrame = undefined;
    if (state.projection) renderMap(state.projection);
  });
}

function centerOnPlayerOnce(): void {
  if (state.hasCentered || !state.projection) return;
  const svg = document.querySelector("#map");
  const width = svg instanceof SVGSVGElement && svg.clientWidth > 0 ? svg.clientWidth : 800;
  const height = svg instanceof SVGSVGElement && svg.clientHeight > 0 ? svg.clientHeight : 600;
  const point = unitToPixel(state.projection.player, baseHexSize * state.zoom);
  state.pan = {
    x: point.x - width / 2,
    y: point.y - height / 2,
  };
  state.hasCentered = true;
}

function renderGroup(projection: Projection): void {
  const friendlies = projection.units.filter((unit) => unit.side === "friendly");
  const rows = friendlies
    .map((unit) => {
      const details = unitDetails(unit, projection);
      const activity = shortActivity(unit);
      return `<li class="roster-item roster-${activityTone(unit)}" tabindex="0" title="${escapeAttribute(details)}" data-tooltip="${escapeAttribute(details)}">
        <span class="callsign">${escapeHtml(unit.name)}</span>
        <span class="roster-status">${escapeHtml(activity)}</span>
      </li>`;
    })
    .join("");
  document.querySelector("#group").innerHTML = `<ol class="group-list">${rows}</ol>`;
}

function renderInfoWords(projection: Projection): void {
  setHoverDetails("#info-unit", unitDetails(projection.player, projection));
  setHoverDetails("#info-group", groupDetails(projection));
  setHoverDetails("#info-goal", goalDetails(projection));
  setHoverDetails("#info-orders", orderDetails(projection));
  setHoverDetails("#info-terrain", terrainLegendDetails());
}

function setHoverDetails(selector: string, details: string): void {
  const element = document.querySelector(selector);
  if (!(element instanceof HTMLElement)) return;
  element.setAttribute("title", details);
  element.dataset.tooltip = details;
}

function renderControls(): void {
  const voicePalette = document.querySelector("#voice-palette");
  const gesturePalette = document.querySelector("#gesture-palette");
  const radioPalette = document.querySelector("#radio-palette");
  if (voicePalette instanceof HTMLElement && gesturePalette instanceof HTMLElement && radioPalette instanceof HTMLElement) {
    voicePalette.hidden = state.selectedCommunication !== "voice";
    gesturePalette.hidden = state.selectedCommunication !== "gesture";
    radioPalette.hidden = state.selectedCommunication !== "radio";
  }

  document.querySelectorAll("[data-command='formation']").forEach((button) => {
    if (!(button instanceof HTMLElement)) return;
    const selected = button.dataset.formation === state.selectedFormation;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelectorAll("[data-command='communication']").forEach((button) => {
    if (!(button instanceof HTMLElement)) return;
    const selected = button.dataset.communication === state.selectedCommunication;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.setAttribute("aria-selected", String(selected));
  });
  document.querySelectorAll("[data-command='set-casualty-point']").forEach((button) => {
    if (!(button instanceof HTMLElement)) return;
    const collectionPointId = isCasualtyCollectionPointId(button.dataset.casualtyPoint) ? button.dataset.casualtyPoint : "asa1";
    const selected = state.casualtyPlacementMode === collectionPointId;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.title = selected ? `Klicka en hex för ${casualtyCollectionPointLabel(collectionPointId)}` : `Välj ${casualtyCollectionPointLabel(collectionPointId)}`;
  });
  document.querySelectorAll("[data-command='evacuate-casualty']").forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    const hasWounded = Boolean(state.projection?.units.some((unit) => unit.side === "friendly" && (unit.posture === "injured" || unit.status.includes("injured"))));
    button.disabled = !hasWounded;
    button.title = !hasWounded
      ? "Ingen skadad soldat"
      : "Två närmaste stridsdugliga soldater omhändertar skadad. ÅSA styr bara uppdragets mål.";
  });
  renderGestureHints();
}

function renderGestureHints(): void {
  const difficulty = state.projection?.scenario.difficulty ?? state.selectedDifficulty;
  const showGestureHints = difficulty === "training";
  document.querySelectorAll(".gesture-command").forEach((button) => {
    if (!(button instanceof HTMLElement)) return;
    const label = button.dataset.gestureLabel ?? button.getAttribute("title") ?? button.textContent?.trim() ?? "";
    button.dataset.gestureLabel = label;
    button.setAttribute("aria-label", label);
    if (showGestureHints) {
      button.setAttribute("title", label);
    } else {
      button.removeAttribute("title");
    }
  });
}

function renderEvents(events: EventProjection[]): void {
  document.querySelector("#events").innerHTML = events
    .slice(-18)
    .reverse()
    .map((event) => `<li><strong>${event.time.toFixed(1)}</strong> ${escapeHtml(formatTimelineEvent(event))}</li>`)
    .join("");
}

function renderMap(projection: Projection): void {
  const svg = document.querySelector("#map");
  if (!(svg instanceof SVGSVGElement)) return;
  const size = baseHexSize * state.zoom;
  const tiles = projection.map.tiles;
  const units = projection.units;
  const playerPoint = unitToPixel(projection.player, size);

  const tileMarkup = tiles
    .map((tile) => {
      const point = axialToPixel(tile.coord, size);
      const visibility = tile.visibility ?? "visible";
      const terrainClass = visibility === "unknown" ? "unknown" : tile.terrain;
      const memoryStyle =
        typeof tile.memoryOpacity === "number"
          ? ` style="--memory-opacity: ${tile.memoryOpacity}"`
          : "";
      return `<polygon class="hex ${terrainClass} visibility-${visibility}" points="${hexPoints(point, size)}" data-q="${tile.coord.q}" data-r="${tile.coord.r}" data-visibility="${visibility}"${memoryStyle}></polygon>`;
    })
    .join("");
  const terrainIconMarkup = renderTerrainIcons(tiles, size);
  const objectiveMarkup = renderObjectiveMarker(projection, size);
  const casualtyMarkup = renderCasualtyCollectionMarker(projection, size);
  const orderRangeMarkup =
    projection.player.role === "leader"
      ? `<circle class="order-range ${state.selectedCommunication}" cx="${playerPoint.x}" cy="${playerPoint.y}" r="${orderRangePixels(size)}"></circle>`
      : "";
  const directionCueMarkup = renderDirectionCue(projection, size);
  const effectZoneMarkup = renderEffectZones(projection, size);
  const maneuverMarkup = renderTacticalManeuverOverlay(projection, size);
  const blockingMarkup = renderBlockingWarnings(projection, size);
  const fireMarkup = renderFireBursts(projection, size);
  const firingUnitIds = recentFiringUnitIds(projection);

  const intentMarkup = units
    .filter((unit) => unit.side === "friendly" && unit.intent.type === "moving" && unit.intent.target)
    .map((unit) => {
      const from = unitToPixel(unit, size);
      const to = unit.intent.targetPoint ? mapPointToPixel(unit.intent.targetPoint, size) : axialToPixel(unit.intent.target as HexCoord, size);
      return `<g class="intent">
        <line class="intent-line" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>
        <circle class="intent-marker" cx="${to.x}" cy="${to.y}" r="${size * 0.42}"></circle>
      </g>`;
    })
    .join("");

  const unitMarkup = units
    .map((unit) => {
      const point = unitToPixel(unit, size);
      const vector = directionToPixelVector(unit.lookDirection, size * 1.7);
      const end = { x: point.x + vector.x, y: point.y + vector.y };
      const details = unitDetails(unit, projection);
      const blocked = projection.risk.blocking.some((warning) => warning.unitId === unit.id || warning.blockingUnitId === unit.id);
      const wounded = unit.posture === "injured" || unit.status.includes("injured");
      const statusClasses = unit.status.map((status) => `unit-status-${cssIdentifier(status)}`).join(" ");
      const firing = firingUnitIds.has(unit.id);
      const tone = activityTone(unit);
      const status = shortActivity(unit);
      const statusMarkup =
        status && unit.side === "friendly"
          ? `<text class="unit-status-label status-${tone}" x="${point.x + size * 0.8}" y="${point.y + size * 0.65}">${escapeHtml(status)}</text>`
          : "";
      return `<g class="unit-marker ${blocked ? "unit-risk" : ""} ${firing ? "unit-firing" : ""} unit-${tone} ${wounded ? "unit-wounded" : ""} ${statusClasses}">
        <title>${escapeHtml(details)}</title>
        <circle class="unit-${unit.side} unit-${unit.role}" cx="${point.x}" cy="${point.y}" r="${size * 0.55}"></circle>
        <line class="facing" x1="${point.x}" y1="${point.y}" x2="${end.x}" y2="${end.y}"></line>
        <text class="unit-label" x="${point.x + size * 0.8}" y="${point.y - size * 0.7}">${escapeHtml(unitLabel(unit))}</text>
        ${statusMarkup}
      </g>`;
    })
    .join("");

  svg.setAttribute("viewBox", `${state.pan.x} ${state.pan.y} ${svg.clientWidth || 800} ${svg.clientHeight || 600}`);
  svg.innerHTML = `<g>${tileMarkup}${terrainIconMarkup}${effectZoneMarkup}${orderRangeMarkup}${objectiveMarkup}${casualtyMarkup}${directionCueMarkup}${maneuverMarkup}${blockingMarkup}${intentMarkup}${fireMarkup}${unitMarkup}</g>`;

  svg.querySelectorAll(".hex, .objective-hitbox").forEach((hex) => {
    hex.addEventListener("pointerenter", (event) => {
      const target = event.currentTarget;
      if (!(target instanceof SVGElement)) return;
      showHexTooltip(projection, coordFromDataset(target), event.clientX, event.clientY);
    });
    hex.addEventListener("pointermove", (event) => {
      const target = event.currentTarget;
      if (!(target instanceof SVGElement)) return;
      showHexTooltip(projection, coordFromDataset(target), event.clientX, event.clientY);
    });
    hex.addEventListener("pointerleave", hideHexTooltip);
  });
}

function renderTerrainIcons(tiles: HexTileProjection[], size: number): string {
  const tilesByKey = new Map(tiles.map((tile) => [coordKey(tile.coord), tile]));
  return tiles.map((tile) => renderTerrainIcon(tile, size, tilesByKey)).join("");
}

function renderTerrainIcon(tile: HexTileProjection, size: number, tilesByKey: Map<string, HexTileProjection>): string {
  const visibility = tile.visibility ?? "visible";
  if (visibility === "unknown") return "";
  const point = axialToPixel(tile.coord, size);
  const scale = size / 8;
  const memoryStyle =
    typeof tile.memoryOpacity === "number"
      ? ` style="--memory-opacity: ${tile.memoryOpacity}"`
      : "";

  if (tile.terrain === "road" || tile.terrain === "bridge" || tile.terrain === "ditch" || tile.terrain === "wall") {
    const rotation = terrainAxisAngle(tile, tilesByKey);
    const icon =
      tile.terrain === "road"
        ? `<path d="M -6 0 L 6 0"></path><path class="terrain-icon-detail" d="M -4 0 L -2 0 M 1 0 L 3 0"></path>`
        : tile.terrain === "bridge"
          ? `<path d="M -6 0 L 6 0"></path><path class="terrain-icon-detail" d="M -5 -3 L -5 3 M -2 -3 L -2 3 M 1 -3 L 1 3 M 4 -3 L 4 3"></path>`
        : tile.terrain === "ditch"
          ? `<path d="M -6 -2 C -2 1 2 -3 6 0"></path><path d="M -6 3 C -2 5 2 1 6 4"></path>`
          : `<rect x="-6" y="-2.5" width="4" height="3"></rect><rect x="-1.5" y="-2.5" width="3.5" height="3"></rect><rect x="2.5" y="-2.5" width="3.5" height="3"></rect><rect x="-3.8" y="1" width="4" height="3"></rect><rect x=".7" y="1" width="4" height="3"></rect>`;
    return `<g class="terrain-icon terrain-icon-${tile.terrain} visibility-${visibility}" transform="translate(${point.x} ${point.y}) rotate(${rotation}) scale(${scale})"${memoryStyle}>${icon}</g>`;
  }

  const icon =
    tile.terrain === "forest"
      ? `<path d="M -5 5 L -2 -4 L 1 5 Z"></path><path d="M 1 5 L 4 -5 L 7 5 Z"></path><path class="terrain-icon-detail" d="M -2 5 L -2 7 M 4 5 L 4 7"></path>`
      : tile.terrain === "water"
        ? `<path d="M -6 -2 C -3 -4 -1 0 2 -2 C 4 -3 5 -2 6 -1"></path><path d="M -6 3 C -3 1 -1 5 2 3 C 4 2 5 3 6 4"></path>`
      : tile.terrain === "grass"
        ? `<path d="M -5 5 C -5 1 -4 -2 -1 -5"></path><path d="M 0 5 C 0 1 1 -2 4 -5"></path><path d="M 5 5 C 4 2 3 0 1 -2"></path>`
        : tile.terrain === "field"
          ? `<circle cx="-3.5" cy="-2.5" r=".8"></circle><circle cx="2.5" cy="-1" r=".8"></circle><circle cx="-1" cy="3" r=".8"></circle>`
          : "";
  if (!icon) return "";
  return `<g class="terrain-icon terrain-icon-${tile.terrain} visibility-${visibility}" transform="translate(${point.x} ${point.y}) scale(${scale})"${memoryStyle}>${icon}</g>`;
}

function terrainAxisAngle(tile: HexTileProjection, tilesByKey: Map<string, HexTileProjection>): number {
  const axes: Array<{ direction: Direction; opposite: Direction }> = [
    { direction: "SE", opposite: "NW" },
    { direction: "N", opposite: "S" },
    { direction: "NE", opposite: "SW" },
  ];
  const bestAxis = axes
    .map((axis) => ({
      direction: axis.direction,
      score:
        matchingTerrainNeighbour(tile, axis.direction, tilesByKey) +
        matchingTerrainNeighbour(tile, axis.opposite, tilesByKey),
    }))
    .sort((a, b) => b.score - a.score)[0]?.direction ?? "SE";
  const vector = directionToPixelVector(bestAxis, 1);
  return (Math.atan2(vector.y, vector.x) * 180) / Math.PI;
}

function matchingTerrainNeighbour(tile: HexTileProjection, direction: Direction, tilesByKey: Map<string, HexTileProjection>): number {
  const neighbour = tilesByKey.get(coordKey(addCoord(tile.coord, directionVectors[direction])));
  if (!neighbour || neighbour.visibility === "unknown") return 0;
  const ownGroup = tile.terrain === "bridge" ? "road" : tile.terrain;
  const neighbourGroup = neighbour.terrain === "bridge" ? "road" : neighbour.terrain;
  return neighbourGroup === ownGroup ? 1 : 0;
}

function renderEffectZones(projection: Projection, size: number): string {
  if (projection.perception.informationMode === "realistic") return "";
  const visibleKeys = new Set(
    projection.map.tiles
      .filter((tile) => tile.visibility !== "unknown")
      .map((tile) => coordKey(tile.coord)),
  );
  return projection.risk.effectZones
    .flatMap((zone) =>
      zone.hexes
        .filter((coord) => visibleKeys.has(coordKey(coord)))
        .map((coord) => {
          const point = axialToPixel(coord, size);
          const blocked = zone.blockedAt && sameCoord(zone.blockedAt, coord);
          const severity = blocked ? ` severity-${zone.severity ?? "low"}` : "";
          return `<polygon class="effect-zone${blocked ? " is-blocked" : ""}${severity}" points="${hexPoints(point, size)}"></polygon>`;
        }),
    )
    .join("");
}

function renderBlockingWarnings(projection: Projection, size: number): string {
  if (projection.perception.informationMode === "realistic") return "";
  return projection.risk.blocking
    .map((warning) => {
      const fromUnit = projection.units.find((unit) => unit.id === warning.unitId);
      const blockingUnit = projection.units.find((unit) => unit.id === warning.blockingUnitId);
      if (!fromUnit || !blockingUnit) return "";
      const from = unitToPixel(fromUnit, size);
      const to = unitToPixel(blockingUnit, size);
      return `<g class="blocking-warning severity-${warning.severity}">
        <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>
        <circle cx="${to.x}" cy="${to.y}" r="${size * 0.75}"></circle>
      </g>`;
    })
    .join("");
}

function renderTacticalManeuverOverlay(projection: Projection, size: number): string {
  const maneuver = projection.activeManeuver;
  if (!maneuver || maneuver.phase === "completed") return "";
  const unitsById = new Map(projection.units.map((unit) => [unit.id, unit]));
  const rings = [
    ...maneuver.coveringUnitIds.map((unitId) => ({ unitId, role: "covering" })),
    ...maneuver.movingUnitIds.map((unitId) => ({ unitId, role: "moving" })),
    ...(projection.casualtyEvacuation?.carrierUnitIds ?? []).map((unitId) => ({ unitId, role: "carrier" })),
  ]
    .map(({ unitId, role }) => {
      const unit = unitsById.get(unitId);
      if (!unit) return "";
      const point = unitToPixel(unit, size);
      return `<circle class="maneuver-ring maneuver-${role}" cx="${point.x}" cy="${point.y}" r="${size * (role === "moving" ? 0.9 : 0.78)}"></circle>`;
    })
    .join("");

  const reinforcement = projection.casualtyEvacuation?.requestedReinforcement?.unitId
    ? unitsById.get(projection.casualtyEvacuation.requestedReinforcement.unitId)
    : undefined;
  const casualty = projection.casualtyEvacuation?.casualtyUnitId
    ? unitsById.get(projection.casualtyEvacuation.casualtyUnitId)
    : undefined;
  const reinforcementPath =
    reinforcement && casualty
      ? (() => {
          const from = unitToPixel(reinforcement, size);
          const to = unitToPixel(casualty, size);
          return `<line class="maneuver-reinforcement-line" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>`;
        })()
      : "";
  const casualtyTeam = projection.casualtyTeam && casualty
    ? (() => {
        const casualtyPoint = unitToPixel(casualty, size);
        const carrierLinks = projection.casualtyTeam.carrierUnitIds
          .map((unitId) => unitsById.get(unitId))
          .filter((unit): unit is UnitProjection => Boolean(unit))
          .map((carrier) => {
            const carrierPoint = unitToPixel(carrier, size);
            return `<line class="casualty-team-link" x1="${carrierPoint.x}" y1="${carrierPoint.y}" x2="${casualtyPoint.x}" y2="${casualtyPoint.y}"></line>`;
          })
          .join("");
        const targetPoint = projection.casualtyTeam.teamTargetPoint
          ? mapPointToPixel(projection.casualtyTeam.teamTargetPoint, size)
          : projection.casualtyTeam.teamTarget
            ? axialToPixel(projection.casualtyTeam.teamTarget, size)
            : undefined;
        const target = targetPoint
          ? `<g class="casualty-team-target casualty-team-${projection.casualtyTeam.teamIntent}">
              <circle cx="${targetPoint.x}" cy="${targetPoint.y}" r="${size * 0.52}"></circle>
              <path d="M ${targetPoint.x - size * 0.36} ${targetPoint.y} L ${targetPoint.x + size * 0.36} ${targetPoint.y} M ${targetPoint.x} ${targetPoint.y - size * 0.36} L ${targetPoint.x} ${targetPoint.y + size * 0.36}"></path>
            </g>`
          : "";
        return `<g class="casualty-team-overlay casualty-team-${projection.casualtyTeam.teamIntent}">${carrierLinks}${target}</g>`;
      })()
    : "";

  const blocked = projection.events
    .filter(
      (event) =>
        projection.time - event.time <= 4 &&
        event.type === "movement_waiting" &&
        (event.payload?.reason === "retreat_cover_missing" ||
          event.payload?.reason === "advance_cover_missing" ||
          event.payload?.reason === "effect_zone_block_risk"),
    )
    .map((event) => {
      const target = event.payload?.target;
      if (!target) return "";
      const point = axialToPixel(target, size);
      return `<polygon class="maneuver-blocked" points="${hexPoints(point, size * 0.92)}"></polygon>`;
    })
    .join("");

  return `<g class="maneuver-overlay">${reinforcementPath}${casualtyTeam}${blocked}${rings}</g>`;
}

function renderFireBursts(projection: Projection, size: number): string {
  const unitsById = new Map(projection.units.map((unit) => [unit.id, unit]));
  return projection.events
    .filter((event) => projection.time - event.time <= FIRE_BURST_VISIBLE_SECONDS)
    .map((event) => {
      if (event.type === "friendly_fire_delivered") {
        const unit = unitsById.get(event.payload?.unitId ?? "");
        if (!unit) return "";
        return renderFireBurstFromUnit(unit, unitsById.get(event.payload?.targetId ?? ""), event.payload?.direction ?? unit.lookDirection, size, "friendly");
      }
      if (event.type === "contact_pressure_emitted") {
        const unit = unitsById.get(event.payload?.unitId ?? "");
        const target = unitsById.get(event.payload?.targetId ?? "");
        if (unit) {
          return renderFireBurstFromUnit(unit, target, unit.lookDirection, size, "enemy");
        }
      }
      if (event.type === "incoming_fire_resolved") {
        const unit = unitsById.get(event.payload?.unitId ?? "");
        const target = unitsById.get(event.payload?.targetId ?? "");
        if (unit) {
          return renderFireBurstFromUnit(unit, target, unit.lookDirection, size, "enemy");
        }
        if (target) {
          const point = unitToPixel(target, size);
          return `<g class="fire-burst fire-burst-enemy"><circle class="fire-impact" cx="${point.x}" cy="${point.y}" r="${size * 0.78}"></circle></g>`;
        }
      }
      return "";
    })
    .join("");
}

function recentFiringUnitIds(projection: Projection): Set<string> {
  return new Set(
    projection.events
      .filter((event) => projection.time - event.time <= FIRE_BURST_VISIBLE_SECONDS)
      .filter(
        (event) =>
          event.type === "friendly_fire_delivered" ||
          event.type === "contact_pressure_emitted" ||
          event.type === "incoming_fire_resolved",
      )
      .map((event) => event.payload?.unitId)
      .filter((unitId): unitId is string => Boolean(unitId)),
  );
}

function renderFireBurstFromUnit(
  unit: UnitProjection,
  target: UnitProjection | undefined,
  direction: Direction,
  size: number,
  tone: "friendly" | "enemy",
): string {
  const from = unitToPixel(unit, size);
  const directionVector = target
    ? { x: unitToPixel(target, size).x - from.x, y: unitToPixel(target, size).y - from.y }
    : directionToPixelVector(direction, size * 2.4);
  const length = Math.hypot(directionVector.x, directionVector.y) || 1;
  const unitVector = { x: directionVector.x / length, y: directionVector.y / length };
  const muzzle = { x: from.x + unitVector.x * size * 0.76, y: from.y + unitVector.y * size * 0.76 };
  const end = {
    x: from.x + unitVector.x * Math.min(length, size * 3.5),
    y: from.y + unitVector.y * Math.min(length, size * 3.5),
  };
  const normal = { x: -unitVector.y, y: unitVector.x };
  const sparkA = { x: muzzle.x + normal.x * size * 0.22, y: muzzle.y + normal.y * size * 0.22 };
  const sparkB = { x: muzzle.x - normal.x * size * 0.22, y: muzzle.y - normal.y * size * 0.22 };
  const className = tone === "friendly" ? "fire-burst-friendly" : "fire-burst-enemy";
  const impact = target ? `<circle class="fire-impact" cx="${unitToPixel(target, size).x}" cy="${unitToPixel(target, size).y}" r="${size * 0.5}"></circle>` : "";
  return `<g class="fire-burst ${className}">
    <line class="fire-trace" x1="${muzzle.x}" y1="${muzzle.y}" x2="${end.x}" y2="${end.y}"></line>
    <path class="fire-flash" d="M ${sparkA.x} ${sparkA.y} L ${muzzle.x + unitVector.x * size * 0.58} ${muzzle.y + unitVector.y * size * 0.58} L ${sparkB.x} ${sparkB.y}"></path>
    ${impact}
  </g>`;
}

function setDirectionCue(target: HexCoord, projection: Projection): { ok: boolean; reason: string; direction: Direction; cue: HexCoord } {
  const direction = directionFromTargetPoint(projection.player.position ?? axialToMapPoint(projection.player.coord), target);
  state.selectedDirection = direction ?? state.selectedDirection ?? projection.activeFormation?.direction ?? projection.player.facing;
  state.directionCue = direction ? target : coordInDirection(projection.player.coord, state.selectedDirection, 4);
  state.directionCuePoint = axialToMapPoint(state.directionCue);
  render();
  return {
    ok: Boolean(direction),
    reason: direction ? "direction_set" : "clicked_current_hex_using_existing_direction",
    direction: state.selectedDirection,
    cue: state.directionCue,
  };
}

function issueFormationOrder(): void {
  const projection = state.projection;
  if (!projection || projection.player.role !== "leader") return;
  send({
    type: "issue_formation_order",
    unitId: projection.player.id,
    target: projection.player.coord,
    formation: state.selectedFormation,
    communication: state.selectedCommunication,
    direction: selectedOrderDirection(projection),
    directionTarget: selectedDirectionTarget(projection),
    directionTargetPoint: selectedDirectionTargetPoint(projection),
    issuedAt: projection.time,
  });
}

function issueForwardOrder(): void {
  const projection = state.projection;
  if (!projection || projection.player.role !== "leader") return;
  const formation = state.selectedFormation === "regroup" ? (projection.activeFormation?.formation ?? "column") : state.selectedFormation;
  send({
    type: "issue_forward_order",
    unitId: projection.player.id,
    formation,
    communication: state.selectedCommunication,
    direction: selectedOrderDirection(projection),
    directionTarget: selectedDirectionTarget(projection),
    directionTargetPoint: selectedDirectionTargetPoint(projection),
    issuedAt: projection.time,
  });
}

function issueAlternatingForwardOrder(): void {
  const projection = state.projection;
  if (!projection || projection.player.role !== "leader") return;
  send({
    type: "issue_alternating_forward_order",
    unitId: projection.player.id,
    communication: state.selectedCommunication,
    direction: selectedOrderDirection(projection),
    directionTarget: selectedDirectionTarget(projection),
    directionTargetPoint: selectedDirectionTargetPoint(projection),
    issuedAt: projection.time,
  });
}

function issueAlternatingRetreatOrder(): void {
  const projection = state.projection;
  if (!projection || projection.player.role !== "leader") return;
  send({
    type: "issue_alternating_retreat_order",
    unitId: projection.player.id,
    communication: state.selectedCommunication,
    direction: selectedOrderDirection(projection),
    directionTarget: selectedDirectionTarget(projection),
    directionTargetPoint: selectedDirectionTargetPoint(projection),
    issuedAt: projection.time,
  });
}

function issueZipperRetreatOrder(side: "left" | "right"): void {
  const projection = state.projection;
  if (!projection || projection.player.role !== "leader") return;
  send({
    type: "issue_zipper_retreat_order",
    unitId: projection.player.id,
    side,
    communication: state.selectedCommunication,
    direction: selectedOrderDirection(projection),
    directionTarget: selectedDirectionTarget(projection),
    directionTargetPoint: selectedDirectionTargetPoint(projection),
    issuedAt: projection.time,
  });
}

function issueHaltOrder(): void {
  const projection = state.projection;
  if (!projection || projection.player.role !== "leader") return;
  send({
    type: "halt_group",
    unitId: projection.player.id,
    issuedAt: projection.time,
  });
}

function issueCasualtyEvacuationOrder(): void {
  const projection = state.projection;
  if (!projection || projection.player.role !== "leader") return;
  const casualty = casualtyForEvacuation(projection);
  const collectionPoint = selectedCasualtyCollectionPoint(projection);
  send({
    type: "start_casualty_evacuation",
    unitId: projection.player.id,
    collectionPointId: collectionPoint?.id,
    casualtyUnitId: casualty?.id,
    issuedAt: projection.time,
  });
}

function casualtyForEvacuation(projection: Projection): UnitProjection | undefined {
  const wounded = projection.units.filter((unit) => unit.side === "friendly" && (unit.posture === "injured" || unit.status.includes("injured")));
  const activeCasualty = projection.casualtyEvacuation?.phase !== "completed"
    ? wounded.find((unit) => unit.id === projection.casualtyEvacuation?.casualtyUnitId)
    : undefined;
  return (
    activeCasualty ??
    wounded.find((unit) => unit.status.includes("primary_casualty")) ??
    wounded.find((unit) => unit.status.includes("evac_pending") || unit.status.includes("being_dragged")) ??
    wounded[0]
  );
}

function selectedOrderDirection(projection: Projection): Direction {
  return state.selectedDirection ?? projection.activeManeuver?.direction ?? projection.activeFormation?.direction ?? projection.player.facing;
}

function casualtyCollectionPointLabel(id: CasualtyCollectionPointId | undefined): string {
  return id === "asa2" ? "ÅSA2" : "ÅSA1";
}

function isCasualtyCollectionPointId(value: string | undefined): value is CasualtyCollectionPointId {
  return value === "asa1" || value === "asa2";
}

function casualtyCollectionPoints(projection: Projection): CasualtyCollectionPointProjection[] {
  const evacuation = projection.casualtyEvacuation;
  if (!evacuation) return [];
  const points = (["asa1", "asa2"] as const)
    .map((id) => evacuation.collectionPoints?.[id])
    .filter((point): point is CasualtyCollectionPointProjection => Boolean(point?.coord));
  if (points.length > 0) return points;
  if (!evacuation.collectionPoint) return [];
  const id = evacuation.collectionPointId ?? evacuation.activeCollectionPointId ?? "asa1";
  return [{
    id,
    label: casualtyCollectionPointLabel(id),
    coord: evacuation.collectionPoint,
    point: evacuation.collectionPointPoint,
  }];
}

function selectedCasualtyCollectionPoint(projection: Projection): CasualtyCollectionPointProjection | undefined {
  const evacuation = projection.casualtyEvacuation;
  if (!evacuation) return undefined;
  const id = evacuation.activeCollectionPointId ?? evacuation.collectionPointId;
  const points = casualtyCollectionPoints(projection);
  return points.find((point) => point.id === id) ?? points[0];
}

function formatCasualtyCollectionPoints(projection: Projection): string {
  const points = casualtyCollectionPoints(projection);
  if (points.length === 0) return "ÅSA: ej satt";
  return points
    .map((point) => `${casualtyCollectionPointLabel(point.id)} ${point.coord.q},${point.coord.r}`)
    .join(" / ");
}

function selectedDirectionTarget(projection: Projection): HexCoord {
  return state.directionCue ?? coordInDirection(projection.player.coord, selectedOrderDirection(projection), 4);
}

function selectedDirectionTargetPoint(projection: Projection): MapPoint {
  return state.directionCuePoint ?? axialToMapPoint(selectedDirectionTarget(projection));
}

function showHexTooltip(projection: Projection, coord: HexCoord, clientX?: number, clientY?: number): void {
  const tooltip = document.querySelector("#hex-tooltip");
  if (!(tooltip instanceof HTMLElement)) return;

  tooltip.innerHTML = hexTooltipMarkup(projection, coord);
  tooltip.hidden = false;
  if (typeof clientX === "number" && typeof clientY === "number") {
    positionHexTooltip(tooltip, clientX, clientY);
  }
}

function hideHexTooltip(): void {
  const tooltip = document.querySelector("#hex-tooltip");
  if (tooltip instanceof HTMLElement) {
    tooltip.hidden = true;
  }
}

function positionHexTooltip(tooltip: HTMLElement, clientX: number, clientY: number): void {
  const width = 280;
  const height = 190;
  const left = clamp(clientX + 14, 8, Math.max(8, window.innerWidth - width - 8));
  const top = clamp(clientY + 14, 8, Math.max(8, window.innerHeight - height - 8));
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hexTooltipMarkup(projection: Projection, coord: HexCoord): string {
  const tile = tileAt(projection, coord);
  const occupants = projection.units.filter((unit) => sameCoord(unit.coord, coord));
  const direction = directionBetween(projection.player.coord, coord) ?? selectedOrderDirection(projection);
  const actionText =
    projection.player.role === "leader"
      ? `Klick: sätt riktning hit (${direction})`
      : "Klick: förflytta till hexen";
  const embodiedActionText =
    projection.player.role === "leader" && isEmbodiedAdvanceActive(projection)
      ? `Klick: förflytta grpc hit; shift-klick: sätt riktning (${direction})`
      : actionText;
  const visibility = tile?.visibility ?? "unknown";
  const known = visibility !== "unknown";
  const terrain = known ? (tile?.terrain ?? "unknown") : "unknown";
  const memoryLine =
    visibility === "visible"
      ? "syns nu"
      : visibility === "memory"
        ? `ihågkommen för ${formatMaybeNumber(tile?.memoryAge)} s sedan`
        : "okänd";
  const unitLine = occupants.length > 0 ? occupants.map((unit) => `${unit.name} (${displayRole(unit)})`).join(", ") : "inga";
  const markerLine = sameCoord(coord, projection.objective.target) ? `mål: ${objectiveTitle(projection.objective.title)}` : undefined;
  const effectUnits = projection.risk.effectZones.filter((zone) => zone.hexes.some((hex) => sameCoord(hex, coord)));
  const blockingHere = projection.risk.blocking.filter((warning) => sameCoord(warning.coord, coord));
  const effectLine =
    effectUnits.length > 0
      ? effectUnits.map((zone) => `${displayUnitId(zone.unitId)} ${zone.lookDirection}`).join(", ")
      : "ingen";
  const blockingLine =
    blockingHere.length > 0
      ? blockingHere
          .map((warning) => `${displayUnitId(warning.blockingUnitId)} blockerar ${displayUnitId(warning.unitId)} (${displaySeverity(warning.severity)})`)
          .join(", ")
      : "nej";

  return `
    <div class="hex-tooltip-title">${escapeHtml(displayTerrain(terrain))} <span>${coord.q},${coord.r}</span></div>
    <dl>
      <dt>sikt</dt><dd>${escapeHtml(memoryLine)}</dd>
      <dt>rörelse</dt><dd>${known ? formatMaybeNumber(tile?.moveCost) : "-"}</dd>
      <dt>skydd</dt><dd>${known ? formatMaybeNumber(tile?.cover) : "-"}</dd>
      <dt>skyl</dt><dd>${known ? formatMaybeNumber(tile?.concealment) : "-"}</dd>
      <dt>risk</dt><dd>${known ? formatMaybeNumber(tile?.exposure) : "-"}</dd>
      <dt>effektzon</dt><dd>${escapeHtml(effectLine)}</dd>
      <dt>blockering</dt><dd>${escapeHtml(blockingLine)}</dd>
      <dt>siktlinje</dt><dd>${known ? (tile?.blocksSight ? "blockerad" : "öppen") : "-"}</dd>
      <dt>enheter</dt><dd>${escapeHtml(unitLine)}</dd>
      ${markerLine ? `<dt>markering</dt><dd>${escapeHtml(markerLine)}</dd>` : ""}
    </dl>
    <div class="hex-tooltip-action">${escapeHtml(embodiedActionText)}</div>
  `;
}

function tileAt(projection: Projection, coord: HexCoord): HexTileProjection | undefined {
  return projection.map.tiles.find((tile) => sameCoord(tile.coord, coord));
}

function coordFromDataset(element: Element): HexCoord {
  return {
    q: Number(element.getAttribute("data-q")),
    r: Number(element.getAttribute("data-r")),
  };
}

function isValidCoord(coord: HexCoord): boolean {
  return Number.isFinite(coord.q) && Number.isFinite(coord.r);
}

function logHexDirectionClick(
  result: { ok: boolean; reason: string; direction: Direction; cue: HexCoord },
  projection: Projection,
  clicked: HexCoord,
): void {
  const payload = {
    clicked,
    direction: result.direction,
    cue: result.cue,
    player: projection.player.coord,
    formation: state.selectedFormation,
    communication: state.selectedCommunication,
    time: projection.time,
  };
  if (result.ok) {
    console.info("[hex-click] direction set", payload);
  } else {
    console.warn("[hex-click] direction fallback", { ...payload, reason: result.reason });
  }
}

function displayTerrain(terrain: string): string {
  const labels: Record<string, string> = {
    field: "Öppen mark",
    grass: "Högt gräs",
    forest: "Skog",
    ditch: "Dike",
    wall: "Stenmur",
    road: "Väg",
    water: "Vatten",
    bridge: "Bro",
    unknown: "Okänt",
  };
  return labels[terrain] ?? terrain;
}

function terrainLegendDetails(): string {
  return [
    "Terrängtecken",
    "Skog: två små träd, blockerar sikt och ger skyl.",
    "Högt gräs: strån, ger skyl men lite skydd.",
    "Dike: blå dubbellinje, ger skydd och skyl.",
    "Vatten: vågor, stoppar rörelse.",
    "Bro: spänger över vatten, snabb men exponerad.",
    "Stenmur: små block, mycket skydd och blockerar sikt.",
    "Väg: ljus linje, snabb men exponerad.",
    "Öppen mark: diskreta prickar, lätt att röra sig över men exponerad.",
    "Bleka tecken är ihågkommen terräng som kan vara inaktuell.",
  ].join("\n");
}

function formatMaybeNumber(value: number | undefined): string {
  return typeof value === "number" ? String(value) : "-";
}

function groupDetails(projection: Projection): string {
  const friendlies = projection.units.filter((unit) => unit.side === "friendly");
  const activeFormation = projection.activeFormation ? displayFormationState(projection.activeFormation) : "ingen";
  const activeManeuver = projection.activeManeuver ? displayManeuverState(projection.activeManeuver) : "ingen";
  const directionCue = state.selectedDirection
    ? `${state.selectedDirection}${state.directionCue ? ` via ${state.directionCue.q},${state.directionCue.r}` : ""}`
    : projection.activeFormation?.direction ?? projection.player.facing;
  const rows = friendlies
    .map((unit) => {
      const target =
        unit.intent.type === "moving" && unit.intent.target
          ? ` -> ${unit.intent.target.q},${unit.intent.target.r}`
          : "";
      const perceived = perceivedUnitFor(projection, unit.id);
      const confidence = perceived ? ` ${displayConfidence(perceived.confidence)}` : "";
      return `${unit.name}: ${displayRole(unit)} ${displayElementPosition(unit)} ${displayIntent(unit.intent.type)}${target}${confidence}`;
    })
    .join("\n");
  const blocking = projection.risk.blocking.length
    ? projection.risk.blocking
        .slice(0, 4)
        .map((warning) => `${displayUnitId(warning.blockingUnitId)} blockerar ${displayUnitId(warning.unitId)} (${displaySeverity(warning.severity)})`)
        .join("\n")
    : "inga blockerade effektzoner";
  const coverage = projection.risk.coverage
    .map((check) =>
      check.covered
        ? `${displayElementName(check.element)} täcker ${check.expectedDirection}`
        : `${displayElementName(check.element)} saknar täckning ${check.expectedDirection}: ${displayReason(check.reason)}`,
    )
    .join("\n");

  return [
    `gruppering: ${activeFormation}`,
    `manöver: ${activeManeuver}`,
    `metod: ${displayCommunication(state.selectedCommunication)}`,
    `riktning: ${directionCue}`,
    `soldater: ${friendlies.length}`,
    `effektzoner:\n${blocking}`,
    `tät-täckning:\n${coverage}`,
    rows,
  ].join("\n");
}

function goalDetails(projection: Projection): string {
  return [
    `scenario: ${projection.scenario.title}`,
    `svårighet: ${displayDifficulty(projection.scenario.difficulty)}`,
    objectiveTitle(projection.objective.title),
    `målhex: ${projection.objective.target.q},${projection.objective.target.r}`,
    `status: ${displayObjectiveStatus(projection.objective.status)}`,
    objectiveCriteria(projection),
    ...trainingGoalDetails(projection),
    objectiveDescription(projection.objective.description),
  ].join("\n");
}

function trainingGoalDetails(projection: Projection): string[] {
  const training = projection.scenario.training;
  if (!training) return [];
  const constraints = trainingConstraintLines(projection.objective.constraints ?? training.constraints);
  return [
    `U3T uppgift: ${training.u3t.uppgiften}`,
    `U3T tid: ${training.u3t.tiden}`,
    constraints.length > 0 ? `gränser: ${constraints.join("; ")}` : "",
  ].filter(Boolean);
}

function orderDetails(projection: Projection): string {
  const current = projection.activeManeuver && projection.activeManeuver.phase !== "completed"
    ? `nu: ${displayManeuverState(projection.activeManeuver)}`
    : projection.activeFormation
      ? `nu: ${displayFormationState(projection.activeFormation)}`
      : projection.player.intent.type === "moving"
        ? `nu: förflyttning mot ${projection.player.intent.target?.q ?? "?"},${projection.player.intent.target?.r ?? "?"}`
        : "nu: stilla";
  const recent = projection.events
    .filter(
      (event) =>
        event.type === "formation_order_issued" ||
        event.type === "formation_advance_started" ||
        event.type === "formation_movement_diagnostic" ||
        event.type === "tactical_maneuver_started" ||
        event.type === "tactical_maneuver_phase_changed" ||
        event.type === "friendly_fire_delivered" ||
        event.type === "suppression_applied" ||
        event.type === "stamina_changed" ||
        event.type === "casualty_reinforcement_requested" ||
        event.type === "casualty_carrier_relieved" ||
        event.type === "order_delivery_resolved" ||
        event.type === "group_halted" ||
        event.type === "movement_waiting" ||
        event.type === "friendly_effect_blocked" ||
        event.type === "tat_coverage_gap" ||
        event.type === "status_report_emitted" ||
        event.type === "contact_pressure_emitted" ||
        event.type === "incoming_fire_resolved" ||
        event.type === "unit_wounded" ||
        event.type === "objective_succeeded" ||
        event.type === "objective_failed" ||
        event.type === "command_accepted" ||
        event.type === "command_rejected",
    )
    .slice(-12)
    .reverse()
    .map(formatOrderEvent)
    .join("\n");

  const heard = projection.perception.heardEvents
    .slice(-4)
    .reverse()
    .map((event) => `${event.time.toFixed(1)} hör ${event.approximateDirection} ${displayClarity(event.clarity)}: ${event.text}`)
    .join("\n");
  const casualtyPoint = selectedCasualtyCollectionPoint(projection);
  const casualty = casualtyPoint && projection.casualtyEvacuation
    ? `sjukvård: ${casualtyCollectionPointLabel(casualtyPoint.id)} ${casualtyPoint.coord.q},${casualtyPoint.coord.r} ${displayCasualtyPhase(projection.casualtyEvacuation.phase)}`
    : "";
  return [current, casualty, recent, heard ? `hörsel/rapporter:\n${heard}` : ""].filter(Boolean).join("\n");
}

function formatOrderEvent(event: EventProjection): string {
  if (event.type === "formation_order_issued") {
    const formation = isFormation(event.payload?.formation) ? displayFormation(event.payload.formation) : "gruppering";
    const communication = isCommunication(event.payload?.communication)
      ? displayCommunication(event.payload.communication)
      : event.payload?.communication ?? "?";
    return `${event.time.toFixed(1)} ${formation} ${event.payload?.direction ?? "?"} via ${communication}`;
  }
  if (event.type === "formation_advance_started") {
    return `${event.time.toFixed(1)} framryckning ${event.payload?.direction ?? "?"} mot ${event.payload?.target?.q ?? "?"},${event.payload?.target?.r ?? "?"}`;
  }
  if (event.type === "formation_movement_diagnostic") {
    return `${event.time.toFixed(1)} diagnos ${displayReason(event.payload?.reason)}`;
  }
  if (event.type === "tactical_maneuver_started" || event.type === "tactical_maneuver_phase_changed") {
    const type = event.payload?.type === "zipper_retreat"
      ? `Blixtlås ${event.payload.zipperSide === "right" ? "höger" : "vänster"}`
      : event.payload?.type === "alternating_forward"
        ? "Växelvis framåt"
      : event.payload?.type === "alternating_retreat"
        ? "Växelvis bakåt"
        : "Manöver";
    return `${event.time.toFixed(1)} ${type} ${event.payload?.direction ?? "?"}: ${event.payload?.movingUnitIds?.length ?? 0} rör sig, ${event.payload?.coveringUnitIds?.length ?? 0} täcker`;
  }
  if (event.type === "friendly_fire_delivered") {
    return `${event.time.toFixed(1)} ${displayUnitId(event.payload?.unitId)} täcker mot ${displayUnitId(event.payload?.targetId)}`;
  }
  if (event.type === "suppression_applied") {
    return `${event.time.toFixed(1)} ${displayUnitId(event.payload?.unitId)} nedhålls av ${displayUnitId(event.payload?.byUnitId)}`;
  }
  if (event.type === "casualty_reinforcement_requested") {
    return `${event.time.toFixed(1)} ${displayUnitId(event.payload?.forUnitId)} ropar förstärkning, ${displayUnitId(event.payload?.unitId)} går`;
  }
  if (event.type === "casualty_carrier_relieved") {
    return `${event.time.toFixed(1)} ${displayUnitId(event.payload?.newCarrierId)} avlöser ${displayUnitId(event.payload?.oldCarrierId)}`;
  }
  if (event.type === "stamina_changed" && Number(event.payload?.delta ?? 0) < 0) {
    return `${event.time.toFixed(1)} ${displayUnitId(event.payload?.unitId)} tappar ork ${displayReason(event.payload?.reason)}`;
  }
  if (event.type === "casualty_collection_point_set") {
    return `${event.time.toFixed(1)} ${casualtyCollectionPointLabel(event.payload?.collectionPointId)} ${event.payload?.target?.q ?? "?"},${event.payload?.target?.r ?? "?"}`;
  }
  if (event.type === "casualty_evacuation_started") {
    return `${event.time.toFixed(1)} omhändertar ${displayUnitId(event.payload?.casualtyUnitId)}`;
  }
  if (event.type === "casualty_drag_started") {
    return `${event.time.toFixed(1)} släpar ${displayUnitId(event.payload?.casualtyUnitId)} med gruppen`;
  }
  if (event.type === "casualty_evacuation_completed") {
    return `${event.time.toFixed(1)} ${displayUnitId(event.payload?.casualtyUnitId)} vid ${casualtyCollectionPointLabel(event.payload?.collectionPointId)}`;
  }
  if (event.type === "order_delivery_resolved") {
    const relayText = event.payload?.relayedBy ? ` via ${displayUnitId(event.payload.relayedBy)}` : "";
    return `${event.time.toFixed(1)} ${displayUnitId(event.payload?.unitId)} ${displayReceptionStatus(event.payload?.status)}${relayText} ${displayReason(event.payload?.reason)}`;
  }
  if (event.type === "group_halted") {
    return `${event.time.toFixed(1)} halt`;
  }
  if (event.type === "movement_waiting") {
    return `${event.time.toFixed(1)} ${displayUnitId(event.payload?.unitId)} väntar ${displayReason(event.payload?.reason)}`;
  }
  if (event.type === "friendly_effect_blocked") {
    return `${event.time.toFixed(1)} ${displayUnitId(event.payload?.blockingUnitId)} blockerar ${displayUnitId(event.payload?.unitId)} ${displaySeverity(event.payload?.severity)}`;
  }
  if (event.type === "tat_coverage_gap") {
    return `${event.time.toFixed(1)} ${displayElementName(event.payload?.element)} saknar täckning ${displayReason(event.payload?.reason)}`;
  }
  if (event.type === "status_report_emitted") {
    return `${event.time.toFixed(1)} ${displayUnitId(event.payload?.sourceUnitId)} rapporterar: ${event.payload?.message ?? ""}`;
  }
  if (event.type === "contact_pressure_emitted") {
    return `${event.time.toFixed(1)} kontakt från ${displayUnitId(event.payload?.unitId)} mot ${displayUnitId(event.payload?.targetId)}`;
  }
  if (event.type === "incoming_fire_resolved") {
    return `${event.time.toFixed(1)} eld mot ${displayUnitId(event.payload?.targetId)} (${event.payload?.roll ?? "?"}/${event.payload?.probability ?? "?"})`;
  }
  if (event.type === "unit_wounded") {
    return `${event.time.toFixed(1)} ${displayUnitId(event.payload?.unitId)} skadad`;
  }
  if (event.type === "objective_succeeded") {
    return `${event.time.toFixed(1)} mål uppnått`;
  }
  if (event.type === "objective_failed") {
    return `${event.time.toFixed(1)} mål misslyckat ${displayReason(event.payload?.reason)}`;
  }
  const command = event.payload?.command;
  const detail = command?.target
    ? ` ${command.target.q},${command.target.r}`
      : command?.direction
        ? ` ${command.direction}`
        : command?.side
          ? ` ${command.side === "right" ? "höger" : "vänster"}`
      : command?.posture
        ? ` ${displayPosture(command.posture)}`
        : command?.formation
          ? ` ${displayFormation(command.formation)}`
          : "";
  return `${event.time.toFixed(1)} ${displayCommandType(command?.type ?? event.type)}${detail}`;
}

function unitDetails(unit: UnitProjection, projection: Projection): string {
  const activity = normalizedActivity(unit);
  const target = `${activity.target.q},${activity.target.r}`;
  const activeFormation = projection.activeFormation ? displayFormationState(projection.activeFormation) : "ingen";
  const activeManeuver = projection.activeManeuver ? displayManeuverState(projection.activeManeuver) : "ingen";
  const directionCue = state.selectedDirection
    ? `${state.selectedDirection}${state.directionCue ? ` via ${state.directionCue.q},${state.directionCue.r}` : ""}`
    : projection.activeFormation?.direction ?? projection.player.facing;
  const order = unit.currentOrderId ? shortOrderId(unit.currentOrderId) : "-";
  const perceived = perceivedUnitFor(projection, unit.id);
  const casualtyTeamLine = casualtyTeamDetailsForUnit(unit, projection);
  const blocking = projection.risk.blocking.filter((warning) => warning.unitId === unit.id || warning.blockingUnitId === unit.id);
  const effectStatus =
    blocking.length > 0
      ? blocking
          .map((warning) =>
            warning.unitId === unit.id
              ? `egen effektzon blockerad av ${displayUnitId(warning.blockingUnitId)} (${displaySeverity(warning.severity)})`
              : `blockerar ${displayUnitId(warning.unitId)} (${displaySeverity(warning.severity)})`,
          )
          .join("; ")
      : "fri";

  return [
    `${unit.name} (${displayRole(unit)})`,
    `del: ${displayElementPosition(unit)}`,
    `hex: ${unit.coord.q},${unit.coord.r}`,
    perceived
      ? `lägesbild: ${displayConfidence(perceived.confidence)} via ${displayPerceptionSource(perceived.source)}${typeof perceived.age === "number" ? `, ${perceived.age}s gammal` : ""}`
      : "lägesbild: okänd",
    perceived?.perceivedCoord ? `uppfattad hex: ${perceived.perceivedCoord.q},${perceived.perceivedCoord.r}` : "uppfattad hex: okänd",
    `uppfattad status: ${displayPerceivedStatus(perceived?.perceivedStatus)}`,
    `status: ${activitySummary(unit)}`,
    casualtyTeamLine,
    `avsikt: ${displayIntent(unit.intent.type)}`,
    `mål: ${target}`,
    `varför stilla: ${stillReason(unit)}`,
    `väg kvar: ${typeof activity.pathLength === "number" ? `${activity.pathLength} hex` : "-"}`,
    `framsteg i nästa hex: ${typeof activity.progress === "number" ? activity.progress : "-"}`,
    `hälsa: ${Math.round(unit.health)}`,
    `ork: ${Math.round(unit.stamina)}`,
    `nedhållning: ${Math.round((unit.suppression ?? 0) * 100)}%`,
    `ställning: ${displayPosture(unit.posture)}`,
    `stridsläge: ${unit.status.length ? unit.status.map(displayUnitStatus).join(", ") : "-"}`,
    `riktning/blick: ${unit.facing}/${unit.lookDirection}`,
    `effektzon: ${effectStatus}`,
    `order: ${order}`,
    `gruppering: ${activeFormation}`,
    `manöver: ${activeManeuver}`,
    `metod: ${displayCommunication(state.selectedCommunication)}`,
    `riktning: ${directionCue}`,
    `målhex: ${projection.objective.target.q},${projection.objective.target.r}`,
    projection.casualtyEvacuation
      ? `${formatCasualtyCollectionPoints(projection)} (${displayCasualtyPhase(projection.casualtyEvacuation.phase)})`
      : "ÅSA: ej satt",
  ].join("\n");
}

function casualtyTeamDetailsForUnit(unit: UnitProjection, projection: Projection): string | undefined {
  const team = projection.casualtyTeam;
  if (!team) return undefined;
  if (team.casualtyUnitId === unit.id) {
    return `bärarlag: skadad, bärare ${team.carrierUnitIds.map(displayUnitId).join(", ")}, ${displayCasualtyTeamMode(team.mode)}, ${displayCasualtyTeamIntent(team)}`;
  }
  if (team.carrierUnitIds.includes(unit.id)) {
    const partner = team.carrierUnitIds.find((unitId) => unitId !== unit.id);
    return `bärarlag: bärare för ${displayUnitId(team.casualtyUnitId)}, partner ${displayUnitId(partner)}, ${displayCasualtyTeamMode(team.mode)}, ${displayCasualtyTeamIntent(team)}`;
  }
  return undefined;
}

function normalizedActivity(unit: UnitProjection): UnitActivityProjection {
  if (unit.activity) return unit.activity;
  if (unit.intent.type === "moving" && unit.intent.target) {
    return {
      state: "moving",
      target: unit.intent.target,
      targetPoint: unit.intent.targetPoint,
      reason: "moving_to_target",
    };
  }
  return {
    state: unit.posture === "injured" || unit.status.includes("injured") ? "injured" : "idle",
    target: unit.coord,
    reason: unit.posture === "injured" || unit.status.includes("injured") ? "injured" : "no_order",
  };
}

function activitySummary(unit: UnitProjection): string {
  const activity = normalizedActivity(unit);
  const target = `${activity.target.q},${activity.target.r}`;
  const reason = displayReason(activity.reason);
  const related = activity.relatedUnitId ? ` (${displayUnitId(activity.relatedUnitId)})` : "";
  if (activity.state === "moving") return `rör sig -> ${target}`;
  if (activity.state === "waiting") return `väntar: ${reason}${related} -> ${target}`;
  if (activity.state === "blocked") return `blockerad: ${reason} -> ${target}`;
  if (activity.state === "injured") return "skadad";
  if (activity.state === "holding") return `håller: ${reason || target}`;
  return `stilla: ${reason || target}`;
}

function shortActivity(unit: UnitProjection): string {
  const activity = normalizedActivity(unit);
  if (unit.status.includes("being_dragged")) return "bärs";
  if (unit.status.includes("evac_helper")) return "bär";
  if (unit.status.includes("reinforcement")) return "först.";
  if (unit.status.includes("forward_moving")) return "framåt";
  if (unit.status.includes("retreat_moving")) return "bakåt";
  if (unit.status.includes("covering_fire")) return "täcker";
  if (unit.status.includes("suppressed")) return "nedh.";
  if (unit.status.includes("tired")) return "trött";
  if (activity.state === "moving") return "→";
  if (activity.state === "waiting") return "väntar";
  if (activity.state === "blocked") return "block";
  if (activity.state === "injured") return "skadad";
  if (activity.state === "holding" && activity.reason !== "no_order") return "håller";
  return "";
}

function displayCasualtyPhase(phase: CasualtyEvacuationProjection["phase"] | undefined): string {
  const labels: Record<CasualtyEvacuationProjection["phase"], string> = {
    idle: "redo",
    moving_to_casualty: "soldater går till skadad",
    dragging: "släpar skadad",
    completed: "omhändertagen",
  };
  return phase ? (labels[phase] ?? phase) : "-";
}

function activityTone(unit: UnitProjection): "ready" | "wait" | "warning" {
  const activity = normalizedActivity(unit);
  if (unit.status.includes("suppressed") || unit.status.includes("tired")) return "warning";
  if (activity.state === "blocked" || activity.state === "injured") return "warning";
  if (activity.state === "waiting" || activity.state === "holding") return "wait";
  return "ready";
}

function stillReason(unit: UnitProjection): string {
  const activity = normalizedActivity(unit);
  if (activity.state === "moving") return "-";
  const reason = displayReason(activity.reason);
  const related = activity.relatedUnitId ? ` (${displayUnitId(activity.relatedUnitId)})` : "";
  return `${reason || displayActivityState(activity.state)}${related}`;
}

function displayActivityState(state: UnitActivityProjection["state"]): string {
  const labels: Record<UnitActivityProjection["state"], string> = {
    moving: "rör sig",
    waiting: "väntar",
    blocked: "blockerad",
    holding: "håller position",
    injured: "skadad",
    idle: "stilla",
  };
  return labels[state] ?? state;
}

function displayFormationState(formation: NonNullable<Projection["activeFormation"]>): string {
  const phase = formation.phase ? displayFormationPhase(formation.phase) : "satt";
  return `${displayFormation(formation.formation)} ${phase} ${formation.direction} ${formation.target.q},${formation.target.r}`;
}

function displayManeuverState(maneuver: TacticalManeuverProjection): string {
  const type = displayManeuverType(maneuver.type, maneuver.zipperSide);
  const moving = maneuver.movingUnitIds.map(displayUnitId).join(", ") || "ingen rör sig";
  const covering = maneuver.coveringUnitIds.length;
  return `${type} ${displayManeuverPhase(maneuver.phase)} ${maneuver.direction} (${moving}; ${covering} täcker)`;
}

function displayManeuverType(type: TacticalManeuverProjection["type"], side?: "left" | "right"): string {
  if (type === "alternating_forward") return "Växelvis framåt";
  if (type === "alternating_retreat") return "Växelvis bakåt";
  if (type === "zipper_retreat") return `Blixtlås ${side === "right" ? "höger" : "vänster"}`;
  if (type === "casualty_recovery") return "Omhändertagande";
  return type;
}

function displayManeuverPhase(phase: TacticalManeuverProjection["phase"]): string {
  const labels: Record<TacticalManeuverProjection["phase"], string> = {
    covering: "täcker",
    moving: "rör sig",
    handoff: "ELDSTÄLLNINGAR",
    completed: "klar",
  };
  return labels[phase] ?? phase;
}

function displayCasualtyTeamMode(mode: CasualtyTeamProjection["mode"]): string {
  const labels: Record<CasualtyTeamProjection["mode"], string> = {
    advancing_with_group: "framåt med gruppen",
    retreating_with_group: "bakåt med gruppen",
    handoff: "avlösning",
  };
  return labels[mode] ?? mode;
}

function displayCasualtyTeamIntent(team: CasualtyTeamProjection): string {
  if (team.teamIntent === "moving") return "rör sig som lag";
  if (team.teamIntent === "blocked") return `blockerad: ${displayReason(team.waitReason)}`;
  if (team.teamIntent === "handoff") return "byter bärare";
  return team.waitReason ? `håller: ${displayReason(team.waitReason)}` : "håller ihop";
}

function displayFormation(formation: Formation): string {
  return formationLabels[formation] ?? formation;
}

function displayFormationPhase(phase: "forming" | "advancing"): string {
  return phase === "forming" ? "grupperar" : "framrycker";
}

function displayCommunication(communication: CommunicationMethod): string {
  return communicationLabels[communication] ?? communication;
}

function objectiveTitle(title: string): string {
  const titles: Record<string, string> = {
    "Move the group to cover": "För gruppen till skydd",
    "Reach the cover point": "Ta dig till skyddspunkten",
  };
  return titles[title] ?? title;
}

function objectiveDescription(description: string): string {
  const descriptions: Record<string, string> = {
    "Issue a formation order and move the group from the exposed start area to the marked cover point.":
      "Ge en formationsorder och för gruppen från den utsatta startplatsen till den markerade skyddspunkten.",
    "Move from your current exposed position to the marked cover point without letting opposing observers build contact pressure.":
      "Förflytta dig från den utsatta startplatsen till den markerade skyddspunkten utan att motståndarobservatörer bygger kontakttryck.",
  };
  return descriptions[description] ?? description;
}

function displayObjectiveStatus(status: string): string {
  const labels: Record<string, string> = {
    active: "pågår",
    succeeded: "lyckades",
    failed: "misslyckades",
    transitioned: "övergick",
  };
  return labels[status] ?? status;
}

function objectiveCriteria(projection: Projection): string {
  if (isCoverToCoverScenarioId(projection.scenario.id)) {
    const constraints = trainingConstraintLines(projection.objective.constraints);
    return ["krav: soldaten inom 1 hex från målhexen", constraints.length > 0 ? `träningsgränser: ${constraints.join("; ")}` : ""]
      .filter(Boolean)
      .join("\n");
  }
  if (projection.scenario.id === "risk_zone_blocking") {
    return "krav: båda stridsdugliga soldater inom 2 hex från målhexen";
  }
  if (projection.scenario.id === "casualty_retreat") {
    const target = selectedCasualtyCollectionPoint(projection)?.coord ?? projection.objective.target;
    const friendlies = projection.units.filter((unit) => unit.side === "friendly");
    const effective = friendlies.filter((unit) => unit.posture !== "injured" && !unit.status.includes("injured"));
    const casualty = projection.units.find((unit) => unit.side === "friendly" && (unit.posture === "injured" || unit.status.includes("injured")));
    const arrived = effective.filter((unit) => hexDistance(unit.coord, target) <= 3).length;
    const required = Math.max(1, Math.ceil(effective.length * 0.75));
    const leaderArrived = Boolean(effective.find((unit) => unit.role === "leader" && hexDistance(unit.coord, target) <= 3));
    const deputyArrived = Boolean(effective.find((unit) => unit.role === "deputy_leader" && hexDistance(unit.coord, target) <= 3));
    const casualtyArrived = casualty ? hexDistance(casualty.coord, target) <= 1 : false;
    return `krav: skadad inom 1 hex från ÅSA, grpc/stf + ${required}/${effective.length} stridsdugliga inom 3 hex (nu ${casualtyArrived ? "skadad vid ÅSA" : "skadad ej framme"}, ${leaderArrived ? "grpc framme" : "grpc ej framme"}, ${deputyArrived ? "stf framme" : "stf ej framme"}, ${arrived}/${effective.length})`;
  }
  const friendlies = projection.units.filter((unit) => unit.side === "friendly");
  const effective = friendlies.filter((unit) => unit.posture !== "injured" && !unit.status.includes("injured"));
  if (effective.length === 0) {
    return "krav: ingen stridsduglig soldat kvar";
  }
  const arrived = effective.filter((unit) => hexDistance(unit.coord, projection.objective.target) <= 3).length;
  const required = Math.max(1, Math.ceil(effective.length * 0.75));
  const leader = effective.find((unit) => unit.role === "leader");
  const leaderArrived = leader ? hexDistance(leader.coord, projection.objective.target) <= 3 : false;
  return `krav: grpc + ${required}/${effective.length} stridsdugliga inom 3 hex (nu ${leaderArrived ? "grpc framme" : "grpc ej framme"}, ${arrived}/${effective.length})`;
}

function isCoverToCoverScenarioId(id: ScenarioId): boolean {
  return id === "cover_to_cover" || id === "cover_to_cover_hasty" || id === "cover_to_cover_observed";
}

function displayReceptionStatus(status: string | undefined): string {
  const labels: Record<string, string> = {
    received: "mottog",
    missed: "missade",
  };
  return status ? (labels[status] ?? status) : "?";
}

function displayReason(reason: string | undefined): string {
  if (!reason) return "";
  const labels: Record<string, string> = {
    issuer: "ordergivare",
    audible_relay: "hörbar orderkedja",
    out_of_voice_range: "utanför röstavstånd",
    visual_relay: "visuell orderkedja",
    out_of_gesture_range: "utanför teckenavstånd",
    no_visual_contact: "ingen visuell kontakt",
    relay_path_unreached: "orderkedjan nådde inte fram",
    formation_order: "ny formationsorder",
    halt_order: "haltorder",
    posture_change: "ändrad kroppsställning",
    formation_motivation: "grupperingsrörelse",
    casualty_evacuation: "omhänderta skadad",
    casualty_collection_requires_leader: "bara gruppchef kan sätta ÅSA",
    casualty_collection_not_passable: "ÅSA är inte framkomlig",
    casualty_evacuation_requires_leader: "bara gruppchef kan omhänderta skadad",
    casualty_collection_missing: "ÅSA saknas",
    no_wounded_soldier: "ingen skadad soldat hittad",
    not_enough_helpers: "för få stridsdugliga hjälpare",
    moving_to_casualty: "går till skadad",
    casualty_drag: "släpas",
    casualty_drag_wait: "inväntar släpning",
    casualty_helper_drag: "hjälper skadad",
    casualty_helper_wait: "hjälper skadad",
    casualty_team_bound: "bärarlagets bound",
    casualty_team_wait: "bärarlaget håller",
    casualty_team_blocked: "bärarlaget hittar inte tre fria hexar",
    casualty_drag_spacing: "håller ihop bärarlaget",
    casualty_reinforcement: "går som förstärkning",
    reinforcement_wait: "väntar på avlösning",
    casualty_exposed: "skadad exponerad",
    unsecured_casualty: "skadad kamrat ej omhändertagen",
    covering_bound: "bärarlaget täcker i denna fas",
    carrier_missing: "bärare saknas",
    handoff_pending: "väntar på avlösning",
    spacing_blocked: "bärarlaget får inte isär/samman",
    alternating_forward_order: "växelvis framåt-order",
    alternating_forward_bound: "växelvis framåt-bound",
    alternating_forward_bound_complete: "framåtbound uppnått",
    advance_cover_missing: "saknar täckande eld framåt",
    effect_zone_block_risk: "riskerar att blockera verkanszon",
    advance_no_path: "ingen framåtväg",
    no_path_to_casualty: "ingen väg till skadad",
    moving_to_order_target: "rör sig mot ordermål",
    moving_to_selected_hex: "rör sig mot vald hex",
    moving_to_target: "rör sig mot mål",
    blocked_by_unit: "blockerad av enhet",
    cohesion_wait: "väntar på sammanhållning",
    neighbour_too_far: "granne för långt bort",
    neighbour_lagging: "granne för långt bak",
    neighbour_separated: "granne saknas i orderkedjan",
    retreat_order: "reträttorder",
    retreat_bound: "reträttbound",
    retreat_bound_complete: "reträttläge uppnått",
    retreat_cover_missing: "saknar täckande eld",
    retreat_no_path: "ingen reträttväg",
    covering_fire: "täcker med eld",
    resting: "återhämtar ork",
    casualty_reached_asa: "skadad och grupp vid ÅSA",
    occupied: "nästa hex upptagen",
    no_path: "ingen framkomlig väg",
    blocked: "blockerad",
    waiting: "väntar",
    embodied_leader_follow_no_path: "ingen väg till gruppchefens nya läge",
    no_candidate: "ingen bättre hex hittad",
    hold_position_best_candidate: "bästa valet är att hålla plats",
    waiting_for_formation: "väntar på att gruppen formerar",
    formation_position_holding: "håller plats i formationen",
    leader_holding: "gruppchefen står still",
    movement_completed: "framkommen och håller plats",
    no_current_order: "saknar aktuell order",
    no_order: "ingen aktiv order",
    injured: "skadad",
    poor_orientation: "fel blickriktning",
    blocked_effect_zone: "effektzon blockerad",
    no_members: "saknar soldater",
    friendly_in_effect_zone: "kamrat i effektzon",
    direct_fire: "direkt eld",
    group_reached_objective: "gruppen nådde målområdet",
    team_reached_objective: "paret nådde målområdet",
    player_reached_objective: "soldaten nådde målet",
    no_effective_friendlies: "ingen stridsduglig kvar",
    time_limit_exceeded: "tidsgräns passerad",
    exposure_threshold_exceeded: "exponeringsgräns passerad",
    cumulative_exposure_exceeded: "riskgräns passerad",
    contact_threshold_exceeded: "kontaktgräns passerad",
    detection_threshold_exceeded: "upptäcktsgräns passerad",
    casualty_threshold_exceeded: "skadegräns passerad",
  };
  return labels[reason] ?? reason.replaceAll("_", " ");
}

function displaySeverity(severity: string | undefined): string {
  const labels: Record<string, string> = {
    high: "hög",
    medium: "medel",
    low: "låg",
  };
  return severity ? (labels[severity] ?? severity) : "-";
}

function displayConfidence(confidence: string | undefined): string {
  const labels: Record<string, string> = {
    high: "säker",
    medium: "trolig",
    low: "osäker",
    unknown: "okänd",
  };
  return confidence ? (labels[confidence] ?? confidence) : "okänd";
}

function displayClarity(clarity: string | undefined): string {
  const labels: Record<string, string> = {
    clear: "tydligt",
    partial: "delvis",
    muffled: "dämpat",
  };
  return clarity ? (labels[clarity] ?? clarity) : "";
}

function displayPerceptionSource(source: string | undefined): string {
  const labels: Record<string, string> = {
    visual: "syn",
    memory: "minne",
    report: "rapport",
    roster: "namnlista",
  };
  return source ? (labels[source] ?? source) : "okänd";
}

function displayPerceivedStatus(status: string | undefined): string {
  const labels: Record<string, string> = {
    ok: "ok",
    possibly_injured: "möjligen skadad",
    injured: "skadad",
    unknown: "okänd",
  };
  return status ? (labels[status] ?? status) : "okänd";
}

function displayIntent(intent: string): string {
  const labels: Record<string, string> = {
    idle: "stilla",
    moving: "förflyttar sig",
  };
  return labels[intent] ?? intent;
}

function displayPosture(posture: string): string {
  const labels: Record<string, string> = {
    standing: "stående",
    crouched: "låg",
    prone: "liggande",
    moving: "i rörelse",
    helping: "hjälper",
    injured: "skadad",
  };
  return labels[posture] ?? posture;
}

function displayUnitStatus(status: string): string {
  const labels: Record<string, string> = {
    alerted: "beredd",
    prepared_position: "förberett skydd",
    in_cover: "i skydd",
    concealed: "i skyl",
    suppressed: "nedhållen",
    covering_fire: "täcker med eld",
    forward_moving: "framåt",
    retreat_moving: "bakåt",
    being_dragged: "bärs",
    evac_helper: "bärare",
    reinforcement: "förstärkning",
    tired: "trött",
    injured: "skadad",
    primary_casualty: "primär skadad",
  };
  return labels[status] ?? status.replaceAll("_", " ");
}

function displayCommandType(type: string): string {
  const labels: Record<string, string> = {
    move_to_hex: "förflytta",
    face_direction: "vänd",
    look_direction: "spana",
    set_posture: "ändra ställning",
    issue_formation_order: "formationsorder",
    issue_forward_order: "framåtorder",
    halt_group: "haltorder",
    issue_alternating_forward_order: "växelvis framåt",
    issue_alternating_retreat_order: "växelvis bakåt",
    issue_zipper_retreat_order: "blixtlås",
    set_casualty_collection_point: "sätt ÅSA",
    start_casualty_evacuation: "omhänderta skadad",
    command_accepted: "order accepterad",
    command_rejected: "order nekad",
  };
  return labels[type] ?? type.replaceAll("_", " ");
}

function displayUnitId(unitId: string | undefined): string {
  if (!unitId) return "enhet";
  const unit = state.projection?.units.find((candidate) => candidate.id === unitId);
  return unit?.name ?? unitId.replaceAll("_", " ");
}

function formatTimelineEvent(event: EventProjection): string {
  if (event.type === "formation_order_issued") {
    const formation = isFormation(event.payload?.formation) ? displayFormation(event.payload.formation) : "gruppering";
    const communication = isCommunication(event.payload?.communication)
      ? displayCommunication(event.payload.communication)
      : event.payload?.communication ?? "?";
    return `order: ${formation} ${event.payload?.direction ?? "?"} via ${communication}`;
  }
  if (event.type === "formation_advance_started") {
    return `framryckning startar ${event.payload?.direction ?? "?"}`;
  }
  if (event.type === "casualty_collection_point_set") {
    return `${casualtyCollectionPointLabel(event.payload?.collectionPointId)} satt ${event.payload?.target?.q ?? "?"},${event.payload?.target?.r ?? "?"}`;
  }
  if (event.type === "casualty_evacuation_started") {
    return `omhändertar ${displayUnitId(event.payload?.casualtyUnitId)}`;
  }
  if (event.type === "casualty_drag_started") {
    return `släpar ${displayUnitId(event.payload?.casualtyUnitId)} med gruppen`;
  }
  if (event.type === "casualty_evacuation_completed") {
    return `${displayUnitId(event.payload?.casualtyUnitId)} vid ${casualtyCollectionPointLabel(event.payload?.collectionPointId)}`;
  }
  if (event.type === "order_delivery_resolved") {
    return `${displayUnitId(event.payload?.unitId)} ${displayReceptionStatus(event.payload?.status)} ${displayReason(event.payload?.reason)}`;
  }
  if (event.type === "group_halted") {
    const reason = displayReason(event.payload?.reason);
    return reason ? `gruppen gör halt: ${reason}` : "gruppen gör halt";
  }
  if (event.type === "movement_started") {
    return `${displayUnitId(event.payload?.unitId)} börjar förflytta`;
  }
  if (event.type === "movement_completed") {
    return `${displayUnitId(event.payload?.unitId)} är framme`;
  }
  if (event.type === "movement_interrupted") {
    return `${displayUnitId(event.payload?.unitId)} avbryter rörelse ${displayReason(event.payload?.reason)}`;
  }
  if (event.type === "movement_blocked") {
    return `${displayUnitId(event.payload?.unitId)} är blockerad`;
  }
  if (event.type === "movement_waiting") {
    return `${displayUnitId(event.payload?.unitId)} väntar ${displayReason(event.payload?.reason)}`;
  }
  if (event.type === "formation_movement_diagnostic") {
    return `diagnos: ${displayReason(event.payload?.reason)}`;
  }
  if (event.type === "tactical_maneuver_started" || event.type === "tactical_maneuver_phase_changed") {
    const type = event.payload?.type === "zipper_retreat"
      ? `blixtlås ${event.payload.zipperSide === "right" ? "höger" : "vänster"}`
      : event.payload?.type === "alternating_forward"
        ? "växelvis framåt"
      : event.payload?.type === "alternating_retreat"
        ? "växelvis bakåt"
        : "manöver";
    return `${type}: ${event.payload?.movingUnitIds?.length ?? 0} rör sig, ${event.payload?.coveringUnitIds?.length ?? 0} täcker`;
  }
  if (event.type === "friendly_fire_delivered") {
    return `${displayUnitId(event.payload?.unitId)} ger täckande eld`;
  }
  if (event.type === "suppression_applied") {
    return `${displayUnitId(event.payload?.unitId)} nedhålls`;
  }
  if (event.type === "stamina_changed" && Number(event.payload?.delta ?? 0) < 0) {
    return `${displayUnitId(event.payload?.unitId)} blir trött`;
  }
  if (event.type === "casualty_reinforcement_requested") {
    return `${displayUnitId(event.payload?.forUnitId)} ropar förstärkning`;
  }
  if (event.type === "casualty_carrier_relieved") {
    return `${displayUnitId(event.payload?.newCarrierId)} avlöser ${displayUnitId(event.payload?.oldCarrierId)}`;
  }
  if (event.type === "friendly_effect_blocked") {
    return `${displayUnitId(event.payload?.blockingUnitId)} blockerar ${displayUnitId(event.payload?.unitId)} (${displaySeverity(event.payload?.severity)})`;
  }
  if (event.type === "tat_coverage_gap") {
    return `${displayElementName(event.payload?.element)} saknar täckning ${displayReason(event.payload?.reason)}`;
  }
  if (event.type === "status_report_emitted") {
    return `${displayUnitId(event.payload?.sourceUnitId)} rapporterar: ${event.payload?.message ?? ""}`;
  }
  if (event.type === "contact_pressure_emitted") {
    return `kontakt från ${displayUnitId(event.payload?.unitId)} mot ${displayUnitId(event.payload?.targetId)}`;
  }
  if (event.type === "incoming_fire_resolved") {
    return `eld mot ${displayUnitId(event.payload?.targetId)} (${event.payload?.roll ?? "?"}/${event.payload?.probability ?? "?"})`;
  }
  if (event.type === "unit_wounded") {
    return `${displayUnitId(event.payload?.unitId)} skadad`;
  }
  if (event.type === "objective_succeeded") {
    return `mål uppnått: ${displayReason(event.payload?.reason)}`;
  }
  if (event.type === "objective_failed") {
    return `mål misslyckat: ${displayReason(event.payload?.reason)}`;
  }
  if (event.type === "command_rejected") {
    const reason = displayReason(event.payload?.reason);
    return reason ? `order nekad: ${reason}` : displayCommandType(event.type);
  }
  if (event.type === "command_accepted") {
    return displayCommandType(event.type);
  }
  if (event.type === "scenario_generated") {
    return "scenario skapat";
  }
  if (event.type === "session_started") {
    return "pass startat";
  }
  return event.type.replaceAll("_", " ");
}

function renderObjectiveMarker(projection: Projection, size: number): string {
  const target = axialToPixel(projection.objective.target, size);
  const player = unitToPixel(projection.player, size);
  const radius = size * 0.95;
  const clickableRadius = size * 1.25;
  const status = projection.objective.status;
  const statusLabel = status === "succeeded" ? "KLART" : status === "failed" ? "MISSLYCKAT" : "MÅL";
  return `<g class="objective objective-${status}">
    <line class="objective-line" x1="${player.x}" y1="${player.y}" x2="${target.x}" y2="${target.y}"></line>
    <circle class="objective-marker" cx="${target.x}" cy="${target.y}" r="${radius}"></circle>
    <line class="objective-marker" x1="${target.x - radius}" y1="${target.y}" x2="${target.x + radius}" y2="${target.y}"></line>
    <line class="objective-marker" x1="${target.x}" y1="${target.y - radius}" x2="${target.x}" y2="${target.y + radius}"></line>
    <circle class="objective-hitbox" cx="${target.x}" cy="${target.y}" r="${clickableRadius}" data-q="${projection.objective.target.q}" data-r="${projection.objective.target.r}"></circle>
    <text class="objective-label" x="${target.x + size * 1.4}" y="${target.y - size * 1.2}">${statusLabel} ${projection.objective.target.q},${projection.objective.target.r}</text>
  </g>`;
}

function renderCasualtyCollectionMarker(projection: Projection, size: number): string {
  const phase = projection.casualtyEvacuation?.phase ?? "idle";
  const activeId = projection.casualtyEvacuation?.activeCollectionPointId ?? projection.casualtyEvacuation?.collectionPointId;
  return casualtyCollectionPoints(projection)
    .map((point) => {
      const target = axialToPixel(point.coord, size);
      const id = point.id ?? "asa1";
      const activeClass = id === activeId ? " is-active" : "";
      return `<g class="casualty-point casualty-${phase} casualty-${id}${activeClass}">
        <circle cx="${target.x}" cy="${target.y}" r="${size * 0.78}"></circle>
        <path d="M ${target.x - size * 0.36} ${target.y} L ${target.x + size * 0.36} ${target.y} M ${target.x} ${target.y - size * 0.36} L ${target.x} ${target.y + size * 0.36}"></path>
        <text x="${target.x + size * 1.05}" y="${target.y + size * 0.25}">${casualtyCollectionPointLabel(id)}</text>
      </g>`;
    })
    .join("");
}

function renderDirectionCue(projection: Projection, size: number): string {
  if (projection.player.role !== "leader") return "";
  const direction = state.selectedDirection;
  if (!direction) return "";

  const from = unitToPixel(projection.player, size);
  const targetCoord = state.directionCue ?? coordInDirection(projection.player.coord, direction, 4);
  const to = state.directionCuePoint ? mapPointToPixel(state.directionCuePoint, size) : axialToPixel(targetCoord, size);
  return `<g class="direction-cue">
    <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>
    <circle cx="${to.x}" cy="${to.y}" r="${size * 0.5}"></circle>
    <text x="${to.x + size * 0.8}" y="${to.y - size * 0.8}">${direction}</text>
  </g>`;
}

function send(command: {
  type: string;
  unitId?: string;
  direction?: string;
  side?: "left" | "right";
  posture?: string;
  target?: HexCoord;
  collectionPointId?: CasualtyCollectionPointId;
  casualtyUnitId?: string;
  directionTarget?: HexCoord;
  directionTargetPoint?: MapPoint;
  formation?: Formation;
  communication?: CommunicationMethod;
  issuedAt: number;
}): void {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN || !command.unitId) return;
  state.socket.send(JSON.stringify({ type: "command", command }));
}

function isFormation(value: string | undefined): value is Formation {
  return formations.includes(value as Formation);
}

function isCommunication(value: string | undefined): value is CommunicationMethod {
  return communications.includes(value as CommunicationMethod);
}

function isScenarioId(value: string | undefined): value is ScenarioId {
  return (
    value === "cover_to_cover" ||
    value === "cover_to_cover_hasty" ||
    value === "cover_to_cover_observed" ||
    value === "risk_zone_blocking" ||
    value === "leader_lost_picture" ||
    value === "casualty_retreat" ||
    value === "river_bridge_crossing" ||
    value === "ditch_line_contact"
  );
}

function isDifficulty(value: string | undefined): value is DifficultyLevel {
  return value === "training" || value === "normal" || value === "realistic";
}

function shortOrderId(orderId: string): string {
  return orderId.split("_order_").at(-1) ?? orderId;
}

function unitLabel(unit: UnitProjection): string {
  if (unit.role === "leader") return "GC";
  if (unit.role === "deputy_leader") return "STF";
  return unit.name.slice(0, 1).toUpperCase();
}

function displayRole(unit: UnitProjection): string {
  if (unit.role === "leader") return "gruppchef";
  if (unit.role === "deputy_leader") return "ställföreträdare";
  if (unit.role === "observer") return "observatör";
  return "soldat";
}

function displayElement(element: UnitProjection["element"]): string {
  if (element === "tat_1") return "tät 1";
  if (element === "tat_2") return "tät 2";
  if (element === "command") return "enskild";
  return "-";
}

function displayElementName(element: string | undefined): string {
  if (element === "tat_1") return "tät 1";
  if (element === "tat_2") return "tät 2";
  if (element === "command") return "enskild";
  return "tät";
}

function displayElementPosition(unit: UnitProjection): string {
  const element = displayElement(unit.element);
  return unit.elementPosition ? `${element} / position ${unit.elementPosition}` : element;
}

function displayScenarioRole(unit: ScenarioTroopPreview): string {
  const role =
    unit.role === "leader"
      ? "gruppchef"
      : unit.role === "deputy_leader"
        ? "stf grpc"
        : unit.role === "observer"
          ? "observatör"
          : "soldat";
  const element =
    unit.element === "tat_1"
      ? "tät 1"
      : unit.element === "tat_2"
        ? "tät 2"
        : unit.element === "command"
          ? "enskild"
          : "";
  return [role, element, unit.elementPosition ? `pos ${unit.elementPosition}` : ""].filter(Boolean).join(" / ");
}

function scenarioLesson(id: ScenarioId): string {
  const lessons: Record<ScenarioId, string> = {
    cover_to_cover: "Enskild rörelse, sikt, skydd och exponering.",
    cover_to_cover_hasty: "Enskild rörelse under tidspress: när fart väger tyngre än skydd.",
    cover_to_cover_observed: "Enskild rörelse genom observerad terräng med hårda exponeringsgränser.",
    risk_zone_blocking: "Två soldater, effektzoner och hur kamrater blockerar varandra.",
    leader_lost_picture: "Gruppchef: riktning, orderkedja, tät, sammanhållning och tappad lägesbild.",
    casualty_retreat: "Skadad under reträtt: ÅSA, växelvis bakåt, blixtlås, bärarlag och täckande eld.",
    river_bridge_crossing: "Flaskhalsar, broövergång och opasserbar terräng.",
    ditch_line_contact: "Sammanhängande diken, skyddad motståndare och gruppsamordning.",
  };
  return lessons[id];
}

function firstOrderHint(scenario: Pick<ScenarioOption, "id" | "recommendedFormation">, difficulty: DifficultyLevel): string {
  if (scenario.id === "cover_to_cover") return "Klicka skyddad terräng, spana med Q/E.";
  if (scenario.id === "cover_to_cover_hasty") return "Välj snabb rutt, bryt exponering när den blir dyr.";
  if (scenario.id === "cover_to_cover_observed") return "Håll låg exponering, använd dike och skog före vägen.";
  if (scenario.id === "risk_zone_blocking") return "Orientera båda soldaterna och undvik blockerad effektzon.";
  if (scenario.id === "casualty_retreat") return "Sätt ÅSA, starta Släpa skadad, ge Växelvis bakåt eller Blixtlås.";
  const formation = displayFormation(scenario.recommendedFormation ?? "line");
  const hint = difficulty === "training" ? "teckenhjälp syns" : difficulty === "normal" ? "tecken utan text" : "kort minne";
  return `Sätt riktning, välj ${formation}, Framåt (${hint}).`;
}

function displayDifficulty(difficulty: DifficultyLevel): string {
  const labels: Record<DifficultyLevel, string> = {
    training: "Träning",
    normal: "Normal",
    realistic: "Realistisk",
  };
  return labels[difficulty] ?? difficulty;
}

function directScenarioHref(scenarioId: ScenarioId, difficulty: DifficultyLevel): string {
  const path = `/scenario/${scenarioUrlSlug(scenarioId)}/${difficultyUrlSlug(difficulty)}`;
  return `${path}?intro=0&game=${encodeURIComponent(state.gameId)}`;
}

function scenarioUrlSlug(scenarioId: ScenarioId): string {
  const slugs: Record<ScenarioId, string> = {
    cover_to_cover: "skydd-till-skydd",
    cover_to_cover_hasty: "skydd-till-skydd-tidspress",
    cover_to_cover_observed: "skydd-till-skydd-observerad",
    risk_zone_blocking: "riskzon",
    leader_lost_picture: "skadad-soldat",
    casualty_retreat: "skadad-retratt",
    river_bridge_crossing: "broovergang",
    ditch_line_contact: "dikeslinjen",
  };
  return slugs[scenarioId] ?? scenarioId;
}

function difficultyUrlSlug(difficulty: DifficultyLevel): string {
  const slugs: Record<DifficultyLevel, string> = {
    training: "easy",
    normal: "normal",
    realistic: "hard",
  };
  return slugs[difficulty] ?? difficulty;
}

function perceivedUnitFor(projection: Projection, unitId: string): PerceivedUnitProjection | undefined {
  return projection.perception.lastKnownUnits.find((unit) => unit.unitId === unitId);
}

function orderRangePixels(size: number): number {
  const range = state.selectedCommunication === "gesture" ? 8 : state.selectedCommunication === "radio" ? 24 : 10;
  return range * size * 1.55;
}

function isEmbodiedAdvanceActive(projection: Projection): boolean {
  return projection.activeFormation?.orderKind === "forward" && projection.activeFormation.phase === "advancing";
}

function setConnection(value: string): void {
  document.querySelector("#connection").textContent = value;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function axialToPixel(coord: HexCoord, size: number): { x: number; y: number } {
  return {
    x: size * Math.sqrt(3) * (coord.q + coord.r / 2),
    y: size * 1.5 * coord.r,
  };
}

function axialToMapPoint(coord: HexCoord): MapPoint {
  return {
    x: Math.sqrt(3) * (coord.q + coord.r / 2),
    y: 1.5 * coord.r,
  };
}

function unitToPixel(unit: UnitProjection, size: number): { x: number; y: number } {
  return unit.position ? mapPointToPixel(unit.position, size) : axialToPixel(unit.coord, size);
}

function mapPointToPixel(point: MapPoint, size: number): { x: number; y: number } {
  return {
    x: point.x * size,
    y: point.y * size,
  };
}

function pixelToHex(point: { x: number; y: number }, size: number): HexCoord {
  return mapPointToHex({
    x: point.x / size,
    y: point.y / size,
  });
}

function mapPointToHex(point: MapPoint): HexCoord {
  const q = (Math.sqrt(3) / 3) * point.x - point.y / 3;
  const r = (2 / 3) * point.y;
  return cubeRound({ x: q, y: -q - r, z: r });
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

function directionToPixelVector(direction: Direction, length: number): { x: number; y: number } {
  const point = axialToMapPoint(directionVectors[direction]);
  const pointLength = Math.hypot(point.x, point.y) || 1;
  return {
    x: (point.x / pointLength) * length,
    y: (point.y / pointLength) * length,
  };
}

function coordInDirection(from: HexCoord, direction: Direction, distance: number): HexCoord {
  let next = from;
  for (let step = 0; step < distance; step += 1) {
    next = addCoord(next, directionVectors[direction]);
  }
  return next;
}

function directionBetween(from: HexCoord, to: HexCoord): Direction | undefined {
  if (from.q === to.q && from.r === to.r) {
    return undefined;
  }
  return directions
    .map((direction) => ({
      direction,
      distance: hexDistance(addCoord(from, directionVectors[direction]), to),
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.direction;
}

function directionFromTargetPoint(from: MapPoint, target: HexCoord): Direction | undefined {
  const targetPoint = axialToMapPoint(target);
  const delta = { x: targetPoint.x - from.x, y: targetPoint.y - from.y };
  const length = Math.hypot(delta.x, delta.y);
  if (length < 0.05) {
    return undefined;
  }
  const vector = { x: delta.x / length, y: delta.y / length };
  return directions
    .map((direction) => {
      const directionPoint = axialToMapPoint(directionVectors[direction]);
      const directionLength = Math.hypot(directionPoint.x, directionPoint.y) || 1;
      return {
        direction,
        dot: vector.x * (directionPoint.x / directionLength) + vector.y * (directionPoint.y / directionLength),
      };
    })
    .sort((a, b) => b.dot - a.dot)[0]?.direction;
}

function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = -a.q - a.r - (-b.q - b.r);
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
}

function addCoord(a: HexCoord, b: HexCoord): HexCoord {
  return { q: a.q + b.q, r: a.r + b.r };
}

function sameCoord(a: HexCoord, b: HexCoord): boolean {
  return a.q === b.q && a.r === b.r;
}

function coordKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    };
    return entities[char] ?? char;
  });
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/\n/g, "&#10;");
}

function cssIdentifier(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "-");
}

function hexPoints(center: { x: number; y: number }, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    points.push(`${center.x + size * Math.cos(angle)},${center.y + size * Math.sin(angle)}`);
  }
  return points.join(" ");
}
