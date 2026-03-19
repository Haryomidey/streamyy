import type { CallSessionRecord, CallType, PresenceRecord } from "@streamyy/core";
import type { ReactNode } from "react";

export interface StreamyyClientOptions {
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

export interface StreamyyIncomingCall {
  callId: string;
  callerId: string;
  receiverId: string;
  callType: CallType;
  status: CallSessionRecord["status"];
  metadata?: Record<string, unknown>;
}

export interface StreamyyCallAccepted {
  callId: string;
  acceptedBy: string;
  deviceId?: string;
  startedAt?: Date | string;
  status: CallSessionRecord["status"];
}

export interface StreamyyCallEnded {
  callId: string;
  endedBy: string;
  deviceId?: string;
  status: CallSessionRecord["status"];
  endedAt?: Date | string;
  duration?: number;
  reason?: string;
}

export interface StreamyySimpleCallEvent {
  callId: string;
  deviceId?: string;
  status: CallSessionRecord["status"];
  reason?: string;
}

export interface StreamyySignalEvent {
  callId: string;
  fromUserId: string;
  payload: Record<string, unknown>;
}

export interface StreamyyClientEvents {
  connected: void;
  disconnected: void;
  reconnecting: { attempt: number };
  reconnected: void;
  incomingCall: StreamyyIncomingCall;
  callInitiated: CallSessionRecord;
  callAccepted: StreamyyCallAccepted;
  callDeclined: StreamyySimpleCallEvent;
  callCancelled: StreamyySimpleCallEvent;
  callEnded: StreamyyCallEnded;
  offer: StreamyySignalEvent;
  answer: StreamyySignalEvent;
  iceCandidate: StreamyySignalEvent;
  presenceUpdated: PresenceRecord;
}

export interface CallControlsState {
  muted: boolean;
  videoEnabled: boolean;
}

export type StreamyyCallDirection = "incoming" | "outgoing";

export interface StreamyyActiveCall {
  callId: string;
  callerId: string;
  receiverId: string;
  callType: CallType;
  status: CallSessionRecord["status"];
  direction: StreamyyCallDirection;
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

export type StreamyyRingtoneSource =
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

export interface StreamyyRingtoneSet {
  incoming?: StreamyyRingtoneSource;
  outgoing?: StreamyyRingtoneSource;
}

export interface StreamyyCallMediaState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  muted: boolean;
  videoEnabled: boolean;
  hasLocalAudio: boolean;
  hasLocalVideo: boolean;
  hasRemoteVideo: boolean;
}

export interface StreamyyIncomingCallRenderProps {
  call: StreamyyActiveCall;
  connected: boolean;
  reconnecting: boolean;
  accept(): Promise<void>;
  decline(reason?: string): Promise<void>;
}

export interface StreamyyCallInterfaceRenderProps {
  activeCall: StreamyyActiveCall;
  callStatus: CallSessionRecord["status"] | "idle";
  connected: boolean;
  reconnecting: boolean;
  media: StreamyyCallMediaState;
  clear(): void;
  cancel(): Promise<void>;
  end(): Promise<void>;
  toggleMute(nextMuted?: boolean): void;
  toggleVideo(nextEnabled?: boolean): void;
}

export type StreamyyIncomingCallRenderer = (
  props: StreamyyIncomingCallRenderProps,
) => ReactNode;

export type StreamyyCallInterfaceRenderer = (
  props: StreamyyCallInterfaceRenderProps,
) => ReactNode;
