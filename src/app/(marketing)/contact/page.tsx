import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact",
  description: "Une question ? L'équipe Keywi vous répond.",
};

export default function PageContact() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-black">Nous contacter</h1>
      <p className="mt-3 text-lg text-gray-600">
        Une question sur un dépôt, un retrait, ou l&apos;envie de rejoindre le
        réseau ? Choisissez le bon canal.
      </p>

      <div className="mt-8 space-y-4">
        <a
          href="mailto:bonjour@keywi.fr"
          className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 hover:border-primaire"
        >
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primaire-pale text-primaire-fonce">
            <Mail size={22} aria-hidden="true" />
          </span>
          <span>
            <span className="block font-bold">Par email</span>
            <span className="text-gray-600">bonjour@keywi.fr — réponse sous 24 h ouvrées</span>
          </span>
        </a>

        <Link
          href="/faq"
          className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 hover:border-primaire"
        >
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-menthe-pale text-menthe">
            <MessageSquare size={22} aria-hidden="true" />
          </span>
          <span>
            <span className="block font-bold">Questions fréquentes</span>
            <span className="text-gray-600">La réponse est peut-être déjà dans la FAQ</span>
          </span>
        </Link>

        <Link
          href="/devenir-point-relais"
          className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 hover:border-primaire"
        >
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-corail/10 text-corail">
            <Store size={22} aria-hidden="true" />
          </span>
          <span>
            <span className="block font-bold">Vous êtes commerçant ?</span>
            <span className="text-gray-600">Proposez votre commerce comme point relais</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
