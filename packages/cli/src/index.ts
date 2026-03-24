#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

type InitTarget = "backend" | "frontend" | "both";

interface ParsedArgs {
  command?: string;
  target: InitTarget;
  custom: boolean;
}

interface TemplateFile {
  path: string;
  content: string;
}

const helpText = `Streamyy CLI

Usage:
  npx streamyy init
  npx streamyy init --backend
  npx streamyy init --frontend
  npx streamyy init --frontend --custom

Flags:
  --backend   Generate only the backend starter
  --frontend  Generate only the frontend starter
  --custom    Generate the custom frontend starter instead of the default UI
  --help      Show this help message
`;

const parseArgs = (argv: string[]): ParsedArgs => {
  const command = argv[0];
  const hasBackend = argv.includes("--backend");
  const hasFrontend = argv.includes("--frontend");
  const custom = argv.includes("--custom");

  if (hasBackend && hasFrontend) {
    throw new Error("Use either --backend or --frontend, or omit both to generate both starters.");
  }

  if (custom && hasBackend) {
    throw new Error("--custom only applies to frontend scaffolding.");
  }

  return {
    command,
    target: hasBackend ? "backend" : hasFrontend ? "frontend" : "both",
    custom,
  };
};

const renderJson = (value: Record<string, unknown>): string => `${JSON.stringify(value, null, 2)}\n`;

const backendFiles = (): TemplateFile[] => [
  {
    path: ".gitignore",
    content: "node_modules\n.env\n",
  },
  {
    path: "package.json",
    content: renderJson({
      name: "streamyy-backend-app",
      private: true,
      type: "module",
      scripts: {
        dev: "node --watch server.js",
        start: "node server.js",
      },
      dependencies: {
        "@streamyy/server": "^0.1.0",
        express: "^4.21.2",
        socket.io: "^4.8.1",
      },
    }),
  },
  {
    path: "server.js",
    content: `import { createServer } from "node:http";
import express from "express";
import {
  createStreammyServer,
  registerExpressStreammyRoutes,
} from "@streamyy/server";

const app = express();
app.use(express.json());

const httpServer = createServer(app);

const streammy = createStreammyServer({
  httpServer,
  rateLimit: {
    connectionAttempts: { max: 20, windowMs: 60_000 },
    callInitiation: { max: 8, windowMs: 60_000 },
  },
  auth: async (token) => {
    if (!token) {
      throw new Error("Missing auth token");
    }

    return {
      userId: token,
      deviceId: "web",
    };
  },
});

streammy.bind();

registerExpressStreammyRoutes(app, {
  service: streammy.service,
  basePath: "/streammy",
});

app.get("/", (_request, response) => {
  response.json({
    ok: true,
    message: "Streamyy backend is running.",
  });
});

httpServer.listen(3000, () => {
  console.log("Streamyy backend listening on http://localhost:3000");
});
`,
  },
  {
    path: "README.md",
    content: `# Streamyy Backend Starter

## Run

\`\`\`bash
npm install
npm run dev
\`\`\`

Socket.IO and REST endpoints will be available on \`http://localhost:3000\`.
`,
  },
];

const frontendPackageJson = renderJson({
  name: "streamyy-frontend-app",
  private: true,
  version: "0.0.0",
  type: "module",
  scripts: {
    dev: "vite",
    build: "tsc && vite build",
    preview: "vite preview",
  },
  dependencies: {
    "@streamyy/client": "^0.4.0",
    react: "^19.0.0",
    "react-dom": "^19.0.0",
    "socket.io-client": "^4.8.1",
  },
  devDependencies: {
    "@vitejs/plugin-react": "^4.4.1",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    typescript: "^5.8.2",
    vite: "^6.2.6",
  },
});

const frontendSharedFiles = (): TemplateFile[] => [
  {
    path: ".gitignore",
    content: "node_modules\ndist\n",
  },
  {
    path: "package.json",
    content: frontendPackageJson,
  },
  {
    path: "index.html",
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Streamyy Frontend</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  },
  {
    path: "tsconfig.json",
    content: renderJson({
      compilerOptions: {
        target: "ES2022",
        useDefineForClassFields: true,
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        allowJs: false,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        module: "ESNext",
        moduleResolution: "Bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
      },
      include: ["src"],
    }),
  },
  {
    path: "vite.config.ts",
    content: `import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
`,
  },
  {
    path: "src/main.tsx",
    content: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`,
  },
];

const defaultFrontendFiles = (): TemplateFile[] => [
  ...frontendSharedFiles(),
  {
    path: "src/App.tsx",
    content: `import { StreamyyCallWidget, StreamyyProvider } from "@streamyy/client";

export default function App() {
  return (
    <StreamyyProvider
      options={{
        url: "http://localhost:3000",
        userId: "demo-user-1",
        token: "demo-user-1",
      }}
    >
      <main className="app-shell">
        <section className="card">
          <p className="eyebrow">Default UI</p>
          <h1>Streamyy frontend starter</h1>
          <p className="lede">
            This starter uses the install-ready Streamyy widget so you can get a call flow running fast.
          </p>
          <StreamyyCallWidget defaultReceiverId="demo-user-2" />
        </section>
      </main>
    </StreamyyProvider>
  );
}
`,
  },
  {
    path: "src/styles.css",
    content: `:root {
  font-family: "Segoe UI", sans-serif;
  color: #14213d;
  background: linear-gradient(135deg, #f9f7f1 0%, #e9f1ff 100%);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
}

#root {
  min-height: 100vh;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
}

.card {
  width: min(100%, 32rem);
  padding: 2rem;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 24px 60px rgba(20, 33, 61, 0.12);
}

.eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #ef8354;
}

.card h1 {
  margin: 0;
}

.lede {
  color: #4f5d75;
  line-height: 1.6;
}
`,
  },
  {
    path: "README.md",
    content: `# Streamyy Frontend Starter

## Run

\`\`\`bash
npm install
npm run dev
\`\`\`

Open the Vite app and make sure your Streamyy backend is running on \`http://localhost:3000\`.
`,
  },
];

