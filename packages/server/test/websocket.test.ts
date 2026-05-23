import assert from "node:assert/strict";
import test from "node:test";

import { createAppServer } from "../src/app.ts";

test("websocket session streams projection and accepts movement commands", async (t) => {
  const app = createAppServer();
  await app.listen(0);
  t.after(() => app.close());

  const { port } = app.address();
  await fetch(`http://127.0.0.1:${port}/api/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scenarioId: "cover_to_cover", difficulty: "training", seed: "ws-move" }),
  });

  const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  t.after(() => socket.close());

  const first = await nextMessage(socket);
  assert.equal(first.type, "projection");
  assert.equal(first.projection.map.width, 100);

  socket.send(
    JSON.stringify({
      type: "command",
      command: {
        type: "move_to_hex",
        unitId: first.projection.player.id,
        target: {
          q: first.projection.player.coord.q + 4,
          r: first.projection.player.coord.r,
        },
        issuedAt: first.projection.time,
      },
    }),
  );

  const second = await nextProjection(socket, (message) =>
    message.projection.events.some((event: { type: string }) => event.type === "movement_started"),
  );
  assert.equal(second.type, "projection");
  assert.ok(second.projection.events.some((event: { type: string }) => event.type === "movement_started"));
});

test("websocket session accepts group formation orders", async (t) => {
  const app = createAppServer();
  await app.listen(0);
  t.after(() => app.close());

  const { port } = app.address();
  const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  t.after(() => socket.close());

  const first = await nextMessage(socket);
  assert.equal(first.projection.player.role, "leader");

  socket.send(
    JSON.stringify({
      type: "command",
      command: {
        type: "issue_formation_order",
        unitId: first.projection.player.id,
        target: {
          q: first.projection.player.coord.q + 5,
          r: first.projection.player.coord.r,
        },
        formation: "line",
        communication: "voice",
        issuedAt: first.projection.time,
      },
    }),
  );

  const second = await nextProjection(socket, (message) => message.projection.activeFormation?.formation === "line");
  assert.equal(second.type, "projection");
  assert.equal(second.projection.activeFormation?.formation, "line");
  assert.ok(second.projection.events.some((event: { type: string }) => event.type === "formation_order_issued"));
  assert.ok(second.projection.units.filter((unit: { intent: { type: string } }) => unit.intent.type === "moving").length >= 5);
});

test("http api lists scenarios and starts selected difficulty", async (t) => {
  const app = createAppServer();
  await app.listen(0);
  t.after(() => app.close());

  const { port } = app.address();
  const scenariosResponse = await fetch(`http://127.0.0.1:${port}/api/scenarios`);
  assert.equal(scenariosResponse.status, 200);
  const scenarios = (await scenariosResponse.json()) as {
    scenarios: Array<{ id: string; troop: unknown[]; goal: { target: { q: number; r: number } } }>;
    difficulties: Array<{ id: string }>;
  };
  assert.ok(scenarios.scenarios.some((scenario) => scenario.id === "leader_lost_picture" && scenario.troop.length === 8));
  assert.ok(scenarios.difficulties.some((difficulty) => difficulty.id === "realistic"));

  const sessionResponse = await fetch(`http://127.0.0.1:${port}/api/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scenarioId: "risk_zone_blocking", difficulty: "realistic" }),
  });
  assert.equal(sessionResponse.status, 200);
  const projection = await sessionResponse.json() as {
    scenario: { id: string; difficulty: string; troop: unknown[] };
    objective: { target: { q: number; r: number } };
    player: { role: string };
    units: unknown[];
    perception: { informationMode: string };
  };

  assert.equal(projection.scenario.id, "risk_zone_blocking");
  assert.equal(projection.scenario.difficulty, "realistic");
  assert.equal(projection.perception.informationMode, "realistic");
  assert.equal(projection.player.role, "leader");
  assert.equal(projection.scenario.troop.length, 2);
  assert.equal(projection.units.length, 2);
  assert.deepEqual(projection.objective.target, { q: 24, r: 50 });

  const directScenarioResponse = await fetch(`http://127.0.0.1:${port}/scenario/skadad-soldat/easy?intro=0`);
  assert.equal(directScenarioResponse.status, 200);
  assert.match(await directScenarioResponse.text(), /Perspektivbubbla/);
});

test("websocket clients in the same game share one authoritative session", async (t) => {
  const app = createAppServer();
  await app.listen(0);
  t.after(() => app.close());

  const { port } = app.address();
  await fetch(`http://127.0.0.1:${port}/api/session?game=shared`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scenarioId: "cover_to_cover", difficulty: "training", seed: "shared-game" }),
  });

  const leader = new WebSocket(`ws://127.0.0.1:${port}/ws?game=shared`);
  const observer = new WebSocket(`ws://127.0.0.1:${port}/ws?game=shared`);
  t.after(() => leader.close());
  t.after(() => observer.close());

  const leaderFirst = await nextMessage(leader);
  const observerFirst = await nextMessage(observer);
  assert.equal(leaderFirst.projection.sessionId, observerFirst.projection.sessionId);
  assert.equal(leaderFirst.projection.scenario.id, "cover_to_cover");

  leader.send(
    JSON.stringify({
      type: "command",
      command: {
        type: "move_to_hex",
        unitId: leaderFirst.projection.player.id,
        target: {
          q: leaderFirst.projection.player.coord.q + 3,
          r: leaderFirst.projection.player.coord.r,
        },
        issuedAt: leaderFirst.projection.time,
      },
    }),
  );

  const observerUpdate = await nextProjection(observer, (message) =>
    message.projection.events.some((event: { type: string }) => event.type === "movement_started"),
  );
  assert.equal(observerUpdate.projection.sessionId, leaderFirst.projection.sessionId);
  assert.ok(observerUpdate.projection.events.some((event: { type: string }) => event.type === "movement_started"));
});

