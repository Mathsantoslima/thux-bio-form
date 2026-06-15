import type { Metadata } from "next";
import QualForm from "@/components/QualForm";
import { PRISMA_META } from "@/lib/forms";

export const metadata: Metadata = {
  title: "Aplicação · Programa Prisma · Thux",
  description:
    "Aplique-se para o Programa Prisma. A Thux trabalha por dentro da sua empresa pra transformar IA em receita, margem e lucro.",
};

export default function PrismaPage() {
  return (
    <QualForm
      meta={PRISMA_META}
      capaHeadline={
        <>
          Vamos achar <span className="em-grad">onde a sua empresa</span> perde dinheiro.
        </>
      }
      capaBody={
        <>
          A Thux entra por dentro da sua operação pra transformar IA em receita e margem. Diagnóstico antes de
          ferramenta. Preencha. O time avalia se faz sentido a gente conversar sobre o Prisma.
        </>
      }
      successHead={
        <>
          Aplicação recebida.<br />
          <span className="em-purple">Agora é com a gente.</span>
        </>
      }
      successBody={
        <>
          O time analisa suas respostas e te chama no WhatsApp e no e-mail que você deixou. Sem reunião vazia, sem
          apresentação genérica. Pode aguardar.
        </>
      }
    />
  );
}
