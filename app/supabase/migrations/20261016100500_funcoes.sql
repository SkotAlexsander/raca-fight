-- =============================================================================
-- 0105 — As funções que os apps chamam (`rpc`). Cada uma é UMA transação no
-- servidor, `security definer` com search_path fixo, confere quem pede
-- primeiro e sai com uma palavra-código (sem dado) que o app traduz em frase.
-- Nenhuma escreve dado financeiro em log ou em mensagem de erro.
-- Agente AU, 16/10/2026. As do dinheiro são as do AM1
-- (admin/supabase/migrations/20261015000500_admin_funcoes_de_escrita.sql),
-- sem mudança de assinatura (o Admin já as chama); as outras são novas.
-- =============================================================================

-- =============================================================================
-- 1. CONTA E VÍNCULO (os três apps)
-- =============================================================================

-- a academia pelo código que o aluno ou a equipe digita (F13)
create function public.academia_pelo_codigo(p_codigo text)
  returns table (id uuid, nome text) language sql stable security definer set search_path = public as $fn$
  select a.id, a.nome from public.academias a where a.codigo_dos_alunos = upper(btrim(p_codigo))
$fn$;
create function public.academia_pelo_codigo_da_equipe(p_codigo text)
  returns table (id uuid, nome text) language sql stable security definer set search_path = public as $fn$
  select a.id, a.nome from public.academias a where a.codigo_da_equipe = upper(btrim(p_codigo))
$fn$;

-- os códigos: o dono vê os dois; a equipe vê só o dos alunos (para mostrar no balcão)
create function public.codigos_da_academia(p_academia uuid)
  returns table (codigo_dos_alunos text, codigo_da_equipe text) language sql stable security definer set search_path = public as $fn$
  select a.codigo_dos_alunos, case when public.e_dono(a.id) then a.codigo_da_equipe end
  from public.academias a where a.id = p_academia and public.e_equipe(a.id)
$fn$;

-- pedir vínculo (R8.1): nasce pendente, ou ativo se a academia entra sem confirmação
create function public.pedir_vinculo(p_academia uuid, p_papel text)
  returns uuid language plpgsql security definer set search_path = public as $fn$
declare v_id uuid; v_estado text;
begin
  if auth.uid() is null then raise exception 'sem_conta' using errcode = '42501'; end if;
  if p_papel not in ('aluno', 'recepcao', 'instrutor', 'personal') then raise exception 'papel_invalido' using errcode = '22023'; end if;
  select case when p_papel = 'aluno' and a.entrar_sem_confirmacao then 'ativo' else 'pendente' end into v_estado
  from public.academias a where a.id = p_academia;
  if v_estado is null then raise exception 'nao_encontrada' using errcode = 'P0002'; end if;
  insert into public.vinculos (usuario_id, academia_id, papel, estado)
  values (auth.uid(), p_academia, p_papel, v_estado)
  on conflict (usuario_id, academia_id, papel) do update
    set estado = case when vinculos.estado = 'encerrado' then excluded.estado else vinculos.estado end,
        ate = case when vinculos.estado = 'encerrado' then null else vinculos.ate end,
        desde = case when vinculos.estado = 'encerrado' then current_date else vinculos.desde end
  returning id into v_id;
  return v_id;
end
$fn$;

-- quem confirma: o dono qualquer um; a recepção só o de aluno (R12.9)
create function public.pode_decidir_vinculo(v public.vinculos)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select public.e_dono(v.academia_id) or (v.papel = 'aluno' and public.e_balcao(v.academia_id))
$fn$;

create function public.confirmar_vinculos(p_ids uuid[])
  returns int language plpgsql security definer set search_path = public as $fn$
declare v public.vinculos; n int := 0;
begin
  for v in select * from public.vinculos where id = any (p_ids) for update loop
    if not public.pode_decidir_vinculo(v) then raise exception 'sem_permissao' using errcode = '42501'; end if;
    if v.estado = 'pendente' then
      update public.vinculos set estado = 'ativo', desde = current_date where id = v.id;
      n := n + 1;
    end if;
  end loop;
  return n;
end
$fn$;

create function public.recusar_vinculo(p_id uuid)
  returns void language plpgsql security definer set search_path = public as $fn$
declare v public.vinculos;
begin
  select * into v from public.vinculos where id = p_id for update;
  if not found then raise exception 'nao_encontrada' using errcode = 'P0002'; end if;
  -- o próprio cancela o pedido dele; quem decide, recusa
  if not (v.usuario_id = auth.uid() or public.pode_decidir_vinculo(v)) then raise exception 'sem_permissao' using errcode = '42501'; end if;
  if v.estado <> 'pendente' then raise exception 'nao_pendente' using errcode = 'P0001'; end if;
  update public.vinculos set estado = 'encerrado', ate = current_date, encerrado_por = auth.uid() where id = v.id;
end
$fn$;

-- encerrar (R8.3, R12.11): o próprio sai sem motivo; a academia encerra com motivo
create function public.encerrar_vinculo(p_id uuid, p_motivo text default null)
  returns void language plpgsql security definer set search_path = public as $fn$
