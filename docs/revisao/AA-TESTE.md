# AA — Junção e teste de ponta a ponta (P11, onda 3) · 11/10/2026

O agente AA juntou o que as ondas 1 e 2 deixaram espalhado, fez o app GRAVAR de verdade (antes, quase tudo o que as telas escreviam sumia ao recarregar), corrigiu o que os relatórios X, Y, Z e W apontaram, escreveu os testes de tela das peças críticas e percorreu os fluxos principais na web, com Playwright, em 393 × 852 e 2040 × 790, nos dois temas. O design não mudou (fora a altura de algumas linhas da academia, explicada abaixo).

## 1. Resultado das verificações

| Verificação | Resultado |
|---|---|
| `npm run tipos` (tsc) | **0 erros** |
| `npm run testar:dominio` (domínio + dados) | **367 de 367 passam** (eram 349: +16 da gravação, +8 de `dominio/papel.test.ts`, −6 do `dados/visao.test.ts`, que virou o do domínio) |
| `npm run testar:telas` (jest-expo) | **67 de 67 passam**, 5 suítes; o Jest sai sozinho |
| `npx expo-doctor` | **18/18** |
| `npx expo export --platform web` | exporta (2,55 MB de JS), saída no scratchpad (`aa/dist`) |
| Playwright, 8 fluxos × 2 tamanhos × 2 temas | **32 de 32 passam**, 0 erro de página, 0 erro de console, 0 rolagem horizontal |

## 2. O que foi promovido

Para `app/componentes/` (as cópias locais foram apagadas e os imports trocados):

