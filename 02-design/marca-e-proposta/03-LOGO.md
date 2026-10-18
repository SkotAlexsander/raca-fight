> **15/10/2026 (agente AL, P12): superado para a Raça Fight.** A cor do app passou a ser a da academia (vermelho `#C42024`, preto `#1C1C1C`/`#343434` e branco; `sistema-de-design/tokens.json` 2.0.0, medida em `sistema-de-design/raca-fight/`), e o logo é o da Raça Fight, por enquanto PROVISÓRIO (`logo-raca-fight/`). Este arquivo fica como o registro da marca "Academia Plus".

# 03 — Logo

> **11/10/2026 (agente W, P11):** o Alex pediu "uma logo condizente de academia". Desenhei três variações refinadas a partir do caminho A, escolhi uma e ela já está no app: ícone, abertura, aba Plus e mockups. O comparativo está em `logo/comparativo.html` (abre por `file://`, tem botão de tema). Os três caminhos do P04, de 10/10, estão guardados em `logo/historico-p04/`.

## A escolhida: barra e mais

Um sinal de **"+"** de quatro braços do mesmo comprimento, com as pontas redondas. O braço horizontal é a **barra de academia**: tem uma anilha de cada lado e a ponta da barra aparece para fora dela, como na barra de verdade. O braço vertical é o traço mais grosso e passa muito acima e abaixo das anilhas.

Geometria, na grade de 1024 (`logo/fonte/gerar.py`):

| Peça | x, y | Largura × altura | Raio |
| --- | --- | --- | --- |
| Barra (braço horizontal) | 96, 448 | 832 × 128 | 64 |
| Anilha esquerda | 200, 320 | 120 × 384 | 44 |
| Anilha direita | 704, 320 | 120 × 384 | 44 |
| Braço vertical | 432, 96 | 160 × 832 | 80 |

**Por que esta:**

- **Lê nos tamanhos que importam.** Em 16 e 24 px é um "+" com dois blocos. Em 48 aparecem a barra e as anilhas, e em 180 e 1024, a ponta da barra para fora da anilha.
- **Diz "academia" e "a mais" num desenho só**, sem depender de letra.
- **Não é o haltere genérico.** As refs. 03 e 04 mostram o ícone de sempre: duas anilhas em degrau de cada lado, e mais nada. Aqui o braço vertical é o traço mais grosso (160 contra 128 da barra) e mais comprido (832 contra 384 das anilhas). É o "exagerar o braço vertical" que este arquivo pedia desde o P04. Sem o braço vertical sobra uma barra, nunca aquele haltere.
- **Continua o caminho A**, que já estava na abertura, na aba Plus e no selo de vidro. Esses lugares mudaram de desenho, não de lugar.
- **Quatro retângulos arredondados**, fáceis de animar na abertura e de redesenhar na grade 24 dos ícones.

## As outras duas variações (e por que não)

**2 · Anilha com o "+" vazado.** É uma anilha de frente, com o sulco da borda e o furo do centro em forma de "+". O sulco é o que a faz parecer anilha, e não moeda ou botão. Redonda, ela é ótima de avatar. **Contra:** em 16 e 24 px o sulco some e sobra um "+" branco num círculo verde, que é o sinal de farmácia e o botão de "adicionar". É o mesmo problema do caminho B do P04, só que mais bem desenhado.

**3 · Monograma A+ com a barra.** É um "A" pesado sem travessão. No lugar do travessão vai a barra, com uma anilha para fora de cada perna, e o "+" fica no canto, como em "A+". Fica bonito em 48 px para cima. **Contra:** em 16 e 24 px o "+" some e sobra um "A" borrado. "A+" também lembra nota de escola, o que roça na regra de não avaliar a pessoa (`01-TOM-DE-VOZ.md`). Pode servir de monograma num uso especial, mas não como símbolo do app.

| | 1 · Barra e mais | 2 · Anilha | 3 · A+ |
| --- | --- | --- | --- |
| Lê em 16 px | sim, um "+" com blocos | sim, mas como farmácia | não (vira "A") |
| Diz "academia" | sim (barra e anilhas) | sim (anilha) | sim (barra), só grande |
| Guarda o "+" | sim, é o desenho | sim, vazado | sim, pequeno no canto |
| Risco | lembrar halter, resolvido pelo braço vertical | cruz de farmácia | nota escolar, letra solta |
| Escolha | **esta** | não | não |

## Os arquivos

Tudo é gerado por `logo/fonte/gerar.py`. **Não edite os `.svg` à mão.** Edite o script e rode `python -I gerar.py`; depois rode `node exportar-png.mjs` e `python -I verificar-png.py`, os três dentro de `logo/fonte/`.

| Arquivo | O que é |
| --- | --- |
| `logo/simbolo.svg` | o símbolo em `currentColor`, com `#007761` de padrão |
| `logo/simbolo-escuro.svg` | o mesmo em `#39F0CD` |
| `logo/simbolo-mono.svg` | uma cor só, herda a cor do texto (carimbo, bordado, impressão) |
| `logo/wordmark.svg` · `-escuro` · `-mono` | o símbolo e "Academia Plus" em **Archivo ExtraBold (800) convertida em contorno** |
| `logo/selo-plus.svg` | a pílula dourada com a palavra "Plus" (Figtree Bold em contorno) |
| `logo/app/*.svg` | as artes que viram os PNG do app |
| `logo/variacoes/` | as 3 variações (símbolo e ícone) |
| `logo/comparativo.html` | o comparativo (gerado a partir de `fonte/comparativo-modelo.html`) |
| `logo/referencias/` | os ícones recortados das refs. 03 e 04, só para comparar |
| `logo/historico-p04/` | os caminhos A, B e C do P04, como estavam |

