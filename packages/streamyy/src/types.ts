import type { CallSessionRecord, CallType, PresenceRecord } from "@streamyy/core";

export interface StreammyClientOptions {
  url: string;
  token?: string;
  userId: string;
  deviceId?: string;
  metadata?: Record<string, unknown>;
  autoConnect?: boolean;
  lowBandwidthMode?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelayMs?: number;
  reconnectionDelayMaxMs?: number;
  connectionTimeoutMs?: number;
}

export interface StreammyIncomingCall {
  callId: string;
  callerId: string;
  receiverId: string;
  callType: CallType;
  status: CallSessionRecord["status"];
  metadata?: Record<string, unknown>;
}

export interface StreammyCallAccepted {
  callId: string;
  acceptedBy: string;
  deviceId?: string;
  startedAt?: Date | string;
  status: CallSessionRecord["status"];
}

export interface StreammyCallEnded {
  callId: string;
  endedBy: string;
  deviceId?: string;
  status: CallSessionRecord["status"];
  endedAt?: Date | string;
  duration?: number;
  reason?: string;
}

export interface StreammySimpleCallEvent {
  callId: string;
  deviceId?: string;
  status: CallSessionRecord["status"];
  reason?: string;
}

export interface StreammySignalEvent {
  callId: string;
  fromUserId: string;
  payload: Record<string, unknown>;
}

export interface StreammyClientEvents {
  connected: void;
  disconnected: void;
  reconnecting: { attempt: number };
  reconnected: void;
  incomingCall: StreammyIncomingCall;
  callInitiated: CallSessionRecord;
  callAccepted: StreammyCallAccepted;
  callDeclined: StreammySimpleCallEvent;
  callCancelled: StreammySimpleCallEvent;
  callEnded: StreammyCallEnded;
  offer: StreammySignalEvent;
  answer: StreammySignalEvent;
  iceCandidate: StreammySignalEvent;
  presenceUpdated: PresenceRecord;
}

export interface CallControlsState {
  muted: boolean;
  videoEnabled: boolean;
}

export type StreammyCallDirection = "incoming" | "outgoing";

export interface StreammyActiveCall {
  callId: string;
  callerId: string;
  receiverId: string;
  callType: CallType;
  status: CallSessionRecord["status"];
  direction: StreammyCallDirection;
  metadata?: Record<string, unknown>;
}

export interface TonePatternStep {
  frequency: number;
  durationMs: number;
  gain?: number;
}

export interface TonePattern {
  steps: TonePatternStep[];
  pauseMs?: number;
}

export type StreammyRingtoneSource =
  | {
      kind: "url";
      src: string;
      volume?: number;
    }
  | {
      kind: "pattern";
      pattern: TonePattern;
      volume?: number;
    };

export interface StreammyRingtoneSet {
  incoming?: StreammyRingtoneSource;
  outgoing?: StreammyRingtoneSource;
}
