import { Layers3 } from "lucide-react";

import { AdminNav } from "@/components/navigation/admin-nav";

export function AdminSidebar() {
  return (
    <aside className="hidden w-80 flex-col border-r border-sidebar-border bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(10,14,24,1))] text-sidebar-foreground lg:flex">
      <div className="border-b border-sidebar-border px-6 py-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-accent/60 px-3 py-1 text-xs uppercase tracking-[0.24em] text-sidebar-primary">
          <Layers3 className="size-3.5" />
          Admin
        </div>
        <h2 className="mt-4 text-2xl font-semibold">Portal Inovaverso</h2>
        <p className="mt-2 text-sm leading-6 text-sidebar-foreground/70">
          Operação editorial, mídia, taxonomia e governança do portal.
        </p>
      </div>
      <div className="flex flex-1 flex-col px-4 py-6">
        <AdminNav />
        <div className="mt-6 rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sidebar-primary">Base pronta</p>
          <p className="mt-2 text-sm leading-6 text-sidebar-foreground/75">
            Estrutura visual preparada para notícias, mídia, comentários, IA e logs sem retrabalho de layout.
          </p>
        </div>
      </div>
    </aside>
  );
}
