import type { Mongoose } from "mongoose";
import { getCallSessionModel } from "./call-session.js";
import { getSocketConnectionModel } from "./socket-connection.js";
import { getUserPresenceModel } from "./user-presence.js";

export const createStreammyModels = (mongoose: Mongoose) => {
  return {
    CallSession: getCallSessionModel(mongoose),
    UserPresence: getUserPresenceModel(mongoose),
    SocketConnection: getSocketConnectionModel(mongoose),
  };
};
