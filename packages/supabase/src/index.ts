import type {
  CallSessionRecord,
  CallSessionRepository,
  PresenceRecord,
  SocketConnectionRecord,
  SocketConnectionRepository,
  StreammyPersistenceAdapter,
  UserPresenceRepository,
} from "@streamyy/core";

export interface SupabaseTableClient<TRecord> {
  insert(values: TRecord): Promise<{ data: TRecord | null; error: unknown | null }>;
  upsert(values: TRecord, options?: { onConflict?: string }): Promise<{ data: TRecord | null; error: unknown | null }>;
  update(values: Partial<TRecord>): {
    eq(column: string, value: string): Promise<{ data: TRecord[] | null; error: unknown | null }>;
  };
  delete(): {
    eq(column: string, value: string): Promise<{ data: TRecord[] | null; error: unknown | null }>;
  };
  select(columns?: string): {
    eq(column: string, value: string): {
      maybeSingle(): Promise<{ data: TRecord | null; error: unknown | null }>;
    };
  };
}

export interface SupabasePersistenceOptions {
  callSession: SupabaseTableClient<CallSessionRecord>;
  userPresence: SupabaseTableClient<PresenceRecord>;
  socketConnection: SupabaseTableClient<SocketConnectionRecord>;
}

const assertNoError = (error: unknown): void => {
  if (error) {
    throw error;
  }
};

class SupabaseCallSessionRepository implements CallSessionRepository {
  public constructor(private readonly table: SupabaseTableClient<CallSessionRecord>) {}

  public async create(session: CallSessionRecord): Promise<CallSessionRecord> {
    const { error } = await this.table.insert(session);
    assertNoError(error);
    return session;
  }

  public async findByCallId(callId: string): Promise<CallSessionRecord | null> {
    const { data, error } = await this.table.select("*").eq("callId", callId).maybeSingle();
    assertNoError(error);
    return data;
  }

  public async update(callId: string, update: Partial<CallSessionRecord>): Promise<CallSessionRecord | null> {
    const { data, error } = await this.table.update(update).eq("callId", callId);
    assertNoError(error);
    return data?.[0] ?? null;
  }
}

class SupabaseUserPresenceRepository implements UserPresenceRepository {
  public constructor(private readonly table: SupabaseTableClient<PresenceRecord>) {}

  public async upsert(record: PresenceRecord): Promise<PresenceRecord> {
    const { error } = await this.table.upsert(record, { onConflict: "userId" });
    assertNoError(error);
    return record;
  }

  public async findByUserId(userId: string): Promise<PresenceRecord | null> {
    const { data, error } = await this.table.select("*").eq("userId", userId).maybeSingle();
    assertNoError(error);
    return data;
  }
}

class SupabaseSocketConnectionRepository implements SocketConnectionRepository {
  public constructor(private readonly table: SupabaseTableClient<SocketConnectionRecord>) {}

  public async upsert(record: SocketConnectionRecord): Promise<SocketConnectionRecord> {
    const { error } = await this.table.upsert(record, { onConflict: "connectionId" });
    assertNoError(error);
    return record;
  }

  public async deleteByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null> {
    const existing = await this.findByConnectionId(connectionId);
    if (!existing) {
      return null;
    }

    const { error } = await this.table.delete().eq("connectionId", connectionId);
    assertNoError(error);
    return existing;
  }

  public async findByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null> {
    const { data, error } = await this.table.select("*").eq("connectionId", connectionId).maybeSingle();
    assertNoError(error);
    return data;
  }

  public async findByUserId(userId: string): Promise<SocketConnectionRecord[]> {
    const { data, error } = await this.table.select("*").eq("userId", userId).maybeSingle();
    assertNoError(error);
    return data ? [data] : [];
  }

  public async countByUserId(userId: string): Promise<number> {
    const connections = await this.findByUserId(userId);
    return connections.length;
  }
}

export const createSupabasePersistenceAdapter = (
  options: SupabasePersistenceOptions,
): StreammyPersistenceAdapter => {
  return {
    sessions: new SupabaseCallSessionRepository(options.callSession),
    presence: new SupabaseUserPresenceRepository(options.userPresence),
    connections: new SupabaseSocketConnectionRepository(options.socketConnection),
  };
};
