# 03 — Regras de negócio

Este arquivo define as regras que o código vai obedecer: o que é um treino, um objetivo, uma dieta, como o Plus liga e desliga, quem vê dado de saúde e em que unidade tudo é guardado.
Quando uma regra depende de uma pendência do P00, as duas versões estão na mesma linha, marcadas **[decidir]**.

Numeração: R1.1, R1.2… para ser citada em código e testes.

---

## 1. O que é um treino

Um treino tem quatro níveis: **treino → dias → exercícios do dia → séries**.

### 1.1 Treino

- **R1.1** Um treino tem: nome, dono (um aluno, ou a academia quando é treino pronto), origem, objetivo(s) opcional(is), nível opcional (iniciante, intermediário, avançado), descrição curta opcional, data de criação, e um estado (ativo, guardado, arquivado).
- **R1.2** A **origem** é uma destas: `livre` (o aluno montou), `pronto` (modelo da biblioteca da academia), `copiado_de_pronto` (cópia que o aluno fez de um pronto; guarda a referência ao original), `montado_pela_academia` (um funcionário montou para o aluno), `montado_pelo_personal` (no Plus).
- **R1.3** Um aluno pode ter quantos treinos quiser guardados, mas **só um ativo por vez**. Marcar um como ativo tira o selo do anterior, que fica guardado. (Recomendação; ver pergunta 2 em `90-PERGUNTAS-PARA-O-ALEX.md`.)
- **R1.4** Treino pronto da academia nunca é usado "ao vivo": o aluno sempre recebe uma **cópia**. Editar o modelo não altera as cópias já feitas. A cópia guarda de qual modelo veio e a versão dele na data da cópia.
- **R1.5** Treino arquivado some das listas, mas continua existindo: o histórico de execuções dele permanece legível.
- **R1.6** Um treino com zero dias pode existir (rascunho), mas não pode ser marcado como ativo.
- **R1.7** Quem monta o treino para o aluno (academia ou personal) não edita o treino `livre` do aluno. Ele cria um treino novo com a origem certa. O aluno pode editar a cópia que recebeu da academia; o treino `montado_pelo_personal`, enquanto o Plus está ativo, só o personal edita (o aluno ajusta carga na execução, não a estrutura).

### 1.2 Dia de treino (divisão)

- **R1.8** Um dia tem: ordem (1, 2, 3…), nome curto obrigatório (padrão "A", "B", "C"; o aluno pode renomear para "Peito e tríceps"), observação opcional.
- **R1.9** Um treino tem de 1 a 7 dias.
- **R1.10** "Dia" é uma divisão, não um dia da semana. O app sugere o dia seguinte ao último executado (fez A, sugere B; fez o último, volta ao A). O aluno sempre pode escolher outro.

### 1.3 Exercício do dia

- **R1.11** Um exercício do dia aponta para um **exercício da biblioteca** (nome, grupo muscular, como fazer, imagem opcional) e tem: ordem dentro do dia, observação opcional ("pegada fechada"), tipo de medida (`repeticoes` ou `tempo`), e a lista de séries.
- **R1.12** A biblioteca de exercícios tem duas camadas: a **geral do app** (todo mundo vê) e a **da academia** (só quem está vinculado a ela vê). Um aluno pode criar um exercício só com nome (`criado_pelo_aluno`); ele fica só para aquele aluno. (Ver pergunta 7.)
- **R1.13** O mesmo exercício pode aparecer mais de uma vez no mesmo dia (ex.: drop set separado), cada um com suas séries.

### 1.4 Série

- **R1.14** Uma série planejada tem: ordem, **repetições** (inteiro ≥ 1) ou **tempo em segundos** (inteiro ≥ 1) conforme o tipo do exercício, **carga em gramas** (inteiro ≥ 0, opcional — vazio significa "sem carga definida", diferente de 0 que significa "peso do corpo"), **descanso em segundos** (inteiro ≥ 0; padrão 60).
- **R1.15** Valores padrão ao adicionar um exercício: 3 séries × 12 repetições, carga vazia, descanso 60 s. Exercício do tipo tempo: 3 séries × 30 s.
- **R1.16** Uma série pode ser marcada como aquecimento; não entra no cálculo de volume.

### 1.5 Treino realizado (execução)

- **R1.17** Um treino realizado tem: aluno, treino de origem, dia executado, data (ISO `AAAA-MM-DD`, no fuso do aluno), hora de início e fim com fuso, duração em segundos, observação opcional ("como foi"), e a lista de **séries realizadas**.
- **R1.18** Uma série realizada tem: exercício, ordem, repetições ou tempo **reais**, carga **real** em gramas, estado (`feita`, `pulada`), e a referência à série planejada (pode ser nula se o exercício foi trocado na hora).
- **R1.19** Exercício trocado na hora (aparelho ocupado) fica registrado no treino realizado como `substituto_de` o exercício planejado. O treino planejado não muda.
- **R1.20** **Volume** de um treino realizado = soma de (repetições × carga em gramas) das séries feitas, excluídas as de aquecimento e as do tipo tempo. É mostrado em kg na tela.
- **R1.21** O treino realizado pode ser registrado para uma data passada. Não pode ser para uma data futura.
- **R1.22** Um treino realizado pode ser apagado pelo aluno em até 7 dias; depois disso fica só editável (observação), para o histórico da academia não mudar.
- **R1.23** "Última carga" mostrada na execução = carga real da última série feita daquele exercício, em qualquer treino realizado do aluno, mais recente primeiro.
- **R1.24** Registro **sem conexão**: o app grava localmente e envia quando há sinal. Se o mesmo treino realizado existir nos dois lados, vale o mais recente por hora de fim. Nunca se perde um registro feito sem sinal.

---

## 2. O que é um objetivo e como filtra treinos prontos

- **R2.1** Objetivo é uma lista fixa do app (não é texto livre), para que o filtro funcione igual em toda academia. Lista da v1: `emagrecer`, `ganhar_massa`, `condicionamento`, `iniciante`, `saude_e_manutencao`. (Ver pergunta 8.)
- **R2.2** O aluno tem **zero ou um** objetivo no cadastro. Pode mudar quando quiser; a mudança fica no histórico com data.
- **R2.3** Um treino pronto tem **um ou mais** objetivos. Um treino de "iniciante" pode servir também a "emagrecer".
- **R2.4** Filtro padrão em "Treinos prontos": mostra os treinos cujo conjunto de objetivos contém o objetivo do aluno. Se o aluno não tem objetivo, mostra todos. O aluno sempre pode trocar o filtro ou escolher "Todos".
- **R2.5** Filtros secundários: nível e número de dias. Nunca escondem um treino por falta de dado do aluno.
- **R2.6** Ordem padrão da lista: treinos do objetivo do aluno primeiro, depois por nível (iniciante primeiro), depois por nome.
- **R2.7** O aluno sem academia não vê treinos prontos de nenhuma academia. **[decidir]** Se várias academias: uma biblioteca "geral do Academia Plus" visível a todos pode existir · Se uma academia só: a biblioteca da academia é a única.