declare v public.vinculos;
begin
  select * into v from public.vinculos where id = p_id for update;
  if not found then raise exception 'nao_encontrada' using errcode = 'P0002'; end if;
  if v.estado = 'encerrado' then raise exception 'ja_encerrado' using errcode = 'P0001'; end if;
  if v.usuario_id = auth.uid() then
    p_motivo := null;
  elsif not public.pode_decidir_vinculo(v) then
    raise exception 'sem_permissao' using errcode = '42501';
  end if;
  update public.vinculos set estado = 'encerrado', ate = greatest(current_date, desde), motivo_de_saida = p_motivo, encerrado_por = auth.uid()
  where id = v.id;
end
$fn$;

-- R12.12: o dono vê o motivo de saída SOMADO, nunca por pessoa
create function public.motivos_de_saida(p_academia uuid, p_de date, p_ate date)
  returns table (motivo text, quantidade bigint) language sql stable security definer set search_path = public as $fn$
  select coalesce(v.motivo_de_saida, 'saiu_sozinho'), count(*)
  from public.vinculos v
  where v.academia_id = p_academia and public.e_dono(p_academia) and v.papel = 'aluno' and v.estado = 'encerrado'
    and v.ate between p_de and p_ate
  group by 1
$fn$;

-- e-mail e telefone de uma conta: a própria, ou o balcão da mesma academia
create function public.contato_do_usuario(p_usuario uuid)
  returns table (email text, telefone text) language sql stable security definer set search_path = public as $fn$
  select u.email, u.telefone from public.usuarios u
  where u.id = p_usuario and (
    u.id = auth.uid() or exists (
      select 1 from public.vinculos ele where ele.usuario_id = u.id and ele.estado in ('ativo', 'pendente') and public.e_balcao(ele.academia_id)
    )
  )
$fn$;

-- a academia do dono logado (o Admin abre nela)
create function public.minha_academia_de_dono()
  returns uuid language sql stable security definer set search_path = public as $fn$
  select v.academia_id from public.vinculos v
  where v.usuario_id = auth.uid() and v.papel = 'dono' and v.estado = 'ativo'
  order by v.criado_em limit 1
$fn$;

-- =============================================================================
-- 2. O ALUNO NO APP: fichas sem nada financeiro (R14.6a, R15.7)
-- =============================================================================

-- as modalidades que a matrícula libera (sem plano, valor nem situação de pagamento)
create function public.modalidades_liberadas(p uuid)
  returns uuid[] language sql stable security definer set search_path = public as $fn$
  select case when public.cuido_da_pessoa(p) or public.e_equipe(public.academia_da_pessoa(p)) then (
    select coalesce(array_agg(distinct m order by m), '{}')
    from public.matriculas mt join public.planos pl on pl.id = mt.plano_id, unnest(pl.modalidade_ids) m
    where mt.pessoa_id = p and mt.estado <> 'encerrada' and (mt.fim is null or mt.fim >= current_date)
  ) end
$fn$;

-- R14.6, item 2: a matrícula libera a modalidade? Quem nunca teve matrícula no
-- Admin passa só com o vínculo ativo (o provisório do R14.6, enquanto a
-- academia não cadastra as matrículas).
create function public.matricula_libera(p uuid, p_modalidade uuid)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select not exists (select 1 from public.matriculas where pessoa_id = p)
      or exists (
        select 1 from public.matriculas mt join public.planos pl on pl.id = mt.plano_id
        where mt.pessoa_id = p and mt.estado <> 'encerrada' and (mt.fim is null or mt.fim >= current_date)
          and (p_modalidade is null or p_modalidade = any (pl.modalidade_ids))
      )
$fn$;

-- o check-in pergunta só sim ou não (do Admin, R14.6): sem valor, sem atraso
create function public.pode_fazer_checkin(p_pessoa uuid, p_modalidade uuid)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select (public.e_equipe(public.academia_da_pessoa(p_pessoa)) or public.cuido_da_pessoa(p_pessoa))
     and public.matricula_libera(p_pessoa, p_modalidade)
$fn$;

-- a forma de FichaDeLuta (app/dados/repositorio.ts)
create function public.ficha_de(p public.pessoas, nome_curto boolean)
  returns table (pessoa_id uuid, academia_id uuid, nome text, dependente_de uuid, data_nascimento date, modalidade_ids uuid[],
                 turma_ids uuid[], atleta_em uuid[], desde date, usuario_id uuid)
  language sql stable security definer set search_path = public as $fn$
  select p.id, p.academia_id,
    case when nome_curto and p.responsavel_pessoa_id is not null then split_part(btrim(p.nome), ' ', 1) else p.nome end,
    p.responsavel_pessoa_id, p.data_nascimento,
    coalesce((select array_agg(distinct m order by m) from public.matriculas mt join public.planos pl on pl.id = mt.plano_id, unnest(pl.modalidade_ids) m
              where mt.pessoa_id = p.id and mt.estado <> 'encerrada' and (mt.fim is null or mt.fim >= current_date)), '{}'),
    coalesce((select array_agg(a.turma_id order by a.turma_id) from public.alunos_das_turmas a where a.pessoa_id = p.id and a.ate is null), '{}'),
    coalesce((select array_agg(x.modalidade_id order by x.modalidade_id) from public.atletas x where x.pessoa_id = p.id and x.ativo), '{}'),
    coalesce((select min(v.desde) from public.vinculos v where v.usuario_id = p.usuario_id and v.academia_id = p.academia_id and v.papel = 'aluno'),
             p.criada_em::date),
    p.usuario_id
$fn$;
revoke execute on function public.ficha_de(public.pessoas, boolean) from public, anon, authenticated;

