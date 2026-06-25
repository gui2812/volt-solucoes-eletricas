export type ComponentKind =
  | "breaker1"
  | "breaker2"
  | "breaker3"
  | "mainBreaker"
  | "dr2"
  | "dr4"
  | "dps"
  | "neutralBus"
  | "groundBus"
  | "phaseBus"
  | "combBus"
  | "terminal"
  | "dinRail"
  | "duct"
  | "label"
  | "load";

export type WireKind = "fase" | "neutro" | "terra" | "retorno";
export type ValidationLevel = "OK" | "Atenção" | "Erro";

export interface ConnectorPoint {
  id: string;
  label: string;
  kind: "in" | "out" | "bus" | "load";
  x: number;
  y: number;
  allowed: WireKind[];
}

export interface QdcComponent {
  id: string;
  kind: ComponentKind;
  category: string;
  name: string;
  label: string;
  x: number;
  y: number;
  z: number;
  widthModules: number;
  poles: number;
  ratingA?: number;
  curve?: "B" | "C" | "D";
  sensitivityMA?: number;
  voltage?: 127 | 220 | 380;
  powerW?: number;
  cableMm2?: number;
  loadType?: string;
  color?: string;
  connectors: ConnectorPoint[];
  createdAt: string;
}

export interface WireEndpoint {
  componentId: string;
  connectorId: string;
}

export interface QdcWire {
  id: string;
  kind: WireKind;
  color: string;
  gaugeMm2: number;
  from: WireEndpoint;
  to: WireEndpoint;
  createdAt: string;
}

export interface CatalogItem {
  kind: ComponentKind;
  category: "Proteção" | "Barramentos" | "Circuitos" | "Infraestrutura";
  name: string;
  description: string;
  widthModules: number;
  poles: number;
  defaultRatingA?: number;
  defaultVoltage?: 127 | 220 | 380;
  defaultPowerW?: number;
  icon: string;
}

export interface ValidationAlert {
  id: string;
  level: ValidationLevel;
  title: string;
  description: string;
  componentId?: string;
  wireId?: string;
}

export interface QdcProjectSnapshot {
  version: string;
  projectName: string;
  components: QdcComponent[];
  wires: QdcWire[];
  exportedAt: string;
}
