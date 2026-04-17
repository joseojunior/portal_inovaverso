import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 md:py-16">
      <SectionHeading
        eyebrow="Sobre"
        title="Jornalismo digital com curadoria humana"
        description="O Portal Inovaverso combina agilidade, criterio editorial e experiencia de leitura moderna."
      />
      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle>Nossa proposta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
          <p>
            Publicamos conteudo relevante para o dia a dia, com foco em contexto, confiabilidade e linguagem clara.
          </p>
          <p>
            A plataforma foi desenhada para evoluir continuamente, com novas secoes, formatos de midia e recursos para
            comunidade.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
