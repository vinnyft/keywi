import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AccueilCube } from "@/components/configurateur/AccueilCube";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("settings")
    .select("texte_accueil")
    .single();

  const baseline = settings?.texte_accueil ?? "Le mobilier mosaïque sur-mesure.";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto px-6 py-16 lg:py-24 gap-12">
        {/* Copy */}
        <div className="flex flex-col gap-8 max-w-lg">
          <h1 className="text-6xl sm:text-8xl lg:text-9xl font-black tracking-[-0.04em] text-[#0a0a0a] leading-none">
            KUBE
          </h1>
          <p className="text-xl sm:text-2xl text-[#1c1c1c] font-light leading-relaxed max-w-md">
            {baseline}
          </p>
          <p className="text-[#6b6b6b] leading-relaxed">
            Tables basses, bouts de canapé, tabourets et socles — chaque pièce est unique,
            composée carreau par carreau selon vos choix.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/configurateur"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-[#0a0a0a] rounded-sm hover:bg-[#1c1c1c] transition-colors"
            >
              Configurer mon meuble
            </Link>
            <Link
              href="/a-propos"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-[#0a0a0a] border border-[#e5e5e5] rounded-sm hover:border-[#0a0a0a] transition-colors"
            >
              Découvrir KUBE
            </Link>
          </div>
        </div>

        {/* 3D Cube héro */}
        <div className="w-full max-w-sm lg:max-w-lg xl:max-w-xl aspect-square">
          <AccueilCube />
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#f5f5f5] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { titre: "Sur-mesure", texte: "Chaque dimension, chaque couleur, chaque joint — décidé par vous en direct." },
              { titre: "Mosaïque artisanale", texte: "Carreaux posés à la main dans notre atelier. Matériau pérenne, entretien minimal." },
              { titre: "Rendu fidèle", texte: "Le configurateur 3D reproduit exactement ce qui sera fabriqué." },
            ].map(({ titre, texte }) => (
              <div key={titre} className="p-8 bg-white border border-[#e5e5e5] rounded-sm">
                <h3 className="text-lg font-bold text-[#0a0a0a] mb-3">{titre}</h3>
                <p className="text-[#6b6b6b] leading-relaxed text-sm">{texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
