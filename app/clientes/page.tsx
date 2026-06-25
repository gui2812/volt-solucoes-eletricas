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
  Search,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  const [draft, setDraft] = useState<EditableRecord | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("volt_clientes_premium_v1");
      if (saved) {
        const parsed = JSON.parse(saved) as { clients?: Client[]; leads?: Lead[] };
        if (Array.isArray(parsed.clients)) {
          setClients(parsed.clients);
          setSelected(parsed.clients[0] ?? null);
        }
        if (Array.isArray(parsed.leads)) setLeads(parsed.leads);
      }
    } catch {
      setClients(clientsSeed);
      setLeads(leadsSeed);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem("volt_clientes_premium_v1", JSON.stringify({ clients, leads }));
  }, [storageReady, clients, leads]);

  function getRecordKey(item: Client) {
    return item.id;
  }

  function openEditor(item: Client) {
    setEditingKey(getRecordKey(item));
    setDraft({ ...item } as unknown as EditableRecord);
    setEditOpen(true);
  }

  function saveEditor() {
    if (!draft) return;
    const next = draft as unknown as Client;
    setClients((current) => current.map((item) => getRecordKey(item) === editingKey ? next : item));
    setSelected(next);
    setEditOpen(false);
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy: Client = { ...selected, id: `CLI-${String(clients.length + 1).padStart(3, "0")}`, name: `${selected.name} cópia`, fantasyName: `${selected.fantasyName} cópia` };
    setClients((current) => [copy, ...current]);
    setSelected(copy);
    setEditingKey(getRecordKey(copy));
    setDraft({ ...copy } as unknown as EditableRecord);
    setEditOpen(true);
  }

  function removeSelected() {
    if (!selected) return;
    if (!window.confirm("Excluir este registro?")) return;
    setClients((current) => current.filter((item) => getRecordKey(item) !== getRecordKey(selected)));
    setSelected(null);
    setModalOpen(false);
    setEditOpen(false);
  }


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

  function createClient() {
    const next: Client = {
      id: `CLI-${String(clients.length + 1).padStart(3, "0")}`,
      name: "Novo cliente",
      fantasyName: "Novo cliente",
      type: "Pessoa física",
      document: "Pendente",
      status: "Lead",
      category: "Novo contato",
      origin: "WhatsApp",
      phone: "(11) 99999-9999",
      whatsapp: "(11) 99999-9999",
      email: "novo@email.com",
      neighborhood: "São Paulo",
      city: "São Paulo/SP",
      address: "São Paulo/SP",
      responsible: "Guilherme Santana",
      serviceInterest: "A definir",
      recurrence: "Sob demanda",
      totalOs: 0,
      totalQuotes: 0,
      totalVisits: 0,
      totalRevenue: 0,
      received: 0,
      openAmount: 0,
      overdue: 0,
      lastService: "Sem atendimento",
      nextService: "A definir",
      ticketAverage: 0,
      rating: "Comum",
      notes: "Editar cadastro do cliente.",
      timeline: ["Cliente criado manualmente"],
      documents: []
    };
    setClients((current) => [next, ...current]);
    setSelected(next);
    setEditingKey(getRecordKey(next));
    setDraft({ ...next } as unknown as EditableRecord);
    setModalOpen(false);
    setEditOpen(true);
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
              <button onClick={() => setActiveTab("Leads")} className="btn-ghost inline-flex items-center justify-center gap-2"><UserPlus size={17} /> Novo lead</button>
              <button onClick={exportCsv} className="btn-ghost inline-flex items-center justify-center gap-2"><Download size={17} /> Exportar CSV</button>
              <button onClick={() => window.print()} className="btn-ghost inline-flex items-center justify-center gap-2"><FileText size={17} /> Relatório PDF</button>
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
                        <button onClick={() => { setSelected(client); setModalOpen(true); }} className="text-xs font-black text-volt-yellow">Perfil</button>
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
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.flatMap((client) => client.documents.map((doc) => ({ client, doc }))).map(({ client, doc }) => (
              <article key={`${client.id}-${doc}`} className="card-premium rounded-[2rem] p-5">
                <FolderOpen className="mb-5 text-volt-yellow" size={30} />
                <h3 className="text-xl font-black">{doc}</h3>
                <p className="mt-2 text-sm text-zinc-500">{client.name}</p>
                <p className="mt-4 text-sm leading-6 text-zinc-400">Estrutura pronta para upload real, anexos, fotos, laudos e comprovantes.</p>
              </article>
            ))}
          </section>
        )}

        {activeTab === "Relatórios" && (
          <section className="grid gap-5 xl:grid-cols-[1fr_.85fr]">
            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Relatório de clientes</p>
              <h2 className="mt-2 text-3xl font-black">CRM executivo</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Gere relatório de clientes ativos, leads, financeiro por cliente, inadimplência, clientes recorrentes e carteira completa.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {["Geral de clientes", "Clientes ativos", "Leads", "Financeiro por cliente", "Inadimplência", "Clientes recorrentes", "Individual do cliente", "Completo executivo"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[.035] p-4 font-bold text-zinc-300">{item}</div>
                ))}
              </div>

              <button onClick={() => window.print()} className="btn-primary mt-6 inline-flex items-center gap-2">
                <FileText size={17} /> Gerar relatório PDF
              </button>
            </div>

            <ChartCard title="Resumo da carteira" subtitle="KPIs principais para o relatório executivo." icon={<BarChart3 size={25} />}>
              <div className="space-y-4">
                {[
                  ["Conversão de leads", stats.conversion],
                  ["Retenção", stats.retention],
                  ["Clientes ativos", (stats.active / Math.max(filtered.length, 1)) * 100],
                  ["Clientes recorrentes", (stats.recurring / Math.max(filtered.length, 1)) * 100]
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
                  <button onClick={() => openEditor(selected)} className="btn-primary">Editar</button>
                  <button onClick={duplicateSelected} className="btn-ghost">Duplicar</button>
                  <button onClick={removeSelected} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">Excluir</button>
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

function ClockIcon() {
  return <CalendarDays size={20} />;
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

