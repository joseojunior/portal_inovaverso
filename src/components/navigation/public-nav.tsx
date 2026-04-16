"use client";

import { Menu } from "lucide-react";

import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/navigation/nav-link";

type PublicNavProps = {
  mobile?: boolean;
};

export function PublicNav({ mobile = false }: PublicNavProps) {
  if (mobile) {
    return (
      <details className="group md:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white shadow-sm backdrop-blur">
          <Menu className="size-4" />
          Menu
        </summary>
        <nav className="mt-3 grid gap-2 rounded-2xl border border-white/10 bg-[#140b24]/95 p-3 shadow-xl backdrop-blur">
          {siteConfig.publicNavigation.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              exact={item.href === "/"}
              className="rounded-xl px-4 py-3 text-sm font-medium transition-colors"
              activeClassName="bg-[#52d4ff] text-[#11091c]"
              inactiveClassName="text-white/64 hover:bg-white/8 hover:text-white"
            />
          ))}
        </nav>
      </details>
    );
  }

  return (
    <nav className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/6 p-1 shadow-sm backdrop-blur md:flex">
      {siteConfig.publicNavigation.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          exact={item.href === "/"}
          className={cn("rounded-full px-4 py-2 text-sm font-medium transition-colors")}
          activeClassName="bg-[#52d4ff] text-[#11091c] shadow-sm"
          inactiveClassName="text-white/62 hover:text-white"
        />
      ))}
    </nav>
  );
}
