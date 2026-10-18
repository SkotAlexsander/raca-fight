# AU — Integração dos três apps num banco só (P12, onda 4, 16/10/2026)

> Agente AU. Escrevi só em `app/supabase/`, `admin/supabase/`, `03-arquitetura/` (o `06-INTEGRACAO.md` novo e duas linhas que apontam para ele no `01` e no `05`) e `02-design/icones/CREDITOS.md`. Em `docs/` escrevi este relatório e uma entrada no fim do `decisoes.md`. Não mexi no código de telas de `app/` nem em `admin/src/`. O que precisa mudar lá está na seção 4, como pedido.

## 1. Em uma frase

Os três apps agora têm **um esquema só**: sete migrações numa ordem, em `app/supabase/migrations/`, mais um `seed.sql` com a grade real da Raça Fight. Os ids são uuid, toda tabela tem RLS e política, e o histórico não aceita mudança nem exclusão. Isso foi **provado num Postgres de verdade, descartável**: 44 de 44 casos passaram, e o teste falha quando uma regra é quebrada de propósito. **Não rodou num Supabase na nuvem**, porque a conta não existe.

## 2. Decisões (o detalhe está em `docs/decisoes.md`, 16/10/2026)

| Decisão | Critério | Descartado |
|---|---|---|
| **Pasta canônica: `app/supabase/migrations/`.** Nas pastas antigas não sobrou SQL (`admin/supabase/` tem só um LEIA-ME que aponta para cá). | A CLI do Supabase só lê `supabase/migrations/` (por isso o nome em inglês); o modelo e o LEIA-ME já punham o banco em `app/supabase/` | duas pastas com `if not exists`; `supabase/` na raiz |
| **uuid em toda tabela**; o nome legível vai na coluna `chave` | o Auth é uuid, o Admin já era uuid, o aparelho gera sem sinal, a chave estrangeira confere o tipo, e texto colide entre academias | texto em tudo (como o exemplo do app usa hoje) |
| **O aluno no banco é a `pessoa`** (`pessoa_id`) | a criança não tem conta (R20.1); o cadastro do dono existe sem conta (RA13.1); um gatilho cria a pessoa quando o vínculo de aluno fica ativo e liga o app ao Admin | presença e graduação apontando para `auth.users` |
| **`pessoas` só o dono lê pela tabela**; o app lê por função, com as colunas cortadas | a observação e o documento são do dono, e o professor vê a criança só pelo primeiro nome (R20.7) | dar `select` à equipe e confiar na tela |
| **A aula continua sem tabela** (R14.4a); a chave dela, `<horario_id>@<data>`, é calculada por gatilho | é o formato que o domínio do app já usa | uma tabela `aulas` gerada pela grade |
| **A presença só sobe pela função** `registrar_presencas` | a janela (pelo instante do aparelho), a matrícula (R14.6), "a equipe vence" (R15.9) e os 7 dias (R15.8) são regras de várias linhas | `insert`/`upsert` direto com RLS |
| **"Nada se apaga" virou permissão**: `delete`/`truncate` revogados de tudo, com 3 exceções | a regra do modelo passa a ser do banco | confiar em cada política |
| **Histórico**: sem insert, update ou delete para ninguém, e um gatilho recusa a mudança até para o dono do banco. Ficam fora o dado de saúde e o motivo de saída por pessoa | o dono lê o histórico, e saúde e motivo individual não são dele (R6, R12.12) | o histórico também das tabelas de saúde |
| **Plus, dieta e conversa ficam fora** do esquema | estão desligados por `RECURSOS` (L12, L13) | criar as tabelas vazias |

**Achado que confirma a decisão**: apliquei as migrações antigas num Postgres 18 limpo, nas duas ordens. A `admin/…/20261015000200_admin_tabelas.sql` **falha** com "functions in index expression must be marked IMMUTABLE" (o índice `lancamentos_despesa_do_mes` usava `to_char`), e todas as que vinham depois dela caíram junto. No esquema novo, o índice usa `date_trunc('month', data::timestamp)`, que é imutável. O `create extension pgcrypto` também saiu: o `gen_random_uuid()` é do Postgres desde a versão 13.

