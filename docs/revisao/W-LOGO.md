# W — Logo condizente de academia (P11, 11/10/2026)

O Alex pediu: "cria uma logo condizente de academia e prossiga". O ponto de partida foi o caminho A (o "+" com barra e anilhas). Antes de desenhar, olhei o símbolo atual em 16, 24, 48, 180 e 1024 e as seis referências, com atenção aos ícones das refs. 03 e 04. Os dois são o haltere de ícone genérico: duas anilhas em degrau de cada lado, verde-limão sobre preto.

**Comparativo:** `02-design/marca-e-proposta/logo/comparativo.html`. Abre por `file://` e tem botão de tema. Mostra:

- as três variações lado a lado, cada uma no claro, no escuro, como ícone e em 48, 24 e 16 px;
- a versão final;
- o tamanho real de 16 a 1024;
- o ícone no iPhone (máscara de superelipse, claro e escuro) e no Android (círculo e squircle, claro e escuro);
- os ícones das refs. 03 e 04 ao lado do nosso.

## As 3 variações

| | Desenho | Em 16 e 24 px | Veredito |
| --- | --- | --- | --- |
| **1 · Barra e mais, robusta** | "+" de quatro braços iguais com pontas redondas; o horizontal é a barra, com uma anilha de cada lado e a ponta para fora; o vertical é o traço mais grosso (160 contra 128) e o mais comprido (832 contra 384 das anilhas) | um "+" com dois blocos | **escolhida** |
| 2 · Anilha com o "+" vazado | disco com o sulco da borda e o furo do centro em "+" | "+" branco num círculo: farmácia, botão de adicionar | não |
| 3 · Monograma A+ com a barra | "A" pesado sem travessão; a barra com anilhas no lugar dele; o "+" no canto | o "+" some e sobra um "A" borrado | não |

Antes de fechar a 1, testei oito proporções dela (em `variacoes/` só ficou a final):

- **As anilhas nas pontas da barra**, encostadas no fim do braço, liam como "H" com um poste no meio. O "+" sumia.
- **A barra fina** (88) com o vertical grosso também não lia como "+".

O que funcionou foi a barra de verdade: braços iguais, as anilhas para dentro e a ponta da barra para fora. O desenho lê "+" primeiro e "barra" logo depois.

## A escolhida e por quê

A **variação 1**. O Alex pediu para criar; a escolha e a defesa são minhas:

1. **Lê nos tamanhos que importam.** Em 16 e 24 px é um "+" com blocos. Em 48 aparecem a barra e as anilhas, e em 180 e 1024, a ponta da barra para fora da anilha. A 2 vira cruz de farmácia em 16 px, e a 3 vira um "A".
2. **Diz "academia" e "a mais" num desenho só**, sem depender de letra.
3. **Não é ícone genérico de haltere.** O braço vertical é o que o 03-LOGO.md pedia para exagerar: sem ele sobra uma barra, nunca o haltere em degrau das refs. 03 e 04. No comparativo, os três ficam lado a lado.
4. **Continua o caminho A**, que já estava na abertura, na aba Plus e no selo de vidro das boas-vindas. Esses lugares mudaram de desenho, não de lugar.
5. **Quatro retângulos arredondados**, fáceis de animar (a abertura do mockup anima o mesmo `<symbol>`) e de levar para a grade 24.

## O que foi gerado

Todos os SVG do logo são escritos à mão, como geometria, em `logo/fonte/gerar.py`. A saída vem limpa: sem `transform`, sem texto vivo e em `currentColor`. O wordmark e o selo viram contorno a partir das fontes do app, com o kerning do GPOS. Os PNG saem do Chromium do Playwright (`logo/fonte/exportar-png.mjs`, com fundo transparente) e são conferidos por `logo/fonte/verificar-png.py`.

### PNG do app (`app/recursos/`)

