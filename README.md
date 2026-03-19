# Streamyy

Streamyy is a package-based calling infrastructure for 1-to-1 audio and video calls.

This repository is the source for the publishable packages.

The intended usage is simple:

- frontend developers install the frontend package
- backend developers install the backend package
- both sides communicate through the same signaling events and call lifecycle

Important:

- Streamyy handles signaling, call state, presence, and socket orchestration
- Streamyy does not process audio or video media on the server
- media still flows peer-to-peer through WebRTC
- persistence is adapter-based, so storage is not tied to MongoDB

## Packages

### `@streamyy/core`

Shared internal/backend package for:

- call session types
- call statuses
- repositories
- persistence adapters
- service lifecycle logic

### `@streamyy/mongoose`

Optional MongoDB/Mongoose adapter package for:

- Mongoose models
- Mongoose repositories
- `createMongoosePersistenceAdapter(...)`

### `@streamyy/prisma`

Optional Prisma adapter package for:

- Prisma-backed repositories
- `createPrismaPersistenceAdapter(...)`

### `@streamyy/postgres`

Optional PostgreSQL adapter package for:

- SQL-backed repositories
- `createPostgresPersistenceAdapter(...)`

### `@streamyy/redis`

Optional Redis adapter package for:

- lightweight ephemeral state
- fast presence and connection tracking
- `createRedisPersistenceAdapter(...)`

### `@streamyy/supabase`

Optional Supabase adapter package for:

- Supabase table-backed repositories
- `createSupabasePersistenceAdapter(...)`

### `@streamyy/dynamodb`

Optional DynamoDB adapter package for:

- DynamoDB-backed repositories
- `createDynamoDbPersistenceAdapter(...)`

## Supported Persistence Modes

Right now Streamyy supports:

- in-memory storage out of the box
- MongoDB through `@streamyy/mongoose`
- Prisma through `@streamyy/prisma`
- PostgreSQL through `@streamyy/postgres`
- Redis through `@streamyy/redis`
- Supabase through `@streamyy/supabase`
- DynamoDB through `@streamyy/dynamodb`
- custom adapters through the repository interfaces in `@streamyy/core`

That means you can support:

- Prisma
- PostgreSQL
- MySQL
- Redis
- Supabase
- DynamoDB
- your own custom persistence layer

Official adapter packages in this workspace:

- `@streamyy/mongoose`
- `@streamyy/prisma`
- `@streamyy/postgres`
- `@streamyy/redis`
- `@streamyy/supabase`
- `@streamyy/dynamodb`

Each adapter package now includes its own README and, where relevant, ready-to-copy schema examples.

### `@streamyy/server`

Backend package developers install.

Use it when you want:

- Socket.IO signaling transport
- runtime bootstrap
- Express integration
- Fastify integration
- Nest-style module integration
- 60-second ringing timeout by default
- persistence-agnostic backend setup

### `@streamyy/client`

Frontend package developers install.

Use it when you want:

- signaling client
- React hooks
- default install-ready UI
- ringtone support
- reconnect-aware connection state
- WebRTC helpers

## Who Installs What

### Backend developer

Install:

```bash
npm install @streamyy/server
```

What they get:

- runtime bootstrap
- signaling handlers
- call session management
- presence tracking
- HTTP helper routes

### Frontend developer

Install:

```bash
npm install @streamyy/client
```

What they get:

- `StreammyClient`
- `StreammyProvider`
- `useStreammy()`
- `StreammyCallWidget`
- `VideoStage`
- ringtone configuration
- WebRTC helper utilities

## Backend Usage

## 1. Create the runtime

This is the main backend entry point.

```ts
import { createServer } from "node:http";
import express from "express";
import { createStreammyServer, registerExpressStreammyRoutes } from "@streamyy/server";

const app = express();
app.use(express.json());

const httpServer = createServer(app);

const streammy = createStreammyServer({
  httpServer,
  ringingTimeoutMs: 60_000,
  socket: {
    cors: {
      origin: "*",
    },
  },
  auth: async (token, handshake) => {
    if (!token) {
      throw new Error("Missing auth token");
    }

    return {
      userId: "user_123",
      deviceId: "web_browser",
      metadata: {
        authSource: "jwt",
        handshake,
      },
    };
  },
});

streammy.bind();

registerExpressStreammyRoutes(app, {
  service: streammy.service,
  basePath: "/streammy",
});

httpServer.listen(4000);
```

What this does:

- creates the call service
- creates the Socket.IO server internally
- binds Socket.IO events internally
- handles authentication
- enables ringing timeout
- exposes optional HTTP routes
- uses in-memory storage by default unless you pass a persistence adapter

