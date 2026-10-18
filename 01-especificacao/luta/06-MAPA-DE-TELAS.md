# 06 — Mapa de telas novo: aluno e equipe (academia de luta)

> Agente AJ, P12, 15/10/2026. Substitui as Partes 2, 3 e 6 de `01-especificacao/04-MAPA-DE-TELAS.md` para a academia de luta; as Partes 1/1b (entrada), 4 (avisos) e 5 (cronômetro) continuam, com as mudanças escritas aqui. O **Admin** é outro app (AI, `01-especificacao/admin/`). O desenho é da próxima onda (AL, AK); aqui só o que cada tela faz. Convenções iguais às do mapa antigo ("folha" sobe de baixo; [decidir] com o número da pergunta).

## Abas: o que muda

| App | Antes | Agora (proposta) |
|---|---|---|
| **Aluno** | Início · Treinos · Plus · Perfil | **Início · Horários · Treinos · Academia · Perfil** |
| **Equipe — professor** | Alunos · Treinos · Plus (personal) · Academia (dono) · Perfil | **Hoje · Turmas · Alunos · Graduação · Perfil** |
| **Equipe — recepção** | Alunos · Treinos · Perfil | **Hoje · Alunos · Experimentais · Perfil** |
| **Dono** | a aba Academia na visão da academia | **o app Admin** (AI). Se também dá aula, entra na Equipe como professor. |

Por quê:
- **Os nomes vêm dos destaques do Instagram** da Raça Fight (Atletas, Treinos, Horários, Professores), que é como a academia já se apresenta. "Horários" e "Treinos" viram abas; "Professores" e "Atletas" moram na aba **Academia**, junto com Eventos, Técnicas e "Raça Responde". Cinco abas é o máximo que o sistema já aceitava (a visão da academia tinha até 5).
- **A aba Plus sai** enquanto o Plus for [decidir] (L12). Se o Alex mantiver o Plus, ele volta como linha em Perfil ou como sexta entrada da aba Academia, não como aba (a decisão de 10/10 já dizia que aba de anúncio para quem não assina não se justifica).
- **"Hoje" é a primeira aba do professor** porque a pergunta dele ao abrir o app é "qual é a minha aula agora?" (R13.7 adaptado). A da recepção também, com todas as aulas do dia.
- **"Graduação" é aba própria do professor** porque é o trabalho que ele faz fora da aula e o que mais diferencia o app de luta.
- **[decidir]** L32: as cinco abas do aluno com estes nomes.

---

## Parte A — Vitrine e entrada (sem conta)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Boas-vindas** (adapta) | Separar quem treina, quem trabalha e quem quer conhecer. | Foto de luta, a frase "Treine com disciplina, técnica e respeito", as duas portas e a linha **"Quero conhecer · aula experimental grátis"**. | Sou aluno · Sou da academia · Quero conhecer |
| **Conheça a [academia]** (nova, vitrine) | Mostrar a academia a quem ainda não é aluno. | Modalidades em cartões (foto, uma frase), atalhos Horários · Professores · Raça Responde · Atletas (só os que consentiram), endereço e mapa (abre o app de mapas). Botão fixo "Agendar aula experimental grátis". | Abrir cada parte · Agendar |
| **Qual modalidade?** (folha) | Pôr a modalidade na mensagem do WhatsApp. | As modalidades e as turmas Kids, mais "Ainda não sei". | Escolher → abre o WhatsApp (R19.2) |
| **Horários**, **Professores**, **Perfil do professor**, **Raça Responde**, **Eventos abertos** | Os mesmos da aba Academia/Horários, só leitura, sem check-in. | — | — |
| **Quem vai treinar?** (nova, na entrada do aluno) | Separar aluno adulto de responsável. | Eu · Meu filho ou filha · Os dois. | Escolher |
| **Dependente** (nova) | Cadastrar a criança. | Nome, data de nascimento, saúde (opcional), autorização de imagem (desligada). | Salvar |
| **Objetivo** (adapta) | A pergunta opcional da entrada. | A lista nova (R14.10, L9). | Continuar · Pular |

As telas de conta (como entrar, e-mail, criar conta, código, esqueci a senha) ficam como estão.

---

## Parte B — App do aluno

