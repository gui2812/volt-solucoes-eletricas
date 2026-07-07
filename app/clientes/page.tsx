"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  FolderOpen,
  MapPin,
  MessageCircle,
  PieChart,
  Plus,
  RefreshCcw,
  Search,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Zap
} from "lucide-react";
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";

type ClientStatus = "Lead" | "Ativo" | "Inativo" | "Inadimplente" | "Recorrente" | "Em negociação" | "Bloqueado";
type ClientType = "Pessoa física" | "Pessoa jurídica" | "Condomínio" | "Empresa" | "Loja" | "Escritório" | "Residencial";

type Client = {
  id: string;
  name: string;
  fantasyName: string;
  type: ClientType;
  document: string;
  status: ClientStatus;
  category: string;
  origin: string;
  phone: string;
  whatsapp: string;
  email: string;
  neighborhood: string;
  city: string;
  address: string;
  responsible: string;
  serviceInterest: string;
  recurrence: string;
  totalOs: number;
  totalQuotes: number;
  totalVisits: number;
  totalRevenue: number;
  received: number;
  openAmount: number;
  overdue: number;
  lastService: string;
  nextService: string;
  ticketAverage: number;
  rating: "Comum" | "Recorrente" | "Estratégico" | "VIP" | "Atenção" | "Inadimplente";
  notes: string;
  timeline: string[];
  documents: string[];
};

type Lead = {
  id: string;
  name: string;
  phone: string;
  origin: string;
  service: string;
  estimatedValue: number;
  status: "Novo" | "Em contato" | "Orçamento enviado" | "Negociação" | "Convertido" | "Perdido";
  temperature: "Frio" | "Morno" | "Quente";
  nextContact: string;
  responsible: string;
};

const clientsSeed: Client[] = [
  {
    id: "CLI-001",
    name: "Condomínio JK 1455",
    fantasyName: "JK 1455",
    type: "Condomínio",
    document: "00.000.000/0001-01",
    status: "Recorrente",
    category: "Cliente estratégico",
    origin: "Indicação",
    phone: "(11) 98878-3401",
    whatsapp: "(11) 98878-3401",
    email: "contato@jk1455.com",
    neighborhood: "Vila Olímpia",
    city: "São Paulo/SP",
    address: "Vila Olímpia, São Paulo/SP",
    responsible: "Guilherme Santana",
    serviceInterest: "Manutenção predial",
    recurrence: "Mensal",
    totalOs: 12,
    totalQuotes: 8,
    totalVisits: 14,
    totalRevenue: 24800,
    received: 22100,
    openAmount: 2700,
    overdue: 0,
    lastService: "2026-06-25",
    nextService: "2026-07-15",
    ticketAverage: 2066,
    rating: "Estratégico",
    notes: "Cliente com manutenção recorrente e alto potencial de contrato mensal.",
    timeline: ["Cliente cadastrado", "Cotação QDC enviada", "OS-1042 aberta", "Visita técnica realizada", "Pagamento parcial recebido"],
    documents: ["Fotos do quadro", "Relatório técnico", "Comprovante Pix"]
  },
  {
    id: "CLI-002",
    name: "Clínica Vida",
    fantasyName: "Clínica Vida",
    type: "Empresa",
    document: "11.111.111/0001-11",
    status: "Inadimplente",
    category: "Cliente em atenção",
    origin: "Google",
    phone: "(11) 93333-3333",
    whatsapp: "(11) 93333-3333",
    email: "financeiro@clinicavida.com",
    neighborhood: "Tatuapé",
    city: "São Paulo/SP",
    address: "Tatuapé, São Paulo/SP",
    responsible: "Guilherme Santana",
    serviceInterest: "Manutenção corretiva",
    recurrence: "Sob demanda",
    totalOs: 5,
    totalQuotes: 4,
    totalVisits: 6,
    totalRevenue: 9800,
    received: 7200,
    openAmount: 2600,
    overdue: 980,
    lastService: "2026-06-25",
    nextService: "2026-06-30",
    ticketAverage: 1960,
    rating: "Inadimplente",
    notes: "Cliente com urgências recorrentes e pendência financeira em aberto.",
    timeline: ["Lead recebido pelo Google", "Atendimento emergencial", "OS-1044 aberta", "Conta vencida detectada"],
    documents: ["Fotos da falha", "Relatório emergencial"]
  },
  {
    id: "CLI-003",
    name: "Sala Comercial Vikings",
    fantasyName: "Vikings",
    type: "Escritório",
    document: "22.222.222/0001-22",
    status: "Em negociação",
    category: "Cliente potencial",
    origin: "WhatsApp",
    phone: "(11) 94444-4444",
    whatsapp: "(11) 94444-4444",
    email: "contato@vikings.com",
    neighborhood: "Brooklin",
    city: "São Paulo/SP",
    address: "Brooklin, São Paulo/SP",
    responsible: "Guilherme Santana",
    serviceInterest: "Automação de iluminação",
    recurrence: "Projeto",
    totalOs: 1,
    totalQuotes: 2,
    totalVisits: 1,
    totalRevenue: 1600,
    received: 0,
    openAmount: 1600,
    overdue: 0,
    lastService: "2026-06-20",
    nextService: "2026-06-27",
    ticketAverage: 1600,
    rating: "VIP",
    notes: "Oportunidade para automação, iluminação e futuras melhorias.",
    timeline: ["Contato via WhatsApp", "Visita técnica agendada", "Cotação de automação enviada"],
    documents: ["Fotos do ambiente", "Checklist automação"]
  },
  {
    id: "CLI-004",
    name: "Escritório Corporativo Vila Olímpia",
    fantasyName: "Corp Vila Olímpia",
    type: "Empresa",
    document: "33.333.333/0001-33",
    status: "Ativo",
    category: "Cliente recorrente",
    origin: "Indicação",
    phone: "(11) 92222-2222",
    whatsapp: "(11) 92222-2222",
    email: "facilities@corp.com",
    neighborhood: "Vila Olímpia",
    city: "São Paulo/SP",
    address: "Vila Olímpia, São Paulo/SP",
    responsible: "Guilherme Santana",
    serviceInterest: "Iluminação e manutenção",
    recurrence: "Trimestral",
    totalOs: 7,
    totalQuotes: 5,
    totalVisits: 8,
    totalRevenue: 11800,
    received: 11800,
    openAmount: 0,
    overdue: 0,
    lastService: "2026-06-24",
    nextService: "2026-08-10",
    ticketAverage: 1685,
    rating: "Recorrente",
    notes: "Bom histórico de pagamento e demandas de iluminação.",
    timeline: ["Cliente cadastrado", "OS iluminação finalizada", "Pagamento recebido", "Retorno técnico realizado"],
    documents: ["Fotos antes/depois", "Comprovante", "Relatório de entrega"]
  },
  {
    id: "CLI-005",
    name: "Cliente Residencial 01",
    fantasyName: "Residencial 01",
    type: "Pessoa física",
    document: "000.000.000-00",
    status: "Ativo",
    category: "Residencial",
    origin: "Instagram",
    phone: "(11) 90000-0000",
    whatsapp: "(11) 90000-0000",
    email: "cliente@email.com",
    neighborhood: "Mooca",
    city: "São Paulo/SP",
    address: "Mooca, São Paulo/SP",
    responsible: "Guilherme Santana",
    serviceInterest: "Circuito dedicado",
    recurrence: "Sob demanda",
    totalOs: 2,
    totalQuotes: 2,
    totalVisits: 2,
    totalRevenue: 1670,
    received: 1250,
    openAmount: 420,
    overdue: 0,
    lastService: "2026-06-26",
    nextService: "2026-07-02",
    ticketAverage: 835,
    rating: "Comum",
    notes: "Cliente residencial com potencial para adequação de quadro.",
    timeline: ["Contato pelo Instagram", "Cotação circuito dedicado", "Visita agendada"],
    documents: ["Foto da tomada", "Cotação enviada"]
  }
];

