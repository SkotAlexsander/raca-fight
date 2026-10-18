# AB — Bugs e erros no app construído (P11, onda 4) · 11/10/2026

O Alex pediu: "depois verificar se há bugs, e procurar erros". O agente AB caçou defeitos no app que o AA deixou funcionando. Exportou o app para a web, nas versões de produção e de desenvolvimento (só a de desenvolvimento mostra os avisos do React). Percorreu todas as rotas e todos os botões com Playwright, conta por conta. Escreveu testes de estado, concorrência, migração, corrupção, limites, fuso, vazamento, segurança das telas, acessibilidade e desempenho.

Cada defeito corrigido tem um teste que **falhava antes** da correção. O design não mudou. A única diferença visível está no cartão "Meu personal" do Plus, explicada no achado M7.

Scripts e capturas (temporários) ficam em `scratchpad/ab/`:
- `varrer.mjs`: rotas e botões;
- `estado.mjs`: estado, memória, axe, foco, zoom;
- `sonda.mjs`;
- `estado/contraste.py`;
- `ponta-a-ponta.mjs`: os 8 fluxos do AA.

## 1. Resultado das verificações (no fim, com tudo corrigido)

| Verificação | Resultado |
|---|---|
| `npm run tipos` (tsc) | **0 erros** |
| `npm run testar:dominio` (domínio + dados), TZ padrão (São Paulo) | **382 de 382** (eram 367; +15 de `dados/revisao-ab.test.ts`) |
| o mesmo com `TZ=UTC` | **382 de 382** |
| o mesmo com `TZ=Asia/Tokyo` | **382 de 382** |
| e ainda `Pacific/Kiritimati` (UTC+14), `Pacific/Pago_Pago` (UTC−11) e `America/Los_Angeles` | **382 de 382** (antes da correção B9, Kiritimati falhava 2) |
| `npm run testar:telas` (jest-expo) | **97 de 97**, 11 suítes (eram 67 em 5) |
| `npx expo-doctor` | **18/18** |
| `npx expo export --platform web` | exporta (2,55 MB de JS) |
| Os 8 fluxos do AA, Playwright, 393 e 2040 × 790, claro e escuro | **32 de 32 passam** no build final |
| Varredura de rotas no build de desenvolvimento final | 10 contas, **227 visitas, 0 com problema**: nenhum erro, aviso do React, promessa solta ou 404 |
| axe no build final (14 telas × 2 temas, mais o Modo treino) | sobram só as 2 regras menores da seção 4 (eram 7 regras) |

**Atenção para quem roda os testes de fuso.** No Git Bash, `TZ=Asia/Tokyo npm …` **não muda o fuso**: o Node continua em −03:00 (só `TZ=UTC` pega). Rode pelo PowerShell:

```powershell
$env:TZ='Asia/Tokyo'; npm run testar:dominio
```

Os relatórios anteriores que dizem ter rodado "em Tóquio" pelo bash rodaram em São Paulo.

## 2. Achados por gravidade

Cada achado traz o arquivo e a linha da correção, como reproduzir e o teste.

### ALTA

**A1 — A série marcada enquanto o treino subia se perdia, e um treino encerrado podia "reabrir".**
- **Onde:** `dados/fila.ts:59-115` (antes, `enviarFila`).
- **O defeito:** no fim do envio, o código fazia duas coisas, sem conferir se o item tinha mudado durante o envio:
  - tirava o item da fila **pelo id**;
  - regravava o treino do aparelho com a carga que **tinha subido**, mais o `sincronizadoEm`.
- **Reproduzir:**
  1. Marque uma série e, enquanto ela sobe, marque outra, toque "Desfazer" ou "Encerrar". O envio simulado leva 300 ms; o de verdade leva segundos com sinal fraco.
  2. A versão nova sai da fila e nunca sobe.
  3. O treino do aparelho volta à versão velha: perde a série nova ou perde o `fimEm`.
  4. Na próxima abertura, a retomada abre de novo um treino que estava encerrado.
