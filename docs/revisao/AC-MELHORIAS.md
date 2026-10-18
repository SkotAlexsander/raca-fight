# AC — Melhorias, segunda busca (P11, onda 4) · 11/10/2026

Pedido do Alex: "buscar por melhorias novamente". Desta vez **o app existe**. O agente AC fez estes passos:
1. exportou o app para a web, numa pasta própria do scratchpad (`ac/dist`);
2. serviu a pasta e percorreu o app com Playwright a 393 × 852, no tema claro;
3. entrou como cada conta de exemplo: Ana, Juliana, Lucas, Diego, Júlia e Marcos;
4. fez o dia real de cada um, contando toques e telas;
5. olhou as capturas.

Regras que segui:
- não repeti o que está em `B-MELHORIAS.md`, `V-CLIENTE.md`, `05-FORA-DA-V1.md` nem nas pendências de Y, Z e AA. Quando um achado encosta num item desses, digo qual é e o que há de novo;
- não mudei o design;
- não resolvi nenhum **[decidir]**: "dieta" × "plano alimentar", conversa por chat ou WhatsApp e quem paga o Plus ficaram como estão;
- **não toquei em `app/`**, porque o agente AB está mexendo lá. O que é de código ou de texto de tela está nas seções 4 e 5, com arquivo e linha;
- os itens P de v1 que são de especificação entraram em `01-especificacao/`, marcados "(P11)" (seção 6).

Legenda: **P** (horas a 2 dias) · **M** (até 1 semana) · **G** (mais que isso, ou depende de gente de fora).

Os scripts e as capturas são temporários e ficam em `scratchpad/ac/`: `lib.mjs`, `vistoria.mjs`, `ana.mjs`, `juliana.mjs`, `lucas3.mjs`, `equipe.mjs`, `equipe2.mjs` e `refeicao.mjs`, com 80 capturas em `capturas/` e um `.log.txt` por roteiro, com o texto de cada tela. Nos roteiros que escutavam a página, não apareceu erro de página nem de console.

---

## 1. Toques por tarefa

Cada toque foi contado no roteiro, a partir da tela em que o app abre para aquela conta. Digitar conta à parte.

| Conta | Tarefa | Toques | Telas e folhas | O que se viu |
|---|---|---|---|---|
| Ana (Plus) | Começar o treino de hoje e marcar a 1ª série | **3** | Início → Modo treino | O 1º exercício é a esteira por 5:00; para ir ao supino, toca "Próximo". Ficou bom. |
| Ana | Fechar o treino | **2** | menu Pausar → comemoração | **Não há confirmação.** Fechou com 1 série de 26, e esse treino contou na semana ("4 de 4"). [1] |
| Ana | Voltar ao Início depois de treinar | 0 | Início | O herói diz "Hoje · Treino B · Começar" no mesmo dia em que ela já treinou. [3] |
| Ana | Registrar uma refeição | **2** | Início → Dieta | Ficou bom. |
| Ana | "Não segui" com motivo | 2 + digitar | folha | A folha pergunta "O que aconteceu?" sem dizer de qual refeição. [texto 14] |
| Ana | Ver a evolução da carga | 1 (+2 para outro exercício) | Evolução | Abre no agachamento; para ver o supino, ela troca pelo seletor. |
| Ana | Trocar o dia | **2** | folha | Ficou bom. |
| Ana | Abrir o treino que a personal montou | 2 | Plus → treino | Esse treino não está em uso (ela treina o ABC que copiou) e nada avisa. [abaixo do corte, R13.9] |
| Ana | Falar com a personal | 2 | — | **Morto**: aviso "chega na próxima versão". [texto 9] |
| Ana | Rever um treino passado | — | — | **Impossível**: as linhas do Histórico não abrem. [10] |
| Ana | Tocar no sino | 1 | Avisos | O sino abre as **chaves** dos avisos, não os avisos recebidos. [abaixo do corte] |
| Juliana (pendente) | Do zero ao primeiro treino começado | **6** | Início → Prontos → Ver pronto → folha → **Editar** → Início → Modo treino | Depois de "Usar", cai no editor ("Renomear", "Apagar este dia"). [2] |
| Juliana | Saber se a academia já confirmou | 1 (aba Perfil) | Perfil | O Início não diz. O Plus diz "Quando você entrar numa", e ela já entrou. [4] |
| Juliana | Fazer a 1ª série do leg press | — | Modo treino | A carga vem como **0 kg**: sem planejado nem histórico, a série seria gravada como "peso do corpo". [9] |
| Lucas (sem academia) | Montar do zero e começar com 1 exercício | **8** + nome | Início → folha → Editar → folha → Editar → Início → Modo treino | O treino criado **não fica em uso**. Com o exercício já posto, o Início continuou em "Monte seu primeiro treino". [2] |
| Lucas | Entrar numa academia depois | — | — | **Impossível**: "O código da academia entra aqui depois." não tem toque. [4] |
| Diego (dois papéis) | Trocar de personal para aluno | **3** | Perfil → Escolher visão → Início | Ficou bom. |
| Júlia (personal) | Ver como a Ana está | 2 | Plus → Perfil do aluno | Abre em **Alunos** (a lista de todos). A tela da Ana é a do instrutor: não mostra dieta. [5] [6] |
| Júlia | Ver as refeições da Ana | — | — | **Impossível**: a tela "Aluno Plus (personal)" do mapa não foi feita. [6] |
| Marcos (dono) | Ver quem sumiu esta semana | 1 (filtro) ou 2 (Academia → Ver lista) | Alunos | A lista vem em ordem alfabética e não separa quem sumiu esta semana de quem sumiu há meses. [7] |
| Marcos | Chamar quem sumiu | — | — | Impossível. Já é a proposta 6 do V. |
| Marcos | Dar treino ao aluno que pediu | **4** | Alunos → Perfil → folha → folha | São 2 toques depois de abrir o aluno, como a R12.4 pede. Ficou bom. |
| Marcos | Começar um treino para a aluna nova | 3 | Alunos → Perfil → folha "Começar de onde?" | Ficou bom. |
| Marcos | Confirmar a pendente | **1** | Alunos | Ficou bom. |
| Marcos | Ver o aviso em vigor | 1 | Avisos da academia | Ficou bom. |

