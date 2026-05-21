import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceSession,
  createPhaseOneSession,
  dispatchCommand,
  hexDistance,
  projectSession,
  replayEvents,
} from "../src/index.ts";

test("phase one scenario is deterministic and uses a 100x100 map at 3m per hex", () => {
  const a = createPhaseOneSession({ seed: "phase-one" });
  const b = createPhaseOneSession({ seed: "phase-one" });

  assert.equal(a.world.map.width, 100);
  assert.equal(a.world.map.height, 100);
  assert.equal(a.world.map.hexSizeMeters, 3);
  assert.deepEqual(a.world.map.tiles, b.world.map.tiles);
  assert.equal(a.world.units.filter((unit) => unit.side === "friendly").length, 1);
  assert.ok(a.world.units.some((unit) => unit.side === "opposing"));
});

test("movement command creates backend-owned pathing and advances over simulated time", () => {
  let session = createPhaseOneSession({ seed: "movement" });
  const player = session.world.units.find((unit) => unit.side === "friendly");
  assert.ok(player);
  const target = { q: player.coord.q + 4, r: player.coord.r };

  session = dispatchCommand(session, {
    type: "move_to_hex",
    unitId: player.id,
    target,
    issuedAt: session.world.time,
  });

  assert.equal(session.world.unitsById[player.id].intent.type, "moving");

  session = advanceSession(session, 1, { random: () => 1 });

  const moved = session.world.unitsById[player.id];
  assert.ok(hexDistance(player.coord, moved.coord) >= 1);
  assert.equal(moved.facing, "SE");
  assert.ok(session.events.some((event) => event.type === "movement_started"));
  assert.ok(session.events.some((event) => event.type === "unit_moved"));
});

test("projection keeps the full grid clickable while recently seen cells fade from memory", () => {
  let session = createPhaseOneSession({ seed: "visibility-memory" });
  const player = session.world.units.find((unit) => unit.side === "friendly");
  assert.ok(player);
  const rememberedCoord = { q: player.coord.q + 2, r: player.coord.r };

  let projection = projectSession(session);
  assert.equal(projection.map.tiles.length, projection.map.width * projection.map.height);
  assert.equal(tileAt(projection, rememberedCoord)?.visibility, "visible");
  assert.ok(projection.map.tiles.some((tile) => tile.visibility === "unknown"));

  session = dispatchCommand(session, {
    type: "look_direction",
    unitId: player.id,
    direction: "NW",
    issuedAt: session.world.time,
  });

  projection = projectSession(session);
  assert.equal(tileAt(projection, rememberedCoord)?.visibility, "memory");

  session = advanceSession(session, 5, { random: () => 1 });
  projection = projectSession(session);
  assert.equal(tileAt(projection, rememberedCoord)?.visibility, "memory");
  assert.equal(tileAt(projection, rememberedCoord)?.memoryAge, 5);

  session = advanceSession(session, 6, { random: () => 1 });
  projection = projectSession(session);
  assert.equal(tileAt(projection, rememberedCoord)?.visibility, "unknown");
});

test("projection centers visible hexes on the player true position", () => {
  const session = createPhaseOneSession({ seed: "visibility-true-position" });
  const player = session.world.units.find((unit) => unit.side === "friendly");
  assert.ok(player);
  const trueCenter = { q: player.coord.q + 12, r: player.coord.r };
  player.position = mapPoint(trueCenter);
  session.world.unitsById[player.id].position = player.position;

  const projection = projectSession(session);

  assert.equal(tileAt(projection, trueCenter)?.visibility, "visible");
  assert.ok(projection.map.visibleHexes.some((coord) => coord.q === trueCenter.q && coord.r === trueCenter.r));
});

