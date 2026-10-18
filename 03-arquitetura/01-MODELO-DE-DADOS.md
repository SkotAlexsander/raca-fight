# 01 — Modelo de dados

Este arquivo descreve as entidades do Academia Plus, seus campos, unidades e quem pode ler e escrever cada uma. Segue as regras numeradas de `01-especificacao/03-REGRAS.md` (R1.1, R5.1…). Os tipos em código estão em `app/dominio/tipos.ts`; as tabelas e políticas RLS estão em `app/supabase/migrations/` (desde 16/10/2026 a pasta única dos três apps; o que mudou ao virar SQL, como `pessoa_id` no lugar de `alunoId` e as tabelas de luta, está em `06-INTEGRACAO.md`).

## Convenções

- **Ids**: UUID, em texto. Gerados no telefone (para funcionar offline) e aceitos pelo servidor. Nome legível (`muay_thai`, `muay-thai-noite-1`) é a coluna `chave`, nunca o id (decisão de 16/10/2026).
- **Unidades inteiras** (R7): peso e carga em **gramas**, altura e circunferência em **milímetros**, tempo em **segundos**, dinheiro em **centavos**, calorias em **kcal**, percentual de gordura em **décimos** (185 = 18,5 %). Idade **não se guarda**: deriva da data de nascimento. Formatação só na tela (`dominio/unidades.ts`).
- **Datas**: `AAAA-MM-DD`. **Instantes**: ISO 8601 com fuso (`2026-10-10T14:30:00-03:00`); no banco, `timestamptz`. O fuso é o do aparelho no momento do registro (R7.4).
- **`academiaId` em tudo** que pertence a uma academia. Vale para uma academia só ou várias ([decidir]) sem mudar o modelo. O aluno **sem academia** (R8.4) tem `academiaId` nulo no treino livre, nas execuções, no perfil e nas medições.
- **Nunca se apaga de verdade** treino, exercício ou assinatura: usa-se `estado`/`arquivado`/`fim`. Histórico é parte do produto (R1.5, R4.3, R5.13). Exceções com prazo, e só elas: treino realizado até 7 dias (R1.22) e medição no mesmo dia por quem registrou (seção 5) — erro de digitação, não histórico. Apagar a conta (R6.10) segue a regra própria dela.
- **Sem `enum` no código**: uniões de texto. No banco, `text` com `check`.

### Papéis (para as regras de acesso)

| Papel | Quem é | Visão |
|---|---|---|
| `aluno` | quem treina | aluno |
| `recepcao` | funcionário de balcão ("funcionário" na especificação) | academia |
| `instrutor` | instrutor de sala, monta treino para aluno ("funcionário") | academia |
| `personal` | acompanha assinantes Plus (treino + dieta + conversa) | academia |
| `dono` | dono da academia; vê números e administra | academia |

Uma pessoa pode ter mais de um vínculo na mesma academia (aluno **e** instrutor). Nas tabelas, "academia" = qualquer vínculo `ativo` de `recepcao`, `instrutor`, `personal` ou `dono` na mesma academia. "Personal (d)" = personal **designado** ao aluno numa assinatura Plus `ativo` ou `cancelado_vigente`.

Abreviações: **L** = lê, **E** = escreve, **—** = não vê, **(a)** = só se o aluno autorizou a academia (R6.4).

---

## 1. Academia

| Campo | Tipo | Nota |
|---|---|---|
| id | Id | |
| nome | texto | |
| apelido | texto único | sem espaço; usado em link |
| codigoDeVinculo | texto (6 caracteres) | o aluno digita para se vincular (R8.1); o dono troca |
| codigoDaEquipe | texto (6 caracteres) | a equipe digita para pedir entrada (F13.4); diferente do dos alunos; o dono troca (acrescentado pelo agente AA, 11/10/2026) |
| entrarSemConfirmacao | booleano | vínculo nasce `ativo` sem a recepção confirmar (R8.1) |
| fusoHorario | texto IANA | `America/Sao_Paulo` |
| marca | `{ logoUrl?, corPrimaria? }` | **[decidir]** white-label; guardado desde já |
| criadaEm | instante | |

| | aluno | recepção / instrutor / personal | dono |
|---|---|---|---|
| Academias em que tem vínculo | L (sem `codigoDeVinculo` e sem `codigoDaEquipe`) | L | L / E |
| Outras academias | — | — | — |

## 2. Usuario

Identificação da conta. **Nada de saúde aqui** (R6.1).

| Campo | Tipo | Nota |
|---|---|---|
| id | Id | igual ao id do `auth.users` do Supabase |
| nome, email, telefone?, fotoUrl? | texto | |
| criadoEm | instante | |

| | o próprio | academia (mesmo vínculo) | outro usuário |
|---|---|---|---|
| Usuario | L / E | L (nome, foto; telefone só recepção/dono) | — |

## 3. Vinculo (papel)

| Campo | Tipo | Nota |
|---|---|---|
| id, usuarioId, academiaId | Id | |
| papel | `aluno` · `recepcao` · `instrutor` · `personal` · `dono` | |
| estado | `pendente` · `ativo` · `encerrado` | R8.1: nasce `pendente` pelo código, ou `ativo`; sair/remover = `encerrado` (R8.3, R6.12) |
| desde, ate? | data | |
| motivoDeSaida? | `cancelou_matricula` · `mudou_de_academia` · `outro` | R12.11 (P10): só quando a **academia** encerra; ausente quando o aluno sai sozinho (R8.3). Não é dado de saúde, mas o aluno não vê: o aviso dele vai sem o motivo, e o dono só vê o motivo **somado** (R12.12) |
| encerradoPor? | Id | R12.11: quem encerrou (o próprio, a recepção ou o dono) |

Único por (usuarioId, academiaId, papel). **[decidir]** várias academias: mais de um vínculo `ativo` de aluno é permitido; uma academia: só um.

**Encerrar pela academia (R12.11)**: a recepção ou o dono chamam a função `encerrar_vinculo(vinculo_id, motivo)` (`security definer`), que muda `estado`, `ate`, `motivo_de_saida` e `encerrado_por` de uma vez e dispara o aviso 21 (seção 3 de `03-DECISOES-TECNICAS.md`). A coluna `motivo_de_saida` fica **sem `grant select`** para `authenticated`: nenhuma tela lê a linha com o motivo; o painel do dono lê a contagem por `numeros_da_academia()`, também `security definer`.

| | o próprio | recepção | instrutor / personal | dono |
|---|---|---|---|---|
| Vínculos da academia | L (os seus); E só `encerrado` no próprio (desvincular) | L; E confirmar `pendente`→`ativo` de aluno; criar vínculo de aluno por e-mail/telefone (R8.2) | L | L / E (inclusive criar/encerrar funcionário e personal) |

## 4. PerfilDoAluno (cadastro opcional)

Tudo opcional. **Dado de saúde** (R6.1). Um por (usuarioId, academiaId). O aluno **sem academia** (R8.4) também preenche (F1 passo 5): `academiaId` nulo. Ao se vincular, esse perfil passa a levar o `academiaId` da academia (v1: uma academia por aluno — [decidir] várias academias: copia-se, um por academia).

