import { AppShell } from "@/components/layout/app-shell";
import type { ReactNode } from "react";
import {
  ArrowUpRight,
  BarChart3,
  BellRing,
  CalendarDays,
  CheckCircle2,
  CircuitBoard,
  ClipboardCheck,
  FileText,
  Gauge,
  LineChart,
  MessageCircle,
  PieChart,
  Plus,
  ScatterChart,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  Zap
} from "lucide-react";
import Link from "next/link";

const whatsappMessage = encodeURIComponent("Olá, quero falar com a Volt Soluções Elétricas.");

const kpis = [
  {
    label: "Receita prevista",
    value: "R$ 18.450",
    note: "Meta: R$ 25.000",
    percent: 74,
    icon: Wallet
  },
  {
    label: "Clientes alcançados",
    value: "38",
    note: "Meta: 50 clientes",
    percent: 76,
    icon: Users
  },
  {
    label: "OS concluídas",
    value: "14",
    note: "Meta: 20 no mês",
    percent: 70,
    icon: ClipboardCheck
  },
  {
    label: "Taxa de conversão",
    value: "42%",
    note: "Orçamentos aprovados",
    percent: 42,
    icon: TrendingUp
  }
];

const monthlyEvolution = [
  { month: "Jan", clientes: 12, os: 6, receita: 5200 },
  { month: "Fev", clientes: 18, os: 8, receita: 7800 },
  { month: "Mar", clientes: 22, os: 10, receita: 9600 },
  { month: "Abr", clientes: 29, os: 12, receita: 13200 },
  { month: "Mai", clientes: 34, os: 13, receita: 15800 },
  { month: "Jun", clientes: 38, os: 14, receita: 18450 }
];

const comparisonData = [
  { label: "Jan", leads: 18, orcamentos: 9, fechados: 5 },
  { label: "Fev", leads: 24, orcamentos: 13, fechados: 7 },
  { label: "Mar", leads: 31, orcamentos: 16, fechados: 9 },
  { label: "Abr", leads: 37, orcamentos: 19, fechados: 11 },
  { label: "Mai", leads: 42, orcamentos: 24, fechados: 12 },
  { label: "Jun", leads: 48, orcamentos: 28, fechados: 14 }
];

const distributionData = [
  { label: "QDC", value: 14 },
  { label: "Circuito dedicado", value: 11 },
  { label: "Manutenção", value: 9 },
  { label: "Iluminação", value: 7 },
  { label: "Automação", value: 5 }
];

const compositionData = [
  { label: "Quadros/QDC", value: 38, color: "#ffcb2f" },
  { label: "Circuitos dedicados", value: 24, color: "#22c55e" },
  { label: "Manutenção", value: 18, color: "#38bdf8" },
  { label: "Automação", value: 12, color: "#a78bfa" },
  { label: "Iluminação", value: 8, color: "#f97316" }
];

const relationData = [
  { label: "QDC apto", x: 1850, y: 8 },
  { label: "DR/DPS", x: 2300, y: 12 },
  { label: "Tomada", x: 420, y: 2 },
  { label: "LED", x: 690, y: 3 },
  { label: "Automação", x: 1600, y: 6 },
  { label: "Manutenção", x: 980, y: 5 },
  { label: "Circuito ar", x: 1250, y: 4 }
];

const operationCards = [
  {
    title: "Gestão",
    value: "87%",
    text: "Organização de clientes, orçamentos e histórico.",
    icon: Gauge
  },
  {
    title: "Operação",
    value: "14 OS",
    text: "Serviços concluídos, em execução e agendados.",
    icon: Wrench
  },
  {
    title: "Sistema",
    value: "Online",
    text: "Painel, financeiro, agenda e QDC 3D funcionando.",
    icon: CircuitBoard
  }
];

const quickActions = [
  { title: "Novo cliente", href: "/clientes", icon: Users },
  { title: "Nova OS", href: "/ordens", icon: ClipboardCheck },
  { title: "Cotação", href: "/cotacoes", icon: FileText },
  { title: "Agenda", href: "/agenda", icon: CalendarDays },
  { title: "Financeiro", href: "/financeiro", icon: Wallet },
  { title: "QDC 3D", href: "/circuitos", icon: CircuitBoard }
];

