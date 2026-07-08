import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GoalPayload = Record<string, unknown>;

const TABLE = "app_financial_goals";

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

function goalToRow(goal: GoalPayload) {
  return {
    legacy_id: text(goal.id) || `META-${Date.now()}`,
    title: text(goal.title, "Meta financeira"),
    period: text(goal.period, "Mensal"),
    category: text(goal.category, "Faturamento"),
    target: number(goal.target),
    actual: number(goal.actual),
    notes: text(goal.notes),
    is_deleted: false,
    updated_at: new Date().toISOString()
  };
}

function rowToGoal(row: GoalPayload) {
  return {
    id: text(row.legacy_id, text(row.id)),
    title: text(row.title, "Meta financeira"),
    period: text(row.period, "Mensal"),
    category: text(row.category, "Faturamento"),
    target: number(row.target),
    actual: number(row.actual),
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
        { error: "Falha ao carregar metas do Supabase.", details: response.data },
        { status: response.status }
      );
    }

    const goals = Array.isArray(response.data) ? response.data.map(rowToGoal) : [];

    return NextResponse.json({ goals });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao carregar metas." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const goal = body.goal as GoalPayload | undefined;

    if (!goal) {
      return NextResponse.json({ error: "Meta não enviada." }, { status: 400 });
    }

    const row = goalToRow(goal);
    const response = await supabaseFetch(`${TABLE}?on_conflict=legacy_id`, {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(row)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Falha ao salvar meta no Supabase.", details: response.data },
        { status: response.status }
      );
    }

    const saved = Array.isArray(response.data) ? response.data[0] : response.data;

    return NextResponse.json({ goal: rowToGoal(saved) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao salvar meta." },
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
        { error: "Falha ao excluir meta no Supabase.", details: response.data },
        { status: response.status }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir meta." },
      { status: 500 }
    );
  }
}
