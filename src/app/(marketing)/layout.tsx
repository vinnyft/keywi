import { EnTete } from "@/components/marketing/EnTete";
import { PiedDePage } from "@/components/marketing/PiedDePage";

/** Gabarit du site public : en-tête + contenu + pied de page */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <EnTete />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <PiedDePage />
    </>
  );
}
