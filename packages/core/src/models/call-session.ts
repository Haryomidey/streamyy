import { Schema, type HydratedDocument, type Model, type Mongoose } from "mongoose";
import {
  STREAMMY_CALL_STATUSES,
  STREAMMY_CALL_TYPES,
  type CallSessionRecord,
} from "../domain/call.js";

export type CallSessionDocument = HydratedDocument<CallSessionRecord>;

const callSessionSchema = new Schema<CallSessionRecord>(
  {
    callId: { type: String, required: true, unique: true, index: true },
    callerId: { type: String, required: true, index: true },
    receiverId: { type: String, required: true, index: true },
    callType: { type: String, required: true, enum: STREAMMY_CALL_TYPES },
    status: { type: String, required: true, enum: STREAMMY_CALL_STATUSES, index: true },
    startedAt: { type: Date },
    endedAt: { type: Date },
    duration: { type: Number },
    endedBy: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    collection: "streammy_call_sessions",
    timestamps: true,
  },
);

callSessionSchema.index({ callerId: 1, createdAt: -1 });
callSessionSchema.index({ receiverId: 1, createdAt: -1 });
callSessionSchema.index({ status: 1, updatedAt: -1 });

export const getCallSessionModel = (mongoose: Mongoose): Model<CallSessionRecord> => {
  return (
    (mongoose.models.CallSession as Model<CallSessionRecord> | undefined) ??
    mongoose.model<CallSessionRecord>("CallSession", callSessionSchema)
  );
};
