import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export const metadata: Metadata = { title: "Palette — Admin" };

export default async function AdminCouleursPage() {
  const supabase = await createClient();
  const [
    { data: tileColors },
    { data: groutColors },
  ] = await Promise.all([
    supabase.from("colors").select("*").eq("type", "tile").order("ordre"),
    supabase.from("colors").select("*").eq("type", "grout").order("ordre"),
  ]);

  async function updateColor(formData: FormData) {
    "use server";
    const adminDb = createAdminClient();
    const id = String(formData.get("id"));
    await adminDb.from("colors").update({
      nom: String(formData.get("nom")),
      hex: String(formData.get("hex")),
      actif: formData.get("actif") === "on",
    }).eq("id", id);
    revalidatePath("/admin/couleurs");
  }

  function ColorRow({ color }: { color: { id: string; nom: string; hex: string; actif: boolean } }) {
    return (
      <form action={updateColor} className="flex items-center gap-3 py-2 border-b border-[#f5f5f5] last:border-0">
        <input type="hidden" name="id" value={color.id} />
        <div className="w-8 h-8 rounded-sm border border-[#e5e5e5]" style={{ backgroundColor: color.hex }} />
        <input type="color" name="hex" defaultValue={color.hex} className="w-8 h-8 rounded cursor-pointer border border-[#e5e5e5]" />
        <input type="text" name="nom" defaultValue={color.nom} className="flex-1 border border-[#e5e5e5] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#1a56db]" />
        <input type="text" defaultValue={color.hex} readOnly className="w-24 border border-[#e5e5e5] rounded px-2 py-1 text-xs font-mono text-[#6b6b6b] bg-[#f5f5f5]" />
        <input type="checkbox" name="actif" defaultChecked={color.actif} title="Actif" />
        <button type="submit" className="px-3 py-1 text-xs font-medium border border-[#e5e5e5] rounded hover:bg-[#f5f5f5] transition-colors">
          OK
        </button>
      </form>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-black tracking-[-0.03em]">Palette</h1>

      <div className="bg-white border border-[#e5e5e5] rounded p-6">
        <h2 className="font-bold mb-4">Couleurs de carreaux</h2>
        {tileColors?.map((c) => <ColorRow key={c.id} color={c} />)}
      </div>

      <div className="bg-white border border-[#e5e5e5] rounded p-6">
        <h2 className="font-bold mb-4">Couleurs de joint</h2>
        {groutColors?.map((c) => <ColorRow key={c.id} color={c} />)}
      </div>
    </div>
  );
}
