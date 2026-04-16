export const siteConfig = {
  name: "Portal Inovaverso",
  description: "Plataforma profissional de noticias com portal publico e painel administrativo.",
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
    { href: "/admin/ai-configs", label: "IA Configs" },
    { href: "/admin/ai-jobs", label: "IA Jobs" },
    { href: "/admin/ai-drafts", label: "IA Drafts" },
    { href: "/admin/settings", label: "Configuracoes" }
  ]
} as const;
