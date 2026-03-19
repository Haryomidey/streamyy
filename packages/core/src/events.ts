import { EventEmitter } from "node:events";
import type { TypedEventBus } from "./domain/interfaces.js";

export const createEventBus = (): TypedEventBus => {
  return new EventEmitter() as TypedEventBus;
};