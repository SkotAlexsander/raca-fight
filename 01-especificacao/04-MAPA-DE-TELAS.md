# 04 — Mapa de telas

Este arquivo lista todas as telas do app, nas duas visões, com nome, objetivo em uma frase, o que mostra e o que a pessoa pode fazer nela.
É o insumo direto do time de design: cada tela daqui vira um desenho em `02-design/`.

Convenções: as telas estão agrupadas pela aba da navegação de baixo. "Folha" é um painel que sobe de baixo da tela sem trocar de página. **[decidir]** marca tela que muda conforme pendência do P00. Histórias (H) e fluxos (F) citados são de `01-HISTORIAS.md` e `02-FLUXOS.md`.

---

## Parte 1 — Telas de entrada (comuns às duas visões)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Boas-vindas** | Apresentar o app e levar à conta. | Logo, uma frase, dois botões. | Criar conta · Já tenho conta |
| **Criar conta** | Criar a conta em um minuto. | Nome, e-mail ou telefone, senha; botões Google e Apple; link para termos e privacidade. | Criar · Entrar com Google · Entrar com Apple |
| **Confirmar contato** | Provar que o e-mail/telefone é da pessoa. | Campo de 6 dígitos; "Reenviar". | Confirmar · Reenviar código |
| **Entrar** | Voltar a usar a conta. | E-mail/telefone, senha; "Esqueci a senha". | Entrar · Google · Apple · Esqueci a senha |
| **Recuperar senha** | Trocar a senha sem suporte. | Campo de contato → código → nova senha. | Enviar código · Salvar nova senha |
| **Sua academia** | Vincular à academia (ou seguir sem). | Campo "Código da academia"; nome da academia encontrada; botão "Vou treinar sozinho por enquanto". | Confirmar academia · Pular |
| **Sobre você (opcional)** | Colher o cadastro corporal sem obrigar. | "Pular" no topo. Objetivo (lista), dias por semana, data de nascimento, peso, altura, restrições. | Continuar · Pular |
| **Quem pode ver** | Explicar e colher a autorização de dados de saúde. | Texto de duas frases; chave "A academia pode ver meus dados corporais". | Entendi |
| **Escolher visão / academia** | Quem tem mais de um papel escolhe por onde entra. | Lista de vínculos: "Aluno — Academia X", "Instrutor — Academia X". **[decidir]** Várias academias: lista inclui academias diferentes. | Tocar no vínculo |

---

## Parte 2 — Visão do aluno

Navegação de baixo com 4 abas: **Início · Treinos · Plus · Perfil**. A aba Plus muda de conteúdo conforme o estado da assinatura.

### Aba Início

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Início (aluno)** | Responder "o que faço hoje?" em um olhar. | Card do treino de hoje (treino ativo, dia sugerido, botão Começar); sequência da semana (dias treinados); se Plus: card "Dieta de hoje: 3 de 5"; avisos (treino novo da academia, personal designado) e o cartão "Aviso da academia" (Parte 4). Vazio: "Monte seu primeiro treino" com dois caminhos. | Começar treino · Trocar dia · Abrir dieta · Abrir aviso |
| **Treino em andamento** | Registrar o treino sem atrapalhar quem está treinando. | Cronômetro total; nome do dia; lista de exercícios (o atual expandido); por série: planejado, campos do real, "Última vez"; cronômetro de descanso em faixa fixa no rodapé. | Marcar série · Editar repetição/carga · Pular descanso · Pular exercício · Trocar exercício · Encerrar |
| **Resumo do treino** | Fechar o dia com sensação de conquista. | Tempo total, séries feitas/planejadas, volume em kg, exercícios pulados, campo "Como foi?". | Concluir · Editar algo |
| **Ver aviso: treino da academia** | Receber o treino montado pela academia/personal. | Nome de quem montou, recado, dias e exercícios. | Usar este treino · Ver depois |

