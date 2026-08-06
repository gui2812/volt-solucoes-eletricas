[README.md](https://github.com/user-attachments/files/30801416/README.md)
# Volt Soluções Elétricas — Sistema Profissional v4

Projeto profissional em **Next.js + TypeScript + React Three Fiber + Zustand + Tailwind CSS**, preparado para deploy na **Vercel**.

## Central Técnica IA — levantamento e pré-dimensionamento

- A antiga área de Sistemas Técnicos foi reaproveitada como **Central Técnica IA**.
- O Assistente Técnico conversa pelo Gemini, coleta ambientes, medidas, tensão, cargas, potência de placa e distâncias e só aplica o levantamento após confirmação.
- A IA não escolhe cabos ou disjuntores. Um motor determinístico calcula corrente, combinação `Ib ≤ In ≤ Iz`, queda de tensão, polos, curva preliminar e balanceamento de fases.
- A lista de materiais agrega cabos, disjuntores, infraestrutura, DR, DPS, quadro, tomadas, pontos de iluminação e interruptores, sempre com observações de conferência.
- O resultado pode gerar um QDC visual, um memorial de pré-dimensionamento em PDF e um novo orçamento já preenchido com a relação de materiais.
- Critérios e premissas estão identificados pela versão `VOLT-BT-2026.1` e foram escritos como orientação, não como promessa de conformidade automática.

Antes da execução, um profissional habilitado deve confirmar as condições reais, método de instalação, temperatura, agrupamento, aterramento, harmônicas, partida de motores, corrente de curto-circuito, capacidade de interrupção, seletividade, regras da concessionária e a edição licenciada e vigente das normas aplicáveis.

## Orçamentista IA com Gemini

- O editor de orçamentos agora possui um chat que entende a descrição do serviço e faz perguntas antes de calcular.
- A IA sugere serviços, mão de obra, materiais, deslocamento, prazo, garantia e pagamento.
- Os preços vêm da tabela interna em `data/voltPricingCatalog.ts`. O Gemini seleciona os códigos, e o servidor confere os valores antes de devolver a proposta.
- Itens fora da tabela usam horas técnicas ou ficam marcados como material a cotar; a IA não deve inventar preço.
- A sugestão só entra no orçamento depois da confirmação do usuário e continua totalmente editável.
- Nome, telefone, e-mail e endereço do cliente não são enviados automaticamente ao Gemini.

### Configuração local

1. Crie uma chave da Gemini API em [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Copie `.env.example` para `.env.local`.
3. Preencha `GEMINI_API_KEY` sem colocar a chave no código ou no GitHub.
4. Execute `npm install` e depois `npm run dev`.

O modelo padrão é `gemini-3.6-flash`. Para trocar, altere `GEMINI_MODEL`.

### Configuração na Vercel

No projeto da Vercel, abra **Settings → Environment Variables**, cadastre `GEMINI_API_KEY` e `GEMINI_MODEL` e faça um novo deploy. A chave é usada somente pela rota segura do servidor.

Antes de usar em propostas reais, revise os valores, custos e regras em `data/voltPricingCatalog.ts` para refletirem a tabela praticada pela Volt.

## Lista de materiais no orçamento

- O editor de orçamentos possui uma área separada para os materiais necessários.
- A lista pode ser preenchida item a item, copiada dos itens de material ou importada em lote.
- Esses materiais não alteram o valor total do orçamento.
- O PDF gera páginas próprias para a relação de materiais, com paginação automática e o mesmo padrão visual da proposta comercial.
- A aprovação e as assinaturas ficam organizadas em uma página exclusiva.

## Correções da v3

- Landing page pública reconstruída com visual de site profissional.
- Painel interno refeito com layout premium, sidebar organizada e header superior.
- Dashboard deixou de ser tela genérica e virou central de controle.
- Módulos ficaram com cadastro, busca, resumo, exportação CSV e visual mais profissional.
- Mantido o simulador QDC 3D em `/circuitos`.
- Configuração compatível com Vercel usando `next.config.mjs`.

## Login inicial

Usuário: `Gui2812`  
Senha: `volt2026`

## Deploy

Suba o conteúdo desta pasta no GitHub e deixe a Vercel publicar automaticamente.

Framework detectado: **Next.js**  
Build command: `npm run build`

## Observação técnica

As validações elétricas são orientativas. O projeto final deve ser revisado por profissional habilitado.
