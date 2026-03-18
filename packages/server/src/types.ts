import type { Server as HttpServer } from "node:http";
import type {
  StreammyAuthHandler,
  StreammyNotifier,
  StreammyService,
} from "@streammy/core";

export interface SocketIoLikeSocket {
  id: string;
  handshake: {
    auth?: Record<string, unknown>;
    headers?: Record<string, unknown>;
    query?: Record<string, unknown>;
  };
  data: Record<string, unknown>;
  join(room: string): Promise<void> | void;
  leave(room: string): Promise<void> | void;
  emit(event: string, payload: unknown): boolean;
  on(event: string, listener: (...args: any[]) => void): this;
}

export interface SocketIoLikeServer {
  use(
    handler: (
      socket: SocketIoLikeSocket,
      next: (error?: Error) => void,
    ) => void | Promise<void>,
  ): void;
  on(event: "connection", listener: (socket: SocketIoLikeSocket) => void): void;
  to(room: string): {
    emit(event: string, payload: unknown): boolean;
  };
}

export interface StreammySocketServerOptions {
  io: SocketIoLikeServer;
  service: StreammyService;
  auth?: StreammyAuthHandler;
}

export interface StreammyServerRuntimeOptions {
  service: StreammyService;
  notifier: StreammyNotifier;
  auth?: StreammyAuthHandler;
}

export interface ExpressLikeRequest {
  body?: Record<string, any>;
  params?: Record<string, string>;
  query?: Record<string, string | string[]>;
}

export interface ExpressLikeResponse {
  status(code: number): ExpressLikeResponse;
  json(payload: unknown): void;
}

export type ExpressLikeHandler = (
  request: ExpressLikeRequest,
  response: ExpressLikeResponse,
) => void | Promise<void>;

export interface ExpressLikeRouter {
  post(path: string, handler: ExpressLikeHandler): void;
  get(path: string, handler: ExpressLikeHandler): void;
}

export interface FastifyLikeInstance {
  route(options: {
    method: "GET" | "POST";
    url: string;
    handler: (request: { body?: any; params?: Record<string, string> }, reply: FastifyLikeReply) => unknown;
  }): void;
}

export interface FastifyLikeReply {
  code(statusCode: number): FastifyLikeReply;
  send(payload: unknown): void;
}

export interface StreammyHttpAdapterOptions {
  service: StreammyService;
  basePath?: string;
}

export interface StreammyModuleOptions extends StreammyServerRuntimeOptions {
  global?: boolean;
  httpServer?: HttpServer;
}

export interface NestProviderLike<TValue = unknown> {
  provide: string | symbol | Function;
  useValue: TValue;
}

export interface NestDynamicModuleLike {
  module: unknown;
  global?: boolean;
  providers?: NestProviderLike[];
  exports?: Array<string | symbol | Function>;
}
