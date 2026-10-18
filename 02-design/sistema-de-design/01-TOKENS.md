> **2.0.0 (15/10/2026, agente AL, P12): marca da Raça Fight.** Os valores de cor deste documento são os da 1.8.0 (o verde do Academia Plus) e ficam como histórico. Os valores que valem estão em `tokens.json` 2.0.0: vermelho `#C42024` (viva nos dois temas; marca no claro), vermelho claro `#FF6B6B` (marca, progresso e foco no escuro, porque o vermelho cru dá 2,90:1 sobre `#1C1C1C`), preto `#1C1C1C`, grafite `#343434`, fundo `#F5F5F5` / `#141414`. A medida de cada par está em `raca-fight/paleta.mjs` → `raca-fight/contraste.json`; o tokens.json antigo inteiro, em `historico/tokens-1.8.0-academia-plus.json`. Os nomes dos papéis e toda a escala (tipo, espaço, toque, movimento) não mudaram.

# 01 — Tokens

O que este arquivo é: a explicação de cada grupo do `tokens.json` — para que serve, como se usa e o que a marca ainda vai preencher. O `tokens.json` é a fonte; este texto é o manual.

## 1.8.0 — proporção planejada (10/10/2026, agente Q, regra do Alex)

O Alex reprovou a proporção da 1.6.0: números e botões grandes demais, "foge muito da proposta de ser algo de proporção bem planejada". O erro era aplicar "número grande / alvo grande" em tudo; a tela ficava com cara de zoom e sem hierarquia. A regra nova substitui a do P09 ("alvos 48/56/64 e números enormes"):

- **Escala tipográfica fechada** (`tipografia.$escala`): base 16, razão 1,25 → **13 · 16 · 20 · 25 · 31 · 39 · 49 · 61**. Nenhum `font-size` fora dela, no `tokens.json` e no CSS das três páginas. A auditoria reprova o que sair.
- **Papéis**: legenda 13 · corpo 16 · subtítulo 20 (`titulo3`) · título de tela 25 (`titulo2`; o título grande do iOS vai a 31, `titulo1`) · número da linha de série 20 (`numeroSerie`) · valor sendo editado 25 (`numeroCarga`, `numeroMedio`) · número herói 49 (`numeroDestaque`, `numeroCronometro`) · **61 é o máximo do app**, só no modo treino (`numeroGigante`, era 112) e no Cronômetro (`numeroCronometroTela`, era 96).
- **Um herói por tela**: no máximo um texto ≥ 49 visível. Número e unidade em no máximo 2,5 : 1 (61 com unidade 25; 49 com unidade 20), na mesma linha de base.
- **Tamanho visual ≠ área de toque**: grupo novo `controle` com o desenho (primário 48 com texto 16, secundário 40, ícone 40, marcar série 40, +/− 36, chip 32, máximo 56); `alvo.minimo` 48 vira só a **área de toque**, por área invisível (hitSlop no app, `::before` no mockup). `alvo.confortavel` e `alvo.grande` saíram. A auditoria reprova alvo efetivo abaixo de 44 e desenho interativo acima de 56 (menos linhas de lista, cartões, abas e campos).
- **Proporção entre peças**: botão com altura de 2,5× a 3× o texto; ícone no botão com 0,5× a 0,6× a altura; foto herói em no máximo 45 % da altura útil (`imagem.heroi` 440 → 340); cartões na grade de 8 (preenchimento 16, vão 12 ou 16).
- **Barra de abas** 64 → 56 + área segura (ícones de 24); **deslizar** 64 → 56 (botão 48); **+ central** 56 → 48.

## 1.7.0 — a junção do P09 (10/10/2026, agente Q)

As variáveis locais da entrada (`--o-`), das telas novas (`--p-`) e das ilustrações (`--r-`) viraram tokens: `raio.campo`; `tipografia.escala.tituloEntrada`, `numeroDestaque` e `legendaGrafico`; os grupos `abertura`, `porta`, `codigo`, `contaSocial`, `ilustracao`, `grafico`, `mapa`, `aviso`, `comemoracao`, `descanso` e `telas`; `foto.entrada` e `foto.desfoqueDescanso`; `vidro.*.selecionado` e `vidro.escuroFixo` (a variante "vidro escuro" do componente 20); `icone.traco` 2 → 2,25 (o traço do logo). A barra de abas encostada vale nas três páginas.

## 1.6.0 — a linguagem das referências (10/10/2026, agente N, P09)