### Aba Treinos

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Treinos (aluno)** | Ver e organizar os treinos do aluno. | Duas sub-abas: "Meus treinos" (lista: nome, dias, selo Ativo, origem) e "Prontos da academia" (só se vinculado). Botão "+ Novo treino". | Abrir treino · Novo treino · Marcar ativo · Duplicar · Arquivar |
| **Novo treino** | Criar o treino em três campos. | Nome, objetivo opcional, quantos dias (1–5 ou depois). | Criar |
| **Editar treino** | Montar e ajustar dias, exercícios e séries. | Abas de dias (A, B, C…); lista de exercícios do dia com séries resumidas ("3 × 12 · 20 kg · 60 s"); botão "+ Exercício"; "Usar este treino". Se origem é `montado_pelo_personal` com Plus ativo: só leitura, com aviso. | Renomear dia · Adicionar/duplicar/apagar dia · Adicionar exercício · Reordenar (arrastar) · Abrir séries · Usar este treino |
| **Escolher exercício** | Achar o exercício certo rápido. | Busca; filtros por grupo muscular; lista com nome, grupo e camada (geral/academia); "Não achei, criar só com nome". | Buscar · Filtrar · Tocar para adicionar · Criar exercício |
| **Séries do exercício** | Definir o que fazer em cada série. | Lista de séries: repetições ou tempo, carga, descanso; marca "aquecimento"; observação do exercício; "Copiar para as outras séries". | + Série · Apagar série · Copiar · Pronto |
| **Treinos prontos** | Escolher um treino pronto por objetivo. | Filtro de objetivo (já no do aluno, ou "Todos"); filtros de nível e dias; cards: nome, objetivos, nível, dias, academia. | Filtrar · Abrir treino |
| **Ver treino pronto** | Avaliar antes de adotar. | Descrição, dias e exercícios com séries (só leitura). | Usar este treino (folha de confirmação) |
| **Histórico** | Ver a evolução. | Semanas com dias treinados; lista de treinos realizados (data, dia, duração, volume); por exercício: gráfico de carga ao longo do tempo. Botão "Registrar treino passado". | Abrir treino realizado · Registrar passado · Filtrar por exercício |
| **Treino realizado (detalhe)** | Rever um dia específico. | Séries reais por exercício, pulados, substituições, observação. | Editar observação · Apagar (até 7 dias) |

### Aba Plus

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Plus — apresentação** (sem Plus) | Explicar o Plus e levar à assinatura. | O que inclui (personal, treino sob medida, dieta, conversa), preço, "cancele quando quiser". **[decidir]** Botão "Assinar" · Botão "Falar com a recepção". Sem vínculo com academia: explica que o Plus é oferecido pela academia. | Assinar / Falar com a recepção |
| **Pagamento** **[decidir]** | Pagar sem sair do app. | Loja (Google/Apple) · Pix/cartão próprio. Só existe se o aluno paga no app. | Confirmar |
| **Plus — ativo** | Ser a casa do acompanhamento. | Bloco "Meu personal" (foto, nome, botão conversar); "Meu treino" (nome, última atualização); "Minha dieta" (plano em vigor, adesão dos 7 dias); "Gerenciar assinatura". Enquanto não há personal: "Aguardando seu personal". | Conversar · Abrir treino · Abrir dieta · Gerenciar |
| **Dieta do dia** | Seguir a dieta de hoje. | Data (navegável); refeições por horário com itens; estados a fazer/feita/não segui; refeições opcionais marcadas. | Marcar feita · Não segui (motivo) · Desmarcar · Voltar dias |
| **Plano de dieta (ver)** | Ver o plano inteiro, não só hoje. | Nome, vigência, observação geral, todas as refeições e itens, trocas permitidas. Só leitura. | Voltar |
| **Conversa** **[decidir]** | Falar com o personal. | Chat próprio: lista de mensagens, campo de texto, foto · WhatsApp: a tela não existe; o botão "Conversar" abre o WhatsApp. | Enviar · Anexar foto |
| **Gerenciar assinatura** | Ver estado e cancelar. | Estado (ativo até…, cancelado vigente até…), histórico de pagamentos (se no app), botão cancelar. | Cancelar (folha com data até quando vale) · Reativar |

### Aba Perfil

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Perfil (aluno)** | Reunir conta, dados e configurações. | Foto, nome, academia vinculada; atalhos: Meus dados, Quem pode ver meus dados, Avisos, Conta, Trocar de visão (se tem outro papel), Sair. | Abrir cada item |
| **Meus dados** | Ver e editar o cadastro corporal. | Peso atual + "Registrar peso" + gráfico de pesagens; altura; data de nascimento; objetivo; dias por semana; restrições. Tudo opcional. | Editar · Registrar peso · Apagar um dado |
| **Quem pode ver meus dados** | Dar controle sobre dado de saúde. | Chave da academia; linha "Personal X — enquanto o Plus estiver ativo" (se Plus); texto curto de explicação. | Ligar/desligar academia |
| **Avisos** | Escolher lembretes. | Lembrete de treino (dias e hora), lembrete de refeição (se Plus), avisos da academia. Detalhe completo na Parte 4. | Ligar/desligar · Horário |
| **Conta** | Cuidar da conta e dos direitos. | E-mail/telefone, trocar senha, exportar meus dados, apagar conta. | Trocar senha · Exportar · Apagar conta (confirmação dupla) |
| **Sua academia (perfil)** | Ver e mudar o vínculo. | Academia atual, estado do vínculo (pendente/ativo), "Desvincular", "Entrar com código". **[decidir]** Várias academias: lista com mais de um vínculo. | Desvincular · Vincular |

---

## Parte 3 — Visão da academia

Navegação de baixo com até 5 abas, conforme o papel: **Alunos · Treinos prontos · Plus (só personal) · Academia (só dono) · Perfil**. Funcionário vê 3 abas; personal 4; dono 4 (ou 5 se também é personal).

