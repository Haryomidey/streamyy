import { StreammyError, STREAMMY_EVENTS, type StreammyAuthResult } from "@streamyy/core";
import { InMemoryStreammyRateLimiter } from "../rate-limit.js";
import type { SocketIoLikeSocket, StreammySocketServerOptions } from "../types.js";

const userRoom = (userId: string): string => `streammy:user:${userId}`;

const withOptionalMetadata = <TValue extends { userId: string; deviceId: string }>(
  value: TValue,
  metadata: Record<string, unknown> | undefined,
): TValue & { metadata?: Record<string, unknown> } => {
  if (metadata === undefined) {
    return value;
  }

  return {
    ...value,
    metadata,
  };
};

const readAuthToken = (socket: SocketIoLikeSocket): string | undefined => {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string") {
    return authToken;
  }

  const headerToken = socket.handshake.headers?.authorization;
  return typeof headerToken === "string" ? headerToken.replace(/^Bearer\s+/i, "") : undefined;
};

const readSocketIp = (socket: SocketIoLikeSocket): string | undefined => {
  const forwardedFor = socket.handshake.headers?.["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0]?.trim();
  }

  return socket.handshake.address;
};

const emitSocketError = (socket: SocketIoLikeSocket, error: unknown): void => {
  const payload =
    error instanceof StreammyError
      ? { code: error.code, message: error.message }
      : { code: "INTERNAL_ERROR", message: error instanceof Error ? error.message : "Unexpected error" };
  socket.emit(STREAMMY_EVENTS.error, payload);
};

export class SocketIoNotifier {
  public constructor(private readonly io: StreammySocketServerOptions["io"]) {}

  public async emitToUser(userId: string, event: string, payload: unknown): Promise<void> {
    this.io.to(userRoom(userId)).emit(event, payload);
  }

  public async emitToConnection(_connectionId: string, _event: string, _payload: unknown): Promise<void> {
    return;
  }

  public async joinUserRoom(connectionId: string, userId: string): Promise<void> {
    void connectionId;
    void userId;
  }

  public async leaveUserRoom(_connectionId: string, _userId: string): Promise<void> {
    return;
  }
}

const applyAuth = async (
  socket: SocketIoLikeSocket,
  auth: StreammySocketServerOptions["auth"],
): Promise<StreammyAuthResult> => {
  if (!auth) {
    const userId = socket.handshake.auth?.userId;
    if (typeof userId !== "string" || userId.length === 0) {
      throw new StreammyError("UNAUTHENTICATED", "Socket auth must provide userId.");
    }

    const deviceId = socket.handshake.auth?.deviceId;
    const metadata =
      typeof socket.handshake.auth?.metadata === "object" && socket.handshake.auth?.metadata !== null
        ? (socket.handshake.auth.metadata as Record<string, unknown>)
        : undefined;

    return {
      ...withOptionalMetadata(
        {
          userId,
          deviceId: typeof deviceId === "string" && deviceId.length > 0 ? deviceId : socket.id,
        },
        metadata,
      ),
    };
  }

  return auth(readAuthToken(socket), {
    headers: socket.handshake.headers ?? {},
    query: socket.handshake.query ?? {},
    auth: socket.handshake.auth ?? {},
  });
};

export const bindSocketIoServer = (options: StreammySocketServerOptions): void => {
  const rateLimiter = options.rateLimit ? new InMemoryStreammyRateLimiter(options.rateLimit) : null;

  options.io.use(async (socket, next) => {
    try {
      const auth = await applyAuth(socket, options.auth);
      rateLimiter?.assertConnectionAllowed({
        userId: auth.userId,
        ip: readSocketIp(socket),
      });
      socket.data.streammy = auth;
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error("Authentication failed."));
    }
  });

  options.io.on("connection", (socket) => {
    const auth = socket.data.streammy as StreammyAuthResult;
    const rateLimitContext = {
      userId: auth.userId,
      ip: readSocketIp(socket),
    };
    void socket.join(userRoom(auth.userId));
    void options.service.connect(
      withOptionalMetadata(
        {
          connectionId: socket.id,
          userId: auth.userId,
          deviceId: auth.deviceId,
        },
        auth.metadata,
      ),
    );

    socket.on("disconnect", () => {
      void options.service.disconnect(socket.id);
    });

    socket.on(STREAMMY_EVENTS.callInitiate, (payload) => {
      try {
        rateLimiter?.assertCallInitiationAllowed(rateLimitContext);
        void options.service.initiateCall({
          callerId: auth.userId,
          receiverId: String(payload.receiverId),
          callType: payload.callType === "video" ? "video" : "audio",
          ...(payload.metadata !== undefined ? { metadata: payload.metadata as Record<string, unknown> } : {}),
        }).catch((error) => {
          emitSocketError(socket, error);
        });
      } catch (error) {
        emitSocketError(socket, error);
      }
    });

    socket.on(STREAMMY_EVENTS.callAccept, (payload) => {
      void options.service.acceptCall({
        callId: String(payload.callId),
        userId: auth.userId,
        deviceId: auth.deviceId,
      }).catch((error) => {
        emitSocketError(socket, error);
      });
    });

    socket.on(STREAMMY_EVENTS.callDecline, (payload) => {
      void options.service.declineCall({
        callId: String(payload.callId),
        userId: auth.userId,
        deviceId: auth.deviceId,
        ...(typeof payload.reason === "string" ? { reason: payload.reason } : {}),
      }).catch((error) => {
        emitSocketError(socket, error);
      });
    });

    socket.on(STREAMMY_EVENTS.callCancel, (payload) => {
      void options.service.cancelCall({
        callId: String(payload.callId),
        userId: auth.userId,
        deviceId: auth.deviceId,
      }).catch((error) => {
        emitSocketError(socket, error);
      });
    });

    socket.on(STREAMMY_EVENTS.callEnd, (payload) => {
      void options.service.endCall({
        callId: String(payload.callId),
        userId: auth.userId,
        deviceId: auth.deviceId,
      }).catch((error) => {
        emitSocketError(socket, error);
      });
    });

    socket.on(STREAMMY_EVENTS.callOffer, (payload) => {
      void options.service.relayOffer({
        callId: String(payload.callId),
        fromUserId: auth.userId,
        targetUserId: String(payload.targetUserId),
        payload: payload.payload,
      }).catch((error) => {
        emitSocketError(socket, error);
      });
    });

    socket.on(STREAMMY_EVENTS.callAnswer, (payload) => {
      void options.service.relayAnswer({
        callId: String(payload.callId),
        fromUserId: auth.userId,
        targetUserId: String(payload.targetUserId),
        payload: payload.payload,
      }).catch((error) => {
        emitSocketError(socket, error);
      });
    });

    socket.on(STREAMMY_EVENTS.callIceCandidate, (payload) => {
      void options.service.relayIceCandidate({
        callId: String(payload.callId),
        fromUserId: auth.userId,
        targetUserId: String(payload.targetUserId),
        payload: payload.payload,
      }).catch((error) => {
        emitSocketError(socket, error);
      });
    });
  });
};