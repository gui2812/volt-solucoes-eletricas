"use client";

import type {
  EstimatorMessage,
  EstimatorResult,
  EstimatorTechnicalDraft
} from "@/types/orcamentista";
import {
  AlertTriangle,
  Bot,
  Calculator,
  CheckCircle2,
  Loader2,
  Plus,
  RotateCcw,
  SendHorizontal,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ApplyMode = "replace" | "append";

type AiEstimatorPanelProps = {
  currentQuote: EstimatorTechnicalDraft;
  onApply: (result: EstimatorResult, mode: ApplyMode) => void;
};

const welcomeMessage: EstimatorMessage = {
  role: "assistant",
  content: "Olá! Sou o Orçamentista IA da Volt. Descreva o serviço, as quantidades e o que já sabe da instalação. Vou fazer as perguntas necessárias antes de sugerir os valores."
};

const promptSuggestions = [
  "Instalar 6 tomadas novas em canaleta, com trajeto aproximado de 12 metros.",
  "Organizar um quadro de 12 módulos e instalar DR e DPS.",
  "Trocar 8 luminárias LED em altura comum, usando os pontos existentes."
];

function currency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function AiEstimatorPanel({ currentQuote, onApply }: AiEstimatorPanelProps) {
  const [messages, setMessages] = useState<EstimatorMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<EstimatorResult | null>(null);
  const [applied, setApplied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  async function sendMessage(rawMessage?: string) {
    const content = (rawMessage ?? input).trim();
    if (!content || loading) return;

    const nextMessages: EstimatorMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");
    setApplied(false);

    try {
      const response = await fetch("/api/ai/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, currentQuote })
      });
      const payload = await response.json().catch(() => ({})) as EstimatorResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Não foi possível consultar o Orçamentista IA.");
      }

      setResult(payload);
      setMessages([...nextMessages, { role: "assistant", content: payload.reply }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível consultar o Orçamentista IA.");
    } finally {
      setLoading(false);
    }
  }

  function applySuggestion(mode: ApplyMode) {
    if (!result || result.status !== "pronto" || !result.items.length) return;

    const confirmation = mode === "replace"
      ? `Aplicar a estimativa de ${currency(result.totalSuggested)} e substituir os itens atuais do orçamento?`
      : `Adicionar a estimativa de ${currency(result.totalSuggested)} aos itens atuais do orçamento?`;

    if (!window.confirm(`${confirmation}\n\nVocê ainda poderá editar todos os valores antes de salvar.`)) return;

    onApply(result, mode);
    setApplied(true);
  }

  function resetEstimator() {
    setMessages([welcomeMessage]);
    setInput("");
    setResult(null);
    setError("");
    setApplied(false);
  }

  const confidenceClass = result?.confidence === "Alta"
    ? "border-volt-ok/30 bg-volt-ok/10 text-volt-ok"
    : result?.confidence === "Baixa"
      ? "border-orange-400/30 bg-orange-400/10 text-orange-200"
      : "border-volt-yellow/30 bg-volt-yellow/10 text-volt-yellow";

  return (
    <section className="mt-5 overflow-hidden rounded-[2rem] border border-volt-yellow/30 bg-gradient-to-br from-volt-yellow/[.09] via-white/[.035] to-black/20">
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-start">
        <div className="flex gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-volt-yellow text-black shadow-glow">
            <Bot size={25} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Orçamentista IA</p>
              <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-zinc-400">Gemini</span>
            </div>
            <h3 className="mt-1 text-2xl font-black">Converse e monte o orçamento</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Ele entende o serviço, pede os detalhes que faltam e cruza a descrição com a tabela de preços da Volt. Nada é aplicado sem sua confirmação.
            </p>
          </div>
        </div>

        <button type="button" onClick={resetEstimator} disabled={loading} className="btn-ghost inline-flex items-center justify-center gap-2 disabled:opacity-40">
          <RotateCcw size={16} /> Nova conversa
        </button>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[.9fr_1.1fr]">
        <div className="min-w-0">
          <div className="volt-scroll h-[360px] space-y-3 overflow-y-auto rounded-3xl border border-white/10 bg-black/30 p-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "rounded-br-md bg-volt-yellow font-bold text-black"
                    : "rounded-bl-md border border-white/10 bg-white/[.055] text-zinc-200"
                }`}>
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-white/[.055] px-4 py-3 text-sm font-bold text-zinc-400">
                  <Loader2 className="animate-spin text-volt-yellow" size={16} /> Calculando e conferindo a tabela...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {promptSuggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => setInput(suggestion)} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-left text-xs font-bold leading-5 text-zinc-400 transition hover:border-volt-yellow/30 hover:text-volt-yellow">
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-end gap-2 rounded-2xl border border-white/10 bg-black/35 p-2 focus-within:border-volt-yellow/40">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              rows={2}
              maxLength={3000}
              placeholder="Ex.: preciso instalar 4 tomadas 20 A, com 8 m de canaleta..."
              className="min-h-[54px] flex-1 resize-none bg-transparent px-3 py-2 text-sm font-bold leading-6 outline-none placeholder:text-zinc-600"
            />
            <button type="button" onClick={() => void sendMessage()} disabled={!input.trim() || loading} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-volt-yellow text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35">
              {loading ? <Loader2 className="animate-spin" size={18} /> : <SendHorizontal size={18} />}
            </button>
          </div>

          {error && (
            <div className="mt-3 flex gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 p-3 text-sm leading-6 text-red-200">
              <AlertTriangle className="mt-0.5 shrink-0" size={18} />
              <p>{error}</p>
            </div>
          )}

          <div className="mt-3 flex gap-3 rounded-2xl border border-blue-400/20 bg-blue-400/[.07] p-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-blue-300" size={18} />
            <p className="text-xs leading-5 text-zinc-400">
              Somente o escopo técnico do orçamento é enviado. Não escreva nome, telefone, e-mail ou endereço completo nesta conversa.
            </p>
          </div>
        </div>

        <div className="min-w-0 rounded-3xl border border-white/10 bg-black/30 p-4">
          {!result ? (
            <div className="grid min-h-[360px] place-items-center px-5 text-center">
              <div>
                <Sparkles className="mx-auto text-volt-yellow" size={34} />
                <p className="mt-4 text-lg font-black">A prévia aparece aqui</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  Conte o serviço ao robô. Ele vai separar mão de obra, materiais, deslocamento e premissas antes de preencher o orçamento.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.18em] text-zinc-500">Prévia calculada</p>
                  <h4 className="mt-1 text-xl font-black">{result.title || "Estimativa em andamento"}</h4>
                  <p className="mt-1 text-xs text-zinc-500">{result.serviceType}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] ${confidenceClass}`}>Confiança {result.confidence}</span>
                  <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] ${result.status === "pronto" ? "border-volt-ok/30 bg-volt-ok/10 text-volt-ok" : "border-blue-400/30 bg-blue-400/10 text-blue-200"}`}>
                    {result.status === "pronto" ? "Pronto para revisar" : "Precisa de respostas"}
                  </span>
                </div>
              </div>

              {result.questions.length > 0 && (
                <div className="rounded-2xl border border-blue-400/20 bg-blue-400/[.07] p-4">
                  <p className="text-xs font-black uppercase tracking-[.16em] text-blue-200">O que ainda preciso saber</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
                    {result.questions.map((question) => <li key={question}>• {question}</li>)}
                  </ul>
                </div>
              )}

              {result.items.length > 0 && (
                <div className="space-y-2">
                  {result.items.map((item, index) => (
                    <div key={`${item.code}-${index}`} className="rounded-2xl border border-white/10 bg-white/[.035] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-volt-yellow/10 px-2 py-1 text-[10px] font-black text-volt-yellow">{item.code}</span>
                            <span className="text-[10px] font-black uppercase tracking-[.12em] text-zinc-600">{item.kind}</span>
                          </div>
                          <p className="mt-2 text-sm font-black leading-5 text-zinc-200">{item.description}</p>
                          <p className="mt-1 text-xs leading-5 text-zinc-600">{item.pricingBasis}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-black text-volt-yellow">{currency(item.quantity * item.unitPrice)}</p>
                          <p className="mt-1 text-[11px] text-zinc-600">{item.quantity} {item.unit} × {currency(item.unitPrice)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result.status === "pronto" && (
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-volt-yellow/25 bg-volt-yellow/10 p-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-500">Valor sugerido</p>
                    <p className="mt-1 text-2xl font-black text-volt-yellow">{currency(result.totalSuggested)}</p>
                  </div>
                  <Calculator className="text-volt-yellow" size={28} />
                </div>
              )}

              {result.assumptions.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                  <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-500">Premissas</p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-zinc-400">
                    {result.assumptions.map((assumption) => <li key={assumption}>• {assumption}</li>)}
                  </ul>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="rounded-2xl border border-orange-400/20 bg-orange-400/[.07] p-4">
                  <p className="text-xs font-black uppercase tracking-[.16em] text-orange-200">Conferir antes de enviar</p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-zinc-400">
                    {result.warnings.map((warning) => <li key={warning}>• {warning}</li>)}
                  </ul>
                </div>
              )}

              {result.calculationSummary && (
                <p className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-zinc-500">{result.calculationSummary}</p>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={() => applySuggestion("replace")} disabled={result.status !== "pronto" || !result.items.length} className="btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-35">
                  <Sparkles size={16} /> Aplicar e substituir itens
                </button>
                <button type="button" onClick={() => applySuggestion("append")} disabled={result.status !== "pronto" || !result.items.length} className="btn-ghost inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-35">
                  <Plus size={16} /> Somar aos itens atuais
                </button>
              </div>

              {applied && (
                <div className="flex items-center gap-2 rounded-2xl border border-volt-ok/25 bg-volt-ok/10 p-3 text-sm font-black text-volt-ok">
                  <CheckCircle2 size={18} /> Sugestão aplicada. Revise os campos abaixo antes de salvar.
                </div>
              )}

              <p className="text-[11px] leading-5 text-zinc-600">
                Valores da tabela base inicial da Volt. O responsável deve revisar quantidades, condições do local, dimensionamento e preços de compra.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
