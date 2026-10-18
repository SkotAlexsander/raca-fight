# AE — Melhorias da segunda busca aplicadas (P11, onda 4) · 11/10/2026

O agente AE aplicou no `app/` o que o AC (`AC-MELHORIAS.md`) deixou para código: o top 10, os itens C1–C17 e os 18 textos. Depois mediu os toques ANTES × DEPOIS refazendo as tarefas do AC com Playwright.

Regras que segui:
- nenhum **[decidir]** foi resolvido (conversa, quem escreve o plano alimentar, "dieta" × "plano alimentar", treino descartado no servidor);
- o design está **congelado**: as telas novas usam só componentes que já existem, a escala fechada e um herói por tela;
- a troca das ilustrações pelo mapa muscular **não** foi feita (espera a aprovação do Alex; é de outro agente);
- o que o AB corrigiu ficou como está. A folha de descarte, a trava de duplo toque, a fila e o botão fora do cartão do personal (M7) foram reaproveitados, nunca refeitos. Na linha "Meu treino" do Plus, o botão "Usar este treino" fica **ao lado** da linha, e ela deixa de ser tocável: assim não volta o botão dentro de botão do M7.

Scripts e capturas (temporários) ficam em `scratchpad/ae/`:
- `toques.mjs` e `lib.mjs`: as tarefas do AC com a contagem de toques;
- `ponta-a-ponta.mjs`: os 8 fluxos do AA, adaptados;
- `antes/`: cópia do `app/` antes desta rodada;
- `dist/`: o export de produção;
- `capturas/`: as capturas.

---

## 1. Resultado das verificações

| Verificação | Resultado |
|---|---|
| `npm run tipos` (tsc) | **0 erros** |
| `npm run testar:dominio`, TZ padrão (São Paulo) | **413 de 413**. Eram 382: entraram 31 de `dominio/andamento.test.ts` e `dominio/acompanhamento.test.ts` |
| o mesmo com `TZ=Asia/Tokyo` pelo PowerShell (offset −540 conferido) | **413 de 413** |
| `npm run testar:telas` (jest-expo) | **115 de 115**, 15 suítes (eram 97 em 11) |
| `npx expo-doctor` | **18/18** |
| `npx expo export --platform web` | exporta (2,5 MB de JS). O catálogo de componentes **não está no pacote**: nenhuma das suas strings aparece no JS |
| Os 8 fluxos do AA (393 e 2040 × 790, claro e escuro) | **32 de 32 passam**, sem erro de página nem de console e sem rolagem horizontal |
| Tarefas do AC refeitas, antes (build `ab/dist5`) × depois (`ae/dist`) | seção 2 |

Os testes que **falhavam antes** da mudança:
- os 31 do domínio, porque os módulos não existiam;
- os 7 de `formatarDuracao`, que passaram a pedir o espaço;
- 4 de 4 do campo vazio, em `componentes/CampoNumerico.test.tsx`;
- 3 de 3 de `telas/aluno/TelaModoTreinoFechar.test.tsx`;
- 2 de 3 do primeiro treino em uso, rodados contra o provedor de antes. O terceiro é a guarda do R1.3 ("com outro em uso, fica guardado"), que já valia;
- os 8 da rota inicial por papel, em `telas/rotas.test.tsx`.

Nos 8 fluxos do AA, só mudou o que mudou de propósito:
- "Encerrar o treino" agora é "Fechar o treino" e pede "Fechar assim", e o roteiro confere a frase "Faltam N séries de M exercícios.";
- o atalho do Início se chama "Histórico";
- depois de "Usar", o roteiro confere que a tela é **Meus treinos**, e não o editor.

## 2. Toques antes × depois (as tarefas do AC)

Os toques são contados a partir da tela em que o app abre para a conta. Digitar fica à parte. Os dois builds rodaram com o mesmo roteiro (`toques.mjs`).

