# 04 — Regras novas (academia de luta)

> Agente AJ, P12, 15/10/2026. Continuam `01-especificacao/03-REGRAS.md` (a última seção era a 13). Numeração R14.1, R14.2… para citar em código e testes. **[decidir]** marca o que é do Alex; o número entre parênteses (L1…) é a pergunta em `90-PERGUNTAS-PARA-O-ALEX.md`. Quando um número é **proposta**, ele vale até o Alex dizer outro, e o código o guarda como configuração da academia, não como constante.
>
> Valem por cima de tudo as regras que ficam (inventário): LGPD (seção 6), unidades (seção 7), cronômetro (seção 9, menos R9.10), avisos (seção 10).

---

## 14. Modalidade, turma, horário e aula

### 14.1 Modalidade

- **R14.1** **Modalidade** é uma lista **da academia**, não do app: cada academia cadastra as suas no Admin (AI). Campos: nome, ativa, e zero ou mais **sistemas de graduação** (R16.1). A Raça Fight começa com cinco: **Muay Thai, Boxe, Jiu-Jitsu, Luta Livre, MMA**. "Kids" não é modalidade: é o público de uma turma (R14.2).
- **R14.1a** Uma lista **base** de chaves ajuda os modelos prontos e os filtros entre academias: `muay_thai`, `boxe`, `jiu_jitsu`, `luta_livre`, `mma`, `judo`, `karate`, `kickboxing`, `wrestling`, `outra` (com nome livre). A chave não aparece na tela; o nome sim.

### 14.2 Turma

- **R14.2** **Turma** é um grupo fixo com:
  - nome ("Muay Thai Kids", "Boxe — manhã");
  - **uma ou mais modalidades** (R14.3);
  - **público**: `adulto` · `kids` · `competicao` · `aberta` (R14.8);
  - **faixa de idade**, opcional (kids: por exemplo, de 6 a 12 anos; os números da Raça Fight são **[decidir]** L14);
  - **nível**: `todos` (padrão) · `iniciante` · `intermediario` · `avancado`;
  - **exigência**, opcional: faixa mínima numa modalidade ("roxa ou acima") ou "só atletas" (R14.9);
  - **professor responsável** e, opcionais, **professores auxiliares**;
  - os **horários** (R14.4);
  - **capacidade**, opcional (vazia = sem limite). Se a Raça Fight limita vagas é **[decidir]** L15; sem limite, não há reserva, só check-in;
  - ativa ou encerrada.
- **R14.2a** Turma é criada e editada no **Admin** (dono). O professor **vê** as turmas dele e cancela ou passa uma aula (R14.5), mas não muda horário nem público. **[decidir]** L16 se o professor também cria turma.

### 14.3 Turma com duas modalidades

- **R14.3** A turma pode ter **duas ou mais** modalidades quando elas dividem o mesmo tatame e o mesmo horário. É o caso real da Raça Fight: **Jiu-Jitsu / Luta Livre**, segunda e quarta às 20h. A presença nessa turma conta para **uma** modalidade por vez (R15.6).

### 14.4 Horário e aula

- **R14.4** **Horário** é dia da semana + hora de início + duração em minutos (inteiro), no **fuso da academia** (R7.4 vale para o registro; a grade é sempre no fuso da academia). A **grade** é o conjunto dos horários das turmas ativas.
- **R14.4a** **Aula** é a ocorrência de um horário numa data. Ela existe sem ninguém criar (a grade gera); só vira registro no banco quando alguém faz check-in, a chamada, ou a cancela. Assim, mudar a grade não deixa aulas futuras órfãs.
- **R14.4b** Mudar um horário vale **da próxima semana em diante**; as aulas já com presença ficam como foram.

### 14.5 Aula cancelada ou com substituto

- **R14.5** O professor da turma, a recepção e o dono podem **cancelar** uma aula (com motivo opcional: feriado, evento, outro) ou passá-la a um **substituto** (outro professor da modalidade). Só antes do horário de início. O Admin pode cancelar todas as aulas de uma data (feriado).
  - Cancelar avisa os alunos da turma (R22.2); os check-ins já feitos viram **retirados** com o motivo "aula cancelada" (R15.11).
  - O substituto vê a aula em "Hoje" e faz a chamada; a presença conta igual.

