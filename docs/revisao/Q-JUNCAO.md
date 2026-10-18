# Q — Junção, revisão e PDF (P09, 10/10/2026)

Agente Q. Junta o que N (sistema), O (entrada), P (telas novas), R (ícones) e S (treinos e imagens) entregaram, aplica a **regra de proporção** que o Alex pediu no meio da rodada, revisa as três páginas e refaz o PDF. Nenhum **[decidir]** foi resolvido.

Arquivos que mudaram:
- `02-design/sistema-de-design/`: `tokens.json` (1.6.0 → **1.7.0** → **1.8.0**), `mockups/sistema.css`, `entrada.css`, `novas.css`, `index.html`, `entrada.html`, `novas.html`, `mockups/imagens/` (duas fotos saíram) e `CREDITOS.md`, `auditoria/auditar.mjs`, `00-PRINCIPIOS.md`, `01-TOKENS.md`, `02-COMPONENTES.md`, `movimento/00-CATALOGO.md`.
- `02-design/icones/`: `fonte/gerar.py` (haltere horizontal, 15 ícones a mais, cor do destaque), `fonte/embutir.mjs` (novo), `fonte/galeria-modelo.html`, o sprite e os `.svg` gerados, `00-LEIA-ME.md`, `CREDITOS.md`, `00-FONTES.md`.
- `02-design/marca-e-proposta/`: os SVG do caminho A em `logo/`, `logo/comparativo.html`, `tokens-marca.json` (1.0.0 → **1.1.0**), `02-IDENTIDADE-VISUAL.md`, `03-LOGO.md`, `04-APLICACAO.md`.
- `docs/decisoes.md` (acrescentado), `docs/apresentacao/` (partes, `capturar.mjs`, CSS, PDF).

## 1. O que foi consolidado

### Tokens 1.7.0: as variáveis locais viraram sistema

| Origem | Variável local | Token (`tokens.json`) | CSS (`sistema.css`) |
|---|---|---|---|
| O | `--o-raio-campo` | `raio.campo` 16 | `--raio-campo` |
| O | `--o-tipo/linha-titulo-entrada` | `tipografia.escala.tituloEntrada` (39/44 na 1.8.0; teto 49) | `--tipo/linha-titulo-entrada` |
| O | `--o-abertura-simbolo`, `--o-boasvindas-simbolo`, `--o-abertura-espera`, `--o-abertura-fundo`, `--o-abertura-simbolo-cor` | grupo `abertura` (96, 32, 700 ms; claro `marca` + branco, escuro `marcaSuave` + `viva`) | `--abertura-*` |
| O | `--o-porta-altura`, `--o-codigo-caixa` | `porta.altura` 88, `codigo.caixa` 48 | `--porta-altura`, `--codigo-caixa` |
| O | `--o-foto-veu`, `--o-foto-veu-desfocada`, `--o-foto-texto(-secundario)` | `foto.entrada.{claro,escuro}` | `--foto-veu-entrada`, `--foto-veu-desfocada`, `--foto-entrada-texto(-secundario)` |
| O | `--o-vidro-selecionado` | `vidro.{claro,escuro}.selecionado` | `--vidro-selecionado` |
| O | `--o-social-fundo/texto` | `contaSocial.{claro,escuro}` | `--conta-social-fundo/texto` |
| P | `--p-grafico-neutro-1/2/3`, `-grade`, `-area` | grupo `grafico` | `--grafico-*` |
| P | `--p-mapa-vazio/futuro`, `--p-dia-mapa`, `--p-bolinha-semana` | grupo `mapa` | `--mapa-*`, `--dia-mapa`, `--bolinha-semana` |
| P | `--p-aviso-fundo/fio` | grupo `aviso` | `--aviso-*` |
| P | `--p-capa-inicio`, `--p-foto-topo-evolucao/dono` | grupo `telas` | `--capa-inicio`, `--foto-topo-*` |
| P | `--p-anel-descanso(-traco)`, `--p-desfoque-foto-descanso` | `descanso`, `foto.desfoqueDescanso` | `--anel-descanso*`, `--foto-desfoque-descanso` |
| P | `--p-check-comemoracao` | `comemoracao.check` **112** (o catálogo, efeito 4.2, foi alinhado: era 64) | `--check-comemoracao` |
| P | `--p-tipo/linha-numero-hero` | `tipografia.escala.numeroDestaque` (49/52 na 1.8.0) | `--tipo/linha-numero-destaque` |
| P | `--p-tipo-legenda-grafico` | `tipografia.escala.legendaGrafico` 13/16 | `--tipo/linha-legenda-grafico` |
| P | `.p-vidro--escuro` | `vidro.escuroFixo` → **variante "vidro escuro" do componente 20** | `.vidro--escuro` |
| P | `--p-barra-abas-flutuante/margem` | saiu (ver barra de abas abaixo) | — |
| R | `--r-ilustracao-fundo/traco`, `--ilustracao-destaque` | grupo `ilustracao` (destaque alinhado ao verde do sistema: `#007761` no claro, 4,77:1; `#39F0CD` no escuro, 9,81:1) | `--ilustracao-*`, `.mini--ilustracao`, `.exercicio__imagem--ilustracao` |
| R | traço 2,25 | `icone.traco` 2 → 2,25 | `--icone-traco` |

