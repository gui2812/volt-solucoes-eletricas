import type {
  ElectricalRoom,
  ElectricalSystem,
  InstallationType,
  VoltageOption
} from "@/types/electrical";

export type DimensioningAiMessage = {
  role: "user" | "assistant";
  content: string;
};

export type DimensioningAiProjectDraft = {
  projectName: string;
  installationType: InstallationType;
  electricalSystem: ElectricalSystem;
  voltage: VoltageOption;
  demandFactor: number;
  notes: string;
};

export type DimensioningAiResult = {
  reply: string;
  status: "perguntando" | "pronto";
  questions: string[];
  assumptions: string[];
  warnings: string[];
  confidence: "Alta" | "Média" | "Baixa";
  project: DimensioningAiProjectDraft;
  rooms: ElectricalRoom[];
};

export type DimensioningAiRequest = {
  messages: DimensioningAiMessage[];
  currentData: {
    project: DimensioningAiProjectDraft;
    rooms: ElectricalRoom[];
  };
};