## 1a. Use MongoDB/Mongoose if you want persistent storage

If you want call history, presence persistence, and socket connection persistence across restarts, pass a Mongoose adapter.

```ts
import mongoose from "mongoose";
import { createServer } from "node:http";
import express from "express";
import { createMongoosePersistenceAdapter } from "@streamyy/mongoose";
import { createStreammyServer } from "@streamyy/server";

await mongoose.connect(process.env.MONGODB_URI!);

const app = express();
const httpServer = createServer(app);

const streammy = createStreammyServer({
  httpServer,
  persistence: createMongoosePersistenceAdapter(mongoose),
});
```

This means:

- `@streamyy/server` is storage-agnostic
- Mongoose is optional
- you can later add other adapters like Prisma, PostgreSQL, Redis, or your own custom repositories

Install for this option:

```bash
npm install @streamyy/server @streamyy/mongoose mongoose
```

## 1b. Use your own persistence adapter

If your app uses another database, implement the repository interfaces from `@streamyy/core` and pass them into the server runtime.

```ts
import {
  defineStreammyPersistenceAdapter,
  type CallSessionRepository,
  type SocketConnectionRepository,
  type UserPresenceRepository,
} from "@streamyy/core";
import { createStreammyServer } from "@streamyy/server";

const sessions: CallSessionRepository = {
  async create(session) {
    return session;
  },
  async findByCallId(callId) {
    return null;
  },
  async update(callId, update) {
    return null;
  },
};

const presence: UserPresenceRepository = {
  async upsert(record) {
    return record;
  },
  async findByUserId(userId) {
    return null;
  },
};

const connections: SocketConnectionRepository = {
  async upsert(record) {
    return record;
  },
  async deleteByConnectionId(connectionId) {
    return null;
  },
  async findByConnectionId(connectionId) {
    return null;
  },
  async findByUserId(userId) {
    return [];
  },
  async countByUserId(userId) {
    return 0;
  },
};

const persistence = defineStreammyPersistenceAdapter({
  sessions,
  presence,
  connections,
});

const streammy = createStreammyServer({
  httpServer,
  persistence,
});
```

What this gives you:

- Streamyy server logic stays the same
- only the storage adapter changes
- backend teams can keep using their existing database stack

## Example adapter ideas

### Prisma / PostgreSQL

Create:

- `PrismaCallSessionRepository`
- `PrismaUserPresenceRepository`
- `PrismaSocketConnectionRepository`

Then pass them as:

```ts
const persistence = defineStreammyPersistenceAdapter({
  sessions: new PrismaCallSessionRepository(prisma),
  presence: new PrismaUserPresenceRepository(prisma),
  connections: new PrismaSocketConnectionRepository(prisma),
});
```

### Redis

For lightweight ephemeral calling state, you can also implement repositories backed by Redis.

That can be useful when:

- you care more about speed than long-term history
- you want fast presence and socket tracking
- you want short-lived call session state

## Official adapter package examples

### Prisma

Install:

```bash
npm install @streamyy/server @streamyy/prisma
```

Usage:

```ts
import { createPrismaPersistenceAdapter } from "@streamyy/prisma";

const persistence = createPrismaPersistenceAdapter({
  callSession: prisma.callSession,
  userPresence: prisma.userPresence,
  socketConnection: prisma.socketConnection,
});

const streammy = createStreammyServer({
  httpServer,
  persistence,
});
```

### PostgreSQL

Install:

```bash
npm install @streamyy/server @streamyy/postgres pg
```

Usage:

```ts
import { Pool } from "pg";
import { createPostgresPersistenceAdapter } from "@streamyy/postgres";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const persistence = createPostgresPersistenceAdapter({
  client: pool,
});
```

### Redis

Install:

```bash
npm install @streamyy/server @streamyy/redis redis
```

Usage:

```ts
import { createClient } from "redis";
import { createRedisPersistenceAdapter } from "@streamyy/redis";

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();

const persistence = createRedisPersistenceAdapter({
  client: redis,
});
```

### Supabase

Install:

```bash
npm install @streamyy/server @streamyy/supabase @supabase/supabase-js
```

Usage:

```ts
import { createClient } from "@supabase/supabase-js";
import { createSupabasePersistenceAdapter } from "@streamyy/supabase";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

const persistence = createSupabasePersistenceAdapter({
  callSession: supabase.from("streammy_call_sessions"),
  userPresence: supabase.from("streammy_user_presence"),
  socketConnection: supabase.from("streammy_socket_connections"),
});
```

