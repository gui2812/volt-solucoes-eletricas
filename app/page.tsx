"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bolt,
  Building2,
  Cable,
  CheckCircle2,
  ChevronRight,
  CircuitBoard,
  ClipboardCheck,
  Clock3,
  FileText,
  HardHat,
  HelpCircle,
  Home,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
  Zap
} from "lucide-react";

const whatsappNumber = "5511988783401";

function whatsappLink(message: string) {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

const services = [
  {
    title: "Quadros elétricos e QDC",
    text: "Montagem, organização, identificação de circuitos, troca de disjuntores, DR, DPS, barramentos e adequações.",
    icon: CircuitBoard,
    cta: "Orçar quadro elétrico",
    message: "Olá, gostaria de solicitar um orçamento para quadro elétrico/QDC."
  },
  {
    title: "Tomadas e circuitos dedicados",
    text: "Circuitos exclusivos para chuveiro, ar-condicionado, forno, micro-ondas, geladeira, lava e equipamentos específicos.",
    icon: Cable,
    cta: "Orçar circuito dedicado",
    message: "Olá, gostaria de solicitar um orçamento para tomada ou circuito dedicado."
  },
  {
    title: "Manutenção elétrica",
    text: "Diagnóstico de falhas, disjuntores desarmando, mau contato, iluminação, comandos, medições e corretivas.",
    icon: HardHat,
    cta: "Orçar manutenção",
    message: "Olá, preciso de um orçamento para manutenção elétrica."
  },
  {
    title: "Instalações e melhorias",
    text: "Instalação de pontos elétricos, iluminação, adequações, organização de cabos e melhorias para residências e empresas.",
    icon: Wrench,
    cta: "Orçar instalação",
    message: "Olá, gostaria de solicitar um orçamento para instalação elétrica."
  },
  {
    title: "Automação residencial",
    text: "Instalação e preparação para interruptores inteligentes, iluminação automatizada, sensores, tomadas smart, comandos por aplicativo e integração com Alexa/Google quando compatível.",
    icon: Sparkles,
    cta: "Orçar automação",
    message: "Olá, gostaria de solicitar um orçamento para automação residencial ou elétrica inteligente."
  }
];

const problems = [
  {
    title: "Seu disjuntor vive desarmando?",
    text: "Avaliamos carga, circuito, disjuntor, bitola dos cabos e possíveis falhas na instalação.",
    icon: Bolt
  },
  {
    title: "Seu quadro está bagunçado?",
    text: "Organizamos, identificamos circuitos e deixamos o quadro mais seguro e fácil de manter.",
    icon: CircuitBoard
  },
  {
    title: "Vai instalar chuveiro, forno ou ar?",
    text: "Criamos circuitos dedicados conforme a necessidade do equipamento e da instalação.",
    icon: Cable
  },
  {
    title: "Precisa de manutenção no condomínio?",
    text: "Atendimento técnico para rotinas prediais, corretivas, preventivas e suporte à operação.",
    icon: Building2
  },
  {
    title: "Quer deixar luzes e comandos mais práticos?",
    text: "Preparamos a instalação para automação residencial, como interruptores inteligentes, sensores, tomadas smart e comandos por aplicativo.",
    icon: Sparkles
  }
];

const portfolioItems = [
  {
    title: "Quadro elétrico organizado",
    beforeSrc: "/img/portfolio/quadro-antes.webp",
    afterSrc: "/img/portfolio/quadro-depois.webp",
    beforeText: "Quadro antigo, sujo, com fiação sem padrão e manutenção difícil.",
    afterText: "QDC organizado, identificado, com cabos alinhados e visual profissional.",
    message: "Olá, gostaria de solicitar orçamento para organização de quadro elétrico."
  },
  {
    title: "Circuito dedicado",
    beforeSrc: "/img/portfolio/tomada-antes.webp",
    afterSrc: "/img/portfolio/tomada-depois.webp",
    beforeText: "Equipamento ligado em tomada sobrecarregada, com adaptadores e risco de aquecimento.",
    afterText: "Tomada/circuito dedicado para o equipamento, com instalação mais limpa e segura.",
    message: "Olá, gostaria de solicitar orçamento para circuito dedicado."
  },
  {
    title: "Iluminação e melhorias",
    beforeSrc: "/img/portfolio/iluminacao-antes.webp",
    afterSrc: "/img/portfolio/iluminacao-depois.webp",
    beforeText: "Ambiente escuro, pouco funcional e com baixa valorização visual.",
    afterText: "Ambiente iluminado, confortável, funcional e com melhor acabamento.",
    message: "Olá, gostaria de solicitar orçamento para iluminação e melhorias elétricas."
  },
  {
    title: "Manutenção predial",
    beforeSrc: "/img/portfolio/manutencao-antes.webp",
    afterSrc: "/img/portfolio/manutencao-depois.webp",
    beforeText: "Área técnica com quadro exposto, sujeira, cabos soltos e manutenção sem padrão.",
    afterText: "Ambiente limpo, ferramentas organizadas, relatório e serviço finalizado com padrão Volt.",
    message: "Olá, gostaria de solicitar orçamento para manutenção elétrica predial."
  }
];

const trustItems = [
  "Atendimento técnico e organizado",
  "Serviço com identificação dos circuitos",
  "Registro por fotos quando aplicável",
  "Orçamento claro antes da execução",
  "Materiais dimensionados conforme a necessidade",
  "Preparação para automação e futuras melhorias",
  "Entrega limpa, testada e documentada"
];

const steps = [
  {
    title: "Contato",
    text: "Você chama no WhatsApp e explica a necessidade."
  },
  {
    title: "Análise",
    text: "Avaliamos o serviço, fotos, local e complexidade."
  },
  {
    title: "Orçamento",
    text: "Enviamos proposta clara com escopo e valores."
  },
  {
    title: "Execução",
    text: "Realizamos o serviço com organização e cuidado."
  },
  {
    title: "Teste",
    text: "Conferimos funcionamento, segurança e acabamento."
  },
  {
    title: "Entrega",
    text: "Finalizamos com orientação e registro do serviço."
  }
];

const faq = [
  {
    question: "Quando preciso trocar ou organizar meu quadro elétrico?",
    answer: "Quando há disjuntores antigos, cabos desorganizados, falta de identificação, aquecimento, desarmes frequentes ou necessidade de adequação para novas cargas."
  },
  {
    question: "Chuveiro e ar-condicionado precisam de circuito exclusivo?",
    answer: "Em muitos casos, sim. Equipamentos de maior potência exigem circuito, proteção e cabos compatíveis com a carga instalada."
  },
  {
    question: "O que é DR e DPS?",
    answer: "O DR ajuda na proteção contra fuga de corrente, e o DPS auxilia na proteção contra surtos elétricos. A aplicação deve ser avaliada conforme a instalação."
  },
  {
    question: "Vocês fazem automação residencial?",
    answer: "Sim. A Volt pode instalar ou preparar pontos para automação residencial, como iluminação inteligente, interruptores smart, sensores, tomadas inteligentes e comandos por aplicativo, sempre avaliando a instalação existente."
  },
  {
    question: "Vocês atendem empresas e condomínios?",
    answer: "Sim. A Volt atende residências, comércios, empresas e demandas de manutenção predial em São Paulo e região, sob agendamento."
  },
  {
    question: "A visita técnica é cobrada?",
    answer: "Depende do tipo de serviço, distância e complexidade. Essa informação é alinhada no primeiro contato pelo WhatsApp."
  }
];

function BeforeAfterCard({
  title,
  beforeSrc,
  afterSrc,
  beforeText,
  afterText,
  message
}: {
  title: string;
  beforeSrc: string;
  afterSrc: string;
  beforeText: string;
  afterText: string;
  message: string;
}) {
  const [position, setPosition] = useState(50);

  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b0f14] shadow-soft">
      <div className="relative aspect-[4/3] overflow-hidden bg-black sm:aspect-[16/9]">
        <Image
          src={afterSrc}
          alt={`${title} depois`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />

        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <Image
            src={beforeSrc}
            alt={`${title} antes`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div className="absolute inset-x-0 top-0 z-20 flex justify-between p-4">
          <span className="rounded-full border border-red-400/30 bg-black/75 px-3 py-1 text-[11px] font-black uppercase tracking-[.08em] text-red-200 backdrop-blur">
            Antes
          </span>
          <span className="rounded-full border border-volt-yellow/35 bg-black/75 px-3 py-1 text-[11px] font-black uppercase tracking-[.08em] text-volt-yellow backdrop-blur">
            Depois
          </span>
        </div>

        <div
          className="absolute bottom-0 top-0 z-30 w-[3px] bg-volt-yellow shadow-[0_0_30px_rgba(255,203,47,.75)]"
          style={{ left: `${position}%`, transform: "translateX(-50%)" }}
        >
          <div className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-volt-yellow/40 bg-black/85 text-volt-yellow shadow-glow">
            <span className="text-sm font-black">↔</span>
          </div>
        </div>

        <input
          aria-label={`Controlar antes e depois de ${title}`}
          type="range"
          min="6"
          max="94"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="absolute inset-0 z-40 h-full w-full cursor-ew-resize opacity-0"
        />

        <div className="pointer-events-none absolute bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-[11px] font-black uppercase tracking-[.08em] text-zinc-200 backdrop-blur">
          Arraste para comparar
        </div>
      </div>

      <div className="grid border-t border-white/10 md:grid-cols-2">
        <div className="border-b border-white/10 bg-[#130b10] p-5 md:border-b-0 md:border-r md:border-white/10">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[.08em] text-red-200">Antes</p>
          <p className="text-sm leading-6 text-zinc-300">{beforeText}</p>
        </div>
        <div className="bg-[#121008] p-5">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[.08em] text-volt-yellow">Depois</p>
          <p className="text-sm leading-6 text-zinc-200">{afterText}</p>
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:p-5">
        <div>
          <h3 className="text-lg font-black sm:text-xl">{title}</h3>
          <p className="mt-1 text-sm text-zinc-500">Comparativo visual antes/depois</p>
        </div>

        <a
          href={whatsappLink(message)}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-2xl bg-volt-yellow px-4 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 hover:shadow-glow"
        >
          Orçar
        </a>
      </div>
    </article>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050505] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Image
              src="/img/logo.png"
              alt="Volt Soluções Elétricas"
              width={54}
              height={54}
              className="h-11 w-11 shrink-0 rounded-2xl border border-white/10 bg-black object-contain sm:h-[54px] sm:w-[54px]"
              priority
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-black tracking-tight sm:text-lg">Volt Soluções Elétricas</p>
              <p className="hidden text-[10px] uppercase tracking-[.2em] text-zinc-400 sm:block sm:text-[11px] sm:tracking-[.28em]">
                Elétrica • manutenção • segurança
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex">
            <Link className="site-nav-link" href="#servicos">Serviços</Link>
            <Link className="site-nav-link" href="#problemas">Problemas</Link>
            <Link className="site-nav-link" href="#portfolio">Portfólio</Link>
            <Link className="site-nav-link" href="#processo">Como funciona</Link>
            <Link className="site-nav-link" href="#contato">Contato</Link>
            <a
              href={whatsappLink("Olá, quero solicitar um orçamento com a Volt Soluções Elétricas.")}
              target="_blank"
              rel="noreferrer"
              className="btn-primary inline-flex items-center gap-2"
            >
              Orçamento <MessageCircle size={17} />
            </a>
            <Link className="btn-ghost inline-flex items-center gap-2" href="/login">
              Entrar no sistema
            </Link>
          </nav>

          <div className="flex items-center gap-2 lg:hidden">
            <a
              href={whatsappLink("Olá, quero solicitar um orçamento com a Volt Soluções Elétricas.")}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-volt-yellow px-3 py-2 text-xs font-black text-black shadow-glow"
            >
              Orçar
            </a>
            <Link className="rounded-2xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-black text-white" href="/login">
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 sm:px-5 sm:py-14 lg:grid-cols-[1.05fr_.95fr] lg:gap-12 lg:py-24">
        <div className="absolute -left-24 top-16 h-96 w-96 rounded-full bg-volt-yellow/20 blur-[140px]" />
        <div className="absolute right-0 top-28 h-80 w-80 rounded-full bg-blue-500/10 blur-[130px]" />

        <div className="relative z-10">
          <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-volt-yellow/40 bg-volt-yellow/10 px-3 py-2 text-xs font-black text-volt-yellow sm:px-4 sm:text-sm">
            <Zap size={16} />
            Atendimento elétrico profissional em São Paulo
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Instalações elétricas, quadros organizados e manutenção com padrão profissional.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:mt-6 sm:text-lg sm:leading-8">
            Atendimento para residências, comércios, empresas e condomínios, com orçamento claro,
            serviço documentado, organização visual, automação prática e foco em segurança.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappLink("Olá, gostaria de solicitar um orçamento com a Volt Soluções Elétricas.")}
              target="_blank"
              rel="noreferrer"
              className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
            >
              Solicitar orçamento <MessageCircle size={18} />
            </a>
            <Link href="#servicos" className="btn-ghost inline-flex w-full items-center justify-center gap-2 sm:w-auto">
              Ver serviços <ArrowRight size={18} />
            </Link>
          </div>

          <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-500">
            Envie uma foto do problema pelo WhatsApp e receba uma orientação inicial para orçamento.
          </p>

          <div className="mt-7 grid max-w-2xl grid-cols-2 gap-2 sm:mt-9 sm:grid-cols-4 sm:gap-3">
            {[
              { value: "SP", label: "São Paulo e região" },
              { value: "QDC", label: "quadros organizados" },
              { value: "DR/DPS", label: "proteção e adequação" },
              { value: "Smart", label: "automação prática" }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[.04] p-3 sm:rounded-3xl sm:p-4">
                <p className="text-xl font-black text-volt-yellow sm:text-3xl">{item.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[.14em] text-zinc-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-[#141a22] to-[#050608] p-3 shadow-soft sm:rounded-[2.4rem] sm:p-5">
            <div className="rounded-[1.3rem] border border-white/10 bg-black/40 p-4 sm:rounded-[1.8rem] sm:p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">
                    Padrão Volt
                  </p>
                  <h2 className="text-xl font-black sm:text-2xl">Serviço limpo, seguro e documentado</h2>
                </div>
                <span className="rounded-full bg-volt-ok/15 px-3 py-1 text-xs font-black text-volt-ok">
                  PRONTO PARA ORÇAR
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  [CircuitBoard, "Quadro organizado", "Circuitos identificados"],
                  [ShieldCheck, "Proteção", "DR, DPS e disjuntores"],
                  [FileText, "Orçamento claro", "Escopo antes da execução"],
                  [ClipboardCheck, "Entrega registrada", "Fotos e histórico"]
                ].map(([Icon, title, text]) => {
                  const IconComp = Icon as typeof CircuitBoard;
                  return (
                    <div key={String(title)} className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
                      <IconComp className="mb-4 text-volt-yellow" size={25} />
                      <p className="text-lg font-black">{String(title)}</p>
                      <p className="mt-1 text-sm text-zinc-500">{String(text)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f14]">
                <div className="relative aspect-[16/10]">
                  <Image
                    src="/img/portfolio/quadro-depois.webp"
                    alt="Quadro elétrico organizado"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-volt-yellow/25 bg-black/70 px-4 py-3 backdrop-blur">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-black text-volt-yellow">Entrega com padrão profissional</span>
                      <span className="rounded-full bg-volt-ok/20 px-3 py-1 text-xs font-black text-volt-ok">OK</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="problemas" className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-12">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">
            Problemas que resolvemos
          </p>
          <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
            O cliente chama quando sente que algo não está seguro.
          </h2>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            A Volt transforma problemas elétricos em soluções organizadas, com diagnóstico,
            execução técnica e orientação clara.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {problems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="card-premium rounded-3xl p-6">
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-volt-yellow/25 bg-volt-yellow/10 text-volt-yellow">
                  <Icon size={28} />
                </div>
                <h3 className="text-xl font-black">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="servicos" className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-12">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">
              Serviços
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              Soluções elétricas para residências, comércios e empresas.
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-zinc-400">
            Atendimento com foco em segurança, estética, organização, automação prática, diagnóstico técnico
            e entrega documentada.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <article
                key={service.title}
                className="card-premium group flex flex-col rounded-3xl p-6 transition duration-300 hover:-translate-y-1 hover:border-volt-yellow/40"
              >
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-volt-yellow/25 bg-volt-yellow/10 text-volt-yellow transition group-hover:bg-volt-yellow group-hover:text-black">
                  <Icon size={28} />
                </div>
                <h3 className="text-xl font-black">{service.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-zinc-400">{service.text}</p>
                <a
                  href={whatsappLink(service.message)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm font-black text-zinc-200 transition hover:border-volt-yellow/40 hover:text-volt-yellow"
                >
                  {service.cta}
                  <ArrowRight size={17} />
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <section id="portfolio" className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-12">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">
            Portfólio e padrão de entrega
          </p>
          <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
            Arraste a barra e veja a diferença do padrão Volt.
          </h2>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            O comparativo antes/depois ajuda o cliente a entender visualmente a diferença entre
            uma instalação sem padrão e um serviço organizado, identificado e documentado.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {portfolioItems.map((item) => (
            <BeforeAfterCard
              key={item.title}
              title={item.title}
              beforeSrc={item.beforeSrc}
              afterSrc={item.afterSrc}
              beforeText={item.beforeText}
              afterText={item.afterText}
              message={item.message}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-12">
        <div className="rounded-[2.4rem] border border-volt-yellow/25 bg-gradient-to-br from-volt-yellow/20 via-white/[.03] to-black p-7 shadow-glow md:p-10">
          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">
                Por que escolher a Volt?
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
                Técnica, organização e clareza no atendimento.
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-300">
                O objetivo é entregar um serviço elétrico seguro, bem apresentado e fácil de entender,
                desde o primeiro contato até a finalização.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {trustItems.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 p-4">
                  <CheckCircle2 size={19} className="text-volt-yellow" />
                  <span className="text-sm font-bold text-zinc-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="processo" className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-12">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">
            Como funciona
          </p>
          <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
            Atendimento claro do orçamento à entrega.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {steps.map((step, index) => (
            <div key={step.title} className="card-premium rounded-3xl p-5">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-volt-yellow text-sm font-black text-black">
                {index + 1}
              </div>
              <h3 className="font-black">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-12">
        <div className="grid gap-5 lg:grid-cols-[.95fr_1.05fr]">
          <div className="card-premium rounded-[2rem] p-7">
            <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">
              Área de atuação
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Atendimento em São Paulo e região.</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              Atendimento para residências, comércios, empresas e condomínios sob agendamento.
              A disponibilidade depende da região, urgência e complexidade do serviço.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                [Home, "Residências", "Quadros, tomadas, chuveiros, iluminação e adequações."],
                [Building2, "Comércios", "Manutenção, circuitos, iluminação e suporte técnico."],
                [HardHat, "Condomínios", "Rotinas prediais, corretivas e preventivas."],
                [Wrench, "Empresas", "Serviços organizados com histórico e documentação."]
              ].map(([Icon, title, text]) => {
                const IconComp = Icon as typeof Home;
                return (
                  <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                    <IconComp className="mb-3 text-volt-yellow" size={24} />
                    <p className="font-black">{String(title)}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">{String(text)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card-premium rounded-[2rem] p-7">
            <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">
              Diferencial Volt
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">Atendimento organizado do orçamento à entrega.</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              A Volt utiliza um sistema próprio para registrar o atendimento, organizar orçamentos,
              ordens de serviço, materiais e histórico do cliente. Isso traz mais clareza, controle
              e profissionalismo em cada etapa do serviço.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Orçamento claro",
                "Histórico do atendimento",
                "Registro do serviço",
                "Controle de materiais",
                "Entrega documentada",
                "Organização da execução"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3">
                  <BadgeCheck size={19} className="text-volt-yellow" />
                  <span className="text-sm font-bold text-zinc-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-5 sm:py-12">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">
            FAQ
          </p>
          <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
            Dúvidas comuns antes de contratar.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {faq.map((item) => (
            <div key={item.question} className="card-premium rounded-3xl p-6">
              <div className="mb-4 flex items-center gap-3">
                <HelpCircle className="text-volt-yellow" size={24} />
                <h3 className="text-lg font-black">{item.question}</h3>
              </div>
              <p className="text-sm leading-7 text-zinc-400">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contato" className="mx-auto max-w-7xl px-4 py-10 pb-20 sm:px-5 sm:py-12">
        <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
          <div className="card-premium rounded-[2.2rem] p-8">
            <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">
              Contato
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              Precisa de um serviço elétrico?
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
              Chame a Volt para orçamento, manutenção, adequação, montagem de quadro,
              circuito dedicado, automação residencial ou diagnóstico técnico.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={whatsappLink("Olá, quero solicitar um orçamento com a Volt Soluções Elétricas. Seguem os dados do serviço:")}
                target="_blank"
                rel="noreferrer"
                className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
              >
                Solicitar orçamento agora <MessageCircle size={18} />
              </a>
              <a
                href="mailto:solucoeseletricasvolt@gmail.com"
                className="btn-ghost inline-flex w-full items-center justify-center gap-2 sm:w-auto"
              >
                Enviar e-mail <ArrowRight size={18} />
              </a>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["Tipo de serviço", "Bairro/região", "Fotos do local"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[.035] p-3 text-sm font-bold text-zinc-300">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="card-premium rounded-[2.2rem] p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="text-volt-yellow" />
                <div>
                  <p className="font-black">Telefone/WhatsApp</p>
                  <p className="text-sm text-zinc-500">(11) 98878-3401</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="text-volt-yellow" />
                <div>
                  <p className="font-black">Atendimento</p>
                  <p className="text-sm text-zinc-500">São Paulo/SP e região, sob consulta</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock3 className="text-volt-yellow" />
                <div>
                  <p className="font-black">Agendamento</p>
                  <p className="text-sm text-zinc-500">Orçamento e atendimento sob agendamento</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Star className="text-volt-yellow" />
                <div>
                  <p className="font-black">Instagram/portfólio</p>
                  <p className="text-sm text-zinc-500">@guilhermesantanaabreu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-10 sm:px-5">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_.8fr_.8fr]">
          <div>
            <p className="text-2xl font-black">Volt Soluções Elétricas</p>
            <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-500">
              Instalações, manutenção, automação residencial, quadros elétricos e circuitos dedicados em São Paulo.
            </p>

            <a
              href={whatsappLink("Olá, quero solicitar um orçamento com a Volt Soluções Elétricas.")}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex w-full justify-center rounded-2xl bg-volt-yellow px-5 py-3 text-sm font-black text-black shadow-glow transition hover:-translate-y-0.5 sm:w-auto"
            >
              Solicitar orçamento pelo WhatsApp
            </a>
          </div>

          <div>
            <p className="font-black text-volt-yellow">Atendimento</p>
            <div className="mt-4 space-y-2 text-sm text-zinc-500">
              <p>São Paulo/SP e região</p>
              <p>Residências, comércios e condomínios</p>
              <p>Orçamento sob agendamento</p>
            </div>
          </div>

          <div>
            <p className="font-black text-volt-yellow">Acesso rápido</p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <Link href="#servicos" className="text-zinc-500 transition hover:text-volt-yellow">Serviços</Link>
              <Link href="#portfolio" className="text-zinc-500 transition hover:text-volt-yellow">Antes e depois</Link>
              <Link href="/login" className="text-zinc-500 transition hover:text-volt-yellow">Entrar no sistema</Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 flex max-w-7xl flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-zinc-600 md:flex-row">
          <p>© Volt Soluções Elétricas. Todos os direitos reservados.</p>
          <p>Site público + atendimento organizado + sistema interno.</p>
        </div>
      </footer>

      <a
        href={whatsappLink("Olá, quero solicitar um orçamento com a Volt Soluções Elétricas.")}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-4 right-4 z-[80] inline-flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-volt-yellow p-0 text-sm font-black text-black shadow-[0_0_35px_rgba(255,203,47,.45)] transition hover:-translate-y-1 sm:bottom-5 sm:right-5 sm:h-auto sm:w-auto sm:px-5 sm:py-4"
      >
        <MessageCircle size={20} />
        <span className="hidden sm:inline">Orçamento</span>
      </a>
    </main>
  );
}
