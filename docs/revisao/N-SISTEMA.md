# N — Sistema e telas atuais (P09, 10/10/2026)

Agente N. Escrevi só em `02-design/sistema-de-design/` e neste relatório. Nenhum **[decidir]** foi resolvido. Os outros agentes (O, P, R) podem usar o `sistema.css` e o `tokens.json` como estão: os nomes antigos de classe e de variável continuam valendo, e o que entrou é novo.

## 1. Tokens novos (`tokens.json` 1.5.0 → **1.6.0**)

### Verde vivo

| Token | Claro | Escuro | Contraste medido |
|---|---|---|---|
| `cor.viva` (preenchimento) | `#39F0CD` | `#39F0CD` | é a cor de fundo: com `vivaTexto` em cima dá **11,67:1** |
| `cor.vivaTexto` | `#00221A` | `#00221A` | 11,67:1 sobre `viva` |
| `cor.marca` (texto, link, aba ativa) | `#006B5F` → **`#007761`** | `#6BD3C2` → **`#39F0CD`** | claro: 5,51:1 sobre `superficie`, 5,15 sobre `fundo`, 4,76 sobre `marcaSuave`. Escuro: 12,23:1 sobre `superficie`, 13,61 sobre `fundo` |
| `cor.marcaTexto` | `#FFFFFF` | `#00221A` | 5,51:1 · 11,67:1 |
| `cor.progresso` (traço de anel e barra) | `#007761` | `#39F0CD` | 5,51:1 · 12,23:1 |
| `cor.marcaSuave` | `#D6F5EE` | `#0A332C` | `texto` 14,88:1 · 12,11:1 |

- O `#39F0CD` é oklch(86 % 0,15 176): verde-água luminoso, na matiz da marca (182 → 176). Não é verde-limão (matiz ~125).
- Regra: **no claro, `viva` não é texto nem traço sobre branco** (1,45:1). Ela preenche (botão primário, marcar série, chip selecionado, deslizar, mostrador em trabalho, + central) sempre com `vivaTexto` por cima. Texto, link, aba ativa e anel sobre superfície clara usam `marca`.
- **Escuro quase preto**: `fundo` `#070C0C`, `superficie` `#121A19`, `superficieElevada` `#1B2423`, `texto` `#E9F2F1` (17,28:1 sobre o fundo), `textoSecundario` `#A3B1B0` (8,88:1), `borda` `#2A3433`, `trilho` `#26302F`.
- **Claro**: `textoSecundario` `#556463` → `#4A5958` (6,86:1 sobre o fundo; 7,34 sobre a superfície).
- Sucesso, atenção, erro e o dourado do Plus não mudaram. Os contrastes com as superfícies novas do escuro: sucesso 9,37:1 e plus 10,73:1.

### Grupo `vidro` (componente 20)

| Token | Claro | Escuro |
|---|---|---|
| `desfoque` / `saturacao` / `borda` | 24 / 1,6 / 1 | igual |
| `fundo` | `rgba(255,255,255,0.80)` | `rgba(8,14,13,0.60)` |
| `borda` | `rgba(255,255,255,0.75)` | `rgba(255,255,255,0.14)` |
| `brilhoTopo`, `sombra` | fio branco 0,9 · sombra curta | fio branco 0,10 · sombra 0,6 |
| `texto` / `textoSecundario` / `destaque` | `#131D1C` / `#3B4847` / `#00604E` | `#FFFFFF` / `#D5DEDD` / `#39F0CD` |
| `solido` (transparência reduzida) | `#FFFFFF` | `#1B2423` |
| `camadaContraste` | degradê branco 0,35 | degradê `#040808` 0,55 |
| `vidro.barra` (abas e faixa do descanso) | branco 0,88 | `rgba(18,26,25,0.86)` |

Pior caso calculado: no escuro, com pixel de 210 atrás do painel, o texto dá 7,18:1, o secundário 5,24 e o destaque 4,97. No claro, com pixel preto atrás, o texto dá 10,18:1, o secundário 5,64 e o destaque 4,46 (por isso, no claro, o destaque só vai em texto grande ou ícone). Na prática a medida é a do pior pixel real (seção 4).

