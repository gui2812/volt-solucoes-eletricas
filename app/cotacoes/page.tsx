"use client";

import { AppShell } from "@/components/layout/app-shell";
import { openOrcamentoPdf } from "@/utils/orcamentoPdfVolt";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  MessageCircle,
  Package,
  Percent,
  PieChart,
  Plus,
  Search,
  Send,
  Target,
  TrendingUp,
  Wallet,
  Wrench
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type QuoteStatus =
  | "Rascunho"
  | "Enviada"
  | "Visualizada"
  | "Aguardando retorno"
  | "Em negociação"
  | "Aprovada"
  | "Recusada"
  | "Vencida"
  | "Convertida em OS";

type QuoteItem = {
  kind: "Serviço" | "Material" | "Mão de obra" | "Deslocamento" | "Taxa";
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount: number;
};

type Quote = {
  id: string;
  client: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  serviceType: string;
  title: string;
  createdAt: string;
  validUntil: string;
  responsible: string;
  status: QuoteStatus;
  chance: number;
  priority: "Baixa" | "Média" | "Alta" | "Urgente";
  payment: string;
  warranty: string;
  deadline: string;
  os: string;
  reasonLost?: string;
  items: QuoteItem[];
  history: string[];
  notes: string;
};

const quotesSeed: Quote[] = [
  {
    id: "COT-221",
    client: "Condomínio JK 1455",
    contact: "Síndico / Manutenção",
    phone: "(11) 98878-3401",
    email: "contato@jk1455.com",
    address: "Vila Olímpia, São Paulo/SP",
    serviceType: "Adequação de quadro elétrico",
    title: "Organização e identificação de QDC",
    createdAt: "2026-06-20",
    validUntil: "2026-06-30",
    responsible: "Guilherme Santana",
    status: "Convertida em OS",
    chance: 100,
    priority: "Alta",
    payment: "50% entrada + 50% na entrega",
    warranty: "90 dias",
    deadline: "1 dia útil",
    os: "OS-1042",
    items: [
      { kind: "Serviço", code: "SRV-001", description: "Organização de quadro elétrico", unit: "serv.", quantity: 1, unitPrice: 950, unitCost: 380, discount: 0 },
      { kind: "Material", code: "MAT-010", description: "Etiquetas, barramentos e conectores", unit: "kit", quantity: 1, unitPrice: 520, unitCost: 310, discount: 0 },
      { kind: "Mão de obra", code: "MO-001", description: "Eletricista técnico", unit: "h", quantity: 4, unitPrice: 95, unitCost: 45, discount: 0 }
    ],
    history: ["Cotação criada", "Enviada por WhatsApp", "Aprovada pelo cliente", "Convertida em OS"],
    notes: "Cliente solicitou identificação completa e relatório com fotos."
  },
  {
    id: "COT-224",
    client: "Cliente residencial",
    contact: "Morador",
    phone: "(11) 90000-0000",
    email: "cliente@email.com",
    address: "Mooca, São Paulo/SP",
    serviceType: "Instalação de tomadas",
    title: "Tomada dedicada para micro-ondas",
    createdAt: "2026-06-22",
    validUntil: "2026-07-02",
    responsible: "Guilherme Santana",
    status: "Enviada",
    chance: 65,
    priority: "Média",
    payment: "Pix na conclusão",
    warranty: "90 dias",
    deadline: "3 horas",
    os: "Sem OS",
    items: [
      { kind: "Serviço", code: "SRV-002", description: "Circuito dedicado", unit: "serv.", quantity: 1, unitPrice: 260, unitCost: 90, discount: 0 },
      { kind: "Material", code: "MAT-011", description: "Cabo, tomada e disjuntor", unit: "kit", quantity: 1, unitPrice: 160, unitCost: 95, discount: 0 }
    ],
    history: ["Cotação criada", "Enviada por WhatsApp"],
    notes: "Cliente pediu acabamento aparente limpo."
  },
  {
    id: "COT-226",
    client: "Clínica Vida",
    contact: "Administrativo",
    phone: "(11) 93333-3333",
    email: "financeiro@clinicavida.com",
    address: "Tatuapé, São Paulo/SP",
    serviceType: "Atendimento emergencial",
    title: "Disjuntor desarmando",
    createdAt: "2026-06-25",
    validUntil: "2026-06-26",
    responsible: "Guilherme Santana",
    status: "Aprovada",
    chance: 100,
    priority: "Urgente",
    payment: "Entrada + saldo na conclusão",
    warranty: "30 dias",
    deadline: "Imediato",
    os: "Gerar OS",
    items: [
      { kind: "Serviço", code: "SRV-003", description: "Diagnóstico emergencial", unit: "serv.", quantity: 1, unitPrice: 380, unitCost: 140, discount: 0 },
      { kind: "Mão de obra", code: "MO-002", description: "Equipe emergencial", unit: "h", quantity: 3, unitPrice: 120, unitCost: 60, discount: 0 },
      { kind: "Material", code: "MAT-012", description: "Disjuntor reserva e conectores", unit: "kit", quantity: 1, unitPrice: 240, unitCost: 120, discount: 0 }
    ],
    history: ["Cotação criada", "Cliente aprovou atendimento emergencial"],
    notes: "Cliente com operação parada. Prioridade máxima."
  },
  {
    id: "COT-230",
    client: "Sala Comercial Vikings",
    contact: "Responsável da sala",
    phone: "(11) 94444-4444",
    email: "contato@vikings.com",
    address: "Brooklin, São Paulo/SP",
    serviceType: "Automação",
    title: "Automação de iluminação",
    createdAt: "2026-06-24",
    validUntil: "2026-07-05",
    responsible: "Guilherme Santana",
    status: "Em negociação",
    chance: 72,
    priority: "Alta",
    payment: "Entrada + 2 parcelas",
    warranty: "90 dias",
    deadline: "2 dias úteis",
    os: "Sem OS",
    items: [
      { kind: "Serviço", code: "SRV-004", description: "Configuração e instalação smart", unit: "serv.", quantity: 1, unitPrice: 650, unitCost: 250, discount: 5 },
      { kind: "Material", code: "MAT-013", description: "Interruptores inteligentes e sensores", unit: "kit", quantity: 1, unitPrice: 950, unitCost: 560, discount: 5 }
    ],
    history: ["Cotação criada", "Cliente visualizou", "Follow-up realizado"],
    notes: "Cliente avaliando escopo com comando por aplicativo."
  },
  {
    id: "COT-198",
    client: "Loja comercial",
    contact: "Gerente",
    phone: "(11) 91111-1111",
    email: "loja@email.com",
    address: "Centro, São Paulo/SP",
    serviceType: "Manutenção preventiva",
    title: "Preventiva elétrica mensal",
    createdAt: "2026-06-10",
    validUntil: "2026-06-18",
    responsible: "Guilherme Santana",
    status: "Vencida",
    chance: 20,
    priority: "Média",
    payment: "Mensal",
    warranty: "Contrato recorrente",
    deadline: "Mensal",
    os: "Sem OS",
    items: [
      { kind: "Serviço", code: "SRV-005", description: "Manutenção preventiva", unit: "mês", quantity: 1, unitPrice: 780, unitCost: 330, discount: 0 }
    ],
    history: ["Cotação criada", "Enviada por e-mail", "Venceu sem retorno"],
    notes: "Precisa follow-up comercial."
  },
  {
    id: "COT-190",
    client: "Escritório corporativo",
    contact: "Facilities",
    phone: "(11) 92222-2222",
    email: "facilities@corp.com",
    address: "Pinheiros, São Paulo/SP",
    serviceType: "Iluminação",
    title: "Manutenção iluminação LED",
    createdAt: "2026-06-18",
    validUntil: "2026-06-22",
    responsible: "Guilherme Santana",
    status: "Convertida em OS",
    chance: 100,
    priority: "Baixa",
    payment: "Pix",
    warranty: "90 dias",
    deadline: "1 dia útil",
    os: "OS-1035",
    items: [
      { kind: "Serviço", code: "SRV-006", description: "Troca e ajuste de iluminação LED", unit: "serv.", quantity: 1, unitPrice: 490, unitCost: 180, discount: 0 },
      { kind: "Material", code: "MAT-014", description: "Lâmpadas e conectores", unit: "kit", quantity: 1, unitPrice: 200, unitCost: 110, discount: 0 }
    ],
    history: ["Cotação criada", "Aprovada", "Convertida em OS", "Serviço finalizado"],
    notes: "Cliente recorrente com bom histórico."
  }
];

