# 03 — Decisões técnicas

Este arquivo fecha as perguntas técnicas que a stack e o modelo deixam em aberto: como o app escolhe a visão, o que funciona sem sinal, notificações, pagamento, dado de saúde, testes e como rodar. Cada decisão aqui tem o registro curto em `docs/decisoes.md`; o que depende do Alex está marcado **[decidir]**.

## 1. Navegação por papel: como o app decide a visão ao entrar

**Regra**: a visão deriva do **vínculo** (`Vinculo.papel`), nunca de uma escolha "sou academia / sou aluno" na tela de entrada.

Ao abrir o app, o `navegacao/_layout.tsx` da raiz faz, nesta ordem:

1. **Sem sessão** → grupo `(entrada)/` (entrar, criar conta, entrar com código de convite da academia).
2. **Com sessão**, carrega os vínculos ativos (`dados/sessao.ts`, com cache local para abrir offline).
3. **Zero vínculos ativos** → `(aluno)/` como **aluno sem academia** (R8.4, F1 passo 4: "Não tenho código, vou treinar sozinho por enquanto"): treino livre, biblioteca geral, execução e histórico. O Início mostra o cartão "Entrar com o código da sua academia" (ou "Aguardando a recepção confirmar", se há vínculo `pendente`), sem travar nada. A tela de código só aparece sozinha uma vez, no primeiro acesso (F1 passo 4).
4. **Um vínculo** → `dominio/papel.ts` → `visaoDoPapel(papel)`: `aluno` → `(aluno)/`; qualquer outro → `(academia)/`.
5. **Mais de um vínculo** (aluno **e** instrutor na mesma academia; ou vínculo em duas academias — [decidir] SaaS):
   - se há um **último papel escolhido** guardado no telefone, vai direto para ele;
   - senão, mostra `telas/compartilhado/EscolherVisao` ("Entrar como aluno" / "Entrar como instrutor na Academia X").
   - Em qualquer visão, o menu da conta tem **"Trocar de visão"**: lista os vínculos e troca sem sair da conta. É o que o CLAUDE.md exige: aluno que vira funcionário troca de visão sem trocar de conta.

O **`academiaId` ativo** acompanha a visão escolhida e vai em toda consulta (chave do React Query inclui `academiaId`). Trocar de visão invalida o cache de consultas.

**Permissão fina dentro da visão** (instrutor monta treino, recepção não; dono vê números) é decidida em `dominio/papel.ts` (`pode(papel, 'montar_treino')`) e **reforçada pela RLS** no servidor. A tela esconde o botão; o banco recusa a escrita. Nunca só a tela.

**Descartado**: dois apps; ou um "modo" escolhido à mão na entrada (uma pessoa escolheria errado e veria tela vazia). **Mudaria se**: as lojas exigissem separação — aí `(academia)/` vira um segundo alvo de build com o mesmo código.

## 2. Estado offline: o aluno treina sem sinal

A cena que manda: aluno no porão da academia, sem Wi-Fi nem 4G, abre o treino do dia, marca as séries, termina. Nada disso pode falhar ou perder.

### O que precisa funcionar sem sinal

| Funciona offline | Como |
|---|---|
| Abrir o app já logado | sessão no `expo-secure-store`; vínculos em cache no SQLite |
| Ver **meus treinos** e o **treino do dia** (dias, exercícios, séries, instruções) | cache de leitura no SQLite, atualizado toda vez que há rede |
| Ver a **biblioteca de exercícios** (nome, grupo, instruções; imagem só se já baixada) | cache de leitura |
| **Registrar o treino feito** (iniciar, marcar série, carga, terminar) | gravado no SQLite como `TreinoRealizado` com id gerado no telefone; entra na **fila** |
| Ver o **plano de dieta** do dia e marcar refeição feita (Plus) | cache de leitura + fila |
| Cronômetro de descanso | local |

| Não funciona offline (mostra aviso, não trava) | Por quê |
|---|---|
| Montar ou editar treino | editar estrutura sem sinal gera conflito com o instrutor/personal editando o mesmo treino; não vale o custo na v1 |
| Escolher treino pronto novo | precisa da biblioteca atual da academia |
| Conversa, assinar o Plus, ver números da academia | são de rede por natureza |
| Qualquer coisa na visão da academia | funcionário está na recepção, com Wi-Fi; o custo de offline não se paga |

### Como sincroniza

