# Assinatura remota de orçamentos — Volt

## O que entra nessa versão

- Rota pública `/assinar/[token]`
- API para criar link de assinatura
- API para buscar orçamento pelo token
- API para salvar assinatura do cliente
- Assinatura livre pelo celular
- Rubrica predefinida
- Nome digitado + aceite
- Registro de data, IP e navegador
- Snapshot do orçamento enviado

## Arquivos

```txt
app/api/signature/create/route.ts
app/api/signature/[token]/route.ts
app/assinar/[token]/page.tsx
utils/assinaturaRemota.ts
database/assinatura_remota_schema.sql
```

## Variáveis na Vercel

Configure em Settings > Environment Variables:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

A `SUPABASE_SERVICE_ROLE_KEY` nunca deve aparecer no navegador.

## Integração no app/cotacoes/page.tsx

Depois de subir os arquivos novos, adicione no topo:

```tsx
import { createRemoteSignatureLink, makeSignatureWhatsAppLink } from "@/utils/assinaturaRemota";
```

Dentro da página, crie a função:

```tsx
async function sendToRemoteSignature(quote: Quote) {
  const result = await createRemoteSignatureLink({
    id: quote.id,
    title: quote.title,
    client: quote.client,
    contact: quote.contact,
    phone: quote.phone,
    email: quote.email,
    address: quote.address,
    createdAt: quote.createdAt,
    validUntil: quote.validUntil,
    payment: quote.payment,
    warranty: quote.warranty,
    deadline: quote.deadline,
    status: quote.status,
    responsible: quote.responsible,
    notes: quote.notes,
    items: quote.items
  });

  const whatsapp = makeSignatureWhatsAppLink(quote.phone, result.signingUrl, quote.id);

  await navigator.clipboard.writeText(result.signingUrl);
  window.open(whatsapp, "_blank");
}
```

E no modal de detalhes do orçamento, adicione um botão perto de PDF/WhatsApp:

```tsx
<button
  onClick={() => sendToRemoteSignature(selected)}
  className="btn-primary"
>
  Enviar para assinatura
</button>
```
