# Direção de arte — três caminhos para o app ficar "bem mais atraente e clean"

> Agente I do P08, 10/10/2026. Abra `comparativo.html` no navegador (funciona por `file://`). Ele mostra as três direções lado a lado: as 4 telas-chave e o cartão de treino pronto, em claro e escuro, na moldura do iPhone 16 (393 × 852). No topo há os botões **Tema** (Claro, Escuro, Os dois), **Direção** (Todas, A, B, C) e **Efeitos**, que mostra onde entra cada efeito. No monitor largo, "Os dois" põe as 6 versões de cada tela numa linha só. A escolha da direção é **[decidir]** do Alex.

## O ponto de partida

O mockup de hoje (`sistema-de-design/mockups/`) ainda usa os valores **neutros** de `tokens.json`: preto, cinza e branco. A paleta da marca (`marca-e-proposta/tokens-marca.json`) existe, mas nunca foi aplicada. Por isso as três direções começam do mesmo passo: **os mesmos nomes de token, preenchidos com o verde-profundo, o dourado do Plus e os neutros esverdeados da marca.** Só isso já tira o app do cinza. O que muda de uma direção para outra é **onde** a cor e a imagem aparecem e **quanto** aparecem.

O que nenhuma direção mexe, porque o P08 proíbe:
- alvos de 48, 56 e 64;
- carga em número grande (+/− de 64 de altura, "marcar série" de 56 × 64);
- as abas e a estrutura das telas;
- o contraste mínimo (4,5:1 para texto; 3:1 para texto grande e ícone);
- as regras de marca: dourado só no Plus, selo sem brilho, nunca texto direto sobre foto, nada de corpo ideal.

## Moodboard descrito

Nenhuma imagem de terceiro foi copiada. As referências estão descritas abaixo.

- **Quadro branco da sala e caderno de carga.** A identidade já parte daqui: fundo limpo, número grande, uma cor só para o que é da casa. É a base de A e C.
- **A sala à noite.** Luz baixa e borracha preta no piso. O verde aparece como a luz de um painel aceso, não como neon. É a base de B.
- **Placar de ginásio e capa de caderno esportivo de jornal.** Manchete grande, número como protagonista, régua fina separando as linhas, cor chapada em bloco. É a base de C.
- **Apps nativos da Apple (Saúde, Fitness, Clima).** O que vale é a contenção: um único destaque por tela, sombras quase invisíveis, raio concêntrico (o raio da imagem acompanha o do cartão) e foto em vez de enfeite. Vale para as três.
- **Gente comum treinando, com luz ambiente.** Vale para as capas que o agente J produz. Vale também o que fica de fora: corpo de revista, antes e depois, luz de estúdio.

## As três direções

### A — Lousa clara com foto (recomendada)

**Em uma linha:** fundo quase branco, cartão branco com sombra em camadas, foto grande no topo de cada cartão, e verde só onde há ação.

| O que muda | Como |
|---|---|
| Cartão | raio 16 → **20**. Sombra em camadas no claro (a "md" de `beautiful-shadows`, a 5 %). No escuro, contorno de 1 px a 6 % de branco, com um fio de luz em cima, em vez de sombra. |
| Imagem | capa de **184 px** no cartão de treino pronto; miniatura de **56 px** (64 px no exercício atual) em cada exercício; 48 px nas listas da academia. Raio da miniatura 14, concêntrico ao cartão. |
| Marca | botão principal e "marcar série" em `marca` cheia. Aba ativa com pílula `marcaSuave` atrás do ícone. O exercício atual ganha contorno de 2 px na marca: é o único cartão que salta. |
| Escuro | a mesma tela, com `superficie` em vez de sombra. A capa vira um gradiente da marca (`#0D352F` → `#1C6A5E`) até chegar a foto. |

Ganha porque é a que mais aproxima "atraente" de "clean": quem atrai é a foto, e a cor fica para a ação. Perde porque é a mais próxima do que já existe. Se as fotos do J vierem fracas, a tela fica bonita, mas genérica.

### B — Sala à noite

**Em uma linha:** escuro esportivo, em que o verde-água acende o que importa. No claro, o topo vira uma faixa verde da casa.

| O que muda | Como |
|---|---|
| Topo das telas | **Claro:** faixa `marca` cheia que sobe atrás da barra de status, com texto branco (6,43:1). **Escuro:** faixa `marcaSuave` com um brilho radial da marca a 22 %. |
| Exercício atual | **Escuro:** halo da marca (anel de 1,5 px e brilho de 40 px), o único halo do app. **Claro:** anel de 2 px e sombra esverdeada. |
| Cronômetro | faixa do descanso em `marca` (claro) ou `marcaSuave` (escuro). Número em Archivo **800**. |
| Forma | botões em pílula. Aba ativa com traço no topo. Capas mais altas (208 px) e escuras; no escuro, a capa se dissolve na superfície do cartão. Cartão do escuro levemente tingido (`#132220`). |

