import type { CallControlsState } from "../types.js";

export interface CallControlsProps {
  state: CallControlsState;
  onToggleMute(): void;
  onToggleVideo(): void;
  onHangup(): void;
}

export const CallControls = ({
  state,
  onToggleMute,
  onToggleVideo,
  onHangup,
}: CallControlsProps) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.75rem",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <button
        type="button"
        onClick={onToggleMute}
        style={{
          borderRadius: "999px",
          border: 0,
          padding: "0.9rem 1rem",
          background: state.muted ? "#f59e0b" : "rgba(51, 65, 85, 0.9)",
          color: "white",
          minWidth: "6.5rem",
        }}
      >
        {state.muted ? "Unmute" : "Mute"}
      </button>
      <button
        type="button"
        onClick={onToggleVideo}
        style={{
          borderRadius: "999px",
          border: 0,
          padding: "0.9rem 1rem",
          background: state.videoEnabled ? "rgba(51, 65, 85, 0.9)" : "#2563eb",
          color: "white",
          minWidth: "7rem",
        }}
      >
        {state.videoEnabled ? "Stop video" : "Start video"}
      </button>
      <button
        type="button"
        onClick={onHangup}
        style={{
          borderRadius: "999px",
          border: 0,
          padding: "0.9rem 1rem",
          background: "#dc2626",
          color: "white",
          minWidth: "6.5rem",
        }}
      >
        End call
      </button>
    </div>
  );
};
