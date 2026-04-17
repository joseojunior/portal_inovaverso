import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicNewsArticle } from "@/features/news/components/public-news-article";
import { getPublicNewsBySlug } from "@/features/news/server/public-home";

export const dynamic = "force-dynamic";

type PublicNewsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PublicNewsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicNewsBySlug(slug);

  if (!article) {
    return {
      title: "Notícia não encontrada"
    };
  }

  return {
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.summary
  };
}

export default async function PublicNewsPage({ params }: PublicNewsPageProps) {
  const { slug } = await params;
  const article = await getPublicNewsBySlug(slug);

  if (!article) {
    notFound();
  }

  return <PublicNewsArticle article={article} />;
}
