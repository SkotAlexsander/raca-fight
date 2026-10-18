# T — Código: bugs e fragilidade (P10, 11/10/2026)

Agente T. Escrevi só em `app/`, `03-arquitetura/`, neste arquivo e, a pedido do coordenador, no fim de `docs/decisoes.md`. O visual não foi tocado. Nenhum **[decidir]** foi resolvido. Não rodei `npm install` no projeto.

**Resumo**
- **10 bugs** achados e corrigidos (T1 a T10): 0 alto, 4 médios, 6 baixos. Cada um tem um teste que falhou antes da correção (`dominio/revisao-t.test.ts`: na primeira rodada, 14 testes, 0 passaram).
- **8 endurecimentos** (F1 a F8). Entre eles: o validador do estado do cronômetro e o do catálogo, uma fonte só para a duração, os testes de propriedade com semente fixa e os `assert.throws` sem conferência de mensagem.
- **Segurança**: 3 achados confirmados por um verificador separado e corrigidos (S1 a S3), mais 1 rejeitado e 3 que precisam de validação.
- **Configuração**: falta uma dependência par do `expo-router` 6, que acrescentei. As 27 que o SDK 54 lista conferem. Ainda faltam 3 imagens do `app.json` (A29).
- **P10, pedido do Alex e do V**: entraram no código e no modelo o `PerfilProfissional` (com RLS), o `PedidoDeTreino`, `trocarEm`, `motivoDeSaida`/`encerradoPor`, a fila com dono (R12.3), a carga sugerida (R12.1) e os avisos 21 e 22.
- Testes: de **262 para 318, todos verdes**, também com `TZ=UTC`, `Asia/Tokyo` e `America/New_York`. O `tsc` estrito sobre o `dominio/`, rodado numa pasta temporária, sai com código 0.

Formato de cada achado: **onde · o que está errado · prova · o que fiz**. As linhas citadas são as do arquivo **depois** da correção, onde o comentário "Revisão T (Tn)" marca o ponto.

---

## 1. Bugs

### Média

**T1. A agenda de lembretes mudava conforme o fuso da máquina que fazia a conta**
- **Onde**: `app/dominio/avisos.ts:417` (`agendaDaSemana`, entrada `agora`).
- **Erro**: `Date.parse('2026-10-12T19:00:00')`, sem fuso, é lido na hora local de quem executa. No celular em -03:00 isso dá 22:00Z; na Edge Function em UTC, 19:00Z. O lembrete das 18:00 era "passado" num e "futuro" no outro, embora a função diga "a mesma entrada dá sempre a mesma agenda".
- **Prova**: `TZ=America/Sao_Paulo` e `TZ=UTC` deram instantes 3 h diferentes para o mesmo texto. O teste T1 falhava.
- **Feito**: `agora` precisa de fuso explícito (`…-03:00` ou `…Z`, R7.4). Sem fuso, é erro.

**T2. Relógio atrasado à mão gerava volta negativa e trazia de volta a fase pulada**
- **Onde**: `app/dominio/cronometro.ts:109` (campo novo `ultimoToqueEm`), mais `agoraSeguro` e `tocar`.
- **Erro**: a R9.4 diz que "o cronômetro não anda para trás". Voltas e saltos são posições, não instantes, e o "agora" seguro só olhava início, pausas e fim.
  - Volta aos 60 s, relógio atrasado 30 s, outra volta: a segunda volta ficava com **−30 s**.
  - Fase pulada aos 5 s, relógio atrasado 4 s: a tela voltava ao **trabalho 1**, que já tinha sido pulado.
- **Prova**: sonda e os dois testes T2 (`duracaoMs: -30000`; a fase lida era `trabalho`).
- **Feito**: todo toque (iniciar, pausar, retomar, ±30 s, pular, volta, parar) grava `ultimoToqueEm`, e o "agora" nunca fica antes dele.
- **Limite que fica**: leitura solta não é gravada. Entre dois toques, quem segura o número na tela é a própria tela, guardando o maior valor já mostrado. Isso fica para quem escrever a tela.

