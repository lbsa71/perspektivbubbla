import assert from "node:assert/strict";
import test from "node:test";

import { createAppServer } from "../src/app.ts";

test("mcp endpoint initializes and lists game tools", async (t) => {
  const app = createAppServer();
  await app.listen(0);
  t.after(() => app.close());

  const { port } = app.address();
  const initialize = await mcpRequest(port, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "test-agent", version: "1.0.0" },
    },
  });

  assert.equal(initialize.status, 200);
  assert.equal(initialize.body.jsonrpc, "2.0");
  assert.equal(initialize.body.id, 1);
  assert.equal(initialize.body.result.protocolVersion, "2025-11-25");
  assert.deepEqual(initialize.body.result.capabilities.tools, { listChanged: false });
  assert.match(initialize.body.result.instructions, /game_observe/);

  const tools = await mcpRequest(port, {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
  });

  assert.equal(tools.status, 200);
  const toolNames = tools.body.result.tools.map((tool: { name: string }) => tool.name);
  assert.ok(toolNames.includes("game_observe"));
  assert.ok(toolNames.includes("game_move_to_hex"));
  assert.ok(toolNames.includes("game_advance_time"));
  assert.ok(toolNames.includes("game_issue_formation_order"));
  assert.ok(toolNames.includes("game_issue_alternating_forward_order"));
});

test("mcp tools start a scenario and drive the backend session", async (t) => {
  const app = createAppServer();
  await app.listen(0);
  t.after(() => app.close());

  const { port } = app.address();
  const start = await callTool(port, "game_start_session", {
    scenarioId: "cover_to_cover",
    difficulty: "training",
    seed: "mcp-move",
  });

  assert.equal(start.status, 200);
  assert.equal(start.body.result.isError, false);
  assert.equal(start.body.result.structuredContent.observation.scenario.id, "cover_to_cover");
  assert.equal(start.body.result.structuredContent.observation.player.id, "FRIENDLY_1");

  const move = await callTool(port, "game_move_to_hex", {
    q: start.body.result.structuredContent.observation.player.coord.q + 4,
    r: start.body.result.structuredContent.observation.player.coord.r,
  });

  assert.equal(move.status, 200);
  assert.equal(move.body.result.isError, false);
  assert.ok(move.body.result.structuredContent.events.some((event: { type: string }) => event.type === "movement_started"));

  const advanced = await callTool(port, "game_advance_time", { seconds: 2, stepSeconds: 0.2 });
  assert.equal(advanced.status, 200);
  assert.equal(advanced.body.result.isError, false);
  assert.ok(advanced.body.result.structuredContent.observation.time >= 2);

  const apiSession = await fetch(`http://127.0.0.1:${port}/api/session`);
  assert.equal(apiSession.status, 200);
  const projection = await apiSession.json() as { player: { coord: { q: number; r: number }; intent: { type: string } } };
  assert.notDeepEqual(projection.player.coord, start.body.result.structuredContent.observation.player.coord);
});

test("mcp endpoint rejects cross-origin browser access", async (t) => {
  const app = createAppServer();
  await app.listen(0);
  t.after(() => app.close());

  const { port } = app.address();
  const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.com",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  });

  assert.equal(response.status, 403);
});

test("mcp tools can target the same isolated game ids as the http api", async (t) => {
  const app = createAppServer();
  await app.listen(0);
  t.after(() => app.close());

  const { port } = app.address();
  const started = await callTool(port, "game_start_session", {
    scenarioId: "cover_to_cover",
    difficulty: "training",
    seed: "mcp-room",
  }, "?game=agent-room");

  assert.equal(started.body.result.isError, false);
  assert.equal(started.body.result.structuredContent.observation.gameId, "agent-room");

  const roomResponse = await fetch(`http://127.0.0.1:${port}/api/session?game=agent-room`);
  const roomProjection = await roomResponse.json() as { scenario: { id: string } };
  assert.equal(roomProjection.scenario.id, "cover_to_cover");

  const defaultResponse = await fetch(`http://127.0.0.1:${port}/api/session`);
  const defaultProjection = await defaultResponse.json() as { scenario: { id: string } };
  assert.equal(defaultProjection.scenario.id, "leader_lost_picture");
});

test("mcp exposes alternating forward as a tactical maneuver command", async (t) => {
  const app = createAppServer();
  await app.listen(0);
  t.after(() => app.close());

  const { port } = app.address();
  await callTool(port, "game_start_session", {
    scenarioId: "leader_lost_picture",
    difficulty: "training",
    seed: "mcp-alternating-forward",
  });

  const order = await callTool(port, "game_issue_alternating_forward_order", {
    direction: "SE",
    communication: "voice",
  });

  assert.equal(order.status, 200);
  assert.equal(order.body.result.isError, false);
  assert.ok(
    order.body.result.structuredContent.events.some(
      (event: { type: string; payload: { type?: string } }) =>
        event.type === "tactical_maneuver_started" && event.payload.type === "alternating_forward",
    ),
  );
});

async function callTool(port: number, name: string, args: Record<string, unknown>, query = ""): Promise<McpHttpResponse> {
  return mcpRequest(port, {
    jsonrpc: "2.0",
    id: 10,
    method: "tools/call",
    params: {
      name,
      arguments: args,
    },
  }, query);
}

async function mcpRequest(port: number, body: Record<string, unknown>, query = ""): Promise<McpHttpResponse> {
  const response = await fetch(`http://127.0.0.1:${port}/mcp${query}`, {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return {
    status: response.status,
    body: response.status === 202 ? undefined : await response.json(),
  };
}

type McpHttpResponse = {
  status: number;
  body: any;
};
