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

export type RemoteSignatureMode =
  | "Pendente"
  | "Assinatura livre"
  | "Rubrica predefinida"
  | "Nome digitado + aceite";

export type RemoteSignatureStyle =
  | "Clássica"
  | "Elegante"
  | "Moderna"
  | "Rubrica rápida"
  | "Formal";

export type RemoteSignatureCheckResult = {
  found: boolean;
  status?: "pending" | "signed" | "expired" | "cancelled";
  token?: string;
  signingUrl?: string;
  signedAt?: string;
  expiresAt?: string;
  clientSignature?: {
    signerName?: string;
    mode?: RemoteSignatureMode;
    signedAt?: string;
    signatureDataUrl?: string;
    signatureStyle?: RemoteSignatureStyle;
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


export async function checkRemoteSignatureByToken(token: string) {
  if (!token?.trim()) {
    return { found: false } as RemoteSignatureCheckResult;
  }

  const response = await fetch(`/api/signature/${encodeURIComponent(token)}`, {
    cache: "no-store"
  });

  const data = await response.json();

  if (response.status === 404 || response.status === 410) {
    return { found: false } as RemoteSignatureCheckResult;
  }

  if (!response.ok) {
    throw new Error(data.error || "Erro ao verificar assinatura pelo token.");
  }

  return {
    found: true,
    status: data.status,
    token,
    signingUrl: `/assinar/${token}`,
    signedAt: data.signedAt,
    expiresAt: data.expiresAt,
    clientSignature: data.clientSignature
  } as RemoteSignatureCheckResult;
}

export function makeSignatureWhatsAppLink(phone: string | undefined, signingUrl: string, quoteId: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  const phoneNumber = digits.startsWith("55") ? digits : `55${digits}`;

  const message = [
    "Olá! Segue o link do seu orçamento da Volt Soluções Elétricas para análise e assinatura digital:",
    "",
    `Orçamento: ${quoteId}`,
    signingUrl,
    "",
    "Você não precisa acessar nenhum sistema. É só abrir o link pelo celular, conferir o orçamento e assinar com o dedo ou escolher uma rubrica."
  ].join("\n");

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
