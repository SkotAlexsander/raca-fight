# 03 — Navegação e layout

O que este arquivo é: como as duas visões se organizam em abas, como a tela se divide em grade e margens, e como tudo se comporta em celular pequeno, médio, grande, com fonte ampliada e (v2) em tablet.

Nota: o `01-especificacao/04-MAPA-DE-TELAS.md` está sendo escrito em paralelo. Os nomes de tela aqui seguem o P00; se o mapa trouxer nomes diferentes, o mapa vence e este arquivo é ajustado.

## Estrutura de navegação

Um app, duas visões. A visão é escolhida pelo papel do usuário logado, na entrada. Cada visão tem a sua **barra de abas inferior** com 4 ou 5 abas; o resto são telas empilhadas por cima da aba (com cabeçalho e botão voltar) ou folhas inferiores.

> As abas seguem `01-especificacao/04-MAPA-DE-TELAS.md`; se os dois divergirem, o mapa vence. Alinhado em 10/10/2026 (a primeira versão deste arquivo tinha 5 abas no aluno, com Dieta e Personal separados).

### Visão do aluno — 4 abas

| Aba | Ícone (direção) | O que abre | Marca Plus? |
|---|---|---|---|
| **Início** | halter | "O que faço hoje?": treino do dia e o treino em andamento (o cronômetro de descanso vive aqui); se Plus, o cartão "Dieta de hoje" | — |
| **Treinos** | lista | Meus treinos + Prontos da academia (por objetivo) + histórico | — |
| **Plus** | selo | Sem Plus: apresentação e convite. Com Plus: meu personal, meu treino, dieta do dia, plano de dieta, conversa **[decidir]**, gerenciar assinatura | Sim — é a casa do plano pago |
| **Perfil** | pessoa | Meus dados (opcionais), quem pode ver meus dados, avisos, conta, academia vinculada, trocar de visão, sair | — |

Por que a dieta fica dentro do Plus e não numa aba própria: dieta só existe com o Plus (R3/R5 da especificação). Uma aba "Dieta" vazia para quem não assina seria uma aba de anúncio. O acesso rápido do dia a dia é o cartão "Dieta de hoje" no Início.

**[decidir]** Chat próprio ou WhatsApp não muda a barra: muda só se a tela "Conversa" existe dentro do Plus ou se o botão abre o WhatsApp.

### Visão da academia — até 5 abas, conforme o papel

| Aba | Ícone (direção) | Quem vê | O que abre |
|---|---|---|---|
| **Alunos** | pessoas | todos | Lista densa de alunos com busca e filtros; toque abre o perfil do aluno; de lá, "Montar treino" |
| **Treinos** (rótulo curto de "Treinos prontos") | lista | todos | Biblioteca de treinos prontos da academia, por objetivo; criar e editar |
| **Plus** | selo | só personal | Alunos assinantes, cada um com treino, dieta e conversa |
| **Academia** | prédio | só dono | Números (alunos ativos, assinantes Plus, frequência) e configurações. **[decidir]** quanto de gestão entra |
| **Perfil** | pessoa | todos | Conta, trocar de visão, sair |

Funcionário vê 3 abas; personal 4; dono 4 (5 se também é personal). Os mockups mostram a barra do dono-personal, com as 5 (conferido no navegador em 10/10/2026: aluno Início · Treinos · Plus · Perfil; academia Alunos · Treinos · Plus · Academia · Perfil, abas de largura igual, 78 px cada na tela de 390).

Quem tem os dois papéis troca de visão pelo **Perfil** (nas duas visões) ou pelo chip de visão no cabeçalho. Trocar visão é uma transição de tela inteira (`duracao.lenta`), nunca um toast.

### Empilhamento

