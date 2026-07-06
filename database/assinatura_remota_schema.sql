-- Volt Soluções Elétricas — Assinatura remota de orçamentos
-- Execute no Supabase SQL Editor.
-- Esta estrutura salva um "snapshot" do orçamento enviado para assinatura.
-- Assim o cliente assina exatamente a versão enviada, mesmo que o orçamento seja editado depois.

create table if not exists quote_signature_links (
  id uuid primary key default gen_random_uuid(),

  token text not null unique,
  quote_id text not null,

  quote_snapshot jsonb not null,

  status text not null default 'pending'
    check (status in ('pending', 'signed', 'expired', 'cancelled')),

  client_name text,
  client_phone text,
  client_email text,

  responsible_name text,

  client_signature jsonb,
  responsible_signature jsonb,

  sent_at timestamptz default now(),
  signed_at timestamptz,
  expires_at timestamptz default (now() + interval '7 days'),

  ip_address text,
  user_agent text,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists quote_signature_links_token_idx
  on quote_signature_links (token);

create index if not exists quote_signature_links_quote_id_idx
  on quote_signature_links (quote_id);

create index if not exists quote_signature_links_status_idx
  on quote_signature_links (status);

-- Segurança:
-- Não habilite acesso direto público nessa tabela.
-- O acesso do cliente será feito pela rota segura:
-- /api/signature/[token]
--
-- As rotas usam SUPABASE_SERVICE_ROLE_KEY no servidor.
-- Nunca exponha a service_role no navegador.
