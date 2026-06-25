import type {
  CircuitInput,
  CircuitResult,
  CircuitStatus,
  MaterialItem,
  ProjectData,
  QdcPlacedComponent,
  QdcProjectData,
  QdcValidation,
  SizingCalculation
} from "@/types/electrical";

import {
  calculateCurrent,
  calculateVoltageDropPercent,
  recommendBreaker,
  recommendCableSection,
  recommendDps,
  recommendDr,
  validateCircuit
} from "@/utils/electricalFormulas";

export function calculateCircuit(project: ProjectData, circuit: CircuitInput): CircuitResult {
  const totalPowerWatts = Number(circuit.powerWatts || 0) * Number(circuit.quantity || 1);

  const current = calculateCurrent(
    totalPowerWatts,
    Number(circuit.voltage || 220),
    Number(circuit.powerFactor || 1),
    project.electricalSystem
  );

  const cableSection = recommendCableSection(
    current,
    circuit.cableMaterial,
    circuit.insulation,
    Number(circuit.ambientTemperature || 30),
    Number(circuit.groupedConductors || 3)
  );

  const breaker = recommendBreaker(current);

  const voltageDropPercent = calculateVoltageDropPercent(
    current,
    Number(circuit.lengthMeters || 0),
    cableSection,
    Number(circuit.voltage || 220),
    circuit.cableMaterial
  );

  const validation = validateCircuit(current, breaker, voltageDropPercent, cableSection);

  return {
    circuitId: circuit.id,
    name: circuit.name,
    type: circuit.type,
    totalPowerWatts,
    calculatedCurrent: Number(current.toFixed(2)),
    recommendedCableSection: cableSection,
    recommendedBreaker: breaker,
    recommendedDr: recommendDr(circuit.type, current),
    recommendedDps: recommendDps(Number(circuit.voltage || 220)),
    voltageDropPercent: Number(voltageDropPercent.toFixed(2)),
    status: validation.status,
    warnings: validation.warnings
  };
}

export function calculateSizing(project: ProjectData, circuits: CircuitInput[]): SizingCalculation {
  const results = circuits.map((circuit) => calculateCircuit(project, circuit));
  const materials = generateMaterialList(results, circuits);
  const generalStatus = getGeneralStatus(results.map((result) => result.status));

  return {
    project,
    circuits,
    results,
    materials,
    generalStatus
  };
}

function getGeneralStatus(statuses: CircuitStatus[]): CircuitStatus {
  if (statuses.includes("Erro")) return "Erro";
  if (statuses.includes("Atenção")) return "Atenção";
  return "OK";
}

export function generateMaterialList(results: CircuitResult[], circuits: CircuitInput[]): MaterialItem[] {
  const materials: MaterialItem[] = [];

  results.forEach((result, index) => {
    const circuit = circuits[index];
    const cableLength = Math.ceil(Number(circuit.lengthMeters || 0) * 1.15 * 3);

    materials.push({
      id: `MAT-CABO-${result.circuitId}`,
      material: "Cabo",
      specification: `${result.recommendedCableSection} mm² ${circuit.cableMaterial} ${circuit.insulation}`,
      quantity: cableLength,
      unit: "m",
      observation: `Circuito ${result.name}, já com 15% de sobra técnica.`
    });

    materials.push({
      id: `MAT-DJ-${result.circuitId}`,
      material: "Disjuntor",
      specification: `${result.recommendedBreaker}A`,
      quantity: 1,
      unit: "un",
      observation: `Proteção do circuito ${result.name}.`
    });

    if (result.recommendedDr !== "Avaliar necessidade") {
      materials.push({
        id: `MAT-DR-${result.circuitId}`,
        material: "DR",
        specification: result.recommendedDr,
        quantity: 1,
        unit: "un",
        observation: `Proteção diferencial recomendada para ${result.type}.`
      });
    }
  });

  materials.push(
    {
      id: "MAT-DPS",
      material: "DPS",
      specification: results[0]?.recommendedDps ?? "DPS Classe II",
      quantity: 1,
      unit: "un",
      observation: "Proteção contra surtos."
    },
    {
      id: "MAT-QDC",
      material: "Quadro de distribuição",
      specification: "QDC com espaço reserva",
      quantity: 1,
      unit: "un",
      observation: "Dimensionar módulos conforme quantidade de circuitos."
    },
    {
      id: "MAT-BN",
      material: "Barramento de neutro",
      specification: "Compatível com QDC",
      quantity: 1,
      unit: "un",
      observation: "Obrigatório quando houver neutro."
    },
    {
      id: "MAT-BT",
      material: "Barramento de terra",
      specification: "Compatível com QDC",
      quantity: 1,
      unit: "un",
      observation: "Obrigatório para aterramento."
    },
    {
      id: "MAT-ETIQ",
      material: "Etiquetas",
      specification: "Identificação de disjuntores",
      quantity: circuits.length,
      unit: "un",
      observation: "Identificação dos circuitos."
    }
  );

  return materials;
}

