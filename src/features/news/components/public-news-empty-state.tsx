import { Compass, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PublicNewsEmptyState() {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(19,10,36,0.96),rgba(10,7,23,0.9))] shadow-[0_24px_80px_rgba(8,4,20,0.45)]">
      <div className="grid gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-12">
        <div className="space-y-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#52d4ff]">Portal em preparação</p>
          <h1 className="public-display max-w-3xl text-4xl leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
            A home pública já está pronta para publicar assim que as primeiras notícias entrarem em produção.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/68">
            Nenhuma notícia publicada foi encontrada no banco neste momento. O layout editorial já está integrado ao domínio real e só exibirá conteúdo `PUBLISHED`.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full bg-[#52d4ff] px-6 text-[#100919] hover:bg-[#74ddff]">
              <a href="/admin/news">Publicar primeira notícia</a>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/8">
              <a href="/sobre">Ver estrutura do portal</a>
            </Button>
          </div>
        </div>
        <div className="grid gap-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5">
            <Sparkles className="size-5 text-[#ff8c7a]" />
            <p className="mt-4 text-lg text-white">Sem mocks, sem placeholders falsos.</p>
            <p className="mt-2 text-sm leading-6 text-white/58">A home pública só consome dados reais do banco.</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5">
            <Compass className="size-5 text-[#52d4ff]" />
            <p className="mt-4 text-lg text-white">Estrutura pronta para crescimento editorial.</p>
            <p className="mt-2 text-sm leading-6 text-white/58">Hero, cards e grid já aceitam mídia, taxonomia e datas reais.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
