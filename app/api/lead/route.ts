import { NextResponse } from "next/server";
import { sendToGhl } from "@/lib/ghl";
import { FIELDS, type Answers } from "@/lib/forms";
import type { AttributionData } from "@/lib/attribution";

export const runtime = "nodejs";

const REQUIRED = FIELDS.map((f) => f.key); // nome, email, whatsapp, empresa, cargo, faturamento

export async function POST(req: Request) {
  let body: { form?: string; answers?: Answers; attribution?: AttributionData };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const kind = body.form === "encontro" ? "encontro" : "prisma";
  const answers: Answers = body.answers || {};
  const attribution: AttributionData = body.attribution || {};

  // Validacao server-side dos campos obrigatorios
  const missing = REQUIRED.filter((k) => !answers[k] || !String(answers[k]).trim());
  if (missing.length) {
    return NextResponse.json({ ok: false, error: "Campos obrigatórios faltando", missing }, { status: 422 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email)) {
    return NextResponse.json({ ok: false, error: "E-mail inválido" }, { status: 422 });
  }

  const result = await sendToGhl(kind, answers, attribution);

  // Mesmo se o GHL falhar, nao quebramos a experiencia do lead na tela final;
  // logamos o erro pro dev investigar. (ok do response reflete o envio real.)
  if (!result.ok) {
    console.error("[lead][erro-ghl]", result);
  }

  return NextResponse.json({
    ok: result.ok,
    mode: result.mode,
    qualified: result.qualified,
    contactId: result.contactId,
    opportunityId: result.opportunityId,
  });
}
