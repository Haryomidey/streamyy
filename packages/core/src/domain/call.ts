export const STREAMMY_CALL_STATUSES = [
  "initiated",
  "ringing",
  "accepted",
  "declined",
  "missed",
  "ongoing",
  "ended",
  "cancelled",
  "failed",
] as const;

export type CallStatus = (typeof STREAMMY_CALL_STATUSES)[number];

export const STREAMMY_CALL_TYPES = ["audio", "video"] as const;

export type CallType = (typeof STREAMMY_CALL_TYPES)[number];

export interface StreammyPeer {
  userId: string;
  deviceId?: string;
}

export interface CallSessionRecord {
  callId: string;
  callerId: string;
  receiverId: string;
  callType: CallType;
  status: CallStatus;
  startedAt?: Date;
  endedAt?: Date;
  duration?: number;
  endedBy?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InitiateCallInput {
  callId?: string;
  callerId: string;
  receiverId: string;
  callType: CallType;
  metadata?: Record<string, unknown>;
}

export interface AcceptCallInput extends StreammyPeer {
  callId: string;
}

export interface DeclineCallInput extends StreammyPeer {
  callId: string;
  reason?: string;
}

export interface CancelCallInput extends StreammyPeer {
  callId: string;
}

export interface EndCallInput extends StreammyPeer {
  callId: string;
}

export interface SignalingEnvelope<TPayload = unknown> extends StreammyPeer {
  callId: string;
  payload: TPayload;
}

export interface IceCandidatePayload {
  candidate: RTCIceCandidateInit | Record<string, unknown>;
}

export interface PresenceRecord {
  userId: string;
  status: "online" | "offline" | "busy" | "away";
  lastSeenAt: Date;
  metadata?: Record<string, unknown>;
  activeConnections: number;
}

export interface SocketConnectionRecord {
  connectionId: string;
  userId: string;
  deviceId: string;
  connectedAt: Date;
  lastSeenAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ConnectionContext {
  connectionId: string;
  userId: string;
  deviceId: string;
  metadata?: Record<string, unknown>;
}