**T3. Intervalado longo perdia o aviso do fim**
- **Onde**: `app/dominio/cronometro.ts:680` (`proximosAvisos`).
- **Erro**: 99 rodadas geram 197 avisos. O corte em 24 (R9.11) jogava fora o **fim**, que é o aviso mais importante. Com o app fechado, nada reagenda, e o aluno não era avisado de que terminou.
- **Prova**: o último da lista era `inicio_trabalho`. O teste T3 falhava.
- **Feito**: o fim fica sempre na última vaga. Com uma vaga só (`proximoAviso`), vale o próximo aviso. Quem cabe inteiro, como o Tabata (16), não muda.

**T4. Lembrete "por refeição" deixava de fora a refeição sem horário, sem aviso e sem descarte**
- **Onde**: `app/dominio/avisos.ts:479`.
- **Erro**: o comentário do tipo (`RefeicaoParaLembrete.horario`) diz "sem horário, não há lembrete próprio (entra no resumo da noite)". O código não punha o resumo. Num plano sem horários, o modo "por refeição" não lembrava nada e também não registrava descarte que a tela pudesse explicar.
- **Prova**: sonda (`agendadas: [], descartadas: []`) e o teste T4.
- **Feito**: com refeição não opcional sem horário, o resumo da noite entra junto e conta no limite do dia.
- **Atenção**: o teste antigo do G fixava só `['12:00']`. Ele foi atualizado, com comentário. Se o Alex preferir o comportamento antigo, basta reverter uma linha.

### Baixa

**T5. Dia da semana errado e data de treino em outro formato sumiam em silêncio**
- **Onde**: `app/dominio/avisos.ts:427`.
- **Erro**: com `dias: ['segunda']`, nenhum lembrete era agendado e nada era descartado. Com `datasComTreino` em formato de instante, a data nunca casava com o dia, e o lembrete tocava no dia em que o aluno já tinha treinado.
- **Prova**: sonda e o teste T5.
- **Feito**: os dois casos agora são erro, com o nome do campo na mensagem.

**T6. Aviso da academia aceitava link sem "http" ou "www"**
- **Onde**: `app/dominio/avisos.ts:595` (`temLink`).
- **Erro**: a R10.10 diz "sem link", mas passavam `bit.ly/plano`, `academia.com.br/pix` e `wa.me/55…`. É exatamente o formato do golpe do Pix numa mensagem para todos os alunos.
- **Prova**: o teste T6. Os casos de controle "A.B", "7.30" e "R$ 49,90" continuam aceitos.
- **Feito**: domínio colado a um final conhecido também conta como link. A função é exportada e o perfil profissional usa a mesma.

**T7. `lerNumero` devolvia `Infinity`**
- **Onde**: `app/dominio/unidades.ts:87`.
- **Erro**: 400 dígitos passavam pela expressão regular, e o resultado era `Infinity`, contra o documentado ("NaN se não der").
- **Feito**: devolve `NaN`.

**T8. Formatadores aceitavam valor impossível**
- **Onde**: `app/dominio/unidades.ts:69`, `:267` e `:350`.
- **Erro**:
  - `formatarNumero(NaN)` dava "NaN";
  - `formatarReais(1e300)` dava "R$ 1e+298,00";
  - `instanteComFuso(new Date('x'))` dava `0NaN-NaN-NaNTNaN:…`, que iria para o banco como instante.
- **Feito**: os três lançam `RangeError`. Em dinheiro, só inteiro seguro.

**T9. Tempo digitado enorme virava número inexato**
- **Onde**: `app/dominio/unidades.ts:189`.
- **Erro**: `minutosSegundosParaSegundos('99999999999999999999')` dava 1e20.
- **Feito**: é recusado.

