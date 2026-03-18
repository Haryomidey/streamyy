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
      <button type="button" onClick={onToggleMute}>
        {state.muted ? "Unmute" : "Mute"}
      </button>
      <button type="button" onClick={onToggleVideo}>
        {state.videoEnabled ? "Stop video" : "Start video"}
      </button>
      <button type="button" onClick={onHangup}>
        End call
      </button>
    </div>
  );
};
