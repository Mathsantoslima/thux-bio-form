// ============================================
// THUX · INTEGRACAO GHL (GoHighLevel / LeadConnector)
// Cria o contato no GHL com custom fields, tags de faturamento e
// qualificacao (>= R$3M = MQL). IDs do pipeline Thux ja vem do vault;
// o dev so precisa plugar o GHL_API_TOKEN no ambiente.
//
// Envs (.env):
//   GHL_API_TOKEN          (obrigatorio p/ enviar de verdade; Private Integration / API v2)
//   GHL_LOCATION_ID        (default: location Thux do vault)
//   GHL_MQL_SCORE_FIELD_ID (opcional: grava o score 0-100 no custom field)
//
// Sem GHL_API_TOKEN o /api/lead roda em "modo preview": valida e loga,
// sem chamar o GHL. Isso deixa a validacao visual rodando sem credencial.
// ============================================

import type { Answers } from "./forms";
import type { AttributionData } from "./attribution";

// Defaults do pipeline Thux (vault clientes/THUX.md)
const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";
const DEFAULT_LOCATION_ID = "KKNHDTekS1dDPnUnyeVF";
const THUX_PIPELINE_ID = "WdobuKIzajvmijLpVPNE";
const THUX_STAGE_LEAD_ID = "377b3016-caaf-4b36-abec-5b41e1ad852b";

// IDs dos custom fields (model contact) da location Thux — a API v2 e' confiavel por ID.
const CF = {
  empresa: "VrYNE1xc6U11HEPXjT0F",
  cargo: "XDjuRjDyNUGKJQe0m9gV",
  faixa: "BiqosS0qlIwdEorljTxe",
  score: "subhYfsn6VOEAT3UxNja", // MQL Score (NUMERICAL)
  // UTM / atribuicao (criados em 04/06 — ver plano)
  utmSource: "1trkGye1P1B4QfFuqI8N",
  utmMedium: "V7Bz8uQNivhe8LyfF1Xp",
  utmCampaign: "ZVaFupomb7zuo9OOBLaP",
  utmTerm: "LUvg4ZSpUSZ7RMJr24LI",
  utmContent: "5AQgIeqg9s4j7qWgL5Vi",
  fbclid: "Zxp17M6LEUZKaOYEzJ8N",
  gclid: "hrLighwrrrnwlCzuC8sb",
};

// Config por formulario. Pra adicionar um form novo, basta uma linha aqui.
const FORM_CONFIG: Record<"prisma" | "encontro", { source: string; tag: string }> = {
  prisma: { source: "Bio · Aplicação Prisma", tag: "prisma" },
  encontro: { source: "Bio · Encontro", tag: "encontro" },
};

// Valor padrao da oportunidade — produto Prisma. Vale p/ todos os forms (Prisma e Encontro).
const OPPORTUNITY_PRODUCT = "Prisma";
const OPPORTUNITY_VALUE = 37000; // GHL grava na moeda da location (BRL) -> R$ 37.000,00
const OPPORTUNITY_VALUE_LABEL = "R$ 37.000,00";

// Tabela de scoring MQL (vault: cargo + faturamento, 0-100)
const CARGO_SCORE: Record<string, number> = {
  "Sócio / Proprietário": 50,
  "CEO / Diretor": 40,
  "Gerente / Líder": 15,
  Outro: 5,
};

const FATURAMENTO_SCORE: Record<string, number> = {
  "Até R$ 500 mil": 0,
  "R$ 500 mil a R$ 1 milhão": 10,
  "R$ 1 milhão a R$ 3 milhões": 30,
  "R$ 3 milhões a R$ 5 milhões": 50,
  "R$ 5 milhões a R$ 10 milhões": 50,
  "R$ 10 milhões a R$ 50 milhões": 35,
  "R$ 50 milhões a R$ 500 milhões": 20,
  "Acima de R$ 500 milhões": 10,
};

// Faixas qualificadas (>= R$3M) -> regra do Ruan (vault, 04/06)
const FATURAMENTO_TAG: Record<string, { tag: string; qualified: boolean }> = {
  "Até R$ 500 mil": { tag: "fat-ate-3m", qualified: false },
  "R$ 500 mil a R$ 1 milhão": { tag: "fat-ate-3m", qualified: false },
  "R$ 1 milhão a R$ 3 milhões": { tag: "fat-ate-3m", qualified: false },
  "R$ 3 milhões a R$ 5 milhões": { tag: "fat-3m-5m", qualified: true },
  "R$ 5 milhões a R$ 10 milhões": { tag: "fat-5m-10m", qualified: true },
  "R$ 10 milhões a R$ 50 milhões": { tag: "fat-10m-50m", qualified: true },
  "R$ 50 milhões a R$ 500 milhões": { tag: "fat-50m-500m", qualified: true },
  "Acima de R$ 500 milhões": { tag: "fat-acima-500m", qualified: true },
};

export function scoreLead(cargo?: string, faturamento?: string): number {
  const c = (cargo && CARGO_SCORE[cargo]) || 0;
  const f = (faturamento && FATURAMENTO_SCORE[faturamento]) || 0;
  return Math.min(100, c + f);
}

