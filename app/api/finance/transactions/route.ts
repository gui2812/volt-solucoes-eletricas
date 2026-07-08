import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TransactionPayload = Record<string, unknown>;

const TABLE = "app_financial_transactions";

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

function transactionToRow(transaction: TransactionPayload) {
  return {
    legacy_id: text(transaction.id) || `FIN-${Date.now()}`,
    type: text(transaction.type, "Receita"),
    title: text(transaction.title, "Lançamento financeiro"),
    client_supplier: text(transaction.clientSupplier),
    cost_center: text(transaction.costCenter),
    category: text(transaction.category),
    budgeted: number(transaction.budgeted),
    actual: number(transaction.actual),
    competence_date: text(transaction.competenceDate),
    due_date: text(transaction.dueDate),
    payment_date: text(transaction.paymentDate),
    status: text(transaction.status, "Aberto"),
    payment_method: text(transaction.paymentMethod),
    service_order: text(transaction.serviceOrder),
    quote: text(transaction.quote),
    recurrence: text(transaction.recurrence, "Única"),
    responsible: text(transaction.responsible),
    notes: text(transaction.notes),
    is_deleted: false,
    updated_at: new Date().toISOString()
  };
}

function rowToTransaction(row: TransactionPayload) {
  return {
    id: text(row.legacy_id, text(row.id)),
    type: text(row.type, "Receita"),
    title: text(row.title, "Lançamento financeiro"),
    clientSupplier: text(row.client_supplier),
    costCenter: text(row.cost_center),
    category: text(row.category),
    budgeted: number(row.budgeted),
    actual: number(row.actual),
    competenceDate: text(row.competence_date),
    dueDate: text(row.due_date),
    paymentDate: text(row.payment_date),
    status: text(row.status, "Aberto"),
    paymentMethod: text(row.payment_method),
    serviceOrder: text(row.service_order),
    quote: text(row.quote),
    recurrence: text(row.recurrence, "Única"),
    responsible: text(row.responsible),
    notes: text(row.notes)
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
        { error: "Falha ao carregar lançamentos do Supabase.", details: response.data },
        { status: response.status }
      );
    }

    const transactions = Array.isArray(response.data) ? response.data.map(rowToTransaction) : [];

    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar lançamentos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const transaction = body.transaction as TransactionPayload | undefined;

    if (!transaction) {
      return NextResponse.json({ error: "Lançamento não enviado." }, { status: 400 });
    }

    const row = transactionToRow(transaction);
    const response = await supabaseFetch(`${TABLE}?on_conflict=legacy_id`, {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(row)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Falha ao salvar lançamento no Supabase.", details: response.data },
        { status: response.status }
      );
    }

    const saved = Array.isArray(response.data) ? response.data[0] : response.data;

    return NextResponse.json({ transaction: rowToTransaction(saved) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar lançamento." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const transactions = Array.isArray(body.transactions) ? body.transactions as TransactionPayload[] : [];

    if (!transactions.length) {
      return NextResponse.json({ transactions: [] });
    }

    const rows = transactions.map(transactionToRow);
    const response = await supabaseFetch(`${TABLE}?on_conflict=legacy_id`, {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(rows)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Falha ao migrar lançamentos para Supabase.", details: response.data },
        { status: response.status }
      );
    }

    const savedTransactions = Array.isArray(response.data) ? response.data.map(rowToTransaction) : [];

    return NextResponse.json({ transactions: savedTransactions });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao migrar lançamentos." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const legacyId = url.searchParams.get("legacyId");
    const all = url.searchParams.get("all") === "true";

    if (!legacyId && !all) {
      return NextResponse.json({ error: "legacyId ou all=true não informado." }, { status: 400 });
    }

    const filter = all ? "is_deleted=eq.false" : `legacy_id=eq.${encodeURIComponent(legacyId || "")}`;
    const response = await supabaseFetch(`${TABLE}?${filter}`, {
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
        { error: "Falha ao excluir lançamento no Supabase.", details: response.data },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir lançamento." },
      { status: 500 }
    );
  }
}
