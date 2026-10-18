# X — Base do app (P11, onda 1) · 11/10/2026

O que o agente X fez em `app/` (fora `dominio/` e `recursos/`): instalou o SDK 54, gerou o tema do `tokens.json`, escreveu os componentes base, a navegação por vínculo, os dados de exemplo com SQLite e a rota `/componentes`, e conferiu tudo no navegador nos dois temas, em 393 × 852 e em 2040 × 790.

## 1. Resultado das verificações

| Verificação | Resultado |
|---|---|
| `npm install` | 1120 pacotes. Precisou de `react-test-renderer` 19.1.0 travado (o `@testing-library/react-native` puxava o 19.3, que pede React 19.3) |
| `npx expo install --fix` | "Dependencies are up to date" |
| `npx expo-doctor` (1.20.4) | **18/18**. Antes dos PNG do agente W só falhava o check do app.json (ícones que não existiam) |
| `npm run tipos` (tsc 5.9.3) | **0 erros** |
| `npm run testar:dominio` | **349 testes, 349 passam** (318 do domínio, intocados + 31 novos de `dados/`: redigir 13, fila 6, visão 6, dados de exemplo 6) |
| `npm run testar:telas` (jest-expo) | roda; nenhum teste de tela ainda (o AA escreve os de Botão, Campo numérico e marcar série) |
| `npx expo export --platform web` | **exporta** (`dist/`, 2,2 MB de JS). A primeira tentativa, com o expo-sqlite na web, falhou: `Unable to resolve module ./wa-sqlite/wa-sqlite.wasm` → isolado em `dados/armazenamento/banco.web.ts` (localStorage) |
| Playwright (Chromium 1243 abriu) | 20 capturas (5 telas × 2 tamanhos × 2 temas), **0 erros de página, 0 erros no console, 0 rolagem horizontal** |

## 2. Versões instaladas (as que o npm resolveu)

expo 54.0.37 · expo-router 6.0.24 · react-native 0.81.5 · react 19.1.0 · react-dom 19.1.0 · **react-native-web 0.21.4 (novo)** · @expo/metro-runtime 6.1.2 (já estava) · react-native-reanimated 4.1.7 · react-native-worklets 0.5.1 · react-native-svg 15.12.1 · expo-sqlite 16.0.10 · expo-blur 15.0.8 · expo-linear-gradient 15.0.8 · react-native-safe-area-context 5.6.2 · react-native-screens 4.16.0 · @react-navigation/bottom-tabs 7.20 (vem com o expo-router) · typescript 5.9.3 · jest-expo 54.0.18 · react-test-renderer 19.1.0 (novo, dev).

Aviso do npm sem ação: `unrs-resolver` tem script de instalação ainda não aprovado no `allowScripts` (é do eslint; não afeta o app).

## 3. A árvore criada

```
app/
├── ferramentas/      gerar-tema.mjs · gerar-icones.mjs · copiar-imagens.mjs   (npm run gerar)
├── tema/             gerado/tokens.ts (GERADO) · ProvedorDeTema · tipografia · movimento ·
│                     vibracao + ProvedorDeVibracao · acessibilidade(.web) · fontes · index
├── componentes/      Texto · Icone (+ icones/gerado.ts GERADO) · IlustracaoExercicio · Botao ·
│                     Campo + CampoDeSelecao · CampoNumerico + BarraDoTeclado · Chip/Chips ·
│                     Cartao · SeloPlus · Vidro/PilulaDeVidro (+ vidro/FundoDesfocado(.web)) ·
│                     FotoComTexto · Degrade · Anel · Deslizar · BarraDeAbas · Cabecalho ·
│                     FolhaInferior · AvisoRapido (+ provedor) · EstadoVazio · Auxiliares
│                     (Avatar, Divisor, CartaoDeNumero, Esqueleto) · usePressionado · index
├── dados/            repositorio.ts (interface única) · ProvedorDeDados · consultas ·
│                     local/ (dados-de-exemplo + RepositorioLocal) · supabase/ (só a forma) ·
│                     armazenamento/ (banco.ts SQLite · banco.web.ts · memoria.ts) · fila ·
│                     redigir · visao · *.test.ts
├── navegacao/        _layout · index (porta) · escolher-visao · componentes · +not-found ·
│                     (entrada)/ boas-vindas · (aluno)/ inicio treinos plus perfil ·
│                     (academia)/ alunos biblioteca acompanhamento painel perfil-da-equipe
├── telas/            rotas.ts · compartilhado/ (AbasDaVisao, TelaEscolherVisao,
│                     TelaEntrarComContaDeExemplo, TelaProvisoria, TelaCatalogoDeComponentes)
└── imagens/          cópia GERADA de 02-design/imagens (70 imagens, 1,2 MB) + créditos + indice.ts
```

