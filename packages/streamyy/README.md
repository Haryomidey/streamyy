# @streamyy/client

Frontend client package for Streamyy.

It includes the Socket.IO signaling client, React hooks, install-ready UI components, ringtone helpers, and WebRTC utilities for browser calling flows.

## Install

```bash
npm install @streamyy/client react react-dom socket.io-client
```

## Usage

```tsx
import { StreamyyProvider, StreamyyCallWidget } from "@streamyy/client";

export function App() {
  return (
    <StreamyyProvider
      options={{
        url: "http://localhost:3000",
        userId: "user-1",
        token: "demo-token",
      }}
    >
      <StreamyyCallWidget defaultReceiverId="user-2" />
    </StreamyyProvider>
  );
}
```

## Includes

- signaling client
- React provider and hook
- default calling widget
- start-audio and start-video hook actions for custom buttons
- customizable incoming-call and active-call screens
- typed `error` event for transport and rate-limit failures
- ringtone helpers
- video layout helpers
- WebRTC peer session helpers

See the workspace root `README.md` for setup details and advanced usage.
