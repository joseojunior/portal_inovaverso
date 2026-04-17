import { Settings } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Configuracoes"
        title="Preferencias do portal"
        description="Area dedicada a ajustes globais da operacao editorial e identidade da plataforma."
      />
      <Card>
        <CardHeader>
          <CardTitle>Visao geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Centralize aqui politicas de acesso, parametros operacionais e diretrizes de publicacao.</p>
          <p>Use este modulo para manter padrao entre equipe, conteudo e experiencia dos leitores.</p>
        </CardContent>
      </Card>
      <PagePlaceholder
        title="Configuracoes centrais do portal"
        description="A interface esta preparada para consolidar ajustes institucionais e operacionais em um unico lugar."
        bullets={[
          "Politicas de acesso e seguranca para equipe editorial.",
          "Preferencias de publicacao, moderacao e operacao diaria.",
          "Parametros globais de integracoes e funcionalidades do painel."
        ]}
        icon={<Settings className="size-5" />}
      />
    </div>
  );
}