| Campo | Tipo | Nota |
|---|---|---|
| usuarioId | Id | chave |
| academiaId | Id ou nulo | chave; nulo = aluno sem academia |
| dataNascimento | data? | idade é calculada (`calcularIdade`) |
| sexo | `feminino` · `masculino` · `outro` · `nao_informado`? | |
| objetivo | chave de objetivo? | zero ou um (R2.2); trocas vão para `HistoricoDeObjetivo` |
| restricoes | texto? | lesões, orientação médica |
| frequenciaSemanalPretendida | inteiro 1–7? | |
| consentimentoEm | instante? | LGPD: quando aceitou guardar dado de saúde (primeira vez que preenche peso/altura — `03-DECISOES-TECNICAS.md`, seção 5); ausente = nunca preencheu |
| autorizaAcademia | booleano | R6.4: a academia só vê o cadastro corporal se verdadeiro; desligar tem efeito imediato |
| autorizacaoEm | instante? | quando autorizou |
| consentimentoDoResponsavelEm | instante? | R6.11: menor de 18 só guarda dado de saúde com isto preenchido |
| atualizadoEm | instante | |

**HistoricoDeObjetivo**: `id`, `alunoId`, `academiaId` (ou nulo, como no perfil), `objetivo` (ou nulo), `em` (R2.2).

| | aluno (o próprio) | recepção | instrutor / dono | personal |
|---|---|---|---|---|
| PerfilDoAluno | L / E | L (a) | L (a) | L (a); L / E (d) |
| HistoricoDeObjetivo | L | — | L (a) | L (a) ou (d) |

Sem autorização, a academia vê só: nome, foto, data de vínculo, treino ativo e frequência (R6.5).

## 5. MedicaoCorporal (histórico)

Uma linha por medição. **Dado de saúde.**

| Campo | Tipo | Unidade |
|---|---|---|
| id, alunoId | Id | |
| academiaId | Id ou nulo | nulo = aluno sem academia (R8.4) |
| data | data | |
| pesoGramas | inteiro? | g |
| alturaMilimetros | inteiro? | mm |
| gorduraCorporalDecimos | inteiro? | décimos de % |
| circunferencias | `{ cinturaMilimetros?, quadrilMilimetros?, peitoMilimetros?, bracoDireitoMilimetros?, bracoEsquerdoMilimetros?, coxaDireitaMilimetros?, coxaEsquerdaMilimetros? }` | mm |
| registradoPorId | Id | aluno ou funcionário que anotou |

| | aluno (o próprio) | recepção | instrutor / dono | personal |
|---|---|---|---|---|
| MedicaoCorporal | L / E | — | L / E (a) | L (a); L / E (d) |

Apagar: só quem registrou, e só no mesmo dia. Depois, fica.

## 6. Objetivo — lista fixa do app (R2.1)

Não é tabela: é a união `ChaveDoObjetivo` = `emagrecer` · `ganhar_massa` · `condicionamento` · `iniciante` · `saude_e_manutencao`. Nome e descrição para a tela ficam em `dominio/objetivos.ts` (a vir). Filtro de treinos prontos: R2.4 a R2.6, em `dominio/treino.ts` (a vir: `filtrarProntosPorObjetivo`).

## 7. Exercicio (biblioteca — seção 4 das regras)

| Campo | Tipo | Nota |
|---|---|---|
| id | Id | |
| camada | `geral` · `academia` · `criado_pelo_aluno` | R1.12 / R4.1 |
| academiaId | Id ou nulo | preenchido se `academia` |
| alunoId | Id ou nulo | preenchido se `criado_pelo_aluno` |
| nome | texto | |
| grupoMuscular | `peito` · `costas` · `ombros` · `biceps` · `triceps` · `pernas` · `gluteos` · `abdomen` · `cardio` · `corpo_inteiro` | lista fixa (R4.1) |
| gruposSecundarios | lista do mesmo? | |
| tipoDeMedidaPadrao | `repeticoes` · `tempo` | |
| comoFazer, imagemUrl | texto? | |
| arquivado | booleano | R4.3: nunca se apaga se algum treino usa |

| | aluno | instrutor / personal / dono | time do app |
|---|---|---|---|
| `geral` | L | L | E (fora do app na v1 — R4.2) |
| `academia` (da sua) | L | L / E | — |
| `criado_pelo_aluno` | L / E (só os seus) | L só quando o exercício está num treino que a pessoa pode ler (R6.5: o treino ativo; personal (d): os treinos do aluno) | — |

Sem a exceção da última linha, o instrutor abriria o treino ativo do aluno (R6.5) e veria a linha do exercício sem nome. Na RLS: `exists` em `exercicios_do_dia` → `dias` → `treinos` que a pessoa já pode ler.

## 8. Treino → 9. DiaDeTreino → 10. ExercicioDoDia → 11. Serie

A estrutura central (seção 1 das regras). Um treino tem 1 a 7 dias (R1.9; zero só em rascunho, R1.6); cada dia tem exercícios em ordem; cada exercício do dia tem séries planejadas.

**Treino**

| Campo | Tipo | Nota |
|---|---|---|
| id | Id | |
| academiaId | Id ou nulo | nulo só no treino `livre` do aluno sem academia (R8.4); toda outra origem exige academia (`criarTreinoVazio` recusa) |
| nome, descricao? | texto | |
| origem | `livre` · `pronto` · `copiado_de_pronto` · `montado_pela_academia` · `montado_pelo_personal` | R1.2 |
| estado | `ativo` · `guardado` · `arquivado` | R1.1; só um `ativo` por aluno (R1.3); arquivado some das listas mas existe (R1.5) |
| autorId | Id | quem criou |
| alunoId | Id ou nulo | nulo só quando `pronto` |
| objetivos | lista de chave | `pronto` tem um ou mais (R2.3) |
| nivel | `iniciante` · `intermediario` · `avancado`? | |
| versao | inteiro | sobe a cada edição de um `pronto` (R1.4) |
| copiadoDe | `{ treinoId, versao }`? | R1.4: de qual modelo e em que versão |
| personalAte | data? | R5.10: selo "Personal: até [data]" quando o Plus desligou |
| trocarEm | data? | R12.5 (P10): no treino enviado ao aluno (F5 ou R12.4). A partir da data, o Início do aluno mostra "Seu treino está na hora de trocar." e ele entra no filtro "Treino para trocar". `precisaTrocar()` e `sugerirTrocarEm()` (4 · 6 · 8 · 12 semanas) em `dominio/treino.ts` |
| criadoEm, atualizadoEm | instante | |

**DiaDeTreino** (R1.8): `id`, `treinoId`, `ordem`, `nome` (padrão "A", "B"…), `observacao?`.

**ExercicioDoDia** (R1.11, R1.13): `id`, `diaId`, `ordem`, `exercicioId`, `tipoDeMedida` (`repeticoes` · `tempo`), `observacao?`.

**Serie** planejada (R1.14 a R1.16): `id`, `ordem`, `repeticoes?` (≥ 1, se por repetições) **ou** `tempoSegundos?` (≥ 1, se por tempo), `cargaGramas?` (ausente = sem carga definida; **0 = peso do corpo**), `descansoSegundos` (≥ 0; padrão 60), `aquecimento` (não entra no volume), `cargaPlanejadaEm?` (instante em que a carga **planejada** foi definida ou mudada; R12.1, P10: se for depois da última vez que o aluno fez o exercício, a série abre com a planejada; senão, com a última real — `sugerirCargaDaSerie()`). Padrão ao adicionar exercício: 3 × 12 (ou 3 × 30 s), carga vazia, descanso 60 (R1.15).

