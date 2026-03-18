create table if not exists public.streammy_call_sessions (
  "callId" text primary key,
  "callerId" text not null,
  "receiverId" text not null,
  "callType" text not null,
  "status" text not null,
  "startedAt" timestamptz null,
  "endedAt" timestamptz null,
  "duration" integer null,
  "endedBy" text null,
  "metadata" jsonb null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_supabase_streammy_call_sessions_caller_created
  on public.streammy_call_sessions ("callerId", "createdAt" desc);

create index if not exists idx_supabase_streammy_call_sessions_receiver_created
  on public.streammy_call_sessions ("receiverId", "createdAt" desc);

create index if not exists idx_supabase_streammy_call_sessions_status_updated
  on public.streammy_call_sessions ("status", "updatedAt" desc);

create table if not exists public.streammy_user_presence (
  "userId" text primary key,
  "status" text not null,
  "lastSeenAt" timestamptz not null,
  "metadata" jsonb null,
  "activeConnections" integer not null default 0,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists idx_supabase_streammy_user_presence_status_last_seen
  on public.streammy_user_presence ("status", "lastSeenAt" desc);

create table if not exists public.streammy_socket_connections (
  "connectionId" text primary key,
  "userId" text not null,
  "deviceId" text not null,
  "connectedAt" timestamptz not null,
  "lastSeenAt" timestamptz not null,
  "metadata" jsonb null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint uq_supabase_streammy_socket_user_device unique ("userId", "deviceId")
);

create index if not exists idx_supabase_streammy_socket_connections_user_last_seen
  on public.streammy_socket_connections ("userId", "lastSeenAt" desc);
