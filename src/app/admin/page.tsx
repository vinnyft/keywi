import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard Admin" };

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalCommandes },
    { data: commandesRecentes },
    { data: ca },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id, statut, montant_ttc, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("orders")
      .select("montant_ttc")
      .eq("statut", "payee"),
  ]);

  const caTotal = ca?.reduce((s, o) => s + (o.montant_ttc ?? 0), 0) ?? 0;
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0 }).format(n);

  const STATUTS: Record<string, string> = {
    en_attente_paiement: "Attente paiement",
    payee: "Payée",
    en_production: "En production",
    expediee: "Expédiée",
    livree: "Livrée",
    annulee: "Annulée",
  };

  return (
    <div>
      <h1 className="text-2xl font-black tracking-[-0.03em] mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-[#e5e5e5] rounded p-6">
          <p className="text-xs uppercase tracking-widest text-[#6b6b6b] mb-1">CA payé</p>
          <p className="text-2xl font-bold text-[#0a0a0a]">{fmt(caTotal)}</p>
        </div>
        <div className="bg-white border border-[#e5e5e5] rounded p-6">
          <p className="text-xs uppercase tracking-widest text-[#6b6b6b] mb-1">Commandes</p>
          <p className="text-2xl font-bold text-[#0a0a0a]">{totalCommandes ?? 0}</p>
        </div>
        <div className="bg-white border border-[#e5e5e5] rounded p-6">
          <p className="text-xs uppercase tracking-widest text-[#6b6b6b] mb-1">Panier moyen</p>
          <p className="text-2xl font-bold text-[#0a0a0a]">
            {totalCommandes ? fmt(caTotal / totalCommandes) : "—"}
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded p-6">
        <h2 className="font-bold mb-4 text-sm uppercase tracking-wider text-[#6b6b6b]">Commandes récentes</h2>
        {!commandesRecentes?.length ? (
          <p className="text-sm text-[#6b6b6b]">Aucune commande.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#6b6b6b] border-b border-[#e5e5e5]">
                <th className="pb-2 font-medium">Référence</th>
                <th className="pb-2 font-medium">Statut</th>
                <th className="pb-2 font-medium text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {commandesRecentes.map((cmd) => (
                <tr key={cmd.id} className="border-b border-[#f5f5f5] hover:bg-[#f5f5f5]">
                  <td className="py-2">
                    <Link href={`/admin/commandes/${cmd.id}`} className="font-mono text-xs text-[#1a56db] underline">
                      #{cmd.id.slice(0, 8).toUpperCase()}
                    </Link>
                    <span className="block text-[10px] text-[#6b6b6b]">
                      {new Date(cmd.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </td>
                  <td className="py-2 text-xs">{STATUTS[cmd.statut] ?? cmd.statut}</td>
                  <td className="py-2 text-right font-medium">{fmt(cmd.montant_ttc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mt-4">
          <Link href="/admin/commandes" className="text-xs text-[#1a56db] underline">
            Voir toutes les commandes →
          </Link>
        </div>
      </div>
    </div>
  );
}