**Cópia de treino pronto (R1.4)**: o aluno nunca usa um `pronto` ao vivo. `copiarTreinoPronto()` cria um treino `copiado_de_pronto` com dias, exercícios e séries de ids novos, `alunoId` dele e `copiadoDe = { treinoId, versao }`. Editar o modelo sobe a `versao` dele e não toca as cópias.

Regras de acesso (dia, exercício do dia e série **herdam** do treino). R1.7: quem monta para o aluno cria treino novo com a origem certa, nunca edita o `livre` dele.

| | aluno (dono do treino) | outros alunos | instrutor / dono | personal (d) |
|---|---|---|---|---|
| `pronto` da academia | L | L | L / E | L / E |
| `livre`, `copiado_de_pronto` | L / E | — | L (sem autorização também — R6.5, só o ativo) | L |
| `montado_pela_academia` | L / E (pode ajustar) | — | L / E | L |
| `montado_pelo_personal`, Plus ativo | L (ajusta carga na execução, não a estrutura) | — | L | L / E |
| `montado_pelo_personal`, Plus desligado (R5.10) | L / E | — | L | — |

Volume e duração estimada **não são guardados**: `dominio/treino.ts` calcula.

## 12. TreinoRealizado → SerieRealizada (execução, R1.17 a R1.24)

Nasce no telefone, **pode nascer sem sinal** (R1.24), sincroniza depois.

| Campo | Tipo | Nota |
|---|---|---|
| id, alunoId | Id | id gerado no telefone |
| academiaId | Id ou nulo | |
| treinoId, diaId | Id ou nulo | nulo quando treinou sem seguir treino salvo |
| data | data | no fuso do aluno; nunca futura (R1.21); pode ser passada |
| inicioEm, fimEm? | instante | com fuso |
| duracaoSegundos | inteiro? | |
| observacao | texto? | "como foi" |
| sincronizadoEm | instante? | preenchido pelo servidor; ausente = só no telefone |

**SerieRealizada** (R1.18, R1.19): `id`, `exercicioId`, `serieId` (planejada; nulo se trocou o exercício), `substitutoDe?` (exercício planejado que este substituiu), `ordem`, `repeticoesFeitas?` / `tempoSegundos?`, `cargaGramas?`, `aquecimento`, `estado` (`feita` · `pulada`), `registradaEm`.

Volume do realizado (R1.20) e "última carga" (R1.23) são calculados, não guardados. Conflito offline (R1.24): vale o `fimEm` mais recente.

| | aluno (o próprio) | recepção | instrutor / dono | personal |
|---|---|---|---|---|
| TreinoRealizado | L / E; apaga até 7 dias (R1.22); depois só `observacao` | — (só contagem para frequência) | L (a) | L (a) ou (d) |

Frequência e "aluno ativo" (R8.5: treinou nos últimos 30 dias) são derivados daqui; a recepção vê a contagem, não o conteúdo.

## 13. AssinaturaPlus → MudancaDeEstadoDaAssinatura (seção 5 das regras)

Plus é um **estado da conta do aluno** na academia. "Sem Plus" = não existe assinatura.

| Campo | Tipo | Nota |
|---|---|---|
| id, alunoId, academiaId | Id | |
| personalId | Id ou nulo | designado pelo dono (R5.5); vazio = "Aguardando seu personal" |
| estado | `ativo` · `cancelado_vigente` · `inativo` · `suspenso` | R5.1; só os dois primeiros liberam o Plus |
| inicio, fim? | data | fim do período pago (`cancelado_vigente`) ou data em que ficou `inativo` |
| carenciaAte | data? | R5.8: `suspenso` por 7 dias, depois `inativo` |
| origemDoPagamento | `loja_apple` · `loja_google` · `pix` · `cartao` · `via_academia` | **[decidir]** quem paga; cabe em todas |
| precoCentavos | inteiro? | R7 |
| referenciaExterna | texto? | id do recibo/cobrança; **nunca** dado de cartão |
| criadaEm | instante | |

**MudancaDeEstadoDaAssinatura** (R5.2): `id`, `assinaturaId`, `de` (ou nulo), `para`, `motivo`, `em`, `porId` (usuário ou `'servidor'`).

O que o Plus **libera**: `PlanoDeDieta`, personal com escrita no treino, `Conversa`, e a autorização do personal ver cadastro corporal e histórico (R5.4 — não desligável separadamente, R6.6). Ao **desligar** (R5.9 a R5.13): personal perde acesso na hora; treino do personal fica com o aluno (`personalAte`); dieta vira só leitura; conversa só leitura; **nada é apagado**.

| | aluno (o próprio) | recepção | instrutor | personal | dono |
|---|---|---|---|---|---|
| AssinaturaPlus | L | L (estado); **[decidir]** E ligar/desligar se a academia cobra (R5.3, R5.7) | L (estado) | L (as suas) | L / E (designar personal, trocar personal — R5.6) |
| Mudar `estado` por pagamento | — | — | — | — | só o **servidor** (webhook) |
| MudancaDeEstadoDaAssinatura | L | L | — | L (as suas) | L |

## 14. PlanoDeDieta → 15. Refeicao → 16. ItemDeRefeicao → RefeicaoRegistrada (seção 3)

Só existe dentro de uma `AssinaturaPlus`. **Dado de saúde.**

**PlanoDeDieta** (R3.1, R3.2, R3.5): `id`, `alunoId`, `academiaId`, `personalId`, `assinaturaId`, `nome`, `inicio`, `fim?`, `observacao?`, `estado` (`em_vigor` · `futuro` · `encerrado` — no máximo um `em_vigor` por data; novo plano encerra o anterior em início − 1), `copiadoDeId?`, `criadoEm`, `atualizadoEm`.

**Refeicao** (R3.3): `id`, `planoId`, `ordem`, `nome`, `horarioSugerido?` (`HH:MM`), `opcional` (não conta na adesão).

**ItemDeRefeicao** (R3.4): `id`, `refeicaoId`, `ordem`, `descricao` (texto livre — v1), `trocaPermitida?`, e **[decidir]** banco de alimentos: `alimentoId?`, `quantidadeGramas?`, `caloriasKcal?` (reservados; v1 vazios).

**RefeicaoRegistrada** (R3.6 a R3.8): `id`, `alunoId`, `academiaId`, `planoId`, `refeicaoId`, `data`, `estado` (`feita` · `nao_segui`; sem linha = a fazer), `feitaEm?`, `motivo?`, `registradaEm`, `sincronizadoEm?`. Adesão (R3.7) é calculada em `dominio/dieta.ts` (a vir).

| | aluno (o próprio) | recepção / instrutor / dono | personal (d) |
|---|---|---|---|
| PlanoDeDieta, Refeicao, ItemDeRefeicao | L (não edita — R3.9) | — | L / E |
| RefeicaoRegistrada | L / E (só com Plus ligado — R5.11) | — | L |

O dono **não** vê dieta (R6.7): números agregados só (quantos planos).

