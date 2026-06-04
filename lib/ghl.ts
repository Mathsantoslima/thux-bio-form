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

// Defaults do pipeline Thux (vault clientes/THUX.md)
const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";
const DEFAULT_LOCATION_ID = "KKNHDTekS1dDPnUnyeVF";
const THUX_PIPELINE_ID = "WdobuKIzajvmijLpVPNE";
const THUX_STAGE_LEAD_ID = "377b3016-caaf-4b36-abec-5b41e1ad852b";

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
  qualified: boolean;
  score: number;
  error?: string;
}

export async function sendToGhl(kind: "prisma" | "encontro", answers: Answers): Promise<GhlResult> {
  const score = scoreLead(answers.cargo, answers.faturamento);
  const fatTag = FATURAMENTO_TAG[answers.faturamento] || { tag: "fat-sem-info", qualified: false };
  const qualified = fatTag.qualified;

  const token = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID || DEFAULT_LOCATION_ID;

  const { firstName, lastName } = splitName(answers.nome || "");

  const tags = [
    "lead-mql",
    "web-form",
    kind === "prisma" ? "prisma" : "encontro",
    fatTag.tag,
    qualified ? "mql" : "nao-qualificado",
    tier(score),
  ];

  // Custom fields por key (batem com o GHL da Thux: empresa, cargo, faixa_de_faturamento)
  const customFields: Array<Record<string, string>> = [
    { key: "empresa", field_value: answers.empresa || "" },
    { key: "cargo", field_value: answers.cargo || "" },
    { key: "faixa_de_faturamento", field_value: answers.faturamento || "" },
  ];
  if (process.env.GHL_MQL_SCORE_FIELD_ID) {
    customFields.push({ id: process.env.GHL_MQL_SCORE_FIELD_ID, field_value: String(score) });
  }

  const payload = {
    locationId,
    firstName,
    lastName,
    name: answers.nome,
    email: answers.email,
    phone: toE164(answers.whatsapp || ""),
    companyName: answers.empresa,
    source: kind === "prisma" ? "Bio · Aplicação Prisma" : "Bio · Encontro 09/06",
    tags,
    customFields,
    // contexto extra (o dev pode usar pra mover de stage no pipeline Thux)
    _meta: { pipelineId: THUX_PIPELINE_ID, stageId: THUX_STAGE_LEAD_ID, score, qualified },
  };

  // Modo preview: sem token, nao chama o GHL (deixa a validacao visual rodar)
  if (!token) {
    console.log("[lead][preview] sem GHL_API_TOKEN — payload que seria enviado:", JSON.stringify(payload));
    return { ok: true, mode: "preview", qualified, score };
  }

  try {
    const res = await fetch(`${GHL_BASE}/contacts/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Version: GHL_API_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { contact?: { id?: string }; message?: string };
    if (!res.ok) {
      return { ok: false, mode: "ghl", status: res.status, qualified, score, error: data?.message || "erro GHL" };
    }
    return { ok: true, mode: "ghl", status: res.status, contactId: data?.contact?.id, qualified, score };
  } catch (e) {
    return { ok: false, mode: "ghl", qualified, score, error: (e as Error).message };
  }
}
