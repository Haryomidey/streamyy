declare module "mongoose" {
  export type HydratedDocument<T> = T & { toObject(): T };

  export interface QueryLike<TResult> {
    lean<TLeanResult = TResult>(): QueryLike<TLeanResult>;
    exec(): Promise<TResult>;
  }

  export interface Model<T> {
    create(input: T): Promise<HydratedDocument<T>>;
    findOne(filter: Record<string, unknown>): QueryLike<T | null>;
    findOneAndUpdate(
      filter: Record<string, unknown>,
      update: Partial<T>,
      options: Record<string, unknown>,
    ): QueryLike<T | null>;
    findOneAndDelete(filter: Record<string, unknown>): QueryLike<T | null>;
    find(filter: Record<string, unknown>): QueryLike<T[]>;
    countDocuments(filter: Record<string, unknown>): { exec(): Promise<number> };
  }

  export interface Mongoose {
    models: Record<string, Model<any> | undefined>;
    model<T>(name: string, schema: Schema<T>): Model<T>;
  }

  export class Schema<T> {
    public static Types: {
      Mixed: unknown;
    };

    public constructor(definition: Record<string, unknown>, options?: Record<string, unknown>);
    public index(fields: Record<string, unknown>, options?: Record<string, unknown>): void;
  }
}
