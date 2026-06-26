"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { usePanierStore } from "@/lib/configurateur/store";
import { Logo } from "./Logo";

export function Navigation() {
  const pathname = usePathname();
  const totalArticles = usePanierStore((s) => s.totalArticles());
  const [open, setOpen] = useState(false);

  const liens = [
    { href: "/configurateur", label: "Configurer" },
    { href: "/a-propos", label: "Concept" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#e5e5e5]">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo className="text-2xl" />

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {liens.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`text-sm font-medium tracking-wide transition-colors ${
                  pathname === href
                    ? "text-[#0a0a0a]"
                    : "text-[#6b6b6b] hover:text-[#0a0a0a]"
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          {/* Panier */}
          <Link
            href="/panier"
            className="relative flex items-center gap-1 text-sm font-medium text-[#0a0a0a] hover:opacity-70 transition-opacity"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            {totalArticles > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#1a56db] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalArticles}
              </span>
            )}
          </Link>

          {/* Compte */}
          <Link
            href="/compte"
            className="hidden md:flex items-center gap-1 text-sm font-medium text-[#6b6b6b] hover:text-[#0a0a0a] transition-colors"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </Link>

          {/* CTA Configurer */}
          <Link
            href="/configurateur"
            className="hidden md:inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-[#0a0a0a] rounded-sm hover:bg-[#1c1c1c] transition-colors"
          >
            Configurer
          </Link>

          {/* Mobile burger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-1"
            aria-label="Menu"
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              }
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-[#e5e5e5] px-6 py-4 flex flex-col gap-4">
          {liens.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="text-base font-medium text-[#0a0a0a]"
            >
              {label}
            </Link>
          ))}
          <Link href="/compte" onClick={() => setOpen(false)} className="text-base font-medium text-[#6b6b6b]">
            Mon compte
          </Link>
        </div>
      )}
    </header>
  );
}
