import { Schema, type HydratedDocument, type Model, type Mongoose } from "mongoose";
import type { SocketConnectionRecord } from "../domain/call.js";

export type SocketConnectionDocument = HydratedDocument<SocketConnectionRecord>;

const socketConnectionSchema = new Schema<SocketConnectionRecord>(
  {
    connectionId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    connectedAt: { type: Date, required: true },
    lastSeenAt: { type: Date, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    collection: "streammy_socket_connections",
    timestamps: true,
  },
);

socketConnectionSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
socketConnectionSchema.index({ userId: 1, lastSeenAt: -1 });

export const getSocketConnectionModel = (mongoose: Mongoose): Model<SocketConnectionRecord> => {
  return (
    (mongoose.models.SocketConnection as Model<SocketConnectionRecord> | undefined) ??
    mongoose.model<SocketConnectionRecord>("SocketConnection", socketConnectionSchema)
  );
};
