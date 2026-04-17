import Link from "next/link";

import { siteConfig } from "@/lib/site";

export function PublicFooter() {
  return (
    <footer className="border-t border-white/8 bg-[rgba(10,7,20,0.96)] backdrop-blur">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#52d4ff]">Portal de noticias</p>
          <div>
            <p className="public-display text-xl text-white">{siteConfig.name}</p>
            <p className="max-w-xl text-sm leading-6 text-white/56">{siteConfig.description}</p>
          </div>
        </div>
        <div className="grid gap-3 text-sm text-white/56 md:justify-items-end">
          <Link href="/editoria" className="hover:text-white">
            Explorar editorias
          </Link>
          <Link href="/regioes" className="hover:text-white">
            Cobertura por regioes
          </Link>
          <Link href="/sobre" className="hover:text-white">
            Sobre o portal
          </Link>
          <p className="pt-2 text-right">Jornalismo digital com foco em clareza, relevancia e experiencia de leitura.</p>
        </div>
      </div>
    </footer>
  );
}
