-- =============================================================================
-- 0102 — O dinheiro (modelo de dados, Parte 2, seções 28 e 30 a 40): SÓ O DONO.
-- Agente AU, 16/10/2026, a partir de
--   admin/supabase/migrations/20261015000200_admin_tabelas.sql (AM1)
--   admin/supabase/migrations/20261015000400_admin_regras_de_acesso.sql (AM1)
-- As tabelas, colunas, checks e índices são os do AM1 (o Admin já fala com
-- eles); pessoas, modalidades, eventos e o funil foram para o 0101.
--
-- Convenções: dinheiro em CENTAVOS (bigint, check >= 0); percentual em
-- PONTOS-BASE (integer); competencia 'AAAA-MM'. Listas e objetos pequenos
-- (descontos, repartição, remuneração) em JSONB, com as chaves em camelCase,
-- iguais aos tipos de app/dominio/financeiro/tipos.ts.
--
-- Acesso: D = pode_financeiro(academia, 'tudo'), C = 'cobranca' (hoje igual a
-- D; [decidir] A1). Professor, recepção e aluno NÃO leem nenhuma tabela daqui.
-- O check-in pergunta pela função pode_fazer_checkin (sim ou não, sem valor).
-- =============================================================================

-- 28. funcionário (a remuneração é o dado mais restrito: só o dono) -------------
create table public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  pessoa_id uuid not null references public.pessoas (id),
  funcao text not null check (funcao in ('professor', 'recepcao', 'limpeza', 'administrativo', 'outro')),
  modalidade_ids uuid[] not null default '{}',
  remuneracao jsonb not null check (
    remuneracao ? 'tipo'
    and remuneracao->>'tipo' in ('fixo', 'comissao', 'fixo_mais_comissao', 'por_aula', 'sem_remuneracao')
    and coalesce((remuneracao->>'fixoCentavos')::bigint, 0) >= 0
    and coalesce((remuneracao->>'comissaoPontosBase')::int, 0) between 0 and 10000
    and coalesce((remuneracao->>'valorPorAulaCentavos')::bigint, 0) >= 0
  ),
  desde date not null,
  ate date,
  check (ate is null or ate >= desde)
);
create trigger funcionarios_modalidades before insert or update on public.funcionarios
  for each row execute function public.conferir_modalidade_ids();

-- 30. plano ---------------------------------------------------------------------
create table public.planos (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  nome text not null check (char_length(nome) between 1 and 60),
  modalidade_ids uuid[] not null default '{}',
  aulas_por_semana int check (aulas_por_semana between 1 and 7),
  periodicidade text not null check (periodicidade in ('mensal', 'trimestral', 'semestral', 'anual', 'gratuito')),
  valor_centavos bigint not null check (valor_centavos >= 0),
  taxa_de_matricula_centavos bigint check (taxa_de_matricula_centavos >= 0),
  pesos jsonb,
  ativo boolean not null default true
);
create trigger planos_modalidades before insert or update on public.planos
  for each row execute function public.conferir_modalidade_ids();

-- 31. matrícula -----------------------------------------------------------------
create table public.matriculas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  pessoa_id uuid not null references public.pessoas (id),
  pagador_pessoa_id uuid not null references public.pessoas (id),
  plano_id uuid not null references public.planos (id),
  inicio date not null,
  fim date,
  estado text not null check (estado in ('ativa', 'trancada', 'encerrada')),
  dia_de_vencimento int not null check (dia_de_vencimento between 1 and 31),
  descontos jsonb not null default '[]' check (jsonb_typeof(descontos) = 'array'),
  trancada_de date,
  trancada_ate date,
  isentar_taxa_de_matricula boolean not null default false,
  check (fim is null or fim >= inicio),
  check (trancada_ate is null or trancada_de is null or trancada_ate >= trancada_de)
);
create index matriculas_pessoa on public.matriculas (pessoa_id) where estado <> 'encerrada';

-- 32. cobrança ------------------------------------------------------------------
create table public.cobrancas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  pessoa_id uuid not null references public.pessoas (id),
  aluno_pessoa_id uuid references public.pessoas (id),
  matricula_id uuid references public.matriculas (id),
  evento_id uuid references public.eventos (id),
  tipo text not null check (tipo in ('mensalidade', 'matricula', 'graduacao', 'evento', 'produto', 'avulsa')),
  competencia text not null check (public.competencia_valida(competencia)),
  vencimento date not null,
  descricao text not null check (char_length(descricao) between 1 and 200),
  valor_bruto_centavos bigint not null check (valor_bruto_centavos >= 0),
  desconto_centavos bigint not null check (desconto_centavos >= 0),
  valor_centavos bigint not null check (valor_centavos >= 0),
  estado text not null check (estado in ('aberta', 'paga', 'cancelada')),
  paga_em date,
  valor_pago_centavos bigint check (valor_pago_centavos >= 0),
  forma_de_pagamento text check (forma_de_pagamento in ('pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia', 'outro')),
  lancamento_id uuid,                                   -- chave estrangeira depois de lancamentos
  reparticao jsonb not null default '[]' check (jsonb_typeof(reparticao) = 'array'),
  criada_em timestamptz not null default now(),
  check (valor_centavos = valor_bruto_centavos - desconto_centavos),
  -- os campos do pagamento andam juntos
  check ((estado = 'paga') = (paga_em is not null and valor_pago_centavos is not null and forma_de_pagamento is not null))
);
-- a geração não duplica nem com duas abas abertas (RA3.3)
create unique index cobrancas_uma_por_mes
  on public.cobrancas (matricula_id, competencia, tipo) where tipo in ('mensalidade', 'matricula');