| Conta | Tarefa | Antes | Depois | O que se vê agora |
|---|---|---|---|---|
| Ana | "Fechar" no menu com 1 série feita | **fechava** (2 toques dentro do treino), e o treino contava na semana | **pergunta antes**: "Faltam 19 séries de 7 exercícios." · Voltar ao treino · Fechar assim | Fechar de propósito custa 1 toque a mais |
| Ana | Voltar ao Início depois de treinar | herói "Hoje · Treino B · Começar" | herói **"Treino de hoje feito"**, "Próximo: Treino B · Costas e bíceps · 6 exercícios" e "Fazer o Treino B agora" em texto | A comemoração diz "1 de 20 séries" e "19 séries ficaram para a próxima vez." |
| Ana | Rever um treino passado | **impossível** | **2** (Histórico → o treino) | Tela nova: as séries reais por exercício, o pulado e a nota |
| Ana | No Modo treino, ir ao exercício 5 | **4** ("Próximo" × 4) | **2** (o título → o exercício 5) | Folha "Treino de hoje" com o estado de cada exercício |
| Juliana (pendente) | Escolher um pronto e começar | **6** (caía no editor) | **5** (cai em Meus treinos e desliza) | Aviso "Primeiros passos em uso · Ajustar"; "Baseado em Primeiros passos — Academia do Marcos", sem o "— " solto |
| Juliana | Carga do leg press no 1º dia | "0 quilos" (gravaria "peso do corpo") | **"—"**, e o leitor de tela diz "vazio" | Grava sem carga até ela pôr um número |
| Juliana | Saber se a academia confirmou | **1** (aba Perfil) | **0**: o cartão "Aguardando a recepção confirmar" no Início | O Plus diz "O Plus aparece quando a Academia do Marcos confirmar a sua entrada." |
| Lucas (sem academia) | Montar do zero e começar com 1 exercício | **8** | **7** | O "Usar este treino" sumiu: o treino nasceu em uso. Sem o toque no chip "1 dia", que o AC contou, seriam 6 |
| Lucas | Entrar numa academia depois | **impossível** | **2** (Tenho um código → digitar → É esta, pedir para entrar) | O Início passa a mostrar "Aguardando a recepção confirmar" |
| Júlia (personal) | Ver as refeições da Ana | **impossível** (abria em Alunos, e a tela da Ana era a do instrutor) | **2** (abre em Meus alunos Plus → Ana → Dieta) | "1 de 35 refeições marcadas em 7 dias", "1 de 75 em 30 dias", o plano de hoje com a marca e os motivos do "Não segui" |
| Júlia | Ver como a Ana está | 2 | **1** | Abre direto em Meus alunos Plus |
| Marcos (dono) | Ver quem sumiu esta semana | 1 (abria em Alunos e tocava o filtro) | **1** (abre nos números e toca "Sumidos") | A lista já vem filtrada. Os dados de exemplo têm **um** sumido só (Rafael, 34 dias), então o selo não aparece na tela; a ordem e o selo estão provados nos testes do domínio (`ordenarPorFiltro`, `sumiuEstaSemana`) |

Nenhuma tarefa piorou, a não ser o fechamento pela metade, que ficou 1 toque mais longo **de propósito** (R13.1).

## 3. O que foi aplicado

### Top 10 e itens de código