É a mais "de academia" e a mais vistosa. Exige disciplina: se o brilho sair do exercício atual e do anel, vira o neon que `00-PROPOSTA.md` proíbe. As capas escuras também pedem do J um tratamento de foto próprio (luz baixa).

### C — Placar

**Em uma linha:** editorial, com tipografia forte. Título de 40 px, número grande como manchete, régua fina no lugar do cartão e imagem em bloco chapado da marca.

| O que muda | Como |
|---|---|
| Título | novo tamanho **`tituloDestaque` 40/44**, Figtree 700, −0,025 em, nas telas raiz. Hoje o maior título é o `titulo1`, de 28. |
| Número | o topo do treino vira placar ("5/18 séries · 14 minutos · 2/6 exercícios", em Archivo 40). No perfil, os números sobem para 40 px, com traço de 2 px em cima. |
| Cartão | quase não há cartão nem sombra: régua de 1 px a 14 %. Só o exercício atual fica num bloco `campo`. |
| Imagem | bloco chapado da marca com a foto em **duotone verde**: o J entrega a foto e o app tinge. |
| Cronômetro | faixa invertida (preta no claro, verde no escuro). |

É a mais clean e a mais diferente de qualquer app de treino. Mas é a que menos mostra foto (o pedido do Alex fala de "imagens"), a que mais ocupa altura, e o título de 40 tem que cair para 32 no celular pequeno.

## Recomendação: A, com duas coisas emprestadas

**A — Lousa clara com foto.** Os motivos:

1. **É a que menos arrisca o meio da série.** O cenário dos princípios é a tela refletindo a luz da sala. A tem o maior contraste de superfície no claro e não depende de brilho nem de faixa escura para ficar bonita.
2. **É a que mais usa o que o J está fazendo.** Capa grande por objetivo e miniatura em cada exercício respondem direto ao "imagens relacionadas ao assunto".
3. **Separa melhor a marca do Plus.** Com o verde só na ação e o dourado só no selo e na mensagem da personal, cada cor continua com um significado (regra de `02-IDENTIDADE-VISUAL.md`).
4. **Custa menos para o L e para o app:** muda valores de token, não estrutura. B e C pedem componentes novos (a faixa do topo; o placar e o duotone).

Duas coisas que valem trazer para dentro da A. São opcionais e entram no [decidir]:
- **do B:** o **halo da marca no exercício atual, só no escuro**. No escuro a sombra some, e o halo devolve o "este é o agora" sem cor nova;
- **do C:** o **placar no topo do treino do dia** (séries, minutos, exercícios em Archivo 40). É o princípio 2 ("o número é o protagonista") usado como enfeite que informa.

Se o Alex quiser algo mais ousado, a segunda opção é a **B**: é a que mais "brilha" em vitrine de loja e em vídeo. Nesse caso, a regra de uso do brilho tem que ir para `02-IDENTIDADE-VISUAL.md` antes do L começar.

## Tokens que mudariam (direção A)

Em `sistema-de-design/tokens.json`:

| Token | Hoje | Com a A |
|---|---|---|
| `cor.claro.*`, `cor.escuro.*` | neutros (cinza) | **os de `tokens-marca.json`**, nos mesmos nomes. É a troca principal. |
| `cor.*.plusTextoSobreFundo`, `plusSuave`, `marcaSuave` | não existem | adotados de `tokens-marca.json` |
| `cor.*.trilho` (novo) | — | `#DCE5E3` / `#2A3534`: trilho da barra de progresso e do anel |
| `cor.*.regua` (novo) | — | `rgba(19,29,28,.10)` / `rgba(231,241,240,.10)`: divisória dentro do cartão (decorativa, como `borda`) |
| `raio.cartao` (novo) | o cartão usa `grande` 16 | **20** |
| `raio.miniatura` (novo) | — | **14** (concêntrico: 20 − 6) |
| `sombra.2.claro` | `0 4px 12px rgba(0,0,0,.10)` | em camadas: `0 0 0 1px rgba(0,0,0,.05), 0 1px 1px -.5px …, 0 24px 24px -12px rgba(0,0,0,.05)` (6 camadas a 5 %) |
| `sombra.2.escuro` | `0 4px 12px rgba(0,0,0,.50)` | `0 0 0 1px rgba(255,255,255,.06), inset 0 1px 0 rgba(255,255,255,.05)`: contorno, não sombra |
| `imagem` (novo grupo) | — | `capa` 184 de altura; `miniatura` 56; `miniaturaAtual` 64; `miniaturaLista` 48 |
| `abas.pilulaAtiva` (novo) | — | 56 × 30, raio redondo, `marcaSuave` |
| `tipografia.familia` | pilha do sistema | Figtree e Archivo (`tokens-marca.json`); `familiaPorPeso` preenchido com o `exemploComAMarca` |

