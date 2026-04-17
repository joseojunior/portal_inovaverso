import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sections = ["Politica", "Economia", "Cidades", "Cultura", "Esportes", "Tecnologia"];

export default function EditorialSectionsPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:py-16">
      <SectionHeading
        eyebrow="Editorias"
        title="Acompanhe os temas que movem o dia a dia"
        description="Navegue pelas principais editorias e encontre as publicacoes mais relevantes de cada area."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Card key={section} className="border-border/70 bg-card/85">
            <CardHeader>
              <CardTitle>{section}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Conteudo selecionado com foco em contexto, impacto e clareza.</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