- **Leitura**: React Query com `staleTime` longo para treinos e biblioteca, e um **persistidor** que grava o cache no SQLite. Sem rede, serve do cache sem erro; com rede, revalida em segundo plano.
- **Escrita**: só `TreinoRealizado` (+ `SerieRealizada`) e `RefeicaoRegistrada` (marcar e desmarcar) entram na **fila de sincronização** (`dados/fila/`): tabela `fila_de_envio(id, tipo, usuario_id, carga_json, criado_em, tentativas, estado, ultimo_erro)`. Ao detectar rede (NetInfo do Expo), envia em ordem de registro, uma de cada vez; sucesso remove da fila e preenche `sincronizadoEm`. A regra está em `dominio/sincronizacao.ts` (`itensParaEnviar`, `classificarErroDeEnvio`, `registrarResultado`), testada:
  - **cada item tem dono** (`usuario_id`, a conta que registrou) e só sobe com a sessão **válida** dessa conta (R12.3). Outra conta no aparelho: a fila da primeira fica guardada ("Há 2 treinos de Ana esperando. Entre com essa conta para enviar.");
  - **erro de rede** (sem resposta, 408, 429, 5xx): guarda e tenta depois;
  - **erro de sessão** (401, `PGRST301`/`PGRST303`, ou qualquer recusa com a sessão vencida, ausente ou de outra conta): guarda **sem contar tentativa** e pede para entrar de novo;
  - **erro de regra** (a RLS ou um `check` recusou **com a sessão certa**): marca `falhou` e mostra ao aluno;
  - **sair da conta não apaga a fila**, e a sessão vencida nunca impede registrar sem sinal (R12.3).

  Revisão T (P10, 11/10/2026): a versão anterior não tinha `usuario_id` e lia "RLS recusou" sempre como erro de regra. Com o token vencido no porão, o `supabase-js` sai da sessão e o envio vai como anônimo: a RLS recusa (42501) e o treino virava "falhou", contra o R1.24 ("nunca se perde"). O teste é `R12.3 — sessão vencida não perde treino`, em `dominio/revisao-t-p10.test.ts`.
- **Os três tipos de item da fila** (`TipoDeItemDaFila` em `dominio/sincronizacao.ts`):

  | Tipo | Carga | O que o servidor faz | Quando entra |
  |---|---|---|---|
  | `treino_realizado` | o `TreinoRealizado` inteiro, com as séries | `upsert` por `id` (o telefone manda) | cada série marcada, desfeita ou pulada, e ao fechar |
  | `refeicao_registrada` | a `RefeicaoRegistrada` | `upsert` por `id` | ao marcar "feita" ou "não segui" |
  | `refeicao_apagada` | a `RefeicaoRegistrada` que sai | `delete` pelo `carga.id` (só a do próprio aluno, pela RLS). Apagar o que já não existe conta como sucesso (decisão do AE: o envio repetido depois de uma queda não pode virar "falhou") | ao **desmarcar** uma refeição que já subiu, ou que subia naquela hora; e ao **trocar a marca** ("feita" → "não segui") de uma que já subiu, antes do `refeicao_registrada` da marca nova |

  A marca que **ainda não subiu** não gera `refeicao_apagada`: só sai da fila (`tirarRefeicaoDaFila`). O tipo foi criado pelo agente AB (P11, achado M2: a refeição desmarcada depois de subir ficava no servidor) e está testado em `dados/revisao-ab.test.ts` ("AB3", quatro casos). O fim do envio só tira o item da fila se o guardado é o **mesmo** que subiu (achado A1 do AB); então desmarcar enquanto a marca sobe deixa o `refeicao_apagada` na fila e ele sobe na volta seguinte, na ordem de registro. **Mudaria se** o servidor guardar uma marca só por (aluno, refeição, data) com `upsert`: aí "apagar" vira um estado da própria marca e o tipo sai.
- **Conflito** (R1.24): `TreinoRealizado` nasce **só no telefone do aluno**, então não há dois lados escrevendo o mesmo registro — a regra é **o telefone manda** (`upsert` por id). A única colisão real é o aluno em dois aparelhos; o servidor fica com o `fimEm` mais recente. Essa regra fica em `dominio/sincronizacao.ts`, testada.
- **Indicador**: um ponto discreto "3 treinos aguardando sinal" na tela inicial. Nunca um bloqueio.

**Descartado**: WatermelonDB/PowerSync agora (resolvem o caso geral de edição offline com conflito, que a v1 não tem; custo de aprendizado e de setup nativo). **Mudaria se**: montar treino offline virar pedido real, ou a visão da academia precisar de offline (tablet na sala sem Wi-Fi) → PowerSync em cima do mesmo Postgres.

## 3. Notificações

