import assert from "node:assert/strict";
import test from "node:test";

import { createAppServer } from "../src/app.ts";

test("websocket session streams projection and accepts movement commands", async (t) => {
  const app = createAppServer();
  await app.listen(0);
  t.after(() => app.close());

  const { port } = app.address();
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
          q: first.projection.player.coord.q + 1,
          r: first.projection.player.coord.r,
        },
        issuedAt: first.projection.time,
      },
    }),
  );

  const second = await nextMessage(socket);
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

  const second = await nextMessage(socket);
  assert.equal(second.type, "projection");
  assert.equal(second.projection.activeFormation?.formation, "line");
  assert.ok(second.projection.events.some((event: { type: string }) => event.type === "formation_order_issued"));
  assert.ok(second.projection.units.filter((unit: { intent: { type: string } }) => unit.intent.type === "moving").length >= 5);
});

type SocketMessage = {
  type: string;
  projection: {
    time: number;
    activeFormation?: { formation: string };
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