### Aba Alunos (funcionário, personal, dono)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Alunos (academia)** | Achar um aluno e ver quem precisa de atenção. | Busca; filtros: "Sem treinar há 14+ dias", "Sem treino ativo", "Plus", "Vínculo pendente"; linhas: foto, nome, última vez que treinou, selos. Botão "+ Vincular aluno". Botão "Aviso para todos" (dono e recepção, Parte 4). | Buscar · Filtrar · Abrir aluno · Vincular aluno · Confirmar/recusar pendente · Aviso para todos |
| **Perfil do aluno (academia)** | Dar ao instrutor o que ele precisa para orientar. | Cabeçalho (nome, desde quando, selo Plus); "Dados corporais" (se autorizou; senão o aviso); "Treino atual" (nome, dias, quem montou, última execução); "Frequência" (4 semanas); "Histórico" (lista resumida). Botões: "Montar treino para [nome]"; **[decidir]** se a academia cobra o Plus: "Ligar/Desligar o Plus". | Montar treino · Ver treino atual · Ver histórico · Ligar Plus [decidir] |
| **Montar treino para aluno** | Escolher o ponto de partida. | Três opções: do zero, a partir de um treino pronto, a partir do treino atual dele. | Escolher |
| **Editar treino (modo academia)** | Montar o treino do aluno com os dados dele à vista. | Mesma tela "Editar treino" do aluno, com faixa "Montando para [nome]" e painel recolhível com objetivo e restrições (se autorizados). Botão "Enviar para o aluno". | Igual ao aluno · Enviar (folha: tornar ativo? recado) |
| **Vincular aluno** | Trazer um matriculado para o app. | Campo e-mail/telefone; "Enviar convite" ou "Vincular" se já tem conta. Lista de pendentes para confirmar. | Vincular · Convidar · Confirmar · Recusar |

### Aba Treinos prontos (funcionário, personal, dono)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Treinos prontos (academia)** | Cuidar da biblioteca da academia. | Lista: nome, objetivos, nível, dias, quantos alunos usam, estado (publicado/arquivado). Botão "+ Novo treino pronto". Sub-aba "Exercícios da academia". | Abrir · Novo · Arquivar · Duplicar |
| **Editar treino pronto** | Montar o modelo. | Mesma "Editar treino" com campos extras: objetivos (vários), nível, descrição curta. Botão "Publicar". | Igual ao aluno · Publicar · Arquivar |
| **Exercícios da academia** | Manter a biblioteca própria. | Lista com busca; "+ Novo exercício". | Novo · Editar · Arquivar |
| **Editar exercício** | Cadastrar um exercício. | Nome, grupo principal, secundários, tipo de medida, como fazer, imagem. | Salvar |

### Aba Plus / Meus alunos Plus (só personal)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Meus alunos Plus** | Ver só quem é do personal. | Lista: foto, nome, selo "Novo — sem treino e sem dieta", adesão dos 7 dias, último treino, alerta "3 dias sem registro". | Abrir aluno |
| **Aluno Plus (personal)** | Acompanhar uma pessoa de perto. | Abas: Resumo (dados corporais, objetivo, restrições, frequência, adesão 7/30 dias e motivos), Treino (atual, botão montar/ajustar), Dieta (plano em vigor, futuros, encerrados; "Novo plano", "Copiar e ajustar"), Conversa **[decidir]**. | Montar/ajustar treino · Novo plano · Copiar e ajustar · Conversar |
| **Editar plano de dieta** | Montar a dieta. | Nome, data de início, observação geral; refeições (nome, horário, opcional) com itens. Botão "Enviar ao aluno". | + Refeição · + Item · Reordenar · Marcar opcional · Enviar |
| **Item da refeição** **[decidir]** | Definir um item. | Texto livre + troca permitida · Busca no banco de alimentos, gramas, calorias e macros calculados. | Salvar |
| **Conversa (personal)** **[decidir]** | Falar com o aluno. | Chat próprio · abre o WhatsApp do aluno. | Enviar · Anexar |

### Aba Academia (só dono)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Academia (números)** | Ver a academia viva em uma tela. | Alunos ativos (30 dias), assinantes Plus, treinos registrados na semana (e a semana anterior), alunos sem treinar há 14+ dias, alunos Plus por personal. Tudo agregado. | Tocar num número abre a lista correspondente (sem dado de saúde) |
| **Equipe** | Gerir funcionários e personais. | Lista: nome, papel (funcionário/personal/dono), estado. "+ Adicionar". | Adicionar (e-mail/telefone + papel) · Mudar papel · Remover |
| **Alunos Plus (gestão)** | Fechar a conta personal ↔ aluno. | Lista de alunos Plus com o personal de cada um (ou "Sem personal"). | Designar personal (folha com personais e quantos alunos cada) · Trocar |
| **Configurações da academia** | Ajustar o básico. | Nome, logo **[decidir]** (só se marca da academia/white-label), código de vínculo (trocar), "Vínculo precisa de confirmação" (chave), "Recepção pode ligar o Plus" (chave, **[decidir]** só se a academia cobra). | Editar · Trocar código |
| **Gestão ampliada** **[decidir]** | Mensalidade, catraca, caixa. | Só existe se o Alex decidir incluir. | — |