---

## 3. O que é um plano de dieta

Estrutura: **plano → refeições → itens**. Só existe dentro do Plus.

- **R3.1** Um plano de dieta tem: aluno Plus, personal que montou, nome, data de início, data de fim opcional, observação geral, estado (`em_vigor`, `futuro`, `encerrado`), e a lista de refeições.
- **R3.2** Um aluno tem **no máximo um plano em vigor por data**. Enviar um novo plano com data de início X encerra o anterior em X − 1 dia.
- **R3.3** Uma refeição tem: ordem, nome, horário sugerido (HH:MM, opcional), marca `opcional` (não conta na adesão), e a lista de itens.
- **R3.4** Um item tem: ordem e **[decidir]** Texto livre (descrição com quantidade escrita: "150 g de frango grelhado") · Alimento do banco de alimentos + quantidade em gramas (inteiro) + calorias e macros calculados. Em qualquer versão, o item pode ter uma "troca permitida" em texto.
- **R3.5** O plano é **copiável**: "Copiar e ajustar" cria um plano futuro com as mesmas refeições e itens, para o personal editar.
- **R3.6** O **registro do dia** é separado do plano: para cada data e cada refeição do plano em vigor, o aluno pode marcar `feita` (com hora) ou `nao_segui` (com motivo opcional). Sem marca = `a_fazer`.
- **R3.7** **Adesão do dia** = refeições feitas ÷ refeições não opcionais do plano. Adesão de 7 e 30 dias = média dos dias com plano em vigor.
- **R3.8** Alterar um plano em vigor não apaga as marcas já feitas. Se uma refeição é removida, as marcas dela ficam no histórico e saem do cálculo.
- **R3.9** O aluno **não edita** o plano; só marca. Pode escrever o motivo e conversar.

---

## 4. O que é um exercício da biblioteca

- **R4.1** Campos: nome, grupo muscular principal (lista fixa: peito, costas, ombros, bíceps, tríceps, pernas, glúteos, abdômen, cardio, corpo inteiro), grupos secundários opcionais, tipo de medida padrão (`repeticoes` ou `tempo`), como fazer (texto curto), imagem opcional, camada (`geral`, `academia`, `criado_pelo_aluno`).
- **R4.2** Exercício da academia só é editado por funcionário/personal/dono dela. Exercício geral só pelo time do app (fora do app, na v1).
- **R4.3** Exercício não se apaga se algum treino o usa: arquiva-se. Treinos antigos continuam legíveis.

---

## 5. Como o Plus liga e desliga

### 5.1 Estados

- **R5.1** A assinatura Plus de um aluno está em um destes estados: `sem_plus`, `ativo`, `cancelado_vigente` (cancelou, mas pago até uma data), `inativo` (acabou ou não renovou), `suspenso` (pagamento falhou; prazo de carência). Só `ativo` e `cancelado_vigente` liberam as funções Plus.
- **R5.2** Toda mudança de estado fica no histórico com data, hora e motivo.

### 5.2 Ligar

- **R5.3** **[decidir]** Aluno assina no app: o estado vira `ativo` quando o pagamento é confirmado (loja ou meio próprio — ver `03-arquitetura/`) · Academia cobra junto da mensalidade: um funcionário liga o Plus no perfil do aluno; o estado vira `ativo` na hora e a cobrança acontece fora do app.
- **R5.4** Ao ativar, o aluno **autoriza o personal** a ver cadastro corporal e histórico de treino. É condição do Plus e está escrito na tela de assinatura. A autorização vale apenas para o personal designado, não para toda a academia.
- **R5.5** O personal é designado pelo dono (ou pela recepção, se o dono permitir). Até haver personal, o aluno vê "Aguardando seu personal" e nenhuma função falha; só não há treino nem dieta ainda.
- **R5.6** Troca de personal: o novo recebe acesso ao mesmo tempo em que o antigo perde. Os treinos e planos montados pelo antigo continuam no histórico, assinados por ele.

### 5.3 Desligar

- **R5.7** Cancelar: o estado vira `cancelado_vigente` até o fim do período pago; depois `inativo`. **[decidir]** Se a academia cobra, a recepção desliga e o estado vai direto a `inativo` na data que ela escolher.
- **R5.8** Pagamento falhou: `suspenso` por 7 dias com aviso ao aluno; se não resolver, `inativo`.

### 5.4 O que acontece com os dados quando o Plus desliga (`inativo`)

- **R5.9** O **personal perde acesso imediato** ao cadastro corporal, histórico, dieta e conversa do aluno.
- **R5.10** O **treino montado pelo personal** continua com o aluno: a origem passa a `montado_pelo_personal` com selo "Personal: até [data]" e vira editável pelo aluno, como qualquer treino dele.
- **R5.11** O **plano de dieta** fica **só leitura** para o aluno: ele vê, não marca mais refeições, e as marcas antigas continuam no histórico dele.
- **R5.12** A **conversa** fica só leitura para o aluno (se chat próprio). **[decidir]** Chat próprio: histórico preservado para o aluno, invisível para o personal · WhatsApp: nada a fazer no app, o histórico está no WhatsApp.
- **R5.13** **Nada é apagado** ao desligar. Se o aluno reassinar, o mesmo personal (se ainda estiver na academia) recupera o acesso e o histórico inteiro aparece de novo para ele.
- **R5.14** Os números do dono (quantos Plus) contam só `ativo` e `cancelado_vigente`.

---

## 6. Quem enxerga dado corporal (LGPD)

### 6.1 O que é dado sensível neste app

- **R6.1** São dados de saúde: peso (e o histórico de pesagens), altura, data de nascimento, restrições e lesões, objetivo, plano de dieta, marcas de refeição e motivos, conversa com o personal. Nome, foto, academia, treino montado e frequência **não** são dados de saúde, mas são pessoais e seguem as regras gerais.
- **R6.2** Dado de saúde **nunca** vai para log, mensagem de erro, ferramenta de analytics, notificação push visível na tela bloqueada, nem para e-mail. Notificação diz "Seu personal enviou sua dieta", não o conteúdo.

