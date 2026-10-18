-- =============================================================================
-- 0101 — Pessoas (o cadastro que liga os três apps) e o tatame: modalidades,
-- réguas de graduação, turmas e horários, aulas (ajustes), presença,
-- graduação e exame, eventos e lutas, Atletas, técnicas, Raça Responde, Kids,
-- interessado, aula experimental e indicação.
-- Agente AU, 16/10/2026. Junta o que estava em
--   admin/supabase/migrations/20261015000200_admin_tabelas.sql (pessoas,
--   modalidades, eventos, interessados, aulas_experimentais; AM1)
--   app/supabase/migracoes/20261016000200_luta_colunas.sql (colunas de luta; AM2)
-- e cria as tabelas que só o app usava (pendência do AM2).
--
-- O ALUNO no banco é sempre uma PESSOA (`pessoa_id`): o adulto com conta
-- (pessoas.usuario_id), o dependente Kids sem conta (pessoas.responsavel_pessoa_id)
-- e quem só existe no cadastro do dono. Presença, graduação, turma e luta
-- apontam para a pessoa, não para a conta.
--
-- A AULA não é tabela (R14.4a): é um horário numa data. A chave dela é o texto
-- `<horario_id>@<AAAA-MM-DD>` (o formato do app), preenchido por gatilho a
-- partir de horario_id + data, que são as colunas de verdade.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- pessoas (seção 27 do modelo). Existe sem conta no app (RA13.1). Sem saúde.
-- -----------------------------------------------------------------------------
create table public.pessoas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  telefone text check (char_length(telefone) <= 30),
  email text check (char_length(email) <= 200),
  documento text check (char_length(documento) <= 30),          -- [decidir] A17; vazio por padrão
  data_nascimento date,
  responsavel_pessoa_id uuid references public.pessoas (id),
  usuario_id uuid references auth.users (id),
  eh_aluno boolean not null default false,
  eh_funcionario boolean not null default false,
  eh_responsavel boolean not null default false,
  -- "Traga um amiguinho" (R19.9): o código de indicação do aluno
  codigo_de_indicacao text unique check (codigo_de_indicacao ~ '^[A-HJ-NP-Z2-9]{6}$'),
  observacao text check (char_length(observacao) <= 500),
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  unique (academia_id, usuario_id),
  check (responsavel_pessoa_id is null or responsavel_pessoa_id <> id)
);
create index pessoas_responsavel on public.pessoas (responsavel_pessoa_id) where responsavel_pessoa_id is not null;

-- a conta logada cuida desta pessoa? (é ela mesma, ou é o responsável dela)
create function public.cuido_da_pessoa(p uuid)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.pessoas x
    left join public.pessoas r on r.id = x.responsavel_pessoa_id
    where x.id = p and (x.usuario_id = auth.uid() or r.usuario_id = auth.uid())
  )
$fn$;

create function public.academia_da_pessoa(p uuid)
  returns uuid language sql stable security definer set search_path = public as $fn$
  select academia_id from public.pessoas where id = p
$fn$;

-- conta de aluno ativa ganha a pessoa no cadastro (liga o app ao Admin, RA13.5)
create function public.garantir_pessoa_do_aluno()
  returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.papel = 'aluno' and new.estado = 'ativo' then
    insert into public.pessoas (academia_id, nome, email, usuario_id, eh_aluno)
    select new.academia_id, u.nome, u.email, new.usuario_id, true from public.usuarios u where u.id = new.usuario_id
    on conflict (academia_id, usuario_id) do update set eh_aluno = true;
  end if;
  return new;
end
$fn$;
create trigger vinculos_garantir_pessoa after insert or update of estado on public.vinculos
  for each row execute function public.garantir_pessoa_do_aluno();