-- as fichas de quem a conta cuida: a própria e as dos dependentes
create function public.minhas_fichas()
  returns table (pessoa_id uuid, academia_id uuid, nome text, dependente_de uuid, data_nascimento date, modalidade_ids uuid[],
                 turma_ids uuid[], atleta_em uuid[], desde date, usuario_id uuid)
  language sql stable security definer set search_path = public as $fn$
  select f.* from public.pessoas p, lateral public.ficha_de(p, false) f
  where p.eh_aluno and public.cuido_da_pessoa(p.id)
$fn$;

-- as fichas da academia para a EQUIPE: o balcão vê todas; o professor vê os
-- alunos das modalidades dele (R15.7, R15.13), e a criança só pelo primeiro nome (R20.7)
create function public.fichas_da_academia(p_academia uuid)
  returns table (pessoa_id uuid, academia_id uuid, nome text, dependente_de uuid, data_nascimento date, modalidade_ids uuid[],
                 turma_ids uuid[], atleta_em uuid[], desde date, usuario_id uuid)
  language sql stable security definer set search_path = public as $fn$
  with minhas as (
    select coalesce(array_agg(distinct m), '{}') ms from public.turmas t, unnest(t.modalidade_ids) m
    where t.academia_id = p_academia and t.ativa and (t.professor_id = auth.uid() or auth.uid() = any (t.auxiliar_ids))
  )
  select f.* from public.pessoas p, minhas, lateral public.ficha_de(p, not public.e_balcao(p_academia)) f
  where p.academia_id = p_academia and p.eh_aluno and (
    public.e_balcao(p_academia)
    or (public.tem_vinculo(p_academia, array['instrutor']) and (
      exists (select 1 from public.alunos_das_turmas a join public.turmas t on t.id = a.turma_id
              where a.pessoa_id = p.id and a.ate is null and t.modalidade_ids && minhas.ms)
      or f.modalidade_ids && minhas.ms
    ))
  )
$fn$;

-- o telefone do responsável (ou do próprio adulto): só o balcão (R20.7; L29 é [decidir])
create function public.contato_do_responsavel(p_pessoa uuid)
  returns table (nome text, telefone text) language sql stable security definer set search_path = public as $fn$
  select r.nome, coalesce(r.telefone, u.telefone)
  from public.pessoas p
  join public.pessoas r on r.id = coalesce(p.responsavel_pessoa_id, p.id)
  left join public.usuarios u on u.id = r.usuario_id
  where p.id = p_pessoa and public.e_balcao(p.academia_id)
$fn$;

-- o responsável cadastra ou muda um dependente (R20.1): a pessoa e a ficha Kids juntas
create function public.salvar_dependente(p_dependente jsonb)
  returns uuid language plpgsql security definer set search_path = public as $fn$
declare
  v_academia uuid := (p_dependente ->> 'academia_id')::uuid;
  v_id uuid := (p_dependente ->> 'pessoa_id')::uuid;
  v_resp uuid;
  v_img boolean := coalesce((p_dependente ->> 'imagem_autorizada')::boolean, false);
begin
  select id into v_resp from public.pessoas where academia_id = v_academia and usuario_id = auth.uid();
  if v_resp is null or not public.tem_vinculo(v_academia, array['aluno']) then
    raise exception 'sem_cadastro_na_academia' using errcode = '42501';
  end if;
  if v_id is not null and exists (select 1 from public.pessoas where id = v_id) then
    if not exists (select 1 from public.pessoas where id = v_id and responsavel_pessoa_id = v_resp) then
      raise exception 'sem_permissao' using errcode = '42501';
    end if;
    update public.pessoas set nome = coalesce(p_dependente ->> 'nome', nome),
      data_nascimento = coalesce((p_dependente ->> 'data_nascimento')::date, data_nascimento)
    where id = v_id;
  else
    insert into public.pessoas (id, academia_id, nome, data_nascimento, responsavel_pessoa_id, eh_aluno)
    values (coalesce(v_id, gen_random_uuid()), v_academia, p_dependente ->> 'nome', (p_dependente ->> 'data_nascimento')::date, v_resp, true)
    returning id into v_id;
    update public.pessoas set eh_responsavel = true where id = v_resp;
  end if;
  insert into public.dependentes as d (pessoa_id, academia_id, saude, saude_visivel_para_equipe, imagem_autorizada, imagem_autorizada_em)
  values (v_id, v_academia, p_dependente ->> 'saude', coalesce((p_dependente ->> 'saude_visivel_para_equipe')::boolean, false), v_img, now())
  on conflict (pessoa_id) do update set
    saude = excluded.saude,
    saude_visivel_para_equipe = excluded.saude_visivel_para_equipe,
    imagem_autorizada = excluded.imagem_autorizada,
    imagem_autorizada_em = case when d.imagem_autorizada is distinct from excluded.imagem_autorizada then now() else d.imagem_autorizada_em end;
  return v_id;
end
$fn$;

-- a área Atletas (R18.6): só quem ligou o consentimento (e, menor, com a imagem autorizada)
create function public.atletas_da_academia(p_academia uuid)
  returns table (pessoa_id uuid, nome text, modalidade_ids uuid[]) language sql stable security definer set search_path = public as $fn$
  select p.id, p.nome,
    coalesce((select array_agg(x.modalidade_id order by x.modalidade_id) from public.atletas x where x.pessoa_id = p.id and x.ativo), '{}')
  from public.pessoas p
  where p.academia_id = p_academia and public.atleta_visivel(p.id)
    and (public.e_da_academia(p_academia) or public.academia_na_vitrine(p_academia))
