import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import AttributionCapture from "@/components/AttributionCapture";
import MetaPixel from "@/components/MetaPixel";

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
  metadataBase: new URL("https://bio-math.thux.io"),
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
  // favicon novo (navy) em /public/icon.png; mantém o svg como fallback se ainda não existir.
  icons: { icon: [{ url: "/icon.png", type: "image/png" }, { url: "/icon.svg" }], apple: "/icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={helvetica.variable}>
      <body>
        <MetaPixel />
        <AttributionCapture />
        {children}
      </body>
    </html>
  );
}