### Aba Perfil (academia)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Perfil (academia)** | Conta do funcionário. | Foto, nome, papel, academia; "Trocar de visão" (se também é aluno); Avisos da equipe (Parte 4); Conta; Sair. | Abrir cada item |

---

## Parte 4 — Avisos (as duas visões)

Escrita no P07 (agente G, 10/10/2026). Histórias H80 a H89, fluxos F10 a F12, regras R10.1 a R10.16. Texto de cada notificação: `03-arquitetura/03-DECISOES-TECNICAS.md`, seção 3.

### Visão do aluno

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Avisos (aluno)** (Perfil → Avisos; substitui a linha curta da Parte 2) | Escolher o que pode avisar, e quando. | Linhas com chave: Cronômetro · Lembrete de treino (dias, hora de 07:00 a 21:59, "Próximo: segunda, 18:00") · Lembrete de refeição, só Plus (resumo à noite · em cada refeição · desligado) · Personal, só Plus · Mensagens **[decidir]** · Avisos da academia · Plus. Rodapé: "Entre 22h e 7h o app não avisa nada, só o descanso do treino em andamento." Sem permissão: "Avisos desligados no celular · Abrir ajustes". | Ligar/desligar · Escolher dias e hora · Usar minha frequência · Abrir ajustes |
| **Cartão "Aviso da academia"** (no Início) | Dar o recado da academia sem virar conversa. | No topo do Início: nome da academia, o texto (até 160 caracteres), "há 2 h". Um por vez; havendo outro em vigor, "Mais 1 aviso da academia". | Dispensar · Ver o outro aviso |
| **Convite ao lembrete** (linha no Resumo do treino, só no primeiro treino fechado) | Oferecer o lembrete na hora em que ele faz sentido. | "Quer um lembrete nos dias de treino?" | Quero · Agora não (30 dias) |

### Visão da academia

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Avisos da academia** (botão "Aviso para todos" no topo de Alunos; dono e recepção) | Ver e cuidar dos avisos para os alunos. | Em vigor no topo ("No Início até sexta", quem escreveu, se foi com notificação); antigos embaixo, em cinza. "+ Novo aviso". Nenhuma contagem de quem leu. | Novo aviso · Retirar |
| **Novo aviso** | Escrever o recado em um minuto. | Campo de texto com contador "42 de 160"; "Fica no Início por" (1 · 3 · 7 · 14 dias); chave "Mandar notificação" (travada se já houve uma hoje, com a frase); linha fixa "Vai para todos os alunos. Não cite aluno nem saúde."; prévia da tela bloqueada e do cartão. | Enviar para N alunos (folha de confirmação) |
| **Avisos da equipe** (Perfil (academia) → Avisos) | Escolher o que chega no celular de trabalho. | Por papel: Pedidos para entrar (recepção, dono) · Alunos sem treinar, resumo das 09:00 (recepção e dono ligado; instrutor desligado) · Meus alunos Plus (personal: aluno novo e 3 dias sem registro). Linha sem chave, para o dono: "Aluno Plus sem personal: sempre avisa." | Ligar/desligar |

Contagem com esta parte: aluno, +2 (cartão e convite; a tela Avisos já existia); academia, +3.

---

## Parte 5 — Cronômetro (visão do aluno)

Acrescentado em 10/10/2026 (agente H, P07). Histórias H69–H76; fluxo F9; regras da seção 9. Na contagem abaixo, a visão do aluno ganha **1 tela** (Cronômetro) e **1 folha** (Registrar como série); a faixa, o botão e o atalho são peças de telas que já existem.

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Cronômetro** | Medir tempo de três jeitos sem sair do app: livre, regressivo e intervalado. | Chips de modo (Livre · Regressivo · Intervalado). Parado: a configuração do modo (atalhos do regressivo; predefinições e os quatro números do intervalado, com o total). Rodando: o mostrador com a fase, o número grande (96), a barra da fase, a rodada e o que vem depois; controles do modo. Terminado: "Terminou", o resumo (rodadas, tempo, voltas). Cabeçalho de 56 com voltar; a faixa "Treino A em andamento" no subtítulo quando aberto pelo treino. | Escolher modo · Escolher predefinição · Editar números · Iniciar · Pausar/Retomar · Volta · −30 s/+30 s · Pular (fase) · Parar · Registrar como série · De novo · Fechar |
| **Registrar como série** (folha) | Levar o tempo feito para o histórico. | Tempo sugerido (editável, campo de tempo), exercício (o atual, se por tempo, ou "Escolher exercício" com só os por tempo), texto "Sem as pausas e a preparação". | Salvar · Salvar no histórico (sem treino) · Cancelar |

