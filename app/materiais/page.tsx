"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Filter,
  Package,
  PackageCheck,
  PackageMinus,
  PackagePlus,
  PieChart,
  Plus,
  Search,
  ShoppingCart,
  Truck,
  Warehouse,
  Wrench,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type MaterialStatus = "Em estoque" | "Estoque baixo" | "Sem estoque" | "Reservado" | "Em compra" | "Descontinuado" | "Bloqueado" | "Aguardando fornecedor";
type MovementType = "Entrada por compra" | "Entrada manual" | "Saída para OS" | "Saída manual" | "Devolução" | "Ajuste de inventário" | "Reserva";

type Material = {
  code: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  unit: string;
  stock: number;
  minStock: number;
  maxStock: number;
  reserved: number;
  location: string;
  supplier: string;
  unitCost: number;
  averageCost: number;
  salePrice: number;
  desiredMargin: number;
  costCenter: string;
  status: MaterialStatus;
  abc: "A" | "B" | "C";
  usedMonth: number;
  notes: string;
};

type Movement = {
  id: string;
  material: string;
  type: MovementType;
  quantity: number;
  unitCost: number;
  date: string;
  responsible: string;
  os: string;
  quote: string;
  supplier: string;
  reason: string;
};

type Purchase = {
  id: string;
  supplier: string;
  date: string;
  expected: string;
  received: string;
  status: "Solicitada" | "Aprovada" | "Comprada" | "Parcialmente recebida" | "Recebida" | "Cancelada" | "Atrasada";
  responsible: string;
  total: number;
  payment: string;
  notes: string;
};

type Supplier = {
  name: string;
  fantasy: string;
  phone: string;
  email: string;
  contact: string;
  categories: string;
  deliveryDays: number;
  payment: string;
  rating: number;
  totalBought: number;
};

const materialsSeed: Material[] = [
  {
    code: "MAT-001",
    name: "Cabo flexível 2,5mm²",
    category: "Cabos elétricos",
    subcategory: "Cabo flexível",
    brand: "Corfio",
    unit: "Metro",
    stock: 85,
    minStock: 50,
    maxStock: 300,
    reserved: 20,
    location: "Prateleira A1",
    supplier: "Fornecedor elétrico",
    unitCost: 2.9,
    averageCost: 2.75,
    salePrice: 5.5,
    desiredMargin: 50,
    costCenter: "Materiais elétricos",
    status: "Em estoque",
    abc: "A",
    usedMonth: 120,
    notes: "Material de alto giro para tomadas e circuitos dedicados."
  },
  {
    code: "MAT-002",
    name: "Disjuntor bipolar 32A",
    category: "Disjuntores",
    subcategory: "Bipolar",
    brand: "Steck",
    unit: "Unidade",
    stock: 3,
    minStock: 5,
    maxStock: 30,
    reserved: 2,
    location: "Gaveta B2",
    supplier: "Distribuidora elétrica",
    unitCost: 42,
    averageCost: 39,
    salePrice: 78,
    desiredMargin: 46,
    costCenter: "Materiais elétricos",
    status: "Estoque baixo",
    abc: "A",
    usedMonth: 14,
    notes: "Repor para serviços de chuveiro e circuitos dedicados."
  },
  {
    code: "MAT-003",
    name: "DR 63A 30mA",
    category: "DR",
    subcategory: "Proteção",
    brand: "Schneider",
    unit: "Unidade",
    stock: 0,
    minStock: 2,
    maxStock: 12,
    reserved: 0,
    location: "Gaveta B3",
    supplier: "Fornecedor premium",
    unitCost: 185,
    averageCost: 178,
    salePrice: 320,
    desiredMargin: 42,
    costCenter: "Materiais elétricos",
    status: "Sem estoque",
    abc: "A",
    usedMonth: 4,
    notes: "Item crítico para adequações."
  },
  {
    code: "MAT-004",
    name: "Tomada 20A",
    category: "Tomadas",
    subcategory: "Sobrepor/embutir",
    brand: "Tramontina",
    unit: "Unidade",
    stock: 18,
    minStock: 20,
    maxStock: 80,
    reserved: 10,
    location: "Caixa C1",
    supplier: "Fornecedor elétrico",
    unitCost: 8.5,
    averageCost: 8.2,
    salePrice: 18,
    desiredMargin: 54,
    costCenter: "Materiais elétricos",
    status: "Reservado",
    abc: "B",
    usedMonth: 32,
    notes: "Usada em circuitos dedicados."
  },
  {
    code: "MAT-005",
    name: "Fita isolante profissional",
    category: "Fita isolante",
    subcategory: "Isolação",
    brand: "3M",
    unit: "Rolo",
    stock: 25,
    minStock: 10,
    maxStock: 80,
    reserved: 0,
    location: "Gaveta A3",
    supplier: "Casa elétrica",
    unitCost: 7.8,
    averageCost: 7.5,
    salePrice: 15,
    desiredMargin: 50,
    costCenter: "Materiais elétricos",
    status: "Em estoque",
    abc: "C",
    usedMonth: 18,
    notes: "Consumo recorrente."
  },
  {
    code: "MAT-006",
    name: "Interruptor inteligente Wi-Fi",
    category: "Automação",
    subcategory: "Smart home",
    brand: "Sonoff",
    unit: "Unidade",
    stock: 4,
    minStock: 4,
    maxStock: 20,
    reserved: 3,
    location: "Gaveta D1",
    supplier: "Fornecedor automação",
    unitCost: 68,
    averageCost: 65,
    salePrice: 135,
    desiredMargin: 52,
    costCenter: "Automação",
    status: "Estoque baixo",
    abc: "B",
    usedMonth: 5,
    notes: "Material usado em propostas de automação."
  }
];

const movementsSeed: Movement[] = [
  { id: "MOV-001", material: "Cabo flexível 2,5mm²", type: "Entrada por compra", quantity: 100, unitCost: 2.75, date: "2026-06-10", responsible: "Guilherme", os: "Estoque", quote: "Sem cotação", supplier: "Fornecedor elétrico", reason: "Reposição" },
  { id: "MOV-002", material: "Tomada 20A", type: "Saída para OS", quantity: 4, unitCost: 8.2, date: "2026-06-22", responsible: "Guilherme", os: "OS-1043", quote: "COT-224", supplier: "Fornecedor elétrico", reason: "Uso em serviço" },
  { id: "MOV-003", material: "Disjuntor bipolar 32A", type: "Reserva", quantity: 2, unitCost: 39, date: "2026-06-25", responsible: "Técnico 01", os: "OS-1042", quote: "COT-221", supplier: "Distribuidora elétrica", reason: "Reserva para QDC" },
  { id: "MOV-004", material: "Fita isolante profissional", type: "Saída manual", quantity: 2, unitCost: 7.5, date: "2026-06-24", responsible: "Guilherme", os: "Operação", quote: "Sem cotação", supplier: "Casa elétrica", reason: "Uso técnico" }
];

const purchasesSeed: Purchase[] = [
  { id: "COMP-001", supplier: "Distribuidora elétrica", date: "2026-06-24", expected: "2026-06-28", received: "", status: "Comprada", responsible: "Guilherme", total: 620, payment: "Pix", notes: "Reposição de disjuntores e DR." },
  { id: "COMP-002", supplier: "Fornecedor automação", date: "2026-06-21", expected: "2026-06-27", received: "", status: "Atrasada", responsible: "Guilherme", total: 890, payment: "Boleto", notes: "Interruptores smart e sensores." },
  { id: "COMP-003", supplier: "Casa elétrica", date: "2026-06-18", expected: "2026-06-20", received: "2026-06-20", status: "Recebida", responsible: "Guilherme", total: 340, payment: "Cartão", notes: "Fitas, conectores e canaletas." }
];

const suppliersSeed: Supplier[] = [
  { name: "Fornecedor elétrico", fantasy: "Elétrica SP", phone: "(11) 90000-1111", email: "vendas@eletrica.com", contact: "Carlos", categories: "Cabos, tomadas, conectores", deliveryDays: 2, payment: "Pix / boleto", rating: 4.7, totalBought: 4200 },
  { name: "Distribuidora elétrica", fantasy: "DistriVolt", phone: "(11) 90000-2222", email: "comercial@distrivolt.com", contact: "Ana", categories: "Disjuntores, DR, DPS", deliveryDays: 3, payment: "Boleto", rating: 4.5, totalBought: 3800 },
  { name: "Fornecedor automação", fantasy: "Smart Pro", phone: "(11) 90000-3333", email: "smart@pro.com", contact: "Rafael", categories: "Automação, sensores", deliveryDays: 5, payment: "Transferência", rating: 4.2, totalBought: 2100 }
];

const monthlyStock = [
  { month: "Jan", value: 5200, entradas: 3200, saidas: 2100 },
  { month: "Fev", value: 6100, entradas: 4100, saidas: 2800 },
  { month: "Mar", value: 7200, entradas: 4500, saidas: 3300 },
  { month: "Abr", value: 8400, entradas: 5200, saidas: 4100 },
  { month: "Mai", value: 9200, entradas: 6100, saidas: 4500 },
  { month: "Jun", value: 10850, entradas: 6800, saidas: 5200 }
];

const tabs = ["Visão Geral", "Estoque", "Movimentações", "Compras", "Fornecedores", "Reservas por OS", "Inventário", "Curva ABC", "Relatórios"];

const statusColors: Record<MaterialStatus, string> = {
  "Em estoque": "bg-volt-ok/15 text-volt-ok border-volt-ok/20",
  "Estoque baixo": "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25",
  "Sem estoque": "bg-red-500/15 text-red-300 border-red-500/20",
  Reservado: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  "Em compra": "bg-purple-500/15 text-purple-300 border-purple-500/20",
  Descontinuado: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  Bloqueado: "bg-red-500/15 text-red-300 border-red-500/20",
  "Aguardando fornecedor": "bg-orange-500/15 text-orange-300 border-orange-500/20"
};

const purchaseColors = {
  Solicitada: "bg-white/10 text-zinc-300 border-white/10",
  Aprovada: "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25",
  Comprada: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  "Parcialmente recebida": "bg-orange-500/15 text-orange-300 border-orange-500/20",
  Recebida: "bg-volt-ok/15 text-volt-ok border-volt-ok/20",
  Cancelada: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  Atrasada: "bg-red-500/15 text-red-300 border-red-500/20"
};

function currency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[.12em] ${className}`}>{children}</span>;
}

function ProgressBar({ value, danger = false }: { value: number; danger?: boolean }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full ${danger ? "bg-red-400" : "bg-volt-yellow"} shadow-[0_0_18px_rgba(255,203,47,.35)]`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function ChartCard({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card-premium rounded-[2rem] p-5 md:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Estoque</p>
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{subtitle}</p>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-volt-yellow/25 bg-volt-yellow/10 text-volt-yellow">{icon}</div>
      </div>
      {children}
    </section>
  );
}

function StockLineChart() {
  const width = 740;
  const height = 260;
  const pad = 34;
  const max = Math.max(...monthlyStock.flatMap((item) => [item.value, item.entradas, item.saidas]));

  function points(key: "value" | "entradas" | "saidas") {
    return monthlyStock.map((item, index) => {
      const x = pad + (index * (width - pad * 2)) / (monthlyStock.length - 1);
      const y = height - pad - (item[key] / max) * (height - pad * 2);
      return `${x},${y}`;
    }).join(" ");
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full">
        {[0, 1, 2, 3].map((line) => {
          const y = pad + (line * (height - pad * 2)) / 3;
          return <line key={line} x1={pad} x2={width - pad} y1={y} y2={y} stroke="rgba(255,255,255,.08)" />;
        })}
        <polyline fill="none" stroke="#ffcb2f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" points={points("value")} />
        <polyline fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points("entradas")} />
        <polyline fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points("saidas")} />
        {monthlyStock.map((item, index) => {
          const x = pad + (index * (width - pad * 2)) / (monthlyStock.length - 1);
          return <text key={item.month} x={x} y={height - 6} textAnchor="middle" fill="rgba(255,255,255,.55)" fontSize="13" fontWeight="700">{item.month}</text>;
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-zinc-400">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-volt-yellow" /> Valor em estoque</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-volt-ok" /> Entradas</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-red-500" /> Saídas</span>
      </div>
    </div>
  );
}

function CategoryDonut({ materials }: { materials: Material[] }) {
  const categories = Array.from(new Set(materials.map((item) => item.category))).slice(0, 6);
  const palette = ["#ffcb2f", "#22c55e", "#38bdf8", "#a78bfa", "#f97316", "#71717a"];
  const rows = categories.map((category, index) => ({
    label: category,
    value: materials.filter((item) => item.category === category).reduce((sum, item) => sum + item.stock * item.averageCost, 0),
    color: palette[index]
  }));
  const total = Math.max(rows.reduce((sum, item) => sum + item.value, 0), 1);

  let start = 0;
  const conic = `conic-gradient(${rows.map((item) => {
    const size = (item.value / total) * 100;
    const end = start + size;
    const part = `${item.color} ${start}% ${end}%`;
    start = end;
    return part;
  }).join(", ")})`;

  return (
    <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-center">
      <div className="mx-auto grid h-56 w-56 place-items-center rounded-full border border-white/10 bg-black/30 p-4">
        <div className="grid h-48 w-48 place-items-center rounded-full" style={{ background: conic }}>
          <div className="grid h-28 w-28 place-items-center rounded-full border border-white/10 bg-[#090d12] text-center">
            <div>
              <p className="text-2xl font-black text-volt-yellow">{currency(total)}</p>
              <p className="text-xs font-bold text-zinc-500">estoque</p>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {rows.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/35 p-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm font-bold text-zinc-300">{item.label}</span>
            </div>
            <span className="font-black">{currency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MateriaisPage() {
  const [materials, setMaterials] = useState<Material[]>(materialsSeed);
  const [activeTab, setActiveTab] = useState("Visão Geral");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selected, setSelected] = useState<Material | null>(materialsSeed[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<EditableRecord | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("volt_materiais_premium_v1");
      if (saved) {
        const parsed = JSON.parse(saved) as Material[];
        if (Array.isArray(parsed)) {
          setMaterials(parsed);
          setSelected(parsed[0] ?? null);
        }
      }
    } catch {
      setMaterials(materialsSeed);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem("volt_materiais_premium_v1", JSON.stringify(materials));
  }, [storageReady, materials]);

  function getRecordKey(item: Material) {
    return item.code;
  }

  function openEditor(item: Material) {
    setEditingKey(getRecordKey(item));
    setDraft({ ...item } as unknown as EditableRecord);
    setEditOpen(true);
  }

  function saveEditor() {
    if (!draft) return;
    const next = draft as unknown as Material;
    setMaterials((current) => current.map((item) => getRecordKey(item) === editingKey ? next : item));
    setSelected(next);
    setEditOpen(false);
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy: Material = { ...selected, code: `MAT-${String(materials.length + 1).padStart(3, "0")}`, name: `${selected.name} cópia` };
    setMaterials((current) => [copy, ...current]);
    setSelected(copy);
    setEditingKey(getRecordKey(copy));
    setDraft({ ...copy } as unknown as EditableRecord);
    setEditOpen(true);
  }

  function removeSelected() {
    if (!selected) return;
    if (!window.confirm("Excluir este registro?")) return;
    setMaterials((current) => current.filter((item) => getRecordKey(item) !== getRecordKey(selected)));
    setSelected(null);
    setModalOpen(false);
    setEditOpen(false);
  }


  const filtered = useMemo(() => {
    return materials.filter((item) => {
      const text = `${item.code} ${item.name} ${item.category} ${item.brand} ${item.supplier} ${item.notes}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "Todos" || item.category === categoryFilter;
      const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [materials, search, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const value = filtered.reduce((sum, item) => sum + item.stock * item.averageCost, 0);
    const low = filtered.filter((item) => item.stock <= item.minStock && item.stock > 0).length;
    const zero = filtered.filter((item) => item.stock === 0).length;
    const reserved = filtered.reduce((sum, item) => sum + item.reserved, 0);
    const used = filtered.reduce((sum, item) => sum + item.usedMonth, 0);
    const avgCost = value / Math.max(filtered.reduce((sum, item) => sum + item.stock, 0), 1);
    const mostUsed = [...filtered].sort((a, b) => b.usedMonth - a.usedMonth)[0];
    const mostExpensive = [...filtered].sort((a, b) => b.averageCost - a.averageCost)[0];
    const giro = Math.round((used / Math.max(filtered.reduce((sum, item) => sum + item.stock, 0), 1)) * 100);
    return { value, low, zero, reserved, used, avgCost, mostUsed, mostExpensive, giro };
  }, [filtered]);

  function createMaterial() {
    const next: Material = {
      code: `MAT-${String(materials.length + 1).padStart(3, "0")}`,
      name: "Novo material",
      category: "Outros",
      subcategory: "A definir",
      brand: "A definir",
      unit: "Unidade",
      stock: 0,
      minStock: 1,
      maxStock: 10,
      reserved: 0,
      location: "A definir",
      supplier: "A definir",
      unitCost: 0,
      averageCost: 0,
      salePrice: 0,
      desiredMargin: 40,
      costCenter: "Materiais elétricos",
      status: "Sem estoque",
      abc: "C",
      usedMonth: 0,
      notes: "Editar cadastro do material."
    };
    setMaterials((current) => [next, ...current]);
    setSelected(next);
    setEditingKey(getRecordKey(next));
    setDraft({ ...next } as unknown as EditableRecord);
    setModalOpen(false);
    setEditOpen(true);
  }

  function exportCsv() {
    const header = ["Código", "Material", "Categoria", "Estoque", "Mínimo", "Reservado", "Disponível", "Custo médio", "Valor estoque", "Fornecedor", "Status"];
    const rows = filtered.map((item) => [item.code, item.name, item.category, item.stock, item.minStock, item.reserved, item.stock - item.reserved, item.averageCost, item.stock * item.averageCost, item.supplier, item.status]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "materiais-volt.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const categories = ["Todos", ...Array.from(new Set(materials.map((item) => item.category)))];

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111821] via-[#080c11] to-black p-5 shadow-soft md:p-7">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-volt-yellow/20 blur-[130px]" />
          <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Estoque e compras</p>
              <h1 className="mt-2 text-4xl font-black leading-tight md:text-5xl">Materiais</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                Controle estoque, custos, entradas, saídas, reservas por OS, compras, fornecedores, inventário, curva ABC e alertas de reposição.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
              <button onClick={createMaterial} className="btn-primary inline-flex items-center justify-center gap-2"><Plus size={17} /> Novo material</button>
              <button className="btn-ghost inline-flex items-center justify-center gap-2"><PackagePlus size={17} /> Nova entrada</button>
              <button className="btn-ghost inline-flex items-center justify-center gap-2"><PackageMinus size={17} /> Nova saída</button>
              <button onClick={exportCsv} className="btn-ghost inline-flex items-center justify-center gap-2"><Download size={17} /> Exportar CSV</button>
              <button onClick={() => window.print()} className="btn-ghost inline-flex items-center justify-center gap-2"><FileText size={17} /> PDF</button>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[.025] p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_.7fr_.7fr]">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
              <Search size={17} className="text-volt-yellow" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar material, código, descrição, marca, fornecedor..." className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600" />
            </div>
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
              {["Todos", "Em estoque", "Estoque baixo", "Sem estoque", "Reservado", "Em compra", "Descontinuado", "Bloqueado", "Aguardando fornecedor"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
          {[
            ["Itens cadastrados", filtered.length, Package, "text-volt-yellow", "+12%"],
            ["Valor estoque", currency(stats.value), Warehouse, "text-volt-yellow", "atual"],
            ["Estoque baixo", stats.low, AlertTriangle, "text-volt-yellow", "atenção"],
            ["Sem estoque", stats.zero, AlertTriangle, "text-red-300", "crítico"],
            ["Reservados", stats.reserved, PackageCheck, "text-blue-300", "OS"],
            ["Usados no mês", stats.used, PackageMinus, "text-orange-300", "saídas"],
            ["Custo médio", currency(stats.avgCost), WalletIcon, "text-volt-ok", "unit."],
            ["Giro estoque", `${stats.giro}%`, BarChart3, "text-volt-yellow", "mês"]
          ].map(([label, value, Icon, color, note]) => {
            const IconComp = Icon as typeof Package;
            return (
              <article key={String(label)} className="card-premium rounded-3xl p-4">
                <div className="mb-4 flex items-center justify-between">
                  <IconComp className={String(color)} size={22} />
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-zinc-400">{String(note)}</span>
                </div>
                <p className={`text-xl font-black ${String(color)}`}>{String(value)}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">{String(label)}</p>
              </article>
            );
          })}
        </section>

        <section className="volt-scroll flex gap-2 overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[.025] p-2">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition ${activeTab === tab ? "bg-volt-yellow text-black shadow-glow" : "text-zinc-400 hover:bg-white/10 hover:text-white"}`}>
              {tab}
            </button>
          ))}
        </section>

        {activeTab === "Visão Geral" && (
          <>
            <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
              <ChartCard title="Evolução do estoque" subtitle="Valor em estoque, entradas e saídas por mês." icon={<BarChart3 size={25} />}>
                <StockLineChart />
              </ChartCard>
              <ChartCard title="Composição por categoria" subtitle="Participação financeira das categorias no estoque." icon={<PieChart size={25} />}>
                <CategoryDonut materials={filtered} />
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_.85fr]">
              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Alertas de reposição</p>
                <div className="mt-5 space-y-3">
                  {filtered.filter((item) => item.stock <= item.minStock || item.status === "Sem estoque").map((item) => (
                    <button key={item.code} onClick={() => { setSelected(item); setModalOpen(true); }} className="w-full rounded-3xl border border-white/10 bg-white/[.035] p-4 text-left transition hover:border-volt-yellow/30">
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                          <Badge className={statusColors[item.status]}>{item.status}</Badge>
                          <p className="mt-3 font-black">{item.name}</p>
                          <p className="mt-1 text-sm text-zinc-500">{item.code} • {item.supplier}</p>
                        </div>
                        <div className="md:text-right">
                          <p className="font-black text-volt-yellow">{item.stock} {item.unit}</p>
                          <p className="mt-1 text-xs text-zinc-500">Mínimo {item.minStock}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Resumo inteligente</p>
                <div className="mt-5 space-y-3">
                  {[
                    `Material mais usado: ${stats.mostUsed?.name ?? "N/A"}`,
                    `Material mais caro: ${stats.mostExpensive?.name ?? "N/A"}`,
                    "DR está sem estoque e deve ser reposto.",
                    "Compras atrasadas podem afetar cotações de automação.",
                    "Materiais reservados precisam ser baixados ao finalizar OS."
                  ].map((alert) => (
                    <div key={alert} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3">
                      <AlertTriangle className="shrink-0 text-volt-yellow" size={18} />
                      <p className="text-sm leading-6 text-zinc-300">{alert}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {activeTab === "Estoque" && (
          <section className="card-premium rounded-[2rem] p-5 md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Estoque atual</p>
                <h2 className="mt-1 text-2xl font-black">Materiais cadastrados</h2>
              </div>
              <Filter className="text-volt-yellow" size={26} />
            </div>

            <div className="volt-scroll overflow-x-auto">
              <table className="w-full min-w-[1200px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[.16em] text-zinc-600">
                    <th className="px-4 py-2">Código</th>
                    <th className="px-4 py-2">Material</th>
                    <th className="px-4 py-2">Categoria</th>
                    <th className="px-4 py-2">Estoque</th>
                    <th className="px-4 py-2">Reservado</th>
                    <th className="px-4 py-2">Disponível</th>
                    <th className="px-4 py-2">Custo médio</th>
                    <th className="px-4 py-2">Valor total</th>
                    <th className="px-4 py-2">Fornecedor</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.code} className="bg-white/[.035] text-sm">
                      <td className="rounded-l-2xl px-4 py-4 font-black text-volt-yellow">{item.code}</td>
                      <td className="px-4 py-4"><p className="font-black">{item.name}</p><p className="text-xs text-zinc-500">{item.brand} • {item.location}</p></td>
                      <td className="px-4 py-4">{item.category}</td>
                      <td className="px-4 py-4 font-black">{item.stock} {item.unit}</td>
                      <td className="px-4 py-4">{item.reserved}</td>
                      <td className="px-4 py-4">{item.stock - item.reserved}</td>
                      <td className="px-4 py-4">{currency(item.averageCost)}</td>
                      <td className="px-4 py-4 font-black text-volt-yellow">{currency(item.stock * item.averageCost)}</td>
                      <td className="px-4 py-4">{item.supplier}</td>
                      <td className="px-4 py-4"><Badge className={statusColors[item.status]}>{item.status}</Badge></td>
                      <td className="rounded-r-2xl px-4 py-4"><button onClick={() => { setSelected(item); setModalOpen(true); }} className="text-xs font-black text-volt-yellow">Detalhes</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "Movimentações" && (
          <section className="card-premium rounded-[2rem] p-5 md:p-6">
            <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Histórico de entradas e saídas</p>
            <div className="mt-5 space-y-3">
              {movementsSeed.map((movement) => (
                <article key={movement.id} className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <Badge className={movement.type.includes("Entrada") ? "bg-volt-ok/15 text-volt-ok border-volt-ok/20" : movement.type.includes("Saída") ? "bg-red-500/15 text-red-300 border-red-500/20" : "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25"}>{movement.type}</Badge>
                      <p className="mt-3 font-black">{movement.material}</p>
                      <p className="mt-1 text-sm text-zinc-500">{movement.id} • {movement.os} • {movement.responsible}</p>
                    </div>
                    <div className="md:text-right">
                      <p className="font-black text-volt-yellow">{movement.quantity} un.</p>
                      <p className="mt-1 text-xs text-zinc-500">{currency(movement.quantity * movement.unitCost)} • {movement.date}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === "Compras" && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {purchasesSeed.map((purchase) => (
              <article key={purchase.id} className="card-premium rounded-[2rem] p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-volt-yellow">{purchase.id}</p>
                    <h3 className="mt-1 text-xl font-black">{purchase.supplier}</h3>
                  </div>
                  <Badge className={purchaseColors[purchase.status]}>{purchase.status}</Badge>
                </div>
                <div className="space-y-3 text-sm">
                  <p className="flex justify-between"><span className="text-zinc-500">Compra</span><strong>{purchase.date}</strong></p>
                  <p className="flex justify-between"><span className="text-zinc-500">Entrega prevista</span><strong>{purchase.expected}</strong></p>
                  <p className="flex justify-between"><span className="text-zinc-500">Pagamento</span><strong>{purchase.payment}</strong></p>
                  <p className="flex justify-between"><span className="text-zinc-500">Total</span><strong className="text-volt-yellow">{currency(purchase.total)}</strong></p>
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-500">{purchase.notes}</p>
              </article>
            ))}
          </section>
        )}

        {activeTab === "Fornecedores" && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {suppliersSeed.map((supplier) => (
              <article key={supplier.name} className="card-premium rounded-[2rem] p-5">
                <Truck className="mb-5 text-volt-yellow" size={30} />
                <h3 className="text-xl font-black">{supplier.fantasy}</h3>
                <p className="mt-1 text-sm text-zinc-500">{supplier.name}</p>
                <div className="mt-5 space-y-3 text-sm">
                  <p className="flex justify-between"><span className="text-zinc-500">Contato</span><strong>{supplier.contact}</strong></p>
                  <p className="flex justify-between"><span className="text-zinc-500">Entrega média</span><strong>{supplier.deliveryDays} dias</strong></p>
                  <p className="flex justify-between"><span className="text-zinc-500">Avaliação</span><strong>{supplier.rating}/5</strong></p>
                  <p className="flex justify-between"><span className="text-zinc-500">Comprado</span><strong className="text-volt-yellow">{currency(supplier.totalBought)}</strong></p>
                </div>
                <a href={`https://wa.me/55${supplier.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-volt-yellow">WhatsApp <ArrowUpRight size={16} /></a>
              </article>
            ))}
          </section>
        )}

        {activeTab === "Reservas por OS" && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.filter((item) => item.reserved > 0).map((item) => (
              <article key={item.code} className="card-premium rounded-[2rem] p-5">
                <PackageCheck className="mb-5 text-volt-yellow" size={30} />
                <h3 className="text-xl font-black">{item.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{item.code} • reservado para OS</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[.035] p-3">
                    <p className="text-2xl font-black text-volt-yellow">{item.reserved}</p>
                    <p className="text-xs text-zinc-500">Reservado</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[.035] p-3">
                    <p className="text-2xl font-black text-volt-yellow">{item.stock - item.reserved}</p>
                    <p className="text-xs text-zinc-500">Disponível</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-zinc-500">Ao finalizar a OS, o sistema deve baixar o usado e devolver o saldo ao estoque.</p>
              </article>
            ))}
          </section>
        )}

        {activeTab === "Inventário" && (
          <section className="card-premium rounded-[2rem] p-5 md:p-6">
            <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Inventário</p>
            <h2 className="mt-1 text-2xl font-black">Conferência de estoque</h2>
            <div className="mt-5 space-y-3">
              {filtered.map((item, index) => {
                const counted = item.stock + (index % 3 === 0 ? -1 : 0);
                const diff = counted - item.stock;
                return (
                  <div key={item.code} className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
                    <div className="grid gap-3 md:grid-cols-5 md:items-center">
                      <div className="md:col-span-2"><p className="font-black">{item.name}</p><p className="text-xs text-zinc-500">{item.code}</p></div>
                      <p className="text-sm">Sistema: <strong>{item.stock}</strong></p>
                      <p className="text-sm">Contado: <strong>{counted}</strong></p>
                      <Badge className={diff === 0 ? "bg-volt-ok/15 text-volt-ok border-volt-ok/20" : "bg-red-500/15 text-red-300 border-red-500/20"}>{diff === 0 ? "Conferido" : "Divergente"}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "Curva ABC" && (
          <section className="grid gap-5 xl:grid-cols-[1fr_.85fr]">
            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Curva ABC</p>
              <div className="mt-5 space-y-4">
                {filtered.sort((a, b) => b.stock * b.averageCost - a.stock * a.averageCost).map((item) => (
                  <div key={item.code} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <p className="font-black">{item.name}</p>
                      <Badge className={item.abc === "A" ? "bg-red-500/15 text-red-300 border-red-500/20" : item.abc === "B" ? "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25" : "bg-volt-ok/15 text-volt-ok border-volt-ok/20"}>Classe {item.abc}</Badge>
                    </div>
                    <p className="mb-2 text-sm text-zinc-500">{currency(item.stock * item.averageCost)} em estoque</p>
                    <ProgressBar value={item.abc === "A" ? 90 : item.abc === "B" ? 60 : 30} />
                  </div>
                ))}
              </div>
            </div>

            <ChartCard title="Recomendação de controle" subtitle="Materiais classe A exigem controle mais rígido e reposição planejada." icon={<BarChart3 size={25} />}>
              <div className="space-y-3">
                {["Classe A: controlar semanalmente e evitar ruptura.", "Classe B: revisar quinzenalmente.", "Classe C: reposição simples conforme consumo.", "Materiais sem estoque devem gerar sugestão de compra."].map((text) => (
                  <div key={text} className="flex gap-3 rounded-2xl border border-white/10 bg-black/35 p-3">
                    <CheckCircle2 className="shrink-0 text-volt-yellow" size={18} />
                    <p className="text-sm leading-6 text-zinc-300">{text}</p>
                  </div>
                ))}
              </div>
            </ChartCard>
          </section>
        )}

        {activeTab === "Relatórios" && (
          <section className="grid gap-5 xl:grid-cols-[1fr_.85fr]">
            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Relatórios de materiais</p>
              <h2 className="mt-2 text-3xl font-black">Estoque executivo</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">Gere relatórios de estoque atual, baixo estoque, sem estoque, compras, fornecedores, inventário, curva ABC e completo executivo.</p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {["Geral de materiais", "Estoque atual", "Estoque baixo", "Sem estoque", "Compras", "Por fornecedor", "Por OS", "Inventário", "Curva ABC", "Completo executivo"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[.035] p-4 font-bold text-zinc-300">{item}</div>
                ))}
              </div>
              <button onClick={() => window.print()} className="btn-primary mt-6 inline-flex items-center gap-2"><FileText size={17} /> Gerar relatório PDF</button>
            </div>

            <ChartCard title="Indicadores do relatório" subtitle="Resumo para tomada de decisão." icon={<ClipboardList size={25} />}>
              <div className="space-y-4">
                {[
                  ["Estoque crítico", (stats.low + stats.zero) / Math.max(filtered.length, 1) * 100],
                  ["Reservados", stats.reserved / Math.max(filtered.reduce((sum, item) => sum + item.stock, 0), 1) * 100],
                  ["Giro de estoque", stats.giro],
                  ["Ruptura", stats.zero / Math.max(filtered.length, 1) * 100]
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                    <div className="mb-2 flex justify-between text-sm font-black"><span>{String(label)}</span><span className="text-volt-yellow">{Math.round(Number(value))}%</span></div>
                    <ProgressBar value={Number(value)} />
                  </div>
                ))}
              </div>
            </ChartCard>
          </section>
        )}

        {modalOpen && selected && (
          <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="volt-scroll max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#080c11] p-5 shadow-2xl">
              <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge className={statusColors[selected.status]}>{selected.status}</Badge>
                    <Badge className={selected.abc === "A" ? "bg-red-500/15 text-red-300 border-red-500/20" : selected.abc === "B" ? "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25" : "bg-volt-ok/15 text-volt-ok border-volt-ok/20"}>Classe {selected.abc}</Badge>
                  </div>
                  <h2 className="text-3xl font-black">{selected.name}</h2>
                  <p className="mt-2 text-sm text-zinc-500">{selected.code} • {selected.category}</p>
                </div>
                <button onClick={() => openEditor(selected)} className="btn-primary">Editar</button>
                  <button onClick={duplicateSelected} className="btn-ghost">Duplicar</button>
                  <button onClick={removeSelected} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">Excluir</button>
                  <button onClick={() => setModalOpen(false)} className="btn-ghost">Fechar</button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  ["Categoria", selected.category],
                  ["Subcategoria", selected.subcategory],
                  ["Marca", selected.brand],
                  ["Unidade", selected.unit],
                  ["Estoque atual", `${selected.stock} ${selected.unit}`],
                  ["Estoque mínimo", selected.minStock],
                  ["Estoque máximo", selected.maxStock],
                  ["Reservado", selected.reserved],
                  ["Disponível", selected.stock - selected.reserved],
                  ["Local", selected.location],
                  ["Fornecedor", selected.supplier],
                  ["Custo unitário", currency(selected.unitCost)],
                  ["Custo médio", currency(selected.averageCost)],
                  ["Venda sugerida", currency(selected.salePrice)],
                  ["Margem desejada", `${selected.desiredMargin}%`],
                  ["Valor total", currency(selected.stock * selected.averageCost)],
                  ["Centro de custo", selected.costCenter],
                  ["Usado no mês", selected.usedMonth]
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{label}</p>
                    <p className="mt-1 font-bold">{String(value)}</p>
                  </div>
                ))}

                <div className="rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 p-4 md:col-span-2">
                  <p className="text-sm font-black text-volt-yellow">Observações</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-300">{selected.notes}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {editOpen && draft && (
          <EditableRecordModal
            title={editingKey ? "Editar registro" : "Novo registro"}
            draft={draft}
            setDraft={setDraft}
            onSave={saveEditor}
            onCancel={() => setEditOpen(false)}
          />
        )}
      </div>
    </AppShell>
  );
}

function WalletIcon({ className, size }: { className?: string; size?: number }) {
  return <Boxes className={className} size={size} />;
}


type EditableRecord = Record<string, unknown>;

function EditableRecordModal({
  title,
  draft,
  setDraft,
  onSave,
  onCancel
}: {
  title: string;
  draft: EditableRecord;
  setDraft: (value: EditableRecord) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  function fieldValue(value: unknown) {
    if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
      return JSON.stringify(value, null, 2);
    }

    return String(value ?? "");
  }

  function parseValue(oldValue: unknown, raw: string) {
    if (typeof oldValue === "number") return Number(raw.replace(",", ".")) || 0;
    if (typeof oldValue === "boolean") return raw === "true";

    if (Array.isArray(oldValue) || (typeof oldValue === "object" && oldValue !== null)) {
      try {
        return JSON.parse(raw);
      } catch {
        return raw.split(",").map((item) => item.trim()).filter(Boolean);
      }
    }

    return raw;
  }

  function updateField(key: string, raw: string) {
    setDraft({
      ...draft,
      [key]: parseValue(draft[key], raw)
    });
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="volt-scroll max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#080c11] p-5 shadow-2xl">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Edição funcional</p>
            <h2 className="mt-2 text-3xl font-black">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Edite os dados, salve e a alteração ficará gravada no navegador.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={onCancel} className="btn-ghost">Cancelar</button>
            <button onClick={onSave} className="btn-primary">Salvar alterações</button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {Object.entries(draft).map(([key, value]) => {
            const isLong = Array.isArray(value) || (typeof value === "object" && value !== null) || key.toLowerCase().includes("notes") || key.toLowerCase().includes("observ");

            return (
              <div key={key} className={`rounded-2xl border border-white/10 bg-white/[.035] p-4 ${isLong ? "md:col-span-2" : ""}`}>
                <label className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{key}</label>

                {typeof value === "boolean" ? (
                  <select
                    value={value ? "true" : "false"}
                    onChange={(event) => updateField(key, event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none focus:border-volt-yellow/40"
                  >
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                ) : isLong ? (
                  <textarea
                    value={fieldValue(value)}
                    onChange={(event) => updateField(key, event.target.value)}
                    rows={5}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold outline-none focus:border-volt-yellow/40"
                  />
                ) : (
                  <input
                    value={fieldValue(value)}
                    onChange={(event) => updateField(key, event.target.value)}
                    type={typeof value === "number" ? "number" : "text"}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold outline-none focus:border-volt-yellow/40"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-5">
          <button onClick={onCancel} className="btn-ghost">Cancelar</button>
          <button onClick={onSave} className="btn-primary">Salvar alterações</button>
        </div>
      </div>
    </div>
  );
}

