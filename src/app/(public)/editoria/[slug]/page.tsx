import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicNewsCollectionPage } from "@/features/news/components/public-news-collection-page";
import { getPublicCategoryBySlug } from "@/features/news/server/public-home";

export const dynamic = "force-dynamic";

type PublicCategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PublicCategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Categoria não encontrada"
    };
  }

  return {
    title: category.seoTitle ?? category.name,
    description:
      category.seoDescription ??
      category.description ??
      `Cobertura pública da editoria ${category.name} no Portal Inovaverso.`
  };
}

export default async function PublicCategoryPage({ params }: PublicCategoryPageProps) {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <PublicNewsCollectionPage
      eyebrow="Editoria"
      title={category.name}
      description={
        category.description ??
        `Seleção pública de matérias publicadas na editoria ${category.name}, com leitura contínua e visual consistente com a home do portal.`
      }
      items={category.news}
      asideTitle="Recorte editorial"
      asideBody="Esta página reúne apenas notícias publicadas desta editoria, preservando o mesmo padrão visual da home e preparando o terreno para filtros mais avançados depois."
      emptyTitle="Nenhuma matéria publicada nesta editoria"
      emptyDescription="Quando houver publicações com status PUBLISHED vinculadas a esta categoria, elas aparecerão aqui automaticamente."
    />
  );
}
