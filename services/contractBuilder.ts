import type {
  Contract,
  ContractClauses,
  ContractCompanyProfile,
  ContractMaterial,
  ContractScopeItem
} from "@/types/contracts";

export const CONTRACT_STORAGE_KEY = "volt_contracts_premium_v1";
export const CONTRACT_IMPORT_KEY = "volt_contract_import_v1";
export const CONTRACT_COMPANY_PROFILE_KEY = "volt_contract_company_profile_v1";

export type QuoteContractSource = {
  id: string;
  client: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  title: string;
  serviceType?: string;
  createdAt?: string;
  responsible?: string;
  payment?: string;
  warranty?: string;
  deadline?: string;
  notes?: string;
  items: Array<{
    kind?: string;
    code?: string;
    description: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  materials?: Array<{
    category: string;
    description: string;
    quantity: number;
    unit: string;
    specification?: string;
  }>;
};

export const defaultCompanyProfile: ContractCompanyProfile = {
  name: "Volt Soluções Elétricas",
  document: "",
  stateRegistration: "",
  address: "",
  city: "São Paulo / SP",
  email: "solucoeseletricasvolt@gmail.com",
  phone: "(11) 98878-3401",
  representative: "Guilherme Santana",
  representativeDocument: "",
  technicalResponsible: "Guilherme Santana",
  professionalRegistration: ""
};

export const defaultContractClauses: ContractClauses = {
  contractorObligations: [
    "Executar somente os serviços descritos neste contrato e em seus anexos, empregando equipe qualificada e ferramentas adequadas.",
    "Comunicar riscos, impedimentos e necessidade de alteração do escopo antes de executar serviços adicionais.",
    "Manter o local organizado durante a execução e realizar os testes previstos antes da entrega.",
    "Cumprir as regras de segurança aplicáveis à atividade e interromper o trabalho diante de condição insegura."
  ].join("\n"),
  clientObligations: [
    "Permitir acesso ao local nos horários combinados e indicar pessoa autorizada para acompanhar e aprovar decisões.",
    "Informar previamente condições ocultas conhecidas, restrições do imóvel, horários, regras de condomínio e interferências existentes.",
    "Disponibilizar as condições necessárias para execução e efetuar os pagamentos nas datas ajustadas.",
    "Não energizar, alterar ou permitir intervenção de terceiros na área em serviço sem alinhamento com a CONTRATADA."
  ].join("\n"),
  materialsResponsibility: "Os materiais expressamente relacionados neste contrato ou no orçamento vinculado seguirão a responsabilidade de fornecimento ali indicada. Marcas equivalentes somente poderão ser utilizadas mediante concordância prévia, sem redução de desempenho ou segurança. Materiais não listados dependerão de aprovação e ajuste de preço e prazo.",
  exclusions: "Não estão incluídos serviços, reparos civis, acabamentos, pinturas, equipamentos, taxas, projetos, laudos, licenças ou correções de defeitos preexistentes que não estejam descritos expressamente no escopo. Nenhuma exclusão limita direitos que a legislação aplicável assegure ao contratante.",
  changeOrders: "Qualquer alteração de quantidade, especificação, método, material, local ou prazo deverá ser registrada em aditivo, ordem de alteração ou aceite escrito, com eventual impacto de preço e cronograma apresentado antes da execução adicional.",
  unforeseenConditions: "Condições ocultas ou não identificáveis na vistoria inicial — como eletrodutos obstruídos, condutores deteriorados, ausência de aterramento, infiltrações, estruturas atingidas ou incompatibilidades — serão comunicadas ao CONTRATANTE. A continuidade do trecho afetado dependerá de solução técnica, autorização e eventual ajuste contratual.",
  siteSafety: "A CONTRATADA poderá desenergizar circuitos e suspender atividades quando houver risco, falta de acesso seguro ou interferência de terceiros. O CONTRATANTE deverá manter pessoas não autorizadas afastadas da área e respeitar sinalizações e bloqueios. A energização ocorrerá após as verificações cabíveis ao escopo.",
  testsAndAcceptance: "Concluído o escopo, serão realizados os testes e verificações previstos para os serviços contratados. Pendências serão registradas em termo de entrega. A utilização normal da instalação não impede o registro posterior de vício coberto por garantia ou por direito legal.",
  warrantyTerms: "A garantia contratual informada cobre falhas diretamente atribuíveis aos serviços executados pela CONTRATADA, contadas da entrega. Não cobre desgaste normal, mau uso, sobrecarga posterior, surtos externos, infiltração, defeitos em itens não fornecidos, alterações de terceiros ou condições preexistentes, sem prejuízo das garantias e responsabilidades previstas em lei.",
  cancellationTerms: "O contrato poderá ser encerrado por qualquer parte mediante comunicação escrita. Na rescisão, serão apurados os serviços efetivamente executados, materiais comprovadamente adquiridos para a obra e valores já pagos, preservados o equilíbrio contratual e os direitos obrigatórios previstos na legislação aplicável. Eventual penalidade somente será exigível se estiver preenchida de forma clara e válida neste instrumento.",
  latePaymentTerms: "Em caso de atraso, poderão incidir somente os encargos expressamente informados e permitidos pela legislação aplicável. A CONTRATADA poderá suspender etapas ainda não iniciadas após comunicação ao CONTRATANTE, com reprogramação proporcional do cronograma.",
  privacyTerms: "Os dados pessoais serão utilizados para elaborar, assinar, executar e comprovar este contrato, realizar comunicações, emitir documentos e cumprir obrigações legais. O acesso ficará limitado às pessoas e fornecedores necessários ao serviço, observadas medidas razoáveis de segurança e os prazos legais de conservação.",
  electronicSignatureTerms: "As partes concordam com a assinatura eletrônica deste instrumento e com o uso dos registros de data, hora, token, endereço de rede, dispositivo e manifestação de aceite como elementos de comprovação de autoria e integridade, sem impedir a adoção de modalidade de assinatura mais forte quando exigida para ato específico.",
  disputeResolution: "As partes buscarão primeiro uma solução por comunicação escrita e negociação de boa-fé. Persistindo a controvérsia, será competente o foro definido pela legislação aplicável, respeitado o foro do domicílio do consumidor quando esse direito for aplicável."
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function quoteItemTotal(item: QuoteContractSource["items"][number]) {
  const gross = Number(item.quantity || 0) * Number(item.unitPrice || 0);
  return gross * (1 - Number(item.discount || 0) / 100);
}

export function createContractFromQuote(source: QuoteContractSource, profile: ContractCompanyProfile = defaultCompanyProfile): Contract {
  const now = new Date().toISOString();
  const scopeItems: ContractScopeItem[] = source.items.map((item, index) => ({
    id: `ESCOPO-${index + 1}`,
    kind: item.kind || "Serviço",
    code: item.code || "",
    description: item.description,
    quantity: Number(item.quantity || 0),
    unit: item.unit || "un",
    unitPrice: Number(item.unitPrice || 0),
    total: quoteItemTotal(item)
  }));
  const materials: ContractMaterial[] = (source.materials ?? []).map((material, index) => ({
    id: `MATERIAL-${index + 1}`,
    category: material.category || "Outros",
    description: material.description,
    quantity: Number(material.quantity || 0),
    unit: material.unit || "un",
    specification: material.specification || ""
  }));
  const totalValue = scopeItems.reduce((sum, item) => sum + item.total, 0);

  return {
    documentType: "contract",
    schemaVersion: 1,
    id: `CONT-${String(Date.now()).slice(-6)}`,
    quoteId: source.id,
    title: `Contrato de prestação de serviços — ${source.title}`,
    createdAt: todayIso(),
    updatedAt: now,
    status: "Rascunho",
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
    client: {
      name: source.client,
      document: "",
      address: source.address || "",
      city: "",
      email: source.email || "",
      phone: source.phone || "",
      representative: source.contact || source.client,
      representativeDocument: ""
    },
    serviceLocation: source.address || "",
    objectDescription: `Prestação dos serviços elétricos descritos no orçamento ${source.id}, especialmente “${source.title}”. O escopo detalhado, as quantidades e as condições comerciais abaixo integram este contrato.`,
    scopeItems,
    materials,
    totalValue,
    paymentTerms: source.payment || "A definir antes da assinatura",
    startCondition: "Início após assinatura das partes, confirmação do pagamento inicial quando previsto, liberação segura do local e agendamento.",
    executionDeadline: source.deadline || "A definir antes da assinatura",
    scheduleNotes: "O prazo poderá ser reprogramado por alteração aprovada de escopo, indisponibilidade do local, condição insegura, caso fortuito, força maior ou atraso de obrigação indispensável da outra parte.",
    warranty: source.warranty || "A definir antes da assinatura",
    technicalResponsible: profile.technicalResponsible || source.responsible || "",
    professionalRegistration: profile.professionalRegistration,
    technicalDocuments: "ART, TRT, projeto, laudo, memorial ou relatório serão fornecidos somente quando exigíveis e expressamente incluídos no escopo ou em aditivo.",
    clauses: { ...defaultContractClauses },
    consumerRelationship: true,
    contractedOutsideBusinessPremises: true,
    additionalNotes: source.notes || "",
    history: [`Contrato criado a partir do orçamento ${source.id}`],
    contractorSignature: {
      signerName: profile.representative,
      mode: "Pendente",
      signedAt: "",
      signatureStyle: "Formal",
      acceptedTerms: false
    },
    clientSignature: {
      signerName: source.contact || source.client,
      mode: "Pendente",
      signedAt: "",
      signatureStyle: "Clássica",
      acceptedTerms: false
    },
    signatureStatus: "Pendente"
  };
}

export function createBlankContract(profile: ContractCompanyProfile = defaultCompanyProfile) {
  return createContractFromQuote({
    id: "SEM-ORCAMENTO",
    client: "",
    title: "Novo serviço elétrico",
    responsible: profile.technicalResponsible,
    payment: "A definir antes da assinatura",
    warranty: "A definir antes da assinatura",
    deadline: "A definir antes da assinatura",
    items: [{ kind: "Serviço", code: "", description: "Descrever o serviço contratado", unit: "serv.", quantity: 1, unitPrice: 0 }],
    materials: []
  }, profile);
}

export function validateContract(contract: Contract) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const required: Array<[string, string]> = [
    [contract.contractor.name, "Informe o nome ou razão social da CONTRATADA."],
    [contract.contractor.document, "Informe o CPF/CNPJ da CONTRATADA."],
    [contract.contractor.address, "Informe o endereço da CONTRATADA."],
    [contract.contractor.representative, "Informe o representante da CONTRATADA."],
    [contract.client.name, "Informe o nome ou razão social do CONTRATANTE."],
    [contract.client.document, "Informe o CPF/CNPJ do CONTRATANTE."],
    [contract.client.address, "Informe o endereço do CONTRATANTE."],
    [contract.serviceLocation, "Informe o local de execução dos serviços."],
    [contract.objectDescription, "Descreva o objeto do contrato."],
    [contract.paymentTerms, "Preencha as condições de pagamento."],
    [contract.startCondition, "Preencha as condições para início dos serviços."],
    [contract.executionDeadline, "Preencha o prazo de execução."],
    [contract.warranty, "Preencha a garantia aplicável."]
  ];
  required.forEach(([value, message]) => { if (!value.trim()) errors.push(message); });
  const clauseNames: Array<[keyof ContractClauses, string]> = [
    ["contractorObligations", "obrigações da CONTRATADA"],
    ["clientObligations", "obrigações do CONTRATANTE"],
    ["materialsResponsibility", "materiais e especificações"],
    ["exclusions", "exclusões do escopo"],
    ["changeOrders", "alterações e aditivos"],
    ["unforeseenConditions", "condições imprevistas"],
    ["siteSafety", "segurança"],
    ["testsAndAcceptance", "testes, entrega e aceite"],
    ["warrantyTerms", "garantia"],
    ["cancellationTerms", "rescisão"],
    ["latePaymentTerms", "atraso de pagamento"],
    ["privacyTerms", "privacidade"],
    ["electronicSignatureTerms", "assinatura eletrônica"],
    ["disputeResolution", "solução de controvérsias"]
  ];
  clauseNames.forEach(([key, label]) => {
    if (!contract.clauses[key].trim()) errors.push(`Preencha a cláusula de ${label}.`);
  });
  if (!contract.scopeItems.some((item) => item.description.trim())) errors.push("Inclua ao menos um item no escopo.");
  if (contract.totalValue <= 0) warnings.push("O valor total está zerado; confirme se o contrato realmente não possui cobrança.");
  if (!contract.contractor.representativeDocument.trim()) warnings.push("Documento do representante da CONTRATADA não informado.");
  if (!contract.client.representativeDocument.trim()) warnings.push("Documento do representante do CONTRATANTE não informado.");
  if (!contract.professionalRegistration.trim()) warnings.push("Registro profissional do responsável técnico não informado; confirme se é aplicável ao serviço.");
  warnings.push("Modelo contratual operacional: recomenda-se revisão jurídica antes do primeiro uso e sempre que houver situação fora do padrão.");
  return { errors, warnings };
}

export function normalizeContract(value: unknown): Contract | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<Contract>;
  if (source.documentType !== "contract" || !source.id) return null;
  const blank = createBlankContract();
  return {
    ...blank,
    ...source,
    contractor: { ...blank.contractor, ...(source.contractor ?? {}) },
    client: { ...blank.client, ...(source.client ?? {}) },
    clauses: { ...defaultContractClauses, ...(source.clauses ?? {}) },
    scopeItems: Array.isArray(source.scopeItems) ? source.scopeItems : blank.scopeItems,
    materials: Array.isArray(source.materials) ? source.materials : [],
    history: Array.isArray(source.history) ? source.history : []
  };
}
