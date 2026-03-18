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
        border: "1px solid #d1d5db",
        display: "grid",
        gap: "0.75rem",
        maxWidth: "22rem",
      }}
    >
      <div>
        <strong>Incoming {call.callType} call</strong>
        <p style={{ margin: "0.25rem 0 0" }}>Caller: {call.callerId}</p>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button type="button" onClick={onAccept}>
          Accept
        </button>
        <button type="button" onClick={onDecline}>
          Decline
        </button>
      </div>
    </section>
  );
};
