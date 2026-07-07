-- VOLT SOLUÇÕES ELÉTRICAS — SCHEMA BASE SUPABASE
-- Use no SQL Editor do Supabase quando formos migrar o sistema do localStorage para banco.
-- Observação: este schema cria a base, mas a tela ainda precisa das rotas/API para gravar e ler do Supabase.

create extension if not exists "pgcrypto";

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
  last_service date,
  next_service date,
  ticket_average numeric default 0,
  rating text default 'Comum',
  notes text,
  timeline jsonb default '[]'::jsonb,
  is_deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists app_client_documents (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references app_clients(id) on delete cascade,
  legacy_client_id text,
  title text not null,
  document_type text default 'Registro',
  description text,
  file_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists app_quotes (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  client_id uuid references app_clients(id) on delete set null,
  title text,
  client_name text,
  phone text,
  email text,
  address text,
  status text default 'Rascunho',
  signature_status text default 'Pendente',
  signature_token text,
  signature_url text,
  items jsonb default '[]'::jsonb,
  total numeric default 0,
  cost numeric default 0,
  payment text,
  deadline text,
  warranty text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists app_service_orders (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  quote_id uuid references app_quotes(id) on delete set null,
  client_id uuid references app_clients(id) on delete set null,
  title text,
  client_name text,
  phone text,
  address text,
  type text,
  status text default 'Orçamento',
  priority text default 'Média',
  service_date date,
  technician text,
  value numeric default 0,
  paid numeric default 0,
  materials_cost numeric default 0,
  checklist jsonb default '[]'::jsonb,
  materials jsonb default '[]'::jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists app_appointments (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  service_order_id uuid references app_service_orders(id) on delete set null,
  client_id uuid references app_clients(id) on delete set null,
  title text,
  client_name text,
  phone text,
  address text,
  region text,
  type text,
  status text default 'Agendado',
  priority text default 'Média',
  appointment_date date,
  starts_at time,
  ends_at time,
  technician text,
  value numeric default 0,
  materials jsonb default '[]'::jsonb,
  checklist jsonb default '[]'::jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists app_financial_transactions (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  service_order_id uuid references app_service_orders(id) on delete set null,
  client_id uuid references app_clients(id) on delete set null,
  type text not null,
  title text not null,
  client_supplier text,
  cost_center text,
  category text,
  budgeted numeric default 0,
  actual numeric default 0,
  competence_date date,
  due_date date,
  payment_date date,
  status text default 'Aberto',
  payment_method text,
  recurrence text default 'Única',
  responsible text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists app_financial_goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  period text not null,
  category text not null,
  target numeric default 0,
  actual numeric default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists app_clients_is_deleted_idx on app_clients(is_deleted);
create index if not exists app_clients_phone_idx on app_clients(phone);
create index if not exists app_clients_email_idx on app_clients(email);
create index if not exists app_quotes_legacy_id_idx on app_quotes(legacy_id);
create index if not exists app_service_orders_legacy_id_idx on app_service_orders(legacy_id);
create index if not exists app_appointments_date_idx on app_appointments(appointment_date);
create index if not exists app_financial_status_idx on app_financial_transactions(status);