- Toque num item de lista → tela empilhada com cabeçalho (voltar à esquerda, título no centro, até 1 ação à direita).
- Ação curta (confirmar, escolher opção, ajustar carga fora do treino) → folha inferior, não tela nova.
- Profundidade máxima: **3 telas** acima da aba. Se precisa de 4, está errado — virou folha ou outra aba.
- Voltar pelo gesto do sistema (Android: gesto da borda ou botão voltar; iOS: deslizar da borda esquerda) sempre funciona; o botão voltar do cabeçalho é redundância, não substituto. **O gesto nunca é desligado.** Onde sair tem consequência (treino em andamento, edição não salva), o gesto é interceptado e pergunta, na folha de ações do sistema: no treino, "Continuar treinando" · "Sair e continuar depois" · "Descartar treino" (`03-arquitetura/04-IPHONE.md`, seção 4).
- **Título grande** nas telas raiz das abas (cabeçalho grande, componente 13), que encolhe ao rolar. Telas empilhadas usam o cabeçalho de 56.
- **Puxar para atualizar** em toda lista que vem do servidor; nunca na tela de treino em andamento (componente 17).

### O treino em execução

A tela **Início / Treino em andamento** é a mais usada e a mais exigente. Regras próprias:

- A barra de abas **continua visível** (o aluno pode olhar a dieta entre séries e voltar). O treino não se perde ao trocar de aba.
- O cronômetro de descanso aparece como **faixa fixa acima da barra de abas** quando está rodando, em qualquer aba. Toque na faixa volta para o treino. A mesma faixa mostra o Cronômetro (componente 18) de qualquer modo ("Trabalho 3/8 · 0:14"); o toque nela abre a tela Cronômetro.
- O **Cronômetro** é uma tela empilhada (cabeçalho de 56 com voltar), aberta pelo relógio no cabeçalho do Treino em andamento ou pelo atalho do Início. As abas continuam visíveis.
- Botão **"Concluir treino"** fica no fim da lista de exercícios, não fixo — para não ser tocado sem querer. Pede confirmação em folha inferior se ainda há séries por fazer.

## Grade e margens

Celular não tem grade de 12 colunas; tem **uma coluna com margens** e, às vezes, **2 colunas de cartão**.

| Elemento | Regra |
|---|---|
| Margem lateral | 16 px (< 430), 20 px (≥ 430) |
| Coluna de conteúdo | largura da tela − 2 × margem |
| Espaço entre cartões empilhados | 12 px |
| Grade de 2 colunas (treinos prontos, números do dono) | 2 colunas iguais com 12 px entre elas; cada coluna ≥ 150 px, senão vira 1 coluna |
| Linha de lista | ocupa a coluna inteira; divisor de 1 px `borda` entre linhas, sem divisor depois da última |
| Cabeçalho | altura 56 + área segura do topo; conteúdo alinhado à margem lateral |
| Barra de abas | altura 64 + área segura da base; abas de largura igual |

Alinhamento vertical: tudo cai em múltiplos de 4 px. Linhas de lista têm 72 px (aluno) ou 56 px (academia).

## Área segura

Os insets que cada aparelho de referência informa (`tokens.json › layout.aparelhos`, em pontos):

| Aparelho | Tela | Topo | Base | O que ocupa o topo | O que ocupa a base |
|---|---|---|---|---|---|
| iPhone SE (3ª geração) | 375 × 667 | 20 | 0 → o app usa 16 | barra de status | nada (botão Início fora da tela) |
| iPhone 13 mini | 375 × 812 | 50 | 34 | notch | indicador de início |
| iPhone 16 | 393 × 852 | 59 | 34 | Dynamic Island | indicador de início |
| iPhone 16 Pro Max | 440 × 956 | **62** | 34 | Dynamic Island (mais baixa nos Pro de 2024) | indicador de início |
| Android 390 (referência) | 390 × 844 | 54 | 24 | barra de status + furo da câmera | barra de gestos |

