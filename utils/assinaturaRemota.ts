export type RemoteSignatureQuoteItem = {
  kind?: string;
  code?: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  discount?: number;
  total?: number;
};

export type RemoteSignatureQuoteSnapshot = {
  id: string;
  title: string;
  client: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: string;
  validUntil?: string;
  payment?: string;
  warranty?: string;
  deadline?: string;
  status?: string;
  responsible?: string;
  notes?: string;
  items: RemoteSignatureQuoteItem[];
};

export type RemoteSignatureCheckResult = {
  found: boolean;
  status?: "pending" | "signed" | "expired" | "cancelled";
  token?: string;
  signingUrl?: string;
  signedAt?: string;
  expiresAt?: string;
  clientSignature?: {
    signerName?: string;
    mode?: "Pendente" | "Rubrica predefinida" | "Assinatura livre" | "Nome digitado + aceite";
    signedAt?: string;
    signatureDataUrl?: string;
    acceptedTerms?: boolean;
  };
};

export async function createRemoteSignatureLink(snapshot: RemoteSignatureQuoteSnapshot) {
  const response = await fetch("/api/signature/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      quoteId: snapshot.id,
      quoteSnapshot: snapshot,
      clientName: snapshot.contact || snapshot.client,
      clientPhone: snapshot.phone || "",
      clientEmail: snapshot.email || "",
      responsibleName: snapshot.responsible || "Guilherme Santana",
      expiresInDays: 7
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao gerar link de assinatura.");
  }

  return data as {
    ok: true;
    token: string;
    signingUrl: string;
  };
}

export async function checkRemoteSignatureStatus(quoteId: string) {
  const response = await fetch(`/api/signature/by-quote/${encodeURIComponent(quoteId)}`, {
    cache: "no-store"
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao verificar assinatura.");
  }

  return data as RemoteSignatureCheckResult;
}

export function makeSignatureWhatsAppLink(phone: string | undefined, signingUrl: string, quoteId: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  const phoneNumber = digits.startsWith("55") ? digits : `55${digits}`;

  const message = [
    "Olá! Segue o link para aprovar e assinar seu orçamento da Volt Soluções Elétricas:",
    "",
    `Orçamento: ${quoteId}`,
    signingUrl,
    "",
    "Você pode abrir pelo celular e assinar com o dedo."
  ].join("\n");

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