### 14.6 Quem pode fazer check-in numa aula

- **R14.6** Faz check-in (R15.2) o aluno que cumpre **tudo**:
  1. vínculo `ativo` com a academia (R8);
  2. **matrícula** não encerrada cujo **plano** inclui a modalidade da aula (a matrícula e o plano são do AI). Enquanto o Admin não existe, vale só o vínculo ativo (provisório);
  3. público compatível: turma `kids` só para **dependente** dentro da faixa de idade (R20); `competicao` só para atleta (R14.9);
  4. a exigência de faixa, se houver.

  Quem não cumpre vê a turma na grade, mas sem o botão, com o motivo em uma frase ("Esta turma é da equipe de competição. Fale com o seu professor."). **Nunca** com motivo financeiro.
- **R14.6a** **Mensalidade em atraso não bloqueia o check-in.** A inadimplência é assunto do Admin; o professor e o app do aluno não a mostram nem a usam (o dado financeiro é sensível, P12). Só a matrícula **encerrada** tira o direito. **[decidir]** L8 se a Raça Fight quer bloquear por atraso (aí o bloqueio é do Admin, com aviso ao aluno, nunca na frente do professor).

### 14.7 Matrícula e vínculo

- **R14.7** Quando o Admin matricula alguém que já tem conta (ou manda o convite), o **vínculo de aluno nasce `ativo`**, sem a confirmação da recepção do R8.1: a matrícula já é a confirmação. O aluno que chega pelo código ou pelo QR sem matrícula continua `pendente` e vê a vitrine (horários, professores, eventos, técnicas abertas) como o R12.9 já previa.
- **R14.7a** Matrícula **encerrada** no Admin encerra o vínculo de aluno do mesmo jeito que o R12.11 (o histórico, as presenças e as graduações ficam com o aluno).

### 14.8 Aula aberta (a "Sexta-feira OPEN")

- **R14.8** **Aula aberta** é um horário com público `aberta`: sem turma fixa, de todas as modalidades da academia (ou das que o dono marcar). Na Raça Fight, sexta das 20h às 22h.
  - Faz check-in qualquer aluno adulto com matrícula não encerrada (R14.6, sem a regra da modalidade).
  - No check-in, o aluno diz **o que vai treinar** entre as modalidades dele (o app lembra a última escolha). A presença conta nessa modalidade.
  - **[decidir]** L10: a presença da OPEN conta para a **graduação** ou só para a frequência? Recomendação: conta para a frequência; para a graduação, só se o professor do dia confirmar na chamada.
  - O professor do dia é o que o Admin escalar; sem escala, a recepção e qualquer professor fazem a chamada.

### 14.9 Treino de competição

- **R14.9** A turma com público `competicao` (na Raça Fight, sábado das 10h às 12h) aceita check-in só de **atletas**.
  - **Atleta** é uma marca no aluno, **por modalidade**, que o professor da modalidade liga e desliga ("Equipe de competição de Muay Thai"). Não é a área pública "Atletas" (R18.6), que depende do consentimento.
  - O professor pode marcar presente na chamada quem não é atleta (um convidado), com a origem `chamada`.
  - O aluno que não é atleta vê o horário com a frase de R14.6. A lista da equipe de competição não aparece para os outros alunos.

### 14.10 Objetivo

- **R14.10** A lista fixa de objetivos (R2.1) muda para luta. Proposta: **Aprender a lutar · Condicionamento · Defesa pessoal · Competir · Perder peso · Saúde e disciplina**. **[decidir]** L9. O objetivo continua opcional e continua tratado como dado de saúde (R6.1), porque "perder peso" e "saúde" falam do corpo.

### 14.11 A vitrine sem conta

- **R14.11** Sem entrar, qualquer pessoa vê no app: a grade, os professores com perfil visível (R11.4), as modalidades, o endereço, os eventos marcados como públicos, as perguntas frequentes (R22.3) e o botão da aula experimental (R19.2). Nada de aluno aparece na vitrine, nem nome, nem presença, nem faixa (a área Atletas só com o consentimento, R18.6).

