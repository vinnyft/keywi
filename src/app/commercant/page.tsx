import Link from "next/link";
import { PackagePlus, PackageMinus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

/**
 * Accueil de l'app commerçant : les deux gestes du quotidien
 * (déposer / remettre une clé) + état des cases en un coup d'œil.
 */
export default async function AccueilCommercant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: pointRelais } = await supabase
    .from("relay_points")
    .select("id, capacite")
    .eq("owner_id", user!.id)
    .single();

  const [{ count: casesLibres }, { count: mouvementsJour }] = await Promise.all([
    supabase
      .from("slots")
      .select("id", { count: "exact", head: true })
      .eq("relay_point_id", pointRelais!.id)
      .eq("statut", "libre"),
    supabase
      .from("movements")
      .select("id", { count: "exact", head: true })
      .eq("relay_point_id", pointRelais!.id)
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
  ]);

  return (
    <div className="space-y-4">
      {/* Stats du jour */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-3xl font-black text-menthe">{casesLibres ?? 0}</p>
          <p className="text-sm text-gray-600">
            cases libres sur {pointRelais?.capacite}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-3xl font-black text-primaire">{mouvementsJour ?? 0}</p>
          <p className="text-sm text-gray-600">mouvements aujourd&apos;hui</p>
        </div>
      </div>

      {/* Les deux gestes principaux */}
      <Link
        href="/commercant/depot"
        className="flex items-center gap-4 rounded-2xl bg-primaire p-6 text-white shadow-sm transition hover:bg-primaire-fonce"
      >
        <PackagePlus size={44} aria-hidden="true" />
        <span>
          <span className="block text-xl font-bold">Scanner une clé</span>
          <span className="text-white/80">
            Un client dépose un trousseau muni d&apos;un badge KLAV
          </span>
        </span>
      </Link>

      <Link
        href="/commercant/retrait"
        className="flex items-center gap-4 rounded-2xl bg-encre p-6 text-white shadow-sm transition hover:bg-encre-2"
      >
        <PackageMinus size={44} aria-hidden="true" />
        <span>
          <span className="block text-xl font-bold">Remettre une clé</span>
          <span className="text-white/80">
            Un client présente son code de retrait à 6 caractères
          </span>
        </span>
      </Link>

      <p className="rounded-xl bg-primaire-pale p-4 text-sm text-primaire-fonce">
        💡 Sur Android (Chrome), le scan NFC fonctionne directement depuis ce
        navigateur. Sinon, utilisez votre lecteur USB ou saisissez le code
        imprimé sur le badge.
      </p>
    </div>
  );
}