| Componente | Veio de | Observação |
|---|---|---|
| `Interruptor`, `LinhaComChave` | `telas/entrada/pecas.tsx` (Z) | A `Chave` do aluno (Y), com o Switch do sistema, virou `LinhaComChave naLista`: um interruptor só, o desenhado no `entrada.css` |
| `Lista`, `Linha`, `GrupoDeLinhas` | `telas/academia/pecas.tsx` (Z) e `telas/aluno/comum/Tela.tsx` (Y) | Uma `Linha` com as props das duas (ícone, avatar, perigo, cor do apoio, desabilitada). Altura pela regra do sistema: 56 sem apoio, 72 com apoio |
| `Quadro`, `GradeDeQuadros`, `Medidor`, `GraficoDeBarrasDosDias` | `telas/academia/pecas.tsx` | As barras do painel do dono (valor em cima) |
| `GraficoDeLinha`, `GraficoDeBarras`, `MapaDoMes`, `Rosca`, `Tabela` | `telas/aluno/comum/Graficos.tsx` | Os gráficos da Evolução |
| `Simbolo`, `SeloDoLogo` | `telas/entrada/pecas.tsx` | A geometria do `logo/simbolo.svg` do W; cor padrão `marca` (#007761 claro, #39F0CD escuro) |
| `AbasDaVisao`, `FaixaDoCronometro`, `FaixaDoTreino` | `telas/compartilhado/AbasDaVisao.tsx` (X) e `telas/aluno/comum/AbasDoAluno.tsx` (Y) | `acimaDaBarra`; o `AbasDoAluno` ficou só com a ligação ao estado |
| `CartaoDoProfissional`, `ListaDaEquipe` | `telas/aluno/perfil/TelaEquipe.tsx` (Y) | Recebe os perfis já filtrados por quem pode ver |
| `formatos.ts` (um só) | `telas/aluno/comum/formatos.ts` e `telas/academia/formatos.ts` | `@/componentes/formatos`. Nomes duplicados unificados (`hojeISO` → `dataLocal`, `DIA_CURTO` → `NOME_CURTO_DO_DIA`, `DIAS_DE_SEGUNDA` → `SEMANA_DE_SEGUNDA`); `NOME_DO_PAPEL` também veio para cá |

Para o domínio: a regra da visão (`visaoDoPapel`, `decidirDestino`) foi de `dados/visao.ts` para **`dominio/papel.ts`**, com `papel.test.ts` (os 6 testes de antes e 2 novos: vínculo pendente de equipe não abre a academia; o último escolhido encerrado cai no único ativo). E `Academia.codigoDaEquipe` (F13.4), no domínio e em `03-arquitetura/01-MODELO-DE-DADOS.md`.

## 3. O que passou a gravar

Tudo passa pela interface de `dados/` (`Repositorio`) e, nas telas, pelo `useGravar()` de `dados/escrita.ts` (grava, depois limpa o cache; o que muda vínculo recarrega a sessão). No repositório local, cada escrita grava o objeto numa coleção do armazenamento do aparelho: **SQLite no celular** (versão 2 do banco, tabela `registros`), **localStorage na web**, memória no teste. Ao abrir, as coleções voltam por cima dos dados de exemplo. O `dados/local/gravacao.test.ts` (16 testes) prova cada uma "fechando e abrindo" o app.

| Onde | Ação | Método |
|---|---|---|
| Academia | Confirmar (um ou todos), recusar e encerrar vínculo (com motivo) | `confirmarVinculos`, `recusarVinculo`, `encerrarVinculo` (+ `saidasNoMes`, só a soma, para o painel) |
| | Enviar treino (pronto em dois toques ou montado): cópia com ids novos, tornar ativo, "trocar em", recado; fecha o pedido aberto como atendido | `enviarTreinoAoAluno`, `enviosDeTreino` |
| | Avisos: publicar (com `validarAvisoDaAcademia`, uma notificação por dia), retirar, histórico | `publicarAviso`, `retirarAviso`, `avisosDaAcademia` |
| | Arquivar e publicar treino pronto | `arquivarPronto` |
| | Designar personal do Plus | `designarPersonal` |
| | Perfil profissional (o profissional edita, liga a chave; o dono só esconde) | `salvarPerfilProfissional` (a regra continua no `editarPerfilProfissional`) |
| | Avisos da equipe (por vínculo, o instrutor nasce sem "alunos sem treinar") | `preferenciasDaEquipe`, `salvarPreferenciasDaEquipe` |
| Aluno | Editar, criar, copiar pronto e ativar treino (um ativo só) | `salvarTreino`, `ativarTreino`, `copiarPronto` |
| | Refeição marcada: **na fila**, como o treino; desmarcar tira o registro e o item da fila | `registrarRefeicao`, `desfazerRefeicao` (síncronos) |
| | Pedido de treino: **precisa de sinal** (sem rede, `ErroSemSinal` e "Sem sinal" na tela); cancelar | `pedirTreino`, `cancelarPedidoDeTreino`, `pedidosDoAluno` |
| | Peso, cadastro, autorização da academia | `registrarMedicao`, `salvarPerfilDoAluno` |
| | Preferências de aviso (o formato do domínio, `PreferenciasDeAviso`) | `preferenciasDeAviso`, `salvarPreferenciasDeAviso` |
| | Cronômetro em andamento: vai para o aparelho a cada mudança e volta por `restaurarCronometro` (R9.4); o aviso dispensado também | `lerDoAparelho`, `gravarNoAparelho` |
| Entrada | Conta nova, o vínculo pedido (aluno: pendente; equipe: sempre pendente) e as respostas; cancelar o pedido da equipe | `criarConta`, `academiaPeloCodigo`, `academiaPeloCodigoDaEquipe`, `pedirVinculo`, `cancelarPedidoDeVinculo`, `salvarPerfilDoAluno` |

Consultas novas em `dados/consultas.ts`: `useMedicoesDoAluno`, `useRefeicoesRegistradas`, `usePedidosDaAcademia`, `usePedidosDoAluno`, `useTreinosProntosDoAluno` (com o vínculo PENDENTE, R12.9, sem os arquivados), `useAvisosDaAcademia`, `useEnviosDeTreino`, `usePreferenciasDeAviso`, `usePreferenciasDaEquipe`, `useSaidasNoMes`.

Apagados: `telas/academia/estado-local.ts`, `telas/aluno/estado/consultas.ts`, o "registro desfeito" (`__desfeito__`) da dieta. A conta nova **não entra mais como Juliana ou Lucas**: é criada e entra com ela ("Paula Gomes" quando vem pela Apple/Google simulados). A **Júlia** entrou nas contas de exemplo (a lista "Meus alunos Plus" tem a Ana).

## 4. Correções dos relatórios

- **`FotoComTexto` a 2040** (Y, 3.3): a imagem tinha a largura natural (358) no react-native-web; agora `position: absolute` com `width/height 100%` e o `resizeMode` como prop. Conferido: a capa do "Em uso" cobre os 600 do cartão (captura `pronto-e-deslizar-3-meus-treinos-ultrawide-*`).
- **Contorno preto do foco no `Campo`** (Z): `outlineStyle: 'none'` junto do `outlineWidth: 0`, simples e multilinha.
- **`Vidro` com input dentro** (Z): na web a raiz ganha `zIndex: 0` e as camadas do vidro `zIndex: -1`; os filhos ficam por cima sem mudar o layout de quem usa. Documentado no topo do `Vidro.tsx`.
- **Regra da visão** em `dominio/papel.ts`, com teste (seção 2).
- **Achados pelos testes de componente** (dois bugs no `CampoNumerico`): segurar "+"/"−" repetia sempre o mesmo valor (o temporizador guardava o `aoTocar` velho); e sem `lerTexto` o centro era anunciado como desabilitado e o leitor de tela não recebia incremento/decremento.

## 5. Testes de tela (jest-expo)

| Arquivo | Testes | O que prova |
|---|---|---|
| `componentes/Botao.test.tsx` | 44 | 5 tamanhos × 8 variantes: área de toque efetiva (desenho + `hitSlop`) ≥ 48 nos dois eixos; toque chama uma vez; desabilitado e carregando não chamam |
| `componentes/CampoNumerico.test.tsx` | 12 | +/− pelo passo, limites, leitor de tela, toque longo, digitação, alvos de 48 |
| `componentes/AvisoRapido.test.tsx` | 4 | "Desfazer" chama a ação uma vez e o aviso some; sem toque some sozinho (5 s; erro 8 s) sem chamar |
| `componentes/Deslizar.test.tsx` | 5 | o gesto do celular: acima de 85 % conclui uma vez no soltar; abaixo não; o toque do leitor de tela também conclui |
| `telas/aluno/TelaModoTreino.test.tsx` | 1 (duas fases) | **Marcar série grava ANTES**: com o app de verdade montado (dados, aluno, Modo treino), a ordem das chamadas é `gravar` → `vibrar` → `descanso`, e no instante da gravação a tela ainda mostrava a série por fazer. **Desfazer** regrava o treino sem a série antes de vibrar, e a série volta |

Ajustes para o Jest: imagens mapeadas para um número (`ferramentas/jest/imagem.js`; o Jest não acha os `@1x/@2x` que o Metro acha), e o `gcTime` do React Query infinito (o temporizador de 5 min segurava o Jest aberto; ver decisões).

## 6. Ponta a ponta (Playwright na exportação web)

Script: `scratchpad/aa/ponta-a-ponta.mjs` (temporário). Cada fluxo começa num navegador limpo e CONFERE o resultado (o texto na tela e o que ficou gravado no armazenamento), não só tira foto. Trocar de conta é feito pelo armazenamento do aparelho, que é o mesmo: o que uma conta gravou é o que a outra lê.

| Fluxo | O que confere |
|---|---|
| Primeiro acesso | Sou aluno → Apple → Conta nova → código MRC4K2 → Ganhar massa → dias → Quem pode ver → Início. A conta, o vínculo pendente e as respostas estão gravados; reabrir continua no Início da conta nova; os prontos aparecem com o vínculo pendente |
| Treino completo | Começar → série → descanso → Desfazer → série de novo → Encerrar → "Treino fechado." → a barra da semana na Evolução sobe 1 → o treino no Histórico |
| Treino pronto e deslizar | Usar o Full body 3× → em uso → arrastar o "Deslize para começar" com o mouse → Modo treino; o treino ativo gravado é a cópia |
| Instrutor dá pronto | Carlos → Rafael Martins → Dar treino pronto → Circuito 30 → Enviar (dois toques) → "montado por Carlos" → o Rafael vê o Circuito 30 em uso |
| Dono oculta perfil | A Ana vê a Carla na Equipe → Marcos esconde → a Ana não vê mais |
| Sem rede | Offline (o `setOffline` do navegador) → série → encerrar → o Histórico mostra "aguardando sinal" e a fila tem o treino com tentativa → online → a fila esvazia, o treino fica com `sincronizadoEm` e o "aguardando sinal" some |
| Trocar de visão (Diego) | "Entrar como personal" → academia → Perfil → Trocar de visão → "Entrar como aluno" → Início; reabrir fica na última visão |
| Recarregar no treino | série marcada → recarregar a página → volta ao Modo treino, no mesmo exercício (2 de 7), com a série feita e o descanso restaurado |

Capturas olhadas (em `scratchpad/aa/capturas/`, temporárias): o Início da conta nova, o descanso com "Série 1 feita · Desfazer", o perfil do aluno depois do envio, a Equipe sem a Carla, o Histórico com "aguardando sinal", a Evolução, Meus treinos e o Modo treino recarregado a 2040.

### Bugs achados nos fluxos e as correções

1. **Sem rede, o treino fechado não aparecia no Histórico.** O React Query, na web, pausa as consultas quando o navegador está offline, e o repositório local não precisa de rede. Correção: `networkMode: 'always'` (consultas e escritas) no `ProvedorDeDados`.
2. **Sem rede de verdade, a fila não sabia.** O "sem rede" do repositório só mudava pela chave do catálogo. Correção: `dados/rede.web.ts` liga o "sem rede" aos eventos online/offline do navegador; quando volta, a fila sobe na hora. (No celular, até entrar o NetInfo, tenta a cada 15 s.)
3. **Recarregar no meio do treino voltava ao exercício errado.** A retomada ia ao primeiro exercício com série por fazer (a esteira, que a Ana pulou), não ao supino em que ela estava. Correção: volta ao exercício da última série marcada, se ainda falta série nele.
4. **Saudação "Olá, Conta"** com a conta nova simulada: o nome simulado virou um nome de pessoa.
5. (Antes do teste, na junção) **o aluno nunca via o que a academia fazia**: o dono escondia o perfil, o instrutor enviava treino, a recepção confirmava — tudo ficava na memória da visão da academia. Resolvido pela gravação (seção 3); os fluxos 4 e 5 provam.

## 7. Pendências

- **Refeição desmarcada depois de subir**: o local tira o registro; com o servidor, precisa de um "apagar" na fila (hoje a fila só sobe treino e refeição).
- **Entrar com e-mail** só acha as contas de exemplo; a conta criada na entrada entra pela sessão, não pelo e-mail (falta `usuarioPeloEmail`, que é do login de verdade).
- **[decidir]** "Recepção ou instrutor" na entrada da equipe vira `instrutor` no pedido; o dono ajusta. Se a recepção precisa de opção própria.
- **Altura das linhas da academia**: com apoio passaram de ~60 para 72 (a regra do sistema). Se o Alex preferir a mais baixa, é `compacta`.
- No aparelho (não dá para ver no navegador): o SQLite versão 2 migrando por cima do banco da versão 1, a vibração, o teclado, o desfoque no Android. O NetInfo para a fila saber a rede no celular.
- Do relatório W (não são do app): os PNG de abertura em `02-design/imagens/entrada/`, o texto de `docs/apresentacao/partes/08-marca.html` e o `app/recursos/LEIA-ME.md`.
