# B — Melhorias

Revisão do agente B, 10/10/2026. Leitura crítica do produto do ponto de vista de quem usa: **Juliana** (iniciante), **Rafael** (treina há anos), **Dani** (instrutora com 40 alunos no turno) e **Marcos** (dono). Os nomes vêm de `02-design/marca-e-proposta/00-PROPOSTA.md`.

Regras que segui:
- Não editei nada além deste arquivo.
- Não resolvi nenhum **[decidir]**. Quando um item toca numa pendência, ele diz qual e o que muda em cada resposta.
- Não repeti o que `05-FORA-DA-V1.md` já adiou de propósito. Quando um item encosta num adiado, digo por que é outra coisa.
- Onde discordo de algo já escrito, está como **proposta**.

Legenda: **Tamanho** P (horas a 2 dias) · M (até 1 semana) · G (mais de 1 semana, ou depende de gente de fora). **Quando**: v1 ou depois.

Total: **46 itens** (14 buracos, 11 atritos, 10 de valor, 11 riscos). O top 10 está no fim.

---

## 1. Buracos — situações reais que nenhuma história ou fluxo cobre

### B1. O aluno troca de academia (ou sai dela)
- **Problema**: R8.3 diz que o histórico fica com o aluno, mas não diz o que acontece com os treinos que a academia montou, com as cópias de treinos prontos e com o Plus em andamento.
- **Proposta**: uma regra só. Tudo que já está com o aluno fica com ele (cópias e treinos montados viram dele, editáveis, com o selo "Montado por [academia] até [data]"). O Plus ligado à academia acaba na data da saída (vai a `inativo`, R5.9–R5.13 valem). Se ele pagou no app, mostrar a data até quando vale antes de confirmar a saída.
- **Tamanho**: P · **Quando**: v1.

### B2. O personal sai da academia com alunos Plus
- **Problema**: R6.12 corta o acesso do personal na hora, mas os alunos dele ficam pagando sem personal e ninguém é avisado.
- **Proposta**: ao remover alguém que tem alunos Plus, o app abre uma folha obrigatória: "Fulano tem 7 alunos Plus. Para quem vão?". Até redistribuir, os alunos aparecem em "Sem personal" com destaque. Os alunos recebem "Seu personal mudou". Os treinos dele seguem a R5.6 (ficam assinados por ele).
- **Tamanho**: P · **Quando**: v1.

### B3. O personal sai de férias ou fica doente
- **Problema**: não existe substituição temporária. Trocar o personal (R5.6) tira o acesso do titular, que depois tem de ser devolvido à mão.
- **Proposta**: "Cobertura até [data]": o substituto ganha acesso junto com o titular por um período e perde sozinho no fim.
- **Tamanho**: M · **Quando**: depois (a v1 se vira com a troca normal).

### B4. Lesão, doença ou viagem no meio do plano
- **Problema**: não dá para pausar. A sequência quebra, o personal recebe o alerta de "3 dias sem registro" (H60) sem saber o motivo e o Plus continua correndo.
- **Proposta**: botão "Vou ficar parado" com data de volta e motivo curto (opcional). Silencia lembretes e o alerta do personal, mostra ao personal e à academia "Parado até [data]" e sugere atualizar as restrições. O motivo é dado de saúde (R6.1): só quem já vê o cadastro corporal vê o motivo. Pausar a cobrança do Plus depende de quem paga **[decidir]**.
- **Tamanho**: M · **Quando**: v1 (a pausa). A cobrança fica para depois.

