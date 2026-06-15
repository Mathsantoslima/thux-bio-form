import { NextResponse } from "next/server";
import { sendToGhl } from "@/lib/ghl";
import { promises as dns } from "node:dns";
import { FIELDS, type Answers, type FormKind } from "@/lib/forms";
import type { AttributionData } from "@/lib/attribution";
import {
  emailRejectionReason,
  phoneRejectionReason,
  nameRejectionReason,
  emailDomain,
} from "@/lib/validation";

export const runtime = "nodejs";

const REQUIRED = FIELDS.map((f) => f.key); // nome, email, whatsapp, empresa, cargo, faturamento

// O dominio do e-mail tem registro MX? (dominio real sempre tem). Fail-open:
// em erro de rede/DNS, deixa passar pra nunca bloquear um lead verdadeiro.
async function emailDomainHasMx(email: string): Promise<boolean> {
  const domain = emailDomain(email);
  if (!domain) return true;
  try {
    const mx = await dns.resolveMx(domain);
    return Array.isArray(mx) && mx.length > 0;
  } catch (e) {
    const code = (e as NodeJS.ErrnoException)?.code;
    // Dominio nao existe / sem MX -> rejeita. Qualquer outro erro -> fail-open.
    if (code === "ENOTFOUND" || code === "ENODATA") return false;
    return true;
  }
}

export async function POST(req: Request) {
  let body: { form?: string; answers?: Answers; attribution?: AttributionData };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  const VALID_KINDS: FormKind[] = ["prisma", "encontro", "raio-x-ia"];
  const kind: FormKind = VALID_KINDS.includes(body.form as FormKind) ? (body.form as FormKind) : "prisma";
  const answers: Answers = body.answers || {};
  const attribution: AttributionData = body.attribution || {};

  // Validacao server-side dos campos obrigatorios
  const missing = REQUIRED.filter((k) => !answers[k] || !String(answers[k]).trim());
  if (missing.length) {
    return NextResponse.json({ ok: false, error: "Campos obrigatórios faltando", missing }, { status: 422 });
  }

  // Anti-lixo: nome, e-mail (formato + blocklist) e WhatsApp (DDD/celular/junk).
  const reason =
    nameRejectionReason(answers.nome) ||
    emailRejectionReason(answers.email) ||
    phoneRejectionReason(answers.whatsapp);
  if (reason) {
    return NextResponse.json({ ok: false, error: reason }, { status: 422 });
  }

  // Dominio do e-mail precisa existir/receber e-mail (MX). Fail-open em erro de DNS.
  if (!(await emailDomainHasMx(answers.email))) {
    return NextResponse.json(
      { ok: false, error: "Esse e-mail não parece receber mensagens. Confira o endereço." },
      { status: 422 },
    );
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
