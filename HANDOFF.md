# Handoff · Bio + Forms Thux (para o desenvolvedor)

Projeto pronto pra subir. É a **bio do `@mathlimasl`** com dois formulários de qualificação (Prisma e Encontro 09/06). Os leads vão pro **GHL**.

Stack: **Next.js 14 (App Router) + TypeScript**. Deploy alvo: **Vercel**.

---

## 1. Rodar local

```bash
npm install
npm run dev      # http://localhost:3000
```

## 2. Subir na Vercel

- Importe o repositório na Vercel (framework detectado: Next.js, sem config extra).
- Configure as variáveis de ambiente (próxima seção).
- Deploy. Depois aponte o domínio que vai no link da bio do Instagram.
- Em `app/layout.tsx`, troque o `metadataBase` pelo domínio final (afeta as meta tags de compartilhamento).

## 3. Integração com o GHL (o que falta configurar)

O envio do lead já está implementado em [`lib/ghl.ts`](lib/ghl.ts) e [`app/api/lead/route.ts`](app/api/lead/route.ts). Só faltam as credenciais. Variáveis (em `.env` local e na Vercel):

| Variável | Obrigatória | O que é |
|---|---|---|
| `GHL_API_TOKEN` | sim (pra enviar de verdade) | Private Integration Token do GHL (API v2), escopo `contacts.write` |
| `GHL_LOCATION_ID` | já preenchida com o default | Location (sub-conta) da Thux |
| `GHL_MQL_SCORE_FIELD_ID` | opcional | ID do custom field numérico `mql_score`, pra gravar o score 0-100 |

> **Sem `GHL_API_TOKEN`** o endpoint roda em **modo preview**: valida e loga o lead, mas não chama o GHL. Serve pra testar o visual sem credencial. Assim que o token entrar, os leads passam a ser criados no GHL automaticamente.

### O que já vai mapeado pro GHL

- Contato: nome, e-mail, telefone (E.164), empresa, `source`.
- Custom fields por key: `empresa`, `cargo`, `faixa_de_faturamento`.
- Tags: `lead-mql`, `web-form`, `prisma`/`encontro`, tag de faixa de faturamento, `mql` (quando faturamento ≥ R$3M) e tier (`mql-hot/warm/cold`).
- `pipelineId` / `stageId` (Lead) e o `score` vão no campo `_meta` do payload, caso queira criar a opportunity / mover de stage.

> Confirme no GHL se os custom fields aceitam envio por **key** (padrão atual) ou se precisa usar o **id** do campo.

---

## 4. Estrutura

| Rota | O que é |
|---|---|
| `/` | Bio (perfil do Math + 2 links) |
| `/prisma` | Form "Aplique-se para o Prisma" |
| `/encontro` | Form "Encontro de empresários · 09/06" |
| `/api/lead` | Recebe o lead e envia ao GHL |

Os dois forms capturam os mesmos 6 campos: **nome, e-mail, WhatsApp, empresa, cargo, faturamento**.

## 5. Design System

DS oficial da Thux (Manual 2024.1): fundo branco, **roxo** da marca (`#7107FF` / `#8C28FA` / `#3D04A1`), **Helvetica Neue** (embutida em `public/fonts/`), logo e símbolo oficiais em `public/`. Tokens em [`app/globals.css`](app/globals.css).
