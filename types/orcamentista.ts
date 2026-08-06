export type EstimatorConfidence = "Alta" | "Média" | "Baixa";

export type EstimatorMessage = {
  role: "user" | "assistant";
  content: string;
};

export type EstimatorItemKind = "Serviço" | "Material" | "Mão de obra" | "Deslocamento" | "Taxa";

export type EstimatorItem = {
  kind: EstimatorItemKind;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount: number;
  pricingBasis: string;
  confidence: EstimatorConfidence;
};

export type EstimatorMaterial = {
  category: string;
  description: string;
  quantity: number;
  unit: string;
  specification: string;
};

export type EstimatorResult = {
  reply: string;
  status: "perguntando" | "pronto";
  questions: string[];
  assumptions: string[];
  warnings: string[];
  confidence: EstimatorConfidence;
  title: string;
  serviceType: string;
  deadline: string;
  warranty: string;
  paymentSuggestion: string;
  calculationSummary: string;
  items: EstimatorItem[];
  materials: EstimatorMaterial[];
  totalSuggested: number;
};

export type EstimatorTechnicalDraft = {
  title: string;
  serviceType: string;
  priority: "Baixa" | "Média" | "Alta" | "Urgente";
  deadline: string;
  warranty: string;
  payment: string;
  items: Array<{
    kind: EstimatorItemKind;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
  }>;
  materials: EstimatorMaterial[];
};

export type EstimatorRequest = {
  messages: EstimatorMessage[];
  currentQuote: EstimatorTechnicalDraft;
};
