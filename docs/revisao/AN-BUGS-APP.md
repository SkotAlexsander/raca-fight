# AN — Bugs, fragilidades e melhorias no app (aluno, professor e recepção)

> Agente AN, P12, onda 4, 16/10/2026. Escrevi só em `app/` (fora de `app/dominio/financeiro/` e `app/supabase/`) e neste relatório. Não mexi em `admin/`, `02-design/` nem em outro arquivo de `docs/`. Método: primeiro o teste que falha, depois a correção. Todo dado de teste usa nome fictício.

## Resumo

- Achei e corrigi **12 problemas** no app. Os mais sérios:
  - a chamada podia marcar como "não estava na aula" um aluno que fez check-in com a chamada já aberta;
  - dois toques rápidos em "Fechar" voltavam duas telas;
  - dois toques em "Marcar a experimental" criavam duas experimentais;
  - o Início travava o check-in da aula seguinte quando havia duas aulas em sequência.
- **Restos de musculação** que apareciam na tela:
  - "treino livre" e "treinos prontos" em "Sua academia";
  - o papel "Personal" na entrada da equipe;
  - as ilustrações dos estados vazios: verde do Academia Plus, com bancos de supino e uma anilha.
- **Pedidos do AU**: fiz a parte de menor risco, que é a tradução na borda com o servidor, em `dados/supabase/mapeadores.ts`. Os ids do domínio não mudaram. A troca completa de ids e o `RepositorioSupabase` de verdade ficaram como pendência (seção 3).
- **Verificação**:
  - domínio: **493/493**, também em `TZ=Asia/Tokyo` (a base era 457; 36 testes são novos, 12 deles meus);
  - telas: **109/109** (base 103);
  - tsc: 0 erros;
  - lint: os **mesmos 38 avisos** da base;
  - expo-doctor: **18/18**;
  - e2e do AM2: **32/32**.

## 1. Achados

