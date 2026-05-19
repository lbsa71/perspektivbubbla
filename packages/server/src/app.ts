import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { stripTypeScriptTypes } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  advanceSession,
  createPhaseOneSession,
  dispatchCommand,
  projectSession,
  type PlayerCommand,
  type Session,
} from "../../core/src/index.ts";

type AppServer = {
  listen: (port: number) => Promise<void>;
  close: () => Promise<void>;
  address: () => { port: number };
};

type SocketConnection = {
  send: (payload: unknown) => void;
  close: () => void;
};

const TICK_SECONDS = 0.2;
const CLIENT_DIR = fileURLToPath(new URL("../../client/public", import.meta.url));

export function createAppServer(): AppServer {
  let session = createPhaseOneSession({ seed: "phase-one", scenario: "group_commander" });
  const sockets = new Set<SocketConnection>();
  const server = createServer((request, response) => {
    void handleHttpRequest(request, response, session);
  });

  const interval = setInterval(() => {
    if (sockets.size === 0) {
      return;
    }
    session = advanceSession(session, TICK_SECONDS);
    broadcast(sockets, session);
  }, TICK_SECONDS * 1000);
  interval.unref();

  server.on("upgrade", (request, socket) => {
    if (request.url !== "/ws") {
      socket.end("HTTP/1.1 404 Not Found\r\n\r\n");
      return;
    }

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
    sockets.add(connection);
    connection.send({ type: "projection", projection: projectSession(session, "player") });

    socket.on("data", (chunk: Buffer) => {
      for (const message of decodeFrames(chunk)) {
        const parsed = safeJson(message);
        if (parsed?.type === "command") {
          session = dispatchCommand(session, parsed.command as PlayerCommand);
          broadcast(sockets, session);
        }
      }
    });
    socket.on("close", () => sockets.delete(connection));
    socket.on("error", () => sockets.delete(connection));
  });

  return {
    listen: (port: number) =>
      new Promise((resolve) => {
        server.listen(port, "127.0.0.1", () => resolve());
      }),
    close: () =>
      new Promise((resolve, reject) => {
        clearInterval(interval);
        for (const socket of sockets) {
          socket.close();
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

function broadcast(sockets: Set<SocketConnection>, session: Session): void {
  const payload = { type: "projection", projection: projectSession(session, "player") };
  for (const socket of sockets) {
    socket.send(payload);
  }
}

async function handleHttpRequest(request: IncomingMessage, response: ServerResponse, session: Session): Promise<void> {
  const url = request.url ?? "/";
  if (url === "/api/session") {
    sendJson(response, projectSession(session, "player"));
    return;
  }

  const filePath = url === "/" ? "index.html" : url.replace(/^\//, "");
  try {
    const content = await readFile(join(CLIENT_DIR, filePath));
    response.writeHead(200, { "content-type": contentType(filePath) });
    response.end(filePath.endsWith(".ts") ? stripTypeScriptTypes(content.toString()) : content);
  } catch {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("Not found");
  }
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
