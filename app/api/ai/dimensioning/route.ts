import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

import type {
  DimensioningAiMessage,
  DimensioningAiProjectDraft,
  DimensioningAiRequest,
  DimensioningAiResult
} from "@/types/dimensioning-ai";
import type {
  CircuitPhaseConfiguration,
  CircuitType,
  ElectricalEquipment,
  ElectricalRoom,
  ElectricalSystem,
  InstallationType,
  RoomCategory,
  RoomType,
  VoltageOption
} from "@/types/electrical";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 18;
const MAX_MESSAGE_LENGTH = 3_000;
const INSTALLATION_TYPES: InstallationType[] = ["Residencial", "Comercial", "Industrial"];
const SYSTEMS: ElectricalSystem[] = ["Monofásico", "Bifásico", "Trifásico"];
const VOLTAGES: VoltageOption[] = ["127V", "220V", "380V", "127/220V", "220/380V"];
const ROOM_TYPES: RoomType[] = ["SECO", "MOLHADO"];
const ROOM_CATEGORIES: RoomCategory[] = ["Sala", "Quarto", "Cozinha", "Banheiro", "Lavanderia", "Corredor", "Varanda", "Garagem", "Escritório", "Loja", "Outro"];
const PHASE_CONFIGURATIONS: CircuitPhaseConfiguration[] = ["F-N", "F-F", "3F"];
const CIRCUIT_TYPES: CircuitType[] = ["Iluminação", "TUG", "TUE", "Chuveiro", "Ar-condicionado", "Motor", "Outro"];

const DIMENSIONING_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "status", "questions", "assumptions", "warnings", "confidence", "project", "rooms"],
  properties: {
    reply: { type: "string" },
    status: { type: "string", enum: ["perguntando", "pronto"] },
    questions: { type: "array", items: { type: "string" } },
    assumptions: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["Alta", "Média", "Baixa"] },
    project: {
      type: "object",
      additionalProperties: false,
      required: ["projectName", "installationType", "electricalSystem", "voltage", "demandFactor", "notes"],
      properties: {
        projectName: { type: "string" },
        installationType: { type: "string", enum: INSTALLATION_TYPES },
        electricalSystem: { type: "string", enum: SYSTEMS },
        voltage: { type: "string", enum: VOLTAGES },
        demandFactor: { type: "number" },
        notes: { type: "string" }
      }
    },
    rooms: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "category", "area", "perimeter", "type", "equipments"],
        properties: {
          name: { type: "string" },
          category: { type: "string", enum: ROOM_CATEGORIES },
          area: { type: "number" },
          perimeter: { type: "number" },
          type: { type: "string", enum: ROOM_TYPES },
          equipments: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "powerWatts", "voltage", "powerFactor", "lengthMeters", "phaseConfiguration", "circuitType"],
              properties: {
                name: { type: "string" },
                powerWatts: { type: "number" },
                voltage: { type: "number" },
                powerFactor: { type: "number" },
                lengthMeters: { type: "number" },
                phaseConfiguration: { type: "string", enum: PHASE_CONFIGURATIONS },
                circuitType: { type: "string", enum: CIRCUIT_TYPES }
              }
            }
          }
        }
      }
    }
  }
} as const;

const SYSTEM_INSTRUCTION = `Você é o Assistente de Levantamento Elétrico da Volt Soluções Elétricas. Você conversa em português do Brasil e organiza os dados técnicos que alimentarão um motor determinístico de pré-dimensionamento.

REGRAS OBRIGATÓRIAS:
1. Você NÃO escolhe bitola, disjuntor, DR, DPS, queda de tensão, demanda final ou capacidade de interrupção. O motor da Volt calcula isso depois.
2. Sua função é entender, registrar e confirmar: tipo da instalação; sistema e tensão de fornecimento; ambientes; área e perímetro; cargas/equipamentos; potência nominal; tensão; fator de potência quando conhecido; configuração F-N, F-F ou 3F; e comprimento aproximado do quadro até a carga.
3. Nunca invente área, perímetro, potência, tensão, distância ou equipamento. Use zero quando o dado não foi informado e faça uma pergunta objetiva.
4. Use status "perguntando" enquanto faltar qualquer dado que altere o cálculo. Use "pronto" somente quando o levantamento estiver consistente para revisão.
5. Preserve e atualize os dados técnicos existentes recebidos no prompt. Se o usuário corrigir algo, a informação mais recente vence.
6. Classifique cozinhas, banheiros e lavanderias como MOLHADO; os demais ambientes como SECO, salvo indicação técnica diferente.
7. Para chuveiro, ar-condicionado, forno, bomba, motor e outras cargas específicas, crie um equipamento/circuito dedicado e peça potência de placa, tensão e distância se faltarem.
8. Não peça nem use nome, telefone, e-mail ou endereço completo. Somente dados técnicos entram na conversa.
9. Fator de demanda é uma premissa editável entre 0,1 e 1. Se não houver estudo de demanda, mantenha o valor atual e destaque como premissa, sem afirmar conformidade normativa.
10. Sempre avise que o resultado será um pré-dimensionamento orientativo que exige conferência no local, corrente de curto-circuito, método de instalação, agrupamento, temperatura, seletividade e revisão por profissional habilitado.
11. Retorne somente JSON válido conforme o schema.`;

