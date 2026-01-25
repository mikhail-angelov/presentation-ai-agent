-- Create sessions table following exact Supabase conventions
create table public.sessions (
  id uuid not null default gen_random_uuid(),
  user_id text null,
  created_at timestamp with time zone not null default now(),
  last_accessed timestamp with time zone not null default now(),
  user_agent text null,
  ip_address text null,
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamp with time zone null,
  constraint sessions_pkey primary key (id)
) tablespace pg_default;

-- Create user_actions table
create table public.user_actions (
  id uuid not null default gen_random_uuid(),
  session_id uuid not null,
  type text not null,
  timestamp timestamp with time zone not null default now(),
  endpoint text null,
  data jsonb null default '{}'::jsonb,
  result jsonb null default '{}'::jsonb,
  tokens_used integer null default 0,
  duration_ms integer null default 0,
  constraint user_actions_pkey primary key (id),
  constraint user_actions_session_id_fkey foreign key (session_id)
    references public.sessions (id) on delete cascade
) tablespace pg_default;

-- Create indexes for better performance
create index if not exists idx_sessions_user_id on public.sessions(user_id);
create index if not exists idx_sessions_last_accessed on public.sessions(last_accessed);
create index if not exists idx_sessions_expires_at on public.sessions(expires_at);
create index if not exists idx_user_actions_session_id on public.user_actions(session_id);
create index if not exists idx_user_actions_timestamp on public.user_actions(timestamp);
create index if not exists idx_user_actions_type on public.user_actions(type);

-- Create function to automatically delete expired sessions
create or replace function public.cleanup_expired_sessions()
returns void
language plpgsql
as $$
begin
  delete from public.sessions where expires_at < now();
end;
$$;

-- Create trigger to set expires_at on insert
create or replace function public.set_session_expiry()
returns trigger
language plpgsql
as $$
begin
  new.expires_at := new.created_at + interval '7 days';
  return new;
end;
$$;

create trigger set_session_expiry_trigger
  before insert on public.sessions
  for each row
  execute function public.set_session_expiry();

-- Create a view for session statistics
create or replace view public.session_stats as
select 
  count(*) as total_sessions,
  count(case when last_accessed > now() - interval '30 minutes' then 1 end) as active_sessions,
  coalesce(sum((select count(*) from public.user_actions ua where ua.session_id = s.id)), 0) as total_actions
from public.sessions s;

-- Create a view for recent sessions with action counts
create or replace view public.recent_sessions as
select 
  s.id,
  s.user_id,
  s.created_at,
  s.last_accessed,
  s.user_agent,
  s.ip_address,
  (select count(*) from public.user_actions ua where ua.session_id = s.id) as action_count,
  s.metadata
from public.sessions s
order by s.last_accessed desc
limit 100;
