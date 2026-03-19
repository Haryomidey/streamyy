import type { Mongoose } from "mongoose";
import type { StreammyPersistenceAdapter } from "@streamyy/core";
import { createStreammyModels } from "../models/index.js";
import {
  MongooseCallSessionRepository,
  MongooseSocketConnectionRepository,
  MongooseUserPresenceRepository,
} from "./mongoose-repositories.js";

export const createMongoosePersistenceAdapter = (mongoose: Mongoose): StreammyPersistenceAdapter => {
  const models = createStreammyModels(mongoose);

  return {
    sessions: new MongooseCallSessionRepository(models.CallSession),
    presence: new MongooseUserPresenceRepository(models.UserPresence),
    connections: new MongooseSocketConnectionRepository(models.SocketConnection),
  };
};
