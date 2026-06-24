import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ClesGuest, type CleGuest } from "@/components/client/ClesGuest";
import { RafraichirTempsReel } from "@/components/client/RafraichirTempsReel";

export const metadata: Metadata = { title: "Mes clés à récupérer" };

/**
 * Vue Guest : les clés partagées avec moi — code de retrait, depuis
 * combien de temps elles sont au point relais, coût du dépôt et
 * lien pour aller les récupérer. Les données viennent de la RPC
 * guest_mes_cles (security definer : un guest ne voit que ce qui
 * lui a été partagé).
 */
export default async function PageGuest() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase.rpc("guest_mes_cles");
  const cles = (data ?? []) as unknown as CleGuest[];

  return (
    <div>
      {/* Le statut change en direct quand le commerçant scanne */}
      <RafraichirTempsReel table="keys" />
      <RafraichirTempsReel table="notifications" filtre={`user_id=eq.${user!.id}`} />

      <h1 className="text-2xl font-black">Mes clés à récupérer</h1>
      <p className="mt-1 text-gray-600">
        Les accès qui vous ont été partagés, avec tout ce qu&apos;il faut pour
        les récupérer.
      </p>

      <ClesGuest cles={cles} />
    </div>
  );
}
