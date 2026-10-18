# AG — Terceira varredura: leitura de código e casos de erro (P11, onda 5) · 11/10/2026

O Alex pediu: "prosseguir com mais varredura de bugs e melhorias". As passadas AB e AE foram de fluxo e de interação. Esta foi de **leitura de código** (`dados/`, `componentes/`, `navegacao/`) e de **falhas simuladas**: disco cheio, banco travado, navegador sem espaço, JSON estragado na fila, relógio pulando, fila com 1.000 itens e o app fechando no meio de uma gravação.

A regra de todos os achados: **o dado do aluno nunca se perde**, e quando o aparelho não grava, a tela fica sabendo. Antes, ela dizia "salvo" e o dado sumia ao reabrir.

Cada correção tem o teste que **falhava antes**. Nada do design mudou. Duas mudanças se veem na tela:
- quando a gravação falha, aparece o aviso rápido de erro "Não deu para salvar." com "Tentar de novo";
- a conta nova e o pedido para entrar numa academia agora dizem "Sem sinal" quando estão sem rede.

Scripts e capturas ficam em `scratchpad/ag/`:
- `ponta-a-ponta.mjs`: os 8 fluxos, copiados do AE;
- `sonda-ag.mjs`: guardas de rota, navegador cheio no meio do treino, foco da folha e axe;
- `medir-fila.ts`: o tempo da fila;
- `dist/`: o export de produção.

---

## 1. Resultado das verificações (no fim, com tudo corrigido)

| Verificação | Resultado |
|---|---|
| `npm run tipos` (tsc) | **0 erros** |
| `npm run testar:dominio` (domínio + dados), TZ padrão | **430 de 430** (eram 413; +17 de `dados/revisao-ag.test.ts`) |
| o mesmo com `TZ=Asia/Tokyo` pelo PowerShell (offset −540 conferido) | **430 de 430** |
| `npm run testar:telas` (jest-expo) | **135 de 135**, 21 suítes. Rodou 3 vezes seguidas sem falha. Numa rodada intermediária, 1 teste falhou uma vez e não voltou a falhar; não consegui identificar qual (ver seção 6) |
| `npx expo lint` (configuração nova do Expo, `app/eslint.config.js`) | **0 erros**, 52 avisos (imports sem uso e diretivas `eslint-disable` sobrando, quase todos em `telas/`) |
| `npx expo-doctor` | **18/18** |
| `npx expo export --platform web` | exporta (2,57 MB de JS) |
| Os 8 fluxos do AA (393 e 2040 × 790, claro e escuro), no build final | **32 de 32** |
| Navegador **sem espaço** no meio do treino (Playwright: `setItem` lança `QuotaExceededError` e "Série feita" é tocado) | a tela mostra **"Não deu para salvar."**, sem erro de página. Com o espaço liberado, "Tentar de novo" grava o treino com a série |
| Guardas de rota como Carlos (instrutor), com 11 variações de endereço (`/painel/`, `/PAINEL`, `/painel?x=1`, `/%70ainel`, `/painel//equipe`, `/acompanhamento/usuario-ana`, `/alunos/avisos/`…) | **11 de 11 bloqueadas**: voltam a `/alunos` ou caem na tela "não existe" |
| axe em `/perfil/equipe` | **0 violações** (era a última, `aria-required-children`, pedida pelo AH) |
| Foco ao abrir a folha "Treino de hoje" | vai para o **primeiro item da folha**. Antes ia para o "Fechar" invisível. Tocar fora continua fechando |

`tsc` com as opções a mais, rodado numa execução à parte, sem mudar o `tsconfig`:
- **`--noUnusedLocals --noUnusedParameters`**: 28 avisos, todos imports e variáveis sem uso em `telas/`:
  - `academia/pecas.tsx`: 14;
  - `aluno/comum/Tela.tsx`: 8;
  - `ProvedorDoAluno`: 3;
  - `TelasDeProntos`, `TelaModoTreino` e `entrada/pecas`: 1 cada.

  Nenhum é bug: são sobras das promoções do AA.
