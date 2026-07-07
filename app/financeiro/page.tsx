"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Filter,
  Gauge,
  LineChart,
  PieChart,
  Plus,
  Receipt,
  Search,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap
} from "lucide-react";
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";

type TransactionType = "Receita" | "Despesa" | "Conta a pagar" | "Conta a receber";
type TransactionStatus = "Aberto" | "Pago" | "Recebido" | "Vencido" | "Cancelado";

type Transaction = {
  id: string;
  type: TransactionType;
  title: string;
  clientSupplier: string;
  costCenter: string;
  category: string;
  budgeted: number;
  actual: number;
  competenceDate: string;
  dueDate: string;
  paymentDate: string;
  status: TransactionStatus;
  paymentMethod: string;
  serviceOrder: string;
  quote: string;
  recurrence: string;
  responsible: string;
  notes: string;
};

type CostCenter = {
  code: string;
  name: string;
  type: string;
  responsible: string;
  monthlyBudget: number;
  annualBudget: number;
  monthlyActual: number;
  annualActual: number;
  notes: string;
};

type GoalPeriod = "Mensal" | "Anual";
type GoalCategory = "Faturamento" | "Lucro" | "Despesa" | "Personalizada";

type FinancialGoal = {
  id: string;
  title: string;
  period: GoalPeriod;
  category: GoalCategory;
  target: number;
  actual: number;
  notes: string;
};

const transactionsSeed: Transaction[] = [
  {
    id: "FIN-001",
    type: "Receita",
    title: "OS-1042 Organização de QDC",
    clientSupplier: "Condomínio JK 1455",
    costCenter: "Serviços técnicos",
    category: "Quadros/QDC",
    budgeted: 1850,
    actual: 1850,
    competenceDate: "2026-06-25",
    dueDate: "2026-06-28",
    paymentDate: "2026-06-25",
    status: "Recebido",
    paymentMethod: "Pix",
    serviceOrder: "OS-1042",
    quote: "COT-221",
    recurrence: "Única",
    responsible: "Guilherme Santana",
    notes: "Receita vinculada à OS de organização de quadro elétrico."
  },
  {
    id: "FIN-002",
    type: "Receita",
    title: "Circuito dedicado micro-ondas",
    clientSupplier: "Cliente residencial",
    costCenter: "Serviços técnicos",
    category: "Circuito dedicado",
    budgeted: 420,
    actual: 0,
    competenceDate: "2026-06-26",
    dueDate: "2026-06-29",
    paymentDate: "",
    status: "Aberto",
    paymentMethod: "Pix",
    serviceOrder: "OS-1043",
    quote: "COT-224",
    recurrence: "Única",
    responsible: "Guilherme Santana",
    notes: "Aguardando execução e recebimento."
  },
  {
    id: "FIN-003",
    type: "Despesa",
    title: "Compra de disjuntores e barramentos",
    clientSupplier: "Fornecedor elétrico",
    costCenter: "Materiais elétricos",
    category: "Materiais",
    budgeted: 900,
    actual: 1040,
    competenceDate: "2026-06-20",
    dueDate: "2026-06-20",
    paymentDate: "2026-06-20",
    status: "Pago",
    paymentMethod: "Cartão",
    serviceOrder: "OS-1042",
    quote: "Sem cotação",
    recurrence: "Única",
    responsible: "Guilherme Santana",
    notes: "Compra acima do previsto por inclusão de barramento extra."
  },
  {
    id: "FIN-004",
    type: "Conta a pagar",
    title: "Combustível e deslocamento",
    clientSupplier: "Posto",
    costCenter: "Transporte",
    category: "Combustível",
    budgeted: 450,
    actual: 380,
    competenceDate: "2026-06-22",
    dueDate: "2026-06-30",
    paymentDate: "",
    status: "Aberto",
    paymentMethod: "Cartão",
    serviceOrder: "Operação",
    quote: "Sem cotação",
    recurrence: "Mensal",
    responsible: "Guilherme Santana",
    notes: "Custos de deslocamento de atendimentos."
  },
  {
    id: "FIN-005",
    type: "Conta a receber",
    title: "Automação iluminação sala comercial",
    clientSupplier: "Sala Comercial Vikings",
    costCenter: "Comercial",
    category: "Automação",
    budgeted: 1600,
    actual: 0,
    competenceDate: "2026-06-28",
    dueDate: "2026-07-05",
    paymentDate: "",
    status: "Aberto",
    paymentMethod: "Transferência",
    serviceOrder: "OS-1045",
    quote: "COT-230",
    recurrence: "Única",
    responsible: "Guilherme Santana",
    notes: "Receita prevista para automação residencial/comercial."
  },
  {
    id: "FIN-006",
    type: "Despesa",
    title: "Ferramentas e EPI",
    clientSupplier: "Fornecedor ferramentas",
    costCenter: "Ferramentas e EPI",
    category: "Ferramentas",
    budgeted: 700,
    actual: 820,
    competenceDate: "2026-06-12",
    dueDate: "2026-06-12",
    paymentDate: "2026-06-12",
    status: "Pago",
    paymentMethod: "Pix",
    serviceOrder: "Estoque",
    quote: "Sem cotação",
    recurrence: "Única",
    responsible: "Guilherme Santana",
    notes: "Reposição para equipe técnica."
  },
  {
    id: "FIN-007",
    type: "Receita",
    title: "Manutenção iluminação LED",
    clientSupplier: "Escritório corporativo",
    costCenter: "Serviços técnicos",
    category: "Iluminação",
    budgeted: 690,
    actual: 690,
    competenceDate: "2026-06-24",
    dueDate: "2026-06-24",
    paymentDate: "2026-06-24",
    status: "Recebido",
    paymentMethod: "Pix",
    serviceOrder: "OS-1035",
    quote: "COT-190",
    recurrence: "Única",
    responsible: "Guilherme Santana",
    notes: "Serviço finalizado e recebido."
  },
  {
    id: "FIN-008",
    type: "Conta a receber",
    title: "Adequação DR/DPS residencial",
    clientSupplier: "Cliente residencial",
    costCenter: "Serviços técnicos",
    category: "Proteção elétrica",
    budgeted: 2300,
    actual: 0,
    competenceDate: "2026-06-18",
    dueDate: "2026-06-21",
    paymentDate: "",
    status: "Vencido",
    paymentMethod: "Boleto",
    serviceOrder: "OS-1039",
    quote: "COT-210",
    recurrence: "Única",
    responsible: "Guilherme Santana",
    notes: "Cliente com vencimento em aberto."
  }
];

const costCentersSeed: CostCenter[] = [
  { code: "CC-001", name: "Materiais elétricos", type: "Operacional", responsible: "Guilherme", monthlyBudget: 3200, annualBudget: 38400, monthlyActual: 2860, annualActual: 14900, notes: "Cabos, disjuntores, tomadas, DR, DPS e quadros." },
  { code: "CC-002", name: "Ferramentas e EPI", type: "Operacional", responsible: "Guilherme", monthlyBudget: 900, annualBudget: 10800, monthlyActual: 820, annualActual: 4300, notes: "Ferramentas, EPIs e reposição técnica." },
  { code: "CC-003", name: "Transporte", type: "Operacional", responsible: "Guilherme", monthlyBudget: 750, annualBudget: 9000, monthlyActual: 380, annualActual: 2900, notes: "Combustível, estacionamento e deslocamento." },
  { code: "CC-004", name: "Marketing", type: "Comercial", responsible: "Guilherme", monthlyBudget: 600, annualBudget: 7200, monthlyActual: 280, annualActual: 1600, notes: "Site, tráfego, identidade e divulgação." },
  { code: "CC-005", name: "Administrativo", type: "Gestão", responsible: "Guilherme", monthlyBudget: 500, annualBudget: 6000, monthlyActual: 420, annualActual: 2100, notes: "Sistemas, documentos e operação interna." }
];