### 6.2 Quem vê o quê

- **R6.3** O **aluno** vê tudo que é dele.
- **R6.4** A **academia** (funcionário, personal, dono) vê o cadastro corporal de um aluno **só se ele autorizou**. A autorização nasce ligada ao vincular-se à academia, com texto explícito na tela, e pode ser desligada a qualquer hora em Perfil → Meus dados. Desligar tem efeito imediato.
- **R6.5** Sem autorização, a academia vê: nome, foto, data de vínculo, treino ativo (nome, dias e exercícios — para orientar na sala) e frequência. Não vê peso, altura, idade, restrições nem objetivo.
- **R6.6** O **personal** vê o cadastro corporal, o histórico, a dieta e a conversa **só dos alunos Plus designados a ele**, enquanto o Plus estiver ativo. Essa autorização é parte do Plus (R5.4) e não é desligável separadamente: se o aluno não quer que o personal veja, cancela o Plus.
- **R6.7** O **dono** não tem acesso individual maior que o funcionário. Os números da academia são agregados (contagens e médias), sem nome e sem dado de saúde.
- **R6.8** O aluno vê, em "Quem pode ver meus dados", a lista do que está autorizado (academia sim/não; personal X enquanto Plus).

### 6.3 Direitos do aluno

- **R6.9** **Exportar**: o aluno baixa um arquivo com todos os dados dele (perfil, treinos, execuções, dieta, marcas, conversa) em formato legível.
- **R6.10** **Apagar a conta**: apaga tudo que identifica o aluno. Os treinos realizados viram registros anônimos só para os números da academia (contagem de treinos na semana) ou são apagados também — ver pergunta 19.
- **R6.11** **Menor de idade**: se a data de nascimento indica menos de 18 anos, o app pede o consentimento de um responsável antes de guardar dado de saúde. Sem isso, o cadastro corporal fica indisponível (o resto do app funciona). Ver pergunta 16.
- **R6.12** Funcionário removido da academia perde todo acesso na hora, inclusive ao que estava aberto no celular (o app força saída da visão da academia).

---

## 7. Unidades, datas e formatos

Regra geral (CLAUDE.md): **inteiros no armazenamento, formatação só na tela**.

| Grandeza | Armazenado | Na tela |
|---|---|---|
| Peso corporal | gramas (inteiro) | kg com uma casa: 72,4 kg |
| Carga do exercício | gramas (inteiro) | kg com até uma casa: 20 kg · 22,5 kg |
| Altura | milímetros (inteiro) | 1,78 m (ou 178 cm nas listas compactas) |
| Tempo (descanso, série de tempo, duração do treino) | segundos (inteiro) | mm:ss para menos de 1 h; h:mm:ss acima |
| Repetições | inteiro | 12 |
| Quantidade de alimento ([decidir] só no banco de alimentos) | gramas (inteiro) | 150 g |
| Calorias ([decidir] só no banco) | kcal (inteiro) | 320 kcal |
| Data | texto ISO `AAAA-MM-DD` | 10/10/2026 (formato brasileiro) |
| Hora com fuso | texto ISO `AAAA-MM-DDTHH:MM:SS-03:00` | 16:00 |
| Idade | não se armazena; deriva da data de nascimento | 29 anos |
| Dinheiro (preço do Plus) | centavos (inteiro) | R$ 49,90 |

- **R7.1** Entrada na tela aceita vírgula e ponto como decimal; converte para inteiro antes de salvar.
- **R7.2** Carga aceita incrementos de 0,5 kg (500 g) na tela; o armazenamento aceita qualquer inteiro em gramas.
- **R7.3** Sempre que um número aparece, a unidade aparece junto. Nunca "72,4" sozinho.
- **R7.4** O fuso padrão é o do aparelho do aluno no momento do registro; fica gravado junto da hora.

---

## 8. Vínculo com a academia

- **R8.1** A academia tem um **código de vínculo** (6 caracteres, trocável pelo dono). O aluno digita o código; o vínculo nasce `pendente` e a recepção confirma — ou nasce `ativo` direto, se o dono configurou "entrar sem confirmação".
- **R8.2** A recepção também pode vincular pelo e-mail/telefone do aluno; se ele ainda não tem conta, recebe um convite e o vínculo fecha quando criar a conta.
- **R8.3** Um aluno pode se desvincular. A academia perde acesso na hora; o histórico de treino continua com o aluno. **[decidir]** Várias academias: o aluno pode ter mais de um vínculo ativo, e o app pergunta qual academia ao entrar · Uma academia: só um vínculo.
- **R8.4** O **aluno sem vínculo** usa treino livre, biblioteca geral, execução e histórico. Não vê treinos prontos de academia nem o Plus (o Plus é oferecido pela academia; ver pergunta 5).
- **R8.5** "Aluno ativo", nos números do dono, é quem registrou ao menos um treino nos últimos 30 dias.

---

## 9. Cronômetro

Acrescentado em 10/10/2026 (agente H, P07). Histórias H32 e H69 a H76; fluxo F9; código `app/dominio/cronometro.ts`. Os avisos, escritos ao mesmo tempo pelo agente G, estão na seção 10.

### 9.1 Uma ferramenta, três modos, um motor

- **R9.1** O Cronômetro é uma ferramenta só, com três modos:
  - **livre**: conta para cima, sem fim, com voltas (cardio, esteira);
  - **regressivo**: conta para baixo a partir de um tempo escolhido e vibra no fim;
  - **intervalado**: trabalho, descanso e rodadas (HIIT, Tabata, EMOM).
  Abre pelo botão "Cronômetro" na tela Treino em andamento e pelo atalho no Início. Não precisa de treino aberto, de academia nem de Plus: o aluno sem academia também usa (R8.4). Só existe na visão do aluno.
- **R9.2** O **descanso entre séries** (componente 7) e a **contagem da série por tempo** (a prancha de 30 s) são o mesmo cronômetro no modo regressivo. O descanso começa com o `descansoSegundos` da série (padrão 60 s, R1.14); a série por tempo, com o `tempoSegundos` da série. Descanso 0 = nenhum cronômetro.
- **R9.3** O cronômetro guarda o **instante em que começou e as pausas** (cada uma com início e fim), nunca um contador que soma de segundo em segundo. O tempo decorrido é sempre uma conta: agora − início − pausas (+ o que foi pulado, R9.7).
- **R9.4** Por causa da R9.3, o tempo continua certo:
  - com a tela bloqueada e com o app em segundo plano;
  - com o app fechado à força: o estado é salvo no telefone a cada toque (iniciar, pausar, retomar, ±30 s, pular, volta, parar) e volta igual;
  - quando o fuso ou o horário de verão mudam: o instante é contado em milissegundos desde 1970, que não têm fuso.

  Se o relógio do telefone for atrasado à mão, o cronômetro não anda para trás nem fica negativo. Se for adiantado à mão, o cronômetro pula junto. É raro (o relógio automático é o padrão) e não dá para evitar sem um relógio do sistema que sobreviva ao app fechado.