function text(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function number(value: unknown, fallback = 0, min = 0, max = 1_000_000) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function redactPersonalData(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-mail removido]")
    .replace(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9?\d{4})[-\s]?\d{4}/g, "[telefone removido]")
    .replace(/\b(?:rua|avenida|av\.|alameda|travessa|estrada)\s+[^\n,]{3,80}(?:,\s*\d{1,6})?/gi, "[endereço removido]");
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? value as T : fallback;
}

function sanitizeMessages(value: unknown): DimensioningAiMessage[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-MAX_MESSAGES).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const candidate = entry as Record<string, unknown>;
    const role = candidate.role === "assistant" ? "assistant" : candidate.role === "user" ? "user" : null;
    const content = redactPersonalData(text(candidate.content, MAX_MESSAGE_LENGTH));
    return role && content ? [{ role, content }] : [];
  });
}

function normalizeEquipment(raw: unknown, roomIndex: number, equipmentIndex: number): ElectricalEquipment | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const name = text(source.name, 120);
  if (!name) return null;
  return {
    id: `AI-EQ-${roomIndex + 1}-${equipmentIndex + 1}`,
    name,
    powerWatts: number(source.powerWatts, 0, 0, 1_000_000),
    voltage: number(source.voltage, 0, 0, 1_000),
    powerFactor: number(source.powerFactor, 0.95, 0.1, 1),
    lengthMeters: number(source.lengthMeters, 0, 0, 10_000),
    phaseConfiguration: oneOf(source.phaseConfiguration, PHASE_CONFIGURATIONS, "F-N"),
    circuitType: oneOf(source.circuitType, CIRCUIT_TYPES, "TUE")
  };
}

function normalizeRooms(value: unknown): ElectricalRoom[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 80).flatMap((raw, roomIndex) => {
    if (!raw || typeof raw !== "object") return [];
    const source = raw as Record<string, unknown>;
    const name = text(source.name, 120);
    if (!name) return [];
    const equipments = Array.isArray(source.equipments)
      ? source.equipments.slice(0, 60).map((equipment, equipmentIndex) => normalizeEquipment(equipment, roomIndex, equipmentIndex)).filter((equipment): equipment is ElectricalEquipment => Boolean(equipment))
      : [];
    return [{
      id: `AI-ROOM-${roomIndex + 1}`,
      name,
      category: oneOf(source.category, ROOM_CATEGORIES, "Outro"),
      area: number(source.area, 0, 0, 100_000),
      perimeter: number(source.perimeter, 0, 0, 100_000),
      type: oneOf(source.type, ROOM_TYPES, "SECO"),
      equipments
    }];
  });
}

function normalizeProject(value: unknown, fallback?: DimensioningAiProjectDraft): DimensioningAiProjectDraft {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const base = fallback ?? {
    projectName: "Dimensionamento elétrico Volt",
    installationType: "Residencial",
    electricalSystem: "Bifásico",
    voltage: "220V",
    demandFactor: 0.8,
    notes: ""
  };
  return {
    projectName: text(source.projectName, 160) || base.projectName,
    installationType: oneOf(source.installationType, INSTALLATION_TYPES, base.installationType),
    electricalSystem: oneOf(source.electricalSystem, SYSTEMS, base.electricalSystem),
    voltage: oneOf(source.voltage, VOLTAGES, base.voltage),
    demandFactor: number(source.demandFactor, base.demandFactor, 0.1, 1),
    notes: text(source.notes, 800) || base.notes
  };
}

function sanitizeCurrentData(value: unknown) {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    project: normalizeProject(source.project),
    rooms: normalizeRooms(source.rooms)
  };
}

function stringList(value: unknown, limit = 12) {
  return Array.isArray(value) ? value.slice(0, limit).map((item) => text(item, 350)).filter(Boolean) : [];
}

