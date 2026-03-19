import {
  STREAMMY_EVENTS,
  type CallSessionRecord,
  type CallType,
  type PresenceRecord,
} from "@streammy/core";
import { io, type Socket } from "socket.io-client";
import type {
  StreammyCallAccepted,
  StreammyCallEnded,
  StreammyClientEvents,
  StreammyClientOptions,
  StreammyIncomingCall,
  StreammySignalEvent,
  StreammySimpleCallEvent,
} from "./types.js";

type EventKey = keyof StreammyClientEvents;
type Listener<TKey extends EventKey> = (payload: StreammyClientEvents[TKey]) => void;

export class StreammyClient {
  private readonly socket: Socket;
  private readonly listeners = new Map<EventKey, Set<Listener<any>>>();

  public constructor(private readonly options: StreammyClientOptions) {
    this.socket = io(options.url, {
      autoConnect: options.autoConnect ?? true,
      transports: options.lowBandwidthMode ? ["websocket"] : undefined,
      upgrade: options.lowBandwidthMode ? false : undefined,
      reconnection: options.reconnection ?? true,
      reconnectionAttempts: options.reconnectionAttempts ?? Infinity,
      reconnectionDelay: options.reconnectionDelayMs ?? 1000,
      reconnectionDelayMax: options.reconnectionDelayMaxMs ?? 5000,
      timeout: options.connectionTimeoutMs ?? 10_000,
      auth: {
        userId: options.userId,
        ...(options.token ? { token: options.token } : {}),
        ...(options.deviceId ? { deviceId: options.deviceId } : {}),
        ...(options.metadata ? { metadata: options.metadata } : {}),
      },
    });

    this.bindSocketEvents();
  }

  public connect(): void {
    this.socket.connect();
  }

  public disconnect(): void {
    this.socket.disconnect();
  }

  public on<TKey extends EventKey>(event: TKey, listener: Listener<TKey>): () => void {
    const bucket = this.listeners.get(event) ?? new Set();
    bucket.add(listener as Listener<any>);
    this.listeners.set(event, bucket);
    return () => {
      bucket.delete(listener as Listener<any>);
    };
  }

  public initiateCall(receiverId: string, callType: CallType, metadata?: Record<string, unknown>): void {
    this.socket.emit(STREAMMY_EVENTS.callInitiate, {
      receiverId,
      callType,
      ...(metadata ? { metadata } : {}),
    });
  }

  public acceptCall(callId: string): void {
    this.socket.emit(STREAMMY_EVENTS.callAccept, { callId });
  }

  public declineCall(callId: string, reason?: string): void {
    this.socket.emit(STREAMMY_EVENTS.callDecline, { callId, reason });
  }

  public cancelCall(callId: string): void {
    this.socket.emit(STREAMMY_EVENTS.callCancel, { callId });
  }

  public endCall(callId: string): void {
    this.socket.emit(STREAMMY_EVENTS.callEnd, { callId });
  }

  public sendOffer(callId: string, targetUserId: string, payload: RTCSessionDescriptionInit): void {
    this.socket.emit(STREAMMY_EVENTS.callOffer, { callId, targetUserId, payload });
  }

  public sendAnswer(callId: string, targetUserId: string, payload: RTCSessionDescriptionInit): void {
    this.socket.emit(STREAMMY_EVENTS.callAnswer, { callId, targetUserId, payload });
  }

  public sendIceCandidate(callId: string, targetUserId: string, payload: RTCIceCandidateInit): void {
    this.socket.emit(STREAMMY_EVENTS.callIceCandidate, { callId, targetUserId, payload });
  }

  private bindSocketEvents(): void {
    this.socket.on("connect", () => this.emit("connected", undefined));
    this.socket.on("disconnect", () => this.emit("disconnected", undefined));
    this.socket.io.on("reconnect_attempt", (attempt: number) =>
      this.emit("reconnecting", { attempt }),
    );
    this.socket.io.on("reconnect", () => this.emit("reconnected", undefined));
    this.socket.on(STREAMMY_EVENTS.callIncoming, (payload: StreammyIncomingCall) =>
      this.emit("incomingCall", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callInitiate, (payload: CallSessionRecord) =>
      this.emit("callInitiated", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callAccept, (payload: StreammyCallAccepted) =>
      this.emit("callAccepted", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callDecline, (payload: StreammySimpleCallEvent) =>
      this.emit("callDeclined", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callCancel, (payload: StreammySimpleCallEvent) =>
      this.emit("callCancelled", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callEnd, (payload: StreammyCallEnded) =>
      this.emit("callEnded", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callOffer, (payload: StreammySignalEvent) =>
      this.emit("offer", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callAnswer, (payload: StreammySignalEvent) =>
      this.emit("answer", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callIceCandidate, (payload: StreammySignalEvent) =>
      this.emit("iceCandidate", payload),
    );
    this.socket.on(STREAMMY_EVENTS.presenceUpdate, (payload: PresenceRecord) =>
      this.emit("presenceUpdated", payload),
    );
  }

  private emit<TKey extends EventKey>(event: TKey, payload: StreammyClientEvents[TKey]): void {
    const listeners = this.listeners.get(event);
    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      listener(payload);
    }
  }
}

export const createStreammyClient = (options: StreammyClientOptions): StreammyClient => {
  return new StreammyClient(options);
};