Em `entrada.css` só ficaram `--o-foto` e `--o-foto-desfocada`, que são caminhos de arquivo; em `novas.css` não sobrou nenhuma `--p-`.

### Barra de abas: a encostada, nas três páginas
A flutuante do P saiu: cobria o fim da lista, pedia 64 + 12 px de folga embaixo de toda tela e criava um segundo desenho de aba ativa (viva cheia) para o mesmo componente. As refs 03, 05 e 06 também a têm encostada. O `novas.html` passou a usar o `.barra-abas` do sistema (componente 12), e o `02-COMPONENTES.md` registra a escolha (regra 8).

### Ícones e ilustrações do R aplicados
- O sprite do R é **embutido** em `index.html`, `entrada.html` e `novas.html` entre os marcadores `<!-- ICONES:INICIO -->` e `<!-- ICONES:FIM -->`, por `02-design/icones/fonte/embutir.mjs` (rodar depois do `gerar.py`). Os provisórios saíram: `#i-marca-mais` → `#i-plus`, `#i-avancar` (seta) → `#i-seta-direita`, `#i-seta` (chevron) → `#i-avancar`, `#i-check` → `#i-marcar`, `#i-halter` → `#i-inicio`, os `#p-i-*` do P, e o resto. A aba ativa usa a versão `-cheio`.
- **15 ícones a mais no gerador** (as páginas usavam e o R não tinha): `baixo`, `subir`, `seta-direita`, `lista`, `conversa`, `desfazer`, `trocar`, `alerta`, `alca`, `nuvem`, `olho`, `escudo`, `convite`, `relogio`, `estrela`, todos de Lucide (ISC) no traço 2,25, com crédito na lista. São 59 contornos, 11 cheios e 16 ilustrações.
- **Haltere da aba Início refeito na horizontal**, com duas anilhas em degrau de cada lado (contorno e cheio). Conferido em 16, 24, 32 e 48 px nos dois temas: lê como haltere, e se separa do `plus` (que tem o braço vertical) e da `barra` (uma anilha de cada lado e as pontas para fora).
- **Miniaturas de exercício em foto → ilustração** em todo lugar de 48–64 px: a lista do treino em andamento (4), "Treinos da Ana" (3, inclusive o Treino A, que tinha capa de agachamento), o cartão de exercício com erro (56). A miniatura de **treino** (capa) continua foto, agora a capa do catálogo do S.
- Os ícones de Apple e Google da entrada continuam os do O (o "G" de quatro cores), porque são marcas de terceiros só no mockup.

