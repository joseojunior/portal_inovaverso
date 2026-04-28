# Plano de separação: Portal Público × Painel Administrativo

## Objetivo

Separar a aplicação em duas superfícies independentes:

- **Portal público**: conteúdo aberto para leitores.
- **Painel administrativo**: operação editorial em subdomínio dedicado (ex.: `admin.inovaversotv.com.br`).

Isso reduz risco operacional, melhora segurança e simplifica escala/deploy por contexto.

---

## Recomendação de arquitetura

### Opção recomendada (evolução sustentável)

Criar dois apps Next.js no mesmo repositório (monorepo lógico):

- `apps/public-web`
- `apps/admin-panel`
- `packages/shared` (tipos, utilitários, regras comuns, cliente Prisma/auth helpers)

**Vantagens**
- Deploy e rollback independentes.
- Superfície de ataque menor no público (sem código/admin routes no build público).
- Observabilidade separada (métricas/logs por produto).
- Times podem evoluir UX do público sem risco no painel.

### Opção de transição rápida (sem split completo imediato)

Ainda com um único app, subir dois serviços com mesma imagem e comportamento por `APP_FLAVOR`:

- `APP_FLAVOR=public` expõe somente rotas públicas.
- `APP_FLAVOR=admin` expõe somente `/admin` e `/api` necessárias.

Middleware e roteamento por host (`inovaversotv.com.br` vs `admin.inovaversotv.com.br`) controlam acesso.

---

## Domínios e DNS

## Domínios sugeridos
- Público: `inovaversotv.com.br`
- Admin: `admin.inovaversotv.com.br`

## DNS
- `A/AAAA` (ou `CNAME`) para os respectivos serviços.
- TLS separado por host (cert SAN/wildcard).

---

## Autenticação e sessão (ponto crítico)

Como separar corretamente:

1. **Configurar NextAuth independente por app**
   - `NEXTAUTH_URL` público e admin distintos.
2. **Cookie de sessão exclusivo por contexto**
   - Público: `inovaverso.public-session`
   - Admin: `__Secure-inovaverso.admin-session`
3. **Escopo de cookie restrito por domínio**
   - Admin com `domain=admin.inovaversotv.com.br`.
   - Público com domínio do portal.
4. **Segurança adicional no admin**
   - rate limit + lockout progressivo + MFA (recomendado).

Resultado: login do leitor e login administrativo não competem entre si.

---

## Banco e API

## Banco de dados
- Pode continuar único PostgreSQL inicialmente.
- Isolar permissões por serviço (usuários DB diferentes por app) quando possível.

## API
- Rotas administrativas devem existir apenas no admin.
- No público, manter somente endpoints necessários ao leitor/comentários.

---

## Plano de execução por fases

## Fase 1 — Hard split de domínio (1-2 dias)
- Criar subdomínio `admin`.
- Publicar dois serviços (mesmo código inicialmente).
- Ativar regra de host para separar tráfego.
- Sessões com nomes de cookie diferentes por host.

## Fase 2 — Split de build (2-5 dias)
- Separar entradas e layouts em apps distintos.
- Remover dependências admin do build público.
- Pipeline CI/CD separado (`public` e `admin`).

## Fase 3 — Segurança e observabilidade (contínuo)
- Rate limiting por IP/email no admin.
- Auditoria de login (`lastLoginAt`, trilha em `AuditLog`).
- Dashboards e alertas separados por host.

---

## Ajustes de infraestrutura (Stack)

Para cada serviço no Portainer/Swarm:

- **public-web**
  - `NEXTAUTH_URL=https://inovaversotv.com.br`
  - variáveis focadas no público
  - sem rotinas administrativas

- **admin-panel**
  - `NEXTAUTH_URL=https://admin.inovaversotv.com.br`
  - `RUN_ADMIN_BOOTSTRAP=true` (somente no primeiro deploy, depois `false`)
  - restrição de IP opcional (VPN/WAF) para `/admin`

Traefik: dois routers e duas regras de host, cada uma apontando para seu serviço.

---

## Estratégia de migração sem downtime

1. Subir `admin.inovaversotv.com.br` em paralelo.
2. Validar login admin e fluxos críticos no novo host.
3. Congelar alterações de autenticação por janela curta.
4. Direcionar equipe para novo painel.
5. Remover acesso administrativo do host público.

---

## Checklist de prontidão

- [ ] Subdomínio `admin` criado com TLS válido.
- [ ] Cookies de sessão público/admin com nomes e domínio distintos.
- [ ] Middleware bloqueando `/admin` fora do host admin.
- [ ] CI/CD separado para público e admin.
- [ ] Monitoramento e alertas por serviço.
- [ ] Plano de rollback documentado.

---

## Decisão prática recomendada agora

Para o seu cenário (“colocar painel em subdomínio e subir público separado”):

1. Executar **Fase 1** imediatamente com duas stacks.
2. Em seguida, iniciar **Fase 2** para split real de build.
3. Fechar com **Fase 3** (segurança + observabilidade).

Esse caminho entrega separação rápida sem travar operação editorial.
