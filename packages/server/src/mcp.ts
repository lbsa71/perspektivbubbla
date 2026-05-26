import { type IncomingMessage, type ServerResponse } from "node:http";

import {
  advanceSession,
  createPhaseOneSession,
  dispatchCommand,
  hexDistance,
  listScenarioOptions,
  projectSession,
  type CommunicationMethod,
  type DifficultyLevel,
  type Direction,
  type DomainEvent,
  type Formation,
  type HexCoord,
  type PlayerCommand,
  type ProjectedHexTile,
  type ProjectedUnit,
  type Projection,
  type ScenarioId,
  type Session,
} from "../../core/src/index.ts";

export const MCP_PATH = "/mcp";

const MCP_PROTOCOL_VERSION = "2025-11-25";
const SUPPORTED_PROTOCOL_VERSIONS = [MCP_PROTOCOL_VERSION, "2025-06-18", "2025-03-26"];
const DIRECTIONS: Direction[] = ["N", "NE", "SE", "S", "SW", "NW"];
const FORMATIONS: Formation[] = ["column", "line", "file", "wedge", "dispersed", "regroup"];
const COMMUNICATION_METHODS: CommunicationMethod[] = ["voice", "gesture", "radio"];
const DIFFICULTIES: DifficultyLevel[] = ["training", "normal", "realistic"];
const SCENARIO_IDS: ScenarioId[] = [
  "cover_to_cover",
  "cover_to_cover_hasty",
  "cover_to_cover_observed",
  "risk_zone_blocking",
  "leader_lost_picture",
  "casualty_retreat",
  "river_bridge_crossing",
  "ditch_line_contact",
];
const POSTURES = ["standing", "crouched", "prone"] as const;
const DEFAULT_GAME_ID = "main";

type JsonObject = Record<string, unknown>;
type JsonRpcId = string | number | null;

export type SessionController = {
  getSession: (gameId?: string) => Session;
  setSession: (gameId: string, session: Session) => void;
};

type McpRequestContext = {
  controller: SessionController;
  defaultGameId: string;
};

type JsonRpcMessage = {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: unknown;
};

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent: JsonObject;
  isError: boolean;
};

class McpProtocolError extends Error {
  readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }
}

type ObservationDetail = "summary" | "visible_map" | "full_projection";
type ObservationRole = "player" | "observer";

