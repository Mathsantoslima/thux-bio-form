# Thux · Bio + Forms (Prisma e Encontro)

Link-in-bio do `@mathlimasl` que distribui para dois formulários de qualificação. Os leads são enviados ao **GHL** (GoHighLevel).

Next.js 14 (App Router) + TypeScript. Pronto pra deploy no **Vercel**.

## Páginas

| Rota | O que é |
|---|---|
| `/` | Bio (perfil + 2 links principais) |
| `/prisma` | Form "Aplique-se para o Prisma" |
| `/encontro` | Form "Encontro de empresários · 09/06" |
| `/api/lead` | Endpoint que recebe o lead e envia ao GHL |

Os dois forms capturam os mesmos 6 campos: **nome, e-mail, WhatsApp, empresa, cargo, faturamento**.

## Rodar local

```bash
npm install
npm run dev
# http://localhost:3000
```

## Integração com o GHL (o que o dev precisa fazer)

O envio ao GHL está pronto em [`lib/ghl.ts`](lib/ghl.ts) e [`app/api/lead/route.ts`](app/api/lead/route.ts). Só falta plugar as credenciais:

1. Copie `.env.example` para `.env` (local) e configure as mesmas variáveis no Vercel.
2. Gere um **Private Integration Token** no GHL (API v2) com escopo `contacts.write` e coloque em `GHL_API_TOKEN`.
3. Confirme o `GHL_LOCATION_ID` (já vem com o location da Thux do vault).

**Sem `GHL_API_TOKEN`** o endpoint roda em **modo preview**: valida o lead e loga o payload no console, sem chamar o GHL. Útil pra subir a validação visual sem credencial.

### O que já está mapeado (do CRM atual da Thux)

- Contato: `firstName/lastName`, `email`, `phone` (E.164), `companyName`, `source`.
- Custom fields por key: `empresa`, `cargo`, `faixa_de_faturamento`.
- Tags automáticas: `lead-mql`, `web-form`, `prisma`/`encontro`, tag de faixa (`fat-3m-5m`, etc.), `mql` (se faturamento ≥ R$3M) e tier `mql-hot/warm/cold` pelo score cargo+faturamento.
- IDs do pipeline Thux (`pipelineId`/`stageId Lead`) e o `score` vão no campo `_meta` do payload, caso o dev queira criar a opportunity / mover de stage.

> Observação: confirme no GHL se os custom fields aceitam envio por **key** ou se é preciso usar o **id** do campo. O código usa key (`empresa`/`cargo`/`faixa_de_faturamento`), que é o padrão atual da conta.

## Deploy no Vercel

```bash
npx vercel        # preview
npx vercel --prod # produção
```

Depois é só apontar o domínio desejado (ex: link da bio do Instagram). Lembre de trocar o `metadataBase` em [`app/layout.tsx`](app/layout.tsx) pelo domínio final (afeta as meta tags OG).

## Design System

Aurora dark premium da Thux: `--black #0A0A0F`, ação `--lime #C7FF60`, aurora pink/violet/blue, **Inter** (corpo) + **JetBrains Mono** (labels). Tokens em [`app/globals.css`](app/globals.css).
