import type { Contract, ContractSignature } from "@/types/contracts";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paragraphs(value: string) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? escapeHtml(value) : date.toLocaleDateString("pt-BR");
}

function brl(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function partyText(party: Contract["client"]) {
  return [
    party.name,
    party.document ? `CPF/CNPJ ${party.document}` : "documento não informado",
    party.address,
    party.city,
    party.representative ? `representada por ${party.representative}` : "",
    party.representativeDocument ? `documento ${party.representativeDocument}` : ""
  ].filter(Boolean).map(escapeHtml).join(", ");
}

function signatureVisual(signature: ContractSignature | undefined, fallback: string) {
  const name = escapeHtml(signature?.signerName || fallback || "Assinatura pendente");
  const date = signature?.signedAt ? ` em ${formatDate(signature.signedAt)}` : "";
  const dataUrl = signature?.signatureDataUrl?.startsWith("data:image/") ? signature.signatureDataUrl : "";

  if (dataUrl) {
    return `<div class="signature-art"><img src="${dataUrl}" alt="Assinatura" /></div><div class="signature-line"></div><strong>${name}</strong><small>${escapeHtml(signature?.mode)}${date}</small>`;
  }
  if (signature?.mode === "Rubrica predefinida") {
    return `<div class="signature-art signature-script">${name}</div><div class="signature-line"></div><strong>${name}</strong><small>Rubrica predefinida${date}</small>`;
  }
  if (signature?.mode === "Nome digitado + aceite") {
    return `<div class="signature-art typed"><span>✓</span>${name}</div><div class="signature-line"></div><strong>${name}</strong><small>Nome digitado e aceite eletrônico${date}</small>`;
  }
  return `<div class="signature-art pending">Assinatura pendente</div><div class="signature-line"></div><strong>${name}</strong><small>Aguardando aceite eletrônico</small>`;
}

export function generateContractPdfHtml(contract: Contract, purpose: "signature" | "final" = "signature") {
  const scopeRows = contract.scopeItems.map((item, index) => `
    <tr>
      <td>${String(index + 1).padStart(2, "0")}</td>
      <td><strong>${escapeHtml(item.description)}</strong><small>${escapeHtml(item.kind)}${item.code ? ` • ${escapeHtml(item.code)}` : ""}</small></td>
      <td>${Number(item.quantity || 0).toLocaleString("pt-BR")} ${escapeHtml(item.unit)}</td>
      <td>${brl(item.total)}</td>
    </tr>
  `).join("");
  const materialRows = contract.materials.map((material, index) => `
    <tr>
      <td>${String(index + 1).padStart(2, "0")}</td>
      <td><strong>${escapeHtml(material.description)}</strong><small>${escapeHtml(material.category)}${material.specification ? ` • ${escapeHtml(material.specification)}` : ""}</small></td>
      <td>${Number(material.quantity || 0).toLocaleString("pt-BR")} ${escapeHtml(material.unit)}</td>
    </tr>
  `).join("");
  const clauses: Array<[string, string]> = [
    ["Obrigações da CONTRATADA", contract.clauses.contractorObligations],
    ["Obrigações do CONTRATANTE", contract.clauses.clientObligations],
    ["Materiais e especificações", contract.clauses.materialsResponsibility],
    ["Serviços e itens não incluídos", contract.clauses.exclusions],
    ["Alterações de escopo e aditivos", contract.clauses.changeOrders],
    ["Condições imprevistas", contract.clauses.unforeseenConditions],
    ["Segurança e suspensão dos serviços", contract.clauses.siteSafety],
    ["Testes, entrega e aceite", contract.clauses.testsAndAcceptance],
    ["Garantia", contract.clauses.warrantyTerms],
    ["Rescisão e acerto de valores", contract.clauses.cancellationTerms],
    ["Atraso de pagamento", contract.clauses.latePaymentTerms],
    ["Privacidade e dados pessoais", contract.clauses.privacyTerms],
    ["Assinaturas eletrônicas", contract.clauses.electronicSignatureTerms],
    ["Solução de controvérsias", contract.clauses.disputeResolution]
  ];
  const clauseHtml = clauses.map(([title, content], index) => `
    <section class="clause">
      <h2>CLÁUSULA ${index + 1} — ${escapeHtml(title)}</h2>
      ${paragraphs(content)}
    </section>
  `).join("");
  const consumerClause = contract.consumerRelationship ? `
    <section class="clause important">
      <h2>RELAÇÃO DE CONSUMO E DIREITO DE INFORMAÇÃO</h2>
      <p>As condições deste instrumento serão interpretadas com preservação dos direitos obrigatórios do consumidor. O CONTRATANTE declara ter recebido oportunidade de leitura prévia, esclarecimento e cópia deste contrato.</p>
      ${contract.contractedOutsideBusinessPremises ? "<p>Quando caracterizada contratação fora do estabelecimento comercial e presentes os requisitos legais, será respeitado o prazo legal de arrependimento. O início antecipado de qualquer atividade dependerá de solicitação expressa do CONTRATANTE e será tratado sem afastar direitos obrigatórios.</p>" : ""}
    </section>
  ` : "";
  const signingBlock = contract.signatureUrl && purpose === "signature" ? `
    <section class="signing-callout">
      <div><strong>Assinatura eletrônica</strong><p>Leia todo o contrato e acesse o link abaixo para assinar. Guarde uma cópia do documento.</p><code>${escapeHtml(contract.signatureUrl)}</code></div>
    </section>
  ` : "";

  return `<!doctype html>
  <html lang="pt-BR"><head><meta charset="utf-8"><base href="${typeof window !== "undefined" ? `${window.location.origin}/` : ""}"><title>${escapeHtml(contract.id)} — Contrato Volt</title>
  <style>
    @page{size:A4;margin:18mm 16mm 18mm}*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}html{font-size:12pt}body{margin:0;background:#d4d4d8;color:#18181b;font-family:Arial,Helvetica,sans-serif;font-size:12pt;line-height:1.55}.document{width:210mm;min-height:297mm;margin:0 auto;background:white;padding:18mm 16mm;box-shadow:0 12px 50px rgba(0,0,0,.2)}header{display:flex;align-items:center;justify-content:space-between;gap:20px;border-bottom:4px solid #f2c300;padding-bottom:12px}.brand{display:flex;align-items:center;gap:12px}.brand img{width:64px;height:64px;object-fit:contain}.brand strong{display:block;font-size:17pt;text-transform:uppercase}.brand span{display:block;color:#a16207;font-size:9pt;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.meta{text-align:right}.meta strong{font-size:14pt}.meta small{display:block;color:#71717a}.title{text-align:center;margin:28px 0 20px}.title h1{font-size:18pt;margin:0;text-transform:uppercase}.title p{margin:7px 0 0;color:#52525b}.parties{border:1px solid #d4d4d8;border-radius:12px;padding:14px}.parties p{margin:8px 0;text-align:justify}.parties b{color:#854d0e}.summary{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:18px 0}.summary div{border:1px solid #d4d4d8;border-radius:10px;padding:10px}.summary span{display:block;color:#71717a;font-size:8.5pt;font-weight:800;text-transform:uppercase}.summary strong{display:block;margin-top:3px}.object,.clause{margin-top:18px}.object h2,.clause h2,.table-section h2,.signatures h2{margin:0 0 8px;border-left:5px solid #f2c300;padding-left:9px;font-size:12pt;text-transform:uppercase}.object p,.clause p{margin:7px 0;text-align:justify}.clause{break-inside:auto}.clause.important{border:2px solid #f2c300;border-radius:12px;background:#fffbeb;padding:13px}.table-section{margin-top:20px}table{width:100%;border-collapse:collapse;font-size:10pt}thead{display:table-header-group}th{background:#18181b;color:white;padding:8px;text-align:left;text-transform:uppercase;font-size:8.5pt}td{padding:8px;border-bottom:1px solid #e4e4e7;vertical-align:top}td small{display:block;color:#71717a;margin-top:3px}.commercial{border:2px solid #18181b;border-radius:12px;margin-top:20px;padding:14px}.commercial h2{margin:0 0 9px;font-size:13pt}.commercial-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.commercial-grid div{border-top:1px solid #d4d4d8;padding-top:7px}.commercial-grid span{display:block;color:#71717a;font-size:8.5pt;text-transform:uppercase;font-weight:800}.signing-callout{border:2px solid #f2c300;background:#fffbeb;border-radius:14px;padding:14px;margin-top:24px;break-inside:avoid}.signing-callout p{margin:6px 0}.signing-callout code{display:block;word-break:break-all;font-size:8.5pt}.signatures{margin-top:30px;break-inside:avoid}.signature-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:34px}.signature-box{text-align:center}.signature-art{height:72px;display:flex;align-items:center;justify-content:center;font-size:19pt}.signature-art img{max-width:100%;max-height:70px;object-fit:contain}.signature-script{font-family:cursive;font-style:italic;font-size:24pt}.signature-art.typed{gap:7px;font-weight:700}.signature-art.typed span{color:#15803d}.signature-art.pending{color:#a1a1aa;font-size:11pt}.signature-line{border-top:1px solid #18181b}.signature-box strong,.signature-box small{display:block;margin-top:5px}.signature-box small{color:#71717a}.legal-note{margin-top:24px;border:1px solid #d4d4d8;border-radius:10px;padding:12px;font-size:9.5pt}.footer{margin-top:28px;border-top:1px solid #d4d4d8;padding-top:9px;color:#71717a;font-size:8.5pt;text-align:center}p{orphans:3;widows:3}tr,.summary div,.commercial,.signatures{break-inside:avoid}@media print{body{background:white}.document{width:auto;min-height:auto;margin:0;padding:0;box-shadow:none}.no-print{display:none}}
  </style></head><body><main class="document">
    <header><div class="brand"><img src="/img/logo.png" alt="Volt"><div><strong>Volt Soluções Elétricas</strong><span>Energia que conecta. Soluções que protegem.</span></div></div><div class="meta"><strong>${escapeHtml(contract.id)}</strong><small>Orçamento ${escapeHtml(contract.quoteId)}</small><small>Emissão ${formatDate(contract.createdAt)}</small></div></header>
    <section class="title"><h1>${escapeHtml(contract.title)}</h1><p>Instrumento particular de prestação de serviços elétricos</p></section>
    <section class="parties"><p><b>CONTRATADA:</b> ${partyText(contract.contractor)}.</p><p><b>CONTRATANTE:</b> ${partyText(contract.client)}.</p><p>As partes acima identificadas celebram este contrato conforme as condições seguintes, o orçamento vinculado e os anexos expressamente mencionados.</p></section>
    <section class="summary"><div><span>Local do serviço</span><strong>${escapeHtml(contract.serviceLocation || "Não informado")}</strong></div><div><span>Valor total</span><strong>${brl(contract.totalValue)}</strong></div><div><span>Prazo</span><strong>${escapeHtml(contract.executionDeadline)}</strong></div><div><span>Garantia</span><strong>${escapeHtml(contract.warranty)}</strong></div></section>
    <section class="object"><h2>Objeto do contrato</h2>${paragraphs(contract.objectDescription)}</section>
    <section class="table-section"><h2>Escopo detalhado</h2><table><thead><tr><th>Item</th><th>Descrição</th><th>Quantidade</th><th>Valor</th></tr></thead><tbody>${scopeRows || '<tr><td colspan="4">Escopo não preenchido.</td></tr>'}</tbody></table></section>
    ${contract.materials.length ? `<section class="table-section"><h2>Anexo I — Relação de materiais</h2><table><thead><tr><th>Item</th><th>Material / especificação</th><th>Quantidade</th></tr></thead><tbody>${materialRows}</tbody></table></section>` : ""}
    <section class="commercial"><h2>Condições comerciais e cronograma</h2><div class="commercial-grid"><div><span>Preço</span><strong>${brl(contract.totalValue)}</strong></div><div><span>Pagamento</span><strong>${escapeHtml(contract.paymentTerms)}</strong></div><div><span>Início</span><strong>${escapeHtml(contract.startCondition)}</strong></div><div><span>Execução</span><strong>${escapeHtml(contract.executionDeadline)}</strong></div><div><span>Programação</span><strong>${escapeHtml(contract.scheduleNotes)}</strong></div><div><span>Garantia</span><strong>${escapeHtml(contract.warranty)}</strong></div></div></section>
    <section class="clause"><h2>Responsabilidade e documentação técnica</h2><p><strong>Responsável indicado:</strong> ${escapeHtml(contract.technicalResponsible || "A definir")} ${contract.professionalRegistration ? `— ${escapeHtml(contract.professionalRegistration)}` : ""}.</p>${paragraphs(contract.technicalDocuments)}</section>
    ${clauseHtml}${consumerClause}
    ${contract.additionalNotes ? `<section class="clause"><h2>Condições adicionais</h2>${paragraphs(contract.additionalNotes)}</section>` : ""}
    ${signingBlock}
    <section class="signatures"><h2>Manifestação das partes</h2><p>As partes declaram que tiveram acesso ao conteúdo integral, puderam esclarecer dúvidas e recebem uma cópia deste instrumento.</p><div class="signature-grid"><div class="signature-box">${signatureVisual(contract.contractorSignature, contract.contractor.representative || contract.contractor.name)}<small>CONTRATADA — ${escapeHtml(contract.contractor.document)}</small></div><div class="signature-box">${signatureVisual(contract.clientSignature, contract.client.representative || contract.client.name)}<small>CONTRATANTE — ${escapeHtml(contract.client.document)}</small></div></div></section>
    <section class="legal-note"><strong>Registro eletrônico</strong><p>Documento ${escapeHtml(contract.id)}, versão ${contract.schemaVersion}, vinculado ao orçamento ${escapeHtml(contract.quoteId)}. Status: ${escapeHtml(contract.status)}. A assinatura eletrônica registra manifestação de vontade e evidências técnicas; a adequação jurídica do modelo deve ser revisada para as particularidades de cada contratação.</p></section>
    <footer class="footer">Volt Soluções Elétricas • ${escapeHtml(contract.contractor.phone)} • ${escapeHtml(contract.contractor.email)} • ${escapeHtml(contract.contractor.city)}</footer>
  </main></body></html>`;
}

export function openContractPdf(contract: Contract, purpose: "signature" | "final" = "signature") {
  const popup = window.open("", "_blank");
  if (!popup) throw new Error("Permita pop-ups para gerar o contrato em PDF.");
  popup.document.open();
  popup.document.write(generateContractPdfHtml(contract, purpose));
  popup.document.close();
  popup.focus();
  setTimeout(() => popup.print(), 700);
}
