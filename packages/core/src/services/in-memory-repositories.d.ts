import type { CallSessionRecord, PresenceRecord, SocketConnectionRecord } from "../domain/call.js";
import type { CallSessionRepository, SocketConnectionRepository, StreammyPersistenceAdapter, UserPresenceRepository } from "../domain/interfaces.js";
export declare class InMemoryCallSessionRepository implements CallSessionRepository {
    private readonly sessions;
    create(session: CallSessionRecord): Promise<CallSessionRecord>;
    findByCallId(callId: string): Promise<CallSessionRecord | null>;
    update(callId: string, update: Partial<CallSessionRecord>): Promise<CallSessionRecord | null>;
}
export declare class InMemoryUserPresenceRepository implements UserPresenceRepository {
    private readonly presence;
    upsert(record: PresenceRecord): Promise<PresenceRecord>;
    findByUserId(userId: string): Promise<PresenceRecord | null>;
}
export declare class InMemorySocketConnectionRepository implements SocketConnectionRepository {
    private readonly connections;
    upsert(record: SocketConnectionRecord): Promise<SocketConnectionRecord>;
    deleteByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null>;
    findByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null>;
    findByUserId(userId: string): Promise<SocketConnectionRecord[]>;
    countByUserId(userId: string): Promise<number>;
}
export declare const createInMemoryPersistenceAdapter: () => StreammyPersistenceAdapter;
//# sourceMappingURL=in-memory-repositories.d.ts.map