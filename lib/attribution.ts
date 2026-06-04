// ============================================
// THUX · CAPTURA DE ATRIBUICAO (origem + UTMs)
// Captura utm_* + click ids (fbclid/gclid) + referrer + landing URL no
// PRIMEIRO acesso de qualquer pagina e guarda em sessionStorage (first-touch).
// Sobrevive a navegacao client-side do bio -> form (que dropa a query da URL).
// O QualForm le isso no submit e manda pro /api/lead, que grava no GHL.
// ============================================

export interface AttributionData {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  fbclid?: string;
  gclid?: string;
  msclkid?: string;
  referrer?: string;
  landingUrl?: string;
  capturedAt?: string;
}

const STORAGE_KEY = "thux_attrib";
const MAX_LEN = 300; // evita lixo gigante em qualquer campo

function clean(v: string | null | undefined): string | undefined {
  if (!v) return undefined;
  const t = v.trim().slice(0, MAX_LEN);
  return t || undefined;
}

// Monta o objeto de atribuicao a partir da URL atual + referrer (client-side).
function readFromUrl(): AttributionData {
  const params = new URLSearchParams(window.location.search);
  const data: AttributionData = {
    utmSource: clean(params.get("utm_source")),
    utmMedium: clean(params.get("utm_medium")),
    utmCampaign: clean(params.get("utm_campaign")),
    utmTerm: clean(params.get("utm_term")),
    utmContent: clean(params.get("utm_content")),
    fbclid: clean(params.get("fbclid")),
    gclid: clean(params.get("gclid")),
    msclkid: clean(params.get("msclkid")),
    referrer: clean(document.referrer),
    landingUrl: clean(window.location.href),
    capturedAt: new Date().toISOString(),
  };
  return data;
}

function hasSignal(d: AttributionData): boolean {
  return Boolean(
    d.utmSource || d.utmMedium || d.utmCampaign || d.utmTerm || d.utmContent || d.fbclid || d.gclid || d.msclkid,
  );
}

// Captura first-touch: so grava se ainda nao houver atribuicao salva na sessao.
// Assim a UTM do anuncio (primeiro toque) nao e' sobrescrita por navegacoes internas.
export function captureAttribution(): AttributionData {
  if (typeof window === "undefined") return {};
  try {
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    if (existing) return JSON.parse(existing) as AttributionData;

    const fresh = readFromUrl();
    // So persiste se tiver algum sinal de campanha OU um referrer externo util.
    if (hasSignal(fresh) || fresh.referrer) {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
    return fresh;
  } catch {
    return {};
  }
}

// Le a atribuicao salva (usado no submit do form).
export function getAttribution(): AttributionData {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AttributionData) : {};
  } catch {
    return {};
  }
}
