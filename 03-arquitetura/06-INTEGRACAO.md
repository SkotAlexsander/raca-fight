# 06 — Integração: os três apps num banco só

> Agente AU, P12, onda 4, 16/10/2026. O esquema está em `app/supabase/migrations/` (sete arquivos, uma ordem) e foi provado num Postgres descartável (`app/supabase/testes/`, 44 casos). Este arquivo mostra quem lê e quem escreve cada tabela, as funções que cada app chama e o caminho da aula experimental até o painel do dono. Relatório da onda: `docs/revisao/AU-INTEGRACAO.md`.

## 1. O desenho

```
  App do aluno (Expo)         App da equipe (Expo)           Admin (Vite, PWA)
  aluno · responsável         professor · recepção           dono
        │                           │                              │
        │ fila offline: presença    │ fila offline: chamada         │ só online (dinheiro)
        └────────────┬──────────────┴───────────────┬───────────────┘
                     │  Supabase Auth (mesma conta)  │
                     ▼                               ▼
           PostgREST: tabela (a RLS decide a linha) + rpc (função = 1 transação)
                     │
                     ▼
          Postgres: 49 tabelas, RLS em todas, histórico por gatilho
```

- **Uma conta, vários papéis.** A conta é `auth.users` → `usuarios`. O papel numa academia é o `vinculo` (`aluno`, `recepcao`, `instrutor` = professor, `personal`, `dono`). O app do aluno e o da equipe são o mesmo Expo, e a visão vem do vínculo. O Admin abre só para quem `minha_academia_de_dono()` responde.
- **Uma pessoa, três olhares.** O aluno no banco é sempre uma `pessoa`. O adulto com conta é `pessoas.usuario_id`. A criança sem conta é `pessoas.responsavel_pessoa_id`. Quem só existe no cadastro do dono não tem nenhum dos dois. Presença, graduação, turma, matrícula e cobrança apontam para `pessoa_id`. Quando um vínculo de aluno fica ativo, o gatilho `garantir_pessoa_do_aluno` cria a pessoa no cadastro do dono: é assim que o aluno do app aparece no Admin.
- **A regra mora no banco.** A tela só esconde. As funções de quem-é-quem que todas as políticas usam são estas:

  | Função | Responde |
  |---|---|
  | `tem_vinculo(academia, papeis)` | a conta tem vínculo ativo com um dos papéis |
  | `e_dono`, `e_equipe`, `e_balcao` (recepção ou dono), `e_da_academia` | atalhos da de cima |
  | `pode_financeiro(academia, nivel)` | hoje é só o dono; o papel "administrativo" é [decidir] A1, e se entrar muda só esta função |
  | `cuido_da_pessoa(p)` | a pessoa é a própria conta ou um dependente dela |
  | `e_professor_da_turma`, `e_professor_da_aula`, `e_professor_da_modalidade` | o professor, o auxiliar ou o substituto; o dono passa em todas |

  Todas são `security definer` e consultam o vínculo a cada pedido. Funcionário removido perde o acesso na hora (R6.12).

## 2. Tabela × quem lê × quem escreve

**L** = lê pela tabela · **f** = lê só por função, com as colunas cortadas · **E** = escreve pela tabela · **rpc** = escreve só por função · **—** = nada. "Aluno" inclui o responsável, que vê o que é dele e dos dependentes. "Professor" vê as turmas e modalidades dele. "Vitrine" é quem não tem conta.

### Conta e academia

| Tabela | Vitrine | Aluno | Professor | Recepção | Dono (Admin) | Quem escreve |
|---|---|---|---|---|---|---|
| `academias` | L (sem os códigos) | L (sem os códigos) | L; f o código dos alunos | L; f o código dos alunos | L; f os dois códigos | dono (E) |
| `usuarios` | — | L/E a própria | L nome e foto de quem divide academia | idem; f e-mail e telefone | idem; f e-mail e telefone | gatilho do Auth; a própria conta (E) |
| `vinculos` | — | L os seus (sem `motivo_de_saida`) | L os da academia | L os da academia | L; f motivos somados | rpc `pedir_vinculo`, `confirmar_vinculos`, `recusar_vinculo`, `encerrar_vinculo` |
| `perfis_profissionais` | L os visíveis | L os visíveis | L/E o seu | L/E o seu | L todos; E só "ocultar" | o próprio; o dono oculta (gatilho protege as colunas) |

### Pessoas e Kids