## 3. Tabela × quem lê × quem escreve

A versão completa, com a vitrine e cada papel em coluna própria, está em `03-arquitetura/06-INTEGRACAO.md`, seção 2. O resumo:

| Tabela | Quem lê | Quem escreve |
|---|---|---|
| `academias` | todos com vínculo; a vitrine (sem os códigos); os códigos só por `codigos_da_academia` | dono |
| `usuarios` | a própria conta; a academia lê nome e foto; e-mail e telefone só por função | gatilho do Auth; a própria conta |
| `vinculos` | os seus; a equipe lê os da academia; `motivo_de_saida` ninguém lê (o dono vê o motivo somado) | rpc `pedir_vinculo`, `confirmar_vinculos`, `recusar_vinculo`, `encerrar_vinculo` |
| `pessoas` | dono; o resto por `minhas_fichas`, `fichas_da_academia`, `contato_do_responsavel` | dono; gatilho do vínculo; rpc `salvar_dependente`, `matricular_interessado` |
| `dependentes` | o responsável; a equipe só se ele liberou a saúde | o responsável |
| `perfis_de_alunos`, `medicoes_corporais` | o próprio; a equipe com autorização (R6.4) | o próprio; instrutor e dono com autorização |
| `modalidades`, `turmas`, `horarios` | todos e a vitrine | dono |
| `sistemas_de_graduacao` | quem tem vínculo | dono |
| `alunos_das_turmas` | o aluno (as suas), o professor (as turmas dele), recepção, dono | dono |
| `atletas` | o aluno (a sua), a equipe | professor da modalidade, dono |
| `ajustes_de_aula` | quem tem vínculo | rpc `cancelar_aula`, `passar_aula` |
| `presencas` | o aluno (as suas), o professor (as aulas e modalidades dele), recepção, dono | rpc `registrar_presencas` |
| `exames`, `candidatos_do_exame`, `graduacoes` | o aluno (as suas; a graduação anulada some), a equipe | professor da modalidade, dono; graduação só se anula |
| `eventos` | quem tem vínculo; a vitrine vê os abertos | professor (nas modalidades dele), recepção, dono |
| `participacoes_em_eventos` | o aluno (a sua), a equipe | o aluno |
| `lutas`, `consentimentos_de_atleta` | a equipe e o atleta; os alunos e a vitrine, só de quem consentiu | lutas: professor da modalidade e dono; consentimento: só o aluno ou o responsável |
| `tecnicas`, `perguntas_frequentes` | todos (as publicadas e abertas também na vitrine) | técnica: professor da modalidade e dono; pergunta: recepção e dono |
| `perfis_profissionais` | o próprio, o dono e os visíveis (também na vitrine) | o próprio; o dono só "oculta" |
| `avisos_da_academia`, `avisos_dispensados` | quem tem vínculo (o de turma, só a turma) | recepção, dono; professor só o da turma dele |
| `interessados`, `aulas_experimentais`, `indicacoes` | recepção, dono; o professor por `experimentais_da_aula` (primeiro nome, sem WhatsApp) | recepção, dono; o professor registra o interessado e marca compareceu ou faltou |
| `planos`, `matriculas`, `funcionarios`, `categorias`, `despesas_fixas`, `regras_de_cobranca`, `notas`, `lembretes`, `tarefas`, `filtros_salvos` | **só o dono**; as modalidades liberadas saem sem valor, por função | dono |
| `cobrancas`, `lancamentos`, `fechamentos`, `importacoes` | **só o dono** | rpc do Admin (o dono também edita lançamento na grade) |
| `historico` | só o dono | **só o gatilho** |
| `preferencias_*`, `dispositivos` | a própria conta | a própria conta |
| `avisos_enviados` | ninguém pela API | só o servidor |