Peças em telas que já existem:

| Onde | O que entra |
|---|---|
| **Treino em andamento** | Botão com o relógio no cabeçalho (48), que abre o Cronômetro. Na linha de série por tempo, a marca vira "Iniciar" e a contagem usa o componente 7. |
| **Início (aluno)** | Atalho "Cronômetro" (linha de 56 com o relógio) abaixo do cartão do treino de hoje; aparece também sem treino ativo e para o aluno sem academia. |
| **Todas as abas do aluno** | A faixa do cronômetro (componente 7, R9.14) com o modo: "Descanso · 0:45", "Trabalho 3/8 · 0:14", "Livre · 12:47". |
| **Avisos** (Perfil) | A chave "Cronômetro" (fim do descanso, da série por tempo e do cronômetro; trocas de fase do intervalado). É a mesma chave dos avisos (agente G). |

---

## Contagem

- Entrada: 9 telas.
- Aluno: 25 telas (algumas condicionadas ao Plus ou a [decidir]).
- Academia: 19 telas (algumas só para personal ou dono).

Telas compartilhadas de verdade (mesmo componente nas duas visões): **Editar treino**, **Escolher exercício**, **Séries do exercício**, **Conversa**. O design deve desenhá-las uma vez.

---

## Parte 1b — Abertura e entrada com duas portas (P09, agente O)

Acrescenta à Parte 1, sem trocar as telas dela. O fluxo está em `02-FLUXOS.md`, F13; o mockup, em `02-design/sistema-de-design/mockups/entrada.html`.

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Abertura** | Cobrir o carregamento com a marca. | Cor da marca cheia e o símbolo de 96 pt. Sem texto. | Nenhuma (some sozinha) |
| **Boas-vindas** (substitui a da Parte 1) | Separar quem treina de quem trabalha na academia. | Foto grande, uma frase e duas portas em vidro. | Sou aluno · Sou da academia |
| **Aluno · como entrar** | Entrar ou criar conta. | Apple e Google com o mesmo destaque, e e-mail; Termos. | Continuar com a Apple · com o Google · com e-mail |
| **Academia · entrar** | O mesmo, para a equipe. | As três formas; "primeira vez?" com convite ou abrir academia. | Continuar… · Tenho um convite ou código · Vou abrir minha academia |
| **Convite ou código (equipe)** | Pedir para entrar na equipe. | Código de 6 caracteres da equipe; academia encontrada; papel esperado. | Pedir para entrar |
| **Pedido pendente** | Esperar o dono sem tela vazia. | Academia, papel pedido, "Esperando o dono". | Treinar como aluno enquanto isso · Cancelar o pedido |
| **Abrir a academia** **[decidir]** | O dono cria a academia (só se forem várias). | Nome, cidade. | Abrir academia |
| **Objetivo** (opcional) | Uma pergunta por tela. | A lista fixa de R2.1; "Pular". | Continuar · Pular |
| **Dias por semana** (opcional) | Uma pergunta por tela. | Número de 1 a 7 com − e +; "Pular". | Continuar · Pular |

Contagem: a entrada passa de 9 para 15 telas (abertura, duas telas de método, três da equipe e as duas perguntas separadas). A tela **Sobre você** da Parte 1 continua em **Perfil → Meus dados** e, se o Alex preferir, volta para a entrada (**[decidir]**, F13.3).

---

## Parte 6 — Telas novas na linguagem das referências (P09, agente P)

Acrescentado em 10/10/2026 pelo agente P (P09). Desenho em `02-design/sistema-de-design/mockups/novas.html`. Nada acima foi reescrito: as linhas abaixo **detalham** telas que já existiam (Início, Resumo do treino, Academia em números) e acrescentam duas (Evolução e Modo treino). Histórias citadas: H29–H37, H42, H61, H64, H65, H85. Regras: R1.20 (volume), R6.7 (dono só vê soma), R8.5 (aluno ativo), R10.10–R10.12 (aviso).