- **Correção:**
  - Só tira da fila e só marca `sincronizadoEm` se o guardado é **o mesmo** que subiu.
  - Senão, a versão nova fica na fila. O `ProvedorDeDados.tsx:213-217` a manda na volta seguinte, sem esperar os 15 s.
  - A tentativa que falha conta na versão guardada.
- **Teste:** `dados/revisao-ab.test.ts`, "AB1".

**A2 — A aba escondida abria pelo endereço.**
- **Onde:** `telas/rotas.ts:46-61` (`podeAbrirNaAcademia`) e `navegacao/(academia)/_layout.tsx:24`.
- **O defeito:** o `href: null` tira a aba da barra, mas a rota continua aberta.
- **Reproduzir:** na web, como Carlos (instrutor), abra `/painel` e depois `/painel/equipe`.
  - Ele via os números do dono, o "Designar" e a Equipe com "Esconder dos alunos" (R11.7: só o dono).
  - A recepção e o instrutor abriam `/acompanhamento`, a lista do personal.
  - O instrutor e o personal abriam `/alunos/novo-aviso` e **publicavam aviso**. R10.10 diz que escrevem o dono e a recepção; o instrutor é [decidir].
  - No celular o mesmo acontece por link profundo.
- **Correção:**
  - O layout da academia confere o caminho e manda para `/alunos`.
  - A regra sai das abas (`papeis`) e acrescenta as duas telas de aviso.
- **Teste:** `telas/rotas.test.tsx` (21 casos), conferido também no navegador (a seção 5).

### MÉDIA

**M1 — "Descartar o treino" voltava ao abrir o app de novo.**
- **Onde:** `telas/aluno/estado/ProvedorDoAluno.tsx:329-332` e `:524-526`.
- **O defeito:** descartar só limpava a tela. O treino aberto continuava gravado sem fim, e a retomada ("o app fechou no meio") o trazia de volta como "Em andamento".
- **Reproduzir:** Começar → Série feita → Pausar → Descartar → recarregar a página. O Início mostra "Em andamento" e a faixa volta.
- **Correção:** o id do treino descartado fica no aparelho (`treino-descartado.<aluno>`), e a retomada o pula. As séries continuam gravadas, como a folha promete.
- **[decidir]** O treino descartado deve subir ao servidor (hoje sobe, aberto) ou sair da fila?
- **Teste:** `telas/aluno/TelaModoTreinoDescartar.test.tsx`.

**M2 — Refeição desmarcada depois de subir ficava no servidor** (pendência do AA).
- **Onde:** `dados/fila.ts:117-143` (`tirarRefeicaoDaFila`, `enfileirarApagarRefeicao`), `dados/local/RepositorioLocal.ts` (`registrarRefeicao`, `desfazerRefeicao`) e `dominio/sincronizacao.ts:20-27`.
- **Correção:** o novo tipo da fila `refeicao_apagada` cobre três casos:
  - desmarcar a que já subiu;
  - desmarcar enquanto ela sobe;
  - trocar a marca ("feita" para "não segui") de uma que já subiu.

  A marca que ainda não subiu só sai da fila.
- **Para o servidor:** o destino apaga pelo `carga.id`. Falta citar esse tipo no `03-arquitetura/03-DECISOES-TECNICAS.md`, seção 2 (não é pasta do AB).
- **Teste:** "AB3", quatro casos.

**M3 — Duplo toque gravava duas vezes.**
- Em todos os casos abaixo, o segundo toque chega antes de a gravação terminar:
  - **"Enviar" treino ao aluno** (pronto em dois toques ou montado): duas cópias no aluno e dois envios. Corrigido em `telas/academia/envio.tsx`, na `FolhaDeEnvio`. Teste: `telas/academia/FolhaDeEnvio.test.tsx`.
  - **"Enviar" aviso da academia**: dois avisos (`telas/academia/TelasDeAviso.tsx:162`).
  - **"Enviar pedido"** de treino: o segundo dava "Não deu para enviar" logo depois de "Pedido enviado" (`telas/aluno/TelaTreinos.tsx`, `FolhaPedirTreino`).
  - **"Entendi"/"Continuar" no fim da entrada**: criava duas contas. Com e-mail digitado, dava "Já existe uma conta" depois de criar (`telas/entrada/TelasDoAluno.tsx`, `useConcluirAluno`).
