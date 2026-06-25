"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Filter,
  FolderOpen,
  Gauge,
  LineChart,
  Package,
  PieChart,
  Plus,
  Search,
  Settings2,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ReportStatus = "Gerado" | "Em processamento" | "Erro" | "Agendado" | "Enviado" | "Arquivado" | "Favorito";
type ReportType = "Executivo" | "Financeiro" | "Operacional" | "Técnico" | "Clientes" | "Materiais" | "Personalizado";

type ReportModel = {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  modules: string[];
  indicators: string[];
  charts: string[];
  tables: string[];
  status: ReportStatus;
};

type ReportHistory = {
  id: string;
  name: string;
  type: ReportType;
  period: string;
  generatedBy: string;
  date: string;
  format: "PDF" | "CSV";
  status: ReportStatus;
};

const models: ReportModel[] = [
  {
    id: "MOD-001",
    name: "Relatório Executivo Mensal",
    type: "Executivo",
    description: "Visão geral da empresa com faturamento, despesas, lucro, clientes, OS, cotações, materiais e metas.",
    modules: ["Financeiro", "Clientes", "OS", "Cotações", "Materiais"],
    indicators: ["Receita", "Despesa", "Lucro", "Margem", "Metas"],
    charts: ["Linha", "Colunas", "Rosca", "KPI"],
    tables: ["Resumo financeiro", "Serviços", "Alertas"],
    status: "Favorito"
  },
  {
    id: "MOD-002",
    name: "Relatório Financeiro Completo",
    type: "Financeiro",
    description: "Receitas, despesas, fluxo de caixa, contas a pagar, contas a receber, centro de custo e orçado x realizado.",
    modules: ["Financeiro", "Centro de custo"],
    indicators: ["Receita", "Despesa", "Lucro", "Inadimplência"],
    charts: ["Linha", "Cascata", "Rosca", "Barras"],
    tables: ["Lançamentos", "Contas", "Centros de custo"],
    status: "Gerado"
  },
  {
    id: "MOD-003",
    name: "Relatório de Ordens de Serviço",
    type: "Operacional",
    description: "Serviços concluídos, pendentes, atrasados, cancelados, produtividade por técnico e custos por OS.",
    modules: ["Ordens", "Agenda", "Técnicos"],
    indicators: ["Conclusão", "Atraso", "Produtividade", "Tempo médio"],
    charts: ["Colunas", "Barras", "KPI"],
    tables: ["OS detalhadas", "Técnicos", "Clientes"],
    status: "Gerado"
  },
  {
    id: "MOD-004",
    name: "Relatório Técnico de Atendimento",
    type: "Técnico",
    description: "Documento técnico com cliente, local, diagnóstico, execução, materiais, fotos, recomendações e assinaturas.",
    modules: ["OS", "Materiais", "Clientes"],
    indicators: ["Tensão", "Corrente", "Potência", "Não conformidades"],
    charts: ["KPI"],
    tables: ["Medições", "Materiais", "Pendências"],
    status: "Agendado"
  },
  {
    id: "MOD-005",
    name: "Relatório de Cliente Individual",
    type: "Clientes",
    description: "Histórico do cliente, OS, cotações, agenda, financeiro, documentos e recomendações de relacionamento.",
    modules: ["Clientes", "Financeiro", "OS", "Cotações"],
    indicators: ["Faturado", "Aberto", "Vencido", "Ticket médio"],
    charts: ["Linha", "Barras"],
    tables: ["Histórico", "Financeiro", "Serviços"],
    status: "Gerado"
  },
  {
    id: "MOD-006",
    name: "Relatório de Estoque",
    type: "Materiais",
    description: "Estoque atual, baixo estoque, sem estoque, compras, fornecedores, movimentações, inventário e curva ABC.",
    modules: ["Materiais", "Compras", "Fornecedores"],
    indicators: ["Valor estoque", "Ruptura", "Giro", "Reservas"],
    charts: ["Linha", "Pareto", "Rosca", "Cascata"],
    tables: ["Estoque", "Movimentações", "Compras"],
    status: "Favorito"
  },
  {
    id: "MOD-007",
    name: "Relatório Completo da Empresa",
    type: "Executivo",
    description: "Relatório completo com todos os módulos, indicadores, gráficos, alertas e recomendações automáticas.",
    modules: ["Todos"],
    indicators: ["Todos os KPIs"],
    charts: ["Todos"],
    tables: ["Todas"],
    status: "Favorito"
  }
];