O caminho **aula experimental → matrícula → mensalidade → pagamento → painel do dono**, passo a passo, com a tabela e a função de cada passo, está no `06-INTEGRACAO.md`, seção 4.

## 4. Pedidos exatos

### Ao agente do app (AN, ou quem escrever o `RepositorioSupabase`)

1. **Ids em uuid.** Em `app/dominio/modalidades/modalidades.ts` (`modalidadesDaRacaFight`), em `app/dominio/turmas/grade-raca-fight.ts` (os ids das turmas, `TODAS` e os horários `${turma}-${dia}-${HH}`) e em `app/dados/local/dados-de-exemplo.ts`, troque os ids de texto pelos uuid fixos do `seed.sql`. A tabela está no `06-INTEGRACAO.md`, seção 5: academia `a0000000-…-000000000001`, modalidades `b0000000-…-00000000000N`, turmas `c0000000-…-0000000000NN`, horários `d0000000-…-00000000NN0h`. O texto antigo vai para o campo `chave` (modalidade `muay_thai`, turma `muay-thai-noite-1`).
2. **`idDaAula` fica** (`horario@data`, `dominio/turmas/turmas.ts:91`): com o horário em uuid, ele é exatamente o `aula_id` do banco. **`idDaPresenca` (`aula|aluno`, `dominio/presenca/presenca.ts:86`) não serve de id no servidor.** Opções: gerar `crypto.randomUUID()` na criação e achar a presença local pelo par (aula, aluno); ou não mandar o `id` no envio, porque o servidor junta pelo par. Mandar `aula|aluno` como id quebra o envio, já que o tipo é uuid.
3. **`alunoId` passa a ser `pessoa_id`** em `FichaDeLuta`, `Presenca`, `Graduacao`, `CandidatoDoExame`, `Luta.atletaId`, `ConsentimentoDeAtleta`, `Indicacao` e `Dependente.id`. A pessoa do adulto vem de `minhas_fichas()`; não é o id da conta.
4. **A fila da presença** chama `rpc('registrar_presencas', { p_presencas: [...] })`, com cada item em snake_case: `id?`, `horario_id`, `data`, `pessoa_id`, `modalidade_id`, `origem`, `estado`, `motivo_da_retirada?`, `registrada_em`, `atualizada_em`, `experimental_id?`. O servidor calcula `turma_id`, `aula_id`, `pela_equipe`, `registrada_por` e `atualizada_por`. Os erros voltam como palavra-código: `fora_da_janela`, `aula_cancelada`, `sem_a_modalidade`, `so_atletas`, `so_kids`, `fora_do_prazo`, `aula_futura`, `sem_permissao`. Erro de regra não deve ser tentado de novo: o item sai da fila marcado como falhou. Só erro de rede repete.
5. **Selecione colunas explícitas** (nunca `select('*')`) em `vinculos`, `academias` e `usuarios`, porque `motivo_de_saida`, os códigos e o e-mail ou telefone não têm `grant` de leitura. Para eles existem `codigos_da_academia`, `contato_do_usuario` e `motivos_de_saida`.
6. **Escritas por rpc** no lugar de `insert`/`update`:
   - `pedirVinculo` → `pedir_vinculo(p_academia, p_papel)`;
   - `confirmarVinculos` → `confirmar_vinculos(p_ids)`;
   - `recusarVinculo` / `cancelarPedidoDeVinculo` → `recusar_vinculo(p_id)`;
   - `encerrarVinculo` → `encerrar_vinculo(p_id, p_motivo)`;
   - `cancelarAula` → `cancelar_aula(p_horario, p_data, p_motivo)`;
   - `passarAula` → `passar_aula(p_horario, p_data, p_substituto)`;
   - `salvarDependente` → `salvar_dependente(jsonb)`;
   - `fichasDaAcademia` → `fichas_da_academia(p_academia)`;
   - `fichasDoUsuario` → `minhas_fichas()`;
   - `indicacoesDoAluno` → `indicacoes_do_aluno(p_pessoa)`;
   - os experimentais na chamada → `experimentais_da_aula(p_horario, p_data)`.
