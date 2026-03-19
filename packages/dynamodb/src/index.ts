import type {
  CallSessionRecord,
  CallSessionRepository,
  PresenceRecord,
  SocketConnectionRecord,
  SocketConnectionRepository,
  StreammyPersistenceAdapter,
  UserPresenceRepository,
} from "@streammy/core";

export interface DynamoDbLikeClient {
  put<TItem>(params: { tableName: string; item: TItem }): Promise<void>;
  get<TItem>(params: { tableName: string; key: Record<string, string> }): Promise<TItem | null>;
  delete<TItem>(params: { tableName: string; key: Record<string, string> }): Promise<TItem | null>;
  query<TItem>(params: { tableName: string; indexName?: string; key: Record<string, string> }): Promise<TItem[]>;
}

export interface DynamoDbPersistenceOptions {
  client: DynamoDbLikeClient;
  tables?: {
    callSessions?: string;
    userPresence?: string;
    socketConnections?: string;
  };
}

const dynamoTables = (options: DynamoDbPersistenceOptions) => ({
  callSessions: options.tables?.callSessions ?? "streammy_call_sessions",
  userPresence: options.tables?.userPresence ?? "streammy_user_presence",
  socketConnections: options.tables?.socketConnections ?? "streammy_socket_connections",
});

class DynamoDbCallSessionRepository implements CallSessionRepository {
  public constructor(
    private readonly client: DynamoDbLikeClient,
    private readonly table: string,
  ) {}

  public async create(session: CallSessionRecord): Promise<CallSessionRecord> {
    await this.client.put({ tableName: this.table, item: session });
    return session;
  }

  public findByCallId(callId: string): Promise<CallSessionRecord | null> {
    return this.client.get({ tableName: this.table, key: { callId } });
  }

  public async update(callId: string, update: Partial<CallSessionRecord>): Promise<CallSessionRecord | null> {
    const current = await this.findByCallId(callId);
    if (!current) {
      return null;
    }

    const next = { ...current, ...update };
    await this.client.put({ tableName: this.table, item: next });
    return next;
  }
}

class DynamoDbUserPresenceRepository implements UserPresenceRepository {
  public constructor(
    private readonly client: DynamoDbLikeClient,
    private readonly table: string,
  ) {}

  public async upsert(record: PresenceRecord): Promise<PresenceRecord> {
    await this.client.put({ tableName: this.table, item: record });
    return record;
  }

  public findByUserId(userId: string): Promise<PresenceRecord | null> {
    return this.client.get({ tableName: this.table, key: { userId } });
  }
}

class DynamoDbSocketConnectionRepository implements SocketConnectionRepository {
  public constructor(
    private readonly client: DynamoDbLikeClient,
    private readonly table: string,
  ) {}

  public async upsert(record: SocketConnectionRecord): Promise<SocketConnectionRecord> {
    await this.client.put({ tableName: this.table, item: record });
    return record;
  }

  public deleteByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null> {
    return this.client.delete({ tableName: this.table, key: { connectionId } });
  }

  public findByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null> {
    return this.client.get({ tableName: this.table, key: { connectionId } });
  }

  public findByUserId(userId: string): Promise<SocketConnectionRecord[]> {
    return this.client.query({ tableName: this.table, indexName: "userId", key: { userId } });
  }

  public async countByUserId(userId: string): Promise<number> {
    const results = await this.findByUserId(userId);
    return results.length;
  }
}

export const createDynamoDbPersistenceAdapter = (
  options: DynamoDbPersistenceOptions,
): StreammyPersistenceAdapter => {
  const tables = dynamoTables(options);
  return {
    sessions: new DynamoDbCallSessionRepository(options.client, tables.callSessions),
    presence: new DynamoDbUserPresenceRepository(options.client, tables.userPresence),
    connections: new DynamoDbSocketConnectionRepository(options.client, tables.socketConnections),
  };
};
