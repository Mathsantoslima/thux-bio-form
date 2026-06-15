// ============================================
// THUX · VALIDACAO DE LEAD (anti-lixo, baixo falso-positivo)
// Checagens sincronas (rodam no front e no server). A checagem de MX/DNS
// fica no server (route.ts), pois usa node:dns.
// Objetivo: barrar dominio de teste/descartavel, telefone e nome obviamente
// falsos — sem derrubar lead real (gmail, e-mail de empresa, etc.).
// ============================================

// Dominios de teste / descartaveis (e-mails de spam/throwaway).
const BLOCKED_EMAIL_DOMAINS = new Set([
  "example.com", "example.org", "example.net", "test.com", "teste.com",
  "email.com", "mail.com", "domain.com", "yourcompany.com", "empresa.com",
  "mailinator.com", "tempmail.com", "temp-mail.org", "10minutemail.com",
  "guerrillamail.com", "yopmail.com", "throwaway.email", "trashmail.com",
  "getnada.com", "sharklasers.com", "maildrop.cc", "fakeinbox.com",
  "mintemail.com", "dispostable.com", "mailnesia.com", "tempmailo.com",
  "emailondeck.com", "spam4.me", "mohmal.com", "fakemail.net", "discard.email",
]);

// TLDs reservadas (RFC 2606/6761) — nunca sao dominios reais.
const BLOCKED_TLDS = new Set(["test", "example", "invalid", "localhost", "local"]);

// Pistas de e-mail de teste/spam no nome local (antes do @).
const BLOCKED_LOCAL_HINTS = ["teste", "test123", "spamtest", "fakemail", "asdf", "qwerty"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// DDDs validos do Brasil.
const VALID_DDD = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35,
  37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64,
  65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88,
  89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

export function emailDomain(email: string): string {
  return (email.split("@")[1] || "").trim().toLowerCase();
}

// Retorna o motivo da rejeicao do e-mail, ou null se passou (checagens sincronas).
export function emailRejectionReason(email: string): string | null {
  const v = (email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(v)) return "Digite um e-mail válido.";
  const [local, domain] = v.split("@");
  const tld = domain.split(".").pop() || "";
  if (BLOCKED_TLDS.has(tld)) return "Use um e-mail real (esse domínio não recebe mensagens).";
  if (BLOCKED_EMAIL_DOMAINS.has(domain)) return "Use seu e-mail real, por favor (não um e-mail de teste).";
  if (BLOCKED_LOCAL_HINTS.some((h) => local === h || local.startsWith(h))) {
    return "Use seu e-mail real, por favor.";
  }
  return null;
}

// Reduz a string a digitos.
function digits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

// Detecta numero repetido (1111...) ou sequencia obvia (12345678).
function isJunkNumber(seq: string): boolean {
  if (/^(\d)\1+$/.test(seq)) return true; // todos iguais
  const asc = "01234567890123456789";
  const desc = "98765432109876543210";
  return asc.includes(seq) || desc.includes(seq);
}

// Retorna o motivo da rejeicao do WhatsApp, ou null se passou.
export function phoneRejectionReason(whatsapp: string): string | null {
  let d = digits(whatsapp);
  if (d.startsWith("55") && d.length > 11) d = d.slice(2); // tira DDI se veio
  if (d.length < 10 || d.length > 11) return "Digite um WhatsApp válido com DDD.";
  const ddd = parseInt(d.slice(0, 2), 10);
  if (!VALID_DDD.has(ddd)) return "DDD inválido. Confira o número.";
  const rest = d.slice(2);
  if (d.length === 11 && rest[0] !== "9") return "Número de celular inválido (falta o 9).";
  if (isJunkNumber(rest)) return "Digite um número de WhatsApp real.";
  return null;
}

// Retorna o motivo da rejeicao do nome, ou null se passou.
export function nameRejectionReason(name: string): string | null {
  const v = (name || "").trim();
  if (v.length < 3) return "Digite seu nome completo.";
  if (/\d/.test(v)) return "Digite seu nome (sem números).";
  const parts = v.split(/\s+/).filter((p) => p.length >= 2);
  if (parts.length < 2) return "Digite nome e sobrenome.";
  // Sequencias de teclado / junk (asdf, qwerty, aaaa).
  const flat = v.toLowerCase().replace(/\s/g, "");
  if (/(.)\1{3,}/.test(flat)) return "Digite seu nome completo.";
  if (["asdf", "qwerty", "teste", "fulano", "ciclano"].some((j) => flat.includes(j))) {
    return "Digite seu nome real.";
  }
  return null;
}