-- -----------------------------------------------------------------------------
-- dependentes (R20): o que é do responsável sobre a criança. Saúde é DADO DE
-- SAÚDE (R20.5): a equipe só lê a linha se ele ligou; a autorização de imagem
-- (R20.6) a equipe pergunta pela função imagem_autorizada().
-- -----------------------------------------------------------------------------
create table public.dependentes (
  pessoa_id uuid primary key references public.pessoas (id),
  academia_id uuid not null references public.academias (id),
  saude text check (char_length(saude) <= 500),
  saude_visivel_para_equipe boolean not null default false,
  imagem_autorizada boolean not null default false,
  imagem_autorizada_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create function public.imagem_autorizada(p uuid)
  returns boolean language sql stable security definer set search_path = public as $fn$
  -- adulto (sem responsável) decide por si; dependente só com a chave do responsável
  select case
    when (select responsavel_pessoa_id from public.pessoas where id = p) is null then true
    else coalesce((select d.imagem_autorizada from public.dependentes d where d.pessoa_id = p), false) end
$fn$;

-- -----------------------------------------------------------------------------
-- modalidades (R14.1): lista DA ACADEMIA. `chave` é a lista base (R14.1a), não o id.
-- -----------------------------------------------------------------------------
create table public.modalidades (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  chave text check (chave in ('muay_thai', 'boxe', 'jiu_jitsu', 'luta_livre', 'mma', 'judo', 'karate', 'kickboxing', 'wrestling', 'outra')),
  nome text not null check (char_length(btrim(nome)) between 1 and 60),
  ordem smallint not null default 0,
  ativa boolean not null default true
);
create unique index modalidades_chave on public.modalidades (academia_id, chave) where chave is not null and chave <> 'outra';

-- lista de modalidades (uuid[]) só com modalidades da MESMA academia: o Postgres
-- não tem chave estrangeira em array, então o gatilho confere
create function public.modalidades_da_academia(academia uuid, ids uuid[])
  returns boolean language sql stable security definer set search_path = public as $fn$
  select coalesce(array_length(ids, 1), 0) = (
    select count(distinct m.id) from public.modalidades m where m.academia_id = academia and m.id = any (ids)
  ) and coalesce(array_length(ids, 1), 0) = (select count(distinct x) from unnest(ids) x)
$fn$;
create function public.conferir_modalidade_ids()
  returns trigger language plpgsql as $fn$
begin
  if not public.modalidades_da_academia(new.academia_id, new.modalidade_ids) then
    raise exception 'modalidade_invalida' using errcode = '23503';
  end if;
  return new;
end
$fn$;

-- -----------------------------------------------------------------------------
-- sistemas_de_graduacao (R16.1, R16.2): a régua é DADO. Os níveis vão em JSONB
-- com a forma de NivelDeGraduacao (app/dominio/graduacao/sistemas.ts); o
-- `id` de cada nível é texto ("branca", "azul") e a graduação aponta para ele.
-- -----------------------------------------------------------------------------
create table public.sistemas_de_graduacao (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  modalidade_id uuid references public.modalidades (id),
  modalidade_chave text not null,
  publico text not null check (publico in ('adulto', 'kids')),
  nome text not null check (char_length(btrim(nome)) between 1 and 80),
  palavra_do_nivel text not null check (char_length(palavra_do_nivel) between 1 and 20),
  palavra_do_grau text check (char_length(palavra_do_grau) <= 20),
  contagem_da_idade text not null check (contagem_da_idade in ('ano_civil', 'aniversario')),
  origem text not null check (origem in ('modelo', 'academia')),
  a_configurar boolean not null default true,
  niveis jsonb not null default '[]' check (jsonb_typeof(niveis) = 'array'),
  ativo boolean not null default true
);

create function public.nivel_existe(sistema uuid, nivel text)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.sistemas_de_graduacao s, jsonb_array_elements(s.niveis) n
    where s.id = sistema and n ->> 'id' = nivel
  )
$fn$;

-- -----------------------------------------------------------------------------
-- turmas e horarios (R14.2 a R14.4). Escreve o dono (R14.2a).
-- -----------------------------------------------------------------------------
create table public.turmas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  chave text check (chave ~ '^[a-z0-9-]{2,60}$'),
  nome text not null check (char_length(btrim(nome)) between 1 and 80),
  modalidade_ids uuid[] not null check (cardinality(modalidade_ids) >= 1),
  publico text not null check (publico in ('adulto', 'kids', 'competicao', 'aberta')),
  idade_minima int check (idade_minima between 0 and 120),
  idade_maxima int check (idade_maxima between 0 and 120),
  nivel text not null default 'todos' check (nivel in ('todos', 'iniciante', 'intermediario', 'avancado')),
  exigencia jsonb check (exigencia is null or exigencia ->> 'tipo' in ('faixa_minima', 'so_atletas')),
  professor_id uuid references auth.users (id),
  auxiliar_ids uuid[] not null default '{}',
  capacidade int check (capacidade > 0),                           -- nulo = sem limite (L15)
  ativa boolean not null default true,
  check (idade_maxima is null or idade_minima is null or idade_maxima >= idade_minima)
);
create unique index turmas_chave on public.turmas (academia_id, chave) where chave is not null;
create trigger turmas_modalidades before insert or update on public.turmas
  for each row execute function public.conferir_modalidade_ids();

create table public.horarios (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  turma_id uuid not null references public.turmas (id),
  dia text not null check (dia in ('dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab')),
  inicio text not null check (inicio ~ '^([01]\d|2[0-3]):[0-5]\d$'),   -- 'HH:MM' no fuso da academia
  duracao_minutos int not null check (duracao_minutos between 1 and 600),
  desde date,                                                          -- R14.4b: mudar vale da próxima semana
  ate date,
  ativo boolean not null default true
);
create index horarios_turma on public.horarios (turma_id);

-- a conta logada age como professor desta turma? (o professor ou um auxiliar
-- dela, com vínculo de instrutor ativo; o dono pode tudo o que o professor pode)
create function public.e_professor_da_turma(turma uuid)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.turmas t
    where t.id = turma and (
      public.e_dono(t.academia_id)
      or ((t.professor_id = auth.uid() or auth.uid() = any (t.auxiliar_ids)) and public.tem_vinculo(t.academia_id, array['instrutor']))
    )
  )
