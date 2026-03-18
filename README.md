# Streammy Workspace

This repository is now organized as a package-based calling platform with a lightweight frontend shell at the root and three publishable packages under `packages/`.

## Packages

- `@streammy/core`
  - framework-agnostic call orchestration
  - strict TypeScript domain models and event contracts
  - Mongoose schemas and repository implementations
- `@streammy/server`
  - Socket.IO transport binding
  - Express and Fastify HTTP adapters
  - Nest-style module export via `StreammyModule.forRoot(...)`
- `streammy`
  - frontend SDK
  - React provider/hooks
  - WebRTC media and peer connection helpers
  - starter UI components

## Development

```bash
npm install
npm run dev
```

## Build Packages

```bash
npm run build:packages
```

## Notes

- The backend only handles signaling and call lifecycle state. It does not process media.
- The server package is intentionally framework-agnostic; the adapters are thin layers around the shared core service.
- The root Vite app is a showcase shell for the workspace architecture, not the SDK package itself.