### Visão do aluno

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Início (aluno)**, desenho novo (detalha a linha da Parte 2) | Responder "o que faço hoje?" em um olhar. | De cima para baixo: saudação ("Olá, Ana", dia e data) e o sino; o cartão **Aviso da academia** (Parte 4); **Sua semana**: o número grande "2 de 4" (treinos feitos sobre a frequência que a pessoa escolheu) e sete bolinhas (feito, hoje, descanso, ainda não). Sem a frequência informada, só as bolinhas, sem o "de 4". Depois vem o **cartão do treino de hoje**, com foto grande e escura, um painel de vidro com o nome do dia, quantos exercícios, o tempo estimado e o botão "Começar". Se Plus, **Dieta de hoje** com o anel "3/5" e a próxima refeição. Por fim, **atalhos**: Cronômetro · Evolução · Treinos prontos · Treino passado. | Começar · Abrir o treino · Dispensar aviso · Abrir dieta · Atalhos |
| **Evolução** (nova, aba Treinos; também pelo atalho do Início) | Mostrar a evolução em carga e frequência, nunca em corpo. | Foto no topo; em vidro, o **exercício escolhido** (seletor) com a maior carga da semana em número enorme ("60 kg") e a diferença desde o início do período ("+15 kg desde 20 de jul."). Depois: **carga ao longo do tempo** (linha, um ponto por semana); **frequência do mês** (mapa de dias: treinou, não treinou, hoje, dias que não chegaram); **treinos por semana** (barras das últimas 8 semanas, com a meta da pessoa tracejada e a semana em andamento hachurada); **volume por grupo muscular** nas últimas 4 semanas (rosca, um grupo em destaque, com % e kg na legenda). Período: 4 semanas · 3 meses. Cada gráfico tem "Ver em tabela". Sem kcal, sem peso do corpo, sem comparação com outros alunos. | Trocar exercício · Trocar período · Tocar num ponto ou barra (valor) · Tocar num grupo (destaque) · Ver em tabela |
| **Evolução — começou agora** (estado vazio) | Não mostrar gráfico vazio a quem não treinou. | "Nenhum treino fechado ainda. O primeiro aparece aqui." e uma frase sobre quando a linha aparece (a partir de 2 treinos fechados), o botão "Começar treino A" (ou "Monte seu primeiro treino" sem treino ativo) e o contorno tracejado da linha e do mês, sem números. | Começar treino |
| **Modo treino** (nova; substitui o visual do "Treino em andamento" quando a pessoa toca em "Começar"; o registro e as regras são os mesmos) | Treinar sem olhar duas vezes para o celular. | **Sempre escuro, em tela cheia, sem abas**, nos dois temas. No topo: minimizar (o treino continua; volta pela faixa do Início), "Treino A · exercício 3 de 6" com 6 segmentos de progresso, e pausar. No meio, a **foto grande do exercício atual**, com o nome, o grupo, a carga e o **número de repetições enorme** (112). Embaixo, num **painel de vidro**: "Série 2 de 3" e as bolinhas das séries; carga e repetições com − e + (alvos de 48); "Última vez: 3 × 12 · 12,5 kg"; o botão **"Série feita"** (64); e "Próximo: Tríceps corda · 4 × 12". | Série feita · − / + carga e repetições · Próximo · Minimizar · Pausar · ⋯ (pular, trocar exercício, cronômetro, fechar treino) |
| **Modo treino — descanso** (estado da mesma tela) | Descansar sabendo quanto falta e o que vem depois. | A mesma foto, desfocada. O **anel do descanso** (248) com "0:45" no centro, que esvazia em linha reta e fica laranja nos últimos 10 s. Os botões −30 s · Pular · +30 s. No painel de vidro, "Série 2 feita · 12 × 15 kg · Desfazer" e "A seguir: Série 3 de 3". O aviso da série feita mora no painel, nunca por cima da série seguinte. | −30 s · +30 s · Pular · Desfazer · Ver a próxima série |
| **Treino fechado (comemoração)** (desenho novo do "Resumo do treino") | Fechar o dia com sensação de conquista. | Tela de **cor cheia no verde vivo**, nos dois temas: check grande, título **"Treino fechado."** (sem exclamação), o nome do dia, três números grandes (exercícios, minutos, séries), um destaque de carga ("Supino inclinado subiu: 22,5 → 24 kg"), o botão "Pronto" e "Como foi? Escrever uma nota". O convite ao lembrete (Parte 4) entra embaixo, só no primeiro treino fechado. Sem kcal. | Pronto · Como foi? · Quero o lembrete / Agora não |

Regra de execução: **o registro da série não espera nenhuma animação**. O toque grava a série, depois vibra e só então anima (`movimento/00-CATALOGO.md`, regra 1). Com "reduzir movimento" ligado, o check, a comemoração e o descanso esmaecem em 160 ms; com "Reduzir transparência", o vidro vira superfície sólida e a foto do descanso fica só escurecida, sem desfoque.

### Visão da academia (só dono)

| Tela | Objetivo | Mostra | Ações |
|---|---|---|---|
| **Academia (números)**, desenho novo (detalha a linha da Parte 3) | Ver a academia viva em uma tela, com mais densidade. | Foto da sala no topo, nome da academia e data. Em vidro, **alunos ativos** (treinaram nos últimos 30 dias, R8.5) em número grande, "de 350 vinculados", e um medidor. Depois, quatro quadros: **treinos nos últimos 7 dias** (e os 7 dias antes), **no Plus** ("29 de 350 alunos"), **sumidos** (sem treinar há 14 dias ou mais, com "Ver lista") e **frequência** (treinos por aluno ativo por semana). Em seguida, **treinos por dia** (barras dos últimos 7 dias, hoje em destaque) e **Plus por personal** (quantos alunos cada um, e "1 sem personal · Designar" em atenção). Rodapé: "Números da academia, somados. Nenhum dado de saúde de aluno aparece aqui." | Tocar num número abre a lista (sem dado de saúde) · Designar personal |

