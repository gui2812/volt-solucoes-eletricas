export type OrcamentoPdfItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total?: number;
  kind?: "Material" | "Serviço" | "Mão de obra" | "Deslocamento" | "Taxa" | "Outro";
};

export type OrcamentoPdfSignature = {
  signerName?: string;
  mode?: "Pendente" | "Rubrica predefinida" | "Assinatura livre";
  signedAt?: string;
  signatureDataUrl?: string;
};

export type OrcamentoPdfData = {
  number: string;
  date: string;
  validUntil: string;
  status: string;

  clientName: string;
  clientPhone: string;
  clientAddress: string;
  service: string;

  items: OrcamentoPdfItem[];

  laborValue?: number;
  discountValue?: number;

  paymentCondition: string;
  executionDeadline: string;
  warranty: string;

  technicalNotes: string[];
  responsibleName: string;
  responsibleRole?: string;
  responsibleDocument?: string;

  responsibleSignature?: OrcamentoPdfSignature;
  clientSignature?: OrcamentoPdfSignature;

  companyPhone?: string;
  companyEmail?: string;
  companyCity?: string;
  companyWebsite?: string;
  logoSrc?: string;
};

function brl(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("pt-BR");
}

function safe(value?: string) {
  return value && value.trim() ? value : "-";
}

function rowTotal(item: OrcamentoPdfItem) {
  return typeof item.total === "number" ? item.total : Number(item.quantity || 0) * Number(item.unitPrice || 0);
}

function signatureVisual(signature: OrcamentoPdfSignature | undefined, fallbackName: string, isClient = false) {
  const name = safe(signature?.signerName || fallbackName);
  const mode = signature?.mode || "Pendente";
  const signedAt = signature?.signedAt ? formatDate(signature.signedAt) : "";

  if (signature?.signatureDataUrl) {
    return `
      <div class="signature-visual">
        <img src="${signature.signatureDataUrl}" alt="Assinatura" />
      </div>
      <div class="signature-line"></div>
      <div class="signature-name">${name}</div>
      <div class="signature-doc">${mode}${signedAt ? ` em ${signedAt}` : ""}</div>
    `;
  }

  if (mode === "Rubrica predefinida") {
    return `
      <div class="signature-visual">
        <div class="signature-script">${name}</div>
      </div>
      <div class="signature-line"></div>
      <div class="signature-name">${name}</div>
      <div class="signature-doc">Rubrica predefinida${signedAt ? ` em ${signedAt}` : ""}</div>
    `;
  }

  return `
    <div class="signature-visual pending">
      <div>
        <div class="pending-icon">✍</div>
        <strong>${isClient ? "Assinatura do cliente pendente" : "Assinatura pendente"}</strong>
        <span>Assinar pelo celular, tablet ou computador</span>
      </div>
    </div>
    <div class="signature-line"></div>
    <div class="signature-name">${name}</div>
    <div class="signature-doc">Aguardando assinatura digital</div>
  `;
}