### DynamoDB

Install:

```bash
npm install @streamyy/server @streamyy/dynamodb @aws-sdk/lib-dynamodb
```

Usage:

```ts
import { createDynamoDbPersistenceAdapter } from "@streamyy/dynamodb";

const persistence = createDynamoDbPersistenceAdapter({
  client: dynamoDocumentClient,
});
```

## 2. Express integration

If your backend uses Express:

```ts
import express from "express";
import { registerExpressStreammyRoutes } from "@streamyy/server";

const app = express();
app.use(express.json());

registerExpressStreammyRoutes(app, {
  service: streammy.service,
  basePath: "/streammy",
});
```

Routes:

- `GET /streammy/health`
- `POST /streammy/calls`
- `POST /streammy/calls/:callId/end`

### Create a call over HTTP

```http
POST /streammy/calls
Content-Type: application/json

{
  "callerId": "user_123",
  "receiverId": "user_456",
  "callType": "video",
  "metadata": {
    "conversationId": "conv_001"
  }
}
```

### End a call over HTTP

```http
POST /streammy/calls/call_123/end
Content-Type: application/json

{
  "userId": "user_123",
  "deviceId": "web_browser"
}
```

## 3. Fastify integration

If your backend uses Fastify:

```ts
import Fastify from "fastify";
import { registerFastifyStreammyRoutes } from "@streamyy/server";

const app = Fastify();

registerFastifyStreammyRoutes(app, {
  service: streammy.service,
  basePath: "/streammy",
});
```

## 4. Nest-style integration

If you want Nest-style module registration:

```ts
import { StreammyModule } from "@streamyy/server";

const streammyModule = StreammyModule.forRoot({
  global: true,
  service: streammy.service,
  notifier: streammy.notifier,
});
```

## Backend behavior

The backend package handles:

- user connection registration
- multi-device user rooms
- incoming call notification
- accept, decline, cancel, and end events
- SDP and ICE relay
- presence updates
- missed call timeout after 60 seconds
- internal Socket.IO setup, so backend users do not need to install or create Socket.IO manually
- in-memory storage by default
- custom persistence via adapter injection

## Frontend Usage

## 1. Use the default UI

This is the easiest frontend integration path.

```tsx
import { StreammyCallWidget, StreammyProvider } from "@streamyy/client";

export function CallingPage() {
  return (
    <StreammyProvider
      options={{
        url: "http://localhost:4000",
        token: "jwt-token",
        userId: "user_123",
        deviceId: "web_browser",
        autoConnect: true,
        lowBandwidthMode: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelayMs: 1000,
        reconnectionDelayMaxMs: 5000,
      }}
    >
      <StreammyCallWidget
        defaultReceiverId="user_456"
        defaultCallType="video"
      />
    </StreammyProvider>
  );
}
```

What the default UI gives you:

- start call form
- current call state
- incoming call accept/decline panel
- mute and video toggles
- end-call action
- reconnect status
- built-in ringtone behavior
- non-mirrored video by default

## 2. Customize ringtones

The frontend package supports different incoming and outgoing ringing sources.

You can provide:

- a file URL
- a generated tone pattern

### Example using custom audio files

```tsx
<StreammyCallWidget
  ringtones={{
    incoming: { kind: "url", src: "/sounds/incoming.mp3" },
    outgoing: { kind: "url", src: "/sounds/outgoing.mp3" },
  }}
/>
```

### Example using generated tones

```tsx
<StreammyCallWidget
  ringtones={{
    incoming: {
      kind: "pattern",
      pattern: {
        steps: [
          { frequency: 880, durationMs: 220, gain: 0.06 },
          { frequency: 660, durationMs: 220, gain: 0.06 },
        ],
        pauseMs: 900,
      },
    },
    outgoing: {
      kind: "pattern",
      pattern: {
        steps: [{ frequency: 520, durationMs: 850, gain: 0.05 }],
        pauseMs: 1100,
      },
    },
  }}
/>
```

## 3. Use the client directly

If the frontend team does not want the default UI, they can use the client and build their own interface.

```ts
import { createStreammyClient } from "@streamyy/client";

const client = createStreammyClient({
  url: "http://localhost:4000",
  token: "jwt-token",
  userId: "user_123",
  deviceId: "web_browser",
  autoConnect: true,
  lowBandwidthMode: true,
  reconnection: true,
});

client.on("incomingCall", (call) => {
  console.log("Incoming call", call);
});

client.on("callAccepted", (payload) => {
  console.log("Accepted", payload);
});

client.on("callEnded", (payload) => {
  console.log("Ended", payload.status, payload.reason);
});

client.initiateCall("user_456", "audio", {
  conversationId: "conv_001",
});
```