---

## 15. Presença e check-in

- **R15.1** **Presença**: aula, aluno (ou dependente), modalidade, **origem** (`checkin` do aluno · `chamada` do professor · `recepcao` · `experimental` · `correcao`), **estado** (`pendente` · `confirmada` · `retirada`), o instante do registro (com fuso), quem confirmou ou retirou e quando, e o motivo da retirada.
- **R15.2** **Janela do check-in do aluno**: abre **30 min antes** do início e fecha **30 min depois** do início (proposta, **[decidir]** L7; configurável pela academia). Fora da janela, o botão "Estou na aula" não aparece. Duas aulas seguidas (Muay Thai às 20h e às 21h) têm duas janelas e duas presenças.
- **R15.3** Marcam presença por outra pessoa: o **professor** da aula (ou o substituto), a **recepção**, o **dono**, e o **responsável** pelo próprio dependente (dentro da janela). A presença marcada pela equipe nasce `confirmada`.
- **R15.4** **A chamada** (tela da aula, professor): mostra os check-ins `pendentes`, os alunos da turma que ainda não chegaram, os experimentais do dia (R19.5) e "+ Aluno". O professor toca para marcar e desmarcar; "Confirmar todos os check-ins" é um toque. **Fechar a chamada** confirma o que está marcado; o check-in que o professor desmarcou vira `retirada` ("não estava na aula").
- **R15.5** **Chamada esquecida**: os check-ins ainda `pendentes` às 23:59 do dia da aula (fuso da academia) viram `confirmada` sozinhos, com a marca "sem chamada". Eles contam para tudo. O professor pode retirar uma presença **até 7 dias** depois, com motivo. Motivo: o aluno nunca perde a presença porque o professor esqueceu de fechar a chamada.
- **R15.6** **Uma presença por aluno por aula.** Na turma de duas modalidades (R14.3), o aluno escolhe a modalidade no check-in, entre as dele, e o app lembra a última; se o plano dele tem só uma, nem pergunta. O professor pode trocar a modalidade na chamada. **[decidir]** L11 se a aula de Jiu-Jitsu / Luta Livre deve contar para **as duas** graduações de quem faz as duas (recomendação: uma só, a escolhida).
- **R15.7** O professor pode pôr na chamada um aluno de **outra turma** da mesma modalidade. Se o aluno não tem a modalidade na matrícula, a linha diz "Sem esta modalidade na matrícula" e a presença conta mesmo assim; quem resolve é o Admin. O professor não vê plano, valor nem situação de pagamento.
- **R15.8** **Presença retroativa**: professor, recepção e dono podem lançar uma presença numa aula **dos últimos 7 dias**, com motivo. O aluno não lança presença no passado.
- **R15.9** **Sem sinal**: o check-in do aluno e a chamada do professor gravam no aparelho e entram na **fila de envio**, como o treino realizado entrava (R1.24, R12.3: cada item com o dono da conta; sessão vencida não perde nada). O instante é o do aparelho. No servidor, aluno + aula é uma presença só: a ação do professor (confirmar, retirar) vence o check-in; entre duas ações do professor, vale a mais recente.
- **R15.10** **Frequência**: presenças `confirmadas` por semana e por modalidade. "Aluno ativo" (R8.5, adaptado) = ao menos uma presença confirmada nos últimos **30 dias**.
- **R15.11** Aula **cancelada**: os check-ins dela viram `retirada` com o motivo "aula cancelada", sem o aluno perder nada (não conta como falta).
- **R15.12** **Sumido**: sem presença confirmada há **14 dias ou mais** (o novo, até 90 dias de vínculo, há **7 dias**, R12.6 adaptado). A ordem e o selo "Sumiu esta semana" seguem o R13.8, contando pela última presença.
- **R15.13** **Quem vê a presença**: o aluno (as dele), o responsável (as do dependente), o professor (as das aulas e das modalidades dele), a recepção e o dono. **Colega não vê** quem fez check-in nem a frequência de ninguém. Presença é dado pessoal, não de saúde, mas o padrão de horários de uma pessoa diz onde ela está: nunca em log, analytics ou notificação com nome.
- **R15.14** Sem catraca, sem GPS e sem QR de check-in na v1: a confiança vem da chamada do professor (R15.4). **[decidir]** L17 se a academia quer um QR na parede ou um tablet no balcão depois.