### 9.2 Regressivo e intervalado

- **R9.5** **Regressivo**: de 1 s a 3 h. Atalhos na tela: 1, 2, 3, 5 e 10 min, mais "Outro" (campo de tempo). No fim: vibração, o mostrador em "Terminou" e o aviso (R9.11).
- **R9.6** **Intervalado**: preparação de 0 a 60 s (padrão 10 s, "Prepare-se"), trabalho de 1 s a 60 min, descanso de 0 a 60 min, de 1 a 99 rodadas. A ordem é preparação → trabalho 1 → descanso 1 → … → trabalho N. **Não há descanso depois da última rodada**: o intervalado termina com o último trabalho.

  Predefinições (o aluno pode mudar qualquer número antes de começar):

  | Predefinição | Preparação | Trabalho | Descanso | Rodadas | Total |
  |---|---|---|---|---|---|
  | Tabata 20/10 × 8 | 10 s | 20 s | 10 s | 8 | 4:00 |
  | EMOM 10 min | 10 s | 60 s | 0 | 10 | 10:10 |
  | HIIT 30/30 × 10 | 10 s | 30 s | 30 s | 10 | 9:40 |
  | HIIT 40/20 × 8 | 10 s | 40 s | 20 s | 8 | 7:30 |

  - EMOM ("a cada minuto, no minuto") é trabalho de 60 s sem descanso: o cronômetro só marca a virada de cada minuto; o que sobra do minuto depois do exercício é o descanso.
  - O app lembra, no telefone, a última configuração usada em cada modo.
- **R9.7** **Pular**: no regressivo (e no descanso) termina na hora; no intervalado vai para o começo da próxima fase; pular a última fase termina o intervalado. O tempo pulado não conta como tempo feito (R9.10).
- **R9.8** **+30 s e −30 s** existem só no regressivo (descanso, série por tempo, regressivo avulso) e valem só para aquela contagem: a série planejada não muda. Antes de começar, a contagem nunca fica abaixo de 1 s. Rodando, se faltava menos de 30 s, "−30 s" termina na hora. O teto é 3 h.

### 9.3 Um cronômetro por vez

- **R9.9** Só existe **um cronômetro de cada vez no app** (rodando ou pausado). O que acontece quando outro vai começar:

  | Está rodando ou pausado | Vai começar | O que acontece |
  |---|---|---|
  | nada, ou um já terminado | qualquer um | começa |
  | descanso ou série por tempo | descanso (marcou outra série) | o descanso **reinicia sem perguntar** (componente 7) |
  | descanso | série por tempo | o descanso acaba e a série começa (o aluno não quis esperar) |
  | **intervalado, livre ou regressivo avulso** | **descanso** (marcou uma série) | **o descanso não começa**; o intervalado segue; a série fica marcada; toast "Série feita · o intervalado continua" com o botão "Descansar", que pergunta "Parar o intervalado e começar o descanso?" |
  | intervalado, livre ou regressivo avulso | série por tempo, ou outro avulso | pergunta numa folha: "Parar o intervalado e começar a série?" |
  | descanso | um avulso (abriu o Cronômetro e tocou Iniciar) | pergunta: "Parar o descanso e começar o cronômetro?" |

  Quem é parado para dar lugar a outro termina como "parou" e, se for livre ou intervalado com 1 s ou mais, a folha "Registrar como série" aparece antes (R9.10). Encerrar o treino descarta o descanso e a série por tempo que estiverem rodando; um cronômetro avulso continua, porque não pertence ao treino.

### 9.4 O tempo feito vira série

- **R9.10** O tempo do **livre**, do **intervalado** ou do **regressivo avulso**, ao parar ou terminar, pode virar uma **série realizada** (`feita`) de um exercício do tipo **tempo** (R1.14). Folha "Registrar como série":
  - O tempo sugerido é o cronometrado de verdade, em segundos inteiros arredondados para baixo: **sem as pausas, sem o que foi pulado e, no intervalado, sem a preparação**. O aluno pode corrigir o número antes de salvar.
  - Com treino em andamento: o exercício sugerido é o atual, se ele for por tempo; senão, o aluno escolhe um (só aparecem os por tempo). A série entra no treino realizado de hoje.
  - Sem treino em andamento (aberto pelo Início): "Salvar no histórico" cria um treino realizado sem treino de origem (`treinoId` nulo, R1.17) com essa série. O exercício vem da biblioteca, só os por tempo.
  - Com 0 s, o botão não aparece. O **descanso nunca vira série**.
  - **Série por tempo**: na linha da série, o botão de marcar vira "Iniciar". No fim da contagem, a série fica **marcada como feita** com o tempo planejado mais os ajustes, sem toque. Se o aluno tocar "Parar" antes, a série é marcada com o tempo feito. Em seguida o descanso dela começa, se a chave "Iniciar descanso ao marcar série" estiver ligada (Perfil).
  - O registro segue o caminho normal do treino realizado: salva no telefone e sobe quando houver sinal (R1.24).

### 9.5 Avisos, vibração e tela

- **R9.11** **Avisos**:
  - **Com o app aberto** avisam a tela e a vibração, não a notificação.
  - **Com o app em segundo plano ou fechado** avisam notificações **locais**, agendadas pelo instante exato: o fim (regressivo, intervalado, descanso e série por tempo) e cada troca de fase do intervalado ("Trabalho · rodada 3 de 8", "Descanso · 10 s").
  - No máximo **24** ficam agendadas de uma vez: o iPhone guarda até 64 por app, e os lembretes dividem esse teto. O Tabata inteiro usa 16.
  - Pausar, retomar, ±30 s, pular e parar cancelam os agendados e agendam de novo. O livre não agenda nada.
  - O texto nunca leva dado de saúde nem o nome do exercício (R6.2, tela bloqueada).
  - Os avisos do cronômetro foram pedidos pelo aluno naquele momento: **não seguem o horário de silêncio nem o limite por dia**. Desligam pela chave "Cronômetro" da tela Avisos; os tipos e os textos estão na tabela de avisos (`03-arquitetura/03-DECISOES-TECNICAS.md`, seção 3).