export function tier(score: number): "mql-hot" | "mql-warm" | "mql-cold" {
  if (score >= 70) return "mql-hot";
  if (score >= 40) return "mql-warm";
  return "mql-cold";
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

// E.164 BR: 55 + DDD + numero
function toE164(whatsapp: string): string {
  const digits = (whatsapp || "").replace(/\D/g, "");
  if (digits.startsWith("55")) return "+" + digits;
  return "+55" + digits;
}

export interface GhlResult {
  ok: boolean;
  mode: "ghl" | "preview";
  status?: number;
  contactId?: string;
  opportunityId?: string;
  qualified: boolean;
  score: number;
  error?: string;
}

// Headers padrao da API v2 do LeadConnector.
function ghlHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Version: GHL_API_VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

// Fonte (source) da oportunidade — origem inteligente:
// utm_source [/ utm_medium] quando houver UTM; senao a origem do form.
function opportunitySource(attr: AttributionData, fallback: string): string {
  if (attr.utmSource) return attr.utmMedium ? `${attr.utmSource} / ${attr.utmMedium}` : attr.utmSource;
  return fallback;
}

// Mapeia a atribuicao pro objeto nativo attributionSource do GHL (camelCase).
// So inclui chaves com valor. utm_term -> utmKeyword (convencao do GHL).
function buildAttributionSource(attr: AttributionData): Record<string, string> | undefined {
  const src: Record<string, string> = {};
  if (attr.utmSource) src.utmSource = attr.utmSource;
  if (attr.utmMedium) {
    src.utmMedium = attr.utmMedium;
    src.medium = attr.utmMedium;
  }
  if (attr.utmCampaign) src.campaign = attr.utmCampaign;
  if (attr.utmTerm) src.utmKeyword = attr.utmTerm;
  if (attr.utmContent) src.utmContent = attr.utmContent;
  if (attr.referrer) src.referrer = attr.referrer;
  if (attr.landingUrl) src.url = attr.landingUrl;
  if (attr.fbclid) src.fbclid = attr.fbclid;
  if (attr.gclid) src.gclid = attr.gclid;
  if (attr.utmSource) src.sessionSource = attr.utmSource;
  return Object.keys(src).length ? src : undefined;
}

// Custom fields de UTM (por ID) — so os preenchidos. Garante captura mesmo se o
// attributionSource nativo ignorar alguma chave.
function utmCustomFields(attr: AttributionData): Array<{ id: string; field_value: string }> {
  const out: Array<{ id: string; field_value: string }> = [];
  const push = (id: string, v?: string) => {
    if (v) out.push({ id, field_value: v });
  };
  push(CF.utmSource, attr.utmSource);
  push(CF.utmMedium, attr.utmMedium);
  push(CF.utmCampaign, attr.utmCampaign);
  push(CF.utmTerm, attr.utmTerm);
  push(CF.utmContent, attr.utmContent);
  push(CF.fbclid, attr.fbclid);
  push(CF.gclid, attr.gclid);
  return out;
}

// Resumo legivel com todas as respostas — vira a Nota do contato no GHL.
function buildNote(
  kind: "prisma" | "encontro",
  answers: Answers,
  score: number,
  qualified: boolean,
  attr: AttributionData,
): string {
  const origem = kind === "prisma" ? "Aplicação Prisma" : "Encontro de empresários";
  const lines = [
    `Lead via formulário: ${origem}`,
    `Nome: ${answers.nome || "—"}`,
    `E-mail: ${answers.email || "—"}`,
    `WhatsApp: ${answers.whatsapp || "—"}`,
    `Empresa: ${answers.empresa || "—"}`,
    `Cargo: ${answers.cargo || "—"}`,
    `Faturamento 2025: ${answers.faturamento || "—"}`,
    `Score MQL: ${score}/100 — ${qualified ? "Qualificado (≥ R$3M)" : "Não qualificado (< R$3M)"}`,
    `Oportunidade: ${OPPORTUNITY_PRODUCT} — ${OPPORTUNITY_VALUE_LABEL}`,
  ];

  const utm: string[] = [];
  if (attr.utmSource) utm.push(`utm_source: ${attr.utmSource}`);
  if (attr.utmMedium) utm.push(`utm_medium: ${attr.utmMedium}`);
  if (attr.utmCampaign) utm.push(`utm_campaign: ${attr.utmCampaign}`);
  if (attr.utmTerm) utm.push(`utm_term: ${attr.utmTerm}`);
  if (attr.utmContent) utm.push(`utm_content: ${attr.utmContent}`);
  if (attr.fbclid) utm.push(`fbclid: ${attr.fbclid}`);
  if (attr.gclid) utm.push(`gclid: ${attr.gclid}`);
  if (attr.referrer) utm.push(`referrer: ${attr.referrer}`);

  lines.push("", "— Origem / UTM —");
  lines.push(utm.length ? utm.join("\n") : "Sem UTM (acesso direto / bio)");

  return lines.join("\n");
}

export async function sendToGhl(
  kind: "prisma" | "encontro",
  answers: Answers,
  attribution: AttributionData = {},
): Promise<GhlResult> {
  const score = scoreLead(answers.cargo, answers.faturamento);
  const fatTag = FATURAMENTO_TAG[answers.faturamento] || { tag: "fat-sem-info", qualified: false };
  const qualified = fatTag.qualified;

  const token = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID || DEFAULT_LOCATION_ID;
  const cfg = FORM_CONFIG[kind];

  const { firstName, lastName } = splitName(answers.nome || "");

  const tags = [
    "lead-mql",
    "web-form",
    cfg.tag,
    fatTag.tag,
    qualified ? "mql" : "nao-qualificado",
    tier(score),
  ];

  // Custom fields por ID (Empresa, Cargo, Faixa de Faturamento, MQL Score) + UTMs preenchidas
  const customFields = [
    { id: CF.empresa, field_value: answers.empresa || "" },
    { id: CF.cargo, field_value: answers.cargo || "" },
    { id: CF.faixa, field_value: answers.faturamento || "" },
    { id: CF.score, field_value: String(score) },
    ...utmCustomFields(attribution),
  ];

  const attributionSource = buildAttributionSource(attribution);

  const contactPayload = {
    locationId,
    firstName,
    lastName,
    name: answers.nome,
    email: answers.email,
    phone: toE164(answers.whatsapp || ""),
    companyName: answers.empresa,
    source: cfg.source,
    tags,
    customFields,
    ...(attributionSource ? { attributionSource } : {}),
  };

  const opportunityName = `${answers.nome || "Lead"} · ${answers.empresa || "—"}`;
  const oppSource = opportunitySource(attribution, cfg.source);

  // Modo preview: sem token, nao chama o GHL (deixa a validacao visual rodar)
  if (!token) {
    console.log(
      "[lead][preview] sem GHL_API_TOKEN — seria enviado ao GHL:",
      JSON.stringify({
        contact: contactPayload,
        opportunity: { pipelineId: THUX_PIPELINE_ID, pipelineStageId: THUX_STAGE_LEAD_ID, name: opportunityName, status: "open", monetaryValue: OPPORTUNITY_VALUE, source: oppSource },
        note: buildNote(kind, answers, score, qualified, attribution),
      }),
    );
    return { ok: true, mode: "preview", qualified, score };
  }

  try {
    // Passo 1 — upsert do contato (dedup por e-mail/telefone; nao quebra em duplicado)
    const contactRes = await fetch(`${GHL_BASE}/contacts/upsert`, {
      method: "POST",
      headers: ghlHeaders(token),
      body: JSON.stringify(contactPayload),
    });
    const contactData = (await contactRes.json().catch(() => ({}))) as {
      contact?: { id?: string };
      message?: string;
    };
    if (!contactRes.ok || !contactData?.contact?.id) {
      return {
        ok: false,
        mode: "ghl",
        status: contactRes.status,
        qualified,
        score,
        error: contactData?.message || "erro ao criar/atualizar contato no GHL",
      };
    }
    const contactId = contactData.contact.id;

    // Passo 2 — oportunidade na etapa Lead do pipeline Thux (todos os leads). Falha aqui e' soft.
    let opportunityId: string | undefined;
    try {
      const oppRes = await fetch(`${GHL_BASE}/opportunities/`, {
        method: "POST",
        headers: ghlHeaders(token),
        body: JSON.stringify({
          pipelineId: THUX_PIPELINE_ID,
          pipelineStageId: THUX_STAGE_LEAD_ID,
          locationId,
          contactId,
          name: opportunityName,
          status: "open",
          monetaryValue: OPPORTUNITY_VALUE,
          source: oppSource,
        }),
      });
      const oppData = (await oppRes.json().catch(() => ({}))) as {
        opportunity?: { id?: string };
        message?: string;
      };
      if (oppRes.ok) {
        opportunityId = oppData?.opportunity?.id;
      } else {
        console.error("[lead][erro-oportunidade]", oppRes.status, oppData?.message);
      }
    } catch (e) {
      console.error("[lead][erro-oportunidade]", (e as Error).message);
    }

    // Passo 3 — Nota com todas as respostas. Falha aqui tambem e' soft.
    try {
      const noteRes = await fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
        method: "POST",
        headers: ghlHeaders(token),
        body: JSON.stringify({ body: buildNote(kind, answers, score, qualified, attribution) }),
      });
      if (!noteRes.ok) {
        const noteData = (await noteRes.json().catch(() => ({}))) as { message?: string };
        console.error("[lead][erro-nota]", noteRes.status, noteData?.message);
      }
    } catch (e) {
      console.error("[lead][erro-nota]", (e as Error).message);
    }

    return { ok: true, mode: "ghl", status: contactRes.status, contactId, opportunityId, qualified, score };
  } catch (e) {
    return { ok: false, mode: "ghl", qualified, score, error: (e as Error).message };
  }
}
