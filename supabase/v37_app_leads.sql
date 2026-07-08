-- v37 — Leads reais no Supabase
-- Rode no SQL Editor do Supabase antes de testar a aba Leads.

create table if not exists app_leads (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  phone text,
  origin text default 'Manual',
  service text,
  estimated_value numeric default 0,
  status text default 'Novo',
  temperature text default 'Morno',
  next_contact text,
  responsible text,
  is_deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists app_leads_legacy_id_idx on app_leads(legacy_id);
create index if not exists app_leads_status_idx on app_leads(status);
create index if not exists app_leads_is_deleted_idx on app_leads(is_deleted);
