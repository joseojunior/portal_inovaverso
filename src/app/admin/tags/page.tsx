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
        title="Classificacao por assunto"
        description="Refine o contexto das noticias com marcacoes tematicas consistentes."
      />
      <Card>
        <CardHeader>
          <CardTitle>Boas praticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Prefira tags curtas e claras para melhorar descoberta e relacao entre materias.</p>
          <p>Evite duplicidade de termos para manter o acervo organizado e facil de navegar.</p>
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
