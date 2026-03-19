import { StreammyError } from "../domain/errors.js";
import { STREAMMY_EVENTS } from "../domain/events.js";
import { createEventBus } from "../events.js";
import { assertTransition } from "./state-machine.js";
const randomId = () => {
    return `call_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
};
export class DefaultStreammyService {
    options;
    events;
    now;
    idFactory;
    ringingTimeoutMs;
    scheduler;
    ringingTimers = new Map();
    constructor(options) {
        this.options = options;
        this.events = options.events ?? createEventBus();
        this.now = options.now ?? (() => new Date());
        this.idFactory = options.idFactory ?? randomId;
        this.ringingTimeoutMs = options.ringingTimeoutMs ?? 60_000;
        this.scheduler = options.scheduler ?? {
            setTimeout(handler, timeoutMs) {
                return globalThis.setTimeout(handler, timeoutMs);
            },
            clearTimeout(handle) {
                globalThis.clearTimeout(handle);
            },
        };
    }
    async connect(context) {
        const timestamp = this.now();
        const connection = await this.options.connections.upsert({
            connectionId: context.connectionId,
            userId: context.userId,
            deviceId: context.deviceId,
            connectedAt: timestamp,
            lastSeenAt: timestamp,
            ...(context.metadata ? { metadata: context.metadata } : {}),
        });
        await this.options.notifier.joinUserRoom?.(connection.connectionId, connection.userId);
        await this.syncPresence(connection.userId, context.metadata);
        this.events.emit("connection.connected", connection);
        return connection;
    }
    async disconnect(connectionId) {
        const connection = await this.options.connections.deleteByConnectionId(connectionId);
        if (!connection) {
            return;
        }
        await this.options.notifier.leaveUserRoom?.(connection.connectionId, connection.userId);
        await this.syncPresence(connection.userId, connection.metadata);
        this.events.emit("connection.disconnected", connection);
    }
    async initiateCall(input) {
        const created = await this.options.sessions.create({
            callId: this.idFactory(),
            callerId: input.callerId,
            receiverId: input.receiverId,
            callType: input.callType,
            status: "initiated",
            ...(input.metadata ? { metadata: input.metadata } : {}),
        });
        const session = await this.updateCall(created.callId, {
            status: "ringing",
        });
        this.scheduleMissedCallTimeout(session.callId);
        await this.options.notifier.emitToUser(input.receiverId, STREAMMY_EVENTS.callIncoming, {
            callId: session.callId,
            callerId: session.callerId,
            receiverId: session.receiverId,
            callType: session.callType,
            status: session.status,
            metadata: session.metadata,
        });
        await this.options.notifier.emitToUser(input.callerId, STREAMMY_EVENTS.callInitiate, session);
        this.events.emit("call.created", session);
        return session;
    }
    async acceptCall(input) {
        const session = await this.requireCall(input.callId);
        if (session.receiverId !== input.userId) {
            throw new StreammyError("CALL_RECEIVER_MISMATCH", "Only the receiver can accept this call.");
        }
        this.clearMissedCallTimeout(input.callId);
        assertTransition(session.status, "accepted");
        const acceptedAt = this.now();
        const updated = await this.updateCall(input.callId, {
            status: "accepted",
            startedAt: acceptedAt,
        });
        await this.options.notifier.emitToUser(updated.callerId, STREAMMY_EVENTS.callAccept, {
            callId: updated.callId,
            acceptedBy: input.userId,
            startedAt: updated.startedAt,
            status: updated.status,
            ...(input.deviceId ? { deviceId: input.deviceId } : {}),
        });
        this.events.emit("call.updated", updated);
        return updated;
    }
    async declineCall(input) {
        const session = await this.requireCall(input.callId);
        if (session.receiverId !== input.userId) {
            throw new StreammyError("CALL_RECEIVER_MISMATCH", "Only the receiver can decline this call.");
        }
        this.clearMissedCallTimeout(input.callId);
        assertTransition(session.status, "declined");
        const updated = await this.updateCall(input.callId, {
            status: "declined",
            endedAt: this.now(),
            endedBy: input.userId,
        });
        await this.options.notifier.emitToUser(updated.callerId, STREAMMY_EVENTS.callDecline, {
            callId: updated.callId,
            declinedBy: input.userId,
            status: updated.status,
            ...(input.deviceId ? { deviceId: input.deviceId } : {}),
            ...(input.reason ? { reason: input.reason } : {}),
        });
        this.events.emit("call.updated", updated);
        return updated;
    }
    async cancelCall(input) {
        const session = await this.requireCall(input.callId);
        if (session.callerId !== input.userId) {
            throw new StreammyError("CALL_CALLER_MISMATCH", "Only the caller can cancel this call.");
        }
        this.clearMissedCallTimeout(input.callId);
        assertTransition(session.status, "cancelled");
        const updated = await this.updateCall(input.callId, {
            status: "cancelled",
            endedAt: this.now(),
            endedBy: input.userId,
        });
        await this.options.notifier.emitToUser(updated.receiverId, STREAMMY_EVENTS.callCancel, {
            callId: updated.callId,
            cancelledBy: input.userId,
            status: updated.status,
            ...(input.deviceId ? { deviceId: input.deviceId } : {}),
        });
        this.events.emit("call.updated", updated);
        return updated;
    }
    async endCall(input) {
        const session = await this.requireCall(input.callId);
        if (session.callerId !== input.userId && session.receiverId !== input.userId) {
            throw new StreammyError("CALL_PARTICIPANT_MISMATCH", "Only call participants can end the call.");
        }
        this.clearMissedCallTimeout(input.callId);
        assertTransition(session.status, "ended");
        const endedAt = this.now();
        const duration = session.startedAt
            ? Math.max(0, Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000))
            : undefined;
        const updated = await this.updateCall(input.callId, {
            status: "ended",
            endedAt,
            endedBy: input.userId,
            ...(duration !== undefined ? { duration } : {}),
        });
        const counterpartId = updated.callerId === input.userId ? updated.receiverId : updated.callerId;
        await this.options.notifier.emitToUser(counterpartId, STREAMMY_EVENTS.callEnd, {
            callId: updated.callId,
            endedBy: input.userId,
            status: updated.status,
            endedAt: updated.endedAt,
            duration: updated.duration,
            ...(input.deviceId ? { deviceId: input.deviceId } : {}),
        });
        this.events.emit("call.ended", updated);
        return updated;
    }
    async markCallMissed(callId) {
        const session = await this.requireCall(callId);
        if (session.status !== "ringing" && session.status !== "initiated") {
            return session;
        }
        this.clearMissedCallTimeout(callId);
        const endedAt = this.now();
        const updated = await this.updateCall(callId, {
            status: "missed",
            endedAt,
            endedBy: "system:ring-timeout",
            duration: 0,
        });
        await this.options.notifier.emitToUser(updated.callerId, STREAMMY_EVENTS.callEnd, {
            callId: updated.callId,
            endedBy: "system:ring-timeout",
            status: updated.status,
            endedAt: updated.endedAt,
            duration: 0,
            reason: "ring_timeout",
        });
        await this.options.notifier.emitToUser(updated.receiverId, STREAMMY_EVENTS.callEnd, {
            callId: updated.callId,
            endedBy: "system:ring-timeout",
            status: updated.status,
            endedAt: updated.endedAt,
            duration: 0,
            reason: "ring_timeout",
        });
        this.events.emit("call.updated", updated);
        this.events.emit("call.ended", updated);
        return updated;
    }
    async relayOffer(input) {
        await this.requireParticipant(input.callId, input.fromUserId);
        await this.options.notifier.emitToUser(input.targetUserId, STREAMMY_EVENTS.callOffer, {
            callId: input.callId,
            fromUserId: input.fromUserId,
            payload: input.payload,
        });
    }
    async relayAnswer(input) {
        await this.requireParticipant(input.callId, input.fromUserId);
        const session = await this.requireCall(input.callId);
        const currentStatus = session.status;
        if (currentStatus === "accepted") {
            const updated = await this.updateCall(input.callId, {
                status: "ongoing",
            });
            this.events.emit("call.updated", updated);
        }
        await this.options.notifier.emitToUser(input.targetUserId, STREAMMY_EVENTS.callAnswer, {
            callId: input.callId,
            fromUserId: input.fromUserId,
            payload: input.payload,
        });
    }
    async relayIceCandidate(input) {
        await this.requireParticipant(input.callId, input.fromUserId);
        await this.options.notifier.emitToUser(input.targetUserId, STREAMMY_EVENTS.callIceCandidate, {
            callId: input.callId,
            fromUserId: input.fromUserId,
            payload: input.payload,
        });
    }
    async requireCall(callId) {
        const session = await this.options.sessions.findByCallId(callId);
        if (!session) {
            throw new StreammyError("CALL_NOT_FOUND", `No call found for id ${callId}.`);
        }
        return session;
    }
    async updateCall(callId, update) {
        const session = await this.options.sessions.update(callId, update);
        if (!session) {
            throw new StreammyError("CALL_UPDATE_FAILED", `Unable to update call ${callId}.`);
        }
        return session;
    }
    async requireParticipant(callId, userId) {
        const session = await this.requireCall(callId);
        if (session.callerId !== userId && session.receiverId !== userId) {
            throw new StreammyError("CALL_PARTICIPANT_MISMATCH", "Only participants of the call can exchange signaling messages.");
        }
    }
    async syncPresence(userId, metadata) {
        const activeConnections = await this.options.connections.countByUserId(userId);
        const presence = await this.options.presence.upsert({
            userId,
            status: activeConnections > 0 ? "online" : "offline",
            lastSeenAt: this.now(),
            activeConnections,
            ...(metadata ? { metadata } : {}),
        });
        await this.options.notifier.emitToUser(userId, STREAMMY_EVENTS.presenceUpdate, presence);
        this.events.emit("presence.updated", presence);
        return presence;
    }
    scheduleMissedCallTimeout(callId) {
        this.clearMissedCallTimeout(callId);
        const handle = this.scheduler.setTimeout(() => {
            void this.markCallMissed(callId).catch(() => { });
        }, this.ringingTimeoutMs);
        this.ringingTimers.set(callId, handle);
    }
    clearMissedCallTimeout(callId) {
        const handle = this.ringingTimers.get(callId);
        if (!handle) {
            return;
        }
        this.scheduler.clearTimeout(handle);
        this.ringingTimers.delete(callId);
    }
}
export const createStreammyService = (options) => {
    return new DefaultStreammyService(options);
};
//# sourceMappingURL=streammy-service.js.map