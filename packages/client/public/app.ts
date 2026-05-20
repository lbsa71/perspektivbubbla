type Direction = "N" | "NE" | "SE" | "S" | "SW" | "NW";
type Formation = "column" | "line" | "file" | "wedge" | "dispersed" | "regroup";
type CommunicationMethod = "voice" | "gesture" | "radio";

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
  intent: { type: string; target?: HexCoord; targetPoint?: MapPoint };
  status: string[];
  currentOrderId?: string;
};

type EventProjection = {
  time: number;
  type: string;
  payload?: {
    orderId?: string;
    unitId?: string;
    issuerId?: string;
    formation?: Formation;
    target?: HexCoord;
    targetPoint?: MapPoint;
    direction?: Direction;
    communication?: CommunicationMethod;
    status?: string;
    reason?: string;
    message?: string;
    neighbourId?: string;
    leadHexes?: number;
    relayedBy?: string;
    hops?: number;
    phase?: "forming" | "advancing";
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
    };
  };
};

type Projection = {
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
  objective: {
    title: string;
    description: string;
    target: HexCoord;
    status: string;
  };
  map: {
    tiles: HexTileProjection[];
  };
  player: UnitProjection;
  units: UnitProjection[];
  events: EventProjection[];
};

type ClientState = {
  projection?: Projection;
  socket?: WebSocket;
  zoom: number;
  pan: { x: number; y: number };
  hasCentered: boolean;
  selectedFormation: Formation;
  selectedCommunication: CommunicationMethod;
  selectedDirection?: Direction;
  directionCue?: HexCoord;
  directionCuePoint?: MapPoint;
  showAarFeed: boolean;
  loggedDiagnostics: Set<string>;
};

type PanDragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPan: { x: number; y: number };
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

const state: ClientState = {
  projection: undefined,
  socket: undefined,
  zoom: 1,
  pan: { x: 0, y: 0 },
  hasCentered: false,
  selectedFormation: "line",
  selectedCommunication: "voice",
  selectedDirection: undefined,
  directionCue: undefined,
  directionCuePoint: undefined,
  showAarFeed: false,
  loggedDiagnostics: new Set(),
};
let panDrag: PanDragState | undefined;
let mapRenderFrame: number | undefined;

connect();
bindControls();
renderAarFeedVisibility();

