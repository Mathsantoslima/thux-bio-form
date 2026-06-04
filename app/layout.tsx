import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Helvetica Neue oficial (brand pack Thux), convertida para woff2.
const helvetica = localFont({
  src: [
    { path: "../public/fonts/HelveticaNeue-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/HelveticaNeue-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/HelveticaNeue-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/HelveticaNeue-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-hn",
  display: "swap",
});

export const metadata: Metadata = {
  // TROCAR pelo dominio final no deploy
  metadataBase: new URL("https://thux-bio.vercel.app"),
  title: "Matheus Lima · Thux",
  description:
    "Thux trabalha por dentro de empresas que querem transformar IA em receita, margem e lucro. Sem ferramenta solta. Resultado na operacao.",
  applicationName: "Thux",
  authors: [{ name: "Matheus Lima" }],
  openGraph: {
    title: "Matheus Lima · Thux",
    description:
      "IA aplicada por dentro da sua empresa. Receita, margem e lucro. Conheca o Programa Prisma e o Encontro de empresarios.",
    type: "website",
    locale: "pt_BR",
    siteName: "Thux",
  },
  twitter: {
    card: "summary_large_image",
    title: "Matheus Lima · Thux",
    description: "IA aplicada por dentro da sua empresa. Receita, margem e lucro.",
  },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={helvetica.variable}>
      <body>{children}</body>
    </html>
  );
}
