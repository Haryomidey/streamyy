import type { CallSessionRecord, PresenceRecord, SocketConnectionRecord } from "./call.js";
export declare const STREAMMY_EVENTS: {
    readonly callInitiate: "call:initiate";
    readonly callIncoming: "call:incoming";
    readonly callAccept: "call:accept";
    readonly callDecline: "call:decline";
    readonly callCancel: "call:cancel";
    readonly callEnd: "call:end";
    readonly callOffer: "call:offer";
    readonly callAnswer: "call:answer";
    readonly callIceCandidate: "call:ice-candidate";
    readonly presenceUpdate: "presence:update";
};
export type StreammySocketEvent = (typeof STREAMMY_EVENTS)[keyof typeof STREAMMY_EVENTS];
export interface StreammyCoreEvents {
    "call.created": CallSessionRecord;
    "call.updated": CallSessionRecord;
    "call.ended": CallSessionRecord;
    "presence.updated": PresenceRecord;
    "connection.connected": SocketConnectionRecord;
    "connection.disconnected": SocketConnectionRecord;
}
//# sourceMappingURL=events.d.ts.map