Mexidos: `package.json` (scripts `web`, `iniciar:expo-go`, `gerar*`, `copiar:imagens`, `exportar:web`; o glob dos testes inclui `dados/`), `app.json` (só `android.allowBackup: false` e o bloco `web`; o resto é do W), os `LEIA-ME.md` das pastas e o `app/LEIA-ME.md`.

## 4. Como cada pedido da seção X foi atendido

1. **Instalação**: acima. `react-native-web` e `react-dom` pelo `expo install`; `@expo/metro-runtime` já estava.
2. **Tema gerado**: `npm run gerar:tema`. Resolve papéis ("marca", "viva") por tema, calcula o `color-mix` do vidro selecionado, traduz os degradês CSS (linear → expo-linear-gradient; a luz lateral radial → react-native-svg), converte curvas, e monta cada estilo da escala com a fonte pelo nome do arquivo e o teto de ampliação. O gerador **reprova** tamanho fora da escala fechada.
3. **Componentes**: todos os da lista, mais o Campo de seleção (componente 4) e os Auxiliares. Efeitos do catálogo com Reanimated 4: botão e cartão afundam (0,98, mola de toque), anel enche em `lenta` ou esvazia em linha reta pelo tempo do motor, deslizar com limiar de 85 % e ação no soltar, aviso rápido entra 16 → 0 e sai 8, esqueleto espera 300 ms e passa no máximo 3 vezes, cabeçalho grande encolhe nos primeiros 40 px. Com "reduzir movimento" tudo vira o `esmaecer` de 160 ms (`ReduceMotion.Never`). Vidro com `expo-blur` e sólido com "reduzir transparência" (e sólido a 92 % no Android abaixo do 12). Área de toque de 48 por `hitSlop` em todo controle menor.
4. **Navegação**: `dados/visao.ts` decide pelo vínculo (sem sessão → entrada; zero vínculos → aluno sem academia; um → a visão do papel; dois → o último escolhido ou "Entrar como…"). "Trocar de visão" em `/escolher-visao`, sem sair da conta, invalidando o cache. Abas do aluno (4) e da academia (3 a 5 pelos papéis na mesma academia).
5. **Dados**: interface única `Repositorio`; o local tem a Ana (aluna Plus, ABC Hipertrofia em uso com as cargas dos mockups, 12 treinos no mês, dieta de 5 refeições da nutricionista parceira acompanhada pela Júlia), a Academia do Marcos (equipe com 6 perfis, 5 visíveis), outros alunos (Rafael 34 dias sem treinar, Beatriz sem cadastro, Bruno que não autorizou a academia e pediu treino, Juliana pendente, Helena Plus sem personal) e os 11 treinos prontos REAIS do catálogo. Treino realizado e fila no SQLite (síncrono), com a regra de `sincronizacao.ts`. Supabase só na interface. `redigir.ts` com teste que lê `dominio/tipos.ts`.
6. **`/componentes`**: as amostras na numeração do `02-COMPONENTES.md`, com chaves de tema, movimento, vidro e "sem rede" (para ver a fila guardar e subir).
7. **Verificação**: seção 1 e 5.

### Contas de exemplo (entrada provisória)
Ana Souza (aluna Plus) · Diego Alves (personal **e** aluno: cai no "Entrar como…") · Marcos Ribeiro (dono) · Carlos Mendes (instrutor) · Bianca Rocha (recepção) · Juliana Castro (pedido pendente → aluno sem academia) · Lucas Ferreira (sem academia).

## 5. As capturas olhadas

