import {
  STREAMMY_EVENTS,
  type CallSessionRecord,
  type CallType,
  type PresenceRecord,
} from "@streammy/core";
import { io, type Socket } from "socket.io-client";
import type { StreammyClientEvents, StreammyClientOptions, StreammyIncomingCall } from "./types.js";

type EventKey = keyof StreammyClientEvents;
type Listener<TKey extends EventKey> = (payload: StreammyClientEvents[TKey]) => void;

export class StreammyClient {
  private readonly socket: Socket;
  private readonly listeners = new Map<EventKey, Set<Listener<any>>>();

  public constructor(private readonly options: StreammyClientOptions) {
    this.socket = io(options.url, {
      autoConnect: options.autoConnect ?? true,
      auth: {
        token: options.token,
        userId: options.userId,
        deviceId: options.deviceId,
        metadata: options.metadata,
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
      metadata,
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
    this.socket.on(STREAMMY_EVENTS.callIncoming, (payload: StreammyIncomingCall) =>
      this.emit("incomingCall", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callInitiate, (payload: CallSessionRecord) =>
      this.emit("callInitiated", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callAccept, (payload: Record<string, unknown>) =>
      this.emit("callAccepted", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callDecline, (payload: Record<string, unknown>) =>
      this.emit("callDeclined", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callCancel, (payload: Record<string, unknown>) =>
      this.emit("callCancelled", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callEnd, (payload: Record<string, unknown>) =>
      this.emit("callEnded", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callOffer, (payload: Record<string, unknown>) =>
      this.emit("offer", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callAnswer, (payload: Record<string, unknown>) =>
      this.emit("answer", payload),
    );
    this.socket.on(STREAMMY_EVENTS.callIceCandidate, (payload: Record<string, unknown>) =>
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
