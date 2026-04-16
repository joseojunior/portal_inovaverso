import { Newspaper, UserRound } from "lucide-react";

import { PublicNewsGrid } from "@/features/news/components/public-news-grid";
import type { PublicNewsItem } from "@/features/news/server/public-home";

type PublicNewsCollectionPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: PublicNewsItem[];
  asideTitle: string;
  asideBody: string;
  avatarUrl?: string | null;
  emptyTitle: string;
  emptyDescription: string;
};

export function PublicNewsCollectionPage({
  eyebrow,
  title,
  description,
  items,
  asideTitle,
  asideBody,
  avatarUrl,
  emptyTitle,
  emptyDescription
}: PublicNewsCollectionPageProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-5 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_20rem]">
        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(19,10,36,0.96),rgba(10,7,23,0.88))] p-6 shadow-[0_24px_80px_rgba(8,4,20,0.4)] sm:p-8 lg:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-[#52d4ff]">{eyebrow}</p>
          <h1 className="public-display mt-5 max-w-4xl text-4xl leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/66 sm:text-lg">{description}</p>
        </div>

        <aside className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={title}
              className="mb-4 size-16 rounded-2xl border border-white/10 object-cover"
            />
          ) : (
            <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <UserRound className="size-6 text-[#ff8c7a]" />
            </div>
          )}
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#ff8c7a]">{asideTitle}</p>
          <p className="mt-4 text-sm leading-6 text-white/62">{asideBody}</p>
        </aside>
      </section>

      {items.length > 0 ? (
        <PublicNewsGrid items={items} />
      ) : (
        <section className="rounded-[1.75rem] border border-dashed border-white/12 bg-[rgba(255,255,255,0.02)] px-6 py-10 text-center">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
            <div className="inline-flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              <Newspaper className="size-6 text-[#52d4ff]" />
            </div>
            <h2 className="public-display text-3xl tracking-[-0.03em] text-white">{emptyTitle}</h2>
            <p className="text-sm leading-7 text-white/58">{emptyDescription}</p>
          </div>
        </section>
      )}
    </div>
  );
}
