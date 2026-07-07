import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url) {
    throw new Error("SUPABASE_URL não configurada na Vercel.");
  }

  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada na Vercel.");
  }

  return { url, key };
}

async function readResponse(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function POST(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = decodeURIComponent(params.token || "");

    if (!token) {
      return NextResponse.json(
        { error: "Token não informado." },
        { status: 400 }
      );
    }

    const { url, key } = getSupabaseConfig();

    const getResponse = await fetch(
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

    const currentData = await readResponse(getResponse);

    if (!getResponse.ok) {
      return NextResponse.json(
        {
          error: "Erro ao buscar link de assinatura.",
          details: currentData
        },
        { status: getResponse.status }
      );
    }

    const record = Array.isArray(currentData) ? currentData[0] : null;

    if (!record) {
      return NextResponse.json(
        { error: "Link de assinatura não encontrado." },
        { status: 404 }
      );
    }

    if (record.status === "signed") {
      return NextResponse.json(
        { error: "Este orçamento já foi assinado e não pode ser cancelado." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();

    const patchResponse = await fetch(
      `${url}/rest/v1/quote_signature_links?token=eq.${encodeURIComponent(token)}`,
      {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          status: "cancelled",
          updated_at: now
        })
      }
    );

    const data = await readResponse(patchResponse);

    if (!patchResponse.ok) {
      return NextResponse.json(
        {
          error: "Erro ao cancelar link de assinatura.",
          details: data
        },
        { status: patchResponse.status }
      );
    }

    return NextResponse.json({
      ok: true,
      status: "cancelled",
      record: Array.isArray(data) ? data[0] : data
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado ao cancelar link." },
      { status: 500 }
    );
  }
}
