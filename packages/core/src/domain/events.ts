import type { CallSessionRecord, PresenceRecord, SocketConnectionRecord } from "./call.js";

export const STREAMMY_EVENTS = {
  callInitiate: "call:initiate",
  callIncoming: "call:incoming",
  callAccept: "call:accept",
  callDecline: "call:decline",
  callCancel: "call:cancel",
  callEnd: "call:end",
  callOffer: "call:offer",
  callAnswer: "call:answer",
  callIceCandidate: "call:ice-candidate",
  presenceUpdate: "presence:update",
} as const;

export type StreammySocketEvent = (typeof STREAMMY_EVENTS)[keyof typeof STREAMMY_EVENTS];

export interface StreammyCoreEvents {
  "call.created": CallSessionRecord;
  "call.updated": CallSessionRecord;
  "call.ended": CallSessionRecord;
  "presence.updated": PresenceRecord;
  "connection.connected": SocketConnectionRecord;
  "connection.disconnected": SocketConnectionRecord;
}
