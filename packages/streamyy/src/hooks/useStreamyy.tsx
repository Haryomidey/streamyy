import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import type { CallStatus, CallType } from "@streamyy/core";
import { createStreamyyClient, type StreamyyClient } from "../client.js";
import type {
  StreamyyActiveCall,
  StreamyyCallMediaState,
  StreamyyClientOptions,
} from "../types.js";
import { getUserMedia, toggleStreamTracks } from "../webrtc/media.js";
import { StreamyyPeerSession } from "../webrtc/peer-session.js";

interface StreamyyContextValue {
  client: StreamyyClient;
  activeCall: StreamyyActiveCall | null;
  callStatus: CallStatus | "idle";
  connected: boolean;
  reconnecting: boolean;
  media: StreamyyCallMediaState;
  initiateCall(
    receiverId: string,
    callType: CallType,
    metadata?: Record<string, unknown>,
  ): Promise<void>;
  startAudioCall(receiverId: string, metadata?: Record<string, unknown>): Promise<void>;
  startVideoCall(receiverId: string, metadata?: Record<string, unknown>): Promise<void>;
  acceptCall(callId?: string): Promise<void>;
  declineCall(callId?: string, reason?: string): Promise<void>;
  cancelCall(callId?: string): Promise<void>;
  endCall(callId?: string): Promise<void>;
  toggleMute(nextMuted?: boolean): void;
  toggleVideo(nextEnabled?: boolean): void;
  clearActiveCall(): void;
}

const StreamyyContext = createContext<StreamyyContextValue | null>(null);
const ACTIVE_CALL_STORAGE_KEY = "streamyy:active-call";

const createEmptyRemoteStream = (): MediaStream => new MediaStream();

const stopStream = (stream: MediaStream | null): void => {
  if (!stream) {
    return;
  }

  for (const track of stream.getTracks()) {
    track.stop();
  }
};

const canRestoreCall = (
  call: StreamyyActiveCall | null,
): call is StreamyyActiveCall => {
  if (!call) {
    return false;
  }

  return (
    call.status === "accepted" ||
    call.status === "ongoing" ||
    call.status === "initiated" ||
    call.status === "ringing"
  );
};