function normalizeResult(raw: unknown, current: ReturnType<typeof sanitizeCurrentData>): DimensioningAiResult {
  const source = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const project = normalizeProject(source.project, current.project);
  const rooms = normalizeRooms(source.rooms);
  const questions = stringList(source.questions, 10);
  const warnings = stringList(source.warnings, 12);

  if (!rooms.length) questions.push("Quais ambientes entram no levantamento e qual a área e o perímetro de cada um?");
  rooms.forEach((room) => {
    if (room.area <= 0) questions.push(`Qual é a área aproximada do ambiente “${room.name}”?`);
    if (room.perimeter <= 0) questions.push(`Qual é o perímetro aproximado do ambiente “${room.name}”?`);
    room.equipments.forEach((equipment) => {
      if (equipment.powerWatts <= 0) questions.push(`Qual é a potência de placa de “${equipment.name}” em ${room.name}?`);
      if (equipment.voltage <= 0) questions.push(`Qual é a tensão de “${equipment.name}” em ${room.name}?`);
      if (equipment.lengthMeters <= 0) questions.push(`Qual é a distância aproximada do quadro até “${equipment.name}” em ${room.name}?`);
    });
  });

  const uniqueQuestions = [...new Set(questions)].slice(0, 10);
  const status = source.status === "pronto" && uniqueQuestions.length === 0 ? "pronto" : "perguntando";
  if (!warnings.some((warning) => /pré-dimensionamento|profissional habilitado/i.test(warning))) {
    warnings.push("O resultado será um pré-dimensionamento orientativo e deverá ser revisado por profissional habilitado após conferência no local.");
  }

  return {
    reply: text(source.reply, 1_500) || (status === "pronto" ? "Levantamento organizado. Revise a prévia e confirme antes de aplicar." : "Organizei o que você informou e preciso completar os dados abaixo."),
    status,
    questions: uniqueQuestions,
    assumptions: stringList(source.assumptions, 12),
    warnings,
    confidence: oneOf(source.confidence, ["Alta", "Média", "Baixa"] as const, "Média"),
    project,
    rooms
  };
}

function buildPrompt(messages: DimensioningAiMessage[], current: ReturnType<typeof sanitizeCurrentData>) {
  const conversation = messages.map((message, index) => `${index + 1}. ${message.role === "user" ? "USUÁRIO" : "ASSISTENTE"}: ${message.content}`).join("\n");
  return `DADOS TÉCNICOS ATUAIS DO FORMULÁRIO (sem dados pessoais):\n${JSON.stringify(current)}\n\nCONVERSA:\n${conversation}\n\nAtualize o levantamento completo conforme a conversa. Não dimensione cabos ou proteções; apenas estruture os dados e faça as perguntas técnicas que faltam.`;
}

function errorStatus(error: unknown) {
  if (!error || typeof error !== "object") return 500;
  const candidate = error as { status?: unknown; code?: unknown };
  const status = Number(candidate.status ?? candidate.code);
  return Number.isFinite(status) ? status : 500;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "O Gemini ainda não foi configurado. Adicione GEMINI_API_KEY nas variáveis de ambiente e publique novamente." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  let body: Partial<DimensioningAiRequest>;
  try {
    body = await request.json() as Partial<DimensioningAiRequest>;
  } catch {
    return NextResponse.json({ error: "Pedido inválido para o assistente técnico." }, { status: 400 });
  }

  const messages = sanitizeMessages(body.messages);
  const currentData = sanitizeCurrentData(body.currentData);
  if (!messages.some((message) => message.role === "user")) {
    return NextResponse.json({ error: "Descreva os ambientes e as cargas para começar." }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const interaction = await ai.interactions.create({
      model: process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash",
      input: buildPrompt(messages, currentData),
      store: false,
      system_instruction: SYSTEM_INSTRUCTION,
      response_format: { type: "text", mime_type: "application/json", schema: DIMENSIONING_SCHEMA },
      generation_config: { thinking_level: "low", max_output_tokens: 8_000 }
    });
    if (!interaction.output_text) throw new Error("O Gemini não retornou conteúdo.");
    return NextResponse.json(normalizeResult(JSON.parse(interaction.output_text), currentData), {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    const status = errorStatus(error);
    if (status === 429) {
      return NextResponse.json({ error: "O limite temporário do Gemini foi atingido. Aguarde um pouco e tente novamente." }, { status: 429 });
    }
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: "A chave do Gemini foi recusada. Confira GEMINI_API_KEY e as permissões no Google AI Studio." }, { status: 502 });
    }
    console.error("Falha no Assistente de Dimensionamento:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Não foi possível consultar o Gemini agora. Tente novamente em instantes." }, { status: 502 });
  }
}