O que mudou, em uma lista (valores no `tokens.json`; contrastes em `cor.$contraste` e no relatório `docs/revisao/N-SISTEMA.md`):

- **Verde vivo**: `cor.*.viva` `#39F0CD` (oklch 86 % 0,15 176, verde-água luminoso; não é verde-limão), igual nos dois temas, sempre com `vivaTexto` `#00221A` por cima (11,67:1). É a cor de **preenchimento**: botão primário, "marcar série", chip selecionado, deslizar, mostrador em trabalho, + central. No claro ela não é texto nem traço sobre branco (1,45:1): ali o texto, o link, a aba ativa e o anel usam `marca`, que ficou mais viva (`#006B5F` → `#007761`, 5,51:1 sobre branco). No escuro `marca` = `viva`. `progresso` é a cor do traço de progresso sobre superfície (claro `marca`, escuro `viva`).
- **Escuro quase preto**: `fundo` `#070C0C`, `superficie` `#121A19`, `superficieElevada` `#1B2423`, `texto` `#E9F2F1`, `textoSecundario` `#A3B1B0`. **Claro**: `textoSecundario` `#4A5958` (6,86:1, mais firme que `#556463`).
- **`vidro`** (componente 20): desfoque 24, saturação 1,6, borda 1; por tema `fundo`, `borda`, `brilhoTopo`, `sombra`, `texto`, `textoSecundario`, `destaque`, `solido` (transparência reduzida) e `camadaContraste`; `vidro.barra` para a barra de abas e a faixa do descanso.
- **`foto`** (componente 19): `escurecer` 0,72, `saturacao` 0,9, `gradiente`, `gradienteCapa`, `luzLateral`, `texto`, `textoSecundario`, `fundoSemFoto`.
- **Raio**: `cartao` 20 → 24, `miniatura` 14 → 16, `folha` 24 → 28; novos `capa` 28, `vidro` 24, `botao` 999 (todo botão vira pílula) e `pilula` 999.
- **Tipografia**: `numeroGigante` 112/112, Archivo 800 (96 no celular pequeno; não cresce com a fonte do sistema).
- **Sombra**: `sombra.viva` (o brilho do verde no escuro; sombra verde curta no claro), uma vez por tela.
- **Novos grupos pequenos**: `imagem.heroi` 440, `imagem.capaFoto` 240, `imagem.capaGrade` 208; `deslizar` (64, 56, limiar 0,85); `anel` (44, traço 4, 72); `abas.mais` (56, `viva`; [decidir]).

## Como ler

- Nome no JSON em camelCase (`textoSecundario`). Nome na variável CSS em kebab com prefixo do grupo (`--cor-texto-secundario`). No código do app (React Native), o objeto é importado do JSON e acessado como `tokens.cor.claro.textoSecundario` ou pelo tema ativo.
- Nenhum valor numérico fora da escala. Se um componente "precisa" de 14 px de espaço, ele usa 12 ou 16.
- Cor e fonte **da marca** desde a 1.5.0 (10/10/2026): `tokens.json` tem os valores de `02-design/marca-e-proposta/tokens-marca.json`, aplicados na direção de arte A (recomendada; [decidir] do Alex). As tabelas de "valor neutro" abaixo ficam como registro do que havia antes e do contraste mínimo que qualquer marca precisa passar. Os valores em vigor estão no `tokens.json` e em `mockups/sistema.css`.

## Cor — papéis semânticos

Os componentes nunca falam em "cinza-800": falam em papel. Dez papéis são o **contrato com a marca**; os outros são derivados.

### Os 10 papéis obrigatórios (a marca preenche)

| Papel | Para que serve | Regra de contraste |
|---|---|---|
| `fundo` | fundo da tela | — |
| `superficie` | cartões, linhas, campos, barras | — |
| `texto` | texto principal, número de carga, ícone principal | ≥ 4,5:1 sobre `fundo` e `superficie` |
| `textoSecundario` | legenda, rótulo, texto de apoio, ícone inativo | ≥ 4,5:1 sobre `fundo` e `superficie` |
| `marca` | botão primário, aba ativa, link, progresso, foco | ≥ 3:1 sobre `fundo` (é usada como ícone/borda) |
| `marcaTexto` | texto e ícone em cima de `marca` | ≥ 4,5:1 sobre `marca` |
| `sucesso` | série feita, treino concluído, pagamento em dia | ≥ 3:1 sobre `superficie`; com texto em cima, usar `sucessoTexto` |
| `atencao` | aviso, Plus a vencer, descanso acabando | idem |
| `erro` | erro de campo, botão de perigo, falha | idem |
| `plus` | **tudo que é do plano pago**: selo Plus, borda do cartão de dieta, aba do personal, convite ao Plus | ≥ 3:1 sobre `fundo` e `superficie`; com texto em cima, usar `plusTexto` |

