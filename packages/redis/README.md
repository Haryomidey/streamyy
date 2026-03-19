# @streamyy/redis

Redis persistence adapter for Streamyy.

## Install

```bash
npm install @streamyy/server @streamyy/redis redis
```

## Usage

```ts
import { createClient } from "redis";
import { createRedisPersistenceAdapter } from "@streamyy/redis";
import { createStreammyServer } from "@streamyy/server";

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

const streammy = createStreammyServer({
  httpServer,
  persistence: createRedisPersistenceAdapter({
    client: redis,
  }),
});
```

## Good fit

- lightweight deployments
- fast presence and connection tracking
- short-lived call state
