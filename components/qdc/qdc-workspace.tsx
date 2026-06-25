"use client";

import dynamic from "next/dynamic";
import { componentCatalog, catalogGroups } from "@/data/catalog";
import { calculateCurrent, suggestBreaker, suggestCable, validateQdcProject } from "@/lib/electrical";
import { downloadJson, exportBoardPng, exportProjectPdf } from "@/lib/exporters";
import { useQdcStore } from "@/store/qdc-store";
import type { CatalogItem, QdcComponent, WireKind } from "@/types";
import { Cable, Download, FileDown, MousePointer2, PlugZap, Save, Trash2, Upload } from "lucide-react";
import { ChangeEvent, DragEvent, useMemo, useRef } from "react";

const QdcScene = dynamic(() => import("./qdc-scene").then((mod) => mod.QdcScene), { ssr: false, loading: () => <div className="grid h-full place-items-center text-zinc-400">Carregando cena 3D...</div> });

const wireOptions: Array<{ kind: WireKind; label: string; color: string }> = [
  { kind: "fase", label: "Fase", color: "#ef4444" },
  { kind: "neutro", label: "Neutro", color: "#38bdf8" },
  { kind: "terra", label: "Terra", color: "#22c55e" },
  { kind: "retorno", label: "Retorno", color: "#f8fafc" }
];

function toBoardCoordinates(clientX: number, clientY: number, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const nx = (clientX - rect.left) / rect.width;
  const ny = (clientY - rect.top) / rect.height;
  const x = Number(((nx - 0.5) * 10).toFixed(2));
  const y = Number(((0.5 - ny) * 6.2).toFixed(2));
  return { x, y };
}

function snap(value: number, step = 0.42) {
  return Number((Math.round(value / step) * step).toFixed(2));
}

function connectorScreen(component: QdcComponent, connectorId: string) {
  const connector = component.connectors.find((point) => point.id === connectorId);
  if (!connector) return { x: 50, y: 50 };
  return {
    x: ((component.x + connector.x) / 10 + 0.5) * 100,
    y: (0.5 - (component.y + connector.y) / 6.2) * 100
  };
}

