import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceSession,
  createPhaseOneSession,
  dispatchCommand,
  hexDistance,
  listScenarioOptions,
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

test("scenario options expose troop, goal, and selectable difficulty-backed setup", () => {
  const scenarios = listScenarioOptions();
  assert.ok(scenarios.some((scenario) => scenario.id === "cover_to_cover" && scenario.troop.length === 1));
  assert.ok(scenarios.some((scenario) => scenario.id === "cover_to_cover_hasty" && scenario.training?.constraints?.timeLimitSeconds === 55));
  assert.ok(scenarios.some((scenario) => scenario.id === "cover_to_cover_observed" && scenario.training?.constraints?.maxExposureSamples?.hard === true));
  assert.ok(scenarios.some((scenario) => scenario.id === "leader_lost_picture" && scenario.troop.length === 8));
  assert.ok(scenarios.some((scenario) => scenario.id === "river_bridge_crossing" && scenario.recommendedFormation === "file"));
  assert.ok(scenarios.some((scenario) => scenario.id === "ditch_line_contact" && scenario.troop.length === 8));
  assert.equal(scenarios.filter((scenario) => scenario.id.startsWith("cover_to_cover")).length, 3);

  const session = createPhaseOneSession({
    seed: "scenario-picker",
    scenarioId: "risk_zone_blocking",
    difficulty: "realistic",
  });
  const projection = projectSession(session);

  assert.equal(projection.scenario.id, "risk_zone_blocking");
  assert.equal(projection.scenario.difficulty, "realistic");
  assert.equal(projection.perception.informationMode, "realistic");
  assert.equal(projection.player.role, "leader");
  assert.equal(session.world.units.filter((unit) => unit.side === "friendly").length, 2);
  assert.deepEqual(projection.objective.target, { q: 24, r: 50 });
});

test("group commander troop uses grpc and stf as tät leaders", () => {
  const session = createPhaseOneSession({ seed: "tat-leaders", scenarioId: "leader_lost_picture" });
  const leader = session.world.unitsById.LEADER_1;
  const deputy = session.world.unitsById.DEPUTY_1;

  assert.equal(leader.element, "tat_1");
  assert.equal(leader.elementPosition, 1);
  assert.equal(deputy.element, "tat_2");
  assert.equal(deputy.elementPosition, 1);
  assert.deepEqual(tatOrder(session, "tat_1"), ["LEADER_1", "FRIENDLY_1", "FRIENDLY_2", "FRIENDLY_3"]);
  assert.deepEqual(tatOrder(session, "tat_2"), ["DEPUTY_1", "FRIENDLY_4", "FRIENDLY_5", "FRIENDLY_6"]);
});

test("cover-to-cover training scenarios project U3T brief and AAR metrics", () => {
  const session = createPhaseOneSession({
    seed: "u3t-projection",
    scenarioId: "cover_to_cover_observed",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const projection = projectSession(session);

  assert.equal(projection.scenario.training?.u3t.uppgiften.includes("Nå målskyddet"), true);
  assert.equal(projection.objective.constraints?.maxDetectionEvents, 0);
  assert.equal(projection.aar.u3t?.brief.tiden.includes("Ingen fast tidsgräns"), true);
  assert.equal(projection.aar.u3t?.metrics.detectionEvents, 0);
  assert.equal(projection.aar.u3t?.observations.length, 4);
});

test("hasty cover-to-cover scenario fails when the timer threshold is exceeded", () => {
  let session = createPhaseOneSession({
    seed: "hasty-timeout",
    scenarioId: "cover_to_cover_hasty",
    difficulty: "training",
    overrides: { opposing: [] },
  });

  session = advanceSession(session, 56, { random: () => 1 });
  const failure = session.events.find((event) => event.type === "objective_failed");
  const projection = projectSession(session);

  assert.equal(session.world.objective.status, "failed");
  assert.equal(failure?.payload.reason, "time_limit_exceeded");
  assert.ok(projection.aar.u3t?.metrics.hardFailures.includes("time_limit_exceeded"));
});

test("observed cover-to-cover scenario fails on hard exposure thresholds", () => {
  let session = createPhaseOneSession({
    seed: "observed-exposure",
    scenarioId: "cover_to_cover_observed",
    difficulty: "training",
    overrides: {
      opposing: [],
      player: { posture: "standing" },
      terrainPatches: [{ coord: { q: 8, r: 50 }, terrain: "field" }],
    },
  });

  for (let step = 0; step < 9 && session.world.objective.status === "active"; step += 1) {
    session = advanceSession(session, 1, { random: () => 1 });
  }

  const failure = session.events.find((event) => event.type === "objective_failed");
  const projection = projectSession(session);

  assert.equal(session.world.objective.status, "failed");
  assert.equal(failure?.payload.reason, "exposure_threshold_exceeded");
  assert.ok((projection.aar.u3t?.metrics.highExposureSamples ?? 0) > 8);
  assert.ok(projection.aar.u3t?.metrics.hardFailures.includes("exposure_threshold_exceeded"));
});

test("procedural scenario maps create continuous roads, ditches, rivers, and bridge crossings", () => {
  const bridgeSession = createPhaseOneSession({
    seed: "procedural-bridge",
    scenarioId: "river_bridge_crossing",
    difficulty: "training",
  });
  const bridgeTerrain = terrainCounts(bridgeSession);

  assert.ok((bridgeTerrain.water ?? 0) > 20);
  assert.ok((bridgeTerrain.bridge ?? 0) > 0);
  assert.ok((bridgeTerrain.road ?? 0) > 15);
  assert.equal(connectedTerrainCount(bridgeSession, new Set(["water", "bridge"])), (bridgeTerrain.water ?? 0) + (bridgeTerrain.bridge ?? 0));
  assert.ok(terrainHasNeighbour(bridgeSession, "bridge", new Set(["road"])));

  let movingSession = bridgeSession;
  const leader = movingSession.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);
  movingSession = dispatchCommand(movingSession, {
    type: "move_to_hex",
    unitId: leader.id,
    target: movingSession.world.objective.target,
    issuedAt: movingSession.world.time,
  });
  const movement = movingSession.events.find((event) => event.type === "movement_started");
  assert.ok(movement);
  const path = movement.payload.path as Array<{ q: number; r: number }>;
  assert.ok(path.some((coord) => movingSession.world.map.tilesByKey[`${coord.q},${coord.r}`]?.terrain === "bridge"));
  assert.ok(path.every((coord) => movingSession.world.map.tilesByKey[`${coord.q},${coord.r}`]?.terrain !== "water"));

  const ditchSession = createPhaseOneSession({
    seed: "procedural-ditch",
    scenarioId: "ditch_line_contact",
    difficulty: "training",
  });
  const ditchTerrain = terrainCounts(ditchSession);
  assert.ok((ditchTerrain.ditch ?? 0) > 20);
  assert.equal(connectedTerrainCount(ditchSession, new Set(["ditch"])), ditchTerrain.ditch);
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
    direction: "NW",
    issuedAt: session.world.time,
  });

  assert.equal(session.world.activeFormation?.formation, "file");
  assert.deepEqual(lineTargetsByUnit(session), {
    LEADER_1: { q: 8, r: 50 },
    DEPUTY_1: { q: 10, r: 50 },
    FRIENDLY_1: { q: 12, r: 50 },
    FRIENDLY_2: { q: 14, r: 50 },
    FRIENDLY_3: { q: 16, r: 50 },
    FRIENDLY_4: { q: 18, r: 50 },
    FRIENDLY_5: { q: 20, r: 50 },
    FRIENDLY_6: { q: 22, r: 50 },
  });
  const targets = Object.values(lineTargetsByUnit(session));
  for (let index = 0; index < targets.length - 1; index += 1) {
    assert.equal(hexDistance(targets[index], targets[index + 1]), 2);
  }
});