**v1**: `expo-notifications` com o serviço de push do Expo (funciona em Android e iOS sem configurar Firebase à mão no começo). Token de push em `dispositivos(usuario_id, token, plataforma, fuso, atualizado_em)`; o `fuso` serve ao horário de silêncio dos avisos do servidor.

Dois jeitos de disparar, e nenhum terceiro:

- **O telefone, como notificação local**: cronômetro e lembretes. Não precisa de rede nem de servidor; o próprio sistema toca no instante agendado (sem `UIBackgroundModes`, ver `04-IPHONE.md`, seção 6). A agenda dos lembretes da semana sai de `dominio/avisos.ts` → `agendaDaSemana()`.
- **O servidor**: tudo que nasce da ação de outra pessoa ou de uma conta de calendário. Uma Edge Function (chamada por trigger, por função `security definer` ou por `pg_cron`) monta o texto, confere a chave e as regras anti-incômodo e chama a API do Expo. **Nunca** o app de um usuário manda notificação para outro.

Regras de produto: `01-especificacao/03-REGRAS.md`, seção 10 (R10.1 a R10.16). Telas: `04-MAPA-DE-TELAS.md`, Parte 4. Modelo: `01-MODELO-DE-DADOS.md`, seções 19 a 22.

### 3.1 Tabela de avisos

Texto no tom de `02-design/marca-e-proposta/01-TOM-DE-VOZ.md`: título curto, uma frase, sem emoji (**[decidir]** um no fim, se o Alex quiser), sem "!", sem pressão. "Dani", "Juliana" e "Academia do Marcos" são exemplos: o servidor põe o nome real. **Chave** é a linha da tela Avisos que desliga aquele aviso (aluno: Perfil → Avisos; equipe: Perfil → Avisos da equipe). Desligar a chave tira **só a notificação**: o cartão e a informação continuam dentro do app.

**Do telefone (notificação local), para o aluno**

| # | Aviso | Título · corpo | Gatilho | Para quem | Chave (desliga?) |
|---|---|---|---|---|---|
| 1 | Fim do descanso com o app fechado | Descanso terminado · Próxima série. | instante de fim do descanso, agendado ao marcar a série; cancelado e reagendado ao pular, pôr +30 s/−30 s ou marcar a próxima (o instante vem do motor de `dominio/cronometro.ts`, "próximo aviso em X s") | aluno no treino em andamento | **Cronômetro** (sim). Fura o silêncio. Com o app aberto não aparece faixa: avisa o próprio cronômetro, com vibração |
| 2 | Fim de série por tempo | Tempo da série terminado · Próximo descanso. | fim da contagem da série do tipo tempo (a prancha de 30 s) | aluno no treino em andamento | **Cronômetro** (sim). Fura o silêncio |
| 3 | Fim do cronômetro (regressivo) e troca de fase (intervalado) | Cronômetro terminado · Toque para voltar ao app. — intervalado: Descanso · Rodada 3 de 8. / Trabalho · Rodada 4 de 8. | fim do regressivo; cada troca de fase do intervalado (os instantes vêm do motor do cronômetro; o iOS guarda no máximo 64 agendadas, o que cobre um Tabata inteiro) | aluno com o cronômetro rodando | **Cronômetro** (sim). Fura o silêncio: foi o aluno quem ligou |
| 4 | Lembrete de treino | Treino B pronto · Está no app quando você quiser. (sem dia definido: Seu treino está pronto) | dias e hora que o aluno escolheu; sem dias, os da frequência pretendida (3 → seg, qua, sex). Não toca no dia em que ele já treinou nem depois de fechar a frequência da semana | aluno | **Lembrete de treino** (sim). Nasce **desligado**; convite depois do primeiro treino fechado |
| 5 | Lembrete de refeição (Plus) | Padrão, um por dia: Como foi a alimentação hoje? · Marque as refeições no app. — por refeição (opcional): Hora da refeição · Marque no app quando fizer. | resumo às 20:30 (o aluno muda a hora) ou no horário de cada refeição não opcional do plano em vigor; refeições a menos de 30 min viram uma só; se passariam do limite do dia, viram o resumo | aluno Plus com plano em vigor | **Lembrete de refeição**: resumo da noite · cada refeição · desligado |

**Do servidor, para o aluno**

