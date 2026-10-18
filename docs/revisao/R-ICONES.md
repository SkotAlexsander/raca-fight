# R — Ícones e ilustrações (P09, 10/10/2026)

Agente R. Escrevi só em `02-design/icones/` e neste arquivo. Nenhum **[decidir]** foi resolvido.

No meio do trabalho o Alex pediu ícones "meio que únicos", com cara de academia, treino e alimentação, tirados de bibliotecas abertas. O plano mudou para: **uma biblioteca de base + temáticos de uma biblioteca compatível, os dois ajustados ao traço do logo, + desenho próprio só nos ícones-assinatura**. As ilustrações de exercício continuaram como estavam.

## 1. Bibliotecas: quais e por quê

Li a licença atual no LICENSE de cada repositório (API do GitHub) e conferi na árvore de arquivos se cada ícone existe. A tabela completa está em `02-design/icones/00-FONTES.md`.

- **Lucide (ISC)**, a base. Já era a escolha de `02-IDENTIDADE-VISUAL.md`. Tem traço de pontas e cantos redondos, a mesma ponta do logo, e cobre a interface toda.
- **Tabler Icons (MIT)**, para os temáticos. Tem a mesma grade e a mesma gramática do Lucide, e as peças de academia que o Lucide não tem: esteira, corrida, alongamento, barra, balança, régua, garrafa e fachada.
- **Ficaram de fora**:
  - Phosphor: o traço "regular" é menos redondo.
  - Iconoir: traço de 1,5, fino demais.
  - Material Symbols: são formas cheias, não dá para trocar a espessura.
  - Healthicons: grade 48, com traço e cheio misturados.
  - Remix Icon: a licença v1.0, de janeiro de 2026, proíbe usar como identidade e criar conjunto derivado.
  - Flaticon e Noun Project gratuitos: exigem crédito na tela.
- **Quarentena**: os SVG foram baixados para uma pasta de quarentena fora do projeto e conferidos antes de qualquer uso. Nenhum tinha `<script>`, `href`, `on*`, `foreignObject` nem `data:`.
- **Registro**: cada ícone está em `CREDITOS.md`, com o arquivo, a biblioteca, o nome original, a licença, o link e o que foi alterado. As duas licenças estão em `licencas/`.

## 2. O que foi entregue

`02-design/icones/`:
- `sprite.svg`, com os ids `i-*`, `i-*-cheio` e `ex-*`;
- `contorno/` (44), `cheio/` (11) e `exercicios/` (16);
- `galeria.html`, que abre por `file://`;
- `00-LEIA-ME.md` (regra de uso), `00-FONTES.md`, `CREDITOS.md` e `licencas/`;
- `fonte/gerar.py` e `fonte/galeria-modelo.html`. **A fonte é o gerador**: a geometria de cada desenho está escrita à mão nele, e os `.svg` nunca são editados direto.

### Ícones (44 contorno, 11 cheios)

| Grupo | Ícones (cheio entre parênteses) | Origem |
| --- | --- | --- |
| Abas | `inicio` (cheio), `treinos` (cheio), `plus` (cheio), `perfil` (cheio), `alunos` (cheio), `academia` (cheio) | inicio e plus próprios; Lucide; Tabler (academia) |
| Ações | `marcar`, `mais`, `menos`, `cronometro`, `pausar` (cheio), `comecar` (cheio), `pular`, `buscar`, `filtro`, `voltar`, `avancar`, `menu`, `fechar`, `vibrar`, `sino` (cheio), `prato`, `grafico`, `camera`, `cadeado`, `email`, `calendario` | Lucide; cronometro próprio |
| Temáticos | `anilha` (cheio), `barra`, `esteira`, `bicicleta`, `corrida`, `alongamento`, `balanca`, `medida`, `frequencia`, `sequencia` (cheio), `trofeu`, `musculo`, `garrafa`, `personal`, `grafico-linha` | Tabler e Lucide; anilha e grafico-linha próprios |
| Entrar com | `apple`, `google` | silhueta própria, **só para o mockup** |

**Ícones-assinatura (desenho próprio):**
- **`plus`**: o símbolo do caminho A na grade 24.
- **`inicio`**: o haltere do logo deitado a 45°. Fica deitado para não confundir com o `plus`, que está ao lado na barra.
- **`cronometro`**: o anel do descanso com a coroa.
- **`anilha`**: nenhuma biblioteca tinha.

### Ilustrações de exercício (16)

- **Do mockup**: supino reto, supino inclinado com halteres, crucifixo na máquina, tríceps na corda, agachamento livre, remada curvada, esteira.
- **Os comuns**: leg press, puxada, desenvolvimento, rosca, prancha, abdominal, elevação pélvica, panturrilha, bicicleta.
- Agachamento, remada, tríceps e esteira, que também estão na lista do P09, já entram acima.

## 3. Regras de desenho

**Ícones:**
- **Grade e traço**: grade 24, área viva de 2 a 22. O traço é **2,25**, com pontas e junções redondas.
  - A conta: o braço do logo tem 120/1024 da arte, o que dá cerca de 2,3 numa área viva de 20.
  - O Lucide puro (2) ficava mais fino que o logo; 2,5 fechava os vãos em 16 px.