### Grupo `foto` (componente 19)

- `escurecer` 0,72 e `saturacao` 0,9, aplicados na tela e não no arquivo.
- `gradiente`, do herói: 0,55 no topo (para os botões e a barra de status), transparente de 22 % a 32 %, 0,74 em 60 % e 0,94 no pé.
- `gradienteCapa`: transparente até 20 %, 0,80 em 64 % e 0,94 no pé. Junto vai a `luzLateral`, um brilho verde-água a 18 % no canto de cima.
- `texto` `#FFFFFF`, `textoSecundario` `#D5DEDD` e `fundoSemFoto` `#0B1312`, que é a ilha escura sem foto.
- **A foto é igual nos dois temas.** O claro só troca o vidro por vidro claro.

### Raio, tipografia e o resto

- **Raio**: `cartao` 20 → **24**, `miniatura` 14 → 16, `folha` 24 → 28. Novos: `capa` 28, `vidro` 24, `botao` 999 (todo botão de texto vira pílula) e `pilula` 999.
- **Tipografia**: `numeroGigante` 112/112, Archivo 800, −0,04 em, tabular. Fica em 96 no celular pequeno e não cresce com a fonte do sistema, porque 112 já é o teto.
- **Sombra**: `sombra.viva` é o brilho do verde no escuro e uma sombra verde curta no claro, uma vez por tela. `sombra.atual` do escuro passou para o verde novo.
- **Imagem**: `heroi` 440, `heroiBaixo` 300, `capaFoto` 240 e `capaGrade` 208. **Crescem com a fonte do sistema** (`max(valor, valor/16 rem)`), para o texto ampliado não subir para a parte clara da foto.
- **`deslizar`**: 64 de altura, botão de 56, limiar de 0,85.
- **`anel`**: 44 de diâmetro, traço 4, e 72 no resumo.
- **`abas.mais`**: 56, na cor `viva`. **[decidir]**.

No CSS, cada token virou variável (`--cor-viva`, `--cor-viva-texto`, `--cor-progresso`, `--vidro-*`, `--foto-*`, `--raio-capa/vidro/botao/pilula`, `--sombra-viva`, `--tipo-numero-gigante`, `--imagem-heroi...`, `--deslizar-*`, `--anel-*`).

Há também classes novas:
- `.foto-texto`, com `__imagem`, `__conteudo`, `__topo` e as variantes `--heroi`, `--capa` e `--baixo`;
- `.vidro`, `.vidro-camada`, `.botao--vidro`, `.pilula-vidro` e `.botao--brilho`;
- `.numero-gigante`;
- `.deslizar` e `.anel-exercicio`;
- `.exercicio-linha`, `.capa-treino`, `.aba-mais` e `.celular__tela--imersiva`.

Dentro de `.foto-texto` e de `.vidro` as variáveis `--cor-texto` e `--cor-texto-secundario` são redefinidas. Por isso qualquer componente posto ali troca de cor sozinho. A transparência reduzida responde a `[data-transparencia="reduzida"]` e a `@media (prefers-reduced-transparency)`.

**Para o O e o P**: não faltou token para vidro, foto, verde vivo ou número gigante. Se precisarem de outro, a regra continua: variável local `--o-`/`--p-` e o Q passa para o `tokens.json`.

## 2. O que mudou em cada tela (`mockups/index.html`)

1. **Treino em andamento** (antes "Treino do dia"):
   - Tela imersiva: a foto grande do exercício atual (393 × 440) sobe por trás da barra de status, com voltar e menu em vidro.
   - Por cima da foto vão as pílulas de vidro "Série 2 de 3" e "22,5 kg", o **"12" gigante** com "repetições", o nome do exercício e a linha de apoio.
   - Abaixo, o cartão das séries (o "marcar" em verde vivo, redondo, com o check de mola) e o placar.
   - Depois vem a lista de exercícios com **um anel por exercício**. O anel do atual acompanha a série marcada.
2. **Treinos prontos**:
   - O destaque virou **capa com foto grande e o texto por cima** (358 × 240), com "Em uso" e "50 min" em pílulas de vidro.
   - Logo abaixo fica o **"Deslize para começar"**. Tocar no botão, Enter ou espaço também começa.
   - A grade virou capa com foto (208) e o nome por cima.
