# C — Responsividade e proporções

Agente C · 10/10/2026 · escrevi só em `02-design/sistema-de-design/`, em `02-design/marca-e-proposta/logo/` e neste relatório.

## Como medir de novo

```
node "02-design/sistema-de-design/auditoria/auditar.mjs"
```

Ele abre o mockup (`mockups/index.html`) e o comparativo de logo (`marca-e-proposta/logo/comparativo.html`) no Chromium, nas larguras **360 × 640, 390 × 844, 430 × 932, 768 × 1024, 1280 × 800, 1440 × 900 e 2040 × 790** (o ultrawide do Alex), nos temas claro e escuro, com a fonte a 100 % e a 160 %. Faz mais uma rodada do mockup com as amostras forçadas a **324 px** de coluna, que é a largura em que o PDF recorta cada amostra. São 120 combinações. No fim imprime **"0 achados"** (código de saída 0) e salva `auditoria/resultado.json` e as 28 capturas em `auditoria/capturas/` (uma por página, largura e tema, com a fonte a 100 %). `resultado-antes.json` é a mesma régua passada nos arquivos originais.

O que ele mede, com script (nada no olho):

- rolagem horizontal, e quem empurra a página;
- elemento que passa da caixa visual ou de um pai que corta;
- texto cortado sem reticências, ou com reticências onde a especificação não prevê;
- texto que vaza da caixa (pela altura de linha, não pela caixa da fonte);
- texto sobreposto (caixas de linha recortadas pelo que está visível);
- alvo de toque abaixo do token (48; série e +/− de execução 56; botão grande e circular 64);
- alvos sobrepostos;
- contraste de texto (4,5:1, ou 3:1 no texto grande) e de ícone (3:1). Componente desabilitado fica de fora, como manda a WCAG;
- imagem deformada (proporção do arquivo × proporção exibida);
- forma que devia ser quadrada ou redonda e não é;
- moldura do celular: a tela tem 390 × 844 e cabe na janela, na largura e, com a janela deitada, na altura que sobra sob o topo fixo;
- tela do celular herdando o alinhamento da página;
- margem, preenchimento e vão fora da escala de 4;
- tamanho e altura de linha fora da escala do `tokens.json`, a 100 % e a 160 %;
- títulos fora de ordem (h3 maior que h2 na mesma tela);
- abas das duas visões;
- os caminhos A, B e C do logo com a mesma disposição e o mesmo tamanho.

## Antes × depois

Achados somados nos dois temas. A rodada "amostra 324" é só do mockup.

| Janela | Mockup 100 % antes | Mockup 160 % antes | Logo 100 % antes | Logo 160 % antes | **Tudo depois** |
|---|---|---|---|---|---|
| 360 × 640 | 193 | 1025 | 96 | 124 | **0** |
| 390 × 844 | 175 | 1007 | 96 | 124 | **0** |
| 430 × 932 | 163 | 995 | 90 | 118 | **0** |
| 768 × 1024 | 171 | 1003 | 102 | 130 | **0** |
| 1280 × 800 | 173 | 1005 | 96 | 124 | **0** |
| 1440 × 900 | 183 | 1015 | 102 | 130 | **0** |
| **2040 × 790** | 183 | 1015 | 102 | 130 | **0** |
| amostra 324 px | 183 | 1015 | — | — | **0** |
| **Total** | | | | | **11 068 → 0** |

Por tipo (antes; cada achado é um elemento numa combinação):

| Tipo | 100 % | 160 % | Elementos distintos |
|---|---|---|---|
| tamanho fora da escala tipográfica | 14 | 7 700 | 210 (a 160 % quase nada crescia: tudo era px) |
| altura de linha fora da escala | 1 072 | 42 | 25 |
| espaço fora da escala de 4 | 592 | 802 | 28 |
| estoura o pai | 148 | 148 | 14 |
| moldura fora da proporção | 64 | 64 | 4 |
| alinhamento herdado | 64 | 64 | 4 |
| texto cortado | 38 | 38 | 3 |
| abas | 32 | 32 | 2 |
| moldura não cabe na janela | 32 | 32 | 4 |
| títulos fora de ordem | 16 | 16 | 1 |
| alvo de toque pequeno | 14 | 0 | 1 |
| alvos sobrepostos | 12 | 12 | 2 |
| contraste baixo | 8 | 8 | 1 |
| texto sobreposto | 2 | 2 | 1 |

## A troca das abas (10/10) no navegador

Conferi por script e na captura. **Aluno**: Início · Treinos · Plus · Perfil, nas telas 1, 2 e 4 e na amostra 12. **Academia** (dono que também é personal): Alunos · Treinos · Plus · Academia · Perfil, na tela 3 e na amostra 12. As abas têm a mesma largura: 97,5 px com 4 abas e 78 px com 5, na tela de 390. Só há uma aba ativa por barra.

Dois defeitos que a troca deixou:

