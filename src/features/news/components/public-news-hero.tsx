import Link from "next/link";
import { ArrowUpRight, Clock3 } from "lucide-react";

import { formatEditorialDate } from "@/lib/format-editorial-date";
import type { PublicNewsItem } from "@/features/news/server/public-home";

type PublicNewsHeroProps = {
  story: PublicNewsItem;
  sideStories: PublicNewsItem[];
};

function StoryBackdrop({ story }: { story: PublicNewsItem }) {
  if (story.imageUrl) {
    return (
      <img
        src={story.imageUrl}
        alt={story.title}
        className="absolute inset-0 h-full w-full object-cover opacity-60"
      />
    );
  }

  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(53,208,255,0.24),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,108,92,0.28),transparent_26%),linear-gradient(135deg,rgba(34,13,64,0.98),rgba(15,8,33,0.94))]" />
  );
}

export function PublicNewsHero({ story, sideStories }: PublicNewsHeroProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_22rem]">
      <Link
        href={`/${story.slug}`}
        className="group relative block min-h-[28rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[#11081f] shadow-[0_24px_80px_rgba(8,4,20,0.48)] transition-transform duration-300 hover:-translate-y-0.5"
      >
        <StoryBackdrop story={story} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,6,20,0.05),rgba(10,6,20,0.5)_42%,rgba(8,4,18,0.96)_100%)]" />
        <div className="relative flex h-full flex-col justify-end p-6 sm:p-8 lg:p-10">
          <div className="mb-5 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[#52d4ff]">
              {story.category}
            </span>
            <span>{formatEditorialDate(story.publishedAt ?? story.updatedAt)}</span>
          </div>
          <div className="max-w-4xl space-y-4">
            <h1 className="public-display text-4xl leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl lg:text-7xl">
              {story.title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/74 sm:text-lg">{story.summary}</p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/70">
            <span>Por {story.author}</span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4 text-[#52d4ff]" />
              Publicada em {formatEditorialDate(story.publishedAt ?? story.updatedAt)}
            </span>
            <span className="inline-flex items-center gap-2 text-[#ff8c7a]">
              Leitura editorial
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </Link>

      <aside className="grid gap-4">
        <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ff8c7a]">Radar editorial</p>
          <p className="mt-3 text-sm leading-6 text-white/64">
            Recorte rápido das publicações mais recentes do portal, com foco em hierarquia forte e leitura limpa.
          </p>
        </div>
        {sideStories.map((item) => (
          <Link
            key={item.id}
            href={`/${item.slug}`}
            className="group rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 transition-transform duration-300 hover:-translate-y-0.5 hover:border-[#52d4ff]/40 hover:shadow-[0_16px_32px_rgba(16,12,31,0.35)]"
          >
            <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">
              <span className="text-[#52d4ff]">{item.category}</span>
              <span>{formatEditorialDate(item.publishedAt ?? item.updatedAt)}</span>
            </div>
            <h2 className="public-display mt-4 text-2xl leading-tight tracking-[-0.03em] text-white transition-colors group-hover:text-[#dff7ff]">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/62">{item.summary}</p>
            <div className="mt-5 flex items-center justify-between text-sm text-white/58">
              <span>{item.author}</span>
              <ArrowUpRight className="size-4 text-[#ff8c7a]" />
            </div>
          </Link>
        ))}
      </aside>
    </section>
  );
}
