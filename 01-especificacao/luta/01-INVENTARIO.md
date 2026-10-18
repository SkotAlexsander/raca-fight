# 01 — Inventário: o que fica, o que se adapta e o que sai

> Agente AJ, P12, 15/10/2026. Cada peça da especificação, do domínio e das telas que já existem, com o destino numa academia de luta (Raça Fight: Muay Thai, Boxe, Jiu-Jitsu, Luta Livre, MMA e turmas Kids).
>
> - **Fica**: serve como está (no máximo troca uma palavra).
> - **Adapta**: a ideia serve, o conteúdo muda. A linha diz o quê.
> - **Sai**: não faz sentido em academia de luta. **Sair não é apagar agora**: o código e o texto ficam até a onda de construção (AM) tirar, para nada quebrar no meio.
> - **Admin**: vai para o app do administrador (agente AI).
> - **[decidir]**: depende do Alex (`90-PERGUNTAS-PARA-O-ALEX.md`).

## Resumo em números

| Parte | Peças | Fica | Adapta | Sai | Vai ao Admin | [decidir] |
|---|---|---|---|---|---|---|
| Histórias (H01–H76 e H80–H114) | 111 | 25 | 25 | 32 | 9 | 20 |
| Regras (seções 1 a 13) | 13 seções | 4 | 5 | 2 | — | 2 |
| Fluxos (F1–F16) | 16 | 2 | 6 | 5 | — | 3 |
| Domínio (`app/dominio/`, módulos) | 12 | 3 | 5 | 4 | — | — |
| Telas do app (`app/telas/`, arquivos) | 50 | 21 | 16 | 8 | 1 | 4 |
| Design (partes grandes de `02-design/`) | 4 | — | 2 | 2 | — | — |

Das 20 histórias em [decidir], 19 são o Plus e a dieta (H46–H60, H82, H88, H89, H105) e uma é o app sem academia (H04).

### As peças maiores

| Peça | Tamanho | Destino |
|---|---|---|
| **Treino de musculação** (treino → dias → exercícios → séries, carga, volume): regras R1, `dominio/treino.ts` (770 linhas), Editar treino, Séries, Montar treino | o coração do app de musculação | **Sai.** Em luta, o treino é a **aula**. O que a pessoa registra é a **presença**, não a série. |
| **Modo treino** (`TelaModoTreino.tsx`, 657 linhas, sempre escuro, série a série, descanso) | a maior tela do app | **Sai** como modo de séries. O **visual** (escuro, tela cheia, número grande, anel) **volta no Cronômetro de rounds** (R17). |
| **Cronômetro** (`dominio/cronometro.ts`, 926 linhas, 3 modos, à prova de tela bloqueada) | o motor mais testado | **Fica e vira peça central.** O intervalado já é um cronômetro de rounds: trabalho = round, descanso = intervalo, rodadas = rounds. Ganha as predefinições de luta, o aviso dos 10 s e o sinal sonoro (R17). |
| **Catálogo de treinos prontos** (11 programas, 28 exercícios, `catalogo/`, `treinos-prontos/`) | 40 KB de JSON + 11 páginas | **Sai.** A biblioteca de **técnicas** em vídeo (R21) toma o lugar de "conteúdo da academia". |
| **Mapa muscular** (`02-design/anatomia/`, 124 KB de dados) | um sistema de desenho inteiro | **Sai.** Luta não se mede por músculo trabalhado. |
| **Plus com personal e dieta** (R3, R5, aba Plus, Dieta, Meus alunos Plus) | uma aba e 6 telas | **[decidir] L12 e L13.** Recomendação: congelar fora da v1 de luta. |
| **Painel do dono** (`TelaPainelDoDono.tsx`, números, Equipe, designar personal) | uma aba | **Vai ao Admin.** Sai da Equipe. |
| **Aviso da academia** (R10.10–R10.13, `avisos.ts`, telas de aviso) | regras e 3 telas | **Fica.** Ganha o aviso **para uma turma** (R22.1), escrito pelo professor. |
| **Equipe e perfil profissional** (R11, `perfil-profissional.ts`) | 4 telas | **Adapta** e vira o destaque **Professores**: especialidade vira modalidade, e entra a graduação do professor. |

