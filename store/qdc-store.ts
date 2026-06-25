"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { componentCatalog } from "@/data/catalog";
import { defaultWireColor } from "@/lib/electrical";
import type { CatalogItem, ComponentKind, ConnectorPoint, QdcComponent, QdcProjectSnapshot, QdcWire, WireEndpoint, WireKind } from "@/types";

type WireStart = WireEndpoint | null;

interface QdcState {
  projectName: string;
  components: QdcComponent[];
  wires: QdcWire[];
  selectedComponentId: string | null;
  selectedWireId: string | null;
  selectedWireKind: WireKind;
  selectedWireColor: string;
  selectedWireGauge: number;
  wireToolEnabled: boolean;
  wireStart: WireStart;
  setProjectName: (name: string) => void;
  addComponent: (item: CatalogItem, x?: number, y?: number) => void;
  updateComponent: (id: string, patch: Partial<QdcComponent>) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  removeComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  selectWire: (id: string | null) => void;
  setWireTool: (enabled: boolean) => void;
  setWireSettings: (kind: WireKind, color?: string, gauge?: number) => void;
  clickConnector: (endpoint: WireEndpoint) => void;
  removeWire: (id: string) => void;
  clearProject: () => void;
  importProject: (snapshot: QdcProjectSnapshot) => void;
  snapshot: () => QdcProjectSnapshot;
}

function createConnectors(kind: ComponentKind): ConnectorPoint[] {
  const common = {
    fase: ["fase"],
    neutral: ["neutro"],
    ground: ["terra"],
    all: ["fase", "neutro", "terra", "retorno"] as WireKind[]
  } as const;

  if (kind === "neutralBus") return Array.from({ length: 8 }, (_, i) => ({ id: `n-${i}`, label: `N${i + 1}`, kind: "bus", x: -0.42 + i * 0.12, y: 0, allowed: ["neutro"] as WireKind[] }));
  if (kind === "groundBus") return Array.from({ length: 8 }, (_, i) => ({ id: `pe-${i}`, label: `PE${i + 1}`, kind: "bus", x: -0.42 + i * 0.12, y: 0, allowed: ["terra"] as WireKind[] }));
  if (kind === "phaseBus" || kind === "combBus") return Array.from({ length: 8 }, (_, i) => ({ id: `f-${i}`, label: `F${i + 1}`, kind: "bus", x: -0.42 + i * 0.12, y: 0, allowed: ["fase"] as WireKind[] }));
  if (kind === "load") return [
    { id: "load-f", label: "F", kind: "load", x: -0.25, y: -0.28, allowed: ["fase"] },
    { id: "load-n", label: "N", kind: "load", x: 0, y: -0.28, allowed: ["neutro"] },
    { id: "load-pe", label: "PE", kind: "load", x: 0.25, y: -0.28, allowed: ["terra"] }
  ];
  if (kind === "dps") return [
    { id: "in-f", label: "F", kind: "in", x: -0.22, y: 0.32, allowed: ["fase"] },
    { id: "out-pe", label: "PE", kind: "out", x: 0.22, y: -0.32, allowed: ["terra"] }
  ];
  if (kind === "dr2" || kind === "dr4") return [
    { id: "in-f", label: "F in", kind: "in", x: -0.24, y: 0.34, allowed: ["fase"] },
    { id: "in-n", label: "N in", kind: "in", x: 0.24, y: 0.34, allowed: ["neutro"] },
    { id: "out-f", label: "F out", kind: "out", x: -0.24, y: -0.34, allowed: ["fase"] },
    { id: "out-n", label: "N out", kind: "out", x: 0.24, y: -0.34, allowed: ["neutro"] }
  ];
  if (kind === "dinRail" || kind === "duct" || kind === "label") return [];
  return [
    { id: "in-f", label: "Entrada", kind: "in", x: 0, y: 0.34, allowed: ["fase"] },
    { id: "out-f", label: "Saída", kind: "out", x: 0, y: -0.34, allowed: ["fase"] }
  ];
}

