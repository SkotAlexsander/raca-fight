# 02 — Fluxos principais

Este arquivo descreve, tela a tela e em texto, os caminhos mais importantes do app.
Quem nunca viu o app deve conseguir acompanhar cada fluxo de cabeça; os nomes das telas são os de `04-MAPA-DE-TELAS.md`.

Convenção: cada passo é "**Tela** — o que a pessoa vê e faz". Setas "→" indicam mudança de tela. **[decidir]** marca onde o fluxo depende de uma pendência.

---

## F1. Primeiro acesso do aluno

Quem: visitante que vai virar aluno. Histórias: H01, H03, H04, H09, H10.

1. **Boas-vindas** — logo, uma frase ("Seu treino e sua academia no mesmo lugar") e dois botões: "Criar conta" e "Já tenho conta".
2. **Criar conta** — nome, e-mail ou telefone, senha. Botões de Google e Apple. Toca em "Criar".
3. **Confirmar contato** — digita o código que chegou por e-mail/SMS. (Se entrou com Google/Apple, pula.)
4. **Sua academia** — campo "Código da academia" e botão "Não tenho código, vou treinar sozinho por enquanto".
   - Com código válido → o app mostra o nome da academia e pede "Confirmar que é esta". O vínculo fica **pendente** até a recepção confirmar (H44) — ou entra na hora se a academia desligou a confirmação (configuração do dono).
   - Sem código → segue como aluno sem academia (vê treino livre; não vê treinos prontos de academia nenhuma).
5. **Sobre você (opcional)** — tela com "Pular" visível no topo. Pergunta objetivo (lista), dias por semana que pretende treinar, data de nascimento, peso, altura, restrições (texto curto). Qualquer campo pode ficar vazio.
6. **Quem pode ver** — explica em duas frases que peso, altura e restrições são dados de saúde; chave "A academia pode ver meus dados corporais" (ligada por padrão se há academia; sem academia, a tela não aparece). Botão "Entendi".
7. → **Início (aluno)** — vazio ainda: card "Monte seu primeiro treino" com dois caminhos: "Treino livre" e "Treino pronto da academia" (este só se há vínculo).

Observação: do passo 2 ao 7 nada trava. Quem pulou o passo 5 pode preencher depois em **Perfil → Meus dados**.

---

## F2. Montar treino livre

Quem: aluno. Histórias: H15–H21.

1. **Treinos (aluno)** — lista dos treinos do aluno (vazia na primeira vez). Botão "+ Novo treino".
2. **Novo treino** — campo nome ("Treino de verão"), objetivo opcional, e a pergunta "Quantos dias diferentes?" com atalho (1, 2, 3, 4, 5) ou "Adiciono depois". Toca "Criar".
3. **Editar treino** — mostra os dias como abas (A, B, C…). Toca no nome do dia para renomear ("Peito e tríceps"). Cada aba lista os exercícios do dia. Botão "+ Exercício".
4. **Escolher exercício** — busca por nome; filtros por grupo muscular (peito, costas, pernas…). Lista vem da biblioteca da academia (se vinculado) e da biblioteca geral do app. No fim: "Não achei, criar exercício só com nome" (H20). Toca no exercício → volta à aba do dia com ele adicionado.
5. **Editar treino** (de novo) — o exercício aparece com valores padrão (3 séries × 12 repetições, descanso 60 s, carga vazia). Toca no exercício → **Séries do exercício**.
6. **Séries do exercício** — lista de séries. Cada linha: repetições (ou tempo em segundos, para prancha/esteira), carga (kg na tela, gramas por baixo), descanso. Botões "+ Série" e "Copiar para as outras séries". Campo "Observação" (ex.: "pegada fechada"). Botão "Pronto".
7. Repete 4–6 para cada exercício. Segura e arrasta para reordenar (H18). Menu do dia: "Duplicar dia", "Apagar dia".
8. **Editar treino** — botão "Usar este treino" no topo. Toca → o treino vira o **ativo** (o anterior continua guardado, só perde o selo de ativo).
9. → **Início (aluno)** — mostra "Hoje: Treino de verão — A (Peito e tríceps)" e botão "Começar".

Regra de salvamento: tudo salva a cada toque; não existe botão "Salvar" que o aluno possa esquecer.

---

## F3. Escolher treino pronto por objetivo

Quem: aluno vinculado a uma academia. Histórias: H22–H26.

1. **Treinos (aluno)** — aba "Prontos da academia".
2. **Treinos prontos** — no topo, o objetivo do aluno já selecionado como filtro ("Ganhar massa"); pode trocar por outro ou "Todos". Se o aluno não informou objetivo, o filtro começa em "Todos" (H26). Filtro secundário por nível (iniciante, intermediário, avançado) e dias por semana. Cada card: nome, objetivo, nível, quantos dias, quem montou (nome da academia).
3. **Ver treino pronto** — descrição curta, dias com exercícios e séries, só leitura. Botão "Usar este treino".
4. **Confirmar** — folha de baixo: "Você vai receber uma cópia deste treino. Pode ajustar carga e séries à vontade; a academia pode atualizar o original sem mexer no seu." Botão "Usar".
5. → **Editar treino** — a cópia, agora do aluno, aberta para ajustes (H25), já marcada como ativa. Tem o selo "Baseado em: [nome do treino pronto] — [academia]".
6. → **Início (aluno)** — "Hoje: …" e "Começar".

