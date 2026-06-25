import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ConfigMeuble } from "@/lib/supabase/types";

interface Props {
  params: Promise<{ id: string }>;
}

const STATUTS = [
  "en_attente_paiement",
  "payee",
  "en_production",
  "expediee",
  "livree",
  "annulee",
];

const STATUTS_LABELS: Record<string, string> = {
  en_attente_paiement: "Attente paiement",
  payee: "Payée",
  en_production: "En production",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

export default async function AdminCommandeDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: commande } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single();

  if (!commande) notFound();

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

  async function changerStatut(formData: FormData) {
    "use server";
    const newStatut = formData.get("statut") as "en_attente_paiement" | "payee" | "en_production" | "expediee" | "livree" | "annulee";
    const adminDb = createAdminClient();
    await adminDb.from("orders").update({ statut: newStatut }).eq("id", id);
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/commandes" className="text-sm text-[#6b6b6b] underline mb-4 block">
        ← Commandes
      </Link>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-[-0.03em]">
            #{commande.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-[#6b6b6b]">
            {new Date(commande.created_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
          </p>
        </div>
        <form action={changerStatut} className="flex gap-2 items-center">
          <select
            name="statut"
            defaultValue={commande.statut}
            className="text-sm border border-[#e5e5e5] rounded px-3 py-2 focus:outline-none focus:border-[#1a56db]"
          >
            {STATUTS.map((s) => (
              <option key={s} value={s}>{STATUTS_LABELS[s]}</option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-[#0a0a0a] rounded hover:bg-[#1c1c1c] transition-colors"
          >
            Mettre à jour
          </button>
        </form>
      </div>

      <div className="space-y-4 mb-6">
        {commande.order_items.map((item: {
          id: string;
          config_json: unknown;
          longueur_cm: number;
          largeur_cm: number;
          hauteur_cm: number;
          nb_carreaux_total: number;
          surface_m2: number;
          prix_unitaire: number;
          quantite: number;
        }) => {
          const cfg = item.config_json as ConfigMeuble;
          return (
            <div key={item.id} className="bg-white border border-[#e5e5e5] rounded p-5">
              <div className="flex gap-2 mb-3">
                {cfg.couleurs?.map((hex: string, i: number) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-sm border border-[#e5e5e5]"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
                <div
                  className="w-7 h-7 rounded-sm border-2 border-dashed border-[#e5e5e5]"
                  style={{ backgroundColor: cfg.couleurJoint }}
                  title={`Joint : ${cfg.couleurJoint}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <span className="text-[#6b6b6b]">Dimensions</span>
                <span className="font-medium">{Math.round(item.longueur_cm)} × {Math.round(item.largeur_cm)} × {Math.round(item.hauteur_cm)} cm</span>
                <span className="text-[#6b6b6b]">Taille carreau</span>
                <span className="font-medium">{cfg.tailleCm} cm</span>
                <span className="text-[#6b6b6b]">Carreaux</span>
                <span className="font-medium">{item.nb_carreaux_total}</span>
                <span className="text-[#6b6b6b]">Surface</span>
                <span className="font-medium">{item.surface_m2.toFixed(3)} m²</span>
                <span className="text-[#6b6b6b]">Seed</span>
                <span className="font-mono text-xs">{cfg.seed}</span>
                <span className="text-[#6b6b6b]">Quantité</span>
                <span className="font-medium">× {item.quantite}</span>
                <span className="text-[#6b6b6b]">Prix unitaire</span>
                <span className="font-medium">{fmt(item.prix_unitaire)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded p-5 text-sm space-y-2">
        <div className="flex justify-between text-[#6b6b6b]">
          <span>Sous-total HT</span>
          <span>{fmt(commande.montant_ht)}</span>
        </div>
        {commande.promo_remise > 0 && (
          <div className="flex justify-between text-[#0e7a5c]">
            <span>Remise promo</span>
            <span>−{fmt(commande.promo_remise)}</span>
          </div>
        )}
        <div className="flex justify-between text-[#6b6b6b]">
          <span>Livraison</span>
          <span>{commande.frais_livraison === 0 ? "Offerte" : fmt(commande.frais_livraison)}</span>
        </div>
        <div className="border-t border-[#e5e5e5] pt-2 flex justify-between font-bold">
          <span>Total TTC</span>
          <span>{fmt(commande.montant_ttc)}</span>
        </div>
      </div>

      {commande.stripe_session_id && (
        <p className="mt-4 text-xs text-[#6b6b6b] font-mono">
          Stripe session: {commande.stripe_session_id}
        </p>
      )}
    </div>
  );
}
