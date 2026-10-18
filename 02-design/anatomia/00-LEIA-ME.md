# Mapa muscular: regra de uso

Pedido do Alex (11/10/2026): todo ícone que envolve um músculo vira "uma demonstração do corpo em cinza e o músculo em vermelho". Este é o caminho **A**: um mapa em vetor, frente e costas, gerado por código. O caminho B, imagem de IA, não rodou porque o token não tem Workers AI (ver `docs/revisao/AD-ANATOMIA.md`).

Abra `comparativo.html` no navegador (funciona por `file://`). A página mostra:
- os seis casos em 48, 56 e 64;
- a linha da lista e o detalhe grande;
- os dois temas;
- o treino de hoje × A;
- o filtro com mini corpo;
- a Evolução pintando o corpo;
- os 28 exercícios;
- a tabela de contraste.

## O que tem aqui

| Pasta / arquivo | O que é |
| --- | --- |
| `fonte/gerar.py` | **A fonte.** Regiões, músculos, grupos, cores e recortes. Rode `python -I gerar.py`. Nunca edite os `.svg` gerados. |
| `fonte/base-musclemap.json` | Os paths do corpo (MuscleMap, MIT), extraídos uma vez por `fonte/extrair-base.py` |
| `fonte/musculos-por-exercicio.json` | O que acende em cada um dos 28 exercícios, com a página do ExRx.net e o texto dela |
| `fonte/caminhos.py` | Converte o `d` para absoluto, desloca e arredonda (lê as flags coladas do arco) |
| `fonte/comparativo.py` | Gera o `comparativo.html` |
| `fonte/testar-ia.py` | O teste do caminho B (Workers AI). Prompt e semente fixos |
| `fonte/licencas/` | As duas licenças MIT |
| `mapa/frente.svg`, `mapa/costas.svg` | O mapa de referência: **um `<path id>` por região**, com as divisões |
| `exercicios/<id>.svg` | A miniatura: a vista e o recorte do músculo principal |
| `exercicios/<id>-duplo.svg` | O detalhe: frente e costas inteiras, com as divisões |
| `grupos/<grupo>.svg` | O mini corpo do filtro e da Evolução (os 9 grupos com músculo; `cardio` não tem) |
| `dados/mapa-muscular.json` | **O que o app usa**: vistas, camadas, recortes, músculos, grupos, exercícios e cores (124 KB) |
| `dados/contraste.json` | As medidas |
| `dados/resumo-exercicios.json` | Vista, recorte e músculos de cada exercício, e o secundário que não cabe na miniatura |

## O desenho

- **O corpo** é o contorno de todas as peças da base com um traço de 14 unidades, que fecha os vãos entre os músculos. Sai uma silhueta lisa, sem rosto, sem cabelo marcado e sem sexo. A borda de 4 unidades fica na cor `contorno`.
- **Divisões entre os músculos** (traço de 2,2, opacidade 0,6) só no detalhe grande. Na miniatura o corpo é liso, e o vermelho é a única coisa dentro dele.
- **O músculo trabalhado** é a região inteira em `principal`. O que ajuda vai em `secundario`, e o resto fica cinza.
- **A ordem de pintura importa.** Na base, o ombro da frente é uma peça inteira com a parte anterior por cima. O deltoide lateral é o ombro inteiro com o anterior repintado de cinza por cima. O mesmo vale para o peitoral de cima sobre o de baixo, os trapézios sobre o trapézio médio e o infraespinal sobre o grande dorsal (`SOBREPOSICOES` no gerador).
- **Vistas**: a miniatura usa a menor lista de vistas que mostra todos os principais. Supino é só frente. Puxada é só costas. Agachamento é frente e costas, porque quadríceps e glúteo não cabem numa vista só.
- **Recorte**:
  - na miniatura, `superior` vai da cabeça até as mãos e `inferior` vai do quadril aos pés, só as pernas;
  - `inteiro` é a figura toda, e só o polichinelo usa.
  - Em 48 px, o corpo inteiro deixava o bíceps com uns 3 px. Recortado, ele fica com o dobro.

## Tamanhos

| Uso | Tamanho | O que mostra |
| --- | --- | --- |
| Filtro (chip) | 24 de altura | `grupos/<grupo>`, recortado, liso |
| Linha da lista | ladrilho de 48 (biblioteca, montar treino) ou 56 | `exercicios/<id>`, 3 px de folga |
| Exercício atual (modo treino) | ladrilho de 64 | idem |
| Detalhe ("como fazer", Evolução) | 160 a 240 de altura | `exercicios/<id>-duplo`, frente e costas, com divisões |

