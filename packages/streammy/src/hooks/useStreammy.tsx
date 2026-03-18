import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type { CallStatus } from "@streammy/core";
import { createStreammyClient, type StreammyClient } from "../client.js";
import type { StreammyClientOptions, StreammyIncomingCall } from "../types.js";

interface StreammyContextValue {
  client: StreammyClient;
  activeCall: StreammyIncomingCall | null;
  callStatus: CallStatus | "idle";
  connected: boolean;
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
  const [activeCall, setActiveCall] = useState<StreammyIncomingCall | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus | "idle">("idle");

  useEffect(() => {
    const unsubscribers = [
      client.on("connected", () => setConnected(true)),
      client.on("disconnected", () => setConnected(false)),
      client.on("incomingCall", (call) => {
        setActiveCall(call);
        setCallStatus(call.status);
      }),
      client.on("callInitiated", (call) => setCallStatus(call.status)),
      client.on("callAccepted", () => setCallStatus("ongoing")),
      client.on("callDeclined", () => setCallStatus("declined")),
      client.on("callCancelled", () => setCallStatus("cancelled")),
      client.on("callEnded", () => setCallStatus("ended")),
    ];

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }, [client]);

  const value = useMemo<StreammyContextValue>(
    () => ({
      client,
      connected,
      activeCall,
      callStatus,
      clearActiveCall(): void {
        setActiveCall(null);
        setCallStatus("idle");
      },
    }),
    [activeCall, callStatus, client, connected],
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
