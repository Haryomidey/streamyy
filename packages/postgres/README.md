# @streamyy/postgres

PostgreSQL persistence adapter for Streamyy.

## Install

```bash
npm install @streamyy/server @streamyy/postgres pg
```

## Usage

```ts
import { Pool } from "pg";
import { createPostgresPersistenceAdapter } from "@streamyy/postgres";
import { createStreammyServer } from "@streamyy/server";

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
