import Link from "next/link";

/**
 * Logo Keywi : symbole (kiwi + clé + monogramme « K ») + mot-symbole.
 * Identité issue du kit de marque (chair verte + peau gris-brun).
 * `sombre` pour les fonds forêt (mark lime, texte crème), `taille`
 * règle la hauteur du symbole, `lien` la destination du clic.
 */

function MarqueKiwi({ taille, sombre }: { taille: number; sombre: boolean }) {
  const keyFill = sombre ? "#C6F03A" : "#6FA82C";
  const ringFill = sombre ? "#C6F03A" : "#8A7252";
  const seedFill = sombre ? "#15331E" : "#21340F";
  const seeds = Array.from({ length: 10 }, (_, i) => i * 36);

  return (
    <svg
      width={taille}
      height={taille * 1.2}
      viewBox="0 0 200 240"
      role="img"
      aria-label="Keywi"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill={keyFill}>
        <rect x="94" y="150" width="11" height="86" rx="5.5" />
        <rect x="91" y="158" width="17" height="6" rx="3" />
        <rect x="103" y="200" width="20" height="8" rx="4" />
        <rect x="103" y="216" width="13" height="8" rx="4" />
      </g>
      <circle cx="100" cy="84" r="66" fill="#6FA82C" />
      <circle cx="100" cy="84" r="69" fill="none" stroke={ringFill} strokeWidth="7" />
      <g fill={seedFill}>
        {seeds.map((deg) => (
          <ellipse
            key={deg}
            cx="100"
            cy="41"
            rx="2"
            ry="4.6"
            transform={`rotate(${deg} 100 84)`}
          />
        ))}
      </g>
      <text
        x="100"
        y="85"
        textAnchor="middle"
        dominantBaseline="central"
        className="font-display"
        fontWeight="800"
        fontSize="58"
        letterSpacing="-2"
        fill="#F3F1DC"
      >
        K
      </text>
    </svg>
  );
}

export function Logo({
  taille = 32,
  sombre = false,
  lien = "/",
}: {
  taille?: number;
  sombre?: boolean;
  lien?: string;
}) {
  return (
    <Link
      href={lien}
      aria-label="Keywi — accueil"
      className="inline-flex items-center gap-2"
    >
      <MarqueKiwi taille={taille} sombre={sombre} />
      <span
        className={`font-display font-extrabold tracking-tight ${
          sombre ? "text-paper" : "text-encre"
        }`}
        style={{ fontSize: taille * 0.62 }}
      >
        Keywi
      </span>
    </Link>
  );
}
