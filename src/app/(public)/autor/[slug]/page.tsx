import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicNewsCollectionPage } from "@/features/news/components/public-news-collection-page";
import { getPublicAuthorBySlug } from "@/features/news/server/public-home";

export const dynamic = "force-dynamic";

type PublicAuthorPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: PublicAuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getPublicAuthorBySlug(slug);

  if (!author) {
    return {
      title: "Autor não encontrado"
    };
  }

  return {
    title: author.name,
    description: author.bio ?? `Perfil público de ${author.name} com suas matérias publicadas no portal.`
  };
}

export default async function PublicAuthorPage({ params }: PublicAuthorPageProps) {
  const { slug } = await params;
  const author = await getPublicAuthorBySlug(slug);

  if (!author) {
    notFound();
  }

  return (
    <PublicNewsCollectionPage
      eyebrow="Autor"
      title={author.name}
      description={
        author.bio ??
        `Página pública de autoria com a lista de matérias publicadas por ${author.name}, pronta para evoluir depois com perfil editorial mais completo.`
      }
      items={author.news}
      asideTitle="Perfil editorial"
      asideBody="A área de autoria já acomoda identidade pública, histórico de publicações e poderá receber redes sociais, avatar expandido e biografia longa depois."
      avatarUrl={author.avatarUrl}
      emptyTitle="Nenhuma matéria publicada por este autor"
      emptyDescription="Quando houver notícias publicadas associadas a este autor, elas serão exibidas aqui automaticamente."
    />
  );
}
