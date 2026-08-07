"use client";

import { SignatureStudio } from "@/components/signatures/signature-studio";
import type { SignatureData } from "@/types/signatures";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type QuoteItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total?: number;
  kind?: string;
};

type QuoteSnapshot = {
  documentType?: "quote" | "contract";
  id?: string;
  title?: string;
  client?: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: string;
  validUntil?: string;
  payment?: string;
  warranty?: string;
  deadline?: string;
  status?: string;
  responsible?: string;
  notes?: string;
  items?: QuoteItem[];
};

type SignatureRecord = {
  id: string;
  quoteId: string;
  status: "pending" | "signed" | "expired" | "cancelled";
  quoteSnapshot: QuoteSnapshot;
  clientName: string;
  clientPhone: string;
  responsibleName: string;
  sentAt: string;
  signedAt?: string;
  expiresAt?: string;
};

function currency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR");
}

function itemTotal(item: QuoteItem) {
  return typeof item.total === "number"
    ? item.total
    : Number(item.quantity || 0) * Number(item.unitPrice || 0);
}

export default function AssinarOrcamentoPage() {
  const params = useParams();
  const token = String(params?.token || "");

  const [record, setRecord] = useState<SignatureRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const response = await fetch(`/api/signature/${token}`, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Não foi possível carregar o orçamento.");
        }

        if (data.quoteSnapshot?.documentType === "contract") {
          window.location.replace(`/assinar-contrato/${encodeURIComponent(token)}`);
          return;
        }

        setRecord(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro inesperado.");
      } finally {
        setLoading(false);
      }
    }

    if (token) load();
  }, [token]);

  const quote = record?.quoteSnapshot;

  const total = useMemo(() => {
    return (quote?.items ?? []).reduce((sum, item) => sum + itemTotal(item), 0);
  }, [quote]);

  async function submitSignature(signature: SignatureData) {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(`/api/signature/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          signerName: signature.signerName,
          signatureMode: signature.mode,
          signatureStyle: signature.signatureStyle,
          signatureDataUrl: signature.signatureDataUrl,
          acceptedTerms: signature.acceptedTerms,
          brushStyle: signature.brushStyle,
          inkColor: signature.inkColor,
          initials: signature.initials
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível salvar a assinatura.");
      }

      setSuccess(true);
      setRecord((current) => current ? { ...current, status: "signed", signedAt: new Date().toISOString() } : current);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Erro inesperado.";
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }
  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] p-4 text-white">
        <div className="rounded-[2rem] border border-white/10 bg-white/[.035] p-8 text-center">
          <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Volt Soluções Elétricas</p>
          <h1 className="mt-2 text-3xl font-black">Carregando orçamento...</h1>
        </div>
      </main>
    );
  }

  if (error && !record) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] p-4 text-white">
        <div className="max-w-lg rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8 text-center">
          <p className="text-sm font-black uppercase tracking-[.22em] text-red-300">Link indisponível</p>
          <h1 className="mt-2 text-3xl font-black">Não foi possível abrir o orçamento</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{error}</p>
        </div>
      </main>
    );
  }

  const isAlreadySigned = record?.status === "signed" || success;

  return (
    <main className="min-h-screen bg-[#050505] p-4 text-white md:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111821] via-[#080c11] to-black p-5 shadow-soft md:p-7">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-volt-yellow/20 blur-[120px]" />

          <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl border border-volt-yellow/30 bg-black">
                <Image src="/img/logo.png" alt="Volt" width={64} height={64} className="object-contain" />
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Volt Soluções Elétricas</p>
                <h1 className="mt-1 text-3xl font-black md:text-5xl">Análise e assinatura do orçamento</h1>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Esta página é pública. O cliente não precisa acessar o sistema da Volt.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-volt-yellow/30 bg-volt-yellow/10 p-4 text-center">
              <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-500">Orçamento</p>
              <p className="mt-1 text-2xl font-black text-volt-yellow">{quote?.id || record?.quoteId}</p>
              <p className="mt-1 text-xs text-zinc-500">Validade: {formatDate(quote?.validUntil)}</p>
            </div>
          </div>
        </header>

        {isAlreadySigned && (
          <section className="mt-5 rounded-[2rem] border border-volt-ok/30 bg-volt-ok/10 p-5">
            <p className="text-sm font-black uppercase tracking-[.22em] text-volt-ok">Orçamento assinado</p>
            <h2 className="mt-2 text-2xl font-black">Obrigado! Sua aprovação foi registrada.</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              A Volt Soluções Elétricas recebeu a assinatura digital deste orçamento.
            </p>
          </section>
        )}

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="space-y-5">
            <section className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Orçamento para análise</p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {[
                  ["Cliente", quote?.client || record?.clientName],
                  ["Contato", quote?.contact],
                  ["Telefone", quote?.phone || record?.clientPhone],
                  ["E-mail", quote?.email],
                  ["Endereço", quote?.address],
                  ["Serviço", quote?.title],
                  ["Data", formatDate(quote?.createdAt)],
                  ["Validade", formatDate(quote?.validUntil)]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                    <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{label}</p>
                    <p className="mt-1 font-bold">{value || "-"}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Itens do orçamento</p>

              <div className="mt-5 space-y-3">
                {(quote?.items ?? []).map((item, index) => (
                  <div key={`${item.description}-${index}`} className="rounded-3xl border border-white/10 bg-black/35 p-4">
                    <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                      <div>
                        <p className="font-black">{item.description}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {item.kind || "Item"} • {item.quantity} {item.unit} • {currency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="text-lg font-black text-volt-yellow">{currency(itemTotal(item))}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Condições comerciais</p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  ["Pagamento", quote?.payment],
                  ["Prazo", quote?.deadline],
                  ["Garantia", quote?.warranty]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                    <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{label}</p>
                    <p className="mt-1 font-bold">{value || "-"}</p>
                  </div>
                ))}
              </div>

              {quote?.notes && (
                <div className="mt-4 rounded-2xl border border-volt-yellow/20 bg-volt-yellow/10 p-4">
                  <p className="text-sm font-black text-volt-yellow">Observações</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{quote.notes}</p>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-volt-yellow/20 bg-volt-yellow/10 p-5">
              <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Resumo</p>

              <div className="mt-5 space-y-3">
                <div className="flex justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <span className="text-zinc-400">Valor total</span>
                  <strong className="text-2xl text-volt-yellow">{currency(total)}</strong>
                </div>
                <div className="flex justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <span className="text-zinc-400">Status</span>
                  <strong>{record?.status === "pending" ? "Pendente" : "Assinado"}</strong>
                </div>
              </div>
            </section>

            {!isAlreadySigned && (
              <section>
                <div className="mb-3 px-1">
                  <p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Assinatura digital</p>
                  <h2 className="mt-1 text-2xl font-black">Aprovar e assinar</h2>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">Escolha uma das cinco formas de assinatura abaixo.</p>
                </div>
                <SignatureStudio
                  key={token}
                  initialValue={{
                    signerName: record?.clientName || quote?.contact || quote?.client || "",
                    mode: "Pendente",
                    signedAt: ""
                  }}
                  saving={saving}
                  externalError={error}
                  confirmLabel="Aprovar e assinar orçamento"
                  termsLabel="Li, conferi e aprovo este orçamento, autorizando a Volt Soluções Elétricas a prosseguir conforme as condições informadas."
                  onConfirm={submitSignature}
                />
              </section>
            )}
          </aside>
        </section>
      </div>
    </main>
  );
}
