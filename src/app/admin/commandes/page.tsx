import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Commandes — Admin" };

const STATUTS: Record<string, { label: string; cls: string }> = {
  en_attente_paiement: { label: "Attente paiement", cls: "bg-[#fffbeb] text-[#d97706]" },
  payee:              { label: "Payée", cls: "bg-[#e8f9f3] text-[#0e7a5c]" },
  en_production:      { label: "En production", cls: "bg-[#eff4ff] text-[#1a56db]" },
  expediee:           { label: "Expédiée", cls: "bg-[#eff4ff] text-[#1a56db]" },
  livree:             { label: "Livrée", cls: "bg-[#e8f9f3] text-[#0e7a5c]" },
  annulee:            { label: "Annulée", cls: "bg-[#fdecea] text-[#c0392b]" },
};

export default async function AdminCommandesPage() {
  const supabase = await createClient();
  const { data: commandes } = await supabase
    .from("orders")
    .select("id, statut, montant_ttc, created_at, user_id")
    .order("created_at", { ascending: false });

  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

  return (
    <div>
      <h1 className="text-2xl font-black tracking-[-0.03em] mb-6">Commandes</h1>

      <div className="bg-white border border-[#e5e5e5] rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f5f5f5] text-left text-[#6b6b6b] text-xs uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">Référence</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium text-right">Montant</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {commandes?.map((cmd) => {
              const s = STATUTS[cmd.statut] ?? { label: cmd.statut, cls: "bg-[#f5f5f5] text-[#6b6b6b]" };
              return (
                <tr key={cmd.id} className="border-t border-[#e5e5e5] hover:bg-[#f5f5f5]">
                  <td className="px-4 py-3 font-mono text-xs">
                    #{cmd.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-[#6b6b6b]">
                    {new Date(cmd.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{fmt(cmd.montant_ttc)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/commandes/${cmd.id}`} className="text-[#1a56db] text-xs underline">
                      Voir →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!commandes || commandes.length === 0) && (
          <p className="text-center text-[#6b6b6b] text-sm py-12">Aucune commande.</p>
        )}
      </div>
    </div>
  );
}