| Tabela | Vitrine | Aluno | Professor | Recepção | Dono | Quem escreve |
|---|---|---|---|---|---|---|
| `pessoas` | — | f `minhas_fichas()` | f `fichas_da_academia()`, criança só pelo primeiro nome | f fichas; f `contato_do_responsavel()` | L/E | dono (E); gatilho do vínculo; rpc `salvar_dependente`, `matricular_interessado` |
| `dependentes` (saúde, imagem) | — | L/E o dependente dele | L só se o responsável liberou | idem | idem | responsável (E); rpc `salvar_dependente` |
| `perfis_de_alunos`, `medicoes_corporais` (dado de saúde) | — | L/E os seus | L com autorização (R6.4) | L perfil com autorização | L com autorização | o próprio; instrutor/dono anotam medição com autorização |

### Tatame

| Tabela | Vitrine | Aluno | Professor | Recepção | Dono | Quem escreve |
|---|---|---|---|---|---|---|
| `modalidades`, `turmas`, `horarios` | L as ativas | L | L | L | L/E | dono (E) |
| `sistemas_de_graduacao` | — | L | L | L | L/E | dono (E) |
| `alunos_das_turmas` | — | L as suas | L as das turmas dele | L | L/E | dono (E) |
| `atletas` (marca de competição) | — | L a sua | L; E nas modalidades dele | L | L/E | professor da modalidade, dono |
| `ajustes_de_aula` | — | L | L | L | L | rpc `cancelar_aula`, `passar_aula` |
| `presencas` | — | L as suas | L das aulas e modalidades dele | L | L | rpc `registrar_presencas` (a fila sobe por aqui) |
| `exames`, `candidatos_do_exame` | — | L o seu | L; E nas modalidades dele | L | L/E | professor da modalidade, dono |
| `graduacoes` | — | L as suas, não anuladas | L todas; E nas modalidades dele | L | L/E | professor da modalidade, dono; mudar = só anular (gatilho) |
| `eventos` | L os abertos | L | L; E nas modalidades dele | L/E | L/E | professor, recepção, dono |
| `participacoes_em_eventos` | — | L/E a sua | L | L | L | o aluno |
| `lutas` | L de quem está em Atletas | L as suas e as de Atletas | L; E nas modalidades dele | L | L/E | professor da modalidade, dono |
| `consentimentos_de_atleta` | — | L/E o seu | L | L | L | só o aluno ou o responsável; f `atletas_da_academia()` |
| `tecnicas` | L as abertas publicadas | L as publicadas | L; E nas modalidades dele | L | L/E | professor da modalidade, dono |
| `perguntas_frequentes` | L | L | L | L/E | L/E | recepção, dono |
| `avisos_da_academia`, `avisos_dispensados` | — | L os da academia e os das turmas dele; E dispensar | L; E os da turma dele | L/E | L/E; retira qualquer um | recepção, dono; professor só os da turma (L31 é [decidir]) |

### Funil e dinheiro

| Tabela | Vitrine | Aluno | Professor | Recepção | Dono | Quem escreve |
|---|---|---|---|---|---|---|
| `interessados` | — | — | só registra (E sem ler) | L/E (com WhatsApp) | L/E | recepção, dono; professor registra |
| `aulas_experimentais` | — | — | f `experimentais_da_aula()` (primeiro nome); E presença nas turmas dele | L/E | L/E | recepção, dono; o professor marca compareceu/faltou |
| `indicacoes` | — | f `indicacoes_do_aluno()` (primeiro nome) | — | L/E | L/E | recepção, dono; rpc `matricular_interessado` converte |
| `planos`, `matriculas` | — | f só as modalidades liberadas | f só as modalidades liberadas | f idem | L/E | dono |
| `cobrancas` | — | — ([decidir] A2) | — | — ([decidir] A1) | L | rpc `inserir_cobrancas`, `marcar_como_paga(s)`, `desfazer_pagamento`, `cancelar_cobranca`, `matricular_interessado` |
| `lancamentos` | — | — | — | — | L/E (a grade) | dono; rpc `gravar_lancamentos`, `marcar_como_paga`, `importar_lancamentos` |
| `funcionarios`, `despesas_fixas`, `categorias`, `regras_de_cobranca`, `notas`, `lembretes`, `tarefas`, `filtros_salvos` | — | — | — | — | L/E | dono |
| `fechamentos`, `importacoes` | — | — | — | — | L | rpc `fechar_mes`, `reabrir_mes`, `importar_lancamentos`, `desfazer_importacao` |
| `historico` | — | — | — | — | L | **só o gatilho**. Ninguém tem insert, update ou delete, e um gatilho recusa até o dono do banco |
| `preferencias_de_aviso`, `preferencias_da_equipe`, `dispositivos` | — | L/E as suas | L/E as suas | L/E as suas | L/E as suas | a própria conta (o dispositivo se apaga ao sair) |
| `avisos_enviados` | — | — | — | — | — | só o servidor (Edge Function, chave de serviço) |

