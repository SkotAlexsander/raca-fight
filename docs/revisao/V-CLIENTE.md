# V — Melhorias para o cliente (P10, 11/10/2026)

Agente V da checagem final. O cliente tem dois rostos: **a academia**, que compra ou adota o app (dono, recepção, instrutor, personal), e **o aluno**, que o usa todo dia.

Como trabalhei:
- li a especificação inteira, os treinos prontos, a proposta de valor, `docs/decisoes.md` e a revisão B;
- percorri o dia de cada papel pelas telas do mapa;
- pesquisei na web evasão em academias e o que os apps dão ao dono.

Regras que segui:
- **escrevi só** em `01-especificacao/` (acrescentando, tudo marcado "(P10)") e neste arquivo;
- **não mudei o visual**: tela nova está descrita em texto, e o desenho fica para depois;
- **não resolvi nenhum [decidir]**;
- **não repeti o que já entrou**. Vários itens do top 10 **retomam itens da revisão B** (de 10/10) que ficaram só como proposta e não entraram na especificação. Cada um diz de qual item veio.

Legenda: **P** (horas a 2 dias) · **M** (até 1 semana) · **G** (mais, ou depende de gente de fora).

---

## 0. Pedido do Alex: Equipe da academia e perfil profissional (já acrescentado)

É **decisão do Alex** (11/10/2026), v1, e não entra na disputa do top 10. Está escrito na especificação:

| Onde | O que entrou |
|---|---|
| `01-HISTORIAS.md` | H90 a H95 (seção K) |
| `03-REGRAS.md` | seção 11: R11.1 a R11.13 |
| `02-FLUXOS.md` | F14: o profissional monta o perfil, o aluno vê a equipe, o dono esconde um perfil |
| `04-MAPA-DE-TELAS.md` | Parte 7.1 (onde fica) e 7.2 (telas e peças) |
| `00-PAPEIS.md` | linhas de permissão |
| `05-FORA-DA-V1.md` | "Valores no perfil profissional", com o motivo "o Alex pediu para não pôr valores por enquanto"; avaliação do profissional; busca por turno |
| `90-PERGUNTAS-PARA-O-ALEX.md` | perguntas 26 a 28 |

**Onde fica a entrada (o primeiro passo pedido): em Perfil (aluno), na linha "Equipe da [academia]", logo abaixo da academia vinculada.** Não vira aba nova. Os motivos, pelo mapa de telas:
- **Perfil** já é onde a academia mora na visão do aluno (academia vinculada, Sua academia).
- **Início** responde "o que faço hoje?". Ele segue a regra de um herói por tela e já tem quatro atalhos.
- **Treinos** é sobre os treinos do aluno, não sobre pessoas.
- A descoberta acontece pelo contexto: o nome em "Montado por Carlos" e o bloco "Meu personal" do Plus abrem o mesmo perfil.

**Mudaria se** os alunos não acharem a Equipe no TestFlight. Aí ela vira atalho no Início.

**O que ficou escrito**:
- **Perfil opcional**, com: nome de exibição, foto, formação, CREF inteiro, especialidades da lista fixa, "Sobre mim" com até 280 caracteres, e a grade de dias × manhã, tarde e noite.
- **Visibilidade**: a chave "Mostrar meu perfil aos alunos" nasce desligada. Só o aluno com vínculo **ativo** naquela academia vê o perfil.
- **O que nunca aparece**: telefone, e-mail, nota, estrela, ranking ou preço.
- **O dono pode esconder** qualquer perfil, e só ele desfaz.
- **Ligações com o que já existe**:
  - o "Meu personal" do Plus abre o mesmo perfil;
  - sem perfil visível, o aluno Plus continua vendo o nome e a foto do personal;
  - "Montado por [nome]" vira link quando o autor tem perfil visível.

**[decidir] novos**, para a tabela do P00 (não escrevo no P00):
- **Pergunta 28**: o CREF é conferido na consulta do sistema CONFEF/CREF ou mostrado como a pessoa digitou? Não achei consulta pública nacional com acesso por programa; a consulta parece ser por CREF regional. Nas duas respostas, a tela só diz "verificado" se houver a conferência.
- **Pergunta 27**: o aluno pode avaliar o profissional? O risco está escrito lá: a nota expõe o profissional à academia inteira, cria comparação entre colegas e pede moderação.

