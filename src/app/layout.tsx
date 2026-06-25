import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "./globals.css";

// Police d'affichage (titres, monogramme) — identité Keywi
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

// Police de texte courant
const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Keywi — Vos clés, en lieu sûr, près de chez vous",
    template: "%s | Keywi",
  },
  description:
    "Déposez vos clés dans un commerce partenaire près de chez vous et gérez les accès à distance. Le réseau français de points relais pour clés.",
  // Installation en application (PWA) sur iOS / Android / desktop
  appleWebApp: {
    capable: true,
    title: "Keywi",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/brand/app-icon.svg",
    apple: "/brand/app-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#15331E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${bricolage.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#contenu" className="lien-evitement">
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  );
}
