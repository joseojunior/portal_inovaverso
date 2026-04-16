import type { PropsWithChildren } from "react";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export function PublicShell({ children }: PropsWithChildren) {
  return (
    <div className="public-theme min-h-screen bg-[radial-gradient(circle_at_top,rgba(82,212,255,0.16),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(255,140,122,0.16),transparent_18%),linear-gradient(180deg,#12081f_0%,#0d0718_46%,#090611_100%)]">
      <PublicHeader />
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(32,18,58,0.52),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 top-[20rem] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
