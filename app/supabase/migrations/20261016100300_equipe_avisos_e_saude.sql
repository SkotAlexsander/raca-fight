-- =============================================================================
-- 0103 — O que os apps do aluno e da equipe usam além do tatame: perfil
-- profissional (seção 23), avisos (seções 19 a 22), cadastro opcional e
-- medições (seções 4 e 5, DADO DE SAÚDE). Agente AU, 16/10/2026.
--
-- Fica DE FORA, de propósito: treino de musculação (saiu no P12), Plus, dieta e
-- conversa (desligados por RECURSOS, L12 e L13). Quando ligarem, entram numa
-- migração própria, com a forma do 01-MODELO-DE-DADOS.md, seções 13 a 18.
-- =============================================================================

-- 23. perfil profissional --------------------------------------------------------
create table public.perfis_profissionais (
  id uuid primary key default gen_random_uuid(),
  vinculo_id uuid not null unique references public.vinculos (id),
  usuario_id uuid not null references auth.users (id),
  academia_id uuid not null references public.academias (id),
  nome_exibicao text not null check (char_length(btrim(nome_exibicao)) between 1 and 60),
  foto_url text check (foto_url is null or foto_url like 'https://%'),
  formacao text not null default '' check (char_length(formacao) <= 60),
  cref text check (cref is null or cref ~ '^\d{1,6}-[GP]/[A-Z]{2}$'),
  cref_conferido boolean not null default false,
  especialidades text[] not null default '{}',
  especialidade_outra text check (char_length(especialidade_outra) <= 30),
  modalidade_ids uuid[] not null default '{}',
  graduacao_informada jsonb not null default '[]' check (jsonb_typeof(graduacao_informada) = 'array'),
  sobre text not null default '' check (char_length(sobre) <= 280),
  turnos jsonb not null default '[]' check (jsonb_typeof(turnos) = 'array'),
  visivel_aos_alunos boolean not null default false,
  visivel_desde timestamptz,
  ocultado_pelo_dono boolean not null default false,
  atualizado_em timestamptz not null default now()
);

-- a COLUNA fica com o gatilho (as duas políticas de update se somam): ver o
-- modelo, seção 23, e o achado S3 da revisão T
create function public.proteger_perfil_profissional()
  returns trigger language plpgsql security definer set search_path = public as $fn$
declare v public.vinculos;
begin
  select * into v from public.vinculos where id = new.vinculo_id;
  if v.id is null or v.usuario_id <> new.usuario_id or v.academia_id <> new.academia_id then
    raise exception 'perfil_de_outro_vinculo' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' then
    if new.vinculo_id <> old.vinculo_id or new.usuario_id <> old.usuario_id or new.academia_id <> old.academia_id then
      raise exception 'perfil_imutavel' using errcode = '42501';
    end if;
    if auth.role() is distinct from 'service_role' then
      if new.cref_conferido is distinct from old.cref_conferido and not (new.cref is distinct from old.cref and not new.cref_conferido) then
        raise exception 'cref_so_servidor' using errcode = '42501';
      end if;
      if new.ocultado_pelo_dono is distinct from old.ocultado_pelo_dono
         and not (public.e_dono(new.academia_id) and new.usuario_id <> auth.uid()) then
        raise exception 'so_o_dono_oculta' using errcode = '42501';
      end if;
      if new.usuario_id <> auth.uid()
         and (to_jsonb(new) - array['ocultado_pelo_dono', 'atualizado_em']) is distinct from (to_jsonb(old) - array['ocultado_pelo_dono', 'atualizado_em']) then
        raise exception 'perfil_de_outro' using errcode = '42501';
      end if;
      if old.ocultado_pelo_dono and new.visivel_aos_alunos is distinct from old.visivel_aos_alunos then
        raise exception 'perfil_ocultado' using errcode = 'P0001';
      end if;
    end if;
    if new.cref is distinct from old.cref then new.cref_conferido := false; end if;
    if new.visivel_aos_alunos and not old.visivel_aos_alunos then new.visivel_desde := now(); end if;
  end if;
  return new;
end
$fn$;
create trigger perfis_profissionais_protecao before insert or update on public.perfis_profissionais
  for each row execute function public.proteger_perfil_profissional();

-- 21. aviso da academia (e da turma, R22.1) --------------------------------------
create table public.avisos_da_academia (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  autor_id uuid not null default auth.uid() references auth.users (id),
  turma_id uuid references public.turmas (id),
  texto text not null check (char_length(btrim(texto)) between 1 and 160 and texto !~* '(https?://|www\.)'),
  publicado_em timestamptz not null default now(),
  validade_dias int not null check (validade_dias in (1, 3, 7, 14)),
  com_notificacao boolean not null default false,
  retirado_em timestamptz,
  retirado_por uuid references auth.users (id),
  check ((retirado_em is null) = (retirado_por is null))
);
create function public.so_retirar_aviso()
  returns trigger language plpgsql as $fn$
