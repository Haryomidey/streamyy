import { useEffect, useRef } from "react";

export interface VideoTileProps {
  stream: MediaStream | null;
  muted?: boolean;
  label: string;
}

export const VideoTile = ({ stream, muted = false, label }: VideoTileProps) => {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <figure style={{ display: "grid", gap: "0.5rem" }}>
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        style={{
          width: "100%",
          minHeight: "12rem",
          background: "#111827",
          borderRadius: "1rem",
          objectFit: "cover",
        }}
      />
      <figcaption>{label}</figcaption>
    </figure>
  );
};