- **Correção:** o gancho `componentes/useUmPorVez.ts`. A trava é uma ref, e o botão mostra `carregando`.
- **De quebra:** a recusa do repositório ao publicar aviso virava promessa sem tratamento; agora vira um aviso de erro.

**M4 — Duplo toque no Modo treino.**
- **Onde:** `ProvedorDoAluno.tsx:400` (`marcarSerie`) e `:420-425` (`desfazerUltima(idEsperado)`); `TelaModoTreino.tsx:108`.
- **O defeito:**
  - Dois toques em "Série feita" no mesmo quadro gravavam a mesma série duas vezes (duas `SerieRealizada` com o mesmo `serieId`). O volume e a Evolução contavam em dobro. No aparelho, isso pede os dois toques chegando antes do redesenho (o JS ocupado). Os dois caminhos que marcam a série por tempo, o fim sozinho e o "Parar", também caem na mesma trava.
  - Dois toques em "Desfazer" desfaziam **duas** séries.
- **Correção:** a série já feita não entra de novo, e o "Desfazer" só desfaz a série que a tela mostra.
- **Teste:** `telas/aluno/TelaModoTreinoDuploToque.test.tsx`.

**M5 — O "Desfazer" do aviso "Série salva" (Cronômetro → Registrar como série) desfazia a série errada.**
- **O defeito:** ele desfazia "a última", e não a que foi salva. Se outra série fosse marcada nos 5 s do aviso, ela sumia no lugar.
- **Onde:** `registrarSerieDeTempo` agora devolve o id, em `ProvedorDoAluno.tsx`; `TelaCronometro.tsx:257`.

**M6 — O Modo treino inteiro redesenhava 4 vezes por segundo no descanso.**
- **O defeito:** o relógio do `ProvedorDoAluno` mudava a cada 250 ms. A foto com desfoque, o vidro, os campos e a faixa redesenhavam, embora o número só mude por segundo.
- **Correção:** `telas/aluno/estado/relogio.ts`. O tique continua de 250 ms, mas o "agora" só muda quando a leitura que a tela mostra muda (segundo, fase, estado, "acabando").
- **Resultado:** num descanso de 10 s, foram **40 redesenhos antes e 11 depois**, e nenhum com o cronômetro parado. O anel não perde nada: ele anima sozinho entre as recalibrações.
- **Teste:** `telas/aluno/estado/relogio.test.tsx`.

**M7 — Botão dentro de botão no cartão "Meu personal" (Plus).**
- **O defeito:** o cartão inteiro era um botão (abria o perfil) com "Conversar" dentro.
  - No iPhone, o VoiceOver lê o cartão como **um elemento só**, e "Conversar" fica inalcançável pelo leitor de tela.
  - Na web é HTML inválido (`<button>` dentro de `<button>`), e o React avisa no console.
- **Correção:** `telas/aluno/TelaPlus.tsx:112-140`. A linha de cima (avatar, nome) abre o perfil e "Conversar" fica ao lado, no mesmo cartão.
- **O que muda na tela:** o cartão parado continua igual. Ao tocar, a linha de cima esmaece em vez de o cartão afundar.

**M8 — Na web, o leitor de tela não recebia o estado de nada.**
- **O defeito:** o react-native-web 0.21 ignora os objetos `accessibilityState` e `accessibilityValue`. O axe acusou, em `/perfil`, `/perfil/avisos`, `/plus/dieta`, `/alunos/novo-aviso`, `/inicio/cronometro` e no Modo treino:
  - chave sem `aria-checked`;
  - caixa de refeição sem `aria-checked`;
  - campo de carga e de repetições sem valor;
  - botão desabilitado ou carregando sem `aria-disabled`/`aria-busy`.
