import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { CallControls } from "./CallControls.js";
import { IncomingCallCard } from "./IncomingCallCard.js";
import { VideoStage } from "./VideoStage.js";
import { useRingtone } from "../hooks/useRingtone.js";
import { useStreammy } from "../hooks/useStreammy.js";
import type {
  StreammyCallInterfaceRenderer,
  StreammyIncomingCallRenderer,
  StreammyRingtoneSet,
} from "../types.js";

export interface StreammyCallWidgetProps {
  defaultReceiverId?: string;
  defaultCallType?: "audio" | "video";
  title?: string;
  subtitle?: string;
  ringtones?: StreammyRingtoneSet;
  renderIncomingCall?: StreammyIncomingCallRenderer;
  renderCallInterface?: StreammyCallInterfaceRenderer;
}

const statusLabel: Record<string, string> = {
  idle: "Ready",
  initiated: "Calling",
  ringing: "Ringing",
  accepted: "Connecting",
  ongoing: "In call",
  declined: "Declined",
  cancelled: "Cancelled",
  ended: "Ended",
  failed: "Failed",
  missed: "Missed",
};

const shellStyle: CSSProperties = {
  borderRadius: "2rem",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  background:
    "radial-gradient(circle at top, rgba(34, 197, 94, 0.14), transparent 26%), linear-gradient(180deg, #182229 0%, #0b141a 100%)",
  color: "white",
  boxShadow: "0 30px 80px rgba(0, 0, 0, 0.28)",
};

const fieldStyle: CSSProperties = {
  width: "100%",
  borderRadius: "1rem",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  background: "rgba(255, 255, 255, 0.06)",
  color: "white",
  padding: "0.95rem 1rem",
  boxSizing: "border-box",
};

const actionButton = (background: string): CSSProperties => ({
  borderRadius: "1rem",
  border: 0,
  padding: "0.95rem 1rem",
  background,
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
});

const finishedStatuses = new Set(["ended", "declined", "cancelled", "missed", "failed"]);

const avatarText = (value: string): string => value.slice(0, 2).toUpperCase() || "?";

const RemoteAudio = ({ stream }: { stream: MediaStream | null }) => {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={ref} autoPlay playsInline />;
};

export const StreammyCallWidget = ({
  defaultReceiverId = "",
  defaultCallType = "video",
  title = "Streamyy Calling",
  subtitle = "Drop this in for a ready-made calling experience, or keep the hook actions and replace the screens with your own design.",
  ringtones,
  renderIncomingCall,
  renderCallInterface,
}: StreammyCallWidgetProps) => {
  const {
    activeCall,
    callStatus,
    connected,
    reconnecting,
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
  } = useStreammy();
  const [receiverId, setReceiverId] = useState(defaultReceiverId);
  const [selectedType, setSelectedType] = useState<"audio" | "video">(defaultCallType);

  const isIncomingRinging =
    activeCall?.direction === "incoming" &&
    (activeCall.status === "ringing" || activeCall.status === "initiated");
  const isOutgoingRinging =
    activeCall?.direction === "outgoing" && (callStatus === "initiated" || callStatus === "ringing");
  const isFinished = activeCall ? finishedStatuses.has(callStatus) : false;

  useRingtone(Boolean(isIncomingRinging), ringtones?.incoming, "incoming");
  useRingtone(Boolean(isOutgoingRinging), ringtones?.outgoing, "outgoing");

  const liveLabel = useMemo(() => statusLabel[callStatus] ?? callStatus, [callStatus]);

  const startSelectedCall = async (): Promise<void> => {
    const target = receiverId.trim();
    if (!target) {
      return;
    }

    if (selectedType === "audio") {
      await startAudioCall(target, { startedFrom: "streamyy-default-ui" });
      return;
    }

    await startVideoCall(target, { startedFrom: "streamyy-default-ui" });
  };

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

  const defaultIncomingUi =
    activeCall && isIncomingRinging ? (
      <IncomingCallCard
        call={activeCall}
        onAccept={() => {
          void acceptCall(activeCall.callId);
        }}
        onDecline={() => {
          void declineCall(activeCall.callId);
        }}
      />
    ) : null;

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

  const audioFallbackLabel =
    activeCall?.direction === "incoming" ? activeCall.callerId : activeCall?.receiverId ?? "Remote";

  return (
    <section style={{ ...shellStyle, padding: "1.35rem", display: "grid", gap: "1.2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "start" }}>
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>{title}</h2>
          <p style={{ margin: 0, color: "rgba(226, 232, 240, 0.72)", lineHeight: 1.6 }}>{subtitle}</p>
        </div>
        <span
          style={{
            borderRadius: "999px",
            padding: "0.45rem 0.8rem",
            background: reconnecting
              ? "rgba(245, 158, 11, 0.16)"
              : connected
                ? "rgba(34, 197, 94, 0.16)"
                : "rgba(239, 68, 68, 0.18)",
            color: reconnecting ? "#fcd34d" : connected ? "#86efac" : "#fca5a5",
            fontSize: "0.88rem",
            whiteSpace: "nowrap",
          }}
        >
          {reconnecting ? "Reconnecting" : connected ? "Connected" : "Disconnected"}
        </span>
      </header>

      {!activeCall ? (
        <section
          style={{
            display: "grid",
            gap: "1rem",
            padding: "1.2rem",
            borderRadius: "1.5rem",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div style={{ display: "grid", gap: "0.45rem" }}>
            <span style={{ fontSize: "0.82rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "#86efac" }}>
              Start a call
            </span>
            <strong style={{ fontSize: "1.15rem" }}>
              Your app can also call `startAudioCall(...)` or `startVideoCall(...)` from its own buttons.
            </strong>
          </div>

          <input
            value={receiverId}
            onChange={(event: { target: { value: string } }) => setReceiverId(event.target.value)}
            placeholder="receiver_user_id"
            style={fieldStyle}
          />

          <div style={{ display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            <button
              type="button"
              onClick={() => {
                setSelectedType("audio");
                void startAudioCall(receiverId.trim(), { startedFrom: "streamyy-default-ui" });
              }}
              style={actionButton(selectedType === "audio" ? "#1f8f5f" : "rgba(255, 255, 255, 0.08)")}
            >
              Audio call
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedType("video");
                void startVideoCall(receiverId.trim(), { startedFrom: "streamyy-default-ui" });
              }}
              style={actionButton(selectedType === "video" ? "#128c7e" : "rgba(255, 255, 255, 0.08)")}
            >
              Video call
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              void startSelectedCall();
            }}
            style={actionButton("linear-gradient(135deg, #25d366, #128c7e)")}
          >
            Start with selected type
          </button>
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
          : defaultIncomingUi
        : null}

      {activeCall && !isIncomingRinging
        ? renderCallInterface && callRendererProps
          ? renderCallInterface(callRendererProps)
          : (
            <section
              style={{
                display: "grid",
                gap: "1rem",
                padding: "1rem",
                borderRadius: "1.6rem",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                <div style={{ display: "flex", gap: "0.9rem", alignItems: "center" }}>
                  <div
                    style={{
                      width: "3.5rem",
                      height: "3.5rem",
                      borderRadius: "999px",
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(37, 211, 102, 0.18)",
                      color: "#dcfce7",
                      fontWeight: 800,
                    }}
                  >
                    {avatarText(audioFallbackLabel)}
                  </div>
                  <div style={{ display: "grid", gap: "0.2rem" }}>
                    <strong style={{ fontSize: "1.05rem" }}>{audioFallbackLabel}</strong>
                    <span style={{ color: "rgba(226, 232, 240, 0.72)" }}>
                      {activeCall.callType} call • {liveLabel}
                    </span>
                  </div>
                </div>

                {isFinished ? (
                  <button
                    type="button"
                    onClick={clearActiveCall}
                    style={{
                      ...actionButton("rgba(255, 255, 255, 0.08)"),
                      padding: "0.7rem 0.9rem",
                    }}
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              {activeCall.callType === "video" ? (
                <VideoStage
                  localStream={media.localStream}
                  remoteStream={media.remoteStream}
                  localLabel="You"
                  remoteLabel={audioFallbackLabel}
                  localMirrored
                />
              ) : (
                <section
                  style={{
                    minHeight: "18rem",
                    borderRadius: "1.6rem",
                    background:
                      "radial-gradient(circle at top, rgba(37, 211, 102, 0.18), transparent 32%), linear-gradient(180deg, rgba(17, 24, 39, 0.96), rgba(2, 6, 23, 0.96))",
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                    padding: "1.5rem",
                  }}
                >
                  <div style={{ display: "grid", gap: "1rem", placeItems: "center" }}>
                    <div
                      style={{
                        width: "6.5rem",
                        height: "6.5rem",
                        borderRadius: "999px",
                        display: "grid",
                        placeItems: "center",
                        background: "rgba(37, 211, 102, 0.16)",
                        border: "1px solid rgba(74, 222, 128, 0.18)",
                        fontSize: "2rem",
                        fontWeight: 800,
                        color: "#dcfce7",
                      }}
                    >
                      {avatarText(audioFallbackLabel)}
                    </div>
                    <div style={{ display: "grid", gap: "0.35rem" }}>
                      <strong style={{ fontSize: "1.35rem" }}>{audioFallbackLabel}</strong>
                      <span style={{ color: "rgba(226, 232, 240, 0.72)" }}>{liveLabel}</span>
                    </div>
                  </div>
                </section>
              )}

              <CallControls
                state={{
                  muted: media.muted,
                  videoEnabled: media.videoEnabled,
                }}
                showVideoToggle={activeCall.callType === "video" && media.hasLocalVideo}
                onToggleMute={() => toggleMute()}
                onToggleVideo={() => toggleVideo()}
                onHangup={() => {
                  void endCurrentCall();
                }}
              />
            </section>
            )
        : null}

      {media.remoteStream ? <RemoteAudio stream={media.remoteStream} /> : null}
    </section>
  );
};