| Arquivo | Tamanho | Bytes | Conferido |
| --- | --- | --- | --- |
| `icone.png` | 1024 × 1024, RGB (sem alfa) | 13 141 | fundo `#007761` até o canto, símbolo branco com 62,5 % do lado |
| `icone-adaptativo.png` | 1024 × 1024, RGBA | 10 965 | 92,4 % transparente; símbolo branco de 452 px; ponto mais longe a 226 px do centro (0,22 do lado), dentro do círculo seguro de 66 dp (313 px) |
| `icone-notificacao.png` | 96 × 96, RGBA | 1 145 | só branco, 71 % transparente, símbolo de 80 px |
| `abertura-simbolo-claro.png` | 1024 × 1024, RGBA | 12 456 | símbolo branco de 638 px, ponto mais longe a 319 px (o círculo de 2/3 vai a 341) |
| `abertura-simbolo-escuro.png` | 1024 × 1024, RGBA | 14 637 | o mesmo em `#39F0CD` |

### `app/app.json`

Mudou só `android.adaptiveIcon.backgroundColor`: era `#0B1313` e passou a `#007761`, a mesma cor do ícone do iOS e da abertura.

O resto já estava certo:

- a abertura: `#007761` no claro e `#0A332C` no escuro, com `imageWidth` 154, que dá o símbolo com 96 pt;
- a cor da notificação: `#007761`.

### Logo (`02-design/marca-e-proposta/logo/`)

| Arquivo | Bytes |
| --- | --- |
| `simbolo.svg` · `simbolo-escuro.svg` · `simbolo-mono.svg` | 472 · 485 · 490 |
| `wordmark.svg` · `wordmark-escuro.svg` · `wordmark-mono.svg` (Archivo ExtraBold em contorno, 1363 × 208) | 8 670 · 8 683 · 8 671 |
| `selo-plus.svg` (Figtree Bold em contorno) | 1 689 |
| `app/icone.svg`, `icone-adaptativo.svg`, `icone-notificacao.svg`, `abertura-simbolo-claro.svg`, `abertura-simbolo-escuro.svg` | 537 a 623 cada |
| `variacoes/v1-barra-mais-*`, `v2-anilha-*`, `v3-a-mais-*` (símbolo e ícone) | 489 a 862 cada |
| `comparativo.html` (gerado de `fonte/comparativo-modelo.html`) | 37 682 |
| `referencias/ref-03-icone.png`, `ref-04-icone.png` (recortes das refs., só para comparar) | 16 253 · 40 036 |
| `historico-p04/` (os caminhos A, B e C do P04 e o comparativo antigo, como estavam) | — |
| `fonte/gerar.py`, `fonte/exportar-png.mjs`, `fonte/verificar-png.py`, `fonte/comparativo-modelo.html` | — |

### Atualizados

- **`03-LOGO.md`**: reescrito com a escolhida, a geometria, as outras duas e por que não, os arquivos, os PNG do app, a grade 24, as regras e o histórico.
- **`tokens-marca.json` 1.2.0**: bloco novo `logo` (geometria, wordmark e artes do app). `$regras.logo` foi atualizado, com o contraste da abertura escura medido em 9,53:1. `tipografia.$regras.logo` passou a Archivo em contorno. As cores não mudaram.
- **Sprite** (`02-design/icones/fonte/gerar.py`, `mais_marca`): o `plus` foi refeito na grade 24.
  - Cheio: barra 3, braço 4, anilhas 3 × 9.
  - Contorno: anilhas vazadas, barra em três trechos e braço passando das anilhas na proporção do logo.
  - `python -I gerar.py` e `node embutir.mjs` foram rodados (86 símbolos nas três páginas). `00-LEIA-ME.md`, `CREDITOS.md`, `00-FONTES.md` e a galeria acompanham.
- **Mockups**:
  - em `entrada.html`, o `<symbol id="s-simbolo">` da abertura e do selo de vidro ficou com a geometria nova, `viewBox` `96 96 832 832`;
  - em `index.html`, um comentário;
  - a aba Plus nas três páginas vem do sprite embutido.

  Nenhum outro valor visual mudou.

## Conferência