7. **Mapeamentos de forma** (em `mapeadores.ts`):
   - `Interessado.modalidadeId` ↔ `modalidade_ids[0]`;
   - `comoConheceu` ↔ `origem`, que no banco só aceita `instagram`, `whatsapp`, `indicacao`, `passou_na_porta` e `outro`;
   - `AulaExperimental.aulaId` ↔ `horario_id` + `data`;
   - `marcadaPorId` → `marcada_por`;
   - `criadoPorId` → `criado_por`;
   - `Dependente.autorizacaoDeImagem` ↔ `imagem_autorizada` + `imagem_autorizada_em`;
   - `Graduacao.anulada` ↔ `anulada_em`, `anulada_por` e `motivo_da_anulacao`;
   - `Exame.candidatos` ↔ as linhas de `candidatos_do_exame`;
   - `AcademiaDeLuta.janela` ↔ `janela_minutos_antes` e `janela_minutos_depois`;
   - `aceitaLinkEmEvento` ↔ `aceita_link_em_evento`;
   - `ContatoDaAcademia.whatsapp` fica guardado **só com dígitos** (`5551981962077`), e a tela formata;
   - as preferências vão inteiras no JSONB `preferencias`.
8. **`registrada_por`, `por_id`, `autor_id` e `anulada_por` têm de ser a conta logada**, porque a política confere. Nunca mande o id de outra pessoa nesses campos.
9. **`app/dados/redigir.ts`**: acrescente `motivoDaAnulacao`, `crianca`, `codigoDeIndicacao` e `token` (do dispositivo). Os nomes em snake_case só aparecem depois do mapeador; se algum log ficar depois dele, inclua também a forma em snake_case.

### Ao agente do Admin (AO)

1. **Nada que o Admin chama mudou de nome**: as tabelas, as colunas e as funções `gravar_lancamentos`, `inserir_cobrancas`, `marcar_como_paga`, `desfazer_pagamento`, `cancelar_cobranca`, `fechar_mes`, `reabrir_mes`, `importar_lancamentos`, `desfazer_importacao`, `minha_academia_de_dono` e `pode_fazer_checkin` continuam iguais. A `vinculos.ativo` virou coluna gerada (o Admin só lê, então não muda nada).
2. **Troque as duas gravações em sequência** do repositório pelas funções novas, que são uma transação só (pendência 2 do AM1):
   - matricular do funil: `rpc('matricular_interessado', { p_academia, p_interessado, p_pessoa, p_matricula, p_cobrancas })`. Ela cria a pessoa (ou usa a que vier com `id`), a matrícula, `matriculado_em`, a experimental em `matriculou`, a indicação em `convertida`, as cobranças e o vínculo ativo de quem tem conta;
   - "marcar as N como pagas": `rpc('marcar_como_pagas', { p_cobrancas: [ids], p_data, p_forma })`.
3. **Ids de exemplo**: em `app/dominio/financeiro/exemplo.ts` e `admin/src/dados/local/exemplo.ts`, as modalidades `muay-thai`… passam a usar os uuid fixos do seed (a mesma tabela do pedido 1 ao app). Assim o exemplo do Admin e o do app falam da mesma modalidade.
4. **`AulaExperimental` precisa de `horarioId`** (em `app/dominio/financeiro/tipos.ts` e na tela do funil). Sem ele, a experimental marcada pelo Admin não aparece na chamada do professor, que procura por `horario_id` + `data`.
5. **Histórico com tabelas e ação novas**: o gatilho agora também grava `vinculos`, `turmas`, `horarios`, `alunos_das_turmas`, `atletas`, `sistemas_de_graduacao`, `ajustes_de_aula`, `graduacoes`, `exames`, `candidatos_do_exame`, `lutas`, `consentimentos_de_atleta`, `tecnicas`, `perguntas_frequentes`, `indicacoes`, `avisos_da_academia` e `perfis_profissionais`, além da ação `anulou`. O `descreverRegistro` (`app/dominio/financeiro/historico.ts`) precisa do rótulo dessas tabelas, senão a frase sai "Algum campo novo".
6. **O que o dono escreve e ainda não tem tela**: turmas e horários (R14.2a), réguas de graduação (R16.3, para inserir o IBJJF de `app/dominio/graduacao/sistemas.ts`), "Raça Responde", o contato da academia e a janela do check-in (L7). As tabelas e as políticas existem. Os "Treinaram" e "No tatame" do painel já podem ler `presencas`.
7. **WhatsApp em dois lugares**: `regras_de_cobranca.whatsapp_da_academia` (do AM1) e `academias.whatsapp` (do app). Sugestão: a tela de Ajustes grava os dois iguais, até alguém escolher um só.

