# P09 — Design a partir das referências do Alex (10/10/2026)

Todos leem antes:
- `02-design/referencias/00-LEIA-ME.md` e **as 6 imagens dessa pasta** (abra cada uma com Read). É o que o Alex quer.
- `00-prompts/P00-CONTEXTO.md`, `CLAUDE.md` e as últimas entradas de `docs/decisoes.md`.
- `02-design/marca-e-proposta/` (tom de voz e identidade).
- `02-design/sistema-de-design/`: `tokens.json` 1.5.0, `02-COMPONENTES.md`, `06-IPHONE.md`, `movimento/00-CATALOGO.md` e o mockup atual.
- `02-design/imagens/` (manifesto e créditos).
- `docs/revisao/L-APLICACAO.md`.

Português do Brasil. Nenhum agente resolve um **[decidir]**.

**O pedido**: o app mais atraente e clean, na linguagem das referências.
- Escuro com foto grande e escura, texto por cima e números enormes.
- **Painéis de vidro** (desfoque translúcido mostrando a imagem de fundo).
- Efeitos.
- O claro tem a mesma linguagem, com vidro claro sobre foto e o mesmo verde vivo, sem virar outro app.
- Cor: **verde da marca mais vivo** (no escuro, verde-água/menta luminoso). Não é verde-limão. O dourado fica só no Plus.

**O que não muda**:
- Alvos de toque (48/56/64) e números grandes.
- Contraste **medido**: 4,5:1 em texto e 3:1 em texto grande e ícone. Sobre foto ou vidro, mede-se contra o pior pixel de fundo, com uma camada de contraste por baixo.
- Com "Reduzir transparência" ligado, o vidro vira superfície sólida. Com "reduzir movimento", tudo vira esmaecer de 160 ms.
- Nada de "corpo ideal", nada de kcal como placar, nada de ranking.
- `?moldura=real` e `?aparelho=` continuam funcionando.

| Agente | Escreve em | Relatório |
|---|---|---|
| N — Sistema e telas atuais | `02-design/sistema-de-design/` (`tokens.json`, `sistema.css`, `mockups/index.html`, documentos) | `docs/revisao/N-SISTEMA.md` |
| O — Abertura e entrada | `mockups/entrada.html` + `mockups/entrada.css`, `02-design/imagens/entrada/` + `CREDITOS-entrada.md`, seções novas em `01-especificacao/` e em `marca-e-proposta/04-APLICACAO.md` | `docs/revisao/O-ENTRADA.md` |
| P — Telas novas | `mockups/novas.html` + `mockups/novas.css`, `02-design/imagens/telas/` + `CREDITOS-telas.md`, seções novas em `01-especificacao/04-MAPA-DE-TELAS.md` | `docs/revisao/P-TELAS-NOVAS.md` |
| R — Ícones e ilustrações | `02-design/icones/` | `docs/revisao/R-ICONES.md` |
| Q — Junção, revisão e PDF (**depois** dos quatro) | tudo de `02-design/` e `docs/apresentacao/` | `docs/revisao/Q-JUNCAO.md` |

`entrada.html` e `novas.html` carregam o `sistema.css` do N e **não o editam**. Um token que ainda não exista vira variável local com prefixo `--o-` ou `--p-` e entra no relatório, e o Q passa esses tokens para o `tokens.json`. As fotos novas seguem a regra de `imagens/CREDITOS.md`: Unsplash ou Pexels com licença comercial, sem marca, sem corpo ideal, pessoas reais e diversas, quarentena antes de processar e WebP 1×/2×. O tratamento escuro e dramático é feito na edição: escurecer, gradiente, luz lateral.

## N — Sistema e telas atuais

1. **Tokens primeiro**, para os outros usarem:
   - o verde vivo nos dois temas, com contraste medido;
   - o grupo `vidro`: desfoque, opacidade, borda clara de 1 px, camada de contraste e alternativa sólida;
   - o grupo `foto`: gradiente sobre foto e escurecimento;
   - raios maiores e pílulas.

   Suba a versão do `tokens.json`.
2. Refaça as 6 telas de `index.html` nessa linguagem:
   - foto grande no exercício atual e nas capas;
   - vidro nos painéis sobre foto;
   - números enormes;
   - anéis de progresso por exercício;
   - "deslizar para começar" no treino pronto.

   O claro e o escuro têm a mesma linguagem.
3. Corrija a lista de problemas que o agente principal levantou:
   - **Tela de treino com camadas demais**: o aviso "Série 1 feita" cobre a série seguinte; ele sai, ou fica acima da faixa do descanso.
   - **Título cortado** ("Peito e tríc…"): um ícone vai para o menu ⋯.
   - **Item de dieta comido**: não fica riscado, fica esmaecido e com check.
   - **Legendas pequenas e cinza**: sobem um nível na escala.
   - **Aba Plus**: a estrela vira o "+" da marca.
   - **Ilustração cortada no rodapé do convite ao Plus**: sai ou ganha espaço.
