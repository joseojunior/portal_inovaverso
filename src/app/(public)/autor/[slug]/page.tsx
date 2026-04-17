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
      title: "Autor nao encontrado"
    };
  }

  return {
    title: author.name,
    description: author.bio ?? `Perfil de ${author.name} com suas materias publicadas no portal.`
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
        `Acompanhe as materias assinadas por ${author.name} e veja a cobertura editorial por autoria.`
      }
      items={author.news}
      asideTitle="Sobre o autor"
      asideBody="Aqui voce encontra as publicacoes mais recentes do autor e seu historico no portal."
      avatarUrl={author.avatarUrl}
      emptyTitle="Nenhuma materia publicada por este autor"
      emptyDescription="Assim que novas publicacoes forem ao ar, elas aparecerao nesta pagina."
    />
  );
}