| Item do AC | O que mudou | Onde |
|---|---|---|
| 1 · C1 (R13.1) | O menu "Fechar o treino" abre a folha com o que falta. Sem série feita, mostra "Descartar o treino", que leva à folha de descarte do AB. Com tudo feito, vale a pergunta do F4.6 | `telas/aluno/TelaModoTreino.tsx`; regra `dominio/andamento.ts › oQueFalta` |
| 2 · C2 (R13.2, R13.3) | O treino criado sem nenhum em uso nasce ativo. O de "Adiciono depois" vira ativo ao ganhar o 1º dia. "Usar" um pronto volta a Meus treinos com "em uso · Ajustar" | `estado/ProvedorDoAluno.tsx` (`criar`, `salvar`), `TelaTreinoPronto.tsx`, `TelaTreinos.tsx` (`?aba=meus`); regra `deveNascerEmUso` |
| 3 · C3 (F4.8) | "Treino de hoje feito" no herói, com o próximo dia escrito. "Fazer o [dia] agora" fica em botão de texto. O dia sem exercício mostra "Adicionar exercício", que leva ao editor (antes levaria a um Modo treino vazio) | `TelaInicio.tsx` |
| 4 · C4, C5, C17 (R13.4, R13.5) | "Tenho um código" no Início vazio, em Prontos da academia, no convite do Plus e na linha "Sem academia" do Perfil, que agora é tocável. A tela nova **Sua academia (perfil)** tem três estados: sem academia (o código, com as mesmas caixas e o mesmo cartão do F13.3), pendente (com "Cancelar o pedido") e ativo. O cartão "Aguardando a recepção confirmar" no Início não se dispensa e some quando a recepção confirma. A sub-aba Prontos continua, agora com o botão | `perfil/TelaSuaAcademia.tsx` (rota `/perfil/academia`), `TelaInicio.tsx`, `TelaTreinos.tsx`, `TelaPlus.tsx`, `perfil/TelaPerfil.tsx` |
| 5 · C6 (R13.7) | O dono abre em Academia (números) e o personal com aluno Plus em Meus alunos Plus; o resto, em Alunos. Vale ao abrir o app e ao "Trocar de visão" | `telas/rotas.ts › rotaInicialDaAcademia`, `telas/academia/PortaDaAcademia.tsx`, `navegacao/index.tsx`, `TelaEscolherVisao.tsx` |
| 6 · C7 | Tela **Aluno Plus (personal)**: a ilha escura, os chips Resumo · Treino · Dieta, os dados corporais, o objetivo e as restrições, a frequência, a adesão de 7 e 30 dias, o treino em uso × o do personal (com "Ajustar o atual" e "Montar treino"), o plano em vigor com a marca de hoje e os motivos do "Não segui". Só o personal **deste** aluno Plus abre a tela (R6.6) | `telas/academia/TelaAlunoPlus.tsx` (rota `/acompanhamento/[id]`); regras `adesaoDaDieta`, `motivosDoNaoSegui` |
| 7 · C8 (R13.8) | Cada filtro tem a sua ordem: sumidos do mais recente para o mais antigo, com o selo "Sumiu esta semana" (o `Chip` info); pedidos e pendentes do mais antigo; novos pelo vínculo mais antigo; o resto por nome | `TelaAlunos.tsx`; regras `ordenarPorFiltro`, `sumiuEstaSemana` |
| 8 · C9 (R13.6) | O título e os segmentos do Modo treino abrem a folha "Treino de hoje": feito, pulado, "x de y séries" ou "Por fazer · 4 × 8 · 40 kg", com "Agora" no atual. O feito e o pulado não são tocáveis | `TelaModoTreino.tsx`; regra `situacaoDoExercicio` |
| 9 · C10 (R1.14, R12.1) | A carga sem planejada nem histórico fica **vazia** e grava vazia | `componentes/CampoNumerico.tsx` (estado vazio), `TelaModoTreino.tsx` |
| 10 · C11, C12 (F4.7) | A linha do Histórico abre **Treino realizado (detalhe)**. A comemoração mostra "N de M séries" e os pulados quando faltou algo | `TelaHistorico.tsx`, `TelaTreinoFeito.tsx` (rota `/inicio/treino-feito/[id]`), `TelaComemoracao.tsx` |
| C13 | Cada quadro do painel abre a lista já filtrada (`/alunos?filtro=`). "Com treino ativo" abre quem está **sem**, com a ação "Ver quem está sem" | `TelaPainelDoDono.tsx`, `TelaAlunos.tsx` |
| C14 (R13.9) | Na lista do personal, o motivo "Treina outro treino ([nome])" fica entre a adesão caindo e o treino para trocar. No Plus do aluno, a linha diz "Não está em uso · [nome]" e tem o botão "Usar este treino" | `TelaMeusAlunosPlus.tsx`, `TelaPlus.tsx` |
| C15 (R13.10) | O recado do pedido aparece no topo das folhas de prontos (Dar e Partir de) e na faixa "Montando para" | `academia/envio.tsx › FolhaDeProntos`, `TelaPerfilDoAluno.tsx`, `TelaMontarTreino.tsx` |
| C16 | Catálogo de componentes só em `__DEV__`: Perfil do aluno, Perfil da equipe, contas de exemplo e tela provisória. A rota `/componentes` corta o `require` na produção e manda para `/` | `navegacao/componentes.tsx` e as 4 telas |

### Os 18 textos