- a legenda da tela 3 dizia **"4 abas"** com 5 na barra;
- a barra da academia, na amostra 12, não tinha `aria-current` na aba ativa.

Corrigi os dois.

## O que mudou

**Moldura e páginas**

1. **A tela do celular agora tem 390 × 844 de verdade.** A borda de 12 ficava por dentro, e a tela tinha 366 × 820. Os 2 cartões da grade apareciam com 161 px, não os 173 do documento. Em janela estreita a moldura encolhia por `aspect-ratio`, e o conteúdo era diagramado em 304 px, mais estreito que qualquer celular. Isso empurrava a 5ª aba para fora e cortava listas. Agora a moldura inteira encolhe por `zoom` (`--moldura-zoom`), e o conteúdo continua em 390.
2. **Ultrawide (2040 × 790) e janelas deitadas**: a moldura encolhe para caber na altura que sobra sob o topo fixo. No 2040 × 790 as 4 telas aparecem lado a lado e inteiras, sem rolagem: o zoom fica perto de 0,76. Em janela em pé só vale a largura. O piso é 0,5. Com `?moldura=real` na URL o zoom sai e a moldura fica com 414 × 868.
3. **Texto centralizado dentro dos celulares**: a tela herdava o `text-align: center` da legenda da galeria. "Treinos prontos", "Dieta de hoje" e as listas apareciam centralizados, contra o componente 13, que pede o cabeçalho grande alinhado à esquerda.
4. **Tela 3, títulos fora de ordem**: o h3 "Ana", de 28 px, era maior que o h2 "Ana Souza", de 22 px, do cabeçalho. Agora o cabeçalho diz "Perfil do aluno", e o nome é o h2 em `titulo1`, como pede o componente 9.

**Fonte do sistema**

5. **O texto acompanha a fonte do sistema.** A escala tipográfica do `sistema.css` passou para `rem` (valor do token ÷ 16). Espaço, alvo e moldura seguem em px, como no app. Antes, a 160 % nada crescia.
6. **Tetos de ampliação**: o cronômetro vai até 72 px, a carga até 1,5 × e o rótulo da aba até 1,3 ×. Os três viraram o token `tipografia.tetoAmpliacao`.
7. **Faixas de 130 % e de 160 %** (`tipografia.fonteAmpliada`): o script do mockup põe `data-fonte` conforme a fonte real da página. A partir de 130 %:
   - a grade de treino pronto vai a 1 coluna;
   - o título do cabeçalho vai até 2 linhas;
   - o "claro e escuro lado a lado" empilha.

   Acima de 160 %, o rótulo da aba some. No topo do mockup há agora os botões **Fonte 100 % / 160 %**.

**Celular pequeno e grades**

8. **Celular pequeno (< 390)** por container query: vale quando a coluna de conteúdo fica abaixo de 358 px (`layout.colunaCelularMedio`), dentro da moldura e das amostras. Ali entram:
   - carga de 32/40, cronômetro de 56/64 e `titulo1` de 24/30 (`tipografia.escalaCelularPequeno`);
   - a linha de série sem os +/−;
   - o cartão de treino pronto sem descrição;
   - o anel do cronômetro de 144.

   Antes, os +/− de 56 se sobrepunham ao botão de marcar série.
9. **Grade de 2**: quebra em 1 coluna abaixo de 150 px por coluna (`layout.larguraMinimaColunaCartao`). **Grade de 3 cartões de número**: quebra abaixo de 6,5 rem (`layout.larguraMinimaCartaoNumero`). Antes, "Não informado" estourava a 160 %.
10. **Coluna de amostra** de no mínimo 392 px: a coluna do celular, mais o preenchimento e a borda da caixa.
11. **"Claro e escuro lado a lado"**, o achado do agente do PDF: a 324 px as duas colunas transbordavam até 474 px. Agora só ficam lado a lado quando cada uma comporta a linha de série (15 rem); senão empilham. A rodada "amostra 324" do script pega isso: conferi voltando a regra antiga, e ela acusou de novo.
12. **Folha inferior** (amostra 14): era absoluta dentro de uma caixa de altura fixa e cortava "Concluir treino", "Assinar o Plus" e a legenda em tela estreita. Agora a sobreposição acompanha a altura da folha (`.folha-moldura--amostra`).
13. Paleta (`minmax` de 10 rem, nome e variável quebram) e escala tipográfica (rótulo de 10 rem e exemplo que desce) deixaram de vazar a 160 %. Esse vazamento empurrava a página para a rolagem horizontal em 768, 1280 e 1440.

**Escala de 4, linha, contraste e listas**

14. **Margens herdadas do navegador**: o h4 dos cartões de treino pronto tinha 24 px de margem em cima e embaixo, de padrão; o `figure` do comparativo, 40 px dos lados. Zerei as duas no reset.
15. **Fora da escala de 4**:
    - preenchimento do selo Plus: 10 → 12 (doc corrigido);
    - vão de 6 px no esqueleto da lista: 8;
    - ilha e gesto da moldura: 34 → 32 e 134 × 5 → 132 × 4;
    - no comparativo, botão 14 → 16, `mono` 6 → 8, legenda 6 → 8.
