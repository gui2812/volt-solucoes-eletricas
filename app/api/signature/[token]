import { NextResponse } from "next/server";

type SignaturePayload = {
  signerName: string;
  signatureMode: "Assinatura livre" | "Rubrica predefinida" | "Nome digitado + aceite";
  signatureDataUrl?: string;
  acceptedTerms: boolean;
};

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Configuração do Supabase ausente. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.");
  }

  return { url, key };
}

async function getRecord(token: string) {
  const { url, key } = getSupabaseConfig();

  const response = await fetch(
    `${url}/rest/v1/quote_signature_links?token=eq.${encodeURIComponent(token)}&select=*`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Erro ao buscar orçamento para assinatura.");
  }

  return Array.isArray(data) ? data[0] : null;
}

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const record = await getRecord(params.token);

    if (!record) {
      return NextResponse.json(
        { error: "Link de assinatura não encontrado." },
        { status: 404 }
      );
    }

    const expired = record.expires_at && new Date(record.expires_at).getTime() < Date.now();

    if (expired && record.status === "pending") {
      return NextResponse.json(
        {
          error: "Este link de assinatura expirou.",
          status: "expired"
        },
        { status: 410 }
      );
    }

    return NextResponse.json({
      id: record.id,
      quoteId: record.quote_id,
      status: record.status,
      quoteSnapshot: record.quote_snapshot,
      clientName: record.client_name,
      clientPhone: record.client_phone,
      responsibleName: record.responsible_name,
      clientSignature: record.client_signature,
      responsibleSignature: record.responsible_signature,
      sentAt: record.sent_at,
      signedAt: record.signed_at,
      expiresAt: record.expires_at
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const payload = (await request.json()) as SignaturePayload;

    if (!payload.signerName?.trim()) {
      return NextResponse.json(
        { error: "Informe o nome do assinante." },
        { status: 400 }
      );
    }

    if (!payload.acceptedTerms) {
      return NextResponse.json(
        { error: "É necessário aceitar o orçamento antes de assinar." },
        { status: 400 }
      );
    }

    const current = await getRecord(params.token);

    if (!current) {
      return NextResponse.json(
        { error: "Link de assinatura não encontrado." },
        { status: 404 }
      );
    }

    if (current.status !== "pending") {
      return NextResponse.json(
        { error: "Este orçamento não está pendente de assinatura.", status: current.status },
        { status: 409 }
      );
    }

    const expired = current.expires_at && new Date(current.expires_at).getTime() < Date.now();

    if (expired) {
      return NextResponse.json(
        { error: "Este link de assinatura expirou." },
        { status: 410 }
      );
    }

    const { url, key } = getSupabaseConfig();
    const now = new Date().toISOString();

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "";
    const userAgent = request.headers.get("user-agent") || "";

    const signature = {
      signerName: payload.signerName.trim(),
      mode: payload.signatureMode,
      signedAt: now.slice(0, 10),
      signatureDataUrl: payload.signatureDataUrl || "",
      acceptedTerms: true
    };

    const updatePayload = {
      status: "signed",
      client_signature: signature,
      signed_at: now,
      ip_address: ip,
      user_agent: userAgent,
      updated_at: now
    };

    const response = await fetch(
      `${url}/rest/v1/quote_signature_links?token=eq.${encodeURIComponent(params.token)}`,
      {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify(updatePayload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao salvar assinatura.", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      status: "signed",
      record: Array.isArray(data) ? data[0] : data
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
