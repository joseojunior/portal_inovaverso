import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaLibraryPanel } from "@/features/media/components/media-library-panel";
import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";

export default async function AdminMediaPage() {
  await requireAdminUser();

  const mediaItems = await db.mediaFile.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      type: true,
      url: true,
      embedUrl: true,
      thumbnailUrl: true,
      altText: true,
      caption: true,
      credit: true,
      sourceUrl: true,
      sourceName: true,
      status: true,
      originalFilename: true,
      mimeType: true,
      createdAt: true,
      uploadedByAdmin: {
        select: {
          name: true
        }
      }
    }
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Midia"
        title="Biblioteca editorial"
        description="Upload de imagens, cadastro de video embedado, revisao editorial e estrutura pronta para featured media e galeria."
      />
      <Card>
        <CardHeader>
          <CardTitle>Fluxo da etapa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Admin envia uma imagem ao storage ou registra um video embedado por URL.</p>
          <p>2. O sistema cria o ativo em `MediaFile` com `pending_review` e preserva o tipo da midia.</p>
          <p>3. A midia fica listada com preview e pode ser revisada antes de uso em noticias publicadas.</p>
        </CardContent>
      </Card>
      <MediaLibraryPanel
        items={mediaItems.map((item) => ({
          id: item.id,
          type: item.type,
          publicUrl: item.url,
          embedUrl: item.embedUrl,
          thumbnailUrl: item.thumbnailUrl,
          altText: item.altText,
          caption: item.caption,
          credit: item.credit,
          sourceUrl: item.sourceUrl,
          sourceName: item.sourceName,
          status: item.status,
          originalFilename: item.originalFilename,
          mimeType: item.mimeType,
          createdAt: item.createdAt.toISOString(),
          uploadedByName: item.uploadedByAdmin.name
        }))}
      />
    </div>
  );
}