4. A barra de abas pode ganhar um botão "+" central, como nas refs 05 e 06, que abre "Começar treino / Cronômetro / Registrar". Proponha, implemente atrás de um parâmetro `?abas=mais` e deixe como [decidir].
5. Atualize `02-COMPONENTES.md` (componente Vidro e Foto com texto) e `05-ACESSIBILIDADE.md` (vidro e "Reduzir transparência"). Rode `auditoria/auditar.mjs` até dar 0 achados.

## O — Abertura e entrada

Página `mockups/entrada.html`, na moldura do iPhone e do Android, no claro e no escuro.

**Telas:**
1. **Abertura**: a cor da marca cheia com o logo (caminho A de `marca-e-proposta/logo/`). Na demo, a transição para a entrada é animada (o logo encolhe e sobe, a foto aparece). Defina também a versão estática que o `expo-splash-screen` mostra: cor e logo centralizado, com os tamanhos de imagem que o Expo SDK 54 pede.
2. **Boas-vindas**: foto grande, frase curta da marca e as duas portas, **"Sou aluno"** e **"Sou da academia"**, em vidro sobre a foto.
3. **Aluno**: entrar com Apple, entrar com Google, e e-mail; criar conta; "Esqueci a senha"; perguntas opcionais com "Pular", que são o objetivo da lista fixa e os dias por semana; código da academia, também opcional.
4. **Da academia**: entrar; "Tenho um convite / código"; o pedido fica pendente até o dono confirmar; e o dono criando a academia, como [decidir] "uma ou várias".

**Também:**
- Tudo em vidro sobre a mesma foto desfocada, como na ref 02.
- Escreva o fluxo de entrada na especificação, acrescentando, sem reescrever o F1: as duas portas, o que cada uma pede e como casa com "o papel decide a visão".
- Escreva a abertura em `04-APLICACAO.md`.
- Login com Apple tem o mesmo destaque que o Google (diretriz 4.8).

## P — Telas novas

Página `mockups/novas.html`, na moldura do iPhone e do Android, no claro e no escuro.

1. **Início do aluno**:
   - saudação;
   - sequência da semana em bolinhas;
   - cartão grande do treino de hoje, com foto e "Começar";
   - "Dieta de hoje" se for Plus;
   - atalhos;
   - aviso da academia.
2. **Evolução**:
   - carga ao longo do tempo num exercício escolhido;
   - frequência do mês (mapa de dias);
   - treinos por semana em barras;
   - volume por grupo muscular em rosca.

   Sem kcal como placar. O estado vazio é para quem começou agora.
3. **Modo treino**:
   - ao "Começar", o app passa para o escuro em tela cheia;
   - foto grande do exercício atual com o número de repetições enorme, como o "15" da ref 05;
   - série, carga e "Próximo" num painel de vidro;
   - anel do descanso.

   O registro da série não espera nenhuma animação.
4. **Comemoração**: tela de cor cheia (verde vivo) com check grande e o resumo. O título é "Treino fechado.", sem exclamação.
5. **Painel do dono**: alunos ativos, frequência, assinantes Plus, alunos sumidos, sem dado de saúde. É uma densidade maior, na mesma linguagem.

Acrescente essas telas ao `04-MAPA-DE-TELAS.md`, acrescentando sem reescrever. Use os efeitos do catálogo de movimento.

## R — Ícones e ilustrações

1. **Ícones próprios** em SVG:
   - traço do logo, com a mesma espessura e as mesmas pontas;
   - grade 24, nas versões contorno e cheio (cheio para a aba ativa);
   - os das abas (Início, Treinos, o "+" do Plus, Perfil, Alunos, Academia);
   - os das ações (marcar, +/−, cronômetro, pausar, pular, buscar, filtro, voltar, menu, vibrar, sino, prato, gráfico, câmera, cadeado, Apple, Google, e-mail).

   O sprite fica em `icones/sprite.svg`, mais os arquivos soltos.
2. **Ilustrações de exercício**, no lugar das fotos pequenas de 48–64 px, que ficavam escuras e confusas:
   - figura simples, na linha do traço do logo, com o músculo trabalhado na cor de destaque;
   - para os exercícios do mockup e mais uns 12 comuns (agachamento, leg press, puxada, remada, desenvolvimento, rosca, tríceps, prancha, abdominal, elevação pélvica, panturrilha, esteira, bicicleta);
   - tamanhos 48/56/64, nos dois temas;
   - sem rosto e sem corpo ideal.
3. `galeria.html` para ver tudo, e `00-LEIA-ME.md` com a regra de uso.

## Q — Junção, revisão e PDF

Roda depois que N, O, P e R terminarem.
1. Passe para o `tokens.json` as variáveis `--o-` e `--p-`.
2. Aplique os ícones e as ilustrações do R nas três páginas.
3. Ligue as páginas: navegação entre `index`, `entrada` e `novas`.
4. Faça uma **revisão completa da interface** com a skill `better-interface` no modo completo (acessibilidade, layout, texto, tipografia, cores, acabamento) nas três páginas, e corrija o que achar.
5. Estenda o `auditar.mjs` para as três páginas e rode até dar 0 achados.
6. Refaça o PDF (`capturar.mjs`, depois `montar.mjs`, depois `folhear.mjs`). Olhe todas as páginas e apague os PNG que sobrarem.
