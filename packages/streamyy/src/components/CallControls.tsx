import type { ReactNode } from "react";
import type { CallControlsState } from "../types.js";

export interface CallControlsProps {
  state: CallControlsState;
  showVideoToggle?: boolean;
  icons?: {
    mute?: ReactNode;
    unmute?: ReactNode;
    video?: ReactNode;
    videoOff?: ReactNode;
    hangup?: ReactNode;
  };
  onToggleMute(): void;
  onToggleVideo(): void;
  onHangup(): void;
}

const controlButton = (background: string): Record<string, unknown> => ({
  width: "4rem",
  height: "4rem",
  borderRadius: "999px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  background,
  color: "white",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
  backdropFilter: "blur(18px)",
  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.28)",
});

export const CallControls = ({
  state,
  showVideoToggle = true,
  icons,
  onToggleMute,
  onToggleVideo,
  onHangup,
}: CallControlsProps) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem 1.2rem",
        borderRadius: "999px",
        background: "rgba(47, 48, 52, 0.78)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(20px)",
      }}
    >
      <button
        type="button"
        aria-label={state.muted ? "Unmute microphone" : "Mute microphone"}
        onClick={onToggleMute}
        style={controlButton("rgba(255, 255, 255, 0.08)")}
      >
        {state.muted ? icons?.unmute : icons?.mute}
      </button>

      {showVideoToggle ? (
        <button
          type="button"
          aria-label={state.videoEnabled ? "Turn off camera" : "Turn on camera"}
          onClick={onToggleVideo}
          style={controlButton("rgba(255, 255, 255, 0.08)")}
        >
          {state.videoEnabled ? icons?.video : icons?.videoOff}
        </button>
      ) : null}

      <button
        type="button"
        aria-label="End call"
        onClick={onHangup}
        style={controlButton("#ff3347")}
      >
        {icons?.hangup}
      </button>
    </div>
  );
};