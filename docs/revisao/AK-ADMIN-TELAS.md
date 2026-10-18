# AK — Telas do admin (P12, onda 2, 15/10/2026)

> Agente AK. Desenhei o app do dono da Raça Fight: o PC em 2040 × 790 e o celular, no tema escuro (o principal) e no claro.
>
> **Escrevi em:**
> - `02-design/sistema-de-design/mockups/admin.html` e `admin.css`;
> - `mockups/admin-capturas/`: 100 PNG, o `capturar.mjs` e o `LEIA-ME.md`;
> - uma linha na lista de páginas do `auditoria/auditar.mjs`;
> - este relatório.
>
> **Não mexi** em `tokens.json`, nos mockups do AL, em `app/`, em `01-especificacao/` nem em `docs/apresentacao/`.

## 1. O que foi entregue

**`admin.html`** é o app inteiro em 24 quadros. Cada quadro é uma tela do tamanho da janela, e a página pode ser usada de dois jeitos:

- **Prancha** (sem parâmetro): os quadros ficam um embaixo do outro. É o modo que a auditoria e as capturas usam.
- **App** (`admin.html?tela=financeiro`): mostra uma tela só e navega pela barra lateral. Os parâmetros `?tema=claro` e `?movimento=reduzido` também valem.

**A moldura** é montada por script a partir de `data-secao`, `data-sub` e `data-titulo`:
- **barra lateral preta**, nos dois temas, com:
  - o logo;
  - a faixa vermelha "ADMIN", com a ponta da faixa do logo;
  - as seções, com as subseções da seção aberta;
  - as contagens;
  - o tema e quem está logado;
- **topo de uma linha**, com:
  - o título;
  - o mês;
  - a **busca global** (Ctrl+K);
  - **Filtro** (/), **Anotar** (N) e **Lembrar** (L);
  - "Salvo às 10:42";
- **no celular**: a barra de baixo Painel · Pessoas · Finanças · Agenda · Mais.

| # | Quadro (`data-captura`) | O que cumpre do pedido |
|---|---|---|
| 1 | `painel` | **Cabe em 2040 × 790 sem rolar.** Tem 3 colunas (a direita se divide em 2 na tela larga). O herói é o resultado até hoje, com a previsão do fechamento ao lado. Cada número abre a lista que o forma. |
| 2 | `financeiro` | **A planilha**:<br>• a célula em edição;<br>• 3 linhas selecionadas, com a barra de lote e a soma;<br>• as linhas de mensalidade geradas, com "Marcar como paga";<br>• os totais por coluna, fixos embaixo;<br>• o aviso "Desfazer (Ctrl Z)";<br>• a barra de status com os atalhos.<br>No celular, vira **lista por dia**. |
| 2b | `financeiro-colar` | O Ctrl+V de 20 linhas: 18 prontas e 2 com erro, cada erro dito na própria célula. Nada é gravado antes de confirmar. |
| 2c | `financeiro-fechado` | Setembro **com o cadeado**: só leitura, os totais congelados, "Reabrir setembro" e o aviso "nada foi mudado". |
| 2d | `financeiro-folha` | Celular: o lançamento editado **numa folha** que sobe. |
| 3 | `cobrancas` | A lista do mês e a gaveta **Marcar como paga** (data, forma, valor; "pagamento parcial não é aceito"). |
| 4 | `pessoas` | **Filtros cruzados** à esquerda (salvos, situação, modalidade, cobrança, plano, desconto), a frase do filtro com os chips e a tabela. |
| 4b–d | `ficha-aluno`, `ficha-kids`, `ficha-funcionario` | Ficha completa do **aluno**; do **responsável Kids**, com os 2 dependentes e o desconto de família; do **funcionário**, com a remuneração do mês calculada e "Lançar como saída". |
| 5 | `importar` | **Conferir colunas**: o papel proposto para cada coluna, com um seletor e o exemplo da 1ª linha; a prévia em grupos (prontas, aviso, repetidas, erro); "Criar estas categorias?". |
| 6 | `relatorios`, `relatorio-ano`, `inadimplencia`, `exportar` | Relatórios:<br>• por modalidade (o combo conta a metade), por professor e por evento;<br>• os 12 meses;<br>• quem deve, com a mensagem do WhatsApp pronta;<br>• a exportação CSV, com a prévia do Excel. |
| 7 | `funil` | As 4 colunas, "Chamar de volta" e a conversão por origem. |
| 8 | `agenda`, `notas`, `despesas-fixas` | Hoje (atrasados, hoje, em breve), o calendário com as repetições, as tarefas, as notas fixadas e o que se repete todo mês. |
| 9 | `historico` | O histórico **em frase**, com os rótulos humanos (seção 4). |
| — | `busca`, `filtro` | A busca global aberta sobre o painel e o filtro total aberto. |
| — | `estados`, `sem-permissao` | **Carregando** (esqueleto depois de 300 ms, 3 passadas), **vazio** (com caminho), **erro** e **sem conexão** ("nada foi gravado"), **salvando** ("Salvando…" → "Salvo às 10:42", e a célula pisca uma vez), **sem permissão**, dentro de um painel e na tela inteira. |

