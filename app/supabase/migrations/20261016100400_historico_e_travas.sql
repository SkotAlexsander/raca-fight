-- =============================================================================
-- 0104 — O histórico de tudo (seção 41) e as travas que o banco garante.
-- Agente AU, 16/10/2026, a partir de
--   admin/supabase/migrations/20261015000300_admin_historico_e_travas.sql (AM1)
--
-- HISTÓRICO: só o gatilho grava. Ninguém tem insert, update nem delete pela
-- API (nem o dono), e um gatilho recusa update e delete mesmo para quem tem
-- acesso direto ao banco. Ganhou as tabelas do tatame que mudam a vida do aluno
-- (vínculo, turma, graduação, exame, luta, consentimento). Ficam FORA, de
-- propósito, as tabelas com dado de saúde (dependentes, perfis_de_alunos,
-- medicoes_corporais): o histórico é lido pelo dono, e a saúde não é dele.
-- A presença também fica fora: tem o próprio quem-e-quando (atualizada_por).
-- O motivo (reabrir, importar, anular) vem de set_config('app.motivo', …, true).
-- =============================================================================

create table public.historico (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  tabela text not null,
  registro_id uuid not null,
  acao text not null check (acao in ('criou', 'mudou', 'arquivou', 'anulou', 'fechou', 'reabriu', 'importou', 'desfez_importacao')),
  mudancas jsonb not null default '[]',
  por_id uuid,
  em timestamptz not null default now(),
  motivo text
);
create index historico_registro on public.historico (academia_id, tabela, registro_id, em desc);
create index historico_recente on public.historico (academia_id, em desc);

alter table public.historico enable row level security;
create policy historico_ler on public.historico for select to authenticated using (public.e_dono(academia_id));
revoke insert, update, delete, truncate on public.historico from anon, authenticated, service_role;

create function public.historico_imutavel()
  returns trigger language plpgsql as $fn$
begin
  raise exception 'historico_imutavel' using errcode = '42501';
end
$fn$;
create trigger historico_sem_update_nem_delete before update or delete on public.historico
  for each row execute function public.historico_imutavel();
create trigger historico_sem_truncate before truncate on public.historico
  for each statement execute function public.historico_imutavel();

-- as diferenças campo a campo (o carimbo de atualização não conta)
create function public.diferencas_jsonb(antes jsonb, depois jsonb)
  returns jsonb language sql immutable as $fn$
  select coalesce(jsonb_agg(jsonb_build_object('campo', k, 'de', antes -> k, 'para', depois -> k) order by k), '[]'::jsonb)
  from (select jsonb_object_keys(coalesce(antes, '{}') || coalesce(depois, '{}')) as k) ks
  -- motivo_de_saida: o dono só vê o motivo SOMADO (R12.12), nunca por pessoa
  where k not in ('atualizado_em', 'atualizada_em', 'sincronizada_em', 'motivo_de_saida')
    and (antes -> k) is distinct from (depois -> k)
$fn$;

create function public.registrar_historico()
  returns trigger language plpgsql security definer set search_path = public as $fn$
declare
  v_antes jsonb := case when tg_op = 'UPDATE' then to_jsonb(old) end;
  v_depois jsonb := to_jsonb(new);
  v_mud jsonb := public.diferencas_jsonb(v_antes, v_depois);
  v_acao text;
begin
  if tg_op = 'UPDATE' and v_mud = '[]'::jsonb then
    return new;
  end if;
  v_acao := case
    when tg_op = 'INSERT' and tg_table_name = 'fechamentos' then 'fechou'
    when tg_op = 'INSERT' and tg_table_name = 'importacoes' then 'importou'
    when tg_op = 'INSERT' then 'criou'
    when tg_table_name = 'fechamentos' and (v_antes ->> 'reaberto_em') is null and (v_depois ->> 'reaberto_em') is not null then 'reabriu'
    when tg_table_name = 'importacoes' and (v_depois ->> 'estado') = 'desfeita' then 'desfez_importacao'
    when tg_table_name = 'graduacoes' and (v_antes ->> 'anulada_em') is null and (v_depois ->> 'anulada_em') is not null then 'anulou'
    when coalesce((v_antes ->> 'arquivado')::boolean, (v_antes ->> 'arquivada')::boolean, false) = false
      and coalesce((v_depois ->> 'arquivado')::boolean, (v_depois ->> 'arquivada')::boolean, false) = true then 'arquivou'
    else 'mudou'
  end;
  -- a foto dos números do fechamento não vira lista de campos: só o mês
  if tg_table_name = 'fechamentos' then
    v_mud := jsonb_build_array(jsonb_build_object('campo', 'competencia', 'de', null, 'para', v_depois -> 'competencia'));
  end if;
  insert into public.historico (academia_id, tabela, registro_id, acao, mudancas, por_id, em, motivo)
  values (
    (v_depois ->> 'academia_id')::uuid, tg_table_name,
    coalesce((v_depois ->> 'id')::uuid, (v_depois ->> 'pessoa_id')::uuid, (v_depois ->> 'academia_id')::uuid),
    v_acao, v_mud, auth.uid(), now(), nullif(current_setting('app.motivo', true), '')
  );
  return new;
end
$fn$;