**T10. `nomeDeDiaPorLetra(-1)` dava "@"**
- **Onde**: `app/dominio/treino.ts:256`.
- **Erro**: `-1` dava "@", e `NaN` dava o caractere nulo.
- **Feito**: só aceita inteiro ≥ 0.

Conferido sem bug:
- virada de dia, mês e ano, e 29/02 (`lerDataISO`, `somarDias`, idade);
- fuso e horário de verão no cronômetro;
- lista com um item (`sugerirProximoDia`, `faseEm`);
- mutação do objeto recebido, em todas as funções (agora também coberto pelos testes de propriedade);
- vírgula e ponto (`lerNumero`). O "1.800" (D7 da revisão A) continua pendente na especificação.

---

## 2. Fragilidade: o que endureceu

| # | Onde | Antes | Agora |
|---|---|---|---|
| F1 | `cronometro.ts:843` `restaurarCronometro()` | o estado volta do armazenamento como `JSON.parse(...) as Cronometro`; um `rodadas: 0` fazia `faseEm` devolver `undefined` e a tela quebrar | valida tipo, limites, coerência entre estado, início, pausa e fim, e a ordem das voltas; o que vier estragado vira `null` (o app zera), nunca lança; aceita o estado antigo sem `ultimoToqueEm`. São 15 casos estragados no teste |
| F2 | `catalogo/catalogo.ts` (novo) | só o teste sabia ler o JSON do catálogo, com `as T`; o montador era uma cópia dentro do teste | `validarCatalogo()` diz o caminho do erro (`programas[0].dias[0].exercicios[1].series`) e `montarTreinoPronto()` é do domínio; o teste confere que os dois montam igual |
| F3 | `treino.ts:577` `estimarMinutosDoDia()` | duas fontes da mesma duração: o `duracaoMinutos` do JSON e a conta, com ±20 % de folga | a duração da tela é a conta arredondada a 5 min. Medi os 23 dias: todos já batiam com o arredondamento. O validador exige **igualdade** no dia e no programa |
| F4 | `cronometro.ts` | o número mágico `1000` em 14 lugares; `3600` e `60` repetidos do `unidades.ts` | `MS_POR_SEGUNDO` e as constantes de `unidades.ts` |
| F5 | `cronometro.test.ts:184-185, 276, 280` | quatro `assert.throws(() => …)` sem mensagem: passavam com qualquer erro, até um `TypeError` de bug | cada um confere a mensagem certa |
| F6 | `cronometro.test.ts:287` | `montarFases(tabata().configuracao)` não compila (`ConfiguracaoDoCronometro` não é `ConfiguracaoIntervalado`); passava porque o Node só apaga os tipos | corrigido; o `tsc` estrito sai com 0 erros |
| F7 | `propriedades.test.ts` (novo) | — | gerador mulberry32 com semente fixa (20261011), sem biblioteca: 500 datas, tempos e números em ida e volta (formatar → ler); 200 treinos aleatórios (duração e volume ≥ 0, minutos múltiplos de 5, nada muda o recebido); 300 cronômetros × 40 toques com o relógio indo e voltando (nada negativo, progresso entre 0 e 1, avisos ≥ 0 s, nada anda para trás depois de um toque, o JSON volta igual) |
| F8 | `avisos.ts`, `tipos.ts` | `DiaDaSemana` definido em `avisos.ts` | `DiaDaSemana` e `DIAS_DA_SEMANA` em `tipos.ts`, uma fonte só, que o perfil profissional também usa |

**Proposto e não aplicado** (mudança grande demais para uma checagem final):
- **Tipos largos**: `DataISO`, `InstanteISO` e `HoraDoDia` são `string`. Um tipo de molde (`` `${number}-${number}-${number}` ``) ou uma marca (`string & { __data: true }`) pegaria na compilação o caso do T5. Custo: todo literal nos testes precisaria de um construtor. Vale fazer quando `dados/mapeadores.ts` existir, porque é lá que o texto do banco entra.
- **Limites de tela no domínio** (D6 da revisão A): carga até 999,5 kg, repetições até 99 etc. Só depois de entrarem na R1.14.
- `montarTreinoPronto` ignora a `observacao` do dia, porque `adicionarDia` não a aceita. O catálogo de hoje não usa observação de dia. Entra quando a tela de editar dia existir.