const leadsSeed: Lead[] = [
  { id: "LEAD-001", name: "Mercado São José", phone: "(11) 95555-5555", origin: "Google", service: "Manutenção preventiva", estimatedValue: 2800, status: "Novo", temperature: "Quente", nextContact: "2026-06-26", responsible: "Guilherme" },
  { id: "LEAD-002", name: "Administradora Predial", phone: "(11) 96666-6666", origin: "Indicação", service: "Contrato mensal", estimatedValue: 4500, status: "Em contato", temperature: "Quente", nextContact: "2026-06-27", responsible: "Guilherme" },
  { id: "LEAD-003", name: "Restaurante Energia", phone: "(11) 97777-7777", origin: "Instagram", service: "Quadro elétrico", estimatedValue: 3200, status: "Orçamento enviado", temperature: "Morno", nextContact: "2026-06-28", responsible: "Guilherme" },
  { id: "LEAD-004", name: "Cliente GetNinjas", phone: "(11) 98888-8888", origin: "GetNinjas", service: "Tomada dedicada", estimatedValue: 650, status: "Negociação", temperature: "Morno", nextContact: "2026-06-29", responsible: "Guilherme" },
  { id: "LEAD-005", name: "Loja Comercial Centro", phone: "(11) 99999-0000", origin: "Site", service: "Iluminação", estimatedValue: 1900, status: "Convertido", temperature: "Quente", nextContact: "2026-07-01", responsible: "Guilherme" }
];

const tabs = ["Visão Geral", "Lista de Clientes", "Leads", "Mapa/Regiões", "Histórico", "Financeiro por Cliente", "Documentos", "Relatórios"];
const leadColumns: Lead["status"][] = ["Novo", "Em contato", "Orçamento enviado", "Negociação", "Convertido", "Perdido"];

const statusColors: Record<ClientStatus, string> = {
  Lead: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  Ativo: "bg-volt-ok/15 text-volt-ok border-volt-ok/20",
  Inativo: "bg-white/10 text-zinc-300 border-white/10",
  Inadimplente: "bg-red-500/15 text-red-300 border-red-500/20",
  Recorrente: "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25",
  "Em negociação": "bg-purple-500/15 text-purple-300 border-purple-500/20",
  Bloqueado: "bg-red-500/15 text-red-300 border-red-500/20"
};

const ratingColors: Record<Client["rating"], string> = {
  Comum: "bg-white/10 text-zinc-300 border-white/10",
  Recorrente: "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25",
  Estratégico: "bg-purple-500/15 text-purple-300 border-purple-500/20",
  VIP: "bg-volt-ok/15 text-volt-ok border-volt-ok/20",
  Atenção: "bg-orange-500/15 text-orange-300 border-orange-500/20",
  Inadimplente: "bg-red-500/15 text-red-300 border-red-500/20"
};

const leadColors: Record<Lead["temperature"], string> = {
  Frio: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  Morno: "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25",
  Quente: "bg-red-500/15 text-red-300 border-red-500/20"
};

