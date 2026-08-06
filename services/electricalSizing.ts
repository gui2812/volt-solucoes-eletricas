import type {
  CircuitInput,
  CircuitResult,
  CircuitStatus,
  ElectricalRoom,
  MaterialItem,
  PhaseAssignment,
  ProjectData,
  RoomType,
  SizingCalculation
} from "@/types/electrical";
import {
  BREAKER_RATINGS,
  breakerCurveFor,
  breakerPolesFor,
  calculateCurrent,
  calculateVoltageDropPercent,
  inferPhaseConfiguration,
  recommendCableAndBreaker,
  recommendDps,
  recommendDr,
  validateCircuit
} from "@/utils/electricalFormulas";

export const ELECTRICAL_RULE_SET = "VOLT-BT-2026.1";

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function getPriceFromStock(materialCategory: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const savedStock = localStorage.getItem("volt_materiais_premium_v1");
    const stock = savedStock ? JSON.parse(savedStock) : [];
    if (!Array.isArray(stock)) return 0;
    const item = stock.find((candidate: Record<string, unknown>) =>
      String(candidate.category ?? "").toLocaleLowerCase("pt-BR").includes(materialCategory.toLocaleLowerCase("pt-BR"))
    );
    return Number(item?.averageCost) || 0;
  } catch {
    return 0;
  }
}

export function calculateLightingLoad(area: number) {
  if (area <= 0) return 0;
  if (area <= 6) return 100;
  return 100 + Math.floor((area - 6) / 4) * 60;
}

export function calculateTugLoad(perimeter: number, type: RoomType) {
  if (perimeter <= 0) return { qty: 0, power: 0 };
  if (type === "MOLHADO") {
    const qty = Math.ceil(perimeter / 3.5);
    return { qty, power: qty <= 3 ? qty * 600 : 1_800 + (qty - 3) * 100 };
  }
  const qty = Math.ceil(perimeter / 5);
  return { qty, power: qty * 100 };
}

export function calculateCircuit(project: ProjectData, circuit: CircuitInput): CircuitResult {
  const totalPowerWatts = Math.max(Number(circuit.powerWatts || 0), 0) * Math.max(Number(circuit.quantity || 1), 1);
  const phaseConfiguration = inferPhaseConfiguration(
    Number(circuit.voltage || 220),
    project.electricalSystem,
    circuit.phaseConfiguration
  );
  const current = calculateCurrent(
    totalPowerWatts,
    Number(circuit.voltage || 220),
    Number(circuit.powerFactor || 1),
    phaseConfiguration
  );
  const selection = recommendCableAndBreaker({
    current,
    type: circuit.type,
    material: circuit.cableMaterial,
    insulation: circuit.insulation,
    ambientTemperature: Number(circuit.ambientTemperature || 30),
    groupedConductors: Number(circuit.groupedConductors || 3)
  });
  const breakerPoles = breakerPolesFor(phaseConfiguration, Boolean(circuit.neutralRequired));
  const voltageDropPercent = calculateVoltageDropPercent(
    current,
    Number(circuit.lengthMeters || 0),
    selection.section,
    Number(circuit.voltage || 220),
    circuit.cableMaterial,
    phaseConfiguration
  );
  const validation = validateCircuit({
    current,
    breaker: selection.breaker,
    correctedCapacity: selection.correctedCapacity,
    voltageDropPercent,
    supported: selection.supported,
    lengthMeters: Number(circuit.lengthMeters || 0),
    phaseConfiguration
  });

  return {
    circuitId: circuit.id,
    name: circuit.name,
    type: circuit.type,
    totalPowerWatts,
    calculatedCurrent: round(current),
    recommendedCableSection: selection.section,
    correctedCableCapacity: round(selection.correctedCapacity),
    recommendedBreaker: selection.breaker,
    breakerPoles,
    breakerCurve: breakerCurveFor(circuit.type),
    recommendedDr: recommendDr(circuit.type, selection.breaker, breakerPoles),
    recommendedDps: recommendDps(Number(circuit.voltage || 220)),
    voltageDropPercent: round(voltageDropPercent),
    phaseConfiguration,
    phaseAssignment: "F1",
    status: validation.status,
    warnings: validation.warnings
  };
}

