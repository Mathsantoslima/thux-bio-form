"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FIELDS, LEAD_VALUE_BRL, type Answers, type FormMeta } from "@/lib/forms";
import { getAttribution } from "@/lib/attribution";
import s from "./QualForm.module.css";

interface Props {
  meta: FormMeta;
  capaHeadline: React.ReactNode;
  capaBody: React.ReactNode;
  successHead: React.ReactNode;
  successBody: React.ReactNode;
}

// Mascara de telefone BR: (11) 99999-9999
function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function validate(key: string, type: string, value: string): string | null {
  const v = (value || "").trim();
  if (!v) return "Preencha pra continuar.";
  if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Digite um e-mail válido.";
  if (type === "tel" && v.replace(/\D/g, "").length < 10) return "Digite um WhatsApp válido com DDD.";
  return null;
}

const OPTION_KEYS = "ABCDEFGH".split("");

// Faixas de faturamento qualificadas (>= R$3M) — strings idênticas às de lib/forms.ts.
// Disparam o evento custom QualifiedLead no Meta Pixel.
const FAT_QUALIFICADO = [
  "R$ 3 milhões a R$ 5 milhões",
  "R$ 5 milhões a R$ 10 milhões",
  "R$ 10 milhões a R$ 50 milhões",
  "R$ 50 milhões a R$ 500 milhões",
  "Acima de R$ 500 milhões",
];

