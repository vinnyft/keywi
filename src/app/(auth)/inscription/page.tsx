"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function InscriptionPage() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);

  async function inscription(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur("");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password: mdp,
      options: { data: { nom } },
    });
    if (error) {
      setErreur(error.message);
    } else {
      setSucces(true);
    }
    setLoading(false);
  }

  if (succes) {
    return (
      <div className="text-center space-y-4">
        <p className="text-2xl">✓</p>
        <h1 className="font-bold text-[#0a0a0a]">Compte créé !</h1>
        <p className="text-sm text-[#6b6b6b]">Vérifiez votre email pour confirmer votre compte.</p>
        <Link href="/connexion" className="text-sm text-[#1a56db] underline">Se connecter</Link>
      </div>
    );
  }

  return (
    <form onSubmit={inscription} className="space-y-5">
      <h1 className="text-xl font-black tracking-[-0.03em] text-center">Créer un compte</h1>
      <div>
        <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Nom</label>
        <input type="text" required value={nom} onChange={(e) => setNom(e.target.value)}
          className="w-full border border-[#e5e5e5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]" />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Email</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-[#e5e5e5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]" />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6b6b6b] mb-1">Mot de passe</label>
        <input type="password" required minLength={8} value={mdp} onChange={(e) => setMdp(e.target.value)}
          className="w-full border border-[#e5e5e5] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#1a56db]" />
      </div>
      {erreur && <p className="text-xs text-[#c0392b]">{erreur}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-3 text-sm font-semibold text-white bg-[#0a0a0a] rounded-sm hover:bg-[#1c1c1c] transition-colors disabled:opacity-50">
        {loading ? "Création…" : "Créer mon compte"}
      </button>
      <p className="text-center text-xs text-[#6b6b6b]">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="text-[#1a56db] underline">Se connecter</Link>
      </p>
    </form>
  );
}
