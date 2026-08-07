"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ContractProfessionalPanel } from "@/components/contracts/contract-professional-panel";
import { SignatureStudio } from "@/components/signatures/signature-studio";
import {
  CONTRACT_COMPANY_PROFILE_KEY,
  CONTRACT_IMPORT_KEY,
  CONTRACT_STORAGE_KEY,
  createBlankContract,
  defaultCompanyProfile,
  normalizeContract,
  validateContract
} from "@/services/contractBuilder";
import {
  calculateContractDocumentHash,
  getContractCanonicalContent
} from "@/services/contractProfessional";
import type {
  Contract,
  ContractCompanyProfile,
  ContractMaterial,
  ContractParty,
  ContractScopeItem,
  ContractStatus
} from "@/types/contracts";
import type { SignatureData } from "@/types/signatures";
import {
  checkRemoteSignatureByToken,
  checkRemoteSignatureStatus,
  createRemoteContractSignatureLink,
  makeContractSignatureWhatsAppLink
} from "@/utils/assinaturaRemota";
import { openContractPdf, openContractSignatureCertificate } from "@/utils/contractPdfVolt";
import { deleteBusinessDocument, loadBusinessDocumentsState, mergeCloudWithLocal, saveBusinessDocuments } from "@/services/businessDocuments";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardCopy,
  FileCheck2,
  FilePlus2,
  FileSignature,
  FileText,
  Link2,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const statusColors: Record<ContractStatus, string> = {
  Rascunho: "border-zinc-400/20 bg-zinc-400/10 text-zinc-300",
  "Pronto para envio": "border-blue-400/25 bg-blue-400/10 text-blue-200",
  Enviado: "border-volt-yellow/25 bg-volt-yellow/10 text-volt-yellow",
  Assinado: "border-volt-ok/25 bg-volt-ok/10 text-volt-ok",
  Cancelado: "border-red-400/25 bg-red-500/10 text-red-200"
};

const clauseLabels: Array<[keyof Contract["clauses"], string]> = [
  ["contractorObligations", "Obrigações da CONTRATADA"],
  ["clientObligations", "Obrigações do CONTRATANTE"],
  ["materialsResponsibility", "Materiais e especificações"],
  ["exclusions", "Exclusões do escopo"],
  ["changeOrders", "Alterações e aditivos"],
  ["unforeseenConditions", "Condições imprevistas"],
  ["siteSafety", "Segurança e suspensão"],
  ["testsAndAcceptance", "Testes, entrega e aceite"],
  ["warrantyTerms", "Garantia"],
  ["cancellationTerms", "Rescisão"],
  ["latePaymentTerms", "Atraso de pagamento"],
  ["privacyTerms", "Privacidade e dados pessoais"],
  ["electronicSignatureTerms", "Assinatura eletrônica"],
  ["disputeResolution", "Solução de controvérsias"]
];