function createComponent(item: CatalogItem, x = 0, y = 0): QdcComponent {
  return {
    id: crypto.randomUUID(),
    kind: item.kind,
    category: item.category,
    name: item.name,
    label: item.name,
    x,
    y,
    z: 0,
    widthModules: item.widthModules,
    poles: item.poles,
    ratingA: item.defaultRatingA,
    curve: "C",
    sensitivityMA: item.kind === "dr2" || item.kind === "dr4" ? 30 : undefined,
    voltage: item.defaultVoltage,
    powerW: item.defaultPowerW,
    cableMm2: item.kind === "load" ? 2.5 : undefined,
    loadType: item.category === "Circuitos" ? item.name : undefined,
    color: item.category === "Proteção" ? "#f7c400" : item.category === "Barramentos" ? "#38bdf8" : "#94a3b8",
    connectors: createConnectors(item.kind),
    createdAt: new Date().toISOString()
  };
}

export const useQdcStore = create<QdcState>()(
  persist(
    (set, get) => ({
      projectName: "QDC residencial Volt",
      components: [],
      wires: [],
      selectedComponentId: null,
      selectedWireId: null,
      selectedWireKind: "fase",
      selectedWireColor: defaultWireColor("fase"),
      selectedWireGauge: 2.5,
      wireToolEnabled: false,
      wireStart: null,
      setProjectName: (name) => set({ projectName: name }),
      addComponent: (item, x = 0, y = 0) => {
        const component = createComponent(item, x, y);
        set((state) => ({ components: [...state.components, component], selectedComponentId: component.id, selectedWireId: null }));
      },
      updateComponent: (id, patch) => set((state) => ({ components: state.components.map((component) => component.id === id ? { ...component, ...patch } : component) })),
      moveComponent: (id, x, y) => set((state) => ({ components: state.components.map((component) => component.id === id ? { ...component, x, y } : component) })),
      removeComponent: (id) => set((state) => ({ components: state.components.filter((component) => component.id !== id), wires: state.wires.filter((wire) => wire.from.componentId !== id && wire.to.componentId !== id), selectedComponentId: null })),
      selectComponent: (id) => set({ selectedComponentId: id, selectedWireId: null }),
      selectWire: (id) => set({ selectedWireId: id, selectedComponentId: null }),
      setWireTool: (enabled) => set({ wireToolEnabled: enabled, wireStart: null }),
      setWireSettings: (kind, color, gauge) => set({ selectedWireKind: kind, selectedWireColor: color ?? defaultWireColor(kind), selectedWireGauge: gauge ?? get().selectedWireGauge }),
      clickConnector: (endpoint) => {
        const state = get();
        if (!state.wireToolEnabled) return;
        if (!state.wireStart) {
          set({ wireStart: endpoint });
          return;
        }
        if (state.wireStart.componentId === endpoint.componentId && state.wireStart.connectorId === endpoint.connectorId) {
          set({ wireStart: null });
          return;
        }
        const wire: QdcWire = {
          id: crypto.randomUUID(),
          kind: state.selectedWireKind,
          color: state.selectedWireColor,
          gaugeMm2: state.selectedWireGauge,
          from: state.wireStart,
          to: endpoint,
          createdAt: new Date().toISOString()
        };
        set((prev) => ({ wires: [...prev.wires, wire], wireStart: null, selectedWireId: wire.id }));
      },
      removeWire: (id) => set((state) => ({ wires: state.wires.filter((wire) => wire.id !== id), selectedWireId: null })),
      clearProject: () => set({ components: [], wires: [], selectedComponentId: null, selectedWireId: null, wireStart: null }),
      importProject: (snapshot) => set({ projectName: snapshot.projectName, components: snapshot.components, wires: snapshot.wires, selectedComponentId: null, selectedWireId: null, wireStart: null }),
      snapshot: () => ({ version: "volt-next-v1", projectName: get().projectName, components: get().components, wires: get().wires, exportedAt: new Date().toISOString() })
    }),
    { name: "volt-qdc-profissional" }
  )
);

export function findCatalogItem(kindOrName: string) {
  return componentCatalog.find((item) => item.kind === kindOrName || item.name === kindOrName);
}
