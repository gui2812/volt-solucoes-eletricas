export type OrcamentoPdfItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total?: number;
  kind?: "Material" | "Serviço" | "Mão de obra" | "Deslocamento" | "Taxa" | "Outro";
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

  companyPhone?: string;
  companyEmail?: string;
  companyCity?: string;
  companyWebsite?: string;
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

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function safe(value?: string) {
  return value && value.trim() ? value : "-";
}

function rowTotal(item: OrcamentoPdfItem) {
  return typeof item.total === "number" ? item.total : Number(item.quantity || 0) * Number(item.unitPrice || 0);
}

export function generateOrcamentoPdfHtml(data: OrcamentoPdfData) {
  const subtotal = data.items.reduce((sum, item) => sum + rowTotal(item), 0);

  const laborValue =
    typeof data.laborValue === "number"
      ? data.laborValue
      : data.items.filter((item) => item.kind === "Mão de obra").reduce((sum, item) => sum + rowTotal(item), 0);

  const discountValue = Number(data.discountValue || 0);
  const total = Math.max(subtotal - discountValue, 0);

  const itemsRows = data.items.map((item, index) => {
    const totalItem = rowTotal(item);

    return `
      <tr>
        <td class="td item-number">${String(index + 1).padStart(2, "0")}</td>
        <td class="td description">${safe(item.description)}</td>
        <td class="td center">${item.quantity || 0}</td>
        <td class="td center">${safe(item.unit)}</td>
        <td class="td money">${brl(Number(item.unitPrice || 0))}</td>
        <td class="td money">${brl(totalItem)}</td>
      </tr>
    `;
  }).join("");

  const notes = (data.technicalNotes?.length ? data.technicalNotes : [
    "Todos os materiais fornecidos são de primeira linha e conforme normas aplicáveis.",
    "Serviço executado por profissional qualificado.",
    "Testes de funcionamento e entrega técnica inclusos."
  ]).map((note) => `<li>${note}</li>`).join("");

  return `
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
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
        radial-gradient(circle at 20% 0%, rgba(255, 203, 47, .10), transparent 28%),
        radial-gradient(circle at 80% 100%, rgba(255, 203, 47, .08), transparent 35%),
        linear-gradient(135deg, #050505 0%, #090909 48%, #030303 100%);
      padding: 12mm;
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

    .diagonal {
      position: absolute;
      top: -38mm;
      right: 82mm;
      width: 14mm;
      height: 90mm;
      background: #ffcb2f;
      transform: rotate(25deg);
      box-shadow: 14px 0 0 rgba(255,255,255,.95), 19px 0 0 rgba(255,255,255,.25);
    }

    .bottom-bar {
      position: absolute;
      right: -8mm;
      bottom: 0;
      width: 96mm;
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
      grid-template-columns: 1.05fr .95fr;
      gap: 14mm;
      align-items: start;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8mm;
    }

    .brand-mark {
      width: 30mm;
      height: 30mm;
      display: grid;
      place-items: center;
      border: 2px solid #ffcb2f;
      border-radius: 50%;
      color: #ffcb2f;
      font-size: 34mm;
      font-weight: 900;
      line-height: 1;
    }

    .brand-text {
      min-width: 0;
    }

    .brand-name {
      font-size: 24mm;
      line-height: .82;
      font-weight: 950;
      letter-spacing: 2px;
      color: #fff;
      text-transform: uppercase;
    }

    .brand-sub {
      margin-top: 3mm;
      color: #ffcb2f;
      font-size: 5mm;
      font-weight: 900;
      letter-spacing: 2.5px;
      text-transform: uppercase;
    }

    .brand-slogan {
      margin-top: 3mm;
      color: #d6d6d6;
      font-size: 2.45mm;
      font-weight: 700;
      letter-spacing: .6px;
      text-transform: uppercase;
    }

    .company-contact {
      padding-top: 2mm;
    }

    .contact-line {
      display: grid;
      grid-template-columns: 8mm 1fr 8mm;
      align-items: center;
      gap: 3mm;
      min-height: 9mm;
      border-bottom: 1px solid #ffcb2f;
      color: #fff;
      font-size: 4.2mm;
    }

    .contact-line .icon {
      color: #fff;
      font-size: 5mm;
      text-align: center;
    }

    .contact-line .zap {
      color: #ffcb2f;
      text-align: right;
    }

    .top-area {
      display: grid;
      grid-template-columns: 1.15fr .85fr;
      gap: 10mm;
      margin-top: 11mm;
    }

    .title {
      margin: 0;
      color: white;
      font-size: 15mm;
      line-height: 1;
      font-weight: 950;
      letter-spacing: 3px;
      text-transform: uppercase;
    }

    .title-line {
      margin-top: 5mm;
      width: 30mm;
      height: 1mm;
      background: #ffcb2f;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 4mm;
      margin-bottom: 4mm;
      color: #fff;
      text-transform: uppercase;
      font-weight: 900;
      font-size: 4.3mm;
      letter-spacing: 1.3px;
    }

    .section-title .square {
      width: 10mm;
      height: 10mm;
      border-radius: 2mm;
      display: grid;
      place-items: center;
      background: #ffcb2f;
      color: #050505;
      font-weight: 900;
    }

    .yellow-line {
      height: .7mm;
      flex: 1;
      background: #ffcb2f;
    }

    .client-card {
      margin-top: 12mm;
    }

    .client-box,
    .budget-card,
    .notes-box,
    .condition-box,
    .signature-box,
    .thanks-box {
      border: 1px solid rgba(255,255,255,.35);
      border-radius: 2mm;
      background: rgba(0,0,0,.35);
      box-shadow: 0 0 22px rgba(0,0,0,.28);
    }

    .client-row {
      display: grid;
      grid-template-columns: 25mm 1fr;
      min-height: 9mm;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,.18);
      padding: 1.2mm 4mm;
      font-size: 3.25mm;
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
      padding: 5mm 5.5mm;
    }

    .budget-number {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px solid rgba(255,255,255,.30);
      padding-bottom: 4mm;
      margin-bottom: 2mm;
      font-size: 4.6mm;
    }

    .budget-number .code {
      color: #ffcb2f;
      font-weight: 950;
      font-size: 6mm;
      letter-spacing: 2px;
    }

    .budget-row {
      display: grid;
      grid-template-columns: 8mm 1fr 1fr;
      gap: 3mm;
      align-items: center;
      min-height: 9mm;
      border-bottom: 1px solid rgba(255,255,255,.18);
      font-size: 4mm;
    }

    .budget-row:last-child {
      border-bottom: 0;
    }

    .budget-row .icon {
      color: #ffcb2f;
      font-size: 5mm;
    }

    .budget-row strong {
      color: #fff;
    }

    .budget-row .value {
      text-align: right;
      color: #fff;
    }

    .budget-row.status .value {
      color: #ffcb2f;
      font-weight: 900;
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
    }

    .items-table {
      margin-top: 4mm;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.35);
      border-radius: 2mm;
      background: rgba(0,0,0,.28);
    }

    .items-table th {
      height: 9mm;
      padding: 2mm 3mm;
      border-bottom: 1px solid #ffcb2f;
      border-right: 1px solid rgba(255,255,255,.18);
      color: #fff;
      font-size: 3.4mm;
      text-align: center;
    }

    .items-table th:last-child {
      border-right: 0;
    }

    .td {
      padding: 2.2mm 3mm;
      min-height: 8mm;
      border-right: 1px solid rgba(255,255,255,.15);
      border-bottom: 1px solid rgba(255,255,255,.13);
      color: #efefef;
      font-size: 3.15mm;
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
      font-size: 4mm;
    }

    .description {
      width: 52%;
    }

    .center {
      text-align: center;
    }

    .money {
      text-align: right;
      white-space: nowrap;
    }

    .summary {
      width: 106mm;
      margin-left: auto;
      margin-top: 3mm;
      border: 1px solid rgba(255,255,255,.35);
      border-radius: 2mm;
      overflow: hidden;
      background: rgba(0,0,0,.36);
    }

    .summary-row {
      display: grid;
      grid-template-columns: 1fr 42mm;
      align-items: center;
      min-height: 9mm;
      border-bottom: 1px solid rgba(255,255,255,.16);
      font-size: 3.7mm;
    }

    .summary-row span,
    .summary-row strong {
      padding: 0 5mm;
    }

    .summary-row strong {
      text-align: right;
      color: #fff;
    }

    .summary-row.discount span,
    .summary-row.discount strong {
      color: #ff2525;
    }

    .summary-row.total {
      min-height: 14mm;
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
      font-size: 8mm;
      letter-spacing: 1px;
      padding-right: 4mm;
    }

    .bottom-sections {
      display: grid;
      grid-template-columns: .86fr 1.14fr;
      gap: 6mm;
      margin-top: 7mm;
    }

    .notes-box,
    .condition-box {
      min-height: 32mm;
      padding: 4mm;
    }

    .notes-list {
      margin: 0;
      padding-left: 5mm;
      color: #f2f2f2;
      font-size: 3.2mm;
      line-height: 1.45;
    }

    .condition-row {
      display: grid;
      grid-template-columns: 9mm 43mm 1fr;
      align-items: center;
      min-height: 12mm;
      border-bottom: 1px solid rgba(255,255,255,.14);
      font-size: 3.2mm;
      color: #f1f1f1;
      gap: 2mm;
    }

    .condition-row:last-child {
      border-bottom: 0;
    }

    .condition-row .ico {
      color: #fff;
      font-size: 5mm;
      text-align: center;
    }

    .condition-row strong {
      color: #fff;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 1.25fr .95fr;
      gap: 6mm;
      margin-top: 4mm;
    }

    .signature-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 31mm;
      padding: 4mm;
      gap: 6mm;
    }

    .signature-title {
      color: #fff;
      font-size: 3.4mm;
      font-weight: 900;
      text-align: center;
    }

    .signature-line {
      margin: 10mm auto 2mm;
      height: 1px;
      width: 80%;
      background: #fff;
    }

    .signature-name {
      text-align: center;
      font-size: 3.5mm;
      font-weight: 900;
    }

    .signature-doc {
      text-align: center;
      color: #d8d8d8;
      font-size: 2.8mm;
      line-height: 1.25;
    }

    .signature-placeholder {
      height: 12mm;
      display: grid;
      place-items: center;
      color: #fff;
      font-size: 7mm;
      font-family: "Brush Script MT", cursive;
    }

    .thanks-box {
      min-height: 31mm;
      display: grid;
      grid-template-columns: 13mm 1fr;
      gap: 5mm;
      padding: 4mm;
      border-left: 1mm solid #ffcb2f;
    }

    .thanks-bolt {
      color: #ffcb2f;
      font-size: 13mm;
      line-height: 1;
    }

    .thanks-text {
      color: #f2f2f2;
      font-size: 3.15mm;
      line-height: 1.45;
    }

    .thanks-text strong {
      display: block;
      margin-top: 3mm;
      color: #fff;
      font-size: 3.6mm;
    }

    .thanks-text b {
      color: #ffcb2f;
    }

    .security {
      margin-top: 5mm;
      display: flex;
      align-items: center;
      gap: 4mm;
      color: #fff;
      font-size: 3.5mm;
      text-transform: uppercase;
      letter-spacing: .8px;
    }

    .security .shield {
      width: 10mm;
      height: 10mm;
      border: 1px solid #ffcb2f;
      color: #ffcb2f;
      display: grid;
      place-items: center;
      border-radius: 2mm;
      font-weight: 900;
    }

    .security b {
      color: #ffcb2f;
    }

    .site-bar {
      position: absolute;
      bottom: 3.4mm;
      right: 16mm;
      z-index: 3;
      color: #050505;
      font-size: 3.7mm;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 4mm;
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
    <div class="diagonal"></div>
    <div class="bottom-bar"></div>

    <div class="content">
      <header class="header">
        <div class="brand">
          <div class="brand-mark">⚡</div>
          <div class="brand-text">
            <div class="brand-name">VOLT</div>
            <div class="brand-sub">Soluções Elétricas</div>
            <div class="brand-slogan">Energia que conecta. Soluções que protegem.</div>
          </div>
        </div>

        <div class="company-contact">
          <div class="contact-line">
            <span class="icon">☎</span>
            <span>${safe(data.companyPhone || "(11) 98878-3401")}</span>
            <span class="zap">⚡</span>
          </div>
          <div class="contact-line">
            <span class="icon">✉</span>
            <span>${safe(data.companyEmail || "solucoeseletricasvolt@gmail.com")}</span>
            <span></span>
          </div>
          <div class="contact-line">
            <span class="icon">●</span>
            <span>${safe(data.companyCity || "São Paulo / SP")}</span>
            <span></span>
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
          <div class="budget-number">
            <span>Orçamento nº</span>
            <span class="code">${safe(data.number)}</span>
          </div>

          <div class="budget-row">
            <span class="icon">▣</span>
            <strong>Data:</strong>
            <span class="value">${formatDate(data.date)}</span>
          </div>

          <div class="budget-row">
            <span class="icon">▣</span>
            <strong>Validade:</strong>
            <span class="value">${formatDate(data.validUntil)}</span>
          </div>

          <div class="budget-row status">
            <span class="icon">▣</span>
            <strong>Status:</strong>
            <span class="value">${safe(data.status)}</span>
          </div>
        </aside>
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
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </section>

      <section class="summary">
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
          <span>Total final</span>
          <strong>${brl(total)}</strong>
        </div>
      </section>

      <section class="bottom-sections">
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
          <div class="section-title">
            <span class="square">🤝</span>
            <span>Condições comerciais</span>
            <span class="yellow-line"></span>
          </div>

          <div class="condition-box">
            <div class="condition-row">
              <span class="ico">▭</span>
              <strong>Condição de pagamento:</strong>
              <span>${safe(data.paymentCondition)}</span>
            </div>
            <div class="condition-row">
              <span class="ico">▦</span>
              <strong>Prazo de execução:</strong>
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

      <section class="footer-grid">
        <div class="signature-box">
          <div>
            <div class="signature-title">Responsável Técnico</div>
            <div class="signature-placeholder">${safe(data.responsibleName).split(" ").slice(0, 2).join(" ")}</div>
            <div class="signature-line"></div>
            <div class="signature-name">${safe(data.responsibleName)}</div>
            <div class="signature-doc">${safe(data.responsibleDocument)}<br />${safe(data.responsibleRole || "Responsável técnico")}</div>
          </div>

          <div>
            <div class="signature-title">Cliente</div>
            <div class="signature-line"></div>
            <div class="signature-doc">Assinatura e carimbo</div>
          </div>
        </div>

        <div class="thanks-box">
          <div class="thanks-bolt">⚡</div>
          <div class="thanks-text">
            A Volt Soluções Elétricas agradece a oportunidade e se coloca à disposição para quaisquer esclarecimentos.
            <strong>Volt Soluções Elétricas</strong>
            <b>Segurança. Qualidade. Confiança.</b>
          </div>
        </div>
      </section>

      <div class="security">
        <span class="shield">✓</span>
        <span>Segurança em cada detalhe<br /><b>Energia para o que realmente importa.</b></span>
      </div>
    </div>

    <div class="site-bar">
      <span>🌐</span>
      <span>${safe(data.companyWebsite || "www.voltsolucoeseletricas.com.br")}</span>
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
  }, 500);
}
