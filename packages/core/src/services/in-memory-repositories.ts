import type {
  CallSessionRecord,
  PresenceRecord,
  SocketConnectionRecord,
} from "../domain/call.js";
import type {
  CallSessionRepository,
  SocketConnectionRepository,
  StreammyPersistenceAdapter,
  UserPresenceRepository,
} from "../domain/interfaces.js";

export class InMemoryCallSessionRepository implements CallSessionRepository {
  private readonly sessions = new Map<string, CallSessionRecord>();

  public async create(session: CallSessionRecord): Promise<CallSessionRecord> {
    const created = { ...session };
    this.sessions.set(session.callId, created);
    return { ...created };
  }

  public async findByCallId(callId: string): Promise<CallSessionRecord | null> {
    const session = this.sessions.get(callId);
    return session ? { ...session } : null;
  }

  public async update(
    callId: string,
    update: Partial<CallSessionRecord>,
  ): Promise<CallSessionRecord | null> {
    const current = this.sessions.get(callId);
    if (!current) {
      return null;
    }

    const next = { ...current, ...update };
    this.sessions.set(callId, next);
    return { ...next };
  }
}

export class InMemoryUserPresenceRepository implements UserPresenceRepository {
  private readonly presence = new Map<string, PresenceRecord>();

  public async upsert(record: PresenceRecord): Promise<PresenceRecord> {
    const next = { ...record };
    this.presence.set(record.userId, next);
    return { ...next };
  }

  public async findByUserId(userId: string): Promise<PresenceRecord | null> {
    const record = this.presence.get(userId);
    return record ? { ...record } : null;
  }
}

export class InMemorySocketConnectionRepository implements SocketConnectionRepository {
  private readonly connections = new Map<string, SocketConnectionRecord>();

  public async upsert(record: SocketConnectionRecord): Promise<SocketConnectionRecord> {
    const next = { ...record };
    this.connections.set(record.connectionId, next);
    return { ...next };
  }

  public async deleteByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null> {
    const current = this.connections.get(connectionId);
    if (!current) {
      return null;
    }

    this.connections.delete(connectionId);
    return { ...current };
  }

  public async findByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null> {
    const current = this.connections.get(connectionId);
    return current ? { ...current } : null;
  }

  public async findByUserId(userId: string): Promise<SocketConnectionRecord[]> {
    return [...this.connections.values()]
      .filter((connection) => connection.userId === userId)
      .map((connection) => ({ ...connection }));
  }

  public async countByUserId(userId: string): Promise<number> {
    let count = 0;
    for (const connection of this.connections.values()) {
      if (connection.userId === userId) {
        count += 1;
      }
    }

    return count;
  }
}

export const createInMemoryPersistenceAdapter = (): StreammyPersistenceAdapter => {
  return {
    sessions: new InMemoryCallSessionRepository(),
    presence: new InMemoryUserPresenceRepository(),
    connections: new InMemorySocketConnectionRepository(),
  };
};