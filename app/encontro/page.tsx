import type { Metadata } from "next";
import QualForm from "@/components/QualForm";
import { ENCONTRO_META } from "@/lib/forms";

export const metadata: Metadata = {
  title: "Encontro de empresários · terça-feira · Thux",
  description:
    "Inscreva-se no Encontro de empresários sobre IA. Terça-feira, às 10:30, ao vivo. Vagas limitadas, com curadoria do time Thux.",
};

export default function EncontroPage() {
  return (
    <QualForm
      meta={ENCONTRO_META}
      capaHeadline={
        <>
          Um encontro sobre <span className="em-grad">IA que vira lucro</span>. Sem hype.
        </>
      }
      capaBody={
        <>
          Terça-feira, 10:30, ao vivo, com outros donos de empresa. O que dá pra aplicar na operação pra crescer
          receita e margem. Preencha pra garantir sua vaga.
        </>
      }
      successHead={
        <>
          Inscrição recebida.<br />
          <span className="em-purple">Te esperamos na terça.</span>
        </>
      }
      successBody={
        <>
          Recebemos seus dados. O time confirma sua vaga e manda os detalhes no WhatsApp e no e-mail que você
          deixou. Fica de olho.
        </>
      }
    />
  );
}
