import Link from "next/link";
import { MapPin, Home } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

/** 404 — page introuvable */
export default function NonTrouve() {
  return (
    <main
      id="contenu"
      className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center"
    >
      <Logo taille={38} />

      <p className="mt-10 font-display text-6xl font-black text-primaire">404</p>
      <h1 className="mt-3 text-2xl font-black">Cette page a changé de case</h1>
      <p className="mx-auto mt-3 max-w-md text-gray-600">
        Le lien est peut-être périmé, ou l&apos;adresse mal recopiée. Rien de
        grave : vos clés, elles, sont bien rangées.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primaire px-5 py-3 font-semibold text-white hover:bg-primaire-fonce"
        >
          <Home size={18} aria-hidden="true" /> Retour à l&apos;accueil
        </Link>
        <Link
          href="/points-relais"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-3 font-semibold hover:bg-gray-50"
        >
          <MapPin size={18} aria-hidden="true" /> Trouver un point relais
        </Link>
      </div>
    </main>
  );
}