const customFrontendFiles = (): TemplateFile[] => [
  ...frontendSharedFiles(),
  {
    path: "src/App.tsx",
    content: `import { StreamyyProvider, useStreamyy } from "@streamyy/client";

function CustomCallScreen() {
  const {
    activeCall,
    callStatus,
    connected,
    reconnecting,
    startAudioCall,
    startVideoCall,
    acceptCall,
    declineCall,
    endCall,
    clearActiveCall,
  } = useStreamyy();

  const isIncoming = activeCall?.direction === "incoming" && (callStatus === "ringing" || callStatus === "initiated");
  const isActive = callStatus === "accepted" || callStatus === "ongoing";

  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">Custom UI</p>
        <h1>Build your own Streamyy experience</h1>
        <p className="lede">
          This starter skips the default widget and gives you the provider and hooks so you can design your own call screens.
        </p>

        <div className="status-grid">
          <div>
            <span>Status</span>
            <strong>{callStatus}</strong>
          </div>
          <div>
            <span>Socket</span>
            <strong>{connected ? "connected" : reconnecting ? "reconnecting" : "offline"}</strong>
          </div>
          <div>
            <span>Peer</span>
            <strong>{activeCall ? (activeCall.direction === "incoming" ? activeCall.callerId : activeCall.receiverId) : "none"}</strong>
          </div>
        </div>

        <div className="actions">
          <button onClick={() => void startAudioCall("demo-user-2")}>Start audio call</button>
          <button onClick={() => void startVideoCall("demo-user-2")}>Start video call</button>
          {isIncoming ? <button onClick={() => void acceptCall()}>Accept incoming</button> : null}
          {isIncoming ? <button className="secondary" onClick={() => void declineCall(undefined, "busy")}>Decline</button> : null}
          {isActive ? <button className="secondary" onClick={() => void endCall()}>End call</button> : null}
          {activeCall ? <button className="ghost" onClick={clearActiveCall}>Clear local state</button> : null}
        </div>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <StreamyyProvider
      options={{
        url: "http://localhost:3000",
        userId: "demo-user-1",
        token: "demo-user-1",
      }}
    >
      <CustomCallScreen />
    </StreamyyProvider>
  );
}
`,
  },
  {
    path: "src/styles.css",
    content: `:root {
  font-family: "Segoe UI", sans-serif;
  color: #172121;
  background:
    radial-gradient(circle at top, rgba(245, 177, 122, 0.35), transparent 30%),
    linear-gradient(160deg, #fff9f2 0%, #eef7f6 100%);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
}

#root {
  min-height: 100vh;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
}

.card {
  width: min(100%, 42rem);
  padding: 2rem;
  border-radius: 1.75rem;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 24px 80px rgba(23, 33, 33, 0.12);
  backdrop-filter: blur(16px);
}

.eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.82rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #c06c3f;
}

.card h1 {
  margin: 0;
}

.lede {
  color: #425466;
  line-height: 1.6;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.status-grid div {
  padding: 1rem;
  border-radius: 1rem;
  background: #f5f8f8;
}

.status-grid span {
  display: block;
  font-size: 0.82rem;
  color: #5b6b73;
  margin-bottom: 0.35rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

button {
  border: 0;
  border-radius: 999px;
  padding: 0.9rem 1.2rem;
  background: #172121;
  color: #fff;
  cursor: pointer;
}

button.secondary {
  background: #d96c4d;
}

button.ghost {
  background: transparent;
  color: #172121;
  border: 1px solid #d0dbdb;
}
`,
  },
  {
    path: "README.md",
    content: `# Streamyy Custom Frontend Starter

## Run

\`\`\`bash
npm install
npm run dev
\`\`\`

This template gives you \`StreamyyProvider\` and \`useStreamyy()\` so you can build your own UI instead of using the default widget.
`,
  },
];

const ensureFiles = async (baseDir: string, files: TemplateFile[]): Promise<void> => {
  for (const file of files) {
    const target = join(baseDir, file.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content, { flag: "wx" });
  }
};

const createBackendStarter = async (cwd: string): Promise<string> => {
  const targetDir = join(cwd, "streamyy-backend");
  await mkdir(targetDir, { recursive: true });
  await ensureFiles(targetDir, backendFiles());
  return targetDir;
};

const createFrontendStarter = async (cwd: string, custom: boolean): Promise<string> => {
  const targetDir = join(cwd, "streamyy-frontend");
  await mkdir(targetDir, { recursive: true });
  await ensureFiles(targetDir, custom ? customFrontendFiles() : defaultFrontendFiles());
  return targetDir;
};

const run = async (): Promise<void> => {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.length === 0) {
    console.log(helpText);
    return;
  }

  const parsed = parseArgs(argv);
  if (parsed.command !== "init") {
    throw new Error(`Unknown command "${parsed.command ?? ""}". Only "init" is currently supported.`);
  }

  const cwd = process.cwd();
  const created: string[] = [];

  if (parsed.target === "backend" || parsed.target === "both") {
    created.push(await createBackendStarter(cwd));
  }

  if (parsed.target === "frontend" || parsed.target === "both") {
    created.push(await createFrontendStarter(cwd, parsed.custom));
  }

  console.log("Streamyy starter created:");
  for (const directory of created) {
    console.log(`- ${directory}`);
  }
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error(`Streamyy CLI failed: ${message}`);
  process.exitCode = 1;
});