- **Auditoria** (`node 02-design/sistema-de-design/auditoria/auditar.mjs`, todas as páginas e janelas, os dois temas e a fonte a 100 e a 160 %): **0 achados** (19 322 medições de pior pixel).
  - O comparativo novo passou por ela, com rolagem, escala de 4, escala tipográfica, contraste, alvo e os três caminhos na mesma disposição.
  - O 1024 em tamanho real fica numa faixa que rola de lado, então a página não rola de lado a 360 px.
- **PNG:** `python -I verificar-png.py` dá "ok" nos cinco. Confere tamanho, canal alfa (o iOS sem alfa, o resto com alfa), cor e área segura.
- **Olhado:**
  - as três variações em 16/24/48/180 (DSF 1, ampliado sem suavizar);
  - o comparativo a 1440 (claro) e a 360 (escuro);
  - a abertura do mockup;
  - a barra de abas da galeria, com o Plus contorno e cheio ao lado do Início;
  - os cinco PNG compostos sobre a cor de fundo do app.
- **Capturas do PDF:** refiz com `capturar.mjs` só as que mostram o logo ou o "+" da aba Plus (41): `logo-*` (5), `entrada-01` e `entrada-02` (claro e escuro), `icones-16px`, `icones-abas`, `comp-13-barra-abas`, `tela-*` (12), `aparelho-*` (3) e `novas-*` (14). Remontei o PDF com `montar.mjs`, sem aviso: 45 páginas.

## Para outros agentes ou para a junção (fora da minha pasta)

1. **`docs/decisoes.md`**: falta registrar a decisão. Texto proposto:

   > **11/10/2026 — Logo final: barra e mais (agente W, P11).** **Decidido**: a variação 1 de três (`logo/comparativo.html`), um "+" de braços iguais com a barra, uma anilha de cada lado e o braço vertical mais grosso e comprido; wordmark em Archivo ExtraBold em contorno; fundo do adaptativo `#007761`. **Por quê**: lê "+" em 16 px e "academia" em 48; não é o haltere em degrau das refs. 03 e 04; continua o caminho A. **Descartado**: anilha com "+" vazado (vira cruz de farmácia em 16 px); monograma A+ (vira "A" em 16 px e lembra nota escolar); as anilhas nas pontas da barra (lia "H"). **Mudaria se**: o Alex não gostar do desenho (o `gerar.py` refaz tudo e os PNG em um comando), ou se o teste no aparelho mostrar o símbolo pequeno demais no Android com máscara redonda (sobe o `ESC_ADAPTATIVO`, que tem folga até 0,6).

2. **`02-design/imagens/entrada/abertura-simbolo-claro.png` e `-escuro.png`** ainda têm o símbolo antigo, e os `CREDITOS-entrada.md` (em `02-design/imagens/` e em `app/imagens/`) descrevem "o símbolo do caminho A". Basta copiar os de `app/recursos/` e trocar a frase.
3. **`docs/apresentacao/partes/08-marca.html`**: a página "Três caminhos de logo" ainda tem o texto do P04 ("Nenhum é final", **decidir**). As capturas `logo-a/b/c-claro.png` agora mostram as variações 1, 2 e 3, que são da mesma família, e o `logo-selo-claro.png` mostra a versão final. O texto pode virar "o logo escolhido e as duas que ficaram de fora", com a tabela do `03-LOGO.md`.
4. **`02-design/marca-e-proposta/04-APLICACAO.md`**, linha 32, ainda fala dos "arquivos do caminho A em `logo/`". Eles foram para `logo/historico-p04/`, e os atuais são `logo/simbolo*.svg`. O `02-IDENTIDADE-VISUAL.md` não cita o logo.
5. **`app/recursos/LEIA-ME.md`** diz que os PNG "ainda não existem" e cita `abertura.png`. Hoje são os cinco acima.
6. **[decidir], sem pressa:** o ícone escuro próprio do iOS 18 (`ios.icon.dark`). O comparativo mostra a proposta: símbolo `#39F0CD` sobre `#0A332C`. Sem ele, o iOS escurece sozinho o `icone.png`.