const monthlyData = [
  { month: "Jan", receita: 5200, despesa: 2300, lucro: 2900, orcado: 6500 },
  { month: "Fev", receita: 7800, despesa: 3100, lucro: 4700, orcado: 8000 },
  { month: "Mar", receita: 9600, despesa: 4200, lucro: 5400, orcado: 9800 },
  { month: "Abr", receita: 13200, despesa: 5100, lucro: 8100, orcado: 12500 },
  { month: "Mai", receita: 15800, despesa: 6300, lucro: 9500, orcado: 16000 },
  { month: "Jun", receita: 18450, despesa: 7240, lucro: 11210, orcado: 25000 }
];

const goalsSeed: FinancialGoal[] = [
  {
    id: "META-001",
    title: "Meta mensal de faturamento",
    period: "Mensal",
    category: "Faturamento",
    target: 25000,
    actual: 18450,
    notes: "Meta principal de receita mensal."
  },
  {
    id: "META-002",
    title: "Meta mensal de lucro",
    period: "Mensal",
    category: "Lucro",
    target: 14000,
    actual: 11210,
    notes: "Meta de margem/lucro mensal."
  },
  {
    id: "META-003",
    title: "Meta anual de faturamento",
    period: "Anual",
    category: "Faturamento",
    target: 220000,
    actual: 70050,
    notes: "Meta de faturamento acumulado no ano."
  },
  {
    id: "META-004",
    title: "Limite mensal de despesas",
    period: "Mensal",
    category: "Despesa",
    target: 9000,
    actual: 7240,
    notes: "Controle de teto mensal para custos e despesas."
  }
];

const tabs = [
  "Visão Geral",
  "Lançamentos",
  "Contas a Pagar",
  "Contas a Receber",
  "Centro de Custo",
  "Orçado x Realizado",
  "Metas",
  "Fluxo de Caixa",
  "Relatórios"
];

const statusColors: Record<TransactionStatus, string> = {
  Aberto: "bg-white/10 text-zinc-300 border-white/10",
  Pago: "bg-volt-ok/15 text-volt-ok border-volt-ok/20",
  Recebido: "bg-volt-ok/15 text-volt-ok border-volt-ok/20",
  Vencido: "bg-red-500/15 text-red-300 border-red-500/20",
  Cancelado: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"
};

const typeColors: Record<TransactionType, string> = {
  Receita: "bg-volt-ok/15 text-volt-ok border-volt-ok/20",
  Despesa: "bg-red-500/15 text-red-300 border-red-500/20",
  "Conta a pagar": "bg-orange-500/15 text-orange-300 border-orange-500/20",
  "Conta a receber": "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25"
};

function currency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function percent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function getMonthKey(dateText: string) {
  if (!dateText) return "Sem data";

  return dateText.slice(0, 7);
}

function getMonthLabel(monthKey: string) {
  if (monthKey === "Sem data") return "Sem data";

  const [year, month] = monthKey.split("-");

  if (!year || !month) return monthKey;

  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
}

function safeProgress(value: number, total: number) {
  if (!total) return 0;

  return (value / total) * 100;
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
          <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Análise</p>
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{subtitle}</p>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-volt-yellow/25 bg-volt-yellow/10 text-volt-yellow">{icon}</div>
      </div>
      {children}
    </section>
  );
}

