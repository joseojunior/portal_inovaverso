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

  return <div className="absolute inset-0 bg-[linear-gradient(135deg,#eaf6ff_0%,#f4fbff_55%,#f9fdff_100%)]" />;
}

export function PublicNewsHero({ story, sideStories }: PublicNewsHeroProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_22rem]">
      <Link
        href={`/${story.slug}`}
        className="group relative block min-h-[28rem] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-0.5"
      >
        <StoryBackdrop story={story} />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.6)_40%,rgba(255,255,255,0.98)_100%)]" />
        <div className="relative flex h-full flex-col justify-end p-6 sm:p-8 lg:p-10">
          <div className="mb-5 flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-700">
              {story.category}
            </span>
            <span>{formatEditorialDate(story.publishedAt ?? story.updatedAt)}</span>
          </div>
          <div className="max-w-4xl space-y-4">
            <h1 className="public-display text-4xl leading-[0.95] tracking-[-0.04em] text-slate-900 sm:text-5xl lg:text-7xl">
              {story.title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{story.summary}</p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span>Por {story.author}</span>
            <span className="inline-flex items-center gap-2">
              <Clock3 className="size-4 text-cyan-700" />
              Publicada em {formatEditorialDate(story.publishedAt ?? story.updatedAt)}
            </span>
            <span className="inline-flex items-center gap-2 text-[#ff8c7a]">
              Ler matéria
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </Link>

      <aside className="grid gap-4">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#ff8c7a]">Radar editorial</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            As principais chamadas do dia com visual clean e leitura direta.
          </p>
        </div>
        {sideStories.map((item) => (
          <Link
            key={item.id}
            href={`/${item.slug}`}
            className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 transition-transform duration-300 hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              <span className="text-cyan-700">{item.category}</span>
              <span>{formatEditorialDate(item.publishedAt ?? item.updatedAt)}</span>
            </div>
            <h2 className="public-display mt-4 text-2xl leading-tight tracking-[-0.03em] text-slate-900 transition-colors group-hover:text-cyan-800">
              {item.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
            <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
              <span>{item.author}</span>
              <ArrowUpRight className="size-4 text-[#ff8c7a]" />
            </div>
          </Link>
        ))}
      </aside>
    </section>
  );
}
