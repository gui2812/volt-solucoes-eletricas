-- Consulta auxiliar usada pela rota:
-- /api/signature/by-quote/[quoteId]
--
-- Recomendado manter estes índices:
create index if not exists quote_signature_links_quote_created_idx
  on quote_signature_links (quote_id, created_at desc);