function balancePhases(project: ProjectData, results: CircuitResult[]) {
  const available = project.electricalSystem === "Monofásico"
    ? ["F1"] as const
    : project.electricalSystem === "Bifásico"
      ? ["F1", "F2"] as const
      : ["F1", "F2", "F3"] as const;
  const loads: Record<"F1" | "F2" | "F3", number> = { F1: 0, F2: 0, F3: 0 };
  const assignments = new Map<string, PhaseAssignment>();
  const sorted = [...results].sort((a, b) => b.calculatedCurrent - a.calculatedCurrent);

  for (const result of sorted) {
    if (result.phaseConfiguration === "3F" && available.length === 3) {
      loads.F1 += result.calculatedCurrent;
      loads.F2 += result.calculatedCurrent;
      loads.F3 += result.calculatedCurrent;
      assignments.set(result.circuitId, "F1-F2-F3");
      continue;
    }

    if (result.phaseConfiguration === "F-F" && available.length >= 2) {
      const pairs = available.length === 2
        ? [["F1", "F2"]] as const
        : [["F1", "F2"], ["F2", "F3"], ["F1", "F3"]] as const;
      const pair = [...pairs].sort((a, b) => (loads[a[0]] + loads[a[1]]) - (loads[b[0]] + loads[b[1]]))[0];
      loads[pair[0]] += result.calculatedCurrent;
      loads[pair[1]] += result.calculatedCurrent;
      assignments.set(result.circuitId, `${pair[0]}-${pair[1]}` as PhaseAssignment);
      continue;
    }

    const phase = [...available].sort((a, b) => loads[a] - loads[b])[0];
    loads[phase] += result.calculatedCurrent;
    assignments.set(result.circuitId, phase);
  }

  return {
    results: results.map((result) => ({ ...result, phaseAssignment: assignments.get(result.circuitId) ?? "F1" })),
    loads: { F1: round(loads.F1), F2: round(loads.F2), F3: round(loads.F3) }
  };
}

function voltageNumber(value: ProjectData["voltage"]) {
  const values = String(value).match(/\d+/g)?.map(Number).filter(Number.isFinite) ?? [220];
  return Math.max(...values);
}

function preliminaryMainBreaker(current: number) {
  return BREAKER_RATINGS.find((rating) => rating >= current) ?? BREAKER_RATINGS[BREAKER_RATINGS.length - 1];
}

function standardBoardModules(required: number) {
  return [12, 18, 24, 36, 48, 72].find((modules) => modules >= required) ?? Math.ceil(required / 12) * 12;
}

function getGeneralStatus(statuses: CircuitStatus[]): CircuitStatus {
  if (statuses.includes("Erro")) return "Erro";
  if (statuses.includes("Atenção")) return "Atenção";
  return "OK";
}

