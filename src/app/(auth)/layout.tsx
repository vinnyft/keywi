import { Logo } from "@/components/ui/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f5f5] px-4">
      <Logo className="text-3xl mb-12" />
      <div className="w-full max-w-sm bg-white border border-[#e5e5e5] rounded p-8">
        {children}
      </div>
    </div>
  );
}
