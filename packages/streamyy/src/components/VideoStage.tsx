import { useMemo, useState } from "react";
import { VideoTile } from "./VideoTile.js";

export interface VideoStageProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  localLabel?: string;
  remoteLabel?: string;
  localMirrored?: boolean;
  remoteMirrored?: boolean;
  defaultMainView?: "local" | "remote";
}

export const VideoStage = ({
  localStream,
  remoteStream,
  localLabel = "You",
  remoteLabel = "Remote",
  localMirrored = false,
  remoteMirrored = false,
  defaultMainView = "remote",
}: VideoStageProps) => {
  const [mainView, setMainView] = useState<"local" | "remote">(defaultMainView);

  const mainTile = useMemo(
    () =>
      mainView === "local"
        ? {
            stream: localStream,
            label: localLabel,
            mirrored: localMirrored,
            muted: true,
          }
        : {
            stream: remoteStream,
            label: remoteLabel,
            mirrored: remoteMirrored,
            muted: false,
          },
    [localLabel, localMirrored, localStream, mainView, remoteLabel, remoteMirrored, remoteStream],
  );

  const thumbnailTile = useMemo(
    () =>
      mainView === "local"
        ? {
            stream: remoteStream,
            label: remoteLabel,
            mirrored: remoteMirrored,
            muted: false,
            key: "remote",
          }
        : {
            stream: localStream,
            label: localLabel,
            mirrored: localMirrored,
            muted: true,
            key: "local",
          },
    [localLabel, localMirrored, localStream, mainView, remoteLabel, remoteMirrored, remoteStream],
  );

  const toggleMainView = (): void => {
    setMainView((current) => (current === "local" ? "remote" : "local"));
  };

  return (
    <section
      style={{
        position: "relative",
        display: "grid",
        gap: "0.75rem",
      }}
    >
      <VideoTile
        stream={mainTile.stream}
        label={mainTile.label}
        mirrored={mainTile.mirrored}
        muted={mainTile.muted}
        active
      />

      <div
        style={{
          position: "absolute",
          right: "1rem",
          bottom: "3.25rem",
          width: "30%",
          minWidth: "8rem",
          maxWidth: "12rem",
        }}
      >
        <VideoTile
          stream={thumbnailTile.stream}
          label={thumbnailTile.label}
          mirrored={thumbnailTile.mirrored}
          muted={thumbnailTile.muted}
          compact
          onClick={toggleMainView}
        />
      </div>

      <button
        type="button"
        onClick={toggleMainView}
        style={{
          justifySelf: "start",
          borderRadius: "999px",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          background: "rgba(15, 23, 42, 0.88)",
          color: "white",
          padding: "0.7rem 0.95rem",
          cursor: "pointer",
        }}
      >
        Swap videos
      </button>
    </section>
  );
};