- **Vão mínimo de 1,5** entre dois traços. Onde não cabia, o desenho perdeu detalhe: garfo de dois dentes, régua com três marcas e barra com uma anilha de cada lado. Nas figuras de 24, a cabeça é cheia.
- **Cor**: `currentColor`, sem cor própria.
- **SVG limpo**: sem texto, sem `transform` (o haltere girado tem as coordenadas já calculadas) e sem `class` no ícone.
- **Cheio só para a aba ativa.** Os cheios foram desenhados para somar o traço, e os vãos (linhas da prancheta, porta, furo da anilha) são janelas `evenodd`.

**Ilustrações:**
- **Grade 48**, não 24: em 48–64 px a figura precisa de traço 3, que numa grade 24 cairia para 1,5.
- **A figura**: cabeça cheia sem rosto e corpo em traço 3, a mesma proporção para todos, sem músculo desenhado. Assim não há corpo ideal.
- **O aparelho**: traço 2,5 com opacidade 0,45.
- **O músculo trabalhado**:
  - é um traço 4,5 encostado no lado do osso onde o músculo fica: peito na frente do tronco, dorsal atrás, quadríceps em cima da coxa, tríceps atrás do braço, panturrilha atrás da canela;
  - a cor é `style="stroke:var(--ilustracao-destaque, #00897B)"`. A variável atravessa o `<use>` do sprite, então dá para trocar por tema;
  - o nome do exercício vai sempre em texto ao lado, porque a cor nunca é a única informação.

## 4. O que olhei (Playwright, Chromium do `.ferramentas`)

Capturei a galeria inteira nos dois temas e olhei cada faixa ampliada sem suavizar, para ver os pixels de verdade. O que refiz depois de olhar:
- **`pausar` cheio**: em 16 px virava um bloco só. As barras foram afastadas (vão de 4).
- **`plus` cheio**: ficava mais leve que o contorno. As anilhas ganharam corpo, e os braços ficaram com a espessura do logo (2,8).
- **`treinos` cheio**: as linhas sumiam. As janelas foram para 2,8 de altura.
- **`inicio`**: estava pequeno em 16 px. As anilhas passaram para 4,5 × 12.
- **Tríceps e rosca**: o braço ficava sobre o tronco, e o músculo parecia pintado no tronco. O braço foi para a frente.
- **Agachamento**: a anilha cobria a cabeça. A barra desceu para os ombros e a cabeça subiu.
- **Panturrilha**: era um risco só. Ganhou um braço segurando um apoio.
- **Ilustrações miúdas**: ocupavam 86 % do ladrilho e passaram a ocupar o ladrilho inteiro.

Depois das correções, nenhum ícone vira borrão em 16 px, e na faixa de 16 px não há dois iguais. Os pares mais próximos, `barra` e `plus` e `inicio` e `barra`, se separam pelo braço vertical e pelos 45°.

## 5. Para o Q

**Variáveis locais** a passar para o `tokens.json`:

| Variável | Claro | Escuro | Contraste sobre o ladrilho |
| --- | --- | --- | --- |
| `--r-ilustracao-fundo` | `#E6F1EF` | `#222D2C` | — |
| `--r-ilustracao-traco` (= `texto`) | `#131D1C` | `#E7F1F0` | 14,91:1 / 12,33:1 |
| `--ilustracao-destaque` | `#00897B` | `#4FE3C8` | 3,74:1 / 8,89:1 |

Se o N fechar outro verde vivo, troque só o destaque e meça de novo (precisa de 3:1).

**Aplicação:**
- **Barra de abas**: Início, Treinos, Plus e Perfil no aluno; Início, Alunos, Academia e Perfil na academia. A aba ativa usa a versão `-cheio`.
- **Na web**: por `file://` o Chrome não deixa o `<use>` buscar o `sprite.svg` em outro arquivo. Embuta o sprite na página, como a galeria faz, ou use os `.svg` soltos.
- **Miniaturas da lista**: o ladrilho de 56 px (64 no exercício atual), com raio 12 e `alt=""`, porque o nome já está ao lado.

## 6. O que ficou faltando

- **Apple e Google**: os dois são marcas de terceiros e estão só no mockup. No app vão o botão nativo do `expo-apple-authentication` e o "G" oficial de quatro cores do Google. Não baixei nenhum dos dois.
- **Contraste entre músculo e figura no escuro**: é baixo (1,39:1), porque os dois são claros. O que separa é o matiz e a espessura. O nome em texto ao lado cobre a acessibilidade, mas um teste com daltonismo (deuteranopia) ainda não foi feito.
- **Leg press**: é a ilustração mais abstrata. Lê como um "V" reclinado. Pede uma olhada do Alex ou de um instrutor.
- **Ilustrações que ainda não existem**: afundo, cadeira extensora, mesa flexora, elíptico, crucifixo com halteres e tríceps testa. A biblioteca do app terá mais que 16. O gerador deixa acrescentar uma figura em cerca de dez linhas.
- **Teste no aparelho real**: falta ver os ícones em um aparelho de verdade (densidade 3× e o modo escuro tingido do iOS).
- **Crédito em "Sobre o app → Licenças"**: as licenças pedem que o aviso acompanhe o código. A tela de licenças ainda não existe no mapa de telas.
- **Contorno do haltere em 16 px**: lê um pouco como "elo de corrente". Com o cheio da aba ativa ao lado fica claro, mas vale o Alex olhar.
- **Nota da área de rascunho**: na primeira captura, gravei sem querer arquivos `g-0.png` a `g-7.png` na raiz da área de rascunho compartilhada da sessão. Se algum agente tinha arquivos com esse nome lá, eles foram sobrescritos. Depois disso usei só a subpasta `r/`.
