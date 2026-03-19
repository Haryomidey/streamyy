export interface LocalMediaOptions {
  audio?: boolean | MediaTrackConstraints;
  video?: boolean | MediaTrackConstraints;
}

export const getUserMedia = async (options: LocalMediaOptions): Promise<MediaStream> => {
  return navigator.mediaDevices.getUserMedia({
    audio: options.audio ?? true,
    video: options.video ?? true,
  });
};

export const toggleStreamTracks = (
  stream: MediaStream | null,
  kind: "audio" | "video",
  enabled: boolean,
): void => {
  if (!stream) {
    return;
  }

  for (const track of kind === "audio" ? stream.getAudioTracks() : stream.getVideoTracks()) {
    track.enabled = enabled;
  }
};
