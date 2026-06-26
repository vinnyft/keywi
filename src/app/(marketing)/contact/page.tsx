import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <div className="max-w-xl mx-auto px-6 py-24">
      <h1 className="text-5xl font-black tracking-[-0.04em] mb-8">Contact</h1>
      <p className="text-[#6b6b6b] mb-8">Une question sur votre configuration ? Un projet sur-mesure hors configurateur ? Écrivez-nous.</p>
      <a
        href="mailto:bonjour@kube.fr"
        className="inline-block text-lg font-semibold text-[#1a56db] underline-offset-4 underline hover:text-[#1447b4] transition-colors"
      >
        bonjour@kube.fr
      </a>
    </div>
  );
}
