# Validação de processos (build/deploy)

Data da validação: 2026-04-28 (UTC)

## Escopo validado

- Qualidade estática (`lint`)
- Build de produção Next.js
- Sanidade de scripts de bootstrap/admin
- Sanidade do `entrypoint` e script Docker de bootstrap

## Resultados

### 1) Lint

Comando:

```bash
npm run -s lint
```

Resultado: **OK** (sem erros de lint).

Observação: aparece aviso de depreciação do `next lint`, sem bloquear execução.

### 2) Build de produção

Comando:

```bash
npm run -s build
```

Resultado: **OK** (build concluído com sucesso e rotas geradas).

Observação: há warning conhecido de Edge Runtime relacionado ao pacote `jose`/`next-auth`, mas não interrompe o build.

### 3) Script de bootstrap Docker

Comando:

```bash
node --check docker/bootstrap-admin.mjs
```

Resultado: **OK** (sintaxe válida).

### 4) Entrypoint

Comando:

```bash
sh -n docker/entrypoint.sh
```

Resultado: **OK** (sintaxe shell válida).

### 5) Script de criação de admin

Comando:

```bash
npm run -s admin:create
```

Resultado: **Falhou como esperado sem variáveis obrigatórias**.

Erro observado:

- `Missing required environment variable: ADMIN_EMAIL`

Isso confirma que o script está validando pré-condições de ambiente.

## Publicação no GitHub

Tentativa de publicação não foi possível diretamente neste ambiente pois **não há remote git configurado** (`git remote -v` sem saída).

Para subir:

```bash
git remote add origin <URL_DO_REPOSITORIO>
git push -u origin <sua-branch>
```

## Conclusão

O pipeline local mínimo de qualidade e build está validado. Os scripts de bootstrap/admin estão com validação de entrada funcionando. O único bloqueio para publicação é configuração de remote/autenticação do repositório.
