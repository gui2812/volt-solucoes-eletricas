import { NextResponse } from "next/server";

type SignaturePayload = {
  signerName: string;
  signatureMode: "Assinatura livre" | "Rubrica predefinida" | "Nome digitado + aceite";
  signatureStyle?: "Clássica" | "Elegante" | "Moderna" | "Rubrica rápida" | "Formal";
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


async function sendSignedConfirmationEmail({
  to,
  clientName,
  quoteId,
  quoteTitle,
  signedAt,
  signingUrl
}: {
  to?: string;
  clientName?: string;
  quoteId: string;
  quoteTitle?: string;
  signedAt: string;
  signingUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Volt Soluções Elétricas <onboarding@resend.dev>";
  const replyTo = process.env.EMAIL_REPLY_TO || "solucoeseletricasvolt@gmail.com";

  if (!apiKey || !to) {
    return { skipped: true };
  }

  const html = `
    <div style="margin:0;padding:0;background:#050505;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:680px;margin:0 auto;padding:28px;">
        <div style="border:1px solid rgba(34,197,94,.45);border-radius:24px;background:#080c11;padding:28px;">
          <div style="font-size:12px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#22c55e;">
            Orçamento assinado
          </div>

          <h1 style="margin:12px 0 8px;font-size:30px;line-height:1.15;color:#ffffff;">
            Assinatura registrada com sucesso
          </h1>

          <p style="margin:0 0 22px;color:#d4d4d8;font-size:15px;line-height:1.7;">
            Olá, <strong>${clientName || "Cliente"}</strong>. Recebemos sua aprovação e assinatura digital do orçamento <strong>${quoteId}</strong>.
          </p>

          <div style="border:1px solid rgba(255,255,255,.12);border-radius:18px;background:#000000;padding:18px;margin:20px 0;">
            <p style="margin:0;color:#ffffff;font-size:16px;font-weight:700;">${quoteTitle || "Orçamento Volt Soluções Elétricas"}</p>
            <p style="margin:10px 0 0;color:#d4d4d8;font-size:14px;">Data da assinatura: <strong>${signedAt}</strong></p>
          </div>

          <a href="${signingUrl}" target="_blank" style="display:block;text-align:center;text-decoration:none;background:#22c55e;color:#050505;border-radius:16px;padding:16px 20px;font-weight:900;font-size:16px;">
            Ver orçamento assinado
          </a>

          <p style="margin:24px 0 0;color:#71717a;font-size:12px;line-height:1.6;">
            A Volt Soluções Elétricas também recebeu essa confirmação e poderá gerar a cópia final assinada em PDF.
          </p>
        </div>
      </div>
    </div>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo,
      subject: `Orçamento ${quoteId} assinado - Volt Soluções Elétricas`,
      html
    })
  });

  return { ok: true };
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
      signatureStyle: payload.signatureStyle || "Clássica",
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
