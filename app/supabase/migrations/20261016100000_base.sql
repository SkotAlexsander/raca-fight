-- =============================================================================
-- 0100 — A base que os TRÊS apps dividem: academia, conta (usuarios), vínculo
-- e as funções de quem-é-quem que todas as regras de acesso usam.
-- Agente AU, 16/10/2026. Junta e substitui:
--   admin/supabase/migrations/20261015000100_base_compartilhada.sql (AM1)
--   app/supabase/migracoes/20261016000100_base_academias_vinculos.sql (AM2)
--
-- Convenções (valem para todas as migrações desta pasta):
-- - id: uuid em toda tabela (gerado no aparelho com crypto.randomUUID ou pelo
--   banco). Nome legível ("muay_thai", "muay-thai-noite-1") é coluna à parte
--   (`chave`), nunca a chave primária. Decisão em docs/decisoes.md, 16/10/2026.
-- - academia_id em toda tabela raiz; RLS ligada em TODAS as tabelas.
-- - dinheiro em centavos (bigint), percentual em pontos-base, mês 'AAAA-MM'.
-- - nada se apaga: arquivado / ativo / estado / anulada. As poucas exceções
--   estão escritas na própria política.
-- - Nada foi aplicado em projeto Supabase nenhum (não existe conta). Provado
--   num Postgres descartável: app/supabase/testes/.
-- =============================================================================

-- gen_random_uuid() é do Postgres desde a 13 (o Supabase está na 15+): sem extensão.

-- -----------------------------------------------------------------------------
-- academias
-- -----------------------------------------------------------------------------
create table public.academias (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  apelido text unique check (apelido ~ '^[a-z0-9-]{2,40}$'),
  fuso text not null default 'America/Sao_Paulo',
  -- os códigos de entrada (R8.1, F13.4): só o dono e a equipe leem, por função
  codigo_dos_alunos text unique check (codigo_dos_alunos ~ '^[A-HJ-NP-Z2-9]{6}$'),
  codigo_da_equipe text unique check (codigo_da_equipe ~ '^[A-HJ-NP-Z2-9]{6}$'),
  entrar_sem_confirmacao boolean not null default false,
  -- o contato público (vitrine, aba Academia, aula experimental)
  nome_curto text check (char_length(nome_curto) <= 40),
  frase text check (char_length(frase) <= 120),
  endereco text check (char_length(endereco) <= 200),
  cidade text check (char_length(cidade) <= 80),
  whatsapp text check (whatsapp ~ '^\d{10,15}$'),          -- só dígitos, com DDI; a tela formata
  instagram text check (char_length(instagram) <= 60),
  -- luta: os [decidir] como CONFIGURAÇÃO, sem padrão (L7: janela do check-in; L22: link em evento)
  janela_minutos_antes int not null check (janela_minutos_antes between 0 and 180),
  janela_minutos_depois int not null check (janela_minutos_depois between 0 and 180),
  aceita_link_em_evento boolean not null default false,
  -- aparece na vitrine sem conta (R14.11)
  na_vitrine boolean not null default false,
  marca jsonb,                                               -- [decidir] white-label
  criada_em timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- usuarios: a conta (seção 2 do modelo). Nada de saúde aqui. Nasce sozinha
-- quando o Supabase Auth cria a conta (gatilho em auth.users).
-- -----------------------------------------------------------------------------
create table public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  email text check (char_length(email) <= 200),
  telefone text check (char_length(telefone) <= 30),
  foto_url text check (foto_url is null or foto_url like 'https://%'),
  criado_em timestamptz not null default now()
);

create function public.criar_usuario_da_conta()
  returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  insert into public.usuarios (id, nome, email)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''), split_part(coalesce(new.email, 'conta'), '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end
$fn$;
create trigger criar_usuario_da_conta after insert on auth.users
  for each row execute function public.criar_usuario_da_conta();

-- -----------------------------------------------------------------------------
-- vinculos: o papel de uma conta numa academia. `estado` é a verdade
-- (pendente, ativo, encerrado; R8.1, R12.11); `ativo` é derivado dele (o Admin
-- lê `ativo`), por isso é coluna gerada e nunca diverge.
-- -----------------------------------------------------------------------------
create table public.vinculos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id),
  academia_id uuid not null references public.academias (id),
  papel text not null check (papel in ('aluno', 'recepcao', 'instrutor', 'personal', 'dono')),
  estado text not null default 'pendente' check (estado in ('pendente', 'ativo', 'encerrado')),
  ativo boolean generated always as (estado = 'ativo') stored,
  desde date not null default current_date,
  ate date,
  -- R12.11: sem grant de select (só a contagem, pela função do dono)
  motivo_de_saida text check (motivo_de_saida in ('cancelou_matricula', 'mudou_de_academia', 'outro')),
  encerrado_por uuid references auth.users (id),
  criado_em timestamptz not null default now(),
  unique (usuario_id, academia_id, papel),
  check (ate is null or ate >= desde)
);
create index vinculos_usuario on public.vinculos (usuario_id) where estado = 'ativo';
create index vinculos_pendentes on public.vinculos (academia_id) where estado = 'pendente';

