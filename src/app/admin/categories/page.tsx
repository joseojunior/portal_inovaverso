import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";
import { CategoriesAdminPanel } from "@/features/categories/components/categories-admin-panel";
import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminCategoriesPage() {
  await requireAdminUser();

  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      isActive: true,
      sortOrder: true,
      createdAt: true,
      parentId: true,
      parent: {
        select: {
          name: true
        }
      },
      _count: {
        select: {
          news: true,
          children: true
        }
      }
    }
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Categorias"
        title="Organizacao editorial"
        description="Defina as secoes do portal e mantenha a cobertura bem estruturada."
      />
      <Card>
        <CardHeader>
          <CardTitle>Boas praticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Use nomes diretos e slugs curtos para facilitar navegacao e SEO.</p>
          <p>Revise periodicamente categorias pouco usadas para manter a estrutura objetiva.</p>
        </CardContent>
      </Card>
      <CategoriesAdminPanel
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          seoTitle: category.seoTitle,
          seoDescription: category.seoDescription,
          isActive: category.isActive,
          sortOrder: category.sortOrder,
          createdAt: category.createdAt.toISOString(),
          parentId: category.parentId,
          parentName: category.parent?.name ?? null,
          newsCount: category._count.news,
          childrenCount: category._count.children
        }))}
      />
    </div>
  );
}
