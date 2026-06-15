import type { Metadata } from "next";
import QualForm from "@/components/QualForm";
import { RAIOX_META } from "@/lib/forms";

export const metadata: Metadata = {
  title: "O Raio-X da sua Operação · Thux",
  description:
    "Diagnóstico gratuito guiado por IA: descubra onde sua empresa perde tempo e dinheiro — em minutos, antes de comprar qualquer tecnologia.",
};

export default function RaioXPage() {
  return (
    <QualForm
      meta={RAIOX_META}
      capaHeadline={
        <>
          Descubra onde sua empresa <span className="em-grad">trava</span> — antes de comprar qualquer tecnologia.
        </>
      }
      capaBody={
        <>
          Um diagnóstico guiado por IA, em modo entrevista: você responde perguntas simples e recebe um raio-X
          da sua operação — onde perde tempo, onde perde dinheiro e por onde começar. Preencha pra receber o material.
        </>
      }
      successHead={
        <>
          Seu Raio-X está pronto.<br />
          <span className="em-purple">Agora é com você.</span>
        </>
      }
      successBody={
        <>
          Cole o prompt numa IA (Claude grátis, ChatGPT ou Gemini), responda as perguntas e receba o diagnóstico
          da sua operação. Te levamos pro material em instantes…
        </>
      }
    />
  );
}
