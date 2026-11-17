# Plano: protecção da conta administrativa antes da produção

## Bloqueio prévio (tem de ser resolvido primeiro)
O backend ligado a este projecto é **wynpaksbkoebharvjrvh** (confirmado em `supabase/config.toml` e no estado do Lovable Cloud), não **ogdfncwugdzmangaqnnc**. A via Lovable só aplica alterações ao backend ligado. Nada será executado até confirmar uma de duas opções:
- A) o projecto oficial é afinal o ligado (wynpaks...), ou
- B) a ligação tem de ser mudada para ogdfnc... fora deste fluxo (o Lovable Cloud não permite trocar de instância a partir do agente). Nesse caso este plano é aplicado só depois da troca.

## Problemas confirmados no ficheiro actual
1. `has_role`, `has_any_role`, `is_staff` são SECURITY DEFINER, recebem `_user_id` arbitrário e têm EXECUTE para `authenticated` -> qualquer utilizador autenticado pode sondar os papéis de outro UID via RPC. `admin.functions.ts` chama `has_any_role` com `_user_id`.
2. `audit_row_change` guarda `to_jsonb(OLD/NEW) - 'internal_notes'` -> nome, email, telefone e empresa ficam no log; em `profiles` guarda email/nome.
3. `protect_last_admin` conta admins sem bloqueio -> duas transacções concorrentes podem remover os dois últimos admins (cada uma vê o outro ainda activo).
4. Grants: `customers` tem SELECT/INSERT/UPDATE/DELETE completos; `audit_logs` SELECT para authenticated (aceitável com RLS admin-only).

## Alterações (uma única migração nova, via ferramenta Lovable, aditiva)
### 1. Funções de papéis
- Criar schema privado `app_private` (sem USAGE para anon/authenticated) e mover para lá a lógica: `app_private.has_role(uuid, app_role)`, `app_private.has_any_role(uuid, app_role[])`, `app_private.is_staff(uuid)` (SECURITY DEFINER, `search_path=''`, exigem também `profiles.is_active`).
- Novos wrappers expostos, sem parâmetro de UID: `public.current_user_has_role(app_role)`, `public.current_user_has_any_role(app_role[])`, `public.current_user_is_staff()` — usam sempre `auth.uid()`. EXECUTE só para `authenticated`.
- Recriar todas as políticas RLS para chamar os wrappers/funções privadas.
- Nas funções públicas antigas: `REVOKE EXECUTE ... FROM authenticated` e `COMMENT ... 'DEPRECATED'` (não fazer DROP nesta fase, para não partir a app publicada; DROP numa migração posterior após validação).
- `admin.functions.ts`: `requireRoles` passa a chamar `current_user_has_any_role({ _roles })`, sem `_user_id`.

### 2. Auditoria sem PII
- Substituir `audit_row_change` por versão que regista apenas: operação, tabela, id, lista de **nomes** de campos alterados, e para `user_roles` o `user_id` + `role`; para `profiles` apenas `is_active` antigo/novo. Nunca valores de `name`, `company`, `email`, `phone`, `internal_notes`, `full_name`.
- Registos antigos com PII: decisão do utilizador (opção de anonimizar `details` via consulta de dados separada, não na migração).

### 3. protect_last_admin com serialização
- No início do trigger: `PERFORM pg_advisory_xact_lock(hashtext('escx_last_admin'))` -> todas as alterações relevantes ficam em série dentro da transacção.
- Depois do lock, contar admins **activos** excluindo a linha afectada; recusar se ficar 0.
- Cobrir: `user_roles` BEFORE DELETE e BEFORE UPDATE (mudança de `role` ou `user_id`), e `profiles` BEFORE UPDATE OF `is_active` (true->false) e BEFORE DELETE.
- `REVOKE EXECUTE` de PUBLIC/anon/authenticated mantido.

### 4. RLS e privilégios mínimos
- `customers`: manter grants por operação mas DELETE apenas usado por admin/manager via RLS; políticas reescritas com wrappers.
- `profiles`: SELECT próprio + staff; UPDATE só `full_name` do próprio. `user_roles`: SELECT próprio + admin; sem INSERT/UPDATE/DELETE para authenticated.
- `audit_logs`: SELECT só admin; sem escrita para authenticated (só o trigger).
- `REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon, authenticated`; `ALTER DEFAULT PRIVILEGES` para não conceder EXECUTE automático a novas funções.
- Correr linter e security scan no fim.

### 5. Estratégia de migração
- Não recriar nada: só `CREATE SCHEMA IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `DROP POLICY IF EXISTS` + `CREATE POLICY`, `REVOKE/GRANT`, `COMMENT`.
- Aplicar apenas via ferramenta de migração do Lovable; não editar `drizzle/` nem `supabase/migrations/` à mão.
- Não activar deploy automático de produção; actualizar `docs/database-migration-status.md` com o novo estado.
- Não criar utilizadores nem atribuir papéis.

## Verificação
- Testes SQL só de leitura com `set local role authenticated` + `request.jwt.claims` simulados: utilizador sem papel não consegue chamar as funções antigas; wrappers devolvem só dados do próprio.
- Concorrência: demonstrar em duas sessões que a segunda remoção do último admin falha (descrito; executado só em base descartável, nunca nos dados reais).
- Auditoria: confirmar que um UPDATE de cliente gera `details` só com nomes de campos.
- Teste unitário de `requireRoles` (sem `_user_id`).

## Confirmar o admin existente sem expor credenciais
Consulta só de leitura (sem email nem tokens no resultado):
```sql
select ur.user_id, ur.role, p.is_active,
       (u.id is not null) as auth_user_exists, u.email_confirmed_at is not null as confirmed
from public.user_roles ur
join public.profiles p on p.id = ur.user_id
left join auth.users u on u.id = ur.user_id
where ur.role = 'admin';
```
Esperado: exactamente uma linha, `user_id = 393f2acb-e779-4913-ad6f-bd13aa243d64`, `is_active = true`. Repetir antes e depois da migração.