- **`--noUncheckedIndexedAccess`**: 292 erros, 211 deles em testes. Revisei os 81 do código, um por um:
  - **bug real, 1**: o `TelaAvisos` recebia chave `undefined` das preferências gravadas por versão antiga. Corrigido na camada de dados (AG8);
  - **falso positivo, o resto**:
    - grupo de regex que casou;
    - índice já conferido pelo `length`;
    - tupla fixa de tokens;
    - lista que o validador do catálogo garante não vazia.

---

## 2. Achados por gravidade

### ALTA

**AG6 — Fila com 1.000 itens travava o app por 41 s**
- **Onde:** `dados/fila.ts` (antes, `subir`).
- **O defeito:**
  - a cada item enviado, o código relia e reinterpretava a fila INTEIRA (`arm.fila().find(...)`, e `arm.colecao(...)` na refeição);
  - no SQLite, a fila ainda fazia o `JSON.parse` duas vezes por linha;
  - entre um envio e outro, esse trabalho roda na linha do JavaScript: a tela fica parada.
- **Prova:** `scratchpad/ag/medir-fila.ts`, com 1.000 treinos de 20 séries:

  | | SQLite | memória |
  |---|---|---|
  | antes | 41,3 s | 16,0 s |
  | depois | 0,2 s | 0,2 s |
- **Correção:**
  - `ArmazenamentoLocal.itemDaFila(id)` e `registroDaColecao(nome, id)`, uma consulta por id;
  - um parse por linha;
  - o fim do envio passou para `concluirEnvio` (`dados/fila.ts:129`).
- **Teste:** "AG6", SQLite e memória: 1.000 sobem, em ordem, com `sincronizadoEm`, em menos de 4 s.
- **Fica:** no navegador, o `localStorage` grava o estado inteiro a cada escrita: com 1.000 itens na fila, ~20 ms por série. O navegador é só para ver o app.

**AG1 — O app fechando entre duas escritas deixava o treino fora da fila, e ele nunca subia**
- **Onde:** `dados/fila.ts:32` (`gravarEEnfileirar`) e `:46` (refeição); `dados/local/RepositorioLocal.ts` (`registrarRefeicao`, `desfazerRefeicao`, `ativarTreino`, `copiarPronto`, `enviarTreinoAoAluno`, `confirmarVinculos`).
- **O defeito:** eram duas escritas soltas. Se o app fechasse no meio:
  - o treino ficava gravado e fora da fila;
  - na troca de marca de refeição, a marca antiga era apagada e a nova se perdia, nos dois lados.
- **Prova:** um banco que "morre" depois da 1ª escrita:
  - antes: "treino gravado 1, na fila 0";
  - na refeição, antes: "fila m1:apagar · marcas (nenhuma)".
- **Correção:**
  - `ArmazenamentoLocal.transacao(f)`, tudo ou nada e aninhável;
  - no SQLite, a transação do banco (`sqlite.ts:124`);
  - na memória e na web, uma lista de desfazer e UMA gravação no fim (`memoria.ts:60`);
  - no repositório, `atomico` (`RepositorioLocal.ts:80`) tira uma foto das listas em memória e a devolve se a escrita falhar.
- **Testes:** "AG1", três casos: SQLite, navegador e a troca de marca.

**AG2 / AG3 — Disco cheio, banco travado e navegador sem espaço: a tela dizia "salvo" e o dado sumia ao reabrir**
- **Onde:**
  - `dados/armazenamento/banco.web.ts`: o `catch {}` vazio no `setItem`;
  - `dados/armazenamento/sqlite.ts`: o erro cru do motor;
  - `dados/local/RepositorioLocal.ts:110`: a lista em memória mudava ANTES de gravar.
- **Prova:**
  - "AG2": `salvarTreino` com "database or disk is full" rejeitava com o erro cru, e `treinosDoAluno` já mostrava o treino que não estava no disco;
  - "AG3": com `QuotaExceededError`, `gravarEEnfileirar` "dava certo", e o dado sumia ao recarregar.