---

## F4. Registrar um treino feito (o dia de treino)

Quem: aluno com treino ativo. Histórias: H29–H35.

1. **Início (aluno)** — card "Hoje: Treino X — Dia B". O app sugere o dia seguinte ao último feito (fez A ontem, sugere B). O aluno pode trocar o dia pelo seletor. Botão "Começar".
2. **Treino em andamento** — cabeçalho com cronômetro total rodando e nome do dia. Lista de exercícios; o primeiro expandido. Cada série é uma linha: repetições planejadas / carga planejada, e dois campos para o real (vêm preenchidos com o planejado para marcar com um toque). Ao lado, em cinza, "Última vez: 12 × 20 kg" (H31).
3. Toca na marca da série → série feita; o **cronômetro de descanso** começa com o tempo da série (60 s) e vibra ao acabar (H32). Dá para pular o descanso.
4. Mudou a carga? Toca no campo, digita, confirma. O valor fica salvo para a próxima vez.
5. Menu do exercício: "Pular hoje" (fica marcado como pulado) e "Trocar por outro" → **Escolher exercício** → volta com o novo no lugar, só neste treino de hoje (H33).
6. Fez a última série → o app pergunta "Encerrar treino?" (ou o aluno toca "Encerrar" quando quiser).
7. **Resumo do treino** — tempo total, séries feitas / planejadas, volume (soma de repetições × carga), exercícios pulados. Campo "Como foi?" (texto curto opcional). Botão "Concluir".
8. → **Início (aluno)** — mostra "Treino de hoje feito" com a sequência de dias da semana marcada.

Sem sinal (H35): tudo funciona igual; aparece um aviso discreto "Sem conexão — vai sincronizar depois". Ao voltar o sinal, o registro sobe sozinho.

Esqueceu de registrar (H36): em **Histórico**, botão "Registrar treino passado": escolhe data, dia do treino, marca as séries feitas (sem cronômetro).

---

## F5. Funcionário abre o perfil de um aluno e monta treino para ele

Quem: funcionário, personal ou dono. Histórias: H38–H41.

1. **Alunos (academia)** — lista com busca por nome. Filtros: "Sem treinar há 14+ dias", "Sem treino ativo", "Plus". Cada linha: foto, nome, última vez que treinou.
2. Toca no aluno → **Perfil do aluno (academia)**:
   - Cabeçalho: nome, há quanto tempo é aluno, selo Plus se for.
   - Bloco "Dados corporais": se o aluno autorizou, mostra peso, altura, idade, objetivo, restrições, dias por semana. Se não autorizou, mostra "O aluno não liberou os dados corporais" e nada mais.
   - Bloco "Treino atual": nome, dias, quem montou, última execução.
   - Bloco "Frequência": dias treinados nas últimas 4 semanas.
   - Botão "Montar treino para [nome]".
3. **Montar treino para aluno** — pergunta "Começar de onde?": "Do zero", "A partir de um treino pronto" (H41) ou "A partir do treino atual dele".
4. → **Editar treino (modo academia)** — mesma tela de edição do aluno (F2, passos 3–7), com uma faixa no topo "Montando para [nome do aluno]". Se o aluno autorizou dados corporais, o painel lateral mostra objetivo e restrições para o funcionário consultar enquanto monta.
5. Botão "Enviar para o aluno" → folha: "Tornar este o treino ativo dele?" (sim/não) e campo "Recado" (opcional: "Começa leve na primeira semana").
6. → **Perfil do aluno (academia)** — bloco "Treino atual" atualizado, com o selo "Montado por [funcionário] em [data]".
7. Do lado do aluno: notificação "A academia montou um treino para você" → **Ver treino** com o recado e o botão "Usar este treino" (se o funcionário não marcou como ativo) ou já ativo.

Regra: o funcionário **não edita** o treino que o aluno montou sozinho. Ele cria um novo (pode partir de uma cópia do atual). O do aluno fica intacto.

---

## F6. Assinar o Plus

Quem: aluno. Histórias: H46, H47, H48.

**[decidir]** O fluxo abaixo tem duas versões. A primeira é o aluno pagando no app; a segunda é a academia cobrando junto da mensalidade.

### Versão A — o aluno assina no app

