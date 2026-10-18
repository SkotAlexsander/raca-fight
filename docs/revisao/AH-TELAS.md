# AH — Telas, terceira passada: estados, leitor de tela, desempenho e texto (P11) · 11/10/2026

Pedido do Alex: "prosseguir com mais varredura de bugs e melhorias". O agente AH escreveu **só em `app/telas/`** e neste relatório. O AG trabalhou ao mesmo tempo em `dados/`, `componentes/`, `navegacao/` e `dominio/`; o que achei nessas pastas está na seção 7, para ele.

Regras que segui:
- não repeti nada de AB, AC, AE, Y, Z e V;
- o design ficou **congelado**: só os componentes que existem (`Esqueleto`, `EstadoVazio`, `Botao`), nenhum tamanho novo e um destaque por tela;
- nenhum **[decidir]** foi resolvido;
- cada mudança de lógica tem teste que **falhava antes**: troquei os arquivos novos pelos de antes (cópia em `scratchpad/ah/telas-antes/`), rodei os testes novos, vi falhar e devolvi os novos.

Scripts e capturas (temporários) ficam em `scratchpad/ah/`:
- `vistoria.mjs` (modos `rotas`, `longos`, `zoom`, `semrede` e `perf`);
- `foco.mjs`;
- `ponta-a-ponta.mjs` (cópia do AE);
- `dist-antes/` e `dist/`, os dois exports;
- `capturas/antes/`, `capturas/depois/` e `capturas/foco-dist/`;
- `resultado-*.json`.

---

## 1. Verificações (no fim)

| Verificação | Resultado |
|---|---|
| `npm run tipos` | **0 erros** |
| `npm run testar:dominio` (domínio + dados) | **429 de 429** (o AG acrescentou testes nesta onda) |
| `npm run testar:telas` | **128 de 128**, 19 suítes. Novos meus: 10 testes em 3 arquivos (seção 6) |
| `npx expo export --platform web` | exporta, 2,57 MB de JS (era 2,57 MB) |
| Os 8 fluxos do AA (393 e 2040 × 790, claro e escuro) | **32 de 32 passam**, sem mudar o roteiro |
| axe: 8 contas, 70 rotas × 2 temas, mais o Modo treino em série e em descanso | antes: **3 regras, 22 ocorrências**. Depois: **1 regra, 2 ocorrências**, e ela está num componente (seção 3) |
| Rolagem horizontal, erro de página e de console nas mesmas 144 visitas (140 rotas e 4 do Modo treino) | nenhum, antes e depois |

## 2. Matriz de estados (antes → depois)

Legenda:
- **ok**: já estava certo;
- **✗**: mentia ou travava;
- **—**: ficava em branco;
- **→**: corrigido nesta passada.

"Vazio com saída" quer dizer que o vazio tem um botão para sair dele. "Sem rede" é com o repositório local, que lê do aparelho: o que precisa de sinal é só o que o AA marcou (pedido de treino).

### Aluno