---

## 3. Segurança (skill `auditar-seguranca`)

**Alvo**: `app/` (o domínio, os JSON, `package.json`, `app.json`, `eas.json`, `.env.exemplo`, `.gitignore`) e `03-arquitetura/`, inclusive as seções 23 a 25 que escrevi nesta rodada.

**Ameaça**:
- **dados**: dado de saúde (R6.1), dado pessoal do profissional, a fila offline e a chave do Supabase;
- **atores**: aluno, aluno de outra academia, aluno pendente, funcionário, dono, profissional de outra academia, quem pega o celular e quem lê os logs (Sentry e suporte);
- **entradas**: tela, armazenamento local, JSON do catálogo, respostas do PostgREST e políticas RLS.

**Evidência automática**:
- o `security-surface.sh` só achou ruído: regex de data e `join` de mensagens;
- não há git, lockfile nem CI no projeto, então não há histórico de segredo para varrer;
- o `.env` não existe, só o `.env.exemplo`, com a chave **anônima**;
- `segredos/`, `.env*` e as chaves das lojas estão no `.gitignore`.

Cada candidato foi entregue a um **verificador separado**, cuja única tarefa era refutá-lo.

### Achados confirmados (todos corrigidos)

**S3 — Média · a política de inserção do perfil profissional aceitava qualquer academia**
- **Evidência**: na primeira versão da seção 23 do modelo, que eu mesmo escrevi nesta rodada, o `with check` tinha `exists (select 1 from vinculos v where … v.academia_id = academia_id …)`. Dentro da subconsulta, o Postgres resolve `academia_id` pela tabela mais próxima, `vinculos`, e a condição vira `v.academia_id = v.academia_id`, sempre verdadeira.
- **Ataque**: um instrutor da academia A grava um perfil com `academia_id` = B e aparece na "Equipe" dos alunos de B, com nome, foto e "sobre" que ele escolheu. O verificador confirmou que nenhum gatilho de inserção cobria o caso.
- **Feito**:
  - as colunas da linha nova ficam qualificadas (`perfis_profissionais.academia_id`), com um aviso escrito no modelo;
  - o gatilho virou `before insert or update`, como segunda trava;
  - ainda não há migração SQL, então nada foi publicado com o erro.

**S1 — Baixa · mensagem de erro com dado de saúde**
- **Evidência**: R6.2 proíbe dado de saúde em "mensagem de erro". O `redigir.ts` (`03-DECISOES-TECNICAS.md`, seção 5) limpa campos pelo nome, não o texto de um `Error`. Antes:
  - `unidades.ts` lançava `peso … não pode ser negativo, veio 72450`;
  - também lançava `não dá para calcular idade de "2030-05-17"…`;
  - e as datas inválidas repetiam o texto digitado, que pode ser a data de nascimento.

  O verificador procurou cobertura de `Error.message` ou `beforeSend` na arquitetura e não achou.
- **Feito**:
  - `comoVeio()` (`unidades.ts:16`) descreve o valor sem mostrá-lo (negativo, NaN, infinito);
  - as mensagens de data e de idade não repetem a data;
  - na arquitetura, o `beforeSend` do Sentry passa o `message` pelo `redigir.ts`.
- **Teste**: `seguranca-t.test.ts`, S1, com 6 medidas e 3 datas. Falhou antes da correção.

**S2 — Baixa (endurecimento) · o erro do PostgREST pode repetir a linha recusada**
- **Evidência**: em violação de `check` ou `not null`, o Postgres põe `Failing row contains (…)` no `details`. A primeira versão de `registrarResultado` guardava a mensagem crua em `ultimoErro`.
- **Ressalva do verificador**: sob RLS, para o papel `authenticated`, o Postgres omite os valores (`ExecBuildSlotValueDescription`). O caminho normal do app não vazaria. O vazamento acontece com `service_role`, numa tabela sem RLS ou num gatilho que faz `raise` com o valor.
- **Feito**: a fila guarda só `status código` (`"400 23514"`), e o `details` é cortado antes do Sentry.
- **Teste**: `seguranca-t.test.ts`, S2.