**Leitura**: o caminho de quem já treina está curto. Começar, marcar, refeição e trocar o dia levam 2 ou 3 toques. Os problemas se juntam em três lugares:
- **no primeiro dia**: Juliana e Lucas;
- **no fim do treino**: fechar sem querer, e o Início que não sabe que o treino já foi feito;
- **no papel que não é o do instrutor**: o personal e o dono abrem na lista de todos os alunos, e o personal não vê a dieta.

---

## 2. Top 10, por valor ÷ esforço

| # | Problema | Proposta | Papel | Tamanho | Quando | Onde ficou |
|---|---|---|---|---|---|---|
| 1 | Um toque no menu fecha o treino pela metade, e ele conta na semana | Confirmar quando falta série: "Faltam 25 séries de 6 exercícios." · Fechar assim · Voltar ao treino. Sem série feita, oferecer Descartar | aluno | P | v1 | **Spec**: R13.1, H107, F16. **Código**: seção 4 |
| 2 | O primeiro treino não fica pronto para começar: o Lucas leva 8 toques e cai num Início vazio; a Juliana cai no editor | O primeiro treino nasce em uso. "Usar" um pronto volta a Meus treinos com o aviso "em uso · Ajustar" | aluno | P | v1 | **Spec**: R13.2, R13.3, H108, F16 (8 → 6 e 6 → 5 toques) |
| 3 | Depois de treinar, o Início manda começar o Treino B no mesmo dia | Seguir o F4, passo 8: "Treino de hoje feito" no herói, com o próximo dia escrito ("Próximo: Treino B") | aluno | P | v1 | Já está no F4.8; falta o **código** (seção 4) |
| 4 | Sem academia não há como entrar numa. O pendente não sabe que está pendente | "Tenho um código" nos quatro vazios que falam de academia. Para o pendente, a frase certa no Plus e o cartão "Aguardando a recepção" no Início | aluno | P | v1 | **Spec**: R13.4, R13.5, H109. O cartão e a tela Sua academia já estavam no mapa e no F15; falta o código |
| 5 | O dono e o personal abrem o app na lista de todos os alunos | A primeira aba segue o papel: dono → Academia (números); personal com aluno Plus → Meus alunos Plus | dono, personal | P | v1 | **Spec**: R13.7, H111 |
| 6 | O personal não vê a dieta do aluno Plus | Fazer a tela "Aluno Plus (personal)" do mapa (Resumo, Treino e Dieta, com a adesão de 7 e 30 dias e os motivos do "Não segui") | personal | M | v1 | Já está no mapa (Parte 3); falta o **código**. Ninguém tinha listado como pendência |
| 7 | "Quem sumiu" vem em ordem alfabética: quem sumiu há 15 dias fica junto de quem sumiu há 200 | Sumidos do mais recente para o mais antigo, com o selo "Sumiu esta semana". Cada filtro ganha a ordem da sua pergunta | dono, recepção | P | v1 | **Spec**: R13.8, H112, F16 |
| 8 | Com o aparelho ocupado, o Modo treino só anda para a frente, um exercício por vez | O título abre a folha "Treino de hoje" com os exercícios e o estado; tocar vai até o exercício | aluno | P | v1 | **Spec**: R13.6, H110, F16 |
| 9 | Sem carga planejada nem histórico, a série vem com 0 kg, que é "peso do corpo" pela R1.14 | Campo de carga **vazio** ("— kg") até o aluno pôr um número. Gravar vazio, nunca 0 | aluno iniciante | P | v1 | Já está na R1.14 e na R12.1, item 3; falta o **código** (o Y viu o mesmo na tela Séries) |
| 10 | O Histórico não abre o treino feito, e a comemoração não diz o que faltou | Linha do Histórico → "Treino realizado (detalhe)"; comemoração com "séries feitas / planejadas" e os pulados (F4.7) | aluno | P | v1 | Já está no mapa e no F4.7; falta o **código** |