## 4. Use the React hook

If the frontend team wants a custom UI but still wants package-managed state:

```tsx
import { StreammyProvider, useStreammy } from "@streamyy/client";

function CustomCallingUI() {
  const {
    connected,
    reconnecting,
    activeCall,
    callStatus,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
  } = useStreammy();

  return (
    <div>
      <p>Connected: {String(connected)}</p>
      <p>Reconnecting: {String(reconnecting)}</p>
      <p>Status: {callStatus}</p>

      <button onClick={() => initiateCall("user_456", "video")}>
        Start call
      </button>

      {activeCall?.direction === "incoming" ? (
        <div>
          <button onClick={() => acceptCall(activeCall.callId)}>Accept</button>
          <button onClick={() => declineCall(activeCall.callId)}>Decline</button>
        </div>
      ) : null}

      {activeCall ? (
        <button onClick={() => endCall(activeCall.callId)}>End</button>
      ) : null}
    </div>
  );
}
```

## 5. WebRTC helpers

The frontend package also exports helper utilities.

### Local media

```ts
import { getUserMedia, toggleStreamTracks } from "@streamyy/client";

const localStream = await getUserMedia({
  audio: true,
  video: true,
});

toggleStreamTracks(localStream, "audio", false);
toggleStreamTracks(localStream, "video", true);
```

### Peer connection session

```ts
import { StreammyPeerSession } from "@streamyy/client";

const peer = new StreammyPeerSession({
  client,
  callId: "call_123",
  remoteUserId: "user_456",
});

peer.attachLocalStream(localStream);

const offer = await peer.createOffer();
client.sendOffer("call_123", "user_456", offer);
```

## 6. WhatsApp-style video swap layout

If the frontend team wants the common calling layout where:

- one video is shown in the main area
- the other video is shown in a smaller corner preview
- tapping the smaller preview swaps them

they can use `VideoStage`.

```tsx
import { VideoStage } from "@streamyy/client";

<VideoStage
  localStream={localStream}
  remoteStream={remoteStream}
  localLabel="You"
  remoteLabel="Ada"
  defaultMainView="remote"
/>
```

Behavior:

- remote video is large by default
- local video appears in the smaller corner tile
- clicking the smaller tile swaps the focus
- clicking again swaps back
- local video is not mirrored unless you opt in

### Video tile mirroring

`VideoTile` is not mirrored by default.

That means when a user moves left, the video also moves left on screen.

If a frontend team wants selfie-style preview behavior, they can opt in:

```tsx
import { VideoTile } from "@streamyy/client";

<VideoTile
  stream={localStream}
  label="Local preview"
  mirrored={true}
/>
```

## Frontend behavior

The frontend package currently supports:

- outgoing and incoming call states
- reconnect-aware status
- low-bandwidth client mode
- different incoming and outgoing ringtones
- custom ringtone sources
- default call UI
- custom UI through hooks and client access

## Signaling Events

Socket events used by the packages:

- `call:initiate`
- `call:incoming`
- `call:accept`
- `call:decline`
- `call:cancel`
- `call:end`
- `call:offer`
- `call:answer`
- `call:ice-candidate`
- `presence:update`

## Call States

Statuses used by Streamyy:

- `initiated`
- `ringing`
- `accepted`
- `declined`
- `missed`
- `ongoing`
- `ended`
- `cancelled`
- `failed`

## Typical Call Flow

1. Caller initiates the call.
2. Backend creates a call session.
3. Receiver gets `call:incoming`.
4. Receiver accepts or declines.
5. Offer, answer, and ICE candidates are exchanged.
6. Call becomes active.
7. If nobody answers within 60 seconds, the call becomes `missed`.
8. When either side ends the call, the backend stores `endedAt`, `duration`, and `endedBy`.

## Workspace Commands

These are for working on the package source in this repository.

Install workspace dependencies:

```bash
npm install
```

Build all packages:

```bash
npm run build
```

Build only backend package:

```bash
npm run build:server
```

Build only Mongoose adapter package:

```bash
npm run build:mongoose
```

Build the other adapter packages:

```bash
npm run build:prisma
npm run build:postgres
npm run build:redis
npm run build:supabase
npm run build:dynamodb
```

Build only frontend package:

```bash
npm run build:frontend
```

Build only core package:

```bash
npm run build:core
```