**Dados de exemplo:**
- os nomes de pessoas são **fictícios**, e os de `exemplo.ts` (Bruno, Carla, Fernanda, Davi, Elisa, Helena, Igor…) foram ampliados;
- as modalidades são as reais: Muay Thai, Boxe, Jiu-Jitsu, Luta Livre, MMA, e as turmas Kids;
- os valores são de exemplo e **fecham entre as telas**:
  - o painel, a planilha, a previsão, o relatório do ano e os inadimplentes somam igual;
  - 11 pessoas devem R$ 1.690,00;
  - outubro vai em R$ 8.467,60 até hoje e deve fechar em R$ 10.287,60;
  - setembro fechou em R$ 9.873,20.

## 2. A planilha funciona no teclado (testado no navegador)

Testei no modo app (`?tela=financeiro`), com o Playwright, sem erro de script:

| Tecla | Faz |
|---|---|
| ↑ ↓ ← →, Home, End, Ctrl+Home e Ctrl+End | andam (o foco é único: só a célula ativa tem `tabindex="0"`, o padrão de grade da ARIA) |
| Shift + setas | selecionam um intervalo |
| Shift+Espaço | marca a linha |
| Enter ou F2 | editam |
| começar a digitar | abre a edição com a tecla |
| Enter na edição | **grava e desce** |
| Shift+Enter | grava e sobe |
| Tab e Shift+Tab | gravam e andam para o lado |
| Esc | cancela ("nada mudou") |
| Ctrl+Z, Ctrl+Y e Ctrl+Shift+Z | desfazer e refazer, até 100 ações. **Colar 20 linhas é uma ação só.** |
| Ctrl+V | uma linha só vira o valor da célula; várias linhas com tabulação viram linhas novas marcadas, com o erro na célula |
| Ctrl+Enter | linha nova no topo, com o cursor na descrição |
| duplo clique | edita |

**O que a digitação entende** (as regras RA4.3):
- valor: "160", "160,00", "R$ 1.600" e "-20" (este vira saída);
- "12,345" é recusado como **ambíguo**;
- a data é conferida no calendário: "31/09" é recusada;
- a categoria entra pelo começo do nome, quando só uma bate;
- tipo e situação entram pela primeira letra.

A célula inválida mostra o erro e **não grava**. Os totais do rodapé se recalculam a cada gravação: mudar uma saída de R$ 240,00 para R$ 1.300,00 leva o resultado de R$ 8.467,60 a R$ 7.407,60.

**O mês fechado** recusa editar e colar, com o aviso "Setembro está fechado: nada foi mudado".

**O que é só desenho** é a gravação no servidor: "Salvando…" é simulado em 500 ms. A regra de verdade é do domínio (`grade.ts`, `fechamento.ts`), que o AM liga.

## 3. As regras do Alex, e como cada uma foi cumprida

