import type { TypedEventBus } from "./domain/interfaces.js";

class SimpleTypedEventBus implements TypedEventBus {
  private readonly listeners = new Map<string, Set<(payload: unknown) => void>>();

  public emit<TKey extends keyof import("./domain/events.js").StreammyCoreEvents>(
    event: TKey,
    payload: import("./domain/events.js").StreammyCoreEvents[TKey],
  ): boolean {
    const listeners = this.listeners.get(event);
    if (!listeners || listeners.size === 0) {
      return false;
    }

    for (const listener of listeners) {
      listener(payload);
    }

    return true;
  }

  public on<TKey extends keyof import("./domain/events.js").StreammyCoreEvents>(
    event: TKey,
    listener: (payload: import("./domain/events.js").StreammyCoreEvents[TKey]) => void,
  ): TypedEventBus {
    const bucket = this.listeners.get(event) ?? new Set<(payload: unknown) => void>();
    bucket.add(listener as (payload: unknown) => void);
    this.listeners.set(event, bucket);
    return this;
  }
}

export const createEventBus = (): TypedEventBus => {
  return new SimpleTypedEventBus();
};
