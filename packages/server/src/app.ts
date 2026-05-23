import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { stripTypeScriptTypes } from "node:module";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  advanceSession,
  createPhaseOneSession,
  dispatchCommand,
  listScenarioOptions,
  projectSession,
  type DifficultyLevel,
  type PlayerCommand,
  type ScenarioId,
  type Session,
} from "../../core/src/index.ts";
import { handleMcpHttpRequest, MCP_PATH } from "./mcp.ts";

type AppServer = {
  listen: (port: number, host?: string) => Promise<void>;
  close: () => Promise<void>;
  address: () => { port: number };
};

type SocketConnection = {
  send: (payload: unknown) => void;
  close: () => void;
};

type GameState = {
  session: Session;
  sockets: Set<SocketConnection>;
};

const TICK_SECONDS = 0.2;
const DEFAULT_CLIENT_DIR = fileURLToPath(new URL("../../client/public", import.meta.url));
const CLIENT_DIR = process.env.PERSPEKTIVBUBBLA_CLIENT_DIR ?? DEFAULT_CLIENT_DIR;
const DEFAULT_GAME_ID = "main";

export function createAppServer(): AppServer {
  const games = new Map<string, GameState>();
  const server = createServer((request, response) => {
    void handleHttpRequest(request, response, {
      getSession: (gameId = DEFAULT_GAME_ID) => getGame(games, normalizeGameId(gameId)).session,
      setSession: (gameIdOrSession, maybeSession) => {
        const gameId = maybeSession ? normalizeGameId(gameIdOrSession as string) : DEFAULT_GAME_ID;
        const next = maybeSession ?? (gameIdOrSession as Session);
        const game = getGame(games, gameId);
        game.session = next;
        broadcast(game);
      },
    });
  });

  const interval = setInterval(() => {
    for (const game of games.values()) {
      if (game.sockets.size === 0) {
        continue;
      }
      game.session = advanceSession(game.session, TICK_SECONDS);
      broadcast(game);
    }
  }, TICK_SECONDS * 1000);
  interval.unref();

  server.on("upgrade", (request, socket) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    if (requestUrl.pathname !== "/ws") {
      socket.end("HTTP/1.1 404 Not Found\r\n\r\n");
      return;
    }
    const game = getGame(games, gameIdFromUrl(requestUrl));

    const key = request.headers["sec-websocket-key"];
    if (typeof key !== "string") {
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
      return;
    }

    const accept = createHash("sha1")
      .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
      .digest("base64");

    socket.write(
      [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Accept: ${accept}`,
        "\r\n",
      ].join("\r\n"),
    );

    const connection: SocketConnection = {
      send: (payload: unknown) => socket.write(encodeFrame(JSON.stringify(payload))),
      close: () => socket.destroy(),
    };
    game.sockets.add(connection);
    connection.send({ type: "projection", projection: projectSession(game.session, "player") });

    socket.on("data", (chunk: Buffer) => {
      for (const message of decodeFrames(chunk)) {
        const parsed = safeJson(message);
        if (parsed?.type === "command") {
          game.session = dispatchCommand(game.session, parsed.command as PlayerCommand);
          broadcast(game);
        }
      }
    });
    socket.on("close", () => game.sockets.delete(connection));
    socket.on("error", () => game.sockets.delete(connection));
  });

  return {
    listen: (port: number, host = "127.0.0.1") =>
      new Promise((resolve) => {
        server.listen(port, host, () => resolve());
      }),
    close: () =>
      new Promise((resolve, reject) => {
        clearInterval(interval);
        for (const game of games.values()) {
          for (const socket of game.sockets) {
            socket.close();
          }
        }
        server.close((error) => (error ? reject(error) : resolve()));
      }),
    address: () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("server is not listening on a TCP port");
      }
      return { port: address.port };
    },
  };
}

function getGame(games: Map<string, GameState>, gameId: string): GameState {
  const existing = games.get(gameId);
  if (existing) {
    return existing;
  }
  const game: GameState = {
    session: createPhaseOneSession({
      seed: `${gameId}:phase-one`,
      scenarioId: "leader_lost_picture",
      difficulty: "training",
    }),
    sockets: new Set(),
  };
  games.set(gameId, game);
  return game;
}

function broadcast(game: GameState): void {
  const payload = { type: "projection", projection: projectSession(game.session, "player") };
  for (const socket of game.sockets) {
    socket.send(payload);
  }
}

type SessionController = {
  getSession: (gameId?: string) => Session;
  setSession: ((session: Session) => void) & ((gameId: string, session: Session) => void);
};

async function handleHttpRequest(request: IncomingMessage, response: ServerResponse, controller: SessionController): Promise<void> {
  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const pathname = requestUrl.pathname;
  if (pathname === MCP_PATH) {
    await handleMcpHttpRequest(request, response, controller);
    return;
  }

  if (pathname === "/api/scenarios") {
    sendJson(response, {
      scenarios: listScenarioOptions(),
      difficulties: [
        { id: "training", label: "Träning", description: "Visar riskzoner, ordermottagning, rapporter och tydlig osäkerhet." },
        { id: "normal", label: "Normal", description: "Mindre hjälp, mer tonvikt på uppfattad lägesbild och rapporter." },
        { id: "realistic", label: "Realistisk", description: "Minimala overlays och kortare minne av vad du inte längre ser." },
      ],
    });
    return;
  }

  if (pathname === "/api/session") {
    const gameId = gameIdFromUrl(requestUrl);
    if (request.method === "POST") {
      const body = (await readRequestBody(request)) as { scenarioId?: ScenarioId; difficulty?: DifficultyLevel; seed?: string } | undefined;
      const scenarioId = body?.scenarioId ?? "leader_lost_picture";
      const difficulty = body?.difficulty ?? "training";
      const seed = body?.seed ?? `${gameId}:${scenarioId}:${difficulty}`;
      const next = createPhaseOneSession({ scenarioId, difficulty, seed });
      controller.setSession(gameId, next);
      sendJson(response, projectSession(next, "player"));
      return;
    }
    sendJson(response, projectSession(controller.getSession(gameId), "player"));
    return;
  }

  const asset = resolveClientAsset(pathname);
  if (!asset) {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("Not found");
    return;
  }

  try {
    const content = await readFile(asset.path);
    response.writeHead(200, { "content-type": contentType(asset.name) });
    response.end(asset.name.endsWith(".ts") ? stripTypeScriptTypes(content.toString()) : content);
  } catch {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("Not found");
  }
}

function resolveClientAsset(pathname: string): { path: string; name: string } | undefined {
  let name: string;
  try {
    name = pathname === "/" || pathname.startsWith("/scenario/") ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  } catch {
    return undefined;
  }
  const root = resolve(CLIENT_DIR);
  const path = resolve(root, name);
  const relation = relative(root, path);
  if (relation.startsWith("..") || isAbsolute(relation) || relation.split(sep).includes("..")) {
    return undefined;
  }
  return { path, name };
}

function gameIdFromUrl(requestUrl: URL): string {
  return normalizeGameId(requestUrl.searchParams.get("game") ?? requestUrl.searchParams.get("gameId") ?? requestUrl.searchParams.get("g"));
}

function normalizeGameId(value: string | null | undefined): string {
  const normalized = (value ?? "")
    .trim()
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 64);
  return normalized || DEFAULT_GAME_ID;
}

function readRequestBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8").trim();
      if (!text) {
        resolve(undefined);
        return;
      }
      resolve(safeJson(text));
    });
    request.on("error", () => resolve(undefined));
  });
}

function sendJson(response: ServerResponse, value: unknown): void {
  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify(value));
}

function contentType(filePath: string): string {
  if (filePath.endsWith(".js") || filePath.endsWith(".ts")) {
    return "text/javascript";
  }
  if (filePath.endsWith(".css")) {
    return "text/css";
  }
  if (filePath.endsWith(".png")) {
    return "image/png";
  }
  return "text/html";
}

function safeJson(text: string): { type?: string; command?: unknown } | undefined {
  try {
    return JSON.parse(text) as { type?: string; command?: unknown };
  } catch {
    return undefined;
  }
}

function encodeFrame(message: string): Buffer {
  const payload = Buffer.from(message);
  if (payload.length < 126) {
    return Buffer.concat([Buffer.from([0x81, payload.length]), payload]);
  }
  if (payload.length <= 65535) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
    return Buffer.concat([header, payload]);
  }
  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(payload.length), 2);
  return Buffer.concat([header, payload]);
}

function decodeFrames(buffer: Buffer): string[] {
  const messages: string[] = [];
  let offset = 0;
  while (offset + 2 <= buffer.length) {
    const first = buffer[offset];
    const second = buffer[offset + 1];
    const opcode = first & 0x0f;
    const masked = (second & 0x80) === 0x80;
    let length = second & 0x7f;
    offset += 2;

    if (length === 126) {
      if (offset + 2 > buffer.length) break;
      length = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (length === 127) {
      if (offset + 8 > buffer.length) break;
      length = Number(buffer.readBigUInt64BE(offset));
      offset += 8;
    }

    let mask: Buffer | undefined;
    if (masked) {
      if (offset + 4 > buffer.length) break;
      mask = buffer.subarray(offset, offset + 4);
      offset += 4;
    }

    if (offset + length > buffer.length) break;
    const payload = Buffer.from(buffer.subarray(offset, offset + length));
    offset += length;

    if (mask) {
      for (let index = 0; index < payload.length; index += 1) {
        payload[index] ^= mask[index % 4];
      }
    }

    if (opcode === 0x8) {
      break;
    }
    if (opcode === 0x1) {
      messages.push(payload.toString("utf8"));
    }
  }
  return messages;
}
