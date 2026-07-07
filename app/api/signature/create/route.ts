import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const rawUrl = process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const url = rawUrl?.trim();
  const key = rawKey?.trim();

  if (!url) {
    throw new Error("SUPABASE_URL não configurada na Vercel.");
  }

  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel.");
  }

  if (!url.startsWith("https://")) {
    throw new Error("SUPABASE_URL inválida. Ela precisa começar com https://");
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

function buildSupabaseEndpoint(baseUrl: string) {
  return new URL("/rest/v1/quote_signature_links", baseUrl).toString();
}

async function readResponse(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
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

    const endpoint = buildSupabaseEndpoint(url);

    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify(insertPayload)
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: "Falha ao conectar no Supabase. Confira se a SUPABASE_URL está correta e se o projeto Supabase está ativo.",
          details: {
            message: error instanceof Error ? error.message : String(error),
            cause: error instanceof Error && "cause" in error ? String((error as Error & { cause?: unknown }).cause) : "",
            supabaseHost: new URL(endpoint).host
          }
        },
        { status: 500 }
      );
    }

    const data = await readResponse(response);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Supabase recusou a criação do link de assinatura.",
          details: {
            status: response.status,
            statusText: response.statusText,
            response: data
          }
        },
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
      {
        error: error instanceof Error ? error.message : "Erro inesperado ao criar link de assinatura."
      },
      { status: 500 }
    );
  }
}
