"use client";

import { SignatureStudio } from "@/components/signatures/signature-studio";
import type { Contract, ContractSignature } from "@/types/contracts";
import type { SignatureData } from "@/types/signatures";
import { openContractPdf } from "@/utils/contractPdfVolt";
import { CheckCircle2, Download, FileSignature, Loader2 } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type SignatureRecord = {
  id: string;
  quoteId: string;
  status: "pending" | "signed" | "expired" | "cancelled";
  quoteSnapshot: Contract;
  clientName: string;
  clientPhone: string;
  responsibleName: string;
  clientSignature?: ContractSignature;
  sentAt: string;
  signedAt?: string;
  expiresAt?: string;
};

function currency(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}

function TextBlock({ value }: { value: string }) {
  return <div className="space-y-2 text-sm leading-7 text-zinc-300">{String(value || "").split(/\r?\n/).filter(Boolean).map((line, index) => <p key={`${line}-${index}`}>{line}</p>)}</div>;
}

export default function AssinarContratoPage() {
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
        const response = await fetch(`/api/signature/${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Não foi possível carregar o contrato.");
        if (data.quoteSnapshot?.documentType !== "contract") throw new Error("Este link não pertence a um contrato.");
        setRecord(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Erro inesperado.");
      } finally {
        setLoading(false);
      }
    }
    if (token) void load();
  }, [token]);

  async function submitSignature(signature: SignatureData) {
    try {
      setSaving(true);
      setError("");
      const response = await fetch(`/api/signature/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      if (!response.ok) throw new Error(data.error || "Não foi possível registrar a assinatura.");
      const savedSignature: ContractSignature = { ...signature, acceptedTerms: true };
      setRecord((current) => current ? {
        ...current,
        status: "signed",
        signedAt: new Date().toISOString(),
        clientSignature: savedSignature
      } : current);
      setSuccess(true);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Erro inesperado.";
      setError(message);
      throw new Error(message);
    } finally {
      setSaving(false);
    }
  }
  function downloadPdf() {
    if (!record) return;
    const signed = record.status === "signed" || success;
    openContractPdf({
      ...record.quoteSnapshot,
      signatureUrl: window.location.href,
      status: signed ? "Assinado" : record.quoteSnapshot.status,
      signatureStatus: signed ? "Assinada" : record.quoteSnapshot.signatureStatus,
      signedAt: record.signedAt,
      clientSignature: record.clientSignature || record.quoteSnapshot.clientSignature
    }, signed ? "final" : "signature");
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#050505] p-4 text-white"><div className="rounded-[2rem] border border-white/10 bg-white/[.035] p-8 text-center"><Loader2 className="mx-auto animate-spin text-volt-yellow" size={30} /><h1 className="mt-4 text-2xl font-black">Carregando contrato...</h1></div></main>;
  if (!record || (error && !record)) return <main className="grid min-h-screen place-items-center bg-[#050505] p-4 text-white"><div className="max-w-lg rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8 text-center"><p className="text-sm font-black uppercase tracking-[.22em] text-red-300">Link indisponível</p><h1 className="mt-2 text-3xl font-black">Não foi possível abrir o contrato</h1><p className="mt-3 text-sm leading-6 text-zinc-300">{error}</p></div></main>;

  const contract = record.quoteSnapshot;
  const isSigned = record.status === "signed" || success;
  const clauses: Array<[string, string]> = [
    ["Obrigações da contratada", contract.clauses.contractorObligations], ["Obrigações do contratante", contract.clauses.clientObligations],
    ["Materiais", contract.clauses.materialsResponsibility], ["Exclusões", contract.clauses.exclusions],
    ["Alterações de escopo", contract.clauses.changeOrders], ["Condições imprevistas", contract.clauses.unforeseenConditions],
    ["Segurança", contract.clauses.siteSafety], ["Testes e aceite", contract.clauses.testsAndAcceptance],
    ["Garantia", contract.clauses.warrantyTerms], ["Rescisão", contract.clauses.cancellationTerms],
    ["Atraso de pagamento", contract.clauses.latePaymentTerms], ["Privacidade", contract.clauses.privacyTerms],
    ["Assinatura eletrônica", contract.clauses.electronicSignatureTerms], ["Controvérsias", contract.clauses.disputeResolution]
  ];

  return (
    <main className="min-h-screen bg-[#050505] p-4 text-white md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111821] via-[#080c11] to-black p-5 md:p-7">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-volt-yellow/20 blur-[120px]" />
          <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4"><div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl border border-volt-yellow/30 bg-black"><Image src="/img/logo.png" alt="Volt" width={64} height={64} /></div><div><p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Volt Soluções Elétricas</p><h1 className="mt-1 text-3xl font-black md:text-5xl">Contrato para leitura e assinatura</h1><p className="mt-2 text-sm text-zinc-400">Leia o documento integralmente. Você pode gerar uma cópia em PDF antes e depois da assinatura.</p></div></div>
            <div className="rounded-3xl border border-volt-yellow/30 bg-volt-yellow/10 p-4 text-center"><p className="text-xs font-black uppercase tracking-[.16em] text-zinc-500">Contrato</p><p className="mt-1 text-2xl font-black text-volt-yellow">{contract.id}</p><p className="mt-1 text-xs text-zinc-500">Orçamento {contract.quoteId}</p></div>
          </div>
        </header>

        {isSigned && <section className="mt-5 flex gap-4 rounded-[2rem] border border-volt-ok/30 bg-volt-ok/10 p-5"><CheckCircle2 className="shrink-0 text-volt-ok" size={26} /><div><p className="text-sm font-black uppercase tracking-[.18em] text-volt-ok">Contrato assinado</p><h2 className="mt-1 text-2xl font-black">Assinatura registrada com sucesso</h2><p className="mt-2 text-sm text-zinc-300">Gere e guarde a cópia final em PDF. A Volt também poderá verificar o registro no sistema.</p></div></section>}

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
          <div className="space-y-5">
            <section className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5 md:p-6"><p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Partes</p><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-black/30 p-4"><p className="text-xs font-black uppercase text-zinc-600">Contratada</p><p className="mt-2 font-black">{contract.contractor.name}</p><p className="mt-1 text-sm leading-6 text-zinc-400">CPF/CNPJ: {contract.contractor.document}<br />{contract.contractor.address} • {contract.contractor.city}<br />Representante: {contract.contractor.representative}</p></div><div className="rounded-2xl border border-white/10 bg-black/30 p-4"><p className="text-xs font-black uppercase text-zinc-600">Contratante</p><p className="mt-2 font-black">{contract.client.name}</p><p className="mt-1 text-sm leading-6 text-zinc-400">CPF/CNPJ: {contract.client.document}<br />{contract.client.address} • {contract.client.city}<br />Representante: {contract.client.representative}</p></div></div></section>
            <section className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5 md:p-6"><p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Objeto e local</p><h2 className="mt-2 text-2xl font-black">{contract.title}</h2><div className="mt-4"><TextBlock value={contract.objectDescription} /></div><p className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm"><strong>Local:</strong> {contract.serviceLocation}</p></section>
            <section className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5 md:p-6"><p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Escopo contratado</p><div className="mt-4 space-y-2">{contract.scopeItems.map((item, index) => <div key={item.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 sm:flex-row"><div><p className="font-black">{index + 1}. {item.description}</p><p className="mt-1 text-xs text-zinc-500">{item.kind} • {item.quantity} {item.unit}</p></div><strong className="text-volt-yellow">{currency(item.total)}</strong></div>)}</div></section>
            {contract.materials.length > 0 && <section className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5 md:p-6"><p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Materiais vinculados</p><div className="mt-4 space-y-2">{contract.materials.map((item) => <div key={item.id} className="rounded-2xl border border-white/10 bg-black/30 p-4"><p className="font-black">{item.description}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{item.quantity} {item.unit} • {item.category} • {item.specification}</p></div>)}</div></section>}
            <section className="rounded-[2rem] border border-volt-yellow/20 bg-volt-yellow/[.07] p-5 md:p-6"><p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Condições comerciais</p><div className="mt-4 grid gap-3 md:grid-cols-2">{[["Valor", currency(contract.totalValue)], ["Pagamento", contract.paymentTerms], ["Início", contract.startCondition], ["Prazo", contract.executionDeadline], ["Garantia", contract.warranty], ["Responsável técnico", `${contract.technicalResponsible} ${contract.professionalRegistration}`]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/25 p-4"><p className="text-xs font-black uppercase text-zinc-600">{label}</p><p className="mt-1 font-bold leading-6">{value}</p></div>)}</div></section>
            <section className="rounded-[2rem] border border-white/10 bg-white/[.035] p-5 md:p-6"><p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Cláusulas contratuais</p><div className="mt-5 space-y-4">{clauses.map(([title, value], index) => <article key={title} className="rounded-2xl border border-white/10 bg-black/25 p-4"><h3 className="font-black text-white">Cláusula {index + 1} — {title}</h3><div className="mt-2"><TextBlock value={value} /></div></article>)}</div></section>
            {contract.consumerRelationship && <section className="rounded-[2rem] border border-blue-400/25 bg-blue-400/[.07] p-5"><p className="font-black text-blue-200">Relação de consumo e leitura prévia</p><p className="mt-2 text-sm leading-7 text-zinc-300">Os direitos obrigatórios do consumidor permanecem preservados. {contract.contractedOutsideBusinessPremises ? "Quando a contratação fora do estabelecimento preencher os requisitos legais, será respeitado o direito de arrependimento aplicável." : "A contratação foi marcada como realizada no estabelecimento."}</p></section>}
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <section className="rounded-[2rem] border border-volt-yellow/25 bg-volt-yellow/10 p-5"><p className="text-xs font-black uppercase tracking-[.16em] text-zinc-500">Valor contratado</p><p className="mt-2 text-3xl font-black text-volt-yellow">{currency(contract.totalValue)}</p><button type="button" onClick={downloadPdf} className="btn-ghost mt-4 inline-flex w-full items-center justify-center gap-2"><Download size={17} /> {isSigned ? "Gerar cópia final em PDF" : "Baixar contrato para leitura"}</button></section>
            {!isSigned && (
              <section>
                <div className="mb-3 rounded-2xl border border-white/10 bg-white/[.035] p-4">
                  <div className="flex gap-3">
                    <FileSignature className="shrink-0 text-volt-yellow" size={24} />
                    <div>
                      <p className="text-sm font-black uppercase tracking-[.18em] text-volt-yellow">Assinatura eletrônica</p>
                      <h2 className="mt-1 text-2xl font-black">Assinar contrato</h2>
                      <p className="mt-2 text-xs leading-5 text-zinc-500">Escolha uma das cinco formas profissionais de assinatura.</p>
                    </div>
                  </div>
                </div>
                <SignatureStudio
                  key={token}
                  initialValue={{
                    signerName: record.clientSignature?.signerName || record.clientName || contract.client.representative || contract.client.name,
                    mode: "Pendente",
                    signedAt: ""
                  }}
                  saving={saving}
                  externalError={error}
                  confirmLabel="Assinar contrato"
                  termsLabel="Li integralmente o contrato, tive oportunidade de esclarecer dúvidas, concordo com suas condições e aceito o uso desta assinatura eletrônica."
                  onConfirm={submitSignature}
                />
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