**Nada se apaga pela API.** `delete` e `truncate` foram revogados de todas as tabelas. Ficam três exceções, cada uma com motivo: o dispositivo ao sair da conta, a medição no mesmo dia e o aviso dispensado. Apagar é arquivar, encerrar ou anular.

**Nenhum valor em reais chega ao professor nem à recepção.** As tabelas do dinheiro só abrem para `pode_financeiro`. O check-in pergunta `matricula_libera`/`pode_fazer_checkin`, que respondem só sim ou não. As fichas trazem as modalidades liberadas, sem plano, valor ou atraso (R14.6a, R15.7).

## 3. Funções que cada app chama (`rpc`)

| App | Funções |
|---|---|
| Aluno | `pedir_vinculo`, `academia_pelo_codigo`, `minhas_fichas`, `modalidades_liberadas`, `registrar_presencas` (check-in e desfazer, pela fila), `salvar_dependente`, `indicacoes_do_aluno`, `encerrar_vinculo` (sair), `atletas_da_academia` |
| Equipe | `academia_pelo_codigo_da_equipe`, `pedir_vinculo`, `fichas_da_academia`, `registrar_presencas` (chamada, pela fila), `cancelar_aula`, `passar_aula`, `experimentais_da_aula`, `pode_fazer_checkin`; recepção: `confirmar_vinculos`, `recusar_vinculo`, `encerrar_vinculo`, `contato_do_responsavel`, `contato_do_usuario`, `codigos_da_academia` |
| Admin | `minha_academia_de_dono`, `gravar_lancamentos`, `inserir_cobrancas`, `marcar_como_paga`, `marcar_como_pagas`, `desfazer_pagamento`, `cancelar_cobranca`, `fechar_mes`, `reabrir_mes`, `importar_lancamentos`, `desfazer_importacao`, `matricular_interessado`, `motivos_de_saida`, `codigos_da_academia` |

Todas conferem quem pede por dentro e saem com uma palavra-código (`sem_permissao`, `fora_da_janela`, `mes_fechado`…), sem dado. Só quem entrou executa; a vitrine executa apenas `atletas_da_academia`.

## 4. O caminho: aula experimental → matrícula → mensalidade → pagamento → painel

| Passo | Quem | App | O que grava | Onde |
|---|---|---|---|---|
| 1. A pessoa toca "Agendar aula experimental" na vitrine | sem conta | aluno | nada: abre o WhatsApp da academia (R19.2) | lê `academias.whatsapp`, `modalidades` |
| 2. A recepção registra o interessado e marca a aula | recepção | equipe | `interessados` (+ `indicacoes` se trouxe código) e `aulas_experimentais` (`agendada`, com `horario_id` + `data`) | E pela tabela |
| 3. Na aula, o professor vê "Experimental · Edu" e marca presente | professor | equipe | `presencas` (origem `experimental`, pela fila) e a experimental vira `compareceu` | `experimentais_da_aula`, `registrar_presencas` |
| 4. O dono matricula do funil | dono | Admin | numa transação: `pessoas`, `matriculas`, `interessados.matriculado_em`, experimental `matriculou`, indicação `convertida`, as primeiras `cobrancas` e, se a pessoa tem conta, o `vinculo` de aluno **ativo** (R14.7) | `matricular_interessado` |
| 5. O aluno entra no app | aluno | aluno | `pedir_vinculo` (ou já está ativo pelo passo 4); a pessoa já existe e liga pelo `usuario_id` | `minhas_fichas` mostra as modalidades liberadas |
| 6. Todo mês nascem as mensalidades | dono (ou a Edge Function do dia 1, A6) | Admin | `cobrancas` calculadas por `gerarMensalidadesDoMes`; o índice único (matrícula, mês, tipo) impede duplicar | `inserir_cobrancas` |
| 7. O aluno faz check-in e treina | aluno | aluno | `presencas` (`pendente` → o professor confirma); atraso **não** bloqueia (R14.6a) | `registrar_presencas` |
| 8. O aluno paga no balcão | dono (recepção se A1) | Admin | a cobrança vira `paga` e nasce o `lancamento` de entrada com a repartição, juntos | `marcar_como_paga` |
| 9. O painel do dono | dono | Admin | nada (lê): receita de `lancamentos`, a receber e inadimplência de `cobrancas`, matriculados de `matriculas`, ativos e "no tatame" de `presencas`, o funil de `interessados` + `aulas_experimentais` | RLS do dono |
| 10. Fecha o mês | dono | Admin | `fechamentos` (a foto dos números); a trava recusa lançamento novo naquele mês; reabrir pede motivo | `fechar_mes`, `reabrir_mes` |

