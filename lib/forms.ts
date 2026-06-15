// ============================================
// THUX · CONFIG DOS FORMS DE QUALIFICACAO
// Campos identicos nos dois forms (Prisma e Encontro).
// Ordem: nome, email, whatsapp, empresa, cargo, faturamento.
// As "keys" batem com os custom fields do GHL pra auto-mapping.
// ============================================

export type FieldType = "text" | "email" | "tel" | "options";

export interface FieldConfig {
  key: string;
  type: FieldType;
  group: string;
  title: string;
  hint?: string;
  placeholder?: string;
  autocomplete?: string;
  options?: { value: string; label: string }[];
}

export const CARGO_OPTIONS = [
  { value: "Sócio / Proprietário", label: "Sócio / Proprietário" },
  { value: "CEO / Diretor", label: "CEO / Diretor" },
  { value: "Gerente / Líder", label: "Gerente / Líder de área" },
  { value: "Outro", label: "Outro" },
];

export const FATURAMENTO_OPTIONS = [
  { value: "Até R$ 500 mil", label: "Até R$ 500 mil" },
  { value: "R$ 500 mil a R$ 1 milhão", label: "De R$ 500 mil a R$ 1 milhão" },
  { value: "R$ 1 milhão a R$ 3 milhões", label: "De R$ 1 milhão a R$ 3 milhões" },
  { value: "R$ 3 milhões a R$ 5 milhões", label: "De R$ 3 milhões a R$ 5 milhões" },
  { value: "R$ 5 milhões a R$ 10 milhões", label: "De R$ 5 milhões a R$ 10 milhões" },
  { value: "R$ 10 milhões a R$ 50 milhões", label: "De R$ 10 milhões a R$ 50 milhões" },
  { value: "R$ 50 milhões a R$ 500 milhões", label: "De R$ 50 milhões a R$ 500 milhões" },
  { value: "Acima de R$ 500 milhões", label: "Acima de R$ 500 milhões" },
];

export const FIELDS: FieldConfig[] = [
  {
    key: "nome",
    type: "text",
    group: "Identificação",
    title: "Qual é o seu nome completo?",
    hint: "A gente quer saber com quem está falando.",
    placeholder: "Digite seu nome aqui...",
    autocomplete: "name",
  },
  {
    key: "email",
    type: "email",
    group: "Contato",
    title: "Qual é o seu melhor e-mail?",
    hint: "É por onde mandamos a confirmação e os próximos passos.",
    placeholder: "nome@empresa.com.br",
    autocomplete: "email",
  },
  {
    key: "whatsapp",
    type: "tel",
    group: "Contato",
    title: "Qual é o seu WhatsApp?",
    hint: "Nosso time usa esse número pra entrar em contato.",
    placeholder: "(11) 99999-9999",
    autocomplete: "tel",
  },
  {
    key: "empresa",
    type: "text",
    group: "A empresa",
    title: "Qual é o nome da sua empresa?",
    placeholder: "Digite o nome aqui...",
    autocomplete: "organization",
  },
  {
    key: "cargo",
    type: "options",
    group: "Sobre você",
    title: "Qual é o seu cargo?",
    hint: "Selecione a opção que mais se aproxima.",
    options: CARGO_OPTIONS,
  },
  {
    key: "faturamento",
    type: "options",
    group: "A empresa",
    title: "Qual foi o faturamento da empresa em 2025?",
    hint: "Isso nos ajuda a entender se faz sentido conversar agora ou em outro momento.",
    options: FATURAMENTO_OPTIONS,
  },
];

export type Answers = Record<string, string>;

// Valor estimado da OPORTUNIDADE do lead (NAO e' venda) — usado no evento Lead do Meta Pixel.
// Espelha OPPORTUNITY_VALUE em lib/ghl.ts; manter em sincronia.
export const LEAD_VALUE_BRL = 37000;

export type FormKind = "prisma" | "encontro" | "raio-x-ia";

// Conteudo textual (sem JSX) de cada form.
export interface FormMeta {
  kind: FormKind;
  headerLabel: string;
  capaMarker: string;
  capaCta: string;
  capaMeta: { label: string; value: string }[];
  successTag: string;
  successNote: { label: string; value: string };
  // Label do botao de envio no ultimo passo (UX writing por contexto).
  submitLabel: string;
  // Opcional (lead magnet): botao na tela de sucesso + auto-redirect.
  successCta?: { label: string; href: string };
  successRedirectMs?: number;
}

// Microcopy de privacidade mostrado nos passos de e-mail e WhatsApp (reduz atrito).
export const PRIVACY_NOTE = "Seus dados ficam só com o time da Thux. Sem spam.";

export const PRISMA_META: FormMeta = {
  kind: "prisma",
  headerLabel: "Aplicação · Programa Prisma",
  capaMarker: "Programa Prisma · 90 dias dentro da empresa",
  capaCta: "Iniciar aplicação",
  capaMeta: [
    { label: "Empresas atendidas", value: "+200" },
    { label: "Receita gerada", value: "+R$ 50M" },
    { label: "Tempo de aplicação", value: "2 minutos" },
  ],
  successTag: "Aplicação recebida",
  successNote: { label: "Retorno", value: "Em até 24h úteis" },
  submitLabel: "Enviar aplicação",
};

export const ENCONTRO_META: FormMeta = {
  kind: "encontro",
  headerLabel: "Inscrição · Encontro de empresários",
  capaMarker: "Encontro de empresários · terça-feira · 10:30",
  capaCta: "Garantir minha vaga",
  capaMeta: [
    { label: "Dia", value: "Terça-feira" },
    { label: "Horário", value: "10:30" },
    { label: "Formato", value: "Online · ao vivo" },
  ],
  successTag: "Inscrição recebida",
  successNote: { label: "Sua vaga", value: "Confirmamos antes do encontro" },
  submitLabel: "Garantir minha vaga",
};

// URL pública da isca no Notion (a confirmar — se não for a página exata, trocar aqui).
export const RAIOX_NOTION_URL = "https://thux-businesshouse.notion.site/?pvs=74";

export const RAIOX_META: FormMeta = {
  kind: "raio-x-ia",
  headerLabel: "Material gratuito · Raio-X da Operação",
  capaMarker: "Raio-X da Operação · gratuito",
  capaCta: "Quero meu Raio-X",
  capaMeta: [
    { label: "Formato", value: "Prompt pra colar numa IA" },
    { label: "Tempo", value: "~5 min" },
    { label: "Custo", value: "Gratuito" },
  ],
  successTag: "Material liberado",
  successNote: { label: "Próximo passo", value: "Abrindo o material…" },
  submitLabel: "Receber meu Raio-X",
  successCta: { label: "Acessar o Raio-X da sua Operação", href: RAIOX_NOTION_URL },
  successRedirectMs: 2500,
};
