# P — Telas novas (P09, 10/10/2026)

Sou o agente P. Escrevi só nestes lugares:
- `02-design/sistema-de-design/mockups/novas.html` e `novas.css`;
- `02-design/imagens/telas/` (8 WebP e o `processar_telas.py`);
- `02-design/imagens/CREDITOS-telas.md`;
- a **Parte 6** nova no fim de `01-especificacao/04-MAPA-DE-TELAS.md`;
- este relatório.

Não editei o `sistema.css`. Ele já estava na 1.6.0 do N quando comecei a montar as telas, então uso direto os tokens dele (`--cor-viva`, `--cor-progresso`, `--vidro-*`, `--foto-*`, `--raio-capa`, `--raio-vidro`, `.numero-gigante`). Também não resolvi nenhum **[decidir]**.

## 1. As 5 telas (7 quadros)

`novas.html` abre por `file://`. Tem a moldura do iPhone e do Android, o claro e o escuro, e as chaves de movimento reduzido, **Reduzir transparência** e fonte a 160 %. `?moldura=real` e `?aparelho=` funcionam como no `index.html`, porque o cálculo da moldura é o mesmo.

| # | Tela | O que tem |
|---|---|---|
| 1 | **Início do aluno** | Saudação; aviso da academia (dispensável); "Sua semana" com o "2 de 4" grande e 7 bolinhas; cartão do treino de hoje com foto escura, painel de vidro e "Começar"; "Dieta de hoje" com selo Plus e anel 3/5; 4 atalhos. A barra de abas é de vidro, flutuante, e a aba Plus usa o "+" da marca. |
| 2 | **Evolução** | Foto no topo; em vidro, o exercício escolhido com "60 kg" enorme e "+15 kg desde 20 de jul."; carga em linha; outubro em mapa de dias; treinos por semana em barras; volume por grupo em rosca. |
| 2b | **Evolução de quem começou agora** | Frase do tom de voz, "Começar treino A" e o contorno tracejado do que vai aparecer. Não há gráfico vazio. |
| 3 | **Modo treino (série)** | Escuro em tela cheia, sem abas, nos dois temas. Foto grande do exercício (crucifixo no cabo), o "12" de 112 px em verde vivo, e um painel de vidro com a série, carga e repetições (± de 48), "Última vez", **"Série feita"** (64) e "Próximo". |
| 3b | **Modo treino (descanso)** | A mesma foto desfocada; anel de 248 com "0:45", que fica laranja nos últimos 10 s; −30 s · Pular · +30 s. O "Série 2 feita · Desfazer" fica no painel, sem cobrir nada. |
| 4 | **Comemoração** | Verde vivo cheio, check grande, **"Treino fechado."**, 3 números (6 exercícios · 48 minutos · 18 séries), destaque de carga, "Pronto" e "Como foi?". |
| 5 | **Painel do dono** | Foto da sala; "214" alunos ativos em vidro com medidor; 4 quadros (486 treinos em 7 dias, 29 de 350 no Plus, 14 sumidos, 2,3 de frequência); treinos por dia; Plus por personal com "1 sem personal · Designar". Abaixo, a nota "somados, sem dado de saúde". |

Os números de exemplo batem entre si:
- **Treinos de outubro**: 1, 3, 5, 7, 9, 12 e 13 dão os 7 treinos do mês.
- **Semana de 12/10**: 2 treinos, que são o "2 de 4" do Início.
- **Barras por semana**: a de 5/10 tem 3 treinos, a de 28/9 tem 4, e a média é 3,4.
- **Rosca de volume**: 25.100 + 23.400 + 20.100 + 15.000 = 83.600 kg, que dão 30/28/24/18 %.
- **Treinos por dia no dono**: as barras somam 486.
- **Frequência no dono**: 486 ÷ 214 = 2,3.
- **Plus**: 11 + 9 + 8 + 1 sem personal = 29.

**Efeitos do catálogo** (`movimento/00-CATALOGO.md`):
- **1 · Série marcada.** O dado entra num registro antes de tudo. A tela mostra o tempo até a gravação, embaixo do botão. Depois vem a vibração, e então o check com `mola.check`.
- **2 · Fechar treino.** O círculo entra com `mola.padrao`, o traço em 480 ms e o resumo em escalonamento de 60 ms. Toca uma vez quando a tela aparece, e o botão "Repetir" toca de novo.
- **3a · Anel do cronômetro.** Esvazia em linha reta, recalculado pelo instante de fim. Com movimento reduzido, salta por segundo.
- **4.5 · Cartão que afunda.** Vale para os cartões, os atalhos e os quadros.
- **4 · Pílula da aba.**
- **Movimento reduzido.** Tudo vira esmaecer de 160 ms.
- **Reduzir transparência.** O vidro vira sólido pelos tokens do N, e a foto do descanso perde o desfoque.

## 2. Decisões de gráfico