---

## 16. Graduação

O porquê de cada escolha está em `02-MODALIDADES-E-GRADUACAO.md`.

- **R16.1** A graduação é um **dado**, não código. Cada modalidade tem **zero ou mais sistemas de graduação**, um por público (adulto, kids). Modalidade **sem** sistema (Boxe e MMA, pela pesquisa) não mostra faixa em lugar nenhum.
- **R16.2** **Sistema de graduação**: nome, modalidade, público, palavra do nível na tela (Faixa · Kruang · Prajied · Nível), palavra da subdivisão (Grau · nenhuma), como conta a idade (`ano_civil`: ano atual − ano de nascimento, como a IBJJF; ou `aniversario`), origem (modelo pronto ou "da academia"), e a lista ordenada de **níveis**. Cada nível: nome, de 1 a 3 cores (para o desenho), idade mínima, idade máxima, **tempo mínimo nele** em meses, **presenças mínimas** desde a última graduação, número máximo de graus, a regra entre graus (meses e/ou presenças, opcional) e se passar ao próximo exige exame.
- **R16.3** Os mínimos têm **duas origens**, e a tela diz qual é qual:
  - **da federação** (o modelo IBJJF traz idade e tempo mínimos do Art. 2 e 3). A academia não diminui;
  - **da academia** (presenças mínimas, tempo próprio maior, regra de graus). A academia define no Admin. **[decidir]** L5 e L19: os números da Raça Fight.
- **R16.4** O aluno tem **uma graduação atual por modalidade** (no sistema do público dele). Na primeira presença numa modalidade com sistema, o aluno ganha o **primeiro nível, grau 0**, com a origem `inicial` e a data da presença. O professor corrige se ele já tinha faixa (R16.8).
- **R16.5** **Kids → adulto**: no sistema IBJJF, no ano em que o aluno completa 16 (Art. 2.2.3), ele aparece para o professor com "Passa ao sistema adulto este ano". O app não escolhe a faixa adulta: o professor registra.
- **R16.6** **Registrar uma graduação**: o professor da modalidade ou o dono. Campos: nível, grau, data (não pode ser futura), **quem graduou** (padrão: quem registra; pode ser outro nome, por exemplo o mestre de fora num exame), observação curta (até 140), origem (`promocao` · `exame` · `inicial` · `anterior` · `correcao`). O aluno recebe a comemoração (H130) e um aviso na chave "Graduação" (R22.5). O app não confere se o professor pode graduar perante a federação (Art. 6 da IBJJF): ele guarda quem foi.
- **R16.7** **O tempo conta da data registrada no app.** A tela do aluno e a do professor dizem isso ("Tempo na faixa, contado pelo registro no app"). Não é prova perante a federação; a filiação continua com a federação.
- **R16.8** **Faixa trazida de outra academia**: origem `anterior`, com a data que o aluno informou e, opcional, o nome da academia de origem. O tempo conta dessa data.
- **R16.9** **A palavra na tela** vem do sistema: "faixa roxa, 2 graus" no jiu-jitsu, "kruang amarelo" no Muay Thai, nada no Boxe e no MMA. Os níveis do boxe, se a academia criar (L6), aparecem como "Nível intermediário".
- **R16.10** **O que o aluno vê**: a faixa atual e os graus em cada modalidade, o histórico, as presenças desde a última graduação e o tempo nela. **Não vê** "pronto para graduar" nem a régua de presenças mínimas da academia (**[decidir]** L20; recomendação: não mostrar, para a graduação continuar sendo decisão do professor e não uma cobrança do aluno).
- **R16.11** **"Atingiu os mínimos"**: a lista do professor junta os alunos das modalidades dele que cumprem, ao mesmo tempo, todos os mínimos definidos (tempo, presenças, idade) para o próximo grau ou o próximo nível. Ordem: há mais tempo cumprindo primeiro. Sem mínimos definidos pela academia, a lista mostra todos, por presenças desde a última graduação. **O app nunca gradua sozinho.**
- **R16.12** **Exame de graduação**: modalidade, data, hora, local, professores avaliadores, candidatos (da lista do R16.11 ou escolhidos à mão) e, depois, o resultado de cada um: `aprovado` (gera a graduação com origem `exame`), `nao_aprovado`, `faltou`. O candidato é avisado do exame; o resultado aparece **só para ele** (e o responsável) e para a equipe. A **taxa do exame**, se houver, é do Admin (AI); o app do aluno diz só "Taxa: veja com a recepção" até o AI definir.
- **R16.13** **Graduação não se apaga.** Se foi registrada por engano, o professor ou o dono a **anula** com motivo; ela some da tela do aluno e fica no histórico da equipe, riscada, com quem anulou e quando.
- **R16.14** **A graduação do professor** aparece no perfil dele ("Faixa preta, 2º grau"; "Kruang preto") na área Professores. É informada pelo próprio professor e pode ser confirmada pelo dono no Admin; a tela diz "informada pelo professor" até lá, como o CREF (R11.2).
- **R16.15** **Quem vê a graduação de um aluno**: ele, o responsável, a equipe da academia. **Outros alunos não**, salvo na área Atletas com consentimento (R18.6). Não é dado de saúde.

