import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Confirmation de commande" };

interface Props {
  searchParams: Promise<{ order?: string; session_id?: string }>;
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const { order, session_id } = await searchParams;
  const orderId = order ?? session_id;

  let commande = null;
  if (orderId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .or(`id.eq.${orderId},stripe_session_id.eq.${orderId}`)
      .single();
    commande = data;
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-[#e8f9f3] rounded-full flex items-center justify-center">
        <svg width="28" height="28" fill="none" stroke="#0e7a5c" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h1 className="text-4xl font-black tracking-[-0.04em] mb-4">Commande confirmée</h1>
      <p className="text-[#6b6b6b] mb-2">Merci pour votre commande !</p>
      {commande && (
        <p className="text-sm text-[#6b6b6b] mb-6">
          Référence : <span className="font-mono font-medium text-[#0a0a0a]">{commande.id.slice(0, 8).toUpperCase()}</span>
        </p>
      )}
      <p className="text-sm text-[#6b6b6b] mb-8">
        Vous recevrez un email de confirmation. La fabrication démarre sous 24 h.
        Délai de livraison estimé : 6 à 8 semaines.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/compte/commandes" className="px-6 py-3 text-sm font-semibold text-white bg-[#0a0a0a] rounded-sm hover:bg-[#1c1c1c] transition-colors">
          Suivre ma commande
        </Link>
        <Link href="/configurateur" className="px-6 py-3 text-sm font-medium text-[#0a0a0a] border border-[#e5e5e5] rounded-sm hover:border-[#0a0a0a] transition-colors">
          Configurer un autre meuble
        </Link>
      </div>
    </div>
  );
}
