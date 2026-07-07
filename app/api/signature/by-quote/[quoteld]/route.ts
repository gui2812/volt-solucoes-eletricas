import { NextResponse } from "next/server";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Configuração do Supabase ausente. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.");
  }

  return { url, key };
}

export async function GET(
  request: Request,
  { params }: { params: { quoteId: string } }
) {
  try {
    const { url, key } = getSupabaseConfig();
    const quoteId = decodeURIComponent(params.quoteId);

    const response = await fetch(
      `${url}/rest/v1/quote_signature_links?quote_id=eq.${encodeURIComponent(quoteId)}&select=*&order=created_at.desc&limit=1`,
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
      return NextResponse.json(
        { error: "Erro ao buscar status da assinatura.", details: data },
        { status: response.status }
      );
    }

    const record = Array.isArray(data) ? data[0] : null;

    if (!record) {
      return NextResponse.json({ found: false });
    }

    const expired = record.expires_at && new Date(record.expires_at).getTime() < Date.now();
    const status = expired && record.status === "pending" ? "expired" : record.status;

    const origin = new URL(request.url).origin;

    return NextResponse.json({
      found: true,
      status,
      token: record.token,
      signingUrl: `${origin}/assinar/${record.token}`,
      signedAt: record.signed_at,
      expiresAt: record.expires_at,
      clientSignature: record.client_signature
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