- **R9.12** **Vibração com o app aberto** (tokens `vibracao`): leve nos 3, 2 e 1 s finais de cada contagem e de cada fase; média na troca de fase do intervalado; o padrão de "concluído" no fim. A tela sempre muda junto: nenhum aviso depende só da vibração (componente 7).
- **R9.13** Com a tela **Cronômetro** aberta e o cronômetro rodando, a tela do celular **não apaga sozinha**: o aluno está longe, na esteira ou no chão. Fora dessa tela, vale o tempo de bloqueio do sistema.
- **R9.14** Rodando ou pausado, o cronômetro aparece como **faixa acima das abas**, em qualquer aba (componente 7): "Descanso · 0:45", "Trabalho 3/8 · 0:14", "Livre · 12:47". O toque leva à tela Cronômetro; no descanso, de volta ao treino.
- **R9.15** O número grande se lê **a 1 m**: na tela Cronômetro o número tem 96 pt (algarismos de cerca de 11 mm de altura num iPhone), e a fase pinta o mostrador inteiro, sempre com o nome da fase escrito (componente 18).
- **R9.16** O cronômetro não manda nada ao servidor e não guarda histórico próprio: o que fica é a série registrada (R9.10).

---

## 10. Avisos e notificações

Escrita no P07 (agente G, 10/10/2026). A seção 9 fica livre para o cronômetro, escrito em paralelo. A tabela de cada aviso (texto, gatilho, quem dispara, para quem, chave) está em `03-arquitetura/03-DECISOES-TECNICAS.md`, seção 3; o código das regras locais, em `app/dominio/avisos.ts`.

### 10.1 De onde vem e o que leva

- **R10.1** Um aviso sai de um destes dois lugares: o **telefone do próprio aluno** (notificação local: cronômetro e lembretes) ou o **servidor** (tudo que nasce da ação de outra pessoa ou de uma data). O app de um usuário nunca manda notificação para outro.
- **R10.2** Nenhum aviso leva dado de saúde (R6.1, R6.2): nem peso, medida, caloria, objetivo ou restrição, nem o nome de uma refeição, nem a prévia de uma mensagem do personal. O aviso diz **que** algo mudou ("Dani mudou seu plano alimentar"); o **que** mudou fica dentro do app.
- **R10.3** Todo aviso tem uma chave na tela Avisos, e desligar a chave tira só a notificação: o cartão no Início e a informação no app continuam. Única exceção: o aviso ao dono de "aluno Plus sem personal" (R10.9), que não desliga.

### 10.2 Anti-incômodo

- **R10.4** **Horário de silêncio: das 22:00 às 07:00 nada toca**, exceto o cronômetro do treino em andamento (fim do descanso, fim da série por tempo, fim e fases do cronômetro), que foi o aluno quem ligou. Lembrete local marcado nesse horário é descartado, nunca movido para outra hora; por isso o seletor de hora vai de 07:00 a 21:59. Aviso do servidor que cairia no silêncio é segurado até as 07:00.
- **R10.5** O silêncio vale no fuso do aparelho de quem recebe (R7.4); o servidor guarda o fuso de cada aparelho.
- **R10.6** **Limite por dia**: no máximo 3 lembretes locais por pessoa (o lembrete de treino tem prioridade) e no máximo 3 avisos do servidor por pessoa. Do 4º em diante, o aviso não vira notificação e fica só dentro do app. Fora da conta: o cronômetro, as mensagens (agrupadas, R10.7) e o aviso de aluno Plus sem personal.
- **R10.7** **Avisos iguais viram um só**: refeições a menos de 30 minutos uma da outra; refeições que passariam do limite do dia viram o resumo da noite; pedidos para entrar na academia somados de 2 em 2 horas; alunos sem treinar e alunos Plus sem registro num resumo diário às 09:00; mensagens da mesma conversa somadas a cada 15 minutos.
- **R10.8** **O app não lembra o que já foi feito**: sem lembrete de treino no dia em que o aluno já treinou; depois de fechar a frequência pretendida da semana (ou, sem ela, o número de dias escolhidos), sem lembrete até a semana seguinte. Se a pausa "Vou ficar parado" (B4) entrar, nenhum lembrete e nenhum alerta ao personal até a data de volta.
- **R10.9** **Uma vez por episódio**: "14 dias sem treinar" (H42) e "3 dias sem registro" (H60) avisam uma vez por sumiço e só voltam a valer depois de um novo registro. "Novo aluno Plus sem personal" avisa no mesmo dia e repete uma vez depois de 2 dias úteis, se continuar sem personal.

### 10.3 Aviso da academia (V6)

- **R10.10** Escrevem o dono e a recepção. **[decidir]** O instrutor também (a pergunta 21 propõe recepção e instrutor como um papel só). O aviso tem só texto: até 160 caracteres e até 3 linhas, sem link, sem foto, sem citar aluno e sem dado de saúde (a tela lembra, R10.2). Fica no Início de 1 a 14 dias (padrão 3).
- **R10.11** No máximo **um aviso com notificação por dia** por academia. O segundo do dia vai só como cartão no Início. Escrito no silêncio, o cartão aparece na hora e a notificação sai às 07:00.
- **R10.12** O aviso é de mão única: sem resposta, sem curtir, sem "lido por". O aluno pode **dispensar** o cartão (some só para ele). A academia pode **retirar** o aviso (some do Início de todos); a notificação já entregue não volta. O dono retira qualquer aviso; a recepção, os que ela escreveu.
- **R10.13** Recebem todos os alunos com vínculo `ativo` na academia. Quem se vincula depois vê o cartão se o aviso ainda está em vigor, sem notificação. O Início mostra um cartão de aviso por vez, o mais recente; havendo outro em vigor, "Mais 1 aviso da academia".

### 10.4 Permissão, toque e registro

- **R10.14** O pedido de permissão vem quando faz sentido, nunca na abertura: no iPhone, provisória no primeiro acesso e completa no primeiro descanso (`03-arquitetura/04-IPHONE.md`, seção 6); no Android 13 ou mais novo, no primeiro descanso ou ao ligar um lembrete, o que vier primeiro; na equipe, na primeira entrada na visão da academia. Negar não trava nada.
- **R10.15** Tocar no aviso abre o lugar dele no app, trocando de visão se for preciso (H05). Sem sessão, abre a entrada e nada mais.
- **R10.16** O servidor registra cada aviso enviado (tipo, para quem, quando) para o limite, o agrupamento e a auditoria, **sem o texto**. Sair da conta apaga o aparelho da lista de envio e cancela os lembretes agendados nele.