- **Correção:**
  - `dados/erros.ts`: `ErroDeArmazenamento` com o motivo (`cheio`, `travado`, `bloqueado`, `outro`), sem o conteúdo na mensagem;
  - o SQLite embrulha o erro de toda escrita;
  - a memória e a web voltam atrás e lançam;
  - o repositório grava no aparelho primeiro e só depois muda a lista;
  - `pragma busy_timeout = 2000` (`banco.ts:33`).
- **Na web, de quebra:** o JSON estragado no `localStorage` é guardado à parte (`…:estragado`) antes de a próxima gravação escrever por cima.
- **Testes:** "AG2" (três casos) e "AG3". No navegador, `sonda-ag.mjs`.

**AG-D — "Deslize para começar" começava o treino ERRADO**
- **Onde:** `componentes/Deslizar.tsx:66`.
- **O defeito:** o PanResponder era criado uma vez (`useMemo` em `[reduzirMovimento]`) e guardava o `aoConcluir` do primeiro desenho.
- **Reproduzir:** na aba Treinos, o dia sugerido muda depois do primeiro desenho. Basta o histórico carregar, ou voltar à aba depois de treinar. O rótulo diz "Começar o Treino B", mas o ARRASTO começa o Treino A. O toque no botão usava a função nova.
- **Correção:** o gesto chama `concluirAtual.current`.
- **Teste:** `componentes/Deslizar.test.tsx`, "o arrasto chama o aoConcluir ATUAL". Antes, a função antiga era chamada 1 vez.

**AG9 — Disco cheio derrubava a tela inteira no treino com cronômetro**
- **Onde:** `ProvedorDoAluno.tsx:348`, que grava o cronômetro num `useEffect` (`repo.gravarNoAparelho`). Também `ProvedorDeDados` (`sair`, `entrar`, `escolherVinculo`, `definirVibracao`).
- **O defeito:**
  - um erro dentro de `useEffect` desmonta a árvore do React;
  - no celular, um erro sem tratamento num toque ("Sair") fecha o app.
- **Correção:** `dados/preferencias.ts` (`gravarPreferenciaSemTravar`):
  - o estado só do aparelho segue na memória, e a falha vai para o registro, sem o valor;
  - o `gravarNoAparelho` do repositório nunca lança.
- **Teste:** "AG9", dois casos.

### MÉDIA

**AG4 — Um item com o instante estragado travava a fila INTEIRA**
- **Onde:** `dominio/sincronizacao.ts:110` (`itensParaEnviar`).
- **O defeito:** o `msDe` lançava `RangeError`, e nenhum treino subia mais.
- **Prova:** "AG4" falhava com "criadoEm precisa ser um instante ISO com fuso; veio ontem à noite".
- **Correção:** o item estragado vai para o fim e não é apagado. A linha com o JSON da carga quebrado continua no banco.

**AG5 — O relógio voltando mandava a marca nova antes do "apagar" da antiga**
- **Onde:** `dominio/sincronizacao.ts:87` (`chaveDaMarca`) e a ordenação logo abaixo.
- **O defeito:** desmarcar às 12:40, o relógio voltar 1 h e marcar de novo às 11:41 subia `m2` antes de `m1:apagar`. Com uma marca por (aluno, refeição, data) no servidor, a nova seria recusada ou a errada apagada.
- **Correção:** o "apagar" sobe antes de qualquer marca da mesma refeição e data. Os dois só convivem quando o "apagar" é da marca antiga.
- **Teste:** "AG5".
- **E o resto da fila:** o relógio pulando não afeta mais nada. A ordem de leitura no SQLite passou de `order by criado_em` (texto com fuso) e `Date.now()` para `rowid`, a ordem de gravação; o envio continua pelo instante.

**AG-F — A folha pulava de volta no meio do arrasto**
- **Onde:** `componentes/FolhaInferior.tsx:69`.
- **O defeito:** o PanResponder era recriado a cada desenho. No Modo treino, a tela de trás redesenha a cada segundo do descanso, e o gesto novo zerava o `dy`: a folha pulava e o "arrastar para baixo fecha" não fechava.
- **Correção:** o gesto é criado uma vez e lê os valores por ref. Ganhou também `onPanResponderTerminate`: se outro gesto toma o dedo, a folha volta ao lugar.
- **Teste:** `componentes/FolhaInferior.test.tsx`. Antes, `aoFechar` era chamado 0 vezes.

