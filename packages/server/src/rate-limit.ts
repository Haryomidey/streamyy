import { StreammyError } from "@streamyy/core";

export interface StreammyRateLimitPolicy {
  max: number;
  windowMs: number;
}

export interface StreammyRateLimitOptions {
  connectionAttempts?: StreammyRateLimitPolicy;
  callInitiation?: StreammyRateLimitPolicy;
}

export interface StreammyRateLimitContext {
  userId?: string;
  ip?: string;
}

type RateLimitBucketName = "connectionAttempts" | "callInitiation";

interface BucketState {
  count: number;
  resetAt: number;
}

const createRateLimitKey = (bucket: RateLimitBucketName, context: StreammyRateLimitContext): string => {
  const userPart = context.userId && context.userId.length > 0 ? `user:${context.userId}` : "user:anonymous";
  const ipPart = context.ip && context.ip.length > 0 ? `ip:${context.ip}` : "ip:unknown";
  return `${bucket}:${userPart}:${ipPart}`;
};

export class InMemoryStreammyRateLimiter {
  private readonly buckets = new Map<string, BucketState>();

  public constructor(private readonly options: StreammyRateLimitOptions = {}) {}

  public assertConnectionAllowed(context: StreammyRateLimitContext): void {
    this.assertWithinPolicy("connectionAttempts", context, this.options.connectionAttempts, "Too many connection attempts. Please wait and try again.");
  }

  public assertCallInitiationAllowed(context: StreammyRateLimitContext): void {
    this.assertWithinPolicy("callInitiation", context, this.options.callInitiation, "Too many call attempts. Please wait before starting another call.");
  }

  private assertWithinPolicy(
    bucket: RateLimitBucketName,
    context: StreammyRateLimitContext,
    policy: StreammyRateLimitPolicy | undefined,
    message: string,
  ): void {
    if (!policy || policy.max < 1 || policy.windowMs < 1) {
      return;
    }

    const now = Date.now();
    const key = createRateLimitKey(bucket, context);
    const current = this.buckets.get(key);

    if (!current || current.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + policy.windowMs,
      });
      return;
    }

    if (current.count >= policy.max) {
      throw new StreammyError("RATE_LIMITED", message);
    }

    current.count += 1;
  }
}
