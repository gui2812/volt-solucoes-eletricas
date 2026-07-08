-- v38 — Financeiro real no Supabase
-- Rode no SQL Editor antes de testar o financeiro.

create table if not exists app_financial_transactions (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
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
  service_order text,
  quote text,
  recurrence text default 'Única',
  responsible text,
  notes text,
  is_deleted boolean default false,
  deleted_at timestamptz,
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
  is_deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists app_financial_transactions_legacy_idx on app_financial_transactions(legacy_id);
create index if not exists app_financial_transactions_status_idx on app_financial_transactions(status);
create index if not exists app_financial_transactions_type_idx on app_financial_transactions(type);
create index if not exists app_financial_transactions_deleted_idx on app_financial_transactions(is_deleted);
create index if not exists app_financial_transactions_due_idx on app_financial_transactions(due_date);

create index if not exists app_financial_goals_legacy_idx on app_financial_goals(legacy_id);
create index if not exists app_financial_goals_deleted_idx on app_financial_goals(is_deleted);