---

## 1. Histórias (`01-HISTORIAS.md`)

| História | Destino | O que muda |
|---|---|---|
| H01, H02, H06, H07, H08 | Fica | Conta, Google/Apple, senha, sair, LGPD. |
| H03 | Adapta | "Vincular-se à academia" passa a acompanhar a **matrícula** (feita no Admin, AI). O código e o QR continuam para o aluno achar a academia no app. |
| H04 | **[decidir]** L2 | Usar o app sem academia não faz sentido num app de uma academia de luta. Recomendação: sem academia, só a aula experimental e a vitrine (horários, professores). |
| H05 | Fica | Trocar de visão (aluno que também é professor). |
| H09 | Adapta | O cadastro opcional continua (peso, altura, nascimento, restrições). O **objetivo** troca de lista (R14.10, [decidir] L9). |
| H10, H13, H14 | Fica | Pular o cadastro; escolher quem vê; ver quem vê. |
| H11 | Adapta | Registrar peso fica, agora com motivo de luta: **categoria de peso** para competir (R18.5). Continua dado de saúde. |
| H12 | Adapta | O objetivo muda, a lista é outra (L9). |
| H15–H21 | Sai (7) | Montar treino livre, exercício, séries, carga, reordenar, duplicar, treinos guardados. |
| H22–H28 | Sai (7) | Treinos prontos por objetivo e a biblioteca de prontos da academia. |
| H29 | Adapta | "O que faço hoje?" vira **"qual é a minha próxima aula?"** (H120). |
| H30, H31, H33, H34, H36 | Sai (5) | Marcar série, carga da última vez, trocar exercício, resumo com volume, registrar treino passado. |
| H32 | Fica | O cronômetro (descanso vira o intervalo entre rounds). |
| H35 | Adapta | "Registrar sem sinal" vale para o **check-in** e para a **chamada do professor** no tatame sem Wi-Fi (R15.9). |
| H37 | Adapta | O histórico vira **minhas presenças** por modalidade (H123). |
| H38 | Adapta | A lista de alunos é a do **professor**: os das turmas dele (H133). |
| H39 | Adapta | O perfil do aluno mostra **faixa, graus, presenças e turmas**; dado corporal só com autorização (R6.4, continua). |
| H40, H41 | Sai (2) | Montar treino para o aluno. |
| H42 | Adapta | "Sem treinar há 14 dias" vira **sem presença há 14 dias** (R15.12). |
| H43, H44 | Adapta | Vincular e confirmar o aluno: com a matrícula no Admin, o vínculo nasce **ativo pela matrícula** (R14.7). A confirmação manual fica para quem entrou pelo código sem matrícula. |
| H45 | Adapta | "Cadastrar exercício" vira **cadastrar técnica** (vídeo) na biblioteca da modalidade (R21). |
| H46–H60 (15) | **[decidir]** L12, L13 | O Plus com personal e dieta. Recomendação: fora da v1 de luta. Se ficar, vira "acompanhamento individual" (aula particular, preparação de atleta) e a dieta continua só por nutricionista. |
| H61 | Admin | Números da academia. |
| H62, H66 | Admin | Cadastrar e remover a equipe. |
| H63, H64 | Admin ([decidir] com o Plus) | Designar personal. |
| H65 | Adapta | Quem sumiu: o **professor** vê os sumidos das turmas dele (H137); o dono vê no Admin. |
| H67 | Admin | Código da academia. |
| H68 | Admin | A gestão (mensalidade, financeiro) agora entra: é o AI. |
| H69, H70, H72, H73, H76 | Fica | Livre, regressivo, abrir de qualquer lugar, tela bloqueada, ler a 1 m. |
| H71 | Adapta | O intervalado ganha as **predefinições de round** de cada modalidade (R17.2). |
| H74, H75 | Sai (2) | Salvar o tempo como série; série por tempo. Não há série. |
| H80, H83, H85 | Fica | Escolher avisos; silêncio das 22h às 7h; ver e dispensar o aviso. |
| H81 | Adapta | O lembrete de treino vira **lembrete de aula**, na hora das turmas do aluno (R22.4). |
| H82, H88, H89 | **[decidir]** (com o Plus) | Lembrete de dieta, aviso de Plus sem personal, aviso ao personal. |
| H84, H86 | Fica | Escrever e retirar o aviso para todos (dono e recepção). |
| H87 | Adapta | Os avisos da equipe trocam "pedidos para entrar" e "sem treinar" por **check-ins para confirmar**, **experimentais do dia** e **alunos prontos para graduar** (R22.5). |
| H90, H91, H95 | Adapta | O perfil profissional vira o destaque **Professores**: modalidades no lugar das especialidades de musculação, **graduação do professor** ("Faixa preta, 2º grau"), CREF opcional ([decidir] L18). Esconder pelo dono passa ao Admin. |
| H92, H93, H94 | Adapta | O aluno vê os professores por modalidade (H150); "Montado por" sai com o treino; "Meu personal", com o Plus ([decidir]). |
| H96–H99 | Sai (4) | Carga da última vez, pedir treino, fila do instrutor, dar treino pronto. |
| H100 | Adapta | Alunos novos (90 dias): o corte passa a ser **sem presença**, não sem treino. |
| H101 | Fica | Entrar pelo QR do balcão. |
| H102 | Fica | Confirmar vários de uma vez (recepção). |
| H103 | Admin | Encerrar o vínculo acompanha o fim da **matrícula**. |
| H104 | Admin | Resumo da semana ao dono. |
| H105 | **[decidir]** (Plus) | Lista do personal por atenção. |
| H106 | Fica | A fila offline nunca perde o que foi feito sem sinal (agora presenças). |
| H107, H108, H110, H113, H114 | Sai (5) | Fechar treino pela metade, primeiro treino em uso, lista do Modo treino, Plus em outro treino, recado na escolha do treino. |
| H109 | Fica | O aluno sem academia acha onde pôr o código. |
| H111 | Adapta | Cada papel abre na sua pergunta: o **professor** abre em **Hoje** (a aula da hora); o dono abre o Admin. |
| H112 | Fica | Quem sumiu há menos tempo primeiro (agora pela última presença). |