1. **Plus (aluno)** — tela de apresentação: "Um personal acompanhando você pelo app: treino sob medida, dieta e conversa direta". Lista do que inclui, preço por mês, "Cancele quando quiser". Botão "Assinar o Plus".
2. **Pagamento** — **[decidir]** Loja (Google Play / App Store, assinatura recorrente) · Pix ou cartão por um meio de pagamento próprio. Confirma.
3. **Plus ativo** — "Pronto. Sua academia vai designar um personal para você em até 2 dias úteis." (Se a academia já tem um personal padrão, mostra na hora: nome e foto.)
4. → **Plus (aluno)** passa a ter três blocos: "Meu personal", "Meu treino" (vazio até o personal montar), "Minha dieta" (vazia até o personal montar) e o botão de conversa.

### Versão B — a academia liga o Plus

1. **Plus (aluno)** — apresentação igual à versão A, mas o botão é "Falar com a recepção" (mostra o que dizer: "Quero o Plus").
2. **Perfil do aluno (academia)** — a recepção toca em "Ligar o Plus", escolhe o personal (ou deixa o dono designar) e confirma. A cobrança acontece fora do app, junto da mensalidade.
3. Aluno recebe notificação "Seu Plus está ativo" → **Plus (aluno)** com os blocos da versão A, passo 4.

### Em comum, depois de ativo

- O dono (ou a recepção) designa o personal em **Academia → Alunos Plus** (H63). O aluno é avisado.
- O personal vê o aluno novo em **Meus alunos Plus** com o selo "Novo — sem treino e sem dieta".

---

## F7. Personal monta dieta

Quem: personal, para um aluno Plus designado a ele. Histórias: H56, H58, H59.

1. **Meus alunos Plus (academia)** — lista só dos alunos dele. Toca no aluno.
2. **Aluno Plus (personal)** — abas: "Resumo" (dados corporais, objetivo, restrições, frequência, adesão à dieta nos últimos 7 dias), "Treino", "Dieta", "Conversa".
3. Aba **Dieta** — vazia: "Montar plano de dieta". Com plano: lista de refeições do plano atual e o botão "Novo plano" / "Copiar e ajustar" (H59).
4. **Editar plano de dieta** — nome ("Semana 1 — adaptação"), data de início, observação geral ("Beber 2 L de água"). Lista de refeições com botão "+ Refeição".
5. **Refeição** — nome (Café da manhã, Lanche, Almoço…), horário sugerido, lista de itens com "+ Item".
6. **Item** — **[decidir]** Texto livre por item: "2 ovos mexidos + 1 fatia de pão integral" com quantidade dentro do texto · Banco de alimentos: busca o alimento, informa gramas, o app mostra calorias e macros e soma por refeição e por dia.
7. Repete 5–6 para cada refeição. Dá para marcar uma refeição como "Opcional" e para escrever uma troca ("pode trocar o arroz por batata-doce").
8. Botão "Enviar ao aluno" → folha: "A partir de [data]. Substitui o plano atual?" Confirma.
9. → **Aluno Plus (personal)**, aba Dieta mostra o plano com o selo "Em vigor desde [data]". O aluno recebe a notificação "Seu personal enviou sua dieta".

---

## F8. Aluno segue a dieta no dia

Quem: aluno Plus com plano de dieta em vigor. Histórias: H50, H51, H52.

1. **Início (aluno)** — além do card de treino, aparece "Dieta de hoje: 3 de 5 refeições feitas" com a próxima refeição em destaque ("Lanche da tarde — 16:00").
2. Toca → **Dieta do dia** — a data no topo (pode voltar para dias anteriores). Lista de refeições em ordem de horário; cada uma com os itens e três estados: a fazer, feita, não segui.
3. Toca em "Feita" → marca com a hora. Toca de novo para desmarcar (errou).
4. Toca em "Não segui" → abre campo curto "O que aconteceu?" (opcional: "almocei fora"). Salva (H52).
5. Refeição marcada "Opcional" pelo personal não conta na porcentagem do dia.
6. O personal vê, no **Resumo** do aluno, a adesão (refeições feitas / planejadas) por dia nos últimos 7 e 30 dias, e os motivos escritos.
7. Se o aluno não marcou nada em 3 dias, o personal recebe aviso (H60). O aluno recebe, se quiser (configurável em Perfil → Avisos), um lembrete no horário de cada refeição.

Sem sinal: marca normalmente; sincroniza depois (igual ao treino).

---

## Fluxos curtos que valem citar

- **Trocar de visão (H05)**: Perfil → "Entrar como instrutor" / "Entrar como aluno". A troca é imediata; o app lembra a última visão usada.
- **Desligar a autorização (H13)**: Perfil → Meus dados → chave "A academia pode ver meus dados corporais" → desliga → confirma. Na hora, os funcionários param de ver. O personal do Plus é exceção (ver `03-REGRAS.md`, seção 6).
- **Cancelar o Plus (H54)**: Plus → "Gerenciar assinatura" → "Cancelar" → mostra até quando vale → confirma. O que acontece com os dados está em `03-REGRAS.md`, seção 5.
- **Dono designa personal (H63)**: Academia → Alunos Plus → aluno → "Designar personal" → lista dos personais com quantos alunos cada um tem → escolhe → ambos são avisados.

