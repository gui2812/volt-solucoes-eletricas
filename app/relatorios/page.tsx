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
  Gauge,
  LineChart,
  PieChart,
  RefreshCcw,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AnyRecord = Record<string, unknown>;

type ReportKind =
  | "Executivo"
  | "Financeiro"
  | "Operacional"
  | "Clientes"
  | "Agenda"
  | "Comercial";

type ReportHistory = {
  id: string;
  kind: ReportKind;
  title: string;
  date: string;
  format: "PDF" | "CSV";
  status: "Gerado" | "Erro";
};

const STORAGE = {
  quotes: "volt_cotacoes_premium_v1",
  orders: "volt_ordens_premium_v1",
  agenda: "volt_agenda_premium_v1",
  finance: "volt_financeiro_premium_v1",
  clients: "volt_clientes_crm_v1",
  goals: "volt_financeiro_metas_v1",
  reports: "volt_relatorios_historico_v1"
};

const reportModels: {
  kind: ReportKind;
  title: string;
  description: string;
  modules: string[];
  icon: LucideIcon;
}[] = [
  {
    kind: "Executivo",
    title: "Relatório Executivo Geral",
    description: "Visão completa da operação: financeiro, orçamentos, OS, agenda, clientes, metas e alertas.",
    modules: ["Dashboard", "Financeiro", "Clientes", "OS", "Agenda", "Cotações"],
    icon: BarChart3
  },
  {
    kind: "Financeiro",
    title: "Relatório Financeiro Completo",
    description: "Receitas, despesas, contas a pagar, contas a receber, lucro, metas, vencidos e fluxo.",
    modules: ["Financeiro", "Metas", "OS"],
    icon: Wallet
  },
  {
    kind: "Operacional",
    title: "Relatório Operacional de OS",
    description: "Ordens de serviço, status, valores, agenda, pagamentos e produtividade.",
    modules: ["OS", "Agenda", "Financeiro"],
    icon: Wrench
  },
  {
    kind: "Clientes",
    title: "Relatório de Clientes e CRM",
    description: "Carteira, leads, inadimplência, documentos, histórico e ranking financeiro por cliente.",
    modules: ["Clientes", "Financeiro", "Cotações"],
    icon: Users
  },
  {
    kind: "Agenda",
    title: "Relatório de Agenda Técnica",
    description: "Compromissos, técnicos, status, atrasos, recorrências e OS vinculadas.",
    modules: ["Agenda", "OS"],
    icon: CalendarDays
  },
  {
    kind: "Comercial",
    title: "Relatório Comercial de Orçamentos",
    description: "Funil de propostas, assinaturas, aprovações, recusas, negociação e conversão em OS.",
    modules: ["Cotações", "Assinaturas", "Clientes"],
    icon: FileText
  }
];

function currency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function percent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function todayIso() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function dateValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readArray(key: string) {
  if (typeof window === "undefined") return [] as AnyRecord[];

  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed as AnyRecord[] : [];
  } catch {
    return [];
  }
}