**AG-T — As gravações das telas sem tratamento de erro** (pendência do AB)
- **Correção:** o padrão `componentes/useGravarComAviso.ts`, aplicado nas telas da seção 3.
- **Testes:** `componentes/useGravarComAviso.test.tsx`, quatro casos:
  - a falha vira aviso com "Tentar de novo";
  - o "Tentar de novo" grava com os mesmos dados;
  - o erro síncrono e o "sem sinal" também viram aviso;
  - o duplo toque é ignorado, e com `umPorVez: false` nenhuma gravação é descartada.

**AG10 — O pedido para entrar numa academia passava sem sinal** (pedido do AH e do coordenador)
- **Onde:** `RepositorioLocal.ts:177`, `:187` e `:204`.
- **Correção:**
  - `criarConta`, `pedirVinculo` e `cancelarPedidoDeVinculo` recusam com `ErroSemSinal`, como o pedido de treino (03-DECISOES, seção 2);
  - na entrada, "Tentar de novo" reaproveita a conta já criada (`TelasDoAluno.tsx:42`, `TelasDaEquipe.tsx:35`), em vez de dar "já existe uma conta com esse e-mail";
  - as três telas dizem "Sem sinal…".
- **Teste:** "AG10", com um controle positivo.

### BAIXA

| Achado | Onde | Correção e teste |
|---|---|---|
| **AG7** Instante comparado como TEXTO. "23:30−03:00" vem depois de "00:10−02:00" do dia seguinte | `RepositorioLocal.ts:149` (histórico) e `:312` (aviso em vigor) | `Date.parse`. Teste "AG7", dois casos |
| **AG8** Preferências gravadas por uma versão antiga voltavam sem as chaves novas: a chave ficava `undefined` no `TelaAvisos` | `RepositorioLocal.ts:258` (`preferenciasDeAviso`, `preferenciasDaEquipe`) | Completa pelo padrão. Teste "AG8" |
| Foco da folha no "Fechar" invisível; a alça era um bloco com rótulo e sem papel (pedido do AH) | `FolhaInferior.tsx` | A sobreposição vai depois do painel (`zIndex` 0/1, a mesma imagem) e sai do teclado (`focusable={false}`, `tabIndex={-1}`); a alça fica sem rótulo. Teste no `FolhaInferior.test.tsx`; foco e captura no navegador (seção 1) |
| `ListaDaEquipe` com o cartão direto na lista (axe, pedido do AH) | `componentes/Equipe.tsx` | Item de lista em volta de cada cartão. `componentes/Equipe.test.tsx`; axe 0 |
| O número digitado passava do teto de ampliação (pedido do AH) | `CampoNumerico.tsx` (`numeroCarga` 1,5) e `Campo.tsx` | `maxFontSizeMultiplier` do estilo. Teste no `CampoNumerico.test.tsx` (falhava sem a linha). No `Campo` (`corpo` não tem teto no tokens.json) a mudança só alinha com o `Texto`, sem efeito hoje |
| Lint: 4 erros (aspas em texto JSX) e uma dependência faltando no `useMemo` (`setAgora`) | `telas/academia/envio.tsx:149`; `ProvedorDoAluno.tsx:623` | Texto numa expressão (a mesma frase); `setAgora` na lista |
| Não havia configuração de ESLint | — | `app/eslint.config.js`, a recomendada do Expo |

### Conferido sem defeito