export async function handleMcpHttpRequest(
  request: IncomingMessage,
  response: ServerResponse,
  controller: SessionController,
): Promise<void> {
  const context: McpRequestContext = {
    controller,
    defaultGameId: gameIdFromRequest(request),
  };

  if (!isAllowedOrigin(request)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  if (request.method === "OPTIONS") {
    sendOptions(response, request);
    return;
  }

  if (request.method === "GET" || request.method === "DELETE") {
    response.writeHead(405, {
      allow: "POST, OPTIONS",
      "content-type": "application/json",
      ...corsHeaders(request),
    });
    response.end(JSON.stringify({ error: "MCP endpoint accepts POST requests" }));
    return;
  }

  if (request.method !== "POST") {
    sendText(response, 405, "Method not allowed");
    return;
  }

  const parsed = await readJsonBody(request);
  if (!parsed.ok) {
    sendJson(response, jsonRpcError(null, -32700, "Parse error"), 400, request);
    return;
  }

  const input = parsed.value;
  const messages = Array.isArray(input) ? input : [input];
  if (messages.length === 0) {
    sendJson(response, jsonRpcError(null, -32600, "Invalid Request"), 400, request);
    return;
  }

  const responses = await Promise.all(messages.map((message) => handleJsonRpcMessage(message, context)));
  const requestResponses = responses.filter((message): message is JsonObject => message !== undefined);

  if (requestResponses.length === 0) {
    response.writeHead(202, corsHeaders(request));
    response.end();
    return;
  }

  sendJson(response, Array.isArray(input) ? requestResponses : requestResponses[0], 200, request);
}

async function handleJsonRpcMessage(message: unknown, context: McpRequestContext): Promise<JsonObject | undefined> {
  if (!isObject(message)) {
    return jsonRpcError(null, -32600, "Invalid Request");
  }

  const rpc = message as JsonRpcMessage;
  const id = isJsonRpcId(rpc.id) ? rpc.id : null;
  if (rpc.jsonrpc !== "2.0" || typeof rpc.method !== "string") {
    return jsonRpcError(id, -32600, "Invalid Request");
  }

  if (rpc.id === undefined) {
    return handleNotification(rpc);
  }

  try {
    switch (rpc.method) {
      case "initialize":
        return jsonRpcResult(id, initializeResult(rpc.params));
      case "ping":
        return jsonRpcResult(id, {});
      case "tools/list":
        return jsonRpcResult(id, { tools: MCP_TOOLS });
      case "tools/call":
        return jsonRpcResult(id, await callMcpTool(rpc.params, context));
      default:
        return jsonRpcError(id, -32601, `Method not found: ${rpc.method}`);
    }
  } catch (error) {
    if (error instanceof McpProtocolError) {
      return jsonRpcError(id, error.code, error.message);
    }
    return jsonRpcError(id, -32603, error instanceof Error ? error.message : "Internal error");
  }
}

function handleNotification(_message: JsonRpcMessage): undefined {
  return undefined;
}

function initializeResult(params: unknown): JsonObject {
  const requestedVersion = isObject(params) && typeof params.protocolVersion === "string" ? params.protocolVersion : undefined;
  const protocolVersion = requestedVersion && SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion)
    ? requestedVersion
    : MCP_PROTOCOL_VERSION;

  return {
    protocolVersion,
    capabilities: {
      tools: {
        listChanged: false,
      },
    },
    serverInfo: {
      name: "perspektivbubbla",
      title: "Perspektivbubbla Game Controller",
      version: "0.1.0",
      description: "Local MCP sidecar for observing and commanding the backend-authoritative Perspektivbubbla game session.",
    },
    instructions:
      "Use game_start_session to choose a scenario, game_observe to read the current perceived state, command tools such as game_move_to_hex or game_issue_formation_order to act, and game_advance_time to let the simulation progress.",
  };
}

