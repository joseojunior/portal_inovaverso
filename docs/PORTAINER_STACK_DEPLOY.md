# Deploy no Portainer (Stack)

## Arquivos entregues
- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.portainer.yml`
- `docker/entrypoint.sh`

## Como subir no Portainer
1. No Portainer, abra `Stacks` -> `Add stack`.
2. Nome da stack: `portal-inovaverso`.
3. Cole o conteudo de `docker-compose.portainer.yml`.
4. Em `Environment variables`, preencha:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_SECRET` (forte, minimo 32 chars)
   - `AI_INGESTION_TOKEN` (forte, minimo 24 chars)
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (ex: `gpt-4.1-mini`)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET`
5. Clique em `Deploy the stack`.

## Observacao
- `docker-compose.portainer.yml` foi pensado para Swarm/Portainer com `image` fixa.
- Ele nao depende de build local na stack.
- Se a imagem ainda nao existir no registry, o deploy vai falhar no pull.

## Publicar imagem no GHCR
- O workflow `docker-publish.yml` publica automaticamente em:
  - `ghcr.io/joseojunior/portal_inovaverso:latest`
  - `ghcr.io/joseojunior/portal_inovaverso:sha-<commit>`
- Disparo:
  - `push` em `main` ou `master`
  - execucao manual via `workflow_dispatch`
- Requisito:
  - em `Settings > Actions > General`, manter permissao de workflow para leitura/escrita
  - se o Portainer nao estiver autenticado no GHCR, deixar o pacote publico

## Migration no startup
- O `entrypoint` roda `prisma migrate deploy` quando `RUN_MIGRATIONS=true`.
- Para 1 replica, isso funciona bem.
- Se escalar para mais de 1 replica, ajuste `RUN_MIGRATIONS=false` no app e rode migration em job unico antes do rollout.

## SSL e dominio
- O container responde internamente na porta `3000` sem expor `ports` no host.
- Recomenda-se publicar atras de reverse proxy (Traefik ou Nginx Proxy Manager) com TLS.
- Em producao, `NEXTAUTH_URL` deve ser exatamente o dominio https final.

## Checklist rapido pos-deploy
1. Abrir `/login`.
2. Confirmar bloqueio de `/admin` sem sessao.
3. Fazer login admin.
4. Validar upload de midia.
5. Validar endpoint `/api/ai/ingest` sem token retorna `401`.
