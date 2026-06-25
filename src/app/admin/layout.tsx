import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/ui/Logo";

const navLinks = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/commandes", label: "Commandes" },
  { href: "/admin/parametres", label: "Paramètres" },
  { href: "/admin/couleurs", label: "Palette" },
  { href: "/admin/promotions", label: "Promotions" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-[#e5e5e5] bg-white flex flex-col shrink-0">
        <div className="p-6 border-b border-[#e5e5e5]">
          <Logo className="text-xl" />
          <p className="text-[10px] uppercase tracking-widest text-[#6b6b6b] mt-1">Admin</p>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="block px-3 py-2 text-sm rounded hover:bg-[#f5f5f5] text-[#1c1c1c] hover:text-[#0a0a0a] transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-[#e5e5e5]">
          <Link href="/" className="text-xs text-[#6b6b6b] hover:text-[#0a0a0a]">← Site</Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto bg-[#f5f5f5]">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