---

## 11. Equipe da academia e perfil profissional (P10)

Pedido do Alex em 11/10/2026, **já decidido**. Histórias H90 a H95; fluxo F14; telas na Parte 7 do mapa. A tela será desenhada depois, na mesma linguagem do sistema; aqui está só o que ela faz.

### 11.1 O perfil

- **R11.1** Pode ter perfil profissional quem tem **vínculo de equipe ativo** (funcionário, personal ou dono) e dá aula ou atende. Ninguém é obrigado: sem perfil, nada muda no app.
- **R11.2** O perfil pertence ao **vínculo de equipe**, não à conta, porque os dias e turnos são daquela academia. Campos:
  - **nome de exibição**: obrigatório se o perfil existir; começa com o nome da conta;
  - **foto**: opcional;
  - **formação**: texto curto, até 60 caracteres ("Professor de Educação Física");
  - **CREF**: opcional. Se a pessoa preencher, aparece **inteiro**, como foi escrito (número, categoria e estado, por exemplo "CREF 012345-G/SP"), nunca abreviado. **[decidir]** O app confere o número na consulta pública do sistema CONFEF/CREF · O app só mostra o que a pessoa digitou. Nas duas respostas, a palavra "verificado" só aparece se houver a conferência;
  - **especialidades**: zero ou mais itens da lista fixa (R11.3);
  - **sobre mim**: texto curto, até 280 caracteres;
  - **dias e turnos**: uma grade de segunda a domingo × manhã, tarde e noite; a pessoa marca onde está na academia.
- **R11.3** Especialidades são uma **lista fixa do app**, para o filtro funcionar igual em toda academia (como o objetivo, R2.1). A lista começa com as que o Alex citou: musculação, funcional, HIIT, reabilitação, idosos, iniciantes. Acrescentar ou renomear item é pergunta ao Alex (pergunta 26 em `90-PERGUNTAS-PARA-O-ALEX.md`, que também traz o cuidado com a palavra "reabilitação").

### 11.2 Quem vê

- **R11.4** O perfil aparece aos alunos só se as três condições valem ao mesmo tempo:
  - a chave **"Mostrar meu perfil aos alunos"** está ligada. Ela **nasce desligada** e só o profissional liga;
  - o dono **não escondeu** o perfil (R11.7);
  - o vínculo de equipe está **ativo**.
- **R11.5** Vê o perfil **só o aluno com vínculo ativo naquela academia**. Não vê o aluno pendente, o aluno sem academia nem o de outra academia. A equipe da mesma academia vê os perfis visíveis, como os alunos veem.
- **R11.6** **Nunca aparecem** telefone, e-mail, endereço ou outro contato pessoal do profissional. O perfil não tem botão de contato; no Plus, a conversa com o personal segue a pendência do chat **[decidir]** (P00), sem mudança.
- **R11.7** O **dono pode esconder** qualquer perfil ("Esconder dos alunos", na tela Equipe). Esconder vence a chave do profissional, que passa a ver "Escondido pelo dono"; só o dono desfaz. Com o vínculo de equipe encerrado (H66, R6.12), o perfil some dos alunos na hora; o texto fica guardado com o vínculo encerrado, sem aparecer.
- **R11.8** O perfil é dado pessoal do profissional, publicado por ele: ligar a chave é o consentimento, guardado com data e hora; desligar tira o perfil de todos na hora. Não é dado de saúde (R6.1).

### 11.3 O que o perfil não tem

- **R11.9** **Sem nota, sem estrela, sem ranking**, sem contagem de alunos, sem "mais procurado" e sem contagem de visualizações. A lista da Equipe é em ordem alfabética do nome de exibição. Avaliação do profissional pelo aluno é **[decidir]** (pergunta 27), com o risco de exposição dele escrito lá.
- **R11.10** **Sem valores** nesta versão: o perfil não mostra preço de aula, de personal particular nem de pacote (`05-FORA-DA-V1.md`).

### 11.4 Ligações com o que já existe

- **R11.11** No Plus, o perfil do **"Meu personal"** é o mesmo perfil. Se o personal tem perfil visível, o bloco "Meu personal" abre o perfil; se não tem, o bloco continua com nome e foto (H48), sem link. O aluno Plus sempre vê o nome do personal dele, com ou sem perfil.
- **R11.12** Onde o app escreve **"Montado por [nome]"** (o selo do treino em F5, passo 6; a tela Ver aviso: treino da academia; o selo em Editar treino), o nome vira **link para o perfil** quando o autor tem perfil visível; senão, é texto. Treino de um profissional que saiu da academia continua com o nome, sem link (R5.6).
- **R11.13** Filtro da Equipe: chips com as especialidades que **alguém da equipe marcou** (as outras não aparecem), mais "Todos", que é o padrão. Equipe sem nenhum perfil visível: "A equipe da academia ainda não montou os perfis." Filtro sem resultado não acontece, porque o chip só existe se alguém marcou.

---

## 12. Checagem final: melhorias para o cliente (P10)

Acrescentadas pelo agente V em 11/10/2026. Histórias H96 a H106. Cada regra diz de onde veio; o motivo está em `docs/revisao/V-CLIENTE.md`.

### 12.1 Aluno

- **R12.1** **A série vem com a última carga real** (H96; B, A5). Ao abrir uma série em Treino em andamento ou no Modo treino, o campo de carga real vem com:
  1. a carga **planejada**, se quem montou o treino mudou a carga planejada **depois** da última vez que o aluno fez aquele exercício (o instrutor ou o personal subiu a carga de propósito);
  2. senão, a **última carga real** daquele exercício (R1.23);
  3. sem histórico, a planejada; vazia, se as duas estão vazias.

  As repetições vêm com as planejadas. O planejado fica sempre visível ao lado ("Plano: 3 × 12 · 20 kg"). Esta regra substitui, no F4 passo 2, "vêm preenchidos com o planejado".
- **R12.2** **Pedir treino novo** (H97; B, B8). Com vínculo ativo, o aluno toca "Pedir treino novo" (em Treinos e no cartão de R12.5) e escreve um recado opcional de até 140 caracteres. A folha avisa: "A equipe da academia vai ler." Regras:
  - um pedido aberto por vez; o aluno pode cancelar;
  - o pedido **fecha sozinho** quando a academia envia um treino para ele (F5 ou R12.4);
  - o recado pode ter dado de saúde escrito pelo aluno ("dor no joelho"): por isso nunca vai para notificação, log ou analytics (R6.2, R10.2);
  - precisa de sinal, como montar treino (não entra na fila de envio).
