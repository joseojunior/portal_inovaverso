import { Bolt, Layers3, Orbit } from "lucide-react";

import { SectionHeading } from "@/components/layout/section-heading";
import { PublicNewsEmptyState } from "@/features/news/components/public-news-empty-state";
import { PublicNewsGrid } from "@/features/news/components/public-news-grid";
import { PublicNewsHero } from "@/features/news/components/public-news-hero";
import { getPublicHomeNews } from "@/features/news/server/public-home";

const pillars = [
  {
    title: "Cobertura com ritmo editorial",
    description: "A home separa destaque principal, radar lateral e grade de leitura para evitar monotonia visual.",
    icon: <Layers3 className="size-5 text-[#52d4ff]" />
  },
  {
    title: "Identidade tech com assinatura própria",
    description: "Base escura em roxo profundo com acentos ciano e coral, sem cair no visual genérico de template.",
    icon: <Orbit className="size-5 text-[#ff8c7a]" />
  },
  {
    title: "Leitura limpa e responsiva",
    description: "Tipografia forte, contraste alto e blocos respirando bem em desktop e mobile.",
    icon: <Bolt className="size-5 text-[#52d4ff]" />
  }
];

export default async function HomePage() {
  const news = await getPublicHomeNews(10);

  if (news.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <PublicNewsEmptyState />
      </div>
    );
  }

  const [heroStory, ...rest] = news;
  const sideStories = rest.slice(0, 3);
  const gridStories = rest.slice(3);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-5 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <PublicNewsHero story={heroStory} sideStories={sideStories} />

      <section className="grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 backdrop-blur-sm"
          >
            <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 p-3">{pillar.icon}</div>
            <h2 className="public-display text-2xl tracking-[-0.03em] text-white">{pillar.title}</h2>
            <p className="mt-3 text-sm leading-6 text-white/62">{pillar.description}</p>
          </div>
        ))}
      </section>

      {gridStories.length > 0 ? (
        <section className="space-y-8">
          <SectionHeading
            eyebrow="Últimas publicações"
            title="Mais cobertura do portal"
            description="Grade editorial construída apenas com notícias publicadas, preservando contraste e leitura fluida."
          />
          <PublicNewsGrid items={gridStories} />
        </section>
      ) : null}
    </div>
  );
}