### Cor do logo e do ícone = a da abertura
- SVG do caminho A em `logo/` (`a-barra-*`): `#006B5F` → `#007761`, `#6BD3C2` → `#39F0CD`, texto escuro `#E7F1F0` → `#E9F2F1`. B e C, descartados, ficaram nas cores antigas como registro. `selo-plus.svg` não tem verde: não mudou.
- `tokens-marca.json` 1.1.0 passou a ter os mesmos `cor.claro` e `cor.escuro` do `tokens.json` (inclusive `viva`, `vivaTexto`, `progresso`), mais as regras do verde vivo e do logo.
- Contrastes mantidos: branco sobre `#007761` 5,51:1 (ícone e abertura), `#007761` sobre branco 5,51:1 ("Plus" do wordmark), `#39F0CD` sobre o fundo escuro 13,61:1.
- `02-IDENTIDADE-VISUAL.md` (OKLCH recalculado: `#007761` = oklch 50,8 % 0,097 174), `03-LOGO.md` e `04-APLICACAO.md` atualizados. Pendente: `app/app.json` ainda tem `#006B5F` (a cor da notificação); é arquivo do app.

### Navegação entre as páginas
No topo fixo das três: "Academia Plus · Sistema e 6 telas · Abertura e entrada · Telas novas", com `aria-current="page"` na atual e um `<h1>` só para leitor de tela com o nome da página. O link leva junto a URL de agora (`?moldura=real`, `?aparelho=`, `?abas=mais`).

### Moldura inteira no monitor do Alex (2040 × 790)
O P apontou e era verdade nas três páginas: o cálculo do zoom descontava só o topo fixo, não o título da galeria, e a moldura saía cortada embaixo. Agora:
- o `ajustar()` desconta **tudo o que fica acima da primeira fileira** (`telas.getBoundingClientRect().top`), e nunca deixa o zoom abaixo do mínimo (antes, a 1280 × 800 com fonte 160 %, isso fazia rolagem lateral);
- na entrada, cada seção desconta o topo fixo e o próprio título;
- numa janela deitada e baixa, o topo fixo vira uma linha só (navegação e chaves) e as notas longas saem do topo.

Olhado a 2040 × 790: as 6 telas, os 7 quadros e as 3 primeiras telas da entrada cabem inteiros na primeira tela.

### Trocas do agente S (15)
Todas aplicadas (`docs/revisao/S-TREINOS-E-IMAGENS.md`, seção 2):
- T1: o supino inclinado de verdade (`treinos/supino-inclinado-com-halteres-heroi`).
- T2 e T11: a capa do ABC (supino reto), com "40 min" e "20 exercícios".
- T3, T4, T10, T12: as capas largas de Circuito 30, Fôlego 3× e Full body 3×, e a mini do Circuito 30 com "Perder peso" (era "Emagrecer").
- T5, T6, T13: as minis de Primeiros passos (25 min) e Corpo em dia.
- T7: o "HIIT esteira" arquivado com foto de corda virou **Intervalado 25**, do catálogo, com a capa dele.
- T8: a ilustração de supino no Treino A.
- T9: "Push / Pull / Legs" → "Empurrar, puxar e pernas".
- T14: a amostra do componente 19 também saiu do agachamento.
- T15: a capa do Início das telas novas, com "7 exercícios · cerca de 40 min".

Os números seguem o dia A do ABC do catálogo:
- o treino em andamento é o "exercício 3 de 7", com o placar 6/20 séries e 2/7 exercícios (e o script do placar conta sobre 20);
- o modo treino é o "exercício 4 de 7", com 7 traços;
- a comemoração mostra 7 exercícios, 41 minutos e 20 séries.

Os nomes de treino das páginas são os do catálogo.

As fotos `mockups/imagens/heroi-supino-halteres` e `capa-ganhar-massa` saíram da pasta e do `CREDITOS.md` (com o motivo).

