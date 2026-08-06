export type InstallationType = "Residencial" | "Comercial" | "Industrial";
export type ElectricalSystem = "Monofásico" | "Bifásico" | "Trifásico";
export type VoltageOption = "127V" | "220V" | "380V" | "127/220V" | "220/380V";
export type CircuitType = "Iluminação" | "TUG" | "TUE" | "Chuveiro" | "Ar-condicionado" | "Motor" | "Outro";
export type CableMaterial = "Cobre" | "Alumínio";
export type InsulationType = "PVC" | "EPR" | "XLPE";
export type CircuitStatus = "OK" | "Atenção" | "Erro";
export type CircuitPhaseConfiguration = "F-N" | "F-F" | "3F";
export type PhaseAssignment = "F1" | "F2" | "F3" | "F1-F2" | "F2-F3" | "F1-F3" | "F1-F2-F3";
export type RoomType = "SECO" | "MOLHADO";
export type RoomCategory =
  | "Sala"
  | "Quarto"
  | "Cozinha"
  | "Banheiro"
  | "Lavanderia"
  | "Corredor"
  | "Varanda"
  | "Garagem"
  | "Escritório"
  | "Loja"
  | "Outro";

export type ProjectData = {
  client: string;
  projectName: string;
  address: string;
  installationType: InstallationType;
  electricalSystem: ElectricalSystem;
  voltage: VoltageOption;
  technicalResponsible: string;
  notes: string;
  /** Premissa editável usada apenas no pré-dimensionamento do alimentador. */
  demandFactor: number;
};

export type ElectricalEquipment = {
  id: string;
  name: string;
  powerWatts: number;
  voltage: number;
  powerFactor: number;
  lengthMeters: number;
  phaseConfiguration: CircuitPhaseConfiguration;
  circuitType: CircuitType;
};

export type ElectricalRoom = {
  id: string;
  name: string;
  category: RoomCategory;
  area: number;
  perimeter: number;
  type: RoomType;
  equipments: ElectricalEquipment[];
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
  phaseConfiguration?: CircuitPhaseConfiguration;
  neutralRequired?: boolean;
};

export type CircuitResult = {
  circuitId: string;
  name: string;
  type: CircuitType;
  totalPowerWatts: number;
  calculatedCurrent: number;
  recommendedCableSection: number;
  correctedCableCapacity: number;
  recommendedBreaker: number;
  breakerPoles: 1 | 2 | 3 | 4;
  breakerCurve: "B" | "C" | "D";
  recommendedDr: string;
  recommendedDps: string;
  voltageDropPercent: number;
  phaseConfiguration: CircuitPhaseConfiguration;
  phaseAssignment: PhaseAssignment;
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
  unitCost?: number;     
  totalCost?: number;    
  salePrice?: number;    
};

export type SizingSummary = {
  installedPowerWatts: number;
  apparentPowerVa: number;
  demandFactor: number;
  demandPowerWatts: number;
  demandCurrent: number;
  preliminaryMainBreaker: number;
  phaseCurrents: Record<"F1" | "F2" | "F3", number>;
  phaseImbalancePercent: number;
  boardModules: number;
  assumptions: string[];
  limitations: string[];
};

export type SizingCalculation = {
  project: ProjectData;
  circuits: CircuitInput[];
  results: CircuitResult[];
  materials: MaterialItem[];
  generalStatus: CircuitStatus;
  summary: SizingSummary;
  ruleSetVersion: string;
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
  | "main-breaker" | "breaker-1p" | "breaker-2p" | "breaker-3p" | "dr" | "dps" | "neutral-bar" | "ground-bar" | "din-rail" | "label";

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
