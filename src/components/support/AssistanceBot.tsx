"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LifeBuoy, RotateCcw, Search, Send, X } from "lucide-react";
import { getArbre, EMAIL_SAV, RACINE, type Noeud } from "@/content/assistance";
import { useLocale } from "@/lib/useLocale";
import { localise, type Locale } from "@/lib/i18n";
import { chercherNoeud, detecterLangue } from "@/lib/assistance-recherche";

/**
 * Bot d'assistance : un arbre de décision déterministe (voir
 * src/content/assistance.ts). Deux façons d'avancer :
 *   - cliquer les boutons de choix ;
 *   - taper une question en texte libre : la phrase est appariée à
 *     un nœud par mots-clés tolérants aux fautes, et la langue du
 *     bot (FR/EN) bascule selon la langue détectée.
 *
 * Tout est local : aucun appel réseau, aucune donnée envoyée. Quand
 * rien ne convient, le bot propose les thèmes puis un email au SAV
 * pré-rempli du chemin parcouru.
 */

interface Bulle {
  role: "bot" | "utilisateur";
  texte: string;
  noeudId?: string;
}

export function AssistanceBot() {
  const locale = useLocale();
  // La langue du bot suit d'abord la page, puis bascule si l'on
  // détecte que l'utilisateur écrit dans l'autre langue.
  const [langueBot, setLangueBot] = useState<Locale>(locale);
  const en = langueBot === "en";
  const arbre = useMemo(() => getArbre(langueBot), [langueBot]);

  const t = en
    ? {
        ouvrir: "Open help",
        fermer: "Close help",
        titre: "KeyWe assistant",
        recommencer: "Restart",
        close: "Close",
        aide: "Did this answer help?",
        oui: "Yes, thanks",
        sav: "Contact support",
        retour: "Back",
        placeholder: "Ask your question…",
        envoyer: "Send",
        incompris:
          "I'm not sure I understood. Pick a topic below, or contact support.",
        sujet: "KeyWe help request",
        corpsIntro: "Hello,\n\nThe assistant didn't solve my problem.\n\n",
        corpsParcours: "My path in the assistant:\n",
        corpsQuestion: "My question:\n",
      }
    : {
        ouvrir: "Ouvrir l'assistance",
        fermer: "Fermer l'assistance",
        titre: "Assistant KeyWe",
        recommencer: "Recommencer",
        close: "Fermer",
        aide: "Cette réponse vous a-t-elle aidé ?",
        oui: "Oui, merci",
        sav: "Contacter le SAV",
        retour: "Retour",
        placeholder: "Posez votre question…",
        envoyer: "Envoyer",
        incompris:
          "Je ne suis pas sûr d'avoir compris. Choisissez un thème ci-dessous, ou contactez le SAV.",
        sujet: "Demande d'aide KeyWe",
        corpsIntro: "Bonjour,\n\nL'assistant n'a pas résolu mon problème.\n\n",
        corpsParcours: "Mon parcours dans l'assistant :\n",
        corpsQuestion: "Ma question :\n",
      };

  const [ouvert, setOuvert] = useState(false);
  const [fil, setFil] = useState<Bulle[]>([
    { role: "bot", texte: arbre[RACINE].message, noeudId: RACINE },
  ]);
  const [noeud, setNoeud] = useState<Noeud>(arbre[RACINE]);
  const [historique, setHistorique] = useState<string[]>([]);
  const [saisie, setSaisie] = useState("");
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [fil, noeud]);

  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [ouvert]);

  function choisir(libelle: string, versId: string) {
    const cible = arbre[versId];
    if (!cible) return;
    setHistorique((h) => [...h, noeud.id]);
    setFil((f) => [
      ...f,
      { role: "utilisateur", texte: libelle },
      { role: "bot", texte: cible.message, noeudId: cible.id },
    ]);
    setNoeud(cible);
  }

  function revenir() {
    const precedentId = historique[historique.length - 1];
    if (!precedentId) return;
    const precedent = arbre[precedentId];
    setHistorique((h) => h.slice(0, -1));
    setFil((f) => [...f, { role: "bot", texte: precedent.message, noeudId: precedent.id }]);
    setNoeud(precedent);
  }

  function recommencer() {
    setFil([{ role: "bot", texte: arbre[RACINE].message, noeudId: RACINE }]);
    setNoeud(arbre[RACINE]);
    setHistorique([]);
  }

  /**
   * Réponse à une question tapée en texte libre : on détecte la
   * langue (et l'on bascule le bot dessus), puis on apparie la
   * phrase à un nœud. Sans correspondance, on revient aux thèmes.
   */
  function repondreTexte(texte: string) {
    const q = texte.trim();
    if (!q) return;
    setSaisie("");

    const lang = detecterLangue(q, langueBot);
    const arbreCible = getArbre(lang);
    const cibleId = chercherNoeud(q);
    setLangueBot(lang);

    if (!cibleId || !arbreCible[cibleId]) {
      const msg =
        lang === "en"
          ? "I'm not sure I understood. Pick a topic below, or contact support."
          : "Je ne suis pas sûr d'avoir compris. Choisissez un thème ci-dessous, ou contactez le SAV.";
      setHistorique([]);
      setFil((f) => [
        ...f,
        { role: "utilisateur", texte: q },
        { role: "bot", texte: msg, noeudId: RACINE },
      ]);
      setNoeud(arbreCible[RACINE]);
      return;
    }

    const cible = arbreCible[cibleId];
    setHistorique((h) => [...h, noeud.id]);
    setFil((f) => [
      ...f,
      { role: "utilisateur", texte: q },
      { role: "bot", texte: cible.message, noeudId: cible.id },
    ]);
    setNoeud(cible);
  }

  function lienSav(): string {
    const parcours = fil
      .filter((b) => b.role === "utilisateur")
      .map((b) => `- ${b.texte}`)
      .join("\n");
    const corps =
      t.corpsIntro +
      (parcours ? `${t.corpsParcours}${parcours}\n\n` : "") +
      t.corpsQuestion;
    return `mailto:${EMAIL_SAV}?subject=${encodeURIComponent(t.sujet)}&body=${encodeURIComponent(corps)}`;
  }

  const lienNoeud = noeud.lien;

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-controls="assistance-panneau"
        aria-label={ouvert ? t.fermer : t.ouvrir}
        className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-primaire text-white shadow-lg transition hover:bg-primaire-fonce focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primaire"
      >
        {ouvert ? <X size={24} aria-hidden="true" /> : <LifeBuoy size={24} aria-hidden="true" />}
      </button>

      {ouvert && (
        <div
          id="assistance-panneau"
          role="dialog"
          aria-label={t.titre}
          className="fixed bottom-24 right-5 z-50 flex max-h-[70vh] w-[min(24rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between gap-2 bg-encre px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <LifeBuoy size={18} aria-hidden="true" />
              <p className="font-semibold">{t.titre}</p>
            </div>
            <div className="flex items-center gap-1">
              {historique.length > 0 && (
                <button
                  type="button"
                  onClick={recommencer}
                  className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
                  aria-label={t.recommencer}
                  title={t.recommencer}
                >
                  <RotateCcw size={16} aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
                aria-label={t.close}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {fil.map((b, i) => (
              <div key={i} className={b.role === "bot" ? "flex" : "flex justify-end"}>
                <p
                  className={
                    b.role === "bot"
                      ? "max-w-[85%] rounded-2xl rounded-tl-sm bg-gray-100 px-3.5 py-2.5 text-sm text-gray-800"
                      : "max-w-[85%] rounded-2xl rounded-tr-sm bg-primaire px-3.5 py-2.5 text-sm text-white"
                  }
                >
                  {b.texte}
                </p>
              </div>
            ))}

            {lienNoeud && (
              <div className="flex">
                <Link
                  href={localise(lienNoeud.href, langueBot)}
                  onClick={() => setOuvert(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primaire-pale px-3 py-2 text-sm font-semibold text-primaire-fonce hover:brightness-95"
                >
                  {lienNoeud.libelle} →
                </Link>
              </div>
            )}

            <div ref={finRef} />
          </div>

          <div className="border-t border-gray-200 bg-white px-4 py-3">
            {noeud.choix ? (
              <div className="flex flex-wrap gap-2">
                {noeud.choix.map((c) => (
                  <button
                    key={c.vers}
                    type="button"
                    onClick={() => choisir(c.libelle, c.vers)}
                    className="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-primaire hover:bg-primaire-pale hover:text-primaire-fonce"
                  >
                    {c.libelle}
                  </button>
                ))}
                {historique.length > 0 && (
                  <button
                    type="button"
                    onClick={revenir}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"
                  >
                    <ArrowLeft size={14} aria-hidden="true" /> {t.retour}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">{t.aide}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={recommencer}
                    className="rounded-full bg-primaire px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-primaire-fonce"
                  >
                    {t.oui}
                  </button>
                  <a
                    href={lienSav()}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3.5 py-1.5 text-sm font-semibold text-gray-700 hover:border-primaire hover:text-primaire-fonce"
                  >
                    <Send size={14} aria-hidden="true" /> {t.sav}
                  </a>
                  {historique.length > 0 && (
                    <button
                      type="button"
                      onClick={revenir}
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"
                    >
                      <ArrowLeft size={14} aria-hidden="true" /> {t.retour}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Saisie libre : toujours disponible, quelle que soit l'étape */}
            <form
              className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3"
              onSubmit={(e) => {
                e.preventDefault();
                repondreTexte(saisie);
              }}
            >
              <Search size={15} className="shrink-0 text-gray-400" aria-hidden="true" />
              <label htmlFor="assistance-saisie" className="sr-only">
                {t.placeholder}
              </label>
              <input
                id="assistance-saisie"
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
                placeholder={t.placeholder}
                autoComplete="off"
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primaire focus:outline-none"
              />
              <button
                type="submit"
                disabled={saisie.trim().length === 0}
                aria-label={t.envoyer}
                title={t.envoyer}
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primaire p-2 text-white hover:bg-primaire-fonce disabled:opacity-50"
              >
                <Send size={15} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