## 17. Conversa → 18. Mensagem — [decidir] chat próprio ou WhatsApp

Só se a decisão for **chat próprio**. Se for WhatsApp, estas entidades não existem e o `Usuario.telefone` do personal vira o link (R5.12).

**Conversa**: `id`, `academiaId`, `assinaturaId`, `participanteIds` (aluno e personal), `somenteLeituraDesde?` (R5.12: Plus desligou), `criadaEm`.
**Mensagem**: `id`, `conversaId`, `autorId`, `texto`, `enviadaEm`, `lidaEm?`.

| | aluno participante | personal participante (d) | qualquer outro (inclusive dono) |
|---|---|---|---|
| Conversa, Mensagem | L; E só com Plus ligado | L / E só com Plus ligado; **—** depois (R5.9) | — |

Mensagens podem conter dado de saúde: tratadas como tal — nunca em log, nunca indexadas fora do próprio chat.

---

## 19. Dispositivo — para onde vai a notificação do servidor

`03-DECISOES-TECNICAS.md`, seção 3. Não é dado de saúde.

**Dispositivo**: `id`, `usuarioId`, `token` (push do Expo), `plataforma` (`ios` · `android`), `fuso` (`-03:00`; atualizado a cada abertura do app — serve ao horário de silêncio, R10.5), `atualizadoEm`. Sair da conta apaga a linha (H07).

| | o próprio usuário | qualquer outro |
|---|---|---|
| Dispositivo | L / E (o seu) | — (só a Edge Function, com a chave de serviço) |

## 20. PreferenciasDeAviso — a tela Avisos

Uma por usuário (o lado do aluno) e uma por vínculo de equipe (o lado da academia). Tipos em `dominio/avisos.ts` (`PreferenciasDeAviso`, `PreferenciasDaEquipe`); padrão em `PREFERENCIAS_PADRAO`.

**Do aluno**: `usuarioId`, `lembreteTreinoLigado` (padrão falso), `lembreteTreinoDias` (lista de `dom`…`sab`; vazia = usa `frequenciaSemanalPretendida`), `lembreteTreinoHora` (`HH:MM`, 07:00 a 21:59), `lembreteRefeicaoModo` (`desligado` · `resumo_noturno` · `por_refeicao`; padrão `resumo_noturno`), `lembreteRefeicaoHoraDoResumo` (padrão 20:30), `cronometro`, `personal`, `mensagens` **[decidir]**, `academia`, `assinatura` (booleanos, padrão verdadeiro), `atualizadoEm`.
**Da equipe**: `vinculoId`, `pedidosDeVinculo`, `alunosSemTreinar` (padrão verdadeiro para recepção e dono, falso para instrutor), `alunosPlus` (personal), `atualizadoEm`.

Os lembretes do aluno são agendados no telefone; o servidor lê esta tabela só para as chaves dos avisos que ele manda. Por isso a tabela sobe ao servidor mesmo sendo quase toda local.

| | o próprio | qualquer outro |
|---|---|---|
| PreferenciasDeAviso | L / E | — (a Edge Function lê) |

## 21. AvisoDaAcademia — o canal da academia com todos os alunos (V6)

`01-especificacao/03-REGRAS.md`, R10.10 a R10.13. Não é dado de saúde, mas é escrito por gente: a tela lembra a regra.

**AvisoDaAcademia**: `id`, `academiaId`, `autorId`, `texto` (até 160 caracteres, até 3 linhas, sem link — `validarAvisoDaAcademia()`), `publicadoEm`, `validoAte` (data; 1 a 14 dias depois, padrão 3), `notificar` (booleano; falso se a academia já mandou um com notificação hoje), `retiradoEm?`, `retiradoPor?`.
**AvisoDispensado**: `avisoId`, `usuarioId`, `dispensadoEm` — o aluno tocou "Dispensar" no cartão; some só para ele. Sem "lido por": a academia não vê quem leu (R10.12).

| | aluno da academia | recepção | instrutor | personal | dono |
|---|---|---|---|---|---|
| AvisoDaAcademia (em vigor) | L | L / E | L **[decidir]** E | L | L / E |
| Retirar aviso | — | E (o seu) | — | — | E (qualquer um) |
| AvisoDispensado | L / E (o seu) | — | — | — | — |

## 22. AvisoEnviado — registro do servidor, sem conteúdo

Para o limite por dia, o agrupamento, o silêncio e a auditoria (R10.6, R10.7, R10.16). **Nunca guarda o texto.**

**AvisoEnviado**: `id`, `destinatarioId`, `academiaId?`, `tipo` (um de `TIPOS_DE_AVISO`), `chaveDeAgrupamento` (ex.: `pedido_de_vinculo:<academiaId>`), `seguradoAte?` (caiu no silêncio), `enviadoEm?`, `resultado` (`enviado` · `segurado` · `fora_do_limite` · `chave_desligada` · `erro`).

| | qualquer usuário |
|---|---|
| AvisoEnviado | — (só a Edge Function e o `pg_cron`) |

## 23. PerfilProfissional — a Equipe da academia (P10)

`01-especificacao/03-REGRAS.md`, R11.1 a R11.13; histórias H90 a H95; fluxo F14. Código: `dominio/perfil-profissional.ts`.

Pertence ao **vínculo de equipe**, não à conta (R11.2): a mesma pessoa pode estar em duas academias, com turnos diferentes. Só vínculo `ativo` de `recepcao`, `instrutor`, `personal` ou `dono` tem perfil (R11.1). "Professor", na fala do Alex, é o `instrutor`: não há papel novo. Dado pessoal do profissional, publicado por ele; **não** é dado de saúde (R11.8).

| Campo | Tipo | Nota |
|---|---|---|
| id | Id | |
| vinculoId | Id | único: um perfil por vínculo |
| usuarioId, academiaId | Id | repetidos do vínculo, para a RLS não subir até ele em cada leitura; o gatilho confere que batem com o vínculo |
| nomeExibicao | texto, até 60 | começa com o nome da conta |
| fotoUrl? | texto | só `https://` (Storage do Supabase) |
| formacao | texto, até 60 | "Professor de Educação Física" |
| cref? | texto | formato do CONFEF: número (até 6 dígitos), `G` ou `P`, UF — `012345-G/SP` (`lerCref()`). Mostrado inteiro (R11.2) |
| crefConferido | booleano | começa falso. **[decidir]** se o app confere na consulta do CONFEF/CREF. Só o servidor escreve; trocar o `cref` volta a falso |
| especialidades | lista de `musculacao` · `funcional` · `hiit` · `reabilitacao` · `idosos` · `iniciantes` · `outra` | R11.3, lista fixa (pergunta 26). Sem repetir |
| especialidadeOutra? | texto, até 30 | obrigatório quando `outra` está marcada |
| sobre | texto, até 280 | limpo (espaço, linha em branco, caractere invisível) e **sem contato**: telefone, e-mail, "@usuario" ou link são recusados (R11.6, `limparSobre()`) |
| turnos | lista de `{ dia: dom…sab, periodo: manha · tarde · noite }` | a grade "Na academia"; sem repetir |
| visivelAosAlunos | booleano | a chave "Mostrar meu perfil aos alunos"; **começa falso**, só o profissional liga (R11.4) |
| visivelDesde? | instante | R11.8: o consentimento — quando a chave foi ligada |
| ocultadoPeloDono | booleano | R11.7: vence a chave; com ele verdadeiro, a chave do profissional fica travada; só o dono desfaz |
| atualizadoEm | instante | |