const history: ReportHistory[] = [
  { id: "REL-001", name: "Executivo mensal Junho", type: "Executivo", period: "Junho/2026", generatedBy: "Guilherme", date: "2026-06-25", format: "PDF", status: "Gerado" },
  { id: "REL-002", name: "Financeiro semanal", type: "Financeiro", period: "Semana atual", generatedBy: "Guilherme", date: "2026-06-24", format: "PDF", status: "Enviado" },
  { id: "REL-003", name: "Estoque crítico", type: "Materiais", period: "Junho/2026", generatedBy: "Guilherme", date: "2026-06-23", format: "CSV", status: "Gerado" },
  { id: "REL-004", name: "OS concluídas", type: "Operacional", period: "Junho/2026", generatedBy: "Guilherme", date: "2026-06-22", format: "PDF", status: "Favorito" },
  { id: "REL-005", name: "Relatório técnico QDC", type: "Técnico", period: "OS-1042", generatedBy: "Guilherme", date: "2026-06-21", format: "PDF", status: "Arquivado" }
];

const monthly = [
  { month: "Jan", receita: 5200, despesa: 2300, lucro: 2900, os: 6, cotacoes: 10 },
  { month: "Fev", receita: 7800, despesa: 3100, lucro: 4700, os: 8, cotacoes: 13 },
  { month: "Mar", receita: 9600, despesa: 4200, lucro: 5400, os: 10, cotacoes: 16 },
  { month: "Abr", receita: 13200, despesa: 5100, lucro: 8100, os: 12, cotacoes: 19 },
  { month: "Mai", receita: 15800, despesa: 6300, lucro: 9500, os: 13, cotacoes: 24 },
  { month: "Jun", receita: 18450, despesa: 7240, lucro: 11210, os: 14, cotacoes: 28 }
];

const ranking = [
  { label: "Condomínio JK 1455", value: 24800 },
  { label: "Escritório corporativo", value: 11800 },
  { label: "Clínica Vida", value: 9800 },
  { label: "Sala Vikings", value: 1600 },
  { label: "Cliente residencial", value: 1670 }
];

const tabs = [
  "Visão Geral",
  "Relatórios Executivos",
  "Relatórios Financeiros",
  "Relatórios Operacionais",
  "Relatórios Técnicos",
  "Relatórios de Clientes",
  "Relatórios de Materiais",
  "Relatórios Personalizados",
  "Histórico de Relatórios"
];

const statusColors: Record<ReportStatus, string> = {
  Gerado: "bg-volt-ok/15 text-volt-ok border-volt-ok/20",
  "Em processamento": "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25",
  Erro: "bg-red-500/15 text-red-300 border-red-500/20",
  Agendado: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  Enviado: "bg-purple-500/15 text-purple-300 border-purple-500/20",
  Arquivado: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  Favorito: "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25"
};

const typeColors: Record<ReportType, string> = {
  Executivo: "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25",
  Financeiro: "bg-volt-ok/15 text-volt-ok border-volt-ok/20",
  Operacional: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  Técnico: "bg-purple-500/15 text-purple-300 border-purple-500/20",
  Clientes: "bg-orange-500/15 text-orange-300 border-orange-500/20",
  Materiais: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
  Personalizado: "bg-white/10 text-zinc-300 border-white/10"
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
          <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Business intelligence</p>
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{subtitle}</p>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-volt-yellow/25 bg-volt-yellow/10 text-volt-yellow">{icon}</div>
      </div>
      {children}
    </section>
  );
}

