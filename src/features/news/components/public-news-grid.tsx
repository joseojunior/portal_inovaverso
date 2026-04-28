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
    <div className="flex h-full w-full items-end bg-[linear-gradient(135deg,#eaf6ff_0%,#f6fbff_60%,#ffffff_100%)] p-5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">{item.category}</span>
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
          className="group overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)]"
        >
          <div className="relative h-56 overflow-hidden border-b border-slate-200">
            <NewsImage item={item} />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,transparent_52%,rgba(148,163,184,0.16)_100%)]" />
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              <span className="text-cyan-700">{item.category}</span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-3.5 text-[#ff8c7a]" />
                {formatEditorialDate(item.publishedAt ?? item.updatedAt)}
              </span>
            </div>
            <div className="space-y-3">
              <h3 className="public-display text-2xl leading-tight tracking-[-0.03em] text-slate-900">{item.title}</h3>
              <p className="text-sm leading-6 text-slate-600">{item.summary}</p>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>{item.author}</span>
              <span className="inline-flex items-center gap-2 text-[#ff8c7a]">
                Ler
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