async function callMcpTool(params: unknown, context: McpRequestContext): Promise<ToolResult> {
  const request = asObject(params);
  const name = request.name;
  if (typeof name !== "string" || name.length === 0) {
    throw new McpProtocolError(-32602, "tools/call requires params.name");
  }
  const args = asObject(request.arguments);

  if (!MCP_TOOLS.some((tool) => tool.name === name)) {
    throw new McpProtocolError(-32602, `Unknown tool: ${name}`);
  }

  try {
    const structuredContent = executeTool(name, args, context);
    return {
      content: [{ type: "text", text: resultText(name, structuredContent) }],
      structuredContent,
      isError: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool failed";
    return {
      content: [{ type: "text", text: message }],
      structuredContent: { error: message },
      isError: true,
    };
  }
}

function executeTool(name: string, args: JsonObject, context: McpRequestContext): JsonObject {
  switch (name) {
    case "game_list_scenarios":
      return {
        scenarios: listScenarioOptions(),
        difficulties: DIFFICULTIES.map((id) => ({ id })),
      };
    case "game_start_session":
      return startSession(args, context);
    case "game_observe": {
      const gameId = getGameId(args, context);
      return {
        observation: observe(context.controller.getSession(gameId), args, gameId),
      };
    }
    case "game_move_to_hex":
      return dispatchToolCommand(context, args, (session) => ({
        type: "move_to_hex",
        unitId: getUnitId(args, session),
        target: getHex(args),
        issuedAt: getIssuedAt(args, session),
      }));
    case "game_face_direction":
      return dispatchToolCommand(context, args, (session) => ({
        type: "face_direction",
        unitId: getUnitId(args, session),
        direction: getDirection(args, "direction"),
        issuedAt: getIssuedAt(args, session),
      }));
    case "game_look_direction":
      return dispatchToolCommand(context, args, (session) => ({
        type: "look_direction",
        unitId: getUnitId(args, session),
        direction: getDirection(args, "direction"),
        issuedAt: getIssuedAt(args, session),
      }));
    case "game_set_posture":
      return dispatchToolCommand(context, args, (session) => ({
        type: "set_posture",
        unitId: getUnitId(args, session),
        posture: getEnum(args, "posture", POSTURES),
        issuedAt: getIssuedAt(args, session),
      }));
    case "game_issue_formation_order":
      return dispatchToolCommand(context, args, (session) => ({
        type: "issue_formation_order",
        unitId: getUnitId(args, session),
        target: getHex(args),
        formation: getEnum(args, "formation", FORMATIONS),
        communication: getOptionalEnum(args, "communication", COMMUNICATION_METHODS) ?? "voice",
        direction: getOptionalEnum(args, "direction", DIRECTIONS),
        directionTarget: getOptionalHex(args, "directionTargetQ", "directionTargetR"),
        issuedAt: getIssuedAt(args, session),
      }));
    case "game_issue_forward_order":
      return dispatchToolCommand(context, args, (session) => ({
        type: "issue_forward_order",
        unitId: getUnitId(args, session),
        formation: getOptionalEnum(args, "formation", FORMATIONS) ?? "line",
        communication: getOptionalEnum(args, "communication", COMMUNICATION_METHODS) ?? "voice",
        direction: getOptionalEnum(args, "direction", DIRECTIONS),
        directionTarget: getOptionalHex(args, "directionTargetQ", "directionTargetR"),
        issuedAt: getIssuedAt(args, session),
      }));
    case "game_issue_alternating_forward_order":
      return dispatchToolCommand(context, args, (session) => ({
        type: "issue_alternating_forward_order",
        unitId: getUnitId(args, session),
        communication: getOptionalEnum(args, "communication", COMMUNICATION_METHODS) ?? "voice",
        direction: getDirection(args, "direction"),
        directionTarget: getOptionalHex(args, "directionTargetQ", "directionTargetR"),
        issuedAt: getIssuedAt(args, session),
      }));
    case "game_halt_group":
      return dispatchToolCommand(context, args, (session) => ({
        type: "halt_group",
        unitId: getUnitId(args, session),
        issuedAt: getIssuedAt(args, session),
      }));
    case "game_advance_time":
      return advanceTime(args, context);
    default:
      throw new Error(`Unhandled tool: ${name}`);
  }
}

function startSession(args: JsonObject, context: McpRequestContext): JsonObject {
  const gameId = getGameId(args, context);
  const scenarioId = getOptionalEnum(args, "scenarioId", SCENARIO_IDS) ?? "leader_lost_picture";
  const difficulty = getOptionalEnum(args, "difficulty", DIFFICULTIES) ?? "training";
  const seed = getOptionalString(args, "seed") ?? `${gameId}:${scenarioId}:${difficulty}`;
  const next = createPhaseOneSession({ scenarioId, difficulty, seed });
  context.controller.setSession(gameId, next);
  return {
    observation: observe(next, args, gameId),
  };
}

function dispatchToolCommand(
  context: McpRequestContext,
  args: JsonObject,
  buildCommand: (session: Session) => PlayerCommand,
): JsonObject {
  const gameId = getGameId(args, context);
  const before = context.controller.getSession(gameId);
  const beforeEvents = before.events.length;
  const command = buildCommand(before);
  const next = dispatchCommand(before, command);
  context.controller.setSession(gameId, next);
  return {
    gameId,
    command,
    events: compactEvents(next.events.slice(beforeEvents)),
    observation: observe(next, args, gameId),
  };
}

function advanceTime(args: JsonObject, context: McpRequestContext): JsonObject {
  const gameId = getGameId(args, context);
  const requestedSeconds = getOptionalNumber(args, "seconds") ?? 1;
  const requestedStep = getOptionalNumber(args, "stepSeconds") ?? 0.2;
  const seconds = clamp(requestedSeconds, 0, 60);
  const stepSeconds = clamp(requestedStep, 0.05, 5);
  const before = context.controller.getSession(gameId);
  const beforeEvents = before.events.length;
  let next = before;
  let remaining = seconds;

  while (remaining > 0) {
    const step = Math.min(stepSeconds, remaining);
    next = advanceSession(next, step);
    remaining = Math.max(0, remaining - step);
  }

  context.controller.setSession(gameId, next);
  return {
    gameId,
    advancedSeconds: seconds,
    stepSeconds,
    events: compactEvents(next.events.slice(beforeEvents)),
    observation: observe(next, args, gameId),
  };
}

function observe(session: Session, args: JsonObject, gameId: string): JsonObject {
  const role = getOptionalEnum(args, "role", ["player", "observer"] as const) ?? "player";
  const detail = getOptionalEnum(args, "detail", ["summary", "visible_map", "full_projection"] as const) ?? "summary";
  const projection = projectSession(session, role);
  if (detail === "full_projection") {
    return { gameId, projection };
  }
  return compactObservation(projection, role, detail, gameId);
}

function compactObservation(projection: Projection, role: ObservationRole, detail: ObservationDetail, gameId: string): JsonObject {
  const visibleTiles = projection.map.tiles.filter((tile) => tile.visibility === "visible").map(compactTile);
  const rememberedTiles = detail === "visible_map"
    ? projection.map.tiles.filter((tile) => tile.visibility === "memory").map(compactTile)
    : undefined;

  return {
    sessionId: projection.sessionId,
    gameId,
    time: projection.time,
    role,
    scenario: {
      id: projection.scenario.id,
      title: projection.scenario.title,
      difficulty: projection.scenario.difficulty,
      recommendedFormation: projection.scenario.recommendedFormation,
      training: projection.scenario.training,
    },
    objective: {
      title: projection.objective.title,
      description: projection.objective.description,
      status: projection.objective.status,
      target: projection.objective.target,
      distanceHexes: hexDistance(projection.player.coord, projection.objective.target),
      constraints: projection.objective.constraints,
    },
    player: compactUnit(projection.player),
    units: projection.units.filter((unit) => unit.side === "friendly").map(compactUnit),
    activeFormation: projection.activeFormation,
    map: {
      width: projection.map.width,
      height: projection.map.height,
      hexSizeMeters: projection.map.hexSizeMeters,
      visibleHexes: projection.map.visibleHexes,
      visibleTiles,
      rememberedTiles,
    },
    risk: projection.risk,
    perception: projection.perception,
    aar: projection.aar.u3t ? { u3t: projection.aar.u3t } : undefined,
    recentEvents: compactEvents(projection.events.slice(-12)),
    commandHints: {
      directions: DIRECTIONS,
      formations: FORMATIONS,
      communicationMethods: COMMUNICATION_METHODS,
      postures: POSTURES,
      defaultUnitId: projection.player.id,
    },
  };
}

function compactUnit(unit: ProjectedUnit): JsonObject {
  return {
    id: unit.id,
    name: unit.name,
    side: unit.side,
    role: unit.role,
    element: unit.element,
    coord: unit.coord,
    facing: unit.facing,
    lookDirection: unit.lookDirection,
    posture: unit.posture,
    health: unit.health,
    stamina: unit.stamina,
    stress: unit.stress,
    status: unit.status,
    activity: unit.activity,
  };
}

function compactTile(tile: ProjectedHexTile): JsonObject {
  return {
    coord: tile.coord,
    terrain: tile.terrain,
    moveCost: tile.moveCost,
    cover: tile.cover,
    concealment: tile.concealment,
    blocksSight: tile.blocksSight,
    exposure: tile.exposure,
    visibility: tile.visibility,
    memoryAge: tile.memoryAge,
  };
}

function compactEvents(events: DomainEvent[]): JsonObject[] {
  return events.map((event) => ({
    id: event.id,
    sequence: event.sequence,
    time: event.time,
    type: event.type,
    payload: event.payload,
  }));
}

function resultText(name: string, structuredContent: JsonObject): string {
  if (name === "game_list_scenarios") {
    const scenarios = Array.isArray(structuredContent.scenarios) ? structuredContent.scenarios.length : 0;
    return `Listed ${scenarios} playable scenarios.`;
  }

  const observation = asObject(structuredContent.observation);
  if (isObject(observation.objective) && isObject(observation.player)) {
    const objective = observation.objective as { status?: unknown; distanceHexes?: unknown };
    const player = observation.player as { id?: unknown; coord?: unknown };
    const coord = isObject(player.coord) ? player.coord as HexCoord : undefined;
    const position = coord ? `${coord.q},${coord.r}` : "unknown";
    return `Time ${formatNumber(observation.time)}. ${String(player.id ?? "player")} at ${position}. Objective ${String(objective.status ?? "unknown")}, distance ${String(objective.distanceHexes ?? "?")} hexes.`;
  }

  return `${name} completed.`;
}

function getUnitId(args: JsonObject, session: Session): string {
  const unitId = getOptionalString(args, "unitId") ?? session.world.units.find((unit) => unit.side === "friendly")?.id ?? session.world.units[0]?.id;
  if (!unitId) {
    throw new Error("session has no controllable units");
  }
  return unitId;
}

function getGameId(args: JsonObject, context: McpRequestContext): string {
  return normalizeGameId(getOptionalString(args, "gameId") ?? context.defaultGameId);
}

function getHex(args: JsonObject): HexCoord {
  return {
    q: getInteger(args, "q"),
    r: getInteger(args, "r"),
  };
}

function getOptionalHex(args: JsonObject, qKey: string, rKey: string): HexCoord | undefined {
  const q = getOptionalInteger(args, qKey);
  const r = getOptionalInteger(args, rKey);
  if (q === undefined && r === undefined) return undefined;
  if (q === undefined || r === undefined) {
    throw new Error(`${qKey} and ${rKey} must be provided together`);
  }
  return { q, r };
}

function getDirection(args: JsonObject, key: string): Direction {
  return getEnum(args, key, DIRECTIONS);
}

function getIssuedAt(args: JsonObject, session: Session): number {
  return getOptionalNumber(args, "issuedAt") ?? session.world.time;
}

function getString(args: JsonObject, key: string): string {
  const value = args[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${key} must be a non-empty string`);
  }
  return value;
}

function getOptionalString(args: JsonObject, key: string): string | undefined {
  const value = args[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${key} must be a non-empty string`);
  }
  return value;
}

