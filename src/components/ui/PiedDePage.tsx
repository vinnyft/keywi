import Link from "next/link";

export function PiedDePage() {
  return (
    <footer className="border-t border-[#e5e5e5] mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-[#6b6b6b]">
        <div>
          <p className="font-black text-xl tracking-[-0.06em] text-[#0a0a0a] mb-2">KUBE</p>
          <p>Mobilier mosaïque sur-mesure.</p>
          <p className="mt-1">Fabriqué en France.</p>
        </div>
        <div>
          <p className="font-semibold text-[#0a0a0a] mb-3">Navigation</p>
          <ul className="space-y-2">
            <li><Link href="/configurateur" className="hover:text-[#0a0a0a] transition-colors">Configurateur</Link></li>
            <li><Link href="/a-propos" className="hover:text-[#0a0a0a] transition-colors">Concept</Link></li>
            <li><Link href="/contact" className="hover:text-[#0a0a0a] transition-colors">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-[#0a0a0a] mb-3">Légal</p>
          <ul className="space-y-2">
            <li><Link href="/cgv" className="hover:text-[#0a0a0a] transition-colors">CGV</Link></li>
            <li><Link href="/mentions-legales" className="hover:text-[#0a0a0a] transition-colors">Mentions légales</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 pb-8 text-xs text-[#6b6b6b]">
        © {new Date().getFullYear()} KUBE. Tous droits réservés.
      </div>
    </footer>
  );
}
