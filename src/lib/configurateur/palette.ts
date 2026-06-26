export interface ZelligeCouleur {
  name: string;
  hex: string;
  family: ZelligeFamille;
  isNew?: boolean;
}

export type ZelligeFamille =
  | "neutre" | "vert" | "bleu" | "jaune"
  | "orange" | "rose" | "rouge" | "violet" | "sombre";

export const ZELLIGE_PALETTE: ZelligeCouleur[] = [
  // — Blancs, crèmes & neutres clairs —
  { name: "Blanc craie",        hex: "#F2EFE9", family: "neutre" },
  { name: "Crème",              hex: "#ECE5D8", family: "neutre" },
  { name: "Blanc cassé froid",  hex: "#E8EAE6", family: "neutre" },
  { name: "Gris perle",         hex: "#D7D9D6", family: "neutre" },
  { name: "Gris clair",         hex: "#C4C7C5", family: "neutre" },
  { name: "Lin",                hex: "#E2DAC9", family: "neutre" },

  // — Verts —
  { name: "Vert amande",        hex: "#C7D8B5", family: "vert" },
  { name: "Vert pâle",          hex: "#B9CBA0", family: "vert" },
  { name: "Vert pomme",         hex: "#8FB45E", family: "vert" },
  { name: "Vert vif",           hex: "#7FA84A", family: "vert" },
  { name: "Sauge",              hex: "#9BAE8E", family: "vert" },
  { name: "Vert olive",         hex: "#7C7E4F", family: "vert" },
  { name: "Vert mousse",        hex: "#5E7A3C", family: "vert" },
  { name: "Vert sapin",         hex: "#3E5A33", family: "vert" },
  { name: "Vert foncé",         hex: "#2C4327", family: "vert" },
  { name: "Vert-de-gris",       hex: "#6E7A6E", family: "vert" },

  // — Bleus —
  { name: "Bleu glacier",       hex: "#C5D6D8", family: "bleu" },
  { name: "Bleu gris",          hex: "#A7BCC2", family: "bleu" },
  { name: "Bleu ciel",          hex: "#8FC0D4", family: "bleu" },
  { name: "Bleu clair",         hex: "#6FA8C7", family: "bleu" },
  { name: "Bleu franc",         hex: "#4E86B0", family: "bleu" },
  { name: "Bleu pétrole",       hex: "#2E6E7E", family: "bleu" },
  { name: "Bleu canard",        hex: "#1F5660", family: "bleu" },
  { name: "Pervenche",          hex: "#8E9FD6", family: "bleu" },
  { name: "Bleu outremer",      hex: "#3F4FA0", family: "bleu" },
  { name: "Bleu nuit",          hex: "#232C66", family: "bleu" },

  // — Jaunes & ambres —
  { name: "Jaune paille",       hex: "#E5D08A", family: "jaune", isNew: true },
  { name: "Jaune doux",         hex: "#E8C75E", family: "jaune" },
  { name: "Jaune d'or",         hex: "#F0B53C", family: "jaune" },
  { name: "Ambre",              hex: "#E8A02E", family: "jaune" },
  { name: "Moutarde",           hex: "#C99A3A", family: "jaune" },
  { name: "Kaki",               hex: "#8A7C3E", family: "jaune" },

  // — Oranges & terracotta —
  { name: "Orange",             hex: "#E08A3C", family: "orange" },
  { name: "Terracotta",         hex: "#C9663E", family: "orange" },
  { name: "Brique",             hex: "#B5512F", family: "orange" },
  { name: "Rouille",            hex: "#A8482B", family: "orange" },

  // — Roses & mauves —
  { name: "Rose poudré",        hex: "#E8C9C4", family: "rose" },
  { name: "Blush",              hex: "#E3B7B2", family: "rose" },
  { name: "Vieux rose",         hex: "#CFA0A0", family: "rose" },
  { name: "Rose terre",         hex: "#C97E78", family: "rose" },
  { name: "Rose corail",        hex: "#D87560", family: "rose" },
  { name: "Mauve",              hex: "#C3B0C4", family: "rose" },

  // — Rouges & bordeaux —
  { name: "Rouge brique",       hex: "#B23A2E", family: "rouge" },
  { name: "Rouge profond",      hex: "#9E2B25", family: "rouge" },
  { name: "Bordeaux",           hex: "#6E2420", family: "rouge", isNew: true },
  { name: "Lie de vin",         hex: "#5A2530", family: "rouge" },

  // — Violets —
  { name: "Aubergine",          hex: "#4A2A4D", family: "violet", isNew: true },
  { name: "Prune sombre",       hex: "#3E2440", family: "violet" },

  // — Sombres & neutres foncés —
  { name: "Gris ardoise",       hex: "#5A6066", family: "sombre" },
  { name: "Brun",               hex: "#4E3A2E", family: "sombre" },
  { name: "Anthracite",         hex: "#2C2C2E", family: "sombre" },
  { name: "Noir zellige",       hex: "#1A1A1C", family: "sombre" },
];

export const FAMILLE_LABELS: Record<ZelligeFamille, string> = {
  neutre:  "Neutres & Crèmes",
  vert:    "Verts",
  bleu:    "Bleus",
  jaune:   "Jaunes & Ambres",
  orange:  "Oranges & Terracotta",
  rose:    "Roses & Mauves",
  rouge:   "Rouges & Bordeaux",
  violet:  "Violets",
  sombre:  "Sombres",
};

export const FAMILLE_ORDER: ZelligeFamille[] = [
  "neutre", "vert", "bleu", "jaune", "orange", "rose", "rouge", "violet", "sombre",
];

export function getPaletteByFamily() {
  return FAMILLE_ORDER.map((family) => ({
    family,
    label: FAMILLE_LABELS[family],
    couleurs: ZELLIGE_PALETTE.filter((c) => c.family === family),
  }));
}