export const StreamyyProvider = ({
  options,
  children,
}: PropsWithChildren<{ options: StreamyyClientOptions }>) => {
  const clientRef = useRef<StreamyyClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = createStreamyyClient(options);
  }

  const client = clientRef.current;
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [activeCall, setActiveCall] = useState<StreamyyActiveCall | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus | "idle">("idle");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);

  const activeCallRef = useRef<StreamyyActiveCall | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerSessionRef = useRef<StreamyyPeerSession | null>(null);
  const attachedLocalStreamRef = useRef(false);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const shouldResumeCallRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.sessionStorage.getItem(ACTIVE_CALL_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const restored = JSON.parse(raw) as StreamyyActiveCall;
      if (!canRestoreCall(restored)) {
        window.sessionStorage.removeItem(ACTIVE_CALL_STORAGE_KEY);
        return;
      }

      updateCallState(restored);
      setCallStatus(restored.status);
      setVideoEnabled(restored.callType === "video");
      shouldResumeCallRef.current = true;
    } catch {
      window.sessionStorage.removeItem(ACTIVE_CALL_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  useEffect(() => {
    remoteStreamRef.current = remoteStream;
  }, [remoteStream]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (canRestoreCall(activeCall)) {
      window.sessionStorage.setItem(ACTIVE_CALL_STORAGE_KEY, JSON.stringify(activeCall));
      return;
    }

    window.sessionStorage.removeItem(ACTIVE_CALL_STORAGE_KEY);
  }, [activeCall]);

  const teardownPeerSession = (): void => {
    peerSessionRef.current?.close();
    peerSessionRef.current = null;
    attachedLocalStreamRef.current = false;
    pendingOfferRef.current = null;
  };

  const releaseMedia = (): void => {
    stopStream(localStreamRef.current);
    stopStream(remoteStreamRef.current);
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setMuted(false);
    setVideoEnabled(false);
  };

  const resetCallArtifacts = (): void => {
    teardownPeerSession();
    releaseMedia();
  };

  const updateCallState = (
    updater:
      | StreamyyActiveCall
      | null
      | ((current: StreamyyActiveCall | null) => StreamyyActiveCall | null),
  ): void => {
    setActiveCall((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      activeCallRef.current = next;
      return next;
    });
  };

  const ensureLocalStream = async (callType: CallType): Promise<MediaStream> => {
    const needsVideo = callType === "video";
    const current = localStreamRef.current;
    const hasAudio = Boolean(current?.getAudioTracks().length);
    const hasVideo = Boolean(current?.getVideoTracks().length);

    if (current && hasAudio && (!needsVideo || hasVideo)) {
      toggleStreamTracks(current, "audio", !muted);
      if (hasVideo) {
        toggleStreamTracks(current, "video", videoEnabled || needsVideo);
      }
      return current;
    }

    stopStream(current ?? null);
    const nextStream = await getUserMedia({
      audio: true,
      video: needsVideo,
    });

    localStreamRef.current = nextStream;
    setLocalStream(nextStream);
    setMuted(false);
    setVideoEnabled(needsVideo);
    toggleStreamTracks(nextStream, "audio", true);
    toggleStreamTracks(nextStream, "video", needsVideo);
    return nextStream;
  };

  const ensurePeerSession = (call: StreamyyActiveCall): StreamyyPeerSession => {
    const existing = peerSessionRef.current;
    if (existing) {
      return existing;
    }

    const remoteUserId = call.direction === "incoming" ? call.callerId : call.receiverId;
    const session = new StreamyyPeerSession({
      client,
      callId: call.callId,
      remoteUserId,
    });

    session.connection.ontrack = (event) => {
      const streamed = event.streams[0];
      if (streamed) {
        remoteStreamRef.current = streamed;
        setRemoteStream(streamed);
        return;
      }

      const fallback = remoteStreamRef.current ?? createEmptyRemoteStream();
      fallback.addTrack(event.track);
      remoteStreamRef.current = fallback;
      setRemoteStream(fallback);
    };

    session.connection.onconnectionstatechange = () => {
      if (session.connection.connectionState === "connected") {
        updateCallState((current) =>
          current && current.callId === call.callId
            ? {
                ...current,
                status: "ongoing",
              }
            : current,
        );
        setCallStatus("ongoing");
      }
    };

    peerSessionRef.current = session;
    return session;
  };

  const attachLocalStream = (session: StreamyyPeerSession, stream: MediaStream): void => {
    if (attachedLocalStreamRef.current) {
      return;
    }

    session.attachLocalStream(stream);
    attachedLocalStreamRef.current = true;
  };

  const applyPendingOffer = async (call: StreamyyActiveCall): Promise<void> => {
    const offer = pendingOfferRef.current;
    if (!offer) {
      return;
    }

    pendingOfferRef.current = null;
    const session = ensurePeerSession(call);
    const stream = localStreamRef.current ?? (await ensureLocalStream(call.callType));
    attachLocalStream(session, stream);
    await session.applyRemoteDescription(offer);
    const answer = await session.createAnswer();
    client.sendAnswer(call.callId, call.callerId, answer);
    updateCallState((current) =>
      current && current.callId === call.callId
        ? {
            ...current,
            status: "ongoing",
          }
        : current,
    );
    setCallStatus("ongoing");
  };

  const resumeActiveCall = async (call: StreamyyActiveCall): Promise<void> => {
    const resumableStatus = call.status === "accepted" || call.status === "ongoing";
    if (!resumableStatus) {
      return;
    }

    const stream = await ensureLocalStream(call.callType);
    const session = ensurePeerSession(call);
    attachLocalStream(session, stream);

    const offer = await session.createOffer();
    const remoteUserId = call.direction === "incoming" ? call.callerId : call.receiverId;
    client.sendOffer(call.callId, remoteUserId, offer);
  };

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
        resetCallArtifacts();
        updateCallState({
          ...call,
          direction: "incoming",
        });
        setCallStatus(call.status);
      }),
      client.on("callInitiated", (call) => {
        updateCallState({
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
        updateCallState((current) =>
          current
            ? {
                ...current,
                callId:
                  current.direction === "outgoing" &&
                  (current.callId === payload.callId || current.callId.startsWith("pending-"))
                    ? payload.callId
                    : current.callId,
                status: payload.status,
              }
            : current,
        );
        setCallStatus(payload.status);

        const current = activeCallRef.current;
        if (
          !current ||
          current.direction !== "outgoing" ||
          (current.callId !== payload.callId && !current.callId.startsWith("pending-"))
        ) {
          return;
        }

        void (async () => {
          const liveCall =
            current.callId === payload.callId
              ? current
              : {
                  ...current,
                  callId: payload.callId,
                };
          const stream = await ensureLocalStream(liveCall.callType);
          const session = ensurePeerSession(liveCall);
          attachLocalStream(session, stream);
          const offer = await session.createOffer();
          client.sendOffer(payload.callId, liveCall.receiverId, offer);
        })();
      }),
      client.on("callDeclined", (payload) => {
        updateCallState((current) =>
          current && current.callId === payload.callId
            ? {
                ...current,
                status: payload.status,
              }
            : current,
        );
        setCallStatus(payload.status);
        resetCallArtifacts();
      }),
      client.on("callCancelled", (payload) => {
        updateCallState((current) =>
          current && current.callId === payload.callId
            ? {
                ...current,
                status: payload.status,
              }
            : current,
        );
        setCallStatus(payload.status);
        resetCallArtifacts();
      }),
      client.on("callEnded", (payload) => {
        updateCallState((current) =>
          current && current.callId === payload.callId
            ? {
                ...current,
                status: payload.status,
              }
            : current,
        );
        setCallStatus(payload.status);
        resetCallArtifacts();
      }),
      client.on("offer", (payload) => {
        const current = activeCallRef.current;
        if (!current || current.callId !== payload.callId) {
          return;
        }

        void (async () => {
          if (current.direction !== "incoming") {
            return;
          }

          if (current.status !== "accepted" && current.status !== "ongoing") {
            pendingOfferRef.current = payload.payload as unknown as RTCSessionDescriptionInit;
            return;
          }

          const session = ensurePeerSession(current);
          const stream = localStreamRef.current ?? (await ensureLocalStream(current.callType));
          attachLocalStream(session, stream);
          await session.applyRemoteDescription(payload.payload as unknown as RTCSessionDescriptionInit);
          const answer = await session.createAnswer();
          client.sendAnswer(current.callId, current.callerId, answer);
          updateCallState((call) =>
            call && call.callId === current.callId
              ? {
                  ...call,
                  status: "ongoing",
                }
              : call,
          );
          setCallStatus("ongoing");
        })();
      }),
      client.on("answer", (payload) => {
        const current = activeCallRef.current;
        if (!current || current.callId !== payload.callId) {
          return;
        }

        void (async () => {
          const session = ensurePeerSession(current);
          await session.applyRemoteDescription(payload.payload as unknown as RTCSessionDescriptionInit);
          updateCallState((call) =>
            call && call.callId === current.callId
              ? {
                  ...call,
                  status: "ongoing",
                }
              : call,
          );
          setCallStatus("ongoing");
        })();
      }),
      client.on("iceCandidate", (payload) => {
        const current = activeCallRef.current;
        if (!current || current.callId !== payload.callId) {
          return;
        }

        void ensurePeerSession(current).addIceCandidate(payload.payload as unknown as RTCIceCandidateInit);
      }),
    ];

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
      resetCallArtifacts();
    };
  }, [client, options.userId]);

  useEffect(() => {
    if (!connected || !shouldResumeCallRef.current) {
      return;
    }

    const current = activeCallRef.current;
    if (!current || !canRestoreCall(current)) {
      shouldResumeCallRef.current = false;
      return;
    }

    shouldResumeCallRef.current = false;
    void resumeActiveCall(current);
  }, [connected]);

  const media = useMemo<StreamyyCallMediaState>(
    () => ({
      localStream,
      remoteStream,
      muted,
      videoEnabled,
      hasLocalAudio: Boolean(localStream?.getAudioTracks().length),
      hasLocalVideo: Boolean(localStream?.getVideoTracks().length),
      hasRemoteVideo: Boolean(remoteStream?.getVideoTracks().length),
    }),
    [localStream, muted, remoteStream, videoEnabled],
  );

  const initiateCall = async (
    receiverId: string,
    callType: CallType,
    metadata?: Record<string, unknown>,
  ): Promise<void> => {
    const nextReceiverId = receiverId.trim();
    if (!nextReceiverId) {
      return;
    }

    await ensureLocalStream(callType);
    updateCallState({
      callId: `pending-${Date.now()}`,
      callerId: options.userId,
      receiverId: nextReceiverId,
      callType,
      status: "initiated",
      direction: "outgoing",
      ...(metadata ? { metadata } : {}),
    });
    setCallStatus("initiated");
    client.initiateCall(nextReceiverId, callType, metadata);
  };

  const acceptCall = async (callId?: string): Promise<void> => {
    const current = activeCallRef.current;
    const resolvedCallId = callId ?? current?.callId;
    if (!resolvedCallId || !current) {
      return;
    }

    const stream = await ensureLocalStream(current.callType);
    const session = ensurePeerSession(current);
    attachLocalStream(session, stream);
    client.acceptCall(resolvedCallId);
    updateCallState((call) =>
      call && call.callId === resolvedCallId
        ? {
            ...call,
            status: "accepted",
          }
        : call,
    );
    setCallStatus("accepted");
    await applyPendingOffer(current);
  };

  const declineCall = async (callId?: string, reason?: string): Promise<void> => {
    const resolvedCallId = callId ?? activeCallRef.current?.callId;
    if (!resolvedCallId) {
      return;
    }

    client.declineCall(resolvedCallId, reason);
    updateCallState((current) =>
      current && current.callId === resolvedCallId
        ? {
            ...current,
            status: "declined",
          }
        : current,
    );
    setCallStatus("declined");
    resetCallArtifacts();
  };

  const cancelCall = async (callId?: string): Promise<void> => {
    const resolvedCallId = callId ?? activeCallRef.current?.callId;
    if (!resolvedCallId) {
      return;
    }

    client.cancelCall(resolvedCallId);
    updateCallState((current) =>
      current && current.callId === resolvedCallId
        ? {
            ...current,
            status: "cancelled",
          }
        : current,
    );
    setCallStatus("cancelled");
    resetCallArtifacts();
  };

  const endCall = async (callId?: string): Promise<void> => {
    const resolvedCallId = callId ?? activeCallRef.current?.callId;
    if (!resolvedCallId) {
      return;
    }

    client.endCall(resolvedCallId);
    updateCallState((current) =>
      current && current.callId === resolvedCallId
        ? {
            ...current,
            status: "ended",
          }
        : current,
    );
    setCallStatus("ended");
    resetCallArtifacts();
  };

  const value = useMemo<StreamyyContextValue>(
    () => ({
      client,
      connected,
      reconnecting,
      activeCall,
      callStatus,
      media,
      initiateCall,
      async startAudioCall(receiverId, metadata): Promise<void> {
        await initiateCall(receiverId, "audio", metadata);
      },
      async startVideoCall(receiverId, metadata): Promise<void> {
        await initiateCall(receiverId, "video", metadata);
      },
      acceptCall,
      declineCall,
      cancelCall,
      endCall,
      toggleMute(nextMuted): void {
        const stream = localStreamRef.current;
        if (!stream) {
          return;
        }

        const shouldMute = nextMuted ?? !muted;
        toggleStreamTracks(stream, "audio", !shouldMute);
        setMuted(shouldMute);
      },
      toggleVideo(nextEnabled): void {
        const stream = localStreamRef.current;
        if (!stream || !stream.getVideoTracks().length) {
          return;
        }

        const shouldEnable = nextEnabled ?? !videoEnabled;
        toggleStreamTracks(stream, "video", shouldEnable);
        setVideoEnabled(shouldEnable);
      },
      clearActiveCall(): void {
        resetCallArtifacts();
        updateCallState(null);
        setCallStatus("idle");
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(ACTIVE_CALL_STORAGE_KEY);
        }
      },
    }),
    [activeCall, callStatus, client, connected, media, muted, reconnecting, videoEnabled],
  );

  return <StreamyyContext.Provider value={value}>{children}</StreamyyContext.Provider>;
};

export const useStreamyy = (): StreamyyContextValue => {
  const context = useContext(StreamyyContext);
  if (!context) {
    throw new Error("useStreamyy must be used inside StreamyyProvider.");
  }

  return context;
};
