import "dotenv/config";

import { MediaStatus, MediaType, NewsStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";

async function main() {
  const admin = await db.adminUser.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true }
  });

  if (!admin) {
    throw new Error("Nenhum admin ativo encontrado.");
  }

  const author = await db.author.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true }
  });

  if (!author) {
    throw new Error("Nenhum autor ativo encontrado.");
  }

  const category = await db.category.findFirst({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true }
  });

  if (!category) {
    throw new Error("Nenhuma categoria ativa encontrada.");
  }

  const location = await db.city.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, stateId: true, countryId: true, name: true }
  });

  const tags = await db.tag.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    take: 3,
    select: { id: true, name: true }
  });

  if (tags.length === 0) {
    throw new Error("Nenhuma tag ativa encontrada.");
  }

  const title = "Inovaverso lança cobertura especial de tecnologia, IA e inovação no Brasil";
  const slug = slugify(title);

  const existing = await db.news.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, status: true }
  });

  if (existing) {
    console.log("Notícia já existe, nenhuma nova criação foi feita:");
    console.log(existing);
    return;
  }

  const now = Date.now();
  const mediaBase = {
    uploadedByAdminId: admin.id,
    approvedByAdminId: admin.id,
    status: MediaStatus.APPROVED,
    type: MediaType.IMAGE,
    storageProvider: "external",
    mimeType: "image/jpeg",
    extension: "jpg",
    approvedAt: new Date()
  };

  const featuredMedia = await db.mediaFile.create({
    data: {
      ...mediaBase,
      storageKey: `seed/featured-${now}.jpg`,
      url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80",
      thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=70",
      altText: "Painel digital com dados e luzes em azul ciano.",
      caption: "Cenário de inovação tecnológica para cobertura especial do Inovaverso.",
      credit: "Unsplash / ThisisEngineering",
      sourceUrl: "https://unsplash.com/photos/9D_rUDe7xvA",
      sourceName: "Unsplash",
      originalFilename: "featured-tech.jpg"
    },
    select: { id: true, url: true }
  });

  const galleryMedia = await db.mediaFile.createManyAndReturn({
    data: [
      {
        ...mediaBase,
        storageKey: `seed/gallery-1-${now}.jpg`,
        url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=70",
        altText: "Mão interagindo com interface holográfica.",
        caption: "Interface digital representando transformação tecnológica.",
        credit: "Unsplash / Luke Chesser",
        sourceUrl: "https://unsplash.com/photos/eICUFSeirc0",
        sourceName: "Unsplash",
        originalFilename: "gallery-1.jpg"
      },
      {
        ...mediaBase,
        storageKey: `seed/gallery-2-${now}.jpg`,
        url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&q=80",
        thumbnailUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=70",
        altText: "Servidor em data center com iluminação em azul.",
        caption: "Infraestrutura digital que sustenta novos serviços de IA.",
        credit: "Unsplash / Philipp Katzenberger",
        sourceUrl: "https://unsplash.com/photos/iIJrUoeRoCQ",
        sourceName: "Unsplash",
        originalFilename: "gallery-2.jpg"
      }
    ],
    select: { id: true, url: true }
  });

  const publishedAt = new Date();

  const news = await db.news.create({
    data: {
      title,
      subtitle: "Portal inaugura série editorial com foco em economia digital e impacto regional.",
      slug,
      summary:
        "A cobertura especial reúne reportagens sobre IA, transformação digital e empreendedorismo tecnológico, com foco no Brasil e curadoria editorial humana.",
      content: `
## Nova fase editorial
O Inovaverso inicia uma fase de cobertura dedicada a tecnologia, inovação e inteligência artificial, com reportagens aprofundadas e linguagem acessível.

## O que você vai acompanhar
- tendências de IA aplicadas a negócios e serviços;
- ecossistema de startups e economia digital;
- políticas públicas e formação de talentos em tecnologia.

## Compromisso de qualidade
Toda publicação passa por revisão editorial, com validação de fontes e contexto para garantir precisão e utilidade ao leitor.
      `.trim(),
      status: NewsStatus.PUBLISHED,
      categoryId: category.id,
      authorId: author.id,
      countryId: location?.countryId ?? null,
      stateId: location?.stateId ?? null,
      cityId: location?.id ?? null,
      featuredMediaId: featuredMedia.id,
      isAiAssisted: false,
      commentsEnabled: true,
      seoTitle: "Inovaverso lança cobertura especial de tecnologia e IA no Brasil",
      seoDescription: "Série editorial com análise de tendências em tecnologia, IA e inovação no Brasil.",
      createdByAdminId: admin.id,
      updatedByAdminId: admin.id,
      publishedByAdminId: admin.id,
      publishedAt
    },
    select: { id: true, slug: true, title: true, status: true }
  });

  await db.newsTag.createMany({
    data: tags.map((tag) => ({ newsId: news.id, tagId: tag.id }))
  });

  await db.newsMedia.createMany({
    data: [
      { newsId: news.id, mediaFileId: featuredMedia.id, position: 0, isInline: false },
      ...galleryMedia.map((media, index) => ({
        newsId: news.id,
        mediaFileId: media.id,
        position: index + 1,
        isInline: false
      }))
    ]
  });

  await db.newsSource.createMany({
    data: [
      {
        newsId: news.id,
        title: "Relatório de inovação e transformação digital no Brasil",
        url: "https://www.gov.br/mcti/pt-br",
        publisherName: "Ministério da Ciência, Tecnologia e Inovação",
        isPrimary: true,
        sortOrder: 0,
        accessedAt: new Date()
      },
      {
        newsId: news.id,
        title: "Panorama de tecnologia e empreendedorismo",
        url: "https://abstartups.com.br/",
        publisherName: "ABStartups",
        isPrimary: false,
        sortOrder: 1,
        accessedAt: new Date()
      }
    ]
  });

  await db.publicationHistory.create({
    data: {
      newsId: news.id,
      adminUserId: admin.id,
      previousStatus: NewsStatus.DRAFT,
      nextStatus: NewsStatus.PUBLISHED,
      titleSnapshot: title,
      slugSnapshot: slug,
      note: "Publicação inicial da matéria completa de demonstração.",
      effectiveAt: publishedAt
    }
  });

  await db.auditLog.create({
    data: {
      adminUserId: admin.id,
      entityType: "NEWS",
      entityId: news.id,
      action: "PUBLISH",
      description: "Criação de notícia completa para validação do portal.",
      metadata: {
        slug,
        category: category.name,
        author: author.name,
        city: location?.name ?? null,
        tags: tags.map((tag) => tag.name),
        mediaCount: 1 + galleryMedia.length
      }
    }
  });

  console.log("Notícia criada com sucesso:");
  console.log({
    title: news.title,
    slug: news.slug,
    status: news.status,
    admin: admin.email,
    category: category.name,
    author: author.name,
    tags: tags.map((tag) => tag.name),
    featuredMediaUrl: featuredMedia.url,
    galleryCount: galleryMedia.length
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