-- -----------------------------------------------------------------------------
-- Quem é quem. Todas `security definer` com search_path fixo: a RLS chama a
-- cada pedido, então funcionário removido perde o acesso na hora (R6.12).
-- -----------------------------------------------------------------------------
create function public.tem_vinculo(academia uuid, papeis text[])
  returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.vinculos v
    where v.usuario_id = auth.uid() and v.academia_id = academia and v.estado = 'ativo' and v.papel = any (papeis)
  )
$fn$;

create function public.e_dono(academia uuid)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select public.tem_vinculo(academia, array['dono'])
$fn$;

-- a equipe: quem trabalha na academia (o professor é o papel `instrutor`)
create function public.e_equipe(academia uuid)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select public.tem_vinculo(academia, array['recepcao', 'instrutor', 'personal', 'dono'])
$fn$;

-- recepção ou dono: o balcão (vínculos, experimental, contato do responsável)
create function public.e_balcao(academia uuid)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select public.tem_vinculo(academia, array['recepcao', 'dono'])
$fn$;

-- qualquer vínculo ativo (aluno ou equipe)
create function public.e_da_academia(academia uuid)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select public.tem_vinculo(academia, array['aluno', 'recepcao', 'instrutor', 'personal', 'dono'])
$fn$;

-- [decidir] A1: o papel "administrativo". Enquanto o Alex não decidir, 'cobranca'
-- também é só do dono. Se entrar, troca-se ESTA função e nada mais.
create function public.pode_financeiro(academia uuid, nivel text)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select case nivel
    when 'tudo' then public.e_dono(academia)
    when 'cobranca' then public.e_dono(academia)   -- depois: or tem_vinculo(academia, array['administrativo'])
    else false end
$fn$;

create function public.academia_na_vitrine(academia uuid)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select coalesce((select a.na_vitrine from public.academias a where a.id = academia), false)
$fn$;

create function public.competencia_valida(c text)
  returns boolean language sql immutable as $fn$ select c ~ '^\d{4}-(0[1-9]|1[0-2])$' $fn$;

-- -----------------------------------------------------------------------------
-- RLS da base
-- -----------------------------------------------------------------------------
alter table public.academias enable row level security;
alter table public.usuarios enable row level security;
alter table public.vinculos enable row level security;

-- academias: lê quem tem vínculo; a vitrine lê sem conta; só o dono muda.
-- Os códigos de entrada ficam fora do grant (só pela função codigos_da_academia).
create policy academias_ler on public.academias for select to authenticated
  using (public.e_da_academia(id) or na_vitrine);
create policy academias_vitrine on public.academias for select to anon
  using (na_vitrine);
create policy academias_dono_muda on public.academias for update to authenticated
  using (public.e_dono(id)) with check (public.e_dono(id));
revoke all on public.academias from anon, authenticated;
grant select (id, nome, apelido, fuso, entrar_sem_confirmacao, nome_curto, frase, endereco, cidade, whatsapp, instagram,
  janela_minutos_antes, janela_minutos_depois, aceita_link_em_evento, na_vitrine, marca, criada_em)
  on public.academias to anon, authenticated;
grant update (nome, apelido, fuso, codigo_dos_alunos, codigo_da_equipe, entrar_sem_confirmacao, nome_curto, frase, endereco,
  cidade, whatsapp, instagram, janela_minutos_antes, janela_minutos_depois, aceita_link_em_evento, na_vitrine, marca)
  on public.academias to authenticated;

-- usuarios: a própria conta lê e muda; a academia lê nome e foto de quem tem
-- vínculo nela (o e-mail e o telefone só pela função contato_do_usuario).
create function public.dividimos_academia(outro uuid)
  returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.vinculos eu join public.vinculos ele on ele.academia_id = eu.academia_id
    where eu.usuario_id = auth.uid() and eu.estado = 'ativo' and eu.papel in ('recepcao', 'instrutor', 'personal', 'dono')
      and ele.usuario_id = outro and ele.estado in ('ativo', 'pendente')
  )
$fn$;
create policy usuarios_o_proprio on public.usuarios for select to authenticated using (id = auth.uid());
create policy usuarios_da_academia on public.usuarios for select to authenticated using (public.dividimos_academia(id));
create policy usuarios_muda_o_proprio on public.usuarios for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke all on public.usuarios from anon, authenticated;
grant select (id, nome, foto_url, criado_em) on public.usuarios to authenticated;
grant update (nome, telefone, foto_url) on public.usuarios to authenticated;

-- vinculos: lê os seus; a equipe lê os da academia (R12.9). O aluno pede
-- vínculo (nasce pendente, nunca dono). Confirmar, recusar e encerrar só por
-- função (mudam várias colunas de uma vez e respeitam o papel de quem pede).
create policy vinculos_ler_os_meus on public.vinculos for select to authenticated using (usuario_id = auth.uid());
create policy vinculos_ler_da_academia on public.vinculos for select to authenticated using (public.e_equipe(academia_id));
create policy vinculos_pedir on public.vinculos for insert to authenticated
  with check (usuario_id = auth.uid() and estado = 'pendente' and papel <> 'dono');
revoke all on public.vinculos from anon, authenticated;
grant select (id, usuario_id, academia_id, papel, estado, ativo, desde, ate, encerrado_por, criado_em) on public.vinculos to authenticated;
grant insert (id, usuario_id, academia_id, papel, estado) on public.vinculos to authenticated;