Contagem com esta parte: aluno, +2 telas (Evolução e Modo treino; o vazio e o descanso são estados delas). As demais linhas só detalham telas que já estavam contadas.

---

## Parte 7 — Checagem final (P10): Equipe da academia e melhorias para o cliente

Acrescentada em 11/10/2026 pelo agente V (P10). **O design está congelado**: as linhas abaixo dizem o que cada tela faz, e o desenho fica para depois, na mesma linguagem e com os mesmos componentes. Regras nas seções 11 e 12 de `03-REGRAS.md`; fluxos F14 e F15.

### 7.1 Onde fica a Equipe (pedido do Alex, já decidido)

**Proposta: em Perfil (aluno), na linha "Equipe da [academia]", logo abaixo da academia vinculada.** A Equipe não vira aba; as 4 abas do aluno continuam. Duas ligações de contexto levam ao mesmo perfil: "Montado por [nome]" no treino e "Meu personal" no Plus.

Por quê, pelo mapa:
- **Perfil já é a casa da academia na visão do aluno.** Ali estão a academia vinculada e a tela **Sua academia (perfil)**. "Quem trabalha na minha academia" é informação da academia, como o vínculo, e não do treino de hoje.
- **Início não**: a tela responde "o que faço hoje?" e segue a regra de um herói por tela (`docs/decisoes.md`, proporção planejada). Ela já tem quatro atalhos (Cronômetro · Evolução · Treinos prontos · Treino passado). Um quinto atalho diluiria o treino de hoje, para uma tela que o aluno abre poucas vezes.
- **Treinos não**: a aba é sobre os treinos do aluno (Meus treinos, Prontos da academia, Histórico, Evolução). Colocar pessoas ali mistura dois assuntos na mesma lista.
- **A descoberta vem pelo contexto**: o aluno chega ao perfil de alguém no momento em que essa pessoa importa para ele, pelo nome em "Montado por Carlos" e pelo "Meu personal". A linha no Perfil serve para quem procura alguém de propósito ("quem atende idoso?").

**Mudaria se** os alunos, no TestFlight, não acharem a Equipe. Nesse caso a linha sobe para o Início como atalho, no lugar do menos usado dos quatro.

### 7.2 Telas e peças da Equipe

| Tela | Visão | Objetivo | Mostra | Ações |
|---|---|---|---|---|
| **Perfil (aluno)**, linha nova | aluno | Levar à equipe. | "Equipe da [academia]" logo abaixo da academia vinculada; só com vínculo ativo. | Abrir Equipe |
| **Equipe** (nova) | aluno (e equipe) | Conhecer quem trabalha na academia. | Chips de especialidade (só as que alguém marcou, mais "Todos"); lista em ordem alfabética: foto, nome de exibição, formação, até 3 especialidades. Sem nota, estrela, ranking ou contagem. Vazia: "A equipe da academia ainda não montou os perfis." | Filtrar · Abrir perfil |
| **Perfil do profissional** (nova) | aluno (e equipe) | Saber quem é e no que ajuda. | Foto, nome de exibição, formação, CREF inteiro (se preenchido; "verificado" só se houver conferência, **[decidir]**), especialidades, "Sobre mim", grade "Na academia" (dias × manhã, tarde, noite). Nunca telefone, e-mail ou preço. | Voltar |
| **Meu perfil profissional** (nova; Perfil (academia) → Meu perfil profissional) | academia: funcionário, personal, dono | Montar e publicar o próprio perfil. | Chave "Mostrar meu perfil aos alunos" no topo, desligada, com a frase "Só alunos da [academia] veem. Telefone e e-mail nunca aparecem."; nome de exibição, foto, formação, CREF, especialidades, "Sobre mim" com contador, grade de dias e turnos. Escondido pelo dono: a chave travada com a frase. | Editar campos · Ligar/desligar (folha com prévia ao ligar) |
| **Perfil (academia)**, linha nova | academia | Levar ao próprio perfil. | "Meu perfil profissional", com o estado: "Visível aos alunos" · "Desligado" · "Escondido pelo dono". | Abrir |
| **Equipe** (aba Academia, só dono), peça nova | academia: dono | Cuidar do que os alunos veem. | Em cada pessoa, o estado do perfil. | Esconder dos alunos · Mostrar aos alunos |
| **Plus — ativo**, bloco "Meu personal" | aluno Plus | Conhecer o personal. | O mesmo de antes; com perfil visível, o bloco abre o Perfil do profissional. | Abrir perfil |
| **Ver aviso: treino da academia**, **Editar treino** e o selo "Montado por" | aluno | Saber quem montou. | O nome vira link quando o autor tem perfil visível. | Abrir perfil |

### 7.3 Peças das melhorias P10 em telas que já existem