Contagem, conferida linha a linha: **fica 25** (H01, H02, H05–H08, H10, H13, H14, H32, H69, H70, H72, H73, H76, H80, H83–H86, H101, H102, H106, H109, H112) · **adapta 25** (H03, H09, H11, H12, H29, H35, H37–H39, H42–H45, H65, H71, H81, H87, H90–H95, H100, H111) · **sai 32** (H15–H28, H30, H31, H33, H34, H36, H40, H41, H74, H75, H96–H99, H107, H108, H110, H113, H114) · **Admin 9** (H61–H64, H66–H68, H103, H104) · **[decidir] 20** (H04, H46–H60, H82, H88, H89, H105). Total 111.

## 2. Regras (`03-REGRAS.md`)

| Seção | Destino | O que muda |
|---|---|---|
| 1. O que é um treino (R1.1–R1.24) | **Sai** | O treino de séries sai. Fica só o princípio do **R1.24** (o que foi feito sem sinal nunca se perde), agora para presença (R15.9). |
| 2. Objetivo (R2.1–R2.7) | Adapta | A lista fixa muda (L9). O filtro de treinos prontos sai junto com eles. |
| 3. Plano de dieta (R3) | **[decidir]** L13 | Fica congelado. Se voltar, só com nutricionista (Lei 8.234/91, já no P00). |
| 4. Exercício da biblioteca (R4) | Adapta | Vira **técnica** da modalidade, em vídeo (R21). Grupo muscular sai. |
| 5. Plus (R5) | **[decidir]** L12 | Congelado. |
| 6. Dado corporal e LGPD (R6) | **Fica** | E cresce: menores (R20), imagem de atleta (R18.6), dado financeiro (AI). |
| 7. Unidades | **Fica** | Carga em gramas some do uso; peso corporal fica (categoria de luta). Dinheiro em centavos ganha uso (AI). |
| 8. Vínculo (R8) | Adapta | O vínculo do aluno segue a **matrícula** (R14.7). "Aluno ativo" passa a ser quem teve **presença** em 30 dias, não quem registrou treino. |
| 9. Cronômetro (R9) | **Fica** e adapta | R9.1–R9.9 e R9.11–R9.16 ficam. **R9.10 (o tempo vira série) sai.** Entram as predefinições de luta, o aviso dos 10 s, o som, e o cronômetro também na Equipe (R17). |
| 10. Avisos (R10) | **Fica** e adapta | O lembrete de treino vira de aula; o aviso de turma entra (R22). |
| 11. Equipe e perfil profissional (R11) | Adapta | Especialidades → modalidades; graduação do professor; o "esconder" do dono vai ao Admin. Sem preço e sem nota continuam. |
| 12. Checagem P10 (R12.1–R12.14) | Adapta (parte) | Saem R12.1, R12.2, R12.4, R12.5, R12.7 (treino). Ficam R12.3 (fila com dono), R12.8 (QR), R12.9 (pendente já vê a vitrine), R12.10 (lote). R12.6 (novos 90 dias) adapta para presença. R12.11–R12.13 vão ao Admin. R12.14 é Plus ([decidir]). |
| 13. Segunda busca P11 (R13.1–R13.10) | **Sai** (quase toda) | R13.1–R13.3, R13.6, R13.9, R13.10 são de treino. Ficam R13.4 e R13.5 (sem academia, pendente). R13.7 adapta (professor abre em Hoje). R13.8 adapta (sumido por presença). |

