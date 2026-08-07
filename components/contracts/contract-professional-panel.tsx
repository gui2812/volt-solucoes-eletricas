"use client";

import { validateContract } from "@/services/contractBuilder";
import {
  getContractCompletion,
  getDeviceLabel,
  shortContractHash
} from "@/services/contractProfessional";
import type { Contract, ContractSignature, ContractStatus } from "@/types/contracts";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  Circle,
  ClipboardCopy,
  Clock3,
  Copy,
  FileCheck2,
  FileClock,
  FileSignature,
  FileText,
  Fingerprint,
  Link2,
  Loader2,
  MapPin,
  MessageCircle,
  Pencil,
  RefreshCcw,
  Send,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
  Wallet,
  XCircle
} from "lucide-react";

const statusColors: Record<ContractStatus, string> = {
  Rascunho: "border-zinc-400/20 bg-zinc-400/10 text-zinc-300",
  "Pronto para envio": "border-blue-400/25 bg-blue-400/10 text-blue-200",
  Enviado: "border-volt-yellow/25 bg-volt-yellow/10 text-volt-yellow",
  Assinado: "border-volt-ok/25 bg-volt-ok/10 text-volt-ok",
  Cancelado: "border-red-400/25 bg-red-500/10 text-red-200"
};

function currency(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value?: string) {
  if (!value) return "Pendente";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}

function formatDateTime(value?: string) {
  if (!value) return "Horário não registrado";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium" });
}