export function generateOrcamentoPdfHtml(data: OrcamentoPdfData) {
  const subtotal = data.items.reduce((sum, item) => sum + rowTotal(item), 0);
  const laborValue =
    typeof data.laborValue === "number"
      ? data.laborValue
      : data.items.filter((item) => item.kind === "Mão de obra").reduce((sum, item) => sum + rowTotal(item), 0);
  const discountValue = Number(data.discountValue || 0);
  const total = Math.max(subtotal - discountValue, 0);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const logoSrc = data.logoSrc || "/img/logo.png";

  const itemsRows = data.items.map((item, index) => {
    const totalItem = rowTotal(item);

    return `
      <tr>
        <td class="td item-number">${String(index + 1).padStart(2, "0")}</td>
        <td class="td description">
          <strong>${safe(item.description)}</strong>
          <span>${safe(item.kind || "Item")}</span>
        </td>
        <td class="td center">${item.quantity || 0}</td>
        <td class="td center">${safe(item.unit)}</td>
        <td class="td money">${brl(Number(item.unitPrice || 0))}</td>
        <td class="td money">${brl(totalItem)}</td>
      </tr>
    `;
  }).join("");

  const notes = (data.technicalNotes?.length ? data.technicalNotes : [
    "Todos os materiais e serviços serão executados conforme boas práticas técnicas aplicáveis.",
    "Serviço executado por profissional qualificado.",
    "Testes de funcionamento e entrega técnica inclusos."
  ]).map((note) => `<li>${note}</li>`).join("");

  return `
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <base href="${origin}/" />
  <title>Orçamento ${safe(data.number)} - Volt Soluções Elétricas</title>

  <style>
    @page {
      size: A4;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      background: #111;
      color: #f7f7f7;
      font-family: Arial, Helvetica, sans-serif;
    }

    .page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      overflow: hidden;
      background:
        radial-gradient(circle at 18% 0%, rgba(255, 203, 47, .12), transparent 28%),
        radial-gradient(circle at 80% 100%, rgba(255, 203, 47, .08), transparent 35%),
        linear-gradient(135deg, #050505 0%, #090909 48%, #030303 100%);
      padding: 10mm;
    }

    .page::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
      background-size: 18px 18px;
      opacity: .35;
      pointer-events: none;
    }

    .yellow-cut {
      position: absolute;
      top: -12mm;
      right: -20mm;
      width: 82mm;
      height: 34mm;
      background: #ffcb2f;
      transform: skewX(-24deg);
      box-shadow: -7mm 0 0 rgba(255,255,255,.92), -10mm 0 0 rgba(255,255,255,.22);
    }

    .bottom-bar {
      position: absolute;
      left: -10mm;
      bottom: 0;
      width: 112mm;
      height: 14mm;
      background: #ffcb2f;
      transform: skewX(-25deg);
    }

    .content {
      position: relative;
      z-index: 2;
    }

    .header {
      display: grid;
      grid-template-columns: 1.08fr .92fr;
      gap: 9mm;
      align-items: start;
    }

    .brand {
      display: grid;
      grid-template-columns: 34mm 1fr;
      gap: 6mm;
      align-items: center;
      min-height: 38mm;
    }

    .logo-box {
      display: grid;
      place-items: center;
      min-height: 34mm;
    }

    .logo-box img {
      width: 32mm;
      height: 32mm;
      object-fit: contain;
    }

    .brand-info {
      border-left: 1mm solid #ffcb2f;
      padding-left: 6mm;
    }

    .brand-title {
      font-size: 6.5mm;
      line-height: 1;
      font-weight: 950;
      letter-spacing: 1.1px;
      text-transform: uppercase;
      color: #fff;
    }

    .brand-sub {
      margin-top: 2mm;
      color: #ffcb2f;
      font-size: 3.8mm;
      font-weight: 900;
      letter-spacing: 2.2px;
      text-transform: uppercase;
    }

    .brand-slogan {
      margin-top: 2mm;
      color: #d6d6d6;
      font-size: 2.3mm;
      font-weight: 700;
      letter-spacing: .5px;
      text-transform: uppercase;
    }

    .company-contact {
      border: 1px solid rgba(255, 203, 47, .65);
      border-radius: 3mm;
      padding: 4mm;
      background: rgba(0,0,0,.33);
    }

    .contact-line {
      display: grid;
      grid-template-columns: 7mm 1fr;
      align-items: center;
      gap: 2mm;
      min-height: 7.3mm;
      border-bottom: 1px solid rgba(255,255,255,.14);
      color: #fff;
      font-size: 3.2mm;
    }

    .contact-line:last-child {
      border-bottom: 0;
    }

    .contact-line .icon {
      color: #ffcb2f;
      text-align: center;
      font-size: 4mm;
    }

    .top-area {
      display: grid;
      grid-template-columns: 1.1fr .9fr;
      gap: 8mm;
      margin-top: 7mm;
    }

    .title {
      margin: 0;
      color: white;
      font-size: 13mm;
      line-height: .9;
      font-weight: 950;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .title-line {
      margin-top: 4mm;
      width: 31mm;
      height: 1mm;
      background: #ffcb2f;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 3mm;
      margin-bottom: 3mm;
      color: #fff;
      text-transform: uppercase;
      font-weight: 900;
      font-size: 3.6mm;
      letter-spacing: 1px;
    }

    .section-title .square {
      width: 8mm;
      height: 8mm;
      border-radius: 2mm;
      display: grid;
      place-items: center;
      background: #ffcb2f;
      color: #050505;
      font-weight: 900;
    }

    .yellow-line {
      height: .5mm;
      flex: 1;
      background: #ffcb2f;
    }

    .client-card {
      margin-top: 8mm;
    }

    .client-box,
    .budget-card,
    .notes-box,
    .condition-box,
    .signature-box,
    .thanks-box,
    .intro-box {
      border: 1px solid rgba(255,255,255,.28);
      border-radius: 3mm;
      background: rgba(0,0,0,.35);
      box-shadow: 0 0 22px rgba(0,0,0,.28);
    }

    .client-box {
      padding: 2mm 0;
    }

    .client-row {
      display: grid;
      grid-template-columns: 29mm 1fr;
      min-height: 7.2mm;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,.12);
      padding: 1mm 4mm;
      font-size: 3mm;
    }

    .client-row:last-child {
      border-bottom: 0;
    }

    .client-label {
      font-weight: 900;
      color: #fff;
    }

    .client-value {
      color: #f0f0f0;
      line-height: 1.25;
    }

    .budget-card {
      border-color: #ffcb2f;
      padding: 5mm;
    }

    .budget-head {
      display: grid;
      grid-template-columns: 13mm 1fr;
      gap: 4mm;
      align-items: center;
      padding-bottom: 4mm;
      border-bottom: 1px solid rgba(255,255,255,.18);
      margin-bottom: 3mm;
    }

    .budget-icon {
      width: 13mm;
      height: 13mm;
      display: grid;
      place-items: center;
      border: .6mm solid #ffcb2f;
      border-radius: 3mm;
      color: #ffcb2f;
      font-size: 6mm;
    }

    .budget-label {
      color: #fff;
      font-size: 4.2mm;
    }

    .budget-code {
      margin-top: 1mm;
      color: #ffcb2f;
      font-size: 7.6mm;
      line-height: 1;
      font-weight: 950;
      letter-spacing: 2px;
      word-break: break-word;
    }

    .budget-row {
      display: grid;
      grid-template-columns: 8mm 42mm 1fr;
      gap: 2mm;
      align-items: center;
      min-height: 8.5mm;
      border-bottom: 1px solid rgba(255,255,255,.13);
      font-size: 3.4mm;
    }

    .budget-row:last-child {
      border-bottom: 0;
    }

    .budget-row .icon {
      color: #ffcb2f;
      font-size: 4mm;
      text-align: center;
    }

    .budget-row strong {
      color: #fff;
    }

    .budget-row .value {
      text-align: right;
      color: #fff;
      font-weight: 800;
    }

    .status-pill {
      display: inline-flex;
      justify-content: center;
      border: 1px solid rgba(255,203,47,.8);
      border-radius: 999px;
      padding: 1.3mm 4mm;
      color: #ffcb2f;
      font-weight: 950;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .intro-box {
      margin-top: 7mm;
      display: grid;
      grid-template-columns: 9mm 1fr;
      gap: 3mm;
      align-items: center;
      padding: 3.5mm 4mm;
      color: #f1f1f1;
      font-size: 3.3mm;
      line-height: 1.4;
    }

    .intro-box b {
      color: #ffcb2f;
      font-size: 5mm;
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }

    .items-table {
      margin-top: 5mm;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.30);
      border-radius: 3mm;
      background: rgba(0,0,0,.28);
    }

    .items-table th {
      height: 9mm;
      padding: 2mm 3mm;
      border-bottom: 1px solid #ffcb2f;
      border-right: 1px solid rgba(255,255,255,.15);
      color: #ffcb2f;
      font-size: 3.25mm;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: .5px;
    }

    .items-table th:last-child {
      border-right: 0;
    }

    .td {
      padding: 2mm 3mm;
      min-height: 8mm;
      border-right: 1px solid rgba(255,255,255,.12);
      border-bottom: 1px solid rgba(255,255,255,.10);
      color: #efefef;
      font-size: 3mm;
      line-height: 1.2;
    }

    .items-table tr:last-child .td {
      border-bottom: 0;
    }

    .td:last-child {
      border-right: 0;
    }

    .item-number {
      color: #ffcb2f;
      font-weight: 950;
      text-align: center;
      font-size: 3.5mm;
    }

    .description {
      width: 52%;
    }

    .description strong {
      display: block;
      color: #fff;
    }

    .description span {
      display: block;
      margin-top: 1mm;
      color: #a1a1aa;
      font-size: 2.5mm;
    }

    .center {
      text-align: center;
    }

    .money {
      text-align: right;
      white-space: nowrap;
    }

    .commercial-row {
      display: grid;
      grid-template-columns: .92fr 1.08fr;
      gap: 5mm;
      margin-top: 4mm;
    }

    .notes-box,
    .condition-box {
      min-height: 38mm;
      padding: 4mm;
    }

    .notes-list {
      margin: 0;
      padding-left: 5mm;
      color: #f2f2f2;
      font-size: 3mm;
      line-height: 1.45;
    }

    .condition-row {
      display: grid;
      grid-template-columns: 8mm 38mm 1fr;
      align-items: center;
      min-height: 10mm;
      border-bottom: 1px solid rgba(255,255,255,.12);
      font-size: 3mm;
      color: #f1f1f1;
      gap: 2mm;
    }

    .condition-row:last-child {
      border-bottom: 0;
    }

    .condition-row .ico {
      color: #ffcb2f;
      font-size: 4mm;
      text-align: center;
    }

    .condition-row strong {
      color: #fff;
    }

    .summary {
      margin-top: 5mm;
      border: 1px solid rgba(255,255,255,.28);
      border-radius: 3mm;
      overflow: hidden;
      background: rgba(0,0,0,.36);
    }

    .summary-row {
      display: grid;
      grid-template-columns: 1fr 42mm;
      align-items: center;
      min-height: 8.8mm;
      border-bottom: 1px solid rgba(255,255,255,.12);
      font-size: 3.4mm;
    }

    .summary-row span,
    .summary-row strong {
      padding: 0 4mm;
    }

    .summary-row strong {
      text-align: right;
      color: #fff;
    }

    .summary-row.discount span,
    .summary-row.discount strong {
      color: #ff5a5a;
    }

    .summary-row.total {
      min-height: 13mm;
      border-bottom: 0;
      text-transform: uppercase;
      font-weight: 950;
      letter-spacing: .8px;
    }

    .summary-row.total strong {
      align-self: stretch;
      display: grid;
      place-items: center end;
      background: #ffcb2f;
      color: #050505;
      font-size: 7mm;
      letter-spacing: 1px;
      padding-right: 4mm;
    }

    .signature-message {
      margin-top: 5mm;
      display: flex;
      align-items: center;
      gap: 3mm;
      color: #fff;
      font-size: 3.3mm;
      text-transform: uppercase;
      letter-spacing: .7px;
    }

    .signature-message .shield {
      width: 9mm;
      height: 9mm;
      border: 1px solid #ffcb2f;
      color: #ffcb2f;
      display: grid;
      place-items: center;
      border-radius: 2mm;
      font-weight: 900;
    }

    .signature-message b {
      color: #ffcb2f;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5mm;
      margin-top: 5mm;
    }

    .signature-box {
      min-height: 52mm;
      padding: 4mm;
      border-color: rgba(255,203,47,.55);
    }

    .signature-box.client {
      border-style: dashed;
    }

    .signature-title {
      display: flex;
      align-items: center;
      gap: 2mm;
      color: #ffcb2f;
      font-size: 3.4mm;
      font-weight: 950;
      text-transform: uppercase;
      letter-spacing: .7px;
    }

    .signature-visual {
      height: 22mm;
      display: grid;
      place-items: center;
      margin-top: 4mm;
    }

    .signature-visual img {
      max-width: 100%;
      max-height: 21mm;
      object-fit: contain;
    }

    .signature-script {
      font-family: "Brush Script MT", "Segoe Script", cursive;
      font-size: 11mm;
      line-height: 1;
      color: #fff;
      transform: rotate(-2deg);
    }

    .signature-visual.pending {
      border: 1px dashed rgba(255,203,47,.55);
      border-radius: 3mm;
      height: 25mm;
      text-align: center;
      color: #ddd;
      padding: 2mm;
    }

    .signature-visual.pending strong {
      display: block;
      font-size: 3.2mm;
    }

    .signature-visual.pending span {
      display: block;
      margin-top: 1mm;
      color: #999;
      font-size: 2.6mm;
    }

    .pending-icon {
      color: #ffcb2f;
      font-size: 6mm;
      line-height: 1;
    }

    .signature-line {
      margin: 3mm auto 2mm;
      height: 1px;
      width: 86%;
      background: #fff;
    }

    .signature-name {
      text-align: center;
      font-size: 3.3mm;
      font-weight: 950;
      color: #fff;
    }

    .signature-doc {
      text-align: center;
      color: #d8d8d8;
      font-size: 2.55mm;
      line-height: 1.25;
      margin-top: 1mm;
    }

    .site-bar {
      position: absolute;
      bottom: 3.5mm;
      left: 12mm;
      z-index: 3;
      color: #050505;
      font-size: 3.6mm;
      font-weight: 900;
      display: flex;
      align-items: center;
      gap: 3mm;
    }

    .footer-slogan {
      position: absolute;
      right: 13mm;
      bottom: 5mm;
      z-index: 3;
      color: #dcdcdc;
      font-size: 3mm;
      letter-spacing: 1.8px;
      text-transform: uppercase;
    }

    .footer-slogan b {
      color: #ffcb2f;
    }

    @media print {
      body {
        background: #fff;
      }

      .page {
        margin: 0;
      }
    }
  </style>
</head>

<body>
  <main class="page">
    <div class="yellow-cut"></div>
    <div class="bottom-bar"></div>

    <div class="content">
      <header class="header">
        <div class="brand">
          <div class="logo-box">
            <img src="${logoSrc}" alt="Volt Soluções Elétricas" />
          </div>
          <div class="brand-info">
            <div class="brand-title">Volt Soluções Elétricas</div>
            <div class="brand-sub">Proposta comercial</div>
            <div class="brand-slogan">Energia que conecta. Soluções que protegem.</div>
          </div>
        </div>

        <div class="company-contact">
          <div class="contact-line">
            <span class="icon">📍</span>
            <span>${safe(data.companyCity || "São Paulo / SP")}</span>
          </div>
          <div class="contact-line">
            <span class="icon">☎</span>
            <span>${safe(data.companyPhone || "(11) 98878-3401")}</span>
          </div>
          <div class="contact-line">
            <span class="icon">✉</span>
            <span>${safe(data.companyEmail || "solucoeseletricasvolt@gmail.com")}</span>
          </div>
          <div class="contact-line">
            <span class="icon">🌐</span>
            <span>${safe(data.companyWebsite || "volt-solucoes-eletricas.vercel.app")}</span>
          </div>
        </div>
      </header>

      <section class="top-area">
        <div>
          <h1 class="title">Orçamento</h1>
          <div class="title-line"></div>

          <div class="client-card">
            <div class="section-title">
              <span class="square">👤</span>
              <span>Dados do cliente</span>
              <span class="yellow-line"></span>
            </div>

            <div class="client-box">
              <div class="client-row">
                <div class="client-label">Nome:</div>
                <div class="client-value">${safe(data.clientName)}</div>
              </div>
              <div class="client-row">
                <div class="client-label">Telefone:</div>
                <div class="client-value">${safe(data.clientPhone)}</div>
              </div>
              <div class="client-row">
                <div class="client-label">Endereço:</div>
                <div class="client-value">${safe(data.clientAddress)}</div>
              </div>
              <div class="client-row">
                <div class="client-label">Serviço:</div>
                <div class="client-value">${safe(data.service)}</div>
              </div>
            </div>
          </div>
        </div>

        <aside class="budget-card">
          <div class="budget-head">
            <div class="budget-icon">▤</div>
            <div>
              <div class="budget-label">Orçamento nº</div>
              <div class="budget-code">${safe(data.number)}</div>
            </div>
          </div>

          <div class="budget-row">
            <span class="icon">▣</span>
            <strong>Data de emissão:</strong>
            <span class="value">${formatDate(data.date)}</span>
          </div>

          <div class="budget-row">
            <span class="icon">▣</span>
            <strong>Validade:</strong>
            <span class="value">${formatDate(data.validUntil)}</span>
          </div>

          <div class="budget-row">
            <span class="icon">▣</span>
            <strong>Status:</strong>
            <span class="value"><span class="status-pill">${safe(data.status)}</span></span>
          </div>
        </aside>
      </section>

      <section class="intro-box">
        <b>⚡</b>
        <span>Apresentamos abaixo nossa proposta comercial para execução dos serviços e fornecimento de materiais conforme escopo descrito.</span>
      </section>

      <section class="items-table">
        <table>
          <thead>
            <tr>
              <th style="width: 15mm;">Item</th>
              <th>Descrição</th>
              <th style="width: 18mm;">Qtd.</th>
              <th style="width: 18mm;">Un.</th>
              <th style="width: 30mm;">Valor Unit.</th>
              <th style="width: 32mm;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
      </section>

      <section class="commercial-row">
        <div>
          <div class="section-title">
            <span class="square">▤</span>
            <span>Observações técnicas</span>
            <span class="yellow-line"></span>
          </div>

          <div class="notes-box">
            <ul class="notes-list">${notes}</ul>
          </div>
        </div>

        <div>
          <div class="summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <strong>${brl(subtotal)}</strong>
            </div>
            <div class="summary-row">
              <span>Mão de obra</span>
              <strong>${brl(laborValue)}</strong>
            </div>
            <div class="summary-row discount">
              <span>Desconto</span>
              <strong>- ${brl(discountValue)}</strong>
            </div>
            <div class="summary-row total">
              <span>Total geral</span>
              <strong>${brl(total)}</strong>
            </div>
          </div>

          <div class="condition-box" style="margin-top: 4mm;">
            <div class="condition-row">
              <span class="ico">▭</span>
              <strong>Pagamento:</strong>
              <span>${safe(data.paymentCondition)}</span>
            </div>
            <div class="condition-row">
              <span class="ico">▦</span>
              <strong>Prazo:</strong>
              <span>${safe(data.executionDeadline)}</span>
            </div>
            <div class="condition-row">
              <span class="ico">◆</span>
              <strong>Garantia:</strong>
              <span>${safe(data.warranty)}</span>
            </div>
          </div>
        </div>
      </section>

      <div class="signature-message">
        <span class="shield">✓</span>
        <span>Segurança em cada detalhe. <b>Energia para o que realmente importa.</b></span>
      </div>

      <section class="footer-grid">
        <div class="signature-box">
          <div class="signature-title">⚡ Responsável técnico</div>
          ${signatureVisual(data.responsibleSignature, data.responsibleName, false)}
          <div class="signature-doc">${safe(data.responsibleDocument)}<br />${safe(data.responsibleRole || "Responsável técnico")}</div>
        </div>

        <div class="signature-box client">
          <div class="signature-title">👤 Cliente</div>
          ${signatureVisual(data.clientSignature, data.clientName || "Cliente", true)}
        </div>
      </section>
    </div>

    <div class="site-bar">
      <span>🌐</span>
      <span>${safe(data.companyWebsite || "volt-solucoes-eletricas.vercel.app")}</span>
    </div>

    <div class="footer-slogan">
      <b>⚡</b> Energia que conecta. Soluções que protegem.
    </div>
  </main>
</body>
</html>
`;
}

export function openOrcamentoPdf(data: OrcamentoPdfData) {
  const html = generateOrcamentoPdfHtml(data);
  const popup = window.open("", "_blank");

  if (!popup) {
    alert("Permita pop-ups no navegador para gerar o PDF.");
    return;
  }

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();

  setTimeout(() => {
    popup.print();
  }, 700);
}
