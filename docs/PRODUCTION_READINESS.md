# Production Readiness (V1)

## Env obrigatorio
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET` (minimo 32 caracteres)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `AI_INGESTION_TOKEN` (minimo 24 caracteres)
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (ex: `gpt-4.1-mini`)

## Validacao rapida local
1. `npm run build`
2. `npm run dev`
3. Em outro terminal: `npm run smoke`

## Resultado esperado do smoke
- `/login` responde `200`
- `/admin` sem sessao redireciona para `/login`
- `/api/ai/ingest` sem bearer token responde `401`

## Go-live minimo
- `NEXTAUTH_URL` com dominio real (https)
- `NEXTAUTH_SECRET` forte e unico por ambiente
- `AI_INGESTION_TOKEN` unico e rotacionavel
- `OPENAI_API_KEY` com escopo minimo necessario
- Banco com backup habilitado
- Bucket de midia com politicas de acesso revisadas
- Migration aplicada em producao antes do deploy da aplicacao