3. **Perfil do aluno** (academia):
   - O topo virou a **ilha escura** com a luz lateral, sem foto, porque o aluno tem iniciais e nunca foto do corpo. Ali ficam o nome, o selo e o peso e a altura em número grande, com "Não informado" no que falta.
   - O resto ficou mais denso e na mesma linguagem.
4. **Dieta (Plus)**:
   - O resumo do dia está na ilha escura, com um anel de 72 e o "4 de 11 itens", sem kcal.
   - O item comido ficou **esmaecido e com check, sem risco**.
5. **Cronômetro**:
   - Tela imersiva com a foto das cordas (300) e o título por cima.
   - O mostrador em trabalho usa o verde vivo, e o botão de pausar tem o brilho.
6. **Convite ao Plus**:
   - A foto vai de borda a borda, com o selo dourado e o título por cima.
   - A lista e o botão dourado ficam no cartão com o halo, e entrou o "Agora não".
   - A ilustração cortada saiu.

Em todas as telas:
- botões em pílula, cartão de raio 24 e legendas um nível acima;
- a **aba Plus** com o **+ da marca** (`#i-marca-mais`: o símbolo A, barra com anilhas, em traço 2);
- o mesmo desenho no claro e no escuro.

Na página: uma chave nova no topo, **"Vidro / Sem transparência"**; na paleta, `viva` e `progresso`; uma amostra nova dos componentes 19, 20 e 21 com o anel; `sombra.viva` na amostra de sombras; e os efeitos novos na lista de efeitos.

**`?abas=mais`** **[decidir]**:
- um botão redondo de 56 em verde vivo no meio da barra do aluno (Início · Treinos · **+** · Plus · Perfil);
- tocar nele abre a folha **Começar treino · Cronômetro · Registrar**;
- não é aba e não muda o número de abas, então `?moldura=real` e `?aparelho=` continuam funcionando.

**Fotos grandes**: o banco do J só tinha capas de 688 × 384 e exercícios de 96 px. Fiz recortes maiores **das mesmas fotos Unsplash** (baixadas de novo para uma quarentena fora do projeto). Estão em `mockups/imagens/`, em WebP 1×/2×, com os créditos em `mockups/imagens/CREDITOS.md`. Nenhuma foto nova entrou.

## 3. Correções da lista do agente principal

| Problema | O que fiz |
|---|---|
| Tela de treino com camadas demais: o aviso "Série 1 feita" cobria a série seguinte | O aviso agora fica **dentro da base, acima da faixa do descanso**. Ele empurra a lista em vez de cobrir. Registrado no componente 16 |
| Título cortado ("Peito e tríc…") | O cronômetro foi para o menu ⋯, e o nome do treino e do exercício foram para cima da foto, sem corte |
| Item de dieta comido riscado | Esmaecido (`textoSecundario`) e com check `sucesso`, sem risco. Corrigido no componente 11 e no CSS |
| Legendas pequenas e cinza | Nas 6 telas, as legendas de 12 subiram para `corpoPequeno` (14), e o `textoSecundario` do claro ficou mais firme |
| Aba Plus com estrela | Agora é o + da marca, nas telas e na amostra do componente 12. A estrela fica só no exemplo do selo |
| Ilustração cortada no rodapé do convite | Saiu. O convite já diz o que a aba mostra |

Outras correções que apareceram no caminho:
- Dentro da coluna que rola, a foto encolhia até 0, por causa do `overflow: hidden`. Agora tem `flex-shrink: 0`.
- O avatar sumia na ilha escura do claro (letra branca sobre menta clara).
- O título longo estourava a 160 % ("acompanhamento").
- O espaço do inset (59, 62) caía fora da escala de 4. Virou um espaçador num `::before`.
- O anel grande mostrava "36 %", que encostava no traço a 160 %. Agora mostra "4".
- Nas fotos com texto, a 160 % o texto subia para a parte clara da foto. Agora a altura da foto cresce com a fonte e o degradê escurece mais cedo.