| Regra | Como |
|---|---|
| Escala fechada 13 · 16 · 20 · 25 · 31 · 39 · 49 · 61 | O admin usa só **13, 16, 20, 25 e 31**, em rem, com a altura de linha do `tokens.json` (13/16, 13/18, 16/24, 20/26, 25/30, 31/38). A tabela usa 13 e 16. A auditoria confere cada texto, também a 160 %. |
| Um herói por tela; nada de número ou botão gigante | O herói do painel é o resultado do mês em **31** (Archivo 800). Nada passa de 31. Os botões têm 32 de desenho no PC, e o maior tem 40. Os outros heróis são 31 só na ficha e nos painéis de destaque, sempre um por tela (ver a nota sobre a previsão, na seção 4). |
| Toque invisível ≥ 48 no celular | Por `::before` em todo botão, link, célula ativa e campo:<br>• **48** abaixo de 1024 px;<br>• **44** no PC (o piso da auditoria).<br>O `select` não tem `::before`, então ele mesmo ocupa a caixa inteira, com 44 ou 48 de altura.<br>A linha da grade tem **36** no PC, e a célula ativa tem um contorno de 2 px na cor de foco (`#FF6B6B` no escuro, 5,17:1 sobre a linha; `#C42024` no claro). |
| Contraste medido | 0 achados de contraste nas 60 rodadas (ver a seção 6). Exemplos: branco sobre o vermelho da marca, 5,87:1; texto secundário do escuro sobre `#1C1C1C`, 7,59:1; verde "Pago" do claro (`#087033`) sobre a linha nova (`#FBE6E6`), 5,20:1. |
| Movimento reduzido = esmaecer de 160 ms | `prefers-reduced-motion` ou `data-movimento="reduzido"` trocam toda animação (gaveta, folha, aviso, lista suspensa, piscar da célula) por `opacity` em 160 ms. O esqueleto e o girando ficam parados. |
| Nada em loop | O esqueleto dá 3 passadas, e o girando dá 3 voltas. |
| Teclado completo na planilha | Ver a seção 2. |
| Número sempre com unidade; negativo com sinal **e** cor | A saída é sempre "−R$ …", em vermelho de erro, e a entrada é "+R$ …" em verde. O estado vem sempre escrito no selo ("Pago", "Pendente", "Atrasada 5 dias"), nunca só pela cor. |

**A identidade de luta, com moderação:**
- a barra lateral é preta da marca, com a textura diagonal dos cartazes a 2,5 % de branco;
- a faixa vermelha com ponta diz "ADMIN" (a ponta da faixa "FIGHT" do logo);
- tem um traço vermelho de 4 px:
  - no herói do painel;
  - na aba ativa;
  - na seção ativa da barra lateral;
  - no item escolhido da busca;
  - na barra de baixo do celular;
- o ícone de luva (do AL) está na faixa e no Funil.

Não usei **foto nem vidro sobre o dado** (`05-MAPA-DE-TELAS.md`). As imagens `admin-fundo-*` que o AL gerou ficaram de fora de propósito: numa tela de trabalho elas competem com o número. Se o Alex quiser, o lugar é a tela de entrada, nunca a planilha.

## 4. Os três problemas do domínio que o AR achou (para o AM corrigir em `app/dominio/financeiro/`)

As telas já evitam os três, mas o domínio ainda gera o dado errado:

1. **Comparação de meio mês contra mês inteiro** (`compararPeriodos` dentro de `resumoDoPainel`). Ela compara outubro até o dia 15 com setembro inteiro e dá "−30,94 %" nas entradas, o que engana o dono.
   - **Na tela**:
     - a comparação é **no mesmo período**: "1 a 15/09 × 1 a 15/10";
     - a coluna "Setembro inteiro" vem à parte, **sem percentual**;
     - e há a linha "Setembro fechou em R$ 9.873,20".
   - **No domínio**: `resumoDoPainel` deve comparar com o mesmo intervalo de dias do mês anterior. Nunca percentual de meio mês sobre um mês inteiro.
2. **Histórico com frase torta e nome interno** ("fechou o fechamento", `trancadaAte`). A tela usa frase e rótulo humano ("fechou setembro", "Desconto família: R$ 110,00 → R$ 99,00", "Dias para chamar de volta: 2 → 3").
   - **No domínio**: o `descreverRegistro` precisa:
     - do verbo por tabela (fechamento → "fechou setembro");
     - de um mapa de rótulos dos campos (`trancadaAte` → "Trancada até", `diaDeVencimento` → "Dia de vencimento", `valorCentavos` → "Valor"…).
3. **Descrição da mensalidade** "Boxe 2× — 2026-10". A tela mostra "Mensalidade outubro — Davi Lima", e o CSV de exemplo traz "Mensalidade outubro/2026 — …".
   - **No domínio**: `gerarMensalidadesDoMes` deve formatar a competência como "outubro/2026", nunca "2026-10". Isso também vale para o `exportarLancamentos`.

Mais um ponto do AR, que resolvi na tela:

4. **O resultado fica negativo até o meio do mês** no exemplo do domínio (o aluguel e os salários saem cedo). Por isso a **previsão do fechamento** foi para o mesmo bloco do resultado, ao lado dele:
   - o rótulo tem o mesmo peso;
   - o número é um degrau abaixo (25 contra 31), para não ter dois heróis;
   - a previsão por partes fica na coluna da direita.

   Se o Alex preferir os dois em 31, é trocar uma linha (`.ad-heroi--par dd`). Mas aí são dois heróis, contra a regra dele.