export function calculateSizing(project: ProjectData, circuits: CircuitInput[], rooms: ElectricalRoom[] = []): SizingCalculation {
  const balanced = balancePhases(project, circuits.map((circuit) => calculateCircuit(project, circuit)));
  const installedPowerWatts = circuits.reduce((sum, circuit) => sum + Number(circuit.powerWatts || 0) * Number(circuit.quantity || 1), 0);
  const apparentPowerVa = circuits.reduce((sum, circuit) => {
    return sum + (Number(circuit.powerWatts || 0) * Number(circuit.quantity || 1)) / Math.max(Number(circuit.powerFactor || 1), 0.1);
  }, 0);
  const demandFactor = Math.min(Math.max(Number(project.demandFactor || 0.8), 0.1), 1);
  const demandPowerWatts = installedPowerWatts * demandFactor;
  const supplyVoltage = voltageNumber(project.voltage);
  const mainConfiguration = project.electricalSystem === "Trifásico" ? "3F" : project.electricalSystem === "Bifásico" ? "F-F" : "F-N";
  const demandCurrent = calculateCurrent(demandPowerWatts, supplyVoltage, 0.92, mainConfiguration);
  const activePhaseCount = project.electricalSystem === "Monofásico" ? 1 : project.electricalSystem === "Bifásico" ? 2 : 3;
  const activeLoads = [balanced.loads.F1, balanced.loads.F2, balanced.loads.F3].slice(0, activePhaseCount);
  const phaseAverage = activeLoads.reduce((sum, value) => sum + value, 0) / Math.max(activeLoads.length, 1);
  const phaseImbalancePercent = phaseAverage > 0
    ? ((Math.max(...activeLoads) - Math.min(...activeLoads)) / phaseAverage) * 100
    : 0;
  const circuitModules = balanced.results.reduce((sum, result) => sum + result.breakerPoles, 0);
  const protectionModules = (project.electricalSystem === "Trifásico" ? 8 : 5) + 2;
  const boardModules = standardBoardModules(Math.ceil((circuitModules + protectionModules) * 1.3));
  const materials = generateMaterialList(balanced.results, circuits, rooms, project, boardModules);
  const generalStatus = getGeneralStatus(balanced.results.map((result) => result.status));

  return {
    project,
    circuits,
    results: balanced.results,
    materials,
    generalStatus,
    ruleSetVersion: ELECTRICAL_RULE_SET,
    summary: {
      installedPowerWatts: round(installedPowerWatts),
      apparentPowerVa: round(apparentPowerVa),
      demandFactor: round(demandFactor, 3),
      demandPowerWatts: round(demandPowerWatts),
      demandCurrent: round(demandCurrent),
      preliminaryMainBreaker: preliminaryMainBreaker(demandCurrent),
      phaseCurrents: balanced.loads,
      phaseImbalancePercent: round(phaseImbalancePercent),
      boardModules,
      assumptions: [
        `Fator de demanda editável adotado: ${round(demandFactor * 100, 1)}%.`,
        "Limite preliminar de queda de tensão adotado pela Volt: 4%.",
        "Reserva de 15% aplicada aos comprimentos e aproximadamente 30% aos módulos do quadro."
      ],
      limitations: [
        "Pré-dimensionamento orientativo: não substitui projeto, inspeção, medições, ART/TRT ou validação de profissional habilitado.",
        "Método de instalação, temperatura, agrupamento, harmônicas, partida de motores, seletividade e coordenação devem ser confirmados no local.",
        "A corrente de curto-circuito presumida e a capacidade de interrupção dos dispositivos não foram calculadas.",
        "Os critérios precisam ser conferidos na edição licenciada e vigente das normas aplicáveis e nas regras da concessionária."
      ]
    }
  };
}

