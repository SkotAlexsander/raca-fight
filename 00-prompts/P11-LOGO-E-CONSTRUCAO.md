# P11 — Logo de academia e começo da construção do app (11/10/2026)

O Alex disse: "pode prosseguir, cria uma logo condizente de academia e prossiga". As pendências que travavam o código seguem com a opção **provisória** registrada em `docs/decisoes.md`, na seção "Escolhas provisórias para começar a construir".

Todos leem:
- `00-prompts/P00-CONTEXTO.md`;
- `CLAUDE.md`;
- `docs/decisoes.md` inteiro;
- `02-design/referencias/00-LEIA-ME.md`;
- a nota `A:\Claude\02-cerebro\70-aprendizado\40-ferramentas-e-frameworks\efeitos-e-metodo-academia-plus.md`.

Escrevem em português do Brasil. **O design aprovado está congelado:** o app reproduz os mockups (`02-design/sistema-de-design/mockups/*.html`, `tokens.json` 1.8.0), não reinventa.

## Ondas

| Onda | Agente | Escreve em | Relatório |
|---|---|---|---|
| 1 | W — Logo | `02-design/marca-e-proposta/logo/`, `tokens-marca.json`, `app/recursos/` (ícones e abertura) | `docs/revisao/W-LOGO.md` |
| 1 | X — Base do app | `app/` (menos `dominio/` e `recursos/`) | `docs/revisao/X-BASE.md` |
| 2 | Y — Telas do aluno | `app/telas/aluno/`, `app/navegacao/(aluno)/` | `docs/revisao/Y-ALUNO.md` |
| 2 | Z — Entrada e telas da academia | `app/telas/entrada/`, `app/telas/academia/`, `app/navegacao/(entrada)/`, `app/navegacao/(academia)/` | `docs/revisao/Z-ACADEMIA.md` |
| 3 | AA — Teste ponta a ponta e revisão | tudo de `app/` (só correções) | `docs/revisao/AA-TESTE.md` |
| 4 | AB — Bugs e erros (pedido do Alex, 11/10) | `app/` (só correções, teste primeiro) | `docs/revisao/AB-BUGS.md` |
| 4 | AC — Melhorias, segunda busca (pedido do Alex, 11/10) | `docs/revisao/AC-MELHORIAS.md`; aplica só as P sem [decidir] | `docs/revisao/AC-MELHORIAS.md` |

A onda 4 roda **depois** do AA, sobre o app já construído. **AB** procura bug e erro: console, tipos, testes, fluxos quebrados, estado que não volta, vazamento, segurança das telas, acessibilidade (leitor de tela e fonte grande). **AC** usa o app de verdade como cada papel e busca melhorias novas, sem repetir `B-MELHORIAS` e `V-CLIENTE`.

## W — Logo condizente de academia

O ponto de partida é o caminho A (o "+" com barra e anilhas), que é o recomendado e já está em uso. O Alex pediu um logo que **condiga com academia**. Antes de desenhar:
- Olhe o atual em tamanho real (16, 24, 48, 180, 1024).
- Olhe as referências dele em `02-design/referencias/` (o logo da ref. 03, de haltere em quadrado, e o da ref. 04).

O resultado não pode ser ícone genérico de haltere. A versão final pede para "exagerar o braço vertical", conforme o `03-LOGO.md`.

1. Desenhe 3 variações refinadas que **leiam "academia" na hora** e guardem o "+" de Plus. Exemplos:
   - o "+" com barra e anilhas mais robusto;
   - a anilha com um "+" vazado bem desenhado;
   - o monograma "A+" com uma barra.

   Mostre as 3 em `logo/comparativo.html`: 16 a 1024 px, ícone do app no iPhone e no Android (máscara redonda e squircle), claro e escuro, ao lado dos ícones das referências.
2. **Escolha uma e defenda a escolha.** O Alex pediu para criar; ele não pediu para escolher. Gere a versão final:
   - símbolo, wordmark "Academia Plus" (Archivo), monocromático e o selo Plus;
   - cores do sistema 1.8.0: `marca` `#007761`, `viva` `#39F0CD` e dourado só no Plus;
   - SVG à mão, limpo, em `currentColor`.
3. Gere os PNG do app em `app/recursos/`, com os nomes que o `app.json` pede:
   - `icone.png` 1024, sem transparência, para o iOS;
   - `icone-adaptativo.png` 1024 com o símbolo dentro da área segura de 66 %, e a cor de fundo do adaptativo no `app.json`;
   - `icone-notificacao.png` 96, branco com transparência;
   - os dois da abertura (`abertura-simbolo-claro.png` e `abertura-simbolo-escuro.png`), refeitos com o símbolo novo.
4. Atualize o sprite e a aba Plus, que usa o "+" da marca:
   - em `02-design/icones/` (fonte `gerar.py`, rodar `embutir.mjs`);
   - nos mockups;
   - no `03-LOGO.md`.

   Rode `auditar.mjs` (0 achados) e refaça só as capturas do PDF que mostram o logo.