## 5. As cores: as variáveis do admin e o mapa para os tokens do AL

O `admin.css` não carrega o `sistema.css`, porque o AL está trocando os tokens agora. As cores estão declaradas no topo do `admin.css`, com os **valores** do `tokens.json` 2.0.0 (Raça Fight) e os **nomes** dos papéis. Assim, a troca é mecânica quando existir o gerador de CSS do admin (`03-arquitetura/05-ADMIN.md`, seção 9).

| Variável do admin | Token do AL | Escuro | Claro | Observação |
|---|---|---|---|---|
| `--rf-vermelho` | `cor.*.viva` / marca crua | `#C42024` | `#C42024` | marca |
| `--rf-preto` / `--rf-grafite` / `--rf-branco` | marca (`paleta.mjs › MARCA`) | `#1C1C1C` / `#343434` / `#FFFFFF` | iguais | |
| `--ad-fundo` | `cor.<tema>.fundo` | `#141414` | `#F5F5F5` | |
| `--ad-superficie` | `cor.<tema>.superficie` | `#1C1C1C` | `#FFFFFF` | |
| `--ad-elevada` | `cor.<tema>.superficieElevada` | `#262626` | `#FFFFFF` | |
| `--ad-texto` / `--ad-texto-2` | `texto` / `textoSecundario` | `#F5F5F5` / `#ADADAD` | `#1C1C1C` / `#545454` | |
| `--ad-borda` | `borda` | `#343434` | `#D6D6D6` | |
| `--ad-marca` / `--ad-marca-texto` / `--ad-marca-suave` | `marca` / `marcaTexto` / `marcaSuave` | `#FF6B6B` / `#1C1C1C` / `#3A1517` | `#C42024` / `#FFFFFF` / `#FBE6E6` | |
| `--ad-viva` / `--ad-viva-texto` | `viva` / `vivaTexto` | `#C42024` / `#FFFFFF` | iguais | botão primário, barra em destaque |
| `--ad-sucesso` | `sucesso` | `#67D283` | **`#087033`** | **o claro diverge**: o `#0A7E3A` do token dá 4,33:1 sobre a linha nova (`#FBE6E6`) e reprova; o `#087033` dá 5,20:1. Proposta ao AL. |
| `--ad-atencao` | `atencao` | `#FDA16B` | **`#A84700`** | **o claro diverge**: o `#B74D00` dá 4,31:1 sobre `#FBE6E6`; o `#A84700` dá 4,92:1 (e 5,40:1 sobre o fundo). Proposta ao AL. |
| `--ad-erro` | `erro` | `#FF8A80` | `#B3261E` | |
| `--ad-foco` / `--ad-trilho` / `--ad-regua` / `--ad-veu` | `foco` / `trilho` / `regua` / `sobreposicao` | iguais ao token | iguais ao token | |
| `--ad-lateral` (+ `-texto`, `-texto-2`) | **novo** | `#1C1C1C` | `#1C1C1C` | a barra lateral e a barra de baixo são pretas nos dois temas |
| `--ad-selecao` | **novo** | `#3A1517` | `#FDF1F1` | a linha selecionada na grade |
| `--ad-zebra` | **novo** | `#232323` | `#F5F5F5` | o cabeçalho e os totais da tabela |
| `--ad-barra` | **novo** (tokens › grafico?) | `#5C5C5C` | `#A3A3A3` | a barra de gráfico que não é o destaque |

## 6. A auditoria: 0 achados

```
node 02-design/sistema-de-design/auditoria/auditar.mjs --pagina=admin --sem-capturas
...
0 achados
```

**O que mudei no `auditar.mjs`:** só a lista de páginas, com uma linha: `{ nome: 'admin', arquivo: …/mockups/admin.html }`.

**O que a auditoria cobriu:**
- 15 rodadas, cada uma nos dois temas e com a fonte a 100 % e a 160 %, num total de 60 medições;
- as janelas 360, 390, 430, 768, 1280, 1440 e **2040 × 790**;
- os 4 iPhones e o "sem transparência".