**Um cuidado** (pergunta 26): a especialidade "reabilitação", da lista do Alex, pode ser lida como atividade de fisioterapeuta. Vale confirmar o rótulo com o CREF ou com um advogado antes de publicar. Não confirmei a regra.

---

## 1. O dia de cada papel

Cada cena segue as telas do mapa. O número entre colchetes leva ao item do top 10 (seção 3), ou à seção 4 quando o item ficou abaixo do corte.

### Aluno às 6h, no porão sem sinal
- Abrir, ver o treino e registrar funciona: cache, fila e o ponto "3 treinos aguardando sinal" (`03-DECISOES-TECNICAS.md`, seção 2).
- **Buraco**: nada diz o que acontece se a **sessão vence** enquanto ele está sem sinal, nem se outra pessoa entra no mesmo celular antes de a fila subir. "Nunca se perde um registro" (R1.24) depende disso. [10]
- **Atrito**: a carga vem com a planejada (F4, passo 2). Quem sobe carga toda semana corrige todo campo, toda série. [1]
- **Falta**: ele não sabe que aparelho é a "cadeira extensora" da sala (B, V3) [abaixo do corte].

### Juliana, o primeiro dia
- Ela entra pelo código. Com a confirmação ligada, o vínculo fica pendente, e os treinos prontos (para ela, o produto inteiro) não aparecem até a recepção confirmar. [4]
- Digitar um código de 6 caracteres que a recepção dita é um passo a mais. Um QR no balcão resolve. [4]
- Ela não tem a quem pedir um treino, a não ser achando a instrutora na sala. [5]

### Dani, instrutora, 40 alunos no turno
- Para entregar o "Primeiros passos" sem mudar nada, ela passa pelo editor inteiro (F5). [3]
- Não existe fila: quem pediu treino, de quem o treino venceu, quem é novo e ainda não treinou. [2] [5]
- A busca por nome resolve a v1. O QR do aluno (B, A7) segue para depois.

### Recepção, segunda-feira da promoção
- 30 pedidos de vínculo, confirmados um a um. [4]
- Quem cancelou a matrícula continua na lista e nos números: a academia não tem como encerrar o vínculo. [9]

### Marcos, o dono, segunda de manhã
- O painel mostra os ativos, os sumidos e o Plus. **Não mostra** os novos, que são a janela de maior desistência, nem quantos vinculados têm treino ativo, nem quantos saíram. [2] [9]
- Ele precisa **abrir** o painel para saber. Um resumo na segunda às 9h chega até ele. [8]
- Ele vê "18 sumidos" e não tem o que fazer com o número. [6]

### Personal com 15 alunos Plus
- A lista é por nome. Ele não sabe por quem começar. [7]
- Ele não comenta um treino feito (B, V10) e não tem um ritual semanal (B, V8) [abaixo do corte].
- A dieta continua travada no R1 da revisão B (quem prescreve). Não mexi.

### O profissional que quer ser conhecido
Foi coberto pelo pedido do Alex (seção 0).

---

## 2. Por que a academia pagaria

### O que os números dizem

| Dado | Número | Fonte e cuidado |
|---|---|---|
| Abandono nos primeiros meses (academia no Rio de Janeiro, 5.240 alunos, de 2005 a 2014) | **63 %** dos novos alunos saíram antes do 3º mês; **menos de 4 %** ficaram mais de 12 meses seguidos | Sperandei S, Vieira MC, Reis AC. *J Sci Med Sport* 2016;19(11):916–920. Estudo revisado por pares, mas é **uma academia só**, e a adesão foi medida pela mensalidade paga, não pela presença. |
| Volta de quem saiu (mesma academia, 5.242 alunos) | Cerca de **38 %** dos que saíram voltaram a treinar em 12 meses; **mais da metade** desses voltou no primeiro mês | Sperandei, Vieira, Reis. *Athens Journal of Sports* 2019;6(2):95–108, doi:10.30958/ajspo.6-2-3. A janela para chamar de volta é curta. |
| Evasão anual no Brasil | **40 % a 60 %** ao ano, conforme o porte e a região | Atribuída à ACAD Brasil numa matéria do *Estado de Minas* de 28/07/2026, que é conteúdo de marca (PulseBrand). **Não achei o relatório original da ACAD.** Use como ordem de grandeza. |
| Contato com quem sumiu | Inativos contatados que voltaram tiveram **45 % menos chance** de cancelar | IHRSA com The Retention People, 2016, mais de 13 mil sócios **no Reino Unido** (*Health Club Management*). Já citado pela revisão B. Não é do Brasil. |
| Tamanho do mercado | **41.332** academias no Brasil, o 3º maior número do mundo; cerca de 8 % da população frequenta | Relatório Global 2025 da Health & Fitness Association, citado pelo *Diario de Pernambuco* em 27/07/2026. Não li o relatório original. |