| # | Aviso | Título · corpo | Gatilho | Para quem | Chave (desliga?) |
|---|---|---|---|---|---|
| 6 | Personal ajustou o treino | Dani mudou seu treino · Abra para ver o que mudou. | ação **"Enviar para o aluno"** do personal (função do servidor), não cada linha salva: a edição salva a cada toque e geraria dez avisos | aluno Plus | **Personal** (sim) |
| 7 | Personal ajustou a dieta | Dani mudou seu plano alimentar · Vale a partir de terça. | ação "Enviar ao aluno" do plano (F7, passo 8) | aluno Plus | **Personal** (sim) |
| 8 | Nova mensagem **[decidir]** | Dani · Mandou uma mensagem. (várias: Mandou 3 mensagens.) | trigger em `mensagens`; uma notificação por conversa a cada 15 min, que soma as seguintes. **Sem prévia do texto**: mensagem pode ter dado de saúde | aluno Plus e personal | **Mensagens** (sim). Só existe se o chat for próprio |
| 9 | Treino montado pela academia | Treino novo da academia · A Dani montou um treino para você. | ação "Enviar para o aluno" (F5, passo 5) | aluno | **Avisos da academia** (sim) |
| 10 | Aviso da academia (V6) | Academia do Marcos · (o texto do aviso, até 160 caracteres) | o dono ou a recepção publica um aviso com "Mandar notificação" ligado (F10) | todos os alunos com vínculo ativo | **Avisos da academia** (sim). O cartão no Início aparece mesmo com a chave desligada |
| 11 | Vínculo confirmado | Você está na Academia do Marcos · Os treinos prontos dela já aparecem no app. | a recepção confirma o pedido (H44), ou o vínculo nasce ativo | aluno | **Avisos da academia** (sim) |
| 12 | Plus ativo | Seu Plus está ativo · A academia vai escolher seu personal. | `assinaturas_plus.estado` → `ativo` | aluno | **Plus** (sim) |
| 13 | Personal escolhido ou trocado | Dani é sua personal · Ela vai acompanhar seu treino pelo app. — troca: Seu personal mudou · Agora é o Rafa. | designação (H63) ou troca (R5.6, B2) | aluno Plus | **Plus** (sim) |
| 14 | Plus vence em 3 dias | Seu Plus vai até sexta · Depois disso, seu treino continua no app. (via academia: Seu Plus vai até sexta · Para continuar, fale na recepção.) | `pg_cron` diário às 09:00: assinatura `cancelado_vigente`, ou com data de fim marcada pela recepção, que termina em 3 dias. **[decidir]** quem paga: assinatura de loja com renovação automática não recebe (a loja já avisa) | aluno Plus | **Plus** (sim) |
| 15 | Plus suspenso (R5.8) | Não deu para renovar o Plus · Confira o pagamento até sexta. | webhook de pagamento recusado → `suspenso` | aluno Plus | **Plus** (sim). Só nos caminhos A e B **[decidir]** |
| 21 | Vínculo encerrado pela academia (R12.11, P10) | Seu vínculo com a Academia do Marcos foi encerrado · Seu histórico e seus treinos continuam com você. | função `encerrar_vinculo()` chamada pela recepção ou pelo dono. **Sem o motivo** (`vinculo_encerrado` em `avisos.ts`) | aluno | **Avisos da academia** (sim) |

**Do servidor, para a equipe**

| # | Aviso | Título · corpo | Gatilho | Para quem | Chave (desliga?) |
|---|---|---|---|---|---|
| 16 | Vínculo pendente | Juliana quer entrar na academia · Confirme em Alunos. (vários: 3 pedidos para entrar · Confirme em Alunos.) | novo vínculo `pendente`; no máximo um aviso a cada 2 horas, com a soma dos pedidos. Com "Vínculo precisa de confirmação" desligado vira resumo diário às 18:00: "3 alunos novos entraram hoje" | recepção e dono | **Pedidos para entrar** (sim) |
| 17 | Aluno sem treinar há 14 dias (H42) | 3 alunos passaram de 14 dias sem treinar · Veja quem na lista de alunos. | `pg_cron` diário às 09:00: quem cruzou os 14 dias desde ontem. Cada sumiço avisa uma vez; zero alunos, nada. Só a contagem na tela bloqueada | recepção e dono (ligado); instrutor (desligado por padrão) | **Alunos sem treinar** (sim) |
| 18 | Aluno Plus sem registro há 3 dias (H60) | Juliana está há 3 dias sem registrar nada · Veja em Meus alunos Plus. (vários: 2 alunos Plus há 3 dias sem registro.) | `pg_cron` diário às 09:00: nenhum treino realizado **nem** refeição marcada em 3 dias. Uma vez por episódio; volta a valer depois de um registro. Não avisa de aluno em pausa (se B4 entrar) | personal designado | **Meus alunos Plus** (sim) |
| 19 | Novo aluno Plus sem personal (B13) | Juliana entrou no Plus sem personal · Escolha um em Alunos Plus. | estado → `ativo` sem `personalId`; repete uma vez depois de 2 dias úteis se continuar sem | dono (e recepção, se o dono deixa ela designar) | **não desliga**: é a garantia do que o aluno contratou |
| 20 | Aluno Plus designado | Juliana é sua aluna no Plus · Ela ainda não tem treino nem plano alimentar. | designação ou troca (H63, R5.6) | personal | **Meus alunos Plus** (sim) |
| 22 | Resumo da semana (R12.13, P10) | Semana: 212 alunos treinaram · 9 novos sem treinar · 4 treinos para trocar | `pg_cron` às segundas, 09:00 no fuso do aparelho do dono (`dispositivos.fuso`). Só contagens, sem nome. Entra no limite de 3 por dia (R10.6). O toque abre Academia (números) | dono | **Resumo da semana** (sim; nasce ligado). `resumo_da_semana` em `avisos.ts` |

