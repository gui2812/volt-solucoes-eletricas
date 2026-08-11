-- Volt Soluções Elétricas
-- v40 • Segurança biométrica/WebAuthn por módulo
-- Execute no SQL Editor do Supabase antes de publicar os arquivos desta etapa.

create table if not exists public.app_security_settings (
  id text primary key,
  protected_routes text[] not null default '{}',
  updated_at timestamptz not null default now()
);

insert into public.app_security_settings (id, protected_routes)
values ('global', '{}')
on conflict (id) do nothing;

create table if not exists public.app_webauthn_credentials (
  credential_id text primary key,
  label text not null,
  public_key text not null,
  algorithm integer not null,
  counter bigint not null default 0,
  transports text[] not null default '{}',
  device_type text,
  backed_up boolean not null default false,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists app_webauthn_credentials_last_used_idx
  on public.app_webauthn_credentials (last_used_at desc);

alter table public.app_security_settings enable row level security;
alter table public.app_webauthn_credentials enable row level security;

-- Não criamos policies para anon/authenticated de propósito.
-- O acesso a estas tabelas ocorre apenas pelas rotas de servidor usando SERVICE_ROLE_KEY.
