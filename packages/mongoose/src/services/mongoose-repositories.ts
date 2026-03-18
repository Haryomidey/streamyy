import type { Model } from "mongoose";
import type {
  CallSessionRecord,
  CallSessionRepository,
  PresenceRecord,
  SocketConnectionRecord,
  SocketConnectionRepository,
  UserPresenceRepository,
} from "@streammy/core";

export class MongooseCallSessionRepository implements CallSessionRepository {
  public constructor(private readonly model: Model<CallSessionRecord>) {}

  public async create(session: CallSessionRecord): Promise<CallSessionRecord> {
    const created = await this.model.create(session);
    return created.toObject();
  }

  public async findByCallId(callId: string): Promise<CallSessionRecord | null> {
    return this.model.findOne({ callId }).lean<CallSessionRecord>().exec();
  }

  public async update(
    callId: string,
    update: Partial<CallSessionRecord>,
  ): Promise<CallSessionRecord | null> {
    return this.model
      .findOneAndUpdate({ callId }, update, { new: true, lean: true })
      .exec();
  }
}

export class MongooseUserPresenceRepository implements UserPresenceRepository {
  public constructor(private readonly model: Model<PresenceRecord>) {}

  public async upsert(record: PresenceRecord): Promise<PresenceRecord> {
    const updated = await this.model
      .findOneAndUpdate({ userId: record.userId }, record, {
        upsert: true,
        new: true,
        lean: true,
      })
      .exec();

    return updated as PresenceRecord;
  }

  public async findByUserId(userId: string): Promise<PresenceRecord | null> {
    return this.model.findOne({ userId }).lean<PresenceRecord>().exec();
  }
}

export class MongooseSocketConnectionRepository implements SocketConnectionRepository {
  public constructor(private readonly model: Model<SocketConnectionRecord>) {}

  public async upsert(record: SocketConnectionRecord): Promise<SocketConnectionRecord> {
    const updated = await this.model
      .findOneAndUpdate({ connectionId: record.connectionId }, record, {
        upsert: true,
        new: true,
        lean: true,
      })
      .exec();

    return updated as SocketConnectionRecord;
  }

  public async deleteByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null> {
    return this.model.findOneAndDelete({ connectionId }).lean<SocketConnectionRecord>().exec();
  }

  public async findByConnectionId(connectionId: string): Promise<SocketConnectionRecord | null> {
    return this.model.findOne({ connectionId }).lean<SocketConnectionRecord>().exec();
  }

  public async findByUserId(userId: string): Promise<SocketConnectionRecord[]> {
    return this.model.find({ userId }).lean<SocketConnectionRecord[]>().exec();
  }

  public async countByUserId(userId: string): Promise<number> {
    return this.model.countDocuments({ userId }).exec();
  }
}