**Linhas novas no resumo das 09:00 (P10), sem aviso à parte**: o aviso 17 passa a levar também "N alunos novos sem treinar há 7 dias" (R12.6: aluno com vínculo ativo há 90 dias ou menos; o corte do novo é 7 dias, não 14) e, para a recepção e o instrutor com a chave ligada, "2 pedidos de treino · 4 treinos para trocar" (R12.7). Pedido de treino **não** vira notificação própria: o recado pode ter dado de saúde, e a contagem basta. Os três saem do servidor; nenhum é local, então a agenda de `avisos.ts` não muda.

O mapa tipo → chave está em código (`CHAVE_DO_AVISO`, `dominio/avisos.ts`), com teste.

**Fora desta tabela, de propósito** (sem gatilho na especificação, ou ainda proposta): "versão nova do treino pronto" (pergunta 18), comentário do personal num treino (V10), retorno semanal do Plus (V8), "Seu treino está guardado" depois de 10 dias sem treinar (`04-APLICACAO.md` da marca) ("a academia encerrou seu vínculo", o B10, entrou como aviso 21 no P10). Cada um entra nesta tabela quando o Alex aceitar a proposta. Ver `90-PERGUNTAS-PARA-O-ALEX.md`, seção "Avisos".

### 3.2 Regras anti-incômodo (resumo; a regra completa é R10.4 a R10.9)

| Regra | No telefone (local) | No servidor |
|---|---|---|
| **Horário de silêncio 22:00–07:00** | o cronômetro (1 a 3) toca a qualquer hora; lembrete marcado no silêncio é **descartado**, nunca movido para uma hora que o aluno não escolheu; o seletor de hora vai de 07:00 a 21:59 | o aviso é **segurado** até as 07:00 no fuso do destinatário (`proximoMomentoPermitido()`); o aviso da academia escrito às 23:00 sai às 07:00 |
| **Limite por dia** | 3 lembretes (`LIMITE_DE_LEMBRETES_POR_DIA`); treino tem prioridade | 3 avisos por pessoa por dia; do 4º em diante não vira notificação, fica só no app. Fora da conta: mensagem (agrupada) e o aviso 19 |
| **Agrupar avisos iguais** | refeições a menos de 30 min viram uma; refeições demais viram o resumo da noite | pedidos de vínculo (2 h), sumidos e sem registro (resumo diário às 09:00), mensagens (15 min por conversa) |
| **Não lembrar o que já foi feito** | sem lembrete no dia em que treinou nem depois de fechar a frequência da semana | sumiço e "3 dias sem registro" avisam uma vez por episódio |
| **Nunca dado de saúde** | nem peso, nem caloria, nem o nome da refeição | sem prévia de mensagem; o aviso da academia é escrito por gente: a tela lembra a regra (R10.10) |

### 3.3 Como o servidor manda (Edge Function `enviar-aviso`)

1. Recebe `{ tipo, destinatarios, dados }` de um trigger, de uma função ou do `pg_cron`. Nunca do app de outro usuário.
2. Para cada destinatário: lê a chave (`preferencias_de_aviso`) e o fuso (`dispositivos.fuso`); se a chave está desligada, para aqui.
3. Silêncio: se cai entre 22:00 e 07:00 no fuso dele, grava em `avisos_enviados` com `segurado_ate`, e um `pg_cron` de 5 em 5 min solta às 07:00.
4. Limite e agrupamento: conta em `avisos_enviados` o que ele já recebeu hoje e o que está na janela de agrupamento do mesmo tipo.
5. Monta o texto pelo tipo (sem dado de saúde) e chama a API de push do Expo com `data: { tipo, destino, academiaId, visao }`. Nada de conteúdo no `data` também: o app busca o que precisa depois do toque, já logado.
6. Grava em `avisos_enviados` **sem o texto** (tipo, destinatário, academia, chave de agrupamento, instante). Basta para o limite e para auditoria, e não guarda dado de ninguém.