export function validateQdcProject(project: QdcProjectData, components: QdcPlacedComponent[]): QdcValidation[] {
  const usedModules = components.reduce((sum, component) => sum + component.modules, 0);
  const breakers = components.filter((component) => component.kind.includes("breaker"));
  const hasMainBreaker = components.some((component) => component.kind === "main-breaker");
  const hasNeutral = components.some((component) => component.kind === "neutral-bar");
  const hasGround = components.some((component) => component.kind === "ground-bar");
  const hasDr = components.some((component) => component.kind === "dr");
  const hasDps = components.some((component) => component.kind === "dps");
  const unlabeledBreakers = breakers.filter((component) => !component.label || component.label.trim() === component.name);

  return [
    {
      status: hasMainBreaker ? "OK" : "Erro",
      title: "Disjuntor geral",
      description: hasMainBreaker ? "Existe disjuntor geral no quadro." : "Adicione um disjuntor geral."
    },
    {
      status: hasNeutral ? "OK" : "Atenção",
      title: "Barramento de neutro",
      description: hasNeutral ? "Barramento de neutro presente." : "Adicione barramento de neutro quando houver circuitos com neutro."
    },
    {
      status: hasGround ? "OK" : "Erro",
      title: "Barramento de terra",
      description: hasGround ? "Barramento de terra presente." : "Adicione barramento de terra para aterramento."
    },
    {
      status: breakers.length > 0 ? "OK" : "Erro",
      title: "Disjuntores dos circuitos",
      description: breakers.length > 0 ? `${breakers.length} disjuntor(es) no quadro.` : "Adicione disjuntores para os circuitos."
    },
    {
      status: unlabeledBreakers.length === 0 ? "OK" : "Atenção",
      title: "Etiquetas",
      description: unlabeledBreakers.length === 0 ? "Disjuntores identificados." : "Existem disjuntores sem etiqueta personalizada."
    },
    {
      status: usedModules <= Number(project.modules || 0) ? "OK" : "Erro",
      title: "Espaço no quadro",
      description: usedModules <= Number(project.modules || 0) ? `${usedModules}/${project.modules} módulos usados.` : "Quantidade de módulos ultrapassada."
    },
    {
      status: hasDr ? "OK" : "Atenção",
      title: "DR",
      description: hasDr ? "DR presente." : "Avaliar necessidade de DR conforme circuitos."
    },
    {
      status: hasDps ? "OK" : "Atenção",
      title: "DPS",
      description: hasDps ? "DPS presente." : "Recomendado prever DPS no quadro."
    }
  ];
}

