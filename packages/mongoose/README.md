# @streammy/mongoose

MongoDB/Mongoose persistence adapter for Streamyy.

## Install

```bash
npm install @streammy/server @streammy/mongoose mongoose
```

## Usage

```ts
import mongoose from "mongoose";
import { createServer } from "node:http";
import { createMongoosePersistenceAdapter } from "@streammy/mongoose";
import { createStreammyServer } from "@streammy/server";

await mongoose.connect(process.env.MONGODB_URI!);

const httpServer = createServer();

const streammy = createStreammyServer({
  httpServer,
  persistence: createMongoosePersistenceAdapter(mongoose),
});
```

## What it provides

- Call session model
- User presence model
- Socket connection model
- Mongoose repository implementations
- `createMongoosePersistenceAdapter(...)`