No app os números vêm do sistema (`react-native-safe-area-context`), nunca desta tabela; a tabela serve para o mockup e para a auditoria, que confere que nada do app (texto, ícone, alvo de toque) cai dentro desses insets, embaixo da Dynamic Island ou do notch, ou embaixo do indicador de início. Conferido em 10/10/2026: 0 achados nos 4 iPhones, nos dois temas, com a fonte a 100 % e a 160 % (`docs/revisao/F-IPHONE-DESIGN.md`).

- **Topo**: o cabeçalho estende o fundo até a borda da tela e empurra o conteúdo pela altura do inset (notch, câmera, relógio). Nunca colocar texto ou ação dentro do inset.
- **Base**: a barra de abas estende o fundo até a borda e empurra os ícones pelo inset (barra de gestos do Android, indicador de início do iOS). A barra termina **acima** do indicador; o indicador fica sozinho dentro do inset. Mínimo de 16 px de inset quando o sistema informa 0 (aparelho com botão Início, como o iPhone SE, ou com botões físicos).
- **Folha inferior**: o conteúdo da folha termina acima do inset da base; o fundo da folha vai até a borda.
- **Laterais**: em paisagem o inset lateral vira margem adicional. O app é **retrato** na v1; paisagem só em tablet (v2).
- **Teclado**: ao abrir, a tela rola para o campo ficar visível acima do teclado; a barra de abas fica escondida atrás do teclado (não precisa reposicionar).

## Comportamento por tamanho de tela

Os três tamanhos de referência e o que muda em cada um. Fonte do sistema no padrão (100 %).

### Pequeno — 360 × 640 (Android de entrada, muito comum no Brasil)

- Margem 16. Coluna de 328 px.
- Grade de 2 colunas de cartão **vira 1 coluna** se cada coluna ficar abaixo de 150 px (328 − 12) / 2 = 158 → ainda 2 colunas, mas cartão de treino pronto esconde a descrição e mostra só título + objetivo + duração.
- Linha de série: `numeroCarga` cai de 40 para **32 px** e os botões +/− **saem da linha** (abrem ao tocar no número, `02-COMPONENTES.md` componente 6). Medido em 10/10/2026: com os botões de 56 a linha precisa de mais de 328 px mesmo com um campo só, então "os dois botões +/− com 32 px" não cabia.
- Cronômetro: `numeroCronometro` 64 → **56 px**.
- Cabeçalho mostra título em 1 linha com reticências; sem subtítulo.
- Barra de 5 abas (o máximo, dono que também é personal): rótulo em 12 px cabe (72 px por aba). Rótulo nunca some.
- Altura útil (640 − 56 cabeçalho − 64 abas − insets ≈ 480 px) mostra ~3 cartões de exercício dobrados. O exercício em execução fica expandido e os outros, dobrados.

### Médio — 390 × 844 (referência; o mockup usa este)

- Margem 16. Coluna de 358 px.
- Todos os tamanhos no valor do token.
- 2 colunas de cartão com 173 px cada (o mockup antigo mostrava 161 porque a borda da moldura comia 24 px da tela; corrigido).
- ~5 cartões de exercício dobrados na altura útil.

### Grande — 430 × 932

- Margem **20**. Coluna de 390 px.
- Mesmos tamanhos de fonte: não aumentar tipografia por tela maior (quem quer letra maior usa a fonte do sistema).
- 2 colunas de 189 px: cartão de treino pronto mostra descrição em 2 linhas.
- Linhas de lista mantêm 72/56 px: não "esticar" linha porque sobrou altura.

### Os iPhones nessas faixas

| iPhone | Largura | Coluna | Faixa |
|---|---|---|---|
| SE (3ª geração) e 13 mini | 375 | 343 | **pequeno** (< 390): carga 32, cronômetro 56, linha de série sem os +/− |
| 16 | 393 | 361 | médio |
| 16 Pro Max | 440 | 400 | grande: margem 20 |

