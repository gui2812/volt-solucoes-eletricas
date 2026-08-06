import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

import {
  VOLT_PRICING_CATALOG,
  VOLT_PRICING_PROMPT,
  VOLT_PRICING_RULES,
  type PricingCatalogEntry
} from "@/data/voltPricingCatalog";
import type {
  EstimatorConfidence,
  EstimatorItem,
  EstimatorItemKind,
  EstimatorMaterial,
  EstimatorMessage,
  EstimatorRequest,
  EstimatorResult,
  EstimatorTechnicalDraft
} from "@/types/orcamentista";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 16;
const MAX_MESSAGE_LENGTH = 3_000;
const ALLOWED_KINDS: EstimatorItemKind[] = ["Serviço", "Material", "Mão de obra", "Deslocamento", "Taxa"];
const ALLOWED_CONFIDENCE: EstimatorConfidence[] = ["Alta", "Média", "Baixa"];
const CATALOG_BY_CODE = new Map(VOLT_PRICING_CATALOG.map((entry) => [entry.code, entry]));

const ESTIMATE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "reply",
    "status",
    "questions",
    "assumptions",
    "warnings",
    "confidence",
    "title",
    "serviceType",
    "deadline",
    "warranty",
    "paymentSuggestion",
    "calculationSummary",
    "items",
    "materials"
  ],
  properties: {
    reply: { type: "string" },
    status: { type: "string", enum: ["perguntando", "pronto"] },
    questions: { type: "array", items: { type: "string" } },
    assumptions: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["Alta", "Média", "Baixa"] },
    title: { type: "string" },
    serviceType: { type: "string" },
    deadline: { type: "string" },
    warranty: { type: "string" },
    paymentSuggestion: { type: "string" },
    calculationSummary: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["code", "kind", "description", "unit", "quantity", "unitPrice", "unitCost", "discount", "pricingBasis", "confidence"],
        properties: {
          code: { type: "string" },
          kind: { type: "string", enum: ALLOWED_KINDS },
          description: { type: "string" },
          unit: { type: "string" },
          quantity: { type: "number" },
          unitPrice: { type: "number" },
          unitCost: { type: "number" },
          discount: { type: "number" },
          pricingBasis: { type: "string" },
          confidence: { type: "string", enum: ALLOWED_CONFIDENCE }
        }
      }
    },
    materials: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "description", "quantity", "unit", "specification"],
        properties: {
          category: { type: "string" },
          description: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
          specification: { type: "string" }
        }
      }
    }
  }
} as const;

const SYSTEM_INSTRUCTION = `Você é o Orçamentista IA da Volt Soluções Elétricas, especialista em transformar uma conversa técnica em uma proposta elétrica clara e prudente para São Paulo/SP.

REGRAS OBRIGATÓRIAS:
1. Converse em português do Brasil, de forma curta, prática e profissional.
2. Antes de fechar a estimativa, faça as perguntas que realmente mudam escopo, quantidade, tempo ou segurança. Exemplos: quantidade de pontos, distância do trajeto, instalação aparente/embutida, tensão, corrente/potência, altura, estado do quadro, fornecimento de materiais, urgência e necessidade de ajudante.
3. Use status "perguntando" enquanto faltar informação essencial. Nesse estado, devolva itens apenas como rascunho, se forem úteis, mas nunca finja que o valor está fechado.
4. Use status "pronto" somente quando houver dados suficientes para uma estimativa revisável.
5. Nunca invente preço de mercado. Para cada item precificado use exclusivamente um código da TABELA VOLT recebida no prompt. Os campos unitPrice e unitCost devem repetir os valores da tabela; o servidor fará a validação final.
6. Para serviço sem código específico, estime e justifique horas usando MO-ELETRICISTA-H e, apenas se necessário, MO-AJUDANTE-H.
7. Para material sem código/preço, use MAT-COTAR, mantenha preço e custo em zero e inclua aviso de cotação. Preserve a descrição real do material.
8. Se a prioridade justificar adicional de urgência, use TX-URGENCIA uma única vez. Não some esse adicional ao diagnóstico SRV-EMERGENCIA sem explicar o motivo.
9. Não conceda desconto automaticamente: sempre use discount igual a zero.
10. Não use dados pessoais e não peça nome, telefone, e-mail ou endereço completo. Se localização alterar deslocamento, peça apenas cidade/região ou quilometragem aproximada.
11. Não trate a estimativa como projeto ou laudo. Para dimensionamento, proteção, aterramento ou risco, registre que um profissional deve confirmar no local e respeitar as normas aplicáveis.
12. Nos materiais, considere quantidade total de condutores: por exemplo, 10 m de trajeto com fase, neutro e terra normalmente significam aproximadamente 30 m de cabo, mas confirme tensão e esquema antes de assumir.
13. Crie título, tipo de serviço, prazo, garantia e pagamento coerentes. Liste todas as premissas e alertas importantes.
14. Em reply, fale naturalmente com o usuário. Se estiver perguntando, diga o que entendeu e faça as perguntas. Se estiver pronto, resuma valor e principais premissas.
15. Retorne somente o JSON válido definido pelo schema.`;

