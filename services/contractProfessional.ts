import type { Contract } from "@/types/contracts";

export type ContractWorkflowStep = {
  id: "review" | "volt" | "sent" | "client" | "final";
  label: string;
  description: string;
  done: boolean;
  current: boolean;
};

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = canonicalize((value as Record<string, unknown>)[key]);
      return result;
    }, {});
}

export function getContractSignablePayload(contract: Contract) {
  return {
    documentType: contract.documentType,
    schemaVersion: contract.schemaVersion,
    documentVersion: contract.documentVersion || 1,
    id: contract.id,
    quoteId: contract.quoteId,
    title: contract.title,
    createdAt: contract.createdAt,
    contractor: contract.contractor,
    client: contract.client,
    serviceLocation: contract.serviceLocation,
    objectDescription: contract.objectDescription,
    scopeItems: contract.scopeItems,
    materials: contract.materials,
    totalValue: contract.totalValue,
    paymentTerms: contract.paymentTerms,
    startCondition: contract.startCondition,
    executionDeadline: contract.executionDeadline,
    scheduleNotes: contract.scheduleNotes,
    warranty: contract.warranty,
    technicalResponsible: contract.technicalResponsible,
    professionalRegistration: contract.professionalRegistration,
    technicalDocuments: contract.technicalDocuments,
    clauses: contract.clauses,
    consumerRelationship: contract.consumerRelationship,
    contractedOutsideBusinessPremises: contract.contractedOutsideBusinessPremises,
    additionalNotes: contract.additionalNotes
  };
}

export function getContractCanonicalContent(contract: Contract) {
  return JSON.stringify(canonicalize(getContractSignablePayload(contract)));
}

function fallbackFingerprint(content: string) {
  let hash = 2166136261;
  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `REF-${(hash >>> 0).toString(16).padStart(8, "0").toUpperCase()}`;
}

export async function calculateContractDocumentHash(contract: Contract) {
  const content = getContractCanonicalContent(contract);
  if (!globalThis.crypto?.subtle) return fallbackFingerprint(content);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
  const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `SHA256-${hash.toUpperCase()}`;
}

export function shortContractHash(hash?: string) {
  if (!hash) return "Será gerado na assinatura da Volt";
  const clean = hash.replace(/^SHA256-/, "");
  return clean.length > 20 ? `${clean.slice(0, 10)}…${clean.slice(-10)}` : clean;
}

export function getContractWorkflow(contract: Contract): ContractWorkflowStep[] {
  const reviewed = contract.status !== "Rascunho";
  const voltSigned = Boolean(contract.contractorSignature?.acceptedTerms);
  const sent = Boolean(contract.signatureUrl) || ["Enviado", "Assinado"].includes(contract.status);
  const clientSigned = Boolean(contract.clientSignature?.acceptedTerms) || contract.signatureStatus === "Assinada";
  const final = contract.status === "Assinado" && voltSigned && clientSigned;
  const done = [reviewed, voltSigned, sent, clientSigned, final];
  const currentIndex = done.findIndex((item) => !item);

  return [
    { id: "review", label: "Revisão", description: "Dados e cláusulas conferidos", done: reviewed, current: currentIndex === 0 },
    { id: "volt", label: "Volt", description: "Representante da contratada", done: voltSigned, current: currentIndex === 1 },
    { id: "sent", label: "Envio", description: "Link disponibilizado ao cliente", done: sent, current: currentIndex === 2 },
    { id: "client", label: "Cliente", description: "Contratante assinou", done: clientSigned, current: currentIndex === 3 },
    { id: "final", label: "Concluído", description: "Documento final disponível", done: final, current: currentIndex === 4 || (currentIndex === -1 && final) }
  ];
}

export function getContractCompletion(contract: Contract) {
  const steps = getContractWorkflow(contract);
  const completed = steps.filter((step) => step.done).length;
  return { completed, total: steps.length, percentage: Math.round((completed / steps.length) * 100), steps };
}

export function getDeviceLabel(userAgent?: string) {
  const value = String(userAgent || "");
  if (!value) return "Dispositivo não informado";
  const browser = /Edg\//.test(value) ? "Edge" : /Chrome\//.test(value) ? "Chrome" : /Firefox\//.test(value) ? "Firefox" : /Safari\//.test(value) ? "Safari" : "Navegador";
  const device = /Android|iPhone|iPad|Mobile/i.test(value) ? "celular/tablet" : "computador";
  return `${browser} em ${device}`;
}
