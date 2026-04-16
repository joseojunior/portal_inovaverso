# Arquitetura do Sistema

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- PostgreSQL
- Prisma
- Supabase Auth
- Supabase Storage

## Estrutura
- Portal público (frontend)
- Admin (interface protegida)
- API / Server Actions
- Banco relacional
- Sistema de mídia
- Jobs de IA (assíncronos)

## Separação
- UI pública separada do admin
- Lógica de domínio isolada em lib/
- Banco controlado via Prisma

## IA
- Serviço lógico separado
- Não publica diretamente
- Apenas gera drafts

## Jobs
- Execução assíncrona
- Cron para coleta de notícias