**Não entram, de propósito**: telefone, e-mail, endereço ou qualquer contato (R11.6); preço, valor de aula ou de pacote (R11.10, o Alex pediu); nota, estrela, contagem de alunos ou de visualizações (R11.9).

| | o próprio profissional | aluno com vínculo **ativo** na academia | equipe ativa da academia | dono (vínculo ativo) | aluno pendente, sem academia ou de outra academia |
|---|---|---|---|---|---|
| Ler | L (sempre, inclusive escondido ou com o vínculo encerrado) | L só se visível (*) | L só se visível (*) | L (todos, com o estado) | — |
| Escrever | E, menos `ocultadoPeloDono` e `crefConferido`; `visivelAosAlunos` travado se escondido | — | — | E só `ocultadoPeloDono` | — |

(*) **visível** = `visivel_aos_alunos` e não `ocultado_pelo_dono` e o vínculo do profissional `ativo` (R11.4). Com o vínculo encerrado, o perfil some na hora e o texto fica guardado (R11.7).

Forma da política (Postgres), para quem escrever a migração:

```sql
alter table perfis_profissionais enable row level security;

create policy perfil_ler on perfis_profissionais for select using (
  usuario_id = auth.uid()
  or tem_vinculo(academia_id, array['dono'])
  or (
    tem_vinculo(academia_id, array['aluno','recepcao','instrutor','personal'])
    and visivel_aos_alunos and not ocultado_pelo_dono
    and exists (select 1 from vinculos v
                where v.id = perfis_profissionais.vinculo_id and v.estado = 'ativo')
  )
);

create policy perfil_criar on perfis_profissionais for insert with check (
  usuario_id = auth.uid()
  and exists (select 1 from vinculos v
              where v.id = perfis_profissionais.vinculo_id and v.usuario_id = auth.uid()
              and v.academia_id = perfis_profissionais.academia_id and v.estado = 'ativo'
              and v.papel in ('recepcao','instrutor','personal','dono'))
  and not visivel_aos_alunos and not ocultado_pelo_dono and not cref_conferido
);

create policy perfil_editar_proprio on perfis_profissionais for update
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy perfil_esconder_dono on perfis_profissionais for update
  using (tem_vinculo(academia_id, array['dono'])) with check (tem_vinculo(academia_id, array['dono']));
```

**Qualifique as colunas da tabela dentro do `exists`** (`perfis_profissionais.academia_id`). Sem o prefixo, o Postgres resolve `academia_id` pela tabela mais próxima, `vinculos`, e a condição vira `v.academia_id = v.academia_id`, sempre verdadeira: um instrutor da academia A criaria um perfil com `academia_id` da academia B e apareceria aos alunos de B (achado S3 da revisão T, corrigido nesta forma).

A RLS decide a **linha**; a **coluna** fica com um gatilho `before insert or update` (`proteger_perfil_profissional`), porque as duas políticas de `update` se somam (`or`):

- na inserção e em toda mudança, `usuario_id` e `academia_id` têm de ser os do vínculo `vinculo_id` (segunda trava do S3, além do `with check`);

- `cref_conferido` só muda pelo `service_role` (a conferência, se existir); qualquer mudança de `cref` o volta a falso;
- `ocultado_pelo_dono` só muda se quem pede tem `tem_vinculo(academia_id, array['dono'])` e não é o dono do perfil;
- quem não é o dono do perfil (`usuario_id <> auth.uid()`) só pode mudar `ocultado_pelo_dono` e `atualizado_em`;
- `visivel_aos_alunos` não muda enquanto `ocultado_pelo_dono` é verdadeiro; ligá-lo grava `visivel_desde = now()`;
- `vinculo_id`, `usuario_id` e `academia_id` não mudam.

`dominio/perfil-profissional.ts` repete estas regras para a tela (`podeVerPerfil`, `editarPerfilProfissional`); quem protege é a política. Decisão de 11/10/2026 em `docs/decisoes.md`.

## 24. PedidoDeTreino — o aluno pede treino novo (P10)

R12.2, H97, F15. Código: `dominio/pedidos.ts`.

**PedidoDeTreino**: `id`, `alunoId`, `academiaId`, `recado?` (até 140 caracteres; pode ter dado de saúde escrito pelo aluno, "dor no joelho" — por isso nunca vai para notificação, log ou analytics, e entra na lista do `redigir.ts`), `estado` (`aberto` · `atendido` · `cancelado` · `recusado`), `criadoEm`, `fechadoEm?`, `fechadoPorId?`, `treinoEnviadoId?` (quando `atendido`).

- Um `aberto` por (aluno, academia): índice único parcial `where estado = 'aberto'`.
- Fecha sozinho como `atendido` quando a academia envia um treino ao aluno (F5 ou R12.4): a mesma função do servidor que grava o treino enviado fecha o pedido.
- Precisa de sinal (não entra na fila de envio).

| | o aluno (dono) | recepção / instrutor / personal da academia | dono |
|---|---|---|---|
| PedidoDeTreino | L / E (abrir com vínculo ativo; cancelar o seu) | L / E (recusar) | L / E (recusar) |

Nota sobre o recado: ele é escrito pelo aluno **para** a equipe ("A equipe da academia vai ler.", R12.2), e a folha que avisa é o consentimento para aquele texto; por isso a equipe lê o recado mesmo sem a autorização de dado de saúde (R6.4). Se o Alex preferir que o recado siga a autorização, a coluna `recado` sai do `select` da equipe sem autorização. Fica como pergunta, sem decidir.

## 25. Fila de envio (só no telefone) — com dono (R12.3, P10)

Não é tabela do servidor: é a tabela local `fila_de_envio` do SQLite (`03-DECISOES-TECNICAS.md`, seção 2). Entra aqui porque o dono de cada item é parte do dado.

**ItemDaFila**: `id`, `tipo` (`treino_realizado` · `refeicao_registrada`), **`usuarioId`** (a conta que registrou; tem de ser o `alunoId` da carga), `carga` (JSON do registro), `criadoEm` (instante com fuso), `tentativas`, `estado` (`pendente` · `falhou`), `ultimoErro?` (texto técnico, nunca o conteúdo). Regras em `dominio/sincronizacao.ts`: só sobe com a sessão **válida** da mesma conta; sessão vencida ou outra conta → fica guardado e a tela pede para entrar; sair da conta **não** apaga a fila.

---

## Relações (resumo)

