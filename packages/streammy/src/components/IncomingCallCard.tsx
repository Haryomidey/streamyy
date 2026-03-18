import type { StreammyIncomingCall } from "../types.js";

export interface IncomingCallCardProps {
  call: StreammyIncomingCall;
  onAccept(): void;
  onDecline(): void;
}

export const IncomingCallCard = ({ call, onAccept, onDecline }: IncomingCallCardProps) => {
  return (
    <section
      style={{
        padding: "1rem",
        borderRadius: "1rem",
        border: "1px solid rgba(125, 211, 252, 0.2)",
        display: "grid",
        gap: "0.75rem",
        maxWidth: "22rem",
        background: "rgba(2, 6, 23, 0.65)",
      }}
    >
      <div>
        <strong>Incoming {call.callType} call</strong>
        <p style={{ margin: "0.25rem 0 0", color: "rgba(226, 232, 240, 0.78)" }}>Caller: {call.callerId}</p>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          type="button"
          onClick={onAccept}
          style={{
            borderRadius: "12px",
            border: 0,
            padding: "0.75rem 1rem",
            background: "#16a34a",
            color: "white",
            fontWeight: 700,
          }}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={onDecline}
          style={{
            borderRadius: "12px",
            border: 0,
            padding: "0.75rem 1rem",
            background: "#dc2626",
            color: "white",
            fontWeight: 700,
          }}
        >
          Decline
        </button>
      </div>
    </section>
  );
};