function saveArray(key: string, value: unknown[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

function quoteTotal(quote: AnyRecord) {
  const items = Array.isArray(quote.items) ? quote.items as AnyRecord[] : [];

  return items.reduce((sum, item) => {
    const quantity = numberValue(item.quantity);
    const unitPrice = numberValue(item.unitPrice);
    const discount = numberValue(item.discount);

    return sum + quantity * unitPrice * (1 - discount / 100);
  }, 0);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusClass(status: string) {
  if (["Recebido", "Pago", "Aprovada", "Assinada", "Finalizada", "Concluído", "Ativo"].includes(status)) {
    return "bg-volt-ok/15 text-volt-ok border-volt-ok/20";
  }

  if (["Vencido", "Vencida", "Recusada", "Cancelado", "Cancelada", "Inadimplente", "Atrasado"].includes(status)) {
    return "bg-red-500/15 text-red-300 border-red-500/20";
  }

  if (["Em andamento", "Em atendimento", "Em negociação", "Aberto"].includes(status)) {
    return "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25";
  }

  return "bg-white/10 text-zinc-300 border-white/10";
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[.12em] ${className}`}>{children}</span>;
}

function ProgressBar({ value, danger = false }: { value: number; danger?: boolean }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full ${danger ? "bg-red-400" : "bg-volt-yellow"} shadow-[0_0_18px_rgba(255,203,47,.35)]`}
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "text-volt-yellow"
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <article className="card-premium rounded-3xl p-5">
      <Icon className={tone} size={26} />
      <p className={`mt-5 text-3xl font-black ${tone}`}>{value}</p>
      <p className="mt-1 text-sm font-black">{label}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{note}</p>
    </article>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  children
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card-premium rounded-[2rem] p-5 md:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">{subtitle}</p>
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-volt-yellow/25 bg-volt-yellow/10 text-volt-yellow">
          {icon}
        </div>
      </div>
      {children}
    </section>
  );
}

function makeReportHtml(kind: ReportKind, data: ReturnType<typeof calculateReportData>) {
  const safeKind = escapeHtml(kind);
  const generatedAt = new Date().toLocaleString("pt-BR");
  const topClients = data.topClients.slice(0, 8);
  const pendingFinance = data.pendingFinance.slice(0, 10);
  const recentOrders = data.recentOrders.slice(0, 10);
  const nextAppointments = data.nextAppointments.slice(0, 10);
  const quotePipeline = data.quotePipeline;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório ${safeKind} Volt</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f4f4f0;
      color: #121212;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { padding: 7mm 0; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .hero {
      border-radius: 24px;
      background: linear-gradient(135deg, #080808, #191810);
      color: white;
      padding: 28px;
      border: 1px solid #29261a;
      box-shadow: 0 20px 60px rgba(0,0,0,.16);
    }
    .kicker {
      color: #ffcb2f;
      font-weight: 900;
      letter-spacing: .22em;
      text-transform: uppercase;
      font-size: 11px;
    }
    h1 { margin: 10px 0 0; font-size: 34px; line-height: 1.06; }
    h2 { margin: 0 0 12px; font-size: 23px; }
    h3 { margin: 0; font-size: 15px; }
    p { margin: 0; line-height: 1.55; }
    .muted { color: #666; font-size: 12px; }
    .hero .muted { color: #bdbdbd; }
    .grid { display: grid; gap: 12px; }
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-4 { grid-template-columns: repeat(4, 1fr); }
    .card {
      background: white;
      border: 1px solid #e5e2d7;
      border-radius: 18px;
      padding: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,.06);
    }
    .section { margin-top: 16px; }
    .kpi-value { font-size: 23px; font-weight: 900; color: #111; margin-top: 8px; }
    .yellow { color: #d7a900; }
    .green { color: #139447; }
    .red { color: #c82f2f; }
    .blue { color: #2768d8; }
    table { width: 100%; border-collapse: separate; border-spacing: 0 8px; font-size: 11px; }
    th { text-align: left; color: #777; font-size: 10px; text-transform: uppercase; letter-spacing: .12em; padding: 0 10px; }
    td { background: white; padding: 10px; border-top: 1px solid #e8e5dc; border-bottom: 1px solid #e8e5dc; vertical-align: top; }
    td:first-child { border-left: 1px solid #e8e5dc; border-radius: 12px 0 0 12px; font-weight: 800; }
    td:last-child { border-right: 1px solid #e8e5dc; border-radius: 0 12px 12px 0; }
    .badge { display: inline-block; border-radius: 999px; padding: 4px 8px; background: #fff3bd; color: #7a5b00; font-size: 9px; font-weight: 900; text-transform: uppercase; }
    .bar { height: 8px; border-radius: 999px; background: #ece9df; overflow: hidden; margin-top: 8px; }
    .bar span { display:block; height:100%; background:#ffcb2f; border-radius:999px; }
    .footer { margin-top: 14px; color:#777; font-size:10px; display:flex; justify-content:space-between; }
    .note { border-left: 4px solid #ffcb2f; background:#fff8d7; padding:12px; border-radius:12px; }
  </style>
</head>
<body>
  <section class="page">
    <div class="hero">
      <div class="kicker">Volt Soluções Elétricas • ${safeKind}</div>
      <h1>Relatório ${safeKind}</h1>
      <p class="muted">Gerado em ${generatedAt}. Dados consolidados de orçamentos, assinaturas, OS, agenda, financeiro, clientes e metas.</p>
    </div>

    <div class="grid grid-4 section">
      <div class="card"><div class="muted">Receita recebida</div><div class="kpi-value green">${currency(data.revenueReceived)}</div></div>
      <div class="card"><div class="muted">Lucro parcial</div><div class="kpi-value yellow">${currency(data.profit)}</div></div>
      <div class="card"><div class="muted">OS abertas</div><div class="kpi-value blue">${data.ordersOpen}</div></div>
      <div class="card"><div class="muted">Agenda hoje</div><div class="kpi-value yellow">${data.appointmentsToday}</div></div>
    </div>

    <div class="grid grid-4 section">
      <div class="card"><div class="muted">Orçamentos aprovados</div><div class="kpi-value green">${data.approvedQuotes}</div></div>
      <div class="card"><div class="muted">Assinaturas</div><div class="kpi-value yellow">${data.signedQuotes}</div></div>
      <div class="card"><div class="muted">Contas em aberto</div><div class="kpi-value">${currency(data.revenueOpen)}</div></div>
      <div class="card"><div class="muted">Vencidos</div><div class="kpi-value red">${currency(data.overdue)}</div></div>
    </div>

    <div class="section card">
      <h2>Resumo executivo</h2>
      <p>O sistema possui <strong>${data.clients.length}</strong> cliente(s), <strong>${data.quotes.length}</strong> orçamento(s), <strong>${data.orders.length}</strong> ordem(ns) de serviço, <strong>${data.agenda.length}</strong> compromisso(s) e <strong>${data.finance.length}</strong> lançamento(s) financeiro(s). O resultado parcial registrado é de <strong>${currency(data.profit)}</strong>.</p>
      <div class="bar"><span style="width:${Math.min(data.monthlyGoalPercent, 100)}%"></span></div>
      <p class="muted">Meta mensal: ${percent(data.monthlyGoalPercent)} concluída.</p>
    </div>
    <div class="footer"><span>Volt Soluções Elétricas</span><span>Página 1</span></div>
  </section>

  <section class="page">
    <div class="hero">
      <div class="kicker">Financeiro e operação</div>
      <h1>Contas, OS e agenda</h1>
      <p class="muted">Acompanhamento operacional com pendências e próximos atendimentos.</p>
    </div>

    <div class="grid grid-2 section">
      <div class="card">
        <h2>Financeiro pendente</h2>
        <table>
          <thead><tr><th>Lançamento</th><th>Status</th><th>Vencimento</th><th>Valor</th></tr></thead>
          <tbody>
            ${pendingFinance.map((item) => `
              <tr>
                <td>${escapeHtml(textValue(item.title, "Lançamento"))}<br><span class="muted">${escapeHtml(textValue(item.clientSupplier, ""))}</span></td>
                <td><span class="badge">${escapeHtml(textValue(item.status, "Aberto"))}</span></td>
                <td>${escapeHtml(dateValue(item.dueDate))}</td>
                <td>${currency(numberValue(item.budgeted))}</td>
              </tr>
            `).join("") || `<tr><td colspan="4">Sem pendências financeiras.</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="card">
        <h2>Próximos atendimentos</h2>
        <table>
          <thead><tr><th>Cliente</th><th>Data</th><th>Status</th><th>OS</th></tr></thead>
          <tbody>
            ${nextAppointments.map((item) => `
              <tr>
                <td>${escapeHtml(textValue(item.client, "Cliente"))}<br><span class="muted">${escapeHtml(textValue(item.title, ""))}</span></td>
                <td>${escapeHtml(dateValue(item.date))} ${escapeHtml(textValue(item.start))}</td>
                <td><span class="badge">${escapeHtml(textValue(item.status, "Agendado"))}</span></td>
                <td>${escapeHtml(textValue(item.os, "Sem OS"))}</td>
              </tr>
            `).join("") || `<tr><td colspan="4">Sem compromissos encontrados.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <div class="section card">
      <h2>Ordens recentes</h2>
      <table>
        <thead><tr><th>OS</th><th>Cliente</th><th>Status</th><th>Valor</th><th>Pago</th></tr></thead>
        <tbody>
          ${recentOrders.map((item) => `
            <tr>
              <td>${escapeHtml(textValue(item.id, "OS"))}</td>
              <td>${escapeHtml(textValue(item.client, "Cliente"))}</td>
              <td><span class="badge">${escapeHtml(textValue(item.status, "Aberta"))}</span></td>
              <td>${currency(numberValue(item.value))}</td>
              <td>${currency(numberValue(item.paid))}</td>
            </tr>
          `).join("") || `<tr><td colspan="5">Nenhuma OS encontrada.</td></tr>`}
        </tbody>
      </table>
    </div>
    <div class="footer"><span>Volt Soluções Elétricas</span><span>Página 2</span></div>
  </section>

  <section class="page">
    <div class="hero">
      <div class="kicker">Clientes e comercial</div>
      <h1>Carteira, funil e alertas</h1>
      <p class="muted">Visão comercial para decisões e acompanhamento de crescimento.</p>
    </div>

    <div class="grid grid-2 section">
      <div class="card">
        <h2>Top clientes</h2>
        <table>
          <thead><tr><th>Cliente</th><th>Status</th><th>Faturado</th><th>Aberto</th></tr></thead>
          <tbody>
            ${topClients.map((client) => `
              <tr>
                <td>${escapeHtml(textValue(client.name, "Cliente"))}</td>
                <td><span class="badge">${escapeHtml(textValue(client.status, ""))}</span></td>
                <td>${currency(numberValue(client.totalRevenue))}</td>
                <td>${currency(numberValue(client.openAmount))}</td>
              </tr>
            `).join("") || `<tr><td colspan="4">Nenhum cliente encontrado.</td></tr>`}
          </tbody>
        </table>
      </div>

      <div class="card">
        <h2>Funil de orçamentos</h2>
        ${quotePipeline.map((item) => `
          <div style="margin-bottom: 10px;">
            <strong>${escapeHtml(item.status)}</strong>
            <span style="float:right;">${item.count}</span>
            <div class="bar"><span style="width:${Math.min((item.count / Math.max(data.quotes.length, 1)) * 100, 100)}%"></span></div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="section card">
      <h2>Recomendações automáticas</h2>
      <div class="note">
        <p><strong>1.</strong> Priorizar cobrança de vencidos: ${currency(data.overdue)}.</p>
        <p><strong>2.</strong> Acompanhar propostas em aberto: ${currency(data.quoteValueOpen)} em negociação.</p>
        <p><strong>3.</strong> Converter OS abertas em agenda e financeiro para manter o fluxo completo.</p>
        <p><strong>4.</strong> Manter documentos vinculados ao cliente para melhorar histórico, provas de execução e relatórios.</p>
      </div>
    </div>
    <div class="footer"><span>Volt Soluções Elétricas</span><span>Página 3</span></div>
  </section>
</body>
</html>`;
}

function calculateReportData(data: {
  quotes: AnyRecord[];
  orders: AnyRecord[];
  agenda: AnyRecord[];
  finance: AnyRecord[];
  clients: AnyRecord[];
  goals: AnyRecord[];
}) {
  const today = todayIso();

  const revenueReceived = data.finance
    .filter((item) => ["Receita", "Conta a receber"].includes(textValue(item.type)))
    .filter((item) => textValue(item.status) === "Recebido")
    .reduce((sum, item) => sum + numberValue(item.actual, numberValue(item.budgeted)), 0);

  const revenueOpen = data.finance
    .filter((item) => ["Receita", "Conta a receber"].includes(textValue(item.type)))
    .filter((item) => ["Aberto", "Vencido"].includes(textValue(item.status)))
    .reduce((sum, item) => sum + Math.max(numberValue(item.budgeted) - numberValue(item.actual), 0), 0);

  const expenses = data.finance
    .filter((item) => ["Despesa", "Conta a pagar"].includes(textValue(item.type)))
    .filter((item) => ["Pago", "Aberto", "Vencido"].includes(textValue(item.status)))
    .reduce((sum, item) => sum + numberValue(item.actual, numberValue(item.budgeted)), 0);

  const overdue = data.finance
    .filter((item) => textValue(item.status) === "Vencido")
    .reduce((sum, item) => sum + numberValue(item.budgeted), 0);

  const quoteValueOpen = data.quotes
    .filter((quote) => !["Aprovada", "Recusada", "Vencida", "Convertida em OS"].includes(textValue(quote.status)))
    .reduce((sum, quote) => sum + quoteTotal(quote), 0);

  const signedQuotes = data.quotes.filter((quote) => textValue(quote.signatureStatus) === "Assinada").length;
  const approvedQuotes = data.quotes.filter((quote) => ["Aprovada", "Convertida em OS"].includes(textValue(quote.status))).length;
  const ordersOpen = data.orders.filter((order) => !["Finalizada", "Cancelada"].includes(textValue(order.status))).length;
  const ordersProgress = data.orders.filter((order) => textValue(order.status) === "Em andamento").length;
  const ordersFinished = data.orders.filter((order) => textValue(order.status) === "Finalizada").length;
  const appointmentsToday = data.agenda.filter((item) => dateValue(item.date) === today).length;
  const appointmentsOpen = data.agenda.filter((item) => !["Concluído", "Cancelado"].includes(textValue(item.status))).length;

  const monthlyRevenueGoal = data.goals.find((goal) => textValue(goal.period) === "Mensal" && textValue(goal.category) === "Faturamento");
  const monthlyTarget = numberValue(monthlyRevenueGoal?.target, 25000);
  const monthlyActual = numberValue(monthlyRevenueGoal?.actual, revenueReceived + revenueOpen);
  const monthlyGoalPercent = monthlyTarget ? monthlyActual / monthlyTarget * 100 : 0;

  const topClients = [...data.clients]
    .sort((a, b) => numberValue(b.totalRevenue) - numberValue(a.totalRevenue));

  const pendingFinance = data.finance
    .filter((item) => ["Aberto", "Vencido"].includes(textValue(item.status)))
    .sort((a, b) => dateValue(a.dueDate).localeCompare(dateValue(b.dueDate)));

  const recentOrders = [...data.orders].reverse();

  const nextAppointments = [...data.agenda]
    .filter((item) => dateValue(item.date) >= today || !["Concluído", "Cancelado"].includes(textValue(item.status)))
    .sort((a, b) => `${dateValue(a.date)} ${textValue(a.start)}`.localeCompare(`${dateValue(b.date)} ${textValue(b.start)}`));

  const quoteColumns = ["Rascunho", "Enviada", "Aguardando retorno", "Em negociação", "Aprovada", "Convertida em OS"];
  const quotePipeline = quoteColumns.map((status) => ({
    status,
    count: data.quotes.filter((quote) => textValue(quote.status) === status).length
  }));

  return {
    ...data,
    revenueReceived,
    revenueOpen,
    expenses,
    profit: revenueReceived - expenses,
    overdue,
    quoteValueOpen,
    signedQuotes,
    approvedQuotes,
    ordersOpen,
    ordersProgress,
    ordersFinished,
    appointmentsToday,
    appointmentsOpen,
    monthlyTarget,
    monthlyActual,
    monthlyGoalPercent,
    topClients,
    pendingFinance,
    recentOrders,
    nextAppointments,
    quotePipeline
  };
}

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState("Visão Geral");
  const [updatedAt, setUpdatedAt] = useState("");
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [data, setData] = useState({
    quotes: [] as AnyRecord[],
    orders: [] as AnyRecord[],
    agenda: [] as AnyRecord[],
    finance: [] as AnyRecord[],
    clients: [] as AnyRecord[],
    goals: [] as AnyRecord[]
  });

  function refreshData() {
    setData({
      quotes: readArray(STORAGE.quotes),
      orders: readArray(STORAGE.orders),
      agenda: readArray(STORAGE.agenda),
      finance: readArray(STORAGE.finance),
      clients: readArray(STORAGE.clients),
      goals: readArray(STORAGE.goals)
    });

    setHistory(readArray(STORAGE.reports) as ReportHistory[]);
    setUpdatedAt(new Date().toLocaleString("pt-BR"));
  }

  useEffect(() => {
    refreshData();

    window.addEventListener("storage", refreshData);
    window.addEventListener("volt:ordem-criada", refreshData);
    window.addEventListener("volt:financeiro-lancamento-criado", refreshData);
    window.addEventListener("volt:agenda-compromisso-criado", refreshData);
    window.addEventListener("volt:ordem-atualizada-por-agenda", refreshData);
    window.addEventListener("volt:ordem-pagamento-atualizado", refreshData);

    return () => {
      window.removeEventListener("storage", refreshData);
      window.removeEventListener("volt:ordem-criada", refreshData);
      window.removeEventListener("volt:financeiro-lancamento-criado", refreshData);
      window.removeEventListener("volt:agenda-compromisso-criado", refreshData);
      window.removeEventListener("volt:ordem-atualizada-por-agenda", refreshData);
      window.removeEventListener("volt:ordem-pagamento-atualizado", refreshData);
    };
  }, []);

  const reportData = useMemo(() => calculateReportData(data), [data]);

  function registerHistory(kind: ReportKind, status: "Gerado" | "Erro") {
    const next: ReportHistory = {
      id: `REL-${String(Date.now()).slice(-6)}`,
      kind,
      title: `Relatório ${kind}`,
      date: new Date().toLocaleString("pt-BR"),
      format: "PDF",
      status
    };

    const updatedHistory = [next, ...history].slice(0, 20);
    setHistory(updatedHistory);
    saveArray(STORAGE.reports, updatedHistory);
  }

  function generateReport(kind: ReportKind) {
    try {
      const report = window.open("", "_blank", "width=1200,height=900");

      if (!report) {
        alert("O navegador bloqueou a janela do relatório. Permita pop-ups para gerar o PDF.");
        registerHistory(kind, "Erro");
        return;
      }

      report.document.open();
      report.document.write(makeReportHtml(kind, reportData));
      report.document.close();

      registerHistory(kind, "Gerado");

      setTimeout(() => {
        report.focus();
        report.print();
      }, 500);
    } catch {
      registerHistory(kind, "Erro");
      alert("Não foi possível gerar o relatório agora.");
    }
  }

  function exportReportCsv() {
    const rows = [
      ["Indicador", "Valor"],
      ["Receita recebida", reportData.revenueReceived],
      ["Receita em aberto", reportData.revenueOpen],
      ["Despesas", reportData.expenses],
      ["Lucro parcial", reportData.profit],
      ["Vencidos", reportData.overdue],
      ["Clientes", reportData.clients.length],
      ["Orçamentos", reportData.quotes.length],
      ["OS", reportData.orders.length],
      ["Compromissos", reportData.agenda.length],
      ["Financeiro", reportData.finance.length]
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "relatorio-geral-volt.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const tabs = ["Visão Geral", "Modelos", "Histórico", "Alertas", "Exportações"];

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111821] via-[#080c11] to-black p-5 shadow-soft md:p-7">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-volt-yellow/20 blur-[130px]" />
          <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">BI Volt</p>
              <h1 className="mt-2 text-4xl font-black leading-tight md:text-5xl">Relatórios integrados</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                Relatórios executivos com dados reais de orçamentos, assinaturas, ordens de serviço, agenda, financeiro, clientes e metas.
              </p>
              <p className="mt-2 text-xs font-bold text-zinc-600">Última atualização: {updatedAt || "carregando..."}</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
              <button onClick={refreshData} className="btn-primary inline-flex items-center justify-center gap-2"><RefreshCcw size={17} /> Atualizar dados</button>
              <button onClick={() => generateReport("Executivo")} className="btn-ghost inline-flex items-center justify-center gap-2"><FileText size={17} /> PDF executivo</button>
              <button onClick={exportReportCsv} className="btn-ghost inline-flex items-center justify-center gap-2"><Download size={17} /> CSV geral</button>
            </div>
          </div>
        </section>

        <section className="volt-scroll flex gap-2 overflow-x-auto rounded-[2rem] border border-white/10 bg-white/[.025] p-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition ${
                activeTab === tab ? "bg-volt-yellow text-black shadow-glow" : "text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </section>

        {activeTab === "Visão Geral" && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Receita recebida" value={currency(reportData.revenueReceived)} note={`${currency(reportData.revenueOpen)} em aberto`} icon={Wallet} tone="text-volt-ok" />
              <KpiCard label="Lucro parcial" value={currency(reportData.profit)} note={`${currency(reportData.expenses)} em despesas/contas`} icon={TrendingUp} tone={reportData.profit >= 0 ? "text-volt-yellow" : "text-red-300"} />
              <KpiCard label="OS abertas" value={String(reportData.ordersOpen)} note={`${reportData.ordersProgress} em andamento • ${reportData.ordersFinished} finalizadas`} icon={ClipboardCheck} tone="text-blue-300" />
              <KpiCard label="Meta mensal" value={percent(reportData.monthlyGoalPercent)} note={`${currency(reportData.monthlyActual)} de ${currency(reportData.monthlyTarget)}`} icon={Target} tone="text-volt-yellow" />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_.9fr]">
              <Panel title="Resumo executivo" subtitle="Leitura do sistema" icon={<Gauge size={25} />}>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ["Clientes", reportData.clients.length],
                    ["Orçamentos", reportData.quotes.length],
                    ["Assinaturas", reportData.signedQuotes],
                    ["OS", reportData.orders.length],
                    ["Agenda", reportData.agenda.length],
                    ["Financeiro", reportData.finance.length],
                    ["Vencidos", currency(reportData.overdue)],
                    ["Em negociação", currency(reportData.quoteValueOpen)]
                  ].map(([label, value]) => (
                    <div key={label as string} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                      <p className="text-xs font-black uppercase tracking-[.14em] text-zinc-600">{label as string}</p>
                      <p className="mt-2 text-2xl font-black text-volt-yellow">{value as string}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 p-4 text-sm leading-7 text-zinc-300">
                  O sistema está consolidando dados de {reportData.clients.length} cliente(s), {reportData.quotes.length} orçamento(s), {reportData.orders.length} OS, {reportData.agenda.length} compromisso(s) e {reportData.finance.length} lançamento(s) financeiro(s).
                </div>
              </Panel>

              <Panel title="Meta mensal" subtitle="Faturamento" icon={<Target size={25} />}>
                <p className="text-5xl font-black text-volt-yellow">{percent(reportData.monthlyGoalPercent)}</p>
                <p className="mt-2 text-sm text-zinc-500">{currency(reportData.monthlyActual)} de {currency(reportData.monthlyTarget)}</p>
                <div className="mt-5">
                  <ProgressBar value={reportData.monthlyGoalPercent} />
                </div>

                <div className="mt-5 grid gap-3">
                  {[
                    ["Recebido", currency(reportData.revenueReceived), "text-volt-ok"],
                    ["Em aberto", currency(reportData.revenueOpen), "text-volt-yellow"],
                    ["Vencido", currency(reportData.overdue), "text-red-300"]
                  ].map(([label, value, color]) => (
                    <div key={label} className="flex justify-between rounded-2xl border border-white/10 bg-black/35 p-4 text-sm">
                      <span className="text-zinc-500">{label}</span>
                      <strong className={color}>{value}</strong>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>
          </>
        )}

        {activeTab === "Modelos" && (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {reportModels.map((model) => {
              const Icon = model.icon;

              return (
                <article key={model.kind} className="card-premium rounded-[2rem] p-5">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-volt-yellow text-black">
                      <Icon size={26} />
                    </div>
                    <Badge className="bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25">{model.kind}</Badge>
                  </div>

                  <h3 className="text-2xl font-black">{model.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">{model.description}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {model.modules.map((module) => (
                      <span key={module} className="rounded-full border border-white/10 bg-white/[.035] px-3 py-2 text-xs font-bold text-zinc-400">{module}</span>
                    ))}
                  </div>

                  <button onClick={() => generateReport(model.kind)} className="btn-primary mt-6 w-full">Gerar PDF</button>
                </article>
              );
            })}
          </section>
        )}

        {activeTab === "Histórico" && (
          <section className="card-premium rounded-[2rem] p-5 md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Histórico</p>
                <h2 className="mt-1 text-2xl font-black">Relatórios gerados</h2>
              </div>
              <FileText className="text-volt-yellow" size={28} />
            </div>

            <div className="volt-scroll overflow-x-auto">
              <table className="w-full min-w-[850px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[.16em] text-zinc-600">
                    <th className="px-4 py-2">Relatório</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Formato</th>
                    <th className="px-4 py-2">Data</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="bg-white/[.035] text-sm">
                      <td className="rounded-l-2xl px-4 py-4 font-black">{item.title}<br /><span className="text-xs text-zinc-500">{item.id}</span></td>
                      <td className="px-4 py-4">{item.kind}</td>
                      <td className="px-4 py-4">{item.format}</td>
                      <td className="px-4 py-4">{item.date}</td>
                      <td className="rounded-r-2xl px-4 py-4"><Badge className={statusClass(item.status)}>{item.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {history.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5 text-sm font-bold text-zinc-400">
                Nenhum relatório gerado ainda.
              </div>
            )}
          </section>
        )}

        {activeTab === "Alertas" && (
          <section className="grid gap-5 xl:grid-cols-2">
            <Panel title="Alertas automáticos" subtitle="Atenção operacional" icon={<AlertTriangle size={25} />}>
              <div className="space-y-3">
                {[
                  reportData.overdue > 0 ? `Existem ${currency(reportData.overdue)} em lançamentos vencidos.` : "Sem valores vencidos no financeiro.",
                  reportData.quoteValueOpen > 0 ? `Existem ${currency(reportData.quoteValueOpen)} em propostas abertas para acompanhamento.` : "Sem propostas abertas relevantes.",
                  reportData.ordersOpen > 0 ? `${reportData.ordersOpen} OS ainda abertas no sistema.` : "Nenhuma OS aberta.",
                  reportData.appointmentsOpen > 0 ? `${reportData.appointmentsOpen} compromisso(s) aberto(s) na agenda.` : "Agenda sem compromissos abertos."
                ].map((alert) => (
                  <div key={alert} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <AlertTriangle className="shrink-0 text-volt-yellow" size={18} />
                    <p className="text-sm leading-6 text-zinc-300">{alert}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Recomendações" subtitle="Próximas ações" icon={<CheckCircle2 size={25} />}>
              <div className="space-y-3">
                {[
                  "Gerar relatório executivo semanal para acompanhar crescimento.",
                  "Conferir contas vencidas e acionar clientes com pendência.",
                  "Atualizar CRM após novas OS e lançamentos financeiros.",
                  "Vincular documentos ao cliente para melhorar histórico e provas de execução.",
                  "Acompanhar funil de orçamentos assinados e convertidos em OS."
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <CheckCircle2 className="shrink-0 text-volt-ok" size={18} />
                    <p className="text-sm leading-6 text-zinc-300">{item}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeTab === "Exportações" && (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {([
              { title: "PDF Executivo", description: "Relatório geral com todas as áreas.", action: () => generateReport("Executivo"), Icon: FileText },
              { title: "PDF Financeiro", description: "Receitas, despesas e contas.", action: () => generateReport("Financeiro"), Icon: Wallet },
              { title: "PDF Operacional", description: "OS, agenda e atendimentos.", action: () => generateReport("Operacional"), Icon: Wrench },
              { title: "PDF Clientes", description: "CRM, carteira e inadimplência.", action: () => generateReport("Clientes"), Icon: Users },
              { title: "CSV Geral", description: "Resumo numérico para planilha.", action: exportReportCsv, Icon: Download }
            ] as { title: string; description: string; action: () => void; Icon: LucideIcon }[]).map(({ title, description, action, Icon }) => (
              <article key={title} className="card-premium rounded-[2rem] p-5">
                <Icon className="text-volt-yellow" size={30} />
                <h3 className="mt-5 text-2xl font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
                <button onClick={action} className="btn-primary mt-6 w-full">Gerar</button>
              </article>
            ))}
          </section>
        )}

        <section className="rounded-[2rem] border border-volt-yellow/20 bg-volt-yellow/10 p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Base consolidada</p>
              <p className="mt-2 text-sm leading-7 text-zinc-300">
                {reportData.clients.length} clientes • {reportData.quotes.length} orçamentos • {reportData.orders.length} OS • {reportData.agenda.length} compromissos • {reportData.finance.length} lançamentos.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard" className="btn-ghost">Dashboard</Link>
              <Link href="/financeiro" className="btn-ghost">Financeiro</Link>
              <Link href="/clientes" className="btn-ghost">Clientes</Link>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
