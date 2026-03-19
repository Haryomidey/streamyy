import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CallControls } from "./CallControls.js";
import { IncomingCallCard } from "./IncomingCallCard.js";
import { VideoStage } from "./VideoStage.js";
import { useRingtone } from "../hooks/useRingtone.js";
import { useStreamyy } from "../hooks/useStreamyy.js";
import type {
  StreamyyActiveCall,
  StreamyyCallInterfaceRenderer,
  StreamyyIncomingCallRenderer,
  StreamyyRingtoneSet,
} from "../types.js";

type CallIconSet = {
  audio?: ReactNode;
  video?: ReactNode;
  mute?: ReactNode;
  unmute?: ReactNode;
  videoOn?: ReactNode;
  videoOff?: ReactNode;
  accept?: ReactNode;
  decline?: ReactNode;
  hangup?: ReactNode;
};

export interface StreamyyCallWidgetProps {
  defaultReceiverId?: string;
  defaultCallType?: "audio" | "video";
  title?: string;
  subtitle?: string;
  ringtones?: StreamyyRingtoneSet;
  renderIncomingCall?: StreamyyIncomingCallRenderer;
  renderCallInterface?: StreamyyCallInterfaceRenderer;
  resolveAvatarSrc?: (call: StreamyyActiveCall, role: "caller" | "receiver" | "remote") => string | undefined;
  icons?: CallIconSet;
}

const finishedStatuses = new Set(["ended", "declined", "cancelled", "missed", "failed"]);

const statusLabel: Record<string, string> = {
  idle: "Ready",
  initiated: "Calling...",
  ringing: "Ringing...",
  accepted: "Connecting...",
  ongoing: "Connected",
  declined: "Declined",
  cancelled: "Cancelled",
  ended: "Call ended",
  failed: "Call failed",
  missed: "Missed call",
};

const iconStyle: Record<string, unknown> = {
  width: "1.45rem",
  height: "1.45rem",
  display: "block",
};