**Exercícios do catálogo sem ilustração** (aparece o ícone genérico até o R desenhar): supino sentado na máquina, flexão de braço, remada baixa, elevação lateral, agachamento sem carga, afundo, stiff com halteres, cadeira extensora, mesa flexora, corda naval, polichinelo e escalador. Os mais urgentes são cadeira extensora, mesa flexora e remada baixa (4, 6 e 8 programas).

## 2. A regra de proporção do Alex (tokens 1.8.0)

O Alex reprovou a proporção ("números e botões grandes demais"). Aplicado em `tokens.json`, `sistema.css`, `entrada.css`, `novas.css` e nas três páginas, nos dois temas e nas quatro molduras:

| Regra | Como ficou |
|---|---|
| Escala fechada 13 · 16 · 20 · 25 · 31 · 39 · 49 · 61 | `tipografia.$escala`. Toda a escala do `tokens.json` refeita (legenda e apoio 13, corpo 16, subtítulo 20, título de tela 25, título grande 31, entrada 39, herói 49, 61 só no modo treino e no Cronômetro). Tirados os px soltos: barra de status 15 → 16 e 14/12 → 13; `0.875rem`, `2.5rem`, `0.42em`, `1.125rem`, `1.75rem` do P; a página do logo (12, 14, 18, 22, 24, 64). |
| Um herói por tela | `numeroGigante` 112 → 61 (modo treino, treino em andamento), `numeroCronometroTela` 96 → 61, descanso 49, "60 kg"/"214" 49. No Início, o "2" da semana desceu para 31, e o título do treino de hoje (31) é o herói. |
| Número : unidade ≤ 2,5 : 1, na linha de base | "12" de 61 com "repetições" de 25; "60" de 49 com "kg" de 20; "214" de 49 com "de 350 vinculados" de 20. |
| Visual ≠ área de toque | Grupo `controle`: primário 48, secundário 40, ícone 40, marcar série 40, +/− 36, chip 32, máximo 56. A área de 48 é um `::before` transparente centrado (no app, `hitSlop`). Os chips ganharam 16 entre linhas para a área não invadir a de baixo. |
| Barra de abas 56, deslizar 56 | `altura-barra-abas` 64 → 56; deslizar 64 → 56 (botão 48); "+" central 56 → 48. |
| Botão 2,5–3× o texto; ícone 0,5–0,6× | Primário 48 com texto 16; secundário 40 com 16; a seta do "Começar" do Início foi de 40 para 28 dentro do botão de 48. |
| Foto herói ≤ 45 % da altura útil | `imagem.heroi` 440 → 340. |
| Linha de série 20, valor editado 25 | `numeroSerie` 20 (novo) nas linhas fora de edição; `numeroCarga` 25 no campo +/−. |

**Documentos**:
- `00-PRINCIPIOS.md`: o princípio 2 passou a ser "proporção planejada; legível a um braço de distância sem gritar", e o 1 separa desenho e área de toque.
- `01-TOKENS.md`: as seções 1.8.0 e 1.7.0, mais as tabelas de alvo/controle e de tipografia.
- `02-COMPONENTES.md`: uma caixa no topo, que vale sobre qualquer medida antiga, mais as tabelas do botão e do campo +/−, a linha de série, a barra de abas, o deslizar, o cronômetro, os chips e o herói.

**No PDF**, a direção de arte A/B/C aparece como histórico, com a nota de que a proporção foi revista.

**Antes × depois** (iPhone 16, moldura real; no PDF, página 18):

| Tela | Antes (1.6.0) | Depois (1.8.0) |
|---|---|---|
| Treino em andamento (escuro) | `docs/apresentacao/_capturas/antes-treino-escuro.png`: "12" de 112, séries de 40, marcar e +/− de 56 | `depois-treino-escuro.png`: "12" de 61 + 25, série 20, edição 25, marcar 40, +/− 36 |
| Modo treino | `antes-modo-treino.png`: "12" de 112, título de 28, "Série feita" de 64 | `depois-modo-treino.png`: 61 e 25, botão de 48, +/− 36 |
| Início (claro) | `antes-inicio-claro.png`: o "2" da semana (72) disputa com o treino | `depois-inicio-claro.png`: o treino de hoje é o herói; a semana desce para 31 |

