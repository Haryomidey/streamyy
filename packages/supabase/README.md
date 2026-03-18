# @streammy/supabase

Supabase persistence adapter for Streamyy.

## Install

```bash
npm install @streammy/server @streammy/supabase @supabase/supabase-js
```

## Usage

```ts
import { createClient } from "@supabase/supabase-js";
import { createSupabasePersistenceAdapter } from "@streammy/supabase";
import { createStreammyServer } from "@streammy/server";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const streammy = createStreammyServer({
  httpServer,
  persistence: createSupabasePersistenceAdapter({
    callSession: supabase.from("streammy_call_sessions"),
    userPresence: supabase.from("streammy_user_presence"),
    socketConnection: supabase.from("streammy_socket_connections"),
  }),
});
```

## SQL schema

See [schema.sql](C:/Users/USER/Desktop/programming/javascript/packages/streamyy/packages/supabase/examples/schema.sql).
