import {
  createStreammyModels,
  createStreammyService,
  MongooseCallSessionRepository,
  MongooseSocketConnectionRepository,
  MongooseUserPresenceRepository,
  type StreammyAuthHandler,
  type StreammyService,
} from "@streammy/core";
import type { Mongoose } from "mongoose";
import { Server as SocketIoServer, type ServerOptions as SocketIoServerOptions } from "socket.io";
import { SocketIoNotifier, bindSocketIoServer } from "./transport/socket-io.js";
import type { SocketIoLikeServer } from "./types.js";

export interface CreateStreammyRuntimeOptions {
  mongoose: Mongoose;
  httpServer: import("node:http").Server;
  auth?: StreammyAuthHandler;
  ringingTimeoutMs?: number;
  socket?: Partial<SocketIoServerOptions>;
}

export interface StreammyRuntime {
  service: StreammyService;
  notifier: SocketIoNotifier;
  io: SocketIoLikeServer;
  bind(): void;
}

export const createStreammyRuntime = (options: CreateStreammyRuntimeOptions): StreammyRuntime => {
  const io = new SocketIoServer(options.httpServer, options.socket ?? {}) as unknown as SocketIoLikeServer;
  const models = createStreammyModels(options.mongoose);
  const notifier = new SocketIoNotifier(io);
  const service = createStreammyService({
    sessions: new MongooseCallSessionRepository(models.CallSession),
    presence: new MongooseUserPresenceRepository(models.UserPresence),
    connections: new MongooseSocketConnectionRepository(models.SocketConnection),
    notifier,
    ringingTimeoutMs: options.ringingTimeoutMs,
  });

  return {
    service,
    notifier,
    io,
    bind(): void {
      bindSocketIoServer({
        io,
        auth: options.auth,
        service,
      });
    },
  };
};

export const createStreammyServer = createStreammyRuntime;
