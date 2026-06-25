"use client";

import { AppShell } from "@/components/layout/app-shell";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Filter,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  Users,
  Wallet,
  Wrench,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OrderStatus = "Orçamento" | "Agendada" | "Em andamento" | "Finalizada" | "Cancelada";
type Priority = "Baixa" | "Média" | "Alta" | "Urgente";

type ServiceOrder = {
  id: string;
  title: string;
  client: string;
  phone: string;
  address: string;
  type: string;
  status: OrderStatus;
  priority: Priority;
  date: string;
  technician: string;
  value: number;
  paid: number;
  materialsCost: number;
  quote: string;
  checklist: { item: string; done: boolean }[];
  materials: string[];
  notes: string;
};

const ordersSeed: ServiceOrder[] = [
  {
    id: "OS-1042",
    title: "Organização de quadro elétrico residencial",
    client: "Condomínio JK 1455",
    phone: "(11) 98878-3401",
    address: "Vila Olímpia, São Paulo/SP",
    type: "QDC",
    status: "Em andamento",
    priority: "Alta",
    date: "2026-06-25",
    technician: "Guilherme Santana",
    value: 1850,
    paid: 900,
    materialsCost: 520,
    quote: "COT-221",
    checklist: [
      { item: "Fotos antes", done: true },
      { item: "Desenergizar circuito", done: true },
      { item: "Identificar disjuntores", done: true },
      { item: "Testar DR/DPS", done: false },
      { item: "Fotos depois", done: false },
      { item: "Cliente aprovou entrega", done: false }
    ],
    materials: ["Disjuntores", "Etiquetas", "Barramento", "Cabos"],
    notes: "Organizar, identificar e testar circuitos principais."
  },
  {
    id: "OS-1043",
    title: "Tomada dedicada para micro-ondas",
    client: "Cliente residencial",
    phone: "(11) 90000-0000",
    address: "Mooca, São Paulo/SP",
    type: "Circuito dedicado",
    status: "Agendada",
    priority: "Média",
    date: "2026-06-26",
    technician: "Técnico 01",
    value: 420,
    paid: 0,
    materialsCost: 110,
    quote: "COT-224",
    checklist: [
      { item: "Separar cabo", done: true },
      { item: "Separar tomada", done: true },
      { item: "Executar passagem", done: false },
      { item: "Teste de carga", done: false }
    ],
    materials: ["Cabo 2,5mm²", "Tomada 20A", "Conduíte"],
    notes: "Passagem aparente com acabamento limpo."
  },
  {
    id: "OS-1044",
    title: "Atendimento emergencial - disjuntor desarmando",
    client: "Clínica",
    phone: "(11) 93333-3333",
    address: "Tatuapé, São Paulo/SP",
    type: "Manutenção corretiva",
    status: "Em andamento",
    priority: "Urgente",
    date: "2026-06-25",
    technician: "Equipe terceirizada",
    value: 980,
    paid: 300,
    materialsCost: 180,
    quote: "COT-226",
    checklist: [
      { item: "Diagnóstico inicial", done: true },
      { item: "Medição de corrente", done: false },
      { item: "Correção da falha", done: false },
      { item: "Relatório final", done: false }
    ],
    materials: ["Multímetro", "Disjuntor reserva", "EPI"],
    notes: "Prioridade máxima. Cliente com operação parada."
  },
  {
    id: "OS-1035",
    title: "Manutenção iluminação LED",
    client: "Escritório corporativo",
    phone: "(11) 92222-2222",
    address: "Pinheiros, São Paulo/SP",
    type: "Iluminação",
    status: "Finalizada",
    priority: "Baixa",
    date: "2026-06-24",
    technician: "Guilherme Santana",
    value: 690,
    paid: 690,
    materialsCost: 160,
    quote: "COT-190",
    checklist: [
      { item: "Fotos antes", done: true },
      { item: "Troca LED", done: true },
      { item: "Teste final", done: true },
      { item: "Cliente aprovou entrega", done: true }
    ],
    materials: ["Lâmpadas LED", "Conectores"],
    notes: "Serviço finalizado e aprovado."
  },
  {
    id: "OS-1045",
    title: "Automação de iluminação sala comercial",
    client: "Sala comercial",
    phone: "(11) 94444-4444",
    address: "Brooklin, São Paulo/SP",
    type: "Automação",
    status: "Orçamento",
    priority: "Alta",
    date: "2026-06-28",
    technician: "Guilherme Santana",
    value: 1600,
    paid: 0,
    materialsCost: 520,
    quote: "COT-230",
    checklist: [
      { item: "Levantamento de pontos", done: false },
      { item: "Escolher interruptores smart", done: false },
      { item: "Validar compatibilidade", done: false },
      { item: "Enviar proposta", done: false }
    ],
    materials: ["Interruptor smart", "Sensor", "Relé", "Conectores"],
    notes: "Preparar proposta com comando por app e integração Alexa/Google."
  }
];

