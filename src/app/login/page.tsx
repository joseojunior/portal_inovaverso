import { ShieldCheck } from "lucide-react";

import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(24,119,242,0.2),_transparent_35%),linear-gradient(180deg,#f4f8ff_0%,#fbfaf7_100%)] px-6 py-12">
      <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[1fr_26rem] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" />
            Acesso seguro do painel editorial
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-foreground">
              Controle de publicacao e operacao do portal.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Esta area e exclusiva para equipes autorizadas. Use seu acesso administrativo para revisar, publicar e
              gerenciar o conteudo do portal.
            </p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
