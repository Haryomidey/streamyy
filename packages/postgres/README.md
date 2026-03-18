# @streammy/postgres

PostgreSQL persistence adapter for Streamyy.

## Install

```bash
npm install @streammy/server @streammy/postgres pg
```

## Usage

```ts
import { Pool } from "pg";
import { createPostgresPersistenceAdapter } from "@streammy/postgres";
import { createStreammyServer } from "@streammy/server";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const streammy = createStreammyServer({
  httpServer,
  persistence: createPostgresPersistenceAdapter({
    client: pool,
  }),
});
```

## SQL schema

See [schema.sql](C:/Users/USER/Desktop/programming/javascript/packages/streamyy/packages/postgres/examples/schema.sql).