function LineFinanceChart() {
  const width = 760;
  const height = 270;
  const pad = 34;
  const max = Math.max(...monthlyData.flatMap((item) => [item.receita, item.despesa, item.lucro]));

  function points(key: "receita" | "despesa" | "lucro") {
    return monthlyData
      .map((item, index) => {
        const x = pad + (index * (width - pad * 2)) / (monthlyData.length - 1);
        const y = height - pad - (item[key] / max) * (height - pad * 2);
        return `${x},${y}`;
      })
      .join(" ");
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

        {monthlyData.map((item, index) => {
          const x = pad + (index * (width - pad * 2)) / (monthlyData.length - 1);
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

function BudgetColumnChart() {
  const max = Math.max(...monthlyData.flatMap((item) => [item.orcado, item.receita]));

  return (
    <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
      <div className="flex h-[260px] items-end gap-3">
        {monthlyData.map((item) => (
          <div key={item.month} className="flex flex-1 flex-col items-center gap-3">
            <div className="flex h-52 w-full items-end justify-center gap-2">
              <div className="w-5 rounded-t-full bg-white/25" style={{ height: `${(item.orcado / max) * 100}%` }} />
              <div className="w-5 rounded-t-full bg-volt-yellow" style={{ height: `${(item.receita / max) * 100}%` }} />
            </div>
            <span className="text-xs font-bold text-zinc-500">{item.month}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-zinc-400">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-white/25" /> Orçado</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-volt-yellow" /> Realizado</span>
      </div>
    </div>
  );
}

function DonutChart() {
  const data = [
    { label: "Materiais", value: 36, color: "#ffcb2f" },
    { label: "Ferramentas", value: 18, color: "#22c55e" },
    { label: "Transporte", value: 14, color: "#38bdf8" },
    { label: "Marketing", value: 10, color: "#a78bfa" },
    { label: "Administrativo", value: 8, color: "#f97316" },
    { label: "Outros", value: 14, color: "#71717a" }
  ];

  let start = 0;
  const conic = `conic-gradient(${data
    .map((item) => {
      const end = start + item.value;
      const part = `${item.color} ${start}% ${end}%`;
      start = end;
      return part;
    })
    .join(", ")})`;

  return (
    <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-center">
      <div className="mx-auto grid h-56 w-56 place-items-center rounded-full border border-white/10 bg-black/30 p-4">
        <div className="grid h-48 w-48 place-items-center rounded-full" style={{ background: conic }}>
          <div className="grid h-28 w-28 place-items-center rounded-full border border-white/10 bg-[#090d12] text-center">
            <div>
              <p className="text-3xl font-black text-volt-yellow">100%</p>
              <p className="text-xs font-bold text-zinc-500">despesas</p>
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

function CashFlowWaterfall() {
  const data = [
    { label: "Saldo inicial", value: 4200, type: "base" },
    { label: "Receitas", value: 18450, type: "positive" },
    { label: "Despesas", value: -7240, type: "negative" },
    { label: "Impostos", value: -1380, type: "negative" },
    { label: "Saldo final", value: 14030, type: "base" }
  ];

  const max = Math.max(...data.map((item) => Math.abs(item.value)));

  return (
    <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
      <div className="grid h-72 grid-cols-5 items-end gap-3">
        {data.map((item) => (
          <div key={item.label} className="flex h-full flex-col justify-end gap-3">
            <div
              className={`rounded-t-2xl ${item.type === "negative" ? "bg-red-400" : item.type === "positive" ? "bg-volt-ok" : "bg-volt-yellow"}`}
              style={{ height: `${(Math.abs(item.value) / max) * 80 + 12}%` }}
            />
            <p className="text-center text-xs font-bold text-zinc-500">{item.label}</p>
            <p className="text-center text-xs font-black text-zinc-300">{currency(item.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


const FINANCE_STORAGE_KEY = "volt_financeiro_premium_v1";
const FINANCE_QUEUE_KEY = "volt_financeiro_lancamentos_v1";
const GOALS_STORAGE_KEY = "volt_financeiro_metas_v1";
const ORDERS_STORAGE_KEY = "volt_ordens_premium_v1";

function mergeTransactions(base: Transaction[], incoming: Transaction[]) {
  const map = new Map<string, Transaction>();

  [...incoming, ...base].forEach((transaction) => {
    const key = transaction.serviceOrder && transaction.serviceOrder !== "Sem OS"
      ? transaction.serviceOrder
      : transaction.id;

    if (!map.has(key)) {
      map.set(key, transaction);
    }
  });

  return Array.from(map.values());
}

function readFinanceFromStorage() {
  const saved = localStorage.getItem(FINANCE_STORAGE_KEY);
  const parsed = saved ? JSON.parse(saved) : null;

  return Array.isArray(parsed) ? parsed as Transaction[] : transactionsSeed;
}

function readFinanceQueue() {
  const saved = localStorage.getItem(FINANCE_QUEUE_KEY);
  const parsed = saved ? JSON.parse(saved) : null;

  return Array.isArray(parsed) ? parsed as Transaction[] : [];
}



function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function syncLinkedOrderPaymentFromFinance(transaction: Transaction) {
  if (!transaction.serviceOrder || transaction.serviceOrder === "Sem OS") return false;

  const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
  const parsed = saved ? JSON.parse(saved) : [];

  if (!Array.isArray(parsed)) return false;

  const amount = transaction.actual || transaction.budgeted;
  const note = `Pagamento/recebimento registrado no financeiro: ${transaction.id}.`;
  let updated = false;

  const nextOrders = parsed.map((order: { id?: string; paid?: number; value?: number; notes?: string }) => {
    if (order.id !== transaction.serviceOrder) return order;

    updated = true;

    const currentPaid = Number(order.paid || 0);
    const orderValue = Number(order.value || amount);
    const nextPaid = Math.min(Math.max(currentPaid, amount), orderValue || amount);

    return {
      ...order,
      paid: nextPaid,
      notes: order.notes?.includes(note) ? order.notes : `${order.notes || ""}\n${note}`.trim()
    };
  });

  if (updated) {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(nextOrders));
    window.dispatchEvent(new CustomEvent("volt:ordem-pagamento-atualizado", {
      detail: {
        os: transaction.serviceOrder,
        transactionId: transaction.id,
        amount
      }
    }));
  }

  return updated;
}



function readGoalsFromStorage() {
  const saved = localStorage.getItem(GOALS_STORAGE_KEY);
  const parsed = saved ? JSON.parse(saved) : null;

  return Array.isArray(parsed) ? parsed as FinancialGoal[] : goalsSeed;
}

function makeEmptyTransaction(type: TransactionType, count: number): Transaction {
  const today = todayIso();
  const isIncome = type === "Receita" || type === "Conta a receber";
  const isExpense = type === "Despesa" || type === "Conta a pagar";

  return {
    id: `FIN-${String(Date.now()).slice(-6)}-${String(count + 1).padStart(2, "0")}`,
    type,
    title: isIncome ? "Nova receita" : isExpense ? "Nova despesa" : "Novo lançamento",
    clientSupplier: isIncome ? "Novo cliente" : "Novo fornecedor",
    costCenter: "Serviços técnicos",
    category: "A definir",
    budgeted: 0,
    actual: 0,
    competenceDate: today,
    dueDate: today,
    paymentDate: "",
    status: "Aberto",
    paymentMethod: "Pix",
    serviceOrder: "Sem OS",
    quote: "Sem cotação",
    recurrence: "Única",
    responsible: "Guilherme Santana",
    notes: ""
  };
}

function makeEmptyGoal(count: number): FinancialGoal {
  return {
    id: `META-${String(Date.now()).slice(-6)}-${String(count + 1).padStart(2, "0")}`,
    title: "Nova meta financeira",
    period: "Mensal",
    category: "Faturamento",
    target: 0,
    actual: 0,
    notes: ""
  };
}


export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(transactionsSeed);
  const [activeTab, setActiveTab] = useState("Visão Geral");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selected, setSelected] = useState<Transaction | null>(transactionsSeed[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionEditOpen, setTransactionEditOpen] = useState(false);
  const [transactionDraft, setTransactionDraft] = useState<Transaction | null>(null);
  const [goals, setGoals] = useState<FinancialGoal[]>(goalsSeed);
  const [goalEditOpen, setGoalEditOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState<FinancialGoal | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    function syncFinanceFromStorage() {
      try {
        const savedTransactions = readFinanceFromStorage();
        const queuedTransactions = readFinanceQueue();
        const merged = mergeTransactions(savedTransactions, queuedTransactions);

        setTransactions(merged);
        setSelected(merged[0] ?? null);
        localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(merged));

        if (queuedTransactions.length) {
          localStorage.removeItem(FINANCE_QUEUE_KEY);
        }
      } catch {
        setTransactions(transactionsSeed);
      } finally {
        setStorageReady(true);
      }
    }

    syncFinanceFromStorage();

    window.addEventListener("storage", syncFinanceFromStorage);
    window.addEventListener("volt:financeiro-lancamento-criado", syncFinanceFromStorage);

    return () => {
      window.removeEventListener("storage", syncFinanceFromStorage);
      window.removeEventListener("volt:financeiro-lancamento-criado", syncFinanceFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(transactions));
  }, [storageReady, transactions]);

  useEffect(() => {
    try {
      setGoals(readGoalsFromStorage());
    } catch {
      setGoals(goalsSeed);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  }, [storageReady, goals]);

  function forceSyncFinance() {
    try {
      const savedTransactions = readFinanceFromStorage();
      const queuedTransactions = readFinanceQueue();
      const merged = mergeTransactions(savedTransactions, queuedTransactions);

      setTransactions(merged);
      setSelected(merged[0] ?? null);
      localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(merged));
      localStorage.removeItem(FINANCE_QUEUE_KEY);

      alert("Financeiro atualizado.");
    } catch {
      alert("Não foi possível atualizar o financeiro agora.");
    }
  }

  const filtered = useMemo(() => {
    return transactions.filter((item) => {
      const text = `${item.id} ${item.title} ${item.clientSupplier} ${item.costCenter} ${item.category} ${item.serviceOrder}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesType = typeFilter === "Todos" || item.type === typeFilter;
      const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [transactions, search, typeFilter, statusFilter]);

  const totals = useMemo(() => {
    const receitaRealizada = filtered.filter((item) => item.type === "Receita" && item.status === "Recebido").reduce((sum, item) => sum + item.actual, 0);
    const despesasRealizadas = filtered.filter((item) => item.type === "Despesa" && item.status === "Pago").reduce((sum, item) => sum + item.actual, 0);
    const receber = filtered.filter((item) => item.type === "Conta a receber" || (item.type === "Receita" && item.status === "Aberto")).reduce((sum, item) => sum + item.budgeted, 0);
    const pagar = filtered.filter((item) => item.type === "Conta a pagar" || (item.type === "Despesa" && item.status === "Aberto")).reduce((sum, item) => sum + item.budgeted, 0);
    const vencido = filtered.filter((item) => item.status === "Vencido").reduce((sum, item) => sum + item.budgeted, 0);
    const saldo = receitaRealizada - despesasRealizadas;
    const margem = receitaRealizada ? (saldo / receitaRealizada) * 100 : 0;
    const metaMensal = goals.find((goal) => goal.period === "Mensal" && goal.category === "Faturamento")?.target || 25000;
    const metaAtingida = (receitaRealizada + receber) / Math.max(metaMensal, 1) * 100;
    const ticketMedio = receitaRealizada / Math.max(filtered.filter((item) => item.type === "Receita").length, 1);

    return { receitaRealizada, despesasRealizadas, receber, pagar, vencido, saldo, margem, metaAtingida, ticketMedio, metaMensal };
  }, [filtered, goals]);

  const financeAnalytics = useMemo(() => {
    const activeTransactions = filtered.filter((item) => item.status !== "Cancelado");

    const centerMap = new Map<string, {
      name: string;
      budgeted: number;
      actual: number;
      open: number;
      entries: number;
      exits: number;
      count: number;
    }>();

    activeTransactions.forEach((item) => {
      const key = item.costCenter || "Sem centro de custo";
      const current = centerMap.get(key) ?? {
        name: key,
        budgeted: 0,
        actual: 0,
        open: 0,
        entries: 0,
        exits: 0,
        count: 0
      };

      const isIncome = item.type === "Receita" || item.type === "Conta a receber";
      const isExpense = item.type === "Despesa" || item.type === "Conta a pagar";
      const actualValue = Number(item.actual || 0);
      const budgetedValue = Number(item.budgeted || 0);
      const openValue = Math.max(budgetedValue - actualValue, 0);

      current.budgeted += budgetedValue;
      current.actual += actualValue;
      current.open += openValue;
      current.entries += isIncome ? actualValue : 0;
      current.exits += isExpense ? actualValue : 0;
      current.count += 1;

      centerMap.set(key, current);
    });

    const costCenters = Array.from(centerMap.values())
      .sort((a, b) => b.budgeted - a.budgeted);

    const monthlyMap = new Map<string, {
      month: string;
      budgeted: number;
      actual: number;
      income: number;
      expenses: number;
      open: number;
      balance: number;
    }>();

    activeTransactions.forEach((item) => {
      const key = getMonthKey(item.competenceDate || item.dueDate);
      const current = monthlyMap.get(key) ?? {
        month: key,
        budgeted: 0,
        actual: 0,
        income: 0,
        expenses: 0,
        open: 0,
        balance: 0
      };

      const isIncome = item.type === "Receita" || item.type === "Conta a receber";
      const isExpense = item.type === "Despesa" || item.type === "Conta a pagar";
      const actualValue = Number(item.actual || 0);
      const budgetedValue = Number(item.budgeted || 0);

      current.budgeted += budgetedValue;
      current.actual += actualValue;
      current.open += Math.max(budgetedValue - actualValue, 0);
      current.income += isIncome ? (actualValue || budgetedValue) : 0;
      current.expenses += isExpense ? (actualValue || budgetedValue) : 0;
      current.balance = current.income - current.expenses;

      monthlyMap.set(key, current);
    });

    const budgetRows = Array.from(monthlyMap.values())
      .sort((a, b) => a.month.localeCompare(b.month));

    const cashFlowRows = budgetRows.map((row, index) => {
      const previousBalance = budgetRows.slice(0, index).reduce((sum, item) => sum + item.balance, 0);
      const finalBalance = previousBalance + row.balance;

      return {
        ...row,
        previousBalance,
        finalBalance
      };
    });

    const maxCenter = Math.max(...costCenters.map((item) => item.budgeted), 1);
    const maxBudget = Math.max(...budgetRows.map((item) => Math.max(item.budgeted, item.actual)), 1);
    const maxFlow = Math.max(...cashFlowRows.map((item) => Math.max(item.income, item.expenses, Math.abs(item.finalBalance))), 1);

    return {
      activeTransactions,
      costCenters,
      budgetRows,
      cashFlowRows,
      maxCenter,
      maxBudget,
      maxFlow
    };
  }, [filtered]);

  function createTransaction(type: TransactionType) {
    const next = makeEmptyTransaction(type, transactions.length);

    setTransactionDraft(next);
    setTransactionEditOpen(true);
    setModalOpen(false);
  }

  function openTransactionEditor(transaction: Transaction) {
    setTransactionDraft({ ...transaction });
    setTransactionEditOpen(true);
  }

  function saveTransaction() {
    if (!transactionDraft) return;

    const next: Transaction = {
      ...transactionDraft,
      title: transactionDraft.title.trim() || "Novo lançamento",
      clientSupplier: transactionDraft.clientSupplier.trim() || "Não informado",
      costCenter: transactionDraft.costCenter.trim() || "A definir",
      category: transactionDraft.category.trim() || "A definir",
      budgeted: Number(transactionDraft.budgeted || 0),
      actual: Number(transactionDraft.actual || 0),
      status: transactionDraft.status,
      notes: transactionDraft.notes.trim()
    };

    setTransactions((current) => {
      const exists = current.some((item) => item.id === next.id);

      return exists
        ? current.map((item) => item.id === next.id ? next : item)
        : [next, ...current];
    });

    setSelected(next);
    setModalOpen(true);
    setTransactionEditOpen(false);
    setTransactionDraft(null);
  }

  function removeTransaction(transaction: Transaction) {
    if (!window.confirm(`Excluir o lançamento "${transaction.title}"?\n\nIsso remove o lançamento da lista, do centro de custo, do orçado x realizado e do fluxo de caixa.`)) return;

    setTransactions((current) => {
      const next = current.filter((item) => item.id !== transaction.id);
      localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    setSelected((current) => current?.id === transaction.id ? null : current);
    setModalOpen(false);
  }

  function clearAllTransactions() {
    if (!window.confirm("Apagar TODOS os lançamentos financeiros?\n\nCentro de custo, orçado x realizado e fluxo de caixa serão zerados.")) return;

    setTransactions([]);
    setSelected(null);
    setModalOpen(false);
    localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify([]));
    localStorage.removeItem(FINANCE_QUEUE_KEY);

    alert("Financeiro zerado. Os gráficos e centros de custo agora ficam vazios até novos lançamentos serem cadastrados.");
  }

  function createGoal() {
    const next = makeEmptyGoal(goals.length);

    setGoalDraft(next);
    setGoalEditOpen(true);
  }

  function openGoalEditor(goal: FinancialGoal) {
    setGoalDraft({ ...goal });
    setGoalEditOpen(true);
  }

  function saveGoal() {
    if (!goalDraft) return;

    const next: FinancialGoal = {
      ...goalDraft,
      title: goalDraft.title.trim() || "Meta financeira",
      target: Number(goalDraft.target || 0),
      actual: Number(goalDraft.actual || 0),
      notes: goalDraft.notes.trim()
    };

    setGoals((current) => {
      const exists = current.some((item) => item.id === next.id);

      return exists
        ? current.map((item) => item.id === next.id ? next : item)
        : [next, ...current];
    });

    setGoalEditOpen(false);
    setGoalDraft(null);
  }

  function removeGoal(goal: FinancialGoal) {
    if (!window.confirm("Excluir esta meta financeira?")) return;

    setGoals((current) => current.filter((item) => item.id !== goal.id));
  }

  function markTransactionAsDone(transaction: Transaction) {
    const isIncome = transaction.type === "Receita" || transaction.type === "Conta a receber";
    const isExpense = transaction.type === "Despesa" || transaction.type === "Conta a pagar";

    const next: Transaction = {
      ...transaction,
      type: isIncome ? "Receita" : isExpense ? "Despesa" : transaction.type,
      status: isIncome ? "Recebido" : isExpense ? "Pago" : transaction.status,
      actual: transaction.actual > 0 ? transaction.actual : transaction.budgeted,
      paymentDate: transaction.paymentDate || todayIso(),
      notes: transaction.notes.includes("Baixado automaticamente")
        ? transaction.notes
        : `${transaction.notes}\nBaixado automaticamente em ${new Date().toLocaleDateString("pt-BR")}.`.trim()
    };

    setTransactions((current) => current.map((item) => item.id === transaction.id ? next : item));
    setSelected(next);

    try {
      if (isIncome) {
        syncLinkedOrderPaymentFromFinance(next);
      }
    } catch {
      // O financeiro continua funcionando mesmo se a sincronização da OS falhar.
    }

    alert(isIncome ? "Recebimento marcado como recebido." : "Pagamento marcado como pago.");
  }

  function cancelTransaction(transaction: Transaction) {
    const confirmed = window.confirm("Deseja cancelar este lançamento financeiro?");

    if (!confirmed) return;

    const next: Transaction = {
      ...transaction,
      status: "Cancelado",
      notes: transaction.notes.includes("Lançamento cancelado")
        ? transaction.notes
        : `${transaction.notes}\nLançamento cancelado em ${new Date().toLocaleDateString("pt-BR")}.`.trim()
    };

    setTransactions((current) => current.map((item) => item.id === transaction.id ? next : item));
    setSelected(next);
  }

  function exportCsv() {
    const header = ["ID", "Tipo", "Nome", "Cliente/Fornecedor", "Centro de Custo", "Categoria", "Orçado", "Realizado", "Vencimento", "Status"];
    const rows = filtered.map((item) => [item.id, item.type, item.title, item.clientSupplier, item.costCenter, item.category, item.budgeted, item.actual, item.dueDate, item.status]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "financeiro-volt.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const tableData =
    activeTab === "Contas a Pagar"
      ? filtered.filter((item) => item.type === "Conta a pagar" || item.type === "Despesa")
      : activeTab === "Contas a Receber"
        ? filtered.filter((item) => item.type === "Conta a receber" || item.type === "Receita")
        : filtered;

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111821] via-[#080c11] to-black p-5 shadow-soft md:p-7">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-volt-yellow/20 blur-[130px]" />
          <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Gestão financeira</p>
              <h1 className="mt-2 text-4xl font-black leading-tight md:text-5xl">Financeiro</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                Controle receitas, despesas, contas a pagar e receber, centro de custo, metas, orçado x realizado e resultado financeiro da Volt.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
              <button onClick={() => createTransaction("Receita")} className="btn-primary inline-flex items-center justify-center gap-2"><Plus size={17} /> Nova receita</button>
              <button onClick={() => createTransaction("Despesa")} className="btn-ghost inline-flex items-center justify-center gap-2"><TrendingDown size={17} /> Nova despesa</button>
              <button onClick={() => createTransaction("Conta a receber")} className="btn-ghost inline-flex items-center justify-center gap-2"><Receipt size={17} /> Nova conta a receber</button>
              <button onClick={() => createTransaction("Conta a pagar")} className="btn-ghost inline-flex items-center justify-center gap-2"><CreditCard size={17} /> Nova conta a pagar</button>
              <button onClick={createGoal} className="btn-ghost inline-flex items-center justify-center gap-2"><Target size={17} /> Nova meta</button>
              <button onClick={forceSyncFinance} className="btn-ghost inline-flex items-center justify-center gap-2"><Wallet size={17} /> Atualizar lançamentos</button>
              <button onClick={clearAllTransactions} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">Limpar lançamentos</button>
              <button onClick={exportCsv} className="btn-ghost inline-flex items-center justify-center gap-2"><Download size={17} /> Exportar CSV</button>
              <button onClick={() => window.print()} className="btn-ghost inline-flex items-center justify-center gap-2"><FileText size={17} /> Relatório PDF</button>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[.025] p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_.7fr_.7fr]">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
              <Search size={17} className="text-volt-yellow" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar lançamento, cliente, OS, centro de custo..." className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600" />
            </div>

            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
              {["Todos", "Receita", "Despesa", "Conta a pagar", "Conta a receber"].map((type) => <option key={type}>{type}</option>)}
            </select>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
              {["Todos", "Aberto", "Pago", "Recebido", "Vencido", "Cancelado"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
          {[
            ["Receita total", currency(totals.receitaRealizada), TrendingUp, "text-volt-ok", "+18%"],
            ["Despesa total", currency(totals.despesasRealizadas), TrendingDown, "text-red-300", "+7%"],
            ["Saldo/Lucro", currency(totals.saldo), Wallet, "text-volt-yellow", percent(totals.margem)],
            ["Margem", percent(totals.margem), Gauge, "text-volt-ok", "líquida"],
            ["A receber", currency(totals.receber), Receipt, "text-volt-yellow", "aberto"],
            ["A pagar", currency(totals.pagar), CreditCard, "text-orange-300", "previsto"],
            ["Vencidos", currency(totals.vencido), AlertTriangle, "text-red-300", "alerta"],
            ["Meta mensal", percent(totals.metaAtingida), Target, "text-volt-yellow", "atingida"]
          ].map(([label, value, Icon, color, note]) => {
            const IconComp = Icon as typeof Wallet;
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
              <ChartCard title="Evolução financeira" subtitle="Comparação mensal de receitas, despesas e lucro." icon={<LineChart size={25} />}>
                <LineFinanceChart />
              </ChartCard>

              <ChartCard title="Metas financeiras" subtitle="Progresso das metas mensais e anuais." icon={<Target size={25} />}>
                <div className="space-y-4">
                  {goals.map((goal) => {
                    const reached = (goal.actual / goal.target) * 100;
                    return (
                      <div key={goal.title} className="rounded-3xl border border-white/10 bg-black/35 p-4">
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-black">{goal.title}</p>
                            <p className="mt-1 text-sm text-zinc-500">{currency(goal.actual)} de {currency(goal.target)}</p>
                          </div>
                          <p className="text-2xl font-black text-volt-yellow">{percent(reached)}</p>
                        </div>
                        <ProgressBar value={reached} danger={goal.title.includes("despesas") && reached > 90} />
                      </div>
                    );
                  })}
                </div>
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
              <ChartCard title="Orçado x realizado" subtitle="Confronta planejamento e execução mês a mês." icon={<BarChart3 size={25} />}>
                <BudgetColumnChart />
              </ChartCard>

              <ChartCard title="Composição de despesas" subtitle="Mostra quais categorias consomem mais dinheiro." icon={<PieChart size={25} />}>
                <DonutChart />
              </ChartCard>
            </section>
          </>
        )}

        {["Lançamentos", "Contas a Pagar", "Contas a Receber"].includes(activeTab) && (
          <section className="card-premium rounded-[2rem] p-5 md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">{activeTab}</p>
                <h2 className="mt-1 text-2xl font-black">Tabela financeira</h2>
              </div>
              <Filter className="text-volt-yellow" size={26} />
            </div>

            <div className="volt-scroll overflow-x-auto">
              <table className="w-full min-w-[1120px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[.16em] text-zinc-600">
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Lançamento</th>
                    <th className="px-4 py-2">Cliente/Fornecedor</th>
                    <th className="px-4 py-2">Centro de custo</th>
                    <th className="px-4 py-2">Orçado</th>
                    <th className="px-4 py-2">Realizado</th>
                    <th className="px-4 py-2">Vencimento</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((item) => (
                    <tr key={item.id} className="bg-white/[.035] text-sm">
                      <td className="rounded-l-2xl px-4 py-4"><Badge className={typeColors[item.type]}>{item.type}</Badge></td>
                      <td className="px-4 py-4"><p className="font-black">{item.title}</p><p className="text-xs text-zinc-500">{item.id} • {item.serviceOrder}</p></td>
                      <td className="px-4 py-4">{item.clientSupplier}</td>
                      <td className="px-4 py-4">{item.costCenter}</td>
                      <td className="px-4 py-4 font-bold">{currency(item.budgeted)}</td>
                      <td className="px-4 py-4 font-black text-volt-yellow">{currency(item.actual)}</td>
                      <td className="px-4 py-4">{item.dueDate}</td>
                      <td className="px-4 py-4"><Badge className={statusColors[item.status]}>{item.status}</Badge></td>
                      <td className="rounded-r-2xl px-4 py-4">
                        <div className="flex gap-3">
                          <button onClick={() => { setSelected(item); setModalOpen(true); }} className="text-xs font-black text-volt-yellow">Detalhes</button>
                          <button onClick={() => openTransactionEditor(item)} className="text-xs font-black text-zinc-300 hover:text-volt-yellow">Editar</button>
                          <button onClick={() => removeTransaction(item)} className="text-xs font-black text-red-300 hover:text-red-200">Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 p-4 text-sm font-black text-volt-yellow">
              Total filtrado: {currency(tableData.reduce((sum, item) => sum + (item.actual || item.budgeted), 0))}
            </div>
          </section>
        )}

        {activeTab === "Centro de Custo" && (
          <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
            <div className="grid gap-4">
              {financeAnalytics.costCenters.map((center) => {
                const consumed = safeProgress(center.actual, center.budgeted);
                const status = consumed >= 100 ? "Estourado" : consumed >= 90 ? "Atenção" : "OK";

                return (
                  <article key={center.name} className="card-premium rounded-[2rem] p-5">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-volt-yellow">{center.count} lançamento(s)</p>
                        <h3 className="mt-1 text-xl font-black">{center.name}</h3>
                        <p className="mt-1 text-sm text-zinc-500">Entradas {currency(center.entries)} • Saídas {currency(center.exits)}</p>
                      </div>
                      <Badge className={status === "OK" ? "bg-volt-ok/15 text-volt-ok border-volt-ok/20" : status === "Atenção" ? "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25" : "bg-red-500/15 text-red-300 border-red-500/20"}>{status}</Badge>
                    </div>

                    <div className="mb-2 flex justify-between text-sm font-bold text-zinc-400">
                      <span>Realizado {currency(center.actual)}</span>
                      <span>Orçado {currency(center.budgeted)}</span>
                    </div>
                    <ProgressBar value={consumed} danger={consumed >= 100} />

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-xl border border-white/10 bg-black/35 p-3">
                        <p className="text-zinc-500">Aberto</p>
                        <p className="mt-1 font-black text-volt-yellow">{currency(center.open)}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/35 p-3">
                        <p className="text-zinc-500">Entradas</p>
                        <p className="mt-1 font-black text-volt-ok">{currency(center.entries)}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/35 p-3">
                        <p className="text-zinc-500">Saídas</p>
                        <p className="mt-1 font-black text-red-300">{currency(center.exits)}</p>
                      </div>
                    </div>
                  </article>
                );
              })}

              {financeAnalytics.costCenters.length === 0 && (
                <div className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5 text-sm font-bold leading-7 text-zinc-400">
                  Nenhum centro de custo para exibir. Quando apagar todos os lançamentos, esta tela fica zerada.
                </div>
              )}
            </div>

            <ChartCard title="Orçado x realizado por centro" subtitle="Agora calculado pelos lançamentos reais, não por valores fixos." icon={<BarChart3 size={25} />}>
              <div className="space-y-4">
                {financeAnalytics.costCenters.map((center) => {
                  const budgetWidth = safeProgress(center.budgeted, financeAnalytics.maxCenter);
                  const actualWidth = safeProgress(center.actual, financeAnalytics.maxCenter);

                  return (
                    <div key={center.name} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-black">{center.name}</p>
                        <p className="text-sm font-black text-volt-yellow">{percent(safeProgress(center.actual, center.budgeted))}</p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-zinc-500"><span>Orçado</span><span>{currency(center.budgeted)}</span></div>
                          <div className="h-3 rounded-full bg-white/10"><div className="h-full rounded-full bg-white/30" style={{ width: `${Math.min(budgetWidth, 100)}%` }} /></div>
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-zinc-500"><span>Realizado</span><span>{currency(center.actual)}</span></div>
                          <div className="h-3 rounded-full bg-white/10"><div className="h-full rounded-full bg-volt-yellow" style={{ width: `${Math.min(actualWidth, 100)}%` }} /></div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {financeAnalytics.costCenters.length === 0 && (
                  <p className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm font-bold text-zinc-500">Sem dados para gráfico.</p>
                )}
              </div>
            </ChartCard>
          </section>
        )}

        {activeTab === "Orçado x Realizado" && (
          <section className="grid gap-5 xl:grid-cols-2">
            <ChartCard title="Comparativo mensal" subtitle="Calculado pelos lançamentos reais do financeiro." icon={<BarChart3 size={25} />}>
              <div className="space-y-4">
                {financeAnalytics.budgetRows.map((item) => {
                  const budgetWidth = safeProgress(item.budgeted, financeAnalytics.maxBudget);
                  const actualWidth = safeProgress(item.actual, financeAnalytics.maxBudget);

                  return (
                    <div key={item.month} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="font-black">{getMonthLabel(item.month)}</p>
                        <p className="text-sm font-black text-volt-yellow">{currency(item.actual)} / {currency(item.budgeted)}</p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-zinc-500"><span>Orçado</span><span>{currency(item.budgeted)}</span></div>
                          <div className="h-3 rounded-full bg-white/10"><div className="h-full rounded-full bg-white/30" style={{ width: `${Math.min(budgetWidth, 100)}%` }} /></div>
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-zinc-500"><span>Realizado</span><span>{currency(item.actual)}</span></div>
                          <div className="h-3 rounded-full bg-white/10"><div className="h-full rounded-full bg-volt-yellow" style={{ width: `${Math.min(actualWidth, 100)}%` }} /></div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {financeAnalytics.budgetRows.length === 0 && (
                  <p className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm font-bold text-zinc-500">Sem lançamentos para comparar.</p>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Diferenças principais" subtitle="Variação em R$ e percentual por competência." icon={<Gauge size={25} />}>
              <div className="space-y-4">
                {financeAnalytics.budgetRows.map((item) => {
                  const diff = item.actual - item.budgeted;
                  const diffPercent = safeProgress(diff, item.budgeted);

                  return (
                    <div key={item.month} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-black">{getMonthLabel(item.month)}</p>
                          <p className="mt-1 text-xs text-zinc-500">Aberto {currency(item.open)}</p>
                        </div>
                        <p className={`font-black ${diff >= 0 ? "text-volt-ok" : "text-red-300"}`}>{currency(diff)} • {percent(diffPercent)}</p>
                      </div>
                    </div>
                  );
                })}

                {financeAnalytics.budgetRows.length === 0 && (
                  <p className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm font-bold text-zinc-500">Sem diferenças para exibir.</p>
                )}
              </div>
            </ChartCard>
          </section>
        )}

        {activeTab === "Metas" && (
          <section className="space-y-5">
            <div className="flex flex-col justify-between gap-3 rounded-[2rem] border border-white/10 bg-white/[.025] p-5 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Metas financeiras</p>
                <h2 className="mt-1 text-2xl font-black">Mensais e anuais</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">Cadastre metas de faturamento, lucro, despesa ou qualquer indicador personalizado.</p>
              </div>
              <button onClick={createGoal} className="btn-primary inline-flex items-center justify-center gap-2"><Plus size={17} /> Nova meta</button>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {goals.map((goal) => {
                const reached = goal.target ? (goal.actual / goal.target) * 100 : 0;
                const isExpenseGoal = goal.category === "Despesa";
                const ok = isExpenseGoal ? reached <= 100 : reached >= 100;
                return (
                  <article key={goal.id} className="card-premium rounded-[2rem] p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <Badge className={goal.period === "Anual" ? "bg-blue-500/15 text-blue-300 border-blue-500/20" : "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25"}>{goal.period}</Badge>
                        <h3 className="mt-3 text-xl font-black">{goal.title}</h3>
                      </div>
                      <Target className="text-volt-yellow" size={28} />
                    </div>
                    <p className="mt-2 text-sm text-zinc-500">{currency(goal.actual)} de {currency(goal.target)}</p>
                    <p className={`mt-5 text-4xl font-black ${ok ? "text-volt-yellow" : "text-red-300"}`}>{percent(reached)}</p>
                    <div className="mt-4"><ProgressBar value={reached} danger={isExpenseGoal && reached > 90} /></div>
                    <p className="mt-4 text-sm leading-6 text-zinc-400">
                      {isExpenseGoal
                        ? `Limite restante: ${currency(Math.max(goal.target - goal.actual, 0))}.`
                        : `Falta ${currency(Math.max(goal.target - goal.actual, 0))} para atingir o planejado.`}
                    </p>
                    {goal.notes && <p className="mt-2 text-xs leading-5 text-zinc-500">{goal.notes}</p>}
                    <div className="mt-5 flex gap-2">
                      <button onClick={() => openGoalEditor(goal)} className="btn-ghost flex-1">Editar</button>
                      <button onClick={() => removeGoal(goal)} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">Excluir</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "Fluxo de Caixa" && (
          <section className="grid gap-5 xl:grid-cols-[1fr_.85fr]">
            <ChartCard title="Fluxo de caixa real/projetado" subtitle="Entradas e saídas calculadas pelos lançamentos do financeiro." icon={<BarChart3 size={25} />}>
              <div className="space-y-4">
                {financeAnalytics.cashFlowRows.map((item) => {
                  const incomeWidth = safeProgress(item.income, financeAnalytics.maxFlow);
                  const expenseWidth = safeProgress(item.expenses, financeAnalytics.maxFlow);

                  return (
                    <div key={item.month} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                      <div className="mb-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-black">{getMonthLabel(item.month)}</p>
                          <p className="mt-1 text-xs text-zinc-500">Saldo final {currency(item.finalBalance)}</p>
                        </div>
                        <p className={`font-black ${item.balance >= 0 ? "text-volt-ok" : "text-red-300"}`}>{currency(item.balance)}</p>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-zinc-500"><span>Entradas</span><span>{currency(item.income)}</span></div>
                          <div className="h-3 rounded-full bg-white/10"><div className="h-full rounded-full bg-volt-ok" style={{ width: `${Math.min(incomeWidth, 100)}%` }} /></div>
                        </div>
                        <div>
                          <div className="mb-1 flex justify-between text-xs text-zinc-500"><span>Saídas</span><span>{currency(item.expenses)}</span></div>
                          <div className="h-3 rounded-full bg-white/10"><div className="h-full rounded-full bg-red-400" style={{ width: `${Math.min(expenseWidth, 100)}%` }} /></div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {financeAnalytics.cashFlowRows.length === 0 && (
                  <p className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm font-bold text-zinc-500">Fluxo zerado. Cadastre receitas/despesas para preencher.</p>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Resumo do caixa" subtitle="Entradas, saídas e saldo acumulado." icon={<TrendingUp size={25} />}>
              <div className="space-y-4">
                {[
                  ["Entradas previstas/realizadas", financeAnalytics.cashFlowRows.reduce((sum, item) => sum + item.income, 0), "text-volt-ok"],
                  ["Saídas previstas/realizadas", financeAnalytics.cashFlowRows.reduce((sum, item) => sum + item.expenses, 0), "text-red-300"],
                  ["Saldo acumulado", financeAnalytics.cashFlowRows.reduce((sum, item) => sum + item.balance, 0), "text-volt-yellow"],
                  ["Lançamentos considerados", financeAnalytics.activeTransactions.length, "text-zinc-300"]
                ].map(([label, value, color]) => (
                  <div key={label as string} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-black">{label as string}</p>
                      <p className={`text-lg font-black ${color as string}`}>{typeof value === "number" && label !== "Lançamentos considerados" ? currency(value) : value}</p>
                    </div>
                  </div>
                ))}

                <button onClick={clearAllTransactions} className="w-full rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">
                  Zerar financeiro
                </button>
              </div>
            </ChartCard>
          </section>
        )}

        {activeTab === "Relatórios" && (
          <section className="grid gap-5 xl:grid-cols-[1fr_.85fr]">
            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Relatório financeiro</p>
              <h2 className="mt-2 text-3xl font-black">Executivo completo</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Gere um relatório com capa, resumo executivo, indicadores, receitas, despesas, centro de custo, metas, fluxo de caixa, gráficos e recomendações.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {["Mensal", "Anual", "Centro de custo", "Orçado x realizado", "Fluxo de caixa", "Contas a pagar", "Contas a receber", "Completo executivo"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[.035] p-4 font-bold text-zinc-300">{item}</div>
                ))}
              </div>

              <button onClick={() => window.print()} className="btn-primary mt-6 inline-flex items-center gap-2">
                <FileText size={17} /> Gerar relatório PDF
              </button>
            </div>

            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Recomendações</p>
              <div className="mt-5 space-y-3">
                {["Revisar centros acima de 90% do orçamento.", "Fazer cobrança dos valores vencidos.", "Aumentar conversão de contas a receber.", "Separar despesas fixas e variáveis.", "Criar meta específica para automação."].map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3">
                    <CheckCircle2 className="shrink-0 text-volt-yellow" size={18} />
                    <p className="text-sm leading-6 text-zinc-300">{item}</p>
                  </div>
                ))}
              </div>
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
                  <h2 className="text-3xl font-black">{selected.title}</h2>
                  <p className="mt-2 text-sm text-zinc-500">{selected.id} • {selected.clientSupplier}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => openTransactionEditor(selected)} className="btn-primary inline-flex items-center gap-2"><FileText size={17} /> Editar lançamento</button>
                  {(selected.type === "Receita" || selected.type === "Conta a receber") && selected.status !== "Recebido" && (
                    <button onClick={() => markTransactionAsDone(selected)} className="btn-primary inline-flex items-center gap-2"><CheckCircle2 size={17} /> Marcar recebido</button>
                  )}
                  {(selected.type === "Despesa" || selected.type === "Conta a pagar") && selected.status !== "Pago" && (
                    <button onClick={() => markTransactionAsDone(selected)} className="btn-primary inline-flex items-center gap-2"><CheckCircle2 size={17} /> Marcar pago</button>
                  )}
                  {selected.status !== "Cancelado" && (
                    <button onClick={() => cancelTransaction(selected)} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">Cancelar lançamento</button>
                  )}
                  <button onClick={() => removeTransaction(selected)} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">Excluir</button>
                  <button onClick={() => setModalOpen(false)} className="btn-ghost">Fechar</button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  ["Tipo", selected.type],
                  ["Cliente/Fornecedor", selected.clientSupplier],
                  ["Centro de custo", selected.costCenter],
                  ["Categoria", selected.category],
                  ["Valor orçado", currency(selected.budgeted)],
                  ["Valor realizado", currency(selected.actual)],
                  ["Competência", selected.competenceDate],
                  ["Vencimento", selected.dueDate],
                  ["Pagamento/recebimento", selected.paymentDate || "Não realizado"],
                  ["Forma de pagamento", selected.paymentMethod],
                  ["OS vinculada", selected.serviceOrder],
                  ["Impacto na OS", selected.serviceOrder !== "Sem OS" && selected.status === "Recebido" ? "Pagamento atualizado na OS" : "-"],
                  ["Cotação vinculada", selected.quote],
                  ["Recorrência", selected.recurrence],
                  ["Responsável", selected.responsible]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{label}</p>
                    <p className="mt-1 font-bold">{value}</p>
                  </div>
                ))}

                <div className="rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 p-4 md:col-span-2">
                  <p className="text-sm font-black text-volt-yellow">Observação</p>
                  <p className="mt-2 text-sm leading-7 text-zinc-300">{selected.notes}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {transactionEditOpen && transactionDraft && (
          <TransactionEditorModal
            draft={transactionDraft}
            setDraft={setTransactionDraft}
            onSave={saveTransaction}
            onCancel={() => {
              setTransactionEditOpen(false);
              setTransactionDraft(null);
            }}
          />
        )}

        {goalEditOpen && goalDraft && (
          <GoalEditorModal
            draft={goalDraft}
            setDraft={setGoalDraft}
            onSave={saveGoal}
            onCancel={() => {
              setGoalEditOpen(false);
              setGoalDraft(null);
            }}
          />
        )}

      </div>
    </AppShell>
  );
}



function TransactionEditorModal({
  draft,
  setDraft,
  onSave,
  onCancel
}: {
  draft: Transaction;
  setDraft: Dispatch<SetStateAction<Transaction | null>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  function setField<K extends keyof Transaction>(field: K, value: Transaction[K]) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
  }

  const isIncome = draft.type === "Receita" || draft.type === "Conta a receber";
  const isExpense = draft.type === "Despesa" || draft.type === "Conta a pagar";

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="volt-scroll max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#080c11] p-5 shadow-2xl">
        <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/10 pb-5 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Lançamento financeiro</p>
            <h2 className="mt-1 text-3xl font-black">Editar receita/despesa</h2>
            <p className="mt-2 text-sm text-zinc-500">{draft.id}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={onSave} className="btn-primary inline-flex items-center gap-2"><CheckCircle2 size={17} /> Salvar lançamento</button>
            <button onClick={onCancel} className="btn-ghost">Cancelar</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Tipo</span>
            <select value={draft.type} onChange={(event) => {
              const type = event.target.value as TransactionType;
              const nextStatus: TransactionStatus = type === "Despesa" || type === "Conta a pagar" ? "Aberto" : "Aberto";
              setDraft((current) => current ? { ...current, type, status: nextStatus } : current);
            }} className="mt-2 w-full bg-[#080c11] font-bold outline-none">
              {["Receita", "Despesa", "Conta a pagar", "Conta a receber"].map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Status</span>
            <select value={draft.status} onChange={(event) => setField("status", event.target.value as TransactionStatus)} className="mt-2 w-full bg-[#080c11] font-bold outline-none">
              {["Aberto", "Pago", "Recebido", "Vencido", "Cancelado"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Título</span>
            <input value={draft.title} onChange={(event) => setField("title", event.target.value)} className="mt-2 w-full bg-transparent text-lg font-black outline-none" placeholder={isIncome ? "Ex: Serviço de instalação elétrica" : "Ex: Compra de materiais"} />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{isIncome ? "Cliente" : "Fornecedor"}</span>
            <input value={draft.clientSupplier} onChange={(event) => setField("clientSupplier", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Categoria</span>
            <input value={draft.category} onChange={(event) => setField("category", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Centro de custo</span>
            <input value={draft.costCenter} onChange={(event) => setField("costCenter", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Forma de pagamento</span>
            <select value={draft.paymentMethod} onChange={(event) => setField("paymentMethod", event.target.value)} className="mt-2 w-full bg-[#080c11] font-bold outline-none">
              {["Pix", "Dinheiro", "Cartão", "Boleto", "Transferência", "Débito", "Crédito", "Outro"].map((method) => <option key={method}>{method}</option>)}
            </select>
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Valor orçado / previsto</span>
            <input type="number" value={draft.budgeted} onChange={(event) => setField("budgeted", Number(event.target.value))} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Valor realizado</span>
            <input type="number" value={draft.actual} onChange={(event) => setField("actual", Number(event.target.value))} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Competência</span>
            <input type="date" value={draft.competenceDate} onChange={(event) => setField("competenceDate", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Vencimento</span>
            <input type="date" value={draft.dueDate} onChange={(event) => setField("dueDate", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Data de pagamento/recebimento</span>
            <input type="date" value={draft.paymentDate} onChange={(event) => setField("paymentDate", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Recorrência</span>
            <select value={draft.recurrence} onChange={(event) => setField("recurrence", event.target.value)} className="mt-2 w-full bg-[#080c11] font-bold outline-none">
              {["Única", "Semanal", "Mensal", "Trimestral", "Anual"].map((recurrence) => <option key={recurrence}>{recurrence}</option>)}
            </select>
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">OS vinculada</span>
            <input value={draft.serviceOrder} onChange={(event) => setField("serviceOrder", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Cotação vinculada</span>
            <input value={draft.quote} onChange={(event) => setField("quote", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Responsável</span>
            <input value={draft.responsible} onChange={(event) => setField("responsible", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Observações</span>
            <textarea value={draft.notes} onChange={(event) => setField("notes", event.target.value)} rows={4} className="mt-2 w-full resize-none bg-transparent text-sm font-bold leading-7 outline-none" />
          </label>

          <div className="rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 p-4 md:col-span-2">
            <p className="text-sm font-black text-volt-yellow">Resumo</p>
            <p className="mt-2 text-sm leading-7 text-zinc-300">
              {isIncome ? "Entrada prevista/recebida" : "Saída prevista/paga"} de <strong>{currency(draft.actual || draft.budgeted)}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalEditorModal({
  draft,
  setDraft,
  onSave,
  onCancel
}: {
  draft: FinancialGoal;
  setDraft: Dispatch<SetStateAction<FinancialGoal | null>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  function setField<K extends keyof FinancialGoal>(field: K, value: FinancialGoal[K]) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="volt-scroll max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#080c11] p-5 shadow-2xl">
        <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/10 pb-5 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Meta financeira</p>
            <h2 className="mt-1 text-3xl font-black">Editar meta</h2>
            <p className="mt-2 text-sm text-zinc-500">{draft.id}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={onSave} className="btn-primary inline-flex items-center gap-2"><CheckCircle2 size={17} /> Salvar meta</button>
            <button onClick={onCancel} className="btn-ghost">Cancelar</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Nome da meta</span>
            <input value={draft.title} onChange={(event) => setField("title", event.target.value)} className="mt-2 w-full bg-transparent text-lg font-black outline-none" placeholder="Ex: Meta mensal de faturamento" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Período</span>
            <select value={draft.period} onChange={(event) => setField("period", event.target.value as GoalPeriod)} className="mt-2 w-full bg-[#080c11] font-bold outline-none">
              {["Mensal", "Anual"].map((period) => <option key={period}>{period}</option>)}
            </select>
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Categoria</span>
            <select value={draft.category} onChange={(event) => setField("category", event.target.value as GoalCategory)} className="mt-2 w-full bg-[#080c11] font-bold outline-none">
              {["Faturamento", "Lucro", "Despesa", "Personalizada"].map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Valor planejado</span>
            <input type="number" value={draft.target} onChange={(event) => setField("target", Number(event.target.value))} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Valor realizado atual</span>
            <input type="number" value={draft.actual} onChange={(event) => setField("actual", Number(event.target.value))} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Observações</span>
            <textarea value={draft.notes} onChange={(event) => setField("notes", event.target.value)} rows={4} className="mt-2 w-full resize-none bg-transparent text-sm font-bold leading-7 outline-none" placeholder="Ex: Meta do mês considerando serviços residenciais e comerciais." />
          </label>

          <div className="rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 p-4 md:col-span-2">
            <p className="text-sm font-black text-volt-yellow">Progresso</p>
            <p className="mt-2 text-sm leading-7 text-zinc-300">
              {draft.target ? percent((draft.actual / draft.target) * 100) : "0%"} concluído.
            </p>
            <div className="mt-3"><ProgressBar value={draft.target ? (draft.actual / draft.target) * 100 : 0} danger={draft.category === "Despesa" && draft.target > 0 && (draft.actual / draft.target) * 100 > 90} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
