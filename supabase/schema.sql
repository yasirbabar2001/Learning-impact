-- Learning Impact database schema.
-- Run once in the Supabase SQL editor (Project → SQL → New query → paste → Run).
-- The website talks to these tables from the server with the service-role key only.
-- RLS is enabled with no policies, so the public anon key can read or write nothing.

create extension if not exists pgcrypto;

create table if not exists public.programs (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title       text not null,
  category    text not null,
  summary     text not null default '',
  outcomes    text[] not null default '{}',
  duration    text not null default '',
  formats     text[] not null default '{onsite,virtual,hybrid}',
  level       text not null default '',
  featured    boolean not null default false,
  published   boolean not null default true,
  sort        integer not null default 100,
  created_at  timestamptz not null default now()
);

create table if not exists public.requests (
  id              uuid primary key default gen_random_uuid(),
  reference       text not null unique,
  type            text not null check (type in ('program_booking', 'trainer_request', 'enquiry')),
  status          text not null default 'new' check (status in ('new', 'contacted', 'proposal', 'confirmed', 'closed')),
  company         text not null,
  contact_name    text not null,
  email           text not null,
  phone           text not null default '',
  city            text not null default '',
  participants    integer check (participants is null or participants > 0),
  format          text check (format is null or format in ('onsite', 'virtual', 'hybrid')),
  preferred_date  date,
  program_slug    text,
  program_title   text,
  message         text not null default '',
  details         jsonb not null default '{}'::jsonb,
  notes           text not null default '',
  created_at      timestamptz not null default now()
);

create index if not exists requests_created_at_idx on public.requests (created_at desc);
create index if not exists requests_status_idx on public.requests (status);

create table if not exists public.settings (
  id          integer primary key default 1 check (id = 1),
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.programs enable row level security;
alter table public.requests enable row level security;
alter table public.settings enable row level security;

revoke all on public.programs, public.requests, public.settings from anon, authenticated;
