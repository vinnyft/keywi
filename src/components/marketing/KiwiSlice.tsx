/**
 * Tranche de kiwi « juicy » (clin d'œil KeyWe → Kiwi), utilisée en
 * décor du hero et du pied de page. SVG pur : chair dégradée citron
 * vert, cœur crème, pépins. `id` unique par instance (dégradé radial).
 */
export function KiwiSlice({ id, className = "" }: { id: string; className?: string }) {
  const seeds = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const x = 50 + 30 * Math.cos(a);
    const y = 50 + 30 * Math.sin(a);
    return { x, y, deg: (a * 180) / Math.PI + 90 };
  });
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F1F9D6" />
          <stop offset="38%" stopColor="#C6EE73" />
          <stop offset="100%" stopColor="#96D62B" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#6E5228" />
      <circle cx="50" cy="50" r="44.5" fill="#A9C64B" />
      <circle cx="50" cy="50" r="41" fill={`url(#${id})`} />
      {seeds.map((s, i) => (
        <ellipse
          key={i}
          cx={s.x}
          cy={s.y}
          rx="1.5"
          ry="3"
          fill="#243318"
          transform={`rotate(${s.deg} ${s.x} ${s.y})`}
        />
      ))}
      <circle cx="50" cy="50" r="8.5" fill="#FCFEF4" />
    </svg>
  );
}