| Tela | Carregando | Vazio com saída | Erro com "Tentar de novo" | Sem rede | Dado longo | Fonte grande / 320 px |
|---|---|---|---|---|---|---|
| Início | — → esqueleto do herói | ok (3 caminhos) | ✗ "Monte seu primeiro treino" → erro | ok | ok (nome de 60 vira "Olá, Maria"; 30 exercícios cabem) | ok |
| Meus treinos | — (tela em branco) → esqueleto | só "Montar do zero" → mais "Ver treinos prontos" quando há academia | ✗ "Nenhum treino em uso" → erro | ok | ok (nome de 66 corta em 1 linha) | ok |
| Prontos da academia | — | ✗ "Nenhum treino com esse nome" sem busca e sem saída → 3 vazios: busca ("Limpar a busca"), objetivo ("Ver todos") e academia sem prontos | ✗ (o vazio) → erro | ok | ok | ok |
| Ver treino pronto (link direto) | ✗ "Este treino saiu da lista" antes de chegar → esqueleto | sem saída → "Ver treinos prontos" | → erro | ok | ok | ok |
| Editar treino / Séries (link direto) | ✗ "não encontrado" antes de chegar → esqueleto | sem saída → "Voltar para Treinos" | → erro | ok | ok (30 exercícios) | ok |
| Modo treino | ok | ok ("Ir para o Início") | — (vive da sessão) | ok (grava no aparelho) | segmentos de 1 px com 30 exercícios → vão de 1 px acima de 12 | ok |
| Histórico | — → esqueleto | ok | ✗ "Nenhum treino fechado ainda." → erro | ok ("aguardando sinal") | ok | ok |
| Treino realizado | ✗ "não está aqui" antes de chegar → esqueleto | sem saída → "Ver o Histórico" | — | ok | ok | ok |
| Evolução | ✗ os contornos do vazio piscavam → esqueleto | ok | ✗ (o vazio) → erro | ok | ok | ok |
| Plus | — (só o título) → esqueleto | ok | ✗ **convite a quem já é Plus** → erro | ok | ok | ok |
| Dieta do dia | ✗ "Sem plano neste dia" piscava → esqueleto | ok | ✗ (o vazio) → erro | ok (marca no aparelho, sobe depois) | ok | ok |
| Equipe / Perfil do profissional | — → esqueleto | sem saída → "Ver a Equipe" no perfil | → erro | ok | ok | ok |
| Sua academia | ok | ok | — | aceita o código sem rede (seção 7) | ok | ok |
| Cronômetro | ok | — | — | ok | ok | ok |

### Academia

| Tela | Carregando | Vazio com saída | Erro com "Tentar de novo" | Sem rede | Dado longo | Fonte grande / 320 px |
|---|---|---|---|---|---|---|
| Alunos | ok | ✗ sem saída; "Bom sinal" até em Plus → "Ver todos" / "Limpar a busca", "Bom sinal" só nos de atenção | ✗ erro **sem botão** → com botão | ok | 300 alunos: **4.834 nós no DOM → 905**, "Mostrar mais 50" | ok (os filtros rolam de lado, de propósito) |
| Perfil do aluno | ok | ok | ✗ "Aluno não encontrado" → erro | ok | ok (nome de 60) | ok |
| Montar treino | ok | ✗ "Aluno não encontrado" sem saída → "Voltar para Alunos" | → erro | ok | ok | ok |
| Treinos prontos / Ver pronto | ok | sem saída no "não encontrado" → "Voltar para Treinos" | → erro | ok | ok | ok |
| Meus alunos Plus | ✗ todo aluno aparecia como "Novo: sem treino e sem plano" até o plano chegar → espera plano e refeições | ok | → erro | ok | ok | ok |
| Aluno Plus (personal) | idem: a adesão aparecia "sem plano" → espera | ok | → erro | ok | ok | ok |
| Academia (painel do dono) | ✗ "0 de 0 vinculados" até chegar → esqueleto | ok | → erro | ok | ok | ok |
| Avisos da academia | ✗ "Nenhum aviso no Início" piscava → esqueleto | ok | → erro | ok | ok | ok |
| Equipe (dono) | — → esqueleto | ok | → erro | ok | ok | ok |

**Como medi:**
- **Dado longo**: o modo `longos` usou um nome de 60 caracteres, um treino de 66 com um dia de 30 exercícios (o Modo treino abre em 111 ms) e 300 alunos, 1 em cada 10 com nome de 60. Nenhuma rolagem horizontal.
- **320 px**: o modo `zoom` abriu 15 rotas a 320 × 426, que é 640 px de janela com 200 % de zoom. Nenhuma rolagem horizontal e nenhum texto cortado sem reticências.
- **Fonte do sistema**: o `Texto` já limita o crescimento por estilo. Faltava o campo de vidro da entrada: o rótulo parava no limite e o texto digitado crescia sem fim. Agora segue o mesmo `multiplicadorMaximo`. Na web, o "tamanho do texto" do navegador não muda o app (o AB já tinha visto); vale o zoom.

## 3. Leitor de tela e axe

### axe (nas mesmas rotas, nos dois temas)

