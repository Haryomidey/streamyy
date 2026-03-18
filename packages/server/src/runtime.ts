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
import { SocketIoNotifier, bindSocketIoServer } from "./transport/socket-io.js";
import type { SocketIoLikeServer } from "./types.js";

export interface CreateStreammyRuntimeOptions {
  mongoose: Mongoose;
  io: SocketIoLikeServer;
  auth?: StreammyAuthHandler;
  ringingTimeoutMs?: number;
}

export interface StreammyRuntime {
  service: StreammyService;
  notifier: SocketIoNotifier;
  bind(): void;
}

export const createStreammyRuntime = (options: CreateStreammyRuntimeOptions): StreammyRuntime => {
  const models = createStreammyModels(options.mongoose);
  const notifier = new SocketIoNotifier(options.io);
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
    bind(): void {
      bindSocketIoServer({
        io: options.io,
        auth: options.auth,
        service,
      });
    },
  };
};
