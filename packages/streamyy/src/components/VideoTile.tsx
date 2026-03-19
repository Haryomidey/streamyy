import { useEffect, useRef } from "react";

export interface VideoTileProps {
  stream: MediaStream | null;
  muted?: boolean;
  label?: string;
  mirrored?: boolean;
  onClick?: () => void;
  active?: boolean;
  compact?: boolean;
}

export const VideoTile = ({
  stream,
  muted = false,
  label,
  mirrored = false,
  onClick,
  active = false,
  compact = false,
}: VideoTileProps) => {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <figure style={{ display: "grid", margin: 0, width: "100%", height: "100%" }}>
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        onClick={onClick}
        style={{
          width: "100%",
          height: compact ? "8.5rem" : "100%",
          minHeight: compact ? "8.5rem" : "100%",
          background: "#2b2b2f",
          borderRadius: compact ? "1.15rem" : "0",
          objectFit: "cover",
          transform: mirrored ? "scaleX(-1)" : "none",
          cursor: onClick ? "pointer" : "default",
          border: compact ? "1px solid rgba(255, 255, 255, 0.12)" : active ? 0 : 0,
          boxShadow: compact ? "0 16px 32px rgba(0, 0, 0, 0.38)" : "none",
        }}
      />
      {label ? (
        <figcaption
          style={{
            position: compact ? "absolute" : "absolute",
            left: compact ? "0.75rem" : "1rem",
            bottom: compact ? "0.75rem" : "1rem",
            color: "white",
            fontSize: compact ? "0.78rem" : "0.92rem",
            background: "rgba(0, 0, 0, 0.34)",
            borderRadius: "999px",
            padding: "0.3rem 0.55rem",
            backdropFilter: "blur(12px)",
          }}
        >
          {label}
        </figcaption>
      ) : null}
    </figure>
  );
};