| Pedido | Resultado |
|---|---|
| Regras dos hooks | O `react-hooks/rules-of-hooks` não acusa nada. O `exhaustive-deps` só acusava o `setAgora` (corrigido). As desativações em `ProvedorDeDados.tsx:442` e `FolhaInferior.tsx` (efeito em `[visivel]`) são de propósito |
| Closure com valor velho | Além do Deslizar e da folha: o `CampoNumerico` já usava ref (`ultimoAoTocar`); o `AvisoRapido` agenda pelo tipo do aviso atual; o `ProvedorDeDados` usa `enviarAgoraRef` no observador de rede |
| Promessa sem `await` / `catch` vazio em `dados/` | Os três `catch {}` que ficaram são de propósito e comentados: o JSON de uma linha, a contagem da tentativa e a abertura do `localStorage` bloqueado |
| Mutação de objeto compartilhado | O repositório devolve referências internas. Mesmo assim, nenhuma tela muda o que recebe: todo `.sort`/`.reverse` de `telas/` é sobre cópia (`[...x]`, `filter`, `map`). As gravações trocam o objeto, nunca o mudam |
| `any` e `!` | Em `dados/` só sobram `academiaDe(...)!` e `usuarios.find(...)!` (dados de exemplo fixos). O `copiarPronto(...)!` virou `?? copia` |
| `structuredClone` no celular | Existe no Hermes pelo runtime do Expo (`expo/src/winter/runtime.native.ts`) |
| Telas com dado de outro aluno pelo endereço | `/acompanhamento/[id]` confere `personalId`; `/treino-feito/[id]` só lê os realizados da própria conta |

---

## 3. A lista para o AH (o que usa `useGravarComAviso`)

O AH terminou antes de o padrão existir, e o coordenador liberou `telas/`. **Apliquei eu mesmo** em todos os pontos abaixo:

| Tela | Chamada | Como |
|---|---|---|
| `academia/TelaAlunos.tsx` | `confirmarVinculos`, `recusarVinculo` | O passo inteiro (gravar e o aviso de sucesso) no `comAviso`; "Tentar de novo" refaz o passo |
| `academia/TelasDeProntos.tsx` | `arquivarPronto` | idem |
| `academia/TelaPainelDoDono.tsx` | `designarPersonal` | idem (a folha só fecha se gravou) |
| `academia/TelaPerfilDoAluno.tsx` | `encerrarVinculo` | idem |
| `academia/TelasDeAviso.tsx` | `retirarAviso` | idem (e saiu o `retirando!`) |
| `academia/TelasDaEquipe.tsx` | `salvarPreferenciasDaEquipe` (era `void`) | `umPorVez: false` (duas chaves trocadas rápido gravam as duas) |
| `academia/envio.tsx` › `FolhaDeEnvio` | `aoEnviar` (era `useUmPorVez` com `void`, uma promessa solta se falhasse) | `useGravarComAviso(aoEnviar)`, com a trava de duplo toque mantida. O teste da folha ganhou o `ProvedorDeAvisoRapido` |
| `aluno/estado/ProvedorDoAluno.tsx` | `salvarVarios` (`void repo.salvarTreino`), a série (`fila.registrarTreinoRealizado`), `registrarRefeicao`/`desfazerRefeicao`, `registrarMedicao`, `salvarPerfilDoAluno`, `salvarPreferenciasDeAviso` | `umPorVez: false`. A série regrava a versão MAIS NOVA do treino (`maisNovo`), nunca a da falha; a medição e a marca guardam o id fora do passo, e repetir não duplica |
| `entrada/TelasDaEquipe.tsx` | `cancelarPedidoDeVinculo` (sem `catch`) | `try`/`catch` com "Sem sinal…" (o padrão não serve: depois do erro a tela sai) |
| `entrada/TelasDoAluno.tsx`, `TelasDaEquipe.tsx`, `aluno/perfil/TelaSuaAcademia.tsx` | conta nova e pedido de vínculo (já tinham `catch`) | Texto "Sem sinal…" e a conta reaproveitada no "Tentar de novo" |

**Ficou para a próxima rodada de `telas/`** (não é bug de dado):
- **Data comparada como texto em `telas/`:**
  - `academia/TelasDeAviso.tsx:69-70` (`publicadoEm`);
  - `aluno/estado/ProvedorDoAluno.tsx`, na ordem dos pedidos (`criadoEm`, perto da linha 683).

  Trocar por `Date.parse(b) - Date.parse(a)`. Só erra se o fuso do aparelho mudar entre dois registros.