- **R12.3** **Sessão vencida não perde treino** (H106). A sessão vencida nunca apaga a fila de envio nem impede registrar um treino sem sinal. Cada item da fila guarda a conta de quem registrou. Com o sinal de volta e a sessão vencida, o app pede para entrar de novo e então envia. Se outra conta entrar no mesmo aparelho, a fila da primeira não sobe na conta errada: fica guardada, e o app avisa "Há 2 treinos de Ana esperando. Entre com essa conta para enviar."

### 12.2 Instrutor e recepção

- **R12.4** **Dar treino pronto** (H99; B, A6). No Perfil do aluno (academia), "Dar treino pronto" abre a lista dos prontos publicados. A lista só começa filtrada pelo objetivo do aluno se ele autorizou a academia a ver os dados (o objetivo é dado de saúde, R6.5). Um toque no treino abre a folha "Enviar [treino] para [aluno]", com "Tornar o treino ativo dele" (ligado), "Trocar em" (R12.5) e "Recado" opcional. Confirmar envia. O aluno recebe uma **cópia** com a origem `montado_pela_academia`, que guarda o modelo e a versão (R1.4). O aviso é o mesmo do F5, passo 7.
- **R12.5** **Trocar em [data]** (H98; B, B9). Ao enviar um treino ao aluno (F5 ou R12.4), o campo opcional "Trocar em" tem os atalhos 4 · 6 · 8 · 12 semanas e uma data livre. Ele vem vazio, a não ser que o dono tenha escolhido um padrão em Configurações da academia ("Sugerir troca de treino a cada": nenhum · 4 · 6 · 8 · 12 semanas). A partir da data:
  - o aluno vê um cartão no Início: "Seu treino está na hora de trocar." com o botão "Pedir um novo" (R12.2). Não é notificação;
  - na academia, o aluno entra no filtro "Treino para trocar".
- **R12.6** **Aluno novo** (H100). "Novo" é o aluno com vínculo ativo há **90 dias ou menos**, contados da confirmação. Os 90 dias seguem o estudo de Sperandei e colegas (2016) numa academia do Rio, em que 63 % dos novos alunos saíram antes do terceiro mês. Em Alunos (academia):
  - filtro "Novos (90 dias)";
  - dentro dele, "Sem treino ativo" e "Sem treinar há 7+ dias". Para o novo, o corte é 7 dias, não os 14 do H42.

  A recepção e o dono recebem a contagem dos novos sem treinar no resumo diário das 09:00 (R10.7), sem nome na tela bloqueada.
- **R12.7** **Fila do turno no resumo diário**. Os pedidos de treino abertos (R12.2) e os treinos que chegaram à data de troca (R12.5) entram no resumo das 09:00 (R10.7) da recepção e do instrutor que ligou "Alunos sem treinar", como mais uma linha: "2 pedidos de treino · 4 treinos para trocar". Não são notificações à parte. Em Alunos (academia), os filtros são "Pediu treino" (com a data do pedido e o recado) e "Treino para trocar".
- **R12.8** **QR e link do código** (H101; B, A1). Em Configurações da academia, o código dos alunos aparece também como **QR** (para imprimir no balcão) e como **link** (para mandar). Ler o QR ou tocar no link abre o app em "Sua academia" com o código já preenchido; sem o app instalado, abre a loja. O código digitado continua valendo. Trocar o código (H67) invalida o QR e o link antigos. O código da equipe não ganha QR.
- **R12.9** **Pendente já vê os treinos prontos** (H101; B, A2). Com vínculo `pendente`, o aluno vê e usa os treinos prontos publicados da academia. Eles não são dado de ninguém, e a confirmação protege a lista da academia, não o conteúdo dela. A academia continua sem ver o aluno até confirmar (R6.4). O Plus, a Equipe (R11.5) e o aviso da academia continuam só para o vínculo ativo (R8.4, R10.13). Se o pedido for recusado, as cópias que o aluno fez ficam com ele, como na saída (R8.3).
- **R12.10** **Confirmar em lote** (H102). No filtro "Vínculo pendente", o botão "Confirmar todos (N)" abre uma folha com os nomes. Confirmar vale para todos; recusar continua um por um.
- **R12.11** **Encerrar vínculo pela academia** (H103; B, B10). Recepção e dono, no Perfil do aluno (academia): "Encerrar vínculo", com motivo opcional (cancelou a matrícula · mudou de academia · outro) e confirmação. O efeito é o mesmo de o aluno se desvincular (R8.3): a academia perde o acesso, e o histórico e os treinos ficam com o aluno. O que acontece com o Plus segue R5.7 e a pendência de quem paga **[decidir]**. O aluno recebe "Seu vínculo com [academia] foi encerrado", sem o motivo. O motivo não é dado de saúde e só aparece somado nos números do dono.

### 12.3 Dono e personal

- **R12.12** **Números a mais no painel** (Academia, números). Tudo somado, sem nome e sem dado de saúde (R6.7):
  - "Com treino ativo": quantos dos vinculados têm treino ativo;
  - "Novos (90 dias)": quantos são e quantos deles treinaram nos últimos 7 dias;
  - "Saídas no mês": vínculos encerrados no mês, por motivo (R12.11) e pelo próprio aluno.
- **R12.13** **Resumo da semana** (H104). Aviso do servidor ao dono, segunda às 09:00 no fuso do aparelho dele: "Semana: 212 alunos treinaram · 9 novos sem treinar · 4 treinos para trocar". Só contagens. A chave é "Resumo da semana", em Avisos da equipe, ligada para o dono e desligável. Entra no limite de 3 por dia (R10.6). O toque abre Academia (números).
- **R12.14** **Meus alunos Plus por atenção** (H105; B, V9). A lista do personal vem nesta ordem, com o motivo escrito em cada linha:
  1. novo, sem treino e sem plano;
  2. 3 dias sem registro (H60);
  3. adesão dos últimos 7 dias 20 pontos ou mais abaixo da dos 7 dias anteriores;
  4. treino para trocar (R12.5);
  5. o resto, por nome.

  Usa só o que o personal já vê do aluno Plus dele (R6.6). Se a pausa "Vou ficar parado" (B, B4) entrar, quem está parado vai para o fim, com "Parado até [data]".

## 13. Segunda busca de melhorias, com o app rodando (P11)