const alerts = [
  {
    title: "Meta de clientes em 76%",
    text: "Faltam 12 clientes para bater a meta mensal.",
    level: "Meta"
  },
  {
    title: "Automação começando a crescer",
    text: "5 demandas mapeadas. Vale destacar mais esse serviço no comercial.",
    level: "Oportunidade"
  },
  {
    title: "Orçamentos sem retorno",
    text: "7 propostas abertas precisam de follow-up.",
    level: "Atenção"
  }
];

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-volt-yellow shadow-[0_0_18px_rgba(255,203,47,.45)]"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon,
  children
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card-premium rounded-[2rem] p-5 md:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">
            Indicador
          </p>
          <h2 className="mt-1 text-2xl font-black">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{subtitle}</p>
        </div>
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-volt-yellow/25 bg-volt-yellow/10 text-volt-yellow">
          {icon}
        </div>
      </div>
      {children}
    </section>
  );
}

function EvolutionChart() {
  const width = 720;
  const height = 260;
  const padX = 34;
  const padY = 28;
  const maxReceita = Math.max(...monthlyEvolution.map((item) => item.receita));
  const maxClientes = Math.max(...monthlyEvolution.map((item) => item.clientes));

  const receitaPoints = monthlyEvolution
    .map((item, index) => {
      const x = padX + (index * (width - padX * 2)) / (monthlyEvolution.length - 1);
      const y = height - padY - (item.receita / maxReceita) * (height - padY * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const clientePoints = monthlyEvolution
    .map((item, index) => {
      const x = padX + (index * (width - padX * 2)) / (monthlyEvolution.length - 1);
      const y = height - padY - (item.clientes / maxClientes) * (height - padY * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[260px] w-full">
        {[0, 1, 2, 3].map((line) => {
          const y = padY + (line * (height - padY * 2)) / 3;
          return <line key={line} x1={padX} x2={width - padX} y1={y} y2={y} stroke="rgba(255,255,255,.08)" />;
        })}

        <polyline fill="none" stroke="#ffcb2f" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" points={receitaPoints} />
        <polyline fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={clientePoints} />

        {monthlyEvolution.map((item, index) => {
          const x = padX + (index * (width - padX * 2)) / (monthlyEvolution.length - 1);
          const yReceita = height - padY - (item.receita / maxReceita) * (height - padY * 2);
          const yClientes = height - padY - (item.clientes / maxClientes) * (height - padY * 2);

          return (
            <g key={item.month}>
              <circle cx={x} cy={yReceita} r="6" fill="#ffcb2f" />
              <circle cx={x} cy={yClientes} r="5" fill="#22c55e" />
              <text x={x} y={height - 6} textAnchor="middle" fill="rgba(255,255,255,.55)" fontSize="13" fontWeight="700">
                {item.month}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-zinc-400">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-volt-yellow" /> Receita</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-volt-ok" /> Clientes</span>
      </div>
    </div>
  );
}

function ComparisonChart() {
  const maxValue = Math.max(...comparisonData.flatMap((item) => [item.leads, item.orcamentos, item.fechados]));

  return (
    <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
      <div className="flex h-[280px] items-end gap-3">
        {comparisonData.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-3">
            <div className="flex h-56 w-full items-end justify-center gap-1">
              <div
                className="w-3 rounded-t-full bg-white/25"
                style={{ height: `${(item.leads / maxValue) * 100}%` }}
                title="Leads"
              />
              <div
                className="w-3 rounded-t-full bg-volt-yellow"
                style={{ height: `${(item.orcamentos / maxValue) * 100}%` }}
                title="Orçamentos"
              />
              <div
                className="w-3 rounded-t-full bg-volt-ok"
                style={{ height: `${(item.fechados / maxValue) * 100}%` }}
                title="Fechados"
              />
            </div>
            <span className="text-xs font-bold text-zinc-500">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-zinc-400">
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-white/25" /> Leads</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-volt-yellow" /> Orçamentos</span>
        <span className="inline-flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-volt-ok" /> Fechados</span>
      </div>
    </div>
  );
}

function DistributionChart() {
  const maxValue = Math.max(...distributionData.map((item) => item.value));

  return (
    <div className="space-y-4">
      {distributionData.map((item) => (
        <div key={item.label} className="rounded-2xl border border-white/10 bg-black/35 p-4">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="font-black">{item.label}</p>
            <p className="text-lg font-black text-volt-yellow">{item.value}</p>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-volt-yellow" style={{ width: `${(item.value / maxValue) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CompositionChart() {
  const conic = `conic-gradient(${compositionData
    .reduce<{ start: number; parts: string[] }>((acc, item) => {
      const end = acc.start + item.value;
      acc.parts.push(`${item.color} ${acc.start}% ${end}%`);
      acc.start = end;
      return acc;
    }, { start: 0, parts: [] })
    .parts.join(", ")})`;

  return (
    <div className="grid gap-5 md:grid-cols-[220px_1fr] md:items-center">
      <div className="mx-auto grid h-56 w-56 place-items-center rounded-full border border-white/10 bg-black/30 p-4">
        <div className="grid h-48 w-48 place-items-center rounded-full" style={{ background: conic }}>
          <div className="grid h-28 w-28 place-items-center rounded-full border border-white/10 bg-[#090d12] text-center">
            <div>
              <p className="text-3xl font-black text-volt-yellow">100%</p>
              <p className="text-xs font-bold text-zinc-500">composição</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {compositionData.map((item) => (
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

function RelationChart() {
  const width = 560;
  const height = 270;
  const pad = 34;
  const maxX = Math.max(...relationData.map((item) => item.x));
  const maxY = Math.max(...relationData.map((item) => item.y));

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[270px] w-full">
        {[0, 1, 2, 3].map((line) => {
          const y = pad + (line * (height - pad * 2)) / 3;
          return <line key={line} x1={pad} x2={width - pad} y1={y} y2={y} stroke="rgba(255,255,255,.08)" />;
        })}
        {[0, 1, 2, 3].map((line) => {
          const x = pad + (line * (width - pad * 2)) / 3;
          return <line key={line} y1={pad} y2={height - pad} x1={x} x2={x} stroke="rgba(255,255,255,.08)" />;
        })}

        {relationData.map((item) => {
          const x = pad + (item.x / maxX) * (width - pad * 2);
          const y = height - pad - (item.y / maxY) * (height - pad * 2);

          return (
            <g key={item.label}>
              <circle cx={x} cy={y} r="8" fill="#ffcb2f" opacity=".95" />
              <circle cx={x} cy={y} r="15" fill="#ffcb2f" opacity=".12" />
            </g>
          );
        })}

        <text x={pad} y={height - 5} fill="rgba(255,255,255,.45)" fontSize="12" fontWeight="700">
          valor do serviço
        </text>
        <text x={width - pad} y={20} fill="rgba(255,255,255,.45)" fontSize="12" fontWeight="700" textAnchor="end">
          horas
        </text>
      </svg>

      <p className="mt-3 text-xs leading-5 text-zinc-500">
        Relação entre valor estimado e tempo de execução. Ajuda a identificar serviços que exigem mais esforço operacional.
      </p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111821] via-[#090d12] to-black p-5 shadow-soft md:p-7">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-volt-yellow/20 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-blue-500/10 blur-[90px]" />

          <div className="relative z-10 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-volt-yellow/30 bg-volt-yellow/10 px-4 py-2 text-xs font-black uppercase tracking-[.18em] text-volt-yellow">
                <Gauge size={16} />
                Gestão • Operação • Sistema
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight md:text-5xl">
                Dashboard estratégico da Volt
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
                Acompanhe evolução, metas, clientes, serviços, distribuição das demandas, composição da receita e alertas operacionais em uma visão única.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
              <a
                href={`https://wa.me/5511988783401?text=${whatsappMessage}`}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost inline-flex items-center justify-center gap-2"
              >
                <MessageCircle size={17} />
                WhatsApp
              </a>

              <Link href="/ordens" className="btn-ghost inline-flex items-center justify-center gap-2">
                <Plus size={17} />
                Nova OS
              </Link>

              <Link href="/circuitos" className="btn-primary inline-flex items-center justify-center gap-2">
                <CircuitBoard size={17} />
                QDC 3D
              </Link>
            </div>
          </div>

          <div className="relative z-10 mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.label} className="rounded-3xl border border-white/10 bg-black/35 p-5 backdrop-blur">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl border border-volt-yellow/25 bg-volt-yellow/10">
                      <Icon className="text-volt-yellow" size={23} />
                    </div>

                    <span className="rounded-full border border-volt-yellow/20 bg-volt-yellow/10 px-3 py-1 text-xs font-black text-volt-yellow">
                      {item.percent}%
                    </span>
                  </div>

                  <p className="text-sm text-zinc-500">{item.label}</p>
                  <p className="mt-1 text-3xl font-black tracking-tight">{item.value}</p>
                  <p className="mt-2 text-xs font-bold leading-5 text-zinc-400">{item.note}</p>
                  <ProgressBar value={item.percent} />
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          {operationCards.map((card) => {
            const Icon = card.icon;

            return (
              <article key={card.title} className="card-premium rounded-[2rem] p-5 md:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">
                      {card.title}
                    </p>
                    <p className="mt-2 text-4xl font-black">{card.value}</p>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-volt-yellow/25 bg-volt-yellow/10 text-volt-yellow">
                    <Icon size={24} />
                  </div>
                </div>
                <p className="text-sm leading-7 text-zinc-400">{card.text}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
          <ChartCard
            title="Evolução mensal"
            subtitle="Mostra crescimento de clientes e receita ao longo do tempo."
            icon={<LineChart size={25} />}
          >
            <EvolutionChart />
          </ChartCard>

          <ChartCard
            title="Metas alcançadas"
            subtitle="Quanto a operação já atingiu em relação às metas do mês."
            icon={<Target size={25} />}
          >
            <div className="space-y-4">
              {kpis.map((item) => (
                <div key={item.label} className="rounded-3xl border border-white/10 bg-black/35 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black">{item.label}</p>
                      <p className="mt-1 text-sm text-zinc-500">{item.note}</p>
                    </div>
                    <p className="text-2xl font-black text-volt-yellow">{item.percent}%</p>
                  </div>
                  <ProgressBar value={item.percent} />
                </div>
              ))}
            </div>
          </ChartCard>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
          <ChartCard
            title="Comparação por mês"
            subtitle="Confronta leads, orçamentos e serviços fechados em cada período."
            icon={<BarChart3 size={25} />}
          >
            <ComparisonChart />
          </ChartCard>

          <ChartCard
            title="Distribuição de demandas"
            subtitle="Mostra a frequência dos tipos de serviço mais solicitados."
            icon={<Gauge size={25} />}
          >
            <DistributionChart />
          </ChartCard>
        </section>

        <section className="grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
          <ChartCard
            title="Relação valor x esforço"
            subtitle="Ajuda a enxergar quais serviços consomem mais tempo em relação ao valor."
            icon={<ScatterChart size={25} />}
          >
            <RelationChart />
          </ChartCard>

          <ChartCard
            title="Composição da receita"
            subtitle="Mostra quais serviços formam o resultado financeiro da Volt."
            icon={<PieChart size={25} />}
          >
            <CompositionChart />
          </ChartCard>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
          <div className="card-premium rounded-[2rem] p-5 md:p-6">
            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">
                  Ações rápidas
                </p>
                <h2 className="mt-1 text-2xl font-black">Operação do dia</h2>
              </div>
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-volt-yellow">
                Visão geral <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group rounded-3xl border border-white/10 bg-white/[.035] p-4 transition hover:-translate-y-1 hover:border-volt-yellow/35 hover:bg-volt-yellow/10"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-black/40 text-volt-yellow transition group-hover:bg-volt-yellow group-hover:text-black">
                        <Icon size={23} />
                      </div>
                      <ArrowUpRight className="text-zinc-600 transition group-hover:text-volt-yellow" size={18} />
                    </div>
                    <p className="font-black">{action.title}</p>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="card-premium rounded-[2rem] p-5 md:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">
                  Alertas inteligentes
                </p>
                <h2 className="mt-1 text-2xl font-black">Gestão e operação</h2>
              </div>
              <BellRing className="text-volt-yellow" size={28} />
            </div>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.title} className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
                  <div className="flex gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-volt-yellow text-black">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[.14em] text-volt-yellow">{alert.level}</p>
                      <p className="mt-1 font-black">{alert.title}</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-500">{alert.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