---

## F9. Usar o cronômetro (livre, regressivo, intervalado)

Acrescentado em 10/10/2026 (agente H, P07). Quem: aluno. Histórias: H69–H76 (e H32, o descanso). Regras: seção 9 de `03-REGRAS.md`.

1. **Por onde abre**:
   - **Treino em andamento** — botão com o relógio no cabeçalho, ao lado do menu ⋯. Abre a tela **Cronômetro** por cima do treino; o treino continua rodando atrás.
   - **Início (aluno)** — atalho "Cronômetro" logo abaixo do cartão do treino de hoje, mesmo sem treino ativo.
2. **Cronômetro** (parado) — no topo, três chips: **Livre · Regressivo · Intervalado**. Abre no último modo usado.
   - **Livre**: só o número (0:00) e "Iniciar".
   - **Regressivo**: atalhos 1, 2, 3, 5, 10 min e "Outro"; o número mostra o tempo escolhido; "−30 s" e "+30 s" ajustam antes de começar.
   - **Intervalado**: chips das predefinições (Tabata 20/10 × 8, EMOM 10 min, HIIT 30/30 × 10, HIIT 40/20 × 8, Personalizado). Abaixo, os quatro números editáveis (preparação, trabalho, descanso, rodadas) com o total ("Total 4:00").
   - Botão grande **"Iniciar"** (64).
3. **Cronômetro** (rodando) — some a configuração e fica o **mostrador**:
   - o nome da fase, o número grande (96) e a barra da fase;
   - no intervalado, "Rodada 3 de 8", a fileira de rodadas e "Depois: descanso 10 s";
   - a fase pinta o mostrador: trabalho na cor `marca`, descanso na `sucesso`, preparação na superfície.

   Embaixo, os controles conforme o modo:
   - livre: "Volta" · Pausar · "Parar";
   - regressivo: "−30 s" · Pausar · "+30 s", e "Pular" abaixo;
   - intervalado: "Pular fase" · Pausar · "Parar".

   A tela não apaga sozinha (R9.13).
4. Troca de fase (intervalado): vibração média, o mostrador muda de cor e o leitor de tela anuncia "Descanso, 10 segundos". Nos 3 últimos segundos de cada fase, vibração leve a cada segundo.
5. O aluno bloqueia o celular ou sai do app → o tempo segue (R9.4); as trocas de fase e o fim chegam como notificação (R9.11). Ao voltar, a tela mostra o tempo certo na hora.
6. Fora da tela Cronômetro (de volta ao treino, ou outra aba), o cronômetro vira a **faixa** acima das abas: "Trabalho 3/8 · 0:14". Tocar nela volta ao Cronômetro.
7. **Terminou** (regressivo ou intervalado) ou **Parar** (qualquer modo) → o mostrador fica em "Terminou" (cor `sucesso`) com o resumo ("8 rodadas · 3:50 de trabalho e descanso" no intervalado; as voltas no livre) e três botões:
   - **"Registrar como série"** (livre, intervalado e regressivo avulso, com 1 s ou mais) → folha **Registrar como série**;
   - **"De novo"** (zera e mantém a configuração);
   - **"Fechar"**.
8. **Registrar como série** (folha) — campo de tempo já preenchido (o tempo feito, sem pausas, sem o que foi pulado e sem a preparação, R9.10), editável, e o exercício:
   - com treino em andamento: o exercício atual, se for por tempo; senão, "Escolher exercício" (só os por tempo);
   - sem treino: "Escolher exercício" e o botão vira "Salvar no histórico" (treino realizado sem treino de origem).

   "Salvar" → toast "Série salva · 3:50" com "Desfazer".

### Variações dentro do treino (F4)

- **Descanso** (F4, passo 3): marcar a série começa o regressivo com o descanso dela. É o componente 7: anel, "−30 s", Pausar, "+30 s" e "Pular descanso". Marcar outra série reinicia o descanso.
- **Série por tempo** (prancha, esteira de 5 min): na linha da série, a marca vira **"Iniciar"**. Conta o tempo da série no mesmo componente 7, com o rótulo "Prancha · série 2". No fim: vibração, a série marcada como feita com o tempo, e o descanso começa (R9.10). "Parar" antes do fim marca com o tempo feito.
- **Marcou uma série com o intervalado rodando** (o aluno fazia HIIT entre os exercícios): a série fica marcada, o descanso **não** começa e o intervalado segue. Toast "Série feita · o intervalado continua" com o botão "Descansar", que pergunta antes de parar o intervalado (R9.9).
- **Encerrar o treino** com um cronômetro avulso rodando: o treino encerra e o cronômetro continua na faixa. Com descanso rodando, o descanso some junto com o treino.

---

## F10. A academia manda um aviso para todos os alunos