function currency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeDate() {
  return new Date().toLocaleString("pt-BR");
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[.12em] ${className}`}>{children}</span>;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-volt-yellow shadow-[0_0_18px_rgba(255,203,47,.35)]" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function ChartCard({ title, subtitle, icon, children }: { title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card-premium rounded-[2rem] p-5 md:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">CRM</p>
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{subtitle}</p>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-volt-yellow/25 bg-volt-yellow/10 text-volt-yellow">{icon}</div>
      </div>
      {children}
    </section>
  );
}

function ClientEvolutionChart() {
  const data = [
    { month: "Jan", clientes: 12, faturamento: 5200 },
    { month: "Fev", clientes: 18, faturamento: 7800 },
    { month: "Mar", clientes: 22, faturamento: 9600 },
    { month: "Abr", clientes: 29, faturamento: 13200 },
    { month: "Mai", clientes: 34, faturamento: 15800 },
    { month: "Jun", clientes: 38, faturamento: 18450 }
  ];
  const width = 740;
  const height = 260;
  const pad = 34;
  const maxRevenue = Math.max(...data.map((item) => item.faturamento));
  const maxClients = Math.max(...data.map((item) => item.clientes));
  const revenuePoints = data.map((item, index) => {
    const x = pad + (index * (width - pad * 2)) / (data.length - 1);
    const y = height - pad - (item.faturamento / maxRevenue) * (height - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const clientPoints = data.map((item, index) => {
    const x = pad + (index * (width - pad * 2)) / (data.length - 1);
    const y = height - pad - (item.clientes / maxClients) * (height - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full">
        {[0, 1, 2, 3].map((line) => {
          const y = pad + (line * (height - pad * 2)) / 3;
          return <line key={line} x1={pad} x2={width - pad} y1={y} y2={y} stroke="rgba(255,255,255,.08)" />;
        })}
        <polyline fill="none" stroke="#ffcb2f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" points={revenuePoints} />
        <polyline fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={clientPoints} />
        {data.map((item, index) => {
          const x = pad + (index * (width - pad * 2)) / (data.length - 1);
          return <text key={item.month} x={x} y={height - 6} textAnchor="middle" fill="rgba(255,255,255,.55)" fontSize="13" fontWeight="700">{item.month}</text>;
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-zinc-400">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-volt-yellow" /> Faturamento</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-volt-ok" /> Clientes</span>
      </div>
    </div>
  );
}

function TopClientsChart({ clients }: { clients: Client[] }) {
  const sorted = [...clients].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
  const max = Math.max(...sorted.map((item) => item.totalRevenue), 1);

  return (
    <div className="space-y-4">
      {sorted.map((client) => (
        <div key={client.id} className="rounded-2xl border border-white/10 bg-black/35 p-4">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="font-black">{client.fantasyName}</p>
            <p className="text-sm font-black text-volt-yellow">{currency(client.totalRevenue)}</p>
          </div>
          <ProgressBar value={(client.totalRevenue / max) * 100} />
        </div>
      ))}
    </div>
  );
}

function ClientComposition() {
  const data = [
    { label: "Condomínio", value: 28, color: "#ffcb2f" },
    { label: "Empresa", value: 24, color: "#22c55e" },
    { label: "Residencial", value: 20, color: "#38bdf8" },
    { label: "Escritório", value: 16, color: "#a78bfa" },
    { label: "Loja", value: 12, color: "#f97316" }
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
              <p className="text-xs font-bold text-zinc-500">clientes</p>
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


const CLIENTS_STORAGE_KEY = "volt_clientes_crm_v1";
const DELETED_CLIENTS_STORAGE_KEY = "volt_clientes_excluidos_v1";
const QUOTES_STORAGE_KEY = "volt_cotacoes_premium_v1";
const ORDERS_STORAGE_KEY = "volt_ordens_premium_v1";
const AGENDA_STORAGE_KEY = "volt_agenda_premium_v1";
const FINANCE_STORAGE_KEY = "volt_financeiro_premium_v1";

function readArrayFromStorage(key: string) {
  if (typeof window === "undefined") return [] as Record<string, unknown>[];

  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed as Record<string, unknown>[] : [];
  } catch {
    return [];
  }
}

function readClientsFromStorage() {
  if (typeof window === "undefined") return clientsSeed;

  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);

    if (raw !== null) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed as unknown as Client[] : [];
    }

    return clientsSeed;
  } catch {
    return clientsSeed;
  }
}

function readDeletedClientKeys() {
  if (typeof window === "undefined") return [] as string[];

  try {
    const raw = localStorage.getItem(DELETED_CLIENTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") as string[] : [];
  } catch {
    return [];
  }
}

function isDeletedClient(client: Pick<Client, "id" | "name" | "phone" | "email">, deletedKeys: string[]) {
  return deletedKeys.includes(client.id) || deletedKeys.includes(clientKey(client));
}

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function clientKey(client: Pick<Client, "name" | "phone" | "email">) {
  const phone = normalizePhone(client.phone);

  if (phone) return `phone:${phone}`;
  if (client.email) return `email:${client.email.toLowerCase()}`;

  return `name:${client.name.toLowerCase().trim()}`;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function makeClientFromPartial(partial: Partial<Client> & { name: string }) {
  const name = partial.name || "Cliente não informado";
  const phone = partial.phone || "";

  return {
    id: partial.id || `CLI-${String(Date.now()).slice(-6)}`,
    name,
    fantasyName: partial.fantasyName || name,
    type: partial.type || "Pessoa física",
    document: partial.document || "Pendente",
    status: partial.status || "Ativo",
    category: partial.category || "Cliente integrado",
    origin: partial.origin || "Sistema Volt",
    phone,
    whatsapp: partial.whatsapp || phone,
    email: partial.email || "",
    neighborhood: partial.neighborhood || "A definir",
    city: partial.city || "São Paulo/SP",
    address: partial.address || "",
    responsible: partial.responsible || "Guilherme Santana",
    serviceInterest: partial.serviceInterest || "A definir",
    recurrence: partial.recurrence || "Sob demanda",
    totalOs: partial.totalOs || 0,
    totalQuotes: partial.totalQuotes || 0,
    totalVisits: partial.totalVisits || 0,
    totalRevenue: partial.totalRevenue || 0,
    received: partial.received || 0,
    openAmount: partial.openAmount || 0,
    overdue: partial.overdue || 0,
    lastService: partial.lastService || "Sem atendimento",
    nextService: partial.nextService || "A definir",
    ticketAverage: partial.ticketAverage || 0,
    rating: partial.rating || "Comum",
    notes: partial.notes || "",
    timeline: partial.timeline || [],
    documents: partial.documents || []
  } as Client;
}

function mergeClientCollections(...collections: Client[][]) {
  const map = new Map<string, Client>();

  collections.flat().forEach((client) => {
    const key = clientKey(client);
    const current = map.get(key);

    if (!current) {
      map.set(key, client);
      return;
    }

    const totalOs = Math.max(current.totalOs || 0, client.totalOs || 0);
    const totalQuotes = Math.max(current.totalQuotes || 0, client.totalQuotes || 0);
    const totalVisits = Math.max(current.totalVisits || 0, client.totalVisits || 0);
    const totalRevenue = Math.max(current.totalRevenue || 0, client.totalRevenue || 0);
    const received = Math.max(current.received || 0, client.received || 0);
    const openAmount = Math.max(current.openAmount || 0, client.openAmount || 0);
    const overdue = Math.max(current.overdue || 0, client.overdue || 0);
    const totalServices = Math.max(totalOs, 1);

    map.set(key, {
      ...current,
      ...client,
      id: current.id,
      name: current.name || client.name,
      fantasyName: current.fantasyName || client.fantasyName,
      document: current.document && current.document !== "Pendente" ? current.document : client.document,
      phone: current.phone || client.phone,
      whatsapp: current.whatsapp || client.whatsapp,
      email: current.email || client.email,
      address: current.address || client.address,
      totalOs,
      totalQuotes,
      totalVisits,
      totalRevenue,
      received,
      openAmount,
      overdue,
      ticketAverage: totalRevenue / totalServices,
      status: overdue > 0 ? "Inadimplente" : client.status || current.status,
      rating: overdue > 0 ? "Inadimplente" : totalRevenue >= 10000 ? "Estratégico" : totalOs >= 3 ? "Recorrente" : current.rating,
      timeline: unique([...(current.timeline || []), ...(client.timeline || [])]),
      documents: unique([...(current.documents || []), ...(client.documents || [])])
    });
  });

  return Array.from(map.values());
}

function quoteTotal(record: Record<string, unknown>) {
  const items = Array.isArray(record.items) ? record.items as Record<string, unknown>[] : [];

  return items.reduce((sum, item) => {
    const quantity = numberValue(item.quantity, 0);
    const unitPrice = numberValue(item.unitPrice, 0);
    const discount = numberValue(item.discount, 0);

    return sum + quantity * unitPrice * (1 - discount / 100);
  }, 0);
}

function buildClientsFromSystem() {
  const clientsFromQuotes = readArrayFromStorage(QUOTES_STORAGE_KEY)
    .filter((quote) => textValue(quote.client))
    .map((quote) => makeClientFromPartial({
      name: textValue(quote.client),
      phone: textValue(quote.phone),
      whatsapp: textValue(quote.phone),
      email: textValue(quote.email),
      address: textValue(quote.address),
      serviceInterest: textValue(quote.title, textValue(quote.serviceType, "Orçamento")),
      status: textValue(quote.status) === "Convertida em OS" || textValue(quote.status) === "Aprovada" ? "Ativo" : "Em negociação",
      totalQuotes: 1,
      totalRevenue: quoteTotal(quote),
      openAmount: quoteTotal(quote),
      lastService: textValue(quote.createdAt, "Sem atendimento"),
      notes: "Cliente identificado automaticamente em orçamento.",
      timeline: [`Orçamento ${textValue(quote.id, "")} criado/importado`]
    }));

  const clientsFromOrders = readArrayFromStorage(ORDERS_STORAGE_KEY)
    .filter((order) => textValue(order.client))
    .map((order) => {
      const value = numberValue(order.value, 0);
      const paid = numberValue(order.paid, 0);
      const open = Math.max(value - paid, 0);

      return makeClientFromPartial({
        name: textValue(order.client),
        phone: textValue(order.phone),
        whatsapp: textValue(order.phone),
        address: textValue(order.address),
        serviceInterest: textValue(order.title, textValue(order.type, "Ordem de serviço")),
        status: open > 0 ? "Ativo" : "Recorrente",
        totalOs: 1,
        totalRevenue: value,
        received: paid,
        openAmount: open,
        lastService: textValue(order.date, "Sem atendimento"),
        notes: "Cliente identificado automaticamente em OS.",
        timeline: [`OS ${textValue(order.id, "")} vinculada`]
      });
    });

  const clientsFromAgenda = readArrayFromStorage(AGENDA_STORAGE_KEY)
    .filter((appointment) => textValue(appointment.client))
    .map((appointment) => makeClientFromPartial({
      name: textValue(appointment.client),
      phone: textValue(appointment.phone),
      whatsapp: textValue(appointment.phone),
      address: textValue(appointment.address),
      serviceInterest: textValue(appointment.title, textValue(appointment.type, "Agenda")),
      status: textValue(appointment.status) === "Cancelado" ? "Inativo" : "Ativo",
      totalVisits: 1,
      totalRevenue: numberValue(appointment.value, 0),
      nextService: textValue(appointment.date, "A definir"),
      notes: "Cliente identificado automaticamente em agenda.",
      timeline: [`Agenda ${textValue(appointment.id, "")} vinculada`]
    }));

  const clientsFromFinance = readArrayFromStorage(FINANCE_STORAGE_KEY)
    .filter((transaction) => textValue(transaction.clientSupplier))
    .filter((transaction) => ["Receita", "Conta a receber"].includes(textValue(transaction.type)))
    .map((transaction) => {
      const budgeted = numberValue(transaction.budgeted, 0);
      const actual = numberValue(transaction.actual, 0);
      const isReceived = textValue(transaction.status) === "Recebido";
      const open = isReceived ? 0 : Math.max(budgeted - actual, 0);
      const overdue = textValue(transaction.status) === "Vencido" ? open || budgeted : 0;

      return makeClientFromPartial({
        name: textValue(transaction.clientSupplier),
        serviceInterest: textValue(transaction.title, "Financeiro"),
        status: overdue > 0 ? "Inadimplente" : "Ativo",
        totalRevenue: budgeted,
        received: actual,
        openAmount: open,
        overdue,
        lastService: textValue(transaction.competenceDate, "Sem atendimento"),
        notes: "Cliente identificado automaticamente no financeiro.",
        timeline: [`Financeiro ${textValue(transaction.id, "")} vinculado`]
      });
    });

  return mergeClientCollections(
    clientsFromQuotes,
    clientsFromOrders,
    clientsFromAgenda,
    clientsFromFinance
  );
}


export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>(clientsSeed);
  const [leads, setLeads] = useState<Lead[]>(leadsSeed);
  const [activeTab, setActiveTab] = useState("Visão Geral");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selected, setSelected] = useState<Client | null>(clientsSeed[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<Client | null>(null);
  const [documentClientId, setDocumentClientId] = useState("");
  const [documentDraft, setDocumentDraft] = useState("");
  const [storageReady, setStorageReady] = useState(false);

  function syncClientsFromStorage() {
    try {
      const savedClients = readClientsFromStorage();
      const integratedClients = buildClientsFromSystem();
      const deletedKeys = readDeletedClientKeys();
      const merged = mergeClientCollections(savedClients, integratedClients)
        .filter((client) => !isDeletedClient(client, deletedKeys));

      setClients(merged);
      setSelected((current) => current ? merged.find((item) => item.id === current.id) ?? merged[0] ?? null : merged[0] ?? null);
      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      setClients(clientsSeed);
    } finally {
      setStorageReady(true);
    }
  }

  useEffect(() => {
    syncClientsFromStorage();

    window.addEventListener("storage", syncClientsFromStorage);
    window.addEventListener("volt:ordem-criada", syncClientsFromStorage);
    window.addEventListener("volt:financeiro-lancamento-criado", syncClientsFromStorage);
    window.addEventListener("volt:agenda-compromisso-criado", syncClientsFromStorage);

    return () => {
      window.removeEventListener("storage", syncClientsFromStorage);
      window.removeEventListener("volt:ordem-criada", syncClientsFromStorage);
      window.removeEventListener("volt:financeiro-lancamento-criado", syncClientsFromStorage);
      window.removeEventListener("volt:agenda-compromisso-criado", syncClientsFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  }, [storageReady, clients]);

  const filtered = useMemo(() => {
    return clients.filter((item) => {
      const text = `${item.name} ${item.fantasyName} ${item.document} ${item.phone} ${item.email} ${item.address} ${item.notes}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesType = typeFilter === "Todos" || item.type === typeFilter;
      const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [clients, search, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalRevenue = filtered.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalOpen = filtered.reduce((sum, item) => sum + item.openAmount, 0);
    const totalOverdue = filtered.reduce((sum, item) => sum + item.overdue, 0);
    const totalServices = filtered.reduce((sum, item) => sum + item.totalOs, 0);
    const active = filtered.filter((item) => ["Ativo", "Recorrente", "Em negociação"].includes(item.status)).length;
    const recurring = filtered.filter((item) => item.status === "Recorrente" || item.rating === "Recorrente").length;
    const inadimplente = filtered.filter((item) => item.status === "Inadimplente" || item.overdue > 0).length;
    const leadTotal = leads.length;
    const leadConverted = leads.filter((item) => item.status === "Convertido").length;
    const conversion = Math.round((leadConverted / Math.max(leadTotal, 1)) * 100);
    const retention = Math.round((recurring / Math.max(active, 1)) * 100);
    const ticket = totalRevenue / Math.max(totalServices, 1);
    const topClient = [...filtered].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];

    return { totalRevenue, totalOpen, totalOverdue, totalServices, active, recurring, inadimplente, leadTotal, conversion, retention, ticket, topClient };
  }, [filtered, leads]);

  const documentClient = useMemo(() => {
    return filtered.find((client) => client.id === documentClientId)
      ?? selected
      ?? filtered[0]
      ?? clients[0]
      ?? null;
  }, [filtered, documentClientId, selected, clients]);

  function openClientDocuments(client: Client) {
    setDocumentClientId(client.id);
    setSelected(client);
    setActiveTab("Documentos");
    setModalOpen(false);
  }

  function addDocumentToClient() {
    if (!documentClient) {
      alert("Selecione um cliente para adicionar documento.");
      return;
    }

    const value = documentDraft.trim();

    if (!value) {
      alert("Digite o nome do documento, foto, laudo ou comprovante.");
      return;
    }

    const updatedClient: Client = {
      ...documentClient,
      documents: documentClient.documents.includes(value)
        ? documentClient.documents
        : [...documentClient.documents, value],
      timeline: documentClient.timeline.includes(`Documento adicionado: ${value}`)
        ? documentClient.timeline
        : [`Documento adicionado: ${value}`, ...documentClient.timeline]
    };

    setClients((current) => current.map((client) => client.id === updatedClient.id ? updatedClient : client));
    setSelected(updatedClient);
    setDocumentClientId(updatedClient.id);
    setDocumentDraft("");
  }

  function removeDocumentFromClient(client: Client, documentName: string) {
    const confirmed = window.confirm(`Remover "${documentName}" dos documentos de ${client.name}?`);

    if (!confirmed) return;

    const updatedClient: Client = {
      ...client,
      documents: client.documents.filter((item) => item !== documentName),
      timeline: [`Documento removido: ${documentName}`, ...client.timeline]
    };

    setClients((current) => current.map((item) => item.id === updatedClient.id ? updatedClient : item));
    setSelected(updatedClient);
    setDocumentClientId(updatedClient.id);
  }

  function generateCrmReport() {
    const topClients = [...filtered].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 8);
    const inadimplentes = filtered.filter((client) => client.status === "Inadimplente" || client.overdue > 0);
    const recorrentes = filtered.filter((client) => client.status === "Recorrente" || client.rating === "Recorrente");
    const leadsAbertos = leads.filter((lead) => lead.status !== "Convertido" && lead.status !== "Perdido");
    const selectedClient = selected && filtered.some((client) => client.id === selected.id) ? selected : filtered[0];

    const reportHtml = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório CRM Volt</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f4f4f0;
      color: #111;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { padding: 8mm 0; page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    .hero {
      border-radius: 24px;
      background: linear-gradient(135deg, #090909, #1b1b14);
      color: white;
      padding: 28px;
      border: 1px solid #2a2a20;
      box-shadow: 0 20px 60px rgba(0,0,0,.18);
    }
    .kicker { color: #ffcb2f; font-weight: 900; letter-spacing: .22em; text-transform: uppercase; font-size: 11px; }
    h1 { margin: 10px 0 0; font-size: 34px; line-height: 1.05; }
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
    .kpi-value { font-size: 24px; font-weight: 900; color: #111; margin-top: 8px; }
    .yellow { color: #d7a900; }
    .green { color: #139447; }
    .red { color: #c82f2f; }
    .section { margin-top: 16px; }
    table { width: 100%; border-collapse: separate; border-spacing: 0 8px; font-size: 11px; }
    th { text-align: left; color: #777; font-size: 10px; text-transform: uppercase; letter-spacing: .12em; padding: 0 10px; }
    td { background: white; padding: 10px; border-top: 1px solid #e8e5dc; border-bottom: 1px solid #e8e5dc; vertical-align: top; }
    td:first-child { border-left: 1px solid #e8e5dc; border-radius: 12px 0 0 12px; font-weight: 800; }
    td:last-child { border-right: 1px solid #e8e5dc; border-radius: 0 12px 12px 0; }
    .badge { display: inline-block; border-radius: 999px; padding: 4px 8px; background: #fff3bd; color: #7a5b00; font-size: 9px; font-weight: 900; text-transform: uppercase; }
    .bar { height: 8px; border-radius: 999px; background: #ece9df; overflow: hidden; margin-top: 8px; }
    .bar span { display:block; height:100%; background:#ffcb2f; border-radius:999px; }
    .footer { margin-top: 14px; color:#777; font-size:10px; display:flex; justify-content:space-between; }
    .doc-list { display:grid; gap:8px; }
    .doc { border:1px solid #ece9df; background:#fff; padding:10px; border-radius:12px; font-size:12px; }
  </style>
</head>
<body>
  <section class="page">
    <div class="hero">
      <div class="kicker">CRM VOLT • Relatório executivo</div>
      <h1>Carteira de clientes</h1>
      <p class="muted">Relatório gerado em ${safeDate()} com clientes, leads, financeiro, documentos e histórico comercial.</p>
    </div>

    <div class="grid grid-4 section">
      <div class="card"><div class="muted">Total clientes</div><div class="kpi-value">${filtered.length}</div></div>
      <div class="card"><div class="muted">Clientes ativos</div><div class="kpi-value green">${stats.active}</div></div>
      <div class="card"><div class="muted">Faturamento</div><div class="kpi-value yellow">${currency(stats.totalRevenue)}</div></div>
      <div class="card"><div class="muted">Em aberto/vencido</div><div class="kpi-value red">${currency(stats.totalOpen + stats.totalOverdue)}</div></div>
    </div>

    <div class="grid grid-4 section">
      <div class="card"><div class="muted">Leads abertos</div><div class="kpi-value">${leadsAbertos.length}</div><div class="bar"><span style="width:${Math.min(stats.conversion, 100)}%"></span></div><p class="muted">${stats.conversion}% conversão</p></div>
      <div class="card"><div class="muted">Recorrentes</div><div class="kpi-value">${stats.recurring}</div><div class="bar"><span style="width:${Math.min(stats.retention, 100)}%"></span></div><p class="muted">${stats.retention}% retenção</p></div>
      <div class="card"><div class="muted">OS registradas</div><div class="kpi-value">${stats.totalServices}</div></div>
      <div class="card"><div class="muted">Ticket médio</div><div class="kpi-value">${currency(stats.ticket)}</div></div>
    </div>

    <div class="section card">
      <h2>Resumo executivo</h2>
      <p>O CRM possui <strong>${filtered.length}</strong> cliente(s), com <strong>${stats.active}</strong> ativo(s), <strong>${stats.recurring}</strong> recorrente(s) e <strong>${inadimplentes.length}</strong> com pendência/inadimplência. A carteira filtrada soma <strong>${currency(stats.totalRevenue)}</strong> em faturamento, com ticket médio de <strong>${currency(stats.ticket)}</strong>.</p>
    </div>
    <div class="footer"><span>Volt Soluções Elétricas</span><span>Página 1</span></div>
  </section>

  <section class="page">
    <div class="hero">
      <div class="kicker">Clientes prioritários</div>
      <h1>Financeiro por cliente</h1>
      <p class="muted">Ranking por faturamento, valores recebidos, em aberto e vencidos.</p>
    </div>

    <table class="section">
      <thead>
        <tr><th>Cliente</th><th>Status</th><th>Faturado</th><th>Recebido</th><th>Aberto</th><th>Vencido</th><th>OS</th></tr>
      </thead>
      <tbody>
        ${topClients.map((client) => `
          <tr>
            <td>${escapeHtml(client.name)}<br><span class="muted">${escapeHtml(client.phone || client.email || client.city)}</span></td>
            <td><span class="badge">${escapeHtml(client.status)}</span></td>
            <td>${currency(client.totalRevenue)}</td>
            <td>${currency(client.received)}</td>
            <td>${currency(client.openAmount)}</td>
            <td>${currency(client.overdue)}</td>
            <td>${client.totalOs}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="grid grid-2 section">
      <div class="card">
        <h2>Clientes com atenção</h2>
        <div class="doc-list">
          ${(inadimplentes.length ? inadimplentes : filtered.slice(0, 4)).slice(0, 6).map((client) => `
            <div class="doc"><strong>${escapeHtml(client.name)}</strong><br><span class="muted">${escapeHtml(client.status)} • aberto ${currency(client.openAmount)} • vencido ${currency(client.overdue)}</span></div>
          `).join("")}
        </div>
      </div>
      <div class="card">
        <h2>Clientes recorrentes</h2>
        <div class="doc-list">
          ${(recorrentes.length ? recorrentes : filtered.slice(0, 4)).slice(0, 6).map((client) => `
            <div class="doc"><strong>${escapeHtml(client.name)}</strong><br><span class="muted">${client.totalOs} OS • ${currency(client.totalRevenue)} faturado</span></div>
          `).join("")}
        </div>
      </div>
    </div>
    <div class="footer"><span>Volt Soluções Elétricas</span><span>Página 2</span></div>
  </section>

  <section class="page">
    <div class="hero">
      <div class="kicker">Dossiê individual</div>
      <h1>${escapeHtml(selectedClient?.name || "Cliente")}</h1>
      <p class="muted">${escapeHtml(selectedClient?.serviceInterest || "Sem serviço informado")} • ${escapeHtml(selectedClient?.phone || selectedClient?.email || "")}</p>
    </div>

    ${selectedClient ? `
      <div class="grid grid-4 section">
        <div class="card"><div class="muted">Faturado</div><div class="kpi-value yellow">${currency(selectedClient.totalRevenue)}</div></div>
        <div class="card"><div class="muted">Recebido</div><div class="kpi-value green">${currency(selectedClient.received)}</div></div>
        <div class="card"><div class="muted">Aberto</div><div class="kpi-value">${currency(selectedClient.openAmount)}</div></div>
        <div class="card"><div class="muted">Vencido</div><div class="kpi-value red">${currency(selectedClient.overdue)}</div></div>
      </div>

      <div class="grid grid-2 section">
        <div class="card">
          <h2>Dados cadastrais</h2>
          <p><strong>Documento:</strong> ${escapeHtml(selectedClient.document)}</p>
          <p><strong>Endereço:</strong> ${escapeHtml(selectedClient.address || selectedClient.city)}</p>
          <p><strong>Responsável:</strong> ${escapeHtml(selectedClient.responsible)}</p>
          <p><strong>Origem:</strong> ${escapeHtml(selectedClient.origin)}</p>
        </div>
        <div class="card">
          <h2>Documentos do cliente</h2>
          <div class="doc-list">
            ${(selectedClient.documents.length ? selectedClient.documents : ["Nenhum documento cadastrado"]).map((doc) => `<div class="doc">${escapeHtml(doc)}</div>`).join("")}
          </div>
        </div>
      </div>

      <div class="card section">
        <h2>Linha do tempo</h2>
        <div class="doc-list">
          ${(selectedClient.timeline.length ? selectedClient.timeline : ["Sem histórico cadastrado"]).slice(0, 10).map((event) => `<div class="doc">${escapeHtml(event)}</div>`).join("")}
        </div>
      </div>
    ` : `<div class="card section">Nenhum cliente selecionado.</div>`}

    <div class="footer"><span>Volt Soluções Elétricas</span><span>Página 3</span></div>
  </section>
</body>
</html>`;

    const report = window.open("", "_blank", "width=1200,height=900");

    if (!report) {
      alert("O navegador bloqueou a janela do relatório. Permita pop-ups para gerar o PDF.");
      return;
    }

    report.document.open();
    report.document.write(reportHtml);
    report.document.close();

    setTimeout(() => {
      report.focus();
      report.print();
    }, 500);
  }

  function createClient() {
    const next = makeClientFromPartial({
      id: `CLI-${String(Date.now()).slice(-5)}`,
      name: "Novo cliente",
      fantasyName: "Novo cliente",
      type: "Pessoa física",
      status: "Lead",
      category: "Novo contato",
      origin: "WhatsApp",
      phone: "",
      whatsapp: "",
      email: "",
      neighborhood: "São Paulo",
      city: "São Paulo/SP",
      address: "",
      responsible: "Guilherme Santana",
      serviceInterest: "A definir",
      notes: "Cliente criado manualmente.",
      timeline: ["Cliente criado manualmente"]
    });

    setDraft(next);
    setEditOpen(true);
    setModalOpen(false);
  }

  function openClientEditor(client: Client) {
    setDraft({
      ...client,
      timeline: [...client.timeline],
      documents: [...client.documents]
    });
    setEditOpen(true);
  }

  function saveClient() {
    if (!draft) return;

    const next = makeClientFromPartial({
      ...draft,
      name: draft.name.trim() || "Cliente não informado",
      fantasyName: draft.fantasyName.trim() || draft.name.trim() || "Cliente",
      phone: draft.phone.trim(),
      whatsapp: draft.whatsapp.trim() || draft.phone.trim(),
      email: draft.email.trim(),
      address: draft.address.trim(),
      notes: draft.notes.trim(),
      timeline: draft.timeline.length ? draft.timeline : ["Cadastro atualizado manualmente"]
    });

    setClients((current) => {
      const exists = current.some((item) => item.id === next.id);

      return exists
        ? current.map((item) => item.id === next.id ? next : item)
        : [next, ...current];
    });

    setSelected(next);
    setModalOpen(true);
    setEditOpen(false);
    setDraft(null);
  }

  function removeClient(client: Client) {
    if (!window.confirm(`Excluir ${client.name} do CRM?\n\nEle não aparecerá mais na lista, mesmo que tenha vindo de orçamento, OS, agenda ou financeiro.`)) return;

    try {
      const deletedKeys = readDeletedClientKeys();
      const nextDeletedKeys = unique([...deletedKeys, client.id, clientKey(client)]);

      localStorage.setItem(DELETED_CLIENTS_STORAGE_KEY, JSON.stringify(nextDeletedKeys));
    } catch {
      // Se a lixeira local falhar, ainda tenta remover da lista atual.
    }

    setClients((current) => {
      const deletedKeys = readDeletedClientKeys();
      const next = current.filter((item) => item.id !== client.id && !isDeletedClient(item, deletedKeys));

      localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    if (selected?.id === client.id) {
      setSelected(null);
    }

    if (documentClientId === client.id) {
      setDocumentClientId("");
      setDocumentDraft("");
    }

    setModalOpen(false);
  }

  function restoreDeletedClients() {
    if (!window.confirm("Restaurar clientes excluídos? Clientes vindos de orçamento, OS, agenda ou financeiro poderão aparecer novamente.")) return;

    localStorage.removeItem(DELETED_CLIENTS_STORAGE_KEY);
    syncClientsFromStorage();
  }

  function moveLead(id: string, status: Lead["status"]) {
    setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, status } : lead));
  }

  function exportCsv() {
    const header = ["ID", "Nome", "Tipo", "Telefone", "E-mail", "Bairro", "Status", "OS", "Faturamento", "Aberto"];
    const rows = filtered.map((item) => [item.id, item.name, item.type, item.phone, item.email, item.neighborhood, item.status, item.totalOs, item.totalRevenue, item.openAmount]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "clientes-volt.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111821] via-[#080c11] to-black p-5 shadow-soft md:p-7">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-volt-yellow/20 blur-[130px]" />
          <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">CRM Volt</p>
              <h1 className="mt-2 text-4xl font-black leading-tight md:text-5xl">Clientes</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                Cadastro, relacionamento, histórico, serviços, financeiro, leads, documentos e análise por cliente em uma visão profissional.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
              <button onClick={createClient} className="btn-primary inline-flex items-center justify-center gap-2"><Plus size={17} /> Novo cliente</button>
              <button onClick={syncClientsFromStorage} className="btn-ghost inline-flex items-center justify-center gap-2"><Users size={17} /> Atualizar CRM</button>
              <button onClick={restoreDeletedClients} className="btn-ghost inline-flex items-center justify-center gap-2"><RefreshCcw size={17} /> Restaurar excluídos</button>
              <button onClick={() => setActiveTab("Leads")} className="btn-ghost inline-flex items-center justify-center gap-2"><UserPlus size={17} /> Novo lead</button>
              <button onClick={exportCsv} className="btn-ghost inline-flex items-center justify-center gap-2"><Download size={17} /> Exportar CSV</button>
              <button onClick={generateCrmReport} className="btn-ghost inline-flex items-center justify-center gap-2"><FileText size={17} /> Relatório PDF</button>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[.025] p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_.7fr_.7fr]">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
              <Search size={17} className="text-volt-yellow" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, telefone, e-mail, CPF/CNPJ, endereço..." className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600" />
            </div>

            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
              {["Todos", "Pessoa física", "Pessoa jurídica", "Condomínio", "Empresa", "Loja", "Escritório", "Residencial"].map((type) => <option key={type}>{type}</option>)}
            </select>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
              {["Todos", "Lead", "Ativo", "Inativo", "Inadimplente", "Recorrente", "Em negociação", "Bloqueado"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
          {[
            ["Total clientes", filtered.length, Users, "text-volt-yellow", "+8%"],
            ["Ativos", stats.active, CheckCircle2, "text-volt-ok", "operação"],
            ["Leads abertos", stats.leadTotal, UserPlus, "text-blue-300", `${stats.conversion}% conv.`],
            ["Recorrentes", stats.recurring, Target, "text-volt-yellow", `${stats.retention}% retenção`],
            ["Inadimplentes", stats.inadimplente, AlertTriangle, "text-red-300", currency(stats.totalOverdue)],
            ["OS abertas", stats.totalServices, ClipboardCheck, "text-purple-300", "histórico"],
            ["Faturamento", currency(stats.totalRevenue), Wallet, "text-volt-yellow", "total"],
            ["Ticket médio", currency(stats.ticket), BarChart3, "text-volt-ok", "por OS"]
          ].map(([label, value, Icon, color, note]) => {
            const IconComp = Icon as typeof Users;
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
              <ChartCard title="Evolução de clientes e faturamento" subtitle="Crescimento mensal da base e resultado financeiro." icon={<TrendingUp size={25} />}>
                <ClientEvolutionChart />
              </ChartCard>

              <ChartCard title="Top clientes por faturamento" subtitle="Clientes com maior participação no resultado." icon={<Wallet size={25} />}>
                <TopClientsChart clients={filtered} />
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
              <ChartCard title="Composição da carteira" subtitle="Distribuição dos clientes por tipo." icon={<PieChart size={25} />}>
                <ClientComposition />
              </ChartCard>

              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Alertas importantes</p>
                <div className="mt-5 space-y-3">
                  {[
                    "Clientes inadimplentes precisam de cobrança ativa.",
                    "Clientes recorrentes sem atendimento recente devem receber contato.",
                    "Leads quentes com orçamento enviado precisam de follow-up.",
                    "Clientes de alto faturamento podem receber proposta preventiva."
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

        {activeTab === "Lista de Clientes" && (
          <section className="card-premium rounded-[2rem] p-5 md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Lista profissional</p>
                <h2 className="mt-1 text-2xl font-black">Base de clientes</h2>
                <p className="mt-2 text-xs leading-5 text-zinc-500">Clientes excluídos ficam ocultos mesmo que tenham sido importados de orçamento, OS, agenda ou financeiro.</p>
              </div>
              <Users className="text-volt-yellow" size={26} />
            </div>

            <div className="volt-scroll overflow-x-auto">
              <table className="w-full min-w-[1150px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[.16em] text-zinc-600">
                    <th className="px-4 py-2">Cliente</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Contato</th>
                    <th className="px-4 py-2">Região</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">OS</th>
                    <th className="px-4 py-2">Faturado</th>
                    <th className="px-4 py-2">Aberto</th>
                    <th className="px-4 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((client) => (
                    <tr key={client.id} className="bg-white/[.035] text-sm">
                      <td className="rounded-l-2xl px-4 py-4"><p className="font-black">{client.name}</p><p className="text-xs text-zinc-500">{client.id} • {client.fantasyName}</p></td>
                      <td className="px-4 py-4">{client.type}</td>
                      <td className="px-4 py-4"><p>{client.whatsapp}</p><p className="text-xs text-zinc-500">{client.email}</p></td>
                      <td className="px-4 py-4">{client.neighborhood}</td>
                      <td className="px-4 py-4"><Badge className={statusColors[client.status]}>{client.status}</Badge></td>
                      <td className="px-4 py-4 font-black">{client.totalOs}</td>
                      <td className="px-4 py-4 font-black text-volt-yellow">{currency(client.totalRevenue)}</td>
                      <td className="px-4 py-4">{currency(client.openAmount)}</td>
                      <td className="rounded-r-2xl px-4 py-4">
                        <div className="flex gap-3">
                          <button onClick={() => { setSelected(client); setModalOpen(true); }} className="text-xs font-black text-volt-yellow">Perfil</button>
                          <button onClick={() => removeClient(client)} className="text-xs font-black text-red-300 hover:text-red-200">Excluir</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "Leads" && (
          <section className="volt-scroll overflow-x-auto">
            <div className="grid min-w-[1100px] grid-cols-6 gap-4">
              {leadColumns.map((column) => (
                <div key={column} className="rounded-[2rem] border border-white/10 bg-white/[.025] p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-black">{column}</p>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-black text-zinc-400">
                      {leads.filter((lead) => lead.status === column).length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {leads.filter((lead) => lead.status === column).map((lead) => (
                      <div key={lead.id} className="rounded-3xl border border-white/10 bg-black/35 p-4">
                        <Badge className={leadColors[lead.temperature]}>{lead.temperature}</Badge>
                        <p className="mt-3 font-black">{lead.name}</p>
                        <p className="mt-1 text-xs text-zinc-500">{lead.service}</p>
                        <p className="mt-2 text-sm font-black text-volt-yellow">{currency(lead.estimatedValue)}</p>
                        <p className="mt-1 text-xs text-zinc-500">Próximo contato: {lead.nextContact}</p>

                        <div className="mt-4 grid gap-2">
                          {leadColumns.filter((next) => next !== lead.status).slice(0, 2).map((next) => (
                            <button key={next} onClick={() => moveLead(lead.id, next)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-zinc-400 hover:border-volt-yellow/30 hover:text-volt-yellow">
                              Mover para {next}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "Mapa/Regiões" && (
          <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Regiões</p>
              <h2 className="mt-1 text-2xl font-black">Distribuição de clientes</h2>
              <div className="mt-5 space-y-3">
                {["Vila Olímpia", "Tatuapé", "Brooklin", "Mooca", "Pinheiros"].map((region) => {
                  const count = filtered.filter((client) => client.neighborhood === region).length || 1;
                  return (
                    <div key={region} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-black">{region}</p>
                        <p className="text-volt-yellow font-black">{count}</p>
                      </div>
                      <ProgressBar value={count * 20} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111821] to-black p-5">
              <MapPin className="mb-5 text-volt-yellow" size={32} />
              <h2 className="text-3xl font-black">Mapa preparado para integração futura.</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Estrutura visual pronta para futuramente integrar Google Maps, rotas, regiões, técnicos e logística de atendimento.
              </p>
            </div>
          </section>
        )}

        {activeTab === "Histórico" && (
          <section className="grid gap-4">
            {filtered.flatMap((client) => client.timeline.map((event, index) => ({ client, event, index }))).map(({ client, event, index }) => (
              <article key={`${client.id}-${index}`} className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5">
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-volt-yellow text-black">
                    <ClockIcon />
                  </div>
                  <div>
                    <p className="font-black">{event}</p>
                    <p className="mt-1 text-sm text-zinc-500">{client.name} • Histórico operacional</p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {activeTab === "Financeiro por Cliente" && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((client) => (
              <article key={client.id} className="card-premium rounded-[2rem] p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-black">{client.fantasyName}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{client.status}</p>
                  </div>
                  <Badge className={client.overdue > 0 ? "bg-red-500/15 text-red-300 border-red-500/20" : "bg-volt-ok/15 text-volt-ok border-volt-ok/20"}>
                    {client.overdue > 0 ? "Vencido" : "OK"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {[
                    ["Faturado", currency(client.totalRevenue)],
                    ["Recebido", currency(client.received)],
                    ["Em aberto", currency(client.openAmount)],
                    ["Vencido", currency(client.overdue)],
                    ["Ticket médio", currency(client.ticketAverage)]
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between rounded-2xl border border-white/10 bg-white/[.035] p-3 text-sm">
                      <span className="text-zinc-500">{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        )}

        {activeTab === "Documentos" && (
          <section className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Documentos por cliente</p>
                  <h2 className="mt-1 text-2xl font-black">Selecione o cliente</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">Fotos, laudos, comprovantes, relatórios e checklist ficam vinculados ao cadastro do cliente.</p>
                </div>
                <FolderOpen className="text-volt-yellow" size={30} />
              </div>

              <div className="space-y-3">
                {filtered.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => {
                      setDocumentClientId(client.id);
                      setSelected(client);
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      documentClient?.id === client.id ? "border-volt-yellow/40 bg-volt-yellow/10" : "border-white/10 bg-white/[.035] hover:border-volt-yellow/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{client.name}</p>
                        <p className="mt-1 text-xs text-zinc-500">{client.phone || client.email || client.city}</p>
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-zinc-400">{client.documents.length}</span>
                    </div>
                  </button>
                ))}

                {filtered.length === 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm font-bold text-zinc-500">
                    Nenhum cliente encontrado com os filtros atuais.
                  </div>
                )}
              </div>
            </div>

            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              {documentClient ? (
                <>
                  <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/10 pb-5 md:flex-row md:items-start">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Pasta do cliente</p>
                      <h2 className="mt-1 text-3xl font-black">{documentClient.name}</h2>
                      <p className="mt-2 text-sm text-zinc-500">{documentClient.phone || documentClient.email || "Sem contato"} • {documentClient.documents.length} documento(s)</p>
                    </div>
                    <button onClick={() => openClientEditor(documentClient)} className="btn-primary inline-flex items-center gap-2"><FileText size={17} /> Editar cadastro</button>
                  </div>

                  <div className="rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 p-4">
                    <p className="text-sm font-black text-volt-yellow">Adicionar documento</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                      <input
                        value={documentDraft}
                        onChange={(event) => setDocumentDraft(event.target.value)}
                        placeholder="Ex: Foto antes/depois, relatório técnico, comprovante Pix, laudo, checklist..."
                        className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold outline-none placeholder:text-zinc-600"
                      />
                      <button onClick={addDocumentToClient} className="btn-primary inline-flex items-center justify-center gap-2"><Plus size={17} /> Adicionar</button>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Nesta versão fica salvo como registro/descrição. Depois podemos evoluir para upload real de arquivo, imagem e PDF no Supabase Storage.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {documentClient.documents.map((doc) => (
                      <article key={`${documentClient.id}-${doc}`} className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5">
                        <FolderOpen className="mb-5 text-volt-yellow" size={30} />
                        <h3 className="text-xl font-black">{doc}</h3>
                        <p className="mt-2 text-sm text-zinc-500">{documentClient.name}</p>
                        <p className="mt-4 text-sm leading-6 text-zinc-400">Documento vinculado ao cliente. Use para controlar fotos, laudos, comprovantes e relatórios.</p>
                        <div className="mt-5 flex gap-2">
                          <button onClick={() => setDocumentDraft(doc)} className="btn-ghost flex-1">Usar como base</button>
                          <button onClick={() => removeDocumentFromClient(documentClient, doc)} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">Remover</button>
                        </div>
                      </article>
                    ))}

                    {documentClient.documents.length === 0 && (
                      <div className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5 text-sm font-bold leading-7 text-zinc-400 md:col-span-2">
                        Este cliente ainda não tem documentos cadastrados. Adicione fotos, laudos, comprovantes, checklist ou relatórios acima.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5 text-sm font-bold text-zinc-400">
                  Selecione um cliente para visualizar e lançar documentos.
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "Relatórios" && (
          <section className="space-y-5">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111821] via-[#080c11] to-black p-5 shadow-soft md:p-7">
              <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-volt-yellow/20 blur-[130px]" />
              <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Relatório executivo de CRM</p>
                  <h2 className="mt-2 text-4xl font-black">Carteira de clientes</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                    Relatório com capa, KPIs, ranking financeiro, inadimplência, recorrência, documentos e dossiê individual do cliente selecionado.
                  </p>
                </div>
                <button onClick={generateCrmReport} className="btn-primary inline-flex items-center justify-center gap-2"><FileText size={17} /> Gerar relatório PDF</button>
              </div>
            </div>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Clientes", filtered.length, Users, "text-volt-yellow"],
                ["Ativos", stats.active, CheckCircle2, "text-volt-ok"],
                ["Faturamento", currency(stats.totalRevenue), Wallet, "text-volt-yellow"],
                ["Inadimplentes", stats.inadimplente, AlertTriangle, "text-red-300"],
                ["Leads", stats.leadTotal, UserPlus, "text-blue-300"],
                ["Conversão", `${stats.conversion}%`, Target, "text-volt-yellow"],
                ["Retenção", `${stats.retention}%`, TrendingUp, "text-volt-ok"],
                ["Ticket", currency(stats.ticket), BarChart3, "text-volt-yellow"]
              ].map(([label, value, Icon, color]) => (
                <article key={label as string} className="card-premium rounded-3xl p-5">
                  <Icon className={color as string} size={25} />
                  <p className="mt-5 text-3xl font-black text-volt-yellow">{value as string}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-400">{label as string}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
              <ChartCard title="Top clientes por faturamento" subtitle="Ranking que vai para o relatório PDF." icon={<BarChart3 size={25} />}>
                <div className="space-y-3">
                  {[...filtered].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 8).map((client, index) => (
                    <div key={client.id} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-black">{index + 1}. {client.name}</p>
                          <p className="mt-1 text-xs text-zinc-500">{client.status} • {client.totalOs} OS • {client.documents.length} doc(s)</p>
                        </div>
                        <p className="font-black text-volt-yellow">{currency(client.totalRevenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>

              <ChartCard title="Dossiê individual no PDF" subtitle="O relatório usa o cliente selecionado nos detalhes." icon={<FileText size={25} />}>
                {selected ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 p-4">
                      <p className="text-sm font-black text-volt-yellow">Cliente selecionado</p>
                      <h3 className="mt-2 text-2xl font-black">{selected.name}</h3>
                      <p className="mt-2 text-sm text-zinc-400">{selected.serviceInterest}</p>
                    </div>
                    {[
                      ["Faturado", currency(selected.totalRevenue)],
                      ["Recebido", currency(selected.received)],
                      ["Em aberto", currency(selected.openAmount)],
                      ["Documentos", selected.documents.length]
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between rounded-2xl border border-white/10 bg-black/35 p-4 text-sm">
                        <span className="text-zinc-500">{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                    <button onClick={generateCrmReport} className="btn-primary w-full">Gerar PDF deste cliente</button>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm font-bold text-zinc-500">Abra um cliente em detalhes para usar como dossiê individual no relatório.</p>
                )}
              </ChartCard>
            </section>
          </section>
        )}

        {modalOpen && selected && (
          <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="volt-scroll max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#080c11] p-5 shadow-2xl">
              <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge className={statusColors[selected.status]}>{selected.status}</Badge>
                    <Badge className={ratingColors[selected.rating]}>{selected.rating}</Badge>
                  </div>
                  <h2 className="text-3xl font-black">{selected.name}</h2>
                  <p className="mt-2 text-sm text-zinc-500">{selected.id} • {selected.type} • {selected.neighborhood}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a href={`https://wa.me/55${selected.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2"><MessageCircle size={17} /> WhatsApp</a>
                  <button onClick={() => openClientEditor(selected)} className="btn-primary inline-flex items-center gap-2"><FileText size={17} /> Editar cadastro</button>
                  <button onClick={() => openClientDocuments(selected)} className="btn-ghost inline-flex items-center gap-2"><FolderOpen size={17} /> Documentos do cliente</button>
                  <button onClick={() => removeClient(selected)} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">Excluir</button>
                  <button onClick={() => setModalOpen(false)} className="btn-ghost">Fechar</button>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.9fr]">
                <div className="space-y-4">
                  {[
                    ["Nome fantasia", selected.fantasyName],
                    ["Documento", selected.document],
                    ["Telefone", selected.phone],
                    ["E-mail", selected.email],
                    ["Endereço", selected.address],
                    ["Origem", selected.origin],
                    ["Responsável", selected.responsible],
                    ["Serviço mais solicitado", selected.serviceInterest],
                    ["Frequência", selected.recurrence],
                    ["Último atendimento", selected.lastService],
                    ["Próximo atendimento", selected.nextService],
                    ["Observações", selected.notes]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                      <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{label}</p>
                      <p className="mt-1 font-bold">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["Faturado", currency(selected.totalRevenue)],
                      ["Recebido", currency(selected.received)],
                      ["Aberto", currency(selected.openAmount)],
                      ["Vencido", currency(selected.overdue)],
                      ["OS", selected.totalOs],
                      ["Cotações", selected.totalQuotes]
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                        <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{label}</p>
                        <p className="mt-1 text-xl font-black text-volt-yellow">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <p className="mb-4 text-sm font-black text-volt-yellow">Linha do tempo</p>
                    <div className="space-y-3">
                      {selected.timeline.map((event) => (
                        <div key={event} className="flex gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                          <CheckCircle2 className="shrink-0 text-volt-yellow" size={18} />
                          <p className="text-sm font-bold text-zinc-300">{event}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 p-4">
                    <p className="text-sm font-black text-volt-yellow">Integração visual</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">
                      Perfil preparado para criar OS, cotação, visita na agenda, lançamento financeiro, documentos e relatório individual.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {editOpen && draft && (
          <ClientEditorModal
            draft={draft}
            setDraft={setDraft}
            onSave={saveClient}
            onCancel={() => {
              setEditOpen(false);
              setDraft(null);
            }}
          />
        )}

      </div>
    </AppShell>
  );
}

function ClockIcon() {
  return <CalendarDays size={20} />;
}



function ClientEditorModal({
  draft,
  setDraft,
  onSave,
  onCancel
}: {
  draft: Client;
  setDraft: Dispatch<SetStateAction<Client | null>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  function setField<K extends keyof Client>(field: K, value: Client[K]) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
  }

  function setTimeline(value: string) {
    setDraft((current) => current ? { ...current, timeline: value.split("\n").map((item) => item.trim()).filter(Boolean) } : current);
  }

  function setDocuments(value: string) {
    setDraft((current) => current ? { ...current, documents: value.split("\n").map((item) => item.trim()).filter(Boolean) } : current);
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="volt-scroll max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#080c11] p-5 shadow-2xl">
        <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/10 pb-5 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Cadastro de cliente</p>
            <h2 className="mt-1 text-3xl font-black">Editar CRM</h2>
            <p className="mt-2 text-sm text-zinc-500">{draft.id}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={onSave} className="btn-primary inline-flex items-center gap-2"><CheckCircle2 size={17} /> Salvar cliente</button>
            <button onClick={onCancel} className="btn-ghost">Cancelar</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Nome/Razão social</span>
            <input value={draft.name} onChange={(event) => setField("name", event.target.value)} className="mt-2 w-full bg-transparent text-lg font-black outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Nome fantasia/apelido</span>
            <input value={draft.fantasyName} onChange={(event) => setField("fantasyName", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Documento</span>
            <input value={draft.document} onChange={(event) => setField("document", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" placeholder="CPF/CNPJ" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Tipo</span>
            <select value={draft.type} onChange={(event) => setField("type", event.target.value as ClientType)} className="mt-2 w-full bg-[#080c11] font-bold outline-none">
              {["Pessoa física", "Pessoa jurídica", "Condomínio", "Empresa", "Loja", "Escritório", "Residencial"].map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Status</span>
            <select value={draft.status} onChange={(event) => setField("status", event.target.value as ClientStatus)} className="mt-2 w-full bg-[#080c11] font-bold outline-none">
              {["Lead", "Ativo", "Inativo", "Inadimplente", "Recorrente", "Em negociação", "Bloqueado"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Telefone</span>
            <input value={draft.phone} onChange={(event) => setField("phone", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">WhatsApp</span>
            <input value={draft.whatsapp} onChange={(event) => setField("whatsapp", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">E-mail</span>
            <input value={draft.email} onChange={(event) => setField("email", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Endereço</span>
            <input value={draft.address} onChange={(event) => setField("address", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Bairro</span>
            <input value={draft.neighborhood} onChange={(event) => setField("neighborhood", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Cidade</span>
            <input value={draft.city} onChange={(event) => setField("city", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Origem</span>
            <input value={draft.origin} onChange={(event) => setField("origin", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Responsável</span>
            <input value={draft.responsible} onChange={(event) => setField("responsible", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Serviço de interesse</span>
            <input value={draft.serviceInterest} onChange={(event) => setField("serviceInterest", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Recorrência</span>
            <input value={draft.recurrence} onChange={(event) => setField("recurrence", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <div className="grid gap-3 md:col-span-2 md:grid-cols-4">
            {[
              ["totalRevenue", "Faturado"],
              ["received", "Recebido"],
              ["openAmount", "Aberto"],
              ["overdue", "Vencido"]
            ].map(([field, label]) => (
              <label key={field} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{label}</span>
                <input type="number" value={Number(draft[field as keyof Client] || 0)} onChange={(event) => setField(field as keyof Client, Number(event.target.value) as never)} className="mt-2 w-full bg-transparent font-bold outline-none" />
              </label>
            ))}
          </div>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Observações</span>
            <textarea value={draft.notes} onChange={(event) => setField("notes", event.target.value)} rows={4} className="mt-2 w-full resize-none bg-transparent text-sm font-bold leading-7 outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Linha do tempo, um item por linha</span>
            <textarea value={draft.timeline.join("\n")} onChange={(event) => setTimeline(event.target.value)} rows={5} className="mt-2 w-full resize-none bg-transparent text-sm font-bold leading-7 outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Documentos, um item por linha</span>
            <textarea value={draft.documents.join("\n")} onChange={(event) => setDocuments(event.target.value)} rows={5} className="mt-2 w-full resize-none bg-transparent text-sm font-bold leading-7 outline-none" />
          </label>
        </div>
      </div>
    </div>
  );
}