- **Correção:** os `aria-*` (que o RN 0.81 também entende no celular), ao lado do `accessibilityState`, em:
  - `Interruptor`, `Botao`, `Chip`, `CampoNumerico`, `Campo` (opções), `Deslizar`, `Lista`, `Graficos` e `Quadro`;
  - a caixa da dieta, as opções da equipe e as peças da entrada.

  O chip escolhido usa `aria-pressed`, porque o `aria-selected` não vale em botão (o axe acusou de novo na primeira correção). A barra do medidor ganhou nome.
- **Teste:** `componentes/EstadoAcessivel.test.tsx`; o axe no build final está na seção 5.

**M9 — Armazenamento corrompido derrubava a abertura do app.**
- **O defeito:**
  - No celular, **uma** linha com JSON quebrado no SQLite fazia o `JSON.parse` lançar erro, e o app não abria mais.
  - No navegador, um estado com o formato errado (`"fila": null`, `"colecoes": "lixo"`, `[]`) quebrava `Object.values`.
- **Correção:**
  - `dados/armazenamento/sqlite.ts:81-89` pula a linha corrompida, sem levar o conteúdo ao log.
  - `banco.web.ts:13-30` (`sanear`) zera só a parte errada.
  - `memoria.ts` ignora nulos.
  - `RepositorioLocal.ts` ignora registro que não é objeto.
- **Teste:** "AB5", três casos.

**M10 — "Entrar com e-mail" não achava a conta criada na entrada** (pendência do AA).
- **Onde:** `Repositorio.usuarioPeloEmail` (`dados/repositorio.ts:145`, `RepositorioLocal.ts:142`) e `TelasDeConta.tsx:133`.
- **Prova:** com o build antigo, o Playwright cria a conta pela Apple, sai, entra pelo e-mail (em maiúsculas) e fica parado com "E-mail ou senha não conferem". No build novo, cai no Início com a sessão da conta criada.
- **Teste:** "AB7".

### BAIXA

**B1 — Duas subidas da fila ao mesmo tempo mandavam o mesmo item duas vezes.**
- Era latente: o `ProvedorDeDados` já evitava com a `enviandoRef`, mas a função de `dados/` não.
- A futura escuta do NetInfo cairia nisso.
- **Correção:** uma subida por aparelho; quem chama durante outra recebe a mesma promessa (`dados/fila.ts:59-77`).
- **Teste:** "AB2".

**B2 — "Voltar" morto depois de recarregar a página.**
- **O defeito:** com a pilha vazia, `router.back()` não faz nada, e o React avisa "GO_BACK was not handled".
- **Onde:**
  - "Trocar de visão" (`TelaEscolherVisao.tsx:24`);
  - os passos Objetivo, Dias por semana e Quem pode ver da entrada (`TelasDoAluno.tsx:27`).
- **Correção:** o botão volta ao passo anterior ou ao começo.
- **Achado por:** a varredura dos botões (9 ocorrências em 7 contas).

**B3 — Aviso do React em todas as telas da web.**
- **O aviso:** "Received `false` for a non-boolean attribute `accessible`".
- **A causa:** o `accessible={false}` do `<Svg>` do `Icone` e do `Simbolo`, que o react-native-svg passa direto ao DOM.
- **Correção:** `componentes/svgDecorativo.ts` usa `aria-hidden` na web e `accessible={false}` no celular.

**B4 — `autoComplete="password"` é inválido.** O navegador e o gerenciador de senhas não o reconhecem. Virou `current-password` em `TelasDeConta.tsx:144`.

**B5 — "Ana Souza, você tem 1 vínculos."** Plural corrigido em `TelaEscolherVisao.tsx`.

**B6 — Aviso da academia com letras de largura total passava pelo filtro de link.**
- **Exemplos:** "Ｗｗｗ．ｘ．ｃｏｍ", "academia．com．br".
- **Onde:** `dominio/avisos.ts:605` normaliza com NFKC antes de conferir.
- **Teste:** "AB6". Vale também para o "Sobre" do perfil profissional, que usa o mesmo `temLink`.