$fn$;

-- a conta logada dá aula nesta modalidade (em alguma turma ativa)? O dono também passa.
create function public.e_professor_da_modalidade(academia uuid, modalidade uuid)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select public.e_dono(academia) or (public.tem_vinculo(academia, array['instrutor']) and exists (
    select 1 from public.turmas t
    where t.academia_id = academia and t.ativa and modalidade = any (t.modalidade_ids)
      and (t.professor_id = auth.uid() or auth.uid() = any (t.auxiliar_ids))
  ))
$fn$;

-- o instante de início de uma aula, no fuso da academia
create function public.inicio_da_aula(p_horario uuid, p_data date)
  returns timestamptz language sql stable security definer set search_path = public as $fn$
  select (p_data + h.inicio::time) at time zone a.fuso
  from public.horarios h join public.academias a on a.id = h.academia_id
  where h.id = p_horario
$fn$;

-- preenche aula_id e confere que a data cai no dia da semana do horário
create function public.preencher_aula()
  returns trigger language plpgsql security definer set search_path = public as $fn$
declare v_dia text;
begin
  if new.horario_id is null then
    return new;
  end if;
  select dia into v_dia from public.horarios where id = new.horario_id and academia_id = new.academia_id;
  if v_dia is null then
    raise exception 'horario_invalido' using errcode = '23503';
  end if;
  if (array['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'])[extract(dow from new.data)::int + 1] <> v_dia then
    raise exception 'data_fora_do_dia_do_horario' using errcode = '22023';
  end if;
  new.aula_id := new.horario_id::text || '@' || to_char(new.data, 'YYYY-MM-DD');
  return new;
end
$fn$;

-- quem está numa turma (a "matrícula na turma"; a matrícula com plano e valor é do Admin)
create table public.alunos_das_turmas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  turma_id uuid not null references public.turmas (id),
  pessoa_id uuid not null references public.pessoas (id),
  desde date not null default current_date,
  ate date,
  check (ate is null or ate >= desde)
);
create unique index alunos_das_turmas_um on public.alunos_das_turmas (turma_id, pessoa_id) where ate is null;

-- R14.9: a marca de atleta, por modalidade (o professor liga e desliga)
create table public.atletas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  pessoa_id uuid not null references public.pessoas (id),
  modalidade_id uuid not null references public.modalidades (id),
  ativo boolean not null default true,
  marcado_por uuid not null default auth.uid(),
  em timestamptz not null default now(),
  unique (pessoa_id, modalidade_id)
);

-- R14.5: a aula cancelada ou com substituto (só vira linha quando acontece)
create table public.ajustes_de_aula (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  horario_id uuid not null references public.horarios (id),
  data date not null,
  aula_id text not null,
  tipo text not null check (tipo in ('cancelada', 'substituto')),
  motivo text check (motivo in ('feriado', 'evento', 'outro')),
  substituto_id uuid references auth.users (id),
  por_id uuid not null default auth.uid(),
  em timestamptz not null default now(),
  unique (aula_id, tipo),
  check ((tipo = 'substituto') = (substituto_id is not null))
);
create trigger ajustes_aula before insert or update on public.ajustes_de_aula
  for each row execute function public.preencher_aula();

-- o professor da aula: o da turma ou o substituto
create function public.e_professor_da_aula(p_horario uuid, p_data date)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from public.horarios h where h.id = p_horario and public.e_professor_da_turma(h.turma_id))
      or exists (select 1 from public.ajustes_de_aula a where a.horario_id = p_horario and a.data = p_data
                 and a.tipo = 'substituto' and a.substituto_id = auth.uid())
$fn$;

-- -----------------------------------------------------------------------------
-- presencas (R15). UMA por aluno por aula (R15.6). A escrita é só pela função
-- registrar_presencas (fila do aparelho → servidor), que aplica R15.9: a ação
-- da equipe vence o check-in; entre duas ações da equipe, a mais recente.
-- -----------------------------------------------------------------------------
create table public.presencas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  horario_id uuid not null references public.horarios (id),
  data date not null,
  aula_id text not null,
  turma_id uuid not null references public.turmas (id),
  pessoa_id uuid not null references public.pessoas (id),
  modalidade_id uuid not null references public.modalidades (id),
  origem text not null check (origem in ('checkin', 'chamada', 'recepcao', 'experimental', 'correcao')),
  estado text not null check (estado in ('pendente', 'confirmada', 'retirada')),
  motivo_da_retirada text check (motivo_da_retirada in ('nao_estava', 'aula_cancelada', 'desfeito_pelo_aluno', 'correcao')),
  registrada_em timestamptz not null,
  registrada_por uuid not null,
  atualizada_em timestamptz not null,
  atualizada_por uuid not null,
  pela_equipe boolean not null default false,
  experimental_id uuid,                                   -- chave estrangeira no fim do arquivo
  sincronizada_em timestamptz not null default now(),
  unique (aula_id, pessoa_id),
  check ((estado = 'retirada') = (motivo_da_retirada is not null))
);
create index presencas_pessoa on public.presencas (pessoa_id, data desc);
create index presencas_academia_data on public.presencas (academia_id, data);
create trigger presencas_aula before insert or update on public.presencas
  for each row execute function public.preencher_aula();

