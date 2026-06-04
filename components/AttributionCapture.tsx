"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

// Roda a captura de atribuicao (first-touch) no primeiro render de qualquer pagina.
// Montado no layout pra pegar a UTM antes de qualquer navegacao client-side dropar a query.
// Usa window.location direto (via captureAttribution), entao NAO precisa de Suspense.
export default function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
