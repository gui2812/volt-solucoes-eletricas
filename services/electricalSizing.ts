import type { CircuitInput, CircuitResult, MaterialItem, ProjectData, SizingCalculation } from "@/types/electrical";
import {
  calculateCurrent, calculateVoltageDropPercent, recommendBreaker, recommendCableSection,
  recommendDps, recommendDr, validateCircuit
} from "@/utils/electricalFormulas";

function getPriceFromStock(materialCategory: string): number {
  if (typeof window === "undefined") return 0;
  const savedStock = localStorage.getItem("volt_materiais_premium_v1");
  const stock = savedStock ? JSON.parse(savedStock) : [];
  const item = stock.find((m: any) => m.category.toLowerCase().includes(materialCategory.toLowerCase()));
  return item ? item.averageCost : 0;
}

export function calculateCircuit(project: ProjectData, circuit: CircuitInput): CircuitResult {
  const totalPowerWatts = Number(circuit.powerWatts || 0) * Number(circuit.quantity || 1);
  const current = calculateCurrent(totalPowerWatts, Number(circuit.voltage || 220), Number(circuit.powerFactor || 1), project.electricalSystem);
  const cableSection = recommendCableSection(current, circuit.cableMaterial, circuit.insulation, Number(circuit.ambientTemperature || 30), Number(circuit.groupedConductors || 3));
  const breaker = recommendBreaker(current);
  const voltageDropPercent = calculateVoltageDropPercent(current, Number(circuit.lengthMeters || 0), cableSection, Number(circuit.voltage || 220), circuit.cableMaterial);
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
  return { project, circuits, results, materials, generalStatus };
}

function getGeneralStatus(statuses: any[]): any {
  if (statuses.includes("Erro")) return "Erro";
  if (statuses.includes("Atenção")) return "Atenção";
  return "OK";
}

export function generateMaterialList(results: CircuitResult[], circuits: CircuitInput[]): MaterialItem[] {
  const materials: MaterialItem[] = [];

  results.forEach((result, index) => {
    const circuit = circuits[index];
    const cableLength = Math.ceil(Number(circuit.lengthMeters || 0) * 1.15 * 3);
    const cableCost = getPriceFromStock("Cabos");
    
    materials.push({
      id: `MAT-CABO-${result.circuitId}`,
      material: "Cabo",
      specification: `${result.recommendedCableSection} mm² ${circuit.cableMaterial}`,
      quantity: cableLength,
      unit: "m",
      unitCost: cableCost,
      totalCost: cableLength * cableCost,
      observation: `Circuito ${result.name}`
    });

    const djCost = getPriceFromStock("Disjuntores");
    materials.push({
      id: `MAT-DJ-${result.circuitId}`,
      material: "Disjuntor",
      specification: `${result.recommendedBreaker}A`,
      quantity: 1,
      unit: "un",
      unitCost: djCost,
      totalCost: djCost,
      observation: `Proteção ${result.name}.`
    });
  });

  return materials;
}

// Essa é a função que estava faltando e travando o seu Vercel
export function validateQdcProject(qdcProject: any, placedComponents: any[]) {
  const validations: any[] = [];
  const usedModules = placedComponents.reduce((sum: number, component: any) => sum + component.modules, 0);
  
  if (usedModules > (qdcProject?.modules || 0)) {
    validations.push({ id: "mod-capacity", message: `Capacidade do quadro excedida: ${usedModules}/${qdcProject.modules} módulos.`, status: "Erro" });
  }

  if (!placedComponents.some((c: any) => c.kind.includes("breaker"))) {
    validations.push({ id: "missing-breaker", message: "O quadro não possui nenhum disjuntor de proteção.", status: "Erro" });
  }

  if (!placedComponents.some((c: any) => c.kind === "dr")) {
    validations.push({ id: "missing-dr", message: "Falta de DR. Recomendado para proteção contra choques elétricos.", status: "Atenção" });
  }

  if (!placedComponents.some((c: any) => c.kind === "dps")) {
    validations.push({ id: "missing-dps", message: "Falta de DPS. Recomendado para proteção contra surtos.", status: "Atenção" });
  }

  if (validations.length === 0) {
    validations.push({ id: "all-ok", message: "Quadro validado com sucesso.", status: "OK" });
  }

  return validations;
}

export function generateMemorialHtml(calculation: SizingCalculation) {
    return ""; 
}
