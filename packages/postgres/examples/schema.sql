create table if not exists streammy_call_sessions (
  call_id text primary key,
  caller_id text not null,
  receiver_id text not null,
  call_type text not null,
  status text not null,
  started_at timestamptz null,
  ended_at timestamptz null,
  duration integer null,
  ended_by text null,
  metadata jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_streammy_call_sessions_caller_created
  on streammy_call_sessions (caller_id, created_at desc);

create index if not exists idx_streammy_call_sessions_receiver_created
  on streammy_call_sessions (receiver_id, created_at desc);

create index if not exists idx_streammy_call_sessions_status_updated
  on streammy_call_sessions (status, updated_at desc);

create table if not exists streammy_user_presence (
  user_id text primary key,
  status text not null,
  last_seen_at timestamptz not null,
  metadata jsonb null,
  active_connections integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_streammy_user_presence_status_last_seen
  on streammy_user_presence (status, last_seen_at desc);

create table if not exists streammy_socket_connections (
  connection_id text primary key,
  user_id text not null,
  device_id text not null,
  connected_at timestamptz not null,
  last_seen_at timestamptz not null,
  metadata jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_streammy_socket_user_device unique (user_id, device_id)
);

create index if not exists idx_streammy_socket_connections_user_last_seen
  on streammy_socket_connections (user_id, last_seen_at desc);