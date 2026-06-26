import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = { title: "Paramètres — Admin" };

export default async function AdminParametresPage() {
  const supabase = await createClient();

  const [
    { data: settings },
    { data: tiers },
    { data: surcharges },
  ] = await Promise.all([
    supabase.from("settings").select("*").single(),
    supabase.from("pricing_tiers").select("*").order("taille_min_cm"),
    supabase.from("color_surcharges").select("*").order("nb_couleurs"),
  ]);

  async function updateSettings(formData: FormData) {
    "use server";
    const adminDb = createAdminClient();
    await adminDb.from("settings").update({
      hauteur_fixe_cm: Number(formData.get("hauteur_fixe_cm")),
      cout_fixe: Number(formData.get("cout_fixe")),
      forfait_livraison: Number(formData.get("forfait_livraison")),
      seuil_livraison_gratuite: formData.get("seuil_livraison_gratuite")
        ? Number(formData.get("seuil_livraison_gratuite"))
        : null,
      dessous_carrelee: formData.get("dessous_carrelee") === "on",
      texte_accueil: String(formData.get("texte_accueil")),
    }).eq("id", 1);
    revalidatePath("/admin/parametres");
  }

  async function updateTier(formData: FormData) {
    "use server";
    const adminDb = createAdminClient();
    const id = String(formData.get("id"));
    await adminDb.from("pricing_tiers").update({
      prix_par_m2: Number(formData.get("prix_par_m2")),
    }).eq("id", id);
    revalidatePath("/admin/parametres");
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-black tracking-[-0.03em]">Paramètres</h1>

      {/* Paramètres généraux */}
      <div className="bg-white border border-[#e5e5e5] rounded p-6">
        <h2 className="font-bold mb-4">Paramètres généraux</h2>
        <form action={updateSettings} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Hauteur fixe (cm)</label>
              <input type="number" name="hauteur_fixe_cm" defaultValue={settings?.hauteur_fixe_cm ?? 45} step="0.5"
                className="w-full border border-[#e5e5e5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Coût fixe (€)</label>
              <input type="number" name="cout_fixe" defaultValue={settings?.cout_fixe ?? 50} step="0.01"
                className="w-full border border-[#e5e5e5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Forfait livraison (€)</label>
              <input type="number" name="forfait_livraison" defaultValue={settings?.forfait_livraison ?? 80} step="0.01"
                className="w-full border border-[#e5e5e5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Seuil livraison gratuite (€)</label>
              <input type="number" name="seuil_livraison_gratuite" defaultValue={settings?.seuil_livraison_gratuite ?? ""} step="0.01"
                placeholder="Laisser vide = toujours payant"
                className="w-full border border-[#e5e5e5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Texte d'accueil</label>
            <input type="text" name="texte_accueil" defaultValue={settings?.texte_accueil ?? ""}
              className="w-full border border-[#e5e5e5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="dessous_carrelee" id="dessous" defaultChecked={settings?.dessous_carrelee} />
            <label htmlFor="dessous" className="text-sm">Carrelaison du dessous active</label>
          </div>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#0a0a0a] rounded hover:bg-[#1c1c1c] transition-colors">
            Enregistrer
          </button>
        </form>
      </div>

      {/* Paliers de prix */}
      <div className="bg-white border border-[#e5e5e5] rounded p-6">
        <h2 className="font-bold mb-4">Prix par m² selon taille</h2>
        <div className="space-y-3">
          {tiers?.map((tier) => (
            <form key={tier.id} action={updateTier} className="flex items-center gap-4">
              <input type="hidden" name="id" value={tier.id} />
              <span className="text-sm font-medium w-48">{tier.label}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number" name="prix_par_m2" defaultValue={tier.prix_par_m2} step="0.01" min="0"
                  className="w-28 border border-[#e5e5e5] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#1a56db]"
                />
                <span className="text-sm text-[#6b6b6b]">€/m²</span>
              </div>
              <button type="submit" className="px-3 py-1.5 text-xs font-medium border border-[#e5e5e5] rounded hover:bg-[#f5f5f5] transition-colors">
                OK
              </button>
            </form>
          ))}
        </div>
      </div>

      {/* Surcharges couleurs */}
      <div className="bg-white border border-[#e5e5e5] rounded p-6">
        <h2 className="font-bold mb-4">Surcharge multi-couleurs</h2>
        <div className="space-y-2 text-sm">
          {surcharges?.map((s) => (
            <div key={s.nb_couleurs} className="flex items-center gap-3">
              <span className="w-24 text-[#6b6b6b]">{s.nb_couleurs} couleur{s.nb_couleurs > 1 ? "s" : ""}</span>
              <span className="font-medium">+{s.surcharge_pct} %</span>
            </div>
          ))}
          <p className="text-xs text-[#6b6b6b] mt-2">
            (Modifiable directement en base — édition UI à venir)
          </p>
        </div>
      </div>
    </div>
  );
}
