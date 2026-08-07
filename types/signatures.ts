export type SignatureMode =
  | "Pendente"
  | "Assinatura livre"
  | "Rubrica predefinida"
  | "Rubrica por iniciais"
  | "Imagem enviada"
  | "Nome digitado + aceite";

export type SignatureStyle =
  | "Clássica"
  | "Elegante"
  | "Executiva"
  | "Caligráfica"
  | "Autógrafo"
  | "Traço longo"
  | "Moderna"
  | "Minimalista"
  | "Rubrica rápida"
  | "Rubrica circular"
  | "Formal"
  | "Monograma";

export type SignatureBrush =
  | "Caneta fina"
  | "Caneta assinatura"
  | "Caligráfica"
  | "Marcador";

export type SignatureInk = "Preta" | "Azul";

export type SignatureEvidence = {
  signedAtIso: string;
  source: "Painel interno" | "Link público";
  ipAddress?: string;
  userAgent?: string;
  documentHash?: string;
  tokenReference?: string;
  verifiedAt?: string;
};

export type SignatureData = {
  signerName: string;
  mode: SignatureMode;
  signedAt: string;
  signatureDataUrl?: string;
  signatureStyle?: SignatureStyle;
  acceptedTerms?: boolean;
  brushStyle?: SignatureBrush;
  inkColor?: SignatureInk;
  initials?: string;
  evidence?: SignatureEvidence;
};