### Derivados (a marca pode preencher ou herdar)

| Papel | Para que serve | Valor neutro |
|---|---|---|
| `superficieElevada` | folha inferior, menu, toast — um degrau acima de `superficie` | claro: igual a `superficie` + sombra; escuro: tom mais claro |
| `borda` | divisor entre linhas, contorno fraco de cartão | decorativo, não precisa de 3:1 |
| `sucessoTexto`, `atencaoTexto`, `erroTexto`, `plusTexto` | texto em cima da cor de estado cheia | ≥ 4,5:1 sobre a cor correspondente |
| `foco` | anel de foco de teclado/leitor de tela | ≥ 3:1 sobre `fundo` |
| `sobreposicao` | escurecimento atrás da folha inferior | preto com opacidade |
| `desabilitadoOpacidade` | opacidade de componente desabilitado | 0,4 |

### Contraste dos valores neutros (conferido em 10/10/2026)

| Par | Claro | Escuro | Mínimo |
|---|---|---|---|
| `texto` / `fundo` | 16,1 | 17,3 | 4,5 |
| `texto` / `superficie` | 17,7 | 15,5 | 4,5 |
| `textoSecundario` / `superficie` | 7,7 | 6,6 | 4,5 |
| `marcaTexto` / `marca` | 17,7 | 17,3 | 4,5 |
| `sucesso` / `superficie` | 5,4 | 7,9 | 3,0 |
| `atencao` / `superficie` | 5,9 | 8,6 | 3,0 |
| `erro` / `superficie` | 6,5 | 7,1 | 3,0 |
| `plus` / `superficie` | 8,8 | 10,3 | 3,0 |
| `sucessoTexto` / `sucesso` | 5,4 | 7,2 | 4,5 |
| `atencaoTexto` / `atencao` | 5,9 | 8,3 | 4,5 |
| `erroTexto` / `erro` | 6,5 | 7,2 | 4,5 |
| `plusTexto` / `plus` | 8,8 | 11,6 | 4,5 |

A marca precisa manter a tabela acima verde depois de trocar os valores. O `sucesso`/`atencao`/`erro` claros são escuros de propósito: cor de estado que fica clara demais em fundo branco falha o 3:1 (é o erro mais comum).

### Regras de uso de cor

1. **Estado nunca é só cor.** Série feita tem cor + ícone de check. Plus tem cor + a palavra "Plus".
2. `marca` aparece em **uma** coisa por tela como ação principal (o botão primário). Duas ações primárias na mesma tela é erro de design.
3. `plus` **não é cor decorativa**: só aparece quando o elemento é do plano pago. Isso ensina o aluno a reconhecer o que o Plus libera.
4. `erro` em botão só para ação destrutiva (apagar, encerrar, cancelar assinatura).
5. Campo de formulário usa `textoSecundario` no contorno (não `borda`), porque contorno de campo precisa de 3:1.

## Espaço

Escala de 4 em 4: `0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`. Chaves do JSON são o múltiplo (`espaco.4` = 16 px).

| Uso | Token |
|---|---|
| Entre ícone e texto no mesmo botão | `espaco.2` (8) |
| Padding interno de cartão | `espaco.4` (16) |
| Entre cartões de uma lista | `espaco.3` (12) |
| Margem lateral da tela | `layout.margemLateral` (16); 20 no celular grande |
| Entre seções de uma tela | `espaco.6` (24) |
| Entre o último elemento e a barra de abas | `espaco.8` (32) + área segura |
| Entre dois alvos de toque vizinhos | `alvo.espacoEntreAlvos` (8), mínimo |

## Raio

| Token | Valor | Onde |
|---|---|---|
| `raio.pequeno` | 8 | selo, chip, campo pequeno, toast |
| `raio.medio` | 12 | botão, campo, linha de série |
| `raio.grande` | 16 | cartão |
| `raio.folha` | 24 | cantos de cima da folha inferior |
| `raio.redondo` | 999 | avatar, botão circular (+/−), indicador |

## Alvo de toque

