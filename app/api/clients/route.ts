import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientPayload = Record<string, unknown>;

const TABLE = "app_clients";

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

function array(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function clientToRow(client: ClientPayload) {
  return {
    legacy_id: text(client.id) || `CLI-${Date.now()}`,
    name: text(client.name, "Cliente não informado"),
    fantasy_name: text(client.fantasyName, text(client.name, "Cliente")),
    type: text(client.type, "Pessoa física"),
    document: text(client.document, "Pendente"),
    status: text(client.status, "Ativo"),
    category: text(client.category),
    origin: text(client.origin),
    phone: text(client.phone),
    whatsapp: text(client.whatsapp),
    email: text(client.email),
    neighborhood: text(client.neighborhood),
    city: text(client.city),
    address: text(client.address),
    responsible: text(client.responsible),
    service_interest: text(client.serviceInterest),
    recurrence: text(client.recurrence),
    total_os: number(client.totalOs),
    total_quotes: number(client.totalQuotes),
    total_visits: number(client.totalVisits),
    total_revenue: number(client.totalRevenue),
    received: number(client.received),
    open_amount: number(client.openAmount),
    overdue: number(client.overdue),
    last_service: text(client.lastService),
    next_service: text(client.nextService),
    ticket_average: number(client.ticketAverage),
    rating: text(client.rating, "Comum"),
    notes: text(client.notes),
    timeline: array(client.timeline),
    documents: array(client.documents),
    is_deleted: false,
    updated_at: new Date().toISOString()
  };
}

function rowToClient(row: ClientPayload) {
  return {
    id: text(row.legacy_id, text(row.id)),
    name: text(row.name, "Cliente não informado"),
    fantasyName: text(row.fantasy_name, text(row.name, "Cliente")),
    type: text(row.type, "Pessoa física"),
    document: text(row.document, "Pendente"),
    status: text(row.status, "Ativo"),
    category: text(row.category),
    origin: text(row.origin),
    phone: text(row.phone),
    whatsapp: text(row.whatsapp),
    email: text(row.email),
    neighborhood: text(row.neighborhood),
    city: text(row.city),
    address: text(row.address),
    responsible: text(row.responsible),
    serviceInterest: text(row.service_interest),
    recurrence: text(row.recurrence),
    totalOs: number(row.total_os),
    totalQuotes: number(row.total_quotes),
    totalVisits: number(row.total_visits),
    totalRevenue: number(row.total_revenue),
    received: number(row.received),
    openAmount: number(row.open_amount),
    overdue: number(row.overdue),
    lastService: text(row.last_service, "Sem atendimento"),
    nextService: text(row.next_service, "A definir"),
    ticketAverage: number(row.ticket_average),
    rating: text(row.rating, "Comum"),
    notes: text(row.notes),
    timeline: array(row.timeline) as string[],
    documents: array(row.documents) as string[]
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
        { error: "Falha ao carregar clientes do Supabase.", details: response.data },
        { status: response.status }
      );
    }

    const clients = Array.isArray(response.data) ? response.data.map(rowToClient) : [];

    return NextResponse.json({ clients });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar clientes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = body.client as ClientPayload | undefined;

    if (!client) {
      return NextResponse.json({ error: "Cliente não enviado." }, { status: 400 });
    }

    const row = clientToRow(client);
    const response = await supabaseFetch(`${TABLE}?on_conflict=legacy_id`, {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(row)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Falha ao salvar cliente no Supabase.", details: response.data },
        { status: response.status }
      );
    }

    const saved = Array.isArray(response.data) ? response.data[0] : response.data;

    return NextResponse.json({ client: rowToClient(saved) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar cliente." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const clients = Array.isArray(body.clients) ? body.clients as ClientPayload[] : [];

    if (!clients.length) {
      return NextResponse.json({ clients: [] });
    }

    const rows = clients.map(clientToRow);
    const response = await supabaseFetch(`${TABLE}?on_conflict=legacy_id`, {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(rows)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Falha ao migrar clientes para Supabase.", details: response.data },
        { status: response.status }
      );
    }

    const savedClients = Array.isArray(response.data) ? response.data.map(rowToClient) : [];

    return NextResponse.json({ clients: savedClients });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao migrar clientes." },
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
        { error: "Falha ao excluir cliente no Supabase.", details: response.data },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir cliente." },
      { status: 500 }
    );
  }
}
