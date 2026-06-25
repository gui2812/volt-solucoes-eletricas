import type { CatalogItem } from "@/types";

export const componentCatalog: CatalogItem[] = [
  { category: "Proteção", kind: "mainBreaker", name: "Disjuntor geral", description: "Proteção principal do QDC", widthModules: 2, poles: 2, defaultRatingA: 63, icon: "DG" },
  { category: "Proteção", kind: "breaker1", name: "Disjuntor monopolar", description: "Circuito fase + neutro", widthModules: 1, poles: 1, defaultRatingA: 10, icon: "1P" },
  { category: "Proteção", kind: "breaker2", name: "Disjuntor bipolar", description: "Circuito 220 V bifásico", widthModules: 2, poles: 2, defaultRatingA: 32, icon: "2P" },
  { category: "Proteção", kind: "breaker3", name: "Disjuntor tripolar", description: "Circuito trifásico", widthModules: 3, poles: 3, defaultRatingA: 40, icon: "3P" },
  { category: "Proteção", kind: "dr2", name: "DR bipolar", description: "Proteção diferencial residual", widthModules: 2, poles: 2, defaultRatingA: 63, icon: "DR" },
  { category: "Proteção", kind: "dr4", name: "DR tetrapolar", description: "DR para sistema trifásico", widthModules: 4, poles: 4, defaultRatingA: 63, icon: "DR4" },
  { category: "Proteção", kind: "dps", name: "DPS", description: "Proteção contra surtos", widthModules: 1, poles: 1, defaultRatingA: 20, icon: "DPS" },
  { category: "Barramentos", kind: "neutralBus", name: "Barramento de neutro", description: "Conexões de neutro", widthModules: 5, poles: 0, icon: "N" },
  { category: "Barramentos", kind: "groundBus", name: "Barramento de terra", description: "Conexões PE / terra", widthModules: 5, poles: 0, icon: "PE" },
  { category: "Barramentos", kind: "phaseBus", name: "Barramento de fase", description: "Distribuição de fase", widthModules: 5, poles: 0, icon: "F" },
  { category: "Barramentos", kind: "combBus", name: "Barramento pente", description: "Alimentação dos disjuntores", widthModules: 6, poles: 0, icon: "P" },
  { category: "Circuitos", kind: "load", name: "Chuveiro", description: "Carga dedicada", widthModules: 2, poles: 2, defaultVoltage: 220, defaultPowerW: 6800, icon: "CH" },
  { category: "Circuitos", kind: "load", name: "Tomadas gerais", description: "TUG", widthModules: 1, poles: 1, defaultVoltage: 127, defaultPowerW: 1200, icon: "TUG" },
  { category: "Circuitos", kind: "load", name: "Iluminação", description: "Circuito de iluminação", widthModules: 1, poles: 1, defaultVoltage: 127, defaultPowerW: 600, icon: "LUX" },
  { category: "Circuitos", kind: "load", name: "Ar-condicionado", description: "Carga dedicada", widthModules: 2, poles: 2, defaultVoltage: 220, defaultPowerW: 2200, icon: "AR" },
  { category: "Circuitos", kind: "load", name: "Geladeira", description: "Circuito de tomada dedicado", widthModules: 1, poles: 1, defaultVoltage: 127, defaultPowerW: 700, icon: "GEL" },
  { category: "Circuitos", kind: "load", name: "Máquina de lavar", description: "Circuito dedicado", widthModules: 1, poles: 1, defaultVoltage: 127, defaultPowerW: 1500, icon: "ML" },
  { category: "Circuitos", kind: "load", name: "Forno elétrico", description: "Circuito dedicado", widthModules: 2, poles: 2, defaultVoltage: 220, defaultPowerW: 3500, icon: "FOR" },
  { category: "Circuitos", kind: "load", name: "Micro-ondas", description: "Circuito dedicado", widthModules: 1, poles: 1, defaultVoltage: 127, defaultPowerW: 1500, icon: "MIC" },
  { category: "Infraestrutura", kind: "dinRail", name: "Trilho DIN", description: "Trilho adicional", widthModules: 12, poles: 0, icon: "DIN" },
  { category: "Infraestrutura", kind: "duct", name: "Canaleta", description: "Organização de condutores", widthModules: 12, poles: 0, icon: "CAN" },
  { category: "Infraestrutura", kind: "terminal", name: "Borne", description: "Ponto de conexão", widthModules: 1, poles: 0, icon: "BOR" },
  { category: "Infraestrutura", kind: "label", name: "Etiqueta", description: "Identificação visual", widthModules: 1, poles: 0, icon: "ETQ" }
];

export const catalogGroups = ["Proteção", "Barramentos", "Circuitos", "Infraestrutura"] as const;