### Aba Início

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Início (aluno)** (adapta) | Responder "qual é a minha próxima aula?" em um olhar. | Saudação e o sino. O cartão **Aviso** (da academia ou da turma, o mais recente). O **herói: a próxima aula** — hora, turma, modalidade, professor, foto da modalidade — com **"Estou na aula"** na janela (R15.2) ou "Abre às 19:30"; com dependente, um cartão por pessoa. **Sua semana**: as aulas da semana em bolinhas (feita, hoje, ainda não). **A faixa** de cada modalidade, pequena, com "14 aulas desde a última graduação". O **próximo evento**. Atalhos: Cronômetro · Técnicas · Indicar um amigo. | Estou na aula · Desfazer · Abrir a aula · Dispensar aviso · Abrir evento · Atalhos |
| **Hoje você treina…** (folha) | Escolher a modalidade na turma dupla ou na OPEN. | As modalidades do aluno, a última marcada. | Escolher |
| **Comemoração da graduação** (adapta a Comemoração) | Marcar o dia da faixa ou do grau. | Cor cheia, a faixa desenhada com os graus, "Faixa azul, 4º grau.", a data, quem graduou. Sem confete, sem exclamação. | Pronto |

### Aba Horários (nova)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Horários** | Ver a grade da semana. | Dias em chips (hoje marcado); em cada dia, as aulas por hora: hora, turma, modalidade, professor, selo Kids/Competição/OPEN, "Cancelada" riscada. Filtro: "Minhas modalidades" (padrão) · Todas. | Trocar dia · Filtrar · Abrir turma |
| **Turma** | Saber se a turma é para mim. | Nome, modalidade(s), público, nível, exigência, professor (link ao perfil), os horários, "Aviso da turma" mais recente. Se não pode fazer check-in, a frase de R14.6. | Abrir professor · Ligar lembrete desta turma (R22.4) |

### Aba Treinos (adapta a antiga)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Treinos** | Ver o que fiz e onde estou. | Chips por modalidade. **Minhas presenças**: o mês em calendário (aula feita, cancelada, hoje), as semanas com a contagem. **Minha graduação**: a faixa (kruang) atual com os graus, tempo nela ("desde 12/03/2026, pelo registro no app"), aulas desde a última; o histórico. Linha **Cronômetro**. | Trocar modalidade · Abrir uma aula · Abrir histórico · Cronômetro |
| **Aula feita** (adapta "Treino realizado") | Rever uma presença. | Data, turma, professor, modalidade, estado (confirmada, sem chamada). | Voltar |
| **Histórico de graduação** | A história do aluno na modalidade. | Cada graduação: faixa e grau, data, quem graduou, origem (exame, promoção, anterior). | Voltar |
| **Cronômetro** (fica, R17) | Rounds em casa. | Livre · Regressivo · Intervalado com as predefinições de luta; som; aviso dos 10 s; tela cheia. | Os do R9 e do R17 |

### Aba Academia (nova)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Academia** | Reunir o que a academia mostra. | Linhas grandes: **Professores** · **Atletas** · **Eventos** · **Técnicas** · **Raça Responde** · Endereço e WhatsApp. | Abrir cada uma |
| **Professores** (adapta Equipe) | Conhecer quem ensina. | Chips por modalidade; lista: foto, nome, modalidades, graduação ("Faixa preta, 2º grau"). Sem nota nem contagem (R11.9). | Filtrar · Abrir |
| **Perfil do professor** (adapta) | Saber quem é. | Foto, nome, modalidades e graduação em cada uma, formação, CREF se houver ("informado pelo professor"), "Sobre mim", as turmas dele (no lugar da grade de turnos). | Abrir turma |
| **Atletas** (nova) | Mostrar quem compete pela academia. | Só quem consentiu (R18.6): foto, nome, modalidades, faixa, lutas recentes com resultado. Sem ranking. | Abrir atleta |
| **Atleta** | A história de um atleta. | Lutas (data, adversário, categoria, nível, resultado), graduação. | Voltar |
| **Eventos** (nova) | Ver o que vem. | Próximos e passados: data, tipo, local, modalidade; lutas de atletas que consentiram. | Abrir · Vou participar |
| **Evento** | Os detalhes. | Descrição, data, local (abre mapas), link externo se houver (L22), "Vou participar". | Vou participar · Abrir local |
| **Técnicas** (nova, R21) | Rever técnica em casa. | Chips por modalidade e nível; cartões com título, professor, duração. | Abrir |
| **Técnica** | Ver o vídeo. | O vídeo (ou o link, L30), título, professor, nível. | Assistir |
| **Raça Responde** (nova, R22.3) | Tirar dúvida. | Perguntas em lista que abre e fecha. | Abrir pergunta |

