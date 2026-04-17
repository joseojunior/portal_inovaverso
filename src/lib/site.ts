export const siteConfig = {
  name: "Portal Inovaverso",
  description: "Jornalismo digital com cobertura atual, curadoria editorial e leitura fluida.",
  publicNavigation: [
    { href: "/", label: "Inicio" },
    { href: "/editoria", label: "Editorias" },
    { href: "/regioes", label: "Regioes" },
    { href: "/sobre", label: "Sobre" }
  ],
  adminNavigation: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/news", label: "Noticias" },
    { href: "/admin/comments", label: "Comentarios" },
    { href: "/admin/logs", label: "Logs" },
    { href: "/admin/media", label: "Midia" },
    { href: "/admin/categories", label: "Categorias" },
    { href: "/admin/tags", label: "Tags" },
    { href: "/admin/authors", label: "Autores" },
    { href: "/admin/ai-configs", label: "IA - Configuracoes" },
    { href: "/admin/ai-jobs", label: "IA - Execucoes" },
    { href: "/admin/ai-drafts", label: "IA - Sugestoes" },
    { href: "/admin/settings", label: "Configuracoes" }
  ]
} as const;
