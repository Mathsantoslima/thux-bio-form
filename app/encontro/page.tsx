import type { Metadata } from "next";
import QualForm from "@/components/QualForm";
import { ENCONTRO_META } from "@/lib/forms";

export const metadata: Metadata = {
  title: "Encontro de empresários · 09/06 · Thux",
  description:
    "Inscreva-se no Encontro de empresários sobre IA. Dia 09/06, ao vivo. Vagas limitadas, com curadoria do time Thux.",
};

export default function EncontroPage() {
  return (
    <QualForm
      meta={ENCONTRO_META}
      capaHeadline={
        <>
          Um encontro sobre <span className="em-grad">IA que vira lucro</span> na sua empresa.
        </>
      }
      capaBody={
        <>
          Dia 09/06, ao vivo, com outros empresários. Sem teoria solta e sem hype. O que dá pra aplicar na
          operação pra crescer receita e margem. Preencha pra garantir a sua vaga.
        </>
      }
      successHead={
        <>
          Inscrição recebida.<br />
          <span className="em-purple">Te esperamos no dia 09/06.</span>
        </>
      }
      successBody={
        <>
          Recebemos os seus dados. Nosso time confirma a sua vaga e envia os detalhes do encontro pelo WhatsApp e
          e-mail que você deixou. Fica de olho.
        </>
      }
    />
  );
}