test("skytteled follows when the group commander plots an embodied move", () => {
  let session = createPhaseOneSession({ seed: "skytteled-follow", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session = dispatchCommand(session, {
    type: "issue_formation_order",
    unitId: leader.id,
    target: leader.coord,
    formation: "file",
    communication: "radio",
    direction: "NW",
    issuedAt: session.world.time,
  });

  for (let step = 0; step < 120 && session.world.units.some((unit) => unit.side === "friendly" && unit.intent.type !== "idle"); step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }

  const formedLeader = session.world.unitsById[leader.id];
  session = dispatchCommand(session, {
    type: "issue_forward_order",
    unitId: formedLeader.id,
    formation: "file",
    communication: "radio",
    direction: "NW",
    issuedAt: session.world.time,
  });

  for (let step = 0; step < 80 && session.world.activeFormation?.phase !== "advancing"; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }

  const advancingLeader = session.world.unitsById[leader.id];
  session = dispatchCommand(session, {
    type: "move_to_hex",
    unitId: advancingLeader.id,
    target: { q: advancingLeader.coord.q - 3, r: advancingLeader.coord.r },
    issuedAt: session.world.time,
  });

  for (let step = 0; step < 3; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }

  const movingFollowers = session.world.units.filter((unit) => unit.side === "friendly" && unit.role !== "leader" && unit.intent.type === "moving");
  assert.ok(movingFollowers.length >= 4);
  assert.ok(
    session.events.some(
      (event) => event.type === "movement_started" && event.payload.reason === "embodied_leader_follow" && event.payload.unitId !== leader.id,
    ),
  );
  assertUniqueFriendlyHexes(session);
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
  assert.ok(session.events.some((event) => event.type === "movement_started" && event.payload.reason === "embodied_leader_follow"));

  session = dispatchCommand(session, {
    type: "halt_group",
    unitId: leader.id,
    issuedAt: session.world.time,
  });

  assert.ok(session.events.some((event) => event.type === "group_halted"));
  assert.equal(session.world.activeFormation?.orderKind, "formation");
  assert.equal(session.world.activeFormation?.phase, undefined);
  assert.equal(session.world.activeFormation?.advanceTarget, undefined);
  assert.deepEqual(session.world.activeFormation?.target, session.world.unitsById[leader.id].coord);
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

  assert.equal(projection.perception.informationMode, "normal");
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
  const projection = projectSession(session);
  const waitingUnit = projection.units.find((unit) => unit.id === "FRIENDLY_2");
  assert.equal(waitingUnit?.activity.state, "waiting");
  assert.equal(waitingUnit?.activity.reason, "neighbour_lagging");
  assert.equal(waitingUnit?.activity.relatedUnitId, "FRIENDLY_1");
  assert.deepEqual(waitingUnit?.activity.target, { q: 23, r: 20 });
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
  assert.ok(session.events.some((event) => event.type === "incoming_fire_resolved"));
  assert.ok(session.events.some((event) => event.type === "unit_wounded"));
  assert.equal(session.world.unitsById.FRIENDLY_1.posture, "injured");
});

test("friendly soldiers crouch and return fire when contact pressure is emitted", () => {
  let session = createPhaseOneSession({
    seed: "friendly-contact-reaction",
    scenarioId: "risk_zone_blocking",
    difficulty: "training",
    overrides: {
      player: { coord: { q: 12, r: 10 }, posture: "standing", facing: "SE", lookDirection: "SE" },
      opposing: [{ id: "OP_TEST", coord: { q: 16, r: 10 }, facing: "NW", lookDirection: "NW", posture: "standing" }],
      terrainPatches: [
        { coord: { q: 12, r: 10 }, terrain: "field" },
        { coord: { q: 13, r: 10 }, terrain: "field" },
        { coord: { q: 14, r: 10 }, terrain: "field" },
        { coord: { q: 15, r: 10 }, terrain: "field" },
        { coord: { q: 16, r: 10 }, terrain: "field" },
      ],
    },
  });
  session.world.unitsById.OP_TEST.alerted = true;

  session = advanceSession(session, 0.2, { random: () => 1 });

  assert.equal(session.world.unitsById.LEADER_1.posture, "crouched");
  assert.equal(session.world.unitsById.FRIENDLY_1.posture, "crouched");
  const returnFireEvents = session.events.filter(
    (event) => event.type === "friendly_fire_delivered" && event.payload.reason === "contact_reaction",
  );
  assert.ok(returnFireEvents.some((event) => event.payload.unitId === "LEADER_1" && event.payload.targetId === "OP_TEST"));
  assert.ok(returnFireEvents.some((event) => event.payload.unitId === "FRIENDLY_1" && event.payload.targetId === "OP_TEST"));
  assert.ok(session.world.unitsById.OP_TEST.suppression > 0);
});

test("friendly return fire can neutralize an exposed opposing unit", () => {
  let session = createPhaseOneSession({
    seed: "friendly-return-fire-neutralizes",
    scenarioId: "risk_zone_blocking",
    difficulty: "training",
    overrides: {
      player: { coord: { q: 12, r: 10 }, posture: "standing", facing: "SE", lookDirection: "SE" },
      opposing: [{ id: "OP_TEST", coord: { q: 16, r: 10 }, facing: "NW", lookDirection: "NW", posture: "standing" }],
      terrainPatches: [
        { coord: { q: 12, r: 10 }, terrain: "field" },
        { coord: { q: 13, r: 10 }, terrain: "field" },
        { coord: { q: 14, r: 10 }, terrain: "field" },
        { coord: { q: 15, r: 10 }, terrain: "field" },
        { coord: { q: 16, r: 10 }, terrain: "field" },
      ],
    },
  });
  session.world.unitsById.OP_TEST.alerted = true;

  const rolls = [1, 1, 0];
  session = advanceSession(session, 0.2, { random: () => rolls.shift() ?? 1 });

  assert.ok(session.events.some((event) => event.type === "friendly_fire_resolved" && event.payload.targetId === "OP_TEST"));
  assert.ok(
    session.events.some(
      (event) => event.type === "unit_wounded" && event.payload.unitId === "OP_TEST" && event.payload.reason === "return_fire",
    ),
  );
  assert.equal(session.world.unitsById.OP_TEST.health, 0);
  assert.equal(session.world.unitsById.OP_TEST.posture, "injured");
});

test("friendly soldiers do not raise lower protective postures during contact reaction", () => {
  let session = createPhaseOneSession({
    seed: "friendly-contact-keeps-prone",
    scenarioId: "risk_zone_blocking",
    difficulty: "training",
    overrides: {
      player: { coord: { q: 12, r: 10 }, posture: "prone", facing: "SE", lookDirection: "SE" },
      opposing: [{ id: "OP_TEST", coord: { q: 16, r: 10 }, facing: "NW", lookDirection: "NW", posture: "standing" }],
      terrainPatches: [
        { coord: { q: 12, r: 10 }, terrain: "ditch" },
        { coord: { q: 13, r: 10 }, terrain: "field" },
        { coord: { q: 14, r: 10 }, terrain: "field" },
        { coord: { q: 15, r: 10 }, terrain: "field" },
        { coord: { q: 16, r: 10 }, terrain: "field" },
      ],
    },
  });
  session.world.unitsById.OP_TEST.alerted = true;

  session = advanceSession(session, 0.2, { random: () => 1 });

  assert.equal(session.world.unitsById.LEADER_1.posture, "prone");
  assert.equal(session.world.unitsById.FRIENDLY_1.posture, "crouched");
});

test("ambush enemies start in prepared cover and concealment", () => {
  const session = createPhaseOneSession({
    seed: "prepared-ambush-cover",
    scenarioId: "casualty_retreat",
    difficulty: "training",
  });

  const opposing = session.world.units.filter((unit) => unit.side === "opposing");
  assert.ok(opposing.length > 0);
  for (const unit of opposing) {
    const tile = session.world.map.tilesByKey[`${unit.coord.q},${unit.coord.r}`];
    assert.equal(unit.alerted, true);
    assert.equal(unit.posture, "crouched");
    assert.ok(unit.status.includes("prepared_position"));
    assert.ok(unit.status.includes("in_cover"));
    assert.ok(unit.status.includes("concealed"));
    assert.ok((tile?.cover ?? 0) >= 1);
    assert.ok((tile?.concealment ?? 0) >= 1);
    assert.ok((tile?.exposure ?? 3) <= 1);
  }
});

test("prepared ambush positions do not draw immediate automatic return fire", () => {
  let session = createPhaseOneSession({
    seed: "prepared-ambush-no-instant-fire",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
  });

  session = advanceSession(session, 0.2, { random: () => 1 });

  assert.ok(session.events.some((event) => event.type === "contact_pressure_emitted"));
  assert.ok(session.events.some((event) => event.type === "posture_changed" && event.payload.reason === "contact_reaction"));
  assert.ok(
    !session.events.some(
      (event) => event.type === "friendly_fire_delivered" && event.payload.reason === "contact_reaction",
    ),
  );
});

test("opposing fire ignores soldiers that are already down", () => {
  let session = createPhaseOneSession({
    seed: "opposing-skip-injured",
    scenarioId: "risk_zone_blocking",
    difficulty: "training",
    overrides: {
      player: { coord: { q: 12, r: 10 }, posture: "standing", facing: "SE", lookDirection: "SE" },
      opposing: [{ id: "OP_TEST", coord: { q: 16, r: 10 }, facing: "NW", lookDirection: "NW", posture: "standing" }],
      terrainPatches: [
        { coord: { q: 12, r: 10 }, terrain: "field" },
        { coord: { q: 13, r: 10 }, terrain: "field" },
        { coord: { q: 14, r: 10 }, terrain: "field" },
        { coord: { q: 15, r: 10 }, terrain: "field" },
        { coord: { q: 16, r: 10 }, terrain: "field" },
      ],
    },
  });
  const alreadyInjured = session.world.unitsById.FRIENDLY_1;
  alreadyInjured.health = 35;
  alreadyInjured.posture = "injured";
  alreadyInjured.status = ["injured"];

  session = advanceSession(session, 0.2, { random: () => 0 });

  const fire = session.events.find((event) => event.type === "incoming_fire_resolved");
  assert.equal(fire?.payload.targetId, "LEADER_1");
  assert.ok(!session.events.some((event) => event.type === "incoming_fire_resolved" && event.payload.targetId === "FRIENDLY_1"));
});

test("opposing observers retarget after another enemy wounds a soldier in the same tick", () => {
  let session = createPhaseOneSession({
    seed: "opposing-retarget-pending-wound",
    scenarioId: "risk_zone_blocking",
    difficulty: "training",
    overrides: {
      player: { coord: { q: 12, r: 10 }, posture: "standing", facing: "SE", lookDirection: "SE" },
      opposing: [
        { id: "OP_A", coord: { q: 16, r: 10 }, facing: "NW", lookDirection: "NW", posture: "standing" },
        { id: "OP_B", coord: { q: 16, r: 11 }, facing: "NW", lookDirection: "NW", posture: "standing" },
      ],
      terrainPatches: [
        { coord: { q: 12, r: 10 }, terrain: "field" },
        { coord: { q: 13, r: 10 }, terrain: "field" },
        { coord: { q: 14, r: 10 }, terrain: "field" },
        { coord: { q: 15, r: 10 }, terrain: "field" },
        { coord: { q: 16, r: 10 }, terrain: "field" },
        { coord: { q: 16, r: 11 }, terrain: "field" },
      ],
    },
  });

  session = advanceSession(session, 0.2, { random: () => 0 });

  const fireTargets = session.events
    .filter((event) => event.type === "incoming_fire_resolved")
    .map((event) => event.payload.targetId);
  assert.deepEqual(fireTargets, ["FRIENDLY_1", "LEADER_1"]);
});

test("opposing fire keeps resolving after a previous wound", () => {
  let session = createPhaseOneSession({
    seed: "opposing-repeat-wounds",
    scenarioId: "risk_zone_blocking",
    difficulty: "training",
    overrides: {
      player: { coord: { q: 12, r: 10 }, posture: "standing", facing: "SE", lookDirection: "SE" },
      opposing: [
        {
          id: "OP_TEST",
          coord: { q: 16, r: 10 },
          facing: "NW",
          lookDirection: "NW",
          posture: "crouched",
          alerted: true,
          status: ["prepared_position"],
        },
      ],
      terrainPatches: [
        { coord: { q: 12, r: 10 }, terrain: "field" },
        { coord: { q: 13, r: 10 }, terrain: "field" },
        { coord: { q: 14, r: 10 }, terrain: "field" },
        { coord: { q: 15, r: 10 }, terrain: "field" },
        { coord: { q: 16, r: 10 }, terrain: "ditch" },
      ],
    },
  });

  for (let step = 0; step < 8; step += 1) {
    session = advanceSession(session, 0.5, { random: () => 0 });
  }

  const fireTargets = session.events
    .filter((event) => event.type === "incoming_fire_resolved")
    .map((event) => event.payload.targetId);
  const woundTargets = session.events
    .filter((event) => event.type === "unit_wounded")
    .map((event) => event.payload.unitId);
  assert.deepEqual(fireTargets, ["FRIENDLY_1", "LEADER_1"]);
  assert.deepEqual(woundTargets, ["FRIENDLY_1", "LEADER_1"]);
});

test("skadad soldat scenario has near opposing fire that can wound a group member", () => {
  let session = createPhaseOneSession({
    seed: "injury-scenario",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
  });

  const opposing = session.world.units.filter((unit) => unit.side === "opposing");
  assert.ok(opposing.some((unit) => hexDistance(unit.coord, session.world.objective.target) <= 8));

  session = advanceSession(session, 0.5, { random: () => 0 });

  const wound = session.events.find((event) => event.type === "unit_wounded");
  assert.ok(wound);
  const wounded = session.world.unitsById[String(wound.payload.unitId)];
  assert.equal(wounded.posture, "injured");
  assert.ok(wounded.status.includes("injured"));
  assert.ok(session.events.some((event) => event.type === "status_report_emitted" && event.payload.sourceUnitId === wounded.id));
});

test("group can mark ÅSA1 and ÅSA2 without making ÅSA drive casualty movement", () => {
  let session = createPhaseOneSession({
    seed: "casualty-evacuation",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);
  const casualty = session.world.unitsById.FRIENDLY_6;
  casualty.health = 35;
  casualty.posture = "injured";
  casualty.status = ["injured"];

  const asa1 = { q: 3, r: 57 };
  const asa2 = { q: 4, r: 57 };
  session = dispatchCommand(session, {
    type: "set_casualty_collection_point",
    unitId: leader.id,
    collectionPointId: "asa1",
    target: asa1,
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "set_casualty_collection_point",
    unitId: leader.id,
    collectionPointId: "asa2",
    target: asa2,
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "start_casualty_evacuation",
    unitId: leader.id,
    collectionPointId: "asa2",
    casualtyUnitId: casualty.id,
    issuedAt: session.world.time,
  });

  assert.equal(session.world.casualtyEvacuation?.phase, "moving_to_casualty");
  assert.deepEqual(session.world.casualtyEvacuation?.collectionPoints?.asa1?.coord, asa1);
  assert.deepEqual(session.world.casualtyEvacuation?.collectionPoints?.asa2?.coord, asa2);
  assert.equal(session.world.casualtyEvacuation?.activeCollectionPointId, "asa2");
  assert.equal(session.world.casualtyEvacuation?.helperUnitIds.length, 2);

  for (let step = 0; step < 90 && session.world.casualtyEvacuation?.phase !== "dragging"; step += 1) {
    session = advanceSession(session, 0.5, { random: () => 1 });
  }

  assert.equal(session.world.casualtyEvacuation?.phase, "dragging");
  assert.ok(hexDistance(session.world.unitsById.FRIENDLY_6.coord, asa2) > 1);
  assert.ok(session.events.some((event) => event.type === "casualty_drag_started"));
  assert.ok(!session.events.some((event) => event.type === "casualty_evacuation_completed"));
  assert.equal(session.world.casualtyTeam?.teamIntent, "holding");

  const projection = projectSession(session);
  assert.deepEqual(projection.casualtyEvacuation?.collectionPoint, asa2);
  assert.deepEqual(projection.casualtyEvacuation?.collectionPoints?.asa1?.coord, asa1);
  assert.deepEqual(projection.casualtyEvacuation?.collectionPoints?.asa2?.coord, asa2);
  assert.equal(projection.units.find((unit) => unit.id === "FRIENDLY_6")?.activity.tacticalRole, "casualty");
});

test("skadad under reträtt starts with casualty, opposing pressure, and direct scenario metadata", () => {
  const scenarios = listScenarioOptions();
  const retreat = scenarios.find((scenario) => scenario.id === "casualty_retreat");
  assert.ok(retreat);
  assert.equal(retreat.troop.length, 8);
  assert.equal(retreat.recommendedFormation, "line");

  const session = createPhaseOneSession({
    seed: "casualty-retreat-start",
    scenarioId: "casualty_retreat",
    difficulty: "training",
  });
  const projection = projectSession(session);

  assert.equal(projection.scenario.id, "casualty_retreat");
  assert.equal(session.world.unitsById.FRIENDLY_6.posture, "injured");
  assert.ok(session.world.unitsById.FRIENDLY_6.status.includes("injured"));
  assert.ok(session.world.unitsById.FRIENDLY_6.status.includes("primary_casualty"));
  assert.ok(session.world.units.some((unit) => unit.side === "opposing"));
});

test("skadad under reträtt prioritizes Falk even if another soldier is also wounded", () => {
  let session = createPhaseOneSession({
    seed: "casualty-retreat-primary",
    scenarioId: "casualty_retreat",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);
  const deputy = session.world.unitsById.DEPUTY_1;
  deputy.health = 35;
  deputy.posture = "injured";
  deputy.status = ["injured"];

  session = dispatchCommand(session, {
    type: "set_casualty_collection_point",
    unitId: leader.id,
    collectionPointId: "asa1",
    target: { q: 13, r: 56 },
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "start_casualty_evacuation",
    unitId: leader.id,
    collectionPointId: "asa1",
    casualtyUnitId: deputy.id,
    issuedAt: session.world.time,
  });

  assert.equal(session.world.casualtyEvacuation?.casualtyUnitId, "FRIENDLY_6");
  assert.ok(session.world.unitsById.FRIENDLY_6.status.includes("evac_pending"));
  assert.ok(!session.world.unitsById.DEPUTY_1.status.includes("evac_pending"));
});

test("växelvis bakåt alternates tät and delivers covering fire with suppression", () => {
  let session = createPhaseOneSession({
    seed: "alternating-retreat",
    scenarioId: "casualty_retreat",
    difficulty: "training",
  });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session = dispatchCommand(session, {
    type: "issue_alternating_retreat_order",
    unitId: leader.id,
    direction: "SW",
    communication: "voice",
    issuedAt: session.world.time,
  });

  assert.equal(session.world.activeManeuver?.type, "alternating_retreat");
  assert.deepEqual(new Set(session.world.activeManeuver?.movingUnitIds), new Set(["LEADER_1", "FRIENDLY_1", "FRIENDLY_2", "FRIENDLY_3"]));
  assert.deepEqual(new Set(session.world.activeManeuver?.boundStartedUnitIds), new Set(["LEADER_1", "FRIENDLY_1", "FRIENDLY_2", "FRIENDLY_3"]));
  assert.ok(session.world.activeManeuver?.coveringUnitIds.includes("DEPUTY_1"));
  assert.ok(session.events.some((event) => event.type === "movement_started" && event.payload.reason === "retreat_bound"));

  for (let step = 0; step < 80 && !session.events.some((event) => event.type === "tactical_maneuver_phase_changed" && event.payload.boundIndex === 1); step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertUniqueFriendlyHexes(session);
  }

  assert.deepEqual(new Set(session.world.activeManeuver?.movingUnitIds), new Set(["DEPUTY_1", "FRIENDLY_4", "FRIENDLY_5"]));
  assert.ok(session.events.some((event) => event.type === "friendly_fire_delivered"));
  assert.ok(session.events.some((event) => event.type === "suppression_applied"));
});

test("växelvis framåt alternates tät while the other tät covers", () => {
  let session = createPhaseOneSession({ seed: "alternating-forward", scenario: "group_commander" });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);
  const leaderStart = leader.coord;

  session = dispatchCommand(session, {
    type: "issue_alternating_forward_order",
    unitId: leader.id,
    direction: "SE",
    communication: "voice",
    issuedAt: session.world.time,
  });

  assert.equal(session.world.activeManeuver?.type, "alternating_forward");
  assert.deepEqual(new Set(session.world.activeManeuver?.movingUnitIds), new Set(["LEADER_1", "FRIENDLY_1", "FRIENDLY_2", "FRIENDLY_3"]));
  assert.deepEqual(new Set(session.world.activeManeuver?.boundStartedUnitIds), new Set(["LEADER_1", "FRIENDLY_1", "FRIENDLY_2", "FRIENDLY_3"]));
  assert.ok(session.world.activeManeuver?.coveringUnitIds.includes("DEPUTY_1"));
  const leaderMove = session.events.find((event) => event.type === "movement_started" && event.payload.unitId === "LEADER_1");
  assert.equal(leaderMove?.payload.reason, "alternating_forward_bound");
  assert.ok((leaderMove?.payload.target as { q: number; r: number }).q > leaderStart.q);
  const firstBoundTargets = session.events
    .filter((event) => event.type === "movement_started" && event.payload.reason === "alternating_forward_bound")
    .map((event) => event.payload.target as { q: number; r: number });
  assert.equal(new Set(firstBoundTargets.map((target) => `${target.q},${target.r}`)).size, firstBoundTargets.length);
  for (let a = 0; a < firstBoundTargets.length; a += 1) {
    for (let b = a + 1; b < firstBoundTargets.length; b += 1) {
      assert.ok(hexDistance(firstBoundTargets[a], firstBoundTargets[b]) >= 2);
    }
  }
  assert.equal(session.world.unitsById.DEPUTY_1.lookDirection, "SE");
  assertElementOnlyStatus(session, "tat_1", "forward_moving");
  assertElementOnlyStatus(session, "tat_2", "covering_fire");

  for (let step = 0; step < 80 && session.world.activeManeuver?.phase !== "handoff"; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertUniqueFriendlyHexes(session);
    assertAlternatingForwardTatsCoherent(session);
  }
  assert.equal(session.world.activeManeuver?.phase, "handoff");
  assertElementOnlyStatus(session, "tat_1", "covering_fire");
  assertElementOnlyStatus(session, "tat_2", "covering_fire");
  assert.ok(session.events.some((event) => event.type === "status_report_emitted" && event.payload.message === "ELDSTÄLLNINGAR"));

  for (let step = 0; step < 20 && !session.events.some((event) => event.type === "tactical_maneuver_phase_changed" && event.payload.boundIndex === 1); step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertUniqueFriendlyHexes(session);
    assertAlternatingForwardTatsCoherent(session);
  }

  assert.deepEqual(new Set(session.world.activeManeuver?.movingUnitIds), new Set(["DEPUTY_1", "FRIENDLY_4", "FRIENDLY_5", "FRIENDLY_6"]));
  assertElementOnlyStatus(session, "tat_1", "covering_fire");
  assertElementOnlyStatus(session, "tat_2", "forward_moving");
  assert.ok(session.events.some((event) => event.type === "friendly_fire_delivered"));
  const secondBound = session.events.find((event) => event.type === "tactical_maneuver_phase_changed" && event.payload.boundIndex === 1);
  assert.ok(secondBound);
  assert.deepEqual(new Set(secondBound.payload.boundStartedUnitIds as string[]), new Set(["DEPUTY_1", "FRIENDLY_4", "FRIENDLY_5", "FRIENDLY_6"]));
  assert.ok(
    session.events.some(
      (event) =>
        event.type === "friendly_fire_delivered" &&
        event.time <= secondBound.time &&
        ["DEPUTY_1", "FRIENDLY_4", "FRIENDLY_5", "FRIENDLY_6"].includes(String(event.payload.unitId)),
    ),
  );
  const secondBoundTargets = session.events
    .filter((event) => event.time >= secondBound.time && event.type === "movement_started" && event.payload.reason === "alternating_forward_bound")
    .map((event) => event.payload.target as { q: number; r: number });
  assert.equal(new Set(secondBoundTargets.map((target) => `${target.q},${target.r}`)).size, secondBoundTargets.length);
  for (let a = 0; a < secondBoundTargets.length; a += 1) {
    for (let b = a + 1; b < secondBoundTargets.length; b += 1) {
      assert.ok(hexDistance(secondBoundTargets[a], secondBoundTargets[b]) >= 2);
    }
  }
  const projection = projectSession(session);
  assert.equal(projection.activeManeuver?.type, "alternating_forward");
  assert.equal(projection.units.find((unit) => unit.id === "DEPUTY_1")?.activity.reason, "alternating_forward_bound");
});

test("blixtlås vänster and höger start from opposite flanks", () => {
  const leftSession = createPhaseOneSession({
    seed: "zipper-left",
    scenarioId: "casualty_retreat",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const rightSession = createPhaseOneSession({
    seed: "zipper-left",
    scenarioId: "casualty_retreat",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const leader = leftSession.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  const left = dispatchCommand(leftSession, {
    type: "issue_zipper_retreat_order",
    unitId: leader.id,
    side: "left",
    direction: "SW",
    communication: "voice",
    issuedAt: leftSession.world.time,
  });
  const right = dispatchCommand(rightSession, {
    type: "issue_zipper_retreat_order",
    unitId: leader.id,
    side: "right",
    direction: "SW",
    communication: "voice",
    issuedAt: rightSession.world.time,
  });

  assert.equal(left.world.activeManeuver?.type, "zipper_retreat");
  assert.equal(right.world.activeManeuver?.type, "zipper_retreat");
  assert.equal(left.world.activeManeuver?.movingUnitIds.length, 1);
  assert.equal(right.world.activeManeuver?.movingUnitIds.length, 1);
  assert.notEqual(left.world.activeManeuver?.movingUnitIds[0], right.world.activeManeuver?.movingUnitIds[0]);
});

test("retreat movement waits when no covering fire or protective terrain exists", () => {
  let session = createPhaseOneSession({
    seed: "retreat-no-cover",
    scenarioId: "casualty_retreat",
    difficulty: "training",
    overrides: { opposing: [], terrainPatches: [{ coord: { q: 22, r: 52 }, terrain: "field" }] },
  });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);
  for (const unit of session.world.units.filter((candidate) => candidate.side === "friendly" && candidate.element === "tat_2")) {
    unit.posture = "injured";
    unit.status = ["injured"];
  }
  const deputy = session.world.unitsById.DEPUTY_1;
  deputy.posture = "injured";
  deputy.status = ["injured"];

  session = dispatchCommand(session, {
    type: "issue_alternating_retreat_order",
    unitId: leader.id,
    direction: "SW",
    communication: "voice",
    issuedAt: session.world.time,
  });

  assert.ok(session.events.some((event) => event.type === "movement_waiting" && event.payload.reason === "retreat_cover_missing"));
  assert.deepEqual(session.world.activeManeuver?.boundStartedUnitIds, []);
  for (let step = 0; step < 4; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }
  assert.equal(session.world.activeManeuver?.boundIndex, 0);
  assert.deepEqual(session.world.activeManeuver?.boundStartedUnitIds, []);
  assert.ok(!session.events.some((event) => event.type === "tactical_maneuver_phase_changed" && event.payload.boundIndex === 1));
});

test("friendly covering fire lowers incoming casualty probability through suppression", () => {
  const baseOptions = {
    seed: "suppression-risk",
    overrides: {
      player: { coord: { q: 12, r: 10 }, posture: "standing", facing: "SE" },
      opposing: [{ id: "OP_TEST", coord: { q: 16, r: 10 }, facing: "NW", posture: "standing" }],
      terrainPatches: [
        { coord: { q: 12, r: 10 }, terrain: "field" },
        { coord: { q: 13, r: 10 }, terrain: "field" },
        { coord: { q: 14, r: 10 }, terrain: "field" },
        { coord: { q: 15, r: 10 }, terrain: "field" },
        { coord: { q: 16, r: 10 }, terrain: "field" },
      ],
    },
  } as const;
  let unsuppressed = createPhaseOneSession(baseOptions);
  let suppressed = createPhaseOneSession(baseOptions);
  suppressed.world.unitsById.OP_TEST.suppression = 1;

  unsuppressed = advanceSession(unsuppressed, 0.2, { random: detectionThenSafeRoll() });
  suppressed = advanceSession(suppressed, 0.2, { random: detectionThenSafeRoll() });

  const unsuppressedRisk = Number(unsuppressed.events.find((event) => event.type === "incoming_fire_resolved")?.payload.probability);
  const suppressedRisk = Number(suppressed.events.find((event) => event.type === "incoming_fire_resolved")?.payload.probability);
  assert.ok(Number.isFinite(unsuppressedRisk));
  assert.ok(Number.isFinite(suppressedRisk));
  assert.ok(suppressedRisk < unsuppressedRisk);
});

test("tactical covering fire can neutralize an exposed opposing unit", () => {
  let session = createPhaseOneSession({
    seed: "covering-fire-neutralizes",
    scenarioId: "risk_zone_blocking",
    difficulty: "training",
    overrides: {
      player: { coord: { q: 12, r: 10 }, posture: "standing", facing: "SE", lookDirection: "SE" },
      opposing: [{ id: "OP_TEST", coord: { q: 16, r: 10 }, facing: "NW", lookDirection: "NW", posture: "standing" }],
      terrainPatches: [
        { coord: { q: 12, r: 10 }, terrain: "field" },
        { coord: { q: 13, r: 10 }, terrain: "field" },
        { coord: { q: 14, r: 10 }, terrain: "field" },
        { coord: { q: 15, r: 10 }, terrain: "field" },
        { coord: { q: 16, r: 10 }, terrain: "field" },
      ],
    },
  });
  session.world.unitsById.LEADER_1.status = ["covering_fire"];
  session.world.unitsById.FRIENDLY_1.intent = {
    type: "moving",
    target: { q: 13, r: 10 },
    targetPoint: mapPoint({ q: 13, r: 10 }),
    path: [{ q: 13, r: 10 }],
    progress: 0,
  };
  session.world.activeManeuver = {
    orderId: "covering-neutralize",
    type: "alternating_forward",
    phase: "moving",
    direction: "SE",
    communication: "voice",
    coveringUnitIds: ["LEADER_1"],
    movingUnitIds: ["FRIENDLY_1"],
    boundStartedUnitIds: ["FRIENDLY_1"],
    boundIndex: 0,
    stepIndex: 0,
    issuedAt: 0,
  };

  session = advanceSession(session, 0.2, { random: () => 0 });

  assert.ok(
    session.events.some(
      (event) =>
        event.type === "friendly_fire_resolved" &&
        event.payload.targetId === "OP_TEST" &&
        event.payload.reason === "covering_fire",
    ),
  );
  assert.ok(
    session.events.some(
      (event) =>
        event.type === "unit_wounded" &&
        event.payload.unitId === "OP_TEST" &&
        event.payload.reason === "covering_fire",
    ),
  );
  assert.equal(session.world.unitsById.OP_TEST.health, 0);
  assert.equal(session.world.unitsById.OP_TEST.posture, "injured");
});

test("friendly covering fire slows enemy fire cadence while suppressed", () => {
  const baseOptions = {
    seed: "suppression-cadence",
    overrides: {
      player: { coord: { q: 12, r: 10 }, posture: "standing", facing: "SE" },
      opposing: [{ id: "OP_TEST", coord: { q: 16, r: 10 }, facing: "NW", posture: "standing" }],
      terrainPatches: [
        { coord: { q: 12, r: 10 }, terrain: "field" },
        { coord: { q: 13, r: 10 }, terrain: "field" },
        { coord: { q: 14, r: 10 }, terrain: "field" },
        { coord: { q: 15, r: 10 }, terrain: "field" },
        { coord: { q: 16, r: 10 }, terrain: "field" },
      ],
    },
  } as const;
  let unsuppressed = createPhaseOneSession(baseOptions);
  let suppressed = createPhaseOneSession(baseOptions);
  unsuppressed.world.unitsById.OP_TEST.alerted = true;
  suppressed.world.unitsById.OP_TEST.alerted = true;
  suppressed.world.unitsById.OP_TEST.suppression = 1;

  for (let step = 0; step < 20; step += 1) {
    unsuppressed = advanceSession(unsuppressed, 0.5, { random: () => 1 });
    suppressed = advanceSession(suppressed, 0.5, { random: () => 1 });
  }

  const unsuppressedFire = unsuppressed.events.filter((event) => event.type === "incoming_fire_resolved").length;
  const suppressedFire = suppressed.events.filter((event) => event.type === "incoming_fire_resolved").length;
  assert.ok(unsuppressedFire > suppressedFire);
  assert.ok(suppressedFire > 0);
});

test("dragged casualty follows the carrier pair instead of walking alone", () => {
  let session = createPhaseOneSession({
    seed: "carrier-follow",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);
  const casualty = session.world.unitsById.FRIENDLY_6;
  casualty.health = 35;
  casualty.posture = "injured";
  casualty.status = ["injured"];
  const casualtyStart = { ...casualty.coord };

  session = dispatchCommand(session, {
    type: "set_casualty_collection_point",
    unitId: leader.id,
    collectionPointId: "asa1",
    target: { q: 3, r: 57 },
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "start_casualty_evacuation",
    unitId: leader.id,
    collectionPointId: "asa1",
    casualtyUnitId: casualty.id,
    issuedAt: session.world.time,
  });

  for (let step = 0; step < 80 && session.world.casualtyEvacuation?.phase !== "dragging"; step += 1) {
    session = advanceSession(session, 0.5, { random: () => 1 });
    assertUniqueFriendlyHexes(session);
  }
  assert.equal(session.world.casualtyEvacuation?.phase, "dragging");
  assert.equal(session.world.casualtyTeam?.casualtyUnitId, "FRIENDLY_6");
  assert.equal(session.world.casualtyTeam?.mode, "handoff");
  assert.equal(session.world.casualtyTeam?.teamIntent, "holding");

  const dragged = session.world.unitsById.FRIENDLY_6;
  assert.ok(hexDistance(dragged.coord, casualtyStart) <= 2);
  const helpers = session.world.casualtyEvacuation?.helperUnitIds.map((unitId) => session.world.unitsById[unitId]) ?? [];
  assert.equal(helpers.length, 2);
  assert.ok(helpers.every((helper) => hexDistance(helper.coord, dragged.coord) <= 2));
});

test("dragged casualty keeps a live render position while carriers move during alternating forward", () => {
  let session = createPhaseOneSession({
    seed: "carrier-forward-render-follow",
    scenarioId: "casualty_retreat",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);

  session = dispatchCommand(session, {
    type: "set_casualty_collection_point",
    unitId: leader.id,
    collectionPointId: "asa1",
    target: { q: 13, r: 56 },
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "start_casualty_evacuation",
    unitId: leader.id,
    collectionPointId: "asa1",
    casualtyUnitId: "FRIENDLY_6",
    issuedAt: session.world.time,
  });

  for (let step = 0; step < 80 && session.world.casualtyEvacuation?.phase !== "dragging"; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }
  assert.equal(session.world.casualtyEvacuation?.phase, "dragging");

  session = dispatchCommand(session, {
    type: "issue_alternating_forward_order",
    unitId: leader.id,
    direction: "SE",
    communication: "voice",
    issuedAt: session.world.time,
  });
  const beforePosition = { ...session.world.unitsById.FRIENDLY_6.position };
  for (
    let step = 0;
    step < 160 && session.world.activeManeuver?.boundIndex !== 1;
    step += 1
  ) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }
  for (
    let step = 0;
    step < 20 && samePointForTest(session.world.unitsById.FRIENDLY_6.position, beforePosition);
    step += 1
  ) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }
  const dragged = session.world.unitsById.FRIENDLY_6;

  assert.ok(dragged.status.includes("being_dragged"));
  assert.equal(session.world.activeManeuver?.boundIndex, 1);
  assert.notDeepEqual(dragged.position, beforePosition);
  assert.equal(dragged.intent.type, "idle");
  assert.equal(session.world.casualtyTeam?.mode, "advancing_with_group");
  assert.equal(session.world.casualtyTeam?.teamIntent, "moving");
  assert.equal(uniqueCasualtyTeamHexes(session.world.casualtyTeam), 3);
});

test("skadad-soldat keeps Falk attached to the moving carrier tät during växelvis framåt", () => {
  let session = createPhaseOneSession({
    seed: "skadad-soldat-forward-carry",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const placements = [
    ["LEADER_1", { q: 19, r: 52 }],
    ["DEPUTY_1", { q: 20, r: 52 }],
    ["FRIENDLY_1", { q: 19, r: 53 }],
    ["FRIENDLY_2", { q: 20, r: 54 }],
    ["FRIENDLY_3", { q: 18, r: 54 }],
    ["FRIENDLY_4", { q: 20, r: 53 }],
    ["FRIENDLY_5", { q: 21, r: 52 }],
    ["FRIENDLY_6", { q: 21, r: 53 }],
  ] as const;
  for (const [unitId, coord] of placements) {
    const unit = session.world.unitsById[unitId];
    unit.coord = coord;
    unit.position = mapPoint(coord);
    unit.intent = { type: "idle" };
    unit.status = [];
  }

  const casualty = session.world.unitsById.FRIENDLY_6;
  casualty.health = 35;
  casualty.posture = "injured";
  casualty.status = ["injured", "being_dragged"];
  for (const unitId of ["FRIENDLY_4", "FRIENDLY_5"] as const) {
    const carrier = session.world.unitsById[unitId];
    carrier.posture = "helping";
    carrier.status = ["evac_helper", "forward_moving"];
  }
  session.world.unitsById.DEPUTY_1.status = ["forward_moving"];
  for (const unitId of ["LEADER_1", "FRIENDLY_1", "FRIENDLY_2", "FRIENDLY_3"] as const) {
    session.world.unitsById[unitId].status = ["covering_fire"];
  }

  session.world.unitsById.FRIENDLY_4.intent = {
    type: "moving",
    target: { q: 21, r: 54 },
    targetPoint: mapPoint({ q: 21, r: 54 }),
    path: [{ q: 21, r: 54 }],
    progress: 0.95,
  };
  session.world.unitsById.FRIENDLY_5.intent = {
    type: "moving",
    target: { q: 22, r: 52 },
    targetPoint: mapPoint({ q: 22, r: 52 }),
    path: [{ q: 22, r: 52 }],
    progress: 0.95,
  };
  session.world.casualtyEvacuation = {
    orderId: "skadad-forward",
    collectionPointId: "asa1",
    activeCollectionPointId: "asa1",
    collectionPoints: {
      asa1: { id: "asa1", label: "ÅSA1", coord: { q: 3, r: 57 }, point: mapPoint({ q: 3, r: 57 }), setAt: 0 },
    },
    collectionPoint: { q: 3, r: 57 },
    collectionPointPoint: mapPoint({ q: 3, r: 57 }),
    casualtyUnitId: "FRIENDLY_6",
    helperUnitIds: ["FRIENDLY_4", "FRIENDLY_5"],
    carrierUnitIds: ["FRIENDLY_4", "FRIENDLY_5"],
    underFire: true,
    phase: "dragging",
    issuedAt: 0,
  };
  session.world.activeManeuver = {
    orderId: "afw-sjukv",
    type: "alternating_forward",
    phase: "moving",
    direction: "SE",
    communication: "voice",
    coveringUnitIds: ["LEADER_1", "FRIENDLY_1", "FRIENDLY_2", "FRIENDLY_3"],
    movingUnitIds: ["DEPUTY_1", "FRIENDLY_4", "FRIENDLY_5"],
    boundStartedUnitIds: ["FRIENDLY_4", "FRIENDLY_5"],
    boundIndex: 1,
    stepIndex: 0,
    issuedAt: 0,
  };

  const beforePosition = { ...casualty.position };
  session = advanceSession(session, 0.5, { random: () => 1 });
  const dragged = session.world.unitsById.FRIENDLY_6;

  assert.ok(dragged.status.includes("being_dragged"));
  assert.equal(dragged.intent.type, "idle");
  assert.notDeepEqual(dragged.position, beforePosition);
  assert.equal(session.world.casualtyTeam?.mode, "advancing_with_group");
  assert.equal(session.world.casualtyTeam?.teamIntent, "moving");
  assert.deepEqual(new Set(session.world.casualtyEvacuation?.helperUnitIds), new Set(["FRIENDLY_4", "FRIENDLY_5"]));
  assert.ok(!session.events.some((event) => event.type === "casualty_carrier_relieved" && event.time <= 0.5));
});

test("växelvis framåt takes over skadad-soldat casualty team without ÅSA driving carriers", () => {
  let session = createPhaseOneSession({
    seed: "skadad-soldat-forward-user-flow",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);
  const casualty = session.world.unitsById.FRIENDLY_6;
  casualty.health = 35;
  casualty.posture = "injured";
  casualty.status = ["injured"];

  session = dispatchCommand(session, {
    type: "set_casualty_collection_point",
    unitId: leader.id,
    collectionPointId: "asa1",
    target: { q: 3, r: 57 },
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "start_casualty_evacuation",
    unitId: leader.id,
    collectionPointId: "asa1",
    casualtyUnitId: casualty.id,
    issuedAt: session.world.time,
  });

  for (let step = 0; step < 80 && session.world.casualtyEvacuation?.phase !== "dragging"; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }
  assert.equal(session.world.casualtyEvacuation?.phase, "dragging");
  assert.ok(session.world.casualtyEvacuation.helperUnitIds.every((unitId) => session.world.unitsById[unitId].intent.type === "idle"));
  assert.equal(session.world.casualtyTeam?.teamIntent, "holding");

  session = dispatchCommand(session, {
    type: "issue_alternating_forward_order",
    unitId: leader.id,
    direction: "SE",
    communication: "gesture",
    issuedAt: session.world.time,
  });
  const helperIds = session.world.casualtyEvacuation?.helperUnitIds ?? [];
  assert.ok(helperIds.length >= 2);
  assert.ok(helperIds.every((unitId) => session.world.activeManeuver?.movingUnitIds.includes(unitId)));
  assert.ok(helperIds.every((unitId) => !session.world.activeManeuver?.coveringUnitIds.includes(unitId)));
  assert.ok(helperIds.every((unitId) => session.world.unitsById[unitId].intent.type === "moving"));
  assert.equal(session.world.casualtyTeam?.mode, "advancing_with_group");
  assert.equal(session.world.casualtyTeam?.teamIntent, "moving");
  assert.equal(session.world.activeManeuver?.boundIndex, 1);
  assert.ok(!session.events.some((event) => event.type === "movement_started" && event.payload.reason === "casualty_helper_drag"));

  const beforeCarrierBound = { ...session.world.unitsById.FRIENDLY_6.position };
  for (let step = 0; step < 8; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertAlternatingForwardTatsCoherent(session);
  }
  assert.notDeepEqual(session.world.unitsById.FRIENDLY_6.position, beforeCarrierBound);

  for (
    let step = 0;
    step < 160 && !session.events.some((event) => event.type === "casualty_carrier_relieved" && event.payload.reason === "alternating_forward_handoff");
    step += 1
  ) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertAlternatingForwardTatsCoherent(session);
  }
  assert.ok(session.events.some((event) => event.type === "casualty_carrier_relieved" && event.payload.reason === "alternating_forward_handoff"));
  const nextHelperIds = session.world.casualtyEvacuation?.helperUnitIds ?? [];
  assert.ok(nextHelperIds.every((unitId) => session.world.unitsById[unitId].element === "tat_1"));

  const beforeMovingCarrierTick = { ...session.world.unitsById.FRIENDLY_6.position };
  for (
    let step = 0;
    step < 20 && samePointForTest(session.world.unitsById.FRIENDLY_6.position, beforeMovingCarrierTick);
    step += 1
  ) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertAlternatingForwardTatsCoherent(session);
  }
  assert.notDeepEqual(session.world.unitsById.FRIENDLY_6.position, beforeMovingCarrierTick);
  assert.ok(session.world.unitsById.FRIENDLY_6.status.includes("being_dragged"));
  assert.equal(session.world.unitsById.FRIENDLY_6.intent.type, "idle");
  assert.deepEqual(new Set(session.world.casualtyEvacuation?.helperUnitIds), new Set(nextHelperIds));
  assert.equal(session.world.casualtyTeam?.mode, "advancing_with_group");
  assert.equal(session.world.casualtyTeam?.teamIntent, "moving");
});

test("skadad-soldat can carry Falk during växelvis framåt without ÅSA leading movement", () => {
  let session = createPhaseOneSession({
    seed: "skadad-soldat-forward-no-asa",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);
  const casualty = session.world.unitsById.FRIENDLY_6;
  casualty.health = 35;
  casualty.posture = "injured";
  casualty.status = ["injured"];

  session = dispatchCommand(session, {
    type: "start_casualty_evacuation",
    unitId: leader.id,
    casualtyUnitId: casualty.id,
    issuedAt: session.world.time,
  });
  assert.ok(!session.events.some((event) => event.type === "command_rejected"));
  assert.equal(session.world.casualtyEvacuation?.collectionPoint, undefined);

  for (let step = 0; step < 80 && session.world.casualtyEvacuation?.phase !== "dragging"; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertUniqueFriendlyHexes(session);
  }
  assert.equal(session.world.casualtyEvacuation?.phase, "dragging");
  assert.equal(session.world.casualtyTeam?.mode, "handoff");
  assert.equal(session.world.casualtyTeam?.teamIntent, "holding");

  session = dispatchCommand(session, {
    type: "issue_alternating_forward_order",
    unitId: leader.id,
    direction: "SE",
    communication: "gesture",
    issuedAt: session.world.time,
  });
  assert.equal(session.world.casualtyEvacuation?.collectionPoint, undefined);
  assert.equal(session.world.casualtyTeam?.mode, "advancing_with_group");

  for (
    let step = 0;
    step < 160 && session.world.activeManeuver?.boundIndex !== 1;
    step += 1
  ) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertUniqueFriendlyHexes(session);
    assertAlternatingForwardTatsCoherent(session);
  }
  assert.equal(session.world.activeManeuver?.boundIndex, 1);

  const beforeCarrierBound = { ...session.world.unitsById.FRIENDLY_6.position };
  for (
    let step = 0;
    step < 20 && samePointForTest(session.world.unitsById.FRIENDLY_6.position, beforeCarrierBound);
    step += 1
  ) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertUniqueFriendlyHexes(session);
  }

  assert.notDeepEqual(session.world.unitsById.FRIENDLY_6.position, beforeCarrierBound);
  assert.ok(session.world.unitsById.FRIENDLY_6.status.includes("being_dragged"));
  assert.equal(session.world.unitsById.FRIENDLY_6.intent.type, "idle");
  assert.equal(session.world.casualtyTeam?.mode, "advancing_with_group");
  assert.equal(session.world.casualtyTeam?.teamIntent, "moving");
});

test("skytteled framåt carries the casualty as one bärarlag block", () => {
  let session = createPhaseOneSession({
    seed: "file-forward-carry-block",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const leader = session.world.unitsById.LEADER_1;
  const casualty = session.world.unitsById.FRIENDLY_6;
  casualty.health = 35;
  casualty.posture = "injured";
  casualty.status = ["injured"];

  session = dispatchCommand(session, {
    type: "start_casualty_evacuation",
    unitId: leader.id,
    casualtyUnitId: casualty.id,
    issuedAt: session.world.time,
  });
  for (let step = 0; step < 80 && session.world.casualtyEvacuation?.phase !== "dragging"; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }
  assert.equal(session.world.casualtyEvacuation?.phase, "dragging");
  const initialCasualtyX = session.world.unitsById.FRIENDLY_6.position.x;

  session = dispatchCommand(session, {
    type: "issue_formation_order",
    unitId: leader.id,
    target: leader.coord,
    formation: "file",
    direction: "SE",
    communication: "voice",
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "issue_forward_order",
    unitId: leader.id,
    formation: "file",
    direction: "SE",
    communication: "voice",
    issuedAt: session.world.time,
  });
  for (let step = 0; step < 100 && session.world.activeFormation?.phase !== "advancing"; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }

  assert.equal(session.world.activeFormation?.formation, "file");
  assert.equal(session.world.activeFormation?.phase, "advancing");
  assert.deepEqual(new Set(session.world.casualtyEvacuation?.helperUnitIds), new Set(["FRIENDLY_4", "FRIENDLY_5"]));
  assert.equal(uniqueCasualtyTeamHexes(session.world.casualtyTeam), 3);
  assert.ok(!session.world.casualtyEvacuation?.helperUnitIds.includes("LEADER_1"));
  assert.ok(!session.world.casualtyEvacuation?.helperUnitIds.includes("DEPUTY_1"));
  assert.ok(!session.events.some((event) => event.type === "movement_waiting" && event.payload.reason === "casualty_drag_spacing"));

  session = dispatchCommand(session, {
    type: "move_to_hex",
    unitId: leader.id,
    target: { q: 30, r: 49 },
    issuedAt: session.world.time,
  });
  for (let step = 0; step < 160 && session.world.unitsById.FRIENDLY_6.position.x <= initialCasualtyX + Math.sqrt(3) * 6; step += 1) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }

  assert.ok(session.world.unitsById.FRIENDLY_6.position.x > initialCasualtyX + Math.sqrt(3) * 6);
  assert.equal(session.world.unitsById.FRIENDLY_6.intent.type, "idle");
  assert.ok(session.world.unitsById.FRIENDLY_6.status.includes("being_dragged"));
  assert.ok(!session.events.some((event) => event.type === "formation_movement_diagnostic" && event.payload.reason === "advance_stalled"));
  assert.ok(!session.world.casualtyEvacuation?.helperUnitIds.includes("LEADER_1"));
  assert.ok(!session.world.casualtyEvacuation?.helperUnitIds.includes("DEPUTY_1"));
});

test("växelvis framåt auto-forms a casualty team for injured Falk", () => {
  let session = createPhaseOneSession({
    seed: "skadad-soldat-forward-auto-team",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);
  const casualty = session.world.unitsById.FRIENDLY_6;
  casualty.health = 35;
  casualty.posture = "injured";
  casualty.status = ["injured"];
  const before = { ...casualty.coord };

  session = dispatchCommand(session, {
    type: "issue_alternating_forward_order",
    unitId: leader.id,
    direction: "SE",
    communication: "gesture",
    issuedAt: session.world.time,
  });

  assert.equal(session.world.casualtyEvacuation?.phase, "dragging");
  assert.equal(session.world.casualtyEvacuation?.collectionPoint, undefined);
  assert.deepEqual(new Set(session.world.casualtyEvacuation?.helperUnitIds), new Set(["FRIENDLY_4", "FRIENDLY_5"]));
  assert.equal(session.world.casualtyTeam?.casualtyUnitId, "FRIENDLY_6");
  assert.equal(session.world.casualtyTeam?.mode, "advancing_with_group");
  assert.equal(session.world.casualtyTeam?.teamIntent, "moving");
  assert.equal(session.world.activeManeuver?.boundIndex, 1);

  for (
    let step = 0;
    step < 160 && sameCoordForTest(session.world.unitsById.FRIENDLY_6.coord, before);
    step += 1
  ) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertUniqueFriendlyHexes(session);
  }

  assert.notDeepEqual(session.world.unitsById.FRIENDLY_6.coord, before);
  assert.ok(session.world.unitsById.FRIENDLY_6.status.includes("being_dragged"));
  assert.equal(session.world.unitsById.FRIENDLY_6.intent.type, "idle");
  assert.equal(session.world.casualtyTeam?.teamIntent, "moving");
});

test("casualty team trails the moving line during alternating forward", () => {
  let session = createPhaseOneSession({
    seed: "carrier-team-trails-forward-line",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const leader = session.world.unitsById.LEADER_1;
  const casualty = session.world.unitsById.FRIENDLY_6;
  casualty.health = 35;
  casualty.posture = "injured";
  casualty.status = ["injured"];

  session = dispatchCommand(session, {
    type: "issue_alternating_forward_order",
    unitId: leader.id,
    direction: "SE",
    communication: "gesture",
    issuedAt: session.world.time,
  });

  for (
    let step = 0;
    step < 160 && session.world.activeManeuver?.boundIndex !== 1;
    step += 1
  ) {
    session = advanceSession(session, 0.2, { random: () => 1 });
    assertUniqueFriendlyHexes(session);
  }

  const forward = session.world.activeManeuver?.directionVector;
  assert.ok(forward);
  const deputy = session.world.unitsById.DEPUTY_1;
  assert.equal(deputy.intent.type, "moving");
  const carrierTargetProgress = ["FRIENDLY_4", "FRIENDLY_5"]
    .map((unitId) => session.world.unitsById[unitId])
    .map((unit) => unit.intent.type === "moving" ? forwardProgressForTest(unit.intent.targetPoint, forward) : forwardProgressForTest(unit.position, forward));
  const casualtyProgress = session.world.casualtyTeam?.teamTargetPoint
    ? forwardProgressForTest(session.world.casualtyTeam.teamTargetPoint, forward)
    : -Infinity;
  const forwardMostCarrierTeamTarget = Math.max(casualtyProgress, ...carrierTargetProgress);
  const movingLineTarget = forwardProgressForTest(deputy.intent.targetPoint, forward);

  assert.ok(
    forwardMostCarrierTeamTarget <= movingLineTarget - 0.25,
    `carrier team target ${forwardMostCarrierTeamTarget} should trail moving line ${movingLineTarget}`,
  );
});

test("casualty helper selection preserves grpc and stf until necessary", () => {
  let session = createPhaseOneSession({
    seed: "carrier-command-pair-last",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const placements = [
    ["LEADER_1", { q: 10, r: 48 }],
    ["DEPUTY_1", { q: 9, r: 49 }],
    ["FRIENDLY_4", { q: 11, r: 48 }],
    ["FRIENDLY_5", { q: 11, r: 49 }],
    ["FRIENDLY_6", { q: 10, r: 49 }],
  ] as const;
  for (const [unitId, coord] of placements) {
    const unit = session.world.unitsById[unitId];
    unit.coord = coord;
    unit.position = mapPoint(coord);
    unit.intent = { type: "idle" };
    unit.status = [];
  }
  const casualty = session.world.unitsById.FRIENDLY_6;
  casualty.health = 35;
  casualty.posture = "injured";
  casualty.status = ["injured"];

  session = dispatchCommand(session, {
    type: "issue_alternating_forward_order",
    unitId: "LEADER_1",
    direction: "SE",
    communication: "gesture",
    issuedAt: session.world.time,
  });

  assert.equal(session.world.casualtyEvacuation?.phase, "dragging");
  assert.deepEqual(new Set(session.world.casualtyEvacuation?.helperUnitIds), new Set(["FRIENDLY_4", "FRIENDLY_5"]));
  assert.ok(!session.world.casualtyEvacuation?.helperUnitIds.includes("LEADER_1"));
  assert.ok(!session.world.casualtyEvacuation?.helperUnitIds.includes("DEPUTY_1"));
});

test("casualty team carriers stay together even when one carrier belongs to the other bound", () => {
  let session = createPhaseOneSession({
    seed: "mixed-carrier-team-bound",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const leader = session.world.unitsById.LEADER_1;
  const casualty = session.world.unitsById.FRIENDLY_6;
  casualty.health = 35;
  casualty.posture = "injured";
  casualty.status = ["injured", "being_dragged"];
  session.world.unitsById.FRIENDLY_5.status = ["evac_helper"];
  leader.status = ["evac_helper"];
  session.world.casualtyEvacuation = {
    orderId: "mixed-carrier",
    collectionPointId: "asa1",
    activeCollectionPointId: "asa1",
    collectionPoints: {
      asa1: { id: "asa1", label: "ÅSA1", coord: { q: 3, r: 57 }, point: mapPoint({ q: 3, r: 57 }), setAt: 0 },
    },
    collectionPoint: { q: 3, r: 57 },
    collectionPointPoint: mapPoint({ q: 3, r: 57 }),
    casualtyUnitId: casualty.id,
    helperUnitIds: ["FRIENDLY_5", "LEADER_1"],
    carrierUnitIds: ["FRIENDLY_5", "LEADER_1"],
    underFire: true,
    phase: "dragging",
    issuedAt: 0,
  };

  session = dispatchCommand(session, {
    type: "issue_alternating_forward_order",
    unitId: leader.id,
    direction: "SE",
    communication: "voice",
    issuedAt: session.world.time,
  });

  assert.equal(session.world.casualtyTeam?.assignedElement, "tat_2");
  assert.equal(session.world.casualtyTeam?.teamIntent, "moving");
  assert.ok(session.world.activeManeuver?.movingUnitIds.includes("LEADER_1"));
  assert.ok(session.world.activeManeuver?.movingUnitIds.includes("FRIENDLY_5"));
  assert.ok(!session.world.activeManeuver?.coveringUnitIds.includes("LEADER_1"));
  assert.ok(!session.world.activeManeuver?.coveringUnitIds.includes("FRIENDLY_5"));

  const before = { ...casualty.position };
  for (
    let step = 0;
    step < 20 && samePointForTest(session.world.unitsById.FRIENDLY_6.position, before);
    step += 1
  ) {
    session = advanceSession(session, 0.2, { random: () => 1 });
  }

  assert.equal(session.world.activeManeuver?.boundIndex, 1);
  assert.ok(session.world.activeManeuver?.movingUnitIds.includes("LEADER_1"));
  assert.ok(session.world.activeManeuver?.movingUnitIds.includes("FRIENDLY_5"));
  assert.equal(session.world.casualtyTeam?.teamIntent, "moving");

  assert.notDeepEqual(session.world.unitsById.FRIENDLY_6.position, before);
  assert.equal(session.world.unitsById.FRIENDLY_6.intent.type, "idle");
  assert.equal(uniqueCasualtyTeamHexes(session.world.casualtyTeam), 3);
});

test("casualty carriers hand off to the covering tät during alternating movement", () => {
  let session = createPhaseOneSession({
    seed: "carrier-handoff",
    scenarioId: "casualty_retreat",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const casualty = session.world.unitsById.FRIENDLY_6;
  casualty.coord = { q: 20, r: 52 };
  casualty.position = mapPoint(casualty.coord);
  casualty.health = 35;
  casualty.posture = "injured";
  casualty.status = ["injured", "being_dragged"];
  for (const [unitId, coord] of [
    ["FRIENDLY_4", { q: 20, r: 53 }],
    ["FRIENDLY_5", { q: 21, r: 52 }],
    ["FRIENDLY_1", { q: 19, r: 52 }],
    ["FRIENDLY_2", { q: 19, r: 53 }],
  ] as const) {
    const unit = session.world.unitsById[unitId];
    unit.coord = coord;
    unit.position = mapPoint(coord);
    unit.intent = { type: "idle" };
    unit.status = unitId === "FRIENDLY_4" || unitId === "FRIENDLY_5" ? ["evac_helper"] : [];
  }
  session.world.casualtyEvacuation = {
    orderId: "handoff",
    collectionPointId: "asa1",
    activeCollectionPointId: "asa1",
    collectionPoints: {
      asa1: { id: "asa1", label: "ÅSA1", coord: { q: 13, r: 56 }, point: mapPoint({ q: 13, r: 56 }), setAt: 0 },
    },
    collectionPoint: { q: 13, r: 56 },
    collectionPointPoint: mapPoint({ q: 13, r: 56 }),
    casualtyUnitId: casualty.id,
    helperUnitIds: ["FRIENDLY_4", "FRIENDLY_5"],
    carrierUnitIds: ["FRIENDLY_4", "FRIENDLY_5"],
    underFire: true,
    phase: "dragging",
    issuedAt: 0,
  };
  session.world.activeManeuver = {
    orderId: "maneuver",
    type: "alternating_retreat",
    phase: "moving",
    direction: "SW",
    communication: "voice",
    coveringUnitIds: ["FRIENDLY_1", "FRIENDLY_2"],
    movingUnitIds: ["FRIENDLY_4", "FRIENDLY_5"],
    boundIndex: 0,
    stepIndex: 0,
    issuedAt: 0,
  };

  session = advanceSession(session, 0.2, { random: () => 1 });

  assert.ok(session.events.some((event) => event.type === "casualty_carrier_relieved" && event.payload.reason === "alternating_handoff"));
  assert.deepEqual(new Set(session.world.casualtyEvacuation?.helperUnitIds), new Set(["FRIENDLY_1", "FRIENDLY_2"]));
  assert.ok(session.world.unitsById.FRIENDLY_1.status.includes("evac_helper"));
  assert.ok(session.world.unitsById.FRIENDLY_4.status.includes("covering_fire"));
});

test("injured casualty carrier is relieved before the drag stalls", () => {
  let session = createPhaseOneSession({
    seed: "carrier-injured-relief",
    scenarioId: "casualty_retreat",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const casualty = session.world.unitsById.FRIENDLY_6;
  const injuredCarrier = session.world.unitsById.FRIENDLY_5;
  casualty.health = 35;
  casualty.posture = "injured";
  casualty.status = ["injured", "being_dragged"];
  injuredCarrier.health = 35;
  injuredCarrier.posture = "injured";
  injuredCarrier.status = ["injured", "evac_helper"];
  session.world.casualtyEvacuation = {
    orderId: "injured-carrier",
    collectionPointId: "asa1",
    activeCollectionPointId: "asa1",
    collectionPoints: {
      asa1: { id: "asa1", label: "ÅSA1", coord: { q: 13, r: 56 }, point: mapPoint({ q: 13, r: 56 }), setAt: 0 },
    },
    collectionPoint: { q: 13, r: 56 },
    collectionPointPoint: mapPoint({ q: 13, r: 56 }),
    casualtyUnitId: casualty.id,
    helperUnitIds: ["FRIENDLY_4", "FRIENDLY_5"],
    carrierUnitIds: ["FRIENDLY_4", "FRIENDLY_5"],
    underFire: true,
    phase: "dragging",
    issuedAt: 0,
  };

  session = advanceSession(session, 0.2, { random: () => 1 });

  const relief = session.events.find((event) => event.type === "casualty_carrier_relieved" && event.payload.reason === "carrier_unavailable");
  assert.ok(relief);
  const replacementId = String(relief.payload.newCarrierId);
  assert.ok(session.world.casualtyEvacuation?.helperUnitIds.includes(replacementId));
  assert.ok(session.world.unitsById[replacementId].status.includes("evac_helper"));
  assert.equal(session.world.unitsById.FRIENDLY_5.posture, "injured");
});

test("newly injured friendly halts maneuver before the group can leave them behind", () => {
  let session = createPhaseOneSession({
    seed: "no-one-left-behind",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const casualty = session.world.unitsById.FRIENDLY_6;
  const dahl = session.world.unitsById.FRIENDLY_4;
  const ek = session.world.unitsById.FRIENDLY_5;
  casualty.health = 35;
  casualty.posture = "injured";
  casualty.status = ["injured", "being_dragged"];
  dahl.status = ["evac_helper", "forward_moving"];
  ek.health = 35;
  ek.posture = "injured";
  ek.status = ["injured", "evac_helper"];
  dahl.intent = {
    type: "moving",
    target: { q: dahl.coord.q + 2, r: dahl.coord.r },
    targetPoint: mapPoint({ q: dahl.coord.q + 2, r: dahl.coord.r }),
    path: [{ q: dahl.coord.q + 1, r: dahl.coord.r }],
    progress: 0.4,
  };
  session.world.casualtyEvacuation = {
    orderId: "falk-team",
    casualtyUnitId: casualty.id,
    helperUnitIds: [dahl.id, ek.id],
    carrierUnitIds: [dahl.id, ek.id],
    underFire: true,
    phase: "dragging",
    issuedAt: 0,
  };
  session.world.activeManeuver = {
    orderId: "active-bound",
    type: "alternating_forward",
    phase: "moving",
    direction: "SE",
    communication: "voice",
    coveringUnitIds: ["FRIENDLY_1", "FRIENDLY_2", "FRIENDLY_3"],
    movingUnitIds: [dahl.id, ek.id],
    boundIndex: 1,
    stepIndex: 0,
    issuedAt: 0,
  };

  session = advanceSession(session, 0.2, { random: () => 1 });

  assert.ok(session.events.some((event) => event.type === "group_halted" && event.payload.reason === "unsecured_casualty"));
  assert.ok(
    session.events.some(
      (event) => event.type === "movement_waiting" && event.payload.reason === "unsecured_casualty" && event.payload.relatedUnitId === ek.id,
    ),
  );
  assert.ok(
    session.events.some(
      (event) => event.type === "status_report_emitted" && event.payload.relatedUnitId === ek.id && String(event.payload.message).includes("ingen lämnas efter"),
    ),
  );
  assert.equal(session.world.activeManeuver?.phase, "completed");
  assert.equal(session.world.unitsById.FRIENDLY_4.intent.type, "idle");
  assert.equal(session.world.unitsById.FRIENDLY_5.posture, "injured");
});

test("contact casualty during formation blocks later forward orders instead of ordering the wounded soldier", () => {
  let session = createPhaseOneSession({
    seed: "formation-contact-casualty",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
  });
  const leader = session.world.unitsById.LEADER_1;

  session = dispatchCommand(session, {
    type: "issue_formation_order",
    unitId: leader.id,
    target: leader.coord,
    formation: "line",
    direction: "SE",
    communication: "gesture",
    issuedAt: session.world.time,
  });
  session = advanceSession(session, 0.2, { random: () => 0 });
  const wound = session.events.find((event) => event.type === "unit_wounded");
  assert.ok(wound);
  const casualtyId = String(wound.payload.unitId);

  session = advanceSession(session, 0.2, { random: () => 1 });
  assert.ok(session.events.some((event) => event.type === "movement_waiting" && event.payload.reason === "unsecured_casualty"));
  assert.ok(session.events.some((event) => event.type === "movement_interrupted" && event.payload.reason === "unsecured_casualty"));
  assert.equal(session.world.unitsById[casualtyId].intent.type, "idle");
  assert.equal(session.world.unitsById[casualtyId].currentOrderId, undefined);

  const beforeForward = session.events.length;
  session = dispatchCommand(session, {
    type: "issue_forward_order",
    unitId: leader.id,
    formation: "line",
    direction: "SE",
    communication: "gesture",
    issuedAt: session.world.time,
  });
  const forwardEvents = session.events.slice(beforeForward);

  assert.ok(forwardEvents.some((event) => event.type === "command_rejected" && event.payload.reason === "unsecured_casualty"));
  assert.ok(!forwardEvents.some((event) => event.type === "formation_order_issued"));
  assert.ok(!forwardEvents.some((event) => event.type === "movement_started" && event.payload.unitId === casualtyId));
  assert.equal(session.world.unitsById[casualtyId].intent.type, "idle");
});

test("stale carrier relief cannot duplicate the same helper id", () => {
  let session = createPhaseOneSession({
    seed: "carrier-relief-dedup",
    scenarioId: "casualty_retreat",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const casualty = session.world.unitsById.FRIENDLY_6;
  casualty.coord = { q: 20, r: 52 };
  casualty.position = mapPoint(casualty.coord);
  casualty.health = 35;
  casualty.posture = "injured";
  casualty.status = ["injured", "being_dragged", "primary_casualty"];
  for (const [unitId, coord] of [
    ["FRIENDLY_3", { q: 20, r: 53 }],
    ["FRIENDLY_4", { q: 21, r: 52 }],
  ] as const) {
    const unit = session.world.unitsById[unitId];
    unit.coord = coord;
    unit.position = mapPoint(coord);
    unit.intent = { type: "idle" };
    unit.status = ["evac_helper"];
  }
  session.world.unitsById.FRIENDLY_4.stamina = 20;
  session.world.casualtyEvacuation = {
    orderId: "stale-relief",
    collectionPointId: "asa1",
    activeCollectionPointId: "asa1",
    collectionPoints: {
      asa1: { id: "asa1", label: "ÅSA1", coord: { q: 13, r: 56 }, point: mapPoint({ q: 13, r: 56 }), setAt: 0 },
    },
    collectionPoint: { q: 13, r: 56 },
    collectionPointPoint: mapPoint({ q: 13, r: 56 }),
    casualtyUnitId: casualty.id,
    helperUnitIds: ["FRIENDLY_3", "FRIENDLY_4"],
    carrierUnitIds: ["FRIENDLY_3", "FRIENDLY_4"],
    requestedReinforcement: { unitId: "FRIENDLY_3", forUnitId: "FRIENDLY_4", requestedAt: 0 },
    underFire: true,
    phase: "dragging",
    issuedAt: 0,
  };

  session = advanceSession(session, 0.2, { random: () => 1 });

  assert.ok(session.events.some((event) => event.type === "casualty_carrier_relieved"));
  assert.deepEqual(session.world.casualtyEvacuation?.helperUnitIds, ["FRIENDLY_3"]);
  assert.equal(new Set(session.world.casualtyEvacuation?.helperUnitIds).size, session.world.casualtyEvacuation?.helperUnitIds.length);
});

test("casualty carriers lose stamina, request reinforcement, and are relieved", () => {
  let session = createPhaseOneSession({
    seed: "carrier-relief",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
    overrides: { opposing: [] },
  });
  const leader = session.world.units.find((unit) => unit.role === "leader");
  assert.ok(leader);
  const casualty = session.world.unitsById.FRIENDLY_6;
  casualty.health = 35;
  casualty.posture = "injured";
  casualty.status = ["injured"];

  session = dispatchCommand(session, {
    type: "set_casualty_collection_point",
    unitId: leader.id,
    collectionPointId: "asa1",
    target: { q: 3, r: 57 },
    issuedAt: session.world.time,
  });
  session = dispatchCommand(session, {
    type: "start_casualty_evacuation",
    unitId: leader.id,
    collectionPointId: "asa1",
    casualtyUnitId: casualty.id,
    issuedAt: session.world.time,
  });

  for (let step = 0; step < 80 && session.world.casualtyEvacuation?.phase !== "dragging"; step += 1) {
    session = advanceSession(session, 0.5, { random: () => 1 });
  }
  assert.equal(session.world.casualtyEvacuation?.phase, "dragging");
  const tiredCarrierId = session.world.casualtyEvacuation.helperUnitIds[0];
  session.world.unitsById[tiredCarrierId].stamina = 40;
  session = advanceSession(session, 0.5, { random: () => 1 });

  const request = session.events.find((event) => event.type === "casualty_reinforcement_requested");
  assert.ok(request);
  const reinforcementId = String(request.payload.unitId);
  assert.ok(!["LEADER_1", "DEPUTY_1"].includes(reinforcementId));
  assert.ok(!session.world.casualtyEvacuation?.helperUnitIds.includes(reinforcementId));
  session.world.unitsById[reinforcementId].coord = { q: casualty.coord.q + 1, r: casualty.coord.r };
  session.world.unitsById[reinforcementId].position = mapPoint(session.world.unitsById[reinforcementId].coord);
  session.world.unitsById[reinforcementId].intent = { type: "idle" };
  session = advanceSession(session, 0.5, { random: () => 1 });

  assert.ok(session.events.some((event) => event.type === "casualty_carrier_relieved" && event.payload.reason === "carrier_tired"));
  assert.ok(session.world.casualtyEvacuation?.helperUnitIds.includes(reinforcementId));
  assert.ok(!session.world.casualtyEvacuation?.helperUnitIds.includes(tiredCarrierId));
  assert.ok(session.world.unitsById[tiredCarrierId].status.includes("tired"));
  assert.ok(!session.world.unitsById[tiredCarrierId].status.includes("evac_helper"));
  assert.ok(!session.world.unitsById[tiredCarrierId].status.includes("covering_fire"));
});

test("group objective succeeds when the leader and enough effective soldiers reach the goal area", () => {
  let session = createPhaseOneSession({
    seed: "objective-group",
    scenarioId: "leader_lost_picture",
    difficulty: "training",
  });

  const goal = session.world.objective.target;
  const goalArea = [
    goal,
    { q: goal.q - 1, r: goal.r },
    { q: goal.q + 1, r: goal.r },
    { q: goal.q, r: goal.r - 1 },
    { q: goal.q, r: goal.r + 1 },
    { q: goal.q - 1, r: goal.r + 1 },
  ];
  session.world.units
    .filter((unit) => unit.side === "friendly")
    .forEach((unit, index) => {
      const coord = goalArea[index % goalArea.length];
      unit.coord = coord;
      unit.position = mapPoint(coord);
      session.world.unitsById[unit.id] = unit;
    });

  session = advanceSession(session, 0.1, { random: () => 1 });

  assert.equal(session.world.objective.status, "succeeded");
  assert.ok(session.events.some((event) => event.type === "objective_succeeded"));
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

function tatOrder(session: ReturnType<typeof createPhaseOneSession>, element: "tat_1" | "tat_2"): string[] {
  return session.world.units
    .filter((unit) => unit.side === "friendly" && unit.element === element)
    .sort((a, b) => (a.elementPosition ?? 99) - (b.elementPosition ?? 99))
    .map((unit) => unit.id);
}

function assertElementOnlyStatus(
  session: ReturnType<typeof createPhaseOneSession>,
  element: "tat_1" | "tat_2",
  expectedStatus: "covering_fire" | "forward_moving",
): void {
  const forbiddenStatus = expectedStatus === "covering_fire" ? "forward_moving" : "covering_fire";
  const units = session.world.units.filter((unit) => unit.side === "friendly" && unit.element === element && unit.posture !== "injured");
  assert.ok(units.length > 0);
  for (const unit of units) {
    assert.ok(unit.status.includes(expectedStatus), `${unit.id} should have ${expectedStatus}`);
    assert.ok(!unit.status.includes(forbiddenStatus), `${unit.id} should not have ${forbiddenStatus}`);
  }
}

function assertAlternatingForwardTatsCoherent(session: ReturnType<typeof createPhaseOneSession>): void {
  const maneuver = session.world.activeManeuver;
  if (!maneuver || maneuver.type !== "alternating_forward" || maneuver.phase === "completed") {
    return;
  }
  for (const element of ["tat_1", "tat_2"] as const) {
    const active = session.world.units.filter((unit) => unit.side === "friendly" && unit.element === element && unit.posture !== "injured");
    const moving = active.filter((unit) => unit.status.includes("forward_moving"));
    const covering = active.filter((unit) => unit.status.includes("covering_fire"));
    assert.ok(moving.length === 0 || covering.length === 0, `${element} mixes forward_moving and covering_fire`);
    if (maneuver.phase === "handoff") {
      assert.equal(moving.length, 0, `${element} should not move during ELDSTÄLLNINGAR`);
      assert.equal(covering.length, active.length, `${element} should cover during ELDSTÄLLNINGAR`);
    } else {
      assert.ok(moving.length === active.length || covering.length === active.length, `${element} should be wholly moving or wholly covering`);
    }
  }
}

function sameCoordForTest(a: { q: number; r: number }, b: { q: number; r: number }): boolean {
  return a.q === b.q && a.r === b.r;
}

function samePointForTest(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return Math.abs(a.x - b.x) < 0.001 && Math.abs(a.y - b.y) < 0.001;
}

function uniqueCasualtyTeamHexes(
  team:
    | {
        casualtySlot?: { q: number; r: number };
        carrierSlots: Record<string, { q: number; r: number }>;
      }
    | undefined,
): number {
  if (!team?.casualtySlot) return 0;
  return new Set([team.casualtySlot, ...Object.values(team.carrierSlots)].map((coord) => `${coord.q},${coord.r}`)).size;
}

function forwardProgressForTest(point: { x: number; y: number }, direction: { x: number; y: number }): number {
  const length = Math.hypot(direction.x, direction.y) || 1;
  return (point.x * direction.x + point.y * direction.y) / length / Math.sqrt(3);
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

function terrainCounts(session: ReturnType<typeof createPhaseOneSession>): Record<string, number> {
  return session.world.map.tiles.reduce<Record<string, number>>((counts, tile) => {
    counts[tile.terrain] = (counts[tile.terrain] ?? 0) + 1;
    return counts;
  }, {});
}

function connectedTerrainCount(session: ReturnType<typeof createPhaseOneSession>, terrains: Set<string>): number {
  const candidates = session.world.map.tiles.filter((tile) => terrains.has(tile.terrain));
  const first = candidates[0];
  if (!first) return 0;

  const candidateKeys = new Set(candidates.map((tile) => `${tile.coord.q},${tile.coord.r}`));
  const seen = new Set<string>();
  const frontier = [first.coord];

  while (frontier.length > 0) {
    const coord = frontier.shift();
    if (!coord) break;
    const key = `${coord.q},${coord.r}`;
    if (seen.has(key) || !candidateKeys.has(key)) continue;
    seen.add(key);
    for (const neighbour of testNeighbours(coord)) {
      if (candidateKeys.has(`${neighbour.q},${neighbour.r}`) && !seen.has(`${neighbour.q},${neighbour.r}`)) {
        frontier.push(neighbour);
      }
    }
  }

  return seen.size;
}

function terrainHasNeighbour(
  session: ReturnType<typeof createPhaseOneSession>,
  terrain: string,
  neighbourTerrains: Set<string>,
): boolean {
  return session.world.map.tiles.some((tile) => {
    if (tile.terrain !== terrain) return false;
    return testNeighbours(tile.coord).some((coord) => neighbourTerrains.has(session.world.map.tilesByKey[`${coord.q},${coord.r}`]?.terrain));
  });
}

function testNeighbours(coord: { q: number; r: number }): Array<{ q: number; r: number }> {
  return [
    { q: coord.q, r: coord.r - 1 },
    { q: coord.q + 1, r: coord.r - 1 },
    { q: coord.q + 1, r: coord.r },
    { q: coord.q, r: coord.r + 1 },
    { q: coord.q - 1, r: coord.r + 1 },
    { q: coord.q - 1, r: coord.r },
  ];
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

function detectionThenSafeRoll(): () => number {
  let index = 0;
  const rolls = [0, 1];
  return () => rolls[Math.min(index++, rolls.length - 1)];
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