`dominio/avisos.ts` é puro e roda também na Edge Function (`dentroDoSilencio`, `proximoMomentoPermitido`, `validarAvisoDaAcademia`, `CHAVE_DO_AVISO`).

### 3.4 Canais do Android e toque na notificação

- Canais (`setNotificationChannelAsync`), cada um desligável nos ajustes do sistema: `cronometro` (importância alta, som e vibração), `lembretes`, `academia`, `personal`, `equipe` (importância padrão).
- O toque abre o `destino` (rota do Expo Router). Se o aviso é de outra visão (a Dani é aluna e instrutora e recebeu "3 pedidos para entrar" enquanto estava na visão do aluno), o app troca de visão antes de abrir, como o "Trocar de visão" (H05). Se a pessoa saiu da conta, o toque abre a entrada e nada mais.
- Sair da conta neste aparelho apaga o token em `dispositivos` e cancela as notificações locais agendadas (H07, B12).

### 3.5 Permissão

- **iPhone** (detalhe em `04-IPHONE.md`, seção 6): provisória no primeiro acesso (os lembretes chegam em silêncio na Central de Notificações); pedido completo (com som) no primeiro descanso, depois da frase do app. Sem `UIBackgroundModes`. "Urgente" (`timeSensitive`) fica fora da v1.
- **Android 13 ou mais novo**: a permissão `POST_NOTIFICATIONS` é pedida no mesmo momento do pedido completo do iPhone (primeiro descanso, com a mesma frase) ou quando a pessoa liga um lembrete, o que vier primeiro. Antes disso o Android não mostra nada, nem lembrete.
- **Equipe**: na primeira vez que entra na visão da academia, uma frase ("Quer saber quando um aluno pedir para entrar?") e o pedido.
- **Negou**: o app funciona igual por dentro; na tela Avisos, a linha "Avisos desligados no celular · Abrir ajustes" (`Linking.openSettings()`).

**Conteúdo da notificação nunca leva dado de saúde** ("Dani mudou seu plano alimentar", não "Sua dieta de 1.800 kcal..."). A notificação passa por servidor de terceiro (Apple, Google, Expo) e aparece na tela bloqueada; o dado fica dentro do app.

**Descartado**: o app de um usuário mandar push direto para outro (a chave do Expo ficaria no app e qualquer um mandaria qualquer coisa); prévia da mensagem na notificação (mensagem pode ter dado de saúde); lembrete movido para fora do silêncio (vira uma hora que ninguém escolheu); aviso da academia com resposta ou "lido por" (vira chat e rede social, V6).
**Mudaria se**: volume alto ou precisão de entrega exigirem FCM/APNs diretos (o Expo permite trocar sem mudar o código do app); os alunos pedirem um silêncio próprio (o horário vira campo na tela Avisos; o código já recebe o silêncio como parâmetro); o modo Foco esconder o fim do descanso ("urgente", com a capacidade da Apple).

## 4. Pagamento do Plus — [decidir]

A pergunta do P00 ("quem paga: aluno direto ou academia repassa") decide o caminho técnico. O modelo já cabe nas três respostas via `AssinaturaPlus.origemDoPagamento`.

| Caminho | Quando | Como | Custo |
|---|---|---|---|
| **A. Loja** (`loja_apple`, `loja_google`) | aluno assina dentro do app e o Plus é "conteúdo digital" (acompanhamento pelo app) | assinatura in-app via **RevenueCat** (uma API para as duas lojas, webhook pronto) → Edge Function recebe e muda `estado` | 15–30 % da loja + RevenueCat gratuito até certo volume |
| **B. Pix / cartão** (`pix`, `cartao`) | aluno paga fora da loja | **Mercado Pago** ou **Stripe** (Pix + cartão recorrente) → webhook → Edge Function | ~1–4 % |
| **C. Via academia** (`via_academia`) | a academia cobra junto da mensalidade | a **recepção** (ou o dono) liga o Plus no perfil do aluno (R5.3) e desliga na data que escolher (R5.7), por uma função do servidor; nenhum pagamento passa pelo Academia Plus | zero |