Documentos:
- `02-COMPONENTES.md`: componentes **19 Foto com texto**, **20 Vidro** e **21 Deslizar para começar**, o anel por exercício e as notas no 1, 11, 12 e 16. O + central entrou como **[decidir]**, com prós e contras.
- `05-ACESSIBILIDADE.md`: a seção 1 passou a dizer que texto sobre foto ou vidro é medido contra o pior pixel, e entrou a seção **5b Vidro e "Reduzir transparência"**, com o caminho no iOS, no Android e no navegador. Entraram também o anel na tabela "cor não é a única informação" e dois itens no checklist.
- `01-TOKENS.md`: o resumo da 1.6.0.
- `movimento/00-CATALOGO.md`: os efeitos 4.10 (deslizar) e 4.11 (folha do +).

## 4. Auditoria (`auditoria/auditar.mjs`)

Estendi o `auditar.mjs` com uma medida nova: **contraste contra o pior pixel**.
- **O que mede**: todo texto e ícone dentro de `.foto-texto`, `.vidro`, `.pilula-vidro` e `.botao--vidro`, e a barra de status das telas imersivas.
- **Como mede**: esse texto não entra mais na conta pela cor de fundo. Ele fica transparente, a moldura (ou a caixa da amostra) é fotografada e cada pixel atrás da linha é comparado com a cor do texto. O mínimo é 4,5:1 para texto e 3:1 para texto grande e ícone.

Também entraram quatro rodadas novas no iPhone 16, a 393 × 852 e a 2040 × 790: **sem transparência** e **`?abas=mais`**.

A medida pegou de verdade:
- texto que, a 160 %, subia para a parede clara da foto do supino e da capa (de 2,0 a 2,8:1);
- o número da amostra num bloco de foto baixo demais.

Os dois foram corrigidos (seção 3).

```
node 02-design/sistema-de-design/auditoria/auditar.mjs
```

**0 achados**:
- em 140 combinações: as 124 de antes, mais 16 novas (4 rodadas × 2 temas × 2 fontes: sem transparência e com `abas=mais`, a 393 e a 2040);
- com 4008 medições de pior pixel;
- sem nenhum erro de script.

As capturas em `auditoria/capturas/` e o `resultado.json` foram refeitos. Olhei as telas a 393 (iPhone 16, `?moldura=real`) e a 2040 × 790 nos dois temas, com e sem transparência, e a folha do + aberta. Comparei com as refs 01, 02, 05 e 06.

## 5. Pendente

- **[decidir]**: o botão + central (`?abas=mais`).
- **[decidir]**: a troca das fotos por fotos da academia real.
- A foto do "supino inclinado" mostra o banco **reto** (a mesma ressalva do banco do J).
- **Para o Q**:
  - o PDF ainda mostra as telas antigas;
  - o `capturar.mjs` deve refazer as telas e incluir a chave "Sem transparência" e uma captura com `?abas=mais`;
  - os ícones do R devem substituir `#i-marca-mais` e `#i-avancar`, que desenhei no traço do Lucide como provisórios;
  - as miniaturas de exercício de 48 da lista vão dar lugar às ilustrações do R.
- **No app**:
  - o `expo-blur` (vidro) ainda não está no `package.json`. É dependência nova a registrar em `docs/decisoes.md`; deixei o caminho no componente 20 e na acessibilidade 5b;
  - a `StatusBar` precisa ficar clara nas telas imersivas.
- **Texto sugerido para `docs/decisoes.md`** (fora da minha pasta):
  > 10/10/2026 — Tokens 1.6.0 na linguagem das referências. **Critério**: o pedido do Alex (foto grande, vidro, números enormes, verde mais vivo) com contraste medido contra o pior pixel. **Decidido**: verde vivo `#39F0CD` só como preenchimento (com `#00221A` por cima); no claro, texto e traço em `marca` `#007761`; a foto é igual nos dois temas; vidro com alternativa sólida. **Descartado**: verde-limão (pedido do Alex); `viva` como texto no claro (1,45:1); clarear a foto no tema claro (seria outro app). **Mudaria se** o teste em aparelho mostrar o vidro pesado no Android de entrada (aí o vidro nasce sólido abaixo do Android 12, como já previsto).