### Fronteiras revistas sem achado
- **RLS de saúde** (`01-MODELO-DE-DADOS.md`, seções 4, 5, 14 e 17; `03-DECISOES`, seção 5): a autorização `(a)` está em perfil, medições, objetivo e marcas de refeição. O personal só vê quem foi designado a ele, com Plus ativo ou vigente. O dono só vê agregados. Isso já tinha sido corrigido no A2/A12 e continua coerente com R6.4 a R6.7.
- **Perfil profissional**: `podeVerPerfil` e `editarPerfilProfissional` (`perfil-profissional.ts`) foram testados com controle positivo e negativo para aluno ativo, pendente, sem academia e de outra academia, para colega, para dono ativo e encerrado, e para dono de outra academia. Também estão testados: `crefConferido` que ninguém marca, a chave travada quando o perfil está escondido e `fotoUrl` que recusa `javascript:` e `http:`. O "sobre" tira largura zero e controle de direção (U+202E), e recusa contato (R11.6).
- **Notificações**: nenhum texto de `avisos.ts` leva dado de saúde. O recado do pedido de treino nunca vira aviso (só a contagem, R12.7). O aviso 21 vai sem o motivo.
- **Pedido de treino**: o `recado` entrou na lista do `redigir.ts`.
- **Motivo de saída**: fica sem `grant select` para o app; o dono só vê a soma.
- **Dependências**: confrontei com o `bundledNativeModules.json` do `expo@54.0.37`. As 27 versões que o SDK lista conferem: os intervalos `~` aceitam a versão do SDK. Nenhum pacote fora do comum. `@supabase/supabase-js`, `@tanstack/react-query` e `react-native-url-polyfill` são os pacotes oficiais.
- **Configuração de segredos**: `eas.json` aponta a chave da Play para `./segredos/`, que está no `.gitignore`. O app só leva `EXPO_PUBLIC_SUPABASE_*` (URL e chave anônima, que são públicas por definição).

### Precisa de validação (sem gravidade)
- **Storage das fotos**, do perfil do aluno e do perfil profissional: a arquitetura não descreve as políticas do bucket. Se o bucket for público, a URL dá acesso a quem a tiver. Para resolver, falta escrever a política do `storage.objects`: só a mesma academia lê as fotos de perfil, e o aluno só a própria. Não há bucket ainda para testar.
- **Cache local**: o SQLite do React Query e da fila guarda dado de saúde no sandbox do app, sem cifra por campo. Isso já está decidido em `03-DECISOES`, seção 5. Falta confirmar a classe de proteção de arquivo no iOS: o padrão é "até o primeiro desbloqueio". Só um build no aparelho confirma.
- **Lockfile**: não existe, porque o projeto nunca foi instalado. Na primeira instalação, o `package-lock.json` deve ser versionado para fixar a árvore.

### Rejeitado
- **"O nome do dia no lembrete de treino vaza dado na tela bloqueada"**: o nome do dia é escrito pelo próprio aluno, não é dado de saúde pela R6.1, e o aviso foi aceito na tabela do G. Fica como observação, não como achado.

---

## 4. Configuração

