> **15/10/2026 (agente AL, P12): superado para a Raça Fight.** A cor do app passou a ser a da academia (vermelho `#C42024`, preto `#1C1C1C`/`#343434` e branco; `sistema-de-design/tokens.json` 2.0.0, medida em `sistema-de-design/raca-fight/`), e o logo é o da Raça Fight, por enquanto PROVISÓRIO (`logo-raca-fight/`). Este arquivo fica como o registro da marca "Academia Plus".

# 02 — Identidade visual

> Como o Academia Plus se parece. Os valores finais estão em `tokens-marca.json`; este arquivo explica o porquê e as regras de uso. Contrastes medidos em 10/10/2026 (WCAG 2.x, fórmula de luminância relativa).

## A direção em um parágrafo

**A lousa da sala.** Toda academia tem um quadro branco onde o instrutor escreve o treino com caneta, e um caderno de carga que o aluno carrega. O Academia Plus é a versão de bolso dessas duas coisas: fundo limpo, texto preto e firme, número grande que se lê de longe, uma cor só para o que é da casa. Nada de neon, nada de preto com raio vermelho, nada de foto de abdômen. A referência de sensação é o **ferro e a borracha da sala** (sóbrios, pesados, confiáveis) com a **clareza do quadro branco**.

Referências descritas, não copiadas: a tipografia grande e sem enfeite de um placar de ginásio; a cor verde-escura dos azulejos de piscina antiga e das mesas de bilhar (uma cor "de lugar", não "de tecnologia"); o dourado fosco de uma medalha de participação, não de uma medalha de ouro: é o tom do Plus, que é "a mais", não "o melhor".

## Paleta

### Cor de marca: verde-profundo

`#007761` no claro, `#39F0CD` no escuro (desde 10/10/2026, tokens 1.6.0: o "verde da marca mais vivo" que o Alex pediu; antes `#006B5F` e `#6BD3C2`). Matiz 174–176 em OKLCH (antes 182), entre o verde e o azul-petróleo; no escuro vira o verde-água luminoso. O logo, o ícone e a abertura usam a mesma cor (`tokens-marca.json` 1.1.0).

Por que essa e não outra:

- **Não é a cor de ninguém no segmento.** Amarelo com preto, azul-royal, vermelho e verde-neon já são de redes de academia e de apps de treino conhecidos. Verde-profundo com dourado não está tomado.
- **É calma e séria sem ser fria.** Combina com "acompanhamento", a promessa do `00-PROPOSTA.md`. Azul diria "tecnologia", laranja diria "energia", roxo diria "premium".
- **Funciona nos dois temas sem mudar de personalidade.** O escuro usa a mesma matiz mais clara, não outra cor.
- **Dá contraste de texto no tema claro** (6,43:1 sobre branco), então a mesma cor serve para botão, link e aba ativa sem precisar de uma "versão para texto".

### Cor do Plus: dourado

`#EAB444` no claro, `#F8C153` no escuro. Matiz 82.

- É a cor de **uma coisa só**: o plano pago. Aparece no selo, no cartão de convite e na área do personal. Em mais nada. Se o dourado aparecer num botão comum, a regra foi quebrada.
- No tema claro, o dourado **não serve de texto** sobre branco (1,89:1). Para a palavra "Plus" solta no texto, para preço e para link, usa-se `plusTextoSobreFundo` (`#9A6100`, 5,14:1). Sobre o preenchimento dourado, o texto é `plusTexto` (`#3A2B0D`, 7,26:1).
- No tema escuro o mesmo dourado serve de preenchimento e de texto (11,41:1 sobre o fundo).

### Neutros

Os cinzas carregam um toque da matiz de marca (190) com croma quase zero. Na tela parece cinza; ao lado de um cinza puro, parece mais "quente" e mais do produto. Fundo e superfície são diferentes de propósito: o cartão branco sobre o fundo `#F4F8F7` se separa sem precisar de sombra pesada.

### Cores de estado

Sucesso verde-folha (matiz 150), atenção laranja-queimado (matiz 46-50), erro vermelho (matiz 25). Os três passam de 4,5:1 como texto nos dois temas. Duas regras para não confundir com a marca e com o Plus:

