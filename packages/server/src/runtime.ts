import {
  createInMemoryPersistenceAdapter,
  createStreammyService,
  type StreammyAuthHandler,
  type StreammyPersistenceAdapter,
  type StreammyService,
} from "@streammy/core";
import { Server as SocketIoServer, type ServerOptions as SocketIoServerOptions } from "socket.io";
import { SocketIoNotifier, bindSocketIoServer } from "./transport/socket-io.js";
import type { SocketIoLikeServer } from "./types.js";

export interface CreateStreammyRuntimeOptions {
  httpServer: import("node:http").Server;
  auth?: StreammyAuthHandler;
  ringingTimeoutMs?: number;
  socket?: Partial<SocketIoServerOptions>;
  persistence?: StreammyPersistenceAdapter;
}

export interface StreammyRuntime {
  service: StreammyService;
  notifier: SocketIoNotifier;
  io: SocketIoLikeServer;
  bind(): void;
}

export const createStreammyRuntime = (options: CreateStreammyRuntimeOptions): StreammyRuntime => {
  const io = new SocketIoServer(options.httpServer, options.socket ?? {}) as unknown as SocketIoLikeServer;
  const notifier = new SocketIoNotifier(io);
  const persistence = options.persistence ?? createInMemoryPersistenceAdapter();
  const service = createStreammyService({
    sessions: persistence.sessions,
    presence: persistence.presence,
    connections: persistence.connections,
    notifier,
    ...(options.ringingTimeoutMs !== undefined ? { ringingTimeoutMs: options.ringingTimeoutMs } : {}),
  });

  return {
    service,
    notifier,
    io,
    bind(): void {
      bindSocketIoServer({
        io,
        service,
        ...(options.auth ? { auth: options.auth } : {}),
      });
    },
  };
};

export const createStreammyServer = createStreammyRuntime;
