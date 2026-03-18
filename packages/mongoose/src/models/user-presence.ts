import { Schema, type HydratedDocument, type Model, type Mongoose } from "mongoose";
import type { PresenceRecord } from "@streammy/core";

export type UserPresenceDocument = HydratedDocument<PresenceRecord>;

const userPresenceSchema = new Schema<PresenceRecord>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      required: true,
      enum: ["online", "offline", "busy", "away"],
      index: true,
    },
    lastSeenAt: { type: Date, required: true, index: true },
    metadata: { type: Schema.Types.Mixed },
    activeConnections: { type: Number, required: true, default: 0 },
  },
  {
    collection: "streammy_user_presence",
    timestamps: true,
  },
);

userPresenceSchema.index({ status: 1, lastSeenAt: -1 });

export const getUserPresenceModel = (mongoose: Mongoose): Model<PresenceRecord> => {
  return (
    (mongoose.models.UserPresence as Model<PresenceRecord> | undefined) ??
    mongoose.model<PresenceRecord>("UserPresence", userPresenceSchema)
  );
};