function SignatureCard({
  title,
  subtitle,
  signature
}: {
  title: string;
  subtitle: string;
  signature?: ContractSignature;
}) {
  const signed = Boolean(signature?.acceptedTerms);
  const evidence = signature?.evidence;

  return (
    <div className={`overflow-hidden rounded-3xl border ${signed ? "border-volt-ok/25 bg-volt-ok/[.05]" : "border-white/10 bg-black/25"}`}>
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">{title}</p>
          <p className="mt-1 font-black text-zinc-100">{signature?.signerName || subtitle}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${signed ? "border-volt-ok/25 bg-volt-ok/10 text-volt-ok" : "border-white/10 text-zinc-500"}`}>
          {signed ? <Check size={12} /> : <Clock3 size={12} />}{signed ? "Assinada" : "Pendente"}
        </span>
      </div>

      <div className="mx-4 grid h-28 place-items-center overflow-hidden rounded-2xl border border-black/10 bg-white p-3">
        {signature?.signatureDataUrl ? (
          <img src={signature.signatureDataUrl} alt={`Assinatura de ${signature.signerName}`} className="h-full max-w-full object-contain" />
        ) : signed ? (
          <p className="font-serif text-2xl font-bold italic text-slate-900">{signature?.signerName}</p>
        ) : (
          <div className="text-center text-slate-400"><FileSignature className="mx-auto" size={25} /><p className="mt-2 text-xs font-bold">Aguardando assinatura</p></div>
        )}
      </div>

      <div className="space-y-2 p-4 text-xs text-zinc-500">
        <div className="flex justify-between gap-3"><span>Modalidade</span><strong className="text-right text-zinc-300">{signature?.mode || "Pendente"}</strong></div>
        <div className="flex justify-between gap-3"><span>Data</span><strong className="text-right text-zinc-300">{formatDate(signature?.signedAt)}</strong></div>
        {signed && <div className="border-t border-white/10 pt-2">
          <p className="font-bold text-zinc-400">{evidence?.source || "Aceite eletrônico"}</p>
          <p className="mt-1 leading-5">{formatDateTime(evidence?.signedAtIso)}</p>
          {evidence?.userAgent && <p className="mt-1 leading-5">{getDeviceLabel(evidence.userAgent)}</p>}
          {evidence?.ipAddress && <p className="mt-1 font-mono text-[10px]">IP registrado: {evidence.ipAddress}</p>}
        </div>}
      </div>
    </div>
  );
}

export type ContractProfessionalPanelProps = {
  contract: Contract;
  busy: boolean;
  onEdit: () => void;
  onPdf: () => void;
  onCertificate: () => void;
  onSignVolt: () => void;
  onSend: () => void;
  onWhatsApp: () => void;
  onCopyLink: () => void | Promise<void>;
  onVerify: () => void;
  onCancel: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function ContractProfessionalPanel({
  contract,
  busy,
  onEdit,
  onPdf,
  onCertificate,
  onSignVolt,
  onSend,
  onWhatsApp,
  onCopyLink,
  onVerify,
  onCancel,
  onDuplicate,
  onDelete
}: ContractProfessionalPanelProps) {
  const completion = getContractCompletion(contract);
  const validation = validateContract(contract);
  const hasAnySignature = Boolean(contract.contractorSignature?.acceptedTerms || contract.clientSignature?.acceptedTerms);
  const history = [...contract.history].reverse().slice(0, 8);

  const summaryCards = [
    { label: "Contratante", value: contract.client.name || "Não informado", icon: UserRoundCheck },
    { label: "Local do serviço", value: contract.serviceLocation || "Não informado", icon: MapPin },
    { label: "Valor contratado", value: currency(contract.totalValue), icon: Wallet },
    { label: "Prazo", value: contract.executionDeadline || "Não informado", icon: Clock3 },
    { label: "Pagamento", value: contract.paymentTerms || "Não informado", icon: FileCheck2 },
    { label: "Garantia", value: contract.warranty || "Não informado", icon: ShieldCheck }
  ];

  return (
    <article className="card-premium overflow-hidden rounded-[2rem]">
      <div className="relative overflow-hidden border-b border-white/10 p-5 md:p-6">
        <div className="absolute -right-24 -top-24 h-60 w-60 rounded-full bg-volt-yellow/10 blur-[100px]" />
        <div className="relative z-10 flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] ${statusColors[contract.status]}`}>{contract.status}</span>
              <span className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1 text-[10px] font-black uppercase text-zinc-400">Versão {contract.documentVersion || 1}</span>
              <span className="rounded-full border border-white/10 bg-white/[.03] px-3 py-1 text-[10px] font-black uppercase text-zinc-400">Assinatura {contract.signatureStatus || "Pendente"}</span>
            </div>
            <h2 className="mt-3 text-3xl font-black leading-tight">{contract.title}</h2>
            <p className="mt-2 text-sm text-zinc-500">{contract.id} • Cliente: {contract.client.name} • Orçamento: {contract.quoteId}</p>
          </div>
          <div className="shrink-0 md:text-right">
            <p className="text-xs font-black uppercase tracking-[.16em] text-zinc-600">Valor do contrato</p>
            <p className="mt-1 text-3xl font-black text-volt-yellow">{currency(contract.totalValue)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 md:p-6">
        <section className="rounded-3xl border border-volt-yellow/20 bg-volt-yellow/[.06] p-4 md:p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div><p className="text-xs font-black uppercase tracking-[.18em] text-volt-yellow">Andamento do contrato</p><p className="mt-1 text-xl font-black">{completion.completed} de {completion.total} etapas concluídas</p></div>
            <p className="text-3xl font-black text-volt-yellow">{completion.percentage}%</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/35"><div className="h-full rounded-full bg-volt-yellow transition-all" style={{ width: `${completion.percentage}%` }} /></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-5">
            {completion.steps.map((step) => (
              <div key={step.id} className={`rounded-2xl border p-3 ${step.done ? "border-volt-ok/20 bg-volt-ok/[.07]" : step.current ? "border-volt-yellow/25 bg-volt-yellow/[.07]" : "border-white/10 bg-black/20"}`}>
                <div className={`grid h-7 w-7 place-items-center rounded-full ${step.done ? "bg-volt-ok text-black" : step.current ? "bg-volt-yellow text-black" : "bg-white/10 text-zinc-600"}`}>{step.done ? <Check size={15} /> : <Circle size={13} />}</div>
                <p className="mt-2 text-xs font-black text-zinc-200">{step.label}</p>
                <p className="mt-1 text-[10px] leading-4 text-zinc-600">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2"><BadgeCheck className="text-volt-yellow" size={20} /><div><p className="text-sm font-black uppercase tracking-[.18em] text-volt-yellow">Resumo executivo</p><p className="mt-0.5 text-xs text-zinc-500">Principais condições em uma única visão.</p></div></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {summaryCards.map((item) => {
              const Icon = item.icon;
              return <div key={item.label} className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[.05] text-volt-yellow"><Icon size={18} /></span><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-zinc-600">{item.label}</p><p className="mt-1 text-sm font-bold leading-6 text-zinc-200">{item.value}</p></div></div>;
            })}
          </div>
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-zinc-600">Objeto do contrato</p><p className="mt-2 text-sm leading-7 text-zinc-300">{contract.objectDescription}</p><div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase text-zinc-500"><span className="rounded-full bg-white/[.05] px-3 py-1">{contract.scopeItems.length} itens no escopo</span><span className="rounded-full bg-white/[.05] px-3 py-1">{contract.materials.length} materiais</span>{contract.technicalResponsible && <span className="rounded-full bg-white/[.05] px-3 py-1">Resp. técnico: {contract.technicalResponsible}</span>}</div></div>
        </section>

        <section>
          <div className="flex items-center gap-2"><FileSignature className="text-volt-yellow" size={20} /><div><p className="text-sm font-black uppercase tracking-[.18em] text-volt-yellow">Assinaturas das partes</p><p className="mt-0.5 text-xs text-zinc-500">Situação, modalidade e evidências de cada aceite.</p></div></div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <SignatureCard title="Contratada — Volt" subtitle={contract.contractor.representative || contract.contractor.name} signature={contract.contractorSignature} />
            <SignatureCard title="Contratante — Cliente" subtitle={contract.client.representative || contract.client.name} signature={contract.clientSignature} />
          </div>
        </section>

        <section className="rounded-3xl border border-blue-400/20 bg-blue-400/[.055] p-4 md:p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex min-w-0 gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-400/10 text-blue-300"><Fingerprint size={21} /></span><div className="min-w-0"><p className="text-xs font-black uppercase tracking-[.16em] text-blue-200">Identidade do documento</p><p className="mt-1 font-mono text-xs text-zinc-300">{shortContractHash(contract.documentHash)}</p><p className="mt-1 text-[10px] leading-5 text-zinc-600">O hash SHA‑256 identifica exatamente o conteúdo da versão {contract.documentVersion || 1} assinada.</p></div></div>
            {contract.documentHash && <button type="button" onClick={async () => { await navigator.clipboard.writeText(contract.documentHash || ""); }} className="btn-ghost inline-flex shrink-0 items-center justify-center gap-2"><Copy size={15} /> Copiar hash</button>}
          </div>
        </section>

        <section className="flex flex-wrap gap-2 border-y border-white/10 py-5">
          <button type="button" onClick={onEdit} className="btn-primary inline-flex items-center gap-2"><Pencil size={16} /> Editar</button>
          <button type="button" onClick={onPdf} className="btn-ghost inline-flex items-center gap-2"><FileText size={16} /> {contract.status === "Assinado" ? "PDF final" : "Prévia PDF"}</button>
          {hasAnySignature && <button type="button" onClick={onCertificate} className="btn-ghost inline-flex items-center gap-2"><Fingerprint size={16} /> Comprovante</button>}
          {!contract.contractorSignature?.acceptedTerms && <button type="button" onClick={onSignVolt} className="btn-ghost inline-flex items-center gap-2"><FileCheck2 size={16} /> Assinar pela Volt</button>}
          <button type="button" onClick={onSend} disabled={busy || contract.status === "Assinado"} className="btn-ghost inline-flex items-center gap-2 disabled:opacity-40">{busy ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Enviar assinatura</button>
          {contract.signatureUrl && <><button type="button" onClick={onWhatsApp} className="btn-ghost inline-flex items-center gap-2"><MessageCircle size={16} /> WhatsApp</button><button type="button" onClick={() => void onCopyLink()} className="btn-ghost inline-flex items-center gap-2"><ClipboardCopy size={16} /> Copiar link</button><button type="button" onClick={onVerify} className="btn-ghost inline-flex items-center gap-2"><RefreshCcw size={16} /> Verificar</button></>}
          {contract.signatureToken && !["Assinado", "Cancelado"].includes(contract.status) && <button type="button" onClick={onCancel} className="inline-flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200"><XCircle size={16} /> Cancelar link</button>}
          <button type="button" onClick={onDuplicate} className="btn-ghost inline-flex items-center gap-2"><Copy size={16} /> Duplicar</button>
          <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-black text-red-200"><Trash2 size={16} /> Excluir</button>
        </section>

        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2"><FileClock className="text-volt-yellow" size={19} /><div><p className="text-sm font-black">Histórico e auditoria</p><p className="text-[10px] text-zinc-600">Últimos acontecimentos deste contrato.</p></div></div>
            <div className="mt-4 space-y-3">
              {history.map((entry, index) => <div key={`${entry}-${index}`} className="flex gap-3"><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${index === 0 ? "bg-volt-yellow shadow-[0_0_12px_rgba(255,203,47,.5)]" : "bg-zinc-700"}`} /><p className="text-xs leading-5 text-zinc-400">{entry}</p></div>)}
              {!history.length && <p className="text-xs text-zinc-600">Nenhum registro ainda.</p>}
            </div>
          </section>

          <section className={`rounded-3xl border p-4 ${validation.errors.length ? "border-red-400/20 bg-red-500/[.05]" : "border-orange-400/20 bg-orange-400/[.05]"}`}>
            <div className="flex items-center gap-2">{validation.errors.length ? <AlertTriangle className="text-red-300" size={19} /> : <ShieldCheck className="text-orange-200" size={19} />}<div><p className="text-sm font-black">Conferência profissional</p><p className="text-[10px] text-zinc-600">Pendências e recomendações antes da conclusão.</p></div></div>
            <ul className="mt-4 space-y-2 text-xs leading-5 text-zinc-400">
              {validation.errors.map((message) => <li key={message} className="flex gap-2"><XCircle className="mt-0.5 shrink-0 text-red-300" size={14} />{message}</li>)}
              {validation.warnings.slice(0, 4).map((message) => <li key={message} className="flex gap-2"><AlertTriangle className="mt-0.5 shrink-0 text-orange-200" size={14} />{message}</li>)}
              {!validation.errors.length && !validation.warnings.length && <li className="flex gap-2 text-volt-ok"><CheckCircle2 size={15} />Contrato pronto para assinatura.</li>}
            </ul>
          </section>
        </div>
      </div>
    </article>
  );
}
