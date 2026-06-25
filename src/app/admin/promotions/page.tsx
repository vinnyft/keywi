import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = { title: "Promotions — Admin" };

const TYPE_LABELS: Record<string, string> = {
  pourcentage: "% remise",
  montant_fixe: "Montant fixe (€)",
  livraison_gratuite: "Livraison gratuite",
};

export default async function AdminPromosPage() {
  const supabase = await createClient();
  const { data: promos } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  async function togglePromo(formData: FormData) {
    "use server";
    const adminDb = createAdminClient();
    const id = String(formData.get("id"));
    const actif = formData.get("actif") === "true";
    await adminDb.from("promotions").update({ actif: !actif }).eq("id", id);
    revalidatePath("/admin/promotions");
  }

  async function createPromo(formData: FormData) {
    "use server";
    const adminDb = createAdminClient();
    await adminDb.from("promotions").insert({
      code: String(formData.get("code")).toUpperCase(),
      type: String(formData.get("type")) as "pourcentage" | "montant_fixe" | "livraison_gratuite",
      valeur: Number(formData.get("valeur")),
      seuil_montant: formData.get("seuil_montant") ? Number(formData.get("seuil_montant")) : null,
      description: String(formData.get("description")) || null,
      actif: true,
      usage_unique: formData.get("usage_unique") === "on",
    });
    revalidatePath("/admin/promotions");
  }

  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-black tracking-[-0.03em]">Promotions</h1>

      {/* Créer une promo */}
      <div className="bg-white border border-[#e5e5e5] rounded p-6">
        <h2 className="font-bold mb-4">Créer une promotion</h2>
        <form action={createPromo} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Code</label>
            <input type="text" name="code" required placeholder="PROMO10"
              className="w-full border border-[#e5e5e5] rounded px-3 py-2 text-sm uppercase focus:outline-none focus:border-[#1a56db]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Type</label>
            <select name="type" className="w-full border border-[#e5e5e5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]">
              <option value="pourcentage">% remise</option>
              <option value="montant_fixe">Montant fixe (€)</option>
              <option value="livraison_gratuite">Livraison gratuite</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Valeur</label>
            <input type="number" name="valeur" required defaultValue={10} step="0.01" min="0"
              className="w-full border border-[#e5e5e5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Seuil minimum (€)</label>
            <input type="number" name="seuil_montant" step="0.01" min="0" placeholder="Optionnel"
              className="w-full border border-[#e5e5e5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Description</label>
            <input type="text" name="description" placeholder="Affiché au client"
              className="w-full border border-[#e5e5e5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]" />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" name="usage_unique" id="usage_unique" />
            <label htmlFor="usage_unique" className="text-sm">Usage unique (un seul client)</label>
          </div>
          <div className="col-span-2">
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-[#0a0a0a] rounded hover:bg-[#1c1c1c] transition-colors">
              Créer
            </button>
          </div>
        </form>
      </div>

      {/* Liste */}
      <div className="bg-white border border-[#e5e5e5] rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f5f5f5] text-left text-xs uppercase tracking-wider text-[#6b6b6b]">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Valeur</th>
              <th className="px-4 py-3 font-medium">Utilisations</th>
              <th className="px-4 py-3 font-medium">Actif</th>
            </tr>
          </thead>
          <tbody>
            {promos?.map((promo) => (
              <tr key={promo.id} className="border-t border-[#e5e5e5]">
                <td className="px-4 py-3 font-mono font-semibold text-sm">{promo.code}</td>
                <td className="px-4 py-3 text-xs text-[#6b6b6b]">{TYPE_LABELS[promo.type] ?? promo.type}</td>
                <td className="px-4 py-3 text-sm font-medium">
                  {promo.type === "livraison_gratuite" ? "—" : promo.type === "pourcentage" ? `${promo.valeur} %` : `${promo.valeur} €`}
                </td>
                <td className="px-4 py-3 text-sm">{promo.nb_utilisations}</td>
                <td className="px-4 py-3">
                  <form action={togglePromo}>
                    <input type="hidden" name="id" value={promo.id} />
                    <input type="hidden" name="actif" value={String(promo.actif)} />
                    <button
                      type="submit"
                      className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        promo.actif
                          ? "bg-[#e8f9f3] text-[#0e7a5c] hover:bg-[#d0f0e4]"
                          : "bg-[#f5f5f5] text-[#6b6b6b] hover:bg-[#e5e5e5]"
                      }`}
                    >
                      {promo.actif ? "Actif" : "Inactif"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