| Regra | Onde | Antes | Depois |
|---|---|---|---|
| `aria-required-children` (crítica) | **Semana do Início** (pendência do AB): `ul` com `div` rotulados | 8 telas | **corrigido**: cada dia é `listitem` |
| idem | Atalhos do Início com `role="menu"` e botões dentro | 8 | **corrigido**: o papel `menu` saiu (são 4 botões, não um menu) |
| idem | Lista do convite do Plus sem itens | 6 | **corrigido** |
| idem | `/perfil/equipe`: a `ListaDaEquipe` é `list` com botões dentro | 2 | **fica**: é de `componentes/Equipe.tsx` (seção 7) |
| `aria-prohibited-attr` (séria) | **Perfil do aluno (academia)**, pendência do AB: as 4 semanas eram um `div` com rótulo e sem papel | 4 | **corrigido**: `role="img"` com o rótulo (e `group` nos números de peso, altura e idade) |
| `scrollable-region-focusable` (séria) | `/biblioteca/[id]`: a área que rola não tinha nada focável | 2 | **corrigido**: a rolagem da `TelaDaAcademia` recebe foco na web |

### Ordem de leitura, nomes e foco

- **Ordem de leitura**: segue a ordem visual em todas as telas olhadas (texto e rótulos de cada rota estão em `resultado-*-rotas.json`). No Modo treino a ordem é minimizar → título com "exercício N de M. Ver a lista" → pausar → palco → painel. Está certa.
- **Botões de ícone**: todos têm nome. Os rótulos das 144 visitas foram conferidos, e nenhum botão saiu sem nome no axe (`button-name`).
- **Rótulo errado** no Histórico: "…30 de set.. Ver o treino" (ponto dobrado), corrigido.

**Anúncios.** Antes, nada do que muda sem toque era anunciado. Agora, pelo `AvisoAoLeitor`:

| Momento | O que o leitor fala |
|---|---|
| Série marcada | "Série 1 de 4 feita. Descanso de 2 minutos." (conferido no navegador: `polite: Série 1 de 4 feita. Descanso de 2 minutos.`) |
| Fim do descanso (sozinho ou "Pular") | "Descanso acabou. Série 2 de 4, Supino reto." |
| "Desfazer" | "Série desfeita. Pode marcar de novo." |
| Cronômetro | Só a troca de fase ("Trabalho, rodada 3 de 8", "Terminou. 8 rodadas · 4:00") |
| Dieta | A data do topo diz o dia novo ao navegar |

No Cronômetro, a região viva estava no número e **falava a cada segundo** (TalkBack e web). Ela saiu de lá.

Também foi corrigido o plural de "N segundos restantes" (dizia "1 segundos").

**Foco** (`foco.mjs`, teclado):
- ao abrir a folha "Qual dia hoje?" pelo "Trocar dia", o foco vai para o botão invisível **"Fechar"** da sobreposição, e não para o título ou o primeiro item;
- o Tab fica preso dentro da folha, e o Esc fecha;
- ao fechar, o foco **volta** ao "Trocar o dia do treino". Isso está certo.

O foco ao abrir é do `FolhaInferior` (seção 7).

## 4. Desempenho percebido

Tempo até a primeira tela com texto: mediana de 3 aberturas a frio, export de produção, Chromium headless a 393 × 852.

| Caso | CPU normal, antes → depois | CPU 4× mais lenta, antes → depois |
|---|---|---|
| Boas-vindas, sem conta | 0,19 s → 0,27 s | 0,72 s → 0,75 s |
| Ana, até "Olá, Ana" | 0,27 s → 0,30 s | 1,24 s → 0,82 s |
| Marcos, até "Alunos"/"Academia" | 0,26 s → 0,40 s | 1,02 s → 0,96 s |

- **A primeira pintura** fica entre 0,2 e 0,4 s; com a CPU 4× mais lenta, entre 0,6 e 0,8 s.
- **O download** é de cerca de 2,8 MB (2,57 MB de JS num pedaço só).
- As diferenças entre antes e depois são do tamanho do ruído entre aberturas. Nada do que mudou pesa na abertura.
- **O que pesa** é o pacote único. Dividir por rota é configuração do Metro e da navegação, fora de `telas/`.

**Imagens**: comparei o tamanho de cada `img` com o tamanho mostrado a 3× de densidade, nas 70 rotas. **Nenhuma** passa de 1,5 vez o necessário.

