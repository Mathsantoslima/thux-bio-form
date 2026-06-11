import Link from "next/link";
import s from "./page.module.css";

const ArrowIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

export default function BioPage() {
  return (
    <>
      <div className="glow-bg" />

      <main className={s.wrap}>
        <div className={s.card}>
          {/* Marca */}
          <div className={s.brandRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/thux-wordmark-dark.svg" alt="Thux" className={s.logo} />
          </div>

          {/* Perfil */}
          <header className={s.profile}>
            <div className={s.avatar}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/avatar.jpg" alt="Matheus Lima" />
            </div>
            <h1 className={s.name}>Matheus Lima</h1>
            <div className={s.handle}>@mathlimasl</div>
            <p className={s.bio}>
              Ajudo donos de empresa a transformar <strong>IA em receita, margem e lucro</strong> por dentro da
              operação. Sem ferramenta solta, sem teoria. Resultado no caixa.
            </p>
          </header>

          {/* Links principais */}
          <nav className={s.links}>
            <Link href="/encontro" className={`${s.linkCard} ${s.featured}`}>
              <span className={s.liveBadge}>
                <span className={s.liveDot} /> AO VIVO · TERÇA-FEIRA · 10:30
              </span>
              <div className={s.linkBody}>
                <div className={s.linkText}>
                  <div className={s.linkTitle}>Encontro de empresários</div>
                  <div className={s.linkSub}>IA que vira lucro. Garanta a sua vaga.</div>
                </div>
                <ArrowIcon className={s.arrow} />
              </div>
            </Link>

            <Link href="/prisma" className={s.linkCard}>
              <span className={s.eyebrow}>Programa · 90 dias dentro da empresa</span>
              <div className={s.linkBody}>
                <div className={s.linkText}>
                  <div className={s.linkTitle}>Aplique-se para o Prisma</div>
                  <div className={s.linkSub}>A Thux trabalhando por dentro do seu negócio.</div>
                </div>
                <ArrowIcon className={s.arrow} />
              </div>
            </Link>
          </nav>

          {/* Links secundários */}
          <div className={s.secondary}>
            <a href="https://www.instagram.com/mathlimasl/" target="_blank" rel="noopener noreferrer" className={s.secLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
              </svg>
              Instagram
            </a>
            <a href="https://www.thux.io/" target="_blank" rel="noopener noreferrer" className={s.secLink}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              thux.io
            </a>
          </div>

          <footer className={s.footer}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/thux-symbol-dark.svg" alt="" className={s.footerMark} />
            <span>Business &amp; Technology · 2026</span>
          </footer>
        </div>
      </main>
    </>
  );
}
