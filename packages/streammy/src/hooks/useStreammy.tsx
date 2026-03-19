import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type { CallStatus, CallType } from "@streammy/core";
import { createStreammyClient, type StreammyClient } from "../client.js";
import type { StreammyActiveCall, StreammyClientOptions } from "../types.js";

interface StreammyContextValue {
  client: StreammyClient;
  activeCall: StreammyActiveCall | null;
  callStatus: CallStatus | "idle";
  connected: boolean;
  reconnecting: boolean;
  initiateCall(receiverId: string, callType: CallType, metadata?: Record<string, unknown>): void;
  acceptCall(callId?: string): void;
  declineCall(callId?: string, reason?: string): void;
  cancelCall(callId?: string): void;
  endCall(callId?: string): void;
  clearActiveCall(): void;
}

const StreammyContext = createContext<StreammyContextValue | null>(null);

export const StreammyProvider = ({
  options,
  children,
}: PropsWithChildren<{ options: StreammyClientOptions }>) => {
  const clientRef = useRef<StreammyClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = createStreammyClient(options);
  }

  const client = clientRef.current;
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [activeCall, setActiveCall] = useState<StreammyActiveCall | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus | "idle">("idle");

  useEffect(() => {
    const unsubscribers = [
      client.on("connected", () => {
        setConnected(true);
        setReconnecting(false);
      }),
      client.on("disconnected", () => {
        setConnected(false);
      }),
      client.on("reconnecting", () => {
        setConnected(false);
        setReconnecting(true);
      }),
      client.on("reconnected", () => {
        setConnected(true);
        setReconnecting(false);
      }),
      client.on("incomingCall", (call) => {
        setActiveCall({
          ...call,
          direction: "incoming",
        });
        setCallStatus(call.status);
      }),
      client.on("callInitiated", (call) => {
        setActiveCall({
          callId: call.callId,
          callerId: call.callerId,
          receiverId: call.receiverId,
          callType: call.callType,
          status: call.status,
          direction: call.callerId === options.userId ? "outgoing" : "incoming",
          ...(call.metadata ? { metadata: call.metadata } : {}),
        });
        setCallStatus(call.status);
      }),
      client.on("callAccepted", (payload) => {
        setActiveCall((current) =>
          current && current.callId === payload.callId
            ? {
                ...current,
                status: payload.status,
              }
            : current,
        );
        setCallStatus(payload.status);
      }),
      client.on("callDeclined", (payload) => {
        setActiveCall((current) =>
          current && current.callId === payload.callId
            ? {
                ...current,
                status: payload.status,
              }
            : current,
        );
        setCallStatus(payload.status);
      }),
      client.on("callCancelled", (payload) => {
        setActiveCall((current) =>
          current && current.callId === payload.callId
            ? {
                ...current,
                status: payload.status,
              }
            : current,
        );
        setCallStatus(payload.status);
      }),
      client.on("callEnded", (payload) => {
        setActiveCall((current) =>
          current && current.callId === payload.callId
            ? {
                ...current,
                status: payload.status,
              }
            : current,
        );
        setCallStatus(payload.status);
      }),
    ];

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, [client, options.userId]);

  const value = useMemo<StreammyContextValue>(
    () => ({
      client,
      connected,
      reconnecting,
      activeCall,
      callStatus,
      initiateCall(receiverId, callType, metadata): void {
        client.initiateCall(receiverId, callType, metadata);
        setActiveCall({
          callId: `pending-${Date.now()}`,
          callerId: options.userId,
          receiverId,
          callType,
          status: "initiated",
          direction: "outgoing",
          ...(metadata ? { metadata } : {}),
        });
        setCallStatus("initiated");
      },
      acceptCall(callId): void {
        const resolvedCallId = callId ?? activeCall?.callId;
        if (!resolvedCallId) {
          return;
        }

        client.acceptCall(resolvedCallId);
        setActiveCall((current) =>
          current && current.callId === resolvedCallId
            ? {
                ...current,
                status: "accepted",
              }
            : current,
        );
        setCallStatus("accepted");
      },
      declineCall(callId, reason): void {
        const resolvedCallId = callId ?? activeCall?.callId;
        if (!resolvedCallId) {
          return;
        }

        client.declineCall(resolvedCallId, reason);
        setActiveCall((current) =>
          current && current.callId === resolvedCallId
            ? {
                ...current,
                status: "declined",
              }
            : current,
        );
        setCallStatus("declined");
      },
      cancelCall(callId): void {
        const resolvedCallId = callId ?? activeCall?.callId;
        if (!resolvedCallId) {
          return;
        }

        client.cancelCall(resolvedCallId);
        setActiveCall((current) =>
          current && current.callId === resolvedCallId
            ? {
                ...current,
                status: "cancelled",
              }
            : current,
        );
        setCallStatus("cancelled");
      },
      endCall(callId): void {
        const resolvedCallId = callId ?? activeCall?.callId;
        if (!resolvedCallId) {
          return;
        }

        client.endCall(resolvedCallId);
        setActiveCall((current) =>
          current && current.callId === resolvedCallId
            ? {
                ...current,
                status: "ended",
              }
            : current,
        );
        setCallStatus("ended");
      },
      clearActiveCall(): void {
        setActiveCall(null);
        setCallStatus("idle");
      },
    }),
    [activeCall, callStatus, client, connected, options.userId, reconnecting],
  );

  return <StreammyContext.Provider value={value}>{children}</StreammyContext.Provider>;
};

export const useStreammy = (): StreammyContextValue => {
  const context = useContext(StreammyContext);
  if (!context) {
    throw new Error("useStreammy must be used inside StreammyProvider.");
  }

  return context;
};
