import { Navigation } from "@/components/ui/Navigation";
import { PiedDePage } from "@/components/ui/PiedDePage";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main id="contenu" className="pt-16">
        {children}
      </main>
      <PiedDePage />
    </>
  );
}
