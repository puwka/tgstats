-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table to link Telegram WebApp User to MTProto Session
create table public.users (
  id bigint primary key, -- Telegram User ID
  first_name text,
  username text,
  session_string text, -- Encrypted session string for gram.js
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_login timestamp with time zone
);

-- Statistics cache table
create table public.user_stats (
  user_id bigint references public.users(id) on delete cascade primary key,
  total_messages int default 0,
  top_peers jsonb default '[]', -- Array of { name, count, avatar }
  activity_by_month jsonb default '[]', -- Array of { month, count }
  top_emojis jsonb default '[]',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Security policies (RLS)
alter table public.users enable row level security;
alter table public.user_stats enable row level security;

-- Only allow backend (service role) to read/write mostly, 
-- but if we want frontend to read its own stats directly:
create policy "Users can view their own stats" 
  on public.user_stats for select 
  using (auth.uid()::text = user_id::text); 
-- Note: This RLS assumes you map Telegram ID to Supabase Auth ID, 
-- but for this simple TMA, we often use the Backend to proxy requests 
-- or use a custom JWT signed by the backend. 
-- For simplicity in this demo, we will route everything through the Backend.

