"use client";

import { AppShell } from "@/components/layout/app-shell";
import type {
  CircuitInput,
  CircuitResult,
  MaterialItem,
  ProjectData,
  QdcComponentDefinition,
  QdcPlacedComponent,
  QdcProjectData,
  QdcWireConnection,
  VoltageOption
} from "@/types/electrical";
import {
  calculateSizing,
  generateMemorialHtml,
  validateQdcProject
} from "@/services/electricalSizing";
import {
  AlertTriangle,
  ArrowUpRight,
  Cable,
  CheckCircle2,
  Download,
  FileText,
  Gauge,
  GripVertical,
  Layers3,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Trash2,
  Zap
} from "lucide-react";
import type { DragEvent } from "react";
import { useEffect, useMemo, useState } from "react";

const projectSeed: ProjectData = {
  client: "",
  projectName: "Dimensionamento elétrico Volt",
  address: "",
  installationType: "Residencial",
  electricalSystem: "Bifásico",
  voltage: "220V",
  technicalResponsible: "Guilherme Santana",
  notes: ""
};

const circuitSeed: CircuitInput = {
  id: "CIR-001",
  name: "Iluminação",
  type: "Iluminação",
  powerWatts: 800,
  quantity: 1,
  voltage: 220,
  powerFactor: 1,
  lengthMeters: 20,
  installationMethod: "Eletroduto embutido em alvenaria",
  ambientTemperature: 30,
  groupedConductors: 3,
  cableMaterial: "Cobre",
  insulation: "PVC"
};

const qdcSeed: QdcProjectData = {
  name: "QDC residencial Volt",
  client: "",
  location: "",
  boardType: "Embutir",
  modules: 24,
  electricalSystem: "Bifásico",
  voltage: "220V",
  notes: ""
};

const componentLibrary: QdcComponentDefinition[] = [
  { kind: "main-breaker", name: "Disjuntor geral", icon: "DG", modules: 2, nominalCurrent: "63A", description: "Proteção principal do quadro." },
  { kind: "breaker-1p", name: "Disjuntor monopolar", icon: "1P", modules: 1, nominalCurrent: "16A", description: "Circuito fase + neutro." },
  { kind: "breaker-2p", name: "Disjuntor bipolar", icon: "2P", modules: 2, nominalCurrent: "32A", description: "Circuito 220V bifásico." },
  { kind: "breaker-3p", name: "Disjuntor tripolar", icon: "3P", modules: 3, nominalCurrent: "40A", description: "Circuito trifásico." },
  { kind: "dr", name: "DR", icon: "DR", modules: 2, nominalCurrent: "63A / 30mA", description: "Proteção diferencial residual." },
  { kind: "dps", name: "DPS", icon: "DPS", modules: 1, nominalCurrent: "275V", description: "Proteção contra surtos." },
  { kind: "neutral-bar", name: "Barramento de neutro", icon: "N", modules: 1, nominalCurrent: "Neutro", description: "Conexões de neutro." },
  { kind: "ground-bar", name: "Barramento de terra", icon: "T", modules: 1, nominalCurrent: "Terra", description: "Conexões de aterramento." },
  { kind: "din-rail", name: "Trilho DIN", icon: "DIN", modules: 0, nominalCurrent: "-", description: "Base de fixação dos componentes." },
  { kind: "label", name: "Etiqueta", icon: "ET", modules: 0, nominalCurrent: "-", description: "Identificação visual do circuito." },
  { kind: "wire-phase", name: "Fio fase", icon: "F", modules: 0, nominalCurrent: "2,5mm²", description: "Ligação de fase." },
  { kind: "wire-neutral", name: "Fio neutro", icon: "N", modules: 0, nominalCurrent: "2,5mm²", description: "Ligação de neutro." },
  { kind: "wire-ground", name: "Fio terra", icon: "PE", modules: 0, nominalCurrent: "2,5mm²", description: "Ligação de terra." }
];

function currency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusClass(status: string) {
  if (status === "OK") return "bg-volt-ok/15 text-volt-ok border-volt-ok/20";
  if (status === "Erro") return "bg-red-500/15 text-red-300 border-red-500/20";
  return "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25";
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[.12em] ${className}`}>{children}</span>;
}

function NumberInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold outline-none focus:border-volt-yellow/40"
    />
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold outline-none focus:border-volt-yellow/40 placeholder:text-zinc-700"
    />
  );
}

function FieldBox({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[.035] p-4 ${full ? "md:col-span-2" : ""}`}>
      <label className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{label}</label>
      {children}
    </div>
  );
}

