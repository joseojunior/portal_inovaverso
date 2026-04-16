import { Settings } from "lucide-react";

import { PagePlaceholder } from "@/components/layout/page-placeholder";
import { SectionHeading } from "@/components/layout/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Configurações"
        title="Configuração operacional inicial"
        description="Espaço reservado para parâmetros do portal, autenticação e futuras integrações."
      />
      <Card>
        <CardHeader>
          <CardTitle>Ambiente atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Autenticação inicial via `next-auth` com provider de credenciais.</p>
          <p>Segredo, URL da aplicação e credenciais administrativas vêm do `.env`.</p>
          <p>Próxima etapa: migrar para fluxo persistido com usuários e permissões completas.</p>
        </CardContent>
      </Card>
      <PagePlaceholder
        title="Configurações centrais do portal"
        description="A interface já comporta evolução para parâmetros operacionais, identidade editorial e integrações administrativas."
        bullets={[
          "Credenciais, políticas de sessão e parâmetros institucionais.",
          "Configurações futuras de IA, mídia e módulos do painel.",
          "Área adequada para controles globais sem misturar com o portal público."
        ]}
        icon={<Settings className="size-5" />}
      />
    </div>
  );
}
