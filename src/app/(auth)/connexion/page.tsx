"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const router = useRouter();

  async function connexion(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password: mdp });
    if (error) {
      setErreur("Email ou mot de passe incorrect.");
    } else {
      router.push("/compte");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={connexion} className="space-y-5">
      <h1 className="text-xl font-black tracking-[-0.03em] text-center">Connexion</h1>
      <div>
        <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Email</label>
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-[#e5e5e5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Mot de passe</label>
        <input
          type="password" required value={mdp} onChange={(e) => setMdp(e.target.value)}
          className="w-full border border-[#e5e5e5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]"
        />
      </div>
      {erreur && <p className="text-xs text-[#c0392b]">{erreur}</p>}
      <button
        type="submit" disabled={loading}
        className="w-full py-3 text-sm font-semibold text-white bg-[#0a0a0a] rounded-sm hover:bg-[#1c1c1c] transition-colors disabled:opacity-50"
      >
        {loading ? "Connexion…" : "Se connecter"}
      </button>
      <p className="text-center text-xs text-[#6b6b6b]">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-[#1a56db] underline">Créer un compte</Link>
      </p>
    </form>
  );
}
