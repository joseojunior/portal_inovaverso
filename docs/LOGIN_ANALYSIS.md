# Análise do fluxo de login

## Visão geral

O projeto possui **dois fluxos de autenticação por credenciais** via NextAuth:

- `admin-credentials`: acesso ao painel `/admin` para contas em `AdminUser`.
- `user-credentials`: acesso público para comentar com contas em `User`.

A autenticação é feita com estratégia de sessão JWT e expiração de 8 horas.

## Fluxo de login administrativo

1. A tela `/login` renderiza `LoginForm`.
2. O formulário envia `email` e `password` para `signIn("admin-credentials", { redirect: false })`.
3. O provider `admin-credentials` valida formato dos campos com Zod.
4. Busca o usuário em `AdminUser`, exige `isActive = true` e compara senha com bcrypt.
5. Em sucesso, adiciona no token os campos `role` e `accountType = "admin"`.
6. O cliente redireciona para `/admin`.
7. O middleware de `/admin` aplica callback `authorized` e só permite quando:
   - `accountType === "admin"`
   - `role` está em `SUPER_ADMIN | ADMIN | EDITOR | MODERATOR`.

## Fluxo de login público

1. A tela `/entrar` renderiza `PublicLoginForm`.
2. O formulário chama `signIn("user-credentials", { redirect: false })`.
3. O provider valida credenciais com Zod.
4. Busca em `User`, exige `isActive = true` e `passwordHash` presente.
5. Compara senha com bcrypt.
6. Em sucesso define `accountType = "user"` no token/sessão.
7. O cliente redireciona para `/`.

## Pontos positivos

- Separação clara de provedores para admin e usuário final.
- Gate duplo para admin:
  - middleware em `/admin`
  - proteção server-side com `requireAdminUser()` nas páginas/actions.
- Cookies `httpOnly`, `sameSite=lax` e `secure` em produção.
- Senhas com bcrypt (12 rounds).

## Riscos e lacunas

1. **Cookie de sessão com nome “admin-session” para ambos os logins**
   - O nome do cookie de sessão é único e orientado a admin.
   - Como os dois providers compartilham a mesma instância NextAuth, o login público e o login admin usam a mesma sessão base.
   - Isso pode não ser um bug funcional imediato, mas aumenta risco de confusão de sessão/UX e dificulta separar claramente contextos.

2. **Possível mensagem de erro diferenciável por fluxo (enumeração indireta)**
   - Hoje a mensagem é genérica no cliente (bom), mas não há rate-limiting explícito no código.
   - Sem proteção adicional, tentativas repetidas podem facilitar brute force.

3. **Sem atualização de `lastLoginAt`**
   - Os modelos `User` e `AdminUser` possuem `lastLoginAt`, porém o fluxo atual não atualiza esse campo no login.
   - Falta trilha de auditoria operacional de acesso.

4. **Validação mínima de senha apenas no login**
   - O schema exige `min(8)` para autenticação, o que está correto para input sanitation.
   - Porém não há contexto aqui sobre política de complexidade/reuso/expiração no cadastro/gestão de senha.

5. **UX e observabilidade de erro limitadas**
   - O cliente mostra erro genérico (seguro), mas não existe indicação de lockout temporário, captcha, ou telemetria de tentativas.

## Recomendações prioritárias

### Prioridade alta

1. Implementar **rate limit** por IP + email no endpoint de autenticação (ou WAF).
2. Registrar tentativas e sucesso de login em `AuditLog` e atualizar `lastLoginAt`.
3. Avaliar separar contexto admin/público com:
   - nomes de cookie mais neutros, ou
   - instâncias/rotas de auth separadas quando houver requisito de sessão simultânea distinta.

### Prioridade média

1. Adicionar política de bloqueio progressivo após N falhas.
2. Incluir alerta de segurança para logins suspeitos (origem/dispositivo novo).
3. Revisar redirecionamento pós-login com `callbackUrl` validado.

### Prioridade baixa

1. Melhorar texto de erro com suporte sem expor detalhes.
2. Considerar MFA para perfis administrativos (especialmente `SUPER_ADMIN`).

## Conclusão

A base de login está **bem estruturada e segura no essencial** (hash de senha, validação de role, proteção por middleware + server-side). O maior ganho de maturidade agora está em **hardening operacional**: rate limit, auditoria de acesso e eventual separação mais explícita de contexto de sessão entre admin e público.
