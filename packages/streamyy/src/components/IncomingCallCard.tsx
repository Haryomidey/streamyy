import type { ReactNode } from "react";
import type { StreamyyIncomingCall } from "../types.js";

export interface IncomingCallCardProps {
  call: StreamyyIncomingCall;
  avatar?: ReactNode;
  acceptIcon?: ReactNode;
  declineIcon?: ReactNode;
  onAccept(): void;
  onDecline(): void;
}

export const IncomingCallCard = ({
  call,
  avatar,
  acceptIcon,
  declineIcon,
  onAccept,
  onDecline,
}: IncomingCallCardProps) => {
  return (
    <section
      style={{
        width: "min(24rem, calc(100vw - 2rem))",
        padding: "2rem",
        borderRadius: "2rem",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        display: "grid",
        gap: "1.5rem",
        background: "#1d1d21",
        color: "white",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.42)",
      }}
    >
      <div style={{ display: "grid", gap: "1rem", justifyItems: "center" }}>
        {avatar}
        <div style={{ display: "grid", gap: "0.35rem" }}>
          <strong style={{ fontSize: "2rem", lineHeight: 1.1 }}>{call.callerId}</strong>
          <span style={{ color: "rgba(255, 255, 255, 0.62)", fontSize: "1.05rem" }}>
            Incoming {call.callType} call...
          </span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "2rem", paddingInline: "1.5rem" }}>
        <button
          type="button"
          aria-label="Decline call"
          onClick={onDecline}
          style={{
            width: "4rem",
            height: "4rem",
            borderRadius: "999px",
            border: 0,
            background: "#ff3347",
            color: "white",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          {declineIcon}
        </button>
        <button
          type="button"
          aria-label="Accept call"
          onClick={onAccept}
          style={{
            width: "4rem",
            height: "4rem",
            borderRadius: "999px",
            border: 0,
            background: "#00c781",
            color: "white",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
          }}
        >
          {acceptIcon}
        </button>
      </div>
    </section>
  );
};