function text(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function number(value: unknown, fallback = 0, min = 0, max = 1_000_000) {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function redactPersonalData(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[e-mail removido]")
    .replace(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9?\d{4})[-\s]?\d{4}/g, "[telefone removido]")
    .replace(/\b(?:rua|avenida|av\.|alameda|travessa|estrada)\s+[^\n,]{3,80}(?:,\s*\d{1,6})?/gi, "[endereço removido]");
}

function sanitizeMessages(value: unknown): EstimatorMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-MAX_MESSAGES)
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as Record<string, unknown>;
      const role = candidate.role === "assistant" ? "assistant" : candidate.role === "user" ? "user" : null;
      const content = redactPersonalData(text(candidate.content, MAX_MESSAGE_LENGTH));
      return role && content ? { role, content } : null;
    })
    .filter((entry): entry is EstimatorMessage => Boolean(entry));
}

function sanitizeCurrentQuote(value: unknown): EstimatorTechnicalDraft {
  const quote = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const rawItems = Array.isArray(quote.items) ? quote.items : [];
  const rawMaterials = Array.isArray(quote.materials) ? quote.materials : [];
  const priority = ["Baixa", "Média", "Alta", "Urgente"].includes(String(quote.priority))
    ? quote.priority as EstimatorTechnicalDraft["priority"]
    : "Média";

  return {
    title: text(quote.title, 160),
    serviceType: text(quote.serviceType, 120),
    priority,
    deadline: text(quote.deadline, 80),
    warranty: text(quote.warranty, 80),
    payment: text(quote.payment, 120),
    items: rawItems.slice(0, 40).flatMap((raw) => {
      if (!raw || typeof raw !== "object") return [];
      const item = raw as Record<string, unknown>;
      const kind = ALLOWED_KINDS.includes(item.kind as EstimatorItemKind) ? item.kind as EstimatorItemKind : "Serviço";
      return [{
        kind,
        description: text(item.description, 220),
        unit: text(item.unit, 24) || "un",
        quantity: number(item.quantity, 1, 0, 100_000),
        unitPrice: number(item.unitPrice, 0, 0, 1_000_000)
      }];
    }),
    materials: rawMaterials.slice(0, 80).flatMap((raw) => {
      if (!raw || typeof raw !== "object") return [];
      const material = raw as Record<string, unknown>;
      return [{
        category: text(material.category, 80) || "Outros",
        description: text(material.description, 220),
        quantity: number(material.quantity, 1, 0, 100_000),
        unit: text(material.unit, 24) || "un",
        specification: text(material.specification, 240)
      }];
    })
  };
}

