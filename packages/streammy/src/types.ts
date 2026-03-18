import type { CallSessionRecord, CallType, PresenceRecord } from "@streammy/core";

export interface StreammyClientOptions {
  url: string;
  token?: string;
  userId: string;
  deviceId?: string;
  metadata?: Record<string, unknown>;
  autoConnect?: boolean;
}

export interface StreammyIncomingCall {
  callId: string;
  callerId: string;
  receiverId: string;
  callType: CallType;
  status: CallSessionRecord["status"];
  metadata?: Record<string, unknown>;
}

export interface StreammyClientEvents {
  connected: void;
  disconnected: void;
  incomingCall: StreammyIncomingCall;
  callInitiated: CallSessionRecord;
  callAccepted: Record<string, unknown>;
  callDeclined: Record<string, unknown>;
  callCancelled: Record<string, unknown>;
  callEnded: Record<string, unknown>;
  offer: Record<string, unknown>;
  answer: Record<string, unknown>;
  iceCandidate: Record<string, unknown>;
  presenceUpdated: PresenceRecord;
}

export interface CallControlsState {
  muted: boolean;
  videoEnabled: boolean;
}
