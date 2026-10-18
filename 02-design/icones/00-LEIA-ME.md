> **15/10/2026 (agente AL, P12):** a academia é de LUTA (Raça Fight). Os ícones de musculação (haltere da aba Início, anilha, barra, esteira, bicicleta, músculo, o "+" de anilhas do Plus e as 16 ilustrações de exercício) saem do design (não entram em tela nova), mas os arquivos ficam onde estão até o agente AM tirar o catálogo de musculação do app (o teste do catálogo lê `exercicios/`); a lista do que apagar está em `luta/CREDITOS.md`. Os ícones de luta (luva, faixa, tatame, saco, cronômetro de round, gongo, kimono, caneleira, check-in, e as abas novas) estão em `luta/`, com a licença em `luta/CREDITOS.md`.

# Ícones e ilustrações — regra de uso

Abra `galeria.html` no navegador (funciona por `file://`): cada ícone em 16, 24 e 32 px nos dois temas, a barra de abas com a aba ativa cheia, e as ilustrações de exercício em 48, 56 e 64 px.

## O que tem aqui

| Pasta / arquivo | O que é |
| --- | --- |
| `sprite.svg` | tudo num arquivo: `i-<nome>` (contorno), `i-<nome>-cheio`, `ex-<exercício>` |
| `contorno/` | 44 ícones soltos, grade 24 |
| `cheio/` | 11 versões cheias (abas e alguns de ação) |
| `exercicios/` | 16 ilustrações de exercício, grade 48 |
| `galeria.html` | a vitrine (gerada; o sprite vai embutido nela) |
| `fonte/gerar.py` | **a fonte**: a geometria de cada desenho está aqui. Edite aqui e rode `python -I gerar.py`; nunca edite os `.svg` gerados |
| `fonte/galeria-modelo.html` | o modelo da galeria |
| `00-FONTES.md` | a pesquisa das bibliotecas e a recomendação |
| `CREDITOS.md` + `licencas/` | de onde veio cada ícone, a licença e o que mudou |

## Regras de desenho (ícones)

1. **Grade 24**, `viewBox="0 0 24 24"`, área viva de 2 a 22.
2. **Traço 2,25**, com pontas e junções redondas. Vem do logo: o braço do "+" do caminho A tinha 120/1024 da arte; na área viva de um ícone (cerca de 20 de 24) isso dava 2,3. O logo final (agente W, 11/10/2026) tem a barra de 128 e o braço de 160 em 832; o traço da casa ficou em 2,25, e só o `plus` cheio usa a espessura do logo. O Lucide puro (2) ficava mais fino que o logo ao lado dele; 2,5 fechava os vãos em 16 px (sino, câmera, celular do vibrar).
3. **Vão mínimo de 1,5** entre dois traços (1 px na tela em 16 px). Onde não cabia, o desenho perdeu detalhe: garfo de dois dentes, régua com três marcas, barra com uma anilha de cada lado.
4. **`currentColor`, sem cor própria.** O ícone herda a cor do texto ao lado. Exceções que continuam valendo: o "feita" em `sucesso` e o selo Plus dourado (que é palavra, não ícone).
5. **Contorno é o normal; cheio só para a aba ativa** (e para `pausar`/`comecar`/`sino`/`sequencia` quando o botão é o assunto da tela). Nunca contorno e cheio misturados na mesma barra fora da aba ativa.
6. **Sem texto, sem `transform`, sem `class`** dentro do ícone. Formas giradas têm as coordenadas já calculadas.
7. Tamanhos: **16** (dentro de texto e de chip), **24** (padrão, botões e linhas), **32** (destaque). O alvo de toque continua 48/56/64 em volta do ícone; o ícone nunca é o alvo.
8. Contraste: o ícone segue a cor do texto, que já passa de 3:1 (ícone) nos dois temas. Sobre foto ou vidro, a mesma camada de contraste do texto.

## Os ícones-assinatura