export function generateMaterialList(
  results: CircuitResult[],
  circuits: CircuitInput[],
  rooms: ElectricalRoom[] = [],
  project?: ProjectData,
  boardModules = 24
): MaterialItem[] {
  const aggregate = new Map<string, MaterialItem>();

  const add = (material: string, specification: string, quantity: number, unit: string, observation: string, stockCategory = material) => {
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    const key = `${material}|${specification}|${unit}`;
    const existing = aggregate.get(key);
    if (existing) {
      existing.quantity = round(existing.quantity + quantity, unit === "m" ? 0 : 2);
      existing.totalCost = round((existing.unitCost ?? 0) * existing.quantity);
      existing.observation = `${existing.observation}; ${observation}`;
      return;
    }
    const unitCost = getPriceFromStock(stockCategory);
    aggregate.set(key, {
      id: `MAT-${aggregate.size + 1}`,
      material,
      specification,
      quantity: round(quantity, unit === "m" ? 0 : 2),
      unit,
      unitCost,
      totalCost: round(quantity * unitCost),
      observation
    });
  };

  results.forEach((result, index) => {
    const circuit = circuits[index];
    if (!circuit) return;
    const conductorCount = result.phaseConfiguration === "3F"
      ? circuit.neutralRequired ? 5 : 4
      : 3;
    const cableLength = Math.ceil(Math.max(Number(circuit.lengthMeters || 0), 0) * 1.15 * conductorCount);
    add(
      "Cabo elétrico",
      `${result.recommendedCableSection} mm² • ${circuit.cableMaterial} • ${circuit.insulation}`,
      cableLength,
      "m",
      `${result.name}: ${conductorCount} condutores incluindo PE; cores e neutro a confirmar.`,
      "Cabos"
    );
    add(
      "Disjuntor termomagnético",
      `${result.breakerPoles}P • ${result.recommendedBreaker}A • curva ${result.breakerCurve} • capacidade de interrupção a confirmar`,
      1,
      "un",
      `Proteção preliminar do circuito ${result.name}.`,
      "Disjuntores"
    );
    add(
      "Eletroduto / canaleta",
      "Dimensão a confirmar pela taxa de ocupação e método de instalação",
      Math.ceil(Math.max(Number(circuit.lengthMeters || 0), 0) * 1.15),
      "m",
      `Trajeto do circuito ${result.name}.`,
      "Infraestrutura"
    );
  });

  const protectedCircuits = results.filter((result) => /30mA/.test(result.recommendedDr));
  if (protectedCircuits.length) {
    const drCount = Math.max(1, Math.ceil(protectedCircuits.length / 4));
    const drPoles = project?.electricalSystem === "Trifásico" ? 4 : 2;
    const maxBreaker = Math.max(...protectedCircuits.map((result) => result.recommendedBreaker));
    const drRating = [40, 63, 80, 100, 125].find((value) => value >= maxBreaker) ?? 125;
    add("DR", `${drPoles}P • ${drRating}A • 30mA`, drCount, "un", "Quantidade preliminar por grupos; confirmar esquema, continuidade e seletividade.", "Proteção");
  }

  if (results.length) {
    const phaseCount = project?.electricalSystem === "Trifásico" ? 3 : project?.electricalSystem === "Bifásico" ? 2 : 1;
    add("DPS", results[0].recommendedDps, phaseCount, "un", "Quantidade preliminar por fases; esquema, Uc, Up, In e proteção de retaguarda a confirmar.", "Proteção");
    add("Quadro de distribuição", `${boardModules} módulos DIN com reserva`, 1, "un", "Tamanho preliminar; confirmar fabricante, barramentos e espaço para dissipação.", "Quadro elétrico");
    add("Barramento", "Neutro e proteção (PE) compatíveis com o quadro", 1, "kit", "Separação e seções a confirmar no projeto executivo.", "Barramentos");
  }

  const tugCount = rooms.reduce((sum, room) => sum + calculateTugLoad(room.perimeter, room.type).qty, 0);
  if (tugCount) add("Tomada 2P+T", "Corrente, padrão e acabamento a definir por ambiente", tugCount, "un", "Quantidade mínima preliminar calculada pelos ambientes.", "Tomadas e interruptores");
  if (rooms.length) {
    add("Ponto de iluminação", "Caixa, suporte e conexão; luminária a definir", rooms.length, "pt", "Premissa de ao menos um ponto por ambiente.", "Iluminação");
    add("Interruptor", "Simples, acabamento a definir", rooms.length, "un", "Premissa de um comando simples por ambiente; revisar paralelos/intermediários.", "Tomadas e interruptores");
  }

  return [...aggregate.values()];
}

