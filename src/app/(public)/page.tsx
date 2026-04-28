import { Dot, Newspaper, Radio } from "lucide-react";

import { SectionHeading } from "@/components/layout/section-heading";
import { PublicNewsEmptyState } from "@/features/news/components/public-news-empty-state";
import { PublicNewsGrid } from "@/features/news/components/public-news-grid";
import { PublicNewsHero } from "@/features/news/components/public-news-hero";
import { getPublicHomeNews } from "@/features/news/server/public-home";

export const dynamic = "force-dynamic";

const highlights = [
  {
    title: "Plantão",
    description: "Atualizações em tempo real com foco no que realmente impacta o leitor.",
    icon: <Radio className="size-4 text-cyan-600" />
  },
  {
    title: "Contexto",
    description: "Além do fato: explicação objetiva para leitura rápida e útil.",
    icon: <Dot className="size-4 text-[#ff8c7a]" />
  },
  {
    title: "Edição",
    description: "Curadoria editorial para priorizar relevância e clareza visual.",
    icon: <Newspaper className="size-4 text-cyan-600" />
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <PublicNewsHero story={heroStory} sideStories={sideStories} />

      <section className="grid gap-4 border-y border-slate-200 py-4 md:grid-cols-3">
        {highlights.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-200 bg-white/80 p-4"
          >
            <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-slate-50 p-2">{item.icon}</div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-800">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          </div>
        ))}
      </section>

      {gridStories.length > 0 ? (
        <section className="space-y-8">
          <SectionHeading
            eyebrow="Últimas publicações"
            title="Notícias em destaque"
            description="Cobertura recente organizada em um layout limpo, direto e com leitura confortável."
          />
          <PublicNewsGrid items={gridStories} />
        </section>
      ) : null}
    </div>
  );
}