| Token | Valor | Onde |
|---|---|---|
| `alvo.minimo` | 48 | a **área de toque** de qualquer coisa tocável (44 pt é o piso no iOS e na auditoria) |
| `controle.primario` | 48 | botão primário (texto 16) |
| `controle.secundario` | 40 | botão secundário, botão de texto |
| `controle.icone` | 40 | botão só com ícone (voltar, menu, fechar) |
| `controle.marcarSerie` | 40 | o "marcar" da linha de série |
| `controle.passo` | 36 | o + e o − do campo numérico |
| `controle.chip` | 32 | chip de filtro e de escolha |
| `controle.maximo` | 56 | nada interativo passa disto (o pausar do Cronômetro, a barra de abas, o deslizar) |

A área de toque é **maior que o desenho** quando ele tem menos de 48: no app, `hitSlop` no `Pressable` (por exemplo, `hitSlop={6}` num botão de 36); no mockup, um `::before` transparente de 48 × 48 centrado. *(Até a 1.7.0, `alvo.confortavel` 56 e `alvo.grande` 64 eram o próprio desenho do marcar série, do +/− e do botão grande; saíram na 1.8.0.)*

## Tipografia

Uma família para interface, uma para número grande (podem ser a mesma). A pilha do sistema é o valor neutro. **A família de número precisa de algarismos tabulares** (`font-variant-numeric: tabular-nums`) para o cronômetro e a carga não "dançarem" ao mudar de 9 para 10.

| Estilo | Tamanho / linha / peso | Onde |
|---|---|---|
Escala fechada da 1.8.0 (13 · 16 · 20 · 25 · 31 · 39 · 49 · 61):

| Estilo | Tamanho / linha / peso | Onde |
|---|---|---|
| `numeroGigante` | 61 / 61 / 800 | as repetições do exercício atual no modo treino (o herói; era 112) |
| `numeroCronometroTela` | 61 / 68 / 700 | o mostrador da tela Cronômetro (era 96) |
| `numeroCronometro` | 49 / 56 / 700 | o descanso em destaque |
| `numeroDestaque` | 49 / 52 / 800 | o número herói de uma tela ("60 kg", "214") |
| `tituloEntrada` | 39 / 44 / 700 | o título das boas-vindas (o herói daquela tela) |
| `titulo1` | 31 / 38 / 700 | título grande (o "large title" do iOS) |
| `titulo2` | 25 / 30 / 600 | título de tela, nome do exercício em execução |
| `numeroCarga` | 25 / 30 / 700 | carga e repetição **sendo editadas** no campo +/− |
| `numeroMedio` | 25 / 30 / 700 | números em cartão (peso do aluno, séries feitas) |
| `titulo3` | 20 / 26 / 600 | subtítulo, título de cartão |
| `numeroSerie` | 20 / 24 / 700 | o número da linha de série (feita ou por fazer) |
| `corpo` | 16 / 24 / 400 | texto corrente, item de lista, valor de campo |
| `corpoForte` | 16 / 24 / 600 | rótulo de botão, nome em lista |
| `corpoPequeno` | 13 / 18 / 400 | texto de apoio em cartão, descrição |
| `legenda` | 13 / 16 / 500 | rótulo acima do campo, unidade ("kg", "seg"), data |
| `rotuloAba` | 13 / 16 / 600 | texto da barra de abas |
| `legendaGrafico` | 13 / 16 / 400 | rótulo de eixo |

**Família por peso** (`tipografia.familiaPorPeso`, 10/10/2026): no iPhone, cada peso de uma fonte carregada é uma família própria, chamada pelo nome do arquivo. `fontWeight: 600` sobre "Figtree" **não** vira o SemiBold no iOS. Quem implementa traduz o peso de cada estilo da escala para o nome do arquivo e não passa `fontWeight`: com a marca, `corpoForte` (600) → `Figtree-SemiBold`, `numeroCarga` (700) → `Archivo-Bold`. Com a pilha do sistema (os valores neutros), o mapa fica nulo e o `fontWeight` funciona. O exemplo completo está em `exemploComAMarca`.

Regras:
- **Nada abaixo de 13 px** (o menor degrau da escala). Campo de texto nunca abaixo de 16 px (evita o zoom automático no iOS).
- Tamanho de fonte em **unidade escalável** (`sp` no Android, Dynamic Type no iOS, `rem` na web). Ver `05-ACESSIBILIDADE.md` para o que acontece quando o usuário aumenta a fonte.
- Número grande com `espacamento` negativo só nos pesos 700; corpo com 0.

