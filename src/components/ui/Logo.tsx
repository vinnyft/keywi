import Link from "next/link";
import { KeyRound } from "lucide-react";

/**
 * Logo KLAV : clé sur carré bleu arrondi + mot-symbole.
 * `sombre` pour les fonds encre (texte blanc), `taille` règle
 * la hauteur du pictogramme, `lien` la destination du clic.
 */
export function Logo({
  taille = 32,
  sombre = false,
  lien = "/",
}: {
  taille?: number;
  sombre?: boolean;
  lien?: string;
}) {
  const contenu = (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-flex items-center justify-center rounded-[28%] bg-primaire text-white"
        style={{ width: taille, height: taille }}
      >
        <KeyRound size={taille * 0.6} aria-hidden="true" />
      </span>
      <span
        className={`text-xl font-extrabold tracking-wide ${
          sombre ? "text-white" : "text-encre"
        }`}
      >
        KLAV
      </span>
    </span>
  );

  return (
    <Link href={lien} aria-label="KLAV — accueil" className="inline-flex">
      {contenu}
    </Link>
  );
}
