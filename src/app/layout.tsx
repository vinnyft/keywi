import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "KLAV — Vos clés, en lieu sûr, près de chez vous",
    template: "%s | KLAV",
  },
  description:
    "Déposez vos clés dans un commerce partenaire près de chez vous et gérez les accès à distance. Le réseau français de points relais pour clés.",
  // Installation en application (PWA) sur iOS / Android / desktop
  appleWebApp: {
    capable: true,
    title: "KLAV",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icone-apple.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#101B33",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
