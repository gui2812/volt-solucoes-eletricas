"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Filter,
  MapPin,
  MessageCircle,
  Plus,
  Repeat,
  Search,
  ShieldAlert,
  Users,
  Wallet,
  Wrench,
  Zap
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Status =
  | "Agendado"
  | "Confirmado"
  | "Em deslocamento"
  | "Em atendimento"
  | "Concluído"
  | "Reagendado"
  | "Cancelado"
  | "Atrasado";

type Priority = "Baixa" | "Média" | "Alta" | "Urgente";

type Appointment = {
  id: string;
  title: string;
  client: string;
  phone: string;
  address: string;
  region: string;
  type: string;
  status: Status;
  priority: Priority;
  date: string;
  start: string;
  end: string;
  technician: string;
  os: string;
  quote: string;
  value: number;
  costCenter: string;
  recurrence: string;
  materials: string[];
  checklist: { item: string; done: boolean }[];
  notes: string;
};

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function todayIso() {
  return toIsoDate(new Date());
}

function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric"
  }).replace(/^./, (letter) => letter.toUpperCase());
}

function getCalendarMonth(monthOffset: number) {
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + monthOffset);
  base.setHours(12, 0, 0, 0);

  return base;
}

function getCalendarGrid(monthOffset: number) {
  const monthDate = getCalendarMonth(monthOffset);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      day: date.getDate(),
      date: toIsoDate(date),
      isCurrentMonth: date.getMonth() === month
    };
  });
}

function compareAppointmentDate(a: Appointment, b: Appointment) {
  const left = `${a.date} ${a.start}`;
  const right = `${b.date} ${b.start}`;

  return left.localeCompare(right);
}

const appointmentsSeed: Appointment[] = [
  {
    id: "AG-001",
    title: "Avaliação de quadro elétrico",
    client: "Condomínio JK 1455",
    phone: "(11) 98878-3401",
    address: "Vila Olímpia, São Paulo/SP",
    region: "Zona Sul",
    type: "Visita técnica",
    status: "Confirmado",
    priority: "Alta",
    date: "2026-06-25",
    start: "09:00",
    end: "10:30",
    technician: "Guilherme Santana",
    os: "OS-1042",
    quote: "COT-221",
    value: 350,
    costCenter: "Operação técnica",
    recurrence: "Não repetir",
    materials: ["Multímetro", "EPI", "Etiquetas"],
    checklist: [
      { item: "Confirmar com cliente", done: true },
      { item: "Verificar endereço", done: true },
      { item: "Separar EPI", done: true },
      { item: "Registrar fotos", done: false }
    ],
    notes: "Verificar necessidade de DR/DPS e identificação dos circuitos."
  },
  {
    id: "AG-002",
    title: "Instalação de tomada dedicada para ar",
    client: "Cliente residencial",
    phone: "(11) 90000-0000",
    address: "Mooca, São Paulo/SP",
    region: "Zona Leste",
    type: "Instalação elétrica",
    status: "Agendado",
    priority: "Média",
    date: "2026-06-25",
    start: "14:00",
    end: "17:00",
    technician: "Técnico 01",
    os: "OS-1043",
    quote: "COT-224",
    value: 1250,
    costCenter: "Instalações",
    recurrence: "Não repetir",
    materials: ["Cabo 4mm²", "Disjuntor 25A", "Tomada 20A", "Conduíte"],
    checklist: [
      { item: "Separar materiais", done: true },
      { item: "Separar ferramentas", done: true },
      { item: "Técnico saiu para atendimento", done: false },
      { item: "Lançamento financeiro criado", done: false }
    ],
    notes: "Cliente solicitou passagem aparente limpa e acabamento."
  },
  {
    id: "AG-003",
    title: "Manutenção preventiva mensal",
    client: "Loja comercial",
    phone: "(11) 91111-1111",
    address: "Centro, São Paulo/SP",
    region: "Centro",
    type: "Manutenção preventiva",
    status: "Em atendimento",
    priority: "Média",
    date: "2026-06-25",
    start: "11:00",
    end: "12:30",
    technician: "Técnico 02",
    os: "OS-1038",
    quote: "COT-198",
    value: 780,
    costCenter: "Preventiva",
    recurrence: "Mensalmente",
    materials: ["Checklist preventiva", "EPI", "Alicate amperímetro"],
    checklist: [
      { item: "Atendimento iniciado", done: true },
      { item: "Fotos tiradas", done: false },
      { item: "Cliente assinou", done: false },
      { item: "Serviço concluído", done: false }
    ],
    notes: "Verificar iluminação, quadro e tomadas do balcão."
  },
  {
    id: "AG-004",
    title: "Retorno técnico - iluminação LED",
    client: "Escritório corporativo",
    phone: "(11) 92222-2222",
    address: "Pinheiros, São Paulo/SP",
    region: "Zona Oeste",
    type: "Retorno",
    status: "Concluído",
    priority: "Baixa",
    date: "2026-06-24",
    start: "16:00",
    end: "17:00",
    technician: "Guilherme Santana",
    os: "OS-1035",
    quote: "COT-190",
    value: 420,
    costCenter: "Pós-venda",
    recurrence: "Não repetir",
    materials: ["Lâmpadas reserva", "Ferramentas"],
    checklist: [
      { item: "Confirmar com cliente", done: true },
      { item: "Serviço concluído", done: true },
      { item: "Lançamento financeiro criado", done: true },
      { item: "OS atualizada", done: true }
    ],
    notes: "Ajuste final concluído."
  },
  {
    id: "AG-005",
    title: "Atendimento emergencial - disjuntor desarmando",
    client: "Clínica",
    phone: "(11) 93333-3333",
    address: "Tatuapé, São Paulo/SP",
    region: "Zona Leste",
    type: "Emergência",
    status: "Atrasado",
    priority: "Urgente",
    date: "2026-06-25",
    start: "08:00",
    end: "09:00",
    technician: "Equipe terceirizada",
    os: "OS-1044",
    quote: "COT-226",
    value: 980,
    costCenter: "Emergência",
    recurrence: "Não repetir",
    materials: ["Multímetro", "Disjuntor reserva", "EPI"],
    checklist: [
      { item: "Confirmar com cliente", done: true },
      { item: "Técnico saiu para atendimento", done: false },
      { item: "Atendimento iniciado", done: false },
      { item: "Registrar fotos", done: false }
    ],
    notes: "Prioridade máxima. Cliente com operação parada."
  },
  {
    id: "AG-006",
    title: "Orçamento presencial - automação de iluminação",
    client: "Sala comercial",
    phone: "(11) 94444-4444",
    address: "Brooklin, São Paulo/SP",
    region: "Zona Sul",
    type: "Orçamento presencial",
    status: "Agendado",
    priority: "Alta",
    date: "2026-06-27",
    start: "10:00",
    end: "11:00",
    technician: "Guilherme Santana",
    os: "Sem OS",
    quote: "COT-230",
    value: 0,
    costCenter: "Comercial",
    recurrence: "Não repetir",
    materials: ["Trena", "Checklist automação"],
    checklist: [
      { item: "Confirmar com cliente", done: false },
      { item: "Verificar endereço", done: true },
      { item: "Separar ferramentas", done: false },
      { item: "Criar cotação", done: false }
    ],
    notes: "Avaliar interruptores inteligentes, sensores e integração com Alexa/Google."
  }
];