Quem: dono ou recepção. Histórias: H84, H85, H86. Regras: R10.10 a R10.13. Escrito no P07 (agente G); a numeração começa em F10 para deixar F9 ao cronômetro.

1. **Alunos (academia)** — no topo, o botão "Aviso para todos" (só para quem pode escrever, R10.10). Toca.
2. **Avisos da academia** — lista dos avisos: o que está em vigor no topo ("No Início até sexta"), os antigos embaixo, em cinza. Botão "+ Novo aviso".
3. **Novo aviso** — um campo de texto com contador ("42 de 160"). "Fica no Início por": 1 dia · 3 dias (padrão) · 7 dias · 14 dias. Chave "Mandar notificação", ligada. Uma linha fixa embaixo do campo: "Vai para todos os alunos. Não cite aluno nem saúde." Uma prévia mostra como fica na tela bloqueada e no cartão do Início.
   - Se a academia já mandou um aviso com notificação hoje, a chave vem desligada e travada, com a frase: "A academia já mandou uma notificação hoje. Este aviso vai só como cartão no Início." (R10.11)
   - Link, mais de 3 linhas ou mais de 160 caracteres: o botão não liga e a frase diz o que mudar ("Tire o link: o aviso não abre site.").
4. Toca "Enviar para 214 alunos" → folha: "Enviar agora? Quem deixou os avisos da academia ligados recebe a notificação." Se passa das 22h: "A notificação sai às 7h. O cartão aparece agora." Confirma.
5. → **Avisos da academia** — o aviso novo no topo, com "No Início até [data]". O menu do aviso tem "Retirar": "Some do Início de todos. Quem já recebeu a notificação continua com ela." Confirma (H86).
6. Do lado do aluno: a notificação chega (título: nome da academia; corpo: o texto), se a chave "Avisos da academia" está ligada. O toque abre o **Início** com o cartão do aviso no topo: nome da academia, o texto, "há 2 h" e o botão "Dispensar" (H85). Sem responder, sem curtir, sem "lido por".

Sem sinal na hora de escrever: a tela avisa "Sem conexão. O texto fica aqui; envie quando a internet voltar." O aviso não entra na fila de envio (a visão da academia não funciona offline, `03-DECISOES-TECNICAS.md`, seção 2).

---

## F11. O aluno ajusta os avisos

Quem: aluno. Histórias: H80 a H83. Regras: R10.3 a R10.8, R10.14.

1. **Perfil (aluno)** → **Avisos**.
2. **Avisos (aluno)** — as linhas, cada uma com chave:
   - **Cronômetro**: "Avisa o fim do descanso e do cronômetro com a tela desligada." (ligado)
   - **Lembrete de treino**: desligado no começo. Ao ligar, escolhe os dias (com o atalho "Usar minha frequência: 3 dias", se informou no cadastro) e a hora (de 07:00 a 21:59). Embaixo: "Próximo: segunda, 18:00".
   - **Lembrete de refeição** (só Plus): "Um resumo à noite" (padrão, com a hora) · "Em cada refeição" · "Desligado".
   - **Personal** (só Plus): "Quando o personal mudar seu treino ou seu plano alimentar."
   - **Mensagens** **[decidir]** (só se o chat for próprio).
   - **Avisos da academia**: "Avisos da recepção e treinos novos montados para você."
   - **Plus**: "Quando o Plus ativar, mudar de personal ou estiver perto de acabar."
   - Rodapé fixo: "Entre 22h e 7h o app não avisa nada, só o descanso do treino em andamento."
3. Ao ligar a primeira chave que depende do sistema (lembrete), se o celular ainda não deu permissão: a frase "Para lembrar você, o celular precisa deixar o app avisar." e o pedido do sistema. Negou: a linha do topo vira "Avisos desligados no celular · Abrir ajustes".
4. Tudo salva no toque; o app recalcula a agenda da semana na hora (`agendaDaSemana`).

**Convite ao lembrete**: no **Resumo do treino** do primeiro treino fechado, uma linha: "Quer um lembrete nos dias de treino?" · "Quero" (abre a linha do lembrete) · "Agora não" (não pergunta de novo por 30 dias).

---

## F12. Tocar numa notificação

1. O toque abre o lugar do aviso: Início (aviso da academia), Ver treino (treino novo), Dieta do dia (lembrete de refeição), Treino em andamento (descanso), Alunos com o filtro certo (equipe).
2. Se o aviso é da outra visão (a Dani é aluna e instrutora e estava na visão do aluno), o app troca de visão antes de abrir, como em "Trocar de visão" (H05).
3. Sem sessão (saiu da conta): abre a tela de entrada e nada mais. A notificação nunca mostra nada que só a sessão deveria mostrar.

---

## F13. Abertura e entrada com duas portas (P09, agente O)

Acrescenta ao F1, sem trocar o que ele diz. O F1 continua valendo para o aluno do passo 2 em diante; este fluxo mostra o que vem antes dele, a porta da academia e como as duas portas casam com a regra **"o papel decide a visão"**. Mockup: `02-design/sistema-de-design/mockups/entrada.html`. Histórias: H01 a H06, H09, H10, H13, H44, H62, H67.

