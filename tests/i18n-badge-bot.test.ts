import { describe, it, expect } from "vitest";
import { normaliserBadge } from "../src/lib/badge";
import { detecterLangue, chercherNoeud } from "../src/lib/assistance-recherche";
import { prefixe, localise, estLocale } from "../src/lib/i18n";

/**
 * Tests unitaires des fonctions pures (aucune base). Ils tournent
 * dans la même campagne que les tests d'intégration, mais ne
 * touchent ni Supabase ni le réseau.
 */

describe("normaliserBadge — UID insensible aux séparateurs et à la casse", () => {
  it("retire les séparateurs et met en majuscules", () => {
    expect(normaliserBadge("04:A2:B3")).toBe("04A2B3");
    expect(normaliserBadge("04-a2-b3")).toBe("04A2B3");
    expect(normaliserBadge("  04 a2 b3 ")).toBe("04A2B3");
  });

  it("réconcilie les formats hexa d'un même badge", () => {
    expect(normaliserBadge("04:a2:b3:c4")).toBe(normaliserBadge("04A2B3C4"));
  });

  it("laisse le code imprimé inchangé", () => {
    expect(normaliserBadge(" kwia7k3m ")).toBe("KWIA7K3M");
  });
});

describe("detecterLangue — heuristique FR/EN", () => {
  it("détecte le français malgré les fautes/abréviations", () => {
    expect(detecterLangue("pq jarriv pa a retire ma cle", "en")).toBe("fr");
  });

  it("détecte l'anglais malgré les fautes/abréviations", () => {
    expect(detecterLangue("wyy i cnt tk my keu from the pik up", "fr")).toBe("en");
    expect(detecterLangue("hello how do i pick up my keys", "fr")).toBe("en");
  });

  it("les accents tranchent en faveur du français", () => {
    expect(detecterLangue("café à côté", "en")).toBe("fr");
  });

  it("sans indice, garde la langue par défaut fournie", () => {
    expect(detecterLangue("", "en")).toBe("en");
    expect(detecterLangue("123 456", "fr")).toBe("fr");
  });
});

describe("chercherNoeud — appariement tolérant aux fautes", () => {
  it("route les phrases mal orthographiées vers le retrait", () => {
    expect(chercherNoeud("pq jarriv pa a retire ma cle")).toBe("retrait");
    expect(chercherNoeud("wyy i cnt tk my keu from the pik up")).toBe("retrait");
  });

  it("route les autres intentions courantes", () => {
    expect(chercherNoeud("mon code ne marche pas")).toBe("code_expire");
    expect(chercherNoeud("combien ça coûte ?")).toBe("paiement_tarifs");
    expect(chercherNoeud("j'ai oublié mon mot de passe")).toBe("compte_mdp");
    expect(chercherNoeud("i want to become a partner")).toBe("commercant");
  });

  it("renvoie null quand rien ne correspond", () => {
    expect(chercherNoeud("asdfghjkl zzz qwerty")).toBeNull();
    expect(chercherNoeud("")).toBeNull();
  });
});

describe("i18n — préfixe et localisation des chemins", () => {
  it("prefixe : /en en anglais, vide en français", () => {
    expect(prefixe("en")).toBe("/en");
    expect(prefixe("fr")).toBe("");
  });

  it("localise : ajoute /en seulement en anglais", () => {
    expect(localise("/tarifs", "en")).toBe("/en/tarifs");
    expect(localise("/tarifs", "fr")).toBe("/tarifs");
    expect(localise("/", "en")).toBe("/en");
    expect(localise("/", "fr")).toBe("/");
  });

  it("estLocale : ne reconnaît que fr et en", () => {
    expect(estLocale("fr")).toBe(true);
    expect(estLocale("en")).toBe(true);
    expect(estLocale("de")).toBe(false);
    expect(estLocale("")).toBe(false);
  });
});
