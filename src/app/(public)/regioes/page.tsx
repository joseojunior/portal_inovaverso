import { MapPinned } from "lucide-react";

import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const regions = ["Manaus", "Região Metropolitana", "Interior do Amazonas", "Norte", "Brasil"];

export default function RegionsPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:py-16">
      <SectionHeading
        eyebrow="Regiões"
        title="Cobertura geográfica pronta para expansão"
        description="A base do projeto já contempla estados, cidades e filtros regionais no modelo de dados."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {regions.map((region) => (
          <Card key={region} className="border-border/70 bg-card/85">
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <div className="rounded-full bg-accent p-2 text-accent-foreground">
                <MapPinned className="size-4" />
              </div>
              <CardTitle>{region}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Futura página de agregação regional com destaques, filtros e contexto local.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