### Por que essa ordem
- **1 e 3** acontecem em todo treino. O 1 grava dado errado (frequência, semana, dia sugerido), e o 3 faz o app parecer não saber o que acabou de acontecer.
- **2 e 4** são o primeiro dia. A revisão V mostrou que os novos são quem mais desiste (63 % antes do 3º mês, Sperandei e colegas, 2016). O V cuidou da entrada (QR, pendente vendo os prontos). Aqui o problema é o **minuto seguinte**: a tela em que a pessoa cai depois de escolher.
- **5 e 7** custam quase nada e mudam a primeira tela de quem paga o app (o dono) e de quem vende o Plus (o personal).
- **6** é M, mas sem ele o Plus é um nome: o personal não acompanha a dieta que o próprio Plus promete.
- **8, 9 e 10** são atritos de sala que um aluno nota na primeira semana.

### Abaixo do corte

| Item | Papel | Tamanho | Quando | Onde ficou |
|---|---|---|---|---|
| Aluno Plus que treina outro treino que não o do personal: motivo na lista do personal e "Não está em uso" no Plus do aluno | personal, aluno Plus | P | v1 | **Spec**: R13.9, H113 |
| Recado do pedido visível enquanto se escolhe o treino (no iPhone SE a folha cobre; em Montar treino não aparece) | instrutor | P | v1 | **Spec**: R13.10, H114 |
| Painel do dono: só o herói e "Sumidos" abrem lista. "Novos", "Com treino ativo" e "No Plus" não abrem, e o mapa diz "tocar abre a lista" | dono | P | v1 | Código (seção 4) |
| O sino do Início abre as chaves de Avisos. Quem toca num sino espera os avisos recebidos | aluno | M | depois | Proposta: uma lista "Avisos recebidos" dos últimos 14 dias, com as chaves num ícone de ajuste. Pede desenho |
| Na Dieta, cada item tem um quadradinho que parece caixa de marcar, mas a marca é por refeição (R3.6) | aluno Plus | P | depois | Design: o mockup também tem. Fica para quando o design descongelar |
| "Conversar" no bloco do personal é um botão morto | aluno Plus | P | v1 | Enquanto não houver conversa, trocar o texto (seção 5) ou esconder o botão. A conversa em si é **[decidir]** |
| "Catálogo de componentes" aparece no Perfil de todo aluno e de toda a equipe | todos | P | v1, antes da loja | Código: mostrar só em `__DEV__` (seção 4) |
| A chave "Mensagens · Quando o personal escrever" existe sem a conversa existir | aluno Plus | P | v1 | Esconder até a conversa existir |
| O personal vê os pedidos pendentes ("Pediu para entrar hoje") sem poder confirmar | personal | P | depois | Mostrar pendentes só a quem confirma (recepção e dono) |