function asStringList(value: unknown, maxItems = 12) {
  return Array.isArray(value)
    ? value.slice(0, maxItems).map((item) => text(item, 350)).filter(Boolean)
    : [];
}

function inferCategory(description: string) {
  const normalized = description.toLocaleLowerCase("pt-BR");
  if (/cabo|fio/.test(normalized)) return "Cabos";
  if (/eletroduto|curva|luva|canaleta|condulete/.test(normalized)) return "Infraestrutura";
  if (/quadro|caixa de distribuição/.test(normalized)) return "Quadro elétrico";
  if (/\bdr\b|dps|proteção/.test(normalized)) return "Proteção";
  if (/disjuntor/.test(normalized)) return "Disjuntores";
  if (/barramento/.test(normalized)) return "Barramentos";
  if (/tomada|interruptor|placa 4x/.test(normalized)) return "Tomadas e interruptores";
  if (/conector|wago|borne/.test(normalized)) return "Conexões";
  if (/fita|abraçadeira|bucha|parafuso|consumível/.test(normalized)) return "Consumíveis";
  return "Outros";
}

function normalizeCatalogItem(raw: unknown, warnings: string[]): EstimatorItem | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  const requestedCode = text(candidate.code, 50).toUpperCase();
  const requestedKind = ALLOWED_KINDS.includes(candidate.kind as EstimatorItemKind)
    ? candidate.kind as EstimatorItemKind
    : "Serviço";
  let entry: PricingCatalogEntry | undefined = CATALOG_BY_CODE.get(requestedCode);
  let description = text(candidate.description, 240);
  let confidence = ALLOWED_CONFIDENCE.includes(candidate.confidence as EstimatorConfidence)
    ? candidate.confidence as EstimatorConfidence
    : "Média";

  if (!entry) {
    if (requestedKind === "Serviço" || requestedKind === "Mão de obra") {
      entry = CATALOG_BY_CODE.get("MO-ELETRICISTA-H");
      description = description || "Serviço técnico estimado por hora";
      confidence = "Baixa";
      warnings.push(`O item “${description}” não tinha código na tabela e foi convertido para horas de eletricista.`);
    } else if (requestedKind === "Material") {
      entry = CATALOG_BY_CODE.get("MAT-COTAR");
      description = description || "Material a cotar";
      confidence = "Baixa";
      warnings.push(`O material “${description}” ficou sem preço e precisa de cotação.`);
    } else {
      warnings.push(`O item “${description || requestedCode || "sem descrição"}” foi ignorado porque não existe na tabela Volt.`);
      return null;
    }
  }

  if (!entry) return null;

  const quantity = number(candidate.quantity, 1, 0.01, 100_000);
  const isCustom = entry.code === "MAT-COTAR" || (!CATALOG_BY_CODE.has(requestedCode) && entry.code === "MO-ELETRICISTA-H");

  return {
    kind: entry.kind,
    code: entry.code,
    description: isCustom && description ? description : text(candidate.description, 240) || entry.description,
    unit: entry.unit,
    quantity,
    unitPrice: entry.unitPrice,
    unitCost: entry.unitCost,
    discount: 0,
    pricingBasis: entry.note,
    confidence
  };
}

function normalizeMaterial(raw: unknown): EstimatorMaterial | null {
  if (!raw || typeof raw !== "object") return null;
  const material = raw as Record<string, unknown>;
  const description = text(material.description, 240);
  if (!description) return null;

  return {
    category: text(material.category, 80) || inferCategory(description),
    description,
    quantity: number(material.quantity, 1, 0.01, 100_000),
    unit: text(material.unit, 24) || "un",
    specification: text(material.specification, 260)
  };
}