Ladrilho: o mesmo da ilustração de hoje, `ilustracao.fundo` com raio 12. O nome do exercício vai **sempre** em texto ao lado: a cor nunca é a única informação, e o mapa é escondido do leitor de tela na linha. No detalhe, o rótulo acessível diz os músculos: "Principal: peitoral. Ajudam: deltoide anterior e tríceps."

## Cores

| Papel | Claro | Escuro |
| --- | --- | --- |
| `corpo` | `#CDD3D6` | `#3A4446` |
| `contorno` (borda e divisões) | `#9AA3A7` | `#5E6A6D` |
| `principal` (o músculo) | `#CE2C31` | `#FF6369` |
| `secundario` (o que ajuda) | `#F07579` | `#C2383D` |

Medido (WCAG 2.x; o mínimo para gráfico é 3:1):

| Par | Claro | Escuro |
| --- | --- | --- |
| principal / corpo | **3,45** | **3,46** |
| principal / ladrilho | 4,52 | 4,89 |
| principal / superfície | 5,21 | 6,10 |
| principal / fundo | 4,87 | 6,79 |
| secundário / corpo | 1,84 | 1,87 |
| principal / secundário | 1,87 | 1,84 |
| corpo / ladrilho | 1,31 | 1,42 |
| contorno / superfície | 2,57 | 3,16 |

- **O par do pedido não passava.** `#E5484D` sobre `#9AA3A7` dá 1,52:1. Para o vermelho passar de 3:1 contra o corpo, o corpo clareou e o vermelho escureceu no claro; no escuro, o vermelho clareou. O `#9AA3A7` do pedido virou a borda.
- **O secundário fica no meio de propósito.** Ele está a ~1,85:1 do corpo e do principal, então se distingue dos dois sem competir. No escuro ele é um vermelho mais fundo, não mais claro: "menos aceso" é mais escuro sobre fundo escuro. O secundário nunca é informação sozinho; a lista de músculos está escrita no detalhe.
- **O corpo contra o fundo fica abaixo de 3:1 de propósito.** É contexto, não informação. A borda ajuda a ver a silhueta.

## Regras

1. **Diagrama, não pessoa.** Sem rosto, sem pele, sem sexo, sem foto. Nunca "definição", "corpo ideal" ou "antes e depois" (`01-TOM-DE-VOZ.md`). O corpo pintado na Evolução mostra **onde foi o volume de carga**, nunca como o corpo está.
2. **O vermelho do mapa é só do mapa.** Nunca vira cor de texto, borda, ícone ou botão. O `erro` do sistema (`#C21725` / `#FF7E76`) é vizinho dele, e o erro sempre vem com ícone e texto, então não se confundem.
3. **A cor nunca é a única informação.** O nome do exercício e o nome do grupo estão sempre escritos. Na Evolução, os quilos estão escritos ao lado do corpo.
4. **Cardio não é músculo.** O filtro "Cardio" fica com o texto ou o ícone `frequencia`. Esteira, bicicleta e polichinelo têm mapa porque mexem com músculos, mas a fonte deles é convenção, não o ExRx.
5. **Exercício sem mapeamento** (criado pela academia ou pelo aluno) usa o mapa do `grupoMuscular` dele (`grupos/`). Se o grupo for `cardio`, usa o ícone.
6. **Os músculos de um exercício** vêm de `fonte/musculos-por-exercicio.json`:
   - `principal` é o Target do ExRx;
   - `secundarios` são os Synergists que têm região no mapa;
   - Stabilizers não acendem, e as exceções estão anotadas em `nota`.

   O profissional com CREF que revisar o catálogo revisa este arquivo junto.

## Como usar

**Na web (mockups)**: `<img src="exercicios/supino-reto.svg">` troca de tema sozinho pelo `prefers-color-scheme` de dentro do SVG. Para trocar a cor por página, use o SVG embutido: as classes `am-corpo`, `am-borda`, `am-linha`, `am-p` e `am-s` leem `--am-corpo`, `--am-contorno`, `--am-principal` e `--am-secundario`. O `comparativo.html` faz isso com um sprite de `<use>`.

**No app**: o componente `MapaMuscular` desenha a partir de `dados/mapa-muscular.json`. As cores vêm do tema, e o JSON entra copiado pelo gerador do app. O plano está em `docs/revisao/AD-ANATOMIA.md`, seção 6.

## Licença

A base é o **MuscleMap** de Melih Colpan (MIT), cujos paths do corpo masculino são os do **react-native-body-highlighter** de Hicham ELABBASSI (MIT). A MIT pede que o aviso de copyright e a licença acompanhem as cópias, ou seja, a tela "Licenças de código aberto" do app. Ela **não pede crédito na tela de uso**. Detalhes em `CREDITOS.md`.