create index cobrancas_mes on public.cobrancas (academia_id, competencia);

-- 34. categoria -----------------------------------------------------------------
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  nome text not null check (char_length(nome) between 1 and 60),
  tipo text not null check (tipo in ('entrada', 'saida')),
  ordem int not null default 0,
  arquivada boolean not null default false
);
create unique index categorias_nome on public.categorias (academia_id, tipo, lower(nome));

-- 35. despesa fixa --------------------------------------------------------------
create table public.despesas_fixas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  descricao text not null check (char_length(descricao) between 1 and 200),
  categoria_id uuid references public.categorias (id),
  valor_centavos bigint not null check (valor_centavos >= 0),
  dia_de_vencimento int not null check (dia_de_vencimento between 1 and 31),
  forma_de_pagamento text check (forma_de_pagamento in ('pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia', 'outro')),
  pessoa_id uuid references public.pessoas (id),
  variavel boolean not null default false,
  desde text not null check (public.competencia_valida(desde)),
  ate text check (ate is null or public.competencia_valida(ate)),
  ativa boolean not null default true
);

-- 37. importação (o arquivo NÃO é guardado: só o que virou linha) ----------------
create table public.importacoes (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  arquivo_nome text not null check (char_length(arquivo_nome) between 1 and 200),
  formato text not null check (formato in ('csv', 'xlsx', 'colado')),
  mapeamento jsonb not null default '[]',
  linhas_lidas int not null check (linhas_lidas >= 0),
  linhas_gravadas int not null check (linhas_gravadas >= 0),
  linhas_repetidas int not null check (linhas_repetidas >= 0),
  linhas_com_erro int not null check (linhas_com_erro >= 0),
  estado text not null check (estado in ('conferindo', 'gravada', 'desfeita')),
  por_id uuid not null default auth.uid(),
  em timestamptz not null default now()
);

-- 33. lançamento (a linha da planilha) -------------------------------------------
create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  data date not null,
  descricao text not null check (char_length(btrim(descricao)) between 1 and 200),
  categoria_id uuid references public.categorias (id),
  tipo text not null check (tipo in ('entrada', 'saida')),
  valor_centavos bigint not null check (valor_centavos > 0),
  forma_de_pagamento text check (forma_de_pagamento in ('pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia', 'outro')),
  pessoa_id uuid references public.pessoas (id),
  situacao text not null check (situacao in ('pago', 'pendente')),
  reparticao jsonb check (reparticao is null or jsonb_typeof(reparticao) = 'array'),
  origem text not null check (origem in ('manual', 'mensalidade', 'despesa_fixa', 'importacao', 'remuneracao')),
  cobranca_id uuid references public.cobrancas (id),
  despesa_fixa_id uuid references public.despesas_fixas (id),
  importacao_id uuid references public.importacoes (id),
  evento_id uuid references public.eventos (id),
  estimado boolean not null default false,
  observacao text check (char_length(observacao) <= 500),
  arquivado boolean not null default false,
  criado_por uuid not null default auth.uid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index lancamentos_mes on public.lancamentos (academia_id, data) where not arquivado;
-- despesa fixa: uma linha por mês (a geração é idempotente, RA4.8). Índice por
-- expressão IMUTÁVEL: o 1º dia do mês (o to_char do AM1 não é imutável e o
-- Postgres recusa o índice).
create unique index lancamentos_despesa_do_mes
  on public.lancamentos (despesa_fixa_id, (date_trunc('month', data::timestamp))) where despesa_fixa_id is not null and not arquivado;
alter table public.cobrancas add constraint cobrancas_lancamento_fk foreign key (lancamento_id) references public.lancamentos (id);

-- 34. regras de cobrança (uma por academia): as escolhas [decidir] como CONFIGURAÇÃO
create table public.regras_de_cobranca (
  academia_id uuid primary key references public.academias (id),
  primeiro_mes text not null check (primeiro_mes in ('cheio', 'proporcional', 'a_partir_do_proximo')),       -- A7
  atraso jsonb check (atraso is null or (                                                                     -- A3 (nulo = não cobra)
    (atraso->>'multaPontosBase')::int between 0 and 200
    and (atraso->>'jurosAoMesPontosBase')::int between 0 and 100
    and (atraso->>'diasDeTolerancia')::int between 0 and 30
  )),
  gerar_sozinho_no_dia1 boolean not null default false,                                                       -- A6
  dias_para_retorno_da_experimental int not null check (dias_para_retorno_da_experimental between 1 and 30), -- A15
  desconto_familia jsonb,                                                                                     -- A8
  desconto_indicacao jsonb,                                                                                   -- A9
  dias_para_apagar_interessado int not null check (dias_para_apagar_interessado between 30 and 3650),        -- L23
  whatsapp_da_academia text not null check (whatsapp_da_academia ~ '^\d{10,15}$'),
  provisorio boolean not null default true,
  atualizado_em timestamptz not null default now()
);

