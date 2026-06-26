import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ConfigMeuble } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Détail commande" };

interface Props {
  params: Promise<{ id: string }>;
}

const STATUTS: Record<string, string> = {
  en_attente_paiement: "En attente de paiement",
  payee: "Payée",
  en_production: "En production",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

export default async function CommandeDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: commande } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!commande) notFound();

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/compte" className="text-sm text-[#6b6b6b] underline mb-6 block">
        ← Retour
      </Link>
      <h1 className="text-3xl font-black tracking-[-0.04em] mb-2">
        Commande #{commande.id.slice(0, 8).toUpperCase()}
      </h1>
      <p className="text-[#6b6b6b] text-sm mb-8">
        {new Date(commande.created_at).toLocaleDateString("fr-FR", { dateStyle: "long" })} —{" "}
        <span className="font-medium text-[#0a0a0a]">{STATUTS[commande.statut] ?? commande.statut}</span>
      </p>

      <div className="space-y-4 mb-8">
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
            <div key={item.id} className="border border-[#e5e5e5] rounded p-5">
              <div className="flex gap-3 mb-3">
                {cfg.couleurs?.map((hex: string, i: number) => (
                  <div key={i} className="w-6 h-6 rounded-sm border border-[#e5e5e5]" style={{ backgroundColor: hex }} />
                ))}
                <div
                  className="w-6 h-6 rounded-sm border-2 border-dashed border-[#e5e5e5]"
                  style={{ backgroundColor: cfg.couleurJoint }}
                  title="Joint"
                />
              </div>
              <p className="font-semibold">
                {Math.round(item.longueur_cm)} × {Math.round(item.largeur_cm)} × {Math.round(item.hauteur_cm)} cm
              </p>
              <p className="text-sm text-[#6b6b6b]">
                Carreau {cfg.tailleCm} cm · {item.nb_carreaux_total} carreaux · {item.surface_m2.toFixed(2)} m²
              </p>
              <p className="text-sm font-medium mt-2">
                {fmt(item.prix_unitaire)} × {item.quantite} = {fmt(item.prix_unitaire * item.quantite)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#e5e5e5] pt-4 flex justify-between font-bold text-lg">
        <span>Total TTC</span>
        <span>{fmt(commande.montant_ttc)}</span>
      </div>

      {commande.statut === "payee" && (
        <div className="mt-8 p-4 bg-[#eff4ff] border border-[#1a56db] rounded text-sm">
          <p className="font-semibold text-[#1a56db]">Votre commande est en cours de traitement.</p>
          <p className="text-[#1c1c1c] mt-1">Vous recevrez un email dès le démarrage de la fabrication.</p>
        </div>
      )}
    </div>
  );
}
