import type { Server as HttpServer, IncomingMessage } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { verifyAccessToken } from "../lib/jwt";
import type { RealtimeMessage } from "./events";

const HEARTBEAT_INTERVAL_MS = 30_000;

interface AuthenticatedSocket extends WebSocket {
  userId: string;
  isAlive: boolean;
}

// userId -> that user's open sockets (a person may have several tabs/devices).
const connections = new Map<string, Set<AuthenticatedSocket>>();

let heartbeat: NodeJS.Timeout | undefined;

function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }
  return undefined;
}

function register(socket: AuthenticatedSocket) {
  const existing = connections.get(socket.userId);
  if (existing) {
    existing.add(socket);
    return;
  }
  connections.set(socket.userId, new Set([socket]));
}

function unregister(socket: AuthenticatedSocket) {
  const sockets = connections.get(socket.userId);
  if (!sockets) return;
  sockets.delete(socket);
  if (sockets.size === 0) connections.delete(socket.userId);
}

// Fire-and-forget: a closed socket or an offline user must never fail the
// database write that triggered the push.
export function pushToUser(userId: string, message: RealtimeMessage): void {
  const sockets = connections.get(userId);
  if (!sockets?.size) return;

  const serialized = JSON.stringify(message);
  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(serialized, (error) => {
        if (error) logger.warn({ err: error, userId }, "Realtime push failed");
      });
    }
  }
}

export function pushToUsers(userIds: readonly string[], message: RealtimeMessage): void {
  for (const userId of new Set(userIds)) {
    pushToUser(userId, message);
  }
}

export function attachRealtimeGateway(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request: IncomingMessage, socket, head) => {
    const { url, headers } = request;

    if (!url?.startsWith("/ws/notifications")) {
      socket.destroy();
      return;
    }

    // Same origin allowlist as the REST API — a WebSocket handshake bypasses
    // CORS, so the check has to happen here explicitly.
    const origin = headers.origin;
    if (origin && !env.CORS_ORIGINS.includes(origin)) {
      socket.destroy();
      return;
    }

    const token = readCookie(headers.cookie, "access_token");
    if (!token) {
      socket.destroy();
      return;
    }

    let userId: string;
    try {
      userId = verifyAccessToken(token).sub;
    } catch {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      const authenticated = ws as AuthenticatedSocket;
      authenticated.userId = userId;
      authenticated.isAlive = true;
      wss.emit("connection", authenticated, request);
    });
  });

  wss.on("connection", (ws) => {
    const socket = ws as AuthenticatedSocket;
    register(socket);

    socket.on("pong", () => {
      socket.isAlive = true;
    });
    socket.on("close", () => unregister(socket));
    socket.on("error", () => unregister(socket));
  });

  heartbeat = setInterval(() => {
    for (const sockets of connections.values()) {
      for (const socket of sockets) {
        if (!socket.isAlive) {
          socket.terminate();
          continue;
        }
        socket.isAlive = false;
        socket.ping();
      }
    }
  }, HEARTBEAT_INTERVAL_MS);

  return wss;
}

export function closeRealtimeGateway(): void {
  if (heartbeat) clearInterval(heartbeat);
  for (const sockets of connections.values()) {
    for (const socket of sockets) socket.terminate();
  }
  connections.clear();
}