| # | Antes → Depois | Onde |
|---|---|---|
| 1–3 | "Encerrar o treino", "Encerrar treino?", "Encerrar" → "Fechar o treino", "Fechar o treino?", "Fechar treino" (e "Fechar assim"). O Histórico vazio diz "assim que você fechar um treino" | `TelaModoTreino.tsx`, `TelaHistorico.tsx`; também o exemplo do catálogo |
| 4 | Atalho "Treino passado" → "Histórico" | `TelaInicio.tsx` |
| 5 | "Escolha um pronto…" sem academia → "Monte o seu do zero. Os prontos vêm com a academia." | `TelaTreinos.tsx` |
| 6 | "…O código da academia entra aqui depois." → "Tem o código da sua academia? Toque para entrar." | `perfil/TelaPerfil.tsx` |
| 7 | Plus do pendente → "O Plus aparece quando a Academia do Marcos confirmar a sua entrada." | `TelaPlus.tsx` |
| 8 | "Baseado em: X — (sem nome)" → "Baseado em X — [academia do pronto]", igual nas duas telas (`textoBaseadoEm`) | `TelaTreinos.tsx`, `TelaEditarTreino.tsx` |
| 9 | "A conversa… chega na próxima versão" → "A conversa pelo app ainda não está pronta. Fale com Júlia na academia." | `TelaPlus.tsx` |
| 10 | Saiu "(escolha provisória de 11/10)" | `TelaMeusAlunosPlus.tsx` |
| 11 | "dieta 3 % em 7 dias", "Adesão caiu: 30 %…" → "1 de 35 refeições marcadas em 7 dias", "Marcou menos refeições: 10 de 35 nesta semana, 21 na anterior" | `TelaMeusAlunosPlus.tsx` |
| 12 | "…ainda sem a revisão do profissional com CREF." → "Revise antes de indicar: estes modelos ainda não passaram por um profissional com CREF." | `TelasDeProntos.tsx` |
| 13 | "Diego Alves, você tem 2 vínculos…" → "Diego, você é personal e aluno na Academia do Marcos. Por onde quer entrar? Dá para trocar no Perfil." | `TelaEscolherVisao.tsx › fraseDaEscolha` |
| 14 | "O que aconteceu?" → "O que aconteceu no almoço?" ("na ceia" para as femininas) | `TelaDieta.tsx › emQualRefeicao` |
| 15 | Três "— Não informado" → só o que existe, e a frase "Ana não informou idade. Dá para montar o treino sem isso." | `TelaPerfilDoAluno.tsx › DadosCorporais` (também na tela do personal) |
| 16 | "46min · 1h 05min" → "46 min · 1 h 05 min" | `dominio/unidades.ts › formatarDuracao` |
| 17 | "1 dias com treino" no leitor de tela → "1 dia com treino" | `TelaPerfilDoAluno.tsx` |
| 18 | "Esteira 1 × 5:00 · 0 s" e "cerca de 25 min · " (sem academia) → sem o "0 s" e sem o separador solto | `comum/Pecas.tsx`, `TelaMontarTreino.tsx`, `TelaTreinoPronto.tsx` |

**Por que o texto 16 mexe no domínio, e o que mudou nos testes.** O formato mora em `dominio/unidades.ts`, e o teste do domínio conferia o formato antigo, sem espaço. O tom de voz pede a unidade sempre com espaço (princípio 8), e o Histórico do aluno já escrevia "46 min". Então o teste foi trocado **primeiro**: falhou (`'1min 30s'` contra `'1 min 30 s'`), e só depois a função mudou. Os 7 casos são:
- `45 s`;
- `1 min 30 s`;
- `10 min`;
- `46 min` (novo);
- `1 h 05 min`;
- `2 h`.

Só o Histórico da academia usa a função. O cronômetro (`formatarTempo`, "1:02:05") não foi tocado.

### Arquitetura
`03-arquitetura/03-DECISOES-TECNICAS.md`, seção 2, agora tem a tabela dos três tipos da fila: `treino_realizado`, `refeicao_registrada` e `refeicao_apagada`. Para cada um, diz o que vai na carga, o que o servidor faz e quando entra:
- o `refeicao_apagada` entra ao desmarcar uma refeição que já subiu ou que subia naquela hora, e ao trocar a marca de uma que já subiu;
- a marca que ainda não subiu só sai da fila.