function getInteger(args: JsonObject, key: string): number {
  const value = args[key];
  if (!Number.isInteger(value)) {
    throw new Error(`${key} must be an integer`);
  }
  return Number(value);
}

function getOptionalInteger(args: JsonObject, key: string): number | undefined {
  const value = args[key];
  if (value === undefined) return undefined;
  if (!Number.isInteger(value)) {
    throw new Error(`${key} must be an integer`);
  }
  return Number(value);
}

function getOptionalNumber(args: JsonObject, key: string): number | undefined {
  const value = args[key];
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${key} must be a finite number`);
  }
  return value;
}

function getEnum<const T extends string>(args: JsonObject, key: string, allowed: readonly T[]): T {
  const value = args[key];
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${key} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

function getOptionalEnum<const T extends string>(args: JsonObject, key: string, allowed: readonly T[]): T | undefined {
  if (args[key] === undefined) return undefined;
  return getEnum(args, key, allowed);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatNumber(value: unknown): string {
  return typeof value === "number" ? value.toFixed(1) : "?";
}

function asObject(value: unknown): JsonObject {
  return isObject(value) ? value : {};
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJsonRpcId(value: unknown): value is JsonRpcId {
  return value === null || typeof value === "string" || typeof value === "number";
}

function jsonRpcResult(id: JsonRpcId, result: JsonObject): JsonObject {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

function jsonRpcError(id: JsonRpcId, code: number, message: string, data?: unknown): JsonObject {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data }),
    },
  };
}

function isAllowedOrigin(request: IncomingMessage): boolean {
  const origin = request.headers.origin;
  if (origin === undefined) return true;
  if (Array.isArray(origin)) {
    return origin.every(isLocalOrigin);
  }
  return isLocalOrigin(origin);
}

function gameIdFromRequest(request: IncomingMessage): string {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  return normalizeGameId(requestUrl.searchParams.get("game") ?? requestUrl.searchParams.get("gameId") ?? requestUrl.searchParams.get("g"));
}

function normalizeGameId(value: string | null | undefined): string {
  const normalized = (value ?? "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 64);
  return normalized || DEFAULT_GAME_ID;
}

function isLocalOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1" || url.hostname === "[::1]");
  } catch {
    return false;
  }
}

function corsHeaders(request: IncomingMessage): Record<string, string> {
  const origin = typeof request.headers.origin === "string" && isLocalOrigin(request.headers.origin)
    ? request.headers.origin
    : undefined;
  return {
    ...(origin ? { "access-control-allow-origin": origin } : {}),
    "access-control-allow-headers": "content-type, accept, mcp-session-id, mcp-protocol-version, mcp-method, mcp-name",
    "access-control-allow-methods": "POST, OPTIONS",
  };
}

function sendOptions(response: ServerResponse, request: IncomingMessage): void {
  response.writeHead(204, corsHeaders(request));
  response.end();
}

function sendText(response: ServerResponse, status: number, text: string): void {
  response.writeHead(status, { "content-type": "text/plain" });
  response.end(text);
}

function sendJson(response: ServerResponse, value: unknown, status: number, request: IncomingMessage): void {
  response.writeHead(status, { "content-type": "application/json", ...corsHeaders(request) });
  response.end(JSON.stringify(value));
}

function readJsonBody(request: IncomingMessage): Promise<{ ok: true; value: unknown } | { ok: false }> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8").trim();
        resolve({ ok: true, value: text ? JSON.parse(text) : undefined });
      } catch {
        resolve({ ok: false });
      }
    });
    request.on("error", () => resolve({ ok: false }));
  });
}

const MCP_TOOLS: JsonObject[] = [
  {
    name: "game_list_scenarios",
    title: "List Scenarios",
    description: "List playable scenarios and difficulty ids for Perspektivbubbla.",
    inputSchema: objectSchema({}),
    annotations: { readOnlyHint: true },
  },
  {
    name: "game_start_session",
    title: "Start Game Session",
    description: "Start or reset the backend game session for a scenario and return the initial agent observation.",
    inputSchema: objectSchema({
      scenarioId: enumSchema(SCENARIO_IDS, "Scenario id to play."),
      difficulty: enumSchema(DIFFICULTIES, "Information and assistance level."),
      seed: { type: "string", description: "Optional deterministic seed." },
      gameId: { type: "string", description: "Optional backend game room id. Defaults to the /mcp?game= query or main." },
      role: enumSchema(["player", "observer"], "Projection role for the returned observation."),
      detail: enumSchema(["summary", "visible_map", "full_projection"], "Observation detail level to return."),
    }),
  },
  {
    name: "game_observe",
    title: "Observe Game State",
    description: "Read the current backend session as a compact agent-friendly observation.",
    inputSchema: objectSchema({
      gameId: { type: "string", description: "Optional backend game room id. Defaults to the /mcp?game= query or main." },
      role: enumSchema(["player", "observer"], "Use player for perceived state, observer for full known state."),
      detail: enumSchema(["summary", "visible_map", "full_projection"], "Observation detail level to return."),
    }),
    annotations: { readOnlyHint: true },
  },
  {
    name: "game_move_to_hex",
    title: "Move To Hex",
    description: "Issue a backend-owned movement command to a target hex for a friendly unit.",
    inputSchema: commandSchema({
      q: integerSchema("Target axial q coordinate."),
      r: integerSchema("Target axial r coordinate."),
    }, ["q", "r"]),
  },
  {
    name: "game_face_direction",
    title: "Face Direction",
    description: "Turn a friendly unit body/facing direction.",
    inputSchema: commandSchema({
      direction: enumSchema(DIRECTIONS, "New facing direction."),
    }, ["direction"]),
  },
  {
    name: "game_look_direction",
    title: "Look Direction",
    description: "Turn a friendly unit look direction without necessarily interrupting movement.",
    inputSchema: commandSchema({
      direction: enumSchema(DIRECTIONS, "New look direction."),
    }, ["direction"]),
  },
  {
    name: "game_set_posture",
    title: "Set Posture",
    description: "Set a friendly unit posture.",
    inputSchema: commandSchema({
      posture: enumSchema(POSTURES, "New posture."),
    }, ["posture"]),
  },
  {
    name: "game_issue_formation_order",
    title: "Issue Formation Order",
    description: "As the leader, order the group into a formation around a target hex.",
    inputSchema: commandSchema({
      q: integerSchema("Formation target axial q coordinate."),
      r: integerSchema("Formation target axial r coordinate."),
      formation: enumSchema(FORMATIONS, "Formation to assume."),
      communication: enumSchema(COMMUNICATION_METHODS, "Order communication method. Defaults to voice."),
      direction: enumSchema(DIRECTIONS, "Optional formation orientation direction."),
      directionTargetQ: integerSchema("Optional q coordinate used to infer order direction."),
      directionTargetR: integerSchema("Optional r coordinate used to infer order direction."),
    }, ["q", "r", "formation"]),
  },
  {
    name: "game_issue_forward_order",
    title: "Issue Forward Order",
    description: "As the leader, order the group forward in a formation along a direction.",
    inputSchema: commandSchema({
      formation: enumSchema(FORMATIONS, "Formation to use while advancing. Defaults to line."),
      communication: enumSchema(COMMUNICATION_METHODS, "Order communication method. Defaults to voice."),
      direction: enumSchema(DIRECTIONS, "Optional advance direction."),
      directionTargetQ: integerSchema("Optional q coordinate used to infer advance direction."),
      directionTargetR: integerSchema("Optional r coordinate used to infer advance direction."),
    }),
  },
  {
    name: "game_issue_alternating_forward_order",
    title: "Issue Alternating Forward Order",
    description: "As the leader, order alternating forward movement so one bound moves while the other covers with fire.",
    inputSchema: commandSchema({
      communication: enumSchema(COMMUNICATION_METHODS, "Order communication method. Defaults to voice."),
      direction: enumSchema(DIRECTIONS, "Advance direction."),
      directionTargetQ: integerSchema("Optional q coordinate used to infer advance direction."),
      directionTargetR: integerSchema("Optional r coordinate used to infer advance direction."),
    }, ["direction"]),
  },
  {
    name: "game_halt_group",
    title: "Halt Group",
    description: "As the leader, halt every friendly unit in the group.",
    inputSchema: commandSchema({}),
  },
  {
    name: "game_advance_time",
    title: "Advance Time",
    description: "Advance the backend simulation clock and return the resulting observation.",
    inputSchema: objectSchema({
      seconds: { type: "number", minimum: 0, maximum: 60, default: 1, description: "Seconds of simulation to advance." },
      stepSeconds: { type: "number", minimum: 0.05, maximum: 5, default: 0.2, description: "Tick size used while advancing." },
      gameId: { type: "string", description: "Optional backend game room id. Defaults to the /mcp?game= query or main." },
      role: enumSchema(["player", "observer"], "Projection role for the returned observation."),
      detail: enumSchema(["summary", "visible_map", "full_projection"], "Observation detail level to return."),
    }),
  },
];

function commandSchema(properties: JsonObject, required: string[] = []): JsonObject {
  return objectSchema(
    {
      gameId: { type: "string", description: "Optional backend game room id. Defaults to the /mcp?game= query or main." },
      unitId: { type: "string", description: "Friendly unit id. Defaults to the current player/leader unit." },
      issuedAt: { type: "number", description: "Optional command timestamp. Defaults to current simulation time." },
      role: enumSchema(["player", "observer"], "Projection role for the returned observation."),
      detail: enumSchema(["summary", "visible_map", "full_projection"], "Observation detail level to return."),
      ...properties,
    },
    required,
  );
}

function objectSchema(properties: JsonObject, required: string[] = []): JsonObject {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}

function integerSchema(description: string): JsonObject {
  return {
    type: "integer",
    description,
  };
}

function enumSchema(values: readonly string[], description: string): JsonObject {
  return {
    type: "string",
    enum: values,
    description,
  };
}
