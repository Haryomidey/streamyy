import type { StreammyIncomingCall } from "../types.js";

export interface IncomingCallCardProps {
  call: StreammyIncomingCall;
  onAccept(): void;
  onDecline(): void;
}

const avatarStyle: Record<string, unknown> = {
  width: "4.75rem",
  height: "4.75rem",
  borderRadius: "999px",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.16))",
  border: "1px solid rgba(134, 239, 172, 0.24)",
  color: "#dcfce7",
  fontSize: "1.4rem",
  fontWeight: 700,
};

export const IncomingCallCard = ({ call, onAccept, onDecline }: IncomingCallCardProps) => {
  return (
    <section
      style={{
        padding: "1.35rem",
        borderRadius: "1.6rem",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        display: "grid",
        gap: "1rem",
        background: "linear-gradient(180deg, rgba(17, 24, 39, 0.92), rgba(3, 7, 18, 0.96))",
        color: "white",
      }}
    >
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <div style={avatarStyle}>{call.callerId.slice(0, 2).toUpperCase()}</div>
        <div style={{ display: "grid", gap: "0.25rem" }}>
          <strong style={{ fontSize: "1.15rem" }}>{call.callerId}</strong>
          <span style={{ color: "rgba(226, 232, 240, 0.74)" }}>
            Incoming {call.callType} call
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.9rem", justifyContent: "center" }}>
        <button
          type="button"
          onClick={onDecline}
          style={{
            width: "4rem",
            height: "4rem",
            borderRadius: "999px",
            border: 0,
            background: "#ef4444",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          End
        </button>
        <button
          type="button"
          onClick={onAccept}
          style={{
            width: "4rem",
            height: "4rem",
            borderRadius: "999px",
            border: 0,
            background: "#22c55e",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Pick
        </button>
      </div>
    </section>
  );
};