| O quê | Resultado |
|---|---|
| Dependências × SDK 54 | conferem (tabela gerada a partir do `bundledNativeModules.json` do `expo@54.0.37`). **Faltava `@expo/metro-runtime`**, dependência par **obrigatória** do `expo-router@6.0.24` (as outras pares dele são opcionais). O npm 7+ a instalaria sozinho, mas o `expo-doctor` acusa. Acrescentei `"@expo/metro-runtime": "~6.1.2"`, a versão do SDK |
| `app.json` × `recursos/` | existem `abertura-simbolo-claro.png`, `abertura-simbolo-escuro.png` e as 6 fontes. **Faltam** `icone.png`, `icone-adaptativo.png` e `icone-notificacao.png`, que são o A29 da revisão A, ainda aberto. Ficam para quem fechar o ícone: sem eles, `expo prebuild` e o EAS Build falham |
| Plugin do `expo-image-picker` | conferi no código do `@expo/config-plugins@54`: o `infoPlist` em português do `app.json` é mantido quando o plugin não recebe texto próprio (`permissions[x] \|\| infoPlist[x] \|\| padrão`) |
| `eas.json` | perfis `desenvolvimento` (cliente de desenvolvimento, `.apk`), `desenvolvimento-simulador`, `previa` e `producao` (loja, `autoIncrement`, canais e ambientes `development`, `preview` e `production`). Coerentes com o `04-IPHONE.md`. `submit.*.ios` vazio pede o `ascAppId` no primeiro envio, como o LEIA-ME já diz |
| `tsconfig.json` | sem mudança; o `tsc` estrito do domínio passou (ver o resumo) |

A instalação de prova foi feita só no scratchpad (`typescript@5.9` e `@types/node@24`, para o `tsc`), fora do projeto.

---

## 5. P10: perfil profissional e o resto do V (pedido do coordenador)

| Pedido | Onde | Teste |
|---|---|---|
| `PerfilProfissional` ligado ao vínculo, sem telefone, e-mail ou preço | `tipos.ts`, modelo seção 23 (campos, tabela de acesso, forma da RLS e do gatilho) | `perfil-profissional.test.ts` (16) |
| CREF: número, G ou P, UF válida | `perfil-profissional.ts`, `lerCref()` | aceita "CREF 012345-G/SP", "012345 g sp"; recusa 10 formas erradas |
| "Sobre": limitar (280, contando caractere) e limpar | `limparSobre()` | espaço, linha em branco, invisíveis, U+202E; contato recusado |
| `podeVerPerfil(perfil, quem, vínculoDoPerfil)` espelhando a RLS | idem | ver a seção 3. O terceiro parâmetro existe porque a R11.4 exige o vínculo do profissional ativo, e sem ele a função teria de adivinhar |
| Ordenar e filtrar a equipe | `equipeParaMostrar()`, `especialidadesDaEquipe()` | ordem alfabética pt-BR (Álvaro, ana, Bruno, Úrsula); chips só do que alguém marcou (R11.13) |
| `PedidoDeTreino` | `tipos.ts`, `pedidos.ts`, modelo seção 24 | um aberto por academia, recado até 140, fecha ao enviar treino, cancelar ou recusar |
| `trocarEm` | `Treino.trocarEm`, `sugerirTrocarEm()` (4 · 6 · 8 · 12 semanas), `precisaTrocar()` | inclusive a virada do ano |
| `motivoDeSaida`, `encerradoPor` | `Vinculo`, modelo seção 3 (função `encerrar_vinculo`, coluna sem `grant select`) | — (é RLS) |
| Fila com dono (R12.3), **o que mais parecia bug** | `sincronizacao.ts`, `03-DECISOES` seção 2, modelo seção 25 | 7 testes; ver abaixo |
| R12.1: a carga da série | `Serie.cargaPlanejadaEm`, `ultimaCargaReal()`, `sugerirCargaDaSerie()`; `alterarSerie` carimba só quando a carga muda de verdade | as três linhas da regra; a comparação é pelo **instante** (08:00-03:00 vem depois de 10:30Z, embora o texto pareça antes) |
| Avisos novos | `avisos.ts` (`vinculo_encerrado`, `resumo_da_semana`, `PREFERENCIAS_DA_EQUIPE_PADRAO`); tabela do `03-DECISOES`, linhas 21 e 22, e a nota das linhas novas no resumo das 09:00 | o pedido de treino e o aluno novo sem treinar **não** viram aviso à parte (R12.6, R12.7). Nenhum é local, então a agenda não muda |
| Decisão registrada | `docs/decisoes.md`, entrada de 11/10/2026 | — |