Olhei as três em 393 (moldura real) e as páginas a 2040 × 790, comparando com as refs 01, 03, 05 e 06: lá o número grande aparece **um** por tela (o "0:28", o "15", o "7 Days"), e é assim que ficou.

## 3. Revisão da interface (`better-interface`, modo completo)

**Escopo**: `index.html`, `entrada.html` e `novas.html` (HTML e CSS puros, tokens do `tokens.json`). Telas: as 6, as 15 da entrada e os 7 quadros, nos dois temas, nas 4 molduras, a 100 % e a 160 %, com e sem transparência. Estados vazio, carregando e erro das amostras.

**Cobertura**: as seis skills foram carregadas.

| Domínio | O que olhei | Resultado |
|---|---|---|
| Acessibilidade | alvos (área efetiva), nomes, h1, foco, 160 %, "Reduzir transparência" | 5 achados, corrigidos |
| Layout | molduras a 2040 × 790, insets, rolagem, grupos | 4 achados, corrigidos |
| Texto | nomes de treino, jargão, termos | 2 achados, corrigidos |
| Tipografia | escala, altura de linha, unidade, palavras longas | 3 achados, corrigidos |
| Cores | logo × abertura, ilustração, véu da entrada | 3 achados, corrigidos |
| Acabamento (UI) | conjunto de ícones, reflexo, chaves da página | 3 achados, corrigidos |

**Achados e correções** (a regra de proporção e as trocas do S estão nas seções 1 e 2):

| # | Grav. | Domínio | Onde | Antes | Depois |
|---|---|---|---|---|---|
| 1 | ALTA | Layout | `index.html`, `novas.html`, `entrada.html` › `ajustar()` | moldura cortada embaixo a 2040 × 790 | desconta tudo acima da 1ª fileira; topo em uma linha |
| 2 | ALTA | Acessib. | `entrada.css` › `.o-conteudo` | a 160 % os blocos encolhiam (flex) e o texto vazava do vidro e passava por cima do outro ("Quem pode ver") | `flex-shrink: 0` nos filhos; a coluna rola |
| 3 | ALTA | Acessib. | `novas.css` › `.p-treino__palco` | a 160 % no iPhone SE, "Peito · 15 kg" e o título subiam por cima da barra do treino | `flex: 1 0 auto` + `justify-content: safe flex-end`; colunas que rolam não encolhem |
| 4 | ALTA | Layout | `entrada.html`/`entrada.css` | conteúdo da entrada embaixo do indicador de início; sem `celular__inset-topo`, ilha nem indicador na abertura | espaçador do inset fora da rolagem; o topo vira inset do sistema; ilha e indicador em toda tela |
| 5 | MÉDIA | Cores | `logo/a-barra-*.svg` | logo `#006B5F`, abertura `#007761` | os dois `#007761` |
| 6 | MÉDIA | Cores | `sistema.css` › véu da entrada (claro) | título de 39 (62 a 160 %) sobre a parte escura da foto: 1,3:1 | véu fecha mais cedo com fonte ampliada e no iPhone SE; título com teto 49 |
| 7 | MÉDIA | Acabamento | as três páginas | ícones provisórios de traço 2 misturados com os do R; dois sprites diferentes | um sprite só (o do R, 2,25), embutido por script |
| 8 | MÉDIA | Layout | `novas.css` | duas barras de abas diferentes no mesmo app | a encostada do sistema |
| 9 | MÉDIA | Tipografia | `novas.css` | `font: … /1` em 20 regras (linha igual ao tamanho, texto de várias linhas encostado) | cada tamanho com a sua linha da escala |
| 10 | MÉDIA | Texto | `index.html` | "Push / Pull / Legs", "Emagrecer", "HIIT esteira" com foto de corda, durações inventadas | os nomes e números do catálogo |
| 11 | MÉDIA | Acessib. | `novas.css`/`entrada.css`/`sistema.css` | desenho menor sem área de toque (depois da 1.8.0) | `::before` de 48 em 28 seletores; auditor mede a área efetiva |
| 12 | MÉDIA | Layout | `novas.css` › fotos do topo, modo treino, comemoração | margem negativa e preenchimento com o inset (54, 58, 62, 46 px fora da escala de 4) e foto de altura fixa que empurrava o texto para baixo da ilha a 160 % | o inset como posição/espaçador; foto com `min-height` |
| 13 | MÉDIA | Acessib. | `novas.css` › `.p-avatar`, `.p-series i`, `.selo-plus` | caixas fixas que cortavam a letra a 160 % | crescem com a linha |
| 14 | BAIXA | Tipografia | `.titulo-1/2/3` | "acompanhamento" vazava da folha a 160 % | `hyphens: auto` |
| 15 | BAIXA | Acabamento | `sistema.css` › `.reflexo` | o reflexo do Plus terminava à direita e alargava a rolagem do botão | volta à esquerda (`backwards`) |

