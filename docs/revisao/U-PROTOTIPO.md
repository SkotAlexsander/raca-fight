# U — Protótipo: bugs de interação (P10, 11/10/2026)

Agente U. Escrevi só em `02-design/sistema-de-design/mockups/index.html`, `entrada.html` e `novas.html`, na parte de script e nos atributos de acessibilidade. Não mexi em CSS, cor, tamanho, texto visível, imagem nem layout (o design está congelado). Nenhum **[decidir]** foi resolvido. Não há `.js` separado: os scripts são os `<script>` das três páginas.

## Como exercitei

Usei o Playwright do `.ferramentas` (Chromium padrão). Os scripts ficaram no rascunho da sessão (`scratchpad/u-prototipo/`):
- `ex-index.mjs`, `ex-entrada.mjs` e `ex-novas.mjs` fazem cada interação e conferem o estado depois, com movimento normal e reduzido, com mouse, teclado e toque (o toque via CDP);
- uma instrumentação conta os `setTimeout`/`setInterval` pendentes, os laços de `requestAnimationFrame` vivos, os listeners e as animações (WAAPI);
- o **axe-core** roda nas três páginas.

As combinações testadas foram estas:
- **Seletores** trocados no meio do efeito: o aparelho, o tema e o movimento com o anel do descanso rodando e com a abertura no meio. Mais a foto, a transparência, a fonte de 160 %, `?abas=mais`, `?moldura=real`, `?tema=` e `?aparelho=`.
- **Efeitos repetidos** de 5 a 10 vezes seguidas: abertura, comemoração, fechar treino, anel, esqueleto, Plus e troca de fase.

**Antes**, os três roteiros deram **46 falhas**: 26 no index, 11 nas telas novas e 9 na entrada. Em nenhuma das três páginas apareceu erro de console.

**Depois**, deram **0 falhas**. Também não sobrou laço de rAF depois que o cronômetro para, nenhum `setInterval` fica vivo e as animações não se acumulam quando um efeito é repetido.

## Bugs e correções

### index.html

| # | Interação | Como reproduzir | Correção |
|---|---|---|---|
| 1 | Desfazer série pelo toast | Tela 1: marcar a série 2 e tocar em "Desfazer" no toast. A série volta, mas o anel do exercício continua em "2 de 3". | O anel passou a ser atualizado dentro de `alternarSerie()`, de onde o toast e o "Repetir" também passam. Antes, só o clique no botão da linha atualizava o anel. |
| 2 | Foco depois do "Desfazer" | Tocar no "Desfazer" do toast pelo teclado. O toast some e o foco cai no `body`. | O foco vai para o botão da série desfeita. Se o toast some sozinho (5 s) com o foco dentro dele, o foco vai para o mesmo lugar. |
| 3 | "Desfazer" do toast que já vem na página | A página abre com o toast "Série 1 feita". O "Desfazer" dele não fazia nada (não havia `_linha`). | Sem `_linha`, a série é a do número escrito no toast. |
| 4 | "Repetir" da série marcada | Na seção Efeitos, clicar em "Repetir" duas vezes seguidas (menos de 400 ms entre os cliques). A série termina **desmarcada**: dois timers agendavam duas inversões. | Um timer só, cancelado a cada clique, e a remarcação confere o estado antes de alternar. |
| 5 | Pausar e pular o descanso da faixa | Marcar uma série (o descanso de 1:30 começa a correr) e tocar em "Pausar descanso" ou "Pular descanso". Nenhum dos dois fazia nada. | A faixa virou um motor com instante de fim. "Pausar" para a contagem e vira "Retomar descanso", com o ícone de começar. "Pular" encerra e mostra "Descanso terminado · Próxima série". A faixa congelada da página (0:45) pausa onde está. |
| 6 | Rótulo do timer da faixa | Com o descanso correndo, o `role="timer"` continuava dizendo "45 segundos restantes" ao leitor de tela. | O rótulo acompanha cada segundo, com ", pausado" quando a faixa está pausada. |
| 7 | Rótulos do placar | Marcar uma série: o placar mostra 7/20, mas o grupo e a barra diziam "6 de 20" ao leitor de tela. | O grupo e a barra (agora `role="progressbar"`, com `aria-valuenow` e `aria-valuetext`) são atualizados junto. |
| 8 | Deslizar para começar, teclado | Focar o deslizar, apertar Enter, e apertar Enter de novo 1,5 s depois. Cada Enter agendava mais uma volta: o próximo "Treino começou" era cortado no meio. | `concluir()` ignora o deslizar que já está feito, guarda o timer da volta, e a tecla segurada (`e.repeat`) não repete. |
| 9 | Deslizar, gesto tomado pelo sistema | Arrastar com o dedo e o navegador assumir a rolagem (`pointercancel`). O botão ficava preso no meio do trilho, com a classe `deslizar--arrastando`. | Os handlers de `pointercancel` e `lostpointercapture` devolvem o botão. O botão direito do mouse não arrasta. |
| 10 | Folha do + central (`?abas=mais`) | Abrir a folha e apertar Esc: nada acontecia. O Tab saía da folha para a página atrás. Ao fechar, o foco caía no `body`. | Esc fecha a folha, o Tab fica preso dentro dela, o foco volta ao + e o diálogo ganhou `aria-modal="true"`. |
| 11 | Troca de aba | Tocar em "Treinos" na tela 1: a aba nova ficava com o ícone de contorno, e "Início", inativa, continuava com o cheio. | O ícone `-cheio` passa para a aba ativa, e a anterior volta ao contorno. |

