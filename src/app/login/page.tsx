import { ShieldCheck } from "lucide-react";

import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(24,119,242,0.2),_transparent_35%),linear-gradient(180deg,#f4f8ff_0%,#fbfaf7_100%)] px-6 py-12">
      <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_26rem] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Autenticação inicial do painel administrativo
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-foreground">
              Base de acesso segura para a operação editorial.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              O acesso administrativo agora usa `AdminUser` persistido no banco. O próximo passo natural é
              evoluir permissões e gestão operacional sobre esse núcleo autenticado.
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