export default function SistemasPage() {
  const [activeTab, setActiveTab] = useState<"dimensionamento" | "qdc">("dimensionamento");
  const [project, setProject] = useState<ProjectData>(projectSeed);
  const [circuits, setCircuits] = useState<CircuitInput[]>([circuitSeed]);
  const [circuitDraft, setCircuitDraft] = useState<CircuitInput>({ ...circuitSeed, id: "CIR-002", name: "Tomadas" });
  const [showProjectForm, setShowProjectForm] = useState(true);
  const [qdcProject, setQdcProject] = useState<QdcProjectData>(qdcSeed);
  const [placedComponents, setPlacedComponents] = useState<QdcPlacedComponent[]>([]);
  const [selectedComponentId, setSelectedComponentId] = useState<string>("");
  const [connections, setConnections] = useState<QdcWireConnection[]>([]);
  const [wireDraft, setWireDraft] = useState({ from: "", to: "", wireType: "Fase" as QdcWireConnection["wireType"], gauge: "2.5 mm²" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("volt_sistemas_tecnicos_v1");
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.project) setProject(parsed.project);
      if (Array.isArray(parsed.circuits)) setCircuits(parsed.circuits);
      if (parsed.qdcProject) setQdcProject(parsed.qdcProject);
      if (Array.isArray(parsed.placedComponents)) setPlacedComponents(parsed.placedComponents);
      if (Array.isArray(parsed.connections)) setConnections(parsed.connections);
    } catch {
      // Mantém dados iniciais se o storage estiver inválido.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "volt_sistemas_tecnicos_v1",
      JSON.stringify({ project, circuits, qdcProject, placedComponents, connections })
    );
  }, [project, circuits, qdcProject, placedComponents, connections]);

  const calculation = useMemo(() => calculateSizing(project, circuits), [project, circuits]);
  const validations = useMemo(() => validateQdcProject(qdcProject, placedComponents), [qdcProject, placedComponents]);
  const usedModules = placedComponents.reduce((sum, component) => sum + component.modules, 0);
  const selectedComponent = placedComponents.find((component) => component.id === selectedComponentId) ?? null;

  function updateProject<K extends keyof ProjectData>(key: K, value: ProjectData[K]) {
    setProject((current) => ({ ...current, [key]: value }));
  }

  function updateQdc<K extends keyof QdcProjectData>(key: K, value: QdcProjectData[K]) {
    setQdcProject((current) => ({ ...current, [key]: value }));
  }

  function updateDraft<K extends keyof CircuitInput>(key: K, value: CircuitInput[K]) {
    setCircuitDraft((current) => ({ ...current, [key]: value }));
  }

  function addCircuit() {
    if (!circuitDraft.name.trim()) {
      alert("Informe o nome do circuito.");
      return;
    }

    setCircuits((current) => [
      ...current,
      { ...circuitDraft, id: `CIR-${String(current.length + 1).padStart(3, "0")}` }
    ]);

    setCircuitDraft((current) => ({
      ...current,
      id: `CIR-${String(circuits.length + 2).padStart(3, "0")}`,
      name: "",
      powerWatts: 0,
      quantity: 1,
      lengthMeters: 0
    }));
  }

  function removeCircuit(id: string) {
    setCircuits((current) => current.filter((circuit) => circuit.id !== id));
  }

  function openMemorialPdf() {
    const html = generateMemorialHtml(calculation);
    const popup = window.open("", "_blank");
    if (!popup) {
      alert("Permita pop-ups para gerar o memorial em PDF.");
      return;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 500);
  }

  function createNewDimensioning() {
    setProject(projectSeed);
    setCircuits([]);
    setShowProjectForm(true);
    setActiveTab("dimensionamento");
  }

  function addComponent(kind: QdcComponentDefinition["kind"], customLabel?: string, customCurrent?: string) {
    const definition = componentLibrary.find((item) => item.kind === kind);
    if (!definition) return;

    const next: QdcPlacedComponent = {
      id: `QDC-${Date.now()}-${Math.round(Math.random() * 999)}`,
      kind: definition.kind,
      name: definition.name,
      label: customLabel || definition.name,
      modules: definition.modules,
      nominalCurrent: customCurrent || definition.nominalCurrent,
      position: placedComponents.length + 1
    };

    setPlacedComponents((current) => [...current, next]);
    setSelectedComponentId(next.id);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const kind = event.dataTransfer.getData("component-kind") as QdcComponentDefinition["kind"];
    addComponent(kind);
  }

  function duplicateComponent(component: QdcPlacedComponent) {
    const copy = {
      ...component,
      id: `QDC-${Date.now()}-${Math.round(Math.random() * 999)}`,
      label: `${component.label} cópia`,
      position: placedComponents.length + 1
    };

    setPlacedComponents((current) => [...current, copy]);
    setSelectedComponentId(copy.id);
  }

  function removeComponent(id: string) {
    setPlacedComponents((current) => current.filter((component) => component.id !== id));
    setConnections((current) => current.filter((connection) => connection.from !== id && connection.to !== id));
    if (selectedComponentId === id) setSelectedComponentId("");
  }

  function updateSelectedComponent(key: keyof QdcPlacedComponent, value: string | number) {
    if (!selectedComponent) return;
    setPlacedComponents((current) =>
      current.map((component) => component.id === selectedComponent.id ? { ...component, [key]: value } : component)
    );
  }

  function moveComponent(id: string, direction: -1 | 1) {
    setPlacedComponents((current) => {
      const index = current.findIndex((component) => component.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;

      const clone = [...current];
      const [item] = clone.splice(index, 1);
      clone.splice(nextIndex, 0, item);
      return clone.map((component, position) => ({ ...component, position: position + 1 }));
    });
  }

  function addWireConnection() {
    if (!wireDraft.from || !wireDraft.to || wireDraft.from === wireDraft.to) {
      alert("Selecione origem e destino diferentes.");
      return;
    }

    setConnections((current) => [
      ...current,
      {
        id: `WIRE-${Date.now()}`,
        from: wireDraft.from,
        to: wireDraft.to,
        wireType: wireDraft.wireType,
        gauge: wireDraft.gauge
      }
    ]);
  }

  function createNewQdc() {
    setQdcProject(qdcSeed);
    setPlacedComponents([]);
    setConnections([]);
    setSelectedComponentId("");
    setActiveTab("qdc");
  }

  function generateQdcFromSizing() {
    const nextComponents: QdcPlacedComponent[] = [];

    const push = (kind: QdcComponentDefinition["kind"], label?: string, current?: string) => {
      const definition = componentLibrary.find((item) => item.kind === kind);
      if (!definition) return;

      nextComponents.push({
        id: `QDC-${Date.now()}-${nextComponents.length}`,
        kind,
        name: definition.name,
        label: label || definition.name,
        modules: definition.modules,
        nominalCurrent: current || definition.nominalCurrent,
        position: nextComponents.length + 1
      });
    };

    push("main-breaker", "DG - Disjuntor geral", "63A");
    push("dps", "DPS - Proteção contra surtos");
    push("dr", "DR - Proteção geral");

    calculation.results.forEach((result, index) => {
      const kind = result.recommendedBreaker <= 20 ? "breaker-1p" : "breaker-2p";
      push(kind, `DJ ${index + 1} - ${result.name}`, `${result.recommendedBreaker}A`);
    });

    push("neutral-bar", "Barramento de neutro");
    push("ground-bar", "Barramento de terra");

    setPlacedComponents(nextComponents);
    setQdcProject((current) => ({
      ...current,
      name: `QDC - ${project.projectName || "Projeto Volt"}`,
      client: project.client,
      location: project.address,
      electricalSystem: project.electricalSystem,
      voltage: project.voltage,
      modules: Math.max(24, nextComponents.reduce((sum, component) => sum + component.modules, 0) + 6)
    }));
    setActiveTab("qdc");
  }

  const summary = {
    breakers: placedComponents.filter((component) => component.kind.includes("breaker")).length,
    dr: placedComponents.filter((component) => component.kind === "dr").length,
    dps: placedComponents.filter((component) => component.kind === "dps").length,
    usedModules,
    freeModules: Number(qdcProject.modules || 0) - usedModules,
    status: validations.some((item) => item.status === "Erro") ? "Erro" : validations.some((item) => item.status === "Atenção") ? "Atenção" : "OK"
  };

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111821] via-[#080c11] to-black p-5 shadow-soft md:p-7">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-volt-yellow/20 blur-[130px]" />
          <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Sistema</p>
              <h1 className="mt-2 text-4xl font-black leading-tight md:text-5xl">Sistemas Técnicos</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                Ferramentas inteligentes para projetos, dimensionamentos e quadros elétricos.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
              <button onClick={createNewDimensioning} className="btn-primary inline-flex items-center justify-center gap-2">
                <Plus size={17} /> Novo dimensionamento
              </button>
              <button onClick={createNewQdc} className="btn-ghost inline-flex items-center justify-center gap-2">
                <Layers3 size={17} /> Novo QDC
              </button>
              <button onClick={() => alert("Os projetos ficam salvos automaticamente neste navegador via localStorage.")} className="btn-ghost inline-flex items-center justify-center gap-2">
                <Save size={17} /> Projetos salvos
              </button>
            </div>
          </div>
        </section>

        <section className="volt-scroll flex gap-2 overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[.025] p-2">
          <button
            onClick={() => setActiveTab("dimensionamento")}
            className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition ${activeTab === "dimensionamento" ? "bg-volt-yellow text-black shadow-glow" : "text-zinc-400 hover:bg-white/10 hover:text-white"}`}
          >
            Dimensionamento Elétrico
          </button>
          <button
            onClick={() => setActiveTab("qdc")}
            className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition ${activeTab === "qdc" ? "bg-volt-yellow text-black shadow-glow" : "text-zinc-400 hover:bg-white/10 hover:text-white"}`}
          >
            QDC 3D
          </button>
        </section>

        {activeTab === "dimensionamento" && (
          <div className="space-y-5">
            <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Card 1</p>
                    <h2 className="mt-1 text-2xl font-black">Novo Dimensionamento</h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      Crie um novo projeto elétrico e dimensione circuitos conforme os dados informados.
                    </p>
                  </div>
                  <Gauge className="text-volt-yellow" size={28} />
                </div>

                <button onClick={() => setShowProjectForm(!showProjectForm)} className="btn-primary inline-flex items-center gap-2">
                  <Plus size={17} /> Novo dimensionamento
                </button>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["Circuitos", circuits.length],
                    ["Status", calculation.generalStatus],
                    ["Materiais", calculation.materials.length],
                    ["Potência", `${calculation.results.reduce((sum, item) => sum + item.totalPowerWatts, 0)} W`]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                      <p className="text-xs text-zinc-500">{label}</p>
                      <p className="mt-1 text-xl font-black text-volt-yellow">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {showProjectForm && (
                <div className="card-premium rounded-[2rem] p-5 md:p-6">
                  <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Dados do projeto</p>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <FieldBox label="Cliente"><TextInput value={project.client} onChange={(value) => updateProject("client", value)} /></FieldBox>
                    <FieldBox label="Nome do projeto"><TextInput value={project.projectName} onChange={(value) => updateProject("projectName", value)} /></FieldBox>
                    <FieldBox label="Endereço" full><TextInput value={project.address} onChange={(value) => updateProject("address", value)} /></FieldBox>
                    <FieldBox label="Tipo de instalação">
                      <select value={project.installationType} onChange={(event) => updateProject("installationType", event.target.value as ProjectData["installationType"])} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
                        {["Residencial", "Comercial", "Industrial"].map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </FieldBox>
                    <FieldBox label="Sistema elétrico">
                      <select value={project.electricalSystem} onChange={(event) => updateProject("electricalSystem", event.target.value as ProjectData["electricalSystem"])} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
                        {["Monofásico", "Bifásico", "Trifásico"].map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </FieldBox>
                    <FieldBox label="Tensão">
                      <select value={project.voltage} onChange={(event) => updateProject("voltage", event.target.value as VoltageOption)} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
                        {["127V", "220V", "380V"].map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </FieldBox>
                    <FieldBox label="Responsável técnico"><TextInput value={project.technicalResponsible} onChange={(value) => updateProject("technicalResponsible", value)} /></FieldBox>
                    <FieldBox label="Observações" full>
                      <textarea value={project.notes} onChange={(event) => updateProject("notes", event.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold outline-none focus:border-volt-yellow/40" />
                    </FieldBox>
                  </div>
                </div>
              )}
            </section>

            <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Card 2</p>
                <h2 className="mt-1 text-2xl font-black">Circuitos</h2>
                <p className="mt-2 text-sm text-zinc-500">Adicione circuitos ilimitados ao dimensionamento.</p>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <FieldBox label="Nome do circuito"><TextInput value={circuitDraft.name} onChange={(value) => updateDraft("name", value)} /></FieldBox>
                  <FieldBox label="Tipo">
                    <select value={circuitDraft.type} onChange={(event) => updateDraft("type", event.target.value as CircuitInput["type"])} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
                      {["Iluminação", "TUG", "TUE", "Chuveiro", "Ar-condicionado", "Motor", "Outro"].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </FieldBox>
                  <FieldBox label="Potência em watts"><NumberInput value={circuitDraft.powerWatts} onChange={(value) => updateDraft("powerWatts", value)} /></FieldBox>
                  <FieldBox label="Quantidade"><NumberInput value={circuitDraft.quantity} onChange={(value) => updateDraft("quantity", value)} /></FieldBox>
                  <FieldBox label="Tensão"><NumberInput value={circuitDraft.voltage} onChange={(value) => updateDraft("voltage", value)} /></FieldBox>
                  <FieldBox label="Fator de potência"><NumberInput value={circuitDraft.powerFactor} onChange={(value) => updateDraft("powerFactor", value)} /></FieldBox>
                  <FieldBox label="Comprimento em metros"><NumberInput value={circuitDraft.lengthMeters} onChange={(value) => updateDraft("lengthMeters", value)} /></FieldBox>
                  <FieldBox label="Temperatura ambiente"><NumberInput value={circuitDraft.ambientTemperature} onChange={(value) => updateDraft("ambientTemperature", value)} /></FieldBox>
                  <FieldBox label="Condutores agrupados"><NumberInput value={circuitDraft.groupedConductors} onChange={(value) => updateDraft("groupedConductors", value)} /></FieldBox>
                  <FieldBox label="Material do cabo">
                    <select value={circuitDraft.cableMaterial} onChange={(event) => updateDraft("cableMaterial", event.target.value as CircuitInput["cableMaterial"])} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
                      {["Cobre", "Alumínio"].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </FieldBox>
                  <FieldBox label="Tipo de isolação">
                    <select value={circuitDraft.insulation} onChange={(event) => updateDraft("insulation", event.target.value as CircuitInput["insulation"])} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
                      {["PVC", "EPR", "XLPE"].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </FieldBox>
                  <FieldBox label="Método de instalação" full><TextInput value={circuitDraft.installationMethod} onChange={(value) => updateDraft("installationMethod", value)} /></FieldBox>
                </div>

                <button onClick={addCircuit} className="btn-primary mt-5 inline-flex items-center gap-2">
                  <Plus size={17} /> Adicionar circuito
                </button>
              </div>

              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Circuitos cadastrados</p>
                    <h2 className="mt-1 text-2xl font-black">Lista atual</h2>
                  </div>
                  <Cable className="text-volt-yellow" size={28} />
                </div>

                <div className="space-y-3">
                  {circuits.map((circuit) => (
                    <div key={circuit.id} className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                          <p className="font-black">{circuit.name}</p>
                          <p className="mt-1 text-sm text-zinc-500">{circuit.type} • {circuit.powerWatts * circuit.quantity} W • {circuit.lengthMeters} m</p>
                        </div>
                        <button onClick={() => removeCircuit(circuit.id)} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-black text-red-200">
                          Remover
                        </button>
                      </div>
                    </div>
                  ))}

                  {circuits.length === 0 && (
                    <div className="rounded-3xl border border-white/10 bg-white/[.035] p-6 text-sm text-zinc-500">
                      Nenhum circuito cadastrado.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="card-premium rounded-[2rem] p-5 md:p-6">
              <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Card 3</p>
                  <h2 className="mt-1 text-2xl font-black">Resultado do Dimensionamento</h2>
                </div>
                <button onClick={generateQdcFromSizing} className="btn-primary inline-flex items-center gap-2">
                  <ArrowUpRight size={17} /> Gerar QDC automaticamente
                </button>
              </div>

              <div className="volt-scroll overflow-x-auto">
                <table className="w-full min-w-[1050px] border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[.16em] text-zinc-600">
                      <th className="px-4 py-2">Circuito</th>
                      <th className="px-4 py-2">Corrente</th>
                      <th className="px-4 py-2">Bitola</th>
                      <th className="px-4 py-2">Disjuntor</th>
                      <th className="px-4 py-2">DR</th>
                      <th className="px-4 py-2">DPS</th>
                      <th className="px-4 py-2">Queda tensão</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculation.results.map((result) => (
                      <tr key={result.circuitId} className="bg-white/[.035] text-sm">
                        <td className="rounded-l-2xl px-4 py-4 font-black">{result.name}</td>
                        <td className="px-4 py-4">{result.calculatedCurrent} A</td>
                        <td className="px-4 py-4">{result.recommendedCableSection} mm²</td>
                        <td className="px-4 py-4">{result.recommendedBreaker} A</td>
                        <td className="px-4 py-4">{result.recommendedDr}</td>
                        <td className="px-4 py-4">{result.recommendedDps}</td>
                        <td className="px-4 py-4">{result.voltageDropPercent}%</td>
                        <td className="rounded-r-2xl px-4 py-4"><Badge className={statusClass(result.status)}>{result.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Card 4</p>
                <h2 className="mt-1 text-2xl font-black">Lista de Materiais</h2>
                <div className="volt-scroll mt-5 overflow-x-auto">
                  <table className="w-full min-w-[850px] border-separate border-spacing-y-2">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[.16em] text-zinc-600">
                        <th className="px-4 py-2">Material</th>
                        <th className="px-4 py-2">Especificação</th>
                        <th className="px-4 py-2">Qtd</th>
                        <th className="px-4 py-2">Un.</th>
                        <th className="px-4 py-2">Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculation.materials.map((item: MaterialItem) => (
                        <tr key={item.id} className="bg-white/[.035] text-sm">
                          <td className="rounded-l-2xl px-4 py-4 font-black">{item.material}</td>
                          <td className="px-4 py-4">{item.specification}</td>
                          <td className="px-4 py-4 text-volt-yellow font-black">{item.quantity}</td>
                          <td className="px-4 py-4">{item.unit}</td>
                          <td className="rounded-r-2xl px-4 py-4 text-zinc-400">{item.observation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Card 5</p>
                <h2 className="mt-1 text-2xl font-black">Memorial de Cálculo</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  Gera um memorial em PDF por impressão contendo dados do cliente, projeto, tabela de circuitos, cálculos, materiais e responsável técnico.
                </p>

                <button onClick={openMemorialPdf} className="btn-primary mt-5 inline-flex items-center gap-2">
                  <FileText size={17} /> Gerar memorial em PDF
                </button>

                <div className="mt-5 rounded-3xl border border-volt-yellow/20 bg-volt-yellow/10 p-4">
                  <p className="font-black text-volt-yellow">Estrutura técnica</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Fórmulas isoladas em utils, motor de cálculo em services e tipos separados em types.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {activeTab === "qdc" && (
          <div className="space-y-5">
            <section className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Card 1</p>
                <h2 className="mt-1 text-2xl font-black">Novo QDC</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Monte um quadro de distribuição com componentes elétricos, etiquetas e validação visual.
                </p>
                <button onClick={createNewQdc} className="btn-primary mt-5 inline-flex items-center gap-2">
                  <Plus size={17} /> Criar novo QDC
                </button>
              </div>

              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Card 2</p>
                <h2 className="mt-1 text-2xl font-black">Dados do Quadro</h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <FieldBox label="Nome do quadro"><TextInput value={qdcProject.name} onChange={(value) => updateQdc("name", value)} /></FieldBox>
                  <FieldBox label="Cliente"><TextInput value={qdcProject.client} onChange={(value) => updateQdc("client", value)} /></FieldBox>
                  <FieldBox label="Local da instalação" full><TextInput value={qdcProject.location} onChange={(value) => updateQdc("location", value)} /></FieldBox>
                  <FieldBox label="Tipo de quadro">
                    <select value={qdcProject.boardType} onChange={(event) => updateQdc("boardType", event.target.value as QdcProjectData["boardType"])} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
                      {["Embutir", "Sobrepor"].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </FieldBox>
                  <FieldBox label="Quantidade de módulos"><NumberInput value={qdcProject.modules} onChange={(value) => updateQdc("modules", value)} /></FieldBox>
                  <FieldBox label="Sistema elétrico">
                    <select value={qdcProject.electricalSystem} onChange={(event) => updateQdc("electricalSystem", event.target.value as QdcProjectData["electricalSystem"])} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
                      {["Monofásico", "Bifásico", "Trifásico"].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </FieldBox>
                  <FieldBox label="Tensão">
                    <select value={qdcProject.voltage} onChange={(event) => updateQdc("voltage", event.target.value as VoltageOption)} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
                      {["127V", "220V", "380V"].map((item) => <option key={item}>{item}</option>)}
                    </select>
                  </FieldBox>
                  <FieldBox label="Observações" full>
                    <textarea value={qdcProject.notes} onChange={(event) => updateQdc("notes", event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold outline-none focus:border-volt-yellow/40" />
                  </FieldBox>
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[.75fr_1.25fr_.85fr]">
              <div className="card-premium rounded-[2rem] p-5">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Card 3</p>
                <h2 className="mt-1 text-2xl font-black">Componentes</h2>
                <p className="mt-2 text-sm text-zinc-500">Arraste para o quadro ou clique para adicionar.</p>

                <div className="volt-scroll mt-5 max-h-[660px] space-y-3 overflow-y-auto pr-1">
                  {componentLibrary.map((component) => (
                    <button
                      key={component.kind}
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData("component-kind", component.kind)}
                      onClick={() => addComponent(component.kind)}
                      className="w-full rounded-3xl border border-white/10 bg-white/[.035] p-4 text-left transition hover:border-volt-yellow/30"
                    >
                      <div className="flex gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black text-sm font-black text-volt-yellow">
                          {component.icon}
                        </div>
                        <div>
                          <p className="font-black">{component.name}</p>
                          <p className="mt-1 text-xs text-zinc-500">{component.modules} módulo(s) • {component.nominalCurrent}</p>
                          <p className="mt-1 text-xs text-zinc-600">{component.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card-premium rounded-[2rem] p-5">
                <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Card 4</p>
                    <h2 className="mt-1 text-2xl font-black">Área de Montagem</h2>
                  </div>
                  <Badge className={statusClass(summary.status)}>Status {summary.status}</Badge>
                </div>

                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                  className="min-h-[520px] rounded-[2rem] border border-white/10 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:28px_28px] p-5"
                >
                  <div className="rounded-[2rem] border border-white/10 bg-black/70 p-5 shadow-2xl">
                    <div className="mb-5 flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-[.18em] text-volt-yellow">{qdcProject.name}</p>
                      <p className="text-xs font-bold text-zinc-500">{usedModules}/{qdcProject.modules} módulos</p>
                    </div>

                    <div className="mb-4 h-3 rounded-full bg-zinc-700 shadow-inner" />
                    <div className="mb-6 flex min-h-40 flex-wrap items-end gap-2 rounded-2xl border border-white/10 bg-[#05070a] p-4">
                      {placedComponents.filter((component) => component.modules > 0).map((component, index) => (
                        <div
                          key={component.id}
                          onClick={() => setSelectedComponentId(component.id)}
                          className={`relative flex h-32 cursor-pointer flex-col justify-between rounded-xl border p-2 transition ${
                            selectedComponentId === component.id ? "border-volt-yellow bg-volt-yellow/15" : "border-white/10 bg-white/[.06] hover:border-volt-yellow/30"
                          }`}
                          style={{ width: `${Math.max(54, component.modules * 52)}px` }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <GripVertical size={13} className="text-zinc-500" />
                            <span className="text-[10px] font-black text-zinc-500">{component.nominalCurrent}</span>
                          </div>
                          <div className="grid place-items-center text-center">
                            <p className="text-sm font-black text-volt-yellow">{component.name}</p>
                            <p className="mt-1 line-clamp-2 text-[10px] font-bold text-zinc-300">{component.label}</p>
                          </div>
                          <div className="flex justify-between gap-1">
                            <button onClick={(event) => { event.stopPropagation(); moveComponent(component.id, -1); }} className="rounded-lg bg-black/40 px-2 py-1 text-[10px]">←</button>
                            <span className="text-[10px] text-zinc-600">#{index + 1}</span>
                            <button onClick={(event) => { event.stopPropagation(); moveComponent(component.id, 1); }} className="rounded-lg bg-black/40 px-2 py-1 text-[10px]">→</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="h-3 rounded-full bg-zinc-700 shadow-inner" />
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {placedComponents.filter((component) => component.modules === 0).map((component) => (
                        <button
                          key={component.id}
                          onClick={() => setSelectedComponentId(component.id)}
                          className={`rounded-2xl border p-3 text-left ${selectedComponentId === component.id ? "border-volt-yellow bg-volt-yellow/15" : "border-white/10 bg-white/[.035]"}`}
                        >
                          <p className="text-sm font-black">{component.label}</p>
                          <p className="text-xs text-zinc-500">{component.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {placedComponents.length === 0 && (
                    <div className="mt-5 rounded-3xl border border-volt-yellow/20 bg-volt-yellow/10 p-4 text-sm text-zinc-300">
                      Arraste ou clique nos componentes para iniciar o QDC.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <div className="card-premium rounded-[2rem] p-5">
                  <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Propriedades</p>
                  {selectedComponent ? (
                    <div className="mt-5 space-y-4">
                      <FieldBox label="Etiqueta">
                        <TextInput value={selectedComponent.label} onChange={(value) => updateSelectedComponent("label", value)} />
                      </FieldBox>
                      <FieldBox label="Corrente nominal">
                        <TextInput value={selectedComponent.nominalCurrent} onChange={(value) => updateSelectedComponent("nominalCurrent", value)} />
                      </FieldBox>
                      <FieldBox label="Módulos">
                        <NumberInput value={selectedComponent.modules} onChange={(value) => updateSelectedComponent("modules", value)} />
                      </FieldBox>
                      <div className="flex gap-2">
                        <button onClick={() => duplicateComponent(selectedComponent)} className="btn-ghost flex-1">Duplicar</button>
                        <button onClick={() => removeComponent(selectedComponent.id)} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-zinc-500">Selecione um componente do QDC para editar.</p>
                  )}
                </div>

                <div className="card-premium rounded-[2rem] p-5">
                  <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Ligações manuais</p>
                  <div className="mt-4 space-y-3">
                    <select value={wireDraft.from} onChange={(event) => setWireDraft((current) => ({ ...current, from: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
                      <option value="">Origem</option>
                      {placedComponents.map((component) => <option key={component.id} value={component.id}>{component.label}</option>)}
                    </select>
                    <select value={wireDraft.to} onChange={(event) => setWireDraft((current) => ({ ...current, to: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
                      <option value="">Destino</option>
                      {placedComponents.map((component) => <option key={component.id} value={component.id}>{component.label}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={wireDraft.wireType} onChange={(event) => setWireDraft((current) => ({ ...current, wireType: event.target.value as QdcWireConnection["wireType"] }))} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
                        {["Fase", "Neutro", "Terra", "Retorno"].map((item) => <option key={item}>{item}</option>)}
                      </select>
                      <select value={wireDraft.gauge} onChange={(event) => setWireDraft((current) => ({ ...current, gauge: event.target.value }))} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
                        {["1.5 mm²", "2.5 mm²", "4 mm²", "6 mm²", "10 mm²", "16 mm²"].map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </div>
                    <button onClick={addWireConnection} className="btn-primary w-full">Adicionar ligação</button>

                    <div className="space-y-2">
                      {connections.map((connection) => (
                        <div key={connection.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-3">
                          <p className="text-sm font-black">{connection.wireType} • {connection.gauge}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {placedComponents.find((component) => component.id === connection.from)?.label} → {placedComponents.find((component) => component.id === connection.to)?.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Card 5</p>
                <h2 className="mt-1 text-2xl font-black">Validação do QDC</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {validations.map((validation) => (
                    <div key={validation.title} className={`rounded-3xl border p-4 ${statusClass(validation.status)}`}>
                      <div className="flex gap-3">
                        {validation.status === "OK" ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                        <div>
                          <p className="font-black">{validation.title}</p>
                          <p className="mt-1 text-sm leading-6">{validation.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-3xl border border-white/10 bg-white/[.035] p-4">
                  <p className="text-sm leading-6 text-zinc-500">
                    As validações são orientativas. O projeto final deve ser conferido por profissional habilitado considerando normas técnicas aplicáveis, método de instalação, queda de tensão, agrupamento, temperatura, seletividade e fabricante dos componentes.
                  </p>
                </div>
              </div>

              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Card 6</p>
                <h2 className="mt-1 text-2xl font-black">Resumo do QDC</h2>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["Disjuntores", summary.breakers],
                    ["DR", summary.dr],
                    ["DPS", summary.dps],
                    ["Módulos usados", summary.usedModules],
                    ["Módulos livres", summary.freeModules],
                    ["Ligações", connections.length]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                      <p className="text-xs text-zinc-500">{label}</p>
                      <p className="mt-1 text-2xl font-black text-volt-yellow">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-3xl border border-volt-yellow/20 bg-volt-yellow/10 p-4">
                  <p className="font-black text-volt-yellow">Status geral: {summary.status}</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    Primeira versão em visual 2D. Arquitetura preparada para evoluir para Three.js na segunda versão.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