**Atenção às regras das lojas**: se o Plus for vendido **dentro do app** para o aluno e for serviço digital, a Apple **exige** compra in-app (caminho A) e proíbe link para Pix. Serviço com componente **presencial** (personal da academia física) costuma poder cobrar fora (caminho B), mas a leitura é da Apple caso a caso. O caminho **C** **também tem risco** (revisão B, R2): o app libera telas que a pessoa não comprou no app (3.1.1), e 3.1.3(d) só cobre serviço em tempo real. Leitura completa das regras, por caminho, em `04-IPHONE.md`, seção 10.4 — sem decidir. **Recomendação técnica para o Alex**: começar por **C** (zero integração, zero taxa, academia já cobra mensalidade) e, se o Plus for vendido direto ao aluno, **B com Pix** apresentado como "contrate na recepção / pelo link", avaliando A só se a Apple recusar.

Regra fixa, qualquer caminho: **`estado` da assinatura só muda por função do servidor** (o campo se chama `estado` no modelo e em `tipos.ts`). O app lê. Nenhum dado de cartão passa pelo app nem pelo banco — só `referenciaExterna`.

## 5. Segurança de dado de saúde (LGPD)

Peso, altura, medições, restrições, dieta, mensagens com o personal e idade são **dados pessoais sensíveis** (saúde). Regras que o código obedece:

**O que nunca sai do servidor sem autorização**
- Toda tabela de saúde (`perfis_de_alunos`, `historicos_de_objetivo`, `medicoes_corporais`, `planos_de_dieta` e filhas, `refeicoes_registradas`, `mensagens`) tem RLS que só libera para: o próprio aluno; funcionário com vínculo ativo na **mesma** academia **e só se o aluno autorizou** (`autoriza_academia`, R6.4 — perfil e medições; a recepção não vê medições, ver modelo de dados seção 5); o personal **designado** com assinatura `ativo` ou `cancelado_vigente` (perfil, medições, dieta, conversa — R6.6). O dono **não** vê dieta nem conversa.
- Chave de **serviço** do Supabase nunca entra no app nem no repositório; só em Edge Function via segredo.
- Realtime só em canais filtrados por RLS (Supabase aplica).

**O que nunca vai para log, analytics ou erro**
- `dados/` tem um **filtro de registro** (`redigir.ts`) aplicado antes de qualquer `console`, Sentry ou analytics. Vira `[redigido]`: (1) campos cujo nome termina em `Gramas`, `Milimetros`, `Decimos` ou `Kcal`; (2) os campos `restricoes`, `dataNascimento`, `objetivo`; (3) **todo** campo de objeto vindo de `PlanoDeDieta`, `Refeicao`, `ItemDeRefeicao`, `RefeicaoRegistrada` (inclui `motivo` do "não segui"), `HistoricoDeObjetivo` e `Mensagem`, mais o `recado` do `PedidoDeTreino` (P10: o aluno pode escrever "dor no joelho", R12.2) — R6.1 diz que plano de dieta, marcas de refeição e motivos, objetivo e conversa são dado de saúde, e uma lista só de nomes deixaria passar `motivo`, `trocaPermitida`, `observacao` do plano e `nome` da refeição. A lista é um teste (`redigir.test.ts`) para não envelhecer: o teste percorre os campos de cada tipo de `tipos.ts` listado em R6.1. **Texto de erro também** (revisão T, S1/S2): o filtro por nome de campo não vê o `message` de um `Error` nem o `details` do PostgREST, que podem repetir a linha recusada. Por isso (1) o domínio nunca põe o valor de medida ou de data na mensagem (`unidades.ts`, teste `seguranca-t.test.ts`); (2) o `beforeSend` do Sentry passa o `message` e o `details` do PostgREST pelo `redigir.ts` e corta o `details`; (3) a fila guarda só status e código (`registrarResultado`).
- Analytics (quando houver) registra **evento**, não **conteúdo**: "medição registrada", nunca o peso. Nem id de aluno — id de evento.
- Notificação push não carrega dado de saúde (seção 3).
- Captura de tela/Backup: as telas de medição e dieta marcam `secureTextEntry`-equivalente? Não — em RN não há bloqueio simples de captura; **decisão**: não bloquear captura (o aluno tem direito ao próprio dado), mas **excluir o SQLite do backup automático** do sistema (Android `allowBackup=false`, iOS `isExcludedFromBackup`).