-- -----------------------------------------------------------------------------
-- graduacoes e exames (R16). Graduação não se apaga: anula-se com motivo (R16.13).
-- -----------------------------------------------------------------------------
create table public.exames (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  modalidade_id uuid not null references public.modalidades (id),
  sistema_id uuid not null references public.sistemas_de_graduacao (id),
  data date not null,
  hora text check (hora ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  local text check (char_length(local) <= 200),
  avaliador_ids uuid[] not null default '{}',
  fechado_em timestamptz,
  criado_por uuid not null default auth.uid(),
  criado_em timestamptz not null default now()
);

create table public.candidatos_do_exame (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  exame_id uuid not null references public.exames (id),
  pessoa_id uuid not null references public.pessoas (id),
  resultado text check (resultado in ('aprovado', 'nao_aprovado', 'faltou')),
  para_nivel_id text,
  para_grau int check (para_grau between 0 and 10),
  unique (exame_id, pessoa_id)
);

create table public.graduacoes (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  pessoa_id uuid not null references public.pessoas (id),
  modalidade_id uuid not null references public.modalidades (id),
  sistema_id uuid not null references public.sistemas_de_graduacao (id),
  nivel_id text not null,
  grau int not null default 0 check (grau between 0 and 10),
  data date not null,
  graduado_por_id uuid references auth.users (id),
  graduado_por_nome text check (char_length(graduado_por_nome) <= 120),
  observacao text check (char_length(observacao) <= 140),
  origem text not null check (origem in ('promocao', 'exame', 'inicial', 'anterior', 'correcao')),
  academia_de_origem text check (char_length(academia_de_origem) <= 120),
  exame_id uuid references public.exames (id),
  registrada_por uuid not null default auth.uid(),
  registrada_em timestamptz not null default now(),
  anulada_em timestamptz,
  anulada_por uuid references auth.users (id),
  motivo_da_anulacao text check (motivo_da_anulacao is null or char_length(btrim(motivo_da_anulacao)) between 1 and 300),
  check ((anulada_em is null) = (motivo_da_anulacao is null) and (anulada_em is null) = (anulada_por is null))
);
create index graduacoes_pessoa on public.graduacoes (pessoa_id, modalidade_id, data desc);

-- a graduação: data nunca futura (R16.6), nível da régua, e depois de gravada
-- só muda a ANULAÇÃO (R16.13)
create function public.proteger_graduacao()
  returns trigger language plpgsql as $fn$
begin
  if tg_op = 'INSERT' then
    if new.data > current_date then raise exception 'graduacao_no_futuro' using errcode = '22023'; end if;
    if not public.nivel_existe(new.sistema_id, new.nivel_id) then raise exception 'nivel_invalido' using errcode = '23503'; end if;
    return new;
  end if;
  if old.anulada_em is not null then raise exception 'graduacao_anulada' using errcode = 'P0001'; end if;
  if (to_jsonb(new) - array['anulada_em', 'anulada_por', 'motivo_da_anulacao'])
     is distinct from (to_jsonb(old) - array['anulada_em', 'anulada_por', 'motivo_da_anulacao']) then
    raise exception 'graduacao_so_anula' using errcode = 'P0001';
  end if;
  if new.anulada_por is distinct from auth.uid() then raise exception 'anulada_por_outro' using errcode = '42501'; end if;
  return new;
end
$fn$;
create trigger graduacoes_protecao before insert or update on public.graduacoes
  for each row execute function public.proteger_graduacao();

-- -----------------------------------------------------------------------------
-- eventos (R18.1; o Admin junta as linhas financeiras de cada um), participação
-- ("Vou participar", R18.3), lutas (R18.4) e o consentimento de Atletas (R18.6)
-- -----------------------------------------------------------------------------
create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  tipo text not null check (tipo in ('exame', 'seminario', 'aulao', 'campeonato', 'luta', 'confraternizacao', 'outro')),
  data date not null,
  hora text check (hora ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  local text check (char_length(local) <= 200),
  endereco text check (char_length(endereco) <= 200),
  descricao text check (char_length(descricao) <= 600),
  modalidade_ids uuid[] not null default '{}',
  publico text not null default 'alunos' check (publico in ('alunos', 'aberto')),
  link text check (link is null or link like 'https://%'),
  arquivado boolean not null default false,
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now()
);
create trigger eventos_modalidades before insert or update on public.eventos
  for each row execute function public.conferir_modalidade_ids();

-- L22: link só se a academia aceita
create function public.conferir_link_do_evento()
  returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if new.link is not null and not (select aceita_link_em_evento from public.academias where id = new.academia_id) then
    raise exception 'link_nao_aceito' using errcode = 'P0001';
  end if;
  return new;
end
$fn$;
create trigger eventos_link before insert or update on public.eventos
  for each row execute function public.conferir_link_do_evento();

create table public.participacoes_em_eventos (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  evento_id uuid not null references public.eventos (id),
  pessoa_id uuid not null references public.pessoas (id),
  vai boolean not null default true,                     -- desmarcar = falso (nada se apaga)
  em timestamptz not null default now(),
  unique (evento_id, pessoa_id)
);

create table public.consentimentos_de_atleta (
  pessoa_id uuid primary key references public.pessoas (id),
  academia_id uuid not null references public.academias (id),
  ligado boolean not null default false,
  em timestamptz not null default now(),
  por_id uuid not null default auth.uid()
);

create function public.atleta_visivel(p uuid)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select coalesce((select c.ligado from public.consentimentos_de_atleta c where c.pessoa_id = p), false)
     and public.imagem_autorizada(p)
$fn$;

create table public.lutas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  evento_id uuid references public.eventos (id),
  pessoa_id uuid not null references public.pessoas (id),
  modalidade_id uuid not null references public.modalidades (id),
  adversario text not null check (char_length(btrim(adversario)) between 1 and 120),
  equipe_do_adversario text check (char_length(equipe_do_adversario) <= 120),
  categoria text not null check (char_length(categoria) between 1 and 40),   -- a anunciada, não o peso medido (R18.5)
  nivel text not null check (nivel in ('amador', 'semi_pro', 'profissional')),
  regras text check (char_length(regras) <= 200),
  data date not null,
  local text check (char_length(local) <= 200),
  resultado text check (resultado in ('vitoria', 'derrota', 'empate', 'sem_resultado')),
  como text check (como in ('pontos', 'nocaute', 'finalizacao', 'decisao')),
  criado_por uuid not null default auth.uid(),
  criado_em timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- técnicas (R21) e perguntas frequentes, o "Raça Responde" (R22.3)
-- -----------------------------------------------------------------------------
create table public.tecnicas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  modalidade_id uuid not null references public.modalidades (id),
  titulo text not null check (char_length(btrim(titulo)) between 1 and 120),
  nivel text not null default 'todos' check (nivel in ('todos', 'iniciante', 'intermediario', 'avancado')),
  duracao_segundos int check (duracao_segundos >= 0),
  professor_id uuid references auth.users (id),
  data date not null default current_date,
  link text check (link is null or link like 'https://%'),       -- [decidir] L30: link (v1) ou arquivo
  aberta boolean not null default false,
  estado text not null default 'rascunho' check (estado in ('rascunho', 'publicada', 'arquivada')),
  tem_menor boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.perguntas_frequentes (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  pergunta text not null check (char_length(btrim(pergunta)) between 1 and 120),
  resposta text not null check (char_length(btrim(resposta)) between 1 and 600),
  ordem int not null default 0,
  ativa boolean not null default true
);

-- -----------------------------------------------------------------------------
-- interessado, aula experimental e indicação (R19; o funil do Admin, seção 38)
-- -----------------------------------------------------------------------------
create table public.interessados (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  whatsapp text check (char_length(whatsapp) <= 30),          -- só balcão e dono leem (R19.5)
  modalidade_ids uuid[] not null default '{}',                 -- o app usa a primeira (modalidadeId)
  crianca jsonb check (crianca is null or (crianca ? 'nome' and crianca ? 'idade')),
  origem text check (origem in ('instagram', 'whatsapp', 'indicacao', 'passou_na_porta', 'outro')),
  codigo_de_indicacao text check (codigo_de_indicacao is null or codigo_de_indicacao ~ '^[A-HJ-NP-Z2-9]{6}$'),
  indicado_por_pessoa_id uuid references public.pessoas (id),
  contato_em date not null default current_date,
  matriculado_em date,
  pessoa_id uuid references public.pessoas (id),
  desistiu_em date,
  motivo_da_desistencia text check (char_length(motivo_da_desistencia) <= 300),
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now()
);
create trigger interessados_modalidades before insert or update on public.interessados
  for each row execute function public.conferir_modalidade_ids();

create table public.aulas_experimentais (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  interessado_id uuid not null references public.interessados (id),
  data date not null,
  horario_id uuid references public.horarios (id),
  aula_id text,                                                -- `<horario>@<data>`, pelo gatilho
  turma_id uuid references public.turmas (id),
  modalidade_id uuid references public.modalidades (id),
  estado text not null check (estado in ('agendada', 'compareceu', 'faltou', 'remarcada', 'cancelada', 'matriculou', 'nao_seguiu')),
  remarcada_de uuid references public.aulas_experimentais (id),
  marcada_por uuid not null default auth.uid(),
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);
create trigger aulas_experimentais_aula before insert or update on public.aulas_experimentais
  for each row execute function public.preencher_aula();

alter table public.presencas add constraint presencas_experimental_fk
  foreign key (experimental_id) references public.aulas_experimentais (id);

create table public.indicacoes (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  codigo text not null check (codigo ~ '^[A-HJ-NP-Z2-9]{6}$'),
  pessoa_id uuid not null references public.pessoas (id),      -- quem indicou (o dono do código)
  interessado_id uuid not null references public.interessados (id),
  estado text not null default 'aberta' check (estado in ('aberta', 'convertida')),
  criada_em timestamptz not null default now(),
  unique (interessado_id)
);

-- =============================================================================
-- REGRAS DE ACESSO (RLS) deste arquivo
-- Leitura: A = aluno/responsável (só o dele: cuido_da_pessoa), P = professor
-- (as turmas e modalidades dele), R = recepção, D = dono, V = vitrine sem conta.
-- Nenhuma destas tabelas tem valor em reais: o dinheiro está no 0102.
-- =============================================================================
do $$
declare t text;
begin
  foreach t in array array['pessoas', 'dependentes', 'modalidades', 'sistemas_de_graduacao', 'turmas', 'horarios',
    'alunos_das_turmas', 'atletas', 'ajustes_de_aula', 'presencas', 'exames', 'candidatos_do_exame', 'graduacoes',
    'eventos', 'participacoes_em_eventos', 'consentimentos_de_atleta', 'lutas', 'tecnicas', 'perguntas_frequentes',
    'interessados', 'aulas_experimentais', 'indicacoes'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- pessoas: SÓ O DONO pela tabela (telefone, documento e a observação dele).
-- O app lê o que precisa por função: minhas_fichas(), fichas_da_academia(),
-- contato_do_responsavel() (sem telefone para o professor, R20.7).
create policy pessoas_dono on public.pessoas for all to authenticated
  using (public.e_dono(academia_id)) with check (public.e_dono(academia_id));

-- dependentes: o responsável lê e escreve; a equipe lê só se ele ligou a saúde
create policy dependentes_responsavel on public.dependentes for all to authenticated
  using (public.cuido_da_pessoa(pessoa_id)) with check (public.cuido_da_pessoa(pessoa_id) and academia_id = public.academia_da_pessoa(pessoa_id));
create policy dependentes_equipe_le on public.dependentes for select to authenticated
  using (saude_visivel_para_equipe and public.e_equipe(academia_id));

-- modalidades, turmas, horários: V lê as ativas; A/P/R/D leem; D escreve
create policy modalidades_vitrine on public.modalidades for select to anon using (ativa and public.academia_na_vitrine(academia_id));
create policy modalidades_ler on public.modalidades for select to authenticated using (public.e_da_academia(academia_id) or (ativa and public.academia_na_vitrine(academia_id)));
create policy modalidades_dono on public.modalidades for all to authenticated using (public.e_dono(academia_id)) with check (public.e_dono(academia_id));

create policy turmas_vitrine on public.turmas for select to anon using (ativa and public.academia_na_vitrine(academia_id));
create policy turmas_ler on public.turmas for select to authenticated using (public.e_da_academia(academia_id) or (ativa and public.academia_na_vitrine(academia_id)));
create policy turmas_dono on public.turmas for all to authenticated using (public.e_dono(academia_id)) with check (public.e_dono(academia_id));

create policy horarios_vitrine on public.horarios for select to anon using (ativo and public.academia_na_vitrine(academia_id));
create policy horarios_ler on public.horarios for select to authenticated using (public.e_da_academia(academia_id) or (ativo and public.academia_na_vitrine(academia_id)));
create policy horarios_dono on public.horarios for all to authenticated using (public.e_dono(academia_id)) with check (public.e_dono(academia_id));

-- réguas: quem tem vínculo lê; o dono escreve (R16.3)
create policy sistemas_ler on public.sistemas_de_graduacao for select to authenticated using (public.e_da_academia(academia_id));
create policy sistemas_dono on public.sistemas_de_graduacao for all to authenticated using (public.e_dono(academia_id)) with check (public.e_dono(academia_id));

-- quem está na turma: A (o seu), P (das turmas dele), R, D; escreve o dono
create policy alunos_das_turmas_ler on public.alunos_das_turmas for select to authenticated
  using (public.cuido_da_pessoa(pessoa_id) or public.e_balcao(academia_id) or public.e_professor_da_turma(turma_id));
create policy alunos_das_turmas_dono on public.alunos_das_turmas for all to authenticated
  using (public.e_dono(academia_id)) with check (public.e_dono(academia_id) and academia_id = public.academia_da_pessoa(pessoa_id));

-- atleta: A (o seu), equipe lê; o professor da modalidade e o dono marcam (R14.9)
create policy atletas_ler on public.atletas for select to authenticated
  using (public.cuido_da_pessoa(pessoa_id) or public.e_equipe(academia_id));
create policy atletas_marcar on public.atletas for insert to authenticated
  with check (public.e_professor_da_modalidade(academia_id, modalidade_id) and academia_id = public.academia_da_pessoa(pessoa_id) and marcado_por = auth.uid());
create policy atletas_mudar on public.atletas for update to authenticated
  using (public.e_professor_da_modalidade(academia_id, modalidade_id)) with check (public.e_professor_da_modalidade(academia_id, modalidade_id) and marcado_por = auth.uid());

-- ajuste de aula: todos da academia leem (o aluno precisa saber do cancelamento);
-- escrever só pelas funções cancelar_aula / passar_aula (antes do início, R14.5)
create policy ajustes_ler on public.ajustes_de_aula for select to authenticated using (public.e_da_academia(academia_id));

-- presença: A (as dele e as dos dependentes), P (das aulas dele e das
-- modalidades dele, R15.13), R, D. Colega nunca. Escrever: só pela função.
create policy presencas_ler on public.presencas for select to authenticated
  using (public.cuido_da_pessoa(pessoa_id) or public.e_balcao(academia_id)
         or public.e_professor_da_aula(horario_id, data) or public.e_professor_da_modalidade(academia_id, modalidade_id));

-- exame: equipe lê e o candidato lê o dele; o professor da modalidade e o dono escrevem
create policy exames_ler on public.exames for select to authenticated
  using (public.e_equipe(academia_id) or exists (select 1 from public.candidatos_do_exame c where c.exame_id = exames.id and public.cuido_da_pessoa(c.pessoa_id)));
create policy exames_escrever on public.exames for insert to authenticated
  with check (public.e_professor_da_modalidade(academia_id, modalidade_id) and criado_por = auth.uid());
create policy exames_mudar on public.exames for update to authenticated
  using (public.e_professor_da_modalidade(academia_id, modalidade_id)) with check (public.e_professor_da_modalidade(academia_id, modalidade_id));

create function public.modalidade_do_exame(exame uuid)
  returns uuid language sql stable security definer set search_path = public as $fn$
  select modalidade_id from public.exames where id = exame
$fn$;
create policy candidatos_ler on public.candidatos_do_exame for select to authenticated
  using (public.cuido_da_pessoa(pessoa_id) or public.e_equipe(academia_id));
create policy candidatos_escrever on public.candidatos_do_exame for insert to authenticated
  with check (public.e_professor_da_modalidade(academia_id, public.modalidade_do_exame(exame_id)) and academia_id = public.academia_da_pessoa(pessoa_id));
create policy candidatos_mudar on public.candidatos_do_exame for update to authenticated
  using (public.e_professor_da_modalidade(academia_id, public.modalidade_do_exame(exame_id)))
  with check (public.e_professor_da_modalidade(academia_id, public.modalidade_do_exame(exame_id)));

-- graduação: A lê as dele (não as anuladas, R16.13), a equipe lê todas (R16.15);
-- registra o professor da modalidade ou o dono (R16.6); mudar = só anular
create policy graduacoes_aluno on public.graduacoes for select to authenticated
  using (public.cuido_da_pessoa(pessoa_id) and anulada_em is null);
create policy graduacoes_equipe on public.graduacoes for select to authenticated using (public.e_equipe(academia_id));
create policy graduacoes_registrar on public.graduacoes for insert to authenticated
  with check (public.e_professor_da_modalidade(academia_id, modalidade_id) and registrada_por = auth.uid()
              and academia_id = public.academia_da_pessoa(pessoa_id));
create policy graduacoes_anular on public.graduacoes for update to authenticated
  using (public.e_professor_da_modalidade(academia_id, modalidade_id)) with check (public.e_professor_da_modalidade(academia_id, modalidade_id));

-- eventos: V lê os abertos; quem tem vínculo lê; criam o professor (nas
-- modalidades dele), a recepção e o dono (R18.2)
create function public.pode_escrever_evento(academia uuid, modalidades uuid[])
  returns boolean language sql stable security definer set search_path = public as $fn$
  select public.e_balcao(academia) or (
    public.tem_vinculo(academia, array['instrutor']) and cardinality(modalidades) > 0
    and not exists (select 1 from unnest(modalidades) m where not public.e_professor_da_modalidade(academia, m))
  )
$fn$;
create policy eventos_vitrine on public.eventos for select to anon
  using (publico = 'aberto' and not arquivado and public.academia_na_vitrine(academia_id));
create policy eventos_ler on public.eventos for select to authenticated
  using (public.e_da_academia(academia_id) or (publico = 'aberto' and not arquivado and public.academia_na_vitrine(academia_id)));
create policy eventos_criar on public.eventos for insert to authenticated
  with check (public.pode_escrever_evento(academia_id, modalidade_ids));
create policy eventos_mudar on public.eventos for update to authenticated
  using (public.pode_escrever_evento(academia_id, modalidade_ids)) with check (public.pode_escrever_evento(academia_id, modalidade_ids));

-- "Vou participar": o aluno marca o dele; a lista só a equipe vê (R18.3)
create policy participacoes_ler on public.participacoes_em_eventos for select to authenticated
  using (public.cuido_da_pessoa(pessoa_id) or public.e_equipe(academia_id));
create policy participacoes_marcar on public.participacoes_em_eventos for insert to authenticated
  with check (public.cuido_da_pessoa(pessoa_id) and academia_id = public.academia_da_pessoa(pessoa_id));
create policy participacoes_mudar on public.participacoes_em_eventos for update to authenticated
  using (public.cuido_da_pessoa(pessoa_id)) with check (public.cuido_da_pessoa(pessoa_id));

-- consentimento de Atletas: só a própria pessoa (ou o responsável) liga e desliga (R18.6)
create policy consentimentos_ler on public.consentimentos_de_atleta for select to authenticated
  using (public.cuido_da_pessoa(pessoa_id) or public.e_equipe(academia_id));
create policy consentimentos_dar on public.consentimentos_de_atleta for insert to authenticated
  with check (public.cuido_da_pessoa(pessoa_id) and academia_id = public.academia_da_pessoa(pessoa_id) and por_id = auth.uid());
create policy consentimentos_mudar on public.consentimentos_de_atleta for update to authenticated
  using (public.cuido_da_pessoa(pessoa_id)) with check (public.cuido_da_pessoa(pessoa_id) and por_id = auth.uid());

-- lutas: equipe e o próprio atleta; as de quem está em Atletas, também os
-- alunos e a vitrine (R18.6); cadastra o professor da modalidade ou o dono (R18.4)
create policy lutas_ler on public.lutas for select to authenticated
  using (public.cuido_da_pessoa(pessoa_id) or public.e_equipe(academia_id) or (public.e_da_academia(academia_id) and public.atleta_visivel(pessoa_id)));
create policy lutas_vitrine on public.lutas for select to anon
  using (public.academia_na_vitrine(academia_id) and public.atleta_visivel(pessoa_id));
create policy lutas_escrever on public.lutas for insert to authenticated
  with check (public.e_professor_da_modalidade(academia_id, modalidade_id) and academia_id = public.academia_da_pessoa(pessoa_id));
create policy lutas_mudar on public.lutas for update to authenticated
  using (public.e_professor_da_modalidade(academia_id, modalidade_id)) with check (public.e_professor_da_modalidade(academia_id, modalidade_id));

-- técnicas: V lê as abertas publicadas; aluno lê as publicadas; a equipe lê
-- tudo; publicam o professor da modalidade e o dono (R21.2)
create policy tecnicas_vitrine on public.tecnicas for select to anon
  using (aberta and estado = 'publicada' and public.academia_na_vitrine(academia_id));
create policy tecnicas_ler on public.tecnicas for select to authenticated
  using ((estado = 'publicada' and (public.e_da_academia(academia_id) or (aberta and public.academia_na_vitrine(academia_id)))) or public.e_equipe(academia_id));
create policy tecnicas_escrever on public.tecnicas for insert to authenticated
  with check (public.e_professor_da_modalidade(academia_id, modalidade_id));
create policy tecnicas_mudar on public.tecnicas for update to authenticated
  using (public.e_professor_da_modalidade(academia_id, modalidade_id)) with check (public.e_professor_da_modalidade(academia_id, modalidade_id));

-- Raça Responde: V e todos leem; escrevem o dono e a recepção (R22.3)
create policy perguntas_vitrine on public.perguntas_frequentes for select to anon using (ativa and public.academia_na_vitrine(academia_id));
create policy perguntas_ler on public.perguntas_frequentes for select to authenticated using (public.e_da_academia(academia_id) or (ativa and public.academia_na_vitrine(academia_id)));
create policy perguntas_balcao on public.perguntas_frequentes for all to authenticated
  using (public.e_balcao(academia_id)) with check (public.e_balcao(academia_id));

-- interessado: R e D leem e escrevem (o WhatsApp é dado de contato); o
-- professor só registra (R19.1) e vê o experimental pela chamada, sem o
-- WhatsApp (R19.5, função experimentais_da_aula)
create policy interessados_balcao on public.interessados for all to authenticated
  using (public.e_balcao(academia_id)) with check (public.e_balcao(academia_id));
create policy interessados_professor_registra on public.interessados for insert to authenticated
  with check (public.tem_vinculo(academia_id, array['instrutor']) and criado_por = auth.uid());

create policy experimentais_balcao on public.aulas_experimentais for all to authenticated
  using (public.e_balcao(academia_id)) with check (public.e_balcao(academia_id));
create policy experimentais_professor_marca on public.aulas_experimentais for update to authenticated
  using (turma_id is not null and public.e_professor_da_turma(turma_id))
  with check (turma_id is not null and public.e_professor_da_turma(turma_id) and estado in ('compareceu', 'faltou'));

-- indicação: R e D; o aluno vê as dele por indicacoes_do_aluno() (só o primeiro nome)
create policy indicacoes_balcao on public.indicacoes for all to authenticated
  using (public.e_balcao(academia_id)) with check (public.e_balcao(academia_id));
