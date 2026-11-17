# Roadmap — ESCX SMART ASSISTANT

## Em espera (bloqueado pelo utilizador)
- [ ] Confirmar qual das duas bases passa a ser a oficial: a Lovable Database já activa neste projecto, ou `ogdfncwugdzmangaqnnc`. Bloqueio: só o utilizador decide.
- [ ] Reparar o histórico de migrações: o ficheiro `drizzle/migrations/0000_phase1_core_schema.sql` não corresponde exactamente ao SQL aplicado na base. Bloqueio: aprovação do utilizador.
- [ ] Reconstruir o acesso administrativo: a base tem 1 utilizador de autenticação, mas 0 perfis, 0 papéis, e o UID esperado `393f2acb-e779-4913-ad6f-bd13aa243d64` não existe aqui. Bloqueio: base oficial confirmada.
- [ ] Trocar a ligação do backend para `ogdfncwugdzmangaqnnc` (More → Supabase → Disconnect; Settings → General → External Supabase → Connect). Bloqueio: só o utilizador pode fazer a troca no editor.
- [ ] Após a troca: verificar se `ogdfncwugdzmangaqnnc` já tem `profiles`, `user_roles`, `customers`, `audit_logs` + RLS. Bloqueio: depende da troca anterior.
- [ ] Aplicar a migração de protecção da conta administrativa (funções de papel sem UID arbitrário, wrappers `current_user_*`, auditoria sem PII, `protect_last_admin` com advisory lock, privilégios mínimos). Bloqueio: base de destino correcta.
- [ ] Confirmar que o único admin é o UID `393f2acb-e779-4913-ad6f-bd13aa243d64`, antes e depois da migração. Bloqueio: base de destino correcta.
- [ ] Executar e reportar os critérios de aceitação reais: typecheck, lint, testes, verificação RLS por papel, auditoria sem PII, scan de segurança. Bloqueio: migração aplicada.

## Concluído
- [x] Lovable Database verificado como activo e saudável: 4 tabelas (`profiles`, `user_roles`, `customers`, `audit_logs`), RLS ligada e políticas presentes em todas.
- [x] Plano de protecção da conta administrativa escrito, aprovado e arquivado em `.lovable/plan/`.
- [x] Erros de tipos na página de login (search param) corrigidos; verificação de tipos passa.