---

## 3. O que um cliente de academia estranharia

- **"Treino fechado." com 1 exercício, 1 minuto e 1 série**: parece que o app comemorou um erro (item 1).
- **"Hoje · Treino B · Começar"** logo depois de treinar (item 3).
- **"0 kg" no leg press do primeiro dia** (item 9): a pessoa acha que o app quer que ela faça sem peso.
- **"Escolha um pronto da academia"** para quem não tem academia, sem como entrar numa (item 4).
- **Equipe**: o dono abre o app e cai na lista de alunos, não nos números da academia dele (item 5).
- **"dieta 3 % em 7 dias"** na lista do personal: um percentual sem base. A Ana marcou 1 refeição de 35, e "3 %" parece que ela não segue nada, quando ela só não marca (texto 11).
- **"(escolha provisória de 11/10)"** e **"Modelos do catálogo, ainda sem a revisão do profissional com CREF"**: nota de desenvolvimento na tela da equipe (textos 10 e 12).

---

## 4. Para a próxima rodada: código (não aplicado; o AB está no `app/`)

| # | O quê | Onde | Regra |
|---|---|---|---|
| C1 | "Encerrar o treino" do menu chama `fechar` direto: abrir a folha de confirmação com o que falta (e Descartar sem série feita) | `app/telas/aluno/TelaModoTreino.tsx:288` (e a folha em `:293-305`) | R13.1 |
| C2 | Primeiro treino em uso: ao criar (folha Novo treino) ou copiar um pronto, ativar se não houver treino ativo; depois de "Usar", voltar a Meus treinos com o aviso "em uso · Ajustar" em vez de abrir o editor | `app/telas/aluno/TelaTreinos.tsx` (folha "+ Novo treino"), `app/telas/aluno/TelaTreinoPronto.tsx` (folha "Usar este treino?") | R13.2, R13.3 |
| C3 | Início com o treino de hoje já fechado: "Treino de hoje feito" e o próximo dia, sem o "Começar" como herói | `app/telas/aluno/TelaInicio.tsx:185` (o rótulo "Hoje ·") e o bloco do herói em volta | F4.8 |
| C4 | Botão "Tenho um código" e tela **Sua academia** (que o Y deixou sem tela) | `TelaInicio.tsx:235`, `TelaTreinos.tsx:184`, `TelaPlus.tsx:71`, `perfil/TelaPerfil.tsx:51` | R13.4, mapa (Sua academia) |
| C5 | Pendente: cartão "Aguardando a recepção confirmar" no Início, e a frase do Plus | `TelaInicio.tsx` (topo), `TelaPlus.tsx:71` | R13.5, F15 |
| C6 | Primeira aba por papel (hoje `academia: '/alunos'` fixo) | `app/telas/rotas.ts:14-17` e `navegacao/index.tsx:17` | R13.7 |
| C7 | Tela "Aluno Plus (personal)" (Resumo, Treino, Dieta) ao abrir pelo Meus alunos Plus; hoje `/acompanhamento/[id]` reusa o Perfil do aluno do instrutor | `app/telas/academia/TelaPerfilDoAluno.tsx`, `TelaMeusAlunosPlus.tsx` | mapa, Parte 3 |
| C8 | Ordem por filtro e selo "Sumiu esta semana" (hoje tudo `localeCompare` por nome) | `app/telas/academia/dados-da-academia.ts:122`, `TelaAlunos.tsx:79-95` | R13.8 |
| C9 | Folha "Treino de hoje" ao tocar no título/segmentos do Modo treino (`irPara` já existe) | `TelaModoTreino.tsx:137-144` (barra de cima, `Segmentos` em `:385`) | R13.6 |
| C10 | Carga vazia não vira 0: o `CampoNumerico` precisa de estado vazio, ou o Modo treino mostra "— kg" até o primeiro toque | `TelaModoTreino.tsx` (campos de carga), `componentes/CampoNumerico` | R1.14, R12.1 |
| C11 | Histórico: linha tocável → Treino realizado (detalhe) | `app/telas/aluno/TelaHistorico.tsx:46` | mapa (Treino realizado) |
| C12 | Comemoração com "séries feitas / planejadas" e pulados | `app/telas/aluno/TelaComemoracao.tsx:104-106` | F4.7 |
| C13 | Painel: "Novos", "Com treino ativo" e "No Plus" abrem a lista filtrada | `app/telas/academia/TelaPainelDoDono.tsx:126` (e os quadros vizinhos) | mapa, R12.12 |
| C14 | Motivo "Treina outro treino" na lista do personal; "Não está em uso" no Plus do aluno | `TelaMeusAlunosPlus.tsx:70-75`, `TelaPlus.tsx` (linha Meu treino) | R13.9 |
| C15 | Recado do pedido no topo da folha Dar treino pronto e em Montar treino | `TelaPerfilDoAluno.tsx` (folha), `TelaMontarTreino.tsx` | R13.10 |
| C16 | Esconder "Catálogo de componentes" / "Ver os componentes" fora de `__DEV__` | `perfil/TelaPerfil.tsx:66`, `academia/TelasDaEquipe.tsx:118` | — |
| C17 | Sub-aba "Prontos da academia" só com vínculo (o mapa diz "só se vinculado") ou com o botão do C4 | `TelaTreinos.tsx:184` | mapa, R13.4 |