- **Sucesso vs. marca**: os dois são verdes. Sucesso só aparece em sinal pequeno (ícone de "feita", borda da série concluída, toast de "treino fechado"); nunca em botão nem em área grande. Marca aparece em botão e área grande; nunca para dizer "deu certo".
- **Atenção vs. Plus**: os dois são quentes. Atenção sempre vem com ícone de alerta e nunca em pílula arredondada; Plus sempre vem com a palavra e sempre em pílula.

### Tabela — tema claro

| Papel | Hex | OKLCH | Contraste medido | Uso |
| --- | --- | --- | --- | --- |
| `fundo` | `#F4F8F7` | oklch(97.6% 0.004 190) | — | fundo da tela |
| `superficie` | `#FFFFFF` | oklch(100% 0 0) | — | cartão, folha, campo |
| `texto` | `#131D1C` | oklch(22.1% 0.015 188) | 16,08:1 fundo · 17,21:1 superfície | texto e número grande |
| `textoSecundario` | `#556463` | oklch(49.0% 0.018 192) | 5,79:1 · 6,20:1 | legenda, rótulo |
| `marca` | `#007761` (era `#006B5F`) | oklch(50.8% 0.097 174) | 5,15:1 · 5,51:1 | botão, aba ativa, link, logo |
| `marcaTexto` | `#FFFFFF` | oklch(100% 0 0) | 5,51:1 sobre marca | texto no botão |
| `sucesso` | `#0A7E3A` | oklch(52.0% 0.139 150) | 4,83:1 · 5,17:1 | série feita, confirmação |
| `atencao` | `#B74D00` | oklch(55.1% 0.154 46) | 4,81:1 · 5,15:1 | aviso |
| `erro` | `#C21725` | oklch(52.1% 0.200 25) | 5,70:1 · 6,10:1 | erro, perigo |
| `plus` | `#EAB444` | oklch(80.0% 0.140 82) | 1,89:1 (não é texto) | preenchimento do selo |
| `plusTexto` | `#3A2B0D` | oklch(30.0% 0.049 82) | 7,26:1 sobre plus | texto no selo |
| `plusTextoSobreFundo` | `#9A6100` | oklch(54.2% 0.117 70) | 4,80:1 · 5,14:1 · 4,63:1 sobre plusSuave | "Plus" em texto, preço |
| `plusSuave` | `#FCF2E1` | oklch(96.4% 0.025 81) | — | fundo do cartão de convite |
| `marcaSuave` | `#DAF6F0` | oklch(95.1% 0.030 181) | marca 5,64:1 · texto 15,10:1 | item selecionado, chip ativo |
| `borda` | `#D0DAD9` | oklch(88.0% 0.011 190) | 1,33:1 (decorativa) | divisória, contorno |

### Tabela — tema escuro

| Papel | Hex | OKLCH | Contraste medido | Uso |
| --- | --- | --- | --- | --- |
| `fundo` | `#0B1313` | oklch(17.9% 0.012 196) | — | fundo da tela |
| `superficie` | `#1B2423` | oklch(25.1% 0.013 188) | — | cartão, folha, campo |
| `texto` | `#E7F1F0` | oklch(95.0% 0.011 190) | 16,33:1 · 13,78:1 | texto e número grande |
| `textoSecundario` | `#A1AEAD` | oklch(74.0% 0.015 191) | 8,21:1 · 6,93:1 | legenda, rótulo |
| `marca` | `#39F0CD` (era `#6BD3C2`) | oklch(86% 0.15 176) | 13,61:1 · 12,23:1 | botão, aba ativa, link, logo |
| `marcaTexto` | `#00221A` (era `#0B1313`) | oklch(22.5% 0.043 174) | 11,67:1 sobre marca | texto no botão |
| `sucesso` | `#67D283` | oklch(78.0% 0.150 150) | 9,96:1 · 8,41:1 | série feita |
| `atencao` | `#FDA16B` | oklch(79.1% 0.130 50) | 9,39:1 · 7,93:1 | aviso |
| `erro` | `#FF7E76` | oklch(74.0% 0.159 25) | 7,61:1 · 6,42:1 | erro, perigo |
| `plus` | `#F8C153` | oklch(84.1% 0.140 82) | 11,41:1 · 9,63:1 | selo e texto do plano |
| `plusTexto` | `#2F2207` | oklch(26.1% 0.045 83) | 9,42:1 sobre plus | texto no selo |
| `plusTextoSobreFundo` | `#F8C153` | igual a `plus` | 11,41:1 · 9,63:1 | mesmo nome nos dois temas |
| `plusSuave` | `#332710` | oklch(28.1% 0.041 82) | — | fundo do cartão de convite |
| `marcaSuave` | `#0D352F` | oklch(29.9% 0.045 181) | marca 7,48:1 · texto 11,64:1 | item selecionado |
| `borda` | `#313A39` | oklch(34.0% 0.012 188) | 1,61:1 (decorativa) | divisória, contorno |