### F13.1 Abertura

1. **Abertura** — a cor da marca cheia com o símbolo no centro (no escuro, verde profundo com o símbolo em verde vivo). É o que o sistema mostra enquanto o app carrega (`expo-splash-screen`).
2. Quando o app termina de carregar, o símbolo encolhe e sobe para o selo do logo, a foto aparece por baixo e o texto entra. Com "reduzir movimento", a abertura só esmaece.
3. Para onde vai:
   - **sem sessão** → **Boas-vindas**;
   - **com sessão** → direto para a visão do vínculo, sem passar pelas boas-vindas (a decisão "Visão decidida pelo vínculo" em `docs/decisoes.md`). Com mais de um vínculo, a última visão usada; sem nenhuma guardada, **Escolher visão / academia**.

### F13.2 Boas-vindas: as duas portas

**Boas-vindas** — foto grande, a frase "Seu treino e sua academia no mesmo lugar." e duas portas em vidro sobre a foto:

| Porta | Para quem | O que pede | Onde termina |
|---|---|---|---|
| **Sou aluno** | quem treina | conta (Apple, Google ou e-mail); depois, tudo opcional: código da academia, objetivo, dias por semana | Início do aluno, já com o treino livre |
| **Sou da academia** | personal, instrutor, recepção e dono | conta (as mesmas três formas); depois, convite ou código da equipe, ou "Vou abrir minha academia" | a visão da academia quando o dono confirma; até lá, pode usar a visão do aluno |

O botão "Já tenho conta" do F1 sai das boas-vindas. As duas portas levam a uma tela que serve para entrar **e** para criar conta: Apple e Google criam a conta no primeiro uso, e o e-mail tem "Entrar" e "Criar conta".

### F13.3 Porta "Sou aluno"

1. **Aluno · como entrar** — "Continuar com a Apple", "Continuar com o Google" (mesmo tamanho, mesmo estilo, um embaixo do outro: diretriz 4.8 da App Store) e "Continuar com e-mail". Rodapé com Termos de uso e Política de privacidade.
2. **Entrar com e-mail** — e-mail, senha, "Esqueci a senha", "Entrar"; embaixo, "Não tem conta? Criar conta".
   - **Esqueci a senha** — e-mail → código de 6 números → nova senha (H06). O mesmo campo de 6 caixas serve ao **Confirmar contato** do F1.
3. **Criar conta** — nome, e-mail, senha (o aviso "Pelo menos 8 caracteres" aparece antes do erro) → **Confirmar contato** (F1, passo 3).
4. **Sua academia** (opcional, "Pular" no topo; passo 1 de 3) — código de 6 caracteres da academia (R8.1). Se achar a academia, mostra o nome e "É esta, pedir para entrar". O vínculo nasce `pendente` até a recepção confirmar (H44), ou `ativo` se o dono desligou a confirmação. Sem código: "Vou treinar sozinho por enquanto" (R8.4).
5. **Objetivo** (opcional, "Pular"; passo 2 de 3) — a lista fixa de R2.1, uma escolha só (R2.2). Os nomes da lista são **[decidir]** (P00).
6. **Dias por semana** (opcional, "Pular"; passo 3 de 3) — número de 1 a 7, com − e +. Fica vazio se a pessoa pular.
7. **Quem pode ver** — o passo 6 do F1. Aparece só se há academia **e** o aluno respondeu o objetivo, que é dado de saúde (R6.1). Sem academia, não há a quem autorizar.
8. → **Início (aluno)** (F1, passo 7).

**Diferença em relação ao F1**: no F1, a tela **Sobre você** pergunta numa vez só objetivo, dias, data de nascimento, peso, altura e restrições. Na entrada ficam só **objetivo e dias por semana**, uma pergunta por tela. O resto (data de nascimento, peso, altura, restrições) fica para **Perfil → Meus dados**, e o Início convida uma vez: "Quer informar peso e altura? Ajuda o instrutor a montar o seu treino." O motivo: duas perguntas rápidas não cansam no primeiro minuto, e as que pedem número e balança são as que a pessoa mais pula. **[decidir]** Se o Alex preferir a tela única do F1, a entrada volta a ela e o mockup troca duas telas por uma.

A ordem segue a do F1 (academia antes das perguntas), porque a tela **Quem pode ver** depende de existir uma academia.

### F13.4 Porta "Sou da academia"