Com os dois empréstimos, entram também `sombra.atualEscuro` (`0 0 0 1.5px marca, 0 0 40px -4px rgba(107,211,194,.45)`) e, no topo do treino, o `numeroCarga` (40) usado como placar, sem tamanho novo.

O que mudaria **a mais** se a escolha fosse:
- **B:** `raio.botao` = redondo; `cor.*.superficieTingida` (`#132220`, só no escuro); `topo.faixa` = `marca` (claro) ou `marcaSuave` + brilho a 22 % (escuro); `numero` em peso 800.
- **C:** `tipografia.escala.tituloDestaque` 40/44 (32/38 abaixo de 390); `sombra` zerada nos cartões; `cor.*.regua` a 14 %; `imagem.tratamento` = duotone da marca; a faixa do cronômetro com fundo `texto`.

## Contraste medido

O próprio `comparativo.html` mede cada texto e cada ícone ao abrir. Ele usa a fórmula de luminância do WCAG 2 e o fundo real: compõe as camadas com transparência até achar um fundo opaco. No brilho do B, mede também contra o pico do brilho, que é o pior caso. Texto sobre gradiente de imagem conta como falha. Resultado em 10/10/2026, com o Chromium do Playwright:

| Direção | Claro | Escuro |
|---|---|---|
| A | 172 pares · menor 4,63:1 · **0 abaixo** | 172 pares · menor 5,92:1 · **0 abaixo** |
| B | 172 pares · menor 4,63:1 · **0 abaixo** | 172 pares · menor 5,19:1 · **0 abaixo** |
| C | 189 pares · menor 4,63:1 · **0 abaixo** | 189 pares · menor 5,92:1 · **0 abaixo** |

O menor valor do claro (4,63:1) é o nome da personal em `plusTextoSobreFundo` sobre `plusSuave`, como já previsto em `02-IDENTIDADE-VISUAL.md`.

Na primeira medição apareceram duas falhas reais no B, já corrigidas:
- **o "‹ Alunos" na cor da marca sobre a faixa da marca (1:1).** Agora o link é branco no claro e `texto` no escuro;
- **a barra de status, que o medidor lia sobre o fundo errado.** Agora a faixa pinta a barra também.

Ficam fora da medição: os marcadores roxos de efeito (anotação) e a `borda`/`regua`, que são decorativas por regra.

Conferido também: sem rolagem horizontal em 393 e em 2040 × 790; nenhum erro de script. A 2040 × 790, as 6 versões de cada tela ficam numa linha só (moldura a 74 %).

## Onde entram as imagens (agente J)

Os blocos com forma (banco, barra, anilha, prato) e o rótulo "Imagem J · …" marcam o lugar. Os quadrados listrados são miniaturas.
- **Capa do treino pronto, por objetivo:** 361 × 184 (A), 361 × 208 (B) ou 361 × 150 (C). Proporção perto de 2:1. A foto não leva texto por cima: o texto fica no corpo do cartão.
- **Miniatura de exercício:** 56 × 56 e 64 × 64 (o J entrega em 1× e 2×, ou seja, até 128 px).
- **Ilustração do plano alimentar:** 361 × 112 a 132, em traço, sem comida "permitida/proibida".
- **Na B**, a foto precisa ser escura (luz baixa). **Na C**, o app aplica o duotone: o J entrega a foto normal.

## Onde entram os efeitos (agente K)

Ligue "Efeitos" no comparativo. A numeração é a da legenda na página:

1. série marcada;
2. cartão afunda no toque;
3. anel do cronômetro;
4. troca de aba;
5. esqueleto com brilho;
6. puxar para atualizar e título grande que encolhe;
7. fechar treino;
8. refeição marcada.

O brilho dourado do convite ao Plus não aparece nestas telas: elas são de quem já assina.

## [decidir] do Alex

- **Qual direção: A, B ou C.** A recomendação é a A.
- **Se for A: entram os dois empréstimos?** São o halo no exercício atual no escuro e o placar no topo do treino.
- Ao aprovar, as decisões vão para `docs/decisoes.md` com critério, alternativa descartada e o que faria mudar. Este agente só escreve em `02-design/direcao-de-arte/`.