### novas.html

| # | Interação | Como reproduzir | Correção |
|---|---|---|---|
| 12 | Links "#" das telas (cartões, atalhos, quadros do dono, "Próximo", sino) | Rolar a página e tocar num cartão. A página voltava ao topo e a URL ganhava "#". | Os `a[href="#"]` dentro das molduras fazem `preventDefault`. |
| 13 | Trocar de aba | Tocar numa aba: não trocava (no index troca) e ainda pulava para o topo. | O mesmo comportamento do index: `aria-current`, ícone cheio e a pílula com 200 ms (com movimento reduzido, esmaecer de 160 ms). |
| 14 | Dispensar aviso | Dispensar o aviso pelo teclado: o foco caía no `body`. | O foco vai para o próximo controle da tela. |
| 15 | Anel do descanso (+30 s depois de zerar) | Tocar em "Série feita" (1:00), depois em −30 duas vezes, que zera, e então em +30. O anel mostrava **1:00**: o restante parado guardava os 45 s antigos. O mesmo acontecia quando o descanso acabava sozinho. | Ao chegar a zero, o restante parado também zera. O `total = 60` passou para antes de `iniciar()`, para o primeiro quadro não sair na escala velha. |
| 16 | Dica do gráfico com a moldura reduzida | Na janela de 2040 × 790 (zoom 0,64), focar o último ponto da carga. A dica saía **73 px** à esquerda do ponto e alguns px acima. | `left` e `top` passaram a ser divididos pelo zoom efetivo do cartão (`largura na tela ÷ offsetWidth`). Antes só o `left` era dividido, e pelo `zoom` do próprio alvo, que vale 1. Agora fica centrada nas duas molduras (dx 0). |
| 17 | Gráfico no toque | Tocar num ponto e arrastar o dedo pelo gráfico: a dica ficava presa na 1ª semana, porque o navegador prende o ponteiro de toque. A dica sumia ao soltar. | No toque, a captura implícita é liberada, o gráfico tem `touch-action: pan-y` (em `style`, sem efeito visual) e a dica fica depois de soltar. Tocar fora do gráfico esconde a dica. |
| 18 | Gráfico no teclado | Com o foco num ponto, as setas não faziam nada: era preciso passar pelos 13 pontos com Tab. | ←/→/↑/↓, Home e End andam entre os pontos. |
| 19 | Gráfico no leitor de tela | O `<svg role="img">` tornava mudos os 28 pontos focáveis (os filhos de `img` são apresentacionais), e o `aria-label` em `<rect>` sem papel é proibido. | O svg virou `role="group"`, com o mesmo rótulo-resumo, e cada ponto ou barra virou `role="img"` com o valor. |

### entrada.html

| # | Interação | Como reproduzir | Correção |
|---|---|---|---|
| 20 | Opções de objetivo e de papel (`role="radio"`) | Tocar noutra opção: a marcada não mudava. As setas não andavam e as 5 opções ficavam no Tab. | O padrão radiogroup: o toque marca só aquela opção, as setas, Home e End andam e marcam, e só a marcada fica no Tab. |
| 21 | Chave "Quem pode ver" (`role="switch"`) | Tocar na chave, ou apertar espaço: não alternava. | Clique, espaço e Enter alternam o `aria-checked`. O visual já seguia esse atributo. |
| 22 | Dias por semana | − e + não mudavam o "3". | O número vai de 1 a 7, com `aria-live`, e a semana de exemplo embaixo acompanha (3 dias = seg, qua, sex, como a página abre). |
| 23 | "Esqueci a senha" | Tocar no link: a tela de destino parava embaixo do topo fixo (topo da tela em 0 e o topo fixo até 171 px). | A rolagem desconta o topo fixo, a tela recebe o foco e a rolagem é suave, menos com movimento reduzido. |

### Acessibilidade nas três páginas