$fn$;

-- "Sua indicação virou matrícula" (R19.9): só o estado e o primeiro nome
create function public.indicacoes_do_aluno(p_pessoa uuid)
  returns table (id uuid, estado text, criada_em timestamptz, primeiro_nome text) language sql stable security definer set search_path = public as $fn$
  select i.id, i.estado, i.criada_em, split_part(btrim(n.nome), ' ', 1)
  from public.indicacoes i join public.interessados n on n.id = i.interessado_id
  where i.pessoa_id = p_pessoa and public.cuido_da_pessoa(p_pessoa)
$fn$;

-- =============================================================================
-- 3. A AULA: cancelar, passar, presença e o experimental na chamada
-- =============================================================================

create function public.exigir_professor_da_aula(p_horario uuid, p_data date)
  returns public.horarios language plpgsql stable security definer set search_path = public as $fn$
declare h public.horarios;
begin
  select * into h from public.horarios where id = p_horario;
  if not found then raise exception 'horario_invalido' using errcode = '23503'; end if;
  if not (public.e_balcao(h.academia_id) or public.e_professor_da_aula(p_horario, p_data)) then
    raise exception 'sem_permissao' using errcode = '42501';
  end if;
  return h;
end
$fn$;

-- R14.5: cancelar só antes do início; os check-ins viram retirados (R15.11)
create function public.cancelar_aula(p_horario uuid, p_data date, p_motivo text default null)
  returns uuid language plpgsql security definer set search_path = public as $fn$
declare h public.horarios; v_id uuid;
begin
  h := public.exigir_professor_da_aula(p_horario, p_data);
  if now() >= public.inicio_da_aula(p_horario, p_data) then raise exception 'aula_ja_comecou' using errcode = 'P0001'; end if;
  insert into public.ajustes_de_aula (academia_id, horario_id, data, aula_id, tipo, motivo)
  values (h.academia_id, p_horario, p_data, '', 'cancelada', p_motivo)
  on conflict (aula_id, tipo) do update set motivo = excluded.motivo
  returning id into v_id;
  update public.presencas set estado = 'retirada', motivo_da_retirada = 'aula_cancelada', atualizada_em = now(),
    atualizada_por = auth.uid(), pela_equipe = true
  where horario_id = p_horario and data = p_data and estado <> 'retirada';
  return v_id;
end
$fn$;

create function public.passar_aula(p_horario uuid, p_data date, p_substituto uuid)
  returns uuid language plpgsql security definer set search_path = public as $fn$
declare h public.horarios; v_id uuid;
begin
  h := public.exigir_professor_da_aula(p_horario, p_data);
  if now() >= public.inicio_da_aula(p_horario, p_data) then raise exception 'aula_ja_comecou' using errcode = 'P0001'; end if;
  if not exists (select 1 from public.vinculos where usuario_id = p_substituto and academia_id = h.academia_id and papel in ('instrutor', 'dono') and estado = 'ativo') then
    raise exception 'substituto_invalido' using errcode = '22023';
  end if;
  insert into public.ajustes_de_aula (academia_id, horario_id, data, aula_id, tipo, substituto_id)
  values (h.academia_id, p_horario, p_data, '', 'substituto', p_substituto)
  on conflict (aula_id, tipo) do update set substituto_id = excluded.substituto_id, por_id = auth.uid(), em = now()
  returning id into v_id;
  return v_id;
end
$fn$;

-- o experimental na chamada (R19.5): o primeiro nome e a modalidade, nunca o WhatsApp
create function public.experimentais_da_aula(p_horario uuid, p_data date)
  returns table (id uuid, primeiro_nome text, modalidade_id uuid, estado text) language sql stable security definer set search_path = public as $fn$
  select e.id, split_part(btrim(coalesce(i.crianca ->> 'nome', i.nome)), ' ', 1), e.modalidade_id, e.estado
  from public.aulas_experimentais e join public.interessados i on i.id = e.interessado_id
  join public.horarios h on h.id = p_horario
  where e.horario_id = p_horario and e.data = p_data
    and (public.e_balcao(h.academia_id) or public.e_professor_da_aula(p_horario, p_data))
$fn$;

-- PRESENÇA (R15): a fila do aparelho sobe por aqui. Cada item tem a forma de
-- Presenca (snake_case). Regras do servidor:
-- - o aluno (ou o responsável) só faz check-in dele, dentro da janela da
--   academia contada do INSTANTE DO APARELHO (sobe depois, sem sinal, R15.9),
--   em aula não cancelada, com a matrícula liberando a modalidade (R14.6);
-- - a equipe da aula (professor, auxiliar, substituto, recepção, dono)
--   confirma ou retira, até 7 dias para trás (R15.8);
-- - uma presença por aluno por aula; a ação da equipe vence o check-in; entre
--   duas ações do mesmo lado, vale a mais recente (atualizada_em).
create function public.registrar_presencas(p_presencas jsonb)
  returns int language plpgsql security definer set search_path = public as $fn$
declare
  r record; h public.horarios; t public.turmas; a public.academias; e public.presencas;
  v_inicio timestamptz; v_equipe boolean; v_hoje date; v_aula text; n int := 0;