## 3. Fluxos (`02-FLUXOS.md`)

| Fluxo | Destino | O que muda |
|---|---|---|
| F1 Primeiro acesso do aluno | Adapta | Ganha a porta do **interessado** (aula experimental) e a do **responsável** (Kids). Ver F17 e F23. |
| F2 Montar treino livre | Sai | |
| F3 Treino pronto por objetivo | Sai | |
| F4 Registrar treino feito | Sai | Em luta: F18 (check-in) e F19 (chamada). |
| F5 Montar treino para o aluno | Sai | |
| F6 Assinar o Plus | [decidir] | |
| F7, F8 Dieta | [decidir] (2) | |
| F9 Cronômetro | Adapta | Rounds, som, e também na Equipe (F21). |
| F10 Aviso para todos | Fica | Ganha o aviso para uma turma (F22). |
| F11 Ajustar avisos | Adapta | Lembrete de aula no lugar do de treino. |
| F12 Tocar na notificação | Fica | |
| F13 Entrada com duas portas | Adapta | A porta "Sou aluno" passa a ter "Quero conhecer" (F17); a porta "Sou da academia" serve a professor e recepção; o dono vai ao Admin. |
| F14 Equipe e perfil profissional | Adapta | Vira "Professores". O F14.3 (dono esconde) vai ao Admin. |
| F15 Fluxos curtos P10 | Adapta (parte) | Ficam QR, lote e sessão vencida; saem dar treino pronto, pedir treino, treino para trocar; encerrar vínculo vai ao Admin. |
| F16 Fluxos curtos P11 | Sai (quase todo) | Fica "entrar numa academia depois" e "quem sumiu esta semana" (por presença). |

## 4. Domínio (`app/dominio/`)

