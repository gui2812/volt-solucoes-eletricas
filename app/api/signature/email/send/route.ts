import { NextResponse } from "next/server";

type SendSignatureEmailPayload = {
  to: string;
  clientName: string;
  quoteId: string;
  quoteTitle: string;
  signingUrl: string;
  total: string;
  validUntil: string;
};

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Volt Soluções Elétricas <onboarding@resend.dev>";
  const replyTo = process.env.EMAIL_REPLY_TO || "solucoeseletricasvolt@gmail.com";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada na Vercel.");
  }

  return { apiKey, from, replyTo };
}

function escapeHtml(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function emailHtml(payload: SendSignatureEmailPayload) {
  const clientName = escapeHtml(payload.clientName || "Cliente");
  const quoteId = escapeHtml(payload.quoteId);
  const quoteTitle = escapeHtml(payload.quoteTitle);
  const signingUrl = escapeHtml(payload.signingUrl);
  const total = escapeHtml(payload.total);
  const validUntil = escapeHtml(payload.validUntil);

  return `
    <div style="margin:0;padding:0;background:#050505;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:680px;margin:0 auto;padding:28px;">
        <div style="border:1px solid rgba(255,203,47,.45);border-radius:24px;background:#080c11;padding:28px;">
          <div style="font-size:12px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#ffcb2f;">
            Volt Soluções Elétricas
          </div>

          <h1 style="margin:12px 0 8px;font-size:30px;line-height:1.15;color:#ffffff;">
            Orçamento para análise e assinatura
          </h1>

          <p style="margin:0 0 22px;color:#d4d4d8;font-size:15px;line-height:1.7;">
            Olá, <strong>${clientName}</strong>. Segue o orçamento da Volt Soluções Elétricas para conferência e assinatura digital.
          </p>

          <div style="border:1px solid rgba(255,255,255,.12);border-radius:18px;background:#000000;padding:18px;margin:20px 0;">
            <p style="margin:0 0 8px;color:#a1a1aa;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:2px;">Orçamento</p>
            <p style="margin:0;color:#ffcb2f;font-size:24px;font-weight:900;">${quoteId}</p>
            <p style="margin:10px 0 0;color:#ffffff;font-size:16px;font-weight:700;">${quoteTitle}</p>
            <p style="margin:10px 0 0;color:#d4d4d8;font-size:14px;">Valor total: <strong>${total}</strong></p>
            <p style="margin:6px 0 0;color:#d4d4d8;font-size:14px;">Validade: <strong>${validUntil}</strong></p>
          </div>

          <a href="${signingUrl}" target="_blank" style="display:block;text-align:center;text-decoration:none;background:#ffcb2f;color:#050505;border-radius:16px;padding:16px 20px;font-weight:900;font-size:16px;">
            Abrir orçamento e assinar
          </a>

          <p style="margin:22px 0 8px;color:#d4d4d8;font-size:14px;line-height:1.7;">
            Você não precisa acessar nenhum sistema. Basta abrir o link pelo celular, conferir o orçamento e escolher uma das opções de assinatura.
          </p>

          <div style="margin-top:18px;border-top:1px solid rgba(255,255,255,.12);padding-top:18px;">
            <p style="margin:0 0 6px;color:#a1a1aa;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:2px;">Link de assinatura</p>
            <p style="margin:0;color:#ffcb2f;font-size:13px;line-height:1.6;word-break:break-all;">${signingUrl}</p>
          </div>

          <p style="margin:24px 0 0;color:#71717a;font-size:12px;line-height:1.6;">
            Após a assinatura, a Volt Soluções Elétricas receberá a confirmação e poderá gerar a cópia final assinada.
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as SendSignatureEmailPayload;

    if (!payload.to?.trim()) {
      return NextResponse.json(
        { error: "E-mail do cliente não informado." },
        { status: 400 }
      );
    }

    if (!payload.signingUrl?.trim()) {
      return NextResponse.json(
        { error: "Link de assinatura não informado." },
        { status: 400 }
      );
    }

    const { apiKey, from, replyTo } = getEmailConfig();

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        reply_to: replyTo,
        subject: `Orçamento ${payload.quoteId} - Volt Soluções Elétricas`,
        html: emailHtml(payload)
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao enviar e-mail.", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      id: data.id
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro inesperado." },
      { status: 500 }
    );
  }
}