Acrescentei uma decisão: no servidor, apagar o que já não existe conta como sucesso, porque o reenvio depois de uma queda não pode virar "falhou".

## 4. O que ficou, e por quê

- **Conversa** (o botão "Conversar" e a parte Conversa da tela do personal): é **[decidir]**, chat ou WhatsApp. O aviso agora diz o que fazer.
- **"Novo plano", "Copiar e ajustar" e os planos futuros e encerrados** na tela do personal:
  - pela escolha provisória de 11/10, quem escreve o plano é a nutricionista parceira;
  - o repositório só lê o plano de uma data.
- **"Editar observação" e "Apagar (até 7 dias)"** no Treino realizado (detalhe): a tela é só de leitura nesta rodada. Apagar mexe na fila e na semana, e merece regra própria.
- **"Desvincular" e várias academias** em Sua academia: é [decidir] no mapa.
- **Abaixo do corte do AC, não pedidos aqui**:
  - o sino com "Avisos recebidos" e a marca por item na Dieta, que pedem desenho;
  - esconder a chave "Mensagens", que depende da conversa;
  - os pendentes que o personal vê sem poder confirmar.
- **Mapa muscular no lugar das ilustrações**: espera o Alex, e outro agente faz.
- **O selo "Sumiu esta semana" na tela**: os dados de exemplo não têm ninguém entre 14 e 20 dias sem treinar. A regra está testada; para ver na tela, falta um aluno de exemplo nessa faixa (decisão de dados, não de código).
- **Observado, não mexido (design congelado)**: a 2040 × 790, o aviso rápido ocupa a largura toda da janela, e não a coluna de 600. É o componente de antes, que agora aparece mais por causa do "em uso · Ajustar". Fica para quando o design descongelar.
- **Só no aparelho**:
  - a folha "Treino de hoje" e o campo vazio com o VoiceOver/TalkBack de verdade;
  - o `router.dismissTo` na pilha nativa (na web, volta a Meus treinos, como se vê nos 32 fluxos).

## 5. Arquivos

Novos:
- domínio: `app/dominio/andamento.ts` e `.test.ts`, `app/dominio/acompanhamento.ts` e `.test.ts`;
- telas do aluno: `app/telas/aluno/TelaTreinoFeito.tsx`, `app/telas/aluno/perfil/TelaSuaAcademia.tsx`;
- telas da academia: `app/telas/academia/TelaAlunoPlus.tsx`, `app/telas/academia/PortaDaAcademia.tsx`;
- rotas: `app/navegacao/(aluno)/(abas)/inicio/treino-feito/[id].tsx`, `app/navegacao/(aluno)/(abas)/perfil/academia.tsx`;
- testes de tela: `app/telas/aluno/TelaModoTreinoFechar.test.tsx`, `app/telas/aluno/estado/PrimeiroTreino.test.tsx`, `PrimeiroTreinoSemDia.test.tsx` e `PrimeiroTreinoComOutro.test.tsx` (um cenário por arquivo, porque o `ProvedorDeDados` abre o armazenamento uma vez por arquivo).

Mexidos:
- componentes: `CampoNumerico` (e o teste);
- domínio: `unidades.ts` (e o teste);
- telas do aluno: `TelaModoTreino`, `TelaInicio`, `TelaTreinos`, `TelaTreinoPronto`, `TelaEditarTreino`, `TelaHistorico`, `TelaComemoracao`, `TelaPlus`, `TelaDieta`, `comum/Pecas`, `perfil/TelaPerfil`, `estado/ProvedorDoAluno`;
- telas da academia: `TelaAlunos`, `TelaMeusAlunosPlus`, `TelaPerfilDoAluno`, `TelaPainelDoDono`, `TelaMontarTreino`, `TelasDeProntos`, `TelasDaEquipe`, `envio`;
- telas compartilhadas: `TelaEscolherVisao`, `TelaEntrarComContaDeExemplo`, `TelaProvisoria`, `TelaCatalogoDeComponentes`;
- rotas: `telas/rotas.ts` (e o teste), `navegacao/index.tsx`, `navegacao/componentes.tsx`, `navegacao/(academia)/acompanhamento/[id].tsx`;
- fora do `app/`: `03-arquitetura/03-DECISOES-TECNICAS.md` e `docs/decisoes.md`.
