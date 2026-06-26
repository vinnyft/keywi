import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PanierHydrator } from "@/components/panier/PanierHydrator";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const interDisplay = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "KUBE — Mobilier mosaïque sur-mesure",
    template: "%s | KUBE",
  },
  description:
    "Configurez votre meuble mosaïque sur-mesure en 3D. Taille des carreaux, couleurs, joint — livré chez vous.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${interDisplay.variable}`}>
      <body>
        <a href="#contenu" className="lien-evitement">
          Aller au contenu principal
        </a>
        <PanierHydrator />
        {children}
      </body>
    </html>
  );
}