```
Academia 1──n Vinculo n──1 Usuario
Academia 1──n Exercicio(camada=academia) ; Usuario(aluno) 1──n Exercicio(camada=criado_pelo_aluno)
Usuario(aluno) 1──1 PerfilDoAluno (por academia) 1──n HistoricoDeObjetivo
Usuario(aluno) 1──n MedicaoCorporal
Treino 1──n DiaDeTreino 1──n ExercicioDoDia 1──n Serie
Treino(copiado_de_pronto) n──1 Treino(pronto)  [copiadoDe]
ExercicioDoDia n──1 Exercicio
Usuario(aluno) 1──n Treino (alunoId; nulo = pronto da academia)
Usuario(aluno) 1──n TreinoRealizado 1──n SerieRealizada
Usuario(aluno) 1──n AssinaturaPlus n──1 Usuario(personal) ; AssinaturaPlus 1──n MudancaDeEstadoDaAssinatura
AssinaturaPlus 1──n PlanoDeDieta 1──n Refeicao 1──n ItemDeRefeicao ; Refeicao 1──n RefeicaoRegistrada
AssinaturaPlus 1──1 Conversa 1──n Mensagem   [decidir]
Usuario 1──n Dispositivo ; Usuario 1──1 PreferenciasDeAviso ; Vinculo(equipe) 1──1 PreferenciasDaEquipe
Academia 1──n AvisoDaAcademia 1──n AvisoDispensado n──1 Usuario(aluno)
Usuario 1──n AvisoEnviado (sem texto)
Vinculo(equipe) 1──0..1 PerfilProfissional
Usuario(aluno) 1──n PedidoDeTreino n──1 Academia ; PedidoDeTreino(atendido) n──1 Treino [treinoEnviadoId]
```

## Como isso vira RLS no Supabase

- Toda tabela tem RLS ligada. Toda tabela **raiz** que pertence a uma academia tem `academia_id` (nulo permitido onde o modelo diz). Ficam sem a coluna: `usuarios` (a conta não é de academia nenhuma) e as tabelas **filhas** que herdam a política do pai (dia, exercício do dia, série, série realizada, refeição, item, mensagem, mudança de estado da assinatura). `refeicoes_registradas` leva `academia_id` também: entra na fila offline sozinha e a política precisa dele sem subir até o plano.
- Funções SQL ajudantes: `tem_vinculo(academia_id, papeis text[])` → o usuário logado tem vínculo `ativo` com um dos papéis naquela academia; `aluno_autorizou(aluno_id, academia_id)` → `perfis_de_alunos.autoriza_academia`; `e_personal_de(aluno_id)` → há `AssinaturaPlus` em `ativo`/`cancelado_vigente` desse aluno com `personal_id = auth.uid()`.
- Cada política é uma linha das tabelas acima: `select` para quem tem L, `insert/update` para quem tem E. `delete` quase nunca: arquiva-se. Exceções com prazo (apagar treino realizado até 7 dias; medição no mesmo dia) ficam na própria política com `now()`.
- `assinaturas_plus.estado` só muda por função `security definer` chamada pelo webhook (ou pela recepção, se **[decidir]** a academia cobra); o app não tem `update` nessa coluna.
- Dia, exercício do dia e série **herdam** a política do treino via `exists (select 1 from treinos where ...)`. Refeição e item herdam do plano.
- R6.12: funcionário removido perde acesso na hora — a RLS consulta o vínculo a cada pedido, e o app força saída da visão ao receber recusa.

## Pendências que afetam o modelo

| [decidir] | Onde cabe nas duas respostas |
|---|---|
| Uma academia ou várias | `academiaId` em tudo; vínculo de aluno único ou não (R8.3); biblioteca `geral` visível a todos ou só a da academia (R2.7) |
| Quem paga o Plus | `origemDoPagamento` já tem `via_academia`; quem pode escrever `estado` (servidor ou recepção — R5.3, R5.7) |
| Dieta: texto livre ou banco de alimentos | `ItemDeRefeicao.descricao` é a v1; `alimentoId`/`quantidadeGramas`/`caloriasKcal` reservados |
| Chat próprio ou WhatsApp | `Conversa`/`Mensagem` só se chat próprio (R5.12) |
| Marca própria ou da academia | `Academia.marca` opcional |
| Quanto de gestão (mensalidade, catraca) | Fora do modelo; se entrar, vira `Mensalidade` ligada a `Vinculo` — **superado em 15/10/2026**: a gestão entrou, ver a Parte 2 abaixo |

---

# Parte 2 — Administração (Admin), P12

> Acrescentado pelo agente AI em 15/10/2026. É o modelo do **terceiro app** (`03-arquitetura/05-ADMIN.md`), no mesmo banco. As regras citadas (RA…) estão em `01-especificacao/admin/03-REGRAS.md`. Os tipos estão em `app/dominio/financeiro/tipos.ts`.
>
> **Turma, horário, aula, presença, graduação, evento, luta, interessado e aula experimental** são do modelo de luta (`01-especificacao/luta/`, agente AJ). Aqui entram só como chave estrangeira, exceto o que o Admin escreve.

Convenções que valem para toda a Parte 2:
- dinheiro em **centavos** (`integer`/`bigint`, com `check (x >= 0)` onde não pode ser negativo);
- percentual em **pontos-base** (`integer`, 1000 = 10 %);
- mês de referência `competencia` como texto `AAAA-MM`;
- `academia_id` em toda tabela raiz;
- nada se apaga: `arquivado`.

## 26. Quem acessa: as funções da RLS do Admin

```sql
-- dono ativo da academia
create function e_dono(academia uuid) returns boolean
  language sql stable security definer set search_path = public as $fn$
  select tem_vinculo(academia, array['dono'])
$fn$;

-- [decidir] A1: o papel "administrativo". Enquanto o Alex não decidir,
-- 'cobranca' também é só do dono. Se entrar, troca-se esta função e nada mais.
create function pode_financeiro(academia uuid, nivel text) returns boolean
  language sql stable security definer set search_path = public as $fn$
  select case nivel
    when 'tudo'     then e_dono(academia)
    when 'cobranca' then e_dono(academia)   -- depois: or tem_vinculo(academia, array['administrativo'])
    else false end
$fn$;
```

Leitura das tabelas de acesso abaixo: **D** = só o dono (`pode_financeiro(..., 'tudo')`); **C** = nível cobrança (`'cobranca'`, hoje igual a D); **—** = ninguém pelo app.

## 27. Pessoa (cadastro administrativo)

Existe **sem conta no app** (RA13.1). Não guarda dado de saúde.

| Campo | Tipo | Nota |
|---|---|---|
| id, academiaId | Id | |
| nome | texto, até 120 | |
| telefone?, email? | texto | o WhatsApp da cobrança (RA5.5) |
| documento? | texto | **[decidir] A17** (CPF); vazio por padrão |
| dataNascimento? | data | Kids: a idade decide a turma (R20, AJ) |
| responsavelPessoaId? | Id → Pessoa | menor: quem responde e paga |
| usuarioId? | Id → Usuario | liga à conta do app (RA13.5); único por academia |
| ehAluno, ehFuncionario, ehResponsavel | booleano | |
| observacao? | texto, até 500 | |
| criadaEm, atualizadaEm | instante | |

| | dono | administrativo ([decidir] A1) | equipe (app) | aluno (app) |
|---|---|---|---|---|
| Pessoa | L / E | L / E (sem `documento`) | L: nome e, para o check-in, se tem matrícula ativa (por função `security definer`, sem ver a tabela) | L: a própria e a dos dependentes (`usuario_id = auth.uid()` ou responsável) |

## 28. Funcionario