1. **Academia · entrar** — as mesmas três formas de conta. Quem já tem vínculo de equipe entra e cai direto na visão que o vínculo dá. Embaixo, para a primeira vez: "Tenho um convite ou código" e "Vou abrir minha academia".
2. **Convite ou código**:
   - **Convite por e-mail**: o dono digita o e-mail da pessoa e o papel (H62), como o R8.2 faz com o aluno. O link abre o app, a pessoa cria a conta e o vínculo nasce `ativo` com o papel que o dono escolheu, porque o dono já confirmou ao convidar.
   - **Código da equipe**: 6 caracteres, **diferente** do código dos alunos, que o dono troca quando quiser (como no H67). A pessoa digita o código, diz o papel que espera ("Recepção ou instrutor" ou "Personal"; "Dono" não é opção) e toca "Pedir para entrar".
3. **Pedido pendente** — "Pedido enviado. O dono confirma pelo app." O vínculo fica `pendente` até o **dono** confirmar e escolher o papel; o pedido só sugere o papel, não o define. Enquanto espera, "Treinar como aluno enquanto isso" abre a visão do aluno com a mesma conta, e "Cancelar o pedido" desfaz. O dono recebe o aviso do pedido, somado de 2 em 2 horas (R10.7).
4. **Dono abre a academia** — nome e cidade. A academia nasce com essa conta como **dono**, o código dos alunos e o código da equipe. **[decidir] Uma academia ou várias** (P00):
   - **várias**: esta tela existe e qualquer dono abre a sua;
   - **uma só**: esta tela não existe. A academia é criada na implantação e o dono entra por **convite**, como qualquer pessoa da equipe.

### F13.5 Como as portas casam com "o papel decide a visão"

- **A porta escolhe o caminho do cadastro, não a visão.** Ela só decide o que o app pergunta depois de criar a conta (código da academia ou convite da equipe). Nada da porta fica guardado como papel.
- **A visão continua vindo do vínculo.** Aluno ativo leva à visão do aluno. Funcionário, personal ou dono ativo leva à visão da academia, com as abas do papel (`04-MAPA-DE-TELAS.md`). Vínculo pendente não abre visão nenhuma.
- **Errar a porta não perde nada.** Quem é da equipe e entrou por "Sou aluno" usa o app como aluno e depois, em **Perfil → Entrar na equipe de uma academia**, digita o código da equipe. Quem entrou por "Sou da academia" e é só aluno pode, no pedido pendente, seguir como aluno e cancelar o pedido. Nos dois casos é a mesma conta.
- **Quem tem os dois papéis** (aluna e instrutora, por exemplo) continua trocando em **Perfil → Trocar de visão** (H05). A entrada não pergunta "qual visão" além do **Escolher visão / academia** que já existe.
- **Quem dá o papel é o dono** (H62): no convite, que já leva o papel, ou ao confirmar o pedido. A pessoa nunca se dá um papel sozinha; por isso o pedido pela porta da academia sempre passa pelo dono.
- Fica fora da v1 o personal autônomo, sem academia (`docs/decisoes.md`, "Abertura e entrada com duas portas").

---

## F14. Equipe da academia e perfil profissional (P10)

Pedido do Alex em 11/10/2026, já decidido. Histórias H90 a H95; regras da seção 11. As telas estão descritas na Parte 7 do mapa e serão desenhadas depois.

### F14.1 O profissional monta o perfil

1. **Perfil (academia)** → **Meu perfil profissional**. Quem ainda não tem perfil vê uma frase ("Os alunos da [academia] podem conhecer você pelo app. É opcional.") e "Montar meu perfil".
2. **Meu perfil profissional** — nome de exibição (já vem com o nome da conta), foto, formação, CREF, especialidades (chips da lista fixa, R11.3), "Sobre mim" com contador ("112 de 280") e a grade de dias e turnos. Tudo salva no toque, como no resto do app.
3. No topo da tela, a chave **"Mostrar meu perfil aos alunos"**, desligada. Embaixo dela, a frase: "Só alunos da [academia] veem. Telefone e e-mail nunca aparecem."
4. Ligar a chave → folha com a prévia do perfil como o aluno vai ver e "Mostrar". Confirmou → o perfil entra na Equipe na hora (R11.8 guarda a data).
5. Desligar a chave → some de todos na hora, sem folha.
6. Se o dono escondeu o perfil, a chave fica travada com a frase "Escondido pelo dono. Fale com ele para voltar a aparecer." (R11.7).

### F14.2 O aluno vê a equipe

1. **Perfil (aluno)** → linha **"Equipe da [academia]"**, logo abaixo da academia vinculada. Só aparece com vínculo ativo (R11.5).
2. **Equipe** — chips de especialidade no topo ("Todos" marcado; só as especialidades que alguém marcou, R11.13) e a lista em ordem alfabética: foto, nome de exibição, formação e até três especialidades. Sem nota, sem estrela, sem contagem (R11.9).
3. Toca num nome → **Perfil do profissional** — foto, nome, formação, CREF inteiro (se preenchido), especialidades, "Sobre mim" e a grade "Na academia" com os dias e turnos. Sem telefone, sem e-mail, sem botão de contato (R11.6), sem preço (R11.10).
4. Outros caminhos para o mesmo perfil:
   - o nome em **"Montado por Carlos"** no treino (R11.12);
   - o bloco **"Meu personal"** do Plus (R11.11).

   Se o perfil não está visível, o nome aparece como texto, sem link.

