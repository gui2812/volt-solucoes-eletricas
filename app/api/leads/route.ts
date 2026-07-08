import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadPayload = Record<string, unknown>;

const TABLE = "app_leads";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.");
  }

  return {
    url: url.replace(/\/$/, ""),
    key
  };
}

function headers(key: string, extra?: HeadersInit) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra
  };
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function number(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function leadToRow(lead: LeadPayload) {
  return {
    legacy_id: text(lead.id) || `LEAD-${Date.now()}`,
    name: text(lead.name, "Lead sem nome"),
    phone: text(lead.phone),
    origin: text(lead.origin, "Manual"),
    service: text(lead.service, "A definir"),
    estimated_value: number(lead.estimatedValue),
    status: text(lead.status, "Novo"),
    temperature: text(lead.temperature, "Morno"),
    next_contact: text(lead.nextContact),
    responsible: text(lead.responsible, "Guilherme"),
    is_deleted: false,
    updated_at: new Date().toISOString()
  };
}

function rowToLead(row: LeadPayload) {
  return {
    id: text(row.legacy_id, text(row.id)),
    name: text(row.name, "Lead sem nome"),
    phone: text(row.phone),
    origin: text(row.origin, "Manual"),
    service: text(row.service, "A definir"),
    estimatedValue: number(row.estimated_value),
    status: text(row.status, "Novo"),
    temperature: text(row.temperature, "Morno"),
    nextContact: text(row.next_contact),
    responsible: text(row.responsible, "Guilherme")
  };
}

async function supabaseFetch(path: string, init?: RequestInit) {
  const config = getSupabaseConfig();
  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers: headers(config.key, init?.headers)
  });

  const textBody = await response.text();
  const data = textBody ? JSON.parse(textBody) : null;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data
    };
  }

  return {
    ok: true,
    status: response.status,
    data
  };
}

export async function GET() {
  try {
    const response = await supabaseFetch(`${TABLE}?is_deleted=eq.false&order=created_at.desc`);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Falha ao carregar leads do Supabase.", details: response.data },
        { status: response.status }
      );
    }

    const leads = Array.isArray(response.data) ? response.data.map(rowToLead) : [];

    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar leads." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lead = body.lead as LeadPayload | undefined;

    if (!lead) {
      return NextResponse.json({ error: "Lead não enviado." }, { status: 400 });
    }

    const row = leadToRow(lead);
    const response = await supabaseFetch(`${TABLE}?on_conflict=legacy_id`, {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(row)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Falha ao salvar lead no Supabase.", details: response.data },
        { status: response.status }
      );
    }

    const saved = Array.isArray(response.data) ? response.data[0] : response.data;

    return NextResponse.json({ lead: rowToLead(saved) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar lead." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const legacyId = url.searchParams.get("legacyId");

    if (!legacyId) {
      return NextResponse.json({ error: "legacyId não informado." }, { status: 400 });
    }

    const response = await supabaseFetch(`${TABLE}?legacy_id=eq.${encodeURIComponent(legacyId)}`, {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Falha ao excluir lead no Supabase.", details: response.data },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir lead." },
      { status: 500 }
    );
  }
}