**Direitos do titular, no app**
- **Exportar meus dados** (JSON legível) e **apagar minha conta** na tela de privacidade. Apagar = anonimizar `Usuario`, apagar perfil, medições, dieta e mensagens; manter `TreinoRealizado` anonimizado para os números da academia (sem ligação com pessoa). Função do servidor, com confirmação por e-mail.
- **Consentimento**: na primeira vez que o aluno preenche peso/altura, uma frase curta diz quem vai ver (a academia; o personal se assinar o Plus) e guarda `PerfilDoAluno.consentimentoEm`. Sem preencher, nada é pedido — cadastro é opcional. Menor de 18 precisa antes do `consentimentoDoResponsavelEm` (R6.11).
- **Texto de privacidade** em `telas/compartilhado/Privacidade`, em português simples. O conteúdo vem do jurídico/Alex; a tela já existe.

**Em trânsito e em repouso**: TLS (Supabase); banco cifrado em repouso (Supabase); sessão no `expo-secure-store` (Keychain/Keystore). Sem cifra adicional por campo na v1 — **mudaria se** o Alex quiser que nem o operador do banco leia (aí cifra no cliente, com perda de busca e de Realtime).

## 6. Testes

| Camada | Ferramenta | O que se testa | Como roda |
|---|---|---|---|
| `dominio/` | `node:test` + `node:assert/strict` | toda regra: unidades, treino, dieta, assinatura, papel→visão, sincronização, avisos | `npm run testar:dominio` — **sem instalar nada**, Node 24 direto; hoje (10/10/2026, depois da revisão A): 86 testes passando (unidades e treino); depois do P07, mais 41 em `avisos.test.ts` (agenda local, silêncio, limite, aviso da academia). `dominio/package.json` com `"type": "module"` evita o aviso `MODULE_TYPELESS_PACKAGE_JSON` do Node sem mexer no `package.json` do Expo |
| `dados/` | `node:test` com o cliente Supabase **falso** (interface `Backend` implementada em memória) | mapeadores snake↔camel, fila (ordem, retry, falha de regra), redigir | `npm run testar:dominio` (mesmo padrão, `dados/**/*.test.ts` entra no glob quando existir) |
| RLS | `pgTAP` ou script SQL em `supabase/testes/` que entra como cada papel e tenta ler/escrever | cada linha da tabela de acesso do modelo de dados | `supabase test db` (CLI) |
| `componentes/`, `telas/` | `jest-expo` + `@testing-library/react-native` | renderiza, formata unidade certa, botão escondido para papel sem permissão, estado vazio/erro | `npm run testar:telas` |
| Fluxos no aparelho | **Maestro** (YAML, roda no emulador e no EAS) — entra antes da primeira publicação | entrar → escolher visão → registrar um treino; funcionário monta treino | `maestro test fluxos/` |

Regra: **toda regra nova nasce com teste no domínio** antes de tela. Tela testa o que é da tela (mostrar/esconder, formatar), não a regra.

## 7. Como rodar (resumo; o passo a passo está em `app/LEIA-ME.md`)

```bash
cd app
npm install && npx expo install --fix
cp .env.exemplo .env            # URL e chave anônima do Supabase
npm run testar:dominio          # roda hoje, antes de qualquer instalação
npm run iniciar                 # Metro + QR para o Expo Go
```

Ambientes: **local** (Supabase CLI com Docker, `supabase start`) para desenvolver com banco descartável; **homologação** e **produção** como dois projetos Supabase, escolhidos por `.env`. Build e publicação por **EAS Build** (perfis `desenvolvimento`, `previa` — TestFlight e teste interno da Play — e `producao`, em `app/eas.json`; como gerar o iPhone sem Mac em `app/LEIA-ME.md`; o que é próprio do iPhone em `04-IPHONE.md`) e correções de JS por **EAS Update**.

## Pendências [decidir] que travam decisão técnica

| Pendência | Decisão técnica que espera |
|---|---|
| Quem paga o Plus | Caminho A/B/C da seção 4 e qual SDK entra no `package.json` |
| Chat próprio ou WhatsApp | Tabelas `conversas`/`mensagens`, canal Realtime, notificação "nova mensagem" |
| Uma ou várias academias | Tela de criar academia e convite; nada muda no modelo |
| Marca própria ou white-label | `tema/` com sobreposição por academia; ícone e nome na loja (white-label real exige um app por academia nas lojas — custo alto; a alternativa é só cor e logo dentro do app) |
| Dieta: texto livre ou banco de alimentos | Tabela `alimentos` e fonte dos dados (TACO/TBCA) |
| Gestão (mensalidade, catraca) | Fora da v1 por padrão; se entrar, novo módulo `financeiro/` |
