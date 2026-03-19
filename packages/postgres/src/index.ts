import type {
  CallSessionRecord,
  CallSessionRepository,
  PresenceRecord,
  SocketConnectionRecord,
  SocketConnectionRepository,
  StreammyPersistenceAdapter,
  UserPresenceRepository,
} from "@streammy/core";

export interface PostgresQueryClient {
  query<TResult = Record<string, unknown>>(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: TResult[] }>;
}

export interface PostgresPersistenceOptions {
  client: PostgresQueryClient;
  tables?: {
    callSessions?: string;
    userPresence?: string;
    socketConnections?: string;
  };
}

const tableNames = (options: PostgresPersistenceOptions) => ({
  callSessions: options.tables?.callSessions ?? "streammy_call_sessions",
  userPresence: options.tables?.userPresence ?? "streammy_user_presence",
  socketConnections: options.tables?.socketConnections ?? "streammy_socket_connections",
});

const toJson = (value: unknown): string | null => {
  return value === undefined ? null : JSON.stringify(value);
};

class PostgresCallSessionRepository implements CallSessionRepository {
  public constructor(
    private readonly client: PostgresQueryClient,
    private readonly table: string,
  ) {}

  public async create(session: CallSessionRecord): Promise<CallSessionRecord> {
    await this.client.query(
      `insert into ${this.table}
      (call_id, caller_id, receiver_id, call_type, status, started_at, ended_at, duration, ended_by, metadata)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)`,
      [
        session.callId,
        session.callerId,
        session.receiverId,
        session.callType,
        session.status,
        session.startedAt ?? null,
        session.endedAt ?? null,
        session.duration ?? null,
        session.endedBy ?? null,
        toJson(session.metadata),
      ],
    );

    return session;
  }

  public async findByCallId(callId: string): Promise<CallSessionRecord | null> {
    const result = await this.client.query<CallSessionRecord>(
      `select
        call_id as "callId",
        caller_id as "callerId",
        receiver_id as "receiverId",
        call_type as "callType",
        status,
        started_at as "startedAt",
        ended_at as "endedAt",
        duration,
        ended_by as "endedBy",
        metadata
      from ${this.table}
      where call_id = $1
      limit 1`,
      [callId],
    );

    return result.rows[0] ?? null;
  }

  public async update(callId: string, update: Partial<CallSessionRecord>): Promise<CallSessionRecord | null> {
    const current = await this.findByCallId(callId);
    if (!current) {
      return null;
    }

    const next = { ...current, ...update };
    await this.client.query(
      `update ${this.table}
      set caller_id = $2, receiver_id = $3, call_type = $4, status = $5, started_at = $6, ended_at = $7, duration = $8, ended_by = $9, metadata = $10::jsonb
      where call_id = $1`,
      [
        callId,
        next.callerId,
        next.receiverId,
        next.callType,
        next.status,
        next.startedAt ?? null,
        next.endedAt ?? null,
        next.duration ?? null,
        next.endedBy ?? null,
        toJson(next.metadata),
      ],
    );

    return next;
  }
}

class PostgresUserPresenceRepository implements UserPresenceRepository {
  public constructor(
    private readonly client: PostgresQueryClient,
    private readonly table: string,
  ) {}

  public async upsert(record: PresenceRecord): Promise<PresenceRecord> {
    await this.client.query(
      `insert into ${this.table} (user_id, status, last_seen_at, metadata, active_connections)
      values ($1,$2,$3,$4::jsonb,$5)
      on conflict (user_id)
      do update set status = excluded.status, last_seen_at = excluded.last_seen_at, metadata = excluded.metadata, active_connections = excluded.active_connections`,
      [record.userId, record.status, record.lastSeenAt, toJson(record.metadata), record.activeConnections],
    );

    return record;
  }

  public async findByUserId(userId: string): Promise<PresenceRecord | null> {
    const result = await this.client.query<PresenceRecord>(
      `select
        user_id as "userId",
        status,
        last_seen_at as "lastSeenAt",
        metadata,
        active_connections as "activeConnections"
      from ${this.table}
      where user_id = $1
      limit 1`,
      [userId],
    );

    return result.rows[0] ?? null;
  }
}

class PostgresSocketConnectionRepository implements SocketConnectionRepository {
  public constructor(
    private readonly client: PostgresQueryClient,
    private readonly table: string,
  ) {}

  public async upsert(record: SocketConnectionRecord): Promise<SocketConnectionRecord> {
    await this.client.query(
      `insert into ${this.table} (connection_id, user_id, device_id, connected_at, last_seen_at, metadata)
      values ($1,$2,$3,$4,$5,$6::jsonb)
      on conflict (connection_id)
      do update set user_id = excluded.user_id, device_id = excluded.device_id, connected_at = excluded.connected_at, last_seen_at = excluded.last_seen_at, metadata = excluded.metadata`,
      [
        record.connectionId,
        record.userId,
        record.deviceId,
        record.connectedAt,
        record.lastSeenAt,
        toJson(record.metadata),
      ],
    );

    return record;
  }

  public async deleteByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null> {
    const current = await this.findByConnectionId(connectionId);
    if (!current) {
      return null;
    }

    await this.client.query(`delete from ${this.table} where connection_id = $1`, [connectionId]);
    return current;
  }

  public async findByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null> {
    const result = await this.client.query<SocketConnectionRecord>(
      `select
        connection_id as "connectionId",
        user_id as "userId",
        device_id as "deviceId",
        connected_at as "connectedAt",
        last_seen_at as "lastSeenAt",
        metadata
      from ${this.table}
      where connection_id = $1
      limit 1`,
      [connectionId],
    );

    return result.rows[0] ?? null;
  }

  public async findByUserId(userId: string): Promise<SocketConnectionRecord[]> {
    const result = await this.client.query<SocketConnectionRecord>(
      `select
        connection_id as "connectionId",
        user_id as "userId",
        device_id as "deviceId",
        connected_at as "connectedAt",
        last_seen_at as "lastSeenAt",
        metadata
      from ${this.table}
      where user_id = $1`,
      [userId],
    );

    return result.rows;
  }

  public async countByUserId(userId: string): Promise<number> {
    const result = await this.client.query<{ count: string }>(
      `select count(*)::text as count from ${this.table} where user_id = $1`,
      [userId],
    );

    return Number(result.rows[0]?.count ?? 0);
  }
}

export const createPostgresPersistenceAdapter = (
  options: PostgresPersistenceOptions,
): StreammyPersistenceAdapter => {
  const tables = tableNames(options);
  return {
    sessions: new PostgresCallSessionRepository(options.client, tables.callSessions),
    presence: new PostgresUserPresenceRepository(options.client, tables.userPresence),
    connections: new PostgresSocketConnectionRepository(options.client, tables.socketConnections),
  };
};