export function generateMemorialHtml(calculation: SizingCalculation) {
  const date = new Date().toLocaleDateString("pt-BR");

  const resultRows = calculation.results.map((result) => `
    <tr>
      <td>${result.name}</td>
      <td>${result.type}</td>
      <td>${result.totalPowerWatts} W</td>
      <td>${result.calculatedCurrent} A</td>
      <td>${result.recommendedCableSection} mm²</td>
      <td>${result.recommendedBreaker} A</td>
      <td>${result.recommendedDr}</td>
      <td>${result.recommendedDps}</td>
      <td>${result.voltageDropPercent}%</td>
      <td>${result.status}</td>
    </tr>
  `).join("");

  const materialRows = calculation.materials.map((item) => `
    <tr>
      <td>${item.material}</td>
      <td>${item.specification}</td>
      <td>${item.quantity}</td>
      <td>${item.unit}</td>
      <td>${item.observation}</td>
    </tr>
  `).join("");

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Memorial de Cálculo - Volt Soluções Elétricas</title>
        <style>
          body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #161616; background: #fff; }
          .page { padding: 34px; }
          .cover { background: #050505; color: white; padding: 28px; border-radius: 18px; margin-bottom: 24px; border-left: 10px solid #ffcb2f; }
          .brand { color: #ffcb2f; font-size: 12px; letter-spacing: 3px; font-weight: 900; text-transform: uppercase; }
          h1 { margin: 8px 0 4px; font-size: 30px; }
          h2 { margin: 26px 0 10px; font-size: 18px; border-bottom: 2px solid #ffcb2f; padding-bottom: 8px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .box { border: 1px solid #ddd; border-radius: 12px; padding: 12px; }
          .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #777; font-weight: 800; }
          .value { margin-top: 4px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th { background: #050505; color: #ffcb2f; padding: 8px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px; vertical-align: top; }
          .status { display: inline-block; padding: 8px 12px; border-radius: 999px; background: #ffcb2f; font-weight: 900; }
          .footer { margin-top: 28px; color: #666; font-size: 11px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <main class="page">
          <section class="cover">
            <div class="brand">Volt Soluções Elétricas</div>
            <h1>Memorial de Cálculo Elétrico</h1>
            <p>Documento técnico gerado pelo sistema interno da Volt.</p>
            <span class="status">Status geral: ${calculation.generalStatus}</span>
          </section>

          <h2>Dados do cliente e projeto</h2>
          <section class="grid">
            <div class="box"><div class="label">Cliente</div><div class="value">${calculation.project.client || "-"}</div></div>
            <div class="box"><div class="label">Projeto</div><div class="value">${calculation.project.projectName || "-"}</div></div>
            <div class="box"><div class="label">Endereço</div><div class="value">${calculation.project.address || "-"}</div></div>
            <div class="box"><div class="label">Instalação</div><div class="value">${calculation.project.installationType}</div></div>
            <div class="box"><div class="label">Sistema elétrico</div><div class="value">${calculation.project.electricalSystem}</div></div>
            <div class="box"><div class="label">Tensão</div><div class="value">${calculation.project.voltage}</div></div>
            <div class="box"><div class="label">Responsável técnico</div><div class="value">${calculation.project.technicalResponsible || "-"}</div></div>
            <div class="box"><div class="label">Data</div><div class="value">${date}</div></div>
          </section>

          <h2>Tabela de circuitos</h2>
          <table>
            <thead>
              <tr>
                <th>Circuito</th>
                <th>Tipo</th>
                <th>Potência</th>
                <th>Corrente</th>
                <th>Bitola</th>
                <th>Disjuntor</th>
                <th>DR</th>
                <th>DPS</th>
                <th>Queda V</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${resultRows}</tbody>
          </table>

          <h2>Lista de materiais</h2>
          <table>
            <thead>
              <tr>
                <th>Material</th>
                <th>Especificação</th>
                <th>Qtd</th>
                <th>Un.</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>${materialRows}</tbody>
          </table>

          <h2>Observações técnicas</h2>
          <p>${calculation.project.notes || "Sem observações adicionais."}</p>

          <div class="footer">
            Os cálculos são orientativos e devem ser conferidos por profissional habilitado, considerando norma técnica aplicável, método de instalação,
            agrupamento, temperatura, seletividade e fabricante dos componentes.
          </div>
        </main>
      </body>
    </html>
  `;
}