O que **não** achei: nenhum estudo publicado que mostre um app de treino reduzindo a evasão de academia no Brasil. Os números de "app aumenta a frequência em X %" que apareceram vinham de blogs de fornecedor, sem estudo nomeado. Ficaram de fora.

### O que os outros apps dão ao dono

| Produto | O que oferece (pela loja ou pela ajuda do fornecedor) |
|---|---|
| **Tecnofit** (app do aluno, Brasil) | Ficha de exercícios, carga, check-in em aulas, avaliação física, frequência, contrato e vencimento ([App Store](https://apps.apple.com/app/id1109478634)). Login com o e-mail que a academia cadastrou. |
| **Next Fit** (app do aluno, Brasil) | Avisos da academia, aulas, treinos e evolução, contratos, financeiro, chat com instrutores, avaliação física; nota 4,9 com cerca de 84 mil avaliações ([App Store](https://apps.apple.com/BR/app/id1360859531)). |
| **PushPress** (EUA) | Fluxo "at-risk": o aluno entra em risco depois de cerca de **10 dias** sem check-in; a equipe é avisada e ele sai da lista quando volta ([ajuda da PushPress](https://help.pushpress.com/en/articles/13515587-grow-how-the-at-risk-member-workflow-works)). |
| **ABC Glofox** (EUA e Europa) | Relatório "Members at Risk" com previsão de saída em 30 dias, pela frequência e pelas reservas, e campanhas de reconquista a partir da lista; relatório de entradas, saídas e attrition ([página de relatórios](https://www.glofox.com/features/reporting/)). |

**O que isso quer dizer para o Academia Plus**:
- **Marcos já paga um sistema de gestão** (Proposta), e os dois maiores do Brasil já entregam ao aluno ficha, carga, frequência e, no Next Fit, chat e avisos. Treino no celular sozinho **não é diferencial** para quem usa Tecnofit ou Next Fit.
- O que o Academia Plus tem de próprio é a **relação**: o instrutor vê quem precisa dele, o personal acompanha no Plus, e a academia age sobre quem está sumindo. Lá fora, os sistemas que vendem retenção vendem **lista de quem está em risco, com ação**. O top 10 puxa o app nessa direção.
- **Risco a registrar**: se a academia já tem o app do aluno do sistema de gestão, o aluno terá dois apps. Importar alunos (B, V5) e, mais tarde, uma parceria com esses sistemas reduzem o atrito. Não achei API pública de nenhum deles (a revisão B também não achou).

### O que a academia ganha, em número

| Ganho | Como o app mede | O que falta para provar |
|---|---|---|
| Retenção dos novos | Novos (90 dias) que treinaram em 7 dias (R12.12) | A **data de matrícula** e o **cancelamento** estão no sistema de gestão, não no app. O vínculo e o "Encerrar vínculo" com motivo (R12.11) dão uma aproximação. |
| Menos evasão | Saídas no mês (R12.12); sumidos que voltaram depois do contato (item 6) | Um **piloto de 90 dias** numa academia real: a evasão dos 3 meses antes contra a dos 3 meses com o app, com a mesma régua (cancelamento no sistema dela). Sem isso, toda promessa de "menos evasão" é palavra. |
| Venda do Plus | Assinantes Plus (já no painel) | O preço e quem cobra são **[decidir]**, e a dieta está travada no R1 da revisão B. |
| Tempo do instrutor | Treinos entregues por semana; tempo entre o pedido e o envio (R12.2) | Medir no piloto quanto leva "Dar treino pronto" contra a ficha de papel. |

**Recomendação**: antes de vender, rodar o piloto e combinar com a academia, por escrito, qual número de evasão ela vai comparar. O app não deve prometer na loja nem na venda uma redução que ninguém mediu.

---

## 3. Top 10, por valor ÷ esforço

| # | Item | Papel | Tamanho | Quando | Na especificação? |
|---|---|---|---|---|---|
| 1 | A série vem com a última carga real | aluno | P | v1 | **Sim**: H96, R12.1 |
| 2 | Alunos novos (90 dias) separados, com o corte de 7 dias | instrutor, recepção, dono | P | v1 | **Sim**: H100, R12.6, R12.12 |
| 3 | Dar treino pronto em dois toques | instrutor | P | v1 | **Sim**: H99, R12.4, F15 |
| 4 | Entrar sem atrito: QR e link do código, pendente já vê os treinos prontos, confirmar em lote | aluno, recepção | P | v1 | **Sim**: H101, H102, R12.8 a R12.10 |
| 5 | Pedir treino novo e "Trocar em [data]" | aluno, instrutor | P | v1 | **Sim**: H97, H98, R12.2, R12.5, R12.7 |
| 6 | Sumidos com ação: "Chamar no WhatsApp", "Contatado em" e "Voltou" | recepção, dono | M | v1 | Não: proposta (é M) |
| 7 | Meus alunos Plus ordenados por atenção | personal | P | v1 | **Sim**: H105, R12.14 |
| 8 | Resumo da semana para o dono, segunda às 9h | dono | P | v1 | **Sim**: H104, R12.13 |
| 9 | Prova de valor: encerrar vínculo com motivo e números de adoção e saída | dono, recepção | P (o que entrou) + M (comparação) | v1 | **Em parte**: H103, R12.11, R12.12. A comparação ficou como proposta. |
| 10 | Sessão vencida não perde o treino da fila | aluno | P | v1 | **Sim**: H106, R12.3 |

### 1. A série vem com a última carga real
- **Problema**: F4 preenche a carga real com a planejada. Quem progride (Rafael) corrige todo campo, toda série, todo treino. É o atrito mais repetido do app.
- **Proposta**: vem a última carga real (R1.23). A exceção é quando quem montou mudou a carga planejada depois da última execução: aí vale a planejada, para não apagar a progressão do instrutor ou do personal. O planejado fica sempre ao lado.
- **Origem**: revisão B, A5. O que acrescentei é a exceção da carga planejada nova.

### 2. Alunos novos separados
- **Problema**: o painel e a lista tratam igual quem chegou há 3 semanas e quem treina há 3 anos. Na academia estudada por Sperandei e colegas, 63 % dos novos saíram antes do 3º mês.
- **Proposta**: "Novo" é quem tem até 90 dias de vínculo. Entram o filtro, o corte de 7 dias sem treinar (não 14), a contagem no resumo das 09:00 e o quadro no painel.
- **Origem**: revisão B, V2, que propunha 60 dias e não tinha estudo. Os 90 dias seguem a janela do estudo.

### 3. Dar treino pronto em dois toques
- **Problema**: entregar o "Primeiros passos" sem mudanças passa pelo editor inteiro.
- **Proposta**: um botão no Perfil do aluno, a lista dos prontos e a folha com "ativo", "Trocar em" e recado. A lista só filtra pelo objetivo do aluno se ele autorizou: o objetivo é dado de saúde (R6.5).
- **Origem**: revisão B, A6, com o cuidado do objetivo acrescentado.

### 4. Entrar sem atrito
- **Problema**: o código ditado no balcão, o primeiro dia vazio enquanto o vínculo está pendente e 30 confirmações uma a uma.
- **Proposta**:
  - QR e link em Configurações;
  - o aluno pendente vê e usa os treinos prontos, mas não a Equipe, o Plus nem os avisos;
  - "Confirmar todos (N)".
- **Origem**: revisão B, A1 e A2. O lote é novo.

### 5. Pedir treino novo e "Trocar em"
- **Problema**: o aluno não tem como pedir, e a instrutora não sabe de quem a ficha venceu.
- **Proposta**: um pedido aberto por vez, com recado de 140 caracteres, que fecha sozinho quando a academia envia o treino. "Trocar em" vem vazio por padrão, a não ser que o dono configure um padrão (não prescrevo prazo). Na data, um cartão no Início do aluno. Na academia, filtros e uma linha no resumo das 09:00, sem notificação nova.
- **Cuidado**: o recado pode ter dado de saúde escrito pelo aluno ("dor no joelho"), por isso nunca vai para notificação nem log.
- **Origem**: revisão B, B8 e B9.

### 6. Sumidos com ação (proposta, não entrou)
- **Problema**: "18 sumidos" é um número sem ação. Na academia do Rio, mais da metade dos que voltaram voltou no primeiro mês depois de sair. Os sistemas de fora vendem justamente a lista com ação (PushPress, Glofox).
- **Proposta**, como na revisão B, V1:
  - em cada sumido, "Chamar no WhatsApp" com um texto pronto e editável, e a marca "Contatado em [data] por [nome]";
  - no painel, "Voltaram depois do contato".
- **Por que não entrou**: é M. Também depende de a academia ter o telefone do aluno (a conta pode ser só de e-mail) e do texto pronto passar pelo tom de voz.
- **Origem**: revisão B, V1.

### 7. Meus alunos Plus por atenção
- **Problema**: com 15 alunos, a lista por nome não diz por onde começar.
- **Proposta**: a ordem é novo sem plano, depois 3 dias sem registro, adesão caindo 20 pontos e treino para trocar, com o motivo escrito em cada linha. Usa só o que o personal já vê.
- **Origem**: revisão B, V9. Tirei o "retorno semanal sem resposta", que depende do V8, ainda fora.

### 8. Resumo da semana para o dono
- **Problema**: o dono só sabe da academia se abrir o painel.
- **Proposta**: na segunda às 09:00, um aviso só com contagens, com chave própria. Entra no limite de 3 avisos por dia e abre o painel.
- **Origem**: novo.

### 9. Prova de valor para o dono
- **Problema**: o app não sabe quem cancelou a matrícula, então não mostra saída nenhuma. E "alunos ativos" não diz quantos vinculados nem começaram.
- **O que entrou**: a recepção e o dono encerram o vínculo, com motivo opcional (revisão B, B10, mais o motivo). No painel entraram "Com treino ativo", "Novos (90 dias)" e "Saídas no mês".
- **Proposta (M)**: "Das saídas do mês, quantas tinham treinado pelo app nos 30 dias antes". É o número mais próximo de "o app segura aluno" que o app consegue medir sozinho. **É correlação, não causa**: tem de vir escrito assim na tela. Só soma, sem nome.

### 10. Sessão vencida não perde o treino da fila
- **Problema**: a fila sobrevive a "Sair" com aviso (revisão B, B12), mas nada fala de sessão vencida durante o tempo sem sinal, nem de outra conta no mesmo aparelho.
- **Proposta**: a fila guarda de quem é cada item. Sessão vencida pede para entrar de novo antes de enviar, e outra conta nunca envia a fila alheia.
- **Origem**: novo. É uma regra de comportamento; o como fica com o agente T e a arquitetura.

---

## 4. Logo abaixo do corte

Ficam como proposta, sem entrar na especificação:

| Item | Papel | Tamanho | Quando | Por que ficou fora do top 10 |
|---|---|---|---|---|
| Foto do aparelho tirada pela academia e "onde fica" (B, V3) | aluno, instrutor | P | v1 | Valor alto, mas mexe na regra de imagem do agente S. A decisão de 10/10 já prevê dar prioridade às fotos da academia; falta casar com a regra da miniatura, e isso é do design. |
| Treino avulso, "Treino livre de hoje" (B, B6) | aluno | P | v1 | Bom, e entra fácil. Cortei por limite; o próximo da fila. |
| Comentário do personal no treino feito (B, V10) | personal, aluno Plus | P | v1 | Depende de o Plus andar, e o Plus está travado na dieta (R1). |
| Retorno semanal do Plus (B, V8) | personal, aluno Plus | M | v1 | O mesmo motivo. |
| Importar alunos por planilha (B, V5) | recepção, dono | M | v1 | Importante na implantação; é M. |
| "Segui tudo hoje" na dieta (B, A8) | aluno Plus | P | v1 | Espera a decisão sobre quem prescreve a dieta (R1). |
| "Treinaram hoje", para a instrutora ver quem está na sala | instrutor | M | depois | Pede o envio do início do treino (hoje só sobe no fim, pela fila). |

---

## 5. O que acrescentei à especificação

Tudo marcado "(P10)", sem apagar nada. A única troca de comportamento está escrita na própria regra: **R12.1 substitui o preenchimento do F4, passo 2**.

| Arquivo | O que entrou |
|---|---|
| `01-HISTORIAS.md` | Seção K (H90 a H95, Equipe) e seção L (H96 a H106). |
| `03-REGRAS.md` | Seção 11 (R11.1 a R11.13, Equipe) e seção 12 (R12.1 a R12.14). |
| `02-FLUXOS.md` | F14 (Equipe: três fluxos) e F15 (sete fluxos curtos). |
| `04-MAPA-DE-TELAS.md` | Parte 7. Equipe: onde fica, 3 telas novas (Equipe, Perfil do profissional e Meu perfil profissional) e as peças em telas que já existem. Melhorias: as peças em 11 telas, mais 3 folhas novas (Pedir treino novo, Dar treino pronto, Encerrar vínculo). |
| `00-PAPEIS.md` | A tabela de permissões dos acréscimos. |
| `05-FORA-DA-V1.md` | 3 linhas: valores no perfil, avaliação do profissional, busca por turno. |
| `90-PERGUNTAS-PARA-O-ALEX.md` | 26 (lista de especialidades e a palavra "reabilitação"), 27 **[decidir]** (avaliação do profissional), 28 **[decidir]** (CREF conferido ou digitado). |

### Para outros agentes (não editei)
- **P00**: acrescentar à tabela os [decidir] das perguntas 27 e 28.
- **Arquitetura e modelo de dados** (agente T ou o próximo do `03-arquitetura/`). Faltam:
  - `PerfilProfissional`, ligado ao vínculo de equipe, com `visivel`, `escondidoPeloDono`, `consentimentoEm` e a grade de turnos;
  - `PedidoDeTreino`;
  - `trocarEm` no treino enviado;
  - `motivo` no encerramento do vínculo;
  - o dono da conta em cada item da fila de envio (R12.3).

  Os avisos novos (resumo da semana; as linhas novas no resumo das 09:00) entram na tabela de avisos, seção 3. O perfil profissional precisa de RLS: aluno com vínculo **ativo** na mesma academia, e perfil visível e não escondido.
- **Design** (depois do congelamento): desenhar Equipe, Perfil do profissional e Meu perfil profissional, e os quadros novos do painel do dono.

---

## 6. Fontes (consultadas em 11/10/2026)

- Sperandei S, Vieira MC, Reis AC. Adherence to physical activity in an unsupervised setting: explanatory variables for high attrition rates among fitness center members. *J Sci Med Sport.* 2016;19(11):916–920. Resumo e citações via [Western Sydney University](https://researchers.westernsydney.edu.au/en/publications/adherence-to-physical-activity-in-an-unsupervised-setting-the-cas/) e [SciELO, RBCE](https://www.scielo.br/j/rbce/a/WtzM3gBFRkcrqY7xKZsVNnm/).
- Sperandei S, Vieira MC, Reis AC. Adherence to physical activity in an unsupervised setting: the case of lapse and return to practice in a Brazilian fitness center. *Athens Journal of Sports.* 2019;6(2):95–108. doi:10.30958/ajspo.6-2-3. [PDF](https://www.athensjournals.gr/sports/2019-6-2-3-Sperandei.pdf).
- *Estado de Minas* (PulseBrand), "Retenção de alunos vira novo campo de batalha das academias no Brasil", 28/07/2026. [Link](https://www.em.com.br/networking-e-negocios/2026/07/7469486-retencao-de-alunos-vira-novo-campo-de-batalha-das-academias-no-brasil.html). É conteúdo de marca: a ACAD aparece citada, não o relatório.
- *Boca*, "Setor de academias no Brasil cresce, mas enfrenta desafio de retenção". [Link](https://boca.com.br/negocios/setor-de-academias-no-brasil-cresce-mas-enfrenta-desafio-de-retencao). Repete o 63 % sem nomear o estudo; usei o original acima.
- *Diario de Pernambuco*, coluna Diario Econômico, 27/07/2026, com dados do Relatório Global 2025 da HFA. [Link](https://www.diariodepernambuco.com.br/colunas/diario-economico/2026/07/11719615-academias-suplementos-moda-e-eventos-movimentam-mais-de-rs-25-bilhoes-no-brasil.html).
- IHRSA e The Retention People, 2016, via [Health Club Management](https://www.healthclubmanagement.co.uk/health-club-management-news/Fitness-retention-IHRSA/325741).
- Tecnofit na [App Store](https://apps.apple.com/app/id1109478634) · Next Fit na [App Store](https://apps.apple.com/BR/app/id1360859531).
- PushPress, [How the At-Risk member workflow works](https://help.pushpress.com/en/articles/13515587-grow-how-the-at-risk-member-workflow-works) · ABC Glofox, [Reporting](https://www.glofox.com/features/reporting/).
- Consulta de CREF: não achei página pública nacional com acesso por programa. O registro é feito no CREF regional, segundo a Resolução CONFEF nº 617/2026 ([LegisWeb](https://www.legisweb.com.br/legislacao/?id=494877)).
