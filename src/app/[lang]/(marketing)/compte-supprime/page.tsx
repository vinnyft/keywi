import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheckBig } from "lucide-react";

export const metadata: Metadata = {
  title: "Compte supprimé",
  robots: { index: false },
};

/**
 * Confirmation après suppression — page publique : à ce stade la
 * session est fermée et le compte n'existe plus.
 */
export default function PageCompteSupprime() {
  return (
    <article className="mx-auto max-w-xl px-4 py-24 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primaire-pale text-primaire-fonce">
        <CircleCheckBig size={26} aria-hidden="true" />
      </span>

      <h1 className="mt-5 text-3xl font-black">Votre compte est supprimé</h1>
      <p className="mt-3 text-gray-600">
        Votre nom, votre email et vos trousseaux ont été effacés de nos bases.
        Ce qui subsiste — les mouvements déjà journalisés et les écritures
        comptables — ne porte plus aucune donnée permettant de vous
        identifier.
      </p>
      <p className="mt-3 text-gray-600">
        Vous ne recevrez plus aucun email de notre part. Rien ne vous empêche
        de revenir : une nouvelle inscription repart d&apos;une page blanche.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-primaire px-5 py-2.5 text-sm font-semibold text-white hover:bg-primaire-fonce"
        >
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/confidentialite"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold hover:bg-gray-50"
        >
          Politique de confidentialité
        </Link>
      </div>
    </article>
  );
}