**B7 — O teste dos dados de exemplo falhava em UTC+14** (`Pacific/Kiritimati`).
- **A causa:** ele esperava a data '2026-10-12' fixa para um instante às 10:00 −03:00.
- **Não é defeito do app:** o app usa a data local certa. O teste agora calcula a data local (`dados/local/dados-de-exemplo.test.ts:21`).

## 3. O que foi verificado e está certo (sem correção)

| Pedido | Como | Resultado |
|---|---|---|
| Erro de execução | Rotas: 10 contas × todas as rotas, 227 visitas, no build de desenvolvimento, coletando erro de página, `console.error`/`warn`, promessa sem tratamento (escuta de `unhandledrejection`) e 404. Botões: em 7 das 10 contas, cada alvo tocável visível, um toque e um duplo toque, numa página limpa | Antes: o aviso `accessible` (B3), o botão dentro de botão (M7) e o "Voltar" morto (B2). Nenhum erro de página, nenhuma promessa solta, nenhuma rota 404 de verdade (a `/abrir-academia` diz "esta tela não existe" no texto do [decidir], falso positivo) |
| Recarregar em cada tela | Cada rota aberta direto pelo endereço (= recarregar) | Abrem. A única que perdia o "Voltar" era a B2 |
| Trocar de conta com dados abertos | A Ana com treino e descanso → Sair → Lucas → Sair → Ana | O Lucas não vê nada da Ana, e o treino da Ana volta (o `ProvedorDoAluno` tem chave pela conta) |
| Trocar de visão com dado aberto | Fluxo 7 do AA (Diego), seção 5 | — |
| Voltar no meio | Botão voltar do navegador no Modo treino e na folha "Usar este treino" | A faixa "Em andamento" fica; avançar volta ao treino; nunca há dois treinos ativos |
| Segundo plano | `visibilitychange` + página congelada 6 s no descanso | O descanso andou 7 s (120 → 113): é contado por instante, não por tique |
| Migração 1 → 2 | O SQL de verdade no `node:sqlite` (o mesmo motor) | Migra sem perder treino, fila nem preferência. Reabrir não migra de novo. Migração quebrada volta atrás inteira (a versão fica 1). O SQL saiu do `banco.ts` para `dados/armazenamento/sqlite.ts`, que o Node testa |
| Limites | 100 treinos com nome de 200 caracteres, emoji e acento | Voltam iguais ao reabrir. Na tela: 721 ms até o último, sem rolagem horizontal (nem no Editar) |
| Lista longa sem virtualização | 300 alunos na academia | 633 ms até o último, 4.761 nós; a busca filtra em 67 ms. Não precisa de `FlatList` agora; vale rever acima de ~1.000 alunos ou com foto na linha |
| Vazamento | O fluxo do treino (começar, marcar, pular, pausar, descartar, Treinos, Cronômetro, Início) repetido **20 vezes** sem recarregar, com coleta de lixo forçada | Escutas na janela: 9 → 9. No documento: 27 → 27. Intervalos ativos: 1 → 1. Memória: 11,9 → 14,4 MB, quase parada depois da volta 10 (são os 20 treinos guardados). Sem vazamento |
| Aluno abrindo rota da academia | `/alunos`, `/alunos/usuario-ana`, `/painel` como Ana | Mandado para `/inicio` (o guarda do grupo já existia) |
| Pendente vendo o que não deve | Juliana: Equipe, perfil da Carla, aviso da academia, Plus, dieta | Não vê (R12.9, R11.5) |
| Perfil oculto pelo link | Ana em `/perfil/profissional/perfil-rafael-costa` (desligado) e `/xyz` | "Este perfil não está disponível" |
| Dado de saúde em log | Todo `console.*` do app passa por `registro` (`redigir.ts`); as mensagens de erro do domínio só levam ids e formatos | Nada de saúde |
| Aviso com HTML e link | Um aviso gravado direto, sem a validação: `<img src=x onerror=…><b>oi</b> https://x.co javascript:…` | Aparece como texto. Nenhum `<img>`, nenhum `<b>`, nenhum `<a>`, nada executou. A validação recusa o link (B6) |
| Contraste do Modo treino no escuro | A tela com o texto e sem ele, sobre a foto, pixel a pixel (pior 5 % do fundo), nos dois temas, série e descanso | Pior caso **8,5:1** (legenda "Descanso", `#A3B1B0`). Todos passam folgados de 4,5:1 |
| Ordem de foco | Tab em `/entrar-com-email`, `/inicio`, `/modo-treino`, `/alunos` | Na ordem de leitura, sem foco invisível nem armadilha. O campo não tem o anel do navegador, mas tem o contorno próprio de foco (`setFoco`) |
| Fonte e zoom a 200 % | A 320 px (o mínimo da WCAG) e a 1020 × 395 (2040 a 200 %), em 10 telas | Sem rolagem horizontal. Na web, o "tamanho do texto" do navegador não muda o app (o react-native-web usa px); no celular vale a fonte do sistema, com os limites por estilo que o X fez |