Os gráficos são SVG inline, sem biblioteca. O script desenha cada um a partir dos `data-*`, de onde também sai a tabela, então o número é um só para o desenho e para a tabela. Segui a skill `dataviz`.

- **Uma cor só, `--cor-progresso`.** No escuro ela é o verde vivo. No claro é o verde da marca (#007761), porque o vivo some no branco (1,45:1). O que não está em destaque fica em cinza. Valor e rótulo vão na cor do texto, nunca na cor da série.
- **Rosca com destaque, não com 4 cores.** Testei 4 cores de grupo (combinações de verde-água, azul, magenta, violeta, verde e laranja) com o `validate_palette.js`, pedindo todos os pares:
  - no escuro, **nenhuma** combinação de 4 passou;
  - no claro, a melhor teve verde-água e magenta a ΔE 1,7 para deuteranopia.

  Por isso a rosca pinta **um** grupo no verde e os outros em 3 cinzas (`--p-grafico-neutro-*`), com 2 px de vão entre as fatias. A legenda direta traz nome, % e kg, e tocar num grupo troca o destaque. Isso também segue o "uma cor de destaque" das referências.
- **Linha da carga.**
  - O traço tem 2,5 e há um ponto só, o último, com rótulo direto ("60 kg").
  - Grade em 40/50/60 e meses no eixo.
  - Uma linha e um ponto acompanham o dedo, o mouse ou o foco.
  - O valor é a maior carga da semana nas séries feitas. A tabela tem as 13 semanas.
- **Barras por semana.**
  - A ponta é arredondada em 4 px e presa à base.
  - A meta (a frequência que a pessoa escolheu) é uma linha tracejada, "meta 4", e não vira placar.
  - A semana em andamento fica **hachurada** e rotulada, para o "2" de quarta não parecer uma semana ruim.
- **Barras do dono.** "Hoje" (qua) vai no verde e os outros dias em cinza, com o valor em cima de cada barra.
- **Mapa de dias.** Tem 4 estados: treinou (cor cheia, com o número em `--cor-marca-texto`), não treinou, hoje (anel) e dias que ainda não chegaram (só contorno). A legenda escrita fica embaixo.
- **Sem gráfico vazio.** Quem começou agora vê frase, botão e contorno tracejado. A linha só aparece com 2 treinos fechados.
- **Acessibilidade.**
  - Cada gráfico tem "Ver em tabela" (`<details>`) e um `aria-label` com o resumo.
  - As barras e os pontos recebem foco pelo teclado e dizem o valor.
  - O texto do eixo tem 13 px, a legenda de 12 "subiu um nível".
  - Nada usa kcal, peso do corpo ou comparação com outro aluno.

## 3. Fotos

São 4 fotos novas do Unsplash, com licença comercial e conferidas como `premium: false` e `plus: false`:
- a mulher de hijab no cabo (modo treino);
- um homem de meia-idade descansando no banco (Início);
- a mulher do agachamento, que já estava no banco e agora aparece larga (Evolução);
- a sala escura sem ninguém (dono).

O processo foi este:
- **Quarentena.** Baixei em 2400 px para uma pasta temporária fora do projeto.
- **Olhadas uma a uma.** Montei folhas de contato com 144 resultados e depois olhei 10 fotos inteiras e em recorte ampliado.
- **Corte e desfoque.** O recorte tirou o tênis com listras e o pacote colorido do modo treino, e a placa da parede da sala. O logo da camisa do Início foi **desfocado**.
- **Tratamento escuro na edição.** Escureci, tirei saturação e pus luz lateral com vinheta. O gradiente fica no CSS.
- **Tamanho.** São 8 WebP 1×/2×, 74 KB no total.

Autor, link, recorte e as 7 descartadas, com o motivo, estão em `02-design/imagens/CREDITOS-telas.md`.

## 4. Verificação

Fiz as capturas com o Playwright, no Chromium do `.ferramentas`, e **olhei** cada uma:
- **393 de largura**: os 7 quadros, no topo e com a lista rolada até o fim, nos dois temas.
- **2040 × 790**: a página inteira, nos dois temas. Os 7 quadros ficam numa linha.

Resultado: nenhum erro de script e nenhuma rolagem horizontal.

O que corrigi depois de olhar:
- o cartão do treino de hoje encolhia até virar uma faixa, porque era item flex sem `flex: none`;
- os textos de cartões que são `<a>` ficavam sublinhados;
- o conteúdo rolado passava por baixo da barra de status sem contraste. Agora uma faixa de gradiente fica atrás dela;
- o vidro escuro herdava o fio de luz do vidro claro no tema claro.

**Contraste medido contra o pior pixel.** Para cada texto dentro de foto, vidro, abas ou comemoração (`.p-capa`, `.p-foto`, `.p-hero`, `.p-treino`, `.p-ativos`, `.p-abas`, `.p-comemoracao`), o script:
1. guarda a cor do texto e a caixa do texto (`Range`, sem o ícone ao lado);
2. deixa todo texto transparente e esconde os ícones;
3. fotografa a página;
4. compara a cor do texto com o pixel mais claro do fundo (texto claro) ou o mais escuro (texto escuro).

Rodei nos 2 temas × vidro normal e transparência reduzida. **292 de 292 passaram** (4,5:1 para texto, 3:1 para texto grande). O pior caso foi o chip "4 sem." sobre a foto da Evolução, com **5,15:1**; depois vêm os metadados do cartão do Início no claro, com 5,98:1. Na primeira rodada as "falhas" eram erro de medida: a caixa pegava o canto arredondado (o fundo da página) ou o "+" dourado ao lado do rótulo. Corrigi a medida, não a tela.

Os scripts de captura e de contraste ficaram na pasta temporária da sessão. O Q pode estender o `auditoria/auditar.mjs` com esta medida: esconder o texto, fotografar e comparar com o pior pixel.

## 5. Tokens que o Q precisa consolidar (`--p-` em `novas.css`)

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--p-grafico-neutro-1/2/3` | #93A3A1 · #B7C4C2 · #D2DCDA | #7C8C8A · #566564 · #3B4847 | o que não está em destaque nos gráficos |
| `--p-grafico-grade` | rgba(19,29,28,.10) | rgba(233,242,241,.10) | linha de grade |
| `--p-grafico-area` | rgba(0,119,97,.14) | rgba(57,240,205,.16) | área sob a linha da carga |
| `--p-mapa-vazio` | #E4ECEA | #1B2423 | dia sem treino, bolinha vazia da semana |
| `--p-mapa-futuro` | transparent | transparent | dia que não chegou (só contorno) |
| `--p-aviso-fundo` / `--p-aviso-fio` | #FFFFFF / marca | #121A19 / viva | cartão "Aviso da academia" |
| `--p-capa-inicio` | 300 | | altura do cartão do treino de hoje |
| `--p-foto-topo-evolucao` / `--p-foto-topo-dono` | 280 / 232 | | foto do topo das duas telas |
| `--p-anel-descanso` / `--p-anel-descanso-traco` | 248 / 12 | | anel do descanso no modo treino |
| `--p-check-comemoracao` | 112 | | check da comemoração (o catálogo diz 64; aqui é tela cheia) |
| `--p-bolinha-semana` / `--p-dia-mapa` | 40 / 40 | | bolinha do dia (coluna de 48 de alvo) e célula do mapa |
| `--p-barra-abas-flutuante` / `--p-barra-abas-margem` | 64 / 12 | | barra de abas de vidro flutuante |
| `--p-tipo-numero-hero` / `--p-linha-numero-hero` | min(4rem, 72px) / min(4.25rem, 76px) | | "60 kg", "214", "2 de 4" |
| `--p-tipo-legenda-grafico` | 0.8125rem (13) | | rótulo de eixo |
| `--p-desfoque-foto-descanso` | 18px | | foto do descanso |

Mais quatro coisas para o Q:
- **`.p-vidro--escuro`**: o vidro escuro fixo, para os botões e o painel sobre a foto no tema claro. Ele redefine `--vidro-fundo`, `--vidro-borda`, `--vidro-brilho-topo`, `--vidro-sombra` e os textos com os valores do escuro do N. Vale virar variante do componente 20.
- **`--p-check-comemoracao` 112 contra 64**: a comemoração do catálogo usa 64 dentro do resumo. Em tela cheia pedi 112. É preciso alinhar o catálogo e o componente.
- **Barra de abas de vidro flutuante**: aqui ela é uma pílula a 12 px das bordas, com a aba ativa no verde vivo. Se o N mantiver a barra encostada, o Q escolhe uma das duas para as três páginas.
- **Ícones provisórios** (`#p-i-*` no `novas.html`): trocar pelo sprite do R. O "+" da aba Plus já está no lugar da estrela.

## 6. Pendências e o que eu não resolvi

- **[decidir] "Dieta" ou "plano alimentar"**: mantive "Dieta de hoje" porque é o texto do mapa. O tom de voz propõe "plano alimentar".
- **Onde mora a Evolução**: propus a aba Treinos, com atalho no Início, e ela soma ao "Histórico" sem tirá-lo. Se o Alex preferir que a Evolução substitua o Histórico, a linha do Histórico no mapa muda.
- **A meta tracejada** usa a frequência que o aluno informou. Sem ela, a linha não aparece.
- **Ultrawide**: a 2040 × 790 os 7 quadros ficam numa linha, mas a moldura é cortada embaixo, porque o cabeçalho com 5 grupos de chaves é alto. O `index.html` tem o mesmo cálculo. O Q pode descontar a altura do título da galeria no `ajustar()` das três páginas.
- **A foto do modo treino é uma só** (crucifixo no cabo). No app, cada exercício usa a imagem cadastrada pela academia e, sem ela, a ilustração do R sobre fundo escuro.