-- 36. fechamento do mês (um ATIVO por competência; reabrir não apaga) ------------
create table public.fechamentos (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  competencia text not null check (public.competencia_valida(competencia)),
  totais jsonb not null,
  por_categoria jsonb not null,
  a_receber_em_aberto bigint not null check (a_receber_em_aberto >= 0),
  fechado_em timestamptz not null default now(),
  fechado_por uuid not null default auth.uid(),
  reaberto_em timestamptz,
  reaberto_por uuid,
  motivo_da_reabertura text check (motivo_da_reabertura is null or char_length(btrim(motivo_da_reabertura)) between 1 and 500),
  check ((reaberto_em is null) = (motivo_da_reabertura is null))
);
create unique index fechamentos_um_ativo on public.fechamentos (academia_id, competencia) where reaberto_em is null;

-- 39. anotar e lembrar ----------------------------------------------------------
create table public.notas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  texto text not null check (char_length(btrim(texto)) between 1 and 2000),
  pessoa_id uuid references public.pessoas (id),
  lancamento_id uuid references public.lancamentos (id),
  data date,
  valor_centavos bigint,
  fixada boolean not null default false,
  arquivada boolean not null default false,
  criada_por uuid not null default auth.uid(),
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now()
);
create table public.lembretes (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  titulo text not null check (char_length(btrim(titulo)) between 1 and 120),
  detalhe text check (char_length(detalhe) <= 500),
  data date not null,
  hora text check (hora ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  repeticao text not null check (repeticao in ('nao_repete', 'semanal', 'mensal', 'anual')),
  dia_do_mes int check (dia_do_mes between 1 and 31),
  avisar_dias_antes int not null default 0 check (avisar_dias_antes between 0 and 60),
  pessoa_id uuid references public.pessoas (id),
  valor_centavos bigint,
  despesa_fixa_id uuid references public.despesas_fixas (id),
  interessado_id uuid references public.interessados (id),
  concluido_em timestamptz,
  ultima_conclusao_em timestamptz,
  criado_por uuid not null default auth.uid(),
  criado_em timestamptz not null default now()
);
create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  titulo text not null check (char_length(btrim(titulo)) between 1 and 120),
  detalhe text check (char_length(detalhe) <= 500),
  prazo date,
  responsavel_pessoa_id uuid references public.pessoas (id),
  pessoa_id uuid references public.pessoas (id),
  feita_em timestamptz,
  criada_por uuid not null default auth.uid(),
  criada_em timestamptz not null default now()
);

-- 40. filtro salvo --------------------------------------------------------------
create table public.filtros_salvos (
  id uuid primary key default gen_random_uuid(),
  academia_id uuid not null references public.academias (id),
  nome text not null check (char_length(nome) between 1 and 60),
  alvo text not null check (alvo in ('alunos', 'funcionarios', 'lancamentos', 'cobrancas')),
  filtro jsonb not null,
  criado_por uuid not null default auth.uid(),
  criado_em timestamptz not null default now()
);

-- =============================================================================
-- REGRAS DE ACESSO (RLS): a regra mora no BANCO (RA1.4); a tela só esconde.
-- =============================================================================
do $$
declare t text;
begin
  -- D: tudo do dono, lê e escreve direto (o histórico anota pelo gatilho)
  foreach t in array array[
    'funcionarios', 'planos', 'matriculas', 'categorias', 'despesas_fixas', 'notas', 'lembretes', 'tarefas',
    'filtros_salvos', 'regras_de_cobranca'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %1$s_dono on public.%1$I for all to authenticated using (public.pode_financeiro(academia_id, %2$L)) with check (public.pode_financeiro(academia_id, %2$L))', t, 'tudo');
  end loop;
  -- só leitura pela tabela; a escrita é por função (transação no servidor)
  foreach t in array array['lancamentos', 'fechamentos', 'importacoes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %1$s_ler on public.%1$I for select to authenticated using (public.pode_financeiro(academia_id, %2$L))', t, 'tudo');
  end loop;
end $$;

-- lançamento: o dono também escreve linha a linha (a grade); a trava do mês fechado vale igual
create policy lancamentos_dono_escreve on public.lancamentos for insert to authenticated with check (public.pode_financeiro(academia_id, 'tudo'));
create policy lancamentos_dono_muda on public.lancamentos for update to authenticated
  using (public.pode_financeiro(academia_id, 'tudo')) with check (public.pode_financeiro(academia_id, 'tudo'));

-- cobrança: lê quem tem o nível cobrança; escreve SÓ pelas funções (marcar como paga, gerar…)
alter table public.cobrancas enable row level security;
create policy cobrancas_financeiro on public.cobrancas for select to authenticated using (public.pode_financeiro(academia_id, 'cobranca'));
-- A2 ([decidir]): o aluno lê as dele e as dos dependentes. Desligado até o Alex decidir.
