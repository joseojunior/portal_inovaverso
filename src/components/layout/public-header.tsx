import Link from "next/link";
import { Search, Sparkles } from "lucide-react";

import { Logo } from "@/components/branding/logo";
import { PublicNav } from "@/components/navigation/public-nav";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[rgba(11,7,23,0.78)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/52">
              <Search className="size-4 text-[#52d4ff]" />
              Cobertura em tempo real
            </div>
            <Button asChild variant="ghost" className="rounded-full text-white hover:bg-white/8 hover:text-white">
              <Link href="/entrar">Entrar</Link>
            </Button>
            <Button asChild className="gap-2 rounded-full bg-[#ff8c7a] px-5 text-[#180d1f] hover:bg-[#ffa18f]">
              <Link href="/admin">
                <Sparkles className="size-4" />
                Painel
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <PublicNav />
          <div className="flex items-center gap-3 lg:hidden">
            <Button asChild variant="ghost" size="sm" className="rounded-full text-white hover:bg-white/8 hover:text-white">
              <Link href="/entrar">Entrar</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full bg-[#ff8c7a] text-[#180d1f] hover:bg-[#ffa18f]">
              <Link href="/admin">Painel</Link>
            </Button>
          </div>
        </div>
        <PublicNav mobile />
      </div>
    </header>
  );
}