begin
  if auth.uid() is null then raise exception 'sem_conta' using errcode = '42501'; end if;
  for r in
    select * from jsonb_to_recordset(p_presencas) as x (id uuid, horario_id uuid, data date, pessoa_id uuid, modalidade_id uuid,
      origem text, estado text, motivo_da_retirada text, registrada_em timestamptz, atualizada_em timestamptz, experimental_id uuid)
  loop
    select * into h from public.horarios where id = r.horario_id;
    if not found then raise exception 'horario_invalido' using errcode = '23503'; end if;
    select * into t from public.turmas where id = h.turma_id;
    select * into a from public.academias where id = h.academia_id;
    if public.academia_da_pessoa(r.pessoa_id) is distinct from a.id then raise exception 'pessoa_de_outra_academia' using errcode = '42501'; end if;
    if not (r.modalidade_id = any (t.modalidade_ids)) then raise exception 'modalidade_fora_da_turma' using errcode = '22023'; end if;
    if r.registrada_em is null then raise exception 'sem_instante' using errcode = '22023'; end if;
    r.atualizada_em := coalesce(r.atualizada_em, r.registrada_em);
    v_inicio := public.inicio_da_aula(r.horario_id, r.data);
    v_hoje := (now() at time zone a.fuso)::date;
    v_equipe := public.e_balcao(a.id) or public.e_professor_da_aula(r.horario_id, r.data);
    v_aula := r.horario_id::text || '@' || to_char(r.data, 'YYYY-MM-DD');

    if v_equipe then
      if r.data > v_hoje then raise exception 'aula_futura' using errcode = 'P0001'; end if;
      if r.data < v_hoje - 7 then raise exception 'fora_do_prazo' using errcode = 'P0001'; end if;
      if r.estado not in ('confirmada', 'retirada') then raise exception 'estado_invalido' using errcode = '22023'; end if;
    else
      if not public.cuido_da_pessoa(r.pessoa_id) or not public.tem_vinculo(a.id, array['aluno']) then
        raise exception 'sem_permissao' using errcode = '42501';
      end if;
      if r.origem <> 'checkin' then raise exception 'sem_permissao' using errcode = '42501'; end if;
      if r.registrada_em > now() + interval '5 minutes'
         or r.atualizada_em < v_inicio - make_interval(mins => a.janela_minutos_antes)
         or r.atualizada_em > v_inicio + make_interval(mins => a.janela_minutos_depois) then
        raise exception 'fora_da_janela' using errcode = 'P0001';
      end if;
      if exists (select 1 from public.ajustes_de_aula j where j.aula_id = v_aula and j.tipo = 'cancelada') then
        raise exception 'aula_cancelada' using errcode = 'P0001';
      end if;
      if r.estado = 'pendente' then
        if not public.matricula_libera(r.pessoa_id, case when t.publico = 'aberta' then null else r.modalidade_id end) then
          raise exception 'sem_a_modalidade' using errcode = 'P0001';
        end if;
        if t.publico = 'competicao' and not exists (select 1 from public.atletas x where x.pessoa_id = r.pessoa_id and x.ativo and x.modalidade_id = any (t.modalidade_ids)) then
          raise exception 'so_atletas' using errcode = 'P0001';
        end if;
        if t.publico = 'kids' and (select responsavel_pessoa_id from public.pessoas where id = r.pessoa_id) is null then
          raise exception 'so_kids' using errcode = 'P0001';
        end if;
      elsif not (r.estado = 'retirada' and r.motivo_da_retirada = 'desfeito_pelo_aluno') then
        raise exception 'estado_invalido' using errcode = '22023';
      end if;
    end if;

    select * into e from public.presencas where aula_id = v_aula and pessoa_id = r.pessoa_id for update;
    if found then
      if e.pela_equipe and not v_equipe then continue; end if;                       -- a equipe vence (R15.9)
      if e.pela_equipe = v_equipe and r.atualizada_em <= e.atualizada_em then continue; end if;
      update public.presencas set
        modalidade_id = r.modalidade_id, estado = r.estado,
        motivo_da_retirada = case when r.estado = 'retirada' then r.motivo_da_retirada end,
        atualizada_em = r.atualizada_em, atualizada_por = auth.uid(), pela_equipe = v_equipe,
        experimental_id = coalesce(r.experimental_id, e.experimental_id), sincronizada_em = now()
      where id = e.id;
    else
      insert into public.presencas (id, academia_id, horario_id, data, aula_id, turma_id, pessoa_id, modalidade_id, origem, estado,
        motivo_da_retirada, registrada_em, registrada_por, atualizada_em, atualizada_por, pela_equipe, experimental_id)
      values (coalesce(r.id, gen_random_uuid()), a.id, r.horario_id, r.data, v_aula, t.id, r.pessoa_id, r.modalidade_id, r.origem, r.estado,
        case when r.estado = 'retirada' then r.motivo_da_retirada end, r.registrada_em, auth.uid(), r.atualizada_em, auth.uid(), v_equipe, r.experimental_id);
    end if;
    -- marcar o experimental presente põe a experimental em "compareceu" (R19.5)
    if r.experimental_id is not null and v_equipe and r.estado = 'confirmada' then
      update public.aulas_experimentais set estado = 'compareceu' where id = r.experimental_id and estado = 'agendada';
    end if;
    n := n + 1;
  end loop;
  return n;
end
$fn$;