---

## 5. Textos de interface a reescrever (18)

Conferidos contra o `01-TOM-DE-VOZ.md`. O que toca em **[decidir]** ficou de fora: "dieta" × "plano alimentar" e os nomes dos objetivos.

| # | Onde | Antes | Depois | Por quê |
|---|---|---|---|---|
| 1 | `TelaModoTreino.tsx:288` (menu) | Encerrar o treino | Fechar o treino | Vocabulário fixo: "fechar treino", nunca "encerrar" |
| 2 | `TelaModoTreino.tsx:296` (título da folha) | Encerrar treino? | Fechar o treino? | Idem |
| 3 | `TelaModoTreino.tsx:300` e `:215`, `:223` (botões) | Encerrar · Encerrar treino | Fechar treino | Idem (a comemoração já diz "Treino fechado.") |
| 4 | `TelaInicio.tsx:71` (atalho) | Treino passado | Histórico | O atalho abre o Histórico. "Treino passado" promete registrar um treino antigo (H36), que não existe |
| 5 | `TelaTreinos.tsx:106` (sem academia) | Escolha um pronto da academia ou monte o seu do zero. | Monte o seu do zero. Os prontos vêm com a academia. | Para o Lucas, a frase oferece o que ele não tem (o Início já diz certo, `TelaInicio.tsx:235`) |
| 6 | `perfil/TelaPerfil.tsx:51` | Sem academia · Você treina por conta própria. O código da academia entra aqui depois. | Sem academia · Tem o código da sua academia? Toque para entrar. | "Entra aqui depois" sem toque é beco (R13.4) |
| 7 | `TelaPlus.tsx:71` (vínculo pendente) | O Plus é oferecido pela academia. Quando você entrar numa, ele aparece aqui. | O Plus aparece quando a Academia do Marcos confirmar a sua entrada. | A Juliana já entrou; falta a confirmação (R13.5). Sem academia, a frase antiga fica, com o botão do C4 |
| 8 | `TelaEditarTreino.tsx:70` e `TelaTreinos.tsx:68` | Baseado em: Primeiros passos — (sem nome) · Baseado em ABC Hipertrofia — Academia do Marcos | Baseado em Primeiros passos — Academia do Marcos (a do pronto, mesmo pendente) | Com vínculo pendente sobra um "— " solto; e as duas telas escrevem diferente |
| 9 | `TelaPlus.tsx:107` (aviso de "Conversar") | A conversa com o personal chega na próxima versão | A conversa pelo app ainda não está pronta. Fale com Júlia na academia. | Diz o que fazer agora, sem prometer data (princípio 1) |
| 10 | `TelaMeusAlunosPlus.tsx:110` | O plano de dieta é da nutricionista parceira; você acompanha (escolha provisória de 11/10). | O plano de dieta é da nutricionista parceira. Você acompanha. | Nota de desenvolvimento na tela |
| 11 | `TelaMeusAlunosPlus.tsx:75` e `:73` | Treinou há 2 dias · dieta 3 % em 7 dias · Adesão caiu: 30 % nos últimos 7 dias (antes 60 %) | Treinou há 2 dias · 1 de 35 refeições marcadas em 7 dias · Marcou menos refeições: 10 de 35 nesta semana, 21 na anterior (números de exemplo) | "Número é texto" e o par do dono ("29 de 350", não "8,3 %"). "Marcadas" é honesto: refeição sem marca não é "não segui" |
| 12 | `TelasDeProntos.tsx:78` | O aluno escolhe pelo objetivo. Modelos do catálogo, ainda sem a revisão do profissional com CREF. | O aluno escolhe pelo objetivo. Revise antes de indicar: estes modelos ainda não passaram por um profissional com CREF. | Mantém o alerta e diz o que fazer |
| 13 | `compartilhado/TelaEscolherVisao.tsx:28` | Diego Alves, você tem 2 vínculos. Escolha como quer entrar; dá para trocar depois no Perfil. | Diego, você é personal e aluno na Academia do Marcos. Por onde quer entrar? Dá para trocar no Perfil. | "Vínculo" é palavra do sistema; o primeiro nome basta |
| 14 | `TelaDieta.tsx:91` (folha do "Não segui") | O que aconteceu? | O que aconteceu no almoço? | A folha cobre a lista e não diz de qual refeição se trata |
| 15 | `TelaPerfilDoAluno.tsx:40-58` (via `componentes/Auxiliares.tsx:56`) | Peso — Não informado · Altura — Não informado · Idade — Não informado | Rafael não informou peso, altura e idade. Dá para montar o treino sem isso. | É o par do próprio tom de voz ("Perfil do aluno sem cadastro corporal"). Três traços parecem dado faltando por erro |
| 16 | `dominio/unidades.ts:236-239` (`formatarDuracao`, Histórico da academia) | 46min · 1h 05min | 46 min · 1 h 05 min | Unidade sempre com espaço; o Histórico do aluno já escreve "46 min". Atenção: os testes do domínio conferem o formato atual |
| 17 | `TelaPerfilDoAluno.tsx:253` (leitor de tela) | 1 dias com treino nas últimas 4 semanas | 1 dia com treino nas últimas 4 semanas | Plural; o texto visível na linha 252 já usa `plural` |
| 18 | `aluno/comum/Pecas.tsx:110`, `TelaTreinoPronto.tsx:68` e `academia/TelaMontarTreino.tsx:52` | Esteira 1 × 5:00 · 0 s · "cerca de 25 min · " (sem academia) | Esteira 1 × 5:00 · "cerca de 25 min" | Descanso 0 não se escreve; o separador sem nada depois sobra |

