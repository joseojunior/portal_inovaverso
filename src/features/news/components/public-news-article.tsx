import Link from "next/link";
import { CalendarDays, Layers3, PlayCircle, Tag as TagIcon, UserRound } from "lucide-react";

import { ResponsiveVideoEmbed } from "@/components/media/responsive-video-embed";
import { PublicCommentsSection } from "@/features/comments/components/public-comments-section";
import type { PublicNewsDetail, PublicNewsMediaItem } from "@/features/news/server/public-home";
import { formatEditorialDate } from "@/lib/format-editorial-date";

type PublicNewsArticleProps = {
  article: PublicNewsDetail;
};

function ContentBlocks({ content }: { content: string | null }) {
  const blocks = (content ?? "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return (
      <p className="text-lg leading-8 text-white/70">
        Esta materia ainda esta em atualizacao de conteudo.
      </p>
    );
  }

  return (
    <>
      {blocks.map((block, index) => (
        <p key={`${index}-${block.slice(0, 24)}`} className="text-lg leading-8 text-white/76 md:text-[1.15rem] md:leading-9">
          {block}
        </p>
      ))}
    </>
  );
}

function MediaBlock({ item, title, className }: { item: PublicNewsMediaItem; title: string; className?: string }) {
  if (item.type === "VIDEO" && item.embedUrl) {
    return <ResponsiveVideoEmbed embedUrl={item.embedUrl} title={title} className={className} />;
  }

  return (
    <div className={className}>
      <img src={item.thumbnailUrl ?? item.url} alt={item.altText ?? title} className="h-full w-full object-cover" />
    </div>
  );
}

export function PublicNewsArticle({ article }: PublicNewsArticleProps) {
  return (
    <article className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <header className="space-y-8">
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/52">
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[#52d4ff]">{article.category}</span>
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="size-3.5 text-[#ff8c7a]" />
            {formatEditorialDate(article.publishedAt ?? article.updatedAt)}
          </span>
        </div>

        <div className="space-y-5">
          <h1 className="public-display max-w-4xl text-4xl leading-[0.95] tracking-[-0.045em] text-white sm:text-5xl lg:text-7xl">
            {article.title}
          </h1>
          {article.subtitle ? <p className="max-w-3xl text-lg leading-8 text-white/70 sm:text-xl">{article.subtitle}</p> : null}
        </div>

        <div className="grid gap-4 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-5 sm:grid-cols-3 sm:p-6">
          <div className="flex items-start gap-3">
            <UserRound className="mt-0.5 size-5 text-[#52d4ff]" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/46">Autoria</p>
              <Link href={`/autor/${article.authorSlug}`} className="mt-2 block text-sm text-white/78 transition-colors hover:text-white">
                {article.author}
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Layers3 className="mt-0.5 size-5 text-[#ff8c7a]" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/46">Categoria</p>
              <Link href={`/editoria/${article.categorySlug}`} className="mt-2 block text-sm text-white/78 transition-colors hover:text-white">
                {article.category}
              </Link>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CalendarDays className="mt-0.5 size-5 text-[#52d4ff]" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/46">Publicado em</p>
              <p className="mt-2 text-sm text-white/78">{formatEditorialDate(article.publishedAt ?? article.updatedAt)}</p>
            </div>
          </div>
        </div>

        {article.featuredMedia ? (
          <div className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#10091d] shadow-[0_20px_60px_rgba(7,4,18,0.35)]">
            <MediaBlock
              item={article.featuredMedia}
              title={article.featuredMedia.altText ?? article.title}
              className={article.featuredMedia.type === "VIDEO" ? "p-3 sm:p-4" : ""}
            />
            {article.featuredMedia.caption || article.featuredMedia.credit ? (
              <div className="space-y-1 border-t border-white/10 px-5 py-4 text-sm text-white/65">
                {article.featuredMedia.caption ? <p>{article.featuredMedia.caption}</p> : null}
                {article.featuredMedia.credit ? <p className="text-xs uppercase tracking-[0.18em] text-white/42">{article.featuredMedia.credit}</p> : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[1.9rem] border border-dashed border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-6 py-8 text-sm leading-6 text-white/52">
            Em breve esta materia recebera destaque visual.
          </div>
        )}
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="space-y-6">
          <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 sm:p-8">
            <div className="space-y-6">
              <p className="text-xl leading-8 text-white/78">{article.summary}</p>
              <div className="h-px bg-gradient-to-r from-[#52d4ff]/40 via-white/10 to-transparent" />
              <div className="space-y-6">
                <ContentBlocks content={article.content} />
              </div>
            </div>
          </div>

          {article.gallery.length > 0 ? (
            <section className="space-y-4 rounded-[1.75rem] border border-white/10 bg-[rgba(255,255,255,0.02)] p-6">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#52d4ff]">Midias associadas</p>
                <p className="text-sm text-white/52">Galeria de apoio com imagens e videos relacionados.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {article.gallery.map((item) => (
                  <figure key={item.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
                    <MediaBlock item={item} title={item.altText ?? article.title} className={item.type === "VIDEO" ? "p-3" : ""} />
                    <figcaption className="space-y-2 px-4 py-3 text-sm text-white/65">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/42">
                        {item.type === "VIDEO" ? <PlayCircle className="size-3.5 text-[#52d4ff]" /> : null}
                        <span>{item.type === "VIDEO" ? "Video embedado" : "Imagem editorial"}</span>
                      </div>
                      {item.caption ? <p>{item.caption}</p> : null}
                      {item.credit ? <p className="text-xs uppercase tracking-[0.18em] text-white/42">{item.credit}</p> : null}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          <PublicCommentsSection newsId={article.id} newsSlug={article.slug} commentsEnabled={article.commentsEnabled} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#ff8c7a]">Tags</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {article.tags.length > 0 ? (
                article.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-white/76"
                  >
                    <TagIcon className="size-3.5 text-[#52d4ff]" />
                    {tag.name}
                  </span>
                ))
              ) : (
                <p className="text-sm text-white/48">Sem tags editoriais vinculadas.</p>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#52d4ff]">Navegacao</p>
            <div className="mt-4 space-y-3 text-sm text-white/68">
              <Link href="/" className="block transition-colors hover:text-white">
                Voltar para a home
              </Link>
              <Link href="/editoria" className="block transition-colors hover:text-white">
                Explorar editorias
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