## 4. Pendências (não corrigidas)

- **[decidir]** O **treino descartado** sobe ao servidor (hoje sim, aberto) ou sai da fila?
- **[decidir]** A academia abre o perfil do aluno **pendente** e consegue "Montar treino" e "Dar treino pronto" para ele (o Marcos para a Juliana). Ela não vê dado de saúde, mas R12.9 diz que "a academia continua sem ver o aluno até confirmar". Esconder os dois botões até confirmar?
- **[decidir]** Se o **instrutor** também escreve aviso (R10.10, pergunta 21): hoje a rota é só do dono e da recepção.
- **Abaixo de 320 px de largura** (393 com 200 % de zoom no próprio celular), a barra de abas não cabe e "Perfil" sai 59 px da tela. A WCAG pede 320; não mexi no desenho.
- **axe, sobras menores:**
  - `aria-required-children` na semana do Início (uma lista com itens que não são de lista);
  - `aria-prohibited-attr` num `div` com rótulo e sem papel no Perfil do aluno (academia). O leitor de tela ignora esse rótulo.
- Algumas gravações das telas do aluno usam `void repo.…` sem `catch` (`ProvedorDoAluno.salvarVarios`, `registrarMedicao`, `salvarPreferenciasDeAviso`). No repositório local elas não falham. **Com o Supabase**, precisam de tratamento (aviso "não salvou" e nova tentativa); hoje viraria promessa sem tratamento.
- `03-arquitetura/03-DECISOES-TECNICAS.md`, seção 2: incluir o item `refeicao_apagada` da fila (M2).
- **Só no aparelho** (não dá para ver no navegador): a migração do SQLite rodando no expo-sqlite (o SQL é o mesmo, testado no `node:sqlite`), o VoiceOver/TalkBack de verdade e o `AppState` (o app não escuta a volta do segundo plano; o cronômetro está certo porque conta por instante, e a fila tenta a cada 15 s).

## 5. As provas do build final

O build final é o `scratchpad/ab/dist5` (produção) e o `dist5-dev` (desenvolvimento), com tudo da seção 2.

- **Os 8 fluxos do AA** (`ponta-a-ponta.mjs`): **32 de 32 passam**. São primeiro acesso, treino completo, pronto e deslizar, instrutor dá pronto, dono oculta perfil, sem rede, trocar de visão e recarregar no treino, em 393 × 852 e 2040 × 790, claro e escuro. Nenhum erro de página nem de console, nenhuma rolagem horizontal.
- **Varredura das rotas** (`varrer.mjs todas rotas dist5-dev`): 10 contas, 227 visitas, **0 com problema**:
  - aluno: Ana, Juliana pendente, Lucas sem academia e Diego aluno;
  - academia: Diego personal, Marcos dono, Carlos instrutor, Bianca recepção e Júlia personal;
  - sem conta.

  Antes, em todas as visitas, aparecia o aviso de `accessible` (B3) e, no Plus, o botão dentro de botão (M7).
