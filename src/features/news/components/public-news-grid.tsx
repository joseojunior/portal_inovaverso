import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";

import { formatEditorialDate } from "@/lib/format-editorial-date";
import type { PublicNewsItem } from "@/features/news/server/public-home";

type PublicNewsGridProps = {
  items: PublicNewsItem[];
};

function NewsImage({ item }: { item: PublicNewsItem }) {
  if (item.imageUrl) {
    return (
      <img
        src={item.imageUrl}
        alt={item.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-end bg-[radial-gradient(circle_at_top_left,rgba(82,212,255,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,140,122,0.26),transparent_28%),linear-gradient(135deg,rgba(30,16,51,0.96),rgba(15,9,29,0.92))] p-5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/46">{item.category}</span>
    </div>
  );
}

export function PublicNewsGrid({ items }: PublicNewsGridProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/${item.slug}`}
          className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] transition duration-300 hover:-translate-y-1 hover:border-[#52d4ff]/40 hover:shadow-[0_24px_60px_rgba(8,5,20,0.35)]"
        >
          <div className="relative h-56 overflow-hidden border-b border-white/8">
            <NewsImage item={item} />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_52%,rgba(9,6,20,0.24)_100%)]" />
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
              <span className="text-[#52d4ff]">{item.category}</span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-3.5 text-[#ff8c7a]" />
                {formatEditorialDate(item.publishedAt ?? item.updatedAt)}
              </span>
            </div>
            <div className="space-y-3">
              <h3 className="public-display text-2xl leading-tight tracking-[-0.03em] text-white">{item.title}</h3>
              <p className="text-sm leading-6 text-white/62">{item.summary}</p>
            </div>
            <div className="flex items-center justify-between text-sm text-white/56">
              <span>{item.author}</span>
              <span className="inline-flex items-center gap-2 text-[#ff8c7a]">
                Destaque
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