const technicians = [
  { name: "Guilherme Santana", status: "Disponível", today: 3, week: 9, conclusion: 94, region: "São Paulo" },
  { name: "Técnico 01", status: "Em deslocamento", today: 1, week: 6, conclusion: 88, region: "Zona Leste" },
  { name: "Técnico 02", status: "Em atendimento", today: 1, week: 5, conclusion: 91, region: "Centro" },
  { name: "Equipe terceirizada", status: "Ocupado", today: 1, week: 4, conclusion: 78, region: "Variável" }
];

const statusColumns: Status[] = [
  "Agendado",
  "Confirmado",
  "Em deslocamento",
  "Em atendimento",
  "Concluído",
  "Reagendado",
  "Cancelado",
  "Atrasado"
];

const types = [
  "Todos",
  "Visita técnica",
  "Orçamento presencial",
  "Instalação elétrica",
  "Manutenção preventiva",
  "Manutenção corretiva",
  "Vistoria",
  "Emergência",
  "Retorno",
  "Reunião",
  "Entrega de material",
  "Retirada de equipamento",
  "Serviço interno"
];

const typeColors: Record<string, string> = {
  "Visita técnica": "bg-blue-500/15 text-blue-300 border-blue-500/20",
  "Orçamento presencial": "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25",
  "Instalação elétrica": "bg-purple-500/15 text-purple-300 border-purple-500/20",
  "Manutenção preventiva": "bg-volt-ok/15 text-volt-ok border-volt-ok/20",
  "Manutenção corretiva": "bg-orange-500/15 text-orange-300 border-orange-500/20",
  Vistoria: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
  Emergência: "bg-red-500/15 text-red-300 border-red-500/20",
  Retorno: "bg-white/10 text-zinc-300 border-white/10",
  Reunião: "bg-pink-500/15 text-pink-300 border-pink-500/20",
  "Entrega de material": "bg-lime-500/15 text-lime-300 border-lime-500/20",
  "Retirada de equipamento": "bg-amber-500/15 text-amber-300 border-amber-500/20",
  "Serviço interno": "bg-zinc-500/15 text-zinc-300 border-zinc-500/20"
};

const statusColors: Record<Status, string> = {
  Agendado: "bg-white/10 text-zinc-300 border-white/10",
  Confirmado: "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25",
  "Em deslocamento": "bg-blue-500/15 text-blue-300 border-blue-500/20",
  "Em atendimento": "bg-purple-500/15 text-purple-300 border-purple-500/20",
  Concluído: "bg-volt-ok/15 text-volt-ok border-volt-ok/20",
  Reagendado: "bg-orange-500/15 text-orange-300 border-orange-500/20",
  Cancelado: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  Atrasado: "bg-red-500/15 text-red-300 border-red-500/20"
};

const priorityColors: Record<Priority, string> = {
  Baixa: "bg-white/10 text-zinc-300 border-white/10",
  Média: "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25",
  Alta: "bg-orange-500/15 text-orange-300 border-orange-500/20",
  Urgente: "bg-red-500/15 text-red-300 border-red-500/20"
};