do $$
declare t text;
begin
  foreach t in array array[
    -- o Admin (seções 27 a 40)
    'pessoas', 'funcionarios', 'modalidades', 'planos', 'matriculas', 'cobrancas', 'lancamentos', 'categorias', 'despesas_fixas',
    'fechamentos', 'importacoes', 'interessados', 'aulas_experimentais', 'notas', 'lembretes', 'tarefas', 'filtros_salvos',
    'regras_de_cobranca', 'eventos',
    -- o tatame e a conta (P12, AU)
    'vinculos', 'turmas', 'horarios', 'alunos_das_turmas', 'atletas', 'sistemas_de_graduacao', 'ajustes_de_aula',
    'graduacoes', 'exames', 'candidatos_do_exame', 'lutas', 'consentimentos_de_atleta', 'tecnicas', 'perguntas_frequentes',
    'indicacoes', 'avisos_da_academia', 'perfis_profissionais'
  ] loop
    execute format('create trigger historico_%1$s after insert or update on public.%1$I for each row execute function public.registrar_historico()', t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- TRAVA DO MÊS FECHADO (RA4.10): recusa a linha cuja data VELHA ou NOVA caia num
-- mês com fechamento ativo. É a mesma regra de podeAlterarLancamento.
-- -----------------------------------------------------------------------------
create function public.mes_fechado(academia uuid, competencia text)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from public.fechamentos f where f.academia_id = academia and f.competencia = mes_fechado.competencia and f.reaberto_em is null)
$fn$;

create function public.travar_mes_fechado()
  returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'UPDATE' and public.mes_fechado(old.academia_id, to_char(old.data, 'YYYY-MM')) then
    raise exception 'mes_fechado' using errcode = 'P0001', detail = to_char(old.data, 'YYYY-MM');
  end if;
  if public.mes_fechado(new.academia_id, to_char(new.data, 'YYYY-MM')) then
    raise exception 'mes_fechado' using errcode = 'P0001', detail = to_char(new.data, 'YYYY-MM');
  end if;
  return new;
end
$fn$;
create trigger lancamentos_trava before insert or update on public.lancamentos for each row execute function public.travar_mes_fechado();

-- a categoria é do mesmo tipo da linha (RA4.2)
create function public.conferir_categoria_do_lancamento()
  returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.categoria_id is not null and not exists (
    select 1 from public.categorias c where c.id = new.categoria_id and c.academia_id = new.academia_id and c.tipo = new.tipo
  ) then
    raise exception 'categoria_de_outro_tipo' using errcode = 'P0001';
  end if;
  return new;
end
$fn$;
create trigger lancamentos_categoria before insert or update on public.lancamentos for each row execute function public.conferir_categoria_do_lancamento();

-- a repartição da cobrança soma o valor (RA3.11)
create function public.conferir_reparticao_da_cobranca()
  returns trigger language plpgsql as $fn$
begin
  if jsonb_array_length(new.reparticao) > 0 and (
    select coalesce(sum((p ->> 'centavos')::bigint), 0) from jsonb_array_elements(new.reparticao) p
  ) <> new.valor_centavos then
    raise exception 'reparticao_nao_soma' using errcode = 'P0001';
  end if;
  return new;
end
$fn$;
create trigger cobrancas_reparticao before insert or update on public.cobrancas for each row execute function public.conferir_reparticao_da_cobranca();

-- a linha pertence à academia da pessoa (uma academia nunca aponta para a pessoa de outra)
create function public.conferir_academia_da_pessoa()
  returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_col text; v_id uuid;
begin
  foreach v_col in array tg_argv loop
    v_id := (to_jsonb(new) ->> v_col)::uuid;
    if v_id is not null and public.academia_da_pessoa(v_id) is distinct from new.academia_id then
      raise exception 'pessoa_de_outra_academia' using errcode = '42501', detail = v_col;
    end if;
  end loop;
  return new;
end
$fn$;
create trigger matriculas_pessoas before insert or update on public.matriculas
  for each row execute function public.conferir_academia_da_pessoa('pessoa_id', 'pagador_pessoa_id');
create trigger cobrancas_pessoas before insert or update on public.cobrancas
  for each row execute function public.conferir_academia_da_pessoa('pessoa_id', 'aluno_pessoa_id');
create trigger presencas_pessoas before insert or update on public.presencas
  for each row execute function public.conferir_academia_da_pessoa('pessoa_id');
create trigger graduacoes_pessoas before insert or update on public.graduacoes
  for each row execute function public.conferir_academia_da_pessoa('pessoa_id');
create trigger pessoas_responsavel before insert or update on public.pessoas
  for each row execute function public.conferir_academia_da_pessoa('responsavel_pessoa_id');

-- o carimbo de atualização
create function public.carimbar_atualizacao()
  returns trigger language plpgsql as $fn$
begin
  if to_jsonb(new) ? 'atualizado_em' then new := jsonb_populate_record(new, jsonb_build_object('atualizado_em', now())); end if;
  if to_jsonb(new) ? 'atualizada_em' then new := jsonb_populate_record(new, jsonb_build_object('atualizada_em', now())); end if;
  return new;
end
$fn$;
do $$
declare t text;
begin
  foreach t in array array['pessoas', 'lancamentos', 'notas', 'regras_de_cobranca', 'dependentes', 'aulas_experimentais',
    'perfis_profissionais', 'preferencias_de_aviso', 'preferencias_da_equipe', 'dispositivos', 'perfis_de_alunos'] loop
    execute format('create trigger carimbo_%1$s before update on public.%1$I for each row execute function public.carimbar_atualizacao()', t);
  end loop;
end $$;
