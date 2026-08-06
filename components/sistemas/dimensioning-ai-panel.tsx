"use client";

import type {
  DimensioningAiMessage,
  DimensioningAiRequest,
  DimensioningAiResult
} from "@/types/dimensioning-ai";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  RotateCcw,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  Zap
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  currentData: DimensioningAiRequest["currentData"];
  onApply: (result: DimensioningAiResult) => void;
};

const welcome: DimensioningAiMessage = {
  role: "assistant",
  content: "Olá! Sou o Assistente Técnico IA da Volt. Conte quais ambientes existem, suas medidas e os equipamentos. Vou perguntar o que faltar e organizar tudo antes do pré-dimensionamento."
};

const suggestions = [
  "Casa com sala 20 m² e perímetro 18 m, cozinha 12 m² e perímetro 14 m e banheiro 5 m² e perímetro 9 m.",
  "Tenho chuveiro 7.500 W em 220 V, a 18 m do quadro, e ar-condicionado 1.200 W em 220 V a 12 m.",
  "É uma loja trifásica 220/380 V. Quero levantar iluminação, tomadas e dois aparelhos de ar-condicionado."
];

export function DimensioningAiPanel({ currentData, onApply }: Props) {
  const [messages, setMessages] = useState<DimensioningAiMessage[]>([welcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<DimensioningAiResult | null>(null);
  const [applied, setApplied] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  async function send(raw?: string) {
    const content = (raw ?? input).trim();
    if (!content || loading) return;
    const nextMessages = [...messages, { role: "user", content } satisfies DimensioningAiMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");
    setApplied(false);

    try {
      const response = await fetch("/api/ai/dimensioning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, currentData })
      });
      const payload = await response.json().catch(() => ({})) as DimensioningAiResult & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Não foi possível consultar o Assistente Técnico IA.");
      setResult(payload);
      setMessages([...nextMessages, { role: "assistant", content: payload.reply }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível consultar o Assistente Técnico IA.");
    } finally {
      setLoading(false);
    }
  }

  function apply() {
    if (!result || result.status !== "pronto") return;
    if (!window.confirm("Aplicar este levantamento ao formulário e processar o pré-dimensionamento?\n\nOs dados atuais de ambientes serão substituídos, mas continuarão editáveis.")) return;
    onApply(result);
    setApplied(true);
  }

  function reset() {
    setMessages([welcome]);
    setInput("");
    setResult(null);
    setError("");
    setApplied(false);
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-volt-yellow/30 bg-gradient-to-br from-volt-yellow/[.10] via-white/[.035] to-black/20">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-start">
        <div className="flex gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-volt-yellow text-black shadow-glow"><Bot size={25} /></div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Assistente Técnico IA</p>
              <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-zinc-400">Gemini</span>
            </div>
            <h2 className="mt-1 text-2xl font-black">Conte a obra como se estivesse conversando comigo</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">A IA coleta e organiza ambientes, medidas e cargas. O motor técnico da Volt calcula cabo, corrente e proteção somente depois da sua confirmação.</p>
          </div>
        </div>
        <button type="button" onClick={reset} disabled={loading} className="btn-ghost inline-flex items-center justify-center gap-2 disabled:opacity-40"><RotateCcw size={16} /> Nova conversa</button>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[.95fr_1.05fr]">
        <div className="min-w-0">
          <div className="volt-scroll h-[370px] space-y-3 overflow-y-auto rounded-3xl border border-white/10 bg-black/30 p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-br-md bg-volt-yellow font-bold text-black" : "rounded-bl-md border border-white/10 bg-white/[.055] text-zinc-200"}`}>{message.content}</div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-white/[.055] px-4 py-3 text-sm font-bold text-zinc-400"><Loader2 className="animate-spin text-volt-yellow" size={16} /> Organizando o levantamento...</div></div>}
            <div ref={endRef} />
          </div>

          {messages.length === 1 && <div className="mt-3 flex flex-wrap gap-2">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => setInput(suggestion)} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-left text-xs font-bold leading-5 text-zinc-400 transition hover:border-volt-yellow/30 hover:text-volt-yellow">{suggestion}</button>)}</div>}

          <div className="mt-3 flex items-end gap-2 rounded-2xl border border-white/10 bg-black/35 p-2 focus-within:border-volt-yellow/40">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }}
              rows={2}
              maxLength={3000}
              placeholder="Ex.: casa bifásica 127/220 V com sala, cozinha, banheiro e chuveiro..."
              className="min-h-[54px] flex-1 resize-none bg-transparent px-3 py-2 text-sm font-bold leading-6 outline-none placeholder:text-zinc-600"
            />
            <button type="button" onClick={() => void send()} disabled={!input.trim() || loading} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-volt-yellow text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35">{loading ? <Loader2 className="animate-spin" size={18} /> : <SendHorizontal size={18} />}</button>
          </div>
          {error && <div className="mt-3 flex gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-sm leading-6 text-red-200"><AlertTriangle className="mt-0.5 shrink-0" size={18} /><p>{error}</p></div>}
          <div className="mt-3 flex gap-3 rounded-2xl border border-blue-400/20 bg-blue-400/[.07] p-3"><ShieldCheck className="mt-0.5 shrink-0 text-blue-300" size={18} /><p className="text-xs leading-5 text-zinc-400">Envie somente dados técnicos. Não escreva nome, telefone, e-mail ou endereço completo. A chave do Gemini permanece no servidor.</p></div>
        </div>

        <div className="min-w-0 rounded-3xl border border-white/10 bg-black/30 p-4">
          {!result ? (
            <div className="grid min-h-[370px] place-items-center px-5 text-center"><div><Sparkles className="mx-auto text-volt-yellow" size={34} /><p className="mt-4 text-lg font-black">O levantamento aparece aqui</p><p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">Você verá os ambientes, cargas, perguntas pendentes e premissas antes de substituir qualquer dado.</p></div></div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs font-black uppercase tracking-[.18em] text-zinc-500">Prévia técnica</p><h3 className="mt-1 text-xl font-black">{result.project.projectName}</h3><p className="mt-1 text-xs text-zinc-500">{result.project.installationType} • {result.project.electricalSystem} • {result.project.voltage}</p></div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] ${result.status === "pronto" ? "border-volt-ok/30 bg-volt-ok/10 text-volt-ok" : "border-blue-400/30 bg-blue-400/10 text-blue-200"}`}>{result.status === "pronto" ? "Pronto para revisar" : "Faltam respostas"}</span>
              </div>

              {result.questions.length > 0 && <div className="rounded-2xl border border-blue-400/20 bg-blue-400/[.07] p-4"><p className="text-xs font-black uppercase tracking-[.16em] text-blue-200">O que ainda preciso saber</p><ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">{result.questions.map((question) => <li key={question}>• {question}</li>)}</ul></div>}

              <div className="volt-scroll max-h-[280px] space-y-2 overflow-y-auto pr-1">
                {result.rooms.map((room) => (
                  <div key={room.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-3">
                    <div className="flex items-center justify-between gap-3"><p className="font-black text-white">{room.name}</p><span className="text-[10px] font-black uppercase text-zinc-500">{room.type}</span></div>
                    <p className="mt-1 text-xs text-zinc-500">{room.area || "?"} m² • {room.perimeter || "?"} m de perímetro • {room.category}</p>
                    {room.equipments.length > 0 && <div className="mt-2 space-y-1">{room.equipments.map((equipment) => <p key={equipment.id} className="rounded-xl bg-black/25 px-3 py-2 text-xs text-zinc-400"><strong className="text-zinc-200">{equipment.name}</strong> — {equipment.powerWatts || "?"} W, {equipment.voltage || "?"} V, {equipment.lengthMeters || "?"} m, {equipment.phaseConfiguration}</p>)}</div>}
                  </div>
                ))}
                {!result.rooms.length && <p className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-zinc-500">Nenhum ambiente completo ainda.</p>}
              </div>

              {result.assumptions.length > 0 && <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><p className="text-xs font-black uppercase tracking-[.16em] text-zinc-500">Premissas</p><ul className="mt-2 space-y-1 text-xs leading-5 text-zinc-400">{result.assumptions.map((item) => <li key={item}>• {item}</li>)}</ul></div>}
              {result.warnings.length > 0 && <div className="rounded-2xl border border-orange-400/20 bg-orange-400/[.07] p-4"><p className="text-xs font-black uppercase tracking-[.16em] text-orange-200">Revisão obrigatória</p><ul className="mt-2 space-y-1 text-xs leading-5 text-zinc-400">{result.warnings.map((item) => <li key={item}>• {item}</li>)}</ul></div>}

              <button type="button" onClick={apply} disabled={result.status !== "pronto" || !result.rooms.length} className="btn-primary inline-flex w-full items-center justify-center gap-2 py-4 disabled:cursor-not-allowed disabled:opacity-35"><Zap size={17} /> Aplicar e pré-dimensionar</button>
              {applied && <div className="flex items-center gap-2 rounded-2xl border border-volt-ok/25 bg-volt-ok/10 p-3 text-sm font-black text-volt-ok"><CheckCircle2 size={18} /> Levantamento aplicado. Revise os cálculos abaixo.</div>}
              <p className="flex gap-2 text-[11px] leading-5 text-zinc-600"><ClipboardCheck className="mt-0.5 shrink-0" size={14} />A IA não define bitolas ou disjuntores. Ela apenas prepara os dados para o cálculo verificável do sistema.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