- **Guardas** (`sonda.mjs`):
  - o Carlos em `/painel` e `/painel/equipe`, a Bianca em `/acompanhamento` e a Júlia em `/alunos/novo-aviso` vão para `/alunos`;
  - o Marcos continua abrindo `/painel/equipe`;
  - a Júlia continua abrindo `/acompanhamento`.
- **Cenários de estado** (`estado.mjs`), todos passam no build final: trocar de conta, voltar no meio, segundo plano, aviso com HTML e entrar com o e-mail da conta criada. A memória foi medida no build anterior; o que mudou depois não toca no ciclo medido.
- **Os testes que falhavam antes de cada correção:**
  - `dados/revisao-ab.test.ts`: 10 dos 15 falhavam por defeito do app;
  - `telas/rotas.test.tsx`: 21 de 21;
  - `telas/aluno/TelaModoTreinoDuploToque.test.tsx` e `TelaModoTreinoDescartar.test.tsx`;
  - `telas/aluno/estado/relogio.test.tsx`: 40 redesenhos contra no máximo 11;
  - `telas/academia/FolhaDeEnvio.test.tsx`: 2 envios contra 1;
  - `componentes/EstadoAcessivel.test.tsx`: 4 de 4.

  Ficaram de fora dessa conta, porque já passavam:
  - os 4 de `revisao-ab.test.ts` que só cobrem o que estava certo (a rede caindo no meio, desmarcar antes de subir e os dois da migração);
  - o de 100 treinos, que falhava só porque o `banco.web.ts` não abria no Node (faltava o `.ts` no import, também corrigido; o limite em si estava certo).

## 6. Arquivos novos e mexidos

Novos:
- `app/dados/armazenamento/sqlite.ts`
- `app/dados/revisao-ab.test.ts`
- `app/telas/aluno/estado/relogio.ts` e `relogio.test.tsx`
- `app/telas/aluno/TelaModoTreinoDuploToque.test.tsx`
- `app/telas/aluno/TelaModoTreinoDescartar.test.tsx`
- `app/telas/academia/FolhaDeEnvio.test.tsx`
- `app/telas/rotas.test.tsx`
- `app/componentes/useUmPorVez.ts`
- `app/componentes/svgDecorativo.ts`
- `app/componentes/EstadoAcessivel.test.tsx`

Mexidos, só a correção:
- dados: `dados/fila.ts`, `dados/ProvedorDeDados.tsx`, `dados/repositorio.ts`, `dados/local/RepositorioLocal.ts`, `dados/supabase/RepositorioSupabase.ts`, `dados/armazenamento/banco.ts`, `banco.web.ts`, `memoria.ts`, `dados/local/dados-de-exemplo.test.ts`;
- domínio: `dominio/sincronizacao.ts`, `dominio/avisos.ts`;
- telas do aluno: `telas/aluno/estado/ProvedorDoAluno.tsx`, `TelaModoTreino.tsx`, `TelaCronometro.tsx`, `TelaPlus.tsx`, `TelaTreinos.tsx`, `TelaDieta.tsx`;
- telas da academia: `telas/academia/envio.tsx`, `TelasDeAviso.tsx`, `TelasDaEquipe.tsx`;
- entrada e telas comuns: `telas/entrada/TelasDeConta.tsx`, `TelasDoAluno.tsx`, `pecas.tsx`, `telas/compartilhado/TelaEscolherVisao.tsx`, `telas/rotas.ts`, `navegacao/(academia)/_layout.tsx`;
- componentes: `Botao`, `Chip`, `Campo`, `CampoNumerico`, `Deslizar`, `Graficos`, `Icone`, `Interruptor`, `Lista`, `Quadro`, `Simbolo` e `index.ts`.

As decisões técnicas estão em `docs/decisoes.md` (11/10/2026, "Correções da caça a bugs").
