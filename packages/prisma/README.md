# @streamyy/prisma

Prisma persistence adapter for Streamyy.

## Install

```bash
npm install @streamyy/server @streamyy/prisma
```

## Usage

```ts
import { createPrismaPersistenceAdapter } from "@streamyy/prisma";
import { createStreammyServer } from "@streamyy/server";

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
