import type { EventEmitter } from "node:events";
import type { CallSessionRecord, ConnectionContext, PresenceRecord, SocketConnectionRecord } from "./call.js";
import type { StreammyCoreEvents, StreammySocketEvent } from "./events.js";
export interface CallSessionRepository {
    create(session: CallSessionRecord): Promise<CallSessionRecord>;
    findByCallId(callId: string): Promise<CallSessionRecord | null>;
    update(callId: string, update: Partial<CallSessionRecord>): Promise<CallSessionRecord | null>;
}
export interface UserPresenceRepository {
    upsert(record: PresenceRecord): Promise<PresenceRecord>;
    findByUserId(userId: string): Promise<PresenceRecord | null>;
}
export interface SocketConnectionRepository {
    upsert(record: SocketConnectionRecord): Promise<SocketConnectionRecord>;
    deleteByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null>;
    findByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null>;
    findByUserId(userId: string): Promise<SocketConnectionRecord[]>;
    countByUserId(userId: string): Promise<number>;
}
export interface StreammyNotifier {
    emitToUser(userId: string, event: StreammySocketEvent, payload: unknown): Promise<void>;
    emitToConnection(connectionId: string, event: StreammySocketEvent, payload: unknown): Promise<void>;
    joinUserRoom?(connectionId: string, userId: string): Promise<void>;
    leaveUserRoom?(connectionId: string, userId: string): Promise<void>;
}
export interface StreammyPersistenceAdapter {
    sessions: CallSessionRepository;
    presence: UserPresenceRepository;
    connections: SocketConnectionRepository;
}
export declare const defineStreammyPersistenceAdapter: (adapter: StreammyPersistenceAdapter) => StreammyPersistenceAdapter;
export interface StreammyAuthResult {
    userId: string;
    deviceId: string;
    metadata?: Record<string, unknown>;
}
export type StreammyAuthHandler = (token: string | undefined, handshake: Record<string, unknown>) => Promise<StreammyAuthResult>;
export interface StreammyCoreOptions {
    sessions: CallSessionRepository;
    presence: UserPresenceRepository;
    connections: SocketConnectionRepository;
    notifier: StreammyNotifier;
    events?: TypedEventBus;
    now?: () => Date;
    idFactory?: () => string;
    ringingTimeoutMs?: number;
    scheduler?: {
        setTimeout(handler: () => void, timeoutMs: number): unknown;
        clearTimeout(handle: unknown): void;
    };
}
export type TypedEventBus = EventEmitter & {
    emit<TKey extends keyof StreammyCoreEvents>(event: TKey, payload: StreammyCoreEvents[TKey]): boolean;
    on<TKey extends keyof StreammyCoreEvents>(event: TKey, listener: (payload: StreammyCoreEvents[TKey]) => void): TypedEventBus;
};
export interface StreammyService {
    connect(context: ConnectionContext): Promise<SocketConnectionRecord>;
    disconnect(connectionId: string): Promise<void>;
    initiateCall(input: {
        callerId: string;
        receiverId: string;
        callType: CallSessionRecord["callType"];
        metadata?: Record<string, unknown>;
    }): Promise<CallSessionRecord>;
    acceptCall(input: {
        callId: string;
        userId: string;
        deviceId?: string;
    }): Promise<CallSessionRecord>;
    declineCall(input: {
        callId: string;
        userId: string;
        deviceId?: string;
        reason?: string;
    }): Promise<CallSessionRecord>;
    cancelCall(input: {
        callId: string;
        userId: string;
        deviceId?: string;
    }): Promise<CallSessionRecord>;
    endCall(input: {
        callId: string;
        userId: string;
        deviceId?: string;
    }): Promise<CallSessionRecord>;
    markCallMissed(callId: string): Promise<CallSessionRecord>;
    relayOffer(input: {
        callId: string;
        fromUserId: string;
        targetUserId: string;
        payload: unknown;
    }): Promise<void>;
    relayAnswer(input: {
        callId: string;
        fromUserId: string;
        targetUserId: string;
        payload: unknown;
    }): Promise<void>;
    relayIceCandidate(input: {
        callId: string;
        fromUserId: string;
        targetUserId: string;
        payload: unknown;
    }): Promise<void>;
}
//# sourceMappingURL=interfaces.d.ts.map