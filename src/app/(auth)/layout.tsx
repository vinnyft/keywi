import { Logo } from "@/components/ui/Logo";
import Link from "next/link";

/** Gabarit des pages d'authentification : carte centrée, fond sable */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      id="contenu"
      className="flex min-h-screen flex-col items-center justify-center bg-sable px-4 py-12"
    >
      <div className="mb-8">
        <Logo taille={40} />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {children}
      </div>
      <p className="mt-6 text-sm text-gray-600">
        <Link href="/" className="underline hover:text-encre">
          ← Retour au site
        </Link>
      </p>
    </main>
  );
}
