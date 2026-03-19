import {
  type CallSessionRecord,
  type ConnectionContext,
  type PresenceRecord,
  type SocketConnectionRecord,
} from "../domain/call.js";
import { StreammyError } from "../domain/errors.js";
import { STREAMMY_EVENTS } from "../domain/events.js";
import type { StreammyCoreOptions, StreammyService } from "../domain/interfaces.js";
import { createEventBus } from "../events.js";
import { assertTransition } from "./state-machine.js";

const randomId = (): string => {
  return `call_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
};

export class DefaultStreammyService implements StreammyService {
  private readonly events;
  private readonly now;
  private readonly idFactory;
  private readonly ringingTimeoutMs;
  private readonly scheduler: NonNullable<StreammyCoreOptions["scheduler"]>;
  private readonly ringingTimers = new Map<string, unknown>();

  public constructor(private readonly options: StreammyCoreOptions) {
    this.events = options.events ?? createEventBus();
    this.now = options.now ?? (() => new Date());
    this.idFactory = options.idFactory ?? randomId;
    this.ringingTimeoutMs = options.ringingTimeoutMs ?? 60_000;
    this.scheduler = options.scheduler ?? {
      setTimeout(handler, timeoutMs) {
        return globalThis.setTimeout(handler, timeoutMs);
      },
      clearTimeout(handle) {
        globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>);
      },
    };
  }

  public async connect(context: ConnectionContext): Promise<SocketConnectionRecord> {
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

  public async disconnect(connectionId: string): Promise<void> {
    const connection = await this.options.connections.deleteByConnectionId(connectionId);
    if (!connection) {
      return;
    }

    await this.options.notifier.leaveUserRoom?.(connection.connectionId, connection.userId);
    await this.syncPresence(connection.userId, connection.metadata);
    this.events.emit("connection.disconnected", connection);
  }

  public async initiateCall(input: {
    callerId: string;
    receiverId: string;
    callType: CallSessionRecord["callType"];
    metadata?: Record<string, unknown>;
  }): Promise<CallSessionRecord> {
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

  public async acceptCall(input: {
    callId: string;
    userId: string;
    deviceId?: string;
  }): Promise<CallSessionRecord> {
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

  public async declineCall(input: {
    callId: string;
    userId: string;
    deviceId?: string;
    reason?: string;
  }): Promise<CallSessionRecord> {
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

  public async cancelCall(input: {
    callId: string;
    userId: string;
    deviceId?: string;
  }): Promise<CallSessionRecord> {
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

  public async endCall(input: {
    callId: string;
    userId: string;
    deviceId?: string;
  }): Promise<CallSessionRecord> {
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

  public async markCallMissed(callId: string): Promise<CallSessionRecord> {
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

  public async relayOffer(input: {
    callId: string;
    fromUserId: string;
    targetUserId: string;
    payload: unknown;
  }): Promise<void> {
    await this.requireParticipant(input.callId, input.fromUserId);
    await this.options.notifier.emitToUser(input.targetUserId, STREAMMY_EVENTS.callOffer, {
      callId: input.callId,
      fromUserId: input.fromUserId,
      payload: input.payload,
    });
  }

  public async relayAnswer(input: {
    callId: string;
    fromUserId: string;
    targetUserId: string;
    payload: unknown;
  }): Promise<void> {
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

  public async relayIceCandidate(input: {
    callId: string;
    fromUserId: string;
    targetUserId: string;
    payload: unknown;
  }): Promise<void> {
    await this.requireParticipant(input.callId, input.fromUserId);
    await this.options.notifier.emitToUser(input.targetUserId, STREAMMY_EVENTS.callIceCandidate, {
      callId: input.callId,
      fromUserId: input.fromUserId,
      payload: input.payload,
    });
  }

  private async requireCall(callId: string): Promise<CallSessionRecord> {
    const session = await this.options.sessions.findByCallId(callId);
    if (!session) {
      throw new StreammyError("CALL_NOT_FOUND", `No call found for id ${callId}.`);
    }

    return session;
  }

  private async updateCall(
    callId: string,
    update: Partial<CallSessionRecord>,
  ): Promise<CallSessionRecord> {
    const session = await this.options.sessions.update(callId, update);
    if (!session) {
      throw new StreammyError("CALL_UPDATE_FAILED", `Unable to update call ${callId}.`);
    }

    return session;
  }

  private async requireParticipant(callId: string, userId: string): Promise<void> {
    const session = await this.requireCall(callId);
    if (session.callerId !== userId && session.receiverId !== userId) {
      throw new StreammyError(
        "CALL_PARTICIPANT_MISMATCH",
        "Only participants of the call can exchange signaling messages.",
      );
    }
  }

  private async syncPresence(
    userId: string,
    metadata: Record<string, unknown> | undefined,
  ): Promise<PresenceRecord> {
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

  private scheduleMissedCallTimeout(callId: string): void {
    this.clearMissedCallTimeout(callId);
    const handle = this.scheduler.setTimeout(() => {
      void this.markCallMissed(callId).catch(() => {});
    }, this.ringingTimeoutMs);
    this.ringingTimers.set(callId, handle);
  }

  private clearMissedCallTimeout(callId: string): void {
    const handle = this.ringingTimers.get(callId);
    if (!handle) {
      return;
    }

    this.scheduler.clearTimeout(handle);
    this.ringingTimers.delete(callId);
  }
}

export const createStreammyService = (options: StreammyCoreOptions): StreammyService => {
  return new DefaultStreammyService(options);
};