| # | Gravidade | Arquivo:linha | O que era | O que fiz | Teste |
|---|---|---|---|---|---|
| AN-3 | **Alta** | `telas/equipe/TelaChamada.tsx:70`, `dominio/presenca/presenca.ts:436` | A tela congelava a lista de marcados no primeiro toque do professor. O aluno que fazia check-in depois disso, com a janela ainda aberta, aparecia desmarcado. Ao fechar a chamada, ele virava **"não estava na aula"**. | A tela guarda só o que o professor mudou (marcados e desmarcados à mão). Os presentes saem de `presentesDaChamada`, então o check-in novo já entra marcado. | `dominio/revisao-an.test.ts` (AN-3, 2 testes) |
| AN-4 | Média | `telas/equipe/TelaChamada.tsx:107` | Dois toques em "Fechar" fechavam a chamada duas vezes e faziam `router.back()` duas vezes: o professor saía do Hoje. | Pus o `useUmPorVez` e uma trava `fechou` que continua valendo depois do primeiro fechamento. O botão mostra que está carregando. | `telas/revisao-an.test.tsx` (AN-4) |
| AN-4b | Média | `telas/equipe/TelaChamada.tsx:135` | Sem sinal, a experimental marcada se perdia, e o aviso prometia "fica para marcar quando o sinal voltar", o que nada fazia. | As presenças vão para a fila do mesmo jeito. A tela **fica aberta** com a marca e diz para tocar em Fechar de novo quando o sinal voltar. | coberto pelo AN-4; a falta de rede não tem teste próprio |
| AN-1 | Média | `telas/aluno/CartaoDaProximaAula.tsx:47`, `dominio/presenca/presenca.ts:418` | O destaque do Início ficava na aula em andamento até ela **acabar**. Exemplo, na terça: quem faz Muay Thai às 20h e Boxe às 21h não conseguia fazer o check-in do Boxe entre 20:30 e 21:00, mesmo com a janela dele aberta. | Criei `aulaDoCheckin`: o destaque passa para a aula seguinte assim que o check-in da atual fecha. | AN-1 (3 testes) |
| AN-2 | Baixa (melhoria) | `telas/aluno/CartaoDaProximaAula.tsx:141` | A aula de hoje cancelada sumia do Início sem aviso, e aparecia a de outro dia. | No destaque aparece "Muay Thai das 20:00 foi cancelada hoje.", com o ícone de alerta (o erro sempre vem com ícone e frase, pela regra do AL). | AN-2 |
| AN-9 | Média | `telas/equipe/TelasDasExperimentais.tsx:234` | Dois toques rápidos em "Marcar a experimental" gravavam **duas experimentais e dois interessados**. A trava era um `useState`, e o segundo toque chega antes de a tela redesenhar. | Pus o `useUmPorVez` (a trava é uma ref). | AN-9 (antes: 5, esperado 4) |
| AN-10 | Média | `telas/equipe/TelaGraduacao.tsx:38` | Em "Fechar o exame", a trava do `salvarExame` soltava antes de as graduações serem gravadas. Um toque nesse meio fechava o exame de novo e duplicava as graduações. | O handler inteiro passou para dentro do `useUmPorVez`. | não tem teste próprio: é a mesma correção do AN-9 |
| AN-6 | Média (texto) | `telas/aluno/perfil/TelaSuaAcademia.tsx:67, 81, 99` | "Até lá, você já usa o treino livre e os treinos prontos" e "Sem academia, o treino livre continua". | Agora diz que, até a confirmação, a pessoa já vê os horários, os professores, os eventos e as técnicas (a vitrine do R14.7). Sem academia, "o cronômetro de rounds continua funcionando". | AN-6 |
| AN-6b | Baixa | `telas/aluno/perfil/TelaSuaAcademia.tsx:84` | Sem sinal, a busca do código falhava e a tela dizia "Não achamos academia com o código…". | Agora diz "Não deu para procurar o código agora. Confira a internet e tente de novo." | sem teste próprio |
| AN-7 | Média (texto) | `telas/entrada/TelasDaEquipe.tsx:52, 110`, `telas/entrada/fluxo.ts` | O código da equipe oferecia "Recepção ou instrutor" e **"Personal"**. O pedido dizia "O dono confirma pelo app", mas o dono usa o Admin. | Pus os papéis do mockup aprovado (`entrada.html`, C3): **Recepção** (pede `recepcao`) e **Professor** (pede `instrutor`). O texto agora diz "O dono confirma pelo app Admin". | AN-7 |
| AN-5 | Média (imagem) | `componentes/EstadoVazio.tsx:35` | As ilustrações de `estados-vazios/` são do Academia Plus (verde-água): "nenhum-aluno" mostra **bancos de supino** e "erro-carregar" mostra uma **anilha**. Apareciam em 19 telas. | Cada ilustração virou um ícone de luta (tatame, faixa, luva, alerta…) de 40, num círculo de 96 em `marcaSuave`, com o ícone na cor `marca`. Não criei tamanho novo e os arquivos não foram apagados. | AN-5 |
| AN-8 | Baixa | `telas/aluno/TelaTreinos.tsx:78` | Quem tem régua mas nenhuma faixa registrada via "Tempo na faixa: 0 meses" e "Aulas desde a última graduação", sem graduação nenhuma. | Sem graduação, aparece "Aulas desde o começo" e o "Tempo na faixa" some. | AN-8 (com a Elisa, que é fictícia; o teste falhava antes) |
| AN-11 | Baixa | `telas/equipe/TelaHoje.tsx:148` | Quem é professor e recepção entra como professor e não tem a aba Experimentais. Mesmo assim via o atalho "Nova experimental", que levava de volta ao Hoje. | O atalho só aparece para quem entra como recepção. | não tem teste: não existe conta de exemplo com os dois papéis |