| Campo | Tipo | Nota |
|---|---|---|
| id, academiaId, pessoaId | Id | |
| funcao | `professor` · `recepcao` · `limpeza` · `administrativo` · `outro` | função no cadastro; o papel no app é o `Vinculo` |
| modalidadeIds | lista de Id | base da comissão (RA6.2) |
| remuneracao | `{ tipo: fixo · comissao · fixo_mais_comissao · por_aula · sem_remuneracao, fixoCentavos?, comissaoPontosBase?, valorPorAulaCentavos? }` | JSONB com `check` de forma, ou colunas |
| desde, ate? | data | |

Acesso: **D**. A remuneração é o dado mais sensível do Admin: nem o administrativo vê (RA1.3).

## 29. Modalidade

É do modelo de luta (R14.1). O Admin **escreve** a lista (Ajustes › Modalidades), e os três apps leem. O financeiro usa os campos `id`, `academiaId`, `nome` e `ativa`.

## 30. Plano

| Campo | Tipo | Nota |
|---|---|---|
| id, academiaId | Id | |
| nome | texto, até 60 | "Muay Thai 2×", "Combo 2 modalidades" |
| modalidadeIds | lista de Id | o check-in usa (R14.6) |
| aulasPorSemana? | inteiro 1–7 | ausente = livre |
| periodicidade | `mensal` · `trimestral` · `semestral` · `anual` · `gratuito` | RA3.6 |
| valorCentavos | inteiro ≥ 0 | valor de **um período** |
| taxaDeMatriculaCentavos? | inteiro ≥ 0 | RA3.9 |
| pesos? | `{ [modalidadeId]: número ≥ 0 }` | repartição do combo (RA3.11, [decidir] A10) |
| ativo | booleano | arquivar = falso |

| | dono | administrativo | equipe | aluno |
|---|---|---|---|---|
| Plano | L / E | L | L sem valor (nome e modalidades, para o check-in) | L o seu, se A2 |

## 31. Matricula

| Campo | Tipo | Nota |
|---|---|---|
| id, academiaId | Id | |
| pessoaId | Id → Pessoa | quem treina |
| pagadorPessoaId | Id → Pessoa | quem paga; no Kids, o responsável (RA3.10) |
| planoId | Id → Plano | |
| inicio, fim? | data | |
| estado | `ativa` · `trancada` · `encerrada` | |
| diaDeVencimento | inteiro 1–31 | mês curto encurta |
| descontos | lista de `{ tipo: percentual · valor, pontosBase? / centavos?, motivo: familia · bolsista · atleta · indicacao · funcionario · outro, ate?, origemPessoaId?, origemInteressadoId? }` | RA3.7, RA3.8; JSONB |
| trancadaDe?, trancadaAte? | data | RA3.4 |
| isentarTaxaDeMatricula? | booleano | |

Acesso: **C**. A equipe lê, por função, só "matrícula não encerrada nas modalidades X" para o check-in (R14.6). Nunca o valor nem o desconto.

## 32. Cobranca (a mensalidade e o resto que se deve)

| Campo | Tipo | Nota |
|---|---|---|
| id, academiaId | Id | |
| pessoaId | Id → Pessoa | **quem deve** (o pagador) |
| alunoPessoaId? | Id → Pessoa | quem treina, quando é outra pessoa (Kids) |
| matriculaId?, eventoId? | Id | |
| tipo | `mensalidade` · `matricula` · `graduacao` · `evento` · `produto` · `avulsa` | |
| competencia | `AAAA-MM` | |
| vencimento | data | |
| descricao | texto, até 200 | |
| valorBrutoCentavos, descontoCentavos, valorCentavos | inteiro ≥ 0 | `valor = bruto − desconto`, com `check` |
| estado | `aberta` · `paga` · `cancelada` | atrasada é **calculado** (RA5.1) |
| pagaEm?, valorPagoCentavos?, formaDePagamento?, lancamentoId? | | preenchidos juntos (`check`) |
| reparticao | lista de `{ modalidadeId, centavos }` | congelada (RA3.11); a soma = `valorCentavos` (`check` por gatilho) |
| criadaEm | instante | |

**Índice único parcial** `(matricula_id, competencia, tipo) where tipo in ('mensalidade','matricula')`: a geração não duplica nem com duas abas abertas (RA3.3).

| | dono | administrativo | equipe | aluno |
|---|---|---|---|---|
| Cobranca | L / E | L / E (marcar paga, desfazer) | **—** (R14.6a) | L as suas e as dos dependentes, se A2, sem `reparticao` |

`estado` muda só pelas funções `marcar_como_paga(cobranca_id, data, forma, valor)` e `desfazer_pagamento(cobranca_id)` (`security definer`). Cada uma cria ou arquiva o lançamento **na mesma transação**.

## 33. Lancamento (a linha da planilha)

| Campo | Tipo | Nota |
|---|---|---|
| id, academiaId | Id | |
| data | data | pago: quando entrou ou saiu; pendente: o vencimento |
| descricao | texto, 1–200 | |
| categoriaId? | Id → Categoria | do mesmo tipo (gatilho) |
| tipo | `entrada` · `saida` | |
| valorCentavos | inteiro > 0 | o sinal vem do tipo |
| formaDePagamento? | `pix` · `dinheiro` · `cartao_credito` · `cartao_debito` · `boleto` · `transferencia` · `outro` | |
| pessoaId? | Id → Pessoa | |
| situacao | `pago` · `pendente` | |
| reparticao? | lista de `{ modalidadeId, centavos }` | |
| origem | `manual` · `mensalidade` · `despesa_fixa` · `importacao` · `remuneracao` | |
| cobrancaId?, despesaFixaId?, importacaoId?, eventoId? | Id | |
| estimado? | booleano | despesa variável calculada pela média (RA4.8) |
| observacao? | texto, até 500 | |
| arquivado | booleano | "apagar" = arquivar (RA4.11) |
| criadoPor, criadoEm, atualizadoEm | | |

**Trava do mês fechado** (RA4.10): um gatilho `before insert or update` recusa a linha cuja `data` (a velha **ou** a nova) caia num mês com `FechamentoDoMes` sem `reabertoEm`. É a mesma regra de `podeAlterarLancamento`.

Acesso: **D**. O administrativo só cria linha pelo `marcar_como_paga`.

## 34. Categoria e RegrasDeCobranca

**Categoria**: `id`, `academiaId`, `nome` (até 60, único por academia e tipo, sem diferença de caixa), `tipo`, `ordem`, `arquivada`. A lista inicial é proposta (RA4.6). Acesso: **D** (o administrativo lê).

**RegrasDeCobranca** (uma por academia): as escolhas [decidir] guardadas como configuração, nunca como constante.

| Campo | Tipo | [decidir] |
|---|---|---|
| primeiroMes | `cheio` · `proporcional` · `a_partir_do_proximo` | A7 |
| atraso? | `{ multaPontosBase ≤ 200, jurosAoMesPontosBase ≤ 100, diasDeTolerancia 0–30 }` ou nulo | A3 (nulo = não cobra) |
| gerarSozinhoNoDia1 | booleano | A6 |
| diasParaRetornoDaExperimental | inteiro | A15 |
| descontoFamilia? | `{ tipo, valor }` | A8 |
| descontoIndicacao? | `{ tipo, valor, mesesDeDuracao, de?, ate? }` | A9 |
| whatsappDaAcademia | texto | — (o da Raça Fight é o do perfil) |

Acesso: **D**. Toda mudança vai ao histórico.

## 35. DespesaFixa