begin
  if (to_jsonb(new) - array['retirado_em', 'retirado_por']) is distinct from (to_jsonb(old) - array['retirado_em', 'retirado_por'])
     or old.retirado_em is not null or new.retirado_por is distinct from auth.uid() then
    raise exception 'aviso_so_retira' using errcode = 'P0001';
  end if;
  return new;
end
$fn$;
create trigger avisos_so_retirar before update on public.avisos_da_academia
  for each row execute function public.so_retirar_aviso();

create table public.avisos_dispensados (
  aviso_id uuid not null references public.avisos_da_academia (id),
  usuario_id uuid not null default auth.uid() references auth.users (id),
  dispensado_em timestamptz not null default now(),
  primary key (aviso_id, usuario_id)
);

-- 20. preferências de aviso -------------------------------------------------------
create table public.preferencias_de_aviso (
  usuario_id uuid primary key references auth.users (id),
  preferencias jsonb not null check (jsonb_typeof(preferencias) = 'object'),   -- a forma de PreferenciasDeAviso
  atualizado_em timestamptz not null default now()
);
create table public.preferencias_da_equipe (
  vinculo_id uuid primary key references public.vinculos (id),
  preferencias jsonb not null check (jsonb_typeof(preferencias) = 'object'),   -- a forma de PreferenciasDaEquipe
  atualizado_em timestamptz not null default now()
);

-- 19. dispositivo (push do Expo e Web Push do Admin) ------------------------------
create table public.dispositivos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id),
  token text not null check (char_length(token) between 1 and 4000),
  plataforma text not null check (plataforma in ('ios', 'android', 'web')),
  fuso text check (fuso ~ '^[+-]\d{2}:\d{2}$'),
  atualizado_em timestamptz not null default now(),
  unique (usuario_id, token)
);

-- 22. aviso enviado: registro do servidor, SEM CONTEÚDO --------------------------
-- rls: só servidor (nenhuma política: só a Edge Function, com a chave de serviço)
create table public.avisos_enviados (
  id uuid primary key default gen_random_uuid(),
  destinatario_id uuid not null references auth.users (id),
  academia_id uuid references public.academias (id),
  tipo text not null,
  chave_de_agrupamento text,
  segurado_ate timestamptz,
  enviado_em timestamptz,
  resultado text not null check (resultado in ('enviado', 'segurado', 'fora_do_limite', 'chave_desligada', 'erro'))
);

-- 4. cadastro opcional do aluno (DADO DE SAÚDE, R6.1) ------------------------------
create table public.perfis_de_alunos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references auth.users (id),
  academia_id uuid references public.academias (id),               -- nulo = aluno sem academia (R8.4)
  data_nascimento date,
  sexo text check (sexo in ('feminino', 'masculino', 'outro', 'nao_informado')),
  objetivo text,
  restricoes text check (char_length(restricoes) <= 500),
  frequencia_semanal_pretendida int check (frequencia_semanal_pretendida between 1 and 7),
  consentimento_em timestamptz,
  autoriza_academia boolean not null default false,
  autorizacao_em timestamptz,
  consentimento_do_responsavel_em timestamptz,
  atualizado_em timestamptz not null default now(),
  unique nulls not distinct (usuario_id, academia_id)
);

create function public.aluno_autorizou(aluno uuid, academia uuid)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select coalesce((select p.autoriza_academia from public.perfis_de_alunos p where p.usuario_id = aluno and p.academia_id = academia), false)
$fn$;

-- 5. medição corporal (DADO DE SAÚDE) ----------------------------------------------
create table public.medicoes_corporais (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references auth.users (id),
  academia_id uuid references public.academias (id),
  data date not null,
  peso_gramas int check (peso_gramas between 1000 and 400000),
  altura_milimetros int check (altura_milimetros between 300 and 2600),
  gordura_corporal_decimos int check (gordura_corporal_decimos between 10 and 700),
  circunferencias jsonb check (circunferencias is null or jsonb_typeof(circunferencias) = 'object'),
  registrado_por uuid not null default auth.uid(),
  registrado_em timestamptz not null default now()
);

