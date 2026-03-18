# Streamyy Package Workspace

This repository is the source code for publishable Streamyy packages.

It is not a local app that consumes the packages.

The goal is:

- frontend developers install the frontend package
- backend developers install the backend package
- both connect through the same signaling contract

## Packages

### `@streammy/core`

Shared backend domain package:

- call session types
- call state engine
- Mongoose models
- repositories
- event contracts

### `@streammy/server`

Backend package:

- Socket.IO signaling transport
- runtime bootstrap
- Express adapter
- Fastify adapter
- Nest-style adapter

### `streammy`

Frontend package:

- client SDK
- React hooks
- default call UI
- ringtone support
- WebRTC helpers

## Workspace Install

From the root of this repo:

```bash
npm install
```

That installs dependencies for the workspace.

## Build

Build everything:

```bash
npm run build
```

Build only backend server package:

```bash
npm run build:server
```

Build only frontend package:

```bash
npm run build:frontend
```

Build only core package:

```bash
npm run build:core
```

## Package Consumers

### Frontend developer

Installs:

```bash
npm install streammy
```

Uses:

- default UI
- hooks
- signaling client
- ringtone customization

### Backend developer

Installs:

```bash
npm install @streammy/server
```

Uses:

- signaling runtime
- adapters
- call lifecycle backend

## Notes

- The root exists to manage the workspace and builds.
- The package source code lives under `packages/`.
- There is no local demo app consuming the packages in this repo anymore.