| Módulo | Linhas | Destino | O que muda |
|---|---|---|---|
| `cronometro.ts` (+ teste de 27 KB) | 926 | **Fica** | Predefinições novas (R17.2) e o aviso de "faltam 10 s" (R17.4) entram como dado e um tipo de aviso a mais; o motor não muda. `serie_por_tempo` e `criarSerieRealizadaDeTempo` deixam de ser usados (R9.10 sai). |
| `unidades.ts` | 383 | **Fica** | `formatarCarga` e o incremento de carga deixam de ser usados. `formatarReais` e `lerDataBrasileira` servem ao AI. |
| `sincronizacao.ts` | 191 | **Fica** (a regra) | Os tipos da fila trocam: sai `treino_realizado` e `refeicao_*` (se a dieta sair); entram `checkin` e `chamada` (R15.9). A regra de dono do item, sessão vencida e conflito continua. |
| `tipos.ts` | 624 | Adapta | Entram Modalidade, Turma, Horário, Aula, Presença, SistemaDeGraduacao, Graduacao, Exame, Evento, Luta, Interessado, AulaExperimental, Tecnica, Responsavel/Dependente. Saem Treino, Dia, ExercicioDoDia, Serie, TreinoRealizado, PedidoDeTreino (na onda AM). `Especialidade` vira a lista de modalidades. |
| `avisos.ts` | 631 | Adapta | O lembrete de treino vira lembrete de aula (calcula pela grade); entra o aviso de turma; o resto (silêncio, limite, agrupar, validar o aviso de 160) fica. |
| `perfil-profissional.ts` | 364 | Adapta | Especialidades → modalidades; graduação do professor; o resto (sem contato, chave, esconder) fica. |
| `acompanhamento.ts` | 120 | Adapta | `sumiuEstaSemana`, `ordenarPorFiltro` e `diasEntreDatas` ficam, contando presença; `adesaoDaDieta` e `motivosDoNaoSegui` dependem da dieta ([decidir]). |
| `papel.ts` | 35 | Adapta | O dono abre o **Admin**, que é outro app: `decidirDestino` passa a mandar o dono ao Admin (ou, se ele também é professor, à Equipe). |
| `treino.ts` (+ teste de 26 KB) | 770 | **Sai** | |
| `andamento.ts` | 76 | **Sai** | Situação do exercício, o que falta, nascer em uso. |
| `pedidos.ts` | 92 | **Sai** | Pedido de treino. |
| `catalogo/` (catalogo.ts, 2 JSON) | 303 + 49 KB | **Sai** | |

Os testes de `revisao-t*.test.ts`, `propriedades.test.ts` e `seguranca-t.test.ts` seguem os módulos que testam: os do cronômetro, da fila e do redigir ficam; os de treino saem com ele.

**Domínio novo** (proposta para a onda AM; o AJ não escreve código): `presenca.ts` (janela de check-in, uma presença por aula, contagem por modalidade), `graduacao.ts` (elegibilidade, tempo e presenças desde a última graduação, idade), `grade.ts` (gerar as aulas da semana a partir dos horários, feriado, aula cancelada), `experimental.ts` (estados da aula experimental, link do WhatsApp). Cada um com o teste antes, como o resto.

## 5. Telas (`app/telas/`)

### Aluno

| Tela | Destino | O que muda |
|---|---|---|
| `TelaInicio` | Adapta | Herói: **a próxima aula** com "Estou na aula"; a faixa atual; o aviso; o próximo evento. |
| `TelaTreinos` | Adapta | Vira a aba **Treinos**: minhas presenças, minha graduação, cronômetro. |
| `TelaTreinoPronto`, `TelaEditarTreino`, `TelaSeries` | Sai (3) | |
| `TelaModoTreino` | Sai | O visual volta no Cronômetro de rounds. |
| `TelaComemoracao` | Adapta | Comemora a **graduação** (faixa ou grau novo), não o treino fechado. Mesma cor cheia e mesmo check contido. |
| `TelaCronometro` | **Fica** | Predefinições de luta, aviso dos 10 s, som. |
| `TelaEvolucao` | Sai | Carga e volume por músculo não servem. A evolução em luta é a faixa e a frequência (aba Treinos). |
| `TelaHistorico`, `TelaTreinoFeito` | Adapta (2) | Viram **Minhas presenças** e o detalhe de uma aula. |
| `TelaPlus`, `TelaDieta` | **[decidir]** (2) | |
| `perfil/TelaPerfil`, `TelaMeusDados`, `TelaQuemPodeVer`, `TelaAvisos`, `TelaConta`, `TelaSuaAcademia` | Fica (6) | Meus dados ganha a categoria de peso (opcional); Avisos troca o lembrete; Perfil ganha "Meus dependentes" (R20) e "Minha matrícula" (leitura, do AI). |
| `perfil/TelaEquipe`, `TelaProfissional` | Adapta (2) | Viram **Professores** e o perfil do professor, com modalidade e graduação. |
| `comum/AbasDoAluno` | Adapta | As abas novas (`06-MAPA-DE-TELAS.md`). A faixa do cronômetro fica; a faixa "treino em andamento" sai. |
| `comum/Pecas`, `comum/Tela`, `comum/PilhaDaAba` | Fica (3) | |
| `estado/ProvedorDoAluno` | Adapta | Sai o treino em andamento; entram a próxima aula, o check-in e as graduações. O cronômetro único fica. |