**Conferido e sem problema**:
- os efeitos com limpeza: relógio, intervalo da fila, tela acesa do cronômetro, avisos e campo numérico;
- as datas da tela, que usam meio-dia local e estão certas em qualquer fuso;
- as abas por papel, que já têm teste;
- os nomes de ícone, que têm tipo (o TS pega nome errado);
- o toque mínimo de 48 no `Botao` (pelo hitSlop) e nos dias da grade;
- a escala tipográfica: só aparecem 13, 16, 20, 25, 31, 39 e 49;
- o número de 49 aparece só como destaque único: no cronômetro e em "dias por semana" na entrada;
- o 61 só aparece no catálogo de componentes, que só existe em desenvolvimento;
- a tela larga (2040 × 790) e os 390 px pelo e2e.

## 2. Pedidos do AU (seção 4 do `AU-INTEGRACAO.md`, parte "App")

O `RepositorioSupabase` ainda é só a forma (todas as funções jogam "não configurado"). Por isso fiz a **tradução na borda**, testada, que ele vai usar. Os ids de texto do domínio continuam: no banco eles são a `chave`. Fica tudo em `dados/supabase/mapeadores.ts`, com o teste em `mapeadores.test.ts`:

| Pedido | Estado |
|---|---|
| 1. Ids em uuid | **Feito na borda.** `idNoServidor` e `chaveDoServidor` traduzem a academia, as 5 modalidades, as 11 turmas e todos os horários para os uuid fixos do seed, na regra `…NN0h`, gerados a partir da ordem do `grade-raca-fight.ts`. A volta tem teste. O uuid real passa igual, e uma chave desconhecida dá erro claro. |
| 2. A presença sem o id `aula\|aluno` | **Feito.** `presencaParaOServidor` não manda o `id`, porque o servidor junta pelo par. O id local continua como está, para achar a presença no aparelho. |
| 3. `alunoId` → `pessoa_id` | **Feito na presença** (`pessoa_id: p.alunoId`). Nos outros tipos fica pendente: o nome do campo não mudou no domínio. |
| 4. A fila pela `registrar_presencas` | **O formato está pronto e testado** (snake_case, `horario_id` + `data`, sem `turma_id`, `aula_id`, `pela_equipe` e os "por"). Também ficaram prontos `CODIGOS_DE_REGRA_DO_SERVIDOR` e `ehErroDeRegraDoServidor`. Conferi que `classificarErroDeEnvio` já trata o erro 400 com essas palavras como `regra`: sai da fila como falhou e não repete. **Falta chamar a rpc**, porque não existe cliente Supabase. |
| 5. Nunca `select *` | Hoje não há consulta nenhuma. Deixei um **teste que trava** qualquer `select('*')` ou `select()` vazio no `RepositorioSupabase.ts`. |
| 6. Escritas por rpc | **Pendente**: depende do cliente de verdade. A lista de funções do AU ficou no comentário do repositório. |
| 7. Mapeamentos de forma | **Pendente**, com exceção da presença. |
| 8. Os campos "por" com a conta logada | O mapeador da presença não manda esses campos: o servidor preenche. Nos outros fica pendente, junto com o 6. |
| 9. `redigir.ts` | **Feito**: `motivoDaAnulacao`, `crianca`, `codigoDeIndicacao` e `token`, e as formas `motivo_da_anulacao` e `codigo_de_indicacao`. Tem teste. |

**Por que não troquei os ids do domínio inteiro**: os ids de texto estão em todo o exemplo e em centenas de testes, incluindo os do Admin (`muay-thai` no financeiro do AM1). Trocar agora quebraria a base sem nenhum ganho enquanto o servidor não existir. A tradução na borda dá o mesmo resultado no fio. Se o Alex ou o AU preferirem uuid também no aparelho, o caminho é gerar os ids de exemplo a partir do `idNoServidor`, uma tabela só.

## 3. Pendências (e por quê)