**Listas que renderizam tudo**:

| Lista | Antes | Depois |
|---|---|---|
| Alunos com 300 | 4.834 nós no DOM | **905** nós, com "Mostrar mais 50"; 0,61 s até a lista |
| Histórico e Exercícios da academia (28) | — | ficam inteiros: pouca coisa |

**Trabalho no render**:
- o `useAlunos` abre 3 consultas por aluno (900 para 300 alunos), e o `useAluno` chama a lista inteira para achar um. Com o repositório local custa pouco (0,6 s para 300). Com o Supabase, isso vira uma consulta só, e a mudança é do AG (seção 7);
- a Dieta e o Meus alunos Plus deixaram de calcular a lista com dado pela metade (antes calculavam duas vezes e mostravam o errado no meio).

## 5. Textos (antes → depois)

Conferidos contra o `01-TOM-DE-VOZ.md`. Varri os 640 textos literais das telas e o texto visível das 144 visitas atrás de plural errado, inglês, "tu"/"a gente", pontuação e número sem unidade.

| # | Onde | Antes | Depois | Por quê |
|---|---|---|---|---|
| 1 | Início (herói e folha "Qual dia hoje?") | "1 exercícios" | "1 exercício" | Plural |
| 2 | Início (leitor, a semana) | "1 treinos nesta semana", "3 de 1 treinos" | `plural()` | Plural |
| 3 | Meus treinos (capa em uso) | "1 exercícios" | `plural()` | Plural |
| 4 | Prontos (lado das seções) | "1 treinos" | `plural()` | Plural |
| 5 | Treino pronto (lado do dia), `metaDoPronto` | "1 exercícios" | `plural()` | Plural |
| 6 | Evolução (mapa do mês) | "1 treinos" | `plural()` | Plural |
| 7 | Modo treino (leitor, descanso) | "1 segundos restantes" | "1 segundo restante…", e "1 minuto e 30 segundos" | Plural e número falado |
| 8 | Cronômetro (resumo) | "1 rodadas", "1 voltas" | `plural()` | Plural |
| 9 | Dieta, Início (resumo e leitor) | "de 1 refeições" | "de 1 refeição" | Plural |
| 10 | Avisos (aluno) | "Usar minha frequência (1 dias)" | `plural()` | Plural |
| 11 | Entrada, dias por semana (leitor) | "1 dias por semana" | "1 dia por semana" | Plural |
| 12 | Meus alunos Plus | "1 dias sem registro", "de 1 refeições marcadas" | `plural()` | Plural |
| 13 | Aluno Plus (adesão) | "de 1 refeições marcadas" | `plural()` | Plural |
| 14 | Painel do dono (leitor) | "1 alunos ativos de 1 vinculados" | `plural()` | Plural |
| 15 | Painel, "Novos · 90 dias" | "1 treinaram em 7 dias" | "1 treinou em 7 dias" | Concordância |
| 16 | Painel, "Treinos · 7 dias" | "7 dias antes: 12" | "12 nos 7 dias anteriores" | Número antes da unidade, frase |
| 17 | Painel, "Saídas no mês" | "vínculos encerrados" | "alunos saíram" / "aluno saiu" | "Vínculo" é palavra do sistema (a mesma razão do texto 13 do AC) |
| 18 | Painel, folha Designar com vários | "3 alunos Plus sem personal. Escolha quem acompanha." (o toque designava só o primeiro, sem dizer) | "…Escolha quem acompanha Ana; os outros vêm em seguida." | Diz o que o toque faz |
| 19 | Treinos prontos e Exercícios (academia) | contagem "11", "28" | "11 treinos", "28 exercícios" | Número com unidade (princípio 8) |
| 20 | Dieta (cada refeição) | "0/3", "3/3" | "3 itens" | Número sem unidade; e "0/3" fazia parecer marca por item (a marca é por refeição, R3.6) |
| 21 | Dieta (título fora de hoje) | "Dieta de hoje" em "Ontem, 10 de out." | "Dieta do dia" | Mentia |
| 22 | Dieta (folha "Não segui") | campo "Opcional" | "Motivo (opcional)" | O rótulo é o nome do campo para o leitor |
| 23 | Perfil do aluno, folha "Começar de onde?" | "A partir do treino atual dele" (também para a Ana) | "A partir do treino atual de Ana" | Gênero |
| 24 | Entrada, Sua academia | "Vou treinar sozinho por enquanto" | "Seguir sem academia por enquanto" | Gênero. O mapa de telas (Parte 1) cita o texto antigo; não editei a especificação |
| 25 | Entrada, Criar conta | "Depois a gente manda um código…" | "Depois mandamos um código…" | O resto do app diz "Mandamos" |
| 26 | Novo treino (placeholder) | "Treino de verão" | "Treino da manhã" | "Corpo de verão" está na lista do que não entra |
| 27 | Pedir treino (aviso de erro) | "…precisa de internet; tente de novo." · "Não deu para enviar o pedido" | "…precisa de internet. Tente de novo." · "Não deu para enviar o pedido. Tente de novo." | Pontuação; o erro diz o que fazer |
| 28 | 6 avisos rápidos | "Pedido enviado", "Pedido cancelado", "Nota salva no treino"… | com ponto final | Frase completa termina com ponto; rótulo curto ("Treino A em uso", "Série salva · 0:30") não. Antes havia "Pedido cancelado" e "Pedido cancelado." no mesmo app |
| 29 | Montar treino (dia vazio) | "Toque em Exercício para começar." | "Toque em + Exercício para começar." | Igual ao Editar treino e ao botão |
| 30 | Alunos, filtro vazio em Plus e Novos | "Bom sinal: ninguém precisa disso agora." | sem a frase | Ninguém no Plus não é bom sinal |