- **`plus`** (aba Plus): o símbolo do logo (variação 1, "barra e mais", `marca-e-proposta/03-LOGO.md`) na grade 24: o "+" de braços iguais, a barra com uma anilha de cada lado e a ponta para fora, o braço vertical passando muito das anilhas. É o "+" da marca, sempre verde ou branco, nunca dourado.
- **`inicio`** (aba Início): o haltere na **horizontal**, com duas anilhas em degrau de cada lado e o cabo curto (refeito pelo agente Q em 10/10/2026: o de 45° lia como "elo de corrente" em 16 px). Separa-se do `plus` (que tem o braço vertical) e da `barra` (uma anilha de cada lado e as pontas da barra para fora) pela silhueta em degrau.
- **`cronometro`**: o anel de progresso do descanso com a coroa. O anel aberto é o mesmo desenho dos anéis por exercício.
- **`anilha`**: nenhuma biblioteca tinha.

## Cuidados de tom (do `01-TOM-DE-VOZ.md`)

- `balanca` só no registro de peso que a pessoa pediu para fazer. Nunca como tema de tela nem em notificação.
- `sequencia` (chama) é sequência de dias treinados. Nunca "queimar".
- `trofeu` é conquista da própria pessoa ("10 treinos fechados"). Nunca ranking nem comparação.
- `musculo` marca grupo muscular. Nunca "definição".
- `cadeado` só na tela de convite do Plus, nunca sobre função "trancada".
- `apple` e `google` são só para o mockup; no app vão os botões oficiais (ver `CREDITOS.md`).

## Ilustrações de exercício

Substituem as fotos pequenas de 48–64 px da lista do treino, que ficavam escuras e confusas.

- **Grade 48** (`viewBox="0 0 48 48"`), não 24: em 48–64 px a figura precisa de traço de 3, que numa grade 24 viraria 1,5 e sumiria.
- **A figura**: cabeça cheia sem rosto, corpo em traço 3 de pontas redondas, a mesma proporção para todo mundo, sem músculo desenhado. Nada de corpo ideal: é um boneco de traço, não um corpo.
- **O aparelho** (`.aparelho`): traço 2,5 com opacidade 0,45, para a figura ler primeiro.
- **O músculo trabalhado** (`.musculo`): traço 4,5 encostado no lado do osso onde o músculo fica (peito na frente do tronco, costas atrás, quadríceps em cima da coxa, tríceps atrás do braço…), na cor de destaque. A cor vem da variável CSS **`--ilustracao-destaque`**, que atravessa o `<use>` do sprite; sem ela, cai no `#007761`.
- Como usar: um ladrilho com o fundo `--r-ilustracao-fundo`, raio 12, a ilustração ocupando o ladrilho inteiro, e o nome do exercício **sempre em texto ao lado**. A cor do músculo nunca é a única informação.

Valores usados na galeria (locais do agente R, para o Q levar ao `tokens.json` junto com o verde vivo do N):

| Variável | Claro | Escuro | Medido |
| --- | --- | --- | --- |
| `--r-ilustracao-fundo` (ladrilho) | `#E6F1EF` | `#222D2C` | — |
| `--r-ilustracao-traco` (figura) | `#131D1C` (= `texto`) | `#E7F1F0` (= `texto`) | 14,91:1 / 12,33:1 sobre o ladrilho |
| `--ilustracao-destaque` (músculo) | `#007761` (`marca`) | `#39F0CD` (`viva`) | 4,77:1 / 9,81:1 sobre o ladrilho (era `#00897B` / `#4FE3C8`; alinhado ao verde do sistema pelo agente Q, tokens 1.7.0 `ilustracao`) |

No escuro, músculo e figura são os dois claros (1,39:1 entre eles): a diferença é de cor e de espessura, e o nome do exercício está escrito ao lado. Se o N fechar outro verde vivo para o escuro, troque só a variável.

## Como usar no código

**Na web (mockups)**: `<svg width="24" height="24"><use href="sprite.svg#i-buscar"/></svg>`. Por `file://` o Chrome não deixa o `<use>` buscar outro arquivo: embuta o sprite na página (como a galeria faz) ou use os `.svg` soltos.

**No app (Expo / React Native)**: os `.svg` soltos com `react-native-svg` (via `react-native-svg-transformer`), `color` herdado do texto. A ilustração recebe a cor do destaque por prop (trocar o `style` do `.musculo` por `stroke={destaque}`).
