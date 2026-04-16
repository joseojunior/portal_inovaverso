# Contrato do Domínio Editorial

## Objetivo
Definir as regras mínimas de negócio que sustentam o schema Prisma do núcleo editorial antes da migration inicial.

## Papéis administrativos

### super_admin
- Controle total da plataforma
- Gerencia acessos, configurações globais, IA e governança completa

### admin
- Opera a gestão ampla do portal
- Pode publicar conteúdo e administrar módulos estruturais

### editor
- Opera o fluxo editorial de conteúdo
- Cria, revisa e organiza materiais editoriais

### moderator
- Atua na moderação de comentários
- Não participa do fluxo principal de publicação de notícias

## Matriz de permissões

| Ação | super_admin | admin | editor | moderator |
|---|---|---|---|---|
| Criar notícia | sim | sim | sim | não |
| Editar notícia | sim | sim | sim | não |
| Revisar notícia | sim | sim | sim | não |
| Aprovar notícia | sim | sim | não | não |
| Publicar notícia | sim | sim | não | não |
| Agendar notícia | sim | sim | não | não |
| Arquivar notícia | sim | sim | sim | não |
| Rejeitar notícia | sim | sim | sim | não |
| Gerenciar mídia | sim | sim | sim | não |
| Aprovar mídia | sim | sim | sim | não |
| Gerenciar categorias | sim | sim | sim | não |
| Gerenciar tags | sim | sim | sim | não |
| Gerenciar autores | sim | sim | sim | não |
| Moderar comentários | sim | sim | não | sim |
| Gerenciar IA | sim | sim | não | não |
| Gerenciar configurações globais | sim | sim | não | não |
| Gerenciar admins e papéis | sim | não | não | não |
| Ver logs de auditoria | sim | sim | parcial | não |

## Fluxo editorial da notícia

### Status
- `DRAFT`
- `DRAFT_AI`
- `PENDING_REVIEW`
- `APPROVED`
- `SCHEDULED`
- `PUBLISHED`
- `REJECTED`
- `ARCHIVED`

### Transições válidas
- `DRAFT -> PENDING_REVIEW`
- `DRAFT -> ARCHIVED`
- `DRAFT_AI -> PENDING_REVIEW`
- `DRAFT_AI -> REJECTED`
- `PENDING_REVIEW -> APPROVED`
- `PENDING_REVIEW -> REJECTED`
- `PENDING_REVIEW -> DRAFT`
- `APPROVED -> SCHEDULED`
- `APPROVED -> PUBLISHED`
- `APPROVED -> DRAFT`
- `SCHEDULED -> PUBLISHED`
- `SCHEDULED -> DRAFT`
- `PUBLISHED -> ARCHIVED`
- `PUBLISHED -> DRAFT`
- `REJECTED -> DRAFT`
- `ARCHIVED -> DRAFT`

### Papéis por transição
- `editor`, `admin`, `super_admin`: criar rascunho, editar, enviar para revisão, rejeitar, arquivar e devolver para rascunho
- `admin`, `super_admin`: aprovar, agendar, publicar, despublicar e restaurar conteúdo publicado

### Regras do fluxo
- Publicação nunca ocorre sem aprovação prévia
- IA nunca executa transição para `PUBLISHED`
- Toda mudança relevante de status deve registrar `PublicationHistory`
- Toda ação administrativa relevante deve registrar `AuditLog`

## Governança da mídia

### Upload
- `editor`, `admin` e `super_admin` podem subir mídia

### Status inicial
- Toda mídia entra como `PENDING_REVIEW`

### Aprovação
- `editor`, `admin` e `super_admin` podem aprovar ou rejeitar mídia

### Vínculo com notícia
- Destaque principal por `featuredMediaId` em `News`
- Galeria e uso inline por `NewsMedia`
- `NewsMedia.position` define ordenação editorial

### Regra de publicação
- Notícia publicada deve usar apenas mídia `APPROVED`

### Mídia sugerida por IA
- Nunca vira ativo publicado automaticamente
- Entra apenas como sugestão em `AIDraftMediaSuggestion`
- Seleção e validação final são sempre humanas

## Comentários

### Presença no domínio
- Comentários permanecem no schema desde já

### Ativação
- Controlados por `News.commentsEnabled`
- Se `commentsEnabled = false`, a notícia não aceita novos comentários

### Regra operacional
- Comentários em notícia publicada entram em `PENDING`
- Moderação restrita por padrão a `moderator`, `admin` e `super_admin`

### Ações de moderação
- Aprovar
- Ocultar
- Marcar como spam
- Rejeitar

## IA editorial

### Princípios
- IA nunca publica
- IA nunca aprova mídia
- IA nunca substitui decisão editorial humana

### Papel da IA
- Buscar fontes
- Gerar rascunho
- Sugerir estrutura de conteúdo
- Sugerir tags
- Sugerir mídia

### Fluxo mínimo
- `AISearchConfig` define contexto e parâmetros
- `AIJob` executa a rotina
- `AIDraft` armazena o resultado
- Humano revisa e decide o destino do material

### Como draft vira notícia
- Recomendado: `AIDraft` servir de origem para criação ou atualização de `News`
- A notícia derivada entra no fluxo editorial normal
- O status inicial recomendado é `DRAFT_AI`

### Fontes e sugestões
- Fontes devem ser preservadas e auditáveis
- Sugestões de mídia são apenas apoio e nunca decisão final

## Auditoria

### Registrar em `AuditLog`
- Login e logout administrativo
- Criação, edição e exclusão de notícia
- Mudanças de status em notícia
- Aprovação, rejeição, publicação e arquivamento
- Upload, aprovação e rejeição de mídia
- Moderação de comentários
- Criação e edição de categorias, tags e autores
- Criação, edição, ativação e desativação de configurações de IA
- Execução, falha e conclusão de jobs de IA
- Aprovação e rejeição de drafts de IA
- Alterações de papéis e ativação de `AdminUser`

### Registrar em `PublicationHistory`
- Status anterior
- Status novo
- Título no momento da transição
- Slug no momento da transição
- Admin responsável
- Data efetiva
- Observação opcional

## Recomendações antes da migration
- Trocar `AIJob.jobType` de `String` para enum
- Avaliar `deletedAt` para soft delete em entidades administrativas e editoriais
- Avaliar retomada de uma tabela de revisão editorial se houver necessidade de versionamento completo de conteúdo
- Garantir na camada de serviço a coerência entre `countryId`, `stateId` e `cityId`
