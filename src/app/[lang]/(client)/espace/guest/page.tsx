import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ClesGuest, type CleGuest } from "@/components/client/ClesGuest";
import { RafraichirTempsReel } from "@/components/client/RafraichirTempsReel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return { title: lang === "en" ? "My keys to pick up" : "Mes clés à récupérer" };
}

/**
 * Vue Guest : les clés partagées avec moi — code de retrait, depuis
 * combien de temps elles sont au point relais, coût du dépôt et
 * lien pour aller les récupérer. Les données viennent de la RPC
 * guest_mes_cles (security definer : un guest ne voit que ce qui
 * lui a été partagé).
 */
export default async function PageGuest({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const en = lang === "en";
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

      <h1 className="text-2xl font-black">
        {en ? "My keys to pick up" : "Mes clés à récupérer"}
      </h1>
      <p className="mt-1 text-gray-600">
        {en
          ? "The access shared with you, with everything you need to pick the keys up."
          : "Les accès qui vous ont été partagés, avec tout ce qu'il faut pour les récupérer."}
      </p>

      <ClesGuest cles={cles} />
    </div>
  );
}
