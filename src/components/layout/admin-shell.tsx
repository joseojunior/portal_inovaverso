import type { PropsWithChildren } from "react";

import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

export function AdminShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f8fb_0%,#eef4fb_100%)] lg:grid lg:grid-cols-[20rem_minmax(0,1fr)]">
      <AdminSidebar />
      <div className="flex min-h-screen flex-col">
        <AdminHeader />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
