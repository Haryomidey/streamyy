import type { StreamyyClient } from "../client.js";

export interface PeerSessionOptions {
  client: StreamyyClient;
  callId: string;
  remoteUserId: string;
  rtcConfig?: RTCConfiguration;
}

export class StreamyyPeerSession {
  public readonly connection: RTCPeerConnection;

  public constructor(private readonly options: PeerSessionOptions) {
    this.connection = new RTCPeerConnection(options.rtcConfig);
    this.connection.onicecandidate = (event) => {
      if (event.candidate) {
        options.client.sendIceCandidate(options.callId, options.remoteUserId, event.candidate.toJSON());
      }
    };
  }

  public attachLocalStream(stream: MediaStream): void {
    for (const track of stream.getTracks()) {
      this.connection.addTrack(track, stream);
    }
  }

  public async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.connection.createOffer();
    await this.connection.setLocalDescription(offer);
    return offer;
  }

  public async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.connection.createAnswer();
    await this.connection.setLocalDescription(answer);
    return answer;
  }

  public async applyRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    await this.connection.setRemoteDescription(description);
  }

  public async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    await this.connection.addIceCandidate(candidate);
  }

  public close(): void {
    this.connection.close();
  }
}
