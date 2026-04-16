import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = ["Política", "Economia", "Cidades", "Cultura", "Esportes", "Tecnologia"];

export default function EditorialSectionsPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:py-16">
      <SectionHeading
        eyebrow="Editorias"
        title="Estrutura inicial para cobertura editorial"
        description="Página pública base para futuras listagens reais de notícias por editoria."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Card key={section} className="border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle>{section}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Espaço reservado para listagem pública com paginação, destaques e filtros.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