### Equipe (visão da academia)

| Tela | Destino | O que muda |
|---|---|---|
| `TelaAlunos` | Adapta | Alunos das turmas do professor; filtros: prontos para graduar, sumidos (presença), novos, Kids, experimentais. |
| `TelaPerfilDoAluno` | Adapta | Faixa e histórico, presenças por modalidade, "Registrar graduação". Saem montar e dar treino. |
| `TelaMontarTreino`, `envio.tsx`, `TelasDeProntos` | Sai (3) | |
| `TelaMeusAlunosPlus`, `TelaAlunoPlus` | **[decidir]** (2) | Seguem o Plus (recomendação: fora da v1). |
| `TelaPainelDoDono` | **Admin** | Sai da Equipe. |
| `TelasDeAviso` | **Fica** (1) | Ganha o aviso para a turma. |
| `TelasDaEquipe` | Adapta | Perfil da equipe e "Meu perfil profissional" ficam (modalidades, graduação); a "Equipe do dono" (esconder) vai ao Admin. |
| `PortaDaAcademia` | Adapta | O professor abre em **Hoje**. |
| `PilhaDaAba`, `pecas.tsx` | Fica (2) | |
| `dados-da-academia.ts` | Adapta | As leituras passam a ser turma, aula, presença e graduação; "sumido" conta pela presença. |

### Entrada e compartilhado

| Tela | Destino | O que muda |
|---|---|---|
| `entrada/TelaBoasVindas` | Adapta | Terceira saída: **"Quero conhecer · aula experimental grátis"** (F17). |
| `entrada/TelasDeConta`, `TelasDaEquipe`, `pecas.tsx` | Fica (3) | |
| `entrada/TelasDoAluno` | Adapta | O objetivo troca de lista; entra "É para mim · É para meu filho ou filha" (R20). |
| `compartilhado/*` (5 arquivos) | Fica (5) | Escolher visão, estados, catálogo, provisória, conta de exemplo. |

### Rotas (`app/navegacao/`)

Saem `(aluno)/modo-treino`, `treinos/[id]`, `treinos/series`, `treinos/pronto/[id]`, `treinos/evolucao`, `inicio/treino-feito/[id]` (vira detalhe da aula), `(academia)/alunos/montar/[id]`, `(academia)/biblioteca/*`, `(academia)/painel/*` (Admin). `(academia)/acompanhamento/*` e `(aluno)/plus/*` esperam o [decidir]. As rotas novas estão no mapa de telas.

## 6. Design (só o destino; nada foi mexido)

| Pasta | Destino |
|---|---|
| `02-design/anatomia/` (mapa muscular) | **Sai.** |
| `02-design/imagens/treinos/` (capas dos 11 treinos prontos) e as ilustrações de exercício | **Sai.** As fotos de luta da Raça Fight (`referencias/raca-fight/fotos/`) tomam o lugar, com autorização e sem menores sem consentimento dos responsáveis. |
| `02-design/sistema-de-design/` (vidro, foto, escala, um herói por tela, cronômetro, comemoração) | **Adapta** (AL): mesma linguagem, cor da Raça Fight (vermelho `#C42024`, preto, branco). |
| Ícones (haltere da aba Início, anilha) | **Adapta** (AL): luva, faixa, relógio de round. |