export function validateQdcProject(qdcProject: { modules?: number }, placedComponents: Array<{ modules: number; kind: string }>) {
  const validations: Array<{ id: string; message: string; status: CircuitStatus }> = [];
  const usedModules = placedComponents.reduce((sum, component) => sum + component.modules, 0);

  if (usedModules > Number(qdcProject?.modules || 0)) {
    validations.push({ id: "mod-capacity", message: `Capacidade do quadro excedida: ${usedModules}/${qdcProject.modules} módulos.`, status: "Erro" });
  }
  if (!placedComponents.some((component) => component.kind.includes("breaker"))) {
    validations.push({ id: "missing-breaker", message: "O quadro não possui disjuntor de proteção.", status: "Erro" });
  }
  if (!placedComponents.some((component) => component.kind === "dr")) {
    validations.push({ id: "missing-dr", message: "DR não incluído; confirmar os circuitos e locais que exigem proteção adicional.", status: "Atenção" });
  }
  if (!placedComponents.some((component) => component.kind === "dps")) {
    validations.push({ id: "missing-dps", message: "DPS não incluído; avaliar proteção contra surtos e coordenação.", status: "Atenção" });
  }
  if (!validations.length) {
    validations.push({ id: "all-ok", message: "Montagem preliminar sem pendências básicas visuais.", status: "OK" });
  }
  return validations;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ptNumber(value: number, decimals = 2) {
  return Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function generateMemorialHtml(calculation: SizingCalculation) {
  const project = calculation.project;
  const summary = calculation.summary;
  const circuitRows = calculation.results.map((result) => `
    <tr>
      <td><strong>${escapeHtml(result.name)}</strong><br><small>${escapeHtml(result.type)} • ${escapeHtml(result.phaseAssignment)}</small></td>
      <td>${ptNumber(result.totalPowerWatts, 0)} W</td>
      <td>${ptNumber(result.calculatedCurrent)} A</td>
      <td>${ptNumber(result.recommendedCableSection, result.recommendedCableSection % 1 ? 1 : 0)} mm²<br><small>Iz ${ptNumber(result.correctedCableCapacity)} A</small></td>
      <td>${result.breakerPoles}P ${result.recommendedBreaker} A curva ${result.breakerCurve}</td>
      <td>${ptNumber(result.voltageDropPercent)}%</td>
      <td><span class="status ${result.status.toLocaleLowerCase("pt-BR")}">${escapeHtml(result.status)}</span></td>
    </tr>
    <tr class="warning-row"><td colspan="7">${result.warnings.map(escapeHtml).join(" • ")}</td></tr>
  `).join("");
  const materialRows = calculation.materials.map((item) => `
    <tr>
      <td><strong>${escapeHtml(item.material)}</strong><br><small>${escapeHtml(item.specification)}</small></td>
      <td>${ptNumber(item.quantity, item.unit === "m" ? 0 : 2)} ${escapeHtml(item.unit)}</td>
      <td>${escapeHtml(item.observation)}</td>
    </tr>
  `).join("");
  const phaseRows = (["F1", "F2", "F3"] as const)
    .filter((phase, index) => index < (project.electricalSystem === "Monofásico" ? 1 : project.electricalSystem === "Bifásico" ? 2 : 3))
    .map((phase) => `<div><span>${phase}</span><strong>${ptNumber(summary.phaseCurrents[phase])} A</strong></div>`).join("");

  return `<!doctype html>
  <html lang="pt-BR"><head><meta charset="utf-8"><title>Memorial de pré-dimensionamento - ${escapeHtml(project.projectName)}</title>
  <style>
    @page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#111827;font-size:10px;line-height:1.45}header{display:flex;justify-content:space-between;gap:24px;border-bottom:4px solid #f7c900;padding-bottom:14px}.brand{font-size:24px;font-weight:900}.brand b{color:#c99e00}.doc{text-align:right}.doc h1{margin:0;font-size:17px}.doc p{margin:3px 0;color:#6b7280}.section{margin-top:18px;break-inside:avoid}.section h2{margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.08em;border-left:4px solid #f7c900;padding-left:8px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.box{border:1px solid #d1d5db;border-radius:8px;padding:8px}.box span,.phases span{display:block;color:#6b7280;font-size:8px;text-transform:uppercase;font-weight:700}.box strong{display:block;margin-top:2px;font-size:12px}.phases{display:flex;gap:7px;margin-top:8px}.phases div{flex:1;border:1px solid #d1d5db;border-radius:8px;padding:8px}.phases strong{font-size:12px}table{width:100%;border-collapse:collapse}th{background:#111827;color:white;text-align:left;padding:7px;font-size:8px;text-transform:uppercase}td{border-bottom:1px solid #e5e7eb;padding:7px;vertical-align:top}small{color:#6b7280}.warning-row td{padding-top:0;color:#6b7280;font-size:8px}.status{font-weight:800}.status.erro{color:#b91c1c}.status.atenção{color:#a16207}.status.ok{color:#15803d}.notice{border:1px solid #f5c842;background:#fffbeb;border-radius:10px;padding:11px}.notice strong{display:block;margin-bottom:4px}.notice ul{margin:5px 0 0;padding-left:16px}.signature{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:42px}.signature div{border-top:1px solid #111827;padding-top:6px;text-align:center}.footer{margin-top:20px;border-top:1px solid #e5e7eb;padding-top:8px;color:#6b7280;font-size:8px}@media print{.section{break-inside:auto}thead{display:table-header-group}tr{break-inside:avoid}}
  </style></head><body>
    <header><div><div class="brand"><b>VOLT</b> SOLUÇÕES ELÉTRICAS</div><p>Pré-dimensionamento elétrico orientativo</p></div><div class="doc"><h1>${escapeHtml(project.projectName || "Projeto elétrico")}</h1><p>Regra ${escapeHtml(calculation.ruleSetVersion)}</p><p>Emitido em ${new Date().toLocaleDateString("pt-BR")}</p></div></header>
    <section class="section"><h2>Identificação</h2><div class="grid">
      <div class="box"><span>Cliente</span><strong>${escapeHtml(project.client || "Não informado")}</strong></div>
      <div class="box"><span>Instalação</span><strong>${escapeHtml(project.installationType)}</strong></div>
      <div class="box"><span>Sistema</span><strong>${escapeHtml(project.electricalSystem)}</strong></div>
      <div class="box"><span>Tensão</span><strong>${escapeHtml(project.voltage)}</strong></div>
    </div><div class="grid" style="margin-top:7px"><div class="box" style="grid-column:span 2"><span>Local</span><strong>${escapeHtml(project.address || "Não informado")}</strong></div><div class="box" style="grid-column:span 2"><span>Responsável pela revisão</span><strong>${escapeHtml(project.technicalResponsible || "A definir")}</strong></div></div></section>
    <section class="section"><h2>Resumo de cargas</h2><div class="grid">
      <div class="box"><span>Potência instalada</span><strong>${ptNumber(summary.installedPowerWatts / 1000)} kW</strong></div>
      <div class="box"><span>Potência aparente</span><strong>${ptNumber(summary.apparentPowerVa / 1000)} kVA</strong></div>
      <div class="box"><span>Demanda adotada</span><strong>${ptNumber(summary.demandFactor * 100, 1)}%</strong></div>
      <div class="box"><span>Disjuntor geral preliminar</span><strong>${summary.preliminaryMainBreaker} A</strong></div>
    </div><div class="phases">${phaseRows}</div></section>
    <section class="section"><h2>Circuitos — verificação preliminar Ib ≤ In ≤ Iz</h2><table><thead><tr><th>Circuito</th><th>Carga</th><th>Ib</th><th>Condutor</th><th>Disjuntor</th><th>Queda</th><th>Revisão</th></tr></thead><tbody>${circuitRows || '<tr><td colspan="7">Nenhum circuito calculado.</td></tr>'}</tbody></table></section>
    <section class="section"><h2>Relação preliminar de materiais</h2><table><thead><tr><th>Material</th><th>Quantidade</th><th>Observação</th></tr></thead><tbody>${materialRows || '<tr><td colspan="3">Nenhum material calculado.</td></tr>'}</tbody></table></section>
    <section class="section notice"><strong>Premissas e limites obrigatórios de revisão</strong><ul>${[...summary.assumptions, ...summary.limitations].map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>
    ${project.notes ? `<section class="section"><h2>Observações do projeto</h2><p>${escapeHtml(project.notes)}</p></section>` : ""}
    <div class="signature"><div>${escapeHtml(project.technicalResponsible || "Responsável técnico")}<br><small>Revisão e validação técnica</small></div><div>Data e assinatura<br><small>Registro profissional / ART ou TRT, quando aplicável</small></div></div>
    <div class="footer">Este documento é um memorial de pré-dimensionamento gerado pelo sistema Volt. Não é laudo, projeto executivo nem autorização para execução sem revisão técnica.</div>
  </body></html>`;
}