## 5. Como provei

| Prova | Resultado |
|---|---|
| **Postgres de verdade, descartável**: PGlite 0.5.9 = PostgreSQL 18.6 em WebAssembly, em memória. Ele já estava em `A:\Claude\03-projetos\Patricia App\cei\node_modules\`, então **não instalei nada nem criei conta**. `testes/supabase-falso.sql` imita do Supabase os papéis `anon`, `authenticated` e `service_role`, o `auth.users`, o `auth.uid()` lido do JWT e os privilégios padrão | as 7 migrações e o seed aplicam do zero, sem erro: **49 tabelas** |
| **`testes/rls.mjs`**: entra como cada papel (`set role` + `request.jwt.claims`, como o PostgREST faz) | **44 de 44**. Entre eles: o catálogo, com toda tabela com RLS e política; a vitrine sem pessoa, dinheiro nem código; o aluno só com o dele, sem check-in pelo colega, fora da janela ou de modalidade que não pagou; o professor sem nenhum R$ nas 12 tabelas, só com as presenças das modalidades dele, e a equipe vencendo o "desfazer" do aluno; a graduação que só se anula; o experimental sem WhatsApp; a recepção com funil e sem dinheiro, confirmando só vínculo de aluno; a saúde do dependente escondida até o responsável ligar; o dono pagando, fechando o mês e travando; o isolamento entre duas academias; nada se apaga; o histórico imutável até para o dono do banco; o motivo de saída fora do histórico; o S3 do perfil; matricular do funil, pagar em lote e a grade |
| **O teste morde**: copiei as migrações com uma regra quebrada de propósito | presença lida por todos → 2 casos caem; cobrança aberta à equipe → 2 caem; sem a trava do histórico e sem "a equipe vence" → 2 caem. Com a regra certa, 44 de 44 |
| **`testes/conferir-migracoes.mjs`** (estático, só Node) | 7 migrações, 49 tabelas, 80 funções: nenhuma duplicata, RLS e política (ou a marca "só servidor") em toda tabela, referências existentes e na ordem, pastas antigas sem SQL, nenhum segredo. Testei com uma migração errada de propósito, e ele acusou a duplicata, a falta de RLS e de política e a referência inexistente |
| **As migrações antigas** no mesmo Postgres | falham (seção 2) |

Para rodar de novo: `app/supabase/LEIA-ME.md`, seção "Como provar". Nenhum valor nem dado de pessoa é impresso: o teste mostra só o nome do caso e o código do erro. Não li nem imprimi nenhum `.env`.

## 6. O que NÃO provei

- **Não rodou num Supabase na nuvem.** O PostgREST, o JWT de verdade do Auth, o MFA (aal2) e os privilégios padrão exatos do projeto foram imitados, não testados. O primeiro passo quando a conta existir: `supabase db reset` local (Docker) ou num projeto de teste, e transformar os 44 casos em pgTAP (`supabase test db`).
- **Versão**: provei no Postgres 18. O Supabase está na 15 ou 17. O esquema usa `unique nulls not distinct` (15+) e nada da 18, mas não foi rodado nessas versões.
- **Os clientes não foram ligados**: o `RepositorioSupabase` do app ainda é só a forma, e o do Admin só foi testado com cliente falso. O mapeamento camelCase ↔ snake_case dos pedidos da seção 4 não foi testado.
- **Sem caso próprio** (aplicam sem erro, mas nenhum teste as chama): `importar_lancamentos`, `desfazer_importacao`, `reabrir_mes`, `desfazer_pagamento`, `cancelar_cobranca`, `passar_aula`, `recusar_vinculo`, `contato_do_usuario`, `atletas_da_academia`, os avisos, as preferências e as medições. O gatilho do perfil profissional só foi testado no S3.
- **Desempenho**: as políticas chamam funções `security definer` em cada linha. Para uma academia (cerca de 200 alunos) não preocupa, mas não medi. Se crescer, o caminho é envolver as funções em `(select …)` na política, como o Supabase recomenda, e indexar `pessoas.usuario_id` e `turmas.professor_id`.
- **Edge Functions** (as mensalidades do dia 1, o push, o resumo das 08:00), o **Storage**, o `pg_cron` para apagar o interessado em 180 dias (L23) e o **Plus e a dieta** não foram escritos.
- **[decidir] que o esquema guarda como configuração e não resolve**: A1 (administrativo), A2 (o aluno ver as cobranças dele), L7 (janela: o seed usa a proposta de 30/30), L1 (aula de 60 min no seed), L22 (link em evento: desligado), L29 (o telefone para o professor: só o balcão vê), L31 (o aviso geral do professor: só o da turma).

## 7. Créditos dos ícones

`02-design/icones/CREDITOS.md` foi conferido arquivo por arquivo contra o disco. Saíram as 7 linhas dos desenhos de musculação apagados (`inicio`, `plus`, `anilha`, `barra`, `esteira`, `bicicleta`, `musculo`) e a frase das 16 ilustrações de `exercicios/`. Entraram as 15 linhas que faltavam para ícones que existem em `contorno/` e estão no `fonte/lista.json` (`baixo` a `estrela`). Depois disso, todo `.svg` de `contorno/` e `cheio/` tem crédito, e todo crédito aponta para um arquivo que existe. Os de luta continuam em `luta/CREDITOS.md`.

## 8. Arquivos

- Esquema: `app/supabase/migrations/2026101610{0000,0100,0200,0300,0400,0500,0600}_*.sql`, `app/supabase/seed.sql`, `app/supabase/LEIA-ME.md`, `admin/supabase/LEIA-ME.md`.
- Provas: `app/supabase/testes/{supabase-falso.sql, banco.mjs, rls.mjs, conferir-migracoes.mjs}`.
- Saíram: `admin/supabase/migrations/` (5 arquivos) e `app/supabase/migracoes/` (2 arquivos e o LEIA-ME), já juntados na pasta nova.
- Arquitetura: `03-arquitetura/06-INTEGRACAO.md` (novo); uma linha no `01-MODELO-DE-DADOS.md` e duas no `05-ADMIN.md` apontando para ele.
- Decisão: `docs/decisoes.md`, "16/10/2026 — Um esquema só para os três apps".

## Resumo

Os três apps têm um esquema só, com 7 migrações numa ordem e 49 tabelas. Toda tabela usa uuid e tem RLS com política. O aluno vê só o dele. O professor vê as turmas dele e nenhum real. A recepção cuida do balcão sem ver dinheiro. O dinheiro é só do dono. O histórico ninguém muda. Tudo isso foi provado num Postgres de verdade, descartável: 44 de 44 casos, e o teste falha quando a regra quebra. As migrações antigas nem rodavam num banco novo. Os pedidos ao app (ids em uuid, `pessoa_id`, presença por rpc) e ao Admin (duas funções novas, `horarioId`, rótulos do histórico) estão na seção 4. Falta rodar num Supabase de verdade, quando a conta existir.
