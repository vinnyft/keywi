import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mon compte" };

const STATUTS: Record<string, { label: string; color: string }> = {
  en_attente_paiement: { label: "En attente de paiement", color: "text-[#d97706]" },
  payee:              { label: "Payée", color: "text-[#0e7a5c]" },
  en_production:      { label: "En production", color: "text-[#1a56db]" },
  expediee:           { label: "Expédiée", color: "text-[#1a56db]" },
  livree:             { label: "Livrée", color: "text-[#0e7a5c]" },
  annulee:            { label: "Annulée", color: "text-[#c0392b]" },
};

export default async function ComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: commandes } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

  async function seDeconnecter() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.04em]">Mon compte</h1>
          <p className="text-[#6b6b6b] text-sm mt-1">{profile?.email ?? user.email}</p>
        </div>
        <form action={seDeconnecter}>
          <button type="submit" className="text-sm text-[#6b6b6b] underline hover:text-[#c0392b] transition-colors">
            Déconnexion
          </button>
        </form>
      </div>

      <h2 className="text-lg font-bold mb-4">Mes commandes</h2>

      {(!commandes || commandes.length === 0) ? (
        <div className="text-center py-12 border border-[#e5e5e5] rounded">
          <p className="text-[#6b6b6b] mb-4">Aucune commande pour le moment.</p>
          <Link href="/configurateur" className="text-sm font-semibold text-[#1a56db] underline">
            Configurer mon premier meuble
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {commandes.map((cmd) => {
            const statut = STATUTS[cmd.statut] ?? { label: cmd.statut, color: "text-[#6b6b6b]" };
            return (
              <div key={cmd.id} className="border border-[#e5e5e5] rounded p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm text-[#0a0a0a]">
                    {new Date(cmd.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="text-xs text-[#6b6b6b] font-mono">#{cmd.id.slice(0, 8).toUpperCase()}</p>
                  <p className={`text-xs font-semibold mt-1 ${statut.color}`}>{statut.label}</p>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-bold text-[#0a0a0a]">{fmt(cmd.montant_ttc)}</span>
                  <Link
                    href={`/compte/commandes/${cmd.id}`}
                    className="text-sm text-[#1a56db] underline hover:text-[#1447b4] transition-colors"
                  >
                    Détails →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