---

## 17. Cronômetro de rounds

O motor é o mesmo do R9 (instante, pausas, um cronômetro por vez, à prova de tela bloqueada). Muda o uso.

- **R17.1** O Cronômetro passa a existir **também no app da equipe**: o professor comanda o treino com ele (H144). Continua no aluno (para treinar em casa).
- **R17.2** **Predefinições de luta** no intervalado, cada uma editável antes de começar (o trabalho é o **round**, o descanso é o **intervalo**):

  | Predefinição | Preparação | Round | Intervalo | Rounds | Fonte |
  |---|---|---|---|---|---|
  | Boxe — 3 × 3 min | 10 s | 3 min | 1 min | 3 | AIBA 2016 / World Boxing (elite) |
  | Muay Thai — 3 × 3 min | 10 s | 3 min | 1 min | 3 | IFMA, regra 3 (sênior) |
  | MMA — 3 × 5 min | 10 s | 5 min | 1 min | 3 | Regras Unificadas (ABC) |
  | Rola de jiu-jitsu — 5 min | 10 s | 5 min | 1 min | 6 | prática de academia (a luta IBJJF de faixa branca adulta é de 5 min) |
  | Saco — 2 min | 10 s | 2 min | 30 s | 6 | prática de academia, ponto de partida |

  Tabata, EMOM e os HIIT continuam (o preparo físico existe na luta). As predefinições "da academia" (o professor salva as dele e elas aparecem para os alunos da modalidade) ficam **[decidir]** L21.
- **R17.3** Na tela, a fase se chama **"Round 2 de 3"** e **"Intervalo"**, não "Trabalho" e "Descanso", quando o cronômetro foi aberto por uma predefinição de luta.
- **R17.4** **Aviso dos 10 segundos**: em todo round de **60 s ou mais**, aos 10 s do fim, uma vibração média e o sinal sonoro curto (a "batida" que avisa o fim do round nas academias de boxe e Muay Thai). Liga e desliga na configuração do cronômetro (ligado nas predefinições de luta).
- **R17.5** **Som**: com o app aberto e o cronômetro na tela, o **gongo** no começo e no fim de cada round e a batida dos 10 s tocam pelo alto-falante, **mesmo com o celular no silencioso** (o professor põe o celular na caixa de som). Fora do app, valem as notificações locais do R9.11 (com o som delas). Continua **sem áudio em segundo plano** (decisão de 10/10, diretriz 2.5.4 da Apple). Volume e chave "Som" ficam na tela do cronômetro.
- **R17.6** **Tela do tatame**: com o cronômetro rodando, o botão "Tela cheia" esconde tudo menos a fase, o número e a rodada, em escuro, para ler de longe (o número no tamanho do R9.15). A tela não apaga (R9.13).
- **R17.7** **Sai**: registrar o tempo como série (R9.10) e a série por tempo. Em luta, o que fica registrado é a presença na aula, não o tempo do cronômetro.