test("game ids isolate server-side sessions", async (t) => {
  const app = createAppServer();
  await app.listen(0);
  t.after(() => app.close());

  const { port } = app.address();
  await fetch(`http://127.0.0.1:${port}/api/session?game=alpha`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scenarioId: "cover_to_cover", difficulty: "training", seed: "alpha-game" }),
  });
  await fetch(`http://127.0.0.1:${port}/api/session?game=bravo`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scenarioId: "risk_zone_blocking", difficulty: "realistic", seed: "bravo-game" }),
  });

  const alpha = await fetch(`http://127.0.0.1:${port}/api/session?game=alpha`);
  const bravo = await fetch(`http://127.0.0.1:${port}/api/session?game=bravo`);
  const alphaProjection = await alpha.json() as SocketMessage["projection"];
  const bravoProjection = await bravo.json() as SocketMessage["projection"];

  assert.notEqual(alphaProjection.sessionId, bravoProjection.sessionId);
  assert.equal(alphaProjection.scenario.id, "cover_to_cover");
  assert.equal(bravoProjection.scenario.id, "risk_zone_blocking");
});

type SocketMessage = {
  type: string;
  projection: {
    sessionId: string;
    time: number;
    activeFormation?: { formation: string };
    scenario: { id: string };
    map: { width: number };
    player: { id: string; role: string; coord: { q: number; r: number } };
    units: Array<{ intent: { type: string } }>;
    events: Array<{ type: string }>;
  };
};

function nextMessage(socket: WebSocket): Promise<SocketMessage> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("timed out waiting for websocket message")), 1500);
    socket.addEventListener(
      "message",
      (event) => {
        clearTimeout(timeout);
        resolve(JSON.parse(String(event.data)) as SocketMessage);
      },
      { once: true },
    );
    socket.addEventListener("error", reject, { once: true });
  });
}

function nextProjection(socket: WebSocket, predicate: (message: SocketMessage) => boolean): Promise<SocketMessage> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.removeEventListener("message", onMessage);
      reject(new Error("timed out waiting for matching projection"));
    }, 4000);
    const onError = (event: Event) => {
      clearTimeout(timeout);
      socket.removeEventListener("message", onMessage);
      reject(event);
    };
    const onMessage = (event: MessageEvent) => {
      const message = JSON.parse(String(event.data)) as SocketMessage;
      if (!predicate(message)) return;
      clearTimeout(timeout);
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("error", onError);
      resolve(message);
    };
    socket.addEventListener("message", onMessage);
    socket.addEventListener("error", onError, { once: true });
  });
}