function currency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizeResult(raw: unknown): EstimatorResult {
  const source = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
  const warnings = asStringList(source.warnings);
  let items = Array.isArray(source.items)
    ? source.items.slice(0, 40).map((item) => normalizeCatalogItem(item, warnings)).filter((item): item is EstimatorItem => Boolean(item))
    : [];

  const urgencyIndex = items.findIndex((item) => item.code === "TX-URGENCIA");
  if (urgencyIndex >= 0) {
    items = items.filter((item, index) => item.code !== "TX-URGENCIA" || index === urgencyIndex);
    const serviceSubtotal = items.reduce((sum, item) => {
      return item.kind === "Serviço" || item.kind === "Mão de obra"
        ? sum + item.quantity * item.unitPrice
        : sum;
    }, 0);
    items[urgencyIndex] = {
      ...items[urgencyIndex],
      quantity: 1,
      unit: "taxa",
      unitPrice: roundMoney(serviceSubtotal * (VOLT_PRICING_RULES.urgencyPercent / 100)),
      unitCost: 0,
      pricingBasis: `${VOLT_PRICING_RULES.urgencyPercent}% sobre serviços e mão de obra (${currency(serviceSubtotal)}).`
    };
  }

  const status = source.status === "pronto" ? "pronto" : "perguntando";
  const billableServiceSubtotal = items.reduce((sum, item) => {
    return item.kind !== "Material" && item.code !== "TX-URGENCIA"
      ? sum + item.quantity * item.unitPrice
      : sum;
  }, 0);

  if (status === "pronto" && billableServiceSubtotal > 0 && billableServiceSubtotal < VOLT_PRICING_RULES.minimumVisit) {
    const difference = roundMoney(VOLT_PRICING_RULES.minimumVisit - billableServiceSubtotal);
    items.push({
      kind: "Taxa",
      code: "TX-MINIMO",
      description: "Complemento do valor mínimo de atendimento",
      unit: "taxa",
      quantity: 1,
      unitPrice: difference,
      unitCost: 0,
      discount: 0,
      pricingBasis: `Regra interna: mínimo de ${currency(VOLT_PRICING_RULES.minimumVisit)} em serviços e atendimento.`,
      confidence: "Alta"
    });
  }

  const proposedMaterials = Array.isArray(source.materials)
    ? source.materials.slice(0, 80).map(normalizeMaterial).filter((item): item is EstimatorMaterial => Boolean(item))
    : [];
  const pricedMaterials = items.flatMap((item) => {
    if (item.kind !== "Material") return [];
    const catalog = CATALOG_BY_CODE.get(item.code);
    return [{
      category: catalog?.category || inferCategory(item.description),
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      specification: item.code === "MAT-COTAR" ? "Preço e especificação a confirmar antes do envio." : catalog?.note || ""
    } satisfies EstimatorMaterial];
  });

  const seenMaterials = new Set<string>();
  const materials = [...proposedMaterials, ...pricedMaterials].filter((material) => {
    const key = `${material.description.toLocaleLowerCase("pt-BR")}|${material.unit.toLocaleLowerCase("pt-BR")}`;
    if (seenMaterials.has(key)) return false;
    seenMaterials.add(key);
    return true;
  });

  const totalSuggested = roundMoney(items.reduce((sum, item) => {
    const gross = item.quantity * item.unitPrice;
    return sum + gross - gross * (item.discount / 100);
  }, 0));
  const calculatedLines = items
    .filter((item) => item.unitPrice > 0)
    .slice(0, 12)
    .map((item) => `${item.quantity} ${item.unit} × ${currency(item.unitPrice)} = ${currency(item.quantity * item.unitPrice)}`);
  const rawSummary = text(source.calculationSummary, 1_000);
  const questions = asStringList(source.questions, 8);

  if (items.some((item) => item.code === "MAT-COTAR") && !warnings.some((warning) => /cotação|cotar/i.test(warning))) {
    warnings.push("Há materiais sem referência de preço; faça a cotação antes de enviar a proposta.");
  }

  return {
    reply: text(source.reply, 1_500) || (status === "pronto" ? `Preparei uma estimativa de ${currency(totalSuggested)} para sua revisão.` : "Preciso de mais alguns detalhes para calcular com segurança."),
    status,
    questions,
    assumptions: asStringList(source.assumptions),
    warnings,
    confidence: ALLOWED_CONFIDENCE.includes(source.confidence as EstimatorConfidence) ? source.confidence as EstimatorConfidence : "Média",
    title: text(source.title, 160) || "Serviço elétrico",
    serviceType: text(source.serviceType, 120) || "Instalação elétrica",
    deadline: text(source.deadline, 80) || "A definir",
    warranty: text(source.warranty, 80) || VOLT_PRICING_RULES.standardWarranty,
    paymentSuggestion: text(source.paymentSuggestion, 120) || VOLT_PRICING_RULES.standardPayment,
    calculationSummary: [rawSummary, calculatedLines.join("; ")].filter(Boolean).join(" — ").slice(0, 2_000),
    items,
    materials,
    totalSuggested
  };
}