-- =============================================================================
-- REGRAS DE ACESSO
-- =============================================================================
do $$
declare t text;
begin
  foreach t in array array['perfis_profissionais', 'avisos_da_academia', 'avisos_dispensados', 'preferencias_de_aviso',
    'preferencias_da_equipe', 'dispositivos', 'avisos_enviados', 'perfis_de_alunos', 'medicoes_corporais'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- perfil profissional (forma do modelo, seção 23): o próprio sempre; o dono
-- todos; aluno e equipe só o visível de vínculo ativo; a vitrine só o visível
create function public.perfil_visivel(vinculo uuid, visivel boolean, ocultado boolean)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select visivel and not ocultado and exists (select 1 from public.vinculos v where v.id = vinculo and v.estado = 'ativo')
$fn$;
create policy perfil_ler on public.perfis_profissionais for select to authenticated using (
  usuario_id = auth.uid() or public.e_dono(academia_id)
  or (public.e_da_academia(academia_id) and public.perfil_visivel(vinculo_id, visivel_aos_alunos, ocultado_pelo_dono))
  or (public.academia_na_vitrine(academia_id) and public.perfil_visivel(vinculo_id, visivel_aos_alunos, ocultado_pelo_dono))
);
create policy perfil_vitrine on public.perfis_profissionais for select to anon
  using (public.academia_na_vitrine(academia_id) and public.perfil_visivel(vinculo_id, visivel_aos_alunos, ocultado_pelo_dono));
create policy perfil_criar on public.perfis_profissionais for insert to authenticated with check (
  usuario_id = auth.uid()
  and exists (select 1 from public.vinculos v
              where v.id = perfis_profissionais.vinculo_id and v.usuario_id = auth.uid()
                and v.academia_id = perfis_profissionais.academia_id and v.estado = 'ativo'
                and v.papel in ('recepcao', 'instrutor', 'personal', 'dono'))
  and not visivel_aos_alunos and not ocultado_pelo_dono and not cref_conferido
);
create policy perfil_editar_proprio on public.perfis_profissionais for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy perfil_esconder_dono on public.perfis_profissionais for update to authenticated
  using (public.e_dono(academia_id)) with check (public.e_dono(academia_id));

-- aviso: quem tem vínculo lê os da academia; os de turma, só a equipe e quem
-- está na turma. Escrevem o dono e a recepção (todos) e o professor (os da
-- turma dele, R22.1; [decidir] L31 para o aviso geral). Retirar: o autor ou o dono.
create function public.vejo_a_turma(turma uuid)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from public.alunos_das_turmas a where a.turma_id = turma and a.ate is null and public.cuido_da_pessoa(a.pessoa_id))
$fn$;
create policy avisos_ler on public.avisos_da_academia for select to authenticated using (
  public.e_equipe(academia_id) or (public.e_da_academia(academia_id) and (turma_id is null or public.vejo_a_turma(turma_id)))
);
create policy avisos_publicar on public.avisos_da_academia for insert to authenticated with check (
  autor_id = auth.uid() and retirado_em is null
  and (public.e_balcao(academia_id) or (turma_id is not null and public.e_professor_da_turma(turma_id)))
);
create policy avisos_retirar on public.avisos_da_academia for update to authenticated
  using (autor_id = auth.uid() or public.e_dono(academia_id)) with check (autor_id = auth.uid() or public.e_dono(academia_id));

create policy avisos_dispensados_o_meu on public.avisos_dispensados for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy preferencias_o_proprio on public.preferencias_de_aviso for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy preferencias_equipe_o_proprio on public.preferencias_da_equipe for all to authenticated
  using (exists (select 1 from public.vinculos v where v.id = vinculo_id and v.usuario_id = auth.uid()))
  with check (exists (select 1 from public.vinculos v where v.id = vinculo_id and v.usuario_id = auth.uid()));

-- dispositivo: só o seu; sair da conta APAGA a linha (H07: a exceção do "nada se apaga")
create policy dispositivos_o_meu on public.dispositivos for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- cadastro opcional: o próprio; a equipe lê só com a autorização (R6.4)
create policy perfis_de_alunos_o_proprio on public.perfis_de_alunos for all to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy perfis_de_alunos_equipe on public.perfis_de_alunos for select to authenticated
  using (academia_id is not null and autoriza_academia and public.e_equipe(academia_id));

-- medição: o próprio; instrutor e dono leem e anotam com a autorização (seção 5);
-- apagar: só quem registrou e no mesmo dia (erro de digitação, não histórico)
create policy medicoes_o_proprio on public.medicoes_corporais for select to authenticated using (aluno_id = auth.uid());
create policy medicoes_equipe_le on public.medicoes_corporais for select to authenticated
  using (academia_id is not null and public.tem_vinculo(academia_id, array['instrutor', 'dono']) and public.aluno_autorizou(aluno_id, academia_id));
create policy medicoes_anotar on public.medicoes_corporais for insert to authenticated with check (
  registrado_por = auth.uid() and (
    aluno_id = auth.uid()
    or (academia_id is not null and public.tem_vinculo(academia_id, array['instrutor', 'dono']) and public.aluno_autorizou(aluno_id, academia_id))
  )
);
create policy medicoes_apagar_no_dia on public.medicoes_corporais for delete to authenticated
  using (registrado_por = auth.uid() and registrado_em::date = current_date);
