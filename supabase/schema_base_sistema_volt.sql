-- VOLT SOLUÇÕES ELÉTRICAS — SUPABASE BASE SEGURA V30
-- Rode este arquivo no SQL Editor do Supabase.
-- Esta versão evita foreign keys para não falhar se alguma tabela já existir diferente.
-- Depois conectaremos tela por tela nas APIs.

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

create table if not exists app_client_documents (
  id uuid primary key default gen_random_uuid(),
  client_legacy_id text,
  client_name text,
  title text not null,
  document_type text default 'Registro',
  description text,
  file_url text,
  storage_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists app_quotes (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  client_legacy_id text,
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
  quote_legacy_id text,
  client_legacy_id text,
  title text,
  client_name text,
  phone text,
  address text,
  type text,
  status text default 'Orçamento',
  priority text default 'Média',
  service_date text,
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
  service_order_legacy_id text,
  client_legacy_id text,
  title text,
  client_name text,
  phone text,
  address text,
  region text,
  type text,
  status text default 'Agendado',
  priority text default 'Média',
  appointment_date text,
  starts_at text,
  ends_at text,
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
  service_order_legacy_id text,
  client_legacy_id text,
  type text not null,
  title text not null,
  client_supplier text,
  cost_center text,
  category text,
  budgeted numeric default 0,
  actual numeric default 0,
  competence_date text,
  due_date text,
  payment_date text,
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
  legacy_id text unique,
  title text not null,
  period text not null,
  category text not null,
  target numeric default 0,
  actual numeric default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists app_report_history (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  kind text,
  title text,
  format text,
  status text,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists app_clients_is_deleted_idx on app_clients(is_deleted);
create index if not exists app_clients_legacy_id_idx on app_clients(legacy_id);
create index if not exists app_clients_phone_idx on app_clients(phone);
create index if not exists app_clients_email_idx on app_clients(email);
create index if not exists app_client_documents_client_legacy_idx on app_client_documents(client_legacy_id);
create index if not exists app_quotes_legacy_id_idx on app_quotes(legacy_id);
create index if not exists app_service_orders_legacy_id_idx on app_service_orders(legacy_id);
create index if not exists app_appointments_legacy_id_idx on app_appointments(legacy_id);
create index if not exists app_appointments_date_idx on app_appointments(appointment_date);
create index if not exists app_financial_legacy_id_idx on app_financial_transactions(legacy_id);
create index if not exists app_financial_status_idx on app_financial_transactions(status);
create index if not exists app_goals_legacy_id_idx on app_financial_goals(legacy_id);