function buildPrompt(messages: EstimatorMessage[], currentQuote: EstimatorTechnicalDraft) {
  const conversation = messages
    .map((message, index) => `${index + 1}. ${message.role === "user" ? "USUÁRIO" : "ORÇAMENTISTA"}: ${message.content}`)
    .join("\n");

  return `TABELA VOLT (fonte exclusiva de preços):
REGRAS: ${JSON.stringify(VOLT_PRICING_RULES)}
ITENS: ${JSON.stringify(VOLT_PRICING_PROMPT)}

RASCUNHO TÉCNICO ATUAL (não contém dados pessoais):
${JSON.stringify(currentQuote)}

CONVERSA ATÉ AGORA:
${conversation}

Analise a última mensagem junto com todo o histórico. Campos genéricos como “Novo orçamento”, “Instalação elétrica”, “A definir” e item com valor zero são apenas placeholders e não confirmam escopo. Faça perguntas essenciais ou entregue a estimativa pronta no JSON solicitado.`;
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
      { error: "O Gemini ainda não foi configurado. Adicione GEMINI_API_KEY nas variáveis de ambiente da Vercel e publique novamente." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  let body: Partial<EstimatorRequest>;

  try {
    body = await request.json() as Partial<EstimatorRequest>;
  } catch {
    return NextResponse.json({ error: "Pedido inválido para o orçamentista." }, { status: 400 });
  }

  const messages = sanitizeMessages(body.messages);
  const currentQuote = sanitizeCurrentQuote(body.currentQuote);

  if (!messages.some((message) => message.role === "user")) {
    return NextResponse.json({ error: "Descreva o serviço para iniciar a estimativa." }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const interaction = await ai.interactions.create({
      model: process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash",
      input: buildPrompt(messages, currentQuote),
      store: false,
      system_instruction: SYSTEM_INSTRUCTION,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: ESTIMATE_SCHEMA
      },
      generation_config: {
        thinking_level: "low",
        max_output_tokens: 8_000
      }
    });

    if (!interaction.output_text) {
      throw new Error("O Gemini não retornou conteúdo para a estimativa.");
    }

    const result = normalizeResult(JSON.parse(interaction.output_text));

    return NextResponse.json(result, {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    const status = errorStatus(error);

    if (status === 429) {
      return NextResponse.json(
        { error: "O limite temporário do Gemini foi atingido. Aguarde um pouco e tente novamente." },
        { status: 429, headers: { "Cache-Control": "no-store" } }
      );
    }

    if (status === 401 || status === 403) {
      return NextResponse.json(
        { error: "A chave do Gemini foi recusada. Confira GEMINI_API_KEY e as permissões do projeto no Google AI Studio." },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    console.error("Falha no Orçamentista IA:", error instanceof Error ? error.message : error);

    return NextResponse.json(
      { error: "Não foi possível consultar o Gemini agora. Tente novamente em instantes." },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