A primeira rodada teve 20.742 achados. Quase todos eram o mesmo: a tabela larga rola por dentro, mas a régua só reconhece a rolagem dentro de uma das classes da lista `CAIXAS`. A solução foi pôr a classe `lista` nos invólucros que rolam (`.lista.ad-tabela-rola`, `.lista.ad-grade-rola`), sem mexer na régua.

**Outras classes que reuso da régua, de propósito:**
- `campo__caixa`: a caixa do campo é o alvo do `input`;
- `linha` e `cartao--tocavel`: são superfície de lista, não botão, e por isso o teto de 56 não vale para elas;
- `folha-moldura`: marca a camada por cima (gaveta, folha, lista suspensa, aviso e o rodapé fixo de totais), e por isso o texto dela não conta como "sobreposto" ao que está embaixo;
- `aba`: o item da barra de baixo.

**O que corrigi de verdade no caminho:**
- `select` com 21 px de altura;
- coluna da `.ad-principal` em `auto`, que estourava o celular a 160 %;
- itens que encolhiam em coluna flexível;
- margem de −1 px nas abas;
- verde e laranja do claro;
- os 5 estados em 5 colunas a 1280 px;
- rótulos dos 12 meses sobrepostos no celular a 160 % (no celular, um rótulo sim, outro não, e o mês atual sempre).

## 7. As capturas, e o combinado com o AR

São **100 PNG** em `mockups/admin-capturas/`, com o índice no `LEIA-ME.md`:
- `nome-pc.png` (2040 × 790, escuro);
- `nome-pc-claro.png`;
- `nome-celular.png` (390 × 844);
- `nome-celular-claro.png`.

Os nomes combinados estão lá: `painel-pc.png`, `financeiro-pc.png`, `pessoas-pc.png`, `painel-celular.png`…

O `capturar.mjs` do AR acha a tela pela **palavra do id** dele no nome do arquivo (`alunos`, `lancamentos`, `fechamento`, `relatorio-modalidade`…). Por isso:
- cada quadro tem `data-tela="<id do AR>"`, que é o caminho alternativo que ele documentou;
- o meu `capturar.mjs` grava também `<id>-pc.png` e `<id>-celular.png` quando o id é outro (por exemplo, `alunos-pc.png` é igual a `pessoas-pc.png`).

**Os 17 ids do AR têm captura:** painel, alunos, funcionarios, lancamentos, colar, cobrancas, despesas-fixas, fechamento, inadimplencia, importar, exportar, relatorio-ano, relatorio-modalidade, filtro, funil, agenda, historico.

**Aviso para o AR:** a palavra `painel` também casa com `painel-pc-claro.png` e `painel-celular.png`. Se a tabela `TELAS` dele pegar o primeiro que achar, ela deve preferir o `-pc.png`.

Para refazer as capturas: `node "02-design/sistema-de-design/mockups/admin-capturas/capturar.mjs"` (cerca de 1 minuto).

## 8. Para o AM (construção) e para o Alex

- **Componentes que o AM vai precisar** (`admin/src/componentes/`):
  - `Grade`, com o foco único, a edição, a seleção, o colar, o desfazer e o rodapé fixo;
  - `Frase do filtro` + `Chip`;
  - `Ficha`;
  - `Gaveta` (no PC) / `Folha` (no celular);
  - `Aviso com desfazer`;
  - `Selo`;
  - `Barras` e `Barra horizontal`.

  O JavaScript do `admin.html` é só um protótipo e não deve ser copiado. A regra é a do domínio (`grade.ts`: `editarCelula`, `colarNaGrade`, `registrarAcao`, `desfazer`).
- **[decidir] que as telas deixam à mostra, sem resolver:**
  - **A1**, papel administrativo: está no estado "sem permissão";
  - **A3**, multa e juros: "a academia não cobra";
  - **A8**, percentual de família: 10 % só no exemplo;
  - **A15**, os 3 dias do "chamar de volta";
  - **A17**, documento/CPF: não aparece em ficha nenhuma.
- **Para o AL:**
  - as duas cores do claro (seção 5);
  - um token para a barra de gráfico que não é destaque;
  - quando o logo original chegar, basta trocar o `<symbol id="logo-rf">` do `admin.html` (está marcado como provisório).
- **Achado de acessibilidade para o AM:** a tabela da grade usa `role="grid"` com `aria-selected` na linha e `aria-readonly` no mês fechado. No React, o anúncio do leitor de tela para "Salvo às…" e para o aviso deve ir por `aria-live="polite"`, e o erro da célula por `aria-invalid` + `aria-describedby`.
