import { Database, Layers3, Radio, ShieldCheck, Video } from "lucide-react";

const packages = [
  {
    name: "@streammy/core",
    icon: Layers3,
    description: "Framework-agnostic session engine, repositories, call state transitions, and domain events.",
  },
  {
    name: "@streammy/server",
    icon: Radio,
    description: "Socket and HTTP adapters for Express, Fastify, and Nest-style integration without coupling the core.",
  },
  {
    name: "streammy",
    icon: Video,
    description: "Frontend SDK with Socket.IO client wrappers, React hooks, basic UI blocks, and WebRTC helpers.",
  },
];

const features = [
  "1-to-1 audio/video call session lifecycle",
  "Abstracted signaling events for SDP and ICE exchange",
  "MongoDB + Mongoose schemas with indexes for hot queries",
  "Multiple device presence and socket connection tracking",
  "Publishable package layout for npm distribution",
];

const snippets = {
  express: `import mongoose from "mongoose";
import { Server } from "socket.io";
import express from "express";
import { createStreammyRuntime, registerExpressStreammyRoutes } from "@streammy/server";

const app = express();
const io = new Server(httpServer, { cors: { origin: "*" } });
const runtime = createStreammyRuntime({ mongoose, io });

runtime.bind();
registerExpressStreammyRoutes(app, { service: runtime.service });`,
  react: `import { StreammyProvider, useStreammy } from "streammy";

function App() {
  return (
    <StreammyProvider options={{ url: "http://localhost:4000", userId: "user_a" }}>
      <CallingExperience />
    </StreammyProvider>
  );
}`,
};

export default function App() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#0f2450,transparent_40%),linear-gradient(180deg,#020617_0%,#000000_100%)] text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-6 py-12 md:px-10">
        <header className="grid gap-6 md:grid-cols-[1.5fr_1fr] md:items-end">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-blue-200">
              <ShieldCheck size={16} />
              Production-ready calling infrastructure
            </span>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-display font-black tracking-tight md:text-7xl">
                Streammy turns this frontend repo into a real-time calling platform.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                The workspace now includes a strict TypeScript backend core, server adapters, and a frontend SDK so teams can plug
                1-to-1 audio or video calling into any Node.js server without rebuilding signaling from scratch.
              </p>
            </div>
          </div>

          <div className="glass rounded-3xl p-6">
            <div className="mb-4 flex items-center gap-3 text-blue-200">
              <Database size={20} />
              <span className="text-sm font-medium uppercase tracking-[0.3em]">Call Flow</span>
            </div>
            <ol className="space-y-3 text-sm leading-6 text-white/75">
              <li>1. Caller initiates a session.</li>
              <li>2. Backend persists session and notifies receiver devices.</li>
              <li>3. Accept/decline updates state and presence instantly.</li>
              <li>4. Offer, answer, and ICE messages relay over sockets.</li>
              <li>5. Ended calls write duration and ending participant.</li>
            </ol>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          {packages.map(({ name, icon: Icon, description }) => (
            <article key={name} className="glass rounded-3xl p-6">
              <div className="mb-4 inline-flex rounded-2xl bg-blue-500/15 p-3 text-blue-200">
                <Icon size={22} />
              </div>
              <h2 className="text-xl font-display font-bold">{name}</h2>
              <p className="mt-3 text-sm leading-6 text-white/70">{description}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
          <div className="glass rounded-3xl p-6">
            <h2 className="text-2xl font-display font-bold">What’s Included</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-white/75">
              {features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>

          <div className="grid gap-5">
            <article className="glass rounded-3xl p-6">
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-blue-200">Express bootstrap</p>
              <pre className="overflow-x-auto rounded-2xl bg-black/40 p-4 text-sm text-blue-50">
                <code>{snippets.express}</code>
              </pre>
            </article>

            <article className="glass rounded-3xl p-6">
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-blue-200">React usage</p>
              <pre className="overflow-x-auto rounded-2xl bg-black/40 p-4 text-sm text-blue-50">
                <code>{snippets.react}</code>
              </pre>
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}
