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
          Vamos descobrir <span className="em-grad">onde a sua empresa</span> está perdendo dinheiro.
        </>
      }
      capaBody={
        <>
          A Thux trabalha por dentro de empresas que querem escalar receita com tecnologia. Preencha pra que
          nosso time avalie se faz sentido conversar sobre o Programa Prisma com vocês.
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
          Nosso time vai analisar as suas respostas e entrar em contato pelo WhatsApp e e-mail que você deixou.
          Sem reunião comercial vazia, sem apresentação genérica. Pode aguardar.
        </>
      }
    />
  );
}