const PhoneIcon = ({ crossed = false }: { crossed?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.35 1.77.68 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.25a2 2 0 0 1 2.11-.45c.83.33 1.7.56 2.6.68A2 2 0 0 1 22 16.92Z" />
    {crossed ? <path d="M4 4l16 16" /> : null}
  </svg>
);

const VideoIcon = ({ off = false }: { off?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
    <path d="M23 7l-7 5 7 5V7Z" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    {off ? <path d="M3 3l18 18" /> : null}
  </svg>
);

const MicIcon = ({ off = false }: { off?: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
    <path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <path d="M12 19v4" />
    <path d="M8 23h8" />
    {off ? <path d="M4 4l16 16" /> : null}
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const defaultIcons: Required<CallIconSet> = {
  audio: <PhoneIcon />,
  video: <VideoIcon />,
  mute: <MicIcon />,
  unmute: <MicIcon off />,
  videoOn: <VideoIcon />,
  videoOff: <VideoIcon off />,
  accept: <CheckIcon />,
  decline: <XIcon />,
  hangup: <PhoneIcon crossed />,
};

const avatarFallback = (value: string): string => value.slice(0, 2).toUpperCase() || "?";

const getRemoteId = (call: StreamyyActiveCall): string =>
  call.direction === "incoming" ? call.callerId : call.receiverId;

const readAvatarFromMetadata = (
  call: StreamyyActiveCall,
  role: "caller" | "receiver" | "remote",
): string | undefined => {
  const metadata = call.metadata;
  if (!metadata) {
    return undefined;
  }

  const remoteKey = call.direction === "incoming" ? "callerAvatarSrc" : "receiverAvatarSrc";
  const key =
    role === "remote"
      ? remoteKey
      : role === "caller"
        ? "callerAvatarSrc"
        : "receiverAvatarSrc";
  const candidate = metadata[key];
  return typeof candidate === "string" ? candidate : undefined;
};

const formatDuration = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const DefaultAvatar = ({
  label,
  src,
  size,
}: {
  label: string;
  src: string | undefined;
  size: string;
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "999px",
      padding: "0.28rem",
      background: "#00c781",
      display: "grid",
      placeItems: "center",
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "999px",
        background: "#282a2f",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        color: "white",
        fontWeight: 700,
        fontSize: "1.35rem",
      }}
    >
      {src ? (
        <img src={src} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        avatarFallback(label)
      )}
    </div>
  </div>
);

const RemoteAudio = ({ stream }: { stream: MediaStream | null }) => {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={ref} autoPlay playsInline />;
};

export const StreamyyCallWidget = ({
  defaultReceiverId = "",
  defaultCallType = "video",
  title = "Streamyy Calling",
  subtitle = "Ready-made calling UI",
  ringtones,
  renderIncomingCall,
  renderCallInterface,
  resolveAvatarSrc,
  icons,
}: StreamyyCallWidgetProps) => {
  const {
    activeCall,
    callStatus,
    media,
    startAudioCall,
    startVideoCall,
    acceptCall,
    declineCall,
    cancelCall,
    endCall,
    toggleMute,
    toggleVideo,
    clearActiveCall,
    connected,
    reconnecting,
  } = useStreamyy();
  const [selectedType, setSelectedType] = useState<"audio" | "video">(defaultCallType);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const callTimerRef = useRef<number | null>(null);
  const timedCallIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const mergedIcons = { ...defaultIcons, ...icons };
  const isIncomingRinging =
    activeCall?.direction === "incoming" &&
    (activeCall.status === "ringing" || activeCall.status === "initiated");
  const isOutgoingRinging =
    activeCall?.direction === "outgoing" && (callStatus === "initiated" || callStatus === "ringing");
  const isFinished = activeCall ? finishedStatuses.has(callStatus) : false;

  useRingtone(Boolean(isIncomingRinging), ringtones?.incoming, "incoming");
  useRingtone(Boolean(isOutgoingRinging), ringtones?.outgoing, "outgoing");

  const liveLabel = useMemo(() => statusLabel[callStatus] ?? callStatus, [callStatus]);

  useEffect(() => {
    if (!activeCall) {
      timedCallIdRef.current = null;
      startedAtRef.current = null;
      setDurationSeconds(0);
      if (callTimerRef.current !== null) {
        window.clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      return;
    }

    if (timedCallIdRef.current !== activeCall.callId) {
      timedCallIdRef.current = activeCall.callId;
      startedAtRef.current = null;
      setDurationSeconds(0);
      if (callTimerRef.current !== null) {
        window.clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }

    const shouldRunTimer =
      !isIncomingRinging &&
      !isFinished &&
      (callStatus === "accepted" || callStatus === "ongoing");

    if (!shouldRunTimer) {
      if (callTimerRef.current !== null) {
        window.clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      return;
    }

    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
      setDurationSeconds(0);
    }

    const updateDuration = (): void => {
      if (startedAtRef.current === null) {
        return;
      }

      setDurationSeconds(Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000)));
    };

    updateDuration();

    if (callTimerRef.current === null) {
      callTimerRef.current = window.setInterval(updateDuration, 1000);
    }

    return () => {
      if (callTimerRef.current !== null) {
        window.clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [activeCall, callStatus, isFinished, isIncomingRinging]);

  useEffect(() => {
    if (!activeCall || !isFinished) {
      return;
    }

    const timer = window.setTimeout(() => {
      clearActiveCall();
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activeCall, clearActiveCall, isFinished]);

  const currentRemoteId = activeCall ? getRemoteId(activeCall) : defaultReceiverId || "Remote";
  const remoteAvatar = activeCall
    ? (resolveAvatarSrc?.(activeCall, "remote") ?? readAvatarFromMetadata(activeCall, "remote"))
    : undefined;
  const headerSubtext =
    durationSeconds > 0 || (callStatus === "accepted" || callStatus === "ongoing")
      ? formatDuration(durationSeconds)
      : liveLabel;

  const endCurrentCall = async (): Promise<void> => {
    if (!activeCall) {
      return;
    }

    if (activeCall.direction === "outgoing" && (callStatus === "initiated" || callStatus === "ringing")) {
      await cancelCall(activeCall.callId);
      return;
    }

    await endCall(activeCall.callId);
  };

  const startCurrentTypeCall = async (): Promise<void> => {
    if (!defaultReceiverId.trim()) {
      return;
    }

    if (selectedType === "audio") {
      await startAudioCall(defaultReceiverId.trim(), { startedFrom: "streamyy-default-ui" });
      return;
    }

    await startVideoCall(defaultReceiverId.trim(), { startedFrom: "streamyy-default-ui" });
  };

  const callRendererProps =
    activeCall === null
      ? null
      : {
          activeCall,
          callStatus,
          connected,
          reconnecting,
          media,
          clear: clearActiveCall,
          cancel: async () => cancelCall(activeCall.callId),
          end: async () => endCall(activeCall.callId),
          toggleMute,
          toggleVideo,
        };

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        background: "#111315",
        color: "white",
        overflow: "hidden",
      }}
    >
      {!activeCall ? (
        <section
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "1.5rem",
            background: "#111315",
          }}
        >
          <div
            style={{
              width: "min(24rem, 100%)",
              display: "grid",
              gap: "1rem",
              padding: "1.4rem",
              borderRadius: "1.8rem",
              background: "#1d1d21",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              justifyItems: "center",
            }}
          >
            <div style={{ display: "grid", gap: "0.35rem", justifyItems: "center", textAlign: "center" }}>
              <strong style={{ fontSize: "1.3rem" }}>{title}</strong>
              <span style={{ color: "rgba(255, 255, 255, 0.56)", lineHeight: 1.5 }}>{subtitle}</span>
            </div>

            <div style={{ display: "flex", gap: "0.85rem", justifyContent: "center" }}>
              <button
                type="button"
                aria-label="Start audio call"
                disabled={!defaultReceiverId.trim()}
                onClick={() => {
                  setSelectedType("audio");
                  void startAudioCall(defaultReceiverId.trim(), { startedFrom: "streamyy-default-ui" });
                }}
                style={{
                  width: "4rem",
                  height: "4rem",
                  borderRadius: "999px",
                  border: selectedType === "audio" ? "1px solid #00c781" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: "#282a2f",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                  cursor: defaultReceiverId.trim() ? "pointer" : "not-allowed",
                  opacity: defaultReceiverId.trim() ? 1 : 0.48,
                }}
              >
                {mergedIcons.audio}
              </button>
              <button
                type="button"
                aria-label="Start video call"
                disabled={!defaultReceiverId.trim()}
                onClick={() => {
                  setSelectedType("video");
                  void startVideoCall(defaultReceiverId.trim(), { startedFrom: "streamyy-default-ui" });
                }}
                style={{
                  width: "4rem",
                  height: "4rem",
                  borderRadius: "999px",
                  border: selectedType === "video" ? "1px solid #00c781" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: "#282a2f",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                  cursor: defaultReceiverId.trim() ? "pointer" : "not-allowed",
                  opacity: defaultReceiverId.trim() ? 1 : 0.48,
                }}
              >
                {mergedIcons.video}
              </button>
            </div>

            <button
              type="button"
              disabled={!defaultReceiverId.trim()}
              onClick={() => {
                void startCurrentTypeCall();
              }}
              style={{
                borderRadius: "999px",
                border: 0,
                background: "#282a2f",
                color: "white",
                padding: "0.9rem 1rem",
                cursor: defaultReceiverId.trim() ? "pointer" : "not-allowed",
                opacity: defaultReceiverId.trim() ? 1 : 0.48,
                width: "100%",
              }}
            >
              Start call
            </button>
          </div>
        </section>
      ) : null}

      {activeCall && isIncomingRinging
        ? renderIncomingCall
          ? renderIncomingCall({
              call: activeCall,
              connected,
              reconnecting,
              accept: async () => acceptCall(activeCall.callId),
              decline: async (reason?: string) => declineCall(activeCall.callId, reason),
            })
          : (
            <section
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                padding: "1rem",
                background: "rgba(0, 0, 0, 0.58)",
                backdropFilter: "blur(16px)",
                zIndex: 2,
              }}
            >
              <IncomingCallCard
                call={activeCall}
                avatar={<DefaultAvatar label={activeCall.callerId} src={remoteAvatar} size="6.6rem" />}
                acceptIcon={mergedIcons.accept}
                declineIcon={mergedIcons.decline}
                onAccept={() => {
                  void acceptCall(activeCall.callId);
                }}
                onDecline={() => {
                  void declineCall(activeCall.callId);
                }}
              />
            </section>
            )
        : null}

      {activeCall && !isIncomingRinging
        ? renderCallInterface && callRendererProps
          ? renderCallInterface(callRendererProps)
          : (
            <section
              style={{
                position: "relative",
                width: "100%",
                minHeight: "100vh",
                background: activeCall.callType === "video" ? "#111315" : "#202224",
              }}
            >
              {activeCall.callType === "video" ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                  }}
                >
                  <VideoStage
                    localStream={media.localStream}
                    remoteStream={media.remoteStream}
                    localLabel=""
                    remoteLabel=""
                    localMirrored
                  />
                </div>
              ) : (
                <div
                  style={{
                    minHeight: "100vh",
                    display: "grid",
                    placeItems: "center",
                    padding: "2rem 1.5rem 8rem",
                  }}
                >
                  <div style={{ display: "grid", justifyItems: "center", gap: "1rem" }}>
                    <DefaultAvatar label={currentRemoteId} src={remoteAvatar} size="7.5rem" />
                    <strong style={{ fontSize: "2rem", lineHeight: 1.1 }}>{currentRemoteId}</strong>
                  </div>
                </div>
              )}

              <div
                style={{
                  position: "absolute",
                  top: "2rem",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "grid",
                  justifyItems: "center",
                  gap: "0.55rem",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "999px",
                    background: "rgba(31, 31, 35, 0.76)",
                    backdropFilter: "blur(14px)",
                    fontWeight: 700,
                    fontSize: "1rem",
                  }}
                >
                  {currentRemoteId}
                </div>
                <span style={{ color: "rgba(255, 255, 255, 0.72)", fontSize: "0.95rem" }}>{headerSubtext}</span>
              </div>

              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "2rem",
                  transform: "translateX(-50%)",
                  zIndex: 2,
                }}
              >
                <CallControls
                  state={{
                    muted: media.muted,
                    videoEnabled: media.videoEnabled,
                  }}
                  icons={{
                    mute: mergedIcons.mute,
                    unmute: mergedIcons.unmute,
                    video: mergedIcons.videoOn,
                    videoOff: mergedIcons.videoOff,
                    hangup: mergedIcons.hangup,
                  }}
                  showVideoToggle={activeCall.callType === "video" && media.hasLocalVideo}
                  onToggleMute={() => toggleMute()}
                  onToggleVideo={() => toggleVideo()}
                  onHangup={() => {
                    void endCurrentCall();
                  }}
                />
              </div>
            </section>
            )
        : null}

      {media.remoteStream ? <RemoteAudio stream={media.remoteStream} /> : null}
    </section>
  );
};