1. **O `RepositorioSupabase` de verdade** (pedidos 3, 6, 7 e 8 do AU): precisa do projeto Supabase e do cliente. A borda já está pronta.
2. **As ilustrações novas dos estados vazios**: é trabalho de `02-design/` (não é meu). Hoje são ícones de luta. Os arquivos verdes continuam em `app/imagens/estados-vazios/` e são copiados pelo `copiar-imagens.mjs`. Quando o design trocar, é só voltar a usar a imagem no `EstadoVazio`.
3. **Código morto que ainda fala de musculação**:
   - `telas/aluno/perfil/TelaProfissional.tsx` não tem rota e mostra "Especialidades" (Musculação, Funcional) e o CREF;
   - `TelaDieta.tsx` fica atrás de `RECURSOS.dieta`, que está desligado;
   - os textos de aviso de treino e de personal em `dominio/avisos.ts` não são agendados por ninguém;
   - o catálogo de componentes (só em desenvolvimento) ainda mostra carga e séries.

   Não apaguei nada disso: a dieta e o Plus são [decidir] do Alex (L12, L13), e a lista de especialidades de luta também (pendência 8 do AM2).
4. **A aba Experimentais para quem é professor e recepção**: hoje essa pessoa entra só como professor. Dar as duas abas é uma regra nova, então deixo para decidir.
5. **A chave "Cronômetro" em Avisos** diz "com o app fora da tela", mas a decisão R17 é gongo só com o app aberto. Não mexi, porque a notificação local do fim do round pode ser intencional. Vale conferir com quem cuida do R17.
6. **O lint tem 1 erro em `app/supabase/testes/banco.mjs`** (`@electric-sql/pglite` não resolve). A pasta é do AU. Não é meu e não mexi.

## 4. Verificação (16/10/2026, em `app/`)

| O quê | Base | Agora |
|---|---|---|
| `npm run testar:dominio` | 457 | **493 / 493**, 0 falhas. Os 36 novos: 6 em `dominio/revisao-an.test.ts` e 6 em `dados/supabase/mapeadores.test.ts`, que são meus; o resto entrou de outros agentes durante a onda. |
| o mesmo com `$env:TZ='Asia/Tokyo'` (PowerShell) | 457 | **493 / 493** |
| `npx jest` | 103 (11 suítes) | **109 (12 suítes)**: `telas/revisao-an.test.tsx` traz AN-4 a AN-9 |
| `npx tsc --noEmit` | 0 | **0** |
| `npx expo lint` | 0 erros, 38 avisos | **38 avisos**, nenhum meu (tirei os `require` do meu teste). 1 erro em `app/supabase/testes/banco.mjs`, que é do AU (ver a pendência 6). |
| `npx expo-doctor` | 18/18 | **18/18** |
| e2e Playwright (`AM2-capturas/fluxos.mjs` sobre um novo `expo export --platform web`, 390 × 844 e 2040 × 790) | 32/32 | **32/32** |

As capturas desta rodada ficaram fora do projeto, em `C:\Users\alexs\AppData\Local\Temp\claude\a--Claude\40b1ec06-06e4-4f50-b321-b3e3c5f7f9d5\scratchpad\e2e\`.

Cada teste novo **falhou antes da correção**: os de domínio, por falta da função; o AN-4, com `back` chamado 2 vezes; o AN-5, com 3 imagens; o AN-6 e o AN-7, pelo texto; o AN-8, com a correção desfeita de propósito; o AN-9, com 5 experimentais no lugar de 4.

## 5. Arquivos que mudei

- **Domínio**: `dominio/presenca/presenca.ts` (`aulaDoCheckin`, `presentesDaChamada`) e `dominio/revisao-an.test.ts`, que é novo.
- **Dados**: `dados/redigir.ts`, `dados/supabase/mapeadores.ts` (novo), `dados/supabase/mapeadores.test.ts` (novo) e `dados/supabase/RepositorioSupabase.ts` (só o comentário).
- **Componente**: `componentes/EstadoVazio.tsx`.
- **Telas**:
  - `telas/aluno/CartaoDaProximaAula.tsx`, `TelaTreinos.tsx` e `perfil/TelaSuaAcademia.tsx`;
  - `telas/equipe/TelaChamada.tsx`, `TelasDasExperimentais.tsx`, `TelaGraduacao.tsx` e `TelaHoje.tsx`;
  - `telas/entrada/TelasDaEquipe.tsx` e `fluxo.ts`;
  - `telas/revisao-an.test.tsx`, que é novo.