**Wordmark em Archivo, não Figtree.** O P11 pede Archivo, a letra de placar que o app já usa nos números grandes, e ela casa com o peso do símbolo. A Figtree continua sendo a letra da interface. O texto já é contorno: nenhum SVG do logo depende de fonte instalada, e o script aplica o kerning da própria fonte.

**Cores** (tokens-marca.json 1.2.0, iguais às do `tokens.json` 1.8.0):

| | Claro | Escuro |
| --- | --- | --- |
| Símbolo e "Plus" do wordmark | `#007761` (5,51:1 sobre branco) | `#39F0CD` (13,61:1 sobre `#070C0C`) |
| "Academia" | `#131D1C` | `#E9F2F1` |
| Selo Plus | `#EAB444` com `#3A2B0D` | `#F8C153` com `#2F2207` |

O **"+" do logo nunca é dourado.** O dourado é só da palavra Plus no selo, e os dois nunca se encostam.

## No app (`app/recursos/`)

| PNG | Tamanho | Como é |
| --- | --- | --- |
| `icone.png` | 1024, **sem canal alfa** | fundo `#007761` cheio e o símbolo branco com 62,5 % do lado. O iOS aplica a própria máscara, por isso a arte é quadrada, sem arredondar. |
| `icone-adaptativo.png` | 1024, transparente | só o símbolo branco, com 44 % do lado. A máscara do Android mostra os 72 dp do meio da camada de 108, então o símbolo aparece com 66 % do ícone. O ponto mais longe fica a 0,22 do lado, e o círculo seguro de 66 dp vai até 0,306. A cor de fundo, `#007761`, está no `app.json` (`android.adaptiveIcon.backgroundColor`). |
| `icone-notificacao.png` | 96, transparente | o símbolo branco em 80 px. O Android pinta com a `color` do plugin `expo-notifications` (`#007761`). |
| `abertura-simbolo-claro.png` | 1024, transparente | o símbolo branco com 637 px de largura, dentro do círculo de 2/3 que o Android 12+ mostra. O fundo `#007761` vem do `app.json`. |
| `abertura-simbolo-escuro.png` | 1024, transparente | o mesmo em `#39F0CD`, sobre `#0A332C` (9,53:1). |

O `imageWidth: 154` do `expo-splash-screen` continua certo: 154 × 637 / 1024 dá o símbolo com 96 pt de largura.

**Ícone do iPhone no modo escuro (iOS 18):** o comparativo mostra a proposta, que é o símbolo `#39F0CD` sobre `#0A332C`, como a abertura no escuro. Hoje o iOS escurece sozinho o `icone.png`. Se quiser o ícone escuro próprio, é uma arte a mais (`ios.icon.dark` no `app.json`). **[decidir]**, sem pressa.

## Na grade 24 (aba Plus)

O ícone `plus` do sprite (`02-design/icones/fonte/gerar.py`, função `mais_marca`) é este símbolo redesenhado:

- **cheio** (aba ativa): as quatro formas em escala (barra 3, braço 4, anilha 3 × 9);
- **contorno**: as anilhas vazadas, a barra em três trechos para não cruzar o vão da anilha e o braço em traço de 2,25.

O braço passa da anilha na mesma proporção do logo. O haltere da aba Início, com duas anilhas em degrau e sem braço vertical, continua diferente dele a 16 px.

## Regras

- **Área de respiro:** em volta do símbolo, metade da altura dele; em volta do wordmark, a altura do "A".
- **Tamanho mínimo:** símbolo com 16 px na tela e 8 mm impresso; wordmark com 120 px de largura na tela e 30 mm impresso. Abaixo disso, só o símbolo.
- **Sobre foto:** nunca direto. Vai numa faixa de `fundo` ou `superficie`, em branco sobre uma faixa de `marca`, ou numa pílula de vidro (componente 20) com o contraste medido no pior pixel, como no selo das boas-vindas.
- **Não fazer:** esticar, girar, contornar, pôr sombra ou gradiente, trocar a cor por qualquer uma que não seja marca, branco ou preto, escrever "Academia" e "Plus" em letras diferentes, ou pôr o selo dourado colado no logo.
- **Com o nome da academia** (co-branding, `05-WHITE-LABEL.md`): o logo da academia à esquerda, uma linha vertical `borda` e o Academia Plus à direita, os dois com a mesma altura de caixa.

## Histórico

- **10/10/2026 (P04):** três caminhos para o Alex escolher: A barra e mais (recomendado), B anilha e C A+. O caminho A entrou no protótipo como provisório. Os arquivos estão em `logo/historico-p04/`.
- **10/10/2026 (agente Q):** o caminho A passou para as cores 1.6.0 (`#007761` / `#39F0CD`).
- **11/10/2026 (agente W, P11):** o Alex pediu um logo "condizente de academia" e disse "pode prosseguir". O caminho A foi refeito como variação 1 e escolhido entre três. As mudanças: braços iguais com o vertical mais grosso, anilhas no lugar das pontas, a ponta da barra para fora e o wordmark em Archivo convertido em contorno. Os PNG do app, o sprite e os mockups foram atualizados.