-- =============================================================================
-- 4. O DINHEIRO (Admin). Iguais às do AM1; mais marcar_como_pagas e
--    matricular_interessado, que eram gravações em sequência no repositório.
-- =============================================================================

create function public.exigir_financeiro(p_academia uuid, p_nivel text default 'tudo')
  returns void language plpgsql stable security definer set search_path = public as $fn$
begin
  if not public.pode_financeiro(p_academia, p_nivel) then
    raise exception 'sem_permissao' using errcode = '42501';
  end if;
end
$fn$;

-- a categoria de entrada pelo nome da lista proposta (o dono pode mudar a linha depois)
create function public.categoria_da_cobranca(p_academia uuid, p_tipo text)
  returns uuid language sql stable security definer set search_path = public as $fn$
  select c.id from public.categorias c
  where c.academia_id = p_academia and c.tipo = 'entrada' and not c.arquivada
    and lower(c.nome) = lower(case p_tipo
      when 'mensalidade' then 'Mensalidades' when 'matricula' then 'Taxas de matrícula'
      when 'graduacao' then 'Exames de graduação' when 'evento' then 'Eventos e campeonatos (entradas)'
      when 'produto' then 'Venda de produtos' else 'Outras entradas' end)
  limit 1
$fn$;

-- GRADE: grava as linhas editadas, coladas ou desfeitas (uma ação = uma transação).
create function public.gravar_lancamentos(p_academia uuid, p_linhas jsonb)
  returns int language plpgsql security definer set search_path = public as $fn$
declare r public.lancamentos; n int := 0;
begin
  perform public.exigir_financeiro(p_academia);
  for r in select * from jsonb_populate_recordset(null::public.lancamentos, p_linhas) loop
    if r.academia_id <> p_academia then raise exception 'academia_errada' using errcode = '42501'; end if;
    insert into public.lancamentos as l (id, academia_id, data, descricao, categoria_id, tipo, valor_centavos, forma_de_pagamento, pessoa_id,
      situacao, reparticao, origem, cobranca_id, despesa_fixa_id, importacao_id, evento_id, estimado, observacao, arquivado, criado_por, criado_em)
    values (r.id, r.academia_id, r.data, r.descricao, r.categoria_id, r.tipo, r.valor_centavos, r.forma_de_pagamento, r.pessoa_id,
      r.situacao, r.reparticao, coalesce(r.origem, 'manual'), r.cobranca_id, r.despesa_fixa_id, r.importacao_id, r.evento_id,
      coalesce(r.estimado, false), r.observacao, coalesce(r.arquivado, false), auth.uid(), coalesce(r.criado_em, now()))
    on conflict (id) do update set
      data = excluded.data, descricao = excluded.descricao, categoria_id = excluded.categoria_id, tipo = excluded.tipo,
      valor_centavos = excluded.valor_centavos, forma_de_pagamento = excluded.forma_de_pagamento, pessoa_id = excluded.pessoa_id,
      situacao = excluded.situacao, reparticao = excluded.reparticao, evento_id = excluded.evento_id, estimado = excluded.estimado,
      observacao = excluded.observacao, arquivado = excluded.arquivado
    where l.academia_id = p_academia;
    n := n + 1;
  end loop;
  return n;
end
$fn$;

-- MENSALIDADES: o app calcula com gerarMensalidadesDoMes e manda as novas; o
-- índice único (matrícula, mês, tipo) garante que rodar duas vezes não duplica.
create function public.inserir_cobrancas(p_academia uuid, p_cobrancas jsonb)
  returns int language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  perform public.exigir_financeiro(p_academia, 'cobranca');
  insert into public.cobrancas
  select * from jsonb_populate_recordset(null::public.cobrancas, p_cobrancas) c where c.academia_id = p_academia
  on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end
$fn$;

-- MARCAR COMO PAGA (RA4.7): a cobrança vira paga E nasce a linha de entrada, com a repartição.
-- Pagamento parcial é recusado (A11).
create function public.marcar_como_paga(p_cobranca uuid, p_data date, p_forma text, p_valor bigint default null)
  returns uuid language plpgsql security definer set search_path = public as $fn$
declare c public.cobrancas; v_pago bigint; v_lanc uuid := gen_random_uuid(); v_rep jsonb;
begin
  select * into c from public.cobrancas where id = p_cobranca for update;
  if not found then raise exception 'nao_encontrada' using errcode = 'P0002'; end if;
  perform public.exigir_financeiro(c.academia_id, 'cobranca');
  if c.estado = 'paga' then raise exception 'ja_paga' using errcode = 'P0001'; end if;
  if c.estado = 'cancelada' then raise exception 'cancelada' using errcode = 'P0001'; end if;
  v_pago := coalesce(p_valor, c.valor_centavos);
  if v_pago < c.valor_centavos then raise exception 'pagamento_parcial' using errcode = 'P0001'; end if;
  if v_pago = c.valor_centavos or jsonb_array_length(c.reparticao) = 0 then
    v_rep := nullif(c.reparticao, '[]'::jsonb);
  else
    select jsonb_agg(jsonb_build_object('modalidadeId', p ->> 'modalidadeId', 'centavos',
      ((p ->> 'centavos')::bigint * v_pago) / c.valor_centavos + case when i = 1 then v_pago - (
        select sum(((q ->> 'centavos')::bigint * v_pago) / c.valor_centavos) from jsonb_array_elements(c.reparticao) q) else 0 end) order by i)
    into v_rep from jsonb_array_elements(c.reparticao) with ordinality as x (p, i);
  end if;
  insert into public.lancamentos (id, academia_id, data, descricao, categoria_id, tipo, valor_centavos, forma_de_pagamento, pessoa_id,
    situacao, reparticao, origem, cobranca_id, evento_id)
  values (v_lanc, c.academia_id, p_data, c.descricao, public.categoria_da_cobranca(c.academia_id, c.tipo), 'entrada', v_pago, p_forma,
    c.pessoa_id, 'pago', v_rep, 'mensalidade', c.id, c.evento_id);
  update public.cobrancas set estado = 'paga', paga_em = p_data, valor_pago_centavos = v_pago, forma_de_pagamento = p_forma, lancamento_id = v_lanc
  where id = c.id;
  return v_lanc;