---

## 18. Eventos, lutas e atletas

- **R18.1** **Evento**: nome, tipo (`exame` · `seminario` · `aulao` · `campeonato` · `luta` · `confraternizacao` · `outro`), modalidade(s), data e hora de início e fim, local (texto e endereço), descrição curta, **público** (só alunos · aberto na vitrine), e um link externo opcional (inscrição de campeonato). O link só pode ser `https://` e só em evento escrito pela equipe; **[decidir]** L22, porque o aviso da academia não tem link (R10.10).
- **R18.2** Criam evento: o professor (nas modalidades dele), a recepção e o dono.
- **R18.3** **"Vou participar"**: o aluno marca e desmarca. A lista de quem vai aparece para a equipe, nunca para outros alunos. A cobrança de inscrição, se houver, é do Admin (AI).
- **R18.4** **Luta**: um combate de um atleta da academia, ligado a um evento (o cartaz "[atleta] vs [adversário], 60 kg, semi-pró, Lomba do Pinheiro, 21/11/2026"). Campos: atleta (aluno da academia), modalidade, adversário (nome como no cartaz, texto livre), equipe do adversário (opcional), categoria (texto: "60 kg"), nível (`amador` · `semi_pro` · `profissional`), regras (texto opcional), data, local; depois o **resultado** (`vitoria` · `derrota` · `empate` · `sem_resultado`) e, opcional, como (pontos, nocaute, finalização, decisão). Cadastra o professor da modalidade ou o dono.
- **R18.5** **Peso e categoria**: o **peso medido** continua dado de saúde, em Meus dados (R6.1), só do aluno e de quem ele autorizou. A luta guarda a **categoria anunciada** ("60 kg"), que é o que o cartaz público já mostra. A categoria só aparece fora da equipe se o atleta estiver na área Atletas (R18.6).
- **R18.6** **Área "Atletas"** (o destaque do Instagram): mostra o atleta, a foto, as modalidades, a faixa e as lutas com resultado. Só aparece quem **ligou** a chave "Aparecer em Atletas", que nasce **desligada**, com a data guardada (consentimento, como o R11.8). Desligar tira na hora. Menor só com a autorização do responsável (R20.6). As lutas de quem **não** está na área aparecem só para a equipe, nem mesmo como "luta de um atleta da academia": luta é ligada a uma pessoa, e a pessoa decide se aparece.
- **R18.7** **Sem ranking, sem placar entre alunos**, sem "mais vitórias". Resultado é história do atleta, não competição dentro do app (mesma regra do R11.9).

---

## 19. Aula experimental, interessado e indicação