test("group commander formation order assigns unique local slots without advancing to the goal", () => {
  let session = createPhaseOneSession({ seed: "group-commander", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session = dispatchCommand(session, {
    type: "issue_formation_order",
    unitId: leader.id,
    target: leader.coord,
    formation: "line",
    communication: "voice",
    direction: "SE",
    issuedAt: session.world.time,
  });

  const friendlies = session.world.units.filter((unit) => unit.side === "friendly");
  const assignedFriendlies = friendlies.map((unit) => (unit.intent.type === "moving" ? unit.intent.target : unit.coord));
  const slotKeys = new Set(
    assignedFriendlies.map((target) => `${target.q},${target.r}`),
  );

  assert.equal(friendlies.length, 8);
  assert.equal(slotKeys.size, 8);
  assert.equal(session.world.activeFormation?.formation, "line");
  assert.equal(session.world.activeFormation?.orderKind, "formation");
  assert.deepEqual(session.world.activeFormation?.target, leader.coord);
  assert.ok(session.events.some((event) => event.type === "formation_order_issued"));
  assert.equal(session.events.filter((event) => event.type === "order_delivery_resolved" && event.payload.status === "received").length, 8);
  assert.ok(assignedFriendlies.every((target) => hexDistance(target, leader.coord) <= 6));
  assertLeaderAndDeputyClose(session);
  assert.deepEqual(lineTargetsByUnit(session), {
    LEADER_1: { q: 8, r: 50 },
    DEPUTY_1: { q: 7, r: 52 },
    FRIENDLY_1: { q: 9, r: 48 },
    FRIENDLY_2: { q: 9, r: 47 },
    FRIENDLY_3: { q: 10, r: 46 },
    FRIENDLY_4: { q: 6, r: 53 },
    FRIENDLY_5: { q: 6, r: 54 },
    FRIENDLY_6: { q: 5, r: 56 },
  });

  for (let step = 0; step < 10; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertUniqueFriendlyHexes(session);
    assertLeaderAndDeputyClose(session);
  }
  assert.ok(session.events.some((event) => event.type === "unit_moved"));
  assert.ok(projectSession(session).events.some((event) => event.type === "formation_order_issued"));
});

test("group commander can form skytteled as a single file", () => {
  let session = createPhaseOneSession({ seed: "skytteled", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session = dispatchCommand(session, {
    type: "issue_formation_order",
    unitId: leader.id,
    target: leader.coord,
    formation: "file",
    communication: "voice",
    direction: "SE",
    issuedAt: session.world.time,
  });

  assert.equal(session.world.activeFormation?.formation, "file");
  assert.deepEqual(lineTargetsByUnit(session), {
    LEADER_1: { q: 8, r: 50 },
    DEPUTY_1: { q: 7, r: 50 },
    FRIENDLY_1: { q: 6, r: 50 },
    FRIENDLY_2: { q: 5, r: 50 },
    FRIENDLY_3: { q: 4, r: 50 },
    FRIENDLY_4: { q: 3, r: 50 },
    FRIENDLY_5: { q: 2, r: 50 },
    FRIENDLY_6: { q: 1, r: 50 },
  });
});

test("group reformation routes around occupied friendly hexes instead of stalling", () => {
  let session = createPhaseOneSession({ seed: "reroute-formation", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session = dispatchCommand(session, {
    type: "issue_formation_order",
    unitId: leader.id,
    target: leader.coord,
    formation: "line",
    communication: "voice",
    direction: "SE",
    issuedAt: session.world.time,
  });

  const assignedTargets = latestOrderTargets(session);
  for (let step = 0; step < 80; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertUniqueFriendlyHexes(session);
    assertLeaderAndDeputyClose(session);
    if (session.world.units.filter((unit) => unit.side === "friendly").every((unit) => unit.intent.type === "idle")) {
      break;
    }
  }

  assert.equal(session.world.units.filter((unit) => unit.side === "friendly" && unit.intent.type === "moving").length, 0);
  for (const unit of session.world.units.filter((unit) => unit.side === "friendly")) {
    assert.deepEqual(unit.coord, assignedTargets.get(unit.id));
  }
  assert.ok(session.events.some((event) => event.type === "movement_rerouted"));
});

test("framåt arms embodied advance and halt stops every friendly unit", () => {
  let session = createPhaseOneSession({ seed: "forward-halt", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session = dispatchCommand(session, {
    type: "issue_formation_order",
    unitId: leader.id,
    target: leader.coord,
    formation: "line",
    communication: "voice",
    direction: "SE",
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "issue_forward_order",
    unitId: leader.id,
    formation: "line",
    communication: "voice",
    direction: "SE",
    issuedAt: session.world.time,
  });

  assert.equal(session.world.activeFormation?.formation, "line");
  assert.equal(session.world.activeFormation?.orderKind, "forward");
  assert.equal(session.world.activeFormation?.phase, "forming");
  assert.notDeepEqual(session.world.activeFormation?.advanceTarget, session.world.objective.target);
  assert.equal(session.world.activeFormation?.direction, "SE");
  assert.deepEqual(session.world.activeFormation?.target, leader.coord);
  assert.ok(session.world.units.some((unit) => unit.side === "friendly" && unit.intent.type === "moving"));
  assertLeaderAndDeputyClose(session);

  for (let step = 0; step < 100 && session.world.activeFormation?.phase !== "advancing"; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertUniqueFriendlyHexes(session);
  }

  assert.equal(session.world.activeFormation?.phase, "advancing");
  assert.deepEqual(session.world.activeFormation?.target, session.world.unitsById[leader.id].coord);
  assert.ok(session.events.some((event) => event.type === "formation_advance_started"));
  assert.ok(session.world.units.filter((unit) => unit.side === "friendly").every((unit) => unit.intent.type === "idle"));

  const embodiedLeader = session.world.unitsById[leader.id];
  session = dispatchCommand(session, {
    type: "move_to_hex",
    unitId: embodiedLeader.id,
    target: { q: embodiedLeader.coord.q + 4, r: embodiedLeader.coord.r },
    issuedAt: session.world.time,
  });

  for (let step = 0; step < 20; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertUniqueFriendlyHexes(session);
  }

  assert.ok(hexDistance(session.world.unitsById[leader.id].coord, embodiedLeader.coord) > 0);
  assert.ok(session.world.units.some((unit) => unit.side === "friendly" && unit.intent.type === "moving"));

  session = dispatchCommand(session, {
    type: "halt_group",
    unitId: leader.id,
    issuedAt: session.world.time,
  });

  assert.ok(session.events.some((event) => event.type === "group_halted"));
  assert.ok(session.world.units.filter((unit) => unit.side === "friendly").every((unit) => unit.intent.type === "idle"));
  assertUniqueFriendlyHexes(session);
  assertLeaderAndDeputyClose(session);
});

test("gesture line and framåt are resolved by formation motivations for the whole group", () => {
  let session = createPhaseOneSession({ seed: "gesture-forward", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session = dispatchCommand(session, {
    type: "issue_formation_order",
    unitId: leader.id,
    target: leader.coord,
    formation: "line",
    communication: "gesture",
    direction: "SE",
    issuedAt: session.world.time,
  });

  assert.equal(
    session.events.filter((event) => event.type === "order_delivery_resolved" && event.payload.status === "received").length,
    8,
  );
  assert.ok(
    session.events.some(
      (event) =>
        event.type === "order_delivery_resolved" &&
        event.payload.unitId === "FRIENDLY_6" &&
        event.payload.status === "received" &&
        typeof event.payload.relayedBy === "string" &&
        event.payload.reason === "visual_relay",
    ),
  );

  session = dispatchCommand(session, {
    type: "issue_forward_order",
    unitId: leader.id,
    formation: "line",
    communication: "gesture",
    direction: "SE",
    issuedAt: session.world.time,
  });

  const forwardOrderId = session.world.activeFormation?.orderId;
  assert.ok(forwardOrderId);
  assert.equal(
    session.events.filter(
      (event) =>
        event.type === "order_delivery_resolved" &&
        event.payload.orderId === forwardOrderId &&
        event.payload.status === "received",
    ).length,
    8,
  );
  assert.ok(
    session.events.some(
      (event) =>
        event.type === "order_delivery_resolved" &&
        event.payload.orderId === forwardOrderId &&
        event.payload.unitId === "FRIENDLY_6" &&
        typeof event.payload.relayedBy === "string",
    ),
  );

  for (let step = 0; step < 20; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertUniqueFriendlyHexes(session);
    assertLeaderAndDeputyClose(session);
  }

  const friendlies = session.world.units.filter((unit) => unit.side === "friendly");
  assert.ok(friendlies.every((unit) => unit.intent.type === "moving" || unit.intent.type === "idle"));
  assert.ok(friendlies.some((unit) => hexDistance(unit.coord, leader.coord) >= 3));
});

test("radio formation orders reach the full group as a communication mode", () => {
  let session = createPhaseOneSession({ seed: "radio-formation", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session.world.unitsById.FRIENDLY_6.coord = { q: 52, r: 70 };
  session.world.unitsById.FRIENDLY_6.position = mapPoint({ q: 52, r: 70 });

  session = dispatchCommand(session, {
    type: "issue_formation_order",
    unitId: leader.id,
    target: leader.coord,
    formation: "line",
    communication: "radio",
    direction: "SE",
    issuedAt: session.world.time,
  });

  const orderId = session.world.activeFormation?.orderId;
  assert.ok(orderId);
  const receptions = session.events.filter((event) => event.type === "order_delivery_resolved" && event.payload.orderId === orderId);
  assert.equal(receptions.filter((event) => event.payload.status === "received").length, 8);
  assert.ok(
    receptions.some(
      (event) =>
        event.payload.unitId === "FRIENDLY_6" &&
        event.payload.status === "received" &&
        event.payload.reason === "radio_relay",
    ),
  );
});

test("risk zones flag friendly blocking and tät coverage", () => {
  let session = createPhaseOneSession({ seed: "risk-zones", scenario: "group_commander" });

  session = advanceSession(session, 1, { random: () => 1 });

  const projection = projectSession(session);
  const leaderZone = projection.risk.effectZones.find((zone) => zone.unitId === "LEADER_1");
  assert.ok(leaderZone);
  assert.ok(leaderZone.hexes.length > 0);
  assert.ok(
    projection.risk.blocking.some(
      (warning) =>
        warning.unitId === "LEADER_1" &&
        warning.blockingUnitId === "DEPUTY_1" &&
        warning.severity === "high",
    ),
  );
  assert.ok(projection.risk.coverage.some((check) => check.element === "tat_1" && check.reason === "blocked_effect_zone"));
  assert.ok(projection.risk.coverage.some((check) => check.element === "tat_2" && check.covered));
  assert.ok(session.events.some((event) => event.type === "friendly_effect_blocked"));
  assert.ok(projection.aar.blockingEvents.some((event) => event.type === "friendly_effect_blocked"));
});

test("perception projection separates last-known status, reports, and heard events", () => {
  let session = createPhaseOneSession({ seed: "perception-bubble", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session = dispatchCommand(session, {
    type: "look_direction",
    unitId: leader.id,
    direction: "NW",
    issuedAt: session.world.time,
  });
  session = advanceSession(session, 5, { random: () => 1 });

  const projection = projectSession(session);
  const perceivedLeader = projection.perception.lastKnownUnits.find((unit) => unit.unitId === "LEADER_1");
  const perceivedFlank = projection.perception.lastKnownUnits.find((unit) => unit.unitId === "FRIENDLY_4");

  assert.equal(projection.perception.informationMode, "training");
  assert.equal(perceivedLeader?.confidence, "high");
  assert.ok(perceivedFlank);
  assert.notEqual(perceivedFlank?.source, "visual");
  assert.ok(projection.perception.reports.some((report) => report.kind === "blocking"));
  assert.ok(projection.perception.heardEvents.some((event) => event.kind === "report"));
  assert.ok(projection.aar.reportEvents.some((event) => event.type === "status_report_emitted"));
});

test("forward movement waits when a neighbour falls too far behind", () => {
  let session = createPhaseOneSession({ seed: "neighbour-cohesion", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session = dispatchCommand(session, {
    type: "issue_formation_order",
    unitId: leader.id,
    target: leader.coord,
    formation: "line",
    communication: "voice",
    direction: "SE",
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "issue_forward_order",
    unitId: leader.id,
    formation: "line",
    communication: "voice",
    direction: "SE",
    issuedAt: session.world.time,
  });

  const ahead = session.world.unitsById.FRIENDLY_2;
  const laggingNeighbour = session.world.unitsById.FRIENDLY_1;
  assert.ok(session.world.activeFormation);
  session.world.activeFormation.phase = "advancing";
  ahead.coord = { q: 21, r: 20 };
  ahead.position = mapPoint(ahead.coord);
  ahead.intent = {
    type: "moving",
    target: { q: 23, r: 20 },
    targetPoint: mapPoint({ q: 23, r: 20 }),
    path: [
      { q: 22, r: 20 },
      { q: 23, r: 20 },
    ],
    progress: 0,
  };
  laggingNeighbour.coord = { q: 19, r: 20 };
  laggingNeighbour.position = mapPoint(laggingNeighbour.coord);
  laggingNeighbour.intent = { type: "idle" };

  session = advanceSession(session, 1, { random: () => 1 });

  assert.deepEqual(session.world.unitsById.FRIENDLY_2.coord, { q: 21, r: 20 });
  assert.ok(
    session.events.some(
      (event) =>
        event.type === "movement_waiting" &&
        event.payload.unitId === "FRIENDLY_2" &&
        event.payload.reason === "neighbour_lagging",
    ),
  );
});

test("framåt uses the indicated direction instead of steering toward the scenario goal", () => {
  let session = createPhaseOneSession({ seed: "forward-direction", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session = dispatchCommand(session, {
    type: "issue_forward_order",
    unitId: leader.id,
    formation: "line",
    communication: "voice",
    direction: "NE",
    issuedAt: session.world.time,
  });

  assert.equal(session.world.activeFormation?.direction, "NE");
  assert.ok(session.world.activeFormation);
  assert.equal(session.world.activeFormation.phase, "forming");
  assert.notDeepEqual(session.world.activeFormation.advanceTarget, session.world.objective.target);
  assert.ok(session.world.activeFormation.advanceTarget);
  assert.ok(session.world.activeFormation.advanceTarget.q > leader.coord.q);
  assert.ok(session.world.activeFormation.advanceTarget.r < leader.coord.r);
});

test("framåt projects a true map bearing before snapping to a hex target", () => {
  let session = createPhaseOneSession({ seed: "forward-true-north", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);
  const trueNorthReference = { q: leader.coord.q + 5, r: leader.coord.r - 10 };
  const trueNorthAxis = leader.coord.q * 2 + leader.coord.r;

  session = dispatchCommand(session, {
    type: "issue_forward_order",
    unitId: leader.id,
    formation: "line",
    communication: "voice",
    direction: "N",
    directionTarget: trueNorthReference,
    issuedAt: session.world.time,
  });

  assert.ok(session.world.activeFormation);
  assert.equal(session.world.activeFormation.direction, "N");
  assert.equal(session.world.activeFormation.phase, "forming");
  assert.notDeepEqual(session.world.activeFormation.advanceTarget, session.world.objective.target);
  assert.ok(session.world.activeFormation.advanceTarget);
  assert.ok(session.world.activeFormation.advanceTarget.r < leader.coord.r);
  assert.equal(session.world.activeFormation.advanceTarget.q * 2 + session.world.activeFormation.advanceTarget.r, trueNorthAxis);
});

test("framåt after halt recalculates the new bearing from true position", () => {
  let session = createPhaseOneSession({ seed: "forward-turn-after-halt", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session = dispatchCommand(session, {
    type: "issue_formation_order",
    unitId: leader.id,
    target: leader.coord,
    formation: "line",
    communication: "voice",
    direction: "SE",
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "issue_forward_order",
    unitId: leader.id,
    formation: "line",
    communication: "voice",
    direction: "SE",
    issuedAt: session.world.time,
  });

  for (let step = 0; step < 80 && session.world.activeFormation?.phase !== "advancing"; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }
  const advancingLeader = session.world.unitsById[leader.id];
  session = dispatchCommand(session, {
    type: "move_to_hex",
    unitId: leader.id,
    target: { q: advancingLeader.coord.q + 4, r: advancingLeader.coord.r },
    issuedAt: session.world.time,
  });
  for (let step = 0; step < 10; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }

  session = dispatchCommand(session, {
    type: "halt_group",
    unitId: leader.id,
    issuedAt: session.world.time,
  });

  const haltedLeader = session.world.unitsById[leader.id];
  const turnTargetPoint = { x: haltedLeader.position.x, y: haltedLeader.position.y + 12 };
  const turnTarget = mapPointToHex(turnTargetPoint);
  session = dispatchCommand(session, {
    type: "issue_forward_order",
    unitId: leader.id,
    formation: "line",
    communication: "voice",
    direction: "S",
    directionTarget: turnTarget,
    directionTargetPoint: turnTargetPoint,
    issuedAt: session.world.time,
  });

  assert.equal(session.world.activeFormation?.phase, "forming");
  assert.ok(session.world.activeFormation?.directionVector);
  assert.ok(Math.abs(session.world.activeFormation.directionVector.x) < 0.001);
  assert.ok(session.world.activeFormation.directionVector.y > 0.999);
  assert.ok(session.world.activeFormation.advanceTargetPoint);
  assert.ok(Math.abs(session.world.activeFormation.advanceTargetPoint.x - haltedLeader.position.x) < 0.001);
  assert.ok(session.world.activeFormation.advanceTargetPoint.y > haltedLeader.position.y);

  for (let step = 0; step < 100 && session.world.activeFormation?.phase !== "advancing"; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }
  assert.equal(session.world.activeFormation?.phase, "advancing");
  session = dispatchCommand(session, {
    type: "move_to_hex",
    unitId: leader.id,
    target: mapPointToHex({ x: haltedLeader.position.x, y: haltedLeader.position.y + 18 }),
    issuedAt: session.world.time,
  });
  for (let step = 0; step < 6; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }

  const movingLeader = session.world.unitsById[leader.id];
  assert.ok(movingLeader.position.y > haltedLeader.position.y);
});

test("framåt while advancing relays gesture and preserves forward progress", () => {
  let session = createPhaseOneSession({ seed: "forward-turn-no-halt", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session = dispatchCommand(session, {
    type: "issue_formation_order",
    unitId: leader.id,
    target: leader.coord,
    formation: "line",
    communication: "gesture",
    direction: "SE",
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "issue_forward_order",
    unitId: leader.id,
    formation: "line",
    communication: "gesture",
    direction: "SE",
    issuedAt: session.world.time,
  });

  for (let step = 0; step < 100 && session.world.activeFormation?.phase !== "advancing"; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }
  const leaderAtAdvance = session.world.unitsById[leader.id];
  session = dispatchCommand(session, {
    type: "move_to_hex",
    unitId: leader.id,
    target: { q: leaderAtAdvance.coord.q + 5, r: leaderAtAdvance.coord.r },
    issuedAt: session.world.time,
  });
  for (let step = 0; step < 8; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }

  const before = Object.fromEntries(
    session.world.units.filter((unit) => unit.side === "friendly").map((unit) => [unit.id, unit.position]),
  );
  const movingLeader = session.world.unitsById[leader.id];
  const turnTargetPoint = { x: movingLeader.position.x, y: movingLeader.position.y + 18 };
  session = dispatchCommand(session, {
    type: "issue_forward_order",
    unitId: leader.id,
    formation: "line",
    communication: "gesture",
    direction: "S",
    directionTarget: mapPointToHex(turnTargetPoint),
    directionTargetPoint: turnTargetPoint,
    issuedAt: session.world.time,
  });

  const orderId = session.world.activeFormation?.orderId;
  assert.ok(orderId);
  const receptions = session.events.filter((event) => event.type === "order_delivery_resolved" && event.payload.orderId === orderId);
  assert.equal(receptions.filter((event) => event.payload.status === "received").length, 8);
  for (const unit of session.world.units.filter((candidate) => candidate.side === "friendly")) {
    assert.equal(unit.currentOrderId, orderId);
    if (unit.intent.type === "moving") {
      assert.ok(unit.intent.targetPoint.y >= before[unit.id].y - 0.001);
    }
  }
});

test("moving soldiers stop when a formation neighbour separates onto another order", () => {
  let session = createPhaseOneSession({ seed: "neighbour-separated", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session = dispatchCommand(session, {
    type: "issue_forward_order",
    unitId: leader.id,
    formation: "line",
    communication: "voice",
    direction: "SE",
    issuedAt: session.world.time,
  });
  assert.ok(session.world.activeFormation);
  session.world.activeFormation.phase = "advancing";

  const moving = session.world.unitsById.FRIENDLY_6;
  const neighbour = session.world.unitsById.FRIENDLY_5;
  moving.coord = { q: 30, r: 55 };
  moving.position = mapPoint(moving.coord);
  moving.currentOrderId = "old_order";
  moving.intent = {
    type: "moving",
    target: { q: 34, r: 55 },
    targetPoint: mapPoint({ q: 34, r: 55 }),
    path: [{ q: 31, r: 55 }],
    progress: 0,
  };
  neighbour.coord = { q: 10, r: 54 };
  neighbour.position = mapPoint(neighbour.coord);
  neighbour.currentOrderId = session.world.activeFormation.orderId;
  neighbour.intent = { type: "idle" };

  session = advanceSession(session, 1, { random: () => 1 });

  assert.deepEqual(session.world.unitsById.FRIENDLY_6.coord, { q: 30, r: 55 });
  assert.ok(
    session.events.some(
      (event) =>
        event.type === "movement_waiting" &&
        event.payload.unitId === "FRIENDLY_6" &&
        event.payload.reason === "neighbour_separated",
    ),
  );
});

test("group commander can regroup soldiers around the leader", () => {
  let session = createPhaseOneSession({ seed: "regroup", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session = dispatchCommand(session, {
    type: "issue_formation_order",
    unitId: leader.id,
    target: { q: leader.coord.q + 6, r: leader.coord.r },
    formation: "dispersed",
    communication: "voice",
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "issue_formation_order",
    unitId: leader.id,
    target: leader.coord,
    formation: "regroup",
    communication: "voice",
    issuedAt: session.world.time,
  });

  assert.equal(session.world.activeFormation?.formation, "regroup");
  const friendlies = session.world.units.filter((unit) => unit.side === "friendly");
  for (const unit of friendlies) {
    const target = unit.intent.type === "moving" ? unit.intent.target : unit.coord;
    assert.ok(hexDistance(target, leader.coord) <= 2);
  }
  assertLeaderAndDeputyClose(session);
  assert.ok(session.events.some((event) => event.type === "movement_interrupted"));
});

test("posture and body-facing commands interrupt current movement", () => {
  let session = createPhaseOneSession({ seed: "interrupt" });
  const player = session.world.units.find((unit) => unit.side === "friendly");
  assert.ok(player);

  session = dispatchCommand(session, {
    type: "move_to_hex",
    unitId: player.id,
    target: { q: player.coord.q + 6, r: player.coord.r },
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "set_posture",
    unitId: player.id,
    posture: "crouched",
    issuedAt: session.world.time,
  });

  const updated = session.world.unitsById[player.id];
  assert.equal(updated.intent.type, "idle");
  assert.equal(updated.posture, "crouched");
  assert.ok(session.events.some((event) => event.type === "movement_interrupted"));
  assert.ok(session.events.some((event) => event.type === "posture_changed"));
});

test("look sweep refreshes FOV without interrupting movement until it crosses orientation threshold", () => {
  let session = createPhaseOneSession({ seed: "look" });
  const player = session.world.units.find((unit) => unit.side === "friendly");
  assert.ok(player);

  session = dispatchCommand(session, {
    type: "move_to_hex",
    unitId: player.id,
    target: { q: player.coord.q + 6, r: player.coord.r },
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "look_direction",
    unitId: player.id,
    direction: "NE",
    issuedAt: session.world.time,
  });

  assert.equal(session.world.unitsById[player.id].intent.type, "moving");
  assert.equal(session.world.unitsById[player.id].lookDirection, "NE");

  session = dispatchCommand(session, {
    type: "look_direction",
    unitId: player.id,
    direction: "NW",
    issuedAt: session.world.time,
  });

  const updated = session.world.unitsById[player.id];
  assert.equal(updated.intent.type, "idle");
  assert.equal(updated.facing, "NW");
  assert.ok(session.events.some((event) => event.type === "body_orientation_changed"));
});

test("opposing units probabilistically detect, alert, seek cover, and emit contact pressure", () => {
  let session = createPhaseOneSession({
    seed: "detection",
    overrides: {
      player: { coord: { q: 12, r: 10 }, posture: "standing", facing: "SE" },
      opposing: [
        {
          id: "OP_TEST",
          coord: { q: 16, r: 10 },
          facing: "NW",
          posture: "standing",
        },
      ],
      terrainPatches: [
        { coord: { q: 12, r: 10 }, terrain: "field" },
        { coord: { q: 13, r: 10 }, terrain: "field" },
        { coord: { q: 14, r: 10 }, terrain: "field" },
        { coord: { q: 16, r: 10 }, terrain: "field" },
        { coord: { q: 15, r: 10 }, terrain: "ditch" },
      ],
    },
  });

  session = advanceSession(session, 0.2, { random: () => 0 });

  const opposing = session.world.unitsById.OP_TEST;
  assert.equal(opposing.alerted, true);
  assert.deepEqual(opposing.coord, { q: 15, r: 10 });
  assert.ok(session.events.some((event) => event.type === "probabilistic_detection_resolved"));
  assert.ok(session.events.some((event) => event.type === "opposing_unit_moved_to_cover"));
  assert.ok(session.events.some((event) => event.type === "contact_pressure_emitted"));
});

test("event log deterministically rebuilds the same projection", () => {
  let session = createPhaseOneSession({ seed: "replay" });
  const player = session.world.units.find((unit) => unit.side === "friendly");
  assert.ok(player);

  session = dispatchCommand(session, {
    type: "set_posture",
    unitId: player.id,
    posture: "prone",
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "look_direction",
    unitId: player.id,
    direction: "NE",
    issuedAt: session.world.time,
  });
  session = advanceSession(session, 0.5, { random: () => 1 });

  const replayed = replayEvents(session.events);

  assert.deepEqual(projectSession(replayed, "player").player, projectSession(session, "player").player);
  assert.deepEqual(replayed.world.unitsById[player.id], session.world.unitsById[player.id]);
});

function assertUniqueFriendlyHexes(session: ReturnType<typeof createPhaseOneSession>): void {
  const friendlies = session.world.units.filter((unit) => unit.side === "friendly");
  const occupied = new Set(friendlies.map((unit) => `${unit.coord.q},${unit.coord.r}`));
  assert.equal(occupied.size, friendlies.length);
}

function latestOrderTargets(session: ReturnType<typeof createPhaseOneSession>): Map<string, { q: number; r: number }> {
  const targets = new Map<string, { q: number; r: number }>();
  for (const event of session.events.filter((event) => event.type === "order_delivery_resolved" && event.payload.status === "received")) {
    targets.set(String(event.payload.unitId), event.payload.target as { q: number; r: number });
  }
  return targets;
}

function lineTargetsByUnit(session: ReturnType<typeof createPhaseOneSession>): Record<string, { q: number; r: number }> {
  return Object.fromEntries(latestOrderTargets(session));
}

function tileAt(projection: ReturnType<typeof projectSession>, coord: { q: number; r: number }) {
  return projection.map.tiles.find((tile) => tile.coord.q === coord.q && tile.coord.r === coord.r);
}

function mapPoint(coord: { q: number; r: number }): { x: number; y: number } {
  return {
    x: Math.sqrt(3) * (coord.q + coord.r / 2),
    y: 1.5 * coord.r,
  };
}

function mapPointToHex(point: { x: number; y: number }): { q: number; r: number } {
  const q = (Math.sqrt(3) / 3) * point.x - point.y / 3;
  const r = (2 / 3) * point.y;
  return cubeRound({ x: q, y: -q - r, z: r });
}

function cubeRound(cube: { x: number; y: number; z: number }): { q: number; r: number } {
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

function assertLeaderAndDeputyClose(session: ReturnType<typeof createPhaseOneSession>): void {
  const leader = session.world.units.find((unit) => unit.role === "leader");
  const deputy = session.world.units.find((unit) => unit.role === "deputy_leader");
  assert.ok(leader);
  assert.ok(deputy);
  const leaderTarget = leader.intent.type === "moving" ? leader.intent.target : leader.coord;
  const deputyTarget = deputy.intent.type === "moving" ? deputy.intent.target : deputy.coord;
  assert.ok(hexDistance(leaderTarget, deputyTarget) <= 2);
}