Também corrigidos, menores:
- a cor selecionada das chaves da entrada (marca) diferente das outras páginas (viva);
- 6 traços no modo treino para 7 exercícios;
- a seta de 40 dentro do botão de 48;
- o ponto do sino fora do lugar depois do botão de 40;
- "Treino do dia" → "Treino em andamento" nas legendas;
- o ícone de destaque da galeria do R na cor nova.

**Considerados e rejeitados**:

| Onde | Candidato | Por quê |
|---|---|---|
| Barra de abas, `i-plus` × `i-inicio` | os dois são "barra com anilhas" e se parecem de longe | o Alex pediu o haltere na horizontal; o braço vertical do "+" e o degrau do haltere separam os dois em 16 px (conferido), e o rótulo está sempre escrito |
| `corpoPequeno` 13 | voltar a 14 para o apoio de linha | a escala fechada não tem 14; 13 passa no contraste e é o "legenda" da regra |
| "Treinos prontos" (31) e "ABC Hipertrofia" (31) na mesma tela | baixar um dos dois | o título grande do iOS é cabeçalho, não herói; nenhum chega a 49 |
| Nota longa do topo a 2040 × 790 | manter visível | custava a moldura inteira; a galeria já tem o próprio texto |
| Chaves da página com 40 de desenho | voltar a 48 | é ferramenta de mesa, com área de toque de 48 pelo `::before` |

**Verificação**: `auditar.mjs` (seção 4), capturas por Playwright em 393 e 2040 × 790, 160 % no iPhone SE e Pro Max, e as páginas do PDF uma a uma. **Veredito**: Approve, com as pendências da seção 6.

## 4. Auditoria (`auditoria/auditar.mjs`)

**O que entrou**:
- `entrada.html` e `novas.html` em todas as janelas (360 a 2040 × 790), nos 4 iPhones, a 1440 e 2040 com o iPhone 16, e "sem transparência" a 393 e 2040;
- `--pagina=mockup,novas` para medir uma página só.

**Regras novas**:
- tamanho fora da escala fechada;
- **mais de um texto ≥ 49 visível na mesma tela**;
- controle interativo com **mais de 56 de desenho** (na fonte padrão; ficam de fora linhas, cartões, abas, campos e o gráfico);
- **área de toque efetiva abaixo de 44**, medida com o `::before`.

**Medida do P trazida para dentro**: contraste contra o pior pixel também nas superfícies da entrada (`.o-tela`) e das telas novas (`.p-capa`, `.p-foto`, `.p-hero`, `.p-treino`, `.p-ativos`, `.p-comemoracao`, `.vidro--escuro`). Antes da foto, a moldura entra na tela e os efeitos disparados ao aparecer (a comemoração) são levados ao fim.