### Aba Perfil (fica, com linhas novas)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Perfil (aluno)** | Conta e dados. | Como antes, mais: **Meus dependentes** (se tiver), **Minha matrícula** (plano e situação, só leitura, do Admin; o que mostrar é do AI), **Indicar um amigo**, **Aparecer em Atletas** (só para quem é atleta, R14.9). Sem academia: "Tenho um código". | Abrir cada item |
| **Meus dados** (fica) | Cadastro opcional. | Como antes; o objetivo com a lista nova. A **categoria de luta** não fica aqui (é da luta, R18.5). | Editar · Registrar peso |
| **Meus dependentes** / **Dependente** (novas) | Cuidar das crianças. | Lista; em cada uma: presenças, faixa, turmas, saúde (opcional), **autorização de imagem**. | Editar · Ligar/desligar imagem |
| **Indicar um amigo** (folha, nova) | "Traga um amiguinho". | O código, a mensagem pronta, as indicações (primeiro nome e estado). | Compartilhar |
| **Aparecer em Atletas** (folha, nova) | Consentir com prévia. | A prévia do cartão de atleta e a frase. | Aparecer · Agora não |
| **Avisos** (adapta) | Escolher avisos. | Cronômetro · Lembrete de aula (por turma, antecedência) · Turmas · Graduação · Avisos da academia. Sai o lembrete de treino; os do Plus esperam L12. | Ligar/desligar |
| **Quem pode ver**, **Conta**, **Sua academia** (ficam) | — | — | — |

**Sai do aluno**: Treinos prontos, Ver treino pronto, Editar treino, Escolher exercício, Séries, Modo treino, Evolução, Registrar treino passado, Pedir treino novo. **Espera L12/L13**: Plus (apresentação, ativo), Dieta do dia, Plano de dieta.

---

## Parte C — App da equipe: professor

### Aba Hoje (nova; primeira aba)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Hoje (professor)** | "Qual é a minha aula agora?" | O herói: a aula da hora (ou a próxima) com o número de check-ins e de experimentais. Embaixo, as outras aulas dele hoje; "Aulas em que você substitui". Atalhos: **Cronômetro** · **Eventos** · **Aviso para uma turma**. | Abrir aula · Cronômetro · Eventos · Aviso |
| **Aula (chamada)** | Confirmar quem veio. | Os três grupos do F19 (check-ins, da turma sem check-in, experimentais), "+ Aluno de outra turma", a faixa de cada um, o selo "Sem esta modalidade na matrícula" quando for o caso. "Fechar a chamada". Kids: o primeiro nome e, se autorizado, o ícone de restrição de saúde. | Marcar · Desmarcar · Confirmar todos · + Aluno · Trocar modalidade · Fechar · Cronômetro |
| **Cronômetro** (equipe) | Comandar os rounds. | O do aluno, com as predefinições de luta e a tela cheia. | Os do R17 |
| **Eventos** (equipe) | Cuidar dos eventos. | Os eventos; em cada um, quem vai participar (só a equipe vê). | + Evento · + Luta · Resultado |
| **Novo evento** / **Nova luta** / **Resultado** | Cadastrar. | Os campos do R18.1 e R18.4. | Salvar |

### Aba Turmas (nova)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Turmas (professor)** | Ver as turmas dele. | Cada turma: nome, modalidade, horários, quantos alunos ativos, presença média por aula nas últimas 4 semanas. Sub-chip **Técnicas** (as da modalidade dele). | Abrir turma · Técnicas |
| **Turma (equipe)** | Cuidar da turma. | Os próximos horários (cancelar, passar a substituto), os alunos com faixa e última presença, os avisos da turma. A turma em si (horário, público) é editada no Admin. | Cancelar aula · Passar aula · Aviso para a turma · Abrir aluno |
| **Novo aviso da turma** | Escrever para a turma. | O Novo aviso de sempre, com "Vai para N alunos e responsáveis da turma X". | Enviar |
| **Técnicas (professor)** / **Nova técnica** | Publicar vídeo. | Lista com rascunho e publicadas; campos do R21.1. | Publicar · Arquivar |

### Aba Alunos (adapta)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Alunos (professor)** | Achar um aluno das modalidades dele. | Busca; filtros: **Todos** · **Sumidos (14+ dias)** · **Novos (90 dias)** · **Kids** · **Atletas** · **Atingiram os mínimos**. Linha: nome, faixa, última presença, selos. | Buscar · Filtrar · Abrir |
| **Aluno (equipe)** (adapta Perfil do aluno) | Saber quem é na luta. | Nome, desde quando, as modalidades com a faixa e os graus, presenças por semana (8 semanas), turmas; **Graduação** (histórico, "Registrar graduação", "Registrar faixa anterior", "Anular" com motivo); chave **Atleta** por modalidade (R14.9). Dados corporais só se autorizou (R6.4, como antes). **Nada financeiro.** | Registrar graduação · Faixa anterior · Marcar atleta · Ver presenças |
| **Registrar graduação** (folha) | O passo do F20.1. | Próximo grau sugerido, faixa, data, quem graduou, observação. | Registrar |

