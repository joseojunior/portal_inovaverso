import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12 md:py-16">
      <SectionHeading
        eyebrow="Sobre"
        title="Portal pronto para governança editorial profissional"
        description="A fundação técnica respeita a separação entre experiência pública, operação interna e domínio do negócio."
      />
      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle>Direção desta etapa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
          <p>
            Nesta fase, a plataforma entrega base de projeto, autenticação inicial, layouts e modelagem
            relacional sem ainda ativar fluxos complexos de redação, comentários ou IA.
          </p>
          <p>
            Isso mantém a arquitetura coerente desde o início e reduz retrabalho nas próximas etapas do produto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