Não achei inglês, "tu", "vc", exclamação nem maiúsculas para gritar nas telas de produção. "Concluir treino", "Iniciar treino", "Cartão tocado" etc. só existem no catálogo de componentes, que só existe em `__DEV__`.

## 6. Melhorias aplicadas (P, sem [decidir])

Achadas usando o app como cada conta:

| # | Quem | O quê | Onde |
|---|---|---|---|
| 1 | todos | Carregando, erro com "Tentar de novo" e vazio com saída em 25 telas (matriz da seção 2) | `telas/compartilhado/estados.tsx` e as telas |
| 2 | Ana, Lucas | Anúncios do Modo treino e do Cronômetro ao leitor de tela | `TelaModoTreino.tsx`, `TelaCronometro.tsx` |
| 3 | Marcos, Bianca | Alunos de 50 em 50; filtro vazio com "Ver todos" | `academia/TelaAlunos.tsx` |
| 4 | Juliana | "Nenhum treino em uso" com academia ganha "Ver treinos prontos" (a frase oferecia e o botão não existia) | `TelaTreinos.tsx` |
| 5 | Juliana | Prontos: três vazios diferentes (busca, objetivo sem treino, academia sem prontos), cada um com saída | `TelaTreinos.tsx` |
| 6 | Lucas | Treino de 30 exercícios: os segmentos do Modo treino voltam a aparecer (vão de 1 acima de 12) | `TelaModoTreino.tsx` |
| 7 | Júlia | Meus alunos Plus e Aluno Plus esperam o plano: ninguém aparece como "Novo: sem treino e sem plano" por engano | `TelaMeusAlunosPlus.tsx`, `TelaAlunoPlus.tsx` |
| 8 | Marcos | O painel não mostra "0 de 0" enquanto carrega | `TelaPainelDoDono.tsx` |
| 9 | Ana | A Dieta diz qual dia está aberto (título e anúncio) | `TelaDieta.tsx` |
| 10 | Diego, Carlos | Links diretos (treino, série, pronto, perfil, aluno) esperam o dado antes de dizer "não encontrado", e o "não encontrado" tem saída | `TelaTreinoPronto`, `TelaEditarTreino`, `TelaSeries`, `TelaTreinoFeito`, `TelaProfissional`, `TelaMontarTreino`, `TelasDeProntos` |
| 11 | todos | Campo da entrada respeita o limite de fonte | `entrada/pecas.tsx` |

### Testes novos (todos falhavam com as telas de antes)

