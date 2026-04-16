import { LogOut, ShieldCheck } from "lucide-react";

import { auth, signOut } from "@/lib/auth";
import { AdminNav } from "@/components/navigation/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export async function AdminHeader() {
  const session = await auth();

  return (
    <header className="border-b border-border/70 bg-card/80 backdrop-blur">
      <div className="flex flex-col gap-4 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Ambiente protegido</p>
            <h1 className="text-xl font-semibold text-foreground">Painel administrativo</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="accent" className="hidden gap-1 rounded-full px-3 py-1 sm:inline-flex">
              <ShieldCheck className="size-3.5" />
              {session?.user?.role ?? "Acesso autenticado"}
            </Badge>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button type="submit" variant="outline" className="gap-2">
                <LogOut className="size-4" />
                Sair
              </Button>
            </form>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {session?.user?.name ?? "Operador administrativo"}
            </p>
            <p className="truncate text-sm text-muted-foreground">{session?.user?.email ?? "Sessão ativa"}</p>
          </div>
          <AdminNav mobile />
        </div>
      </div>
    </header>
  );
}
