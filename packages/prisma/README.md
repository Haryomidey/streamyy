# @streammy/prisma

Prisma persistence adapter for Streamyy.

## Install

```bash
npm install @streammy/server @streammy/prisma
```

## Usage

```ts
import { createPrismaPersistenceAdapter } from "@streammy/prisma";
import { createStreammyServer } from "@streammy/server";

const streammy = createStreammyServer({
  httpServer,
  persistence: createPrismaPersistenceAdapter({
    callSession: prisma.callSession,
    userPresence: prisma.userPresence,
    socketConnection: prisma.socketConnection,
  }),
});
```

## Prisma schema example

See [schema.prisma](C:/Users/USER/Desktop/programming/javascript/packages/streamyy/packages/prisma/examples/schema.prisma).
