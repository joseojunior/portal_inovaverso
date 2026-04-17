"use client";

import { Bot, FileText, FolderTree, Hash, History, ImageIcon, LayoutDashboard, Menu, MessageSquareText, Newspaper, PlayCircle, Settings, UserSquare2 } from "lucide-react";

import { NavLink } from "@/components/navigation/nav-link";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/news", label: "Noticias", icon: Newspaper },
  { href: "/admin/comments", label: "Comentarios", icon: MessageSquareText },
  { href: "/admin/logs", label: "Logs", icon: History },
  { href: "/admin/media", label: "Midia", icon: ImageIcon },
  { href: "/admin/categories", label: "Categorias", icon: FolderTree },
  { href: "/admin/tags", label: "Tags", icon: Hash },
  { href: "/admin/authors", label: "Autores", icon: UserSquare2 },
  { href: "/admin/ai-configs", label: "IA - Configuracoes", icon: Bot },
  { href: "/admin/ai-jobs", label: "IA - Execucoes", icon: PlayCircle },
  { href: "/admin/ai-drafts", label: "IA - Sugestoes", icon: FileText },
  { href: "/admin/settings", label: "Configuracoes", icon: Settings }
];

type AdminNavProps = {
  mobile?: boolean;
};

export function AdminNav({ mobile = false }: AdminNavProps) {
  const content = items.map((item) => {
    const Icon = item.icon;

    return (
      <NavLink
        key={item.href}
        href={item.href}
        label={item.label}
        exact={item.exact}
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
        activeClassName="bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
        inactiveClassName="text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <>
          <Icon className="size-4" />
          {item.label}
        </>
      </NavLink>
    );
  });

  if (mobile) {
    return (
      <details className="group lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm">
          <Menu className="size-4" />
          Navegacao
        </summary>
        <div className="mt-3 rounded-2xl border border-sidebar-border bg-sidebar p-3 shadow-xl">
          <nav className="grid gap-2">{content}</nav>
        </div>
      </details>
    );
  }

  return <nav className="flex flex-1 flex-col gap-2">{content}</nav>;
}
