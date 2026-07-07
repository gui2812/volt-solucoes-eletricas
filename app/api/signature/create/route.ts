import { NextResponse } from "next/server";

type CreateSignaturePayload = {
  quoteId: string;
  quoteSnapshot: Record<string, unknown>;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  responsibleName?: string;
  expiresInDays?: number;
};

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Configuração do Supabase ausente. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.");
  }

  return { url, key };
}

function makeToken() {
  const random = crypto.randomUUID().replaceAll("-", "");
  return `volt_${random}`;
}

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateSignaturePayload;

    if (!body.quoteId || !body.quoteSnapshot) {
      return NextResponse.json(
        { error: "quoteId e quoteSnapshot são obrigatórios." },
        { status: 400 }
      );
    }

    const { url, key } = getSupabaseConfig();
    const token = makeToken();
    const expiresInDays = Number(body.expiresInDays || 7);

    const insertPayload = {
      token,
      quote_id: body.quoteId,
      quote_snapshot: body.quoteSnapshot,
      status: "pending",
      client_name: body.clientName || "",
      client_phone: body.clientPhone || "",
      client_email: body.clientEmail || "",
      responsible_name: body.responsibleName || "",
      expires_at: addDays(expiresInDays)
    };

    const response = await fetch(`${url}/rest/v1/quote_signature_links`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(insertPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao criar link de assinatura.", details: data },
        { status: response.status }
      );
    }

    const origin = new URL(request.url).origin;
    const signingUrl = `${origin}/assinar/${token}`;

    return NextResponse.json({
      ok: true,
      token,
      signingUrl,
      record: Array.isArray(data) ? data[0] : data
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