Cada passo deixa linha em `historico` (quem, quando, o que mudou), menos a presença, que tem o próprio quem-e-quando, e o dado de saúde, que não é do dono.

## 5. Ids

- **uuid em toda tabela.** O aparelho gera com `crypto.randomUUID()`, para funcionar sem sinal. O banco aceita o id que vem e gera um se faltar.
- **Nome legível é coluna à parte:** `modalidades.chave` (`muay_thai`, a lista base do R14.1a) e `turmas.chave` (`muay-thai-noite-1`). Ela serve aos modelos prontos, às fotos e ao exemplo, e é única por academia.
- **A aula não é tabela** (R14.4a). A chave dela é o texto `<horario_id>@<AAAA-MM-DD>` (o formato do app), calculado por gatilho a partir de `horario_id` + `data`, que são as colunas de verdade.
- **Presença:** uma por (aula, pessoa), por índice único. O `id` da presença é um uuid comum, e o servidor junta pelo par.
- **Ids fixos da Raça Fight** (o `seed.sql`, para o exemplo do app e o do Admin usarem os mesmos):

| Chave | uuid |
|---|---|
| academia `raca-fight-gravatai` | `a0000000-0000-4000-8000-000000000001` |
| modalidade `muay-thai` · `boxe` · `jiu-jitsu` · `luta-livre` · `mma` | `b0000000-0000-4000-8000-00000000000`**1** · **2** · **3** · **4** · **5** |
| turma `muay-thai-manha` · `muay-thai-noite-1` · `muay-thai-noite-2` · `boxe-manha` · `boxe-noite` · `jiu-jitsu-luta-livre` | `c0000000-0000-4000-8000-0000000000`**01** a **06** |
| turma `mma` · `muay-thai-kids` · `jiu-jitsu-kids` · `sexta-open` · `treino-de-competicao` | `c0000000-0000-4000-8000-0000000000`**07** a **11** |
| horário *h* da turma *NN* (na ordem de `grade-raca-fight.ts`) | `d0000000-0000-4000-8000-00000000`**NN0h** (ex.: turma 02, 1º horário = `…000000000201`) |

## 6. Sem sinal e com sinal

| Ação | Sem sinal? | Como sobe |
|---|---|---|
| Check-in, desfazer, chamada | sim (fila, R15.9) | `registrar_presencas`, com o instante do aparelho. A janela é contada desse instante. A equipe vence o aluno, e entre dois do mesmo lado vale o mais recente |
| Cancelar ou passar aula, graduação, evento, experimental, vínculo | não (`ErroSemSinal`) | tabela ou rpc, na hora |
| Tudo do Admin | não (dinheiro não tem dois verdadeiros) | rpc, uma transação por intenção |

## 7. O que este esquema ainda não tem

- **Plus, dieta e conversa:** desligados por `RECURSOS` (L12, L13). Quando ligarem, entram numa migração nova com a forma das seções 13 a 18 do `01-MODELO-DE-DADOS.md`. O treino de musculação saiu e não volta.
- **Edge Functions:** a geração das mensalidades no dia 1 (A6), o push (`enviar-aviso`, com `avisos_enviados`) e o resumo do dono às 08:00.
- **Storage:** foto do professor e vídeo de técnica (L30); hoje só existem links `https://`.
- **A confirmação sozinha às 23:59** (R15.5) é calculada na leitura pelo domínio, como o AM2 fez. Uma tarefa no servidor só faz falta se o painel precisar do número sem o domínio.
- **Apagar o interessado depois de 180 dias** (L23) também não está feito: precisa de `pg_cron` ou de uma Edge Function agendada.
