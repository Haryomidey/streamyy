import type {
  CallSessionRecord,
  CallSessionRepository,
  PresenceRecord,
  SocketConnectionRecord,
  SocketConnectionRepository,
  StreammyPersistenceAdapter,
  UserPresenceRepository,
} from "@streammy/core";

export interface RedisLikeClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  del(key: string): Promise<unknown>;
  sAdd(key: string, member: string): Promise<unknown>;
  sRem(key: string, member: string): Promise<unknown>;
  sMembers(key: string): Promise<string[]>;
  sCard(key: string): Promise<number>;
}

export interface RedisPersistenceOptions {
  client: RedisLikeClient;
  prefix?: string;
}

const prefixKey = (prefix: string, key: string): string => `${prefix}:${key}`;
const parse = <TValue>(value: string | null): TValue | null => (value ? (JSON.parse(value) as TValue) : null);

class RedisCallSessionRepository implements CallSessionRepository {
  public constructor(private readonly client: RedisLikeClient, private readonly prefix: string) {}

  public async create(session: CallSessionRecord): Promise<CallSessionRecord> {
    await this.client.set(prefixKey(this.prefix, `call:${session.callId}`), JSON.stringify(session));
    return session;
  }

  public findByCallId(callId: string): Promise<CallSessionRecord | null> {
    return this.client
      .get(prefixKey(this.prefix, `call:${callId}`))
      .then((value) => parse<CallSessionRecord>(value));
  }

  public async update(callId: string, update: Partial<CallSessionRecord>): Promise<CallSessionRecord | null> {
    const current = await this.findByCallId(callId);
    if (!current) {
      return null;
    }

    const next = { ...current, ...update };
    await this.client.set(prefixKey(this.prefix, `call:${callId}`), JSON.stringify(next));
    return next;
  }
}

class RedisUserPresenceRepository implements UserPresenceRepository {
  public constructor(private readonly client: RedisLikeClient, private readonly prefix: string) {}

  public async upsert(record: PresenceRecord): Promise<PresenceRecord> {
    await this.client.set(prefixKey(this.prefix, `presence:${record.userId}`), JSON.stringify(record));
    return record;
  }

  public findByUserId(userId: string): Promise<PresenceRecord | null> {
    return this.client
      .get(prefixKey(this.prefix, `presence:${userId}`))
      .then((value) => parse<PresenceRecord>(value));
  }
}

class RedisSocketConnectionRepository implements SocketConnectionRepository {
  public constructor(private readonly client: RedisLikeClient, private readonly prefix: string) {}

  public async upsert(record: SocketConnectionRecord): Promise<SocketConnectionRecord> {
    await this.client.set(prefixKey(this.prefix, `connection:${record.connectionId}`), JSON.stringify(record));
    await this.client.sAdd(prefixKey(this.prefix, `user-connections:${record.userId}`), record.connectionId);
    return record;
  }

  public async deleteByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null> {
    const current = await this.findByConnectionId(connectionId);
    if (!current) {
      return null;
    }

    await this.client.del(prefixKey(this.prefix, `connection:${connectionId}`));
    await this.client.sRem(prefixKey(this.prefix, `user-connections:${current.userId}`), connectionId);
    return current;
  }

  public findByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null> {
    return this.client
      .get(prefixKey(this.prefix, `connection:${connectionId}`))
      .then((value) => parse<SocketConnectionRecord>(value));
  }

  public async findByUserId(userId: string): Promise<SocketConnectionRecord[]> {
    const ids = await this.client.sMembers(prefixKey(this.prefix, `user-connections:${userId}`));
    const connections = await Promise.all(ids.map((id) => this.findByConnectionId(id)));
    return connections.filter((connection): connection is SocketConnectionRecord => connection !== null);
  }

  public countByUserId(userId: string): Promise<number> {
    return this.client.sCard(prefixKey(this.prefix, `user-connections:${userId}`));
  }
}

export const createRedisPersistenceAdapter = (
  options: RedisPersistenceOptions,
): StreammyPersistenceAdapter => {
  const prefix = options.prefix ?? "streammy";
  return {
    sessions: new RedisCallSessionRepository(options.client, prefix),
    presence: new RedisUserPresenceRepository(options.client, prefix),
    connections: new RedisSocketConnectionRepository(options.client, prefix),
  };
};