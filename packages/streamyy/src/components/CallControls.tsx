import type { CallControlsState } from "../types.js";

export interface CallControlsProps {
  state: CallControlsState;
  showVideoToggle?: boolean;
  onToggleMute(): void;
  onToggleVideo(): void;
  onHangup(): void;
}

const controlButton = (background: string): Record<string, unknown> => ({
  width: "3.75rem",
  height: "3.75rem",
  borderRadius: "999px",
  border: 0,
  background,
  color: "white",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  boxShadow: "0 14px 28px rgba(15, 23, 42, 0.24)",
});

export const CallControls = ({
  state,
  showVideoToggle = true,
  onToggleMute,
  onToggleVideo,
  onHangup,
}: CallControlsProps) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.9rem",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        aria-label={state.muted ? "Unmute microphone" : "Mute microphone"}
        onClick={onToggleMute}
        style={controlButton(state.muted ? "#f59e0b" : "rgba(255, 255, 255, 0.14)")}
      >
        {state.muted ? "Mic off" : "Mic"}
      </button>

      {showVideoToggle ? (
        <button
          type="button"
          aria-label={state.videoEnabled ? "Turn off camera" : "Turn on camera"}
          onClick={onToggleVideo}
          style={controlButton(state.videoEnabled ? "rgba(255, 255, 255, 0.14)" : "#2563eb")}
        >
          {state.videoEnabled ? "Video" : "Cam off"}
        </button>
      ) : null}

      <button
        type="button"
        aria-label="End call"
        onClick={onHangup}
        style={controlButton("#ef4444")}
      >
        End
      </button>
    </div>
  );
};