end
$fn$;

-- "marcar as N como pagas" (a família Kids): tudo ou nada
create function public.marcar_como_pagas(p_cobrancas uuid[], p_data date, p_forma text)
  returns int language plpgsql security definer set search_path = public as $fn$
declare v uuid; n int := 0;
begin
  foreach v in array p_cobrancas loop
    perform public.marcar_como_paga(v, p_data, p_forma, null);
    n := n + 1;
  end loop;
  return n;
end
$fn$;

-- DESFAZER O PAGAMENTO: a cobrança reabre e a linha é ARQUIVADA (não apagada)
create function public.desfazer_pagamento(p_cobranca uuid)
  returns void language plpgsql security definer set search_path = public as $fn$
declare c public.cobrancas;
begin
  select * into c from public.cobrancas where id = p_cobranca for update;
  if not found then raise exception 'nao_encontrada' using errcode = 'P0002'; end if;
  perform public.exigir_financeiro(c.academia_id, 'cobranca');
  if c.estado <> 'paga' then raise exception 'nao_paga' using errcode = 'P0001'; end if;
  update public.lancamentos set arquivado = true where id = c.lancamento_id;
  update public.cobrancas set estado = 'aberta', paga_em = null, valor_pago_centavos = null, forma_de_pagamento = null, lancamento_id = null
  where id = c.id;
end
$fn$;

create function public.cancelar_cobranca(p_cobranca uuid)
  returns void language plpgsql security definer set search_path = public as $fn$
declare c public.cobrancas;
begin
  select * into c from public.cobrancas where id = p_cobranca for update;
  if not found then raise exception 'nao_encontrada' using errcode = 'P0002'; end if;
  perform public.exigir_financeiro(c.academia_id, 'cobranca');
  if c.estado = 'paga' then raise exception 'paga_nao_cancela' using errcode = 'P0001'; end if;
  update public.cobrancas set estado = 'cancelada' where id = c.id;
end
$fn$;

-- FECHAR O MÊS (RA4.10): a foto dos números (caixa) e a trava
create function public.fechar_mes(p_academia uuid, p_competencia text)
  returns uuid language plpgsql security definer set search_path = public as $fn$
declare v_id uuid := gen_random_uuid(); v_totais jsonb; v_cat jsonb; v_receber bigint;
begin
  perform public.exigir_financeiro(p_academia);
  if not public.competencia_valida(p_competencia) then raise exception 'competencia_invalida' using errcode = '22023'; end if;
  if public.mes_fechado(p_academia, p_competencia) then raise exception 'ja_fechado' using errcode = 'P0001'; end if;
  select jsonb_build_object(
      'entradas', coalesce(sum(valor_centavos) filter (where situacao = 'pago' and tipo = 'entrada'), 0),
      'saidas', coalesce(sum(valor_centavos) filter (where situacao = 'pago' and tipo = 'saida'), 0),
      'resultado', coalesce(sum(case when situacao = 'pago' then case tipo when 'entrada' then valor_centavos else -valor_centavos end end), 0),
      'entradasPendentes', coalesce(sum(valor_centavos) filter (where situacao = 'pendente' and tipo = 'entrada'), 0),
      'saidasPendentes', coalesce(sum(valor_centavos) filter (where situacao = 'pendente' and tipo = 'saida'), 0),
      'quantidade', count(*))
    into v_totais
  from public.lancamentos where academia_id = p_academia and not arquivado and to_char(data, 'YYYY-MM') = p_competencia;
  select coalesce(jsonb_object_agg(k, jsonb_build_object('entradas', e, 'saidas', s)), '{}'::jsonb) into v_cat from (
    select coalesce(categoria_id::text, 'sem_categoria') k,
      coalesce(sum(valor_centavos) filter (where tipo = 'entrada'), 0) e, coalesce(sum(valor_centavos) filter (where tipo = 'saida'), 0) s
    from public.lancamentos where academia_id = p_academia and not arquivado and situacao = 'pago' and to_char(data, 'YYYY-MM') = p_competencia
    group by 1) x;
  select coalesce(sum(valor_centavos), 0) into v_receber from public.cobrancas
  where academia_id = p_academia and estado = 'aberta' and competencia <= p_competencia;
  insert into public.fechamentos (id, academia_id, competencia, totais, por_categoria, a_receber_em_aberto)
  values (v_id, p_academia, p_competencia, v_totais, v_cat, v_receber);
  return v_id;
end
$fn$;

-- REABRIR (pede motivo, que vai para o histórico pelo app.motivo)
create function public.reabrir_mes(p_academia uuid, p_competencia text, p_motivo text)
  returns void language plpgsql security definer set search_path = public as $fn$
