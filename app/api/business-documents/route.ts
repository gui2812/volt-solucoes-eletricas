import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BusinessDocumentType = "quote" | "contract" | "company_profile";
type JsonDocument = Record<string, unknown>;

const TABLE = "app_business_documents";
const ALLOWED_TYPES = new Set<BusinessDocumentType>(["quote", "contract", "company_profile"]);

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.");
  }

  return { url: url.replace(/\/$/, ""), key };
}

function supabaseHeaders(key: string, extra?: HeadersInit) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra
  };
}

function isDocumentType(value: string | null): value is BusinessDocumentType {
  return Boolean(value && ALLOWED_TYPES.has(value as BusinessDocumentType));
}

function getLegacyId(document: JsonDocument) {
  const value = document.id;
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

async function supabaseFetch(path: string, init?: RequestInit) {
  const { url, key } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: supabaseHeaders(key, init?.headers)
  });

  const raw = await response.text();
  let data: unknown = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }

  return { ok: response.ok, status: response.status, data };
}

export async function GET(request: Request) {
  try {
    const type = new URL(request.url).searchParams.get("type");

    if (!isDocumentType(type)) {
      return NextResponse.json({ error: "Tipo de documento inválido." }, { status: 400 });
    }

    const response = await supabaseFetch(
      `${TABLE}?document_type=eq.${encodeURIComponent(type)}&select=legacy_id,payload,is_deleted,updated_at&order=updated_at.desc`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Falha ao carregar dados do Supabase.", details: response.data },
        { status: response.status }
      );
    }

    const rows = Array.isArray(response.data) ? response.data as Array<Record<string, unknown>> : [];
    const activeRows = rows.filter((row) => row.is_deleted !== true);
    const documents = activeRows
      .map((row) => row.payload)
      .filter((payload): payload is JsonDocument => Boolean(payload && typeof payload === "object" && !Array.isArray(payload)));
    const deletedIds = rows
      .filter((row) => row.is_deleted === true && typeof row.legacy_id === "string")
      .map((row) => String(row.legacy_id));

    return NextResponse.json({ documents, deletedIds });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar dados." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const type = typeof body.type === "string" ? body.type : null;
    const documents = Array.isArray(body.documents) ? body.documents as JsonDocument[] : [];

    if (!isDocumentType(type)) {
      return NextResponse.json({ error: "Tipo de documento inválido." }, { status: 400 });
    }

    if (documents.length > 1000) {
      return NextResponse.json({ error: "Muitos registros enviados de uma vez." }, { status: 413 });
    }

    const now = new Date().toISOString();
    const rows = documents
      .map((document) => ({ document, legacyId: getLegacyId(document) }))
      .filter((item) => item.legacyId)
      .map(({ document, legacyId }) => ({
        document_type: type,
        legacy_id: legacyId,
        payload: document,
        is_deleted: false,
        deleted_at: null,
        updated_at: now
      }));

    if (!rows.length) {
      return NextResponse.json({ documents: [] });
    }

    const response = await supabaseFetch(`${TABLE}?on_conflict=document_type,legacy_id`, {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(rows)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Falha ao salvar dados no Supabase.", details: response.data },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true, saved: rows.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar dados." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const legacyId = url.searchParams.get("id")?.trim() || "";

    if (!isDocumentType(type) || !legacyId) {
      return NextResponse.json({ error: "Tipo e id são obrigatórios." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const response = await supabaseFetch(
      `${TABLE}?document_type=eq.${encodeURIComponent(type)}&legacy_id=eq.${encodeURIComponent(legacyId)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ is_deleted: true, deleted_at: now, updated_at: now })
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Falha ao excluir registro no Supabase.", details: response.data },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir registro." },
      { status: 500 }
    );
  }
}