### Aba Graduação (nova)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Graduação** | O trabalho de graduar. | Chips por modalidade. **Atingiram os mínimos** (R16.11). **Kids que passam ao sistema adulto este ano** (R16.5). **Exames** (próximos e passados). Com a régua da modalidade a um toque ("Ver o sistema de graduação"). | Abrir aluno · + Exame · Abrir exame · Ver sistema |
| **Exame** | Marcar e fechar o exame. | Data, local, avaliadores, candidatos; no dia, o resultado de cada um. | + Candidato · Resultado · Fechar exame |
| **Sistema de graduação** (leitura) | Lembrar a régua. | Os níveis com cores, graus, idade e tempo mínimos (federação) e presenças (academia). Quem edita é o Admin. | Voltar |

### Aba Perfil (fica)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Perfil (equipe)** | Conta do professor. | Como antes: Meu perfil profissional (agora com modalidades e graduação), Avisos da equipe (as chaves novas do R22.5), Trocar de visão, Sair. | Abrir cada item |
| **Meu perfil profissional** (adapta) | O que os alunos veem em Professores. | Nome de exibição, foto, modalidades, **graduação em cada uma** (informada, R16.14), formação, CREF opcional, "Sobre mim", a chave "Mostrar meu perfil aos alunos". | Editar · Ligar/desligar |

---

## Parte D — App da equipe: recepção

| Aba | Telas | O que faz |
|---|---|---|
| **Hoje** | Hoje (recepção), Aula (chamada) | Todas as aulas do dia; check-in de quem chega pelo balcão (busca), dentro da janela; a chamada se o professor pedir. |
| **Alunos** | Alunos, Aluno (equipe) | Todos os alunos; filtros como o professor, mais **Vínculo pendente** (com "Confirmar todos", R12.10). Não registra graduação. |
| **Experimentais** (nova) | Experimentais, Nova experimental, Experimental | A lista por estado (agendadas, hoje, compareceram sem matrícula, faltaram); "+ Nova" (F17, passo 5); marcar compareceu/faltou/remarcar; "Matricular" (leva ao Admin). Interessados antigos somem em 180 dias (L23). |
| **Perfil** | Perfil (equipe), Avisos da equipe, Avisos da academia | O aviso para todos continua aqui e no topo de Alunos (R10.10). |

---

## Parte E — O que sai da equipe

- **Painel do dono** (Academia em números), **Equipe** do dono (esconder perfil, papéis), **Alunos Plus (gestão)**, **Configurações da academia** (código, QR, "entrar sem confirmação") → **Admin** (AI).
- **Treinos prontos (academia)**, **Editar treino pronto**, **Exercícios da academia**, **Montar treino para aluno**, **Editar treino (modo academia)**, **Dar treino pronto** → saem.
- **Meus alunos Plus** e **Aluno Plus (personal)** → esperam L12.

## Contagem

| App | Telas | Folhas |
|---|---|---|
| Vitrine e entrada | 3 novas (Conheça, Quem vai treinar, Dependente); a vitrine reusa 5 telas do aluno só para leitura | 1 (Qual modalidade?) |
| Aluno | 26: Início, Horários, Turma, Treinos, Aula feita, Histórico de graduação, Cronômetro, Comemoração, Academia, Professores, Perfil do professor, Atletas, Atleta, Eventos, Evento, Técnicas, Técnica, Raça Responde, Perfil, Meus dados, Meus dependentes, Dependente, Avisos, Quem pode ver, Conta, Sua academia | 3 (Hoje você treina, Indicar um amigo, Aparecer em Atletas) |
| Equipe — professor | 20: Hoje, Aula, Cronômetro, Eventos, Novo evento, Nova luta, Resultado, Turmas, Turma, Novo aviso da turma, Técnicas, Nova técnica, Alunos, Aluno, Graduação, Exame, Sistema de graduação, Perfil, Meu perfil profissional, Avisos da equipe | 2 (Registrar graduação, Fechar a chamada) |
| Equipe — recepção | as do professor que ela usa (Hoje, Aula, Alunos, Aluno, Perfil, Avisos) mais 3 de Experimentais (lista, nova, detalhe) | — |

No aluno, **13 telas são novas** (Horários, Turma, Histórico de graduação, Academia, Atletas, Atleta, Eventos, Evento, Técnicas, Técnica, Raça Responde, Meus dependentes, Dependente), **8 saem** (Treinos prontos, Ver treino pronto, Editar treino, Escolher exercício, Séries, Modo treino, Evolução, Registrar treino passado) e **4 esperam o Plus** (Plus apresentação, Plus ativo, Dieta do dia, Plano de dieta). Na equipe, **4 vão ao Admin**, **6 saem** e **2 esperam o Plus**.
