import type { CableMaterial, CircuitStatus, ElectricalSystem, InsulationType } from "@/types/electrical";

/**
 * Fórmula base de corrente:
 * Monofásico/Bifásico: I = P / (V × FP)
 * Trifásico: I = P / (√3 × V × FP)
 *
 * Observação: esta estrutura já fica preparada para evoluir com critérios completos da NBR 5410.
 */
export function calculateCurrent(
  totalPowerWatts: number,
  voltage: number,
  powerFactor = 1,
  system: ElectricalSystem = "Monofásico"
) {
  const safeVoltage = Math.max(voltage, 1);
  const safePowerFactor = Math.max(powerFactor, 0.1);

  if (system === "Trifásico") {
    return totalPowerWatts / (Math.sqrt(3) * safeVoltage * safePowerFactor);
  }

  return totalPowerWatts / (safeVoltage * safePowerFactor);
}

const breakerRatings = [6, 10, 16, 20, 25, 32, 40, 50, 63, 70, 80, 100, 125];

/**
 * Seleciona o disjuntor comercial imediatamente acima da corrente calculada.
 * Critérios de seletividade, curva e fabricante devem ser refinados na etapa NBR 5410.
 */
export function recommendBreaker(current: number) {
  return breakerRatings.find((rating) => rating >= current * 1.15) ?? breakerRatings[breakerRatings.length - 1];
}

const copperCapacity: Record<number, number> = {
  1.5: 15.5,
  2.5: 21,
  4: 28,
  6: 36,
  10: 50,
  16: 68,
  25: 89,
  35: 111,
  50: 134,
  70: 171,
  95: 207
};

const aluminumCapacity: Record<number, number> = {
  2.5: 16,
  4: 22,
  6: 28,
  10: 39,
  16: 53,
  25: 70,
  35: 86,
  50: 104,
  70: 133,
  95: 161
};

export function temperatureCorrection(ambientTemperature: number, insulation: InsulationType) {
  if (ambientTemperature <= 30) return 1;

  if (insulation === "PVC") {
    if (ambientTemperature <= 35) return 0.94;
    if (ambientTemperature <= 40) return 0.87;
    if (ambientTemperature <= 45) return 0.79;
    return 0.71;
  }

  if (ambientTemperature <= 35) return 0.96;
  if (ambientTemperature <= 40) return 0.91;
  if (ambientTemperature <= 45) return 0.87;
  return 0.82;
}

export function groupingCorrection(groupedConductors: number) {
  if (groupedConductors <= 3) return 1;
  if (groupedConductors <= 6) return 0.8;
  if (groupedConductors <= 9) return 0.7;
  return 0.6;
}

/**
 * A corrente corrigida considera agrupamento e temperatura:
 * Ic = I / (F temperatura × F agrupamento)
 */
export function recommendCableSection(
  current: number,
  material: CableMaterial,
  insulation: InsulationType,
  ambientTemperature: number,
  groupedConductors: number
) {
  const table = material === "Cobre" ? copperCapacity : aluminumCapacity;
  const correctedCurrent = current / (temperatureCorrection(ambientTemperature, insulation) * groupingCorrection(groupedConductors));

  const section = Object.entries(table).find(([, capacity]) => capacity >= correctedCurrent)?.[0];
  return section ? Number(section) : Number(Object.keys(table).at(-1));
}

/**
 * Queda de tensão simplificada:
 * ΔV% = (2 × ρ × L × I × 100) / (S × V)
 * ρ cobre ≈ 0,0175 Ω.mm²/m
 * ρ alumínio ≈ 0,0282 Ω.mm²/m
 *
 * Para trifásico, uma futura versão pode aplicar √3 no lugar do fator 2.
 */
export function calculateVoltageDropPercent(
  current: number,
  lengthMeters: number,
  cableSection: number,
  voltage: number,
  material: CableMaterial
) {
  const resistivity = material === "Cobre" ? 0.0175 : 0.0282;
  const safeSection = Math.max(cableSection, 0.1);
  const safeVoltage = Math.max(voltage, 1);
  return (2 * resistivity * lengthMeters * current * 100) / (safeSection * safeVoltage);
}

export function recommendDr(circuitType: string, current: number) {
  const needs30mA = ["TUG", "Chuveiro", "Ar-condicionado", "TUE"].includes(circuitType);
  const rating = current <= 25 ? 40 : current <= 40 ? 63 : 80;
  return needs30mA ? `DR ${rating}A / 30mA` : "Avaliar necessidade";
}

export function recommendDps(voltage: number) {
  if (voltage <= 127) return "DPS Classe II 175V";
  if (voltage <= 220) return "DPS Classe II 275V";
  return "DPS Classe II 460V";
}

export function validateCircuit(current: number, breaker: number, voltageDropPercent: number, cableSection: number): {
  status: CircuitStatus;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (current > breaker) warnings.push("Corrente calculada acima do disjuntor recomendado.");
  if (voltageDropPercent > 4) warnings.push("Queda de tensão acima de 4%.");
  if (cableSection >= 95) warnings.push("Circuito com corrente elevada. Revisar projeto.");
  if (voltageDropPercent > 7) warnings.push("Queda de tensão crítica.");

  if (warnings.some((warning) => warning.includes("crítica") || warning.includes("acima do disjuntor"))) {
    return { status: "Erro", warnings };
  }

  if (warnings.length > 0) {
    return { status: "Atenção", warnings };
  }

  return { status: "OK", warnings: ["Circuito dentro dos critérios iniciais."] };
}
