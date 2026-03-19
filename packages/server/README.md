# @streamyy/server

Backend runtime package for Streamyy.

It provides the Socket.IO signaling transport, runtime bootstrap helpers, and lightweight framework adapters for Express, Fastify, and Nest-style setups.

## Install

```bash
npm install @streamyy/server socket.io
```

## Usage

```ts
import { createServer } from "node:http";
import { createStreammyRuntime } from "@streamyy/server";

const httpServer = createServer();

const streammy = createStreammyRuntime({
  httpServer,
  auth: async () => ({ userId: "user-1", deviceId: "device-1" }),
});

streammy.bind();
httpServer.listen(3000);
```

## Includes

- Socket.IO signaling event binding
- runtime creation with in-memory persistence by default
- Express adapter
- Fastify adapter
- Nest-style module helpers

See the workspace root `README.md` for end-to-end usage with persistence adapters.
