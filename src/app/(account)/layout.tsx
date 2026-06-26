import { Navigation } from "@/components/ui/Navigation";
import { PiedDePage } from "@/components/ui/PiedDePage";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navigation />
      <main id="contenu" className="pt-16 min-h-screen">
        {children}
      </main>
      <PiedDePage />
    </>
  );
}