O SE tem só 667 de altura: com cabeçalho (56 + 20) e abas (64 + 16) sobram ~511 para o conteúdo, perto do Android de 640. Cabe o exercício atual expandido e mais 1 ou 2 dobrados; a faixa do cronômetro, quando aparece, come 56 dessa altura. Nada muda de layout por isso: a lista rola.

### Tokens de resposta (os únicos valores que mudam por largura)

| Token | < 390 | ≥ 390 | ≥ 430 |
|---|---|---|---|
| `layout.margemLateral` | 16 | 16 | 20 |
| `tipografia.numeroCarga` | 32 / 40 | 40 / 48 | 40 / 48 |
| `tipografia.numeroCronometro` | 56 / 64 | 64 / 72 | 64 / 72 |
| `titulo1` | 24 / 30 | 28 / 34 | 28 / 34 |
| Cartão de treino pronto | sem descrição | descrição 1 linha | descrição 2 linhas |

Tudo o mais é igual nos três tamanhos. Nunca esconder ação por falta de largura: quebra linha ou vira folha.

No mockup, a troca para os valores "< 390" acontece quando a **coluna de conteúdo** fica abaixo de 358 px (`layout.colunaCelularMedio`), por container query: vale dentro da moldura e das amostras de componente, qualquer que seja a largura da janela.

## Fonte do sistema ampliada (acessibilidade)

O usuário pode aumentar a fonte do aparelho até ~200 %. O app **respeita** (não trava a escala) e se adapta:

| Escala do sistema | O que acontece |
|---|---|
| até 130 % | nada muda; o layout já tem folga para isso |
| 130 % a 160 % | linhas de lista crescem em altura (não têm altura fixa, têm mínimo); cartão de treino pronto vira 1 coluna; a linha de 3 cartões de número quebra em 2 + 1; cabeçalho pode ir a 2 linhas de título; rótulo da aba para de crescer em 1,3 × |
| acima de 160 % | rótulo da barra de abas **some** e fica só ícone (com rótulo no toque longo e no leitor de tela); campo +/− empilha: número em cima, botões embaixo; cronômetro para em 72 px de fonte (não cresce mais) |

Regras que valem em qualquer escala:
- Alvo de toque **nunca encolhe** (48/56/64 são mínimos em px, não escalam para baixo).
- Texto **nunca é cortado** na horizontal: quebra linha ou o contêiner cresce.
- Número de carga tem teto: cresce até 1,5 × e para. É melhor um número grande que não cabe inteiro na escala máxima do que um layout que quebra.

## iPhone

O que muda no iPhone e o que fica igual está em `06-IPHONE.md`. Resumo: a identidade é do Academia Plus (cor, fonte, tamanhos, alvos de toque, abas embaixo); o comportamento é do sistema (voltar deslizando, título grande que rola, folha nativa com alturas média e grande, menu de ações, seletores de data e hora, interruptor, puxar para atualizar, vibração).

## Tema claro e escuro

- Segue o sistema por padrão; o usuário pode fixar em **Perfil**.
- Troca de tema não é animada (evita piscar).
- Os dois temas usam os mesmos componentes; só o conjunto de cores muda. Não existe "componente que só aparece no escuro".
- Academia com luz forte: o aluno tende a usar o claro; no escuro, `superficie` precisa se distinguir de `fundo` (a marca mantém pelo menos 1,2:1 entre eles).

## Tablet — v2

O app é para celular. Em tablet (≥ 768 px), na v1, roda centralizado em uma coluna de 600 px (`layout.larguraMaximaConteudo`) com fundo `fundo` nas laterais. Nada quebra, mas nada é aproveitado.

**v2 — marcado, não especificado**: visão da academia em tablet pode usar lista à esquerda (alunos) e detalhe à direita (perfil + montar treino). Depende da decisão **[decidir]** sobre quanto de gestão entra no app. Se a visão da academia virar painel, tablet vira prioridade.
