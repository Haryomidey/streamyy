import type {
  CallSessionRecord,
  CallSessionRepository,
  PresenceRecord,
  SocketConnectionRecord,
  SocketConnectionRepository,
  StreammyPersistenceAdapter,
  UserPresenceRepository,
} from "@streamyy/core";

type WhereByKey<TKey extends string> = { where: Record<TKey, string> };

export interface PrismaModelDelegate<TRecord, TKey extends string> {
  create(args: { data: TRecord }): Promise<TRecord>;
  findUnique(args: WhereByKey<TKey>): Promise<TRecord | null>;
  update(args: { where: Record<TKey, string>; data: Partial<TRecord> }): Promise<TRecord>;
}

export interface PrismaUpsertDelegate<TRecord, TKey extends string> extends PrismaModelDelegate<TRecord, TKey> {
  upsert(args: { where: Record<TKey, string>; create: TRecord; update: Partial<TRecord> }): Promise<TRecord>;
}

export interface PrismaListDelegate<TRecord, TKey extends string> extends PrismaUpsertDelegate<TRecord, TKey> {
  delete(args: WhereByKey<TKey>): Promise<TRecord>;
  findMany(args: { where: Record<string, unknown> }): Promise<TRecord[]>;
  count(args: { where: Record<string, unknown> }): Promise<number>;
}

export interface PrismaPersistenceOptions {
  callSession: PrismaModelDelegate<CallSessionRecord, "callId">;
  userPresence: PrismaUpsertDelegate<PresenceRecord, "userId">;
  socketConnection: PrismaListDelegate<SocketConnectionRecord, "connectionId">;
}

class PrismaCallSessionRepository implements CallSessionRepository {
  public constructor(private readonly delegate: PrismaPersistenceOptions["callSession"]) {}

  public create(session: CallSessionRecord): Promise<CallSessionRecord> {
    return this.delegate.create({ data: session });
  }

  public findByCallId(callId: string): Promise<CallSessionRecord | null> {
    return this.delegate.findUnique({ where: { callId } });
  }

  public async update(
    callId: string,
    update: Partial<CallSessionRecord>,
  ): Promise<CallSessionRecord | null> {
    try {
      return await this.delegate.update({ where: { callId }, data: update });
    } catch {
      return null;
    }
  }
}

class PrismaUserPresenceRepository implements UserPresenceRepository {
  public constructor(private readonly delegate: PrismaPersistenceOptions["userPresence"]) {}

  public upsert(record: PresenceRecord): Promise<PresenceRecord> {
    return this.delegate.upsert({
      where: { userId: record.userId },
      create: record,
      update: record,
    });
  }

  public findByUserId(userId: string): Promise<PresenceRecord | null> {
    return this.delegate.findUnique({ where: { userId } });
  }
}

class PrismaSocketConnectionRepository implements SocketConnectionRepository {
  public constructor(private readonly delegate: PrismaPersistenceOptions["socketConnection"]) {}

  public upsert(record: SocketConnectionRecord): Promise<SocketConnectionRecord> {
    return this.delegate.upsert({
      where: { connectionId: record.connectionId },
      create: record,
      update: record,
    });
  }

  public async deleteByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null> {
    try {
      return await this.delegate.delete({ where: { connectionId } });
    } catch {
      return null;
    }
  }

  public findByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null> {
    return this.delegate.findUnique({ where: { connectionId } });
  }

  public findByUserId(userId: string): Promise<SocketConnectionRecord[]> {
    return this.delegate.findMany({ where: { userId } });
  }

  public countByUserId(userId: string): Promise<number> {
    return this.delegate.count({ where: { userId } });
  }
}

export const createPrismaPersistenceAdapter = (
  options: PrismaPersistenceOptions,
): StreammyPersistenceAdapter => {
  return {
    sessions: new PrismaCallSessionRepository(options.callSession),
    presence: new PrismaUserPresenceRepository(options.userPresence),
    connections: new PrismaSocketConnectionRepository(options.socketConnection),
  };
};
