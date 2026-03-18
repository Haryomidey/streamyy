import { useMemo, useState, type CSSProperties } from "react";
import { CallControls } from "./CallControls.js";
import { IncomingCallCard } from "./IncomingCallCard.js";
import { useRingtone } from "../hooks/useRingtone.js";
import { useStreammy } from "../hooks/useStreammy.js";
import type { CallControlsState, StreammyRingtoneSet } from "../types.js";

export interface StreammyCallWidgetProps {
  defaultReceiverId?: string;
  defaultCallType?: "audio" | "video";
  title?: string;
  subtitle?: string;
  ringtones?: StreammyRingtoneSet;
}

const statusLabel: Record<string, string> = {
  idle: "Idle",
  initiated: "Dialing",
  ringing: "Ringing",
  accepted: "Accepted",
  ongoing: "Live",
  declined: "Declined",
  cancelled: "Cancelled",
  ended: "Ended",
  failed: "Failed",
  missed: "Missed",
};

const surface: CSSProperties = {
  borderRadius: "28px",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  background:
    "radial-gradient(circle at top, rgba(30, 64, 175, 0.22), transparent 38%), rgba(2, 6, 23, 0.92)",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.45)",
  color: "white",
};

export const StreammyCallWidget = ({
  defaultReceiverId = "",
  defaultCallType = "video",
  title = "Streamyy Calling UI",
  subtitle = "Default install-ready calling experience with signaling state, ringing, and customizable ringtones.",
  ringtones,
}: StreammyCallWidgetProps) => {
  const { activeCall, callStatus, connected, reconnecting, initiateCall, acceptCall, declineCall, cancelCall, endCall, clearActiveCall } =
    useStreammy();
  const [receiverId, setReceiverId] = useState(defaultReceiverId);
  const [callType, setCallType] = useState<"audio" | "video">(defaultCallType);
  const [controls, setControls] = useState<CallControlsState>({
    muted: false,
    videoEnabled: defaultCallType === "video",
  });

  const isIncomingRinging =
    activeCall?.direction === "incoming" && (activeCall.status === "ringing" || activeCall.status === "initiated");
  const isOutgoingRinging =
    activeCall?.direction === "outgoing" && (callStatus === "initiated" || callStatus === "ringing");

  useRingtone(Boolean(isIncomingRinging), ringtones?.incoming, "incoming");
  useRingtone(Boolean(isOutgoingRinging), ringtones?.outgoing, "outgoing");

  const canStartCall =
    receiverId.trim().length > 0 &&
    (callStatus === "idle" ||
      callStatus === "ended" ||
      callStatus === "declined" ||
      callStatus === "cancelled" ||
      callStatus === "missed" ||
      callStatus === "failed");
  const liveLabel = useMemo(() => statusLabel[callStatus] ?? callStatus, [callStatus]);

  return (
    <section style={{ ...surface, padding: "1.5rem", display: "grid", gap: "1.25rem" }}>
      <header style={{ display: "grid", gap: "0.4rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800 }}>{title}</h2>
            <p style={{ margin: "0.35rem 0 0", color: "rgba(226, 232, 240, 0.72)", lineHeight: 1.6 }}>{subtitle}</p>
          </div>
          <span
            style={{
              borderRadius: "999px",
              padding: "0.4rem 0.8rem",
              background: reconnecting
                ? "rgba(245, 158, 11, 0.16)"
                : connected
                  ? "rgba(34, 197, 94, 0.16)"
                  : "rgba(248, 113, 113, 0.14)",
              color: reconnecting ? "#fcd34d" : connected ? "#86efac" : "#fca5a5",
              fontSize: "0.9rem",
              whiteSpace: "nowrap",
            }}
          >
            {reconnecting ? "Reconnecting" : connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <article
          style={{
            padding: "1rem",
            borderRadius: "22px",
            border: "1px solid rgba(148, 163, 184, 0.14)",
            background: "rgba(15, 23, 42, 0.75)",
            display: "grid",
            gap: "0.85rem",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(125, 211, 252, 0.85)", textTransform: "uppercase", letterSpacing: "0.18em" }}>
              Start Call
            </p>
            <h3 style={{ margin: "0.45rem 0 0", fontSize: "1.1rem" }}>Launch the default widget</h3>
            <p style={{ margin: "0.45rem 0 0", color: "rgba(226, 232, 240, 0.72)", lineHeight: 1.6 }}>
              Calls ring for up to 60 seconds. If nobody picks, the session automatically ends as missed to keep the flow light.
            </p>
          </div>

          <label style={{ display: "grid", gap: "0.45rem" }}>
            <span style={{ fontSize: "0.92rem", color: "rgba(226, 232, 240, 0.82)" }}>Receiver ID</span>
            <input
              value={receiverId}
              onChange={(event) => setReceiverId(event.target.value)}
              placeholder="user_456"
              style={{
                borderRadius: "14px",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                background: "rgba(15, 23, 42, 0.65)",
                color: "white",
                padding: "0.85rem 0.9rem",
              }}
            />
          </label>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={() => setCallType("audio")}
              style={{
                flex: 1,
                borderRadius: "14px",
                border: 0,
                padding: "0.8rem 1rem",
                background: callType === "audio" ? "#0ea5e9" : "rgba(30, 41, 59, 0.85)",
                color: "white",
              }}
            >
              Audio
            </button>
            <button
              type="button"
              onClick={() => setCallType("video")}
              style={{
                flex: 1,
                borderRadius: "14px",
                border: 0,
                padding: "0.8rem 1rem",
                background: callType === "video" ? "#0ea5e9" : "rgba(30, 41, 59, 0.85)",
                color: "white",
              }}
            >
              Video
            </button>
          </div>

          <button
            type="button"
            disabled={!canStartCall}
            onClick={() => initiateCall(receiverId.trim(), callType, { startedFrom: "streamyy-default-ui" })}
            style={{
              borderRadius: "16px",
              border: 0,
              padding: "0.95rem 1rem",
              background: canStartCall ? "linear-gradient(135deg, #0ea5e9, #2563eb)" : "rgba(71, 85, 105, 0.6)",
              color: "white",
              fontWeight: 700,
              cursor: canStartCall ? "pointer" : "not-allowed",
            }}
          >
            Start {callType} call
          </button>
        </article>

        <article
          style={{
            padding: "1rem",
            borderRadius: "22px",
            border: "1px solid rgba(148, 163, 184, 0.14)",
            background: "rgba(15, 23, 42, 0.75)",
            display: "grid",
            gap: "0.85rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(125, 211, 252, 0.85)", textTransform: "uppercase", letterSpacing: "0.18em" }}>
                Current State
              </p>
              <h3 style={{ margin: "0.45rem 0 0", fontSize: "1.1rem" }}>{liveLabel}</h3>
            </div>
            <span
              style={{
                borderRadius: "999px",
                padding: "0.35rem 0.75rem",
                background: "rgba(14, 165, 233, 0.14)",
                color: "#7dd3fc",
                fontSize: "0.88rem",
              }}
            >
              {activeCall?.direction ?? "standby"}
            </span>
          </div>

          {activeCall ? (
            <div style={{ display: "grid", gap: "0.45rem", color: "rgba(226, 232, 240, 0.86)" }}>
              <p style={{ margin: 0 }}>Call ID: {activeCall.callId}</p>
              <p style={{ margin: 0 }}>Caller: {activeCall.callerId}</p>
              <p style={{ margin: 0 }}>Receiver: {activeCall.receiverId}</p>
              <p style={{ margin: 0 }}>Type: {activeCall.callType}</p>
            </div>
          ) : (
            <p style={{ margin: 0, color: "rgba(226, 232, 240, 0.72)", lineHeight: 1.6 }}>
              No active session yet. This widget becomes the default installable UI developers can use before customizing.
            </p>
          )}

          {activeCall?.direction === "incoming" && (activeCall.status === "ringing" || activeCall.status === "initiated") ? (
            <IncomingCallCard
              call={activeCall}
              onAccept={() => acceptCall(activeCall.callId)}
              onDecline={() => declineCall(activeCall.callId)}
            />
          ) : null}

          {activeCall ? (
            <CallControls
              state={controls}
              onToggleMute={() =>
                setControls((current) => ({
                  ...current,
                  muted: !current.muted,
                }))
              }
              onToggleVideo={() =>
                setControls((current) => ({
                  ...current,
                  videoEnabled: !current.videoEnabled,
                }))
              }
              onHangup={() => {
                if (activeCall.callId.startsWith("pending-")) {
                  clearActiveCall();
                  return;
                }

                if (activeCall.direction === "outgoing" && (activeCall.status === "initiated" || activeCall.status === "ringing")) {
                  cancelCall(activeCall.callId);
                  return;
                }

                endCall(activeCall.callId);
              }}
            />
          ) : null}

          {(callStatus === "ended" ||
            callStatus === "declined" ||
            callStatus === "cancelled" ||
            callStatus === "missed" ||
            callStatus === "failed") &&
          activeCall ? (
            <button
              type="button"
              onClick={clearActiveCall}
              style={{
                justifySelf: "start",
                borderRadius: "12px",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                background: "transparent",
                color: "white",
                padding: "0.7rem 0.9rem",
              }}
            >
              Clear finished call
            </button>
          ) : null}
        </article>
      </section>
    </section>
  );
};