16. **Altura de linha herdada de 24 px** em texto de 12: número da série, "×", avatar, chip de visão, legendas da amostra de espaço. Agora cada um usa a linha do próprio degrau. O `code` caía para 11,4 px (o navegador encolhe a monoespaçada) e agora fica no tamanho do texto.
17. **Contraste**: o ícone de erro do toast no tema claro (toast invertido) tinha 2,71:1. No claro, os ícones de sucesso e de erro do toast usam a cor do texto do toast; a forma (check, alerta) carrega o sentido.
18. **Listas da academia**: nome e apoio quebram linha em vez de cortar com reticências, e a linha ganhou 8 de respiro (56/72 continuam mínimos). Em 360, "Sem cadastro corporal · treinou hoje" era cortado.
19. **Chip de visão**: tinha `height: 32` e `min-height: 48`, então o contorno aparecia com 48. Agora o desenho tem 32, num alvo de 48.

**Comparativo de logo**

20. **Comparativo de logo**: texto em rem com a escala do `tokens.json`, botão "Alternar tema" com 48 px (tinha 37), espaços de 4 em 4, página com no máximo 1 080 px. No ultrawide os logos não se espalham. Os caminhos A, B e C têm **a mesma grade (4 colunas; 2 no celular) e o mesmo tamanho**: o script compara posição e tamanho de cada peça e não há diferença acima de 1 px. A estrutura que o PDF captura (`section.caminho` 0 a 3, `alternarTema()`) ficou igual.

**Tokens e documentos**

21. **Tokens novos** no `tokens.json` (versão 1.1.0):
    - `tipografia.escalaCelularPequeno`, `tetoAmpliacao` e `fonteAmpliada`;
    - `layout.colunaCelularMedio`, `larguraMinimaColunaCartao` e `larguraMinimaCartaoNumero`;
    - `moldura` (tela, borda, raios, insets, ilha, gesto, `zoomMinimo`).
22. **Documentos corrigidos onde a medição desmentiu**:
    - `03-NAVEGACAO-E-LAYOUT.md` dizia que em 360 a linha de série cabia com os dois +/− e carga de 32. Não cabe, nem com um campo só: precisa de mais de 328 px. Agora segue o componente 6.
    - Também no `03`: o 173 px do mockup, a faixa de 130–160 % e as abas conferidas.
    - `02-COMPONENTES.md`: preenchimento do selo, listas que quebram, chip de visão 32/48, teto do rótulo da aba.
    - `04-COERENCIA-ENTRE-VISOES.md`: chip 32/48.
    - `01-TOKENS.md`: os tokens novos e a moldura.

## Para o agente do PDF (D)

- O mockup ficou íntegro e na mesma estrutura: `#telas .celular` (4), `#componentes .amostra` (17, na mesma ordem), `#tokens .paleta` e `#tokens .amostra` (0 e 1), `section.caminho` (4) no logo.
- **Atenção à escala**: a 1440 × 900 a moldura agora encolhe para caber na altura, com zoom de cerca de 0,88. A captura sai menor, na mesma proporção. Para a moldura em tamanho cheio, abra `index.html?moldura=real`.
- A amostra "Claro e escuro lado a lado" a 324 px agora empilha os dois temas, sem corte.

## O que ficou de fora, e por quê

- **Reticências previstas na especificação** não contam como achado, e o script imprime quantas são: 102 nas 120 combinações. São três casos:
  - título do cabeçalho em 1 linha (2 com fonte ampliada);
  - nome do exercício em 2 linhas;
  - descrição do treino pronto em 1 linha.

  É o que os componentes 5, 8 e 13 mandam. Se o Alex quiser "nunca reticências", é uma decisão de especificação, não de CSS.
- **200 % no 360** (o teste obrigatório do `05-ACESSIBILIDADE.md`): fora desta rodada, que o P05 fixou em 160 %. As regras de "acima de 160 %" já estão no CSS:
  - o rótulo da aba some;
  - o cronômetro trava em 72.

  O "campo +/− empilha" ainda não está; fica para a próxima rodada.
- **Cores e fontes da marca no mockup**: o mockup segue com os neutros do `tokens.json`, como o próprio sistema define. Trocar pelos valores do `tokens-marca.json` é outra tarefa.
- **Chips de informação empilhados** nos cartões de treino pronto, a 173 px por coluna: "Ganhar massa" e "50 min" não cabem na mesma linha. Não é estouro (eles quebram linha, como deve ser), mas o cartão fica alto. Proposta para B/especificação: no cartão em grade, mostrar só objetivo e duração.
- O texto dos SVG de wordmark usa a Figtree por nome. Uma imagem SVG não carrega fonte da web, então a letra sai na fonte de reserva. Isso já está anotado na página ("a versão final vira contorno").
