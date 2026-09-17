import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import { LOCALES, estLocale, type Locale } from "@/lib/i18n";
import "../globals.css";

/**
 * Layout racine, désormais localisé : le segment [lang] porte la
 * langue et permet de fixer `<html lang>`. Les deux langues sont
 * générées statiquement.
 */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// Police d'affichage (titres, monogramme) — identité KeyWe
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
  // Base des URLs absolues (Open Graph, canoniques, sitemap). Sans
  // elle, un chemin relatif dans une métadonnée d'URL fait échouer
  // le build. Voir src/lib/site.ts.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "KeyWe — Vos clés, en lieu sûr, près de chez vous",
    template: "%s | KeyWe",
  },
  description:
    "Déposez vos clés dans un commerce partenaire près de chez vous et gérez les accès à distance. Le réseau français de points relais pour clés.",
  // Partage social. Le titre et la description propres à chaque page
  // alimentent automatiquement og:title / og:description ; l'image
  // vient de opengraph-image.tsx (et twitter-image.tsx). Le canonique
  // est posé page par page, pas ici (sinon tout pointerait vers « / »).
  openGraph: {
    type: "website",
    siteName: "KeyWe",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
  },
  // Installation en application (PWA) sur iOS / Android / desktop
  appleWebApp: {
    capable: true,
    title: "KeyWe",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/brand/app-icon.svg",
    apple: "/brand/app-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#3A5230",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  if (!estLocale(lang)) notFound();
  const locale: Locale = lang;

  return (
    <html
      lang={locale}
      className={`${bricolage.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#contenu" className="lien-evitement">
          {locale === "en" ? "Skip to main content" : "Aller au contenu principal"}
        </a>
        {children}
      </body>
    </html>
  );
}