function currency(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function todayBr() {
  return new Date().toLocaleDateString("pt-BR");
}

function extractToken(url?: string) {
  return String(url || "").match(/\/(?:assinar|assinar-contrato)\/([^/?#]+)/)?.[1] || "";
}

function Badge({ status }: { status: ContractStatus }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[.12em] ${statusColors[status]}`}>{status}</span>;
}

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <label className={`block rounded-2xl border border-white/10 bg-white/[.025] p-4 ${full ? "md:col-span-2" : ""}`}><span className="text-xs font-black uppercase tracking-[.14em] text-zinc-600">{label}</span>{children}</label>;
}

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-sm font-bold outline-none focus:border-volt-yellow/40";

const PROFILE_DOCUMENT_ID = "volt-company-profile";
type CompanyProfileDocument = ContractCompanyProfile & { id: string };

function loadCompanyProfile() {
  try {
    const saved = localStorage.getItem(CONTRACT_COMPANY_PROFILE_KEY);
    return saved ? { ...defaultCompanyProfile, ...JSON.parse(saved) } as ContractCompanyProfile : defaultCompanyProfile;
  } catch {
    return defaultCompanyProfile;
  }
}

function contractContentKey(contract: Contract) {
  return getContractCanonicalContent(contract);
}

export default function ContratosPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Contract | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<ContractCompanyProfile>(defaultCompanyProfile);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | ContractStatus>("Todos");
  const [ready, setReady] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [signingContract, setSigningContract] = useState<Contract | null>(null);

  useEffect(() => {
    let active = true;

    async function hydrateContracts() {
      const localProfile = loadCompanyProfile();
      let localContracts: Contract[] = [];
      let pendingImported: Contract | null = null;

      try {
        const saved = localStorage.getItem(CONTRACT_STORAGE_KEY);
        localContracts = saved
          ? (JSON.parse(saved) as unknown[]).map(normalizeContract).filter((item): item is Contract => Boolean(item))
          : [];

        const pending = localStorage.getItem(CONTRACT_IMPORT_KEY);
        if (pending) {
          pendingImported = normalizeContract(JSON.parse(pending));
          if (pendingImported) {
            localContracts = [pendingImported, ...localContracts.filter((item) => item.id !== pendingImported?.id)];
          }
          localStorage.removeItem(CONTRACT_IMPORT_KEY);
        }
      } catch {
        localContracts = [];
      }

      let nextContracts = localContracts;
      let nextProfile = localProfile;

      try {
        const [cloudRaw, cloudProfiles] = await Promise.all([
          loadBusinessDocumentsState<unknown>("contract"),
          loadBusinessDocumentsState<CompanyProfileDocument>("company_profile")
        ]);
        const cloudContracts = cloudRaw.documents
          .map(normalizeContract)
          .filter((item): item is Contract => Boolean(item));
        const deletedContractIds = new Set(cloudRaw.deletedIds);
        const migratableLocalContracts = localContracts.filter((item) => !deletedContractIds.has(item.id));
        const merged = mergeCloudWithLocal(cloudContracts, migratableLocalContracts);
        nextContracts = merged.merged;

        if (merged.localOnly.length) {
          await saveBusinessDocuments("contract", merged.localOnly);
        }

        const cloudProfile = cloudProfiles.documents.find((item) => item.id === PROFILE_DOCUMENT_ID);
        if (cloudProfile) {
          const { id: _id, ...profileData } = cloudProfile;
          nextProfile = { ...defaultCompanyProfile, ...profileData };
          localStorage.setItem(CONTRACT_COMPANY_PROFILE_KEY, JSON.stringify(nextProfile));
        } else {
          await saveBusinessDocuments("company_profile", [{ id: PROFILE_DOCUMENT_ID, ...localProfile }]);
        }
      } catch (error) {
        console.warn("Supabase indisponível para contratos; usando cache local.", error);
      }

      if (!active) return;
      setProfile(nextProfile);
      setContracts(nextContracts);

      if (pendingImported) {
        const imported = nextContracts.find((item) => item.id === pendingImported?.id) || pendingImported;
        setSelectedId(imported.id);
        setEditingId(imported.id);
        setDraft(imported);
        setEditorOpen(true);
      } else if (nextContracts[0]) {
        setSelectedId(nextContracts[0].id);
      }

      setReady(true);
    }

    void hydrateContracts();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(CONTRACT_STORAGE_KEY, JSON.stringify(contracts));
    const timer = window.setTimeout(() => {
      void saveBusinessDocuments("contract", contracts).catch((error) => {
        console.warn("Não foi possível sincronizar contratos com o Supabase.", error);
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [contracts, ready]);

  const filtered = useMemo(() => contracts.filter((contract) => {
    const haystack = `${contract.id} ${contract.quoteId} ${contract.title} ${contract.client.name} ${contract.objectDescription}`.toLocaleLowerCase("pt-BR");
    return haystack.includes(search.toLocaleLowerCase("pt-BR")) && (statusFilter === "Todos" || contract.status === statusFilter);
  }), [contracts, search, statusFilter]);
  const selected = contracts.find((contract) => contract.id === selectedId) ?? filtered[0] ?? null;
  const stats = useMemo(() => ({
    total: contracts.length,
    draft: contracts.filter((item) => item.status === "Rascunho").length,
    sent: contracts.filter((item) => item.status === "Enviado").length,
    signed: contracts.filter((item) => item.status === "Assinado").length,
    signedValue: contracts.filter((item) => item.status === "Assinado").reduce((sum, item) => sum + item.totalValue, 0)
  }), [contracts]);

  function createNew() {
    const contract = createBlankContract(profile);
    setDraft(contract);
    setEditingId(null);
    setSelectedId(contract.id);
    setEditorOpen(true);
  }

  function edit(contract: Contract) {
    if (contract.status === "Assinado") {
      alert("Um contrato já assinado não pode ser alterado. Duplique-o para criar uma nova versão ou um aditivo.");
      return;
    }
    if (contract.signatureStatus === "Enviada" && contract.signatureToken) {
      alert("Cancele o link de assinatura ativo antes de editar este contrato. Assim o cliente não assina uma versão antiga enquanto você altera o texto.");
      return;
    }
    setDraft(structuredClone(contract));
    setEditingId(contract.id);
    setSelectedId(contract.id);
    setEditorOpen(true);
  }

  function update<K extends keyof Contract>(key: K, value: Contract[K]) {
    setDraft((current) => current ? { ...current, [key]: value, updatedAt: new Date().toISOString() } : current);
  }

  function updateParty(side: "contractor" | "client", key: keyof ContractParty, value: string) {
    setDraft((current) => current ? { ...current, [side]: { ...current[side], [key]: value }, updatedAt: new Date().toISOString() } : current);
  }

  function updateClause(key: keyof Contract["clauses"], value: string) {
    setDraft((current) => current ? { ...current, clauses: { ...current.clauses, [key]: value }, updatedAt: new Date().toISOString() } : current);
  }

  function updateScope(index: number, key: keyof ContractScopeItem, value: string | number) {
    setDraft((current) => {
      if (!current) return current;
      const items = current.scopeItems.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, [key]: value } as ContractScopeItem;
        if (key === "quantity" || key === "unitPrice") next.total = Number(next.quantity || 0) * Number(next.unitPrice || 0);
        return next;
      });
      return { ...current, scopeItems: items, totalValue: items.reduce((sum, item) => sum + Number(item.total || 0), 0), updatedAt: new Date().toISOString() };
    });
  }

  function updateMaterial(index: number, key: keyof ContractMaterial, value: string | number) {
    setDraft((current) => current ? { ...current, materials: current.materials.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } as ContractMaterial : item), updatedAt: new Date().toISOString() } : current);
  }

  function saveDraft() {
    if (!draft) return;
    const stored = editingId ? contracts.find((item) => item.id === editingId) : undefined;
    const contentChanged = Boolean(stored && contractContentKey(stored) !== contractContentKey(draft));
    const nextVersion = stored && contentChanged
      ? Number(stored.documentVersion || 1) + 1
      : Number(draft.documentVersion || 1);
    const hadAcceptance = Boolean(
      stored?.contractorSignature?.acceptedTerms ||
      stored?.clientSignature?.acceptedTerms ||
      stored?.signatureToken ||
      stored?.signatureUrl
    );
    const invalidated = contentChanged && hadAcceptance;
    const unsignedDraft: Contract = invalidated ? {
      ...draft,
      status: "Rascunho",
      contractorSignature: {
        signerName: draft.contractor.representative || draft.contractor.name,
        mode: "Pendente",
        signedAt: "",
        signatureStyle: "Formal",
        acceptedTerms: false
      },
      clientSignature: {
        signerName: draft.client.representative || draft.client.name,
        mode: "Pendente",
        signedAt: "",
        signatureStyle: "Clássica",
        acceptedTerms: false
      },
      signatureToken: undefined,
      signatureUrl: undefined,
      signatureStatus: "Pendente",
      signedAt: undefined,
      documentHash: undefined
    } : draft;
    const validation = validateContract(unsignedDraft);
    const nextStatus: ContractStatus = validation.errors.length
      ? "Rascunho"
      : unsignedDraft.status === "Rascunho"
        ? "Pronto para envio"
        : unsignedDraft.status;
    const next: Contract = {
      ...unsignedDraft,
      documentVersion: nextVersion,
      documentHash: contentChanged ? undefined : unsignedDraft.documentHash,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      history: [
        ...unsignedDraft.history,
        ...(invalidated ? [`Aceites anteriores invalidados após alteração do conteúdo em ${todayBr()}`] : []),
        ...(contentChanged ? [`Versão ${nextVersion} criada em ${todayBr()}`] : []),
        `Contrato salvo em ${todayBr()}`
      ]
    };
    setContracts((current) => [next, ...current.filter((item) => item.id !== editingId && item.id !== next.id)]);
    setSelectedId(next.id);
    setEditingId(next.id);
    setEditorOpen(false);
    const notices = [
      ...(invalidated ? ["O conteúdo foi alterado; os aceites e o link anteriores foram invalidados. A Volt deverá assinar novamente."] : []),
      ...(validation.errors.length ? [`Contrato salvo como rascunho. Complete antes de enviar:\n\n• ${validation.errors.join("\n• ")}`] : [])
    ];
    if (notices.length) alert(notices.join("\n\n"));
  }

  function saveProfile() {
    localStorage.setItem(CONTRACT_COMPANY_PROFILE_KEY, JSON.stringify(profile));
    void saveBusinessDocuments("company_profile", [{ id: PROFILE_DOCUMENT_ID, ...profile }]).catch((error) => {
      console.warn("Não foi possível sincronizar os dados da Volt com o Supabase.", error);
    });
    setProfileOpen(false);
    alert("Dados da Volt salvos e sincronizados para os próximos contratos.");
  }

  function applyProfileToDraft() {
    if (!draft) return;
    setDraft({
      ...draft,
      contractor: {
        name: profile.name,
        document: profile.document,
        stateRegistration: profile.stateRegistration,
        address: profile.address,
        city: profile.city,
        email: profile.email,
        phone: profile.phone,
        representative: profile.representative,
        representativeDocument: profile.representativeDocument
      },
      technicalResponsible: profile.technicalResponsible,
      professionalRegistration: profile.professionalRegistration
    });
  }

  function signForVolt(contract: Contract) {
    const validation = validateContract(contract);
    if (validation.errors.length) {
      alert(`Complete o contrato antes do aceite da Volt:\n\n• ${validation.errors.join("\n• ")}`);
      edit(contract);
      return;
    }
    if (!contract.contractor.representative.trim() || !contract.contractor.document.trim()) {
      alert("Preencha o representante e o CPF/CNPJ da Volt antes de registrar o aceite da CONTRATADA.");
      return;
    }
    setSigningContract(contract);
  }

  async function completeVoltSignature(signature: SignatureData) {
    if (!signingContract) return;
    const signedAtIso = new Date().toISOString();
    const documentHash = await calculateContractDocumentHash(signingContract);
    const next: Contract = {
      ...signingContract,
      documentHash,
      status: signingContract.status === "Rascunho" ? "Pronto para envio" : signingContract.status,
      contractorSignature: {
        ...signature,
        acceptedTerms: true,
        evidence: {
          signedAtIso,
          source: "Painel interno",
          userAgent: navigator.userAgent,
          documentHash
        }
      },
      history: [...signingContract.history, `Assinatura da CONTRATADA registrada em ${todayBr()} (${signature.mode}) — versão ${signingContract.documentVersion || 1}`],
      updatedAt: signedAtIso
    };
    setContracts((current) => current.map((item) => item.id === next.id ? next : item));
    setSelectedId(next.id);
    setSigningContract(null);
  }

  function updateStored(next: Contract) {
    setContracts((current) => current.map((item) => item.id === next.id ? next : item));
    setSelectedId(next.id);
  }

  async function sendForSignature(contract: Contract) {
    if (contract.status === "Assinado") {
      alert("Este contrato já foi assinado pelas partes.");
      return;
    }
    if (contract.signatureStatus === "Enviada" && contract.signatureUrl) {
      alert("Já existe um link ativo. Use Copiar link ou WhatsApp; cancele o link atual antes de gerar outro.");
      return;
    }
    const validation = validateContract(contract);
    if (validation.errors.length) {
      alert(`Complete estes dados antes de enviar:\n\n• ${validation.errors.join("\n• ")}`);
      edit(contract);
      return;
    }
    if (!contract.contractorSignature?.acceptedTerms) {
      alert("Registre primeiro o aceite da Volt no botão “Assinar pela Volt”.");
      return;
    }
    try {
      setBusyId(contract.id);
      const documentHash = contract.documentHash || await calculateContractDocumentHash(contract);
      const securedContract: Contract = {
        ...contract,
        documentHash,
        contractorSignature: contract.contractorSignature ? {
          ...contract.contractorSignature,
          evidence: {
            signedAtIso: contract.contractorSignature.evidence?.signedAtIso || new Date().toISOString(),
            source: "Painel interno",
            userAgent: contract.contractorSignature.evidence?.userAgent || navigator.userAgent,
            documentHash
          }
        } : contract.contractorSignature
      };
      const snapshot = { ...securedContract, status: "Pronto para envio" as ContractStatus };
      const result = await createRemoteContractSignatureLink(snapshot);
      try { await navigator.clipboard.writeText(result.signingUrl); } catch {}
      let emailSent = false;
      let emailWarning = "";
      if (contract.client.email.trim()) {
        try {
          const response = await fetch("/api/signature/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              documentType: "contract",
              to: contract.client.email,
              clientName: contract.client.representative || contract.client.name,
              quoteId: contract.id,
              quoteTitle: contract.title,
              signingUrl: result.signingUrl,
              total: currency(contract.totalValue),
              validUntil: "Link disponível por 10 dias"
            })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Erro ao enviar e-mail.");
          emailSent = true;
        } catch (emailError) {
          emailWarning = emailError instanceof Error ? emailError.message : "E-mail não enviado.";
        }
      }
      const next: Contract = {
        ...securedContract,
        status: "Enviado",
        signatureToken: result.token,
        signatureUrl: result.signingUrl,
        signatureStatus: "Enviada",
        history: [...securedContract.history, `Contrato versão ${securedContract.documentVersion || 1} enviado para assinatura em ${todayBr()}${emailSent ? " por WhatsApp e e-mail" : ""}`],
        updatedAt: new Date().toISOString()
      };
      updateStored(next);
      if (contract.client.phone.replace(/\D/g, "").length >= 10) window.open(makeContractSignatureWhatsAppLink(contract.client.phone, result.signingUrl, contract.id), "_blank");
      alert(["Link do contrato criado e copiado.", emailSent ? "E-mail enviado ao cliente." : contract.client.email ? `Atenção: ${emailWarning}` : "Cliente sem e-mail cadastrado.", contract.client.phone ? "WhatsApp aberto para envio." : "Cliente sem telefone; envie o link copiado manualmente."].join("\n"));
    } catch (sendError) {
      alert(sendError instanceof Error ? sendError.message : "Erro ao enviar contrato.");
    } finally {
      setBusyId("");
    }
  }

  async function verifySignature(contract: Contract) {
    try {
      setBusyId(contract.id);
      const token = contract.signatureToken || extractToken(contract.signatureUrl);
      const result = token ? await checkRemoteSignatureByToken(token) : await checkRemoteSignatureStatus(contract.id);
      if (!result.found) {
        alert("Ainda não existe assinatura remota para este contrato.");
        return;
      }
      const remoteDocumentHash = result.clientSignature?.evidence?.documentHash;
      if (result.status === "signed" && contract.documentHash && remoteDocumentHash && contract.documentHash !== remoteDocumentHash) {
        throw new Error("A assinatura recebida pertence a outra versão do conteúdo. Cancele o fluxo e gere um novo link para o contrato atual.");
      }
      const signatureStatus = result.status === "signed" ? "Assinada" : result.status === "expired" ? "Expirada" : result.status === "cancelled" ? "Cancelada" : "Enviada";
      const next: Contract = {
        ...contract,
        status: result.status === "signed" ? "Assinado" : result.status === "cancelled" ? "Cancelado" : contract.status,
        signatureToken: result.token || token,
        signatureUrl: result.signingUrl || contract.signatureUrl,
        signatureStatus,
        signedAt: result.signedAt || contract.signedAt,
        clientSignature: result.clientSignature ? {
          signerName: result.clientSignature.signerName || contract.client.representative || contract.client.name,
          mode: result.clientSignature.mode || "Nome digitado + aceite",
          signedAt: result.clientSignature.signedAt || result.signedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          signatureDataUrl: result.clientSignature.signatureDataUrl || "",
          signatureStyle: result.clientSignature.signatureStyle || "Clássica",
          acceptedTerms: true,
          brushStyle: result.clientSignature.brushStyle,
          inkColor: result.clientSignature.inkColor,
          initials: result.clientSignature.initials,
          evidence: result.clientSignature.evidence ? {
            ...result.clientSignature.evidence,
            verifiedAt: new Date().toISOString()
          } : {
            signedAtIso: result.signedAt || new Date().toISOString(),
            source: "Link público",
            documentHash: contract.documentHash,
            tokenReference: token.slice(-12),
            verifiedAt: new Date().toISOString()
          }
        } : contract.clientSignature,
        history: [...contract.history, `${result.status === "signed" ? `Assinatura do cliente confirmada para a versão ${contract.documentVersion || 1}` : `Status ${signatureStatus}`} em ${todayBr()}`],
        updatedAt: new Date().toISOString()
      };
      updateStored(next);
      alert(result.status === "signed" ? "Contrato assinado. O PDF final já pode ser gerado." : `Status atual: ${signatureStatus}.`);
    } catch (verifyError) {
      alert(verifyError instanceof Error ? verifyError.message : "Erro ao verificar assinatura.");
    } finally {
      setBusyId("");
    }
  }

  async function cancelLink(contract: Contract) {
    const token = contract.signatureToken || extractToken(contract.signatureUrl);
    if (!token) return;
    if (!window.confirm("Cancelar este link? O cliente não conseguirá mais assinar por ele.")) return;
    try {
      setBusyId(contract.id);
      const response = await fetch(`/api/signature/cancel/${encodeURIComponent(token)}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao cancelar link.");
      updateStored({ ...contract, status: "Cancelado", signatureStatus: "Cancelada", history: [...contract.history, `Link cancelado em ${todayBr()}`], updatedAt: new Date().toISOString() });
    } catch (cancelError) {
      alert(cancelError instanceof Error ? cancelError.message : "Erro ao cancelar link.");
    } finally {
      setBusyId("");
    }
  }

  function duplicate(contract: Contract) {
    const next: Contract = {
      ...structuredClone(contract),
      id: `CONT-${String(Date.now()).slice(-6)}`,
      title: `${contract.title} — cópia`,
      documentVersion: 1,
      documentHash: undefined,
      status: "Rascunho",
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString(),
      signatureToken: undefined,
      signatureUrl: undefined,
      signatureStatus: "Pendente",
      signedAt: undefined,
      contractorSignature: { signerName: contract.contractor.representative || contract.contractor.name, mode: "Pendente", signedAt: "", signatureStyle: "Executiva", acceptedTerms: false },
      clientSignature: { signerName: contract.client.representative || contract.client.name, mode: "Pendente", signedAt: "", acceptedTerms: false },
      history: [`Duplicado do contrato ${contract.id}`]
    };
    setContracts((current) => [next, ...current]);
    edit(next);
  }

  function remove(contract: Contract) {
    if (!window.confirm(`Excluir o contrato ${contract.id}?`)) return;
    setContracts((current) => current.filter((item) => item.id !== contract.id));
    void deleteBusinessDocument("contract", contract.id).catch((error) => {
      console.warn("Não foi possível excluir o contrato do Supabase.", error);
    });
    setSelectedId("");
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111821] via-[#080c11] to-black p-5 md:p-7">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-volt-yellow/20 blur-[120px]" />
          <div className="relative z-10 flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Pós-aprovação do orçamento</p><h1 className="mt-2 text-4xl font-black md:text-5xl">Contratos e assinaturas</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">Transforme o orçamento assinado em contrato completo, revise as cláusulas, registre o aceite da Volt, envie o link ao cliente e gere a cópia final em PDF.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setProfileOpen(!profileOpen)} className="btn-ghost inline-flex items-center gap-2"><Building2 size={17} /> Dados da Volt</button><button onClick={createNew} className="btn-primary inline-flex items-center gap-2"><FilePlus2 size={17} /> Novo contrato</button></div></div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[["Contratos", stats.total], ["Rascunhos", stats.draft], ["Enviados", stats.sent], ["Assinados", stats.signed], ["Valor assinado", currency(stats.signedValue)]].map(([label, value]) => <div key={label} className="card-premium rounded-3xl p-4"><p className="text-xs font-black uppercase tracking-[.14em] text-zinc-600">{label}</p><p className="mt-2 text-2xl font-black text-volt-yellow">{value}</p></div>)}</section>

        {profileOpen && <section className="card-premium rounded-[2rem] p-5 md:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Cadastro contratual</p><h2 className="mt-1 text-2xl font-black">Dados jurídicos da Volt</h2><p className="mt-2 text-sm leading-6 text-zinc-500">Preencha uma vez. Esses dados entram nos próximos contratos; não inventei CPF/CNPJ ou registro profissional.</p></div><button onClick={() => setProfileOpen(false)} className="btn-ghost"><X size={17} /></button></div><div className="mt-5 grid gap-3 md:grid-cols-2">{([['name','Nome / razão social'],['document','CPF/CNPJ'],['stateRegistration','Inscrição estadual/municipal'],['address','Endereço completo'],['city','Cidade/UF'],['email','E-mail'],['phone','Telefone'],['representative','Representante legal'],['representativeDocument','CPF do representante'],['technicalResponsible','Responsável técnico'],['professionalRegistration','CREA/CFT e número']] as Array<[keyof ContractCompanyProfile,string]>).map(([key,label]) => <Field key={key} label={label} full={key === "address"}><input value={profile[key]} onChange={(event) => setProfile((current) => ({ ...current, [key]: event.target.value }))} className={inputClass} /></Field>)}</div><button onClick={saveProfile} className="btn-primary mt-5 inline-flex items-center gap-2"><Save size={17} /> Salvar dados da Volt</button></section>}

        <section className="flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-white/[.025] p-3 md:flex-row"><div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4"><Search size={17} className="text-zinc-600" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar contrato, cliente, orçamento..." className="w-full bg-transparent py-3 text-sm font-bold outline-none" /></div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="rounded-2xl border border-white/10 bg-[#080c11] px-4 py-3 text-sm font-bold"><option>Todos</option>{Object.keys(statusColors).map((status) => <option key={status}>{status}</option>)}</select></section>

        <section className="grid gap-5 xl:grid-cols-[.82fr_1.18fr]">
          <div className="space-y-3">{filtered.map((contract) => <button key={contract.id} onClick={() => setSelectedId(contract.id)} className={`w-full rounded-[2rem] border p-5 text-left transition ${selected?.id === contract.id ? "border-volt-yellow/40 bg-volt-yellow/[.08]" : "border-white/10 bg-white/[.025] hover:border-white/20"}`}><div className="flex items-start justify-between gap-3"><div><Badge status={contract.status} /><p className="mt-3 text-lg font-black">{contract.client.name || "Cliente não informado"}</p><p className="mt-1 text-xs text-zinc-500">{contract.id} • orçamento {contract.quoteId}</p></div><p className="font-black text-volt-yellow">{currency(contract.totalValue)}</p></div><p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">{contract.title}</p></button>)}{!filtered.length && <div className="rounded-[2rem] border border-dashed border-white/10 p-10 text-center"><FileSignature className="mx-auto text-zinc-700" size={38} /><h2 className="mt-4 text-xl font-black">Nenhum contrato ainda</h2><p className="mt-2 text-sm text-zinc-500">Abra um orçamento assinado e clique em Gerar contrato, ou crie um contrato manual.</p></div>}</div>
          {selected ? (
            <ContractProfessionalPanel
              contract={selected}
              busy={busyId === selected.id}
              onEdit={() => edit(selected)}
              onPdf={() => openContractPdf(selected, selected.status === "Assinado" ? "final" : "signature")}
              onCertificate={() => openContractSignatureCertificate(selected)}
              onSignVolt={() => signForVolt(selected)}
              onSend={() => void sendForSignature(selected)}
              onWhatsApp={() => window.open(makeContractSignatureWhatsAppLink(selected.client.phone, selected.signatureUrl || "", selected.id), "_blank")}
              onCopyLink={async () => {
                await navigator.clipboard.writeText(selected.signatureUrl || "");
                alert("Link copiado.");
              }}
              onVerify={() => void verifySignature(selected)}
              onCancel={() => void cancelLink(selected)}
              onDuplicate={() => duplicate(selected)}
              onDelete={() => remove(selected)}
            />
          ) : (
            <div className="card-premium grid min-h-[400px] place-items-center rounded-[2rem] p-8 text-center">
              <div><FileSignature className="mx-auto text-zinc-700" size={42} /><p className="mt-4 font-black">Selecione ou crie um contrato</p></div>
            </div>
          )}
        </section>

        {signingContract && (
          <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/85 p-3 backdrop-blur-sm md:p-6">
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-[#080c11] p-4 shadow-2xl md:p-6">
              <div className="mb-4 flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-[.2em] text-volt-yellow">Assinatura da contratada</p>
                  <h2 className="mt-1 text-2xl font-black">Assinar pela Volt</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">Contrato {signingContract.id} • representante {signingContract.contractor.representative}</p>
                </div>
                <button type="button" onClick={() => setSigningContract(null)} className="btn-ghost" aria-label="Fechar"><X size={18} /></button>
              </div>
              <SignatureStudio
                key={signingContract.id}
                initialValue={signingContract.contractorSignature?.acceptedTerms ? signingContract.contractorSignature : {
                  signerName: signingContract.contractor.representative,
                  mode: "Pendente",
                  signedAt: "",
                  signatureStyle: "Executiva"
                }}
                confirmLabel="Confirmar assinatura da Volt"
                termsLabel={`Declaro que sou ${signingContract.contractor.representative} ou possuo autorização expressa para assinar este contrato em nome da ${signingContract.contractor.name}.`}
                onConfirm={completeVoltSignature}
              />
            </div>
          </div>
        )}

        {editorOpen && draft && <div className="fixed inset-0 z-[100] bg-black/80 p-3 backdrop-blur-sm md:p-5"><div className="volt-scroll mx-auto h-full max-w-7xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#080c11] p-5 md:p-7"><div className="flex flex-col justify-between gap-4 border-b border-white/10 pb-5 md:flex-row"><div><p className="text-sm font-black uppercase tracking-[.22em] text-volt-yellow">Editor contratual</p><h2 className="mt-1 text-3xl font-black">{draft.title}</h2><p className="mt-2 text-sm text-zinc-500">Preencha os dados reais e revise todas as cláusulas antes de enviar.</p></div><div className="flex flex-wrap gap-2"><button onClick={applyProfileToDraft} className="btn-ghost inline-flex items-center gap-2"><Building2 size={16} /> Aplicar dados da Volt</button><button onClick={saveDraft} className="btn-primary inline-flex items-center gap-2"><Save size={16} /> Salvar contrato</button><button onClick={() => setEditorOpen(false)} className="btn-ghost"><X size={18} /></button></div></div>
          <section className="mt-6"><p className="text-sm font-black uppercase tracking-[.2em] text-volt-yellow">Identificação</p><div className="mt-4 grid gap-3 md:grid-cols-2"><Field label="Número do contrato"><input value={draft.id} onChange={(event) => update("id", event.target.value)} className={inputClass} /></Field><Field label="Orçamento vinculado"><input value={draft.quoteId} onChange={(event) => update("quoteId", event.target.value)} className={inputClass} /></Field><Field label="Título" full><input value={draft.title} onChange={(event) => update("title", event.target.value)} className={inputClass} /></Field><Field label="Local da execução" full><input value={draft.serviceLocation} onChange={(event) => update("serviceLocation", event.target.value)} className={inputClass} /></Field><Field label="Objeto detalhado" full><textarea value={draft.objectDescription} onChange={(event) => update("objectDescription", event.target.value)} rows={5} className={inputClass} /></Field></div></section>
          <section className="mt-8 grid gap-5 xl:grid-cols-2">{(["contractor", "client"] as const).map((side) => <div key={side} className="rounded-[2rem] border border-white/10 bg-white/[.025] p-5"><p className="text-sm font-black uppercase tracking-[.2em] text-volt-yellow">{side === "contractor" ? "CONTRATADA — Volt" : "CONTRATANTE — Cliente"}</p><div className="mt-4 grid gap-3 md:grid-cols-2">{([['name','Nome / razão social'],['document','CPF/CNPJ'],['stateRegistration','Inscrição'],['address','Endereço'],['city','Cidade/UF'],['email','E-mail'],['phone','Telefone'],['representative','Representante'],['representativeDocument','CPF do representante']] as Array<[keyof ContractParty,string]>).map(([key,label]) => <Field key={key} label={label} full={key === "address"}><input value={String(draft[side][key] || "")} onChange={(event) => updateParty(side, key, event.target.value)} className={inputClass} /></Field>)}</div></div>)}</section>
          <section className="mt-8"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-black uppercase tracking-[.2em] text-volt-yellow">Escopo detalhado</p><p className="mt-1 text-sm text-zinc-500">Os itens vieram do orçamento e podem ser detalhados.</p></div><button onClick={() => update("scopeItems", [...draft.scopeItems, { id: `ESCOPO-${Date.now()}`, kind: "Serviço", code: "", description: "Novo item", quantity: 1, unit: "serv.", unitPrice: 0, total: 0 }])} className="btn-ghost inline-flex items-center gap-2"><Plus size={16} /> Item</button></div><div className="mt-4 space-y-3">{draft.scopeItems.map((item,index) => <div key={item.id} className="grid gap-2 rounded-2xl border border-white/10 bg-white/[.025] p-4 md:grid-cols-[.7fr_2fr_90px_80px_120px_44px]"><input value={item.kind} onChange={(event) => updateScope(index,"kind",event.target.value)} placeholder="Tipo" className={inputClass} /><input value={item.description} onChange={(event) => updateScope(index,"description",event.target.value)} placeholder="Descrição completa" className={inputClass} /><input type="number" value={item.quantity} onChange={(event) => updateScope(index,"quantity",Number(event.target.value))} className={inputClass} /><input value={item.unit} onChange={(event) => updateScope(index,"unit",event.target.value)} className={inputClass} /><input type="number" value={item.unitPrice} onChange={(event) => updateScope(index,"unitPrice",Number(event.target.value))} className={inputClass} /><button onClick={() => update("scopeItems", draft.scopeItems.filter((_,itemIndex) => itemIndex !== index))} className="mt-2 grid h-11 place-items-center rounded-xl border border-red-400/20 text-red-300"><Trash2 size={15} /></button></div>)}</div><div className="mt-4 rounded-2xl border border-volt-yellow/25 bg-volt-yellow/10 p-4 text-right"><p className="text-xs font-black uppercase text-zinc-500">Valor contratual</p><p className="mt-1 text-3xl font-black text-volt-yellow">{currency(draft.totalValue)}</p></div></section>
          <section className="mt-8"><div className="flex items-center justify-between gap-3"><p className="text-sm font-black uppercase tracking-[.2em] text-volt-yellow">Materiais anexos</p><button onClick={() => update("materials", [...draft.materials, { id: `MAT-${Date.now()}`, category: "Outros", description: "Novo material", quantity: 1, unit: "un", specification: "" }])} className="btn-ghost inline-flex items-center gap-2"><Plus size={16} /> Material</button></div><div className="mt-4 space-y-3">{draft.materials.map((item,index) => <div key={item.id} className="grid gap-2 rounded-2xl border border-white/10 bg-white/[.025] p-4 md:grid-cols-[.8fr_1.5fr_90px_80px_1.5fr_44px]"><input value={item.category} onChange={(event) => updateMaterial(index,"category",event.target.value)} className={inputClass} /><input value={item.description} onChange={(event) => updateMaterial(index,"description",event.target.value)} className={inputClass} /><input type="number" value={item.quantity} onChange={(event) => updateMaterial(index,"quantity",Number(event.target.value))} className={inputClass} /><input value={item.unit} onChange={(event) => updateMaterial(index,"unit",event.target.value)} className={inputClass} /><input value={item.specification} onChange={(event) => updateMaterial(index,"specification",event.target.value)} className={inputClass} /><button onClick={() => update("materials", draft.materials.filter((_,itemIndex) => itemIndex !== index))} className="mt-2 grid h-11 place-items-center rounded-xl border border-red-400/20 text-red-300"><Trash2 size={15} /></button></div>)}</div></section>
          <section className="mt-8"><p className="text-sm font-black uppercase tracking-[.2em] text-volt-yellow">Condições comerciais e técnicas</p><div className="mt-4 grid gap-3 md:grid-cols-2"><Field label="Condição de pagamento" full><textarea value={draft.paymentTerms} onChange={(event) => update("paymentTerms", event.target.value)} rows={3} className={inputClass} /></Field><Field label="Condição para início"><textarea value={draft.startCondition} onChange={(event) => update("startCondition", event.target.value)} rows={4} className={inputClass} /></Field><Field label="Prazo de execução"><textarea value={draft.executionDeadline} onChange={(event) => update("executionDeadline", event.target.value)} rows={4} className={inputClass} /></Field><Field label="Observações de cronograma" full><textarea value={draft.scheduleNotes} onChange={(event) => update("scheduleNotes", event.target.value)} rows={3} className={inputClass} /></Field><Field label="Garantia"><input value={draft.warranty} onChange={(event) => update("warranty", event.target.value)} className={inputClass} /></Field><Field label="Responsável técnico"><input value={draft.technicalResponsible} onChange={(event) => update("technicalResponsible", event.target.value)} className={inputClass} /></Field><Field label="CREA/CFT e número"><input value={draft.professionalRegistration} onChange={(event) => update("professionalRegistration", event.target.value)} className={inputClass} /></Field><Field label="Documentos técnicos" full><textarea value={draft.technicalDocuments} onChange={(event) => update("technicalDocuments", event.target.value)} rows={3} className={inputClass} /></Field></div></section>
          <section className="mt-8"><p className="text-sm font-black uppercase tracking-[.2em] text-volt-yellow">Cláusulas completas</p><div className="mt-4 grid gap-3 xl:grid-cols-2">{clauseLabels.map(([key,label]) => <Field key={key} label={label}><textarea value={draft.clauses[key]} onChange={(event) => updateClause(key,event.target.value)} rows={8} className={inputClass} /></Field>)}</div></section>
          <section className="mt-8 rounded-[2rem] border border-blue-400/20 bg-blue-400/[.06] p-5"><p className="text-sm font-black uppercase tracking-[.2em] text-blue-200">Relação de consumo e condições adicionais</p><div className="mt-4 grid gap-3 md:grid-cols-2"><label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6"><input type="checkbox" checked={draft.consumerRelationship} onChange={(event) => update("consumerRelationship", event.target.checked)} className="mt-1 h-5 w-5 accent-volt-yellow" />Marcar quando o contratante for consumidor final.</label><label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm leading-6"><input type="checkbox" checked={draft.contractedOutsideBusinessPremises} onChange={(event) => update("contractedOutsideBusinessPremises", event.target.checked)} className="mt-1 h-5 w-5 accent-volt-yellow" />Contratação realizada fora do estabelecimento ou a distância.</label><Field label="Condições adicionais" full><textarea value={draft.additionalNotes} onChange={(event) => update("additionalNotes", event.target.value)} rows={5} className={inputClass} /></Field></div><div className="mt-4 flex gap-3 rounded-2xl border border-orange-400/20 bg-orange-400/[.07] p-4"><ShieldCheck className="mt-0.5 shrink-0 text-orange-200" size={19} /><p className="text-xs leading-5 text-zinc-400">O texto-base preserva direitos obrigatórios e evita penalidades automáticas. Ainda assim, faça revisão jurídica antes do primeiro uso e em obras de maior valor ou risco.</p></div></section>
          <div className="mt-8 flex justify-end gap-2 border-t border-white/10 pt-5"><button onClick={() => setEditorOpen(false)} className="btn-ghost">Cancelar</button><button onClick={saveDraft} className="btn-primary inline-flex items-center gap-2"><Save size={17} /> Salvar contrato</button></div>
        </div></div>}
      </div>
    </AppShell>
  );
}