### B5. O aparelho não existe nesta academia (ou está sempre ocupado)
- **Problema**: H33 troca o exercício só naquele dia. Quem troca toda semana o mesmo exercício precisa repetir a troca sempre.
- **Proposta**: depois de trocar, perguntar "Trocar só hoje / trocar no meu treino". A segunda opção só aparece se o treino é dele (R1.7). Em treino do personal, a troca vira um aviso ao personal ("Aluno trocou Leg press por Agachamento 3 vezes").
- **Tamanho**: P · **Quando**: v1.
- **Como outros fazem**: o Hevy mantém as séries e o descanso quando se troca um exercício no treino ([notas da versão 1.29.20](https://www.apkmirror.com/apk/hevy-gym-workout-tracker/hevy-gym-log-workout-tracker/hevy-gym-log-workout-tracker-1-29-20-release/); [página de recursos](https://www.hevyapp.com/features/exercise-programming-options/)).

### B6. Treino avulso (sem treino ativo, ou fora do plano)
- **Problema**: F4 só começa a partir do treino ativo. "Hoje só fiz cardio", "fiz uma aula", "treinei em casa" não têm onde entrar. A frequência fica errada e a sequência quebra.
- **Proposta**: no Início, "Treino livre de hoje": começa vazio e o aluno adiciona exercícios na hora. Entra no histórico e na frequência como qualquer treino. Serve também para quem ainda não montou treino nenhum (Juliana no primeiro dia).
- **Tamanho**: P (reaproveita Treino em andamento e Escolher exercício) · **Quando**: v1.
- **Como outros fazem**: Hevy e Strong têm "começar treino vazio" como botão de primeira linha ([Hevy — registrar treinos](https://www.hevyapp.com/features/track-workouts/)).

### B7. Treinar em casa ou em viagem
- **Problema**: o app assume os aparelhos da academia. Em casa, metade dos exercícios do treino ativo não serve.
- **Proposta**: o B6 resolve quase tudo. Depois, um campo "onde" no treino realizado (academia / outro lugar) para os números do dono não contarem treino de casa como presença.
- **Tamanho**: P · **Quando**: depois.

### B8. O aluno quer um treino novo e não tem como pedir
- **Problema**: hoje o aluno precisa achar a instrutora na sala. Dani não tem fila nem lista de quem pediu.
- **Proposta**: botão "Pedir treino novo à academia" (com campo curto: "quero focar em perna"). Na visão da academia, filtro "Pediu treino" na lista de alunos, com a data do pedido. Quando Dani envia o treino (F5), o pedido fecha sozinho.
- **Tamanho**: P · **Quando**: v1.

### B9. A ficha vence e ninguém percebe
- **Problema**: academia costuma trocar a ficha a cada 6 a 8 semanas. O treino não tem validade, e Dani não sabe de quem está vencido.
- **Proposta**: campo opcional "Trocar em [data]" ao enviar treino ao aluno (padrão sugerido: 8 semanas). Filtro "Treino vencido" em Alunos e no painel do dono. O aluno vê "Seu treino está para trocar. Pedir um novo?" (liga no B8).
- **Tamanho**: P · **Quando**: v1.

### B10. A academia precisa encerrar o vínculo de quem saiu
- **Problema**: o modelo de dados (`01-MODELO-DE-DADOS.md`, linha 75) deixa a recepção confirmar e criar vínculo de aluno, mas não encerrar. Quem cancela a matrícula continua na lista, nos números e vendo os treinos prontos.
- **Proposta**: recepção e dono podem "Encerrar vínculo" de aluno. Mesmo efeito de o aluno se desvincular (R8.3, B1). O aluno recebe aviso e fica com o histórico.
- **Tamanho**: P · **Quando**: v1. (Item para o agente A conferir no modelo.)

### B11. Aluno sem academia não tem visão
- **Problema**: H04 e R8.4 dizem que o aluno sem vínculo usa treino livre. Mas `03-DECISOES-TECNICAS.md`, seção 1, passo 3, manda quem tem zero vínculos para "Entre com o código da sua academia", e a visão vem do papel do vínculo. Do jeito que está, quem toca "Vou treinar sozinho" fica sem visão.
- **Proposta**: zero vínculos leva à visão do aluno com o aviso "Sem academia" no Início, e não a uma tela de código. Ajustar o passo 3 da seção 1.
- **Tamanho**: P · **Quando**: v1.

### B12. Celular perdido, trocado ou "Sair" com treino ainda não enviado
- **Problema**: a fila de envio fica no SQLite do aparelho. "Sair" ou trocar de celular sem sinal apaga treinos que o aluno acha que estão salvos. Isso fere a promessa da R1.24 ("nunca se perde").
- **Proposta**: ao tocar "Sair" com fila cheia: "3 treinos ainda não foram enviados. Conecte-se antes de sair ou eles serão perdidos". E sair apaga o cache local (inclusive a dieta), para o celular emprestado do H07 não guardar dado de saúde.
- **Tamanho**: P · **Quando**: v1.

### B13. Plus pago e sem personal por dias
- **Problema**: F6 promete personal "em até 2 dias úteis", mas nada mede isso. Se o dono esquecer, o aluno paga e espera.
- **Proposta**: o dono recebe aviso no mesmo dia ("Novo aluno Plus sem personal"). Depois de 2 dias úteis, o aviso repete e o aluno vê uma data, não "aguardando". Se a cobrança for no app **[decidir]**, avaliar contar o período só a partir da designação.
- **Tamanho**: P · **Quando**: v1.

### B14. Dado corporal antigo parece atual
- **Problema**: Dani vê "72,4 kg" sem saber que é de 8 meses atrás.
- **Proposta**: toda medida mostra a idade dela ao lado: "72,4 kg · há 8 meses". Vale para o painel lateral do F5 e para o Resumo do personal.
- **Tamanho**: P · **Quando**: v1.

---

## 2. Atrito — passos demais, o app pede o que já sabe, decisão que o aluno não sabe tomar

### A1. Digitar o código da academia
- **Problema**: Juliana não sabe o código. Vai perguntar na recepção, que vai ditar 6 caracteres.
- **Proposta**: QR code e link de convite que já preenchem o código. O QR fica num cartaz no balcão e na tela de Configurações da academia (para imprimir). O código digitado continua como plano B.
- **Tamanho**: P · **Quando**: v1.

### A2. Vínculo pendente esconde os treinos prontos
- **Problema**: com confirmação ligada (recomendação da pergunta 4), Juliana se vincula e não vê os treinos prontos até a recepção confirmar. Para ela, o treino pronto "é o produto inteiro" (Proposta). O primeiro dia dela é uma tela vazia.
- **Proposta**: com vínculo pendente, o aluno já vê e usa os treinos prontos (não são dado de ninguém). A academia só passa a ver o aluno depois de confirmar. A confirmação protege a lista da academia, não o conteúdo dela.
- **Tamanho**: P · **Quando**: v1.

### A3. Duas telas de perguntas antes de qualquer valor
- **Problema**: F1 passa por "Sobre você" e "Quem pode ver" antes do Início. A Proposta diz que Juliana não quer "perguntas sobre peso logo na entrada". Ter o botão "Pular" ainda é uma decisão a tomar.
- **Proposta**: no primeiro acesso, perguntar só o objetivo (um toque, serve ao filtro dos treinos prontos). Peso, altura e restrições ficam para um card no Início depois do primeiro treino ("Quer que a academia te oriente melhor?"). A tela "Quem pode ver" aparece na primeira vez que ele preencher dado corporal (como já diz `03-DECISOES-TECNICAS.md`, seção 5).
- **Tamanho**: P · **Quando**: v1.

### A4. "Quantos dias diferentes?" é pergunta de quem já sabe
- **Problema**: em Novo treino, o iniciante não sabe o que é divisão.
- **Proposta**: perguntar "Quantos dias por semana você vai treinar?" e sugerir a divisão (2 → A/B, 3 → A/B/C). Para quem não tem treino, oferecer antes o treino pronto da academia.
- **Tamanho**: P · **Quando**: v1.

### A5. Os campos do real vêm com o planejado, não com o que ele fez
- **Problema**: F4 preenche a carga real com a planejada. Rafael sobe carga toda semana. Ele vai corrigir todo campo, toda série.
- **Proposta**: preencher com a última carga real daquele exercício (R1.23 já calcula). O planejado aparece em cinza para comparar.
- **Tamanho**: P · **Quando**: v1.
- **Como outros fazem**: Hevy e Strong mostram a coluna "anterior" e usam esse valor para preencher a série ([Hevy — registrar treinos](https://www.hevyapp.com/features/track-workouts/)).

### A6. Dar um treino pronto a um aluno passa pelo editor inteiro
- **Problema**: F5 sempre abre "Editar treino (modo academia)". Com 40 alunos no turno e muita gente iniciante, Dani quase sempre só quer entregar o "Iniciante A/B" sem mudar nada.
- **Proposta**: no Perfil do aluno, botão "Dar treino pronto": escolhe o treino, confirma, enviado. Dois toques, sem abrir o editor. Para editar, continua o caminho do F5. Isso também acelera a entrada da academia (os primeiros 350 alunos).
- **Tamanho**: P · **Quando**: v1.

### A7. Achar o aluno que está na frente da instrutora
- **Problema**: Dani busca por nome. Com nomes repetidos e alunos que ela não conhece, demora e erra.
- **Proposta**: o perfil do aluno tem um QR ("Mostre para o instrutor"). Dani lê com a câmera e abre o perfil dele. A busca por nome continua.
- **Tamanho**: P · **Quando**: depois (é bom, mas a busca resolve a v1).

### A8. Marcar refeição por refeição cansa
- **Problema**: 5 refeições por dia, todo dia. O aluno para de marcar na segunda semana, e a adesão que o personal vê vira mentira.
- **Proposta**: "Segui tudo hoje" num toque, e um lembrete só, à noite ("Como foi a dieta hoje?"), no lugar de um lembrete por refeição como padrão. O lembrete por refeição continua opcional.
- **Tamanho**: P · **Quando**: v1.

### A9. "Como foi?" em texto livre ninguém preenche
- **Problema**: no Resumo do treino, um campo de texto vazio é ignorado. O personal perde o dado mais útil: o esforço.
- **Proposta**: uma escala de 1 a 5 com rótulos curtos ("Leve" a "No limite") num toque, e o texto continua opcional. O personal vê a escala no histórico.
- **Tamanho**: P · **Quando**: v1.

### A10. "Personal padrão" aparece no fluxo, mas não existe em lugar nenhum
- **Problema**: F6, versão A, passo 3, diz "se a academia já tem um personal padrão, mostra na hora". Nenhuma tela de Configurações e nenhuma regra cria esse padrão.
- **Proposta**: chave em Configurações da academia: "Personal padrão para novos Plus" (opcional). Corta o passo de designar em academia com um personal só, que deve ser o caso comum no começo.
- **Tamanho**: P · **Quando**: v1.

### A11. Avisos que o app promete e ninguém dispara
- **Problema**: a tabela de notificações (`03-DECISOES-TECNICAS.md`, seção 3) não tem o alerta do H60 ("aluno Plus sem registro há 3 dias"), nem o "sem treinar há 14 dias" do H42, nem o lembrete de refeição (F8). A tela Avisos tem "avisos da academia", mas não existe tela para a academia mandar aviso.
- **Proposta**: completar a tabela com quem dispara cada aviso (local ou servidor). Para "avisos da academia", ou se cria o V6 abaixo, ou se tira a chave da tela Avisos.
- **Tamanho**: P · **Quando**: v1. (Item para o agente A, na arquitetura.)

---

## 3. Valor que falta — para vender o Plus e para a academia querer o app

### V1. O dono vê quem sumiu, mas não tem o que fazer com isso
- **Problema**: o painel mostra "alunos sem treinar há 14+ dias" como número. Marcos não compra número, compra menos cancelamento.
- **Proposta**: a lista de quem sumiu ganha uma ação por aluno: "Chamar no WhatsApp" com texto pronto e editável ("Oi, Juliana! Sentimos sua falta…"), e a marca "Contatado em [data] por [Dani]". O painel mostra quantos voltaram depois do contato. Abrir o WhatsApp com texto pronto é um link, não precisa de integração (e não depende do **[decidir]** do chat, que é aluno ↔ personal).
- **Por que vale**: a pesquisa de retenção da IHRSA com The Retention People (2016, mais de 13 mil sócios no Reino Unido) achou que inativos que foram contatados e voltaram tinham 45 % menos chance de cancelar ([Health Club Management](https://www.healthclubmanagement.co.uk/health-club-management-news/Fitness-retention-IHRSA/325741)). É o argumento de venda para o Marcos, com fonte.
- **Tamanho**: M · **Quando**: v1.

### V2. O aluno novo é quem mais desiste, e o app não o separa
- **Problema**: não há filtro para "matriculou há menos de 60 dias". É a janela em que mais gente desiste.
- **Proposta**: filtro e número no painel: "Novos (60 dias)" e, dentro deles, "sem treino ativo" e "não treinou na 2ª semana". É a mesma tela do V1, com outro corte.
- **Tamanho**: P · **Quando**: v1.
- **Fonte**: os números sobre os primeiros 90 dias que achei vêm de blogs de fornecedores, sem estudo nomeado ([MyFitHive](https://myfithive.com/blog/view/first-90-days-gym-member-retention)). Uso como direção, não como prova.

### V3. Os aparelhos do app não são os da sala
- **Problema**: a própria Proposta acusa os apps genéricos disso. Mas o exercício da academia (R4.1) tem só texto e "imagem opcional", sem câmera e sem dizer onde fica o aparelho. Juliana não sabe o que é "cadeira extensora".
- **Proposta**: em Editar exercício, botão "Fotografar o aparelho" (câmera direto) e campo "Onde fica / número do aparelho" ("Aparelho 12, perto da janela"). Na execução, a foto e o número aparecem ao tocar no exercício. Não é o vídeo adiado em `05-FORA-DA-V1.md`: é uma foto tirada pela própria Dani, sem custo de produção.
- **Tamanho**: P · **Quando**: v1.

### V4. Uma academia nova começa com a biblioteca vazia
- **Problema**: antes de o aluno ver algo, alguém precisa montar treinos prontos. Isso é a barreira de entrada do Marcos.
- **Proposta**: um pacote de ~10 modelos (2 por objetivo da R2.1), que a academia importa com um toque, revisa e publica como dela. Não é a "biblioteca geral sem academia" adiada: o aluno só vê o que a academia publicou. Os modelos precisam ser escritos por um profissional com CREF (ver R6).
- **Tamanho**: M (conteúdo) · **Quando**: v1.

### V5. Pôr 350 alunos no app, um por um
- **Problema**: o Vincular aluno (R8.2) é por e-mail ou telefone, um de cada vez. Marcos já tem a lista no sistema de gestão.
- **Proposta**: importar uma planilha (nome, e-mail, telefone) e mandar os convites em lote, mais o QR do A1 no balcão. Integração direta com os sistemas de gestão fica para depois: não achei API pública documentada da EVO (W12), da Next Fit nem da Tecnofit (busca de 10/10/2026); teria de ser parceria.
- **Tamanho**: M · **Quando**: v1 (planilha). A integração fica para depois.

### V6. A academia não tem como falar com todos os alunos
- **Problema**: "feriado, abrimos às 9h", "aparelho novo na sala". Hoje isso vai num grupo de WhatsApp que ninguém lê. A Proposta diz que o app é "o canal que o sistema de gestão nunca deu", mas não tem esse canal.
- **Proposta**: o dono escreve um aviso curto, que vai como notificação e card no Início de todos os alunos. Sem resposta, sem chat (não é rede social). Liga no A11.
- **Tamanho**: P · **Quando**: v1.

### V7. O Plus não mostra quem é o personal antes de assinar
- **Problema**: a tela de apresentação vende uma promessa genérica. O que convence o Rafael é o personal ser bom.
- **Proposta**: a apresentação do Plus mostra os personais da academia (foto, nome, CREF, uma linha "o que eu faço bem"). O aluno não escolhe (pergunta 3), mas vê quem pode cuidar dele. Liga no R6 (CREF visível).
- **Tamanho**: P · **Quando**: v1.

### V8. Falta o momento semanal do Plus
- **Problema**: "alguém de verdade olhando" precisa de um ritual. Sem ele, o Plus vira "um treino e uma dieta que chegaram uma vez".
- **Proposta**: um retorno semanal: o app pede ao aluno, no dia que o personal escolher, peso (opcional), uma nota de 1 a 5 da semana e um texto curto. O personal responde com um comentário. Sem foto e sem medidas na v1 (medidas estão adiadas). É o que faz o aluno sentir que paga por acompanhamento.
- **Como outros fazem**: nos apps de personal online, o "check-in" semanal é o centro do serviço. No Trainerize, a falta de um formulário semanal personalizável é um dos pedidos mais antigos dos usuários ([fórum de ideias da ABC Trainerize](https://ideas.abcfitness.com/forums/167887-coach-trainer-abc-trainerize/suggestions/46882063-being-able-to-create-progress-update-forms-to-send?page=3); [HubFit, comparativo de check-ins](https://hubfit.com/blog/top-5-client-check-in-tools-for-online-coaches), que é concorrente e precisa ser lido com cuidado).
- **Tamanho**: M · **Quando**: v1.

### V9. O personal não tem por onde começar o dia
- **Problema**: "Meus alunos Plus" é uma lista por nome. Com 20 alunos, ele não sabe quem precisa dele hoje.
- **Proposta**: a lista é ordenada por "precisa de atenção": retorno semanal sem resposta, 3 dias sem registro, adesão caindo, aluno novo sem treino. Cada linha diz o motivo. Usa só dados que a especificação já tem.
- **Tamanho**: P · **Quando**: v1.

### V10. O personal não comenta um treino específico
- **Problema**: o personal vê o histórico, mas não tem como dizer "boa, semana que vem sobe 2 kg" em cima do treino feito. Se o chat for o WhatsApp **[decidir]**, esse retorno fica fora do app e longe do dado.
- **Proposta**: comentário curto do personal no Treino realizado (detalhe), com aviso ao aluno. Funciona com qualquer resposta da pendência do chat.
- **Tamanho**: P · **Quando**: v1.

---

## 4. Riscos

### R1. Dieta montada pelo personal pode ser exercício ilegal da nutrição
- **Problema**: a Lei 8.234/1991 (art. 3º) põe a prescrição de dieta entre as atividades privativas do nutricionista. O Sistema CFN/CRN diz em nota oficial que, quando outro profissional prescreve, é exercício ilegal da profissão ([CFN — posicionamento](https://cfn.org.br/index.php/noticias/posicionamento-prescricao-dietetica/); [texto da lei, Câmara](https://www2.camara.leg.br/legin/fed/lei/1991/lei-8234-17-setembro-1991-363145-norma-pl.html)). O Plus, como está escrito (F7, H58), põe o **personal** escrevendo refeições, itens e quantidades para o aluno. Para um app que vende isso, o risco é de denúncia ao CRN e de a loja ou a academia recuarem.
- **Ressalva**: a lei cita a ADI 803, que discute a palavra "privativas". Não confirmei o resultado. Também não achei posição do CONFEF.
- **Proposta** (não troca a decisão "Plus = treino + alimentação", só o jeito): (a) a dieta só pode ser montada por quem tem CRN cadastrado, criando o papel "nutricionista" ao lado do personal; ou (b) o personal escreve "orientações de alimentação" gerais, sem plano com quantidades, e o plano de verdade fica para nutricionista. Consultar um advogado ou o CRN antes de desenhar mais telas de dieta. Isso afeta a pendência "dieta: texto livre ou banco de alimentos".
- **Tamanho**: G (decisão com gente de fora) · **Quando**: v1, antes do código da dieta.

### R2. A loja da Apple pode exigir compra dentro do app até no caminho "via academia"
- **Problema**: `03-DECISOES-TECNICAS.md` (seção 4) diz que serviço "com componente presencial costuma poder cobrar fora" e que o caminho C "não tem esse problema". As regras dizem coisa mais apertada:
  - 3.1.3(d) libera pagamento fora só para serviço **em tempo real** entre duas pessoas (o exemplo é "fitness training"). O Plus é acompanhamento **assíncrono** pelo app, o que se parece com conteúdo digital.
  - 3.1.1 exige compra dentro do app para "liberar recursos" e assinaturas.
  - 3.1.3(b) deixa o app liberar algo comprado em outro lugar, **desde que** também esteja à venda dentro do app.
  - 3.1.3(e) libera bens e serviços consumidos **fora** do app.
  Fonte: [Diretrizes da App Store](https://developer.apple.com/app-store/review/guidelines/). No Google, assinatura de fitness exige o faturamento da Play, e "mensalidade de academia" é exceção ([política de pagamentos](https://support.google.com/googleplay/android-developer/answer/10281818)).
- **Proposta**: corrigir a frase da seção 4 (o caminho C também tem risco) e, para o C passar melhor, desenhar o Plus como **serviço da academia**, contratado na recepção junto da mensalidade, com uma parte presencial de verdade (por exemplo, um encontro mensal com o personal). Assim fica mais perto do 3.1.3(e). Sem botão de compra no app e sem link para pagar fora. Pedir uma leitura prévia à Apple (App Review) antes do primeiro envio. Não resolve a pendência "quem paga", só mostra o custo de cada resposta.
- **Tamanho**: P (texto) + G (resposta da Apple) · **Quando**: v1.

### R3. Autorização que nasce ligada é consentimento fraco para dado de saúde
- **Problema**: R6.4 e F1, passo 6, fazem a chave "A academia pode ver meus dados corporais" nascer ligada. Para dado sensível, a LGPD (art. 11, I) pede consentimento "de forma específica e destacada". Uma caixa já marcada é a forma mais contestada de consentimento.
- **Proposta**: a chave nasce desligada, com um botão claro "Permitir que a academia veja" na hora em que o aluno preenche o primeiro dado corporal (junta com o A3). Guardar data e texto mostrado (o `consentimentoEm` já previsto). Dani perde dado de quem não tocar, mas é o preço de um consentimento que se sustenta.
- **Tamanho**: P · **Quando**: v1.

### R4. Quem é o controlador dos dados: a academia ou o Academia Plus?
- **Problema**: nenhum documento diz quem responde perante a ANPD. Com dado de saúde, isso precisa estar no contrato com a academia e na política de privacidade.
- **Proposta**: definir (o mais comum seria a academia como controladora e o Academia Plus como operador, mas depende do modelo de negócio **[decidir]** de uma ou várias academias). Escrever o contrato de tratamento de dados, nomear um encarregado e fazer o relatório de impacto (RIPD) antes de pôr a primeira academia real.
- **Tamanho**: M (jurídico) · **Quando**: v1, antes do lançamento.

### R5. Menores de idade: a regra da especificação e a recomendação não batem
- **Problema**: R6.11 pede responsável para menor de 18. A pergunta 16 recomenda conta a partir de 16 anos, com consentimento do responsável. Academia de bairro tem muito aluno de 14 a 17. A ANPD (Enunciado CD/ANPD nº 1/2023) aceita outras bases legais para menores, sempre pelo "melhor interesse", e o ECA Digital (Lei 15.211/2025) mudou o cenário. Não consegui confirmar o que ele exige de um app como este ([Felsberg sobre o enunciado](https://www.felsberg.com.br/importante-anpd-publica-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes/); [Confidata, LGPD comentada](https://confidata.com.br/blog/lgpd-comentada-10-criancas-adolescentes)).
- **Proposta**: um advogado confirma a regra à luz do ECA Digital, e a especificação fica com uma idade só. O fluxo do responsável (convite por e-mail, aceite, registro) precisa entrar no mapa de telas: hoje não existe.
- **Tamanho**: M · **Quando**: v1.

### R6. Quem monta treino precisa de CREF
- **Problema**: a prescrição de treino é atividade do profissional de educação física, e o CONFEF regulou o serviço à distância na Resolução nº 542/2024 ([texto em Normas Brasil](https://www.normasbrasil.com.br/norma/resolucao-542-2024_463073.html)). Não li a íntegra dos artigos. O app junta recepção e instrutor num papel só (pergunta 21): a recepção pode "Enviar treino" a um aluno, com o nome dela no selo.
- **Proposta**: campo "CREF" no vínculo de funcionário e de personal. Só quem tem CREF preenchido vê "Montar treino" e "Enviar para o aluno", e o número aparece no selo do treino. Não é a separação de papéis adiada em `05-FORA-DA-V1.md` (que pede telas de permissão): é um campo e uma condição. Proponho trazer para a v1 por causa da lei. Ler a íntegra da Res. 542/2024 antes.
- **Tamanho**: P · **Quando**: v1.

### R7. Treino sem triagem de saúde
- **Problema**: Juliana pode adotar um treino pronto sem ninguém saber que ela tem hipertensão. Com cadastro opcional, isso é o caso normal, e a responsabilidade cai na academia.
- **Proposta**: na hora de usar o primeiro treino, 3 perguntas sim/não no estilo do PAR-Q (dor no peito, tontura, problema que o médico mandou cuidar), opcionais como todo o resto. Um "sim" mostra "Fale com o instrutor antes de começar" e, se o aluno autorizar a academia, um selo no perfil para a Dani. Junto com a lista de restrições da pergunta 14.
- **Tamanho**: P · **Quando**: v1.

### R8. Dado de saúde guardado sem cifra no celular
- **Problema**: o SQLite local guarda dieta e treinos. Ficar fora do backup não basta se o aparelho for emprestado, perdido ou desbloqueado.
- **Proposta**: apagar o cache ao sair (B12) e guardar no cache local só o mínimo da dieta (o plano em vigor). Avaliar SQLite cifrado com a chave no `expo-secure-store`, se não pesar.
- **Tamanho**: P a M · **Quando**: v1 (apagar ao sair). A cifra fica para depois.

### R9. Suporte sem dono
- **Problema**: "não recebi o código", "meu treino sumiu", "o Plus não ligou". Ninguém está escrito como primeira linha. Com uma pessoa só no projeto, cada academia nova vira chamada no WhatsApp do Alex.
- **Proposta**: a recepção da academia é a primeira linha, e o app dá a ela o que precisa: no perfil do aluno, "último envio do celular em [data]" e o estado do Plus com histórico (R5.2). Uma tela "Ajuda" com as 10 dúvidas comuns. Erros no Sentry, já redigidos (`redigir.ts`).
- **Tamanho**: M · **Quando**: v1.

### R10. Custo que cresce sem ninguém ver: SMS
- **Problema**: H01 e H06 usam telefone e código por SMS. SMS é cobrado por mensagem pelo provedor, e a recuperação de senha é alvo comum de abuso (gente disparando códigos para gerar custo). O resto da conta é barato: o Supabase Pro custa US$ 25 por mês com 100 mil usuários ativos por mês e 250 GB de tráfego incluídos, segundo análises de 2026 que precisam ser conferidas no [site oficial](https://supabase.com/pricing) ([Jetadmin](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/)). Fotos de exercício (V3) são a maior fonte de tráfego: cache no aparelho resolve.
- **Proposta**: na v1, entrada por e-mail com código e por Google ou Apple. Telefone fica para depois, com limite de envios por número e por hora. Ligar o teto de gasto do Supabase.
- **Tamanho**: P · **Quando**: v1.

### R11. White-label nas lojas pode ser recusado
- **Problema**: a pendência de marca **[decidir]** tem um custo que ainda não está escrito. A Apple recusa apps feitos a partir de modelo comercial, a não ser que sejam enviados pelo próprio dono do conteúdo (a academia, com conta de desenvolvedor dela). Ver a diretriz 4.2.6 nas [Diretrizes da App Store](https://developer.apple.com/app-store/review/guidelines/), que não reli nesta revisão.
- **Proposta**: acrescentar essa linha à pendência de marca, em `05-WHITE-LABEL.md` e no P00, para o Alex decidir sabendo. Cor e logo da academia **dentro** de um app só não têm esse problema.
- **Tamanho**: P · **Quando**: v1 (só o texto).

---

## Top 10 — em ordem de valor ÷ esforço

| # | Item | Valor | Esforço |
|---|---|---|---|
| 1 | **R1** — Dieta pelo personal pode ser exercício ilegal da nutrição: decidir o jeito antes de fazer as telas | Evita refazer o Plus e um problema com o CRN | P a decidir, G para resolver |
| 2 | **A5** — Preencher a série com a última carga real, não com a planejada | Rafael para de corrigir todo campo | P |
| 3 | **R2** — Corrigir a leitura das regras da Apple e desenhar o Plus como serviço da academia | Evita recusa na loja ou 15–30 % de taxa | P (texto) |
| 4 | **A2** — Vínculo pendente já mostra os treinos prontos | O primeiro dia da Juliana deixa de ser vazio | P |
| 5 | **V3** — Foto do aparelho tirada pela academia e "onde fica" | Cumpre a promessa da Proposta ("os aparelhos da sala") | P |
| 6 | **V1** — Quem sumiu, com "Chamar no WhatsApp" e "contatado em" | É o que o Marcos compra: menos cancelamento | M |
| 7 | **R3** — Autorização da academia nasce desligada e é pedida na hora certa | Consentimento que se sustenta na LGPD | P |
| 8 | **B8 + B9** — "Pedir treino novo" e "Trocar em [data]" | Fila de trabalho para a Dani, ficha nunca vence esquecida | P |
| 9 | **A6** — "Dar treino pronto" em dois toques | Põe 350 alunos com treino sem abrir o editor | P |
| 10 | **B2** — Personal removido obriga a redistribuir os alunos Plus | Ninguém paga Plus sem personal | P |

Logo abaixo do corte: B6 (treino avulso), R6 (CREF no vínculo), A1 (QR do código), B11 (aluno sem academia sem visão), V8 (retorno semanal do Plus).

## Itens para outros agentes

- **A (arquitetura)**: B10 (encerrar vínculo de aluno pela academia, `01-MODELO-DE-DADOS.md`, linha 75); B11 (zero vínculos, `03-DECISOES-TECNICAS.md`, seção 1, passo 3); A11 (tabela de notificações incompleta, seção 3); R2 (frase sobre o caminho C, seção 4).
- **D (PDF)**: R1 e R2 mudam o que se pode prometer do Plus. A página de decisões pendentes deveria citá-los.

## Fontes consultadas (10/10/2026)

- Apple — [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) (3.1.1, 3.1.3 a/b/c/d/e/f, 5.1.1(v), 5.1.3).
- Google Play — [Política de pagamentos](https://support.google.com/googleplay/android-developer/answer/10281818) · [Monetização e pagamentos](https://play.google.com/about/monetization-ads/payments).
- CFN — [Posicionamento: prescrição dietética](https://cfn.org.br/index.php/noticias/posicionamento-prescricao-dietetica/) · [Lei 8.234/1991](https://www2.camara.leg.br/legin/fed/lei/1991/lei-8234-17-setembro-1991-363145-norma-pl.html).
- CONFEF — [Resolução nº 542/2024 (serviço à distância)](https://www.normasbrasil.com.br/norma/resolucao-542-2024_463073.html).
- ANPD — Enunciado CD/ANPD nº 1/2023, via [Felsberg](https://www.felsberg.com.br/importante-anpd-publica-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes/) e [Machado Meyer](https://www.machadomeyer.com.br/pt/inteligencia-juridica/publicacoes-ij/direito-digital/nova-regra-de-tratamento-de-dados-de-criancas-e-adolescentes) · [Confidata, art. 14 comentado](https://confidata.com.br/blog/lgpd-comentada-10-criancas-adolescentes).
- Retenção — [IHRSA/TRP 2016, Health Club Management](https://www.healthclubmanagement.co.uk/health-club-management-news/Fitness-retention-IHRSA/325741) · [MyFitHive, primeiros 90 dias](https://myfithive.com/blog/view/first-90-days-gym-member-retention) (fornecedor, sem estudo nomeado).
- Apps de treino — [Hevy, recursos](https://www.hevyapp.com/features/exercise-programming-options/) · [Hevy, registrar treinos](https://www.hevyapp.com/features/track-workouts/) · [notas da versão 1.29.20](https://www.apkmirror.com/apk/hevy-gym-workout-tracker/hevy-gym-log-workout-tracker/hevy-gym-log-workout-tracker-1-29-20-release/).
- Apps de academia no Brasil — [Tecnofit na App Store](https://apps.apple.com/app/id1109478634) (ficha, carga, avaliação, frequência, contrato) · [EVO Experience](https://apps.apple.com/ec/app/evo-experience/id6748023921).
- Personal online — [fórum de ideias da ABC Trainerize](https://ideas.abcfitness.com/forums/167887-coach-trainer-abc-trainerize/suggestions/46882063-being-able-to-create-progress-update-forms-to-send?page=3) · [HubFit](https://hubfit.com/blog/top-5-client-check-in-tools-for-online-coaches).
- Custo — [Jetadmin, Supabase 2026](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/) (conferir em supabase.com/pricing).