Tokens que vieram da medição de responsividade (10/10/2026, `auditoria/auditar.mjs`):

| Token | Valor | Para quê |
|---|---|---|
| `escalaCelularPequeno` | `numeroCronometro` 56/64 · `numeroCronometroTela` 80/88 · `numeroCarga` 32/40 · `titulo1` 24/30 | os únicos tamanhos que mudam abaixo de 390 de largura (antes só existiam na tabela do `03-NAVEGACAO-E-LAYOUT.md`) |
| `tetoAmpliacao` | cronômetro até 72 px · mostrador do Cronômetro fica em 96 (já é o teto) · carga até 1,5 × · `rotuloAba` até 1,3 × | até onde cada texto cresce com a fonte do sistema; a altura de linha cresce na mesma proporção |
| `fonteAmpliada` | `ampliada` 1,3 · `maxima` 1,6 | as faixas da fonte do sistema em que o layout muda (ver `03-NAVEGACAO-E-LAYOUT.md`) |

Por que `rotuloAba` tem teto: na barra de 5 abas de um celular de 360 cada aba tem 72 px; "Academia" em 12 × 1,6 = 19,2 px quase não cabe e encosta em "Perfil". Com o teto de 1,3 × cabe com folga. É o mesmo que o iOS faz na barra de abas (o rótulo não acompanha a fonte inteira; o toque longo mostra em tamanho grande).

## Sombra

Três níveis. No tema escuro a sombra pesa menos e a elevação é dada por `superficieElevada`.

| Token | Onde |
|---|---|
| `sombra.1` | cartão em repouso |
| `sombra.2` | cartão pressionado, botão flutuante, toast |
| `sombra.3` | folha inferior |

## Borda

`fina` 1 px (divisor), `media` 2 px (contorno de campo, cartão selecionado), `foco` 3 px (anel de foco, por fora do elemento, com `foco`).

## Vibração

`vibracao` diz qual retorno tátil cada momento usa, pelo nome do sistema (`expo-haptics`). Desligável em Perfil.

| Token | Valor | Quando |
|---|---|---|
| `marcarSerie` | impacto leve | marcar série feita |
| `desfazerSerie` | seleção | desfazer a série |
| `concluirTreino` | impacto médio | confirmar "Concluir treino" |
| `fimDescanso` | notificação de sucesso | fim do descanso com o app aberto. No Android a vibração longa; no iPhone o padrão de notificação, porque o iPhone não faz vibração longa por API pública (componente 7) |
| `ultimosSegundosDescanso` | impacto leve | aos 3, 2 e 1 s (do descanso e de cada fase do intervalado) |
| `trocaDeFase` | impacto médio | troca de fase do intervalado (trabalho ↔ descanso), com o app aberto (componente 18) |
| `erroAoSalvar` | notificação de erro | falha ao salvar |

## Cronômetro

`cronometro.fase` diz a cor do mostrador do Cronômetro (componente 18) em cada fase, sempre por papel: trabalho `marca`/`marcaTexto`, descanso e terminado `sucesso`/`sucessoTexto`, preparação e pausado `superficie`. `barraDaFase` 8 e `rodada` 8 com vão 4 são as duas barras do mostrador; `acabandoSegundos` 10 e `ultimosSegundosVibracao` 3 repetem as constantes de `app/dominio/cronometro.ts`.

## Folha inferior

`folha.media` 0,5 e `folha.grande` 1 (a tela menos a área segura do topo e `folgaTopoGrande` 8): as duas alturas da folha que pode crescer. A folha curta usa a altura do conteúdo. `folha.alca` 32 × 4 a 8 do topo é a alça desenhada pelo app; no iPhone a folha nativa usa a do sistema.

## Duração e curva

| Token | ms | Onde |
|---|---|---|
| `duracao.rapida` | 120 | pressionar botão, trocar estado de chip, marcar série |
| `duracao.media` | 200 | abrir/fechar folha inferior, trocar aba, entrar toast |
| `duracao.lenta` | 320 | transição de tela, aparecer/sumir de lista |
| `duracao.toast` | 5000 | toast com "desfazer" fica visível |

Curva padrão `cubic-bezier(0.2, 0, 0, 1)` (acelera pouco, desacelera bem). Com `prefers-reduced-motion`, todo efeito vira um esmaecer de 160 ms (`movimento.reduzido`), não 0; o progresso do cronômetro salta por segundo sem transição. Os efeitos e as molas estão em `movimento/00-CATALOGO.md`.

