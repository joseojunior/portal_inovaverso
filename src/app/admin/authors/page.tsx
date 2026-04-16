import { requireAdminUser } from "@/lib/auth/admin-session";
import { db } from "@/lib/db";
import { AuthorsAdminPanel } from "@/features/authors/components/authors-admin-panel";
import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SocialLinksRecord = Record<string, string>;

function parseSocialLinks(value: unknown): SocialLinksRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string");

  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

export default async function AdminAuthorsPage() {
  await requireAdminUser();

  const authors = await db.author.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      avatarUrl: true,
      bio: true,
      socialLinks: true,
      isActive: true,
      _count: {
        select: {
          news: true
        }
      }
    }
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Autores"
        title="Perfis editoriais"
        description="Gestão de autores preparada para vínculo com notícias e futura página pública individual."
      />
      <Card>
        <CardHeader>
          <CardTitle>Modelo disponível</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Autores mantêm identidade editorial própria, sem se confundir com contas administrativas.</p>
          <p>O perfil já suporta avatar, bio, slug estável e links sociais para exposição pública futura.</p>
        </CardContent>
      </Card>
      <AuthorsAdminPanel
        authors={authors.map((author) => ({
          id: author.id,
          name: author.name,
          slug: author.slug,
          avatarUrl: author.avatarUrl,
          bio: author.bio,
          socialLinks: parseSocialLinks(author.socialLinks),
          isActive: author.isActive,
          newsCount: author._count.news
        }))}
      />
    </div>
  );
}
