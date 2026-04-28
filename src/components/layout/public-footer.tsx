import Link from "next/link";

import { siteConfig } from "@/lib/site";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">Portal de noticias</p>
          <div>
            <p className="public-display text-xl text-slate-900">{siteConfig.name}</p>
            <p className="max-w-xl text-sm leading-6 text-slate-600">{siteConfig.description}</p>
          </div>
        </div>
        <div className="grid gap-3 text-sm text-slate-600 md:justify-items-end">
          <Link href="/editoria" className="hover:text-slate-900">
            Explorar editorias
          </Link>
          <Link href="/regioes" className="hover:text-slate-900">
            Cobertura por regioes
          </Link>
          <Link href="/sobre" className="hover:text-slate-900">
            Sobre o portal
          </Link>
          <p className="pt-2 text-right">Jornalismo digital com foco em clareza, relevancia e experiencia de leitura.</p>
        </div>
      </div>
    </footer>
  );
}