function connect() {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${protocol}://${location.host}/ws`);
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
      logFormationDiagnostics(message.projection);
      centerOnPlayerOnce();
      render();
    }
  });
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
    map.addEventListener("pointerup", handleMapHexPointerUp);
    map.addEventListener("pointercancel", handleMapPointerEnd);
    map.addEventListener("lostpointercapture", handleMapPointerEnd);
    map.addEventListener("wheel", handleMapWheel, { passive: false });
  }

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const commandTarget = target.closest("[data-command]");
    if (!(commandTarget instanceof HTMLElement)) return;
    if (commandTarget.dataset.command === "toggle-aar") {
      state.showAarFeed = !state.showAarFeed;
      renderAarFeedVisibility();
      renderMapIfReady();
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
      renderControls();
      render();
    }
    if (commandTarget.dataset.command === "forward") {
      issueForwardOrder();
    }
    if (commandTarget.dataset.command === "halt") {
      issueHaltOrder();
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

function handleMapHexPointerUp(event: PointerEvent): void {
  if (event.button !== 0 || panDrag) return;
  const projection = state.projection;
  if (!projection) return;

  const targetElement = hexElementFromPoint(event);
  if (!targetElement) return;

  const target = coordFromDataset(targetElement);
  if (!isValidCoord(target)) {
    console.warn("[hex-click] failed", { reason: "invalid_hex_dataset", target });
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

function hexElementFromPoint(event: PointerEvent): SVGElement | undefined {
  const directTarget = event.target instanceof Element ? event.target.closest(".hex, .objective-hitbox") : undefined;
  if (directTarget instanceof SVGElement) {
    return directTarget;
  }

  const hitTarget = document.elementFromPoint(event.clientX, event.clientY);
  const hexTarget = hitTarget instanceof Element ? hitTarget.closest(".hex, .objective-hitbox") : undefined;
  return hexTarget instanceof SVGElement ? hexTarget : undefined;
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

  document.querySelector("#time").textContent = `t=${projection.time.toFixed(1)}`;
  renderInfoWords(projection);
  renderGroup(projection);
  renderEvents(projection.events);
  renderAarFeedVisibility();
  renderControls();
  renderMap(projection);
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
      return `<li class="roster-item" tabindex="0" title="${escapeAttribute(details)}" data-tooltip="${escapeAttribute(details)}">
        <span class="callsign">${escapeHtml(unit.name)}</span>
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
  const objectiveMarkup = renderObjectiveMarker(projection, size);
  const orderRangeMarkup =
    projection.player.role === "leader"
      ? `<circle class="order-range ${state.selectedCommunication}" cx="${playerPoint.x}" cy="${playerPoint.y}" r="${orderRangePixels(size)}"></circle>`
      : "";
  const directionCueMarkup = renderDirectionCue(projection, size);

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
      const vector = directionVectors[unit.lookDirection] ?? { q: 1, r: 0 };
      const end = { x: point.x + vector.q * size * 1.6, y: point.y + vector.r * size * 1.6 };
      const details = unitDetails(unit, projection);
      return `<g class="unit-marker">
        <title>${escapeHtml(details)}</title>
        <circle class="unit-${unit.side} unit-${unit.role}" cx="${point.x}" cy="${point.y}" r="${size * 0.55}"></circle>
        <line class="facing" x1="${point.x}" y1="${point.y}" x2="${end.x}" y2="${end.y}"></line>
        <text class="unit-label" x="${point.x + size * 0.8}" y="${point.y - size * 0.7}">${escapeHtml(unitLabel(unit))}</text>
      </g>`;
    })
    .join("");

  svg.setAttribute("viewBox", `${state.pan.x} ${state.pan.y} ${svg.clientWidth || 800} ${svg.clientHeight || 600}`);
  svg.innerHTML = `<g>${tileMarkup}${orderRangeMarkup}${objectiveMarkup}${directionCueMarkup}${intentMarkup}${unitMarkup}</g>`;

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

function issueHaltOrder(): void {
  const projection = state.projection;
  if (!projection || projection.player.role !== "leader") return;
  send({
    type: "halt_group",
    unitId: projection.player.id,
    issuedAt: projection.time,
  });
}

function selectedOrderDirection(projection: Projection): Direction {
  return state.selectedDirection ?? projection.activeFormation?.direction ?? projection.player.facing;
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

  return `
    <div class="hex-tooltip-title">${escapeHtml(displayTerrain(terrain))} <span>${coord.q},${coord.r}</span></div>
    <dl>
      <dt>sikt</dt><dd>${escapeHtml(memoryLine)}</dd>
      <dt>rörelse</dt><dd>${known ? formatMaybeNumber(tile?.moveCost) : "-"}</dd>
      <dt>skydd</dt><dd>${known ? formatMaybeNumber(tile?.cover) : "-"}</dd>
      <dt>skyl</dt><dd>${known ? formatMaybeNumber(tile?.concealment) : "-"}</dd>
      <dt>risk</dt><dd>${known ? formatMaybeNumber(tile?.exposure) : "-"}</dd>
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
    unknown: "Okänt",
  };
  return labels[terrain] ?? terrain;
}

function formatMaybeNumber(value: number | undefined): string {
  return typeof value === "number" ? String(value) : "-";
}

function groupDetails(projection: Projection): string {
  const friendlies = projection.units.filter((unit) => unit.side === "friendly");
  const activeFormation = projection.activeFormation ? displayFormationState(projection.activeFormation) : "ingen";
  const directionCue = state.selectedDirection
    ? `${state.selectedDirection}${state.directionCue ? ` via ${state.directionCue.q},${state.directionCue.r}` : ""}`
    : projection.activeFormation?.direction ?? projection.player.facing;
  const rows = friendlies
    .map((unit) => {
      const target =
        unit.intent.type === "moving" && unit.intent.target
          ? ` -> ${unit.intent.target.q},${unit.intent.target.r}`
          : "";
      return `${unit.name}: ${displayRole(unit)} ${displayElementPosition(unit)} ${displayIntent(unit.intent.type)}${target}`;
    })
    .join("\n");

  return [
    `gruppering: ${activeFormation}`,
    `metod: ${displayCommunication(state.selectedCommunication)}`,
    `riktning: ${directionCue}`,
    `soldater: ${friendlies.length}`,
    rows,
  ].join("\n");
}

function goalDetails(projection: Projection): string {
  return [
    objectiveTitle(projection.objective.title),
    `målhex: ${projection.objective.target.q},${projection.objective.target.r}`,
    `status: ${displayObjectiveStatus(projection.objective.status)}`,
    objectiveDescription(projection.objective.description),
  ].join("\n");
}

function orderDetails(projection: Projection): string {
  const current = projection.activeFormation
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
        event.type === "order_delivery_resolved" ||
        event.type === "group_halted" ||
        event.type === "movement_waiting" ||
        event.type === "command_accepted" ||
        event.type === "command_rejected",
    )
    .slice(-8)
    .reverse()
    .map(formatOrderEvent)
    .join("\n");

  return [current, recent].filter(Boolean).join("\n");
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
  const command = event.payload?.command;
  const detail = command?.target
    ? ` ${command.target.q},${command.target.r}`
    : command?.direction
      ? ` ${command.direction}`
      : command?.posture
        ? ` ${displayPosture(command.posture)}`
        : command?.formation
          ? ` ${displayFormation(command.formation)}`
          : "";
  return `${event.time.toFixed(1)} ${displayCommandType(command?.type ?? event.type)}${detail}`;
}

function unitDetails(unit: UnitProjection, projection: Projection): string {
  const target =
    unit.intent.type === "moving" && unit.intent.target
      ? `${unit.intent.target.q},${unit.intent.target.r}`
      : `${unit.coord.q},${unit.coord.r}`;
  const activeFormation = projection.activeFormation ? displayFormationState(projection.activeFormation) : "ingen";
  const directionCue = state.selectedDirection
    ? `${state.selectedDirection}${state.directionCue ? ` via ${state.directionCue.q},${state.directionCue.r}` : ""}`
    : projection.activeFormation?.direction ?? projection.player.facing;
  const order = unit.currentOrderId ? shortOrderId(unit.currentOrderId) : "-";

  return [
    `${unit.name} (${displayRole(unit)})`,
    `del: ${displayElementPosition(unit)}`,
    `hex: ${unit.coord.q},${unit.coord.r}`,
    `avsikt: ${displayIntent(unit.intent.type)}`,
    `mål: ${target}`,
    `ställning: ${displayPosture(unit.posture)}`,
    `riktning/blick: ${unit.facing}/${unit.lookDirection}`,
    `order: ${order}`,
    `gruppering: ${activeFormation}`,
    `metod: ${displayCommunication(state.selectedCommunication)}`,
    `riktning: ${directionCue}`,
    `målhex: ${projection.objective.target.q},${projection.objective.target.r}`,
  ].join("\n");
}

function displayFormationState(formation: NonNullable<Projection["activeFormation"]>): string {
  const phase = formation.phase ? displayFormationPhase(formation.phase) : "satt";
  return `${displayFormation(formation.formation)} ${phase} ${formation.direction} ${formation.target.q},${formation.target.r}`;
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
    blocked_by_unit: "blockerad av enhet",
    cohesion_wait: "väntar på sammanhållning",
    neighbour_too_far: "granne för långt bort",
    no_path: "ingen framkomlig väg",
  };
  return labels[reason] ?? reason.replaceAll("_", " ");
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

function displayCommandType(type: string): string {
  const labels: Record<string, string> = {
    move_to_hex: "förflytta",
    face_direction: "vänd",
    look_direction: "spana",
    set_posture: "ändra ställning",
    issue_formation_order: "formationsorder",
    issue_forward_order: "framåtorder",
    halt_group: "haltorder",
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
  if (event.type === "order_delivery_resolved") {
    return `${displayUnitId(event.payload?.unitId)} ${displayReceptionStatus(event.payload?.status)} ${displayReason(event.payload?.reason)}`;
  }
  if (event.type === "group_halted") {
    return "gruppen gör halt";
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
  if (event.type === "command_accepted" || event.type === "command_rejected") {
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
  return `<g>
    <line class="objective-line" x1="${player.x}" y1="${player.y}" x2="${target.x}" y2="${target.y}"></line>
    <circle class="objective-marker" cx="${target.x}" cy="${target.y}" r="${radius}"></circle>
    <line class="objective-marker" x1="${target.x - radius}" y1="${target.y}" x2="${target.x + radius}" y2="${target.y}"></line>
    <line class="objective-marker" x1="${target.x}" y1="${target.y - radius}" x2="${target.x}" y2="${target.y + radius}"></line>
    <circle class="objective-hitbox" cx="${target.x}" cy="${target.y}" r="${clickableRadius}" data-q="${projection.objective.target.q}" data-r="${projection.objective.target.r}"></circle>
    <text class="objective-label" x="${target.x + size * 1.4}" y="${target.y - size * 1.2}">MÅL ${projection.objective.target.q},${projection.objective.target.r}</text>
  </g>`;
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
  posture?: string;
  target?: HexCoord;
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
  if (element === "command") return "chefsdel";
  return "-";
}

function displayElementPosition(unit: UnitProjection): string {
  const element = displayElement(unit.element);
  return unit.elementPosition ? `${element} / position ${unit.elementPosition}` : element;
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

function hexPoints(center: { x: number; y: number }, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    points.push(`${center.x + size * Math.cos(angle)},${center.y + size * Math.sin(angle)}`);
  }
  return points.join(" ");
}
