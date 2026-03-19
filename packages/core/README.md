# @streamyy/core

Core domain package for Streamyy.

It contains the shared call types, signaling events, repository interfaces, in-memory persistence adapter, and the service that drives the call lifecycle.

## Install

```bash
npm install @streamyy/core
```

## Includes

- call session and presence types
- socket event names
- repository and notifier interfaces
- in-memory repositories
- call lifecycle service factory

## Usage

```ts
import { createInMemoryPersistenceAdapter, createStreammyService } from "@streamyy/core";

const persistence = createInMemoryPersistenceAdapter();

const service = createStreammyService({
  sessions: persistence.sessions,
  presence: persistence.presence,
  connections: persistence.connections,
  notifier: {
    async emitToUser() {},
    async emitToConnection() {},
  },
});
```

See the workspace root `README.md` for the full backend and frontend integration guide.
