-- =============================================================================
-- 0106 — Permissões por cima da RLS. Agente AU, 16/10/2026.
--
-- O Supabase dá ALL nas tabelas novas a `anon` e `authenticated` e deixa a RLS
-- decidir a linha. Aqui se fecha o resto:
-- 1. "nada se apaga" vira regra do banco: ninguém pela API tem DELETE nem
--    TRUNCATE, menos as três exceções com motivo (dispositivo ao sair da conta,
--    medição no mesmo dia, aviso dispensado);
-- 2. a vitrine sem conta (`anon`) só lê: nunca escreve;
-- 3. as funções de escrita só para quem entrou (`authenticated`); as de
--    leitura da vitrine também para `anon`.
-- =============================================================================

revoke delete, truncate on all tables in schema public from anon, authenticated;
grant delete on public.dispositivos, public.medicoes_corporais, public.avisos_dispensados to authenticated;

revoke insert, update on all tables in schema public from anon;

-- as funções que o app chama por rpc (conferem quem pede por dentro)
revoke execute on function
  public.pedir_vinculo(uuid, text), public.confirmar_vinculos(uuid[]), public.recusar_vinculo(uuid), public.encerrar_vinculo(uuid, text),
  public.motivos_de_saida(uuid, date, date), public.contato_do_usuario(uuid), public.minha_academia_de_dono(),
  public.academia_pelo_codigo(text), public.academia_pelo_codigo_da_equipe(text), public.codigos_da_academia(uuid),
  public.modalidades_liberadas(uuid), public.pode_fazer_checkin(uuid, uuid), public.minhas_fichas(), public.fichas_da_academia(uuid),
  public.contato_do_responsavel(uuid), public.salvar_dependente(jsonb), public.indicacoes_do_aluno(uuid),
  public.cancelar_aula(uuid, date, text), public.passar_aula(uuid, date, uuid), public.experimentais_da_aula(uuid, date),
  public.registrar_presencas(jsonb),
  public.exigir_financeiro(uuid, text), public.gravar_lancamentos(uuid, jsonb), public.inserir_cobrancas(uuid, jsonb),
  public.marcar_como_paga(uuid, date, text, bigint), public.marcar_como_pagas(uuid[], date, text), public.desfazer_pagamento(uuid),
  public.cancelar_cobranca(uuid), public.fechar_mes(uuid, text), public.reabrir_mes(uuid, text, text),
  public.importar_lancamentos(uuid, jsonb, jsonb, jsonb), public.desfazer_importacao(uuid),
  public.matricular_interessado(uuid, uuid, jsonb, jsonb, jsonb), public.exigir_professor_da_aula(uuid, date)
from public, anon;

grant execute on function
  public.pedir_vinculo(uuid, text), public.confirmar_vinculos(uuid[]), public.recusar_vinculo(uuid), public.encerrar_vinculo(uuid, text),
  public.motivos_de_saida(uuid, date, date), public.contato_do_usuario(uuid), public.minha_academia_de_dono(),
  public.academia_pelo_codigo(text), public.academia_pelo_codigo_da_equipe(text), public.codigos_da_academia(uuid),
  public.modalidades_liberadas(uuid), public.pode_fazer_checkin(uuid, uuid), public.minhas_fichas(), public.fichas_da_academia(uuid),
  public.contato_do_responsavel(uuid), public.salvar_dependente(jsonb), public.indicacoes_do_aluno(uuid),
  public.cancelar_aula(uuid, date, text), public.passar_aula(uuid, date, uuid), public.experimentais_da_aula(uuid, date),
  public.registrar_presencas(jsonb),
  public.gravar_lancamentos(uuid, jsonb), public.inserir_cobrancas(uuid, jsonb),
  public.marcar_como_paga(uuid, date, text, bigint), public.marcar_como_pagas(uuid[], date, text), public.desfazer_pagamento(uuid),
  public.cancelar_cobranca(uuid), public.fechar_mes(uuid, text), public.reabrir_mes(uuid, text, text),
  public.importar_lancamentos(uuid, jsonb, jsonb, jsonb), public.desfazer_importacao(uuid),
  public.matricular_interessado(uuid, uuid, jsonb, jsonb, jsonb)
to authenticated;

-- a vitrine: a área Atletas também sem conta (só quem consentiu, R18.6)
grant execute on function public.atletas_da_academia(uuid) to anon, authenticated;