## X — Base do app

1. `cd app && npm install`. Depois `npx expo install --fix` para alinhar as versões do SDK 54. Acrescente `react-native-web`, `react-dom` e `@expo/metro-runtime` para o app rodar também no navegador do PC. Confira se `npx expo-doctor` passa e registre o que não passar.
2. **Tema** em `app/tema/`: gerado a partir do `02-design/sistema-de-design/tokens.json` por um script (`app/ferramentas/gerar-tema.mjs`), nunca copiado à mão. Ele traz:
   - cores dos dois temas;
   - a escala tipográfica fechada;
   - espaço, raio, sombra, vidro e foto;
   - tempos de movimento.

   As fontes Figtree e Archivo já estão em `recursos/fontes`.
3. **Componentes base** em `app/componentes/`, iguais aos do `02-COMPONENTES.md` e do `sistema.css`:
   - Botão com área de toque invisível;
   - Campo, Campo numérico +/−, Chip, Cartão, Vidro (`expo-blur` com a alternativa sólida para "Reduzir transparência"), Foto com texto, Anel, Deslizar, Barra de abas, Cabeçalho, Folha inferior, Aviso rápido, Estado vazio, Ícone (sprite do `02-design/icones/` convertido para componentes `react-native-svg`) e Ilustração de exercício.

   Os efeitos seguem o `movimento/00-CATALOGO.md` (Reanimated 4): grava antes de animar, e "reduzir movimento" vira esmaecer de 160 ms.
4. **Navegação** (Expo Router, raiz `navegacao/`):
   - grupos `(entrada)`, `(aluno)` e `(academia)`;
   - a visão decidida pelo vínculo, como em `03-DECISOES-TECNICAS.md`, seção 1, com "Trocar de visão";
   - as abas do mapa de telas.
5. **Dados** em `app/dados/`: um repositório com interface única e uma implementação **local de exemplo**, com os dados dos mockups. Ana, Academia do Marcos e o catálogo de `dominio/catalogo/` estão entre eles.
   - Persistência no SQLite (`expo-sqlite`) para treino realizado e fila, usando `dominio/sincronizacao.ts`.
   - O Supabase fica só na interface, sem chamada real.
   - `redigir.ts` com teste.
6. Uma tela de **catálogo de componentes** (rota `/componentes`) para ver tudo junto.
7. Rode `npm run tipos` (tsc), os testes do domínio e `npx expo export --platform web`. Depois sirva a pasta exportada e abra com Playwright a 393×852 e a 2040×790 nos dois temas.

   Compare com os mockups e olhe as capturas. No relatório, explique como o Alex abre no celular: Expo Go com QR, o comando exato e a mesma rede Wi-Fi.

## Y — Telas do aluno (onda 2, depois do X)

Reproduza os mockups com os componentes do X e os dados de `dados/`:
- Início;
- Treinos (Meus treinos, Prontos com o catálogo real, ver treino pronto, Deslizar para começar, Editar treino, Séries);
- Modo treino (marcar série grava no SQLite antes da animação, descanso com o cronômetro de `dominio/cronometro.ts`, aviso rápido com Desfazer);
- Comemoração;
- Cronômetro (3 modos);
- Evolução;
- Plus (convite e ativo, dieta do dia);
- Perfil (Meus dados, Quem pode ver, Avisos, Conta, Equipe da academia e perfil do professor).

A tela da Equipe é nova. Desenhe-a na mesma linguagem, com os componentes que já existem. **Nada de tamanho fora da escala.**

## Z — Entrada e telas da academia (onda 2, em paralelo com o Y)

- **Entrada:** abertura animada, boas-vindas com as duas portas, login e cadastro (Apple, Google e e-mail são simulados, sem chave real), perguntas opcionais, código da academia e pedido pendente da equipe.
- **Academia:** Alunos (lista com filtros, novos, sumidos), Perfil do aluno (vista pela academia), Montar treino para o aluno e "Dar treino pronto em dois toques", Treinos prontos da academia, Plus do personal (lista ordenada por atenção), Painel do dono, Aviso da academia e Meu perfil profissional (com a chave "Mostrar aos alunos").

## AA — Teste ponta a ponta (onda 3)

Exporte para a web e percorra com Playwright os fluxos principais do `02-FLUXOS.md`, nos dois temas e em 393 e 2040×790:
- primeiro acesso;
- treino completo com descanso e comemoração;
- escolher treino pronto;
- dar treino pelo instrutor;
- perfil do professor visível ou oculto;
- sem rede: o treino fica na fila e sobe depois.

Corrija o que quebrar. Rode tsc, os testes do domínio e os testes de tela (jest-expo) que fizer sentido criar para os componentes críticos (Botão, Campo numérico, marcar série).
