import { type CallSessionRecord, type ConnectionContext, type SocketConnectionRecord } from "../domain/call.js";
import type { StreammyCoreOptions, StreammyService } from "../domain/interfaces.js";
export declare class DefaultStreammyService implements StreammyService {
    private readonly options;
    private readonly events;
    private readonly now;
    private readonly idFactory;
    private readonly ringingTimeoutMs;
    private readonly scheduler;
    private readonly ringingTimers;
    constructor(options: StreammyCoreOptions);
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
    private requireCall;
    private updateCall;
    private requireParticipant;
    private syncPresence;
    private scheduleMissedCallTimeout;
    private clearMissedCallTimeout;
}
export declare const createStreammyService: (options: StreammyCoreOptions) => StreammyService;
//# sourceMappingURL=streammy-service.d.ts.map