function MainLineChart() {
  const width = 760;
  const height = 270;
  const pad = 34;
  const max = Math.max(...monthly.flatMap((item) => [item.receita, item.despesa, item.lucro]));

  function points(key: "receita" | "despesa" | "lucro") {
    return monthly.map((item, index) => {
      const x = pad + (index * (width - pad * 2)) / (monthly.length - 1);
      const y = height - pad - (item[key] / max) * (height - pad * 2);
      return `${x},${y}`;
    }).join(" ");
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[270px] w-full">
        {[0, 1, 2, 3].map((line) => {
          const y = pad + (line * (height - pad * 2)) / 3;
          return <line key={line} x1={pad} x2={width - pad} y1={y} y2={y} stroke="rgba(255,255,255,.08)" />;
        })}
        <polyline fill="none" stroke="#ffcb2f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" points={points("receita")} />
        <polyline fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points("despesa")} />
        <polyline fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points("lucro")} />
        {monthly.map((item, index) => {
          const x = pad + (index * (width - pad * 2)) / (monthly.length - 1);
          return <text key={item.month} x={x} y={height - 6} textAnchor="middle" fill="rgba(255,255,255,.55)" fontSize="13" fontWeight="700">{item.month}</text>;
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-zinc-400">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-volt-yellow" /> Receita</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-red-500" /> Despesa</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-volt-ok" /> Lucro</span>
      </div>
    </div>
  );
}

function ColumnCompare() {
  const max = Math.max(...monthly.flatMap((item) => [item.os, item.cotacoes]));

  return (
    <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
      <div className="flex h-[260px] items-end gap-3">
        {monthly.map((item) => (
          <div key={item.month} className="flex flex-1 flex-col items-center gap-3">
            <div className="flex h-52 w-full items-end justify-center gap-2">
              <div className="w-5 rounded-t-full bg-volt-yellow" style={{ height: `${(item.cotacoes / max) * 100}%` }} />
              <div className="w-5 rounded-t-full bg-volt-ok" style={{ height: `${(item.os / max) * 100}%` }} />
            </div>
            <span className="text-xs font-bold text-zinc-500">{item.month}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-zinc-400">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-volt-yellow" /> Cotações</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-volt-ok" /> OS</span>
      </div>
    </div>
  );
}

function DonutComposition() {
  const data = [
    { label: "QDC", value: 34, color: "#ffcb2f" },
    { label: "Manutenção", value: 24, color: "#22c55e" },
    { label: "Circuitos", value: 18, color: "#38bdf8" },
    { label: "Automação", value: 12, color: "#a78bfa" },
    { label: "Iluminação", value: 12, color: "#f97316" }
  ];
  let start = 0;
  const conic = `conic-gradient(${data.map((item) => {
    const end = start + item.value;
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
              <p className="text-3xl font-black text-volt-yellow">100%</p>
              <p className="text-xs font-bold text-zinc-500">serviços</p>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/35 p-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm font-bold text-zinc-300">{item.label}</span>
            </div>
            <span className="font-black">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingBars() {
  const max = Math.max(...ranking.map((item) => item.value));

  return (
    <div className="space-y-4">
      {ranking.map((item) => (
        <div key={item.label} className="rounded-2xl border border-white/10 bg-black/35 p-4">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="font-black">{item.label}</p>
            <p className="text-sm font-black text-volt-yellow">{currency(item.value)}</p>
          </div>
          <ProgressBar value={(item.value / max) * 100} />
        </div>
      ))}
    </div>
  );
}

function CashWaterfall() {
  const data = [
    { label: "Saldo inicial", value: 4200, type: "base" },
    { label: "Receitas", value: 18450, type: "positive" },
    { label: "Despesas", value: -7240, type: "negative" },
    { label: "Materiais", value: -2860, type: "negative" },
    { label: "Saldo final", value: 12550, type: "base" }
  ];
  const max = Math.max(...data.map((item) => Math.abs(item.value)));

  return (
    <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
      <div className="grid h-72 grid-cols-5 items-end gap-3">
        {data.map((item) => (
          <div key={item.label} className="flex h-full flex-col justify-end gap-3">
            <div className={`rounded-t-2xl ${item.type === "negative" ? "bg-red-400" : item.type === "positive" ? "bg-volt-ok" : "bg-volt-yellow"}`} style={{ height: `${(Math.abs(item.value) / max) * 80 + 12}%` }} />
            <p className="text-center text-xs font-bold text-zinc-500">{item.label}</p>
            <p className="text-center text-xs font-black text-zinc-300">{currency(item.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportCard({ model, onGenerate }: { model: ReportModel; onGenerate: (model: ReportModel) => void }) {
  return (
    <article className="card-premium rounded-[2rem] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-volt-yellow/25 bg-volt-yellow/10 text-volt-yellow">
          <FileText size={24} />
        </div>
        <Badge className={typeColors[model.type]}>{model.type}</Badge>
      </div>

      <h3 className="text-xl font-black">{model.name}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{model.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {model.modules.slice(0, 4).map((module) => (
          <span key={module} className="rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-xs font-bold text-zinc-400">{module}</span>
        ))}
      </div>

      <button onClick={() => onGenerate(model)} className="btn-primary mt-5 w-full">
        Gerar agora
      </button>
    </article>
  );
}

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState("Visão Geral");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [periodFilter, setPeriodFilter] = useState("Mês atual");
  const [generated, setGenerated] = useState<ReportHistory[]>(history);
  const [selected, setSelected] = useState<ReportModel | null>(models[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("volt_relatorios_premium_v1");
      if (saved) {
        const parsed = JSON.parse(saved) as ReportHistory[];
        if (Array.isArray(parsed)) setGenerated(parsed);
      }
    } catch {
      setGenerated(history);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem("volt_relatorios_premium_v1", JSON.stringify(generated));
  }, [storageReady, generated]);

  function removeLastReport() {
    if (!window.confirm("Excluir o relatório mais recente do histórico?")) return;
    setGenerated((current) => current.slice(1));
  }


  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      const text = `${model.name} ${model.type} ${model.description} ${model.modules.join(" ")}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesType = typeFilter === "Todos" || model.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [search, typeFilter]);

  const stats = useMemo(() => {
    const revenue = monthly[monthly.length - 1].receita;
    const expense = monthly[monthly.length - 1].despesa;
    const profit = monthly[monthly.length - 1].lucro;
    const margin = Math.round((profit / revenue) * 100);
    const os = monthly[monthly.length - 1].os;
    const quotes = monthly[monthly.length - 1].cotacoes;
    return {
      totalReports: generated.length,
      os,
      quotes,
      revenue,
      expense,
      profit,
      margin,
      clients: 38,
      servicesDone: 14,
      servicesPending: 6,
      materialCost: 2860,
      quoteApproval: 67,
      osConclusion: 78,
      lateRate: 8,
      goal: 74
    };
  }, [generated]);

  function generateReport(model: ReportModel) {
    const next: ReportHistory = {
      id: `REL-${String(generated.length + 1).padStart(3, "0")}`,
      name: model.name,
      type: model.type,
      period: periodFilter,
      generatedBy: "Guilherme",
      date: new Date().toISOString().slice(0, 10),
      format: "PDF",
      status: "Gerado"
    };

    setGenerated((current) => [next, ...current]);
    setSelected(model);
    setModalOpen(true);
  }

  function exportCsv() {
    const header = ["ID", "Nome", "Tipo", "Período", "Gerado por", "Data", "Formato", "Status"];
    const rows = generated.map((item) => [item.id, item.name, item.type, item.period, item.generatedBy, item.date, item.format, item.status]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relatorios-volt.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const currentType =
    activeTab === "Relatórios Executivos" ? "Executivo" :
    activeTab === "Relatórios Financeiros" ? "Financeiro" :
    activeTab === "Relatórios Operacionais" ? "Operacional" :
    activeTab === "Relatórios Técnicos" ? "Técnico" :
    activeTab === "Relatórios de Clientes" ? "Clientes" :
    activeTab === "Relatórios de Materiais" ? "Materiais" :
    null;

  const tabModels = currentType ? filteredModels.filter((model) => model.type === currentType) : filteredModels;

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111821] via-[#080c11] to-black p-5 shadow-soft md:p-7">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-volt-yellow/20 blur-[130px]" />
          <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Central de BI</p>
              <h1 className="mt-2 text-4xl font-black leading-tight md:text-5xl">Relatórios</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                Relatórios gerenciais, técnicos, financeiros, operacionais e comerciais com filtros, gráficos, histórico, modelos prontos e PDF executivo.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
              <button onClick={() => setActiveTab("Relatórios Personalizados")} className="btn-primary inline-flex items-center justify-center gap-2"><Plus size={17} /> Novo relatório</button>
              <button onClick={() => generateReport(models[0])} className="btn-ghost inline-flex items-center justify-center gap-2"><FileText size={17} /> Relatório executivo</button>
              <button onClick={exportCsv} className="btn-ghost inline-flex items-center justify-center gap-2"><Download size={17} /> Exportar CSV</button>
              <button onClick={removeLastReport} className="btn-ghost inline-flex items-center justify-center gap-2">Excluir último</button>
              <button onClick={() => window.print()} className="btn-ghost inline-flex items-center justify-center gap-2"><FileText size={17} /> Gerar PDF</button>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[.025] p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[.7fr_.7fr_1.4fr]">
            <select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
              {["Hoje", "Semana atual", "Mês atual", "Mês anterior", "Trimestre", "Semestre", "Ano atual", "Personalizado"].map((period) => <option key={period}>{period}</option>)}
            </select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
              {["Todos", "Executivo", "Financeiro", "Operacional", "Técnico", "Clientes", "Materiais", "Personalizado"].map((type) => <option key={type}>{type}</option>)}
            </select>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
              <Search size={17} className="text-volt-yellow" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar relatório, cliente, OS, cotação, serviço ou observação..." className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600" />
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
          {[
            ["Relatórios", stats.totalReports, FileText, "text-volt-yellow", "gerados"],
            ["OS período", stats.os, ClipboardCheck, "text-blue-300", "mês"],
            ["Cotações", stats.quotes, FileText, "text-purple-300", "mês"],
            ["Faturamento", currency(stats.revenue), Wallet, "text-volt-yellow", "+18%"],
            ["Despesas", currency(stats.expense), AlertTriangle, "text-red-300", "+7%"],
            ["Lucro", currency(stats.profit), TrendingUp, "text-volt-ok", `${stats.margin}%`],
            ["Clientes", stats.clients, Users, "text-volt-ok", "ativos"],
            ["Meta", `${stats.goal}%`, Target, "text-volt-yellow", "mensal"]
          ].map(([label, value, Icon, color, note]) => {
            const IconComp = Icon as typeof FileText;
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
              <ChartCard title="Evolução mensal" subtitle="Receita, despesa e lucro ao longo do tempo." icon={<LineChart size={25} />}>
                <MainLineChart />
              </ChartCard>

              <ChartCard title="Ranking de clientes" subtitle="Maiores clientes por faturamento no período." icon={<BarChart3 size={25} />}>
                <RankingBars />
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
              <ChartCard title="Composição do faturamento" subtitle="Participação dos serviços no resultado." icon={<PieChart size={25} />}>
                <DonutComposition />
              </ChartCard>

              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Últimos relatórios</p>
                <div className="mt-5 space-y-3">
                  {generated.slice(0, 5).map((report) => (
                    <div key={report.id} className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                          <div className="mb-2 flex flex-wrap gap-2">
                            <Badge className={typeColors[report.type]}>{report.type}</Badge>
                            <Badge className={statusColors[report.status]}>{report.status}</Badge>
                          </div>
                          <p className="font-black">{report.name}</p>
                          <p className="mt-1 text-sm text-zinc-500">{report.period} • {report.date}</p>
                        </div>
                        <button className="text-sm font-black text-volt-yellow">Abrir</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_.85fr]">
              <ChartCard title="Comparação operacional" subtitle="Cotações emitidas x ordens de serviço concluídas." icon={<BarChart3 size={25} />}>
                <ColumnCompare />
              </ChartCard>

              <ChartCard title="Fluxo de caixa" subtitle="Cascata de saldo inicial, receitas, despesas, materiais e saldo final." icon={<Gauge size={25} />}>
                <CashWaterfall />
              </ChartCard>
            </section>
          </>
        )}

        {["Relatórios Executivos", "Relatórios Financeiros", "Relatórios Operacionais", "Relatórios Técnicos", "Relatórios de Clientes", "Relatórios de Materiais"].includes(activeTab) && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tabModels.map((model) => <ReportCard key={model.id} model={model} onGenerate={generateReport} />)}
          </section>
        )}

        {activeTab === "Relatórios Personalizados" && (
          <section className="grid gap-5 xl:grid-cols-[1fr_.85fr]">
            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Construtor de relatório</p>
                  <h2 className="mt-1 text-2xl font-black">Monte um relatório personalizado</h2>
                </div>
                <Settings2 className="text-volt-yellow" size={28} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  "Nome do relatório",
                  "Módulo base",
                  "Período",
                  "Cliente",
                  "Técnico",
                  "Status",
                  "Centro de custo",
                  "Colunas exibidas",
                  "Gráficos incluídos",
                  "Indicadores incluídos",
                  "Agrupamento",
                  "Ordenação"
                ].map((field) => (
                  <div key={field} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                    <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{field}</p>
                    <p className="mt-2 text-sm font-bold text-zinc-300">Configuração preparada</p>
                  </div>
                ))}
              </div>

              <button onClick={() => generateReport({
                id: "MOD-CUSTOM",
                name: "Relatório Personalizado",
                type: "Personalizado",
                description: "Relatório montado pelo usuário com filtros, colunas, gráficos e indicadores escolhidos.",
                modules: ["Personalizado"],
                indicators: ["Selecionados"],
                charts: ["Selecionados"],
                tables: ["Selecionadas"],
                status: "Gerado"
              })} className="btn-primary mt-6 inline-flex items-center gap-2">
                <FileText size={17} /> Gerar relatório personalizado
              </button>
            </div>

            <div className="space-y-5">
              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Módulos disponíveis</p>
                <div className="mt-5 grid gap-3">
                  {["Clientes", "Agenda", "Ordens de serviço", "Cotações", "Materiais", "Financeiro", "Centro de custo", "Técnicos", "Fornecedores"].map((module) => (
                    <div key={module} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3">
                      <CheckCircle2 className="text-volt-yellow" size={18} />
                      <span className="text-sm font-bold text-zinc-300">{module}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Análises automáticas</p>
                <div className="mt-5 space-y-3">
                  {["Receita cresceu em relação ao mês anterior.", "Despesa de materiais precisa de atenção.", "Cotações vencidas precisam de follow-up.", "Clientes inadimplentes devem ser cobrados.", "Estoque crítico deve ser reposto."].map((alert) => (
                    <div key={alert} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3">
                      <AlertTriangle className="shrink-0 text-volt-yellow" size={18} />
                      <p className="text-sm leading-6 text-zinc-300">{alert}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "Histórico de Relatórios" && (
          <section className="card-premium rounded-[2rem] p-5 md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Histórico</p>
                <h2 className="mt-1 text-2xl font-black">Relatórios gerados</h2>
              </div>
              <Filter className="text-volt-yellow" size={26} />
            </div>

            <div className="volt-scroll overflow-x-auto">
              <table className="w-full min-w-[1050px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[.16em] text-zinc-600">
                    <th className="px-4 py-2">Relatório</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Período</th>
                    <th className="px-4 py-2">Gerado por</th>
                    <th className="px-4 py-2">Data</th>
                    <th className="px-4 py-2">Formato</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {generated.map((report) => (
                    <tr key={report.id} className="bg-white/[.035] text-sm">
                      <td className="rounded-l-2xl px-4 py-4"><p className="font-black">{report.name}</p><p className="text-xs text-zinc-500">{report.id}</p></td>
                      <td className="px-4 py-4"><Badge className={typeColors[report.type]}>{report.type}</Badge></td>
                      <td className="px-4 py-4">{report.period}</td>
                      <td className="px-4 py-4">{report.generatedBy}</td>
                      <td className="px-4 py-4">{report.date}</td>
                      <td className="px-4 py-4 font-black text-volt-yellow">{report.format}</td>
                      <td className="px-4 py-4"><Badge className={statusColors[report.status]}>{report.status}</Badge></td>
                      <td className="rounded-r-2xl px-4 py-4"><button onClick={() => window.print()} className="text-xs font-black text-volt-yellow">Baixar PDF</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {modalOpen && selected && (
          <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="volt-scroll max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#080c11] p-5 shadow-2xl">
              <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge className={typeColors[selected.type]}>{selected.type}</Badge>
                    <Badge className={statusColors[selected.status]}>{selected.status}</Badge>
                  </div>
                  <h2 className="text-3xl font-black">{selected.name}</h2>
                  <p className="mt-2 text-sm text-zinc-500">{selected.id} • {periodFilter}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2"><FileText size={17} /> Gerar PDF</button>
                  <button onClick={() => setModalOpen(false)} className="btn-ghost">Fechar</button>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.85fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Descrição</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">{selected.description}</p>
                  </div>

                  {[
                    ["Módulos incluídos", selected.modules.join(", ")],
                    ["Indicadores", selected.indicators.join(", ")],
                    ["Gráficos", selected.charts.join(", ")],
                    ["Tabelas", selected.tables.join(", ")],
                    ["Período analisado", periodFilter],
                    ["Responsável", "Guilherme Santana"]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                      <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{label}</p>
                      <p className="mt-1 font-bold">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 p-4">
                    <p className="text-sm font-black text-volt-yellow">Estrutura do PDF</p>
                    <div className="mt-4 space-y-2">
                      {["Capa", "Sumário", "Resumo executivo", "Indicadores", "Gráficos", "Tabelas", "Alertas", "Recomendações"].map((item) => (
                        <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-black/25 p-3">
                          <CheckCircle2 className="shrink-0 text-volt-yellow" size={18} />
                          <p className="text-sm font-bold text-zinc-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <p className="text-sm font-black text-volt-yellow">Recomendações automáticas</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">
                      Reduzir custos em centros críticos, fazer follow-up em cotações paradas, repor materiais críticos, cobrar inadimplentes e priorizar clientes recorrentes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