Em `C:\Users\alexs\AppData\Local\Temp\claude\a--Claude\40b1ec06-06e4-4f50-b321-b3e3c5f7f9d5\scratchpad\x-base\capturas\` (temporário; script `capturar.mjs` ao lado): `componentes`, `entrada`, `aluno-inicio`, `academia-alunos`, `escolher-visao`, cada uma em `celular` (393 × 852) e `ultrawide` (2040 × 790), `claro` e `escuro`; e o mockup (`mockup-componentes-*`) nas mesmas larguras para comparar.

O que a comparação com o mockup (`index.html#componentes`) mostrou:
- Botão, campo, campo numérico, chips, cartões, selo, barra de abas, cabeçalho, estado vazio, aviso rápido e ilustrações batem com o mockup nos dois temas (mesmas pílulas, verde vivo, contornos, pesos e tamanhos; no 2040 os dois ficam em 4 colunas).
- **Corrigido na hora**: (1) no navegador o `<svg>` solto pintava abaixo das camadas absolutas do vidro (o ícone do botão de vidro sumia) → o `Icone` ganhou uma View por fora; (2) o desfoque do vidro redondo aparecia quadrado → o raio vai também na camada do `backdrop-filter`; (3) o cabeçalho pequeno sem voltar tinha margem dobrada; (4) em 2040 a barra de abas se espalhava pela tela → as abas ficam na coluna de 600 (`layout.larguraMaximaConteudo`) e o cabeçalho pode alinhar a ela (`larguraMaxima`).
- Diferenças que ficam: o mockup mostra o "×" do campo de busca mesmo vazio (o app só mostra com texto); a mensagem de erro do campo numérico ganhou o ícone de 16 que o componente 2 pede.

## 6. Como o Alex abre no celular (Expo Go)

1. No celular, instalar o **Expo Go** (Play Store ou App Store).
2. Celular e PC **na mesma rede Wi-Fi**.
3. No PC: `cd "A:\Claude\03-projetos\Academia Plus\app"` e `npm run iniciar:expo-go` (é o `npx expo start --go`; o `--go` é obrigatório porque o projeto tem o `expo-dev-client`).
4. Aparece um QR no terminal: no **Android**, ler pelo próprio Expo Go; no **iPhone**, pela Câmera.
5. Entrar com uma conta de exemplo. Para ver os componentes: Perfil → "Ver os componentes", ou a rota `/componentes`.

Se não abrir: o Windows pode perguntar sobre o firewall do Node (permitir em rede privada); em Wi-Fi de visitante, usar `npx expo start --go --tunnel`. **Não testado num aparelho nesta rodada.** Atenção: o Expo Go da loja só roda o SDK mais recente; se ele disser que o projeto (SDK 54) é antigo, no Android dá para instalar o Expo Go do SDK 54 pelo próprio `expo start` (tecla `a` com o celular no cabo) ou por expo.dev/go; no iPhone o caminho é o build de desenvolvimento (`npm run build:ios:desenvolvimento`, conta Apple paga) ou subir o projeto de SDK.

No navegador do PC: `npm run web`.

## 7. Pendências e achados

**Para outras pastas (não mexi):**
- `dominio/papel.ts` com `visaoDoPapel` e a permissão fina: a regra mora em `app/dados/visao.ts` (com teste) até alguém do domínio mover.
- `tokens.json › tipografia.familiaPorPeso.numero` só tem o 700; `numeroGigante` e `numeroDestaque` pedem 800. O gerador usa `Archivo-ExtraBold` (o arquivo existe e está no app.json).
- `raio.folha` é **28** no `tokens.json` e **24** no `sistema.css` (e no texto do componente 14). O app segue o token (28).
- Seis valores do `sistema.css` não estão no `tokens.json` (camada de toque, brilho do esqueleto, aviso invertido, trilho sobre foto): estão num bloco único do gerador, com a origem citada.
- Mockups com dados que não batem entre si (academia "Corpo & Vida" × "do Marcos"; personal Júlia × Carla; frequência 3× × 4 dias). O exemplo usa Academia do Marcos, Júlia e 4 dias.

**Do domínio**: nenhum bug achado; os 318 testes passam e as funções usadas (copiar pronto, alterar série, ativar, perfil profissional, catálogo, sincronização) se comportaram como documentado.

**Para a onda 2 (Y e Z)**:
- Troquem os arquivos de rota de `navegacao/(aluno)/` e `navegacao/(academia)/` (hoje `TelaProvisoria`). Os nomes das rotas da academia são diferentes dos do aluno de propósito (ver `navegacao/LEIA-ME.md`).
- Em tela larga, limitem a coluna a `layout.larguraMaximaConteudo` (600) e passem `larguraMaxima` ao `Cabecalho`.
- Marcar série: `useFila().registrarTreinoRealizado(treino)` grava síncrono; anime pela mudança do dado.
- A entrada de verdade substitui `(entrada)/boas-vindas.tsx` (as contas de exemplo podem virar um atalho de demonstração).

**Do aparelho (não dá para ver no navegador)**: desfoque no Android 12+, vibração, barra do teclado do iPhone, folha nativa (`OPCOES_DA_FOLHA_NATIVA` em `telas/rotas.ts`), `isExcludedFromBackup` do SQLite no iPhone (pede código nativo) e a saturação 0,9 da foto (o filtro de saturação do React Native é só do Android; ficou de fora).