Acrescentadas pelo agente AC em 11/10/2026, depois de usar o app exportado para a web como Ana, Juliana, Lucas, Diego, Júlia e Marcos. Histórias H107 a H114. O motivo e a contagem de toques de cada uma estão em `docs/revisao/AC-MELHORIAS.md`. Nenhuma depende de **[decidir]**. Nenhuma muda o desenho: usam folha, linha, aviso rápido e estado vazio que já existem.

### 13.1 Aluno

- **R13.1** **Fechar antes da hora pede confirmação** (H107) (P11). "Fechar o treino" no menu do Modo treino (o "Encerrar" do F4, passo 6), com série ainda por fazer, abre a folha de confirmação com o que falta: "Faltam 25 séries de 6 exercícios." · "Fechar assim" · "Voltar ao treino". Sem nenhuma série feita, a folha oferece "Descartar o treino" no lugar de "Fechar assim": um treino vazio não entra no histórico nem na semana. Com tudo feito, vale a pergunta do F4, passo 6, como está. Motivo: hoje um toque no menu fecha o treino com 1 série de 26, e esse treino conta na semana ("4 de 4") e muda o dia sugerido.
- **R13.2** **O primeiro treino já nasce em uso** (H108) (P11). Quando o aluno cria um treino (F2) ou usa um pronto (F3) e **não tem nenhum treino em uso**, o novo vira o ativo sem pedir "Usar este treino". Com outro em uso, nada muda: o novo fica guardado até ele tocar "Usar este treino" (R1.3). Motivo: o Lucas montou o treino, pôs um exercício e o Início continuou dizendo "Monte seu primeiro treino".
- **R13.3** **Usar um pronto leva ao começo, não ao editor** (H108) (P11). Depois de "Usar" na folha do F3, passo 4, o aluno volta a **Treinos › Meus treinos**, com a cópia no "Em uso" e o "Deslize para começar" à vista, e um aviso rápido: "[treino] em uso · Ajustar". "Ajustar" abre o **Editar treino**, e o H25 continua a um toque. Esta regra substitui o F3, passo 5 ("→ Editar treino"). Motivo: a Juliana, no primeiro dia, caiu numa tela com "Renomear" e "Apagar este dia" quando só queria começar.
- **R13.4** **Sem academia, o vazio tem caminho** (H109) (P11). Sem vínculo, toda tela que fala de academia mostra o mesmo botão "Tenho um código". Ele abre **Sua academia (perfil)** no "Entrar com código", o mesmo passo do F13.3, com o QR do R12.8. As telas são:
  - Início, no estado vazio "Monte seu primeiro treino";
  - Treinos, na sub-aba "Prontos da academia" (se ela aparecer; o mapa diz "só se vinculado");
  - Plus, no convite sem academia;
  - Perfil, na linha "Sem academia", que passa a ser tocável.

  Com vínculo **pendente**, essas telas não oferecem o código: dizem que o pedido está com a academia (R13.5).
- **R13.5** **O pendente sabe que está pendente** (H109) (P11). Com vínculo `pendente`, o Plus troca a frase sem academia por "O Plus aparece quando a [academia] confirmar a sua entrada." O cartão "Aguardando a recepção confirmar" do Início (F15, "Entrar pelo QR") fica até a confirmação e some sozinho depois. Ele não se dispensa.
- **R13.6** **Lista do dia dentro do Modo treino** (H110) (P11). No Modo treino, tocar no título "Treino A · exercício 2 de 7" (ou nos segmentos) abre a folha "Treino de hoje". Ela lista os exercícios do dia na ordem, cada um com o estado: feito, pulado, por fazer ou "x de y séries". Tocar num exercício vai até ele, com o mesmo "ir para" que o "Próximo" já usa. A folha não reordena o treino planejado e não cria exercício: é só navegação. Motivo: com o aparelho ocupado, o aluno quer fazer o exercício 5 agora e voltar ao 2 depois; hoje só existe "Próximo", um por vez. Trocar o exercício (R1.19) continua sendo outra coisa.

### 13.2 Academia

- **R13.7** **Cada papel abre na sua pergunta** (H111) (P11). Ao entrar na visão da academia, a primeira aba é:
  - **dono**: Academia (números);
  - **personal** com pelo menos um aluno Plus: Meus alunos Plus;
  - **personal** sem aluno Plus, **instrutor** e **recepção**: Alunos.

  Vale ao abrir o app e ao "Trocar de visão". A última aba visitada não muda a primeira aba da próxima abertura. Motivo: o dono quer saber como está a academia, e o personal quer saber quem precisa dele. Hoje os dois caem na lista de todos os alunos.
- **R13.8** **Cada filtro de Alunos tem a ordem da sua pergunta** (H112) (P11). Hoje todo filtro vem em ordem alfabética. Passa a ser assim:
  - "Sem treinar há 14+ dias": quem sumiu **há menos tempo** vem primeiro. Quem cruzou os 14 dias nos últimos 7 ganha o selo "Sumiu esta semana". Motivo: na academia estudada por Sperandei e colegas (2019), mais da metade dos que voltaram voltou no primeiro mês. Quem sumiu há 15 dias ainda volta; quem sumiu há 200, provavelmente não.
  - "Pediu treino": o pedido **mais antigo** primeiro.
  - "Vínculo pendente": o pedido mais antigo primeiro.
  - "Novos (90 dias)": o vínculo mais antigo primeiro, porque está mais perto de sair da janela.
  - "Todos", "Plus" e "Sem treino ativo": por nome, como hoje.

  A ordem só usa a data do último treino e a do vínculo, nunca dado de saúde.
- **R13.9** **O aluno Plus que treina outro treino** (H113) (P11). Vale quando o personal tem um treino `montado_pelo_personal` para o aluno e o treino **em uso** é outro:
  - na lista do R12.14, a linha mostra o motivo "Treina outro treino ([nome])", na ordem entre os itens 3 e 4;
  - no Plus do aluno, a linha "Meu treino" diz "Não está em uso" e oferece "Usar este treino".

  Motivo: a Ana paga o Plus e treina o ABC que ela mesma copiou. A Júlia só descobre abrindo o perfil dela.
- **R13.10** **O recado do pedido acompanha a escolha** (H114) (P11). Se o aluno tem um pedido aberto (R12.2), o recado ("Quero focar em perna.") aparece no topo da folha "Dar treino pronto" (R12.4) e da faixa "Montando para [nome]" (F5) enquanto a pessoa escolhe. O recado segue as regras do R12.2: nunca vai para notificação nem para log. Motivo: num celular de 852 pontos o recado ainda aparece atrás da folha; num iPhone SE ele fica coberto, e na tela Montar treino ele não aparece.