export default function QualForm({ meta, capaHeadline, capaBody, successHead, successBody }: Props) {
  const total = FIELDS.length + 2; // capa + campos + sucesso
  const successIdx = total - 1;
  const lastFieldIdx = FIELDS.length;

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const field = current >= 1 && current <= lastFieldIdx ? FIELDS[current - 1] : null;

  const progress = useMemo(() => {
    if (current === 0) return 0;
    if (current >= successIdx) return 100;
    return (current / (total - 1)) * 100;
  }, [current, successIdx, total]);

  useEffect(() => {
    if (field && field.type !== "options") {
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [current, field]);

  const setValue = useCallback((key: string, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setError(null);
  }, []);

  const goTo = useCallback((idx: number) => {
    setCurrent(idx);
    setError(null);
  }, []);

  const submit = useCallback(
    async (finalAnswers: Answers) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const res = await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ form: meta.kind, answers: finalAnswers, attribution: getAttribution() }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Falha ao enviar.");
        setCurrent(successIdx);
        // Evento de conversao do Meta Pixel — so dispara no sucesso real do envio.
        // value = valor ESTIMADO da oportunidade do lead (NAO e' venda; evento Lead, nao Purchase).
        window.fbq?.("track", "Lead", {
          value: LEAD_VALUE_BRL,
          currency: "BRL",
          content_name: meta.kind === "prisma" ? "Prisma" : "Encontro",
          content_category: "oportunidade-estimada",
        });
        // Evento custom — só leads qualificados (faturamento >= R$3M).
        if (FAT_QUALIFICADO.includes(finalAnswers.faturamento)) {
          window.fbq?.("trackCustom", "QualifiedLead");
        }
      } catch (e) {
        setSubmitError((e as Error).message || "Não foi possível enviar agora.");
      } finally {
        setSubmitting(false);
      }
    },
    [meta.kind, successIdx]
  );

  const next = useCallback(() => {
    if (current === 0) return goTo(1);
    if (!field) return;
    const val = answers[field.key] || "";
    const err = validate(field.key, field.type, val);
    if (err) {
      setError(err);
      return;
    }
    if (current === lastFieldIdx) submit(answers);
    else goTo(current + 1);
  }, [current, field, answers, goTo, lastFieldIdx, submit]);

  const prev = useCallback(() => {
    if (current > 0 && current < successIdx) goTo(current - 1);
  }, [current, successIdx, goTo]);

  const pickOption = useCallback(
    (key: string, value: string) => {
      const merged = { ...answers, [key]: value };
      setAnswers(merged);
      setError(null);
      setTimeout(() => {
        if (current === lastFieldIdx) submit(merged);
        else goTo(current + 1);
      }, 240);
    },
    [answers, current, lastFieldIdx, submit, goTo]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (current === successIdx) return;
      if (e.key === "Enter") {
        e.preventDefault();
        next();
      } else if (e.key === "Tab" && e.shiftKey) {
        if (current > 0) {
          e.preventDefault();
          prev();
        }
      } else if (field?.type === "options") {
        const idx = OPTION_KEYS.indexOf(e.key.toUpperCase());
        if (idx >= 0 && field.options && field.options[idx]) {
          e.preventDefault();
          pickOption(field.key, field.options[idx].value);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, successIdx, next, prev, field, pickOption]);

  const groupNum = field ? String(current).padStart(2, "0") : "";

  return (
    <>
      <div className="glow-bg" />

      <div className={s.app}>
        <header className={s.header}>
          <Link href="/" className={s.brand} aria-label="Voltar para o perfil">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/thux-wordmark-dark.svg" alt="Thux" className={s.logo} />
          </Link>
          <div className={s.headerMeta}>
            <span>{meta.headerLabel}</span>
          </div>
        </header>

        <div className={s.progressTrack}>
          <div className={s.progressFill} style={{ width: `${progress}%` }} />
        </div>

        <main className={s.stage}>
          {/* CAPA */}
          {current === 0 && (
            <section className={s.step}>
              <div className={s.capa}>
                <span className={s.capaMarker}>{meta.capaMarker}</span>
                <h1 className={s.capaHeadline}>{capaHeadline}</h1>
                <p className={s.capaBody}>{capaBody}</p>
                <button className={s.capaCta} onClick={next}>
                  {meta.capaCta}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
                <div className={s.capaMetaRow}>
                  {meta.capaMeta.map((m) => (
                    <div key={m.label} className={s.capaMetaItem}>
                      {m.label}
                      <strong>{m.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* CAMPOS */}
          {field && (
            <section className={s.step} key={field.key}>
              <div className={s.qBadge}>
                <span className={s.numBox}>{groupNum}</span> {field.group}
              </div>
              <h2 className={s.qTitle}>
                {field.title}
                <span className={s.req}>*</span>
              </h2>
              {field.hint && <p className={s.qHint}>{field.hint}</p>}

              {field.type === "options" ? (
                <div className={`${s.optionsList} ${field.options && field.options.length > 5 ? s.scrollable : ""}`}>
                  {field.options?.map((opt, i) => (
                    <button
                      key={opt.value}
                      className={`${s.optionItem} ${answers[field.key] === opt.value ? s.selected : ""}`}
                      onClick={() => pickOption(field.key, opt.value)}
                    >
                      <span className={s.optionKey}>{OPTION_KEYS[i]}</span>
                      <span className={s.optionLabel}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              ) : field.type === "tel" ? (
                <div className={s.phoneRow}>
                  <span className={s.phoneFlag}>
                    <span className={s.flagEmoji}>🇧🇷</span>
                    <span className={s.code}>+55</span>
                  </span>
                  <input
                    ref={inputRef}
                    type="tel"
                    inputMode="numeric"
                    placeholder={field.placeholder}
                    autoComplete={field.autocomplete}
                    value={answers[field.key] || ""}
                    onChange={(e) => setValue(field.key, maskPhone(e.target.value))}
                  />
                </div>
              ) : (
                <div className={s.inputRow}>
                  <input
                    ref={inputRef}
                    type={field.type}
                    inputMode={field.type === "email" ? "email" : "text"}
                    placeholder={field.placeholder}
                    autoComplete={field.autocomplete}
                    value={answers[field.key] || ""}
                    onChange={(e) => setValue(field.key, e.target.value)}
                  />
                </div>
              )}

              {error && <div className={s.errText}>{error}</div>}

              <div className={s.actions}>
                <button className={s.btnBack} onClick={prev}>
                  ← Voltar
                </button>
                {field.type !== "options" && (
                  <button className={s.btnOk} onClick={next} disabled={submitting}>
                    {current === lastFieldIdx ? (submitting ? "Enviando..." : "Enviar") : "Continuar"}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                )}
              </div>
              {submitError && <div className={s.errText}>{submitError} Tente de novo.</div>}
            </section>
          )}

          {/* SUCESSO */}
          {current === successIdx && (
            <section className={s.step}>
              <div className={s.finalWrap}>
                <span className={s.finalTag}>{meta.successTag}</span>
                <h2 className={s.finalHead}>{successHead}</h2>
                <p className={s.finalBody}>{successBody}</p>
                <div className={s.finalMeta}>
                  {meta.successNote.label}
                  <strong>{meta.successNote.value}</strong>
                </div>
                <Link href="/" className={s.finalBack}>
                  ← Voltar para o perfil
                </Link>
              </div>
            </section>
          )}
        </main>

        <footer className={s.footer}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/thux-symbol-dark.svg" alt="" className={s.footerMark} />
          <span>{meta.kind === "prisma" ? "Programa Prisma" : "Encontro · terça-feira"}</span>
        </footer>
      </div>
    </>
  );
}
