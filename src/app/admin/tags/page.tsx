import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagsAdminPanel } from "@/features/tags/components/tags-admin-panel";
import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";

export default async function AdminTagsPage() {
  await requireAdminUser();

  const tags = await db.tag.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          newsTags: true
        }
      }
    }
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Tags"
        title="Classificação granular"
        description="Taxonomia complementar para refinar a descoberta de notícias e apoiar combinações editoriais."
      />
      <Card>
        <CardHeader>
          <CardTitle>Uso no domínio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Tags ampliam a classificação além da categoria principal e já estão ligadas ao núcleo editorial por `NewsTag`.</p>
          <p>O módulo está preparado para reaproveitamento futuro em drafts editoriais e em filtros do portal público.</p>
        </CardContent>
      </Card>
      <TagsAdminPanel
        tags={tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          description: tag.description,
          isActive: tag.isActive,
          newsCount: tag._count.newsTags,
          createdAt: tag.createdAt.toISOString()
        }))}
      />
    </div>
  );
}