- **R19.1** **Interessado**: nome, WhatsApp, modalidade de interesse, se é para si ou para uma criança (com o nome e a idade dela), como conheceu (opcional), quem indicou (R19.9). Não precisa de conta. Quem registra: a recepção, um professor ou o dono. **Base legal**: procedimentos preliminares a um contrato, a pedido do titular (LGPD, art. 7º, V). Interessado que não vira aluno é **apagado 180 dias** depois da última aula experimental (proposta, **[decidir]** L23).
- **R19.2** **Agendar pelo WhatsApp (o caminho da v1)**: na vitrine e na entrada, o botão **"Agendar aula experimental grátis"** abre o WhatsApp da academia (`https://wa.me/<número com DDI>?text=<mensagem>`, o formato de link de conversa do WhatsApp) com a mensagem pronta: "Olá! Quero agendar uma aula experimental de [modalidade] na Raça Fight." A pessoa escolhe a modalidade antes (ou "Ainda não sei"). O número vem da configuração da academia no Admin (o da Raça Fight é o do perfil). O app **não registra** nada quando o botão é tocado: o registro nasce na recepção (R19.3). Sem WhatsApp instalado, o link abre o WhatsApp Web.
- **R19.3** **Aula experimental**: interessado, aula (turma e data, ou aula aberta), quem marcou, e o estado: `agendada` → `compareceu` · `faltou` · `remarcada` (vira outra) · `cancelada`; depois de `compareceu`: `matriculou` (quando o Admin matricula) ou `nao_seguiu`.
- **R19.4** **Uma experimental grátis por pessoa por modalidade** (proposta; **[decidir]** L24). A tela avisa a recepção quando o mesmo WhatsApp já fez uma.
- **R19.5** O professor vê o experimental **na chamada** da aula, com o selo "Experimental", o nome e a modalidade. Marcar presente põe a experimental em `compareceu`. Ele não vê o WhatsApp do interessado.
- **R19.6** Os números (experimentais no mês, quantas compareceram, quantas viraram matrícula, por modalidade) são do **Admin**, somados.
- **R19.7** **Termo da aula experimental**: luta tem contato e risco de lesão; academias costumam pedir um termo de responsabilidade e uma declaração de saúde antes da primeira aula. **[decidir]** L25 se a Raça Fight quer isso no app (e qual texto, com advogado). Se entrar, a declaração de saúde é **dado de saúde** (R6) e o termo do menor é assinado pelo responsável.
- **R19.8** Agendar **dentro do app** (escolher a aula e a vaga, sem WhatsApp) fica para depois da v1. Só faz sentido com capacidade por turma (L15).
- **R19.9** **Indicação ("Traga um amiguinho")**: o aluno toca "Indicar um amigo" e compartilha uma mensagem com o **código de indicação** dele (6 caracteres) e o link do WhatsApp da academia. A recepção digita o código ao registrar o interessado. Quando o indicado se **matricula** (Admin), a indicação vira `convertida` e os dois recebem o benefício que o Admin definir (desconto na mensalidade: AI). O aluno vê "Sua indicação virou matrícula" sem ver dado do indicado além do primeiro nome. **[decidir]** L26: o valor e as condições do desconto (promoção de data, ou sempre?).
- **R19.10** **Experimental de criança**: agendada pelo responsável, com o nome e a idade da criança; vale o R20 desde a primeira aula (a criança não tem conta, o responsável responde).

---

## 20. Kids: o responsável e o dependente

- **R20.1** **Na v1, a criança não tem conta.** Quem entra no app é o **responsável** (maior de 18), com um ou mais **dependentes**. O dependente é um aluno sem login: tem nome, data de nascimento, turmas, presenças, graduação, e a matrícula dele no Admin (quem paga é o responsável, AI).
- **R20.2** **Idade**: até **15 anos** o aluno é sempre dependente. De **16 a 17** a pergunta 16 antiga recomendava conta própria a partir de 16; **[decidir]** L27. Ao fazer 18, o dependente recebe um convite para ter a própria conta, e o histórico (presenças, graduações) vai com ele; o responsável deixa de ver.
- **R20.3** **Base legal** (LGPD, art. 14, e Enunciado CD/ANPD nº 1/2023): o tratamento de dado de criança e de adolescente segue o **melhor interesse** dela. Pode usar as bases dos arts. 7º e 11 (a matrícula é um contrato com o responsável), e o que pede consentimento (imagem; dado de saúde que não é necessário à aula) pede o consentimento **específico e em destaque** de um dos pais ou do responsável legal (art. 14, §1º). Coletar só o necessário à aula (art. 14, §4º).
- **R20.4** **O responsável vê**: as presenças, a faixa e o histórico, os avisos da turma, os eventos da turma, os resultados de exame do dependente. Faz o check-in do dependente dentro da janela (R15.3). Recebe as notificações dele (com o primeiro nome do dependente, nunca dado de saúde).
- **R20.5** **Saúde do dependente** (alergia, asma, restrição): opcional, preenchida só pelo responsável, vista pela equipe só se ele autorizar (R6.4, a mesma chave). **Contato de emergência** é o próprio responsável (telefone da conta) e um segundo opcional.
- **R20.6** **Autorização de imagem**, separada de todo o resto: nasce **desligada**; o responsável liga por dependente, com a data guardada, e desliga quando quiser. Sem ela, **nenhuma foto** do dependente aparece no app (Atletas, eventos, técnicas) e o app não guarda foto dele. A autorização do app **não** cobre as redes sociais da academia: isso é um termo da academia, fora do app, **[decidir]** L28 se o app deve registrar esse termo também.
- **R20.7** **A criança na chamada**: o professor da turma kids vê o primeiro nome, a faixa e, se autorizado, a restrição de saúde. Não vê o telefone do responsável na chamada (vê na ficha, se a academia der esse acesso ao professor, **[decidir]** L29; recomendação: só a recepção e o dono).
- **R20.8** **Sem conteúdo social para menor**: dependente não aparece em Atletas sem autorização, não tem lista de colegas, não recebe mensagem de ninguém.

