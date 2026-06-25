export type InstallationType = "Residencial" | "Comercial" | "Industrial";
export type ElectricalSystem = "Monofásico" | "Bifásico" | "Trifásico";
export type VoltageOption = "127V" | "220V" | "380V";
export type CircuitType = "Iluminação" | "TUG" | "TUE" | "Chuveiro" | "Ar-condicionado" | "Motor" | "Outro";
export type CableMaterial = "Cobre" | "Alumínio";
export type InsulationType = "PVC" | "EPR" | "XLPE";
export type CircuitStatus = "OK" | "Atenção" | "Erro";

export type ProjectData = {
  client: string;
  projectName: string;
  address: string;
  installationType: InstallationType;
  electricalSystem: ElectricalSystem;
  voltage: VoltageOption;
  technicalResponsible: string;
  notes: string;
};

export type CircuitInput = {
  id: string;
  name: string;
  type: CircuitType;
  powerWatts: number;
  quantity: number;
  voltage: number;
  powerFactor: number;
  lengthMeters: number;
  installationMethod: string;
  ambientTemperature: number;
  groupedConductors: number;
  cableMaterial: CableMaterial;
  insulation: InsulationType;
};

export type CircuitResult = {
  circuitId: string;
  name: string;
  type: CircuitType;
  totalPowerWatts: number;
  calculatedCurrent: number;
  recommendedCableSection: number;
  recommendedBreaker: number;
  recommendedDr: string;
  recommendedDps: string;
  voltageDropPercent: number;
  status: CircuitStatus;
  warnings: string[];
};

export type MaterialItem = {
  id: string;
  material: string;
  specification: string;
  quantity: number;
  unit: string;
  observation: string;
};

export type SizingCalculation = {
  project: ProjectData;
  circuits: CircuitInput[];
  results: CircuitResult[];
  materials: MaterialItem[];
  generalStatus: CircuitStatus;
};

export type QdcProjectData = {
  name: string;
  client: string;
  location: string;
  boardType: "Embutir" | "Sobrepor";
  modules: number;
  electricalSystem: ElectricalSystem;
  voltage: VoltageOption;
  notes: string;
};

export type QdcComponentKind =
  | "main-breaker"
  | "breaker-1p"
  | "breaker-2p"
  | "breaker-3p"
  | "dr"
  | "dps"
  | "neutral-bar"
  | "ground-bar"
  | "din-rail"
  | "label"
  | "wire-phase"
  | "wire-neutral"
  | "wire-ground";

export type QdcComponentDefinition = {
  kind: QdcComponentKind;
  name: string;
  icon: string;
  modules: number;
  nominalCurrent: string;
  description: string;
};

export type QdcPlacedComponent = {
  id: string;
  kind: QdcComponentKind;
  name: string;
  label: string;
  modules: number;
  nominalCurrent: string;
  position: number;
};

export type QdcWireConnection = {
  id: string;
  from: string;
  to: string;
  wireType: "Fase" | "Neutro" | "Terra" | "Retorno";
  gauge: string;
};

export type QdcValidation = {
  status: CircuitStatus;
  title: string;
  description: string;
};