**Ajustes de medida**, cada um com o motivo no código:
- o `<h1>` só para leitor de tela não conta;
- o conteúdo de `<details>` fechado não está na tela;
- as barras do gráfico com `tabindex` são paradas de teclado, e o alvo do dedo é o gráfico inteiro;
- a academia aceita de 3 a 5 abas, conforme o papel.

```
node 02-design/sistema-de-design/auditoria/auditar.mjs
```

**Resultado final**: **0 achados** em **260 combinações** (index 96, entrada 60, telas novas 60, logo 44), com **19.322 medições de contraste contra o pior pixel** e nenhum erro de script. As capturas em `auditoria/capturas/` e o `resultado.json` foram refeitos.

A sequência: 1.137 achados no index logo depois da proporção, e 11.900 na primeira passada da entrada e das telas novas (que nunca tinham passado pela auditoria). Depois vieram 232 achados, 1.180, 4 e, por fim, 0.

## 5. O PDF

`docs/apresentacao/saida/Academia Plus - Ideia, estrutura e design.pdf`: **45 páginas**, gerado por `capturar.mjs` (86 capturas e 39 cópias), `montar.mjs` (sem nenhum aviso) e `folhear.mjs`. Olhei as páginas uma a uma.

**O que mudou**:
- As 6 referências e o que se manteve das regras (p. 16).
- Os princípios e as medidas da 1.8.0 (p. 17).
- **Antes × depois** da proporção (p. 18).
- Componentes, as seis telas e o escuro, recapturados.
- A abertura e as duas portas, no claro e no escuro (p. 23–24).
- As telas novas, o modo treino e a comemoração, e o escuro (p. 25–27).
- Ícones e ilustrações, com a lista do que falta desenhar (p. 28–30).
- **O catálogo de treinos prontos, com o aviso de revisão por profissional com CREF** (p. 31).
- A direção de arte A/B/C como **histórico** (p. 32–33).
- As fotos coerentes com o assunto (p. 34).

**Ajustes de texto**:
- cores da marca (Parte 8);
- capa e sumário;
- pendências (a direção de arte resolvida; quem revisa o catálogo; o "+" central; a entrada; onde mora a Evolução);
- próximos passos e números do "já está pronto";
- arquitetura: as duas portas escolhem o caminho do cadastro, não a visão.

**PNG apagados**: as páginas renderizadas para conferir (`_capturas/_pdf/`) e 36 arquivos de `_capturas/` que o PDF não usa mais (capas e miniaturas antigas, quadros e telas fora do PDF). Ficaram só os que as partes citam; o `capturar.mjs` refaz o resto quando for preciso. As capturas de trabalho do agente Q, na área de rascunho, também foram apagadas.

## 6. Pendente

- **[decidir]** (do Alex): o "+" central (`?abas=mais`); quem revisa o catálogo (CREF); uma academia ou várias; nomes dos objetivos; entrada uma pergunta por tela ou "Sobre você"; "Dieta" ou "plano alimentar"; onde mora a Evolução; o logo; fotos da academia real.
- **O Alex olhar a proporção 1.8.0** no monitor dele e num celular de verdade, e o haltere da aba Início ao lado do "+" do Plus.
- **Ilustrações que faltam**: os 12 exercícios da seção 1, para o R.
- **No app**: `app/app.json` com `#006B5F` na notificação → `#007761`; `hitSlop` nos controles menores que 48; `expo-blur` (já registrado).
- **Treino em andamento × catálogo**: a página usa o dia A do ABC (7 exercícios, 20 séries), mas as repetições do supino inclinado continuam 12 (o catálogo pede 3 × 10). Ficou assim para não mexer no roteiro do clique ("marque a série 2").
- O mapa de telas no PDF (Parte 7) continua contando as 55 telas da v1; a entrada (Parte 1b) e as telas novas (Parte 6) estão no `04-MAPA-DE-TELAS.md`, mas não no desenho da Parte 7.
- O comparativo de logo mostra B e C também no verde novo, porque a página usa uma variável só; os arquivos de B e C ficaram como estavam.