| Arquivo | Testes | Antes |
|---|---|---|
| `telas/aluno/EstadosDoAluno.test.tsx` | Início com erro (e o "Tentar de novo" refaz), semana como lista e plural, Plus com erro sem convite, Dieta carregando sem "Sem plano", rótulo do motivo e "N itens" | 5 de 5 falhavam |
| `telas/aluno/TelaModoTreinoLeitor.test.tsx` | série marcada, fim do descanso e desfazer anunciados | 2 de 2 falhavam |
| `telas/academia/TelaAlunosEstados.test.tsx` | erro com "Tentar de novo", filtro vazio com saída e sem "Bom sinal" em Plus, 300 alunos de 50 em 50 | 3 de 3 falhavam |

## 7. Para outras pastas (não editei)

**AG — `componentes/`:**
- `Equipe.tsx › ListaDaEquipe`: `accessibilityRole="list"` com `Cartao` tocável direto dentro. É a última falha do axe (`aria-required-children`). Envolver cada cartão num `View role="listitem"`.
- `FolhaInferior`: ao abrir, o foco cai na sobreposição "Fechar", que é o primeiro elemento do DOM. Pôr a sobreposição DEPOIS do painel (ou `focusable={false}` nela) faz o foco cair no conteúdo. A "Alça da folha" é um `div` com `aria-label` e sem papel, o mesmo caso que o axe acusou no perfil.
- `Campo` e `CampoNumerico`: o `TextInput` não tem `maxFontSizeMultiplier`. O texto digitado cresce sem o limite que o rótulo tem. Na entrada corrigi no campo de vidro.

**AG — `dados/`:**
- `useGravar` com tratamento de erro: **o `docs/revisao/AG-BUGS.md` não existia quando terminei** (conferi três vezes, a última no fim). As telas continuam chamando `gravar.*` com `await` sem `catch` em `TelaAlunos` (confirmar e recusar), `TelasDeProntos` (arquivar), `TelaPainelDoDono` (designar) e no `ProvedorDoAluno › salvarVarios` (`void repo.salvarTreino`). Quando o AG publicar a lista, é aplicar nesses pontos.
- `pedirVinculo` ("É esta, pedir para entrar") funciona **sem rede** no repositório local. O pedido de treino recusa sem sinal (R12.2). Com o Supabase, o pedido de vínculo também precisa de `ErroSemSinal`, e a tela `Sua academia` já tem onde mostrar.
- `useAlunos` com 3 consultas por aluno: com o servidor, uma consulta só (a lista com o resumo).

**Especificação:**
- o mapa de telas (Parte 1, Sua academia) ainda diz "Vou treinar sozinho por enquanto" (texto 24).

## 8. Arquivos

Novos:
- `app/telas/compartilhado/estados.tsx`;
- `app/telas/aluno/EstadosDoAluno.test.tsx`;
- `app/telas/aluno/TelaModoTreinoLeitor.test.tsx`;
- `app/telas/academia/TelaAlunosEstados.test.tsx`.

Mexidos:
- **aluno**: `TelaInicio`, `TelaTreinos`, `TelaHistorico`, `TelaTreinoFeito`, `TelaPlus`, `TelaDieta`, `TelaModoTreino`, `TelaCronometro`, `TelaEvolucao`, `TelaTreinoPronto`, `TelaEditarTreino`, `TelaSeries`, `TelaComemoracao`, `comum/Pecas`, `comum/equipe`, `estado/ProvedorDoAluno`, `perfil/TelaEquipe`, `perfil/TelaProfissional`, `perfil/TelaAvisos`, `perfil/TelaQuemPodeVer`, `perfil/TelaSuaAcademia`;
- **academia**: `TelaAlunos`, `TelaPerfilDoAluno`, `TelaMeusAlunosPlus`, `TelaAlunoPlus`, `TelaPainelDoDono`, `TelasDeProntos`, `TelasDeAviso`, `TelasDaEquipe`, `TelaMontarTreino`, `dados-da-academia`, `envio`, `pecas`;
- **entrada**: `pecas`, `TelasDeConta`, `TelasDoAluno`;
- **fora de `app/`**: `docs/decisoes.md`.