const statusColors: Record<OrderStatus, string> = {
  Orçamento: "bg-volt-yellow/15 text-volt-yellow border-volt-yellow/25",
  Agendada: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  "Em andamento": "bg-purple-500/15 text-purple-300 border-purple-500/20",
  Finalizada: "bg-volt-ok/15 text-volt-ok border-volt-ok/20",
  Cancelada: "bg-red-500/15 text-red-300 border-red-500/20"
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
  return <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[.12em] ${className}`}>{children}</span>;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-volt-yellow" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

export default function OrdensPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>(ordersSeed);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [selected, setSelected] = useState<ServiceOrder | null>(ordersSeed[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<EditableRecord | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("volt_ordens_premium_v1");
      if (saved) {
        const parsed = JSON.parse(saved) as ServiceOrder[];
        if (Array.isArray(parsed)) {
          setOrders(parsed);
          setSelected(parsed[0] ?? null);
        }
      }
    } catch {
      setOrders(ordersSeed);
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem("volt_ordens_premium_v1", JSON.stringify(orders));
  }, [storageReady, orders]);

  function getRecordKey(item: ServiceOrder) {
    return item.id;
  }

  function openEditor(item: ServiceOrder) {
    setEditingKey(getRecordKey(item));
    setDraft({ ...item } as unknown as EditableRecord);
    setEditOpen(true);
  }

  function saveEditor() {
    if (!draft) return;
    const next = draft as unknown as ServiceOrder;
    setOrders((current) => current.map((item) => getRecordKey(item) === editingKey ? next : item));
    setSelected(next);
    setEditOpen(false);
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy: ServiceOrder = { ...selected, id: `OS-${1046 + orders.length}`, title: `${selected.title} cópia` };
    setOrders((current) => [copy, ...current]);
    setSelected(copy);
    setEditingKey(getRecordKey(copy));
    setDraft({ ...copy } as unknown as EditableRecord);
    setEditOpen(true);
  }

  function removeSelected() {
    if (!selected) return;
    if (!window.confirm("Excluir este registro?")) return;
    setOrders((current) => current.filter((item) => getRecordKey(item) !== getRecordKey(selected)));
    setSelected(null);
    setModalOpen(false);
    setEditOpen(false);
  }


  const filtered = useMemo(() => {
    return orders.filter((item) => {
      const text = `${item.id} ${item.title} ${item.client} ${item.address} ${item.type} ${item.status}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === "Todos" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const totals = useMemo(() => {
    const revenue = filtered.reduce((sum, item) => sum + item.value, 0);
    const paid = filtered.reduce((sum, item) => sum + item.paid, 0);
    const cost = filtered.reduce((sum, item) => sum + item.materialsCost, 0);
    return {
      total: filtered.length,
      revenue,
      paid,
      open: revenue - paid,
      cost,
      profit: revenue - cost,
      progress: Math.round((filtered.filter((item) => item.status === "Finalizada").length / (filtered.length || 1)) * 100)
    };
  }, [filtered]);

  function createOrder() {
    const next: ServiceOrder = {
      id: `OS-${1046 + orders.length}`,
      title: "Nova ordem de serviço",
      client: "Cliente novo",
      phone: "(11) 99999-9999",
      address: "São Paulo/SP",
      type: "Manutenção",
      status: "Orçamento",
      priority: "Média",
      date: "2026-06-29",
      technician: "Guilherme Santana",
      value: 0,
      paid: 0,
      materialsCost: 0,
      quote: "Sem cotação",
      checklist: [
        { item: "Fotos antes", done: false },
        { item: "Diagnóstico", done: false },
        { item: "Execução", done: false },
        { item: "Teste final", done: false }
      ],
      materials: ["EPI", "Ferramentas básicas"],
      notes: "Editar detalhes da nova OS."
    };
    setOrders((current) => [next, ...current]);
    setSelected(next);
    setEditingKey(getRecordKey(next));
    setDraft({ ...next } as unknown as EditableRecord);
    setModalOpen(false);
    setEditOpen(true);
  }

  function exportCsv() {
    const header = ["OS", "Cliente", "Serviço", "Status", "Prioridade", "Técnico", "Valor", "Pago", "Saldo"];
    const rows = filtered.map((item) => [
      item.id,
      item.client,
      item.title,
      item.status,
      item.priority,
      item.technician,
      item.value,
      item.paid,
      item.value - item.paid
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ordens-volt.csv";
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
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Central de execução</p>
              <h1 className="mt-2 text-4xl font-black leading-tight md:text-5xl">Ordens de serviço</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
                Controle status, prioridade, cliente, execução, materiais, fotos, valores, saldo e checklist técnico de cada atendimento.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={createOrder} className="btn-primary inline-flex items-center justify-center gap-2"><Plus size={17} /> Nova OS</button>
              <button onClick={exportCsv} className="btn-ghost inline-flex items-center justify-center gap-2"><Download size={17} /> Exportar CSV</button>
              <button onClick={() => window.print()} className="btn-ghost inline-flex items-center justify-center gap-2"><FileText size={17} /> PDF</button>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {[
            ["Total de OS", totals.total, ClipboardCheck, "text-volt-yellow"],
            ["Receita", currency(totals.revenue), Wallet, "text-volt-yellow"],
            ["Recebido", currency(totals.paid), CheckCircle2, "text-volt-ok"],
            ["A receber", currency(totals.open), AlertTriangle, "text-orange-300"],
            ["Custo materiais", currency(totals.cost), Wrench, "text-blue-300"],
            ["Margem bruta", currency(totals.profit), ShieldCheck, "text-volt-ok"]
          ].map(([label, value, Icon, color]) => {
            const IconComp = Icon as typeof ClipboardCheck;
            return (
              <article key={String(label)} className="card-premium rounded-3xl p-4">
                <IconComp className={String(color)} size={24} />
                <p className={`mt-4 text-2xl font-black ${String(color)}`}>{String(value)}</p>
                <p className="mt-1 text-sm text-zinc-500">{String(label)}</p>
              </article>
            );
          })}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[.025] p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_240px]">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
              <Search size={17} className="text-volt-yellow" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por cliente, OS, serviço, endereço..." className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-600" />
            </div>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold outline-none">
              {["Todos", "Orçamento", "Agendada", "Em andamento", "Finalizada", "Cancelada"].map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_.9fr]">
          <div className="card-premium rounded-[2rem] p-5 md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Lista operacional</p>
                <h2 className="mt-1 text-2xl font-black">Serviços em controle</h2>
              </div>
              <Filter className="text-volt-yellow" size={26} />
            </div>

            <div className="space-y-3">
              {filtered.map((order) => {
                const paidPercent = Math.round((order.paid / (order.value || 1)) * 100);
                const checklistPercent = Math.round((order.checklist.filter((item) => item.done).length / order.checklist.length) * 100);

                return (
                  <button key={order.id} onClick={() => { setSelected(order); setModalOpen(true); }} className="w-full rounded-3xl border border-white/10 bg-white/[.035] p-4 text-left transition hover:border-volt-yellow/30">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap gap-2">
                          <Badge className={statusColors[order.status]}>{order.status}</Badge>
                          <Badge className={priorityColors[order.priority]}>{order.priority}</Badge>
                        </div>
                        <p className="text-lg font-black">{order.title}</p>
                        <p className="mt-1 text-sm text-zinc-500">{order.id} • {order.client} • {order.technician}</p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-zinc-600"><MapPin size={13} /> {order.address}</p>
                      </div>

                      <div className="min-w-[190px]">
                        <p className="text-right text-lg font-black text-volt-yellow">{currency(order.value)}</p>
                        <p className="mt-1 text-right text-xs text-zinc-500">Pago: {currency(order.paid)}</p>
                        <div className="mt-3">
                          <div className="mb-1 flex justify-between text-[11px] font-bold text-zinc-500"><span>Pagamento</span><span>{paidPercent}%</span></div>
                          <ProgressBar value={paidPercent} />
                        </div>
                        <div className="mt-3">
                          <div className="mb-1 flex justify-between text-[11px] font-bold text-zinc-500"><span>Checklist</span><span>{checklistPercent}%</span></div>
                          <ProgressBar value={checklistPercent} />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Kanban por status</p>
              <div className="mt-5 space-y-3">
                {(["Orçamento", "Agendada", "Em andamento", "Finalizada", "Cancelada"] as OrderStatus[]).map((status) => (
                  <div key={status} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <div className="flex items-center justify-between">
                      <Badge className={statusColors[status]}>{status}</Badge>
                      <strong>{filtered.filter((item) => item.status === status).length}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-premium rounded-[2rem] p-5 md:p-6">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Padrão Volt</p>
              <div className="mt-5 space-y-3">
                {["Fotos antes/depois", "Checklist técnico", "Materiais usados", "Aceite do cliente", "Lançamento financeiro"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3">
                    <CheckCircle2 className="text-volt-yellow" size={18} />
                    <span className="text-sm font-bold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {modalOpen && selected && (
          <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="volt-scroll max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#080c11] p-5 shadow-2xl">
              <div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge className={statusColors[selected.status]}>{selected.status}</Badge>
                    <Badge className={priorityColors[selected.priority]}>{selected.priority}</Badge>
                  </div>
                  <h2 className="text-3xl font-black">{selected.title}</h2>
                  <p className="mt-2 text-sm text-zinc-500">{selected.id} • {selected.client}</p>
                </div>

                <div className="flex gap-2">
                  <a href={`https://wa.me/55${selected.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2"><MessageCircle size={17} /> WhatsApp</a>
                  <button onClick={() => openEditor(selected)} className="btn-primary">Editar</button>
                  <button onClick={duplicateSelected} className="btn-ghost">Duplicar</button>
                  <button onClick={removeSelected} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200">Excluir</button>
                  <button onClick={() => setModalOpen(false)} className="btn-ghost">Fechar</button>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.85fr]">
                <div className="space-y-4">
                  {[
                    ["Cliente", selected.client],
                    ["Telefone", selected.phone],
                    ["Endereço", selected.address],
                    ["Tipo de serviço", selected.type],
                    ["Data agendada", selected.date],
                    ["Técnico", selected.technician],
                    ["Cotação", selected.quote],
                    ["Valor", currency(selected.value)],
                    ["Valor pago", currency(selected.paid)],
                    ["Saldo", currency(selected.value - selected.paid)],
                    ["Custo materiais", currency(selected.materialsCost)],
                    ["Lucro bruto", currency(selected.value - selected.materialsCost)]
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
                    <p className="mb-4 text-sm font-black text-volt-yellow">Checklist técnico</p>
                    <div className="space-y-2">
                      {selected.checklist.map((item) => (
                        <div key={item.item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                          <div className={`grid h-6 w-6 place-items-center rounded-full ${item.done ? "bg-volt-ok text-black" : "bg-white/10 text-zinc-500"}`}>{item.done && <CheckCircle2 size={15} />}</div>
                          <span className="text-sm font-bold text-zinc-300">{item.item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <p className="mb-4 text-sm font-black text-volt-yellow">Materiais usados</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.materials.map((material) => (
                        <span key={material} className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-xs font-bold text-zinc-300">{material}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                      <Camera className="mb-3 text-volt-yellow" />
                      <p className="font-black">Fotos antes</p>
                      <p className="mt-1 text-xs text-zinc-500">Estrutura pronta para anexos.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                      <Camera className="mb-3 text-volt-yellow" />
                      <p className="font-black">Fotos depois</p>
                      <p className="mt-1 text-xs text-zinc-500">Entrega documentada.</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 p-4">
                    <p className="text-sm font-black text-volt-yellow">Pronto para evoluir</p>
                    <p className="mt-2 text-sm leading-7 text-zinc-300">
                      Estrutura preparada para assinatura, PDF da OS, financeiro, anexos, aceite do cliente e banco Supabase.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="rounded-[2rem] border border-volt-yellow/20 bg-volt-yellow/10 p-5">
          <p className="font-black text-volt-yellow">Integrações futuras</p>
          <p className="mt-2 text-sm leading-7 text-zinc-300">
            A página já está desenhada para conversar com agenda, clientes, cotações, financeiro, materiais, relatórios e QDC 3D.
          </p>
          <Link href="/agenda" className="mt-4 inline-flex items-center gap-2 text-sm font-black text-volt-yellow">
            Ver agenda <ArrowUpRight size={16} />
          </Link>
        </section>

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