export function QdcWorkspace() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const store = useQdcStore();
  const selected = store.components.find((component) => component.id === store.selectedComponentId) ?? null;
  const alerts = useMemo(() => validateQdcProject(store.components, store.wires), [store.components, store.wires]);
  const status = alerts.some((alert) => alert.level === "Erro") ? "Erro" : alerts.some((alert) => alert.level === "Atenção") ? "Atenção" : "OK";

  function dragStart(e: DragEvent<HTMLButtonElement>, item: CatalogItem) {
    e.dataTransfer.setData("application/x-volt-component", JSON.stringify(item));
  }

  function drop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/x-volt-component");
    if (!raw || !stageRef.current) return;
    const item = JSON.parse(raw) as CatalogItem;
    const pos = toBoardCoordinates(e.clientX, e.clientY, stageRef.current);
    store.addComponent(item, snap(pos.x), snap(pos.y));
  }

  function addByClick(item: CatalogItem) {
    const x = snap(-4.2 + (store.components.length % 10) * 0.84);
    const y = snap(2.4 - Math.floor(store.components.length / 10) * 1.2);
    store.addComponent(item, x, y);
  }

  function moveSelected(dx: number, dy: number) {
    if (!selected) return;
    store.moveComponent(selected.id, snap(selected.x + dx), snap(selected.y + dy));
  }

  async function exportPdf() {
    const rows = [
      `Status geral: ${status}`,
      `Componentes: ${store.components.length}`,
      `Fios: ${store.wires.length}`,
      "",
      "Circuitos e cargas:",
      ...store.components.filter((item) => item.kind === "load").map((load) => {
        const current = calculateCurrent(load.powerW, load.voltage);
        return `${load.label}: ${load.powerW || 0} W / ${load.voltage || 0} V = ${current} A | Disjuntor sugerido: ${suggestBreaker(current)} A | Cabo orientativo: ${suggestCable(current)} mm²`;
      }),
      "",
      "Alertas:",
      ...alerts.map((alert) => `${alert.level} - ${alert.title}: ${alert.description}`)
    ];
    await exportProjectPdf("qdc-export-area", store.projectName, rows);
  }

  function importFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        store.importProject(JSON.parse(String(reader.result)));
      } catch {
        alert("Arquivo inválido para importação.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="h-[calc(100vh-7.5rem)] min-h-[760px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#070a0e] shadow-soft">
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-volt-yellow px-3 py-2 font-black text-black">QDC 3D</div>
          <input className="input-dark h-10 w-72" value={store.projectName} onChange={(e) => store.setProjectName(e.target.value)} />
          <span className={`rounded-full px-3 py-1 text-xs font-black ${status === "OK" ? "bg-volt-ok/15 text-volt-ok" : status === "Atenção" ? "bg-volt-warn/15 text-volt-warn" : "bg-volt-err/15 text-volt-err"}`}>{status}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost inline-flex items-center gap-2" onClick={() => store.setWireTool(!store.wireToolEnabled)}><Cable size={17} /> {store.wireToolEnabled ? "Fio ativo" : "Ferramenta fio"}</button>
          <button className="btn-ghost inline-flex items-center gap-2" onClick={() => downloadJson(store.snapshot())}><Save size={17} /> JSON</button>
          <button className="btn-ghost inline-flex items-center gap-2" onClick={() => fileInputRef.current?.click()}><Upload size={17} /> Importar</button>
          <button className="btn-ghost inline-flex items-center gap-2" onClick={() => exportBoardPng("qdc-export-area")}><Download size={17} /> PNG</button>
          <button className="btn-primary inline-flex items-center gap-2" onClick={exportPdf}><FileDown size={17} /> PDF</button>
          <input hidden ref={fileInputRef} type="file" accept="application/json" onChange={importFile} />
        </div>
      </div>

      <div className="grid h-[calc(100%-4rem)] grid-cols-[320px_1fr_360px]">
        <aside className="volt-scroll overflow-auto border-r border-white/10 p-4">
          <h2 className="mb-3 text-sm font-black uppercase tracking-[.2em] text-zinc-400">Biblioteca</h2>
          {catalogGroups.map((group) => (
            <div key={group} className="mb-5">
              <p className="mb-2 text-sm font-black text-volt-yellow">{group}</p>
              <div className="space-y-2">
                {componentCatalog.filter((item) => item.category === group).map((item) => (
                  <button key={`${item.kind}-${item.name}`} draggable onDragStart={(e) => dragStart(e, item)} onClick={() => addByClick(item)} className="w-full rounded-2xl border border-white/10 bg-white/[.035] p-3 text-left transition hover:border-volt-yellow/50 hover:bg-volt-yellow/10">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-black/40 text-xs font-black text-volt-yellow">{item.icon}</span>
                      <span><span className="block text-sm font-black">{item.name}</span><span className="block text-xs leading-5 text-zinc-500">{item.description}</span></span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <section className="relative bg-black/40">
          <div id="qdc-export-area" ref={stageRef} onDragOver={(e) => e.preventDefault()} onDrop={drop} className="relative h-full qdc-grid">
            <QdcScene components={store.components} wires={store.wires} selectedComponentId={store.selectedComponentId} />
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
              {store.wires.map((wire) => {
                const a = store.components.find((component) => component.id === wire.from.componentId);
                const b = store.components.find((component) => component.id === wire.to.componentId);
                if (!a || !b) return null;
                const p1 = connectorScreen(a, wire.from.connectorId);
                const p2 = connectorScreen(b, wire.to.connectorId);
                const midY = Math.min(p1.y, p2.y) - 5;
                return <path key={wire.id} d={`M ${p1.x}% ${p1.y}% C ${p1.x}% ${midY}%, ${p2.x}% ${midY}%, ${p2.x}% ${p2.y}%`} stroke={wire.color} strokeWidth="4" fill="none" opacity=".9" />;
              })}
            </svg>

            <div className="absolute inset-0">
              {store.components.map((component) => (
                <div key={component.id} className="absolute" style={{ left: `${(component.x / 10 + 0.5) * 100}%`, top: `${(0.5 - component.y / 6.2) * 100}%`, transform: "translate(-50%, -50%)" }}>
                  <button onClick={() => store.selectComponent(component.id)} className={`rounded-xl border px-2 py-1 text-[10px] font-black backdrop-blur ${store.selectedComponentId === component.id ? "border-volt-yellow bg-volt-yellow text-black" : "border-white/10 bg-black/60 text-white"}`}>
                    {component.label}
                  </button>
                  {store.wireToolEnabled && component.connectors.map((point) => {
                    const left = 50 + point.x * 52;
                    const top = 50 - point.y * 52;
                    const active = store.wireStart?.componentId === component.id && store.wireStart?.connectorId === point.id;
                    return (
                      <button key={point.id} title={`${component.label} - ${point.label}`} onClick={() => store.clickConnector({ componentId: component.id, connectorId: point.id })} className={`absolute z-20 grid h-4 w-4 place-items-center rounded-full border-2 ${active ? "border-white bg-volt-yellow" : "border-white bg-black"}`} style={{ left: `${left}%`, top: `${top}%`, transform: "translate(-50%, -50%)" }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: point.allowed.includes(store.selectedWireKind) ? store.selectedWireColor : "#ef4444" }} />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="absolute bottom-4 left-4 rounded-2xl border border-white/10 bg-black/70 p-3 text-xs text-zinc-300 backdrop-blur">
              <p><b>Arrastar:</b> solte componentes no quadro.</p>
              <p><b>Fio:</b> ative a ferramenta e clique nas bolinhas.</p>
              <p><b>Câmera:</b> girar, zoom e pan com o mouse.</p>
            </div>
          </div>
        </section>

        <aside className="volt-scroll overflow-auto border-l border-white/10 p-4">
          <div className="mb-4 rounded-3xl border border-white/10 bg-white/[.035] p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[.18em] text-zinc-400"><PlugZap size={17} /> Fios</h2>
            <div className="grid grid-cols-2 gap-2">
              {wireOptions.map((option) => (
                <button key={option.kind} onClick={() => store.setWireSettings(option.kind, option.color)} className={`rounded-2xl border p-3 text-left text-sm font-black ${store.selectedWireKind === option.kind ? "border-volt-yellow bg-volt-yellow text-black" : "border-white/10 bg-black/20"}`}>
                  <span className="mr-2 inline-block h-3 w-3 rounded-full" style={{ background: option.color }} />{option.label}
                </button>
              ))}
            </div>
            <label className="mt-3 block text-xs font-bold text-zinc-400">Bitola do fio</label>
            <select className="input-dark mt-1" value={store.selectedWireGauge} onChange={(e) => store.setWireSettings(store.selectedWireKind, undefined, Number(e.target.value))}>
              {[1.5, 2.5, 4, 6, 10, 16, 25].map((value) => <option key={value} value={value}>{value} mm²</option>)}
            </select>
          </div>

          <div className="mb-4 rounded-3xl border border-white/10 bg-white/[.035] p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[.18em] text-zinc-400"><MousePointer2 size={17} /> Propriedades</h2>
            {!selected ? <p className="text-sm text-zinc-500">Selecione um componente do QDC para editar.</p> : <Properties selected={selected} moveSelected={moveSelected} />}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-[.18em] text-zinc-400">Validação</h2><button onClick={() => store.clearProject()} className="text-xs font-black text-red-300"><Trash2 size={14} className="inline" /> Limpar</button></div>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className={`rounded-2xl border p-3 ${alert.level === "OK" ? "border-volt-ok/30 bg-volt-ok/10" : alert.level === "Atenção" ? "border-volt-warn/30 bg-volt-warn/10" : "border-volt-err/30 bg-volt-err/10"}`}>
                  <p className="text-sm font-black">{alert.level} — {alert.title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-300">{alert.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3 text-[11px] leading-5 text-zinc-500">As validações são orientativas. O projeto final deve ser conferido por profissional habilitado, considerando normas técnicas aplicáveis, método de instalação, queda de tensão, agrupamento, temperatura, seletividade e fabricante dos componentes.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Properties({ selected, moveSelected }: { selected: QdcComponent; moveSelected: (dx: number, dy: number) => void }) {
  const store = useQdcStore();
  const current = calculateCurrent(selected.powerW, selected.voltage);
  const set = (patch: Partial<QdcComponent>) => store.updateComponent(selected.id, patch);

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold text-zinc-400">Etiqueta</label>
      <input className="input-dark" value={selected.label} onChange={(e) => set({ label: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <div><label className="block text-xs font-bold text-zinc-400">X</label><input className="input-dark" type="number" value={selected.x} onChange={(e) => set({ x: Number(e.target.value) })} /></div>
        <div><label className="block text-xs font-bold text-zinc-400">Y</label><input className="input-dark" type="number" value={selected.y} onChange={(e) => set({ y: Number(e.target.value) })} /></div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button className="btn-ghost" onClick={() => moveSelected(0, .42)}>↑</button>
        <button className="btn-ghost" onClick={() => moveSelected(-.42, 0)}>←</button>
        <button className="btn-ghost" onClick={() => moveSelected(.42, 0)}>→</button>
        <button className="btn-ghost" onClick={() => moveSelected(0, -.42)}>↓</button>
      </div>
      {(selected.kind.includes("breaker") || selected.kind === "mainBreaker" || selected.kind === "dr2" || selected.kind === "dr4") && (
        <>
          <label className="block text-xs font-bold text-zinc-400">Corrente nominal</label>
          <select className="input-dark" value={selected.ratingA ?? 10} onChange={(e) => set({ ratingA: Number(e.target.value) })}>{[10, 16, 20, 25, 32, 40, 50, 63, 80, 100].map((v) => <option key={v} value={v}>{v} A</option>)}</select>
          <label className="block text-xs font-bold text-zinc-400">Curva</label>
          <select className="input-dark" value={selected.curve ?? "C"} onChange={(e) => set({ curve: e.target.value as QdcComponent["curve"] })}><option>B</option><option>C</option><option>D</option></select>
        </>
      )}
      {(selected.kind === "dr2" || selected.kind === "dr4") && (
        <><label className="block text-xs font-bold text-zinc-400">Sensibilidade</label><select className="input-dark" value={selected.sensitivityMA ?? 30} onChange={(e) => set({ sensitivityMA: Number(e.target.value) })}><option value={30}>30 mA</option><option value={100}>100 mA</option><option value={300}>300 mA</option></select></>
      )}
      {selected.kind === "load" && (
        <>
          <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-bold text-zinc-400">Potência</label><input className="input-dark" type="number" value={selected.powerW ?? 0} onChange={(e) => set({ powerW: Number(e.target.value) })} /></div><div><label className="block text-xs font-bold text-zinc-400">Tensão</label><select className="input-dark" value={selected.voltage ?? 127} onChange={(e) => set({ voltage: Number(e.target.value) as 127 | 220 | 380 })}><option value={127}>127 V</option><option value={220}>220 V</option><option value={380}>380 V</option></select></div></div>
          <label className="block text-xs font-bold text-zinc-400">Bitola do circuito</label><select className="input-dark" value={selected.cableMm2 ?? 2.5} onChange={(e) => set({ cableMm2: Number(e.target.value) })}>{[1.5, 2.5, 4, 6, 10, 16, 25].map((v) => <option key={v} value={v}>{v} mm²</option>)}</select>
          <div className="rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 p-3 text-xs leading-5 text-zinc-200"><b>Memorial:</b><br />I = P/V = {current} A<br />Disjuntor sugerido: {suggestBreaker(current)} A<br />Cabo orientativo: {suggestCable(current)} mm²</div>
        </>
      )}
      <button onClick={() => store.removeComponent(selected.id)} className="w-full rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300">Excluir componente</button>
    </div>
  );
}
