export class InMemoryCallSessionRepository {
    sessions = new Map();
    async create(session) {
        const created = { ...session };
        this.sessions.set(session.callId, created);
        return { ...created };
    }
    async findByCallId(callId) {
        const session = this.sessions.get(callId);
        return session ? { ...session } : null;
    }
    async update(callId, update) {
        const current = this.sessions.get(callId);
        if (!current) {
            return null;
        }
        const next = { ...current, ...update };
        this.sessions.set(callId, next);
        return { ...next };
    }
}
export class InMemoryUserPresenceRepository {
    presence = new Map();
    async upsert(record) {
        const next = { ...record };
        this.presence.set(record.userId, next);
        return { ...next };
    }
    async findByUserId(userId) {
        const record = this.presence.get(userId);
        return record ? { ...record } : null;
    }
}
export class InMemorySocketConnectionRepository {
    connections = new Map();
    async upsert(record) {
        const next = { ...record };
        this.connections.set(record.connectionId, next);
        return { ...next };
    }
    async deleteByConnectionId(connectionId) {
        const current = this.connections.get(connectionId);
        if (!current) {
            return null;
        }
        this.connections.delete(connectionId);
        return { ...current };
    }
    async findByConnectionId(connectionId) {
        const current = this.connections.get(connectionId);
        return current ? { ...current } : null;
    }
    async findByUserId(userId) {
        return [...this.connections.values()]
            .filter((connection) => connection.userId === userId)
            .map((connection) => ({ ...connection }));
    }
    async countByUserId(userId) {
        let count = 0;
        for (const connection of this.connections.values()) {
            if (connection.userId === userId) {
                count += 1;
            }
        }
        return count;
    }
}
export const createInMemoryPersistenceAdapter = () => {
    return {
        sessions: new InMemoryCallSessionRepository(),
        presence: new InMemoryUserPresenceRepository(),
        connections: new InMemorySocketConnectionRepository(),
    };
};
//# sourceMappingURL=in-memory-repositories.js.map