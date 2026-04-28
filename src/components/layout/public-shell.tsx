import type { PropsWithChildren } from "react";

import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export function PublicShell({ children }: PropsWithChildren) {
  return (
    <div className="public-theme min-h-screen bg-[radial-gradient(circle_at_top,rgba(82,212,255,0.12),transparent_26%),linear-gradient(180deg,#f4f8ff_0%,#f7fbff_48%,#f2f7ff_100%)] text-slate-900">
      <PublicHeader />
      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[linear-gradient(180deg,rgba(82,212,255,0.12),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 top-[20rem] h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent" />
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