const tabs = ["Visão Geral", "Lista de Orçamentos", "Novo Orçamento", "Pipeline Comercial", "Modelos de Proposta", "Itens e Serviços", "Aprovações", "Relatórios"];
const pipelineColumns: QuoteStatus[] = ["Rascunho", "Enviada", "Aguardando retorno", "Em negociação", "Aprovada", "Recusada", "Vencida", "Convertida em OS"];

const statusColors: Record<QuoteStatus, string> = {
  Rascunho: "bg-white/10 text-zinc-300 border-white/10",
  Enviada: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  Visualizada: "bg-purple-500/15 text-purple-300 border-purple-500/20",
  "Aguardando retorno": "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25",
  "Em negociação": "bg-orange-500/15 text-orange-300 border-orange-500/20",
  Aprovada: "bg-volt-ok/15 text-volt-ok border-volt-ok/20",
  Recusada: "bg-red-500/15 text-red-300 border-red-500/20",
  Vencida: "bg-red-500/15 text-red-300 border-red-500/20",
  "Convertida em OS": "bg-volt-ok/15 text-volt-ok border-volt-ok/20"
};

const priorityColors = {
  Baixa: "bg-white/10 text-zinc-300 border-white/10",
  Média: "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25",
  Alta: "bg-orange-500/15 text-orange-300 border-orange-500/20",
  Urgente: "bg-red-500/15 text-red-300 border-red-500/20"
};

function currency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function quoteTotal(quote: Quote) {
  return quote.items.reduce((sum, item) => {
    const gross = item.quantity * item.unitPrice;
    return sum + gross - gross * (item.discount / 100);
  }, 0);
}

function quoteCost(quote: Quote) {
  return quote.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
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
          <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Comercial</p>
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{subtitle}</p>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-volt-yellow/25 bg-volt-yellow/10 text-volt-yellow">{icon}</div>
      </div>
      {children}
    </section>
  );
}