begin
  perform public.exigir_financeiro(p_academia);
  if coalesce(btrim(p_motivo), '') = '' then raise exception 'sem_motivo' using errcode = '22023'; end if;
  perform set_config('app.motivo', btrim(p_motivo), true);
  update public.fechamentos set reaberto_em = now(), reaberto_por = auth.uid(), motivo_da_reabertura = btrim(p_motivo)
  where academia_id = p_academia and competencia = p_competencia and reaberto_em is null;
  if not found then raise exception 'nao_fechado' using errcode = 'P0001'; end if;
end
$fn$;

-- IMPORTAR (RA8.5): categorias novas + a importação + as linhas, juntas
create function public.importar_lancamentos(p_academia uuid, p_importacao jsonb, p_categorias jsonb, p_linhas jsonb)
  returns int language plpgsql security definer set search_path = public as $fn$
declare n int;
begin
  perform public.exigir_financeiro(p_academia);
  perform set_config('app.motivo', 'importação de ' || coalesce(p_importacao ->> 'arquivo_nome', 'arquivo'), true);
  insert into public.categorias (id, academia_id, nome, tipo, ordem)
  select c.id, p_academia, c.nome, c.tipo, c.ordem from jsonb_populate_recordset(null::public.categorias, p_categorias) c
  on conflict do nothing;
  insert into public.importacoes select * from jsonb_populate_record(null::public.importacoes, p_importacao || jsonb_build_object('academia_id', p_academia));
  insert into public.lancamentos (id, academia_id, data, descricao, categoria_id, tipo, valor_centavos, forma_de_pagamento, pessoa_id,
    situacao, reparticao, origem, importacao_id, observacao)
  select l.id, p_academia, l.data, l.descricao, l.categoria_id, l.tipo, l.valor_centavos, l.forma_de_pagamento, l.pessoa_id,
    l.situacao, l.reparticao, 'importacao', (p_importacao ->> 'id')::uuid, l.observacao
  from jsonb_populate_recordset(null::public.lancamentos, p_linhas) l;
  get diagnostics n = row_count;
  return n;
end
$fn$;

-- DESFAZER A IMPORTAÇÃO: arquiva as linhas dela (mês fechado no meio impede, pelo gatilho)
create function public.desfazer_importacao(p_importacao uuid)
  returns int language plpgsql security definer set search_path = public as $fn$
declare v_academia uuid; n int;
begin
  select academia_id into v_academia from public.importacoes where id = p_importacao;
  if not found then raise exception 'nao_encontrada' using errcode = 'P0002'; end if;
  perform public.exigir_financeiro(v_academia);
  update public.lancamentos set arquivado = true where importacao_id = p_importacao and not arquivado;
  get diagnostics n = row_count;
  update public.importacoes set estado = 'desfeita' where id = p_importacao;
  return n;
end
$fn$;

-- MATRICULAR DO FUNIL (RA11.3, seção 38): a pessoa, a matrícula, o interessado,
-- a experimental, a indicação, as cobranças e o vínculo do app, juntos (R14.7)
create function public.matricular_interessado(p_academia uuid, p_interessado uuid, p_pessoa jsonb, p_matricula jsonb, p_cobrancas jsonb default '[]')
  returns uuid language plpgsql security definer set search_path = public as $fn$
declare v_pessoa public.pessoas; v_m public.matriculas;
begin
  perform public.exigir_financeiro(p_academia, 'cobranca');
  if not exists (select 1 from public.interessados where id = p_interessado and academia_id = p_academia) then
    raise exception 'nao_encontrada' using errcode = 'P0002';
  end if;
  select * into v_pessoa from public.pessoas where id = (p_pessoa ->> 'id')::uuid and academia_id = p_academia;
  if not found then
    insert into public.pessoas select * from jsonb_populate_record(null::public.pessoas,
      jsonb_build_object('id', gen_random_uuid(), 'criada_em', now(), 'atualizada_em', now(), 'eh_aluno', true,
        'eh_funcionario', false, 'eh_responsavel', false) || p_pessoa || jsonb_build_object('academia_id', p_academia))
    returning * into v_pessoa;
  end if;
  v_m := jsonb_populate_record(null::public.matriculas, jsonb_build_object('id', gen_random_uuid(), 'descontos', '[]'::jsonb,
    'isentar_taxa_de_matricula', false, 'pessoa_id', v_pessoa.id, 'pagador_pessoa_id', v_pessoa.id) || p_matricula
    || jsonb_build_object('academia_id', p_academia));
  insert into public.matriculas select (v_m).*;
  update public.interessados set matriculado_em = current_date, pessoa_id = v_pessoa.id where id = p_interessado;
  update public.aulas_experimentais set estado = 'matriculou' where interessado_id = p_interessado and estado = 'compareceu';
  update public.indicacoes set estado = 'convertida' where interessado_id = p_interessado;
  insert into public.cobrancas
  select * from jsonb_populate_recordset(null::public.cobrancas, p_cobrancas) c where c.academia_id = p_academia
  on conflict do nothing;
  if v_pessoa.usuario_id is not null then
    insert into public.vinculos (usuario_id, academia_id, papel, estado) values (v_pessoa.usuario_id, p_academia, 'aluno', 'ativo')
    on conflict (usuario_id, academia_id, papel) do update set estado = 'ativo', ate = null;
  end if;
  return v_pessoa.id;
end
$fn$;
