-- v35 — Clientes no Supabase
-- Rode no SQL Editor do Supabase antes de testar a tela Clientes.

create table if not exists app_clients (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  fantasy_name text,
  type text,
  document text,
  status text default 'Ativo',
  category text,
  origin text,
  phone text,
  whatsapp text,
  email text,
  neighborhood text,
  city text,
  address text,
  responsible text,
  service_interest text,
  recurrence text,
  total_os numeric default 0,
  total_quotes numeric default 0,
  total_visits numeric default 0,
  total_revenue numeric default 0,
  received numeric default 0,
  open_amount numeric default 0,
  overdue numeric default 0,
  last_service text,
  next_service text,
  ticket_average numeric default 0,
  rating text default 'Comum',
  notes text,
  timeline jsonb default '[]'::jsonb,
  documents jsonb default '[]'::jsonb,
  is_deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists app_clients_legacy_id_idx on app_clients(legacy_id);
create index if not exists app_clients_is_deleted_idx on app_clients(is_deleted);
create index if not exists app_clients_phone_idx on app_clients(phone);
create index if not exists app_clients_email_idx on app_clients(email);