function EvolutionChart() {
  const data = [
    { month: "Jan", orcado: 8200, aprovado: 5200, taxa: 45 },
    { month: "Fev", orcado: 11800, aprovado: 7800, taxa: 52 },
    { month: "Mar", orcado: 14500, aprovado: 9600, taxa: 58 },
    { month: "Abr", orcado: 18200, aprovado: 13200, taxa: 61 },
    { month: "Mai", orcado: 22100, aprovado: 15800, taxa: 64 },
    { month: "Jun", orcado: 27840, aprovado: 18450, taxa: 67 }
  ];
  const width = 740;
  const height = 260;
  const pad = 34;
  const max = Math.max(...data.flatMap((item) => [item.orcado, item.aprovado]));

  function points(key: "orcado" | "aprovado") {
    return data.map((item, index) => {
      const x = pad + (index * (width - pad * 2)) / (data.length - 1);
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
        <polyline fill="none" stroke="#ffcb2f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" points={points("orcado")} />
        <polyline fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={points("aprovado")} />
        {data.map((item, index) => {
          const x = pad + (index * (width - pad * 2)) / (data.length - 1);
          return <text key={item.month} x={x} y={height - 6} textAnchor="middle" fill="rgba(255,255,255,.55)" fontSize="13" fontWeight="700">{item.month}</text>;
        })}
      </svg>
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-zinc-400">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-volt-yellow" /> Valor orçado</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-volt-ok" /> Valor aprovado</span>
      </div>
    </div>
  );
}

function DonutStatus({ quotes }: { quotes: Quote[] }) {
  const rows = [
    { label: "Aprovadas", value: quotes.filter((item) => item.status === "Aprovada" || item.status === "Convertida em OS").length, color: "#22c55e" },
    { label: "Negociação", value: quotes.filter((item) => item.status === "Em negociação").length, color: "#ffcb2f" },
    { label: "Enviadas", value: quotes.filter((item) => item.status === "Enviada" || item.status === "Aguardando retorno").length, color: "#38bdf8" },
    { label: "Vencidas", value: quotes.filter((item) => item.status === "Vencida").length, color: "#ef4444" },
    { label: "Recusadas", value: quotes.filter((item) => item.status === "Recusada").length, color: "#a1a1aa" }
  ];
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
              <p className="text-3xl font-black text-volt-yellow">{quotes.length}</p>
              <p className="text-xs font-bold text-zinc-500">orçamentos</p>
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
            <span className="font-black">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CotacoesPage() {
  const [quotes, setQuotes] = useState<Quote[]>(quotesSeed);
  const [activeTab, setActiveTab] = useState("Visão Geral");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [serviceFilter, setServiceFilter] = useState("Todos");
  const [selected, setSelected] = useState<Quote | null>(quotesSeed[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<Quote | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("volt_cotacoes_premium_v1");
      if (saved) {
        const parsed = JSON.parse(saved) as Quote[];
        if (Array.isArray(parsed)) {
          setQuotes(parsed);
          setSelected(parsed[0] ?? null);
        }
      }
    } catch {
      setQuotes(quotesSeed);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem("volt_cotacoes_premium_v1", JSON.stringify(quotes));
  }, [storageReady, quotes]);

  function getRecordKey(item: Quote) {
    return item.id;
  }

  function openEditor(item: Quote) {
    setEditingKey(getRecordKey(item));
    setDraft({ ...item });
    setEditOpen(true);
  }

  function saveEditor() {
    if (!draft) return;

    const next = {
      ...draft,
      history: draft.history.length ? draft.history : ["Orçamento criado"]
    };

    setQuotes((current) => {
      const exists = current.some((item) => getRecordKey(item) === getRecordKey(next));

      if (editingKey || exists) {
        return current.map((item) => getRecordKey(item) === getRecordKey(next) ? next : item);
      }

      return [next, ...current];
    });

    setSelected(next);
    setEditOpen(false);
    setModalOpen(true);
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy: Quote = {
      ...selected,
      id: `ORC-${String(Date.now()).slice(-5)}`,
      title: `${selected.title} cópia`,
      status: "Rascunho",
      os: "Sem OS",
      history: [...selected.history, "Orçamento duplicado"]
    };
    setSelected(copy);
    setEditingKey(null);
    setDraft({ ...copy });
    setModalOpen(false);
    setActiveTab("Novo Orçamento");
    setEditOpen(true);
  }

  function removeSelected() {
    if (!selected) return;
    if (!window.confirm("Excluir este orçamento?")) return;
    setQuotes((current) => current.filter((item) => getRecordKey(item) !== getRecordKey(selected)));
    setSelected(null);
    setModalOpen(false);
    setEditOpen(false);
  }

  function quoteWhatsAppLink(quote: Quote) {
    const phone = quote.phone.replace(/\D/g, "");
    const total = currency(quoteTotal(quote));
    const items = quote.items.map((item) => `• ${item.description}: ${currency(item.quantity * item.unitPrice * (1 - item.discount / 100))}`).join("\n");

    const message = [
      `Olá, ${quote.contact || quote.client}! Tudo bem?`,
      "",
      `Segue o orçamento da Volt Soluções Elétricas:`,
      `*${quote.title}*`,
      "",
      items,
      "",
      `*Valor total:* ${total}`,
      `*Validade:* ${quote.validUntil}`,
      `*Prazo:* ${quote.deadline}`,
      `*Garantia:* ${quote.warranty}`,
      "",
      quote.notes ? `Observações: ${quote.notes}` : ""
    ].filter(Boolean).join("\n");

    return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
  }

  function openQuotePdf(quote: Quote) {
    const discountValue = quote.items.reduce((sum, item) => {
      const gross = item.quantity * item.unitPrice;
      return sum + gross * (item.discount / 100);
    }, 0);

    const laborValue = quote.items
      .filter((item) => item.kind === "Mão de obra")
      .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    openOrcamentoPdf({
      number: quote.id,
      date: quote.createdAt,
      validUntil: quote.validUntil,
      status: quote.status,

      clientName: quote.client,
      clientPhone: quote.phone,
      clientAddress: quote.address,
      service: quote.title,

      items: quote.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
        kind: item.kind
      })),

      laborValue,
      discountValue,

      paymentCondition: quote.payment,
      executionDeadline: quote.deadline,
      warranty: quote.warranty,

      technicalNotes: [
        "Todos os materiais e serviços serão executados conforme boas práticas técnicas aplicáveis.",
        "Os valores podem sofrer alteração caso haja mudança de escopo, local de instalação ou necessidade de materiais adicionais.",
        "A execução será iniciada após aprovação do orçamento e alinhamento de agenda.",
        quote.notes
      ].filter(Boolean),

      responsibleName: quote.responsible || "Guilherme Santana",
      responsibleRole: "Responsável técnico",
      responsibleDocument: "Volt Soluções Elétricas",

      companyPhone: "(11) 98878-3401",
      companyEmail: "solucoeseletricasvolt@gmail.com",
      companyCity: "São Paulo / SP",
      companyWebsite: "www.voltsolucoeseletricas.com.br"
    });
  }

  function convertQuoteToOs(id: string) {
    const osNumber = `OS-${String(Date.now()).slice(-5)}`;

    setQuotes((current) => current.map((item) => {
      if (item.id !== id) return item;

      const updated: Quote = {
        ...item,
        status: "Convertida em OS",
        os: osNumber,
        history: [...item.history, `Convertida em ${osNumber}`]
      };

      setSelected(updated);
      return updated;
    }));
  }

  const filtered = useMemo(() => {
    return quotes.filter((item) => {
      const text = `${item.id} ${item.client} ${item.title} ${item.serviceType} ${item.notes}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;
      const matchesService = serviceFilter === "Todos" || item.serviceType === serviceFilter;
      return matchesSearch && matchesStatus && matchesService;
    });
  }, [quotes, search, statusFilter, serviceFilter]);

  const stats = useMemo(() => {
    const totalQuoted = filtered.reduce((sum, item) => sum + quoteTotal(item), 0);
    const approved = filtered.filter((item) => item.status === "Aprovada" || item.status === "Convertida em OS");
    const refused = filtered.filter((item) => item.status === "Recusada");
    const expired = filtered.filter((item) => item.status === "Vencida");
    const waiting = filtered.filter((item) => ["Enviada", "Visualizada", "Aguardando retorno", "Em negociação"].includes(item.status));
    const approvedValue = approved.reduce((sum, item) => sum + quoteTotal(item), 0);
    const lostValue = refused.concat(expired).reduce((sum, item) => sum + quoteTotal(item), 0);
    const waitingValue = waiting.reduce((sum, item) => sum + quoteTotal(item), 0);
    const approvalRate = Math.round((approved.length / Math.max(filtered.length, 1)) * 100);
    const avgTicket = totalQuoted / Math.max(filtered.length, 1);

    return { totalQuoted, approved, refused, expired, waiting, approvedValue, lostValue, waitingValue, approvalRate, avgTicket };
  }, [filtered]);

  function createQuote() {
    const today = new Date().toISOString().slice(0, 10);
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const next: Quote = {
      id: `ORC-${String(Date.now()).slice(-5)}`,
      client: "",
      contact: "",
      phone: "",
      email: "",
      address: "",
      serviceType: "Instalação elétrica",
      title: "Novo orçamento",
      createdAt: today,
      validUntil,
      responsible: "Guilherme Santana",
      status: "Rascunho",
      chance: 35,
      priority: "Média",
      payment: "Pix",
      warranty: "90 dias",
      deadline: "A definir",
      os: "Sem OS",
      items: [
        { kind: "Serviço", code: "SRV-001", description: "Mão de obra / serviço técnico", unit: "serv.", quantity: 1, unitPrice: 0, unitCost: 0, discount: 0 }
      ],
      history: ["Orçamento criado"],
      notes: ""
    };

    setSelected(next);
    setEditingKey(null);
    setDraft({ ...next });
    setModalOpen(false);
    setActiveTab("Novo Orçamento");
    setEditOpen(true);
  }

  function moveQuote(id: string, status: QuoteStatus) {
    setQuotes((current) => current.map((item) => item.id === id ? { ...item, status, os: status === "Convertida em OS" ? "OS gerada" : item.os } : item));
  }

  function exportCsv() {
    const header = ["Orçamento", "Cliente", "Serviço", "Status", "Valor", "Validade", "Responsável", "Chance"];
    const rows = filtered.map((item) => [item.id, item.client, item.serviceType, item.status, quoteTotal(item), item.validUntil, item.responsible, `${item.chance}%`]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "orcamentos-volt.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const serviceTypes = ["Todos", ...Array.from(new Set(quotes.map((item) => item.serviceType)))];

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111821] via-[#080c11] to-black p-5 shadow-soft md:p-7">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-volt-yellow/20 blur-[130px]" />
          <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Orçamentos comerciais</p>
              <h1 className="mt-2 text-4xl font-black leading-tight md:text-5xl">Orçamentos</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                Orçamentos, propostas, itens, materiais, margem, aprovação, conversão para OS e lançamento financeiro em um módulo comercial completo.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
              <button onClick={createQuote} className="btn-primary inline-flex items-center justify-center gap-2"><Plus size={17} /> Novo orçamento</button>
              <button onClick={exportCsv} className="btn-ghost inline-flex items-center justify-center gap-2"><Download size={17} /> Exportar CSV</button>
              <button onClick={() => window.print()} className="btn-ghost inline-flex items-center justify-center gap-2"><FileText size={17} /> Relatório PDF</button>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[.025] p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_.7fr_.7fr]">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
              <Search size={17} className="text-volt-yellow" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente, número do orçamento, serviço ou observação..." className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600" />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
              {["Todos", ...pipelineColumns, "Visualizada"].map((status) => <option key={status}>{status}</option>)}
            </select>
            <select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
              {serviceTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
          {[
            ["Total", filtered.length, ClipboardCheck, "text-volt-yellow", "orçamentos"],
            ["Abertas", stats.waiting.length, Send, "text-blue-300", currency(stats.waitingValue)],
            ["Aprovadas", stats.approved.length, CheckCircle2, "text-volt-ok", currency(stats.approvedValue)],
            ["Recusadas", stats.refused.length, AlertTriangle, "text-red-300", currency(stats.lostValue)],
            ["Vencidas", stats.expired.length, AlertTriangle, "text-red-300", "follow-up"],
            ["Valor orçado", currency(stats.totalQuoted), Wallet, "text-volt-yellow", "total"],
            ["Aprovação", `${stats.approvalRate}%`, Percent, "text-volt-ok", "conversão"],
            ["Ticket médio", currency(stats.avgTicket), Target, "text-volt-yellow", "média"]
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
              <ChartCard title="Evolução comercial" subtitle="Valor orçado x valor aprovado e crescimento da taxa de fechamento." icon={<TrendingUp size={25} />}>
                <EvolutionChart />
              </ChartCard>
              <ChartCard title="Composição por status" subtitle="Distribuição das propostas por etapa comercial." icon={<PieChart size={25} />}>
                <DonutStatus quotes={filtered} />
              </ChartCard>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_.85fr]">
              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Orçamentos recentes</p>
                <div className="mt-5 space-y-3">
                  {filtered.slice(0, 5).map((quote) => (
                    <button key={quote.id} onClick={() => { setSelected(quote); setModalOpen(true); }} className="w-full rounded-3xl border border-white/10 bg-white/[.035] p-4 text-left transition hover:border-volt-yellow/30">
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                          <div className="mb-2 flex flex-wrap gap-2">
                            <Badge className={statusColors[quote.status]}>{quote.status}</Badge>
                            <Badge className={priorityColors[quote.priority]}>{quote.priority}</Badge>
                          </div>
                          <p className="font-black">{quote.title}</p>
                          <p className="mt-1 text-sm text-zinc-500">{quote.id} • {quote.client}</p>
                        </div>
                        <div className="md:text-right">
                          <p className="font-black text-volt-yellow">{currency(quoteTotal(quote))}</p>
                          <p className="mt-1 text-xs text-zinc-500">Chance {quote.chance}%</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Alertas comerciais</p>
                <div className="mt-5 space-y-3">
                  {["Orçamentos vencidos precisam de follow-up.", "Propostas aprovadas devem virar OS.", "Verificar materiais sem estoque antes da aprovação.", "Negociações de alto valor devem ter nova revisão controlada."].map((alert) => (
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

        {activeTab === "Lista de Orçamentos" && (
          <section className="card-premium rounded-[2rem] p-5 md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Lista profissional</p>
                <h2 className="mt-1 text-2xl font-black">Propostas comerciais</h2>
              </div>
              <FileText className="text-volt-yellow" size={26} />
            </div>

            <div className="volt-scroll overflow-x-auto">
              <table className="w-full min-w-[1120px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[.16em] text-zinc-600">
                    <th className="px-4 py-2">Orçamento</th>
                    <th className="px-4 py-2">Cliente</th>
                    <th className="px-4 py-2">Serviço</th>
                    <th className="px-4 py-2">Validade</th>
                    <th className="px-4 py-2">Responsável</th>
                    <th className="px-4 py-2">Valor</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Chance</th>
                    <th className="px-4 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((quote) => (
                    <tr key={quote.id} className="bg-white/[.035] text-sm">
                      <td className="rounded-l-2xl px-4 py-4 font-black text-volt-yellow">{quote.id}</td>
                      <td className="px-4 py-4"><p className="font-black">{quote.client}</p><p className="text-xs text-zinc-500">{quote.phone}</p></td>
                      <td className="px-4 py-4">{quote.serviceType}</td>
                      <td className="px-4 py-4">{quote.validUntil}</td>
                      <td className="px-4 py-4">{quote.responsible}</td>
                      <td className="px-4 py-4 font-black">{currency(quoteTotal(quote))}</td>
                      <td className="px-4 py-4"><Badge className={statusColors[quote.status]}>{quote.status}</Badge></td>
                      <td className="px-4 py-4"><div className="min-w-24"><div className="mb-1 text-xs font-black text-volt-yellow">{quote.chance}%</div><ProgressBar value={quote.chance} /></div></td>
                      <td className="rounded-r-2xl px-4 py-4"><button onClick={() => { setSelected(quote); setModalOpen(true); }} className="text-xs font-black text-volt-yellow">Detalhes</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "Novo Orçamento" && (
          <section className="grid gap-5 xl:grid-cols-[1fr_.85fr]">
            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Cadastro de orçamento</p>
              <h2 className="mt-1 text-2xl font-black">Crie um orçamento de verdade</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Clique no botão abaixo para abrir o formulário completo com cliente, serviço, itens, materiais, mão de obra, desconto, garantia, prazo e pagamento.
              </p>

              <button onClick={createQuote} className="btn-primary mt-6 inline-flex items-center gap-2">
                <Plus size={17} /> Novo orçamento
              </button>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {["Dados do cliente", "Descrição do serviço", "Itens e materiais", "Mão de obra", "Deslocamento", "Desconto", "Validade", "Pagamento", "Garantia", "Prazo", "PDF", "WhatsApp"].map((field) => (
                  <div key={field} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                    <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{field}</p>
                    <p className="mt-2 text-sm font-bold text-zinc-300">Disponível no formulário</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Como usar</p>
                {[
                  ["1", "Clique em Novo orçamento"],
                  ["2", "Preencha cliente, serviço e endereço"],
                  ["3", "Adicione itens de serviço, material e mão de obra"],
                  ["4", "Confira total, custo, lucro e margem"],
                  ["5", "Salve, gere PDF, envie pelo WhatsApp ou converta em OS"]
                ].map(([number, text]) => (
                  <div key={number} className="mt-3 flex gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3 text-sm">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-volt-yellow text-xs font-black text-black">{number}</span>
                    <strong className="text-zinc-300">{text}</strong>
                  </div>
                ))}
              </div>

              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Integrações preparadas</p>
                <div className="mt-4 space-y-3">
                  {["Criar cliente rápido", "Reservar materiais", "Converter em OS", "Lançar no financeiro", "Agendar execução"].map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3">
                      <CheckCircle2 className="shrink-0 text-volt-yellow" size={18} />
                      <p className="text-sm font-bold text-zinc-300">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "Pipeline Comercial" && (
          <section className="volt-scroll overflow-x-auto">
            <div className="grid min-w-[1280px] grid-cols-4 gap-4 xl:grid-cols-8">
              {pipelineColumns.map((status) => (
                <div key={status} className="rounded-[2rem] border border-white/10 bg-white/[.025] p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-black">{status}</p>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-black text-zinc-400">{filtered.filter((quote) => quote.status === status).length}</span>
                  </div>
                  <div className="space-y-3">
                    {filtered.filter((quote) => quote.status === status).map((quote) => (
                      <div key={quote.id} className="rounded-3xl border border-white/10 bg-black/35 p-4">
                        <Badge className={statusColors[quote.status]}>{quote.status}</Badge>
                        <p className="mt-3 font-black">{quote.client}</p>
                        <p className="mt-1 text-xs text-zinc-500">{quote.title}</p>
                        <p className="mt-3 text-lg font-black text-volt-yellow">{currency(quoteTotal(quote))}</p>
                        <p className="mt-1 text-xs text-zinc-500">Validade: {quote.validUntil}</p>
                        <div className="mt-4 grid gap-2">
                          {pipelineColumns.filter((next) => next !== quote.status).slice(0, 2).map((next) => (
                            <button key={next} onClick={() => moveQuote(quote.id, next)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-zinc-400 hover:border-volt-yellow/30 hover:text-volt-yellow">
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

        {activeTab === "Modelos de Proposta" && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {["Proposta simples", "Proposta completa", "Proposta para condomínio", "Proposta residencial", "Proposta comercial", "Manutenção preventiva", "Adequação de QDC", "Atendimento emergencial"].map((model) => (
              <article key={model} className="card-premium rounded-[2rem] p-5">
                <FileText className="mb-5 text-volt-yellow" size={30} />
                <h3 className="text-xl font-black">{model}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">Modelo com escopo, garantia, condições comerciais, itens padrão e observações.</p>
                <button className="mt-5 rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-zinc-300 hover:border-volt-yellow/30 hover:text-volt-yellow">Usar modelo</button>
              </article>
            ))}
          </section>
        )}

        {activeTab === "Itens e Serviços" && (
          <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Itens do orçamento</p>
              <div className="mt-5 space-y-3">
                {filtered.flatMap((quote) => quote.items.map((item) => ({ quote, item }))).slice(0, 10).map(({ quote, item }) => {
                  const total = item.quantity * item.unitPrice * (1 - item.discount / 100);
                  const cost = item.quantity * item.unitCost;
                  const margin = total ? ((total - cost) / total) * 100 : 0;
                  return (
                    <div key={`${quote.id}-${item.code}-${item.description}`} className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                          <Badge className="bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25">{item.kind}</Badge>
                          <p className="mt-3 font-black">{item.description}</p>
                          <p className="mt-1 text-xs text-zinc-500">{quote.id} • {quote.client}</p>
                        </div>
                        <div className="md:text-right">
                          <p className="font-black text-volt-yellow">{currency(total)}</p>
                          <p className="text-xs text-zinc-500">Margem {Math.round(margin)}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Resumo de custos</p>
              {[
                ["Subtotal serviços", currency(2280)],
                ["Subtotal materiais", currency(2070)],
                ["Mão de obra", currency(740)],
                ["Deslocamento", currency(260)],
                ["Impostos/taxas", currency(390)],
                ["Lucro estimado", currency(2860)]
              ].map(([label, value]) => (
                <div key={label} className="mt-3 flex justify-between rounded-2xl border border-white/10 bg-white/[.035] p-3 text-sm">
                  <span className="text-zinc-500">{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "Aprovações" && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.filter((quote) => ["Aprovada", "Recusada", "Vencida", "Convertida em OS"].includes(quote.status)).map((quote) => (
              <article key={quote.id} className="card-premium rounded-[2rem] p-5">
                <Badge className={statusColors[quote.status]}>{quote.status}</Badge>
                <h3 className="mt-4 text-xl font-black">{quote.client}</h3>
                <p className="mt-2 text-sm text-zinc-500">{quote.title}</p>
                <p className="mt-4 text-2xl font-black text-volt-yellow">{currency(quoteTotal(quote))}</p>
                <div className="mt-5 space-y-2">
                  {quote.status === "Aprovada" && <button onClick={() => moveQuote(quote.id, "Convertida em OS")} className="btn-primary w-full">Converter em OS</button>}
                  <button onClick={() => { setSelected(quote); setModalOpen(true); }} className="btn-ghost w-full">Ver detalhes</button>
                </div>
              </article>
            ))}
          </section>
        )}

        {activeTab === "Relatórios" && (
          <section className="grid gap-5 xl:grid-cols-[1fr_.85fr]">
            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Relatórios de orçamentos</p>
              <h2 className="mt-2 text-3xl font-black">Comercial executivo</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Gere relatórios de orçamentos aprovados, recusados, vencidos, por cliente, por responsável, conversão comercial e proposta completa.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {["Geral de orçamentos", "Orçamentos aprovados", "Orçamentos recusados", "Orçamentos vencidos", "Por cliente", "Por responsável", "Conversão comercial", "Completo executivo"].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[.035] p-4 font-bold text-zinc-300">{item}</div>
                ))}
              </div>
              <button onClick={() => window.print()} className="btn-primary mt-6 inline-flex items-center gap-2"><FileText size={17} /> Gerar relatório PDF</button>
            </div>

            <ChartCard title="Funil comercial" subtitle="Rascunho, enviada, negociação, aprovada e convertida em OS." icon={<BarChart3 size={25} />}>
              <div className="space-y-4">
                {pipelineColumns.slice(0, 5).map((status) => {
                  const count = filtered.filter((quote) => quote.status === status).length;
                  return (
                    <div key={status} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                      <div className="mb-2 flex justify-between text-sm font-black"><span>{status}</span><span className="text-volt-yellow">{count}</span></div>
                      <ProgressBar value={(count / Math.max(filtered.length, 1)) * 100} />
                    </div>
                  );
                })}
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
                    <Badge className={priorityColors[selected.priority]}>{selected.priority}</Badge>
                  </div>
                  <h2 className="text-3xl font-black">{selected.title}</h2>
                  <p className="mt-2 text-sm text-zinc-500">{selected.id} • {selected.client}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={quoteWhatsAppLink(selected)} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2"><MessageCircle size={17} /> WhatsApp</a>
                  <button onClick={() => openQuotePdf(selected)} className="btn-ghost inline-flex items-center gap-2"><FileText size={17} /> PDF</button>
                  <button onClick={() => convertQuoteToOs(selected.id)} className="btn-ghost">Converter em OS</button>
                  <button onClick={() => openEditor(selected)} className="btn-primary">Editar</button>
                  <button onClick={duplicateSelected} className="btn-ghost">Duplicar</button>
                  <button onClick={removeSelected} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">Excluir</button>
                  <button onClick={() => setModalOpen(false)} className="btn-ghost">Fechar</button>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.9fr]">
                <div className="space-y-4">
                  {[
                    ["Cliente", selected.client],
                    ["Contato", selected.contact],
                    ["Telefone", selected.phone],
                    ["E-mail", selected.email],
                    ["Endereço", selected.address],
                    ["Serviço", selected.serviceType],
                    ["Criação", selected.createdAt],
                    ["Validade", selected.validUntil],
                    ["Responsável", selected.responsible],
                    ["Pagamento", selected.payment],
                    ["Garantia", selected.warranty],
                    ["Prazo", selected.deadline],
                    ["OS vinculada", selected.os],
                    ["Valor final", currency(quoteTotal(selected))],
                    ["Custo estimado", currency(quoteCost(selected))],
                    ["Lucro estimado", currency(quoteTotal(selected) - quoteCost(selected))]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                      <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{label}</p>
                      <p className="mt-1 font-bold">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <p className="mb-4 text-sm font-black text-volt-yellow">Itens da proposta</p>
                    <div className="space-y-2">
                      {selected.items.map((item) => (
                        <div key={`${item.code}-${item.description}`} className="rounded-xl border border-white/10 bg-black/30 p-3">
                          <div className="flex justify-between gap-3">
                            <p className="text-sm font-black">{item.description}</p>
                            <p className="text-sm font-black text-volt-yellow">{currency(item.quantity * item.unitPrice * (1 - item.discount / 100))}</p>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">{item.kind} • {item.quantity} {item.unit} • Custo {currency(item.unitCost)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <p className="mb-4 text-sm font-black text-volt-yellow">Histórico e revisões</p>
                    <div className="space-y-2">
                      {selected.history.map((item) => (
                        <div key={item} className="flex gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                          <CheckCircle2 className="shrink-0 text-volt-yellow" size={18} />
                          <p className="text-sm font-bold text-zinc-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 p-4">
                    <p className="text-sm font-black text-volt-yellow">Observações</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">{selected.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {editOpen && draft && (
          <QuoteEditorModal
            title={editingKey ? "Editar orçamento" : "Novo orçamento"}
            draft={draft}
            setDraft={setDraft}
            onSave={saveEditor}
            onCancel={() => setEditOpen(false)}
            onPdf={() => openQuotePdf(draft)}
            whatsappLink={quoteWhatsAppLink(draft)}
          />
        )}
      </div>
    </AppShell>
  );
}



function QuoteEditorModal({
  title,
  draft,
  setDraft,
  onSave,
  onCancel,
  onPdf,
  whatsappLink
}: {
  title: string;
  draft: Quote;
  setDraft: React.Dispatch<React.SetStateAction<Quote | null>>;
  onSave: () => void;
  onCancel: () => void;
  onPdf: () => void;
  whatsappLink: string;
}) {
  function updateQuote<K extends keyof Quote>(key: K, value: Quote[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  }

  function updateItem<K extends keyof QuoteItem>(index: number, key: K, value: QuoteItem[K]) {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)
      };
    });
  }

  function addItem(kind: QuoteItem["kind"] = "Serviço") {
    setDraft((current) => {
      if (!current) return current;

      const nextItem: QuoteItem = {
        kind,
        code: `${kind.slice(0, 3).toUpperCase()}-${String(current.items.length + 1).padStart(3, "0")}`,
        description: kind === "Material" ? "Novo material" : kind === "Mão de obra" ? "Mão de obra" : "Novo serviço",
        unit: kind === "Mão de obra" ? "h" : kind === "Material" ? "un" : "serv.",
        quantity: 1,
        unitPrice: 0,
        unitCost: 0,
        discount: 0
      };

      return { ...current, items: [...current.items, nextItem] };
    });
  }

  function removeItem(index: number) {
    setDraft((current) => {
      if (!current) return current;
      return { ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) };
    });
  }

  function updateHistory(raw: string) {
    updateQuote("history", raw.split("\n").map((item) => item.trim()).filter(Boolean));
  }

  const total = quoteTotal(draft);
  const cost = quoteCost(draft);
  const profit = total - cost;
  const margin = total > 0 ? Math.round((profit / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="volt-scroll max-h-[92vh] w-full max-w-7xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#080c11] p-5 shadow-2xl">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Orçamento funcional</p>
            <h2 className="mt-2 text-3xl font-black">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Preencha o orçamento sem JSON. Os itens calculam total, custo, lucro e margem automaticamente.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn-ghost inline-flex items-center gap-2">
              <MessageCircle size={17} /> WhatsApp
            </a>
            <button onClick={onPdf} className="btn-ghost inline-flex items-center gap-2">
              <FileText size={17} /> PDF
            </button>
            <button onClick={onCancel} className="btn-ghost">Cancelar</button>
            <button onClick={onSave} className="btn-primary">Salvar orçamento</button>
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.42fr]">
          <div className="space-y-5">
            <section className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Dados do cliente</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <EditorField label="Número do orçamento">
                  <input value={draft.id} onChange={(event) => updateQuote("id", event.target.value)} className="field-input" />
                </EditorField>

                <EditorField label="Status">
                  <select value={draft.status} onChange={(event) => updateQuote("status", event.target.value as QuoteStatus)} className="field-input">
                    {pipelineColumns.concat("Visualizada").map((status) => <option key={status}>{status}</option>)}
                  </select>
                </EditorField>

                <EditorField label="Cliente">
                  <input value={draft.client} onChange={(event) => updateQuote("client", event.target.value)} className="field-input" />
                </EditorField>

                <EditorField label="Contato">
                  <input value={draft.contact} onChange={(event) => updateQuote("contact", event.target.value)} className="field-input" />
                </EditorField>

                <EditorField label="WhatsApp">
                  <input value={draft.phone} onChange={(event) => updateQuote("phone", event.target.value)} className="field-input" />
                </EditorField>

                <EditorField label="E-mail">
                  <input value={draft.email} onChange={(event) => updateQuote("email", event.target.value)} className="field-input" />
                </EditorField>

                <EditorField label="Endereço" full>
                  <input value={draft.address} onChange={(event) => updateQuote("address", event.target.value)} className="field-input" />
                </EditorField>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Dados do serviço</p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <EditorField label="Nome do serviço" full>
                  <input value={draft.title} onChange={(event) => updateQuote("title", event.target.value)} className="field-input" />
                </EditorField>

                <EditorField label="Tipo de serviço">
                  <input value={draft.serviceType} onChange={(event) => updateQuote("serviceType", event.target.value)} className="field-input" />
                </EditorField>

                <EditorField label="Prioridade">
                  <select value={draft.priority} onChange={(event) => updateQuote("priority", event.target.value as Quote["priority"])} className="field-input">
                    {["Baixa", "Média", "Alta", "Urgente"].map((priority) => <option key={priority}>{priority}</option>)}
                  </select>
                </EditorField>

                <EditorField label="Data de criação">
                  <input type="date" value={draft.createdAt} onChange={(event) => updateQuote("createdAt", event.target.value)} className="field-input" />
                </EditorField>

                <EditorField label="Validade">
                  <input type="date" value={draft.validUntil} onChange={(event) => updateQuote("validUntil", event.target.value)} className="field-input" />
                </EditorField>

                <EditorField label="Responsável">
                  <input value={draft.responsible} onChange={(event) => updateQuote("responsible", event.target.value)} className="field-input" />
                </EditorField>

                <EditorField label="Chance de fechamento (%)">
                  <input type="number" value={draft.chance} onChange={(event) => updateQuote("chance", Number(event.target.value))} className="field-input" />
                </EditorField>

                <EditorField label="Forma de pagamento">
                  <input value={draft.payment} onChange={(event) => updateQuote("payment", event.target.value)} className="field-input" />
                </EditorField>

                <EditorField label="Garantia">
                  <input value={draft.warranty} onChange={(event) => updateQuote("warranty", event.target.value)} className="field-input" />
                </EditorField>

                <EditorField label="Prazo de execução">
                  <input value={draft.deadline} onChange={(event) => updateQuote("deadline", event.target.value)} className="field-input" />
                </EditorField>

                <EditorField label="OS vinculada">
                  <input value={draft.os} onChange={(event) => updateQuote("os", event.target.value)} className="field-input" />
                </EditorField>

                <EditorField label="Observações" full>
                  <textarea value={draft.notes} onChange={(event) => updateQuote("notes", event.target.value)} rows={4} className="field-input" />
                </EditorField>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Itens do orçamento</p>
                  <h3 className="mt-1 text-xl font-black">Serviços, materiais e mão de obra</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => addItem("Serviço")} className="btn-ghost inline-flex items-center gap-2"><Plus size={16} /> Serviço</button>
                  <button onClick={() => addItem("Material")} className="btn-ghost inline-flex items-center gap-2"><Plus size={16} /> Material</button>
                  <button onClick={() => addItem("Mão de obra")} className="btn-ghost inline-flex items-center gap-2"><Plus size={16} /> Mão de obra</button>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {draft.items.map((item, index) => {
                  const itemTotal = item.quantity * item.unitPrice * (1 - item.discount / 100);
                  const itemCost = item.quantity * item.unitCost;

                  return (
                    <div key={`${item.code}-${index}`} className="rounded-3xl border border-white/10 bg-black/35 p-4">
                      <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                          <Badge className="bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25">{item.kind}</Badge>
                          <p className="mt-2 text-sm text-zinc-500">Item {index + 1}</p>
                        </div>

                        <button onClick={() => removeItem(index)} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-black text-red-200">
                          Remover
                        </button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-6">
                        <EditorField label="Tipo">
                          <select value={item.kind} onChange={(event) => updateItem(index, "kind", event.target.value as QuoteItem["kind"])} className="field-input">
                            {["Serviço", "Material", "Mão de obra", "Deslocamento", "Taxa"].map((kind) => <option key={kind}>{kind}</option>)}
                          </select>
                        </EditorField>

                        <EditorField label="Código">
                          <input value={item.code} onChange={(event) => updateItem(index, "code", event.target.value)} className="field-input" />
                        </EditorField>

                        <EditorField label="Descrição" full>
                          <input value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} className="field-input" />
                        </EditorField>

                        <EditorField label="Unidade">
                          <input value={item.unit} onChange={(event) => updateItem(index, "unit", event.target.value)} className="field-input" />
                        </EditorField>

                        <EditorField label="Qtd">
                          <input type="number" value={item.quantity} onChange={(event) => updateItem(index, "quantity", Number(event.target.value))} className="field-input" />
                        </EditorField>

                        <EditorField label="Valor unit.">
                          <input type="number" value={item.unitPrice} onChange={(event) => updateItem(index, "unitPrice", Number(event.target.value))} className="field-input" />
                        </EditorField>

                        <EditorField label="Custo unit.">
                          <input type="number" value={item.unitCost} onChange={(event) => updateItem(index, "unitCost", Number(event.target.value))} className="field-input" />
                        </EditorField>

                        <EditorField label="Desconto %">
                          <input type="number" value={item.discount} onChange={(event) => updateItem(index, "discount", Number(event.target.value))} className="field-input" />
                        </EditorField>
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-3">
                          <p className="text-xs text-zinc-500">Total do item</p>
                          <p className="mt-1 font-black text-volt-yellow">{currency(itemTotal)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-3">
                          <p className="text-xs text-zinc-500">Custo do item</p>
                          <p className="mt-1 font-black text-zinc-300">{currency(itemCost)}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/[.035] p-3">
                          <p className="text-xs text-zinc-500">Lucro do item</p>
                          <p className="mt-1 font-black text-volt-ok">{currency(itemTotal - itemCost)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Histórico</p>
              <textarea
                value={draft.history.join("\n")}
                onChange={(event) => updateHistory(event.target.value)}
                rows={4}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold outline-none focus:border-volt-yellow/40"
              />
              <p className="mt-2 text-xs text-zinc-600">Um registro por linha.</p>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="sticky top-24 rounded-[2rem] border border-volt-yellow/20 bg-volt-yellow/10 p-5">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Resumo do orçamento</p>

              <div className="mt-5 space-y-3">
                {[
                  ["Valor total", currency(total), "text-volt-yellow"],
                  ["Custo real", currency(cost), "text-zinc-300"],
                  ["Lucro previsto", currency(profit), profit >= 0 ? "text-volt-ok" : "text-red-300"],
                  ["Margem", `${margin}%`, margin >= 30 ? "text-volt-ok" : "text-volt-yellow"],
                  ["Itens", draft.items.length, "text-zinc-300"],
                  ["Status", draft.status, "text-zinc-300"]
                ].map(([label, value, color]) => (
                  <div key={String(label)} className="flex justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 p-3 text-sm">
                    <span className="text-zinc-500">{label}</span>
                    <strong className={String(color)}>{String(value)}</strong>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-2">
                <button onClick={onSave} className="btn-primary">Salvar orçamento</button>
                <button onClick={onPdf} className="btn-ghost inline-flex items-center justify-center gap-2"><FileText size={17} /> Gerar PDF</button>
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn-ghost inline-flex items-center justify-center gap-2"><MessageCircle size={17} /> Enviar WhatsApp</a>
              </div>

              <p className="mt-4 text-xs leading-5 text-zinc-500">
                Depois que o cliente aprovar, use Converter em OS na tela de detalhes.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function EditorField({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[.025] p-3 ${full ? "md:col-span-2" : ""}`}>
      <label className="text-[10px] font-black uppercase tracking-[.16em] text-zinc-600">{label}</label>
      <div className="[&_.field-input]:mt-2 [&_.field-input]:w-full [&_.field-input]:rounded-2xl [&_.field-input]:border [&_.field-input]:border-white/10 [&_.field-input]:bg-black/35 [&_.field-input]:px-4 [&_.field-input]:py-3 [&_.field-input]:text-sm [&_.field-input]:font-bold [&_.field-input]:outline-none [&_.field-input]:focus:border-volt-yellow/40">
        {children}
      </div>
    </div>
  );
}