| Onde | O que entra | Regra |
|---|---|---|
| **Treino em andamento** e **Modo treino** | A carga real vem da última vez (ou da planejada nova); "Plano: 3 × 12 · 20 kg" ao lado. | R12.1 |
| **Treinos (aluno)** | Linha "Pedir treino novo" (folha com recado de 140 caracteres); depois, "Pedido enviado em [data] · Cancelar". Só com vínculo ativo. | R12.2 |
| **Início (aluno)** | Cartão "Seu treino está na hora de trocar." · Pedir um novo · Dispensar. Com vínculo pendente, o caminho "Treino pronto da academia" já liberado. | R12.5, R12.9 |
| **Entrar de novo para enviar** (estado da tela de entrada) | "Entre de novo para enviar 1 treino", com os mesmos botões de entrada; com outra conta, o aviso da fila guardada. | R12.3 |
| **Alunos (academia)** | Filtros novos: "Novos (90 dias)" (com "Sem treino ativo" e "Sem treinar há 7+ dias"), "Pediu treino" e "Treino para trocar". No filtro "Vínculo pendente", o botão "Confirmar todos (N)". | R12.6, R12.7, R12.10 |
| **Perfil do aluno (academia)** | Botão "Dar treino pronto" (folha: tornar ativo, "Trocar em", recado). Menu: "Encerrar vínculo" (recepção e dono; folha com motivo opcional). Se pediu treino: o recado e a data no topo. | R12.4, R12.11, R12.2 |
| **Editar treino (modo academia)**, folha "Enviar para o aluno" | Campo "Trocar em" (4 · 6 · 8 · 12 semanas ou data). | R12.5 |
| **Configurações da academia** | O código dos alunos também como QR (imprimir) e link (compartilhar); "Sugerir troca de treino a cada" (nenhum · 4 · 6 · 8 · 12 semanas). | R12.8, R12.5 |
| **Academia (números)** | Quadros novos: "Com treino ativo" (de vinculados), "Novos (90 dias)" com quantos treinaram em 7 dias, "Saídas no mês" por motivo. Tocar abre a lista correspondente, sem dado de saúde. | R12.12 |
| **Avisos da equipe** | Chave "Resumo da semana" (dono, segunda 09:00). No resumo diário das 09:00, as linhas de novos sem treinar, pedidos de treino e treinos para trocar. | R12.13, R12.6, R12.7 |
| **Meus alunos Plus** | Ordem por atenção, com o motivo escrito em cada linha. | R12.14 |

Contagem com esta parte: aluno, +2 telas (Equipe e Perfil do profissional; a equipe também as vê); academia, +1 (Meu perfil profissional). Ganham folha nova: "Pedir treino novo", "Dar treino pronto" e "Encerrar vínculo". O resto é peça de tela que já existia.

### 7.4 Peças da segunda busca (P11)

Acrescentadas pelo agente AC em 11/10/2026, depois de usar o app. Nenhuma tela é nova e nenhum tamanho é novo: são folhas, linhas, avisos rápidos e estados vazios que o sistema já tem.

| Onde | O que entra | Regra |
|---|---|---|
| **Modo treino**, menu "Treino em pausa" | "Fechar o treino", com série por fazer, abre a folha "Faltam N séries de M exercícios." · Fechar assim · Voltar ao treino. Sem série feita: Descartar. | R13.1 |
| **Modo treino**, título e segmentos | Ficam tocáveis e abrem a folha "Treino de hoje": os exercícios do dia com o estado; tocar vai até ele. | R13.6 |
| **Novo treino** e folha "Usar este treino?" | Sem treino em uso, o novo vira o ativo. Depois de "Usar" um pronto, volta a Meus treinos, com o aviso rápido "[treino] em uso · Ajustar". | R13.2, R13.3 |
| **Início**, **Treinos › Prontos da academia**, **Plus (convite)**, **Perfil › Sem academia** | Sem vínculo: o botão "Tenho um código" leva a Sua academia. Pendente: a frase do pedido (no Plus) e o cartão "Aguardando a recepção confirmar" (no Início). | R13.4, R13.5 |
| **Plus — ativo**, linha "Meu treino" | "Não está em uso" · Usar este treino, quando o treino do personal não é o ativo. | R13.9 |
| **Visão da academia**, primeira aba | Dono: Academia (números). Personal com aluno Plus: Meus alunos Plus. Os outros: Alunos. | R13.7 |
| **Alunos (academia)**, filtros | Uma ordem por filtro (sumidos do mais recente; pedidos e pendentes do mais antigo; novos do vínculo mais antigo) e o selo "Sumiu esta semana". | R13.8 |
| **Meus alunos Plus** | O motivo "Treina outro treino ([nome])", na ordem entre a adesão caindo e o treino para trocar. | R13.9 |
| Folha **Dar treino pronto** e faixa **Montando para** | O recado do pedido aberto, no topo. | R13.10 |