## Layout

| Token | Valor |
|---|---|
| `margemLateral` | 16 (20 em celular ≥ 430) |
| `larguraMaximaConteudo` | 600 (em tablet, o conteúdo centraliza — v2) |
| `alturaCabecalho` | 56 + área segura do topo |
| `alturaBarraAbas` | 64 + área segura da base |
| `alturaLinhaPadrao` | 72 (visão do aluno) |
| `alturaLinhaCompacta` | 56 (visão da academia, listas densas) |
| `pontosDeCorte` | 360 / 390 / 430 / 768 |
| `colunaCelularMedio` | 358 (= 390 − 2 × 16): abaixo disso valem os tamanhos de `escalaCelularPequeno` |
| `larguraMinimaColunaCartao` | 150: a grade de 2 cartões vira 1 coluna abaixo disso |
| `larguraMinimaCartaoNumero` | 104 (6,5 rem, cresce com a fonte): a linha de 3 cartões de número quebra abaixo disso |
| `aparelhos` | os 4 iPhones de referência e o Android 390, com tela e área segura (topo/base) de cada um; tabela em `03-NAVEGACAO-E-LAYOUT.md` › Área segura |

`aparelhos` (10/10/2026): iPhone SE 3ª geração 375 × 667 (20/0, botão Início), iPhone 13 mini 375 × 812 (50/34, notch), iPhone 16 393 × 852 (59/34, Dynamic Island), iPhone 16 Pro Max 440 × 956 (**62**/34, Dynamic Island) e Android 390 × 844 (54/24). O topo do 16 Pro Max é 62, não 59: a Dynamic Island dos Pro de 2024 desceu (fonte: useyourloaf.com, "iPhone 16 Screen Sizes"). No app esses números vêm do sistema; aqui servem ao mockup e à auditoria.

## Moldura (só do mockup)

`moldura` descreve o celular desenhado em volta das 4 telas-chave do mockup: a **tela** tem 390 × 844 (o celular médio de referência) e a borda de 12 fica por fora (o aparelho inteiro tem 414 × 868). Antes a borda ficava por dentro e a tela tinha 366 × 820, o que mostrava o app mais estreito do que qualquer celular de referência. Em janela estreita, ou deitada e baixa (o ultrawide de 2040 × 790), a moldura inteira encolhe por zoom até `zoomMinimo` 0,5, para caber sem rolagem; o conteúdo continua diagramado em 390.

Com o **seletor de aparelho** do mockup (iPhone SE · iPhone 16 · iPhone 16 Pro Max · Android 390; o 13 mini pela URL, `?aparelho=iphone-13-mini`), a tela e os insets passam a ser os do aparelho escolhido (`layout.aparelhos`) e o topo ganha o desenho dele (`moldura.recortes`): Dynamic Island, notch ou furo da câmera, com a barra de status do sistema (hora à esquerda; sinal, Wi-Fi e bateria à direita; no SE, hora no centro). Na base, o indicador de início fica a 8 da borda, dentro do inset, e a barra de abas termina acima dele. O SE ganha o queixo com o botão Início e não tem indicador. O padrão, sem escolha, continua o Android 390 (é o que o PDF captura com `?moldura=real`).

## Ícone

24 px no corpo, 16 em selo e legenda, 32 em estado vazio e cabeçalho de cartão grande. Traço de 2 px. **A marca define o conjunto de ícones** (traço ou preenchido); o sistema só fixa tamanho e traço.

## O que a marca precisa definir

Lista exata do que `tokens-marca.json` deve trazer para substituir os valores neutros:

1. `cor.claro` e `cor.escuro` para os 10 papéis: `fundo`, `superficie`, `texto`, `textoSecundario`, `marca`, `marcaTexto`, `sucesso`, `atencao`, `erro`, `plus`.
2. Opcionalmente os derivados: `superficieElevada`, `borda`, `sucessoTexto`, `atencaoTexto`, `erroTexto`, `plusTexto`, `foco`, `sobreposicao`.
3. `tipografia.familia.interface` e `tipografia.familia.numero` (fonte livre, com link e licença), confirmando que a de número tem algarismos tabulares.
4. Conjunto de ícones (biblioteca ou direção) com traço compatível com 2 px.
5. Confirmação de que a tabela de contraste acima continua passando com os novos valores. Se um valor falhar, o sistema não muda a regra: a marca ajusta o tom.