### F14.3 O dono esconde um perfil

1. **Academia → Equipe** — cada pessoa com perfil mostra "Perfil visível aos alunos", "Perfil desligado" ou "Escondido por você".
2. Menu da pessoa → "Esconder dos alunos" → folha: "O perfil de [nome] sai da Equipe agora. Só você pode mostrar de novo." Confirma.
3. "Mostrar aos alunos" desfaz, e o perfil volta só se a chave da pessoa estiver ligada (R11.4).
4. Remover a pessoa da equipe (H66) tira o perfil junto, sem passo a mais.

---

## F15. Fluxos curtos da checagem final (P10)

Acrescentados pelo agente V em 11/10/2026. Regras da seção 12; motivos em `docs/revisao/V-CLIENTE.md`.

- **Dar treino pronto (H99, R12.4)**: Alunos → aluno → **Perfil do aluno (academia)** → "Dar treino pronto" → lista dos prontos → toca num → folha "Enviar [treino] para [aluno]" (tornar ativo, "Trocar em", recado) → "Enviar". O aluno recebe o aviso do F5, passo 7. São dois toques depois de abrir o aluno.
- **Pedir treino novo (H97, R12.2)**: **Treinos (aluno)** → "Pedir treino novo" → folha com o recado opcional e "A equipe da academia vai ler." → "Pedir". A linha passa a "Pedido enviado em [data] · Cancelar". Na academia, o aluno aparece no filtro "Pediu treino". Quando a equipe envia um treino a ele, o pedido fecha sozinho.
- **Treino para trocar (H98, R12.5)**: chegou a data → cartão no **Início (aluno)** "Seu treino está na hora de trocar." · "Pedir um novo" (abre a folha acima) · "Dispensar". Na academia, o aluno entra no filtro "Treino para trocar".
- **Entrar pelo QR (H101, R12.8, R12.9)**: câmera do celular no cartaz do balcão → o app abre em **Sua academia** com o código preenchido → "É esta, pedir para entrar" → vínculo pendente → **Início (aluno)** já com "Treino pronto da academia" liberado e o cartão "Aguardando a recepção confirmar".
- **Confirmar em lote (H102, R12.10)**: Alunos → filtro "Vínculo pendente" → "Confirmar todos (12)" → folha com os 12 nomes → "Confirmar".
- **Encerrar vínculo (H103, R12.11)**: Perfil do aluno (academia) → menu → "Encerrar vínculo" → folha com o motivo opcional e "O aluno fica com o histórico e os treinos dele." → "Encerrar".
- **Sessão vencida com treino na fila (H106, R12.3)**: o aluno treina no porão e registra. A sessão venceu enquanto estava sem sinal. Quando o sinal volta, a tela "Entre de novo para enviar 1 treino" mostra os mesmos botões de entrada. Ele entra e o treino sobe. Se tocar em outra conta, o treino fica guardado.

## F16. Fluxos curtos da segunda busca (P11)

Acrescentados pelo agente AC em 11/10/2026. As regras estão na seção 13; os toques foram contados em `docs/revisao/AC-MELHORIAS.md`.

- **Fechar pela metade (H107, R13.1)**: Modo treino → Pausar → "Fechar o treino" → folha "Faltam 25 séries de 6 exercícios." → "Fechar assim" (vai à comemoração) ou "Voltar ao treino". Sem série feita, aparece "Descartar o treino" no lugar de "Fechar assim". Muda o F4, passo 6, só quando falta série.
- **Primeiro treino montado (H108, R13.2)**: o F2 do Lucas vira Montar do zero → nome → Criar → + Exercício → exercício → Início → Começar. O passo 8 do F2 ("Usar este treino") some quando não havia treino em uso. São 6 toques em vez de 8.
- **Primeiro treino pronto (H108, R13.3)**: Ver treinos prontos → treino → "Usar este treino" → "Usar" → **Meus treinos**, com o "Em uso" e o aviso "[treino] em uso · Ajustar" → deslizar para começar. Substitui o F3, passo 5. São 5 toques em vez de 6, sem passar pelo editor.
- **Entrar numa academia depois (H109, R13.4)**: Perfil → "Sem academia" (ou "Tenho um código" no Início, nos Prontos ou no Plus) → **Sua academia** → código ou QR → "É esta, pedir para entrar" → vínculo pendente (R12.9, R13.5).
- **Aparelho ocupado (H110, R13.6)**: Modo treino → toca no título → folha "Treino de hoje" → toca no exercício 5 → faz as séries → toca no título de novo → volta ao 2.
- **Quem sumiu esta semana (H112, R13.8)**: Academia (números) → "Sumidos · Ver lista" (ou Alunos → "Sem treinar há 14+ dias") → os que têm "Sumiu esta semana" vêm no topo.
