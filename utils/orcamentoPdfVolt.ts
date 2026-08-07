import type { SignatureMode, SignatureStyle } from "@/types/signatures";

export type OrcamentoPdfItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total?: number;
  kind?: "Material" | "Serviço" | "Mão de obra" | "Deslocamento" | "Taxa" | "Outro";
};

export type OrcamentoPdfMaterial = {
  category: string;
  description: string;
  quantity: number;
  unit: string;
  specification?: string;
};

export type OrcamentoPdfSignature = {
  signerName?: string;
  mode?: SignatureMode;
  signedAt?: string;
  signatureDataUrl?: string;
  signatureStyle?: SignatureStyle;
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
  materials?: OrcamentoPdfMaterial[];

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

  signingUrl?: string;
  documentPurpose?: "approval" | "final";
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

function signatureClass(style?: string) {
  if (style === "Elegante") return "signature-script elegant";
  if (style === "Moderna") return "signature-script modern";
  if (style === "Rubrica rápida") return "signature-script quick";
  if (style === "Formal") return "signature-script formal";
  return "signature-script classic";
}

function signatureVisual(signature: OrcamentoPdfSignature | undefined, fallbackName: string, isClient = false, signingUrl?: string) {
  const name = safe(signature?.signerName || fallbackName);
  const mode = signature?.mode || "Pendente";
  const signedAt = signature?.signedAt ? formatDate(signature.signedAt) : "";
  const style = signature?.signatureStyle || "Clássica";

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
        <div class="${signatureClass(style)}">${name}</div>
      </div>
      <div class="signature-line"></div>
      <div class="signature-name">${name}</div>
      <div class="signature-doc">${style} • rubrica predefinida${signedAt ? ` em ${signedAt}` : ""}</div>
    `;
  }

  if (mode === "Nome digitado + aceite") {
    return `
      <div class="signature-visual pending">
        <div>
          <div class="pending-icon">✓</div>
          <strong>${name}</strong>
          <span>Nome digitado + aceite eletrônico${signedAt ? ` em ${signedAt}` : ""}</span>
        </div>
      </div>
      <div class="signature-line"></div>
      <div class="signature-name">${name}</div>
      <div class="signature-doc">Aceite eletrônico registrado</div>
    `;
  }

  const actionButton = isClient && signingUrl
    ? `<a class="signature-action" href="${signingUrl}" target="_blank" rel="noreferrer">Aprovar e assinar agora</a>`
    : "";

  return `
    <div class="signature-visual pending">
      <div>
        <div class="pending-icon">✍</div>
        <strong>${isClient ? "Assinatura do cliente pendente" : "Assinatura pendente"}</strong>
        <span>${isClient && signingUrl ? "Clique no botão abaixo, abra o link ou escaneie o QR Code" : "Assinar pelo celular, tablet ou computador"}</span>
        ${actionButton}
      </div>
    </div>
    <div class="signature-line"></div>
    <div class="signature-name">${name}</div>
    <div class="signature-doc">Aguardando assinatura digital</div>
  `;
}

function qrCodeUrl(value?: string) {
  if (!value) return "";
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(value)}`;
}

function approvalBlock(data: OrcamentoPdfData) {
  if (!data.signingUrl || data.documentPurpose === "final") return "";

  return `
    <section class="approval-box">
      <div class="approval-text">
        <div class="approval-kicker">Aprovação digital</div>
        <h2>Para aprovar e assinar este orçamento</h2>
        <p>Abra o link abaixo pelo celular ou escaneie o QR Code. O cliente não precisa acessar o sistema da Volt.</p>
        <div class="approval-link">${safe(data.signingUrl)}</div>
      </div>
      <div class="approval-qr">
        <img src="${qrCodeUrl(data.signingUrl)}" alt="QR Code para assinatura" />
        <span>Escaneie para assinar</span>
      </div>
    </section>
  `;
}

function materialsPages(data: OrcamentoPdfData, logoSrc: string) {
  const materials = (data.materials ?? []).filter((material) => material.description?.trim());
  if (!materials.length) return "";

  const itemsPerPage = 12;
  const pageCount = Math.ceil(materials.length / itemsPerPage);
  const basePageSize = Math.floor(materials.length / pageCount);
  const pagesWithExtraItem = materials.length % pageCount;
  let materialOffset = 0;
  const pages = Array.from({ length: pageCount }, (_, pageIndex) => {
    const pageSize = basePageSize + (pageIndex < pagesWithExtraItem ? 1 : 0);
    const page = {
      startIndex: materialOffset,
      materials: materials.slice(materialOffset, materialOffset + pageSize)
    };
    materialOffset += pageSize;
    return page;
  });

  return pages.map((page, pageIndex) => {
    const rows = page.materials.map((material, index) => `
      <tr>
        <td class="td item-number">${String(page.startIndex + index + 1).padStart(2, "0")}</td>
        <td class="td material-category">${safe(material.category || "Outros")}</td>
        <td class="td material-description"><strong>${safe(material.description)}</strong></td>
        <td class="td center">${Number(material.quantity || 0).toLocaleString("pt-BR")}</td>
        <td class="td center">${safe(material.unit)}</td>
        <td class="td material-specification">${material.specification?.trim() ? safe(material.specification) : "-"}</td>
      </tr>
    `).join("");

    return `
      <main class="page materials-page">
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
                <div class="brand-sub">Relação de materiais</div>
                <div class="brand-slogan">Energia que conecta. Soluções que protegem.</div>
              </div>
            </div>

            <div class="company-contact">
              <div class="contact-line"><span class="icon">📍</span><span>${safe(data.companyCity || "São Paulo / SP")}</span></div>
              <div class="contact-line"><span class="icon">☎</span><span>${safe(data.companyPhone || "(11) 98878-3401")}</span></div>
              <div class="contact-line"><span class="icon">✉</span><span>${safe(data.companyEmail || "solucoeseletricasvolt@gmail.com")}</span></div>
              <div class="contact-line"><span class="icon">🌐</span><span>${safe(data.companyWebsite || "volt-solucoes-eletricas.vercel.app")}</span></div>
            </div>
          </header>

          <section class="materials-heading">
            <div>
              <div class="materials-kicker">Lista vinculada ao orçamento</div>
              <h1>Materiais necessários</h1>
              <div class="title-line"></div>
            </div>
            <div class="materials-document-meta">
              <span>Orçamento</span>
              <strong>${safe(data.number)}</strong>
              <small>Página ${pageIndex + 1} de ${pages.length}</small>
            </div>
          </section>

          <section class="materials-client-bar">
            <div><span>Cliente</span><strong>${safe(data.clientName)}</strong></div>
            <div><span>Serviço</span><strong>${safe(data.service)}</strong></div>
            <div><span>Emissão</span><strong>${formatDate(data.date)}</strong></div>
          </section>

          <section class="materials-intro">
            <span class="materials-intro-icon">▤</span>
            <div>
              <strong>Relação para compra e separação</strong>
              <p>Os itens abaixo são apresentados separadamente do valor da proposta comercial e não alteram o total do orçamento.</p>
            </div>
          </section>

          <section class="materials-table">
            <table>
              <thead>
                <tr>
                  <th style="width: 12mm;">Item</th>
                  <th style="width: 30mm;">Categoria</th>
                  <th>Descrição</th>
                  <th style="width: 16mm;">Qtd.</th>
                  <th style="width: 16mm;">Un.</th>
                  <th style="width: 42mm;">Especificação</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </section>

          <section class="materials-note">
            <span>⚡</span>
            <div>
              <strong>Conferência antes da compra</strong>
              <p>Confirmar quantidades, marcas, cores e medidas com o responsável técnico antes da aquisição dos materiais.</p>
            </div>
          </section>
        </div>

        <div class="site-bar"><span>🌐</span><span>${safe(data.companyWebsite || "volt-solucoes-eletricas.vercel.app")}</span></div>
        <div class="footer-slogan"><b>⚡</b> Energia que conecta. Soluções que protegem.</div>
      </main>
    `;
  }).join("");
}

function signaturesPage(data: OrcamentoPdfData, logoSrc: string) {
  const approval = approvalBlock(data);
  const documentStatus = approval || `
    <section class="final-document-box">
      <span class="final-document-icon">✓</span>
      <div>
        <div class="approval-kicker">Documento final</div>
        <h2>Registro de aprovação e assinaturas</h2>
        <p>Esta página reúne as assinaturas vinculadas ao orçamento e identifica os responsáveis pelo documento.</p>
      </div>
    </section>
  `;

  return `
    <main class="page signatures-page">
      <div class="yellow-cut"></div>
      <div class="bottom-bar"></div>

      <div class="content">
        <header class="header">
          <div class="brand">
            <div class="logo-box"><img src="${logoSrc}" alt="Volt Soluções Elétricas" /></div>
            <div class="brand-info">
              <div class="brand-title">Volt Soluções Elétricas</div>
              <div class="brand-sub">Aprovação e assinaturas</div>
              <div class="brand-slogan">Energia que conecta. Soluções que protegem.</div>
            </div>
          </div>

          <div class="company-contact">
            <div class="contact-line"><span class="icon">📍</span><span>${safe(data.companyCity || "São Paulo / SP")}</span></div>
            <div class="contact-line"><span class="icon">☎</span><span>${safe(data.companyPhone || "(11) 98878-3401")}</span></div>
            <div class="contact-line"><span class="icon">✉</span><span>${safe(data.companyEmail || "solucoeseletricasvolt@gmail.com")}</span></div>
            <div class="contact-line"><span class="icon">🌐</span><span>${safe(data.companyWebsite || "volt-solucoes-eletricas.vercel.app")}</span></div>
          </div>
        </header>

        <section class="signature-page-heading">
          <div>
            <div class="materials-kicker">Orçamento ${safe(data.number)}</div>
            <h1>Aprovação digital</h1>
            <div class="title-line"></div>
          </div>
          <div class="signature-status-card">
            <span>Status do documento</span>
            <strong>${safe(data.status)}</strong>
            <small>${safe(data.clientName)}</small>
          </div>
        </section>

        ${documentStatus}

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
            ${signatureVisual(data.clientSignature, data.clientName || "Cliente", true, data.signingUrl)}
          </div>
        </section>

        <section class="signature-legal-note">
          <strong>Validade do registro</strong>
          <p>As informações desta página pertencem ao orçamento ${safe(data.number)}, emitido em ${formatDate(data.date)}, e devem ser analisadas em conjunto com a proposta comercial e a relação de materiais.</p>
        </section>
      </div>

      <div class="site-bar"><span>🌐</span><span>${safe(data.companyWebsite || "volt-solucoes-eletricas.vercel.app")}</span></div>
      <div class="footer-slogan"><b>⚡</b> Energia que conecta. Soluções que protegem.</div>
    </main>
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
  const materialsHtml = materialsPages(data, logoSrc);
  const signaturesHtml = signaturesPage(data, logoSrc);

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

  // A MÁGICA REAL ACONTECE AQUI
  const notes = (data.technicalNotes?.length ? data.technicalNotes : [
    "Todos os materiais e serviços serão executados conforme boas práticas técnicas aplicáveis.",
    "Serviço executado por profissional qualificado.",
    "Testes de funcionamento e entrega técnica inclusos."
  ]).map((note) => {
    // 1. Substitui qualquer barra-n (\n) que o sistema possa ter transformado em texto sem querer.
    // 2. Divide a sua string gigante sempre que achar um "Enter".
    // 3. Remove as linhas vazias.
    const lines = safe(note).replace(/\\n/g, '\n').split(/\r?\n/).filter(line => line.trim() !== "");
    
    // 4. Cria um pontinho novo (<li>) pra CADA parágrafo, garantindo espaçamento visual excelente.
    return lines.map(line => `<li style="margin-bottom: 10px; line-height: 1.6; text-align: justify;">${line.trim()}</li>`).join("");
  }).join("");

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
      grid-template-columns: 1fr 48mm;
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
      font-size: 5.5mm;
      letter-spacing: 1px;
      padding-right: 4mm;
      white-space: nowrap;
    }

    .approval-box {
      margin-top: 5mm;
      display: grid;
      grid-template-columns: 1fr 34mm;
      gap: 5mm;
      align-items: center;
      border: 1px solid rgba(255, 203, 47, .65);
      border-radius: 3mm;
      background: rgba(255, 203, 47, .08);
      padding: 4mm;
    }

    .approval-kicker {
      color: #ffcb2f;
      font-size: 3mm;
      font-weight: 950;
      text-transform: uppercase;
      letter-spacing: 1.3px;
    }

    .approval-text h2 {
      margin: 1.5mm 0 1mm;
      color: #fff;
      font-size: 5mm;
      line-height: 1.1;
      text-transform: uppercase;
    }

    .approval-text p {
      margin: 0;
      color: #d8d8d8;
      font-size: 3mm;
      line-height: 1.4;
    }

    .approval-link {
      margin-top: 2.5mm;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 2mm;
      background: rgba(0,0,0,.45);
      padding: 2.2mm;
      color: #ffcb2f;
      font-size: 2.6mm;
      line-height: 1.25;
      word-break: break-all;
    }

    .approval-qr {
      display: grid;
      place-items: center;
      gap: 1.5mm;
      color: #fff;
      font-size: 2.5mm;
      font-weight: 800;
      text-align: center;
    }

    .approval-qr img {
      width: 30mm;
      height: 30mm;
      border-radius: 2mm;
      background: #fff;
      padding: 1.5mm;
    }


    .signature-action {
      display: inline-block;
      margin-top: 3mm;
      border-radius: 2mm;
      background: #ffcb2f;
      color: #050505;
      padding: 2.4mm 4.5mm;
      font-size: 3mm;
      font-weight: 950;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: .7px;
      box-shadow: 0 0 14px rgba(255, 203, 47, .22);
    }

    .signature-action:hover {
      filter: brightness(1.05);
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

    .signature-visual:not(.pending) {
      background: #fff;
      border-radius: 3mm;
      padding: 2mm;
    }

    .signature-visual img {
      max-width: 100%;
      max-height: 21mm;
      object-fit: contain;
    }

    .signature-script {
      line-height: 1;
      color: #111827;
      transform: rotate(-2deg);
    }

    .signature-script.classic {
      font-family: "Brush Script MT", "Segoe Script", cursive;
      font-size: 11mm;
    }

    .signature-script.elegant {
      font-family: "Brush Script MT", "Segoe Script", cursive;
      font-size: 12mm;
      letter-spacing: .6mm;
    }

    .signature-script.modern {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 6.2mm;
      font-weight: 300;
      letter-spacing: 1.7mm;
      text-transform: uppercase;
      transform: rotate(0deg);
    }

    .signature-script.quick {
      font-family: "Brush Script MT", "Segoe Script", cursive;
      font-size: 10.5mm;
      transform: skewX(-9deg) rotate(-3deg);
    }

    .signature-script.formal {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 7.8mm;
      font-weight: 700;
      letter-spacing: .5mm;
      transform: rotate(0deg);
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

    .page + .page {
      page-break-before: always;
      break-before: page;
    }

    .budget-page,
    .materials-page,
    .signatures-page {
      height: 297mm;
      min-height: 297mm;
    }

    .signature-page-heading {
      display: grid;
      grid-template-columns: 1fr 54mm;
      gap: 8mm;
      align-items: end;
      margin-top: 11mm;
    }

    .signature-page-heading h1 {
      margin: 2mm 0 0;
      color: #fff;
      font-size: 11mm;
      line-height: 1;
      font-weight: 950;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .signature-status-card {
      border: 1px solid rgba(255, 203, 47, .72);
      border-radius: 3mm;
      background: rgba(0,0,0,.38);
      padding: 4mm;
      text-align: right;
    }

    .signature-status-card span,
    .signature-status-card small {
      display: block;
      color: #a1a1aa;
      font-size: 2.6mm;
      font-weight: 800;
      text-transform: uppercase;
    }

    .signature-status-card strong {
      display: inline-flex;
      margin: 1.5mm 0;
      border: 1px solid rgba(255,203,47,.72);
      border-radius: 999px;
      padding: 1.2mm 3mm;
      color: #ffcb2f;
      font-size: 3.2mm;
      text-transform: uppercase;
    }

    .final-document-box {
      display: grid;
      grid-template-columns: 14mm 1fr;
      gap: 5mm;
      align-items: center;
      margin-top: 12mm;
      border: 1px solid rgba(255, 203, 47, .65);
      border-radius: 3mm;
      background: rgba(255, 203, 47, .08);
      padding: 6mm;
    }

    .final-document-icon {
      display: grid;
      width: 13mm;
      height: 13mm;
      place-items: center;
      border: .6mm solid #ffcb2f;
      border-radius: 3mm;
      color: #ffcb2f;
      font-size: 6mm;
      font-weight: 950;
    }

    .final-document-box h2 {
      margin: 1.5mm 0 1mm;
      color: #fff;
      font-size: 5.5mm;
      text-transform: uppercase;
    }

    .final-document-box p {
      margin: 0;
      color: #cecece;
      font-size: 3mm;
      line-height: 1.4;
    }

    .signatures-page .signature-message {
      margin-top: 10mm;
    }

    .signatures-page .footer-grid {
      margin-top: 6mm;
    }

    .signatures-page .signature-box {
      min-height: 70mm;
    }

    .signature-legal-note {
      margin-top: 7mm;
      border-left: 1mm solid #ffcb2f;
      border-radius: 0 3mm 3mm 0;
      background: rgba(255,255,255,.04);
      padding: 4mm 5mm;
    }

    .signature-legal-note strong {
      color: #ffcb2f;
      font-size: 3mm;
      text-transform: uppercase;
    }

    .signature-legal-note p {
      margin: 1mm 0 0;
      color: #c9c9c9;
      font-size: 2.7mm;
      line-height: 1.4;
    }

    .materials-heading {
      display: grid;
      grid-template-columns: 1fr 48mm;
      gap: 8mm;
      align-items: end;
      margin-top: 8mm;
    }

    .materials-kicker {
      color: #ffcb2f;
      font-size: 3mm;
      font-weight: 950;
      letter-spacing: 1.2px;
      text-transform: uppercase;
    }

    .materials-heading h1 {
      margin: 2mm 0 0;
      color: #fff;
      font-size: 10mm;
      line-height: 1;
      font-weight: 950;
      letter-spacing: 1.2px;
      text-transform: uppercase;
    }

    .materials-document-meta {
      border: 1px solid rgba(255, 203, 47, .72);
      border-radius: 3mm;
      background: rgba(0,0,0,.38);
      padding: 4mm;
      text-align: right;
    }

    .materials-document-meta span,
    .materials-document-meta small {
      display: block;
      color: #a1a1aa;
      font-size: 2.6mm;
      font-weight: 800;
      text-transform: uppercase;
    }

    .materials-document-meta strong {
      display: block;
      margin: 1mm 0;
      color: #ffcb2f;
      font-size: 5mm;
      letter-spacing: 1px;
    }

    .materials-client-bar {
      display: grid;
      grid-template-columns: 1fr 1.15fr .55fr;
      gap: 0;
      margin-top: 5mm;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.26);
      border-radius: 3mm;
      background: rgba(0,0,0,.34);
    }

    .materials-client-bar > div {
      min-width: 0;
      padding: 3mm 4mm;
      border-right: 1px solid rgba(255,255,255,.12);
    }

    .materials-client-bar > div:last-child {
      border-right: 0;
    }

    .materials-client-bar span,
    .materials-client-bar strong {
      display: block;
    }

    .materials-client-bar span {
      color: #ffcb2f;
      font-size: 2.5mm;
      font-weight: 900;
      letter-spacing: .6px;
      text-transform: uppercase;
    }

    .materials-client-bar strong {
      margin-top: 1mm;
      overflow: hidden;
      color: #fff;
      font-size: 3.1mm;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .materials-intro,
    .materials-note {
      display: grid;
      grid-template-columns: 10mm 1fr;
      gap: 3mm;
      align-items: center;
      margin-top: 5mm;
      border: 1px solid rgba(255, 203, 47, .42);
      border-radius: 3mm;
      background: rgba(255, 203, 47, .07);
      padding: 3.5mm 4mm;
    }

    .materials-intro-icon,
    .materials-note > span {
      display: grid;
      width: 8mm;
      height: 8mm;
      place-items: center;
      border-radius: 2mm;
      background: #ffcb2f;
      color: #050505;
      font-size: 4mm;
      font-weight: 950;
    }

    .materials-intro strong,
    .materials-note strong {
      color: #fff;
      font-size: 3.2mm;
    }

    .materials-intro p,
    .materials-note p {
      margin: 1mm 0 0;
      color: #c7c7c7;
      font-size: 2.7mm;
      line-height: 1.35;
    }

    .materials-table {
      margin-top: 5mm;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.30);
      border-radius: 3mm;
      background: rgba(0,0,0,.28);
    }

    .materials-table th {
      height: 9mm;
      padding: 2mm;
      border-right: 1px solid rgba(255,255,255,.15);
      border-bottom: 1px solid #ffcb2f;
      color: #ffcb2f;
      font-size: 2.75mm;
      letter-spacing: .35px;
      text-align: center;
      text-transform: uppercase;
    }

    .materials-table th:last-child,
    .materials-table .td:last-child {
      border-right: 0;
    }

    .materials-table .td {
      min-height: 8mm;
      padding: 2.1mm 2.3mm;
      font-size: 2.75mm;
      line-height: 1.25;
      vertical-align: middle;
    }

    .materials-table tr:last-child .td {
      border-bottom: 0;
    }

    .material-category {
      color: #ffcb2f;
      font-weight: 850;
    }

    .material-description strong {
      color: #fff;
    }

    .material-specification {
      color: #cfcfcf;
    }

    .materials-note {
      margin-top: 5mm;
      border-color: rgba(255,255,255,.22);
      background: rgba(0,0,0,.32);
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
  <main class="page budget-page">
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

    </div>

    <div class="site-bar">
      <span>🌐</span>
      <span>${safe(data.companyWebsite || "volt-solucoes-eletricas.vercel.app")}</span>
    </div>

    <div class="footer-slogan">
      <b>⚡</b> Energia que conecta. Soluções que protegem.
    </div>
  </main>
  ${materialsHtml}
  ${signaturesHtml}
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