---

## 21. Técnicas (biblioteca de vídeos)

- **R21.1** **Técnica**: modalidade, título ("Golpes básicos", "Golpes de curta distância"), nível (todos, iniciante, intermediário, avançado) ou faixa mínima, duração, professor que publicou, data, e o vídeo. Toma o lugar do exercício da biblioteca (R4) e dos treinos prontos.
- **R21.2** Publicam: o professor da modalidade e o dono. Rascunho até publicar; arquivar tira da lista sem apagar.
- **R21.3** **Onde fica o vídeo**: **[decidir]** L30. Opções: enviar o arquivo ao app (Supabase Storage; custo de armazenamento e de banda) · colar o link de um vídeo já publicado (Instagram, YouTube; o app abre fora). Recomendação para a v1: o link, porque os vídeos já estão no Instagram da academia.
- **R21.4** **Quem vê**: todo aluno com vínculo ativo vê as técnicas de **todas** as modalidades (é também vitrine); as marcadas "abertas" aparecem também sem conta. Faixa mínima esconde a técnica de quem está abaixo (proposta).
- **R21.5** Vídeo com **menor** só com a autorização de imagem do responsável (R20.6). Sem comentário, sem curtida, sem contagem de visualização (R11.9).

---

## 22. Avisos, perguntas frequentes e o que fica fora

- **R22.1** **Aviso da turma** (novo; o "aviso para um grupo" estava fora da v1 e entra pela luta): o professor responsável ou auxiliar escreve para **os alunos de uma turma dele** (e os responsáveis dos dependentes). Mesmas regras do aviso da academia (R10.10–R10.12: até 160 caracteres, sem link, sem citar aluno, sem saúde, sem resposta). Limite: **uma notificação por turma por dia**; os outros vão só como cartão no Início dos alunos da turma. Dono e recepção também escrevem aviso de turma. **[decidir]** L31 se o professor pode escrever o aviso para **todos** (hoje: dono e recepção, R10.10).
- **R22.2** **Aula cancelada avisa sozinha** (R14.5): "Aula de [turma] de hoje, 20:00, cancelada." Vai mesmo que a turma já tenha recebido aviso no dia, porque evita a viagem à toa; respeita o silêncio das 22h às 7h (o cancelamento feito no silêncio sai às 7h).
- **R22.3** **Perguntas frequentes ("Raça Responde")**: pergunta (até 120 caracteres) e resposta (até 600), em ordem escolhida, escritas no Admin pelo dono ou pela recepção. Aparecem na vitrine e no app do aluno. Sem dado de aluno.
- **R22.4** **Lembrete de aula** (substitui o lembrete de treino do R10): local, **desligado por padrão** (como o G2), o aluno liga por turma e escolhe a antecedência (30 min · 1 h · 2 h). Não toca se a aula foi cancelada (o aviso do R22.2 já foi). Respeita o silêncio e o limite de 3 por dia (R10.4, R10.6).
- **R22.5** **Chaves de aviso novas**: no aluno, "Graduação" (graduação registrada, exame marcado) e "Turmas" (aviso e cancelamento das turmas dele); na equipe, "Check-ins para confirmar" (resumo às 23:00 do dia, se ficou chamada aberta), "Experimentais de amanhã" (resumo às 18:00) e "Prontos para avaliar" (resumo semanal, segunda 09:00). Nenhum leva nome de aluno na tela bloqueada.
- **R22.6** **Fora da v1**: depoimentos de alunos no app (o perfil tem; envolve consentimento e moderação), loja (kimono, luvas: é do Admin se entrar), placar/ranking, chat entre alunos, catraca, GPS.