- **Imports sem uso:**
  - `academia/pecas.tsx` (14);
  - `aluno/comum/Tela.tsx` (8);
  - `ProvedorDoAluno.tsx` (`useQuery`, `ErroSemSinal`, `vinculos`);
  - `TelaModoTreino.tsx` (`reduzirMovimento`);
  - `entrada/pecas.tsx` (`Rect`);
  - `TelasDeProntos.tsx` (`View`).

  Também os imports duplicados de `@/dados` em `TelaDieta`, `TelaInicio`, `TelaPlus` e `TelaMeusDados`.

---

## 4. Segurança (skill `auditar-seguranca`, sobre o que mudou desde o T)

**Alvo:**
- `dados/`: repositório local, fila, armazenamento SQLite e web, escrita, e os arquivos novos `erros.ts` e `preferencias.ts`;
- `navegacao/`: os layouts e as guardas;
- `telas/rotas.ts`.

Sem git: o estado é o da pasta em 11 e 12/10/2026.

**Ameaça:**
- **dados:** de saúde (peso, objetivo, refeição, recado), a fila com dono e a sessão lembrada no aparelho;
- **atores:** aluno, instrutor, personal, dono, quem pega o celular e quem lê o log;
- **entradas:** endereço (web), armazenamento local estragado ou mexido, toque.

**Evidência automática:** o `security-surface.sh` só achou ruído (regex de cor e de data, `refetch`, `db.exec` dos testes).

**Revistos sem achado:**
- **SQL:** toda escrita e leitura é parametrizada. O único SQL montado é `pragma user_version = ${v}`, com `v` numérico interno (`sqlite.ts`).
- **Dado de saúde em log e em erro:**
  - `ErroDeArmazenamento` leva só o motivo, e `comoErroDeArmazenamento` descarta a mensagem do motor;
  - `gravarPreferenciaSemTravar` registra a CHAVE (ids, como `aparelho.cronometro.usuario-ana`), nunca o valor;
  - o aviso de erro na tela nunca repete o conteúdo.
- **Guardas de rota:** as 11 variações de endereço da seção 1, como instrutor, ficaram todas bloqueadas. `podeAbrirNaAcademia` casa prefixo com `/`. O Expo Router normaliza a barra final e decodifica `%xx`, e maiúsculas caem no 404.
- **Fila com dono:** a reordenação nova (AG4, AG5) não mexe no filtro por `usuarioId === sessao.usuarioId`. Um item estragado agora sobe (no fim), mas só o da própria conta, e a RLS continua valendo no servidor.
- **Rollback (`atomico`, desfazer):** confirmar um vínculo que falhou no disco não fica confirmado em memória. Antes ficava: a recepção via o aluno confirmado até reabrir.

**Rejeitados** (cada candidato foi refeito a partir do código, tentando refutar):
- *"`/escolher-visao` abre sem sessão e mostra vínculos"*: sem sessão, `vinculos` é `[]`; a tela só lista os vínculos ativos da conta da sessão.
- *"o 'Tentar de novo' regrava com permissão velha depois de o papel mudar"*: no repositório local não há checagem de papel por escrita. No Supabase, quem decide é a RLS na hora do envio, não a tela.
- *"o backup `…:estragado` expõe dado de saúde"*: fica na mesma origem e no mesmo `localStorage` do estado normal; não abre acesso novo.

**Precisa de validação (sem gravidade):**
- **abrir o banco no aparelho:** se o `openDatabaseSync` ou a migração falharem (disco cheio no primeiro uso depois de atualizar), o `ProvedorDeDados` lança na montagem e o app não abre. Só um build no aparelho mostra o que acontece. A saída pede uma tela própria, e o design está congelado; ver a seção 5.

**Conclusão:** nenhum achado de segurança comprovado no escopo auditado.

---

## 5. Pendências (não corrigidas)