**A fila com dono: o bug, provado na arquitetura.** O `03-DECISOES-TECNICAS.md`, seção 2, descrevia `fila_de_envio(id, tipo, carga_json, …)` **sem dono**, e dizia: "erro de regra (RLS recusou) marca como falha". Dois cenários quebravam o R1.24 ("nunca se perde"):
- **Sessão vencida no porão**: o token vence sem sinal; o `supabase-js` sai da sessão; o envio vai como anônimo; a RLS recusa (42501); o treino virava **falhou**.
- **Outra conta no mesmo aparelho**: o treino de Ana subia na sessão de Bia; a RLS recusava; de novo, **falhou**.

O teste `recusa com sessão vencida ou de outra conta é "entrar de novo", nunca "falhou"` fixa a leitura certa: só é erro de regra a recusa com a sessão **válida da mesma conta**. Os outros testes cobrem:
- a conta guardada em cada item;
- nada sobe e nada se apaga com a sessão vencida;
- a outra conta não leva a fila da primeira ("Há 2 treinos de Ana esperando");
- a ordem de envio pelo instante;
- o conflito do R1.24 decidido pelo instante.

**Divergências com a especificação do V** (não editei a pasta dele):
1. "outra" em especialidades: o coordenador pediu, mas a R11.3 não tem. No código entrou `outra` com texto de até 30 caracteres. Se a pergunta 26 recusar, sai um item da lista.
2. A R11.2 diz que o CREF aparece "como foi escrito". Guardo a forma do CONFEF (maiúscula, hífen e barra), com o número sem completar zeros. Se o Alex quiser o texto literal, basta guardar o que veio e validar com `lerCref`.
3. Coordenador e V chamam o campo de `ocultadoPeloDono`/`visivelAosAlunos`; a lista "para outros agentes" do V diz `escondidoPeloDono`/`visivel`. Usei os nomes do coordenador.
4. O recado do pedido de treino é lido pela equipe sem a autorização de dado de saúde, porque a folha avisa "A equipe da academia vai ler.". Ficou como pergunta na seção 24 do modelo, sem decidir.

---

## 6. Arquivos

- **Novos**:
  - `app/dominio/perfil-profissional.ts` e `.test.ts`;
  - `pedidos.ts`;
  - `sincronizacao.ts`;
  - `catalogo/catalogo.ts`;
  - `revisao-t.test.ts`, `revisao-t-p10.test.ts`, `propriedades.test.ts` e `seguranca-t.test.ts`;
  - este relatório.
- **Editados**:
  - em `app/dominio/`: `tipos.ts`, `unidades.ts`, `treino.ts`, `cronometro.ts`, `avisos.ts`, `avisos.test.ts` (o T4), `cronometro.test.ts` (F5 e F6) e `catalogo/catalogo.test.ts`;
  - `app/package.json` (`@expo/metro-runtime`);
  - em `03-arquitetura/`: `01-MODELO-DE-DADOS.md` (seções 3, 8, 23 a 25 e relações), `02-ESTRUTURA-DO-CODIGO.md` (árvore) e `03-DECISOES-TECNICAS.md` (fila, avisos 21 e 22, `redigir`);
  - `docs/decisoes.md` (acrescentado no fim).

## 7. Saída final dos testes

`node --test "dominio/**/*.test.ts"`, dentro de `app/`, Node v24.18.0, em 11/10/2026:

```
ℹ tests 318
ℹ suites 76
ℹ pass 318
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3105.6777
```

Com `TZ=UTC`, `TZ=Asia/Tokyo` e `TZ=America/New_York`: 318 passam, 0 falham. `tsc -p .` (estrito, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `allowImportingTsExtensions`) sobre uma cópia do `dominio/`: código 0.
