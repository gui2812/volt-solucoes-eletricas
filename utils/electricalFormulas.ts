import type {
  CableMaterial,
  CircuitPhaseConfiguration,
  CircuitStatus,
  CircuitType,
  ElectricalSystem,
  InsulationType
} from "@/types/electrical";

export const BREAKER_RATINGS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 70, 80, 100, 125] as const;

const COPPER_CAPACITY: Record<number, number> = {
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

const ALUMINUM_CAPACITY: Record<number, number> = {
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

export function calculateCurrent(
  totalPowerWatts: number,
  voltage: number,
  powerFactor = 1,
  phaseConfiguration: CircuitPhaseConfiguration = "F-N"
) {
  const safeVoltage = Math.max(Number(voltage) || 0, 1);
  const safePowerFactor = Math.min(Math.max(Number(powerFactor) || 1, 0.1), 1);
  const divisor = phaseConfiguration === "3F"
    ? Math.sqrt(3) * safeVoltage * safePowerFactor
    : safeVoltage * safePowerFactor;

  return Math.max(Number(totalPowerWatts) || 0, 0) / divisor;
}

export function inferPhaseConfiguration(
  voltage: number,
  system: ElectricalSystem,
  preferred?: CircuitPhaseConfiguration
): CircuitPhaseConfiguration {
  if (preferred) return preferred;
  if (system === "Monofásico") return "F-N";
  if (system === "Trifásico" && voltage >= 360) return "3F";
  if (voltage >= 200) return "F-F";
  return "F-N";
}

export function breakerPolesFor(
  phaseConfiguration: CircuitPhaseConfiguration,
  neutralRequired = false
): 1 | 2 | 3 | 4 {
  if (phaseConfiguration === "3F") return neutralRequired ? 4 : 3;
  return phaseConfiguration === "F-F" ? 2 : 1;
}

export function breakerCurveFor(type: CircuitType): "B" | "C" | "D" {
  if (type === "Motor") return "D";
  if (type === "Iluminação") return "B";
  return "C";
}

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

export function correctedCableCapacity(
  section: number,
  material: CableMaterial,
  insulation: InsulationType,
  ambientTemperature: number,
  groupedConductors: number
) {
  const table = material === "Cobre" ? COPPER_CAPACITY : ALUMINUM_CAPACITY;
  const baseCapacity = table[section] ?? 0;
  return baseCapacity
    * temperatureCorrection(ambientTemperature, insulation)
    * groupingCorrection(groupedConductors);
}

function minimumSection(type: CircuitType, material: CableMaterial) {
  if (material === "Alumínio") return type === "Iluminação" ? 2.5 : 4;
  return type === "Iluminação" ? 1.5 : 2.5;
}

/**
 * Seleciona cabo e disjuntor juntos. A combinação só é aceita quando
 * Ib ≤ In ≤ Iz dentro da tabela preliminar do sistema.
 */
export function recommendCableAndBreaker(options: {
  current: number;
  type: CircuitType;
  material: CableMaterial;
  insulation: InsulationType;
  ambientTemperature: number;
  groupedConductors: number;
}) {
  const table = options.material === "Cobre" ? COPPER_CAPACITY : ALUMINUM_CAPACITY;
  const sections = Object.keys(table).map(Number).sort((a, b) => a - b);
  const minSection = minimumSection(options.type, options.material);
  const designCurrent = Math.max(options.current, 0);

  for (const section of sections.filter((value) => value >= minSection)) {
    const capacity = correctedCableCapacity(
      section,
      options.material,
      options.insulation,
      options.ambientTemperature,
      options.groupedConductors
    );
    const breaker = BREAKER_RATINGS.find((rating) => rating >= designCurrent && rating <= capacity);
    if (breaker) return { section, breaker, correctedCapacity: capacity, supported: true };
  }

  const section = sections.at(-1) ?? minSection;
  const correctedCapacity = correctedCableCapacity(
    section,
    options.material,
    options.insulation,
    options.ambientTemperature,
    options.groupedConductors
  );
  const breaker = BREAKER_RATINGS.filter((rating) => rating <= correctedCapacity).at(-1) ?? BREAKER_RATINGS[0];
  return { section, breaker, correctedCapacity, supported: false };
}

export function calculateVoltageDropPercent(
  current: number,
  lengthMeters: number,
  cableSection: number,
  voltage: number,
  material: CableMaterial,
  phaseConfiguration: CircuitPhaseConfiguration
) {
  const resistivity = material === "Cobre" ? 0.0175 : 0.0282;
  const safeSection = Math.max(cableSection, 0.1);
  const safeVoltage = Math.max(voltage, 1);
  const routeFactor = phaseConfiguration === "3F" ? Math.sqrt(3) : 2;
  return (routeFactor * resistivity * Math.max(lengthMeters, 0) * current * 100) / (safeSection * safeVoltage);
}

export function recommendDr(circuitType: CircuitType, breaker: number, poles: number) {
  const needs30mA = ["TUG", "Chuveiro", "Ar-condicionado", "TUE"].includes(circuitType);
  const rating = [25, 40, 63, 80, 100, 125].find((value) => value >= breaker) ?? 125;
  return needs30mA
    ? `DR ${poles > 2 ? 4 : 2}P ${rating}A / 30mA (confirmar agrupamento)`
    : "Avaliar DR conforme circuito e local";
}

export function recommendDps(voltage: number) {
  if (voltage <= 127) return "DPS Classe II 175V (Uc a confirmar)";
  if (voltage <= 240) return "DPS Classe II 275V (Uc a confirmar)";
  return "DPS Classe II 460V (Uc a confirmar)";
}

export function validateCircuit(options: {
  current: number;
  breaker: number;
  correctedCapacity: number;
  voltageDropPercent: number;
  supported: boolean;
  lengthMeters: number;
  phaseConfiguration: CircuitPhaseConfiguration;
}) : { status: CircuitStatus; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!options.supported) errors.push("A tabela preliminar não encontrou combinação de cabo e disjuntor para esta corrente.");
  if (options.current > options.breaker) errors.push("Ib é maior que In: o disjuntor ficou abaixo da corrente de projeto.");
  if (options.breaker > options.correctedCapacity) errors.push("In é maior que Iz: o disjuntor não protege o condutor nas condições informadas.");
  if (options.voltageDropPercent > 7) errors.push("Queda de tensão calculada acima de 7%.");
  else if (options.voltageDropPercent > 4) warnings.push("Queda de tensão acima do limite preliminar de 4% adotado pela Volt.");
  if (options.lengthMeters <= 0) warnings.push("Comprimento do circuito não informado; queda de tensão e materiais precisam ser revisados.");
  if (options.phaseConfiguration === "3F") warnings.push("Confirmar sequência de fases, carga equilibrada e necessidade de neutro.");

  warnings.push("Confirmar corrente de curto-circuito presumida e capacidade de interrupção do disjuntor no local.");

  if (errors.length) return { status: "Erro", warnings: [...errors, ...warnings] };
  if (warnings.length) return { status: "Atenção", warnings };
  return { status: "OK", warnings: ["Combinação preliminar Ib ≤ In ≤ Iz atendida."] };
}