Critério: 4,5:1 para texto normal, 3:1 para texto grande (≥ 24 px, ou ≥ 19 px em negrito) e para ícone. A `borda` fica abaixo de 3:1 de propósito: ela separa, não informa; o que informa é o texto ao lado.

## Tipografia

### Interface: Figtree

[fonts.google.com/specimen/Figtree](https://fonts.google.com/specimen/Figtree) · SIL Open Font License · pesos 400, 500, 600, 700.

Por quê: geométrica o bastante para parecer de app, com as letras abertas e o "a" de dois andares que ajudam a ler em tela com reflexo; acentos do português bem desenhados (ã, ç, õ); tem `tnum` (números tabulares) para a coluna de carga não dançar. É menos vista que Inter e Roboto, o que já dá cara própria sem exigir fonte paga.

Regras: título em 600, corpo em 400, botão em 600, rótulo em 500. Nunca 300 (fino demais com suor na tela). `font-variant-numeric: tabular-nums` em toda lista de números.

### Número grande: Archivo

[fonts.google.com/specimen/Archivo](https://fonts.google.com/specimen/Archivo) · SIL Open Font License · pesos 700 e 800.

Só para o que a pessoa lê a um metro de distância com o celular apoiado no aparelho: a carga em kg, o número no campo de +/- de repetição, o cronômetro de descanso, o número grande da visão do dono ("29 de 350"). Archivo tem o desenho de placar (largo, pesado, números de altura igual) que a Figtree não tem. Regra dura: **se o número tem menos de 24 px, é Figtree.** Archivo nunca em frase.

O sistema de design define os tamanhos (escala de tipo em `02-design/sistema-de-design/tokens.json`); aqui só o papel de cada família. Casando com os nomes de lá: `numeroCronometro` (64 px), `numeroCarga` (40 px) e `numeroMedio` (28 px) = Archivo 700/800 com `tabular: true`; `titulo1`, `titulo2`, `titulo3`, `corpo`, `corpoForte`, `corpoPequeno`, `legenda`, `rotuloAba` = Figtree. O `tokens-marca.json` já entrega `tipografia.familia.interface` e `tipografia.familia.numero` no formato exato do sistema.

### Reserva

Se o Alex preferir não embutir fontes (peso do app, ou "deixa a do sistema"), a interface cai para `system-ui` (San Francisco no iOS, Roboto no Android) e o número grande para a mesma fonte em 800 com `tabular-nums`. A identidade perde pouco: o que carrega a marca é cor, logo e tom, não a fonte.

## Ícones

**Lucide** ([lucide.dev](https://lucide.dev), licença ISC): traço de 2 px em caixa de 24 px, pontas e cantos arredondados, sem preenchimento. Para 32 px (barra de abas), 2,5 px. O ícone herda a cor do texto ao lado; não tem cor própria. Exceções: o selo Plus (dourado) e o ícone de "feita" (sucesso).

Por que traço e não preenchido: combina com a lousa (caneta, não tinta), e um conjunto de traço envelhece melhor quando o app ganhar ícones próprios (haltere, anilha, prato) desenhados na mesma gramática.

Ícones que o app vai precisar e que o Lucide já tem: `dumbbell`, `timer`, `check`, `plus`, `minus`, `utensils`, `user`, `users`, `message-circle`, `bell`, `chart-no-axes-column`, `calendar`, `lock` (só na tela de convite, nunca sobre funcionalidade "trancada"). O que falta e será desenhado: anilha, barra, "treino pronto", "treino livre".

## Fotografia e ilustração

**Entra:**

- Gente treinando na **academia de verdade**, com os aparelhos daquela sala, luz ambiente, sem pose. Instrutor ao lado de aluno, aluno anotando no celular, mão na barra, cronômetro no banco.
- Corpos **de todo tipo**, idade e tamanho, vestidos como as pessoas vão à academia de bairro de fato. Se a foto parece capa de revista, não entra.
- Enquadramento de **ação e contexto**, não de corpo: a pessoa fazendo o exercício, não o abdômen da pessoa.
- Tratamento: cor natural, leve dessaturação, sem filtro escuro-dramático. Sobre foto, sempre uma faixa `fundo` ou `superficie` para o texto; nunca texto direto na foto. *(Revisto em 10/10/2026 pela direção das referências do Alex: o tratamento passou a ser escuro, com gradiente e luz lateral, e o texto pode ir sobre a foto ou sobre vidro, sempre medido contra o pior pixel — componentes 19 e 20 do sistema.)*

**Não entra:**

- Antes e depois. Balança. Fita métrica na cintura. Espelho de vestiário.
- Foto de banco de imagem com modelo de academia de luxo, luz de estúdio, suor artificial.
- Comida fotografada como "permitida/proibida"; prato só como ilustração neutra do plano alimentar.
- Qualquer imagem que o `01-TOM-DE-VOZ.md` proibiria em palavra.

**Ilustração:** o app quase não precisa. Onde precisar (estado vazio, tela de abertura, erro de rede), **traço na cor de marca sobre fundo**, na mesma gramática dos ícones (2 px, arredondado), objetos da sala em vez de pessoas: barra, anilha, banco, garrafa, caderno. Sem personagem, sem mascote, sem 3D.

## O selo Plus

Uma **pílula dourada com a palavra "Plus"** em `plusTexto`, Figtree 700, 13 px dentro de 24 px de altura (ou 14 px em 28 px nas telas em que é o assunto). Sem ícone. Sem o sinal "+". Sem brilho, gradiente ou estrela.

Regras:

1. O selo marca **o que é do plano**: um cartão de dieta, a aba do personal, a conversa, um treino montado pelo personal. Fica no canto superior direito do cartão ou ao lado do título.
2. Para quem **não** assina, o selo só aparece na tela de convite e, no máximo, num cartão de convite na tela inicial. Nunca espalhado sobre funcionalidades "trancadas" (nada de cadeadinho dourado por toda parte).
3. Para quem assina, o selo aparece uma vez por tela, não em cada item.
4. O "+" do logo é verde (marca). O "Plus" do selo é dourado (plano). Os dois nunca se encostam.

Arquivo de referência: `logo/selo-plus.svg`.

## Forma, raio, sombra

O sistema de design decide os valores; a marca só pede coerência: raio **médio e único** (cartão e botão com o mesmo raio, campo um pouco menor), sombra **quase nenhuma** no tema claro (a separação fundo/superfície já faz o trabalho) e **nenhuma** no escuro (borda em vez de sombra). Cantos vivos não entram; cantos "pílula" só em chip e selo.

## Decisões para registrar em `docs/decisoes.md`

Copiar quando o Alex aprovar; este agente só escreve dentro de `02-design/marca-e-proposta/`.

**Cor de marca verde-profundo (matiz 182).** Critério: não ocupada no segmento, séria sem ser fria, texto-safe no claro. Descartado: azul (lê "tecnologia"), laranja (lê "energia"/promoção), verde-neon (lê "app de treino genérico"). Mudaria se: o white-label virar padrão e a cor de marca passar a ser a da academia (ver `05-WHITE-LABEL.md`).

**Dourado só para o Plus.** Critério: uma cor com um significado só, o plano pago. Descartado: roxo "premium" (clichê de "pro"), usar a própria cor de marca mais escura (não separa plano de marca). Mudaria se: o Plus deixar de existir como plano pago e virar funcionalidade de todos.

**Figtree + Archivo, livres.** Critério: sem custo de licença, legíveis em tela com reflexo, números tabulares. Descartado: Inter/Roboto (sem cara própria), fonte paga (custo e trava para white-label). Mudaria se: o app usar só fonte do sistema para economizar peso.

**Ícones Lucide de traço.** Critério: licença ISC, conjunto completo, gramática fácil de estender. Descartado: Material Icons (cara de Android em iPhone), Phosphor (bom, mas peso de traço mais fino). Mudaria se: o app adotar componentes nativos que já trazem ícone próprio.