---

## 6. O que acrescentei à especificação

Tudo marcado "(P11)", sem apagar nada. Duas regras mudam texto de fluxo já escrito, e cada uma diz isso dentro dela:
- a **R13.3** substitui o F3, passo 5;
- a **R13.1** muda o F4, passo 6, só quando ainda falta série.

| Arquivo | O que entrou |
|---|---|
| `01-especificacao/03-REGRAS.md` | Seção 13: R13.1 a R13.10 (13.1 Aluno, 13.2 Academia) |
| `01-especificacao/01-HISTORIAS.md` | Seção M: H107 a H114 |
| `01-especificacao/02-FLUXOS.md` | F16: seis fluxos curtos, com as contagens de toques antes e depois |
| `01-especificacao/04-MAPA-DE-TELAS.md` | 7.4: as peças em telas que já existem. Nenhuma tela nova e nenhum tamanho novo |

Não entraram na especificação, de propósito:
- os itens 3, 6, 9 e 10 do top 10 e o C13, porque **já estão escritos** (F4.7, F4.8, mapa Parte 3, R1.14, R12.1, R12.12). O que falta é código, e a lista está na seção 4;
- o sino com "Avisos recebidos" e a marca por item na Dieta, porque pedem desenho, e o design está congelado.

### Para outros agentes (não editei)
- **AB / próxima rodada no `app/`**: as seções 4 e 5.
- **Arquitetura**: nada novo no modelo. A R13.8 usa `ultimoTreinoEm` e `vinculo.desde`, e a R13.9 usa a origem dos treinos do aluno, que o personal já lê pela R6.6. A R13.7 é só de navegação.
- **Design, depois do congelamento**: o selo "Sumiu esta semana" usa o `Chip`/selo que já existe. A folha "Treino de hoje" usa `FolhaInferior` com `Linha`. Os dois itens de desenho do "abaixo do corte" (o sino e a marca por item na Dieta).