| # | Onde | Problema | Correção |
|---|---|---|---|
| 24 | As 28 molduras `.celular` (index 6, novas 7, entrada 15) | `role="img"` com `aria-label` "Tela: …". Com isso, **todos** os controles das telas (88 no index, 116 nas novas, 53 na entrada) eram focáveis, mas mudos para o leitor de tela (axe: `nested-interactive`). | `role="group"`, com o mesmo rótulo. |
| 25 | index: linhas de série | `aria-label` em `div` sem papel, que o leitor ignora. | `role="group"` nas três. |
| 26 | index: o "12" gigante | `aria-label` em `span`, ignorado. | O rótulo saiu. O texto visível "12 repetições" é lido como está. |
| 27 | index: o campo "Carga" (`role="spinbutton"`) | Não tinha nome. | `aria-label="Carga"`. |
| 28 | index e novas: barras de abas | Seis "Navegação do aluno" iguais na lista de regiões (axe: `landmark-unique`). | O script acrescenta "(tela N)" ao rótulo. O "aluno" e o "academia" continuam no texto, que é o que a auditoria lê. |
| 29 | novas: "2 de 4" da semana e "12 repetições" do modo treino | `aria-label` em `<p>` sem papel. | `role="img"`. O ± das repetições atualiza esse rótulo de propósito. Antes ele usava `closest('[aria-label]')`, que pegaria a moldura se o rótulo saísse. |
| 30 | entrada: traços do passo ("Passo 1 de 3") | `aria-label` em `div` sem papel. | `role="img"`. |

**O que sobrou no axe**: `color-contrast` na hora "9:41" da barra de status, na tela 1 do index. É falso positivo. O elemento é `aria-hidden` e branco sobre a foto escura; o axe não enxerga a foto e mede contra o fundo da página. O contraste real é medido pelo `auditar.mjs`, contra o pior pixel.

## O que conferi e estava certo

- A abertura (entrada) e os seletores:
  - repetida 6 vezes, com o aparelho e o tema trocados no meio, termina nas boas-vindas;
  - a abertura não acumula animações;
  - no iPhone SE, o símbolo chega ao selo com diferença de 0–1 px;
  - trocar o movimento no meio não a deixa presa;
  - `?tema`, `?foto`, `?aparelho` e `?moldura=real` entram e saem da URL certos, e os links do topo levam a URL junto.
- Os efeitos do index:
  - fechar treino, anel, esqueleto, Plus e troca de fase, repetidos 5 vezes, deixam 1 laço de rAF, nenhum timer sobrando e nenhuma animação a mais;
  - o anel continua rodando, num laço só, depois de trocar o tema, o aparelho e o movimento;
  - o título grande encolhe e volta.
- A comemoração das telas novas, repetida 10 vezes, não acumula animações; o estado final fica visível depois de trocar o movimento.
- **Movimento reduzido**: todo efeito testado vira esmaecer ou salto por segundo.

**Inertes de propósito** (botões de mockup sem comportamento; não são bug e não mexi):
- "Pausar o cronômetro" e "Parar" da tela 5: o cronômetro intervalado é um quadro parado, e o anel vivo está nos Efeitos;
- "Pausar o treino", ± de carga e "Desfazer" do painel do descanso (novas);
- "Mostrar a senha", "Voltar" e os chips de filtro ou período.

## Comparação visual

`capturar.mjs` (rascunho) tira a página inteira em 19 combinações, antes e depois:

| Páginas | Combinações |
|---|---|
| As 3 páginas | claro e escuro a 2040 × 790 |
| As 3 páginas | claro e escuro a 393 × 852 com `?moldura=real&aparelho=iphone-16` |
| As 3 páginas | escuro, iPhone SE, movimento reduzido, sem transparência, fonte 160 % |
| As 3 páginas | claro a 1440 × 900 com `?abas=mais`, iPhone 16 Pro Max, movimento reduzido |
| Entrada | `?foto=alternativa` |

As capturas foram tiradas assim:
- espera de 6,5 s;
- as animações finitas levadas ao fim;
- a rolagem até o fim, para a comemoração disparar.

Antes de corrigir, rodei a captura duas vezes: **0 diferença**, então a captura é determinística. Depois das correções, comparei com `comparar.py` (PIL, diferença por pixel): **19 de 19 iguais, 0 pixel diferente**.

## Auditoria

`node 02-design/sistema-de-design/auditoria/auditar.mjs` (a rodada completa, com capturas, que refez `auditoria/capturas/` e o `resultado.json`): **0 achados**, saída 0, com 19.322 medições de contraste contra o pior pixel.

## Pendências e observações (sem correção, por serem visuais ou [decidir])

- `?abas=mais` só existe no index. O link do topo leva o parâmetro para `novas.html`, que não tem o "+" central. Pôr o + lá é mudança visual e depende do **[decidir]** do "+".
- A entrada não tem a chave de fonte no topo. Ela respeita os 160 % escolhidos nas outras páginas, mas acrescentar a chave mudaria o topo.
- A 393 px com `?moldura=real`, a página fica com 405 px de largura (12 px de rolagem lateral), porque a moldura mais as bordas passam da janela. Isso é layout e não é meu.
- O "Pausar" da faixa troca o ícone para "começar" quando pausado. É o único desenho novo, e só aparece depois do toque. Usa um ícone que já estava no sprite.
