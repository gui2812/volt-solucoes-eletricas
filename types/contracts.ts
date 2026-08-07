export type ContractStatus = "Rascunho" | "Pronto para envio" | "Enviado" | "Assinado" | "Cancelado";

export type ContractSignatureMode =
  | "Pendente"
  | "Assinatura livre"
  | "Rubrica predefinida"
  | "Nome digitado + aceite";

export type ContractSignature = {
  signerName: string;
  mode: ContractSignatureMode;
  signedAt: string;
  signatureDataUrl?: string;
  signatureStyle?: "Clássica" | "Elegante" | "Moderna" | "Rubrica rápida" | "Formal";
  acceptedTerms?: boolean;
};

export type ContractParty = {
  name: string;
  document: string;
  stateRegistration?: string;
  address: string;
  city: string;
  email: string;
  phone: string;
  representative: string;
  representativeDocument: string;
};

export type ContractScopeItem = {
  id: string;
  kind: string;
  code: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
};

export type ContractMaterial = {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  specification: string;
};

export type ContractClauses = {
  contractorObligations: string;
  clientObligations: string;
  materialsResponsibility: string;
  exclusions: string;
  changeOrders: string;
  unforeseenConditions: string;
  siteSafety: string;
  testsAndAcceptance: string;
  warrantyTerms: string;
  cancellationTerms: string;
  latePaymentTerms: string;
  privacyTerms: string;
  electronicSignatureTerms: string;
  disputeResolution: string;
};

export type Contract = {
  documentType: "contract";
  schemaVersion: 1;
  id: string;
  quoteId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: ContractStatus;
  contractor: ContractParty;
  client: ContractParty;
  serviceLocation: string;
  objectDescription: string;
  scopeItems: ContractScopeItem[];
  materials: ContractMaterial[];
  totalValue: number;
  paymentTerms: string;
  startCondition: string;
  executionDeadline: string;
  scheduleNotes: string;
  warranty: string;
  technicalResponsible: string;
  professionalRegistration: string;
  technicalDocuments: string;
  clauses: ContractClauses;
  consumerRelationship: boolean;
  contractedOutsideBusinessPremises: boolean;
  additionalNotes: string;
  history: string[];
  contractorSignature?: ContractSignature;
  clientSignature?: ContractSignature;
  signatureToken?: string;
  signatureUrl?: string;
  signatureStatus?: "Pendente" | "Enviada" | "Assinada" | "Expirada" | "Cancelada";
  signedAt?: string;
};

export type ContractCompanyProfile = {
  name: string;
  document: string;
  stateRegistration: string;
  address: string;
  city: string;
  email: string;
  phone: string;
  representative: string;
  representativeDocument: string;
  technicalResponsible: string;
  professionalRegistration: string;
};