Campos:
- `id`, `academiaId`;
- `descricao`, `categoriaId?`;
- `valorCentavos`, `diaDeVencimento` (1–31);
- `formaDePagamento?`;
- `pessoaId?` (salário);
- `variavel` (média de 3 meses, RA4.8);
- `desde` / `ate?` (competência);
- `ativa`.

A geração mensal é idempotente por um índice único `(despesa_fixa_id, mês de data)` em `lancamentos where not arquivado`. Acesso: **D**.

## 36. FechamentoDoMes

Campos:
- `id`, `academiaId`, `competencia`;
- `totais` (JSONB: entradas, saídas, resultado, pendentes, quantidade);
- `porCategoria` (JSONB);
- `aReceberEmAberto`;
- `fechadoEm`, `fechadoPor`;
- `reabertoEm?`, `reabertoPor?`, `motivoDaReabertura?`.

Um fechamento ativo por (academia, competência): índice único parcial `where reaberto_em is null`. Reabrir **não apaga**: grava `reabertoEm`, e um novo fechamento cria outra linha. Fechar e reabrir só por função (`fechar_mes`, `reabrir_mes(motivo)`). Acesso: **D**.

## 37. Importacao

Campos:
- `id`, `academiaId`;
- `arquivoNome`, `formato` (`csv` · `xlsx` · `colado`);
- `mapeamento` (JSONB: índice, cabeçalho, papel);
- `linhasLidas`, `linhasGravadas`, `linhasRepetidas`, `linhasComErro`;
- `estado` (`conferindo` · `gravada` · `desfeita`);
- `porId`, `em`.

**O arquivo em si não é guardado**: só o que virou lançamento (minimização, LGPD). Desfazer arquiva as linhas com o `importacaoId` (RA8.5). Acesso: **D**.

## 38. Interessado e AulaExperimental (do modelo de luta, vistos pelo Admin)

Os campos são os do R19.1 e R19.3 (AJ). O Admin precisa de:
- `origem` (como conheceu: `instagram` · `whatsapp` · `indicacao` · `passou_na_porta` · `outro`; opcional);
- `indicadoPorPessoaId`;
- `contatoEm`;
- `matriculadoEm` e `pessoaId`, escritos pela função `matricular_interessado` (RA11.3) na mesma transação que cria a pessoa, a matrícula, os descontos e as cobranças;
- `desistiuEm` e `motivoDaDesistencia`.

A etapa do funil é **calculada** (`etapaDoInteressado`), e não há coluna para ela. Acesso: **D** lê e escreve tudo; a recepção e o professor, como o AJ define.

## 39. Nota, Lembrete e Tarefa

**Nota**: `id`, `academiaId`, `texto` (1–2.000), `pessoaId?`, `lancamentoId?`, `data?`, `valorCentavos?`, `fixada`, `arquivada`, `criadaPor`, `criadaEm`, `atualizadaEm`.

**Lembrete**:
- `id`, `academiaId`;
- `titulo` (1–120), `detalhe?`;
- `data` (a próxima ocorrência), `hora?` (`HH:MM`);
- `repeticao` (`nao_repete` · `semanal` · `mensal` · `anual`), `diaDoMes?`;
- `avisarDiasAntes` (0–60);
- `pessoaId?`, `valorCentavos?`, `despesaFixaId?`, `interessadoId?`;
- `concluidoEm?`, `ultimaConclusaoEm?`;
- `criadoPor`, `criadoEm`.

**Tarefa**: `id`, `academiaId`, `titulo`, `detalhe?`, `prazo?`, `responsavelPessoaId?`, `pessoaId?`, `feitaEm?`, `criadaPor`, `criadaEm`.

Acesso: **D**. Se A1 entrar, o administrativo vê a tarefa de que é responsável. O texto entra no `redigir.ts`.

## 40. FiltroSalvo

Campos: `id`, `academiaId`, `nome` (até 60), `alvo` (`alunos` · `funcionarios` · `lancamentos` · `cobrancas`), `filtro` (JSONB com a forma de `FiltroDeAlunos`, `FiltroDeLancamentos`…), `criadoPor`, `criadoEm`. Acesso: **D**.

## 41. Historico

Campos:
- `id`, `academiaId`;
- `tabela`, `registroId`;
- `acao` (`criou` · `mudou` · `arquivou` · `fechou` · `reabriu` · `importou` · `desfez_importacao`);
- `mudancas` (JSONB: `[{ campo, de, para }]`);
- `porId` (`auth.uid()`), `em` (`now()`);
- `motivo?`.

Quem grava é só o gatilho `after insert or update` de cada tabela das seções 27 a 40 (`security definer`). O motivo vem de `current_setting('app.motivo', true)` (`05-ADMIN.md`, seção 7). **Ninguém** tem `update` nem `delete`. O `select` é **D**.

Índices: `(academia_id, tabela, registro_id, em desc)` e `(academia_id, em desc)`. Guardar para sempre ou por N anos é [decidir] A14.

## Forma das políticas (para quem escrever a migração)

```sql
-- as tabelas só do dono
alter table lancamentos enable row level security;
create policy lancamentos_dono on lancamentos for all
  using (pode_financeiro(academia_id, 'tudo'))
  with check (pode_financeiro(academia_id, 'tudo'));
-- (iguais: categorias, despesas_fixas, fechamentos [só select; escrita por função],
--  importacoes, notas, lembretes, tarefas, filtros_salvos, funcionarios, regras_de_cobranca)

-- cobrança: dono e (se A1) administrativo; o aluno lê as suas se A2
alter table cobrancas enable row level security;
create policy cobrancas_financeiro on cobrancas for select
  using (pode_financeiro(academia_id, 'cobranca'));
-- escrita só por marcar_como_paga / desfazer_pagamento / gerar_mensalidades (security definer)

-- histórico: só leitura, só o dono; sem policy de insert/update/delete
alter table historico enable row level security;
create policy historico_ler on historico for select using (e_dono(academia_id));
```

A coluna `valor_centavos` de `planos` e `matriculas` **não** tem `grant select` para a equipe. A equipe lê o que o check-in precisa pela função `pode_fazer_checkin(pessoa_id, modalidade_id)` (R14.6).

## Relações da Parte 2 (resumo)

```
Academia 1──n Pessoa ; Pessoa 0..1──1 Usuario [usuarioId] ; Pessoa(menor) n──1 Pessoa(responsável)
Pessoa 1──0..1 Funcionario
Academia 1──n Modalidade (AJ) ; Plano n──n Modalidade [modalidadeIds]
Pessoa(aluno) 1──n Matricula n──1 Plano ; Matricula n──1 Pessoa(pagador)
Matricula 1──n Cobranca ; Cobranca 0..1──1 Lancamento
Academia 1──n Categoria 1──n Lancamento ; DespesaFixa 1──n Lancamento ; Importacao 1──n Lancamento
Evento (AJ) 1──n Lancamento, 1──n Cobranca
Interessado (AJ) 1──n AulaExperimental (AJ) ; Interessado 0..1──1 Pessoa [pessoaId, ao matricular]
Academia 1──n FechamentoDoMes (um ativo por competência)
Academia 1──n Nota, Lembrete, Tarefa, FiltroSalvo
toda tabela acima 1──n Historico
```
