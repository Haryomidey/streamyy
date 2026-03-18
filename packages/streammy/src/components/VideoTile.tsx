import { useEffect, useRef } from "react";

export interface VideoTileProps {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
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
    <figure
      style={{
        display: "grid",
        gap: "0.5rem",
        margin: 0,
      }}
    >
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        onClick={onClick}
        style={{
          width: "100%",
          minHeight: compact ? "7rem" : "12rem",
          background: "#111827",
          borderRadius: "1rem",
          objectFit: "cover",
          transform: mirrored ? "scaleX(-1)" : "none",
          cursor: onClick ? "pointer" : "default",
          border: active ? "2px solid rgba(56, 189, 248, 0.9)" : "1px solid rgba(148, 163, 184, 0.18)",
          boxShadow: active ? "0 0 0 4px rgba(14, 165, 233, 0.12)" : "none",
        }}
      />
      <figcaption
        style={{
          color: "rgba(226, 232, 240, 0.82)",
          fontSize: compact ? "0.85rem" : "0.95rem",
        }}
      >
        {label}
      </figcaption>
    </figure>
  );
};
