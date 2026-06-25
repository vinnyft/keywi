import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="KUBE — accueil"
      className={`inline-block font-black tracking-[-0.06em] text-[#0a0a0a] no-underline hover:opacity-70 transition-opacity ${className}`}
    >
      KUBE
    </Link>
  );
}
