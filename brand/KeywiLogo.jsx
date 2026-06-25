// Keywi — composant logo React (drop-in).
// Usage : <KeywiLogo size={48} />  ·  <KeywiLogo variant="dark" />  ·  <KeywiLogo withWordmark />
// Le « K » utilise Bricolage Grotesque : charge la police dans ton app (voir README).

export function KeywiMark({ size = 48, variant = "light", title = "Keywi" }) {
  const dark = variant === "dark";
  const keyFill  = dark ? "#C6F03A" : "#7CB518";
  const ringFill = dark ? "#C6F03A" : "#8A7252";
  const seedFill = dark ? "#15331E" : "#21340F";
  const seeds = Array.from({ length: 10 }, (_, i) => i * 36);

  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 200 240"
         role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      <g fill={keyFill}>
        <rect x="94" y="150" width="11" height="86" rx="5.5" />
        <rect x="91" y="158" width="17" height="6" rx="3" />
        <rect x="103" y="200" width="20" height="8" rx="4" />
        <rect x="103" y="216" width="13" height="8" rx="4" />
      </g>
      <circle cx="100" cy="84" r="66" fill="#7CB518" />
      <circle cx="100" cy="84" r="69" fill="none" stroke={ringFill} strokeWidth="7" />
      <g fill={seedFill}>
        {seeds.map((deg) => (
          <ellipse key={deg} cx="100" cy="41" rx="2" ry="4.6"
                   transform={`rotate(${deg} 100 84)`} />
        ))}
      </g>
      <text x="100" y="85" textAnchor="middle" dominantBaseline="central"
            fontFamily="'Bricolage Grotesque', sans-serif" fontWeight="800"
            fontSize="58" letterSpacing="-2" fill="#F3F1DC">K</text>
    </svg>
  );
}

export function KeywiLogo({ size = 48, variant = "light", withWordmark = false }) {
  if (!withWordmark) return <KeywiMark size={size} variant={variant} />;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.27 }}>
      <KeywiMark size={size} variant={variant} />
      <span style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontWeight: 800,
        fontSize: size * 0.62,
        letterSpacing: "-0.02em",
        color: variant === "dark" ? "#FBFAF3" : "#14331E",
      }}>Keywi</span>
    </span>
  );
}

export default KeywiLogo;