function currency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[.12em] ${className}`}>
      {children}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-volt-yellow shadow-[0_0_18px_rgba(255,203,47,.45)]" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}


const AGENDA_STORAGE_KEY = "volt_agenda_premium_v1";
const AGENDA_QUEUE_KEY = "volt_agenda_compromissos_v1";
const ORDERS_STORAGE_KEY = "volt_ordens_premium_v1";

function mergeAppointments(base: Appointment[], incoming: Appointment[]) {
  const map = new Map<string, Appointment>();

  [...incoming, ...base].forEach((appointment) => {
    const key = appointment.os && appointment.os !== "Sem OS"
      ? appointment.os
      : appointment.id;

    if (!map.has(key)) {
      map.set(key, appointment);
    }
  });

  return Array.from(map.values());
}

function readAgendaFromStorage() {
  const saved = localStorage.getItem(AGENDA_STORAGE_KEY);
  const parsed = saved ? JSON.parse(saved) : null;

  return Array.isArray(parsed) ? parsed as Appointment[] : appointmentsSeed;
}

function readAgendaQueue() {
  const saved = localStorage.getItem(AGENDA_QUEUE_KEY);
  const parsed = saved ? JSON.parse(saved) : null;

  return Array.isArray(parsed) ? parsed as Appointment[] : [];
}



function mapAgendaStatusToOrderStatus(status: Status) {
  if (["Agendado", "Confirmado", "Reagendado", "Atrasado"].includes(status)) {
    return "Agendada";
  }

  if (["Em deslocamento", "Em atendimento"].includes(status)) {
    return "Em andamento";
  }

  if (status === "Concluído") {
    return "Finalizada";
  }

  if (status === "Cancelado") {
    return "Cancelada";
  }

  return null;
}

function syncLinkedOrderStatusFromAgenda(appointment: Appointment, status: Status) {
  if (!appointment.os || appointment.os === "Sem OS") return false;

  const orderStatus = mapAgendaStatusToOrderStatus(status);

  if (!orderStatus) return false;

  const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
  const parsed = saved ? JSON.parse(saved) : [];

  if (!Array.isArray(parsed)) return false;

  let updated = false;
  const note = `Agenda ${appointment.id} atualizada para ${status}.`;

  const nextOrders = parsed.map((order: { id?: string; status?: string; notes?: string }) => {
    if (order.id !== appointment.os) return order;

    updated = true;

    return {
      ...order,
      status: orderStatus,
      notes: order.notes?.includes(note) ? order.notes : `${order.notes || ""}\n${note}`.trim()
    };
  });

  if (updated) {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(nextOrders));
    window.dispatchEvent(new CustomEvent("volt:ordem-atualizada-por-agenda", {
      detail: {
        os: appointment.os,
        appointmentId: appointment.id,
        agendaStatus: status,
        orderStatus
      }
    }));
  }

  return updated;
}


export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(appointmentsSeed);
  const [activeTab, setActiveTab] = useState("Visão Geral");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [technicianFilter, setTechnicianFilter] = useState("Todos");
  const [selected, setSelected] = useState<Appointment | null>(appointmentsSeed[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<Appointment | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [storageReady, setStorageReady] = useState(false);
  const currentToday = todayIso();

  useEffect(() => {
    function syncAgendaFromStorage() {
      try {
        const savedAppointments = readAgendaFromStorage();
        const queuedAppointments = readAgendaQueue();
        const merged = mergeAppointments(savedAppointments, queuedAppointments);

        setAppointments(merged);
        setSelected(merged[0] ?? null);
        localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(merged));

        if (queuedAppointments.length) {
          localStorage.removeItem(AGENDA_QUEUE_KEY);
        }
      } catch {
        setAppointments(appointmentsSeed);
      } finally {
        setStorageReady(true);
      }
    }

    syncAgendaFromStorage();

    window.addEventListener("storage", syncAgendaFromStorage);
    window.addEventListener("volt:agenda-compromisso-criado", syncAgendaFromStorage);

    return () => {
      window.removeEventListener("storage", syncAgendaFromStorage);
      window.removeEventListener("volt:agenda-compromisso-criado", syncAgendaFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(appointments));
  }, [storageReady, appointments]);

  function forceSyncAgenda() {
    try {
      const savedAppointments = readAgendaFromStorage();
      const queuedAppointments = readAgendaQueue();
      const merged = mergeAppointments(savedAppointments, queuedAppointments);

      setAppointments(merged);
      setSelected(merged[0] ?? null);
      localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(merged));
      localStorage.removeItem(AGENDA_QUEUE_KEY);

      alert("Agenda atualizada.");
    } catch {
      alert("Não foi possível atualizar a agenda agora.");
    }
  }

  const filtered = useMemo(() => {
    return appointments.filter((item) => {
      const text = `${item.title} ${item.client} ${item.address} ${item.os} ${item.quote} ${item.type} ${item.technician}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesType = typeFilter === "Todos" || item.type === typeFilter;
      const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;
      const matchesTechnician = technicianFilter === "Todos" || item.technician === technicianFilter;
      return matchesSearch && matchesType && matchesStatus && matchesTechnician;
    });
  }, [appointments, search, typeFilter, statusFilter, technicianFilter]);

  const stats = useMemo(() => {
    const total = filtered.length || 1;
    const todayItems = filtered.filter((item) => item.date === currentToday);
    const concluded = filtered.filter((item) => item.status === "Concluído").length;
    const late = filtered.filter((item) => item.status === "Atrasado").length;
    const urgent = filtered.filter((item) => item.priority === "Urgente").length;
    const osLinked = filtered.filter((item) => item.os !== "Sem OS").length;
    const value = filtered.reduce((sum, item) => sum + item.value, 0);

    return {
      today: todayItems.length,
      visits: filtered.filter((item) => item.type === "Visita técnica").length,
      preventive: filtered.filter((item) => item.type === "Manutenção preventiva").length,
      emergency: filtered.filter((item) => item.type === "Emergência").length,
      open: filtered.filter((item) => !["Concluído", "Cancelado"].includes(item.status)).length,
      concluded,
      late,
      urgent,
      osLinked,
      techniciansInField: new Set(filtered.map((item) => item.technician)).size,
      conclusionRate: Math.round((concluded / total) * 100),
      lateRate: Math.round((late / total) * 100),
      value
    };
  }, [filtered]);

  function makeBlankAppointment(): Appointment {
    const id = `AG-${String(Date.now()).slice(-5)}`;

    return {
      id,
      title: "Novo compromisso técnico",
      client: "",
      phone: "",
      address: "",
      region: "A definir",
      type: "Visita técnica",
      status: "Agendado",
      priority: "Média",
      date: currentToday,
      start: "09:00",
      end: "10:00",
      technician: "Guilherme Santana",
      os: "Sem OS",
      quote: "Sem cotação",
      value: 0,
      costCenter: "Operação técnica",
      recurrence: "Não repetir",
      materials: ["EPI", "Ferramentas básicas"],
      checklist: [
        { item: "Confirmar com cliente", done: false },
        { item: "Verificar endereço", done: false },
        { item: "Separar ferramentas", done: false },
        { item: "Registrar fotos", done: false }
      ],
      notes: ""
    };
  }

  function openAppointmentEditor(item: Appointment) {
    setDraft({
      ...item,
      materials: [...item.materials],
      checklist: item.checklist.map((check) => ({ ...check }))
    });
    setEditOpen(true);
  }

  function saveAppointment() {
    if (!draft) return;

    const next: Appointment = {
      ...draft,
      title: draft.title.trim() || "Novo compromisso técnico",
      client: draft.client.trim() || "Cliente não informado",
      phone: draft.phone.trim() || "",
      address: draft.address.trim() || "Endereço não informado",
      materials: draft.materials.length ? draft.materials : ["Materiais a definir"],
      checklist: draft.checklist.length ? draft.checklist : [{ item: "Confirmar atendimento", done: false }]
    };

    setAppointments((current) => {
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

  function moveStatus(id: string, status: Status) {
    const appointment = appointments.find((item) => item.id === id);

    if (appointment) {
      try {
        syncLinkedOrderStatusFromAgenda(appointment, status);
      } catch {
        // A agenda continua funcionando mesmo se a sincronização com a OS falhar.
      }
    }

    setAppointments((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item))
    );

    setSelected((current) => current?.id === id ? { ...current, status } : current);
  }

  function createMockAppointment() {
    const next = makeBlankAppointment();

    setSelected(next);
    setDraft(next);
    setModalOpen(false);
    setEditOpen(true);
  }

  function exportCsv() {
    const header = ["ID", "Data", "Hora", "Cliente", "Tipo", "Técnico", "Status", "Prioridade", "Valor"];
    const rows = filtered.map((item) => [
      item.id,
      item.date,
      `${item.start}-${item.end}`,
      item.client,
      item.type,
      item.technician,
      item.status,
      item.priority,
      item.value
    ]);

    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "agenda-volt.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function generatePdf() {
    window.print();
  }

  const tabs = ["Visão Geral", "Calendário", "Lista", "Kanban", "Técnicos", "Recorrências", "Alertas", "Relatórios"];

  const calendarMonth = getCalendarMonth(monthOffset);
  const calendarTitle = formatMonthTitle(calendarMonth);
  const calendarDays = getCalendarGrid(monthOffset).map((day) => ({
    ...day,
    items: filtered.filter((item) => item.date === day.date)
  }));

  const upcomingAppointments = [...filtered]
    .filter((item) => item.date >= currentToday || !["Concluído", "Cancelado"].includes(item.status))
    .sort((a, b) => {
      if (a.priority === "Urgente" && b.priority !== "Urgente") return -1;
      if (b.priority === "Urgente" && a.priority !== "Urgente") return 1;

      return compareAppointmentDate(a, b);
    });

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111821] via-[#080c11] to-black p-5 shadow-soft md:p-7">
          <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-volt-yellow/20 blur-[130px]" />
          <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Agenda operacional</p>
              <h1 className="mt-2 text-4xl font-black leading-tight md:text-5xl">Organização de visitas, manutenções e equipe técnica.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                Controle compromissos, OS vinculadas, técnicos, recorrências, alertas, valores previstos e status de atendimento em uma tela profissional.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap xl:justify-end">
              <button onClick={createMockAppointment} className="btn-primary inline-flex items-center justify-center gap-2">
                <Plus size={17} /> Novo compromisso
              </button>
              <button onClick={forceSyncAgenda} className="btn-ghost inline-flex items-center justify-center gap-2">
                <CalendarDays size={17} /> Atualizar agenda
              </button>
              <button onClick={exportCsv} className="btn-ghost inline-flex items-center justify-center gap-2">
                <Download size={17} /> Exportar CSV
              </button>
              <button onClick={generatePdf} className="btn-ghost inline-flex items-center justify-center gap-2">
                <FileText size={17} /> Relatório PDF
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[.025] p-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_.8fr_.8fr_.8fr]">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
              <Search size={17} className="text-volt-yellow" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente, OS, endereço, serviço ou observação..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600"
              />
            </div>

            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
              {types.map((type) => <option key={type}>{type}</option>)}
            </select>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
              {["Todos", ...statusColumns].map((status) => <option key={status}>{status}</option>)}
            </select>

            <select value={technicianFilter} onChange={(event) => setTechnicianFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
              {["Todos", ...technicians.map((item) => item.name)].map((tech) => <option key={tech}>{tech}</option>)}
            </select>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
          {[
            ["Hoje", stats.today, "Compromissos de hoje", CalendarDays, "text-volt-yellow"],
            ["Visitas", stats.visits, "Visitas técnicas", Users, "text-blue-300"],
            ["Preventivas", stats.preventive, "Manutenções preventivas", Wrench, "text-volt-ok"],
            ["Emergência", stats.emergency, "Atendimentos urgentes", Zap, "text-red-300"],
            ["Abertos", stats.open, "Pendentes de conclusão", Clock3, "text-orange-300"],
            ["Atrasados", stats.late, "Precisam de atenção", ShieldAlert, "text-red-300"],
            ["OS vinculadas", stats.osLinked, "Integração com operação", FileText, "text-volt-yellow"],
            ["Técnicos", stats.techniciansInField, "Equipe em agenda", Users, "text-blue-300"],
            ["Conclusão", `${stats.conclusionRate}%`, "Taxa de conclusão", CheckCircle2, "text-volt-ok"],
            ["Atraso", `${stats.lateRate}%`, "Taxa de atraso", AlertTriangle, "text-red-300"],
            ["Valor previsto", currency(stats.value), "Agenda filtrada", Wallet, "text-volt-yellow"],
            ["Urgentes", stats.urgent, "Prioridade máxima", Zap, "text-red-300"]
          ].map(([title, value, text, Icon, color]) => {
            const IconComp = Icon as typeof CalendarDays;
            return (
              <article key={String(title)} className="card-premium rounded-3xl p-4">
                <div className="mb-4 flex items-center justify-between">
                  <IconComp className={String(color)} size={22} />
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-zinc-400">MÊS</span>
                </div>
                <p className={`text-2xl font-black ${String(color)}`}>{String(value)}</p>
                <p className="mt-1 text-sm font-black">{String(title)}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">{String(text)}</p>
              </article>
            );
          })}
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
          <section className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Próximos atendimentos</p>
                  <h2 className="mt-1 text-2xl font-black">Agenda priorizada</h2>
                </div>
                <CalendarDays className="text-volt-yellow" size={28} />
              </div>

              <div className="space-y-3">
                {upcomingAppointments
                  .slice(0, 8)
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelected(item);
                        setModalOpen(true);
                      }}
                      className="w-full rounded-3xl border border-white/10 bg-white/[.035] p-4 text-left transition hover:border-volt-yellow/30"
                    >
                      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                        <div>
                          <div className="mb-2 flex flex-wrap gap-2">
                            <Badge className={statusColors[item.status]}>{item.status}</Badge>
                            <Badge className={priorityColors[item.priority]}>{item.priority}</Badge>
                            <Badge className={typeColors[item.type] ?? "bg-white/10 text-zinc-300 border-white/10"}>{item.type}</Badge>
                          </div>
                          <p className="font-black">{item.title}</p>
                          <p className="mt-1 text-sm text-zinc-500">{item.client} • {item.technician}</p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="font-black text-volt-yellow">{item.date} • {item.start}</p>
                          <p className="mt-1 text-sm text-zinc-500">{currency(item.value)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Técnicos</p>
                <h2 className="mt-1 text-2xl font-black">Equipe em campo</h2>

                <div className="mt-5 space-y-3">
                  {technicians.map((tech) => (
                    <div key={tech.name} className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-black">{tech.name}</p>
                          <p className="mt-1 text-xs text-zinc-500">{tech.status} • {tech.region}</p>
                        </div>
                        <p className="text-lg font-black text-volt-yellow">{tech.today}</p>
                      </div>
                      <div className="mt-3">
                        <ProgressBar value={tech.conclusion} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-premium rounded-[2rem] p-5 md:p-6">
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Alertas</p>
                <div className="mt-5 space-y-3">
                  {[
                    "Compromisso atrasado com prioridade urgente.",
                    "Técnico com agenda sobrecarregada hoje.",
                    "Orçamento presencial sem OS vinculada.",
                    "Cliente precisa confirmar atendimento antes da visita."
                  ].map((alert) => (
                    <div key={alert} className="flex gap-3 rounded-2xl border border-red-500/15 bg-red-500/5 p-3">
                      <AlertTriangle className="shrink-0 text-red-300" size={18} />
                      <p className="text-sm leading-6 text-zinc-300">{alert}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "Calendário" && (
          <section className="card-premium rounded-[2rem] p-5 md:p-6">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Calendário visual</p>
                <h2 className="mt-1 text-2xl font-black">{calendarTitle}</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setMonthOffset(monthOffset - 1)} className="btn-ghost"><ChevronLeft size={17} /></button>
                <button onClick={() => setMonthOffset(0)} className="btn-primary">Hoje</button>
                <button onClick={() => setMonthOffset(monthOffset + 1)} className="btn-ghost"><ChevronRight size={17} /></button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-[.14em] text-zinc-500">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => <div key={day}>{day}</div>)}
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-7">
              {calendarDays.map((day) => (
                <div
                  key={`${day.date}-${day.day}`}
                  className={`min-h-36 rounded-3xl border p-3 ${
                    day.date === currentToday ? "border-volt-yellow/40 bg-volt-yellow/10" : day.isCurrentMonth ? "border-white/10 bg-white/[.025]" : "border-white/5 bg-white/[.01] opacity-45"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-black">{day.day}</p>
                    {day.items.length > 2 && <span className="rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-black text-red-300">CHEIO</span>}
                  </div>

                  <div className="space-y-1">
                    {day.items.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelected(item);
                          setModalOpen(true);
                        }}
                        className="block w-full truncate rounded-xl border border-white/10 bg-black/35 px-2 py-2 text-left text-xs font-bold text-zinc-300 hover:border-volt-yellow/30"
                      >
                        {item.start} • {item.client}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "Lista" && (
          <section className="card-premium rounded-[2rem] p-5 md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Lista operacional</p>
                <h2 className="mt-1 text-2xl font-black">Todos os compromissos</h2>
              </div>
              <Filter className="text-volt-yellow" size={26} />
            </div>

            <div className="volt-scroll overflow-x-auto">
              <table className="w-full min-w-[1050px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[.16em] text-zinc-600">
                    <th className="px-4 py-2">Data</th>
                    <th className="px-4 py-2">Cliente</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Técnico</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Prioridade</th>
                    <th className="px-4 py-2">OS</th>
                    <th className="px-4 py-2">Valor</th>
                    <th className="px-4 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="rounded-3xl bg-white/[.035] text-sm">
                      <td className="rounded-l-2xl px-4 py-4 font-bold">{item.date}<br /><span className="text-xs text-zinc-500">{item.start}-{item.end}</span></td>
                      <td className="px-4 py-4"><p className="font-black">{item.client}</p><p className="text-xs text-zinc-500">{item.address}</p></td>
                      <td className="px-4 py-4"><Badge className={typeColors[item.type] ?? "bg-white/10 text-zinc-300 border-white/10"}>{item.type}</Badge></td>
                      <td className="px-4 py-4">{item.technician}</td>
                      <td className="px-4 py-4"><Badge className={statusColors[item.status]}>{item.status}</Badge></td>
                      <td className="px-4 py-4"><Badge className={priorityColors[item.priority]}>{item.priority}</Badge></td>
                      <td className="px-4 py-4 font-bold text-volt-yellow">{item.os}</td>
                      <td className="px-4 py-4 font-black">{currency(item.value)}</td>
                      <td className="rounded-r-2xl px-4 py-4">
                        <button onClick={() => { setSelected(item); setModalOpen(true); }} className="text-xs font-black text-volt-yellow">Detalhes</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === "Kanban" && (
          <section className="volt-scroll overflow-x-auto">
            <div className="grid min-w-[1280px] grid-cols-4 gap-4 xl:grid-cols-8">
              {statusColumns.map((status) => (
                <div key={status} className="rounded-[2rem] border border-white/10 bg-white/[.025] p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-black">{status}</p>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-black text-zinc-400">
                      {filtered.filter((item) => item.status === status).length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {filtered.filter((item) => item.status === status).map((item) => (
                      <div key={item.id} className="rounded-3xl border border-white/10 bg-black/35 p-4">
                        <Badge className={priorityColors[item.priority]}>{item.priority}</Badge>
                        <p className="mt-3 font-black">{item.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">{item.client}</p>
                        <p className="mt-2 text-xs text-zinc-500">{item.start} • {item.technician}</p>

                        <div className="mt-4 grid gap-2">
                          {statusColumns.filter((nextStatus) => nextStatus !== item.status).slice(0, 2).map((nextStatus) => (
                            <button key={nextStatus} onClick={() => moveStatus(item.id, nextStatus)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-zinc-400 hover:border-volt-yellow/30 hover:text-volt-yellow">
                              Mover para {nextStatus}
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

        {activeTab === "Técnicos" && (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {technicians.map((tech) => (
              <article key={tech.name} className="card-premium rounded-[2rem] p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-volt-yellow text-black">
                    <Users size={25} />
                  </div>
                  <Badge className="bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25">{tech.status}</Badge>
                </div>
                <h3 className="text-xl font-black">{tech.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{tech.region}</p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[.035] p-3">
                    <p className="text-2xl font-black text-volt-yellow">{tech.today}</p>
                    <p className="text-xs text-zinc-500">Hoje</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[.035] p-3">
                    <p className="text-2xl font-black text-volt-yellow">{tech.week}</p>
                    <p className="text-xs text-zinc-500">Semana</p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs font-bold text-zinc-500"><span>Conclusão</span><span>{tech.conclusion}%</span></div>
                  <ProgressBar value={tech.conclusion} />
                </div>
              </article>
            ))}
          </section>
        )}

        {activeTab === "Recorrências" && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.filter((item) => item.recurrence !== "Não repetir").concat(filtered.slice(0, 2)).map((item) => (
              <article key={`${item.id}-rec`} className="card-premium rounded-[2rem] p-5">
                <Repeat className="mb-5 text-volt-yellow" size={28} />
                <h3 className="text-xl font-black">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{item.client}</p>
                <div className="mt-5 space-y-2 text-sm">
                  <p className="flex justify-between"><span className="text-zinc-500">Frequência</span><strong>{item.recurrence === "Não repetir" ? "Mensalmente" : item.recurrence}</strong></p>
                  <p className="flex justify-between"><span className="text-zinc-500">Próxima execução</span><strong>{item.date}</strong></p>
                  <p className="flex justify-between"><span className="text-zinc-500">Responsável</span><strong>{item.technician}</strong></p>
                </div>
              </article>
            ))}
          </section>
        )}

        {activeTab === "Alertas" && (
          <section className="grid gap-4 md:grid-cols-2">
            {[
              "Compromisso atrasado sem conclusão.",
              "Conflito de horário para o mesmo técnico.",
              "Cliente sem telefone cadastrado.",
              "OS vinculada vencida.",
              "Cotação ainda não aprovada.",
              "Cliente com pendência financeira.",
              "Manutenção preventiva próxima do vencimento.",
              "Atendimento urgente deve aparecer no topo."
            ].map((alert, index) => (
              <article key={alert} className="rounded-[2rem] border border-red-500/15 bg-red-500/5 p-5">
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-500/15 text-red-300">
                    <AlertTriangle size={23} />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[.16em] text-red-300">Alerta {index + 1}</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">{alert}</p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {activeTab === "Relatórios" && (
          <section className="grid gap-5 xl:grid-cols-[1fr_.8fr]">
            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Relatório executivo</p>
              <h2 className="mt-2 text-3xl font-black">Agenda operacional da Volt</h2>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Gere uma visão executiva com total de compromissos, técnicos, atrasos, valores previstos, tipos de atendimento e recomendações automáticas.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {[
                  "Agenda diária",
                  "Agenda semanal",
                  "Agenda mensal",
                  "Atendimentos por técnico",
                  "Atendimentos por cliente",
                  "Manutenções preventivas",
                  "Compromissos atrasados",
                  "Relatório completo executivo"
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[.035] p-4 font-bold text-zinc-300">
                    {item}
                  </div>
                ))}
              </div>

              <button onClick={generatePdf} className="btn-primary mt-6 inline-flex items-center gap-2">
                <FileText size={17} /> Gerar relatório PDF
              </button>
            </div>

            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Gráficos</p>
              <div className="mt-5 space-y-4">
                {[
                  ["Taxa de conclusão", stats.conclusionRate],
                  ["Taxa de atraso", stats.lateRate],
                  ["OS vinculadas", Math.round((stats.osLinked / (filtered.length || 1)) * 100)],
                  ["Urgências", Math.round((stats.urgent / (filtered.length || 1)) * 100)]
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <div className="mb-2 flex justify-between text-sm font-black"><span>{String(label)}</span><span className="text-volt-yellow">{String(value)}%</span></div>
                    <ProgressBar value={Number(value)} />
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
                    <Badge className={statusColors[selected.status]}>{selected.status}</Badge>
                    <Badge className={priorityColors[selected.priority]}>{selected.priority}</Badge>
                    <Badge className={typeColors[selected.type] ?? "bg-white/10 text-zinc-300 border-white/10"}>{selected.type}</Badge>
                  </div>
                  <h2 className="text-3xl font-black">{selected.title}</h2>
                  <p className="mt-2 text-sm text-zinc-500">{selected.id} • {selected.client}</p>
                </div>

                <div className="flex gap-2">
                  <a href={`https://wa.me/55${selected.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2">
                    <MessageCircle size={17} /> WhatsApp
                  </a>
                  <button onClick={() => openAppointmentEditor(selected)} className="btn-primary inline-flex items-center gap-2"><FileText size={17} /> Editar compromisso</button>
                  <button onClick={() => moveStatus(selected.id, "Em atendimento")} className="btn-ghost inline-flex items-center gap-2"><Wrench size={17} /> Iniciar atendimento</button>
                  <button onClick={() => moveStatus(selected.id, "Concluído")} className="btn-ghost inline-flex items-center gap-2"><CheckCircle2 size={17} /> Concluir</button>
                  <button onClick={() => moveStatus(selected.id, "Cancelado")} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">Cancelar</button>
                  <button onClick={() => setModalOpen(false)} className="btn-ghost">Fechar</button>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.85fr]">
                <div className="space-y-4">
                  {[
                    ["Cliente", selected.client],
                    ["Telefone", selected.phone],
                    ["Endereço", selected.address],
                    ["Data e horário", `${selected.date} • ${selected.start} às ${selected.end}`],
                    ["Técnico", selected.technician],
                    ["OS vinculada", selected.os],
                    ["Impacto na OS", mapAgendaStatusToOrderStatus(selected.status) || "-"],
                    ["Cotação", selected.quote],
                    ["Centro de custo", selected.costCenter],
                    ["Valor previsto", currency(selected.value)],
                    ["Recorrência", selected.recurrence]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                      <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{label}</p>
                      <p className="mt-1 font-bold">{value}</p>
                    </div>
                  ))}

                  <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Observações</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">{selected.notes}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <p className="mb-4 text-sm font-black text-volt-yellow">Checklist do atendimento</p>
                    <div className="space-y-2">
                      {selected.checklist.map((item) => (
                        <div key={item.item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                          <div className={`grid h-6 w-6 place-items-center rounded-full ${item.done ? "bg-volt-ok text-black" : "bg-white/10 text-zinc-500"}`}>
                            {item.done && <CheckCircle2 size={15} />}
                          </div>
                          <span className="text-sm font-bold text-zinc-300">{item.item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <p className="mb-4 text-sm font-black text-volt-yellow">Materiais e ferramentas</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.materials.map((material) => (
                        <span key={material} className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold text-zinc-300">
                          {material}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 p-4">
                    <p className="text-sm font-black text-volt-yellow">Integrações futuras</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">
                      Estrutura pronta para conectar clientes, OS, cotações, financeiro, recorrências, anexos, assinatura do cliente e Supabase.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        )}

        {editOpen && draft && (
          <AppointmentEditorModal
            draft={draft}
            setDraft={setDraft}
            onSave={saveAppointment}
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



function AppointmentEditorModal({
  draft,
  setDraft,
  onSave,
  onCancel
}: {
  draft: Appointment;
  setDraft: React.Dispatch<React.SetStateAction<Appointment | null>>;
  onSave: () => void;
  onCancel: () => void;
}) {
  function setField<K extends keyof Appointment>(field: K, value: Appointment[K]) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
  }

  function setMaterials(value: string) {
    const materials = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setDraft((current) => current ? { ...current, materials } : current);
  }

  function setChecklist(value: string) {
    const previous = draft.checklist;
    const checklist = value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => ({
        item,
        done: previous.find((check) => check.item === item)?.done ?? false
      }));

    setDraft((current) => current ? { ...current, checklist } : current);
  }

  function toggleChecklist(index: number) {
    setDraft((current) => {
      if (!current) return current;

      return {
        ...current,
        checklist: current.checklist.map((check, checkIndex) => checkIndex === index ? { ...check, done: !check.done } : check)
      };
    });
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="volt-scroll max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#080c11] p-5 shadow-2xl">
        <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/10 pb-5 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Cadastro de compromisso</p>
            <h2 className="mt-1 text-3xl font-black">Editar agenda</h2>
            <p className="mt-2 text-sm text-zinc-500">{draft.id}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={onSave} className="btn-primary inline-flex items-center gap-2"><CheckCircle2 size={17} /> Salvar compromisso</button>
            <button onClick={onCancel} className="btn-ghost">Cancelar</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Título do compromisso</span>
            <input value={draft.title} onChange={(event) => setField("title", event.target.value)} className="mt-2 w-full bg-transparent text-lg font-black outline-none" placeholder="Ex: Instalação de refletor externo" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Cliente</span>
            <input value={draft.client} onChange={(event) => setField("client", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" placeholder="Nome do cliente" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Telefone</span>
            <input value={draft.phone} onChange={(event) => setField("phone", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" placeholder="(11) 99999-9999" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Endereço</span>
            <input value={draft.address} onChange={(event) => setField("address", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" placeholder="Endereço do atendimento" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Data</span>
            <input type="date" value={draft.date} onChange={(event) => setField("date", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
              <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Início</span>
              <input type="time" value={draft.start} onChange={(event) => setField("start", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
            </label>

            <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
              <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Fim</span>
              <input type="time" value={draft.end} onChange={(event) => setField("end", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
            </label>
          </div>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Tipo</span>
            <select value={draft.type} onChange={(event) => setField("type", event.target.value)} className="mt-2 w-full bg-[#080c11] font-bold outline-none">
              {types.filter((type) => type !== "Todos").map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Status</span>
            <select value={draft.status} onChange={(event) => setField("status", event.target.value as Status)} className="mt-2 w-full bg-[#080c11] font-bold outline-none">
              {statusColumns.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Prioridade</span>
            <select value={draft.priority} onChange={(event) => setField("priority", event.target.value as Priority)} className="mt-2 w-full bg-[#080c11] font-bold outline-none">
              {["Baixa", "Média", "Alta", "Urgente"].map((priority) => <option key={priority}>{priority}</option>)}
            </select>
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Técnico</span>
            <select value={draft.technician} onChange={(event) => setField("technician", event.target.value)} className="mt-2 w-full bg-[#080c11] font-bold outline-none">
              {technicians.map((tech) => <option key={tech.name}>{tech.name}</option>)}
            </select>
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">OS vinculada</span>
            <input value={draft.os} onChange={(event) => setField("os", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" placeholder="OS-xxxxx ou Sem OS" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Cotação</span>
            <input value={draft.quote} onChange={(event) => setField("quote", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" placeholder="ORC-xxxxx ou Sem cotação" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Valor previsto</span>
            <input type="number" value={draft.value} onChange={(event) => setField("value", Number(event.target.value))} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Região</span>
            <input value={draft.region} onChange={(event) => setField("region", event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Materiais</span>
            <input value={draft.materials.join(", ")} onChange={(event) => setMaterials(event.target.value)} className="mt-2 w-full bg-transparent font-bold outline-none" placeholder="EPI, Alicate, Multímetro" />
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Checklist, um item por linha</span>
            <textarea value={draft.checklist.map((item) => item.item).join("\n")} onChange={(event) => setChecklist(event.target.value)} rows={5} className="mt-2 w-full resize-none bg-transparent text-sm font-bold leading-7 outline-none" />
          </label>

          <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4 md:col-span-2">
            <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Marcar itens do checklist</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {draft.checklist.map((item, index) => (
                <button key={`${item.item}-${index}`} onClick={() => toggleChecklist(index)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3 text-left">
                  <span className={`grid h-6 w-6 place-items-center rounded-full ${item.done ? "bg-volt-ok text-black" : "bg-white/10 text-zinc-500"}`}>{item.done && <CheckCircle2 size={15} />}</span>
                  <span className="text-sm font-bold text-zinc-300">{item.item}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="rounded-2xl border border-white/10 bg-white/[.035] p-4 md:col-span-2">
            <span className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Observações</span>
            <textarea value={draft.notes} onChange={(event) => setField("notes", event.target.value)} rows={4} className="mt-2 w-full resize-none bg-transparent text-sm font-bold leading-7 outline-none" placeholder="Observações do atendimento" />
          </label>
        </div>
      </div>
    </div>
  );
}
