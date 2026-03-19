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
        ? { stream: localStream, label: localLabel, mirrored: localMirrored, muted: true }
        : { stream: remoteStream, label: remoteLabel, mirrored: remoteMirrored, muted: false },
    [localLabel, localMirrored, localStream, mainView, remoteLabel, remoteMirrored, remoteStream],
  );

  const thumbnailTile = useMemo(
    () =>
      mainView === "local"
        ? { stream: remoteStream, label: remoteLabel, mirrored: remoteMirrored, muted: false }
        : { stream: localStream, label: localLabel, mirrored: localMirrored, muted: true },
    [localLabel, localMirrored, localStream, mainView, remoteLabel, remoteMirrored, remoteStream],
  );

  return (
    <section style={{ position: "relative", width: "100%", height: "100%" }}>
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
          top: "1.25rem",
          right: "1.25rem",
          width: "min(18vw, 7.5rem)",
          minWidth: "6.5rem",
        }}
      >
        <VideoTile
          stream={thumbnailTile.stream}
          label={thumbnailTile.label}
          mirrored={thumbnailTile.mirrored}
          muted={thumbnailTile.muted}
          compact
          onClick={() => {
            setMainView((current) => (current === "local" ? "remote" : "local"));
          }}
        />
      </div>
    </section>
  );
};
