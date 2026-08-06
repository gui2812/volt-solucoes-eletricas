import type { EstimatorItemKind } from "@/types/orcamentista";

export type PricingCatalogEntry = {
  code: string;
  kind: EstimatorItemKind;
  description: string;
  aliases: string[];
  unit: string;
  unitPrice: number;
  unitCost: number;
  note: string;
  category?: string;
};

/**
 * Tabela inicial da Volt. Os valores são referências internas editáveis, não
 * uma consulta de mercado em tempo real. Ajuste-os conforme custos, região e
 * margem praticados pela empresa.
 */
export const VOLT_PRICING_RULES = {
  currency: "BRL",
  region: "São Paulo/SP",
  minimumVisit: 180,
  electricianHourlyRate: 95,
  electricianHourlyCost: 48,
  helperHourlyRate: 55,
  helperHourlyCost: 30,
  urgencyPercent: 25,
  standardWarranty: "90 dias",
  standardPayment: "50% de entrada + 50% na conclusão"
};

export const VOLT_PRICING_CATALOG: PricingCatalogEntry[] = [
  {
    code: "SRV-VISITA",
    kind: "Serviço",
    description: "Visita técnica e diagnóstico elétrico",
    aliases: ["visita", "avaliação", "diagnóstico", "levantamento"],
    unit: "visita",
    unitPrice: 180,
    unitCost: 70,
    note: "Valor mínimo para atendimento programado na região-base."
  },
  {
    code: "SRV-EMERGENCIA",
    kind: "Serviço",
    description: "Diagnóstico elétrico emergencial",
    aliases: ["emergência", "curto", "sem energia", "disjuntor desarmando", "operação parada"],
    unit: "visita",
    unitPrice: 380,
    unitCost: 140,
    note: "Diagnóstico inicial emergencial; reparos e materiais são separados."
  },
  {
    code: "SRV-TOMADA",
    kind: "Mão de obra",
    description: "Instalação ou substituição de tomada em ponto existente",
    aliases: ["tomada", "trocar tomada", "instalar tomada", "ponto de tomada"],
    unit: "ponto",
    unitPrice: 95,
    unitCost: 45,
    note: "Ponto existente e sem passagem de circuito novo; material separado."
  },
  {
    code: "SRV-TOMADA-DEDICADA",
    kind: "Mão de obra",
    description: "Instalação de circuito dedicado para tomada",
    aliases: ["tomada dedicada", "micro-ondas", "forno", "lava-louças", "circuito dedicado"],
    unit: "ponto",
    unitPrice: 280,
    unitCost: 120,
    note: "Até 10 m de trajeto acessível; cabos, proteção e acabamento separados."
  },
  {
    code: "SRV-LUMINARIA",
    kind: "Mão de obra",
    description: "Instalação ou substituição de luminária em ponto existente",
    aliases: ["luminária", "plafon", "spot", "pendente", "lâmpada"],
    unit: "ponto",
    unitPrice: 90,
    unitCost: 42,
    note: "Altura comum, ponto pronto e sem andaime; equipamento separado."
  },
  {
    code: "SRV-CHUVEIRO",
    kind: "Mão de obra",
    description: "Instalação ou substituição de chuveiro elétrico",
    aliases: ["chuveiro", "ducha elétrica"],
    unit: "un",
    unitPrice: 220,
    unitCost: 95,
    note: "Circuito existente em condição adequada; chuveiro e correções separados."
  },
  {
    code: "SRV-DISJUNTOR",
    kind: "Mão de obra",
    description: "Substituição de disjuntor em quadro existente",
    aliases: ["trocar disjuntor", "substituir disjuntor", "disjuntor"],
    unit: "un",
    unitPrice: 120,
    unitCost: 52,
    note: "Inclui desenergização, substituição e teste; peça separada."
  },
  {
    code: "SRV-DR-DPS",
    kind: "Mão de obra",
    description: "Instalação de dispositivo DR ou DPS em quadro existente",
    aliases: ["dr", "dps", "proteção contra choque", "proteção contra surto"],
    unit: "un",
    unitPrice: 180,
    unitCost: 80,
    note: "Quadro com espaço e barramentos adequados; dispositivo separado."
  },
  {
    code: "SRV-CIRCUITO-NOVO",
    kind: "Mão de obra",
    description: "Passagem e ligação de circuito elétrico novo",
    aliases: ["circuito novo", "passar fiação", "novo circuito", "alimentação nova"],
    unit: "circuito",
    unitPrice: 350,
    unitCost: 160,
    note: "Até 10 m em infraestrutura acessível; cabos e infraestrutura separados."
  },
  {
    code: "SRV-CANALETA",
    kind: "Mão de obra",
    description: "Instalação de infraestrutura aparente com canaleta ou eletroduto",
    aliases: ["canaleta", "eletroduto", "infraestrutura aparente", "condulete"],
    unit: "m",
    unitPrice: 32,
    unitCost: 14,
    note: "Trajeto comum e acessível; material e serviços civis separados."
  },
  {
    code: "SRV-QDC-ORGANIZAR",
    kind: "Mão de obra",
    description: "Organização, reaperto e identificação de quadro elétrico",
    aliases: ["organizar quadro", "identificar quadro", "reaperto", "qdc"],
    unit: "quadro",
    unitPrice: 950,
    unitCost: 380,
    note: "Quadro de porte residencial/comercial pequeno; correções e peças separadas."
  },
  {
    code: "SRV-QDC-12",
    kind: "Mão de obra",
    description: "Montagem ou substituição de quadro de até 12 módulos",
    aliases: ["quadro 12 módulos", "qdc 12", "troca de quadro pequeno"],
    unit: "quadro",
    unitPrice: 850,
    unitCost: 400,
    note: "Mão de obra para quadro de até 12 módulos; componentes separados."
  },
  {
    code: "SRV-QDC-24",
    kind: "Mão de obra",
    description: "Montagem ou substituição de quadro de até 24 módulos",
    aliases: ["quadro 24 módulos", "qdc 24", "troca de quadro médio"],
    unit: "quadro",
    unitPrice: 1400,
    unitCost: 680,
    note: "Mão de obra para quadro de até 24 módulos; componentes separados."
  },
  {
    code: "SRV-AUTOMACAO",
    kind: "Mão de obra",
    description: "Instalação e configuração de automação de iluminação",
    aliases: ["automação", "interruptor inteligente", "smart", "sensor inteligente"],
    unit: "ponto",
    unitPrice: 180,
    unitCost: 80,
    note: "Configuração padrão em rede disponível; dispositivos separados."
  },
  {
    code: "SRV-PREVENTIVA",
    kind: "Serviço",
    description: "Manutenção elétrica preventiva programada",
    aliases: ["preventiva", "manutenção mensal", "inspeção preventiva"],
    unit: "visita",
    unitPrice: 780,
    unitCost: 330,
    note: "Visita de até um dia para instalação de pequeno porte; peças separadas."
  },
  {
    code: "SRV-ATERRAMENTO",
    kind: "Serviço",
    description: "Medição básica de aterramento e inspeção de conexões",
    aliases: ["aterramento", "medir terra", "haste de terra"],
    unit: "visita",
    unitPrice: 280,
    unitCost: 120,
    note: "Medição orientativa e inspeção visual; laudo técnico formal separado."
  },
  {
    code: "SRV-RELATORIO",
    kind: "Serviço",
    description: "Relatório técnico com registro fotográfico",
    aliases: ["relatório", "fotos", "documentação técnica"],
    unit: "relatório",
    unitPrice: 450,
    unitCost: 190,
    note: "Relatório descritivo; não equivale a laudo com ART."
  },
  {
    code: "MO-ELETRICISTA-H",
    kind: "Mão de obra",
    description: "Eletricista técnico",
    aliases: ["eletricista", "hora técnica", "hora de mão de obra"],
    unit: "h",
    unitPrice: 95,
    unitCost: 48,
    note: "Usar para escopos sem preço fechado conhecido, com horas justificadas."
  },
  {
    code: "MO-AJUDANTE-H",
    kind: "Mão de obra",
    description: "Ajudante de eletricista",
    aliases: ["ajudante", "auxiliar"],
    unit: "h",
    unitPrice: 55,
    unitCost: 30,
    note: "Somente quando o serviço realmente exigir segunda pessoa."
  },
  {
    code: "DES-URBANO",
    kind: "Deslocamento",
    description: "Deslocamento urbano na região-base",
    aliases: ["deslocamento", "visita em são paulo", "transporte"],
    unit: "desloc.",
    unitPrice: 80,
    unitCost: 40,
    note: "Atendimento programado dentro da região-base."
  },
  {
    code: "DES-KM",
    kind: "Deslocamento",
    description: "Deslocamento fora da região-base",
    aliases: ["quilometragem", "fora da região", "viagem"],
    unit: "km",
    unitPrice: 3.2,
    unitCost: 1.8,
    note: "Quantidade deve representar a quilometragem total de ida e volta."
  },
  {
    code: "TX-URGENCIA",
    kind: "Taxa",
    description: "Adicional de urgência",
    aliases: ["urgente", "emergencial", "fora do horário", "mesmo dia"],
    unit: "taxa",
    unitPrice: 25,
    unitCost: 0,
    note: "O servidor recalcula este item como 25% dos serviços e da mão de obra."
  },
  {
    code: "MAT-TOMADA-10A",
    kind: "Material",
    description: "Conjunto de tomada 2P+T 10 A",
    aliases: ["tomada 10a", "tomada comum"],
    unit: "un",
    unitPrice: 28,
    unitCost: 18,
    note: "Referência para linha intermediária; confirmar marca e acabamento.",
    category: "Tomadas e interruptores"
  },
  {
    code: "MAT-TOMADA-20A",
    kind: "Material",
    description: "Conjunto de tomada 2P+T 20 A",
    aliases: ["tomada 20a", "tomada dedicada"],
    unit: "un",
    unitPrice: 34,
    unitCost: 22,
    note: "Referência para linha intermediária; confirmar marca e acabamento.",
    category: "Tomadas e interruptores"
  },
  {
    code: "MAT-DISJ-1P",
    kind: "Material",
    description: "Disjuntor termomagnético monopolar",
    aliases: ["disjuntor 1p", "disjuntor monopolar"],
    unit: "un",
    unitPrice: 45,
    unitCost: 28,
    note: "Confirmar corrente nominal, curva e poder de interrupção.",
    category: "Disjuntores"
  },
  {
    code: "MAT-DISJ-2P",
    kind: "Material",
    description: "Disjuntor termomagnético bipolar",
    aliases: ["disjuntor 2p", "disjuntor bipolar"],
    unit: "un",
    unitPrice: 85,
    unitCost: 55,
    note: "Confirmar corrente nominal, curva e poder de interrupção.",
    category: "Disjuntores"
  },
  {
    code: "MAT-DR-2P",
    kind: "Material",
    description: "Interruptor diferencial residual DR bipolar",
    aliases: ["dr bipolar", "idr", "interruptor dr"],
    unit: "un",
    unitPrice: 210,
    unitCost: 145,
    note: "Confirmar corrente nominal e sensibilidade.",
    category: "Proteção"
  },
  {
    code: "MAT-DPS",
    kind: "Material",
    description: "Dispositivo de proteção contra surtos DPS",
    aliases: ["dps", "protetor de surto"],
    unit: "un",
    unitPrice: 85,
    unitCost: 52,
    note: "Confirmar classe, tensão e capacidade de descarga.",
    category: "Proteção"
  },
  {
    code: "MAT-CABO-1.5",
    kind: "Material",
    description: "Cabo flexível 750 V 1,5 mm²",
    aliases: ["cabo 1,5", "fio 1,5"],
    unit: "m",
    unitPrice: 3.3,
    unitCost: 2.2,
    note: "Quantidade total dos condutores; confirmar cores.",
    category: "Cabos"
  },
  {
    code: "MAT-CABO-2.5",
    kind: "Material",
    description: "Cabo flexível 750 V 2,5 mm²",
    aliases: ["cabo 2,5", "fio 2,5"],
    unit: "m",
    unitPrice: 4.8,
    unitCost: 3.2,
    note: "Quantidade total dos condutores; confirmar cores.",
    category: "Cabos"
  },
  {
    code: "MAT-CABO-4",
    kind: "Material",
    description: "Cabo flexível 750 V 4 mm²",
    aliases: ["cabo 4", "fio 4"],
    unit: "m",
    unitPrice: 7.5,
    unitCost: 5.2,
    note: "Quantidade total dos condutores; confirmar cores.",
    category: "Cabos"
  },
  {
    code: "MAT-CABO-6",
    kind: "Material",
    description: "Cabo flexível 750 V 6 mm²",
    aliases: ["cabo 6", "fio 6"],
    unit: "m",
    unitPrice: 10.5,
    unitCost: 7.4,
    note: "Quantidade total dos condutores; confirmar cores.",
    category: "Cabos"
  },
  {
    code: "MAT-ELETRODUTO-20",
    kind: "Material",
    description: "Eletroduto corrugado ou rígido de 20 mm",
    aliases: ["eletroduto 20", "conduíte 20"],
    unit: "m",
    unitPrice: 4.8,
    unitCost: 3.2,
    note: "Confirmar tipo de instalação e classe do eletroduto.",
    category: "Infraestrutura"
  },
  {
    code: "MAT-CANALETA",
    kind: "Material",
    description: "Canaleta aparente com tampa",
    aliases: ["canaleta", "canaleta pvc"],
    unit: "m",
    unitPrice: 8.5,
    unitCost: 5.7,
    note: "Referência para seção pequena; confirmar dimensão e acabamento.",
    category: "Infraestrutura"
  },
  {
    code: "MAT-CONECTOR",
    kind: "Material",
    description: "Conector de emenda reutilizável",
    aliases: ["conector", "wago", "borne"],
    unit: "un",
    unitPrice: 5.5,
    unitCost: 3.2,
    note: "Confirmar número de vias e bitola.",
    category: "Conexões"
  },
  {
    code: "MAT-LUMINARIA-LED",
    kind: "Material",
    description: "Luminária LED de sobrepor padrão",
    aliases: ["luminária led", "plafon led"],
    unit: "un",
    unitPrice: 75,
    unitCost: 50,
    note: "Referência; potência, formato e temperatura de cor devem ser confirmados.",
    category: "Outros"
  },
  {
    code: "MAT-QDC-12",
    kind: "Material",
    description: "Quadro de distribuição para até 12 módulos",
    aliases: ["quadro 12", "qdc 12"],
    unit: "un",
    unitPrice: 220,
    unitCost: 155,
    note: "Gabinete vazio; proteções e barramentos podem ser separados.",
    category: "Quadro elétrico"
  },
  {
    code: "MAT-QDC-24",
    kind: "Material",
    description: "Quadro de distribuição para até 24 módulos",
    aliases: ["quadro 24", "qdc 24"],
    unit: "un",
    unitPrice: 360,
    unitCost: 250,
    note: "Gabinete vazio; proteções e barramentos podem ser separados.",
    category: "Quadro elétrico"
  },
  {
    code: "MAT-BARRAMENTO-KIT",
    kind: "Material",
    description: "Kit de barramentos de neutro e proteção",
    aliases: ["barramento", "kit barramento"],
    unit: "kit",
    unitPrice: 145,
    unitCost: 95,
    note: "Confirmar capacidade e compatibilidade com o quadro.",
    category: "Barramentos"
  },
  {
    code: "MAT-CONSUMIVEIS",
    kind: "Material",
    description: "Kit de consumíveis elétricos e fixação",
    aliases: ["fita isolante", "abraçadeira", "parafuso", "consumíveis"],
    unit: "kit",
    unitPrice: 45,
    unitCost: 25,
    note: "Pequenos conectores, fixadores, identificação e isolação.",
    category: "Consumíveis"
  },
  {
    code: "MAT-COTAR",
    kind: "Material",
    description: "Material com preço a confirmar",
    aliases: ["material sem preço", "equipamento específico", "cotação necessária"],
    unit: "un",
    unitPrice: 0,
    unitCost: 0,
    note: "Use para item sem referência na tabela; mantenha valor zero e avise que precisa de cotação.",
    category: "Outros"
  }
];

export const VOLT_PRICING_PROMPT = VOLT_PRICING_CATALOG.map((entry) => ({
  code: entry.code,
  kind: entry.kind,
  description: entry.description,
  aliases: entry.aliases,
  unit: entry.unit,
  unitPrice: entry.unitPrice,
  unitCost: entry.unitCost,
  note: entry.note,
  category: entry.category ?? ""
}));