- **Banco que não abre** (seção 4): proposta de uma tela "Não deu para abrir os seus dados. Tentar de novo" e tentar abrir de novo uma vez. Pede desenho.
- **Dependências sem uso no código:**
  - `@react-native-async-storage/async-storage`: a arquitetura diz que o token vai no `expo-secure-store`, nunca no AsyncStorage. **Proposta: tirar**; não tirei porque mexe no lockfile e no build nativo;
  - `@supabase/supabase-js` e `react-native-url-polyfill`: entram com o Supabase;
  - `expo-apple-authentication`, `expo-secure-store`, `expo-notifications` e `expo-image-picker`: hoje só aparecem como plugin no `app.json`.

  As demais sem import (`@expo/metro-runtime`, `expo-constants`, `expo-linking`, `react-native-screens`, `react-native-worklets`, `react-dom`, `react-native-web`, `expo-system-ui`, `expo-dev-client`) são pares obrigatórias do router, do Reanimated, da web ou da configuração.
- **Outras escritas "de servidor" que ainda passam sem sinal** no repositório local: salvar e montar treino, copiar pronto e as escritas da visão da academia. Pela seção 2 do `03-DECISOES-TECNICAS.md`, "montar ou editar treino" e "qualquer coisa na visão da academia" não funcionam offline. Não mudei, porque o fluxo "sem rede" de ponta a ponta edita treino offline, e decidir isso é do Alex. **[decidir]**
- **Web com fila grande**: ~20 ms por escrita com 1.000 itens. Só vale mexer se a web virar produto (uma chave por item).
- **`formatos.lerData`** recebe só `AAAA-MM-DD`; com um instante, dá `NaN`. Todos os chamadores cortam com `.slice(0, 10)`; não mexi.
- **Avisos de lint** (52): imports sem uso e diretivas `eslint-disable` sobrando. A lista de `telas/` está na seção 3.

---

## 6. Arquivos

Novos:
- `app/dados/erros.ts`;
- `app/dados/preferencias.ts`;
- `app/dados/revisao-ag.test.ts`, com 17 testes;
- `app/componentes/useGravarComAviso.ts` e `.test.tsx`;
- `app/componentes/FolhaInferior.test.tsx`;
- `app/componentes/Equipe.test.tsx`;
- `app/eslint.config.js`.

Mexidos:
- **dados:**
  - `armazenamento/tipos.ts` (`transacao`, `itemDaFila`, `registroDaColecao`);
  - `armazenamento/sqlite.ts`, `armazenamento/memoria.ts`, `armazenamento/banco.web.ts` e `armazenamento/banco.ts` (`busy_timeout`);
  - `fila.ts`, `local/RepositorioLocal.ts`, `ProvedorDeDados.tsx`, `repositorio.ts` (o texto do `ErroSemSinal`) e `index.ts`.
- **domínio:** `sincronizacao.ts` (`itensParaEnviar`).
- **componentes:** `Deslizar.tsx` (e o teste), `FolhaInferior.tsx`, `Equipe.tsx`, `Campo.tsx`, `CampoNumerico.tsx` (e o teste), `index.ts`.
- **telas** (liberadas pelo coordenador depois do AH):
  - academia: `TelaAlunos`, `TelasDeProntos`, `TelaPainelDoDono`, `TelaPerfilDoAluno`, `TelasDeAviso`, `TelasDaEquipe`, `envio` (e `FolhaDeEnvio.test`);
  - aluno: `estado/ProvedorDoAluno` e `perfil/TelaSuaAcademia`;
  - entrada: `TelasDoAluno` e `TelasDaEquipe`.
- **fora do `app/`:** `docs/decisoes.md`.

Os testes que **falhavam antes** de cada correção:
- 13 dos 14 primeiros de `revisao-ag.test.ts`. O 14º é o do texto do erro, escrito junto com o módulo novo;
- os 2 de "AG9" e o de "AG10";
- o do Deslizar;
- o do arrasto da folha e o do foco da folha;
- o da lista da equipe;
- o do teto do campo numérico.

O caso `umPorVez: false` do `useGravarComAviso` foi escrito junto com a opção, sem uma rodada vermelha antes.
