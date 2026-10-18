# Decisões — Academia Plus

Cada decisão tem data, o que foi decidido, por quê, o que foi descartado e o que faria mudar de ideia. Quem decide algo escreve aqui no mesmo dia.

## 10/10/2026 — Duas visões num app só

**Decidido**: um único aplicativo, com a visão (academia ou aluno) escolhida pelo papel do usuário logado.
**Por quê**: foi assim que o Alex descreveu; e um funcionário também pode ser aluno — dois apps forçariam duas contas.
**Descartado**: dois aplicativos separados (um "Academia Plus" e um "Academia Plus Gestão").
**Mudaria se**: as lojas (Google/Apple) exigirem separação por política de conteúdo, ou se a visão da academia crescer para um painel de gestão completo que só faz sentido em tela grande.

## 10/10/2026 — Cadastro corporal é opcional

**Decidido**: o aluno usa o app inteiro sem informar peso, altura ou objetivo. Informar melhora o planejamento, não destrava tela.
**Por quê**: pedido explícito do Alex ("não é obrigatório").
**Mudaria se**: o modo Plus exigir dados mínimos para o personal montar dieta — nesse caso a exigência fica dentro do Plus, não na entrada do app.

## 10/10/2026 — Plus é plano pago dentro do app

**Decidido**: "Plus" é o nome do plano pago que libera acompanhamento de personal (treino e alimentação).
**Por quê**: é a fonte de receita que o Alex descreveu.
**Pendente [decidir]**: quem paga (aluno direto ou via academia) — ver tabela do P00.

## 10/10/2026 — Stack: Expo (React Native) + TypeScript no app, Supabase no backend

**Decidido**: app em Expo SDK 54 (React Native, TypeScript, Expo Router); backend Supabase (Postgres com RLS, autenticação, Realtime, Storage, Edge Functions). Detalhe e comparação em `03-arquitetura/00-STACK.md`.
**Por quê**: um código para Android e iOS na mesma língua do domínio e dos testes; build de iOS sem Mac (EAS); regra de acesso a dado de saúde no banco (RLS), não na tela; Postgres porque treino → dia → exercício → série é relacional; equipe de um.
**Descartado**: Flutter (língua nova, precisa de Mac para iOS, não reaproveita o domínio em TS no servidor); nativo Kotlin+Swift (dois códigos); Firebase (documentos não servem ao modelo relacional, regras de acesso por papel/academia ficam difíceis); servidor próprio (ninguém para operar na v1).
**Mudaria se**: o app precisar de animação pesada o tempo todo (Flutter); um pacote nativo essencial não existir em Expo (prebuild antes de trocar); o offline crescer para edição com conflito (PowerSync sobre o mesmo Postgres); o custo de Realtime/Edge Functions disparar com muitas academias (servidor Node pequeno, mantendo o Postgres).

## 10/10/2026 — Domínio em TypeScript puro, testado com `node:test` sem compilar

**Decidido**: `app/dominio/` não importa React, Expo nem Supabase; roda direto no Node 24 (type stripping) e se testa com `node --test`. Consequências travadas no `tsconfig.json` (`erasableSyntaxOnly`, `verbatimModuleSyntax`): sem `enum` (união de texto), sem parameter properties, `import type` para tipos, todo import com `.ts`.
**Por quê**: a regra de negócio (treino, unidades, dieta, Plus) é a parte que mais importa e a mais fácil de testar quando não depende de tela nem de rede; o mesmo arquivo pode rodar numa Edge Function.
**Descartado**: testar o domínio com Jest (precisa instalar e configurar; o Node já faz); classes com estado (funções puras e imutáveis são mais fáceis de testar e de usar no React).
**Mudaria se**: o Metro ou o Node deixarem de aceitar `.ts` com extensão explícita — improvável; voltaria a um passo de build.

## 10/10/2026 — `academiaId` em tudo, mesmo com uma academia só

**Decidido**: toda entidade que pertence a uma academia carrega `academiaId`; toda política RLS filtra por ele; toda chave de cache inclui ele.
**Por quê**: a pendência [decidir] "uma academia ou várias" não precisa ser resolvida para o código andar — as duas respostas cabem. Tirar depois é impossível; pôr depois é refazer o banco.
**Descartado**: modelar para uma academia e migrar se virar SaaS.
**Mudaria se**: nada; é barato e não tem contra.

## 10/10/2026 — Visão decidida pelo vínculo, com troca sem sair da conta

**Decidido**: ao entrar, o app carrega os vínculos do usuário; um vínculo leva direto à visão; mais de um mostra "Entrar como..." e guarda a escolha; o menu da conta tem "Trocar de visão". Permissão fina é decidida em `dominio/papel.ts` e reforçada pela RLS.
**Por quê**: exigência do CLAUDE.md (aluno que vira funcionário não troca de conta); escolher "sou academia / sou aluno" à mão leva a tela vazia por escolha errada.
**Descartado**: dois apps; modo escolhido à mão; permissão só na tela.
**Mudaria se**: as lojas exigirem separação — vira um segundo alvo de build com o mesmo código.

## 10/10/2026 — Offline restrito: leitura em cache e fila só para treino realizado

**Decidido**: sem sinal, o aluno abre o app, vê treinos, biblioteca e dieta (cache em SQLite) e registra o treino feito e a refeição feita (fila de envio, id gerado no telefone, "o telefone manda" no conflito). Montar/editar treino, escolher treino pronto, conversa, Plus e toda a visão da academia exigem rede e avisam sem travar.
**Por quê**: a cena real é o aluno no porão sem Wi-Fi registrando o treino; é isso que não pode falhar. Edição offline com conflito é um problema grande que a v1 não tem.
**Descartado**: WatermelonDB/PowerSync agora (custo de setup e aprendizado para um caso que não existe ainda); Firebase pelo offline embutido (perde o modelo relacional e a RLS).
**Mudaria se**: montar treino sem sinal virar pedido real, ou a visão da academia precisar de offline (tablet na sala) → PowerSync sobre o mesmo Postgres.

## 10/10/2026 — Dado de saúde: RLS no banco, redigido antes de qualquer log, fora do backup do sistema

**Decidido**: tabelas de saúde (perfil, medições, dieta, mensagens) com RLS que só libera ao aluno, à academia dele (perfil e medições) e ao personal com Plus ativo (dieta, conversa); dono não vê dieta nem conversa. `dados/redigir.ts` substitui campos de saúde por `[redigido]` antes de console/Sentry/analytics, com a lista protegida por teste. Notificação nunca carrega conteúdo de saúde. SQLite local fora do backup automático. Telas de exportar e apagar meus dados desde a v1; consentimento guardado na primeira medição.
**Por quê**: LGPD trata saúde como dado sensível; o controle precisa estar onde o dado está (servidor), e o vazamento mais comum é log e analytics, não ataque.
**Descartado**: cifra por campo no cliente (perde busca e Realtime; só se o Alex quiser que nem o operador do banco leia); bloquear captura de tela (o aluno tem direito ao próprio dado).
**Mudaria se**: o Alex pedir que o operador do banco não enxergue → cifra no cliente.

## 10/10/2026 — Pagamento do Plus: nenhum SDK até a decisão de quem paga **[decidir]**

**Registrado, não decidido**: três caminhos técnicos mapeados em `03-arquitetura/03-DECISOES-TECNICAS.md` (loja via RevenueCat; Pix/cartão via Mercado Pago ou Stripe; via academia sem pagamento no app). O modelo cabe nos três (`origemDoPagamento`). Regra fixa em qualquer caminho: `status` da assinatura só muda por função do servidor; nenhum dado de cartão passa pelo app.
**Recomendação técnica para o Alex**: começar por "via academia" (zero integração e taxa); se vender direto ao aluno, Pix fora da loja, com atenção à regra da Apple sobre conteúdo digital.
**Quem decide**: Alex (tabela do P00).

## 10/10/2026 — Abas do aluno: Início · Treinos · Plus · Perfil

**Decidido**: o aluno tem 4 abas e a dieta mora dentro da aba Plus; a academia tem de 3 a 5 abas conforme o papel (Alunos · Treinos · Plus só para personal · Academia só para dono · Perfil). O mapa de telas (`01-especificacao/04-MAPA-DE-TELAS.md`) é a fonte; o sistema de design e os mockups foram alinhados a ele.
**Por quê**: a dieta só existe com o Plus. Uma aba "Dieta" e outra "Personal" para quem não assina seriam duas abas de anúncio. O acesso diário à dieta fica no cartão "Dieta de hoje" do Início.
**Descartado**: 5 abas no aluno (Hoje · Treinos · Dieta · Personal · Perfil), da primeira versão do sistema de design.
**Mudaria se**: a maioria dos alunos ativos for Plus e abrir a dieta várias vezes por dia. Aí a dieta ganha aba própria.

## 10/10/2026 — iPhone: configuração, build sem Mac e regras da App Store

**Decidido** (técnico; detalhe em `03-arquitetura/04-IPHONE.md`):
- `app.json`, bloco `ios`: `buildNumber` "1" (depois o EAS sobe sozinho), `supportsTablet: false`, `usesAppleSignIn: true`, `config.usesNonExemptEncryption: false` (no lugar da chave solta no `infoPlist`), textos de câmera e fotos em português, **sem microfone** e **sem `UIBackgroundModes`**, manifesto de privacidade com os motivos `CA92.1`, `C617.1`, `35F9.1`, `E174.1` e os tipos de dado coletados (todos ligados à pessoa, sem rastreamento).
- `eas.json` com os perfis `desenvolvimento`, `previa` (TestFlight e teste interno da Play) e `producao`; número de build no EAS (`appVersionSource: "remote"`). Substitui o nome `homologacao` que estava previsto em `03-DECISOES-TECNICAS.md`.
- Dependências do SDK 54 acrescentadas: `expo-haptics`, `expo-font`, `expo-image-picker`, `expo-apple-authentication`, `expo-system-ui`, `expo-dev-client`.
- Fim do descanso com o app fechado = notificação **local agendada** pelo instante de fim; permissão **provisória** no primeiro acesso, pedido completo (com som) no primeiro descanso.
- Gesto de voltar nunca bloqueado; no treino em andamento, `usePreventRemove` cancela o deslize e pergunta (continuar · sair e continuar depois · descartar).
- Fontes embutidas pelo plugin `expo-font`, chamadas pelo nome do arquivo (no iOS cada peso é uma família).
- Live Activity/Dynamic Island e Apple Saúde ficam para a **v2**.
**Por quê**: é o que o Expo SDK 54 documenta para cada chave e o que as Diretrizes da App Store de 08/06/2026 exigem (4.8, 5.1.1, 5.1.3, 2.1, 2.5.4); o build pelo EAS dispensa Mac. A permissão provisória sozinha entrega em silêncio, o que não serve para o fim do descanso.
**Descartado**: áudio em segundo plano para manter o cronômetro vivo (uso fora do propósito, 2.5.4, recusa provável); bloquear o gesto de voltar no treino (contra o padrão do iOS; o treino já é salvo a cada série); carregar fontes com `useFonts()` em tempo de execução (atrasa a abertura; fica só para o Expo Go); Live Activity na v1 (extensão em Swift, alvo nativo extra, `expo-widgets` só a partir do SDK 55 e em alfa).
**Mudaria se**: os alunos no TestFlight sentirem falta de ver o descanso sem desbloquear (Live Activity); o modo Foco esconder o aviso (notificação "urgente", com a capacidade da Apple); a Apple pedir outro motivo no manifesto por e-mail.

**Pendente [decidir]** (para a tabela do P00):
- **Nome do pacote**: proposto `com.pixelmartins.academiaplus` (iOS e Android) no lugar de `com.academiaplus.app`, cujo domínio o Alex não tem. Depois do primeiro envio às lojas não muda mais.
- **Conta Apple Developer de pessoa física ou de organização**: a diretriz 5.1.1(ix) pede que app com informação sensível (saúde) seja enviado por pessoa jurídica. Liga ao R4 da revisão B (quem é o controlador dos dados).
- O pagamento do Plus continua **[decidir]**; a leitura das diretrizes 3.1.1 e 3.1.3 por caminho está em `04-IPHONE.md`, seção 10.4, ligada ao R2 da revisão B. A frase "o caminho C não tem esse problema" foi corrigida em `03-DECISOES-TECNICAS.md`.

## 10/10/2026 — Avisos: quem dispara, regras anti-incômodo e o aviso da academia

**Decidido** (técnico; detalhe em `03-arquitetura/03-DECISOES-TECNICAS.md`, seção 3, e `01-especificacao/03-REGRAS.md`, seção 10): o cronômetro e os lembretes são notificação local, com a agenda calculada por `dominio/avisos.ts`. Todo o resto sai do servidor (Edge Function `enviar-aviso`), nunca de um app para outro.
- Silêncio das 22:00 às 07:00, menos para o cronômetro.
- Até 3 lembretes locais e 3 avisos do servidor por pessoa por dia.
- Avisos iguais vão agrupados.
- Nenhum dado de saúde no texto: nem o nome da refeição, nem a prévia da mensagem.
- O aviso da academia é só texto, com até 160 caracteres, uma notificação por dia e sem resposta.

**Por quê**: os itens A11 e V6 da revisão B; a LGPD, porque a notificação passa por Apple, Google e Expo e aparece na tela bloqueada; e o tom de voz da marca ("aparece quando precisa"). Os exemplos de notificação em `02-design/marca-e-proposta/04-APLICACAO.md` e `01-TOM-DE-VOZ.md` foram corrigidos no mesmo dia: tiramos o objetivo, a carga, a prévia e o horário da academia, e a regra dos 10 dias virou 14.
**Descartado**: push de um app para outro; mover o lembrete para fora do silêncio; prévia da mensagem; aviso com resposta ou "lido por"; lembrete de treino ligado por padrão.
**Mudaria se**: alguém pedir um horário de silêncio próprio (o código já aceita); o volume pedir FCM/APNs direto; o modo Foco do iPhone esconder o descanso (o "urgente" da Apple).

## 10/10/2026 — Cronômetro: um motor para descanso, série por tempo e os três modos

**Decidido** (detalhe em `01-especificacao/03-REGRAS.md`, seção 9, e `app/dominio/cronometro.ts`):
- **Instante em ms desde 1970, não relógio monotônico.** O relógio monotônico do React Native recomeça quando o app abre, e o app pode morrer no meio do descanso.
- **Sem descanso depois da última rodada.** Com 10 s de preparação, o Tabata dá 4:00.
- **O descanso não interrompe um intervalado.** A série fica marcada e o aluno escolhe se quer descansar.
- **Até 24 notificações agendadas por cronômetro.** O iPhone guarda 64 por app, divididas com os lembretes.
- A tela fica acesa com o Cronômetro rodando (`expo-keep-awake`, declarado no `package.json` em 10/10).

**Descartado**: contador por tique (para com a tela bloqueada); áudio em segundo plano (já descartado no iPhone); 8 × (20 + 10) com descanso final; descanso que substitui o intervalado sem perguntar (apagaria um HIIT de 10 min por um toque na série); agendar todas as fases.
**Mudaria se**: o relógio adiantado à mão virar queixa real; os alunos pedirem o descanso final.

## 10/10/2026 — Reanimated 4 entra no app (efeitos do P08)

**Decidido**: `react-native-reanimated ~4.1.1` (com `react-native-worklets 0.5.1`), `react-native-svg 15.12.1` e `expo-linear-gradient ~15.0.8`, nas versões do SDK 54, declaradas no `package.json`. O catálogo está em `02-design/sistema-de-design/movimento/00-CATALOGO.md`.
- O toque grava a série primeiro, depois vibra, e só então anima.
- Com "reduzir movimento" ligado, todo efeito vira um esmaecer de 160 ms.

**Por quê**: o check com mola, o anel contínuo, o título grande no Android e o esqueleto precisam rodar fora da linha do JavaScript, para não engasgar quando a tela grava a série.
**Descartado**: o `Animated` do React Native, que não tem mola por `dampingRatio` nem animação de layout, e cujo `useNativeDriver` não anima cor.
**Mudaria se**: o SDK subir e o Reanimated mudar de API de novo, ou se o efeito pesar em Android de entrada (medir no aparelho mais fraco do público antes de publicar).

## 10/10/2026 — Protótipo montado com a direção A (provisória até o Alex escolher)

**Feito**: o mockup (`02-design/sistema-de-design/mockups/`, `tokens.json` 1.5.0) usa a direção **A · Lousa clara com foto**, a recomendada em `02-design/direcao-de-arte/`. Entram também os dois empréstimos opcionais: o placar no topo do treino do dia e o halo no exercício atual, só no escuro. O mockup leva ainda as imagens de `02-design/imagens/` e os efeitos de `movimento/`. A medição dá 0 achados em 124 combinações, com o contraste medido nas cores reais.
**Por quê**: é a direção que menos arrisca a leitura no meio da série e a que mais usa as fotos. Se o Alex escolher outra, mudam valores de token e não a estrutura das telas.
**Pendente [decidir]**: a direção (A, B, C ou uma mistura) e se os dois empréstimos ficam.

## 10/10/2026 — Nova direção visual a partir das referências do Alex

**Decidido pelo Alex**: a linguagem das referências em `02-design/referencias/`: escuro com foto grande, painéis de vidro sobre a imagem, números enormes e efeitos. O claro segue a mesma linguagem. A cor de destaque é o **verde da marca mais vivo**; não vira verde-limão, e o dourado fica só no Plus. Isso substitui a escolha entre A, B e C, que aproveitam o que tiverem de compatível.
**Mantido**: alvos de toque, números grandes, contraste de 4,5:1 medido, nada de "corpo ideal", e vidro com camada de contraste e alternativa sólida para "Reduzir transparência".

## 10/10/2026 — Abertura e entrada com duas portas

**Decidido pelo Alex**: a abertura mostra a cor da marca com o logo. Depois vem a entrada com **"Sou aluno"** e **"Sou da academia"**; a segunda porta serve para personal, instrutor, recepção e dono.
**Como casa com a regra "o papel decide a visão"**: a porta escolhe o caminho do cadastro. O aluno tem um cadastro curto, com objetivo opcional. Quem é da academia entra por convite ou código e tem o papel confirmado pelo dono. Depois de entrar, a visão continua vindo do vínculo, e quem tem os dois papéis continua trocando no Perfil.
**Descartado**: personal autônomo, fora de academia, na v1. Seria quase um segundo produto.

## 10/10/2026 — Vidro e verde vivo no sistema (tokens 1.6.0)

**Decidido**:
- **Verde vivo** `#39F0CD` (`viva`), sempre com texto `#00221A` por cima.
  - No claro ele só preenche, nunca é texto: sobre branco dá 1,45:1. No claro, texto, link e anel usam `marca` `#007761`.
  - No escuro, `marca` = `viva`. O fundo do escuro fica quase preto, `#070C0C`.
- **Grupo `vidro`**: desfoque 24, borda clara de 1 px, camada de contraste e cor sólida para "Reduzir transparência".
- **Grupo `foto`**: escurecer 0,72, degradê e luz lateral.
- **No app**: `expo-blur ~15.0.7` (SDK 54; `npm run alinhar-versoes` confirma a versão na instalação).
- **Auditoria**: o contraste sobre foto ou vidro passa a ser medido no pior pixel de fundo.

**Por quê**: as referências do Alex e a decisão de usar "o verde da marca mais vivo".
**Pendente**: o logo e o ícone ainda estão em `#006B5F`, e a abertura usa `#007761`. Os dois precisam ser iguais (fica para a junção do P09).

## 10/10/2026 — Proporção planejada: escala fechada e um herói por tela

**Decidido pelo Alex** (ao ver o treino da direção B, com números de 40 e botões de 64): números e botões grandes demais fogem da proposta de proporção bem planejada.
**Regra nova** (substitui "números enormes e alvos 48/56/64"):
- **Escala tipográfica fechada**: base 16, razão 1,25. Os tamanhos possíveis são 13 · 16 · 20 · 25 · 31 · 39 · 49 · 61. O máximo, 61, só aparece no modo treino e no cronômetro.
- **Um herói por tela.** Número e unidade ficam em proporção de no máximo 2,5:1.
- **O tamanho que se vê é separado da área de toque**:
  - a área de toque continua com pelo menos 48, com área invisível ao redor;
  - o tamanho visual do botão é 48 no primário, 40 no secundário e no ícone, 40 no marcar série, 36 no +/− e 32 no chip;
  - a barra de abas tem 56 + área segura;
  - nada passa de 56.
- **Proporções**: o botão tem 2,5× a 3× o tamanho do texto, e o ícone ocupa 0,5× a 0,6× do botão. A foto herói ocupa no máximo 45% da altura útil. Tudo segue a grade de 8.
- **Auditoria**: o `auditar.mjs` reprova tamanho fora da escala, mais de um herói, mais de 56 visuais e toque abaixo de 44.

**Por quê**: legível a um braço de distância sem gritar. As referências do Alex usam número grande, mas em um lugar só por tela.
**Descartado**: o número de 112 e os botões de 56 a 64 da versão anterior.

## 10/10/2026 — Imagem coerente com o assunto e catálogo-modelo de treinos prontos

**Decidido** (agente S, pedido do Alex; detalhe em `docs/revisao/S-TREINOS-E-IMAGENS.md`):
- **Miniatura de exercício (48–64) é sempre a ilustração** do agente R. Foto de exercício só em tamanho grande, e só se mostrar aquele exercício, com o aparelho e a posição certos. Sem foto certa, fica a ilustração.
- **A capa de treino pronto mostra o foco do treino**. Um supino, por exemplo, para um treino que começa por peito. Não vale uma foto qualquer do objetivo.
- **Catálogo-modelo de 11 treinos prontos** em `app/dominio/catalogo/`, testado com as funções de `treino.ts`:
  - a duração de cada dia é a estimativa do domínio (±20 %);
  - a carga fica em branco, para o instrutor definir;
  - ele é **modelo**: precisa da revisão de um profissional com CREF antes de ir ao aluno, e a academia edita ou troca.

**Por quê**: o levantamento achou 5 imagens erradas, como o "supino inclinado" em banco reto e o "ABC" começando por peito com capa de agachamento. Foto de 48 px não mostra o exercício; a ilustração mostra por construção. Treino pronto inventado no mockup (50 min, 21 exercícios) não batia com conta nenhuma.
**Descartado**: forçar foto parecida quando não há a certa; capa por objetivo para todo treino do objetivo; carga sugerida no modelo.
**Mudaria se**: a academia cliente mandar fotos da própria sala (aí elas têm prioridade), ou o profissional revisor mudar o volume dos programas (muda o JSON; o teste continua valendo).
**Pendente [decidir]**: quem revisa o catálogo; aviso para quem informou restrição; circuito como regra do domínio.

## 10/10/2026 — Junção do P09: o que N, O, P e R deixaram sugerido (registrado pelo agente Q)

**Sistema (N), complemento da entrada "Vidro e verde vivo"**:
- **A foto é igual nos dois temas** nas capas e no herói; o claro só troca o vidro por vidro claro. **Descartado**: clarear a foto no tema claro (seria outro app) e `viva` como texto no claro (1,45:1).
- **Mudaria se** o teste em aparelho mostrar o vidro pesado no Android de entrada: aí o vidro nasce sólido abaixo do Android 12, como já previsto no componente 20.

**Entrada (O)**:
- **Código da equipe é separado do código dos alunos** (6 caracteres, outro valor). **Por quê**: o código dos alunos fica no cartaz da recepção; quem o usa não pode cair na fila da equipe.
- **Convite por e-mail entra sem pendência** (já vem com o papel e nasce `ativo`); **pedido por código sempre passa pelo dono**, que escolhe o papel. **Por quê**: "quem dá o papel é sempre o dono"; o convite é o dono dando o papel antes.
- **A abertura no escuro usa o verde profundo** (`marcaSuave` escuro `#0A332C`) com o símbolo em `viva`, não a marca cheia. **Por quê**: verde vivo de tela inteira no quarto escuro às 6 da manhã ofusca.
- **O logo sobre foto pode ir numa pílula de vidro** com contraste medido (regra acrescentada em `03-LOGO.md`).
- **Na entrada a foto é a tela**: no claro ela clareia e o texto é escuro (`foto.entrada`), diferente das capas. **Mudaria se** o Alex preferir a regra única do N (foto sempre escura): troca-se o tratamento claro pelo escuro, e mais nada muda.
- Seguem **[decidir]**: uma academia ou várias; nomes dos objetivos; perguntas da entrada separadas ou a tela única "Sobre você" do F1.

**Telas novas (P)**:
- **Gráfico com uma cor só** (`progresso`) e o resto em cinza (`grafico.neutro*`); a rosca de volume destaca um grupo por vez. **Por quê**: nenhuma paleta de 4 cores passou no teste de daltonismo no escuro. **Descartado**: 4 cores por grupo muscular.
- **Sem gráfico vazio**: quem começou agora vê frase, botão e contorno tracejado; a linha só aparece com 2 treinos fechados.
- **Nada de kcal, peso do corpo ou comparação com outro aluno** na Evolução e no painel do dono; o dono vê frequência e Plus, nunca dado de saúde.
- **Proposta, para o Alex confirmar**: a Evolução mora na aba Treinos, com atalho no Início, e soma ao Histórico sem tirá-lo.
- **Vidro escuro fixo** vira variante do componente 20 (`vidro.escuroFixo`, `.vidro--escuro`).
- **Check da comemoração em 112** (tela cheia em `viva`); o catálogo de movimento foi alinhado (efeito 4.2).

**Ícones e ilustrações (R)**:
- **Lucide (ISC) de base e Tabler (MIT) nos temáticos**, os dois no traço do logo (**2,25**), mais desenho próprio nos ícones-assinatura (`plus`, `inicio`, `cronometro`, `anilha`). **Descartado**: Phosphor (traço menos redondo), Iconoir (fino), Material Symbols (cheio), Healthicons (grade 48), Remix (licença de 2026 proíbe uso como identidade), Flaticon e Noun Project (crédito na tela).
- **Cheio só na aba ativa**; o resto em contorno.
- **Ilustração de exercício em grade 48**, figura sem rosto e sem músculo desenhado, o músculo trabalhado em traço grosso na cor de destaque, e o nome sempre em texto ao lado.
- **Apple e Google só no mockup**: no app vão o botão nativo da Apple e o "G" oficial do Google.

## 10/10/2026 — Junção do P09: decisões do agente Q

**Decidido**:
- **Tokens 1.7.0**: as variáveis locais `--o-`, `--p-` e `--r-` viraram tokens (lista em `01-TOKENS.md`). **Tokens 1.8.0**: a regra de proporção do Alex aplicada em `tokens.json`, `sistema.css`, `entrada.css`, `novas.css` e nas três páginas.
- **Cor do logo e do ícone = `marca` 1.6.0**: o caminho A em `logo/` passou de `#006B5F`/`#6BD3C2` para `#007761`/`#39F0CD`; `tokens-marca.json` 1.1.0 acompanha o `tokens.json`. Contraste: branco sobre `#007761` 5,51:1; `#007761` sobre branco 5,51:1; `#39F0CD` sobre o fundo escuro 13,61:1. **Por quê**: a abertura já usava `#007761` e os dois não podem ser diferentes. **Descartado**: voltar a abertura para `#006B5F` (a marca do sistema já era a nova). Os caminhos B e C, descartados, ficaram nas cores antigas como registro. **Pendente**: `app/app.json` ainda tem `#006B5F` na cor da notificação (é do app, não desta junção).
- **Haltere da aba Início na horizontal**, com duas anilhas em degrau de cada lado. **Por quê**: o de 45° lia como elo de corrente em 16 px. O degrau o separa do `plus` (braço vertical) e da `barra` (pontas para fora).
- **Destaque da ilustração no verde do sistema**: `marca` no claro (4,77:1 sobre o ladrilho) e `viva` no escuro (9,81:1), no lugar de `#00897B`/`#4FE3C8`. **Por quê**: um verde só no app.
- **Barra de abas encostada nas três páginas**; a flutuante do P saiu. **Por quê**: cobria o fim da lista e criava um segundo desenho de aba ativa. As refs 03, 05 e 06 também a têm encostada.
- **O sprite é embutido nas páginas** (`icones/fonte/embutir.mjs`), porque por `file://` o Chrome não carrega sprite externo. Os ícones novos que as páginas usavam (chevrons, lista, conversa, desfazer, alerta, olho, escudo, convite, relógio, estrela…) entraram no gerador do R, no mesmo traço, com crédito ao Lucide.
- **Moldura inteira na primeira tela a 2040 × 790** nas três páginas: o topo fixo vira uma linha só e o zoom desconta tudo o que fica acima da primeira fileira.
- **Trocas do agente S aplicadas** (15): o supino inclinado de verdade, as capas por foco do treino, os nomes e durações do catálogo; as fotos `heroi-supino-halteres` e `capa-ganhar-massa` saíram do mockup.

**Mudaria se**: o Alex pedir outra cor de logo (muda `tokens-marca.json`, os SVG do caminho A e a abertura juntos) ou preferir a barra flutuante (vira variante do componente 12, nas três páginas).

## 11/10/2026 — Perfil profissional, pedido de treino, fila com dono e a checagem do código (agente T, P10)

**Decidido** (técnico; detalhe em `03-arquitetura/01-MODELO-DE-DADOS.md`, seções 3, 8, 23 a 25, e `docs/revisao/T-CODIGO.md`):
- **`PerfilProfissional` pertence ao vínculo de equipe**, não à conta (R11.2): a mesma pessoa em duas academias tem dois perfis, com turnos diferentes. "Professor" é o `instrutor`; não há papel novo. Campos: nome de exibição, foto (só `https://`), formação (até 60), CREF no formato do CONFEF (`012345-G/SP`, o número como foi escrito), `crefConferido` (só o servidor escreve; trocar o CREF desfaz), especialidades da lista fixa mais "outra" com texto, "sobre" até 280 **sem contato** (telefone, e-mail, @ e link são recusados), grade de turnos, `visivelAosAlunos` (nasce falso), `visivelDesde` (o consentimento, R11.8), `ocultadoPeloDono`. **Sem telefone, sem e-mail, sem preço.**
- **Quem vê**: o próprio sempre; o dono todos da academia dele; aluno e equipe com vínculo **ativo** na mesma academia só o perfil visível (chave ligada, não escondido, vínculo do profissional ativo); ninguém de fora. **Quem escreve**: o profissional o seu, menos `ocultadoPeloDono` e `crefConferido`, com a chave travada se escondido; o dono só `ocultadoPeloDono`. A linha é da RLS; a coluna, de um gatilho `before insert or update`. `dominio/perfil-profissional.ts` espelha para a tela.
- **`PedidoDeTreino`** (R12.2): um aberto por aluno e academia, recado até 140, fecha sozinho como `atendido` quando a academia envia um treino; o recado entra no `redigir.ts`.
- **`trocarEm` no treino** (R12.5), **`motivoDeSaida` e `encerradoPor` no vínculo** (R12.11, sem `grant select` para o app; o dono vê só a soma), **`cargaPlanejadaEm` na série** (R12.1: a planejada vence a última real só se mudou depois).
- **Cada item da fila offline tem dono** (`usuarioId`) e só sobe com a sessão válida da mesma conta; recusa com sessão vencida ou de outra conta é "entrar de novo", nunca "falhou"; sair da conta não apaga a fila (R12.3). A fila guarda só status e código do erro.
- **Avisos novos**: 21 "vínculo encerrado" (aluno, chave Avisos da academia, sem o motivo) e 22 "resumo da semana" (dono, segunda 09:00, chave própria). Pedido de treino e aluno novo sem treinar são **linhas do resumo das 09:00**, não avisos à parte.

**Por quê**: o pedido do Alex (perfil e Equipe), as regras R11 e R12 do agente V, a LGPD (o perfil é publicado pelo profissional, com data; o recado pode ter dado de saúde) e o achado da revisão T de que a fila sem dono perdia o treino do porão quando a sessão vencia.

**Descartado**: perfil na conta (perderia os turnos por academia); o dono editando o texto do perfil de alguém (é dado pessoal do profissional); o app marcando o CREF como conferido sem consulta; aviso próprio para cada pedido de treino (o recado pode ter dado de saúde e a contagem basta); apagar a fila ao sair da conta.

**Mudaria se**: o Alex decidir conferir o CREF (aí uma função do servidor grava `crefConferido`); quiser preço no perfil (volta pelo `05-FORA-DA-V1.md`); quiser que o recado do pedido siga a autorização de dado de saúde (a coluna sai do `select` da equipe sem autorização — está como pergunta na seção 24 do modelo); ou aceitar outra lista de especialidades (pergunta 26).

## 11/10/2026 — Escolhas provisórias para começar a construir (o Alex disse "pode prosseguir")

O Alex autorizou seguir com a construção. As pendências do P00 que travavam o código ficam com a **opção recomendada**, marcada como provisória. Cada uma pode mudar depois sem refazer o modelo, que já cabe nas duas respostas.

| Pendência | Provisório | Por que dá para trocar depois |
|---|---|---|
| Uma academia ou várias | Telas para **uma** academia; `academiaId` em tudo | O modelo já é multi-academia |
| Quem paga o Plus | **Via academia**: o dono liga e desliga, sem pagamento no app | Nenhum SDK de pagamento entra; `origemDoPagamento` já existe |
| Dieta no Plus | Plano escrito por **nutricionista parceiro**, e o personal acompanha | A tela é a mesma; muda quem assina o plano |
| Chat ou WhatsApp | **Chat no app, só texto** | Modelo `Conversa`/`Mensagem` isolado |
| "+" central na barra | **Não** (4 abas, como no mapa) | O `?abas=mais` continua pronto |
| CREF | **Só mostrar**, com "informado pelo profissional" | O campo `crefConferido` existe |
| Avaliação de profissional | **Não** | — |
| Backend | **Dados de exemplo locais** atrás de `app/dados/` até existir a conta Supabase | `dados/` é a única fronteira |

## 11/10/2026 — Logo final: "Barra e mais, robusta"

**Decidido** (agente W, a pedido do Alex: "cria uma logo condizente de academia"): o símbolo é um "+" de quatro braços com pontas redondas. O braço horizontal é a barra, com uma anilha de cada lado e a ponta passando. O vertical é o traço mais grosso (160 contra 128) e passa muito das anilhas (832 contra 384). O wordmark é "Academia Plus" em Archivo ExtraBold, convertido em contorno. Usa as cores do sistema: `#007761` no claro e `#39F0CD` no escuro; o dourado fica só no selo Plus. O ícone do app, a notificação e a abertura foram gerados a partir dele, em `app/recursos/`, pelo `logo/fonte/gerar.py`.
**Por quê**: em 16 px lê como "+" e a partir de 48 px lê como "academia". Sem o braço vertical sobra uma barra, não o haltere genérico das referências 03 e 04. É a continuação do caminho A, então a abertura, a aba Plus e o selo continuam onde estavam.
**Descartado**:
- anilha com o "+" vazado: em 16 px vira cruz de farmácia ou o botão "adicionar";
- monograma A+: o "+" some em 24 px e lembra nota escolar.

O logo anterior está em `logo/historico-p04/`.
**Pendente [decidir]** (sem pressa): ícone escuro próprio para o iOS 18.

## 11/10/2026 — A base do app (agente X, P11)

**Decidido** (detalhe em `docs/revisao/X-BASE.md`):
- **Tema gerado, nunca copiado**: `app/ferramentas/gerar-tema.mjs` lê o `tokens.json` e escreve `app/tema/gerado/tokens.ts` (cores dos dois temas com as referências resolvidas, `color-mix` calculado, degradês CSS traduzidos para expo-linear-gradient e react-native-svg, escala com a fonte pelo nome do arquivo). Ícones idem: `gerar-icones.mjs` converte o `sprite.svg` em dados para o react-native-svg. **Descartado**: copiar valores à mão (envelhece no primeiro ajuste do design); `react-native-svg-transformer` (mais uma peça no Metro para 70 ícones).
- **Seis valores do sistema.css que ainda não estão no tokens.json** (camada de toque 0,08/0,12, brilho do esqueleto, cores do aviso rápido invertido, trilho sobre foto) ficam num bloco único do gerador, com a origem citada. **Mudaria se** o design os levar ao tokens.json (aí saem do gerador).
- **Expo Router: as abas da academia têm nomes de rota próprios** (`alunos`, `biblioteca`, `acompanhamento`, `painel`, `perfil-da-equipe`), porque o Expo Router não aceita o mesmo caminho em dois grupos (`(aluno)/perfil` e `(academia)/perfil` seriam os dois `/perfil`). O rótulo na tela é o do mapa.
- **Na web, o armazenamento local é o localStorage** (`dados/armazenamento/banco.web.ts`), não o expo-sqlite: a exportação falhou com `Unable to resolve module ./wa-sqlite/wa-sqlite.wasm` (o SQLite da web no SDK 54 pede o `.wasm` no Metro e os cabeçalhos COOP/COEP no servidor). A interface é a mesma; no celular é o SQLite. **Mudaria se** a web virar produto (aí `metro.config.js` com `wasm` e os cabeçalhos).
- **Vidro na web**: `backdrop-filter` próprio (`FundoDesfocado.web.tsx`), porque o BlurView web do expo-blur pinta uma cor por cima e mudaria a cor medida do vidro.
- **Deslizar para começar com o PanResponder** do React Native, sem `react-native-gesture-handler`. **Mudaria se** o arrasto engasgar no Android de entrada (aí o Gesture.Pan, que o catálogo cita).
- **Treino realizado grava SÍNCRONO** no SQLite (`openDatabaseSync`) e entra na fila no mesmo passo (`dados/fila.ts`), antes de qualquer animação; o envio usa a regra de `dominio/sincronizacao.ts`.
- **Fotos em `app/imagens/`** (cópia gerada de `02-design/imagens/`, com os créditos), fora de `recursos/`, que nesta onda era do agente W.
- **`android.allowBackup: false`** no app.json (SQLite fora do backup do sistema, seção 5 das decisões técnicas). No iPhone falta marcar o arquivo com `isExcludedFromBackup` (código nativo; pendente).
- **`npm run iniciar:expo-go`** (`expo start --go`): com o `expo-dev-client` no projeto, o `expo start` comum espera o build de desenvolvimento.

**Pendente (para quem tem a pasta)**: `dominio/papel.ts` com `visaoDoPapel` (hoje em `app/dados/visao.ts`, com teste); o mapa `familiaPorPeso.numero` do tokens.json sem o peso 800 (o gerador usa `Archivo-ExtraBold`); `raio.folha` 28 no tokens.json e 24 no `sistema.css`.

## 11/10/2026 — Junção e teste de ponta a ponta (agente AA, P11)

**Decidido** (detalhe em `docs/revisao/AA-TESTE.md`):
- **Peças promovidas a `app/componentes/`**: Interruptor e LinhaComChave; Lista, Linha e GrupoDeLinhas; Quadro, GradeDeQuadros, Medidor e GraficoDeBarrasDosDias; os gráficos da Evolução; Simbolo e SeloDoLogo (o logo em SVG, a geometria do `logo/simbolo.svg`); AbasDaVisao com FaixaDoCronometro e FaixaDoTreino; CartaoDoProfissional e ListaDaEquipe. As cópias locais foram apagadas.
- **Os dois `formatos.ts` viraram um**: `app/componentes/formatos.ts` (importado direto, `@/componentes/formatos`). **Descartado**: `tema/` (é a parte visual gerada dos tokens) e `dados/` (é apresentação, não dado).
- **Uma Linha só, com a regra do sistema** (56 sem apoio, 72 com apoio). A cópia da academia tinha 56 sempre; as linhas com apoio da visão da academia passam a 72, como as do aluno.
- **Um interruptor só, o desenhado** (`entrada.css › .o-interruptor`, 52 × 32). A `Chave` do aluno usava o Switch do sistema, que não está em mockup nenhum.
- **Gravação de verdade no repositório local**: cada escrita troca o objeto na lista de exemplo E grava o objeto inteiro numa COLEÇÃO do armazenamento do aparelho (SQLite versão 2, tabela `registros`; localStorage na web; memória no teste). Ao abrir, as coleções voltam por cima do exemplo, na ordem gravada; o que foi apagado de um exemplo volta apagado. As telas escrevem só pelo `useGravar()` de `dados/escrita.ts`, que grava e depois limpa o cache. **Descartado**: os estados em memória das telas (`telas/academia/estado-local.ts`, o `ProvedorDoAluno`, `telas/entrada/fluxo.ts`), que sumiam ao recarregar; uma tabela SQLite por entidade (o modelo de verdade é o do Supabase; o local é provisório).
- **Refeição registrada entra na fila**, como o treino realizado (R3.6, R1.24): grava síncrono e sobe depois. "Desmarcar" tira o registro e o item da fila, se ainda não subiu.
- **Pedido de treino precisa de sinal** (R12.2): sem rede, `ErroSemSinal` e nada é gravado; a tela diz "Sem sinal".
- **`Academia.codigoDaEquipe`** (F13.4) no domínio e no modelo de dados (`01-MODELO-DE-DADOS.md`, seção 1), diferente do `codigoDeVinculo` e fora do que o aluno lê.
- **A conta nova é criada de verdade** no fim da entrada (conta, vínculo pendente e respostas), e entra com ela; não entra mais como Juliana ou Lucas. Pela Apple/Google simulados ela se chama "Paula Gomes", com um e-mail de retransmissão de exemplo.
- **"Recepção ou instrutor" vira `instrutor` no pedido da equipe**; o dono ajusta ao confirmar. **[decidir]** se a recepção precisa de opção própria na entrada.
- **A Júlia entrou nas contas de exemplo** (personal com a Ana no Plus): a lista "Meus alunos Plus" deixa de ficar vazia.
- **A regra da visão foi para `dominio/papel.ts`** (`visaoDoPapel`, `decidirDestino`), com teste; `dados/visao.ts` saiu.
- **O cronômetro em andamento vai para o aparelho a cada mudança** e volta ao reabrir pelo `restaurarCronometro` (R9.4); o aviso dispensado também fica só no aparelho.
- **React Query com `networkMode: 'always'`**: o repositório local lê do aparelho. Com o padrão, o navegador sem rede PAUSAVA as leituras e o treino fechado no porão não aparecia no Histórico (bug achado no teste de ponta a ponta). **`gcTime` infinito**: o cache é de uma academia e uma conta, e sair limpa tudo.
- **Na web, a rede do navegador liga o "sem rede" da fila** (`dados/rede.web.ts`, eventos online/offline): voltou, a fila sobe. No celular, até entrar o NetInfo, a fila tenta a cada 15 s.
- **Recarregar no meio do treino volta ao exercício da última série marcada** (se ainda falta série nele), não ao primeiro com série por fazer (bug achado no teste de ponta a ponta).
- **Tocar a aba ativa numa tela de dentro volta à raiz** nas duas visões (antes só no aluno; componente 12, regra 2).

**Por quê**: o P11 pediu a junção e a gravação de verdade; o que ficava em memória sumia ao recarregar e não chegava à outra visão (o dono escondia o perfil e o aluno continuava vendo).

**Mudaria se**: o Supabase entrar (as coleções locais saem; cada escrita vira `insert`/`update` com a RLS, a refeição desmarcada vira um `delete` na fila, `networkMode` vira `offlineFirst` e o `gcTime` volta a ser finito); o Alex decidir os nomes dos objetivos (só o `formatos.ts` muda); o design ganhar uma linha de 56 com apoio (a `Linha` já tem `compacta`).

## 11/10/2026 — Correções da caça a bugs (agente AB, P11)

**Decidido** (técnico; detalhe e prova em `docs/revisao/AB-BUGS.md`):
- **Uma subida da fila por vez no aparelho**, e o fim do envio só tira o item da fila (e marca `sincronizadoEm`) se o que está guardado é o MESMO que subiu. A série marcada durante o envio fica na fila e sobe na volta seguinte. **Descartado**: travar a gravação enquanto sobe (a série tem de gravar no mesmo quadro do toque, regra 1).
- **Novo item da fila `refeicao_apagada`** (carga = a marca apagada; o servidor apaga pelo `carga.id`): "desmarcar" uma refeição que já subiu, ou que subia naquela hora, e trocar a marca de uma que já subiu. A que ainda não subiu só sai da fila. **Mudaria se** o servidor guardar uma marca só por (aluno, refeição, data) com `upsert` — aí o "apagar" vira um estado da própria marca.
- **O SQL do aparelho saiu para `dados/armazenamento/sqlite.ts`**, sem o expo-sqlite, e é testado no Node com o `node:sqlite` (migração 1 → 2, linha corrompida). Linha com JSON quebrado é pulada, não derruba a abertura. No navegador, o estado guardado com o formato errado volta vazio por parte.
- **"Descartar o treino" fica registrado no aparelho** (`treino-descartado.<aluno>`): as séries continuam gravadas (o texto da folha promete isso, R1.24), mas a retomada não traz o treino de volta. **Descartado**: fechar o treino descartado com `fimEm` (contaria como treino na semana e na Evolução) ou apagá-lo (a folha diz que as séries ficam). **[decidir]** se o treino descartado deve subir ao servidor ou ser apagado da fila.
- **A rota da aba escondida não abre pelo endereço** (`podeAbrirNaAcademia` em `telas/rotas.ts`, conferido no layout da academia): `/painel` só dono, `/acompanhamento` só personal, `/alunos/avisos` e `/alunos/novo-aviso` só dono e recepção. **Mudaria se** o Alex decidir que o instrutor também escreve aviso (R10.10, pergunta 21).
- **O relógio do cronômetro só redesenha quando o que a tela mostra muda** (`telas/aluno/estado/relogio.ts`): o tique continua de 250 ms, mas o "agora" muda uma vez por segundo (antes, 4 redesenhos por segundo do Modo treino inteiro).
- **Estado para o leitor de tela com `aria-*`** (checked, selected, disabled, busy, valuenow/valuetext) ao lado do `accessibilityState`: o react-native-web 0.21 ignora os objetos `accessibilityState`/`accessibilityValue`. No celular os dois valem.
- **"Entrar com e-mail" acha qualquer conta do aparelho** (`Repositorio.usuarioPeloEmail`), inclusive a criada na entrada (era pendência do AA).

**Por quê**: o pedido do Alex ("verificar se há bugs, e procurar erros"); cada item tem o teste que falhava antes.

## 11/10/2026 — Melhorias da segunda busca aplicadas (agente AE, P11)

**Decidido** (técnico e de texto; detalhe, toques antes × depois e provas em `docs/revisao/AE-MELHORIAS-APLICADAS.md`):
- **Regras puras novas no domínio**: `dominio/andamento.ts` (`situacaoDoExercicio`, `oQueFalta`, `deveNascerEmUso`) e `dominio/acompanhamento.ts` (`adesaoDaDieta`, `motivosDoNaoSegui`, `sumiuEstaSemana`, `ordenarPorFiltro`, `diasEntreDatas`), com 31 testes. A tela só chama. **Descartado**: a conta dentro das telas (a do Meus alunos Plus já estava lá e calculava percentual).
- **"Fechar o treino" nunca fecha direto** (R13.1): o menu abre a mesma folha do F4.6, que muda de conteúdo pelo que falta ("Faltam 19 séries de 7 exercícios." · Fechar assim · Voltar ao treino; sem série feita, Descartar o treino, que leva à folha de descarte do AB). **Descartado**: uma segunda folha só para o caso "pela metade" (duas folhas para a mesma pergunta).
- **O primeiro treino nasce em uso** (R13.2) no `ProvedorDoAluno.criar`; o criado com "Adiciono depois" (sem dia, que o R1.6 não deixa ativar) vira o ativo quando ganha o primeiro dia, se o aluno continuar sem treino em uso. **Descartado**: ativar qualquer treino salvo quando não há ativo (mudaria o treino de quem desativou de propósito).
- **"Usar" um pronto volta a Meus treinos** com `router.dismissTo` e o aviso "[treino] em uso · Ajustar" (R13.3).
- **Campo numérico com estado vazio** (`valor` indefinido = "—"): o "−" desabilita, o "+" começa do mínimo mais um passo, o leitor de tela ouve "vazio" e o vazio nunca vira 0 (R1.14, R12.1). **Descartado**: mostrar "0" esmaecido (0 kg é "peso do corpo").
- **Primeira aba por papel** (R13.7) numa `PortaDaAcademia` chamada pela porta do app; "Trocar de visão" para a academia passa pela porta (`/`). A regra pura é `rotaInicialDaAcademia` em `telas/rotas.ts`; dono e personal ao mesmo tempo abre como dono.
- **Tela "Aluno Plus (personal)"** em `/acompanhamento/[id]` (antes reusava o Perfil do aluno do instrutor), com Resumo, Treino e Dieta como chips, a ilha escura como único herói. **Fora**: Conversa ([decidir]), "Novo plano"/"Copiar e ajustar" (o plano é da nutricionista parceira pela escolha provisória de 11/10) e os planos futuros/encerrados (o repositório só lê o plano de uma data).
- **Adesão sempre em par** ("1 de 35 refeições marcadas em 7 dias"); o corte de "marcou menos" continua 20 pontos, calculado por dentro.
- **"Com treino ativo" do painel abre quem está SEM treino ativo** (o filtro que existe e o que pede ação), com a ação "Ver quem está sem" no quadro.
- **`formatarDuracao` com espaço antes da unidade** ("46 min", "1 h 05 min", "1 min 30 s"; tom de voz, princípio 8). Só o Histórico da academia usa; os testes do domínio mudaram junto.
- **Catálogo de componentes só em `__DEV__`**: as quatro entradas (Perfil, Perfil da equipe, contas de exemplo, tela provisória) e a rota `/componentes`, que no export de produção redireciona para `/` e não leva o catálogo no pacote (conferido: nenhuma string dele no JS exportado).
- **Fila: `refeicao_apagada` documentado** em `03-arquitetura/03-DECISOES-TECNICAS.md`, seção 2; apagar o que já não existe no servidor conta como sucesso.

**Por quê**: o top 10 e os itens C1–C17 e os 18 textos do `AC-MELHORIAS.md`, que o Alex pediu aplicados; cada item de lógica tem teste que falhava antes (os 31 do domínio, 4 do campo, 3 do Modo treino, 8 da rota inicial e 2 do primeiro treino).

**Mudaria se**: o Alex decidir a conversa (o "Conversar" e a parte Conversa do aluno Plus), quem escreve o plano alimentar (volta "Novo plano" na tela do personal), "dieta" × "plano alimentar" (só os rótulos), ou quiser um filtro "Com treino ativo" de verdade na lista de Alunos.

## 11/10/2026 — Estados, leitor de tela e texto das telas (agente AH, P11)

**Decidido** (só em `app/telas/`; detalhe, matriz e provas em `docs/revisao/AH-TELAS.md`):
- **Toda tela que lê dado tem os três estados**: carregando (o `Esqueleto` que já existe, pelo `EsqueletoDaTela`), erro com "Tentar de novo" (o `EstadoVazio` de erro, pelo `ErroAoCarregar`) e vazio com caminho. As peças ficam em `telas/compartilhado/estados.tsx`. O `ProvedorDoAluno` passa a expor `erro` e `tentarDeNovo`, e o `carregando` dele espera também o histórico e os prontos; `useAlunos`, `useAluno`, `useEquipeDaAcademia`, `useEquipeDoAluno` e `useProntosPublicados` também. **Por quê**: com a leitura falhando, o Início dizia "Monte seu primeiro treino" e o Plus mostrava o convite a quem já é Plus; a Dieta, o Painel e o link direto de um treino diziam "não existe" antes de o dado chegar. **Descartado**: um componente novo de erro (o `EstadoVazio` variante erro já é o do catálogo).
- **O que muda sem toque é anunciado ao leitor de tela** (`AvisoAoLeitor`): região viva (`aria-live`/`accessibilityLiveRegion`) na web e no Android, `announceForAccessibility` no iPhone (que ignora a região viva). No Modo treino: série marcada (com o descanso), fim do descanso (com a próxima série) e "Desfazer". No Cronômetro, só a troca de fase: a região viva no número falava a cada segundo e saiu.
- **Lista de Alunos cresce de 50 em 50** ("Mostrar mais 50"), em vez de montar 300 linhas: 4.834 → 905 nós no DOM. **Descartado**: `FlatList` (a tela rola inteira num `ScrollView` com cabeçalho grande; trocar é mexer no desenho). **Mudaria se** uma academia passar de ~1.000 alunos (aí busca no servidor e lista virtual).
- **Filtro vazio tem saída** ("Ver todos" ou "Limpar a busca"); "Bom sinal: ninguém precisa disso agora." só nos filtros que pedem ação (não em Plus nem em Novos).
- **Texto**: plural pelo `plural()` em todo número com substantivo (havia "1 exercícios", "1 treinos", "1 segundos" no leitor), unidade na contagem de itens da refeição ("3 itens", não "0/3"), avisos rápidos com frase completa terminam com ponto, "Vou treinar sozinho por enquanto" → "Seguir sem academia por enquanto" (sem gênero), "Depois a gente manda" → "Depois mandamos", placeholder "Treino de verão" → "Treino da manhã" (o tom de voz tira "corpo de verão"), "vínculos encerrados" → "alunos saíram" no painel do dono. A tabela completa está no relatório.

**Mudaria se**: o Supabase entrar (o "Confira a conexão e tente de novo." passa a valer de verdade, e o `tentarDeNovo` refaz a consulta do servidor); o design descongelar (a folha poderia focar o título ao abrir, que é do componente; ver o relatório).

## 11/10/2026 — Terceira varredura: leitura de código e falhas simuladas (agente AG, P11)

**Decidido** (técnico; detalhe, provas e a lista das telas em `docs/revisao/AG-BUGS.md`):
- **A camada `dados/` devolve erro tipado** (`dados/erros.ts`): `ErroDeArmazenamento` (motivo `cheio`, `travado`, `bloqueado`, `outro`; a mensagem nunca leva o conteúdo), `ErroSemSinal` e o resto como "recusado". `textoDoErroDeGravacao` dá o texto do aviso. **Descartado**: a tela ler a mensagem do motor (SQLite e navegador repetem coisas diferentes, e a mensagem pode trazer dado).
- **Escrita que falha não aparece como salva**: no SQLite, o motor lança e nada muda; na memória e no navegador, a mudança VOLTA ATRÁS (lista de desfazer) se o `localStorage` recusar (QuotaExceeded). O repositório local grava no aparelho ANTES de mudar a lista em memória. Antes, o navegador engolia o erro e o SQLite deixava a lista em memória mudada: a tela dizia "salvo" e o dado sumia ao reabrir.
- **`ArmazenamentoLocal.transacao`** (tudo ou nada, aninhável): gravar treino + item da fila, refeição + fila, o fim do envio (tirar da fila + `sincronizadoEm`), trocar a marca de refeição (apagar a antiga + "apagar" na fila + gravar a nova), ativar treino, copiar pronto, enviar treino ao aluno, confirmar vínculos. O app fechando no meio não deixa treino gravado fora da fila. **Descartado**: reconciliar na abertura (procurar treino sem `sincronizadoEm` fora da fila) — é remendo do que a transação evita.
- **Padrão das telas: `useGravarComAviso`** (`componentes/`): grava; se falhar, aviso rápido de erro com "Tentar de novo", que grava de novo com os MESMOS argumentos; nunca rejeita. `{ umPorVez: false }` para gravação de fundo (chave, série, treino editado), em que nenhuma chamada pode ser descartada. Aplicado em Alunos (confirmar, recusar), Prontos (arquivar), Painel (designar personal), Perfil do aluno (encerrar vínculo), Avisos (retirar), Avisos da equipe, folha de envio e no `ProvedorDoAluno` (treino editado, série, refeição, peso, perfil, avisos). Na série, o "Tentar de novo" grava a versão MAIS NOVA do treino, nunca a da falha.
- **Preferência do aparelho nunca derruba a tela** (`dados/preferencias.ts`): sessão, último vínculo, vibração, cronômetro e aviso dispensado, com o disco cheio, seguem na memória e a falha vai para o registro. O cronômetro é gravado num `useEffect`; um erro ali derrubava a árvore inteira.
- **Fila**: item com instante estragado vai para o fim, em vez de travar a fila inteira; o "apagar" de uma marca de refeição sobe antes da marca nova da mesma refeição e data, mesmo com o relógio voltando; `itemDaFila`/`registroDaColecao` no lugar de reler a fila a cada item (1.000 itens: 41 s → 0,2 s no SQLite); SQLite com `busy_timeout` de 2 s; a ordem de leitura é a de gravação (`rowid`), não o texto do instante.
- **Instante nunca comparado como texto** no repositório (histórico e aviso em vigor): `Date.parse`.
- **Preferências de aviso e da equipe gravadas por versão antiga** voltam completadas pelo padrão.
- **Conta nova, pedido de vínculo e cancelar o pedido precisam de sinal** (`ErroSemSinal`), como o pedido de treino: pela seção 2 do `03-DECISOES-TECNICAS.md`, offline só entram na fila o treino realizado e a marca de refeição. A entrada reaproveita a conta criada numa tentativa que parou no pedido. (Pedido do coordenador, achado do AH.)
- **Componentes**: o `Deslizar` chama o `aoConcluir` ATUAL (antes, o do primeiro desenho: o rótulo dizia "Treino B" e o arrasto começava o A); a `FolhaInferior` cria o gesto uma vez (o redesenho da tela de trás no meio do arrasto zerava o `dy`), põe a sobreposição depois do painel e fora do teclado (o foco vai ao conteúdo) e a alça sem rótulo solto; `ListaDaEquipe` com item de lista; `Campo` e `CampoNumerico` com o teto de ampliação do estilo.
- **ESLint com a configuração do Expo** (`app/eslint.config.js`): 0 erros (os 4 eram aspas em texto JSX no `envio.tsx`).

**Por quê**: o pedido do Alex ("prosseguir com mais varredura de bugs e melhorias") e a regra de que o dado do aluno nunca se perde. Cada item tem o teste que falhava antes.

**Mudaria se**: o Supabase entrar (o `ErroSemSinal` passa a vir da rede de verdade, e a transação local continua valendo para a fila); o design ganhar uma tela própria para "o aparelho não abre o banco" (hoje, se o SQLite não abrir, o app não abre — pendência); a web virar produto (o `localStorage` grava o estado inteiro a cada escrita: com 1.000 itens na fila, ~20 ms por escrita).

## 15/10/2026 — Mudança de rumo: academia de LUTA, e a área do ADMINISTRADOR vira a primeira entrega

**Decidido pelo Alex:**
1. **Não é academia de musculação, é academia de luta.** Sai o que é de musculação: séries, carga, treino A/B/C, catálogo de musculação e ilustrações de aparelho. O app ganha cara de luta.
2. **Uma terceira parte, o administrador (dono)**, com controle total e na frente das outras:
   - quantas pessoas estão cadastradas;
   - quantos funcionários a academia tem;
   - uma área "tipo Excel" para anotar valores e calcular o ganho do mês.

   Hoje eles anotam tudo numa planilha.

**Prioridade**: a área do administrador é a parte mais importante e a primeira a ser entregue.

**Pendente**:
- o link do perfil da academia: o Alex vai mandar, para alinhar marca, modalidades e cara do app;
- a planilha que usam hoje: se o Alex mandar, a área do administrador importa os dados dela.

**O que continua valendo**: o método (P00, prompts, agentes por pasta, decisões e auditoria), o design aprovado (vidro, foto, escala fechada, um destaque por tela), a pilha técnica (Expo e Supabase) e as regras de LGPD. O dado financeiro passa a ser tão sensível quanto o de saúde.

## 15/10/2026 — Raça Fight Gravataí, e três versões conectadas

**A academia** é a Raça Fight Gravataí (Instagram @racafightgravatai), com Muay Thai, Jiu-Jitsu, Boxe e Luta-Livre. A frase deles é "Treine com disciplina, técnica e respeito", e eles oferecem aula experimental gratuita. O Alex informou que eles deram acesso total às imagens do perfil.
**Três versões conectadas** pelo mesmo backend e pelos mesmos dados:
1. o aluno (cliente);
2. professores e funcionários;
3. o ADMIN, um app separado com interface própria ("um local totalmente diferente… um app muito específico só dele").

O admin precisa ser "bem completo e bem profundo":
- filtro total, cruzando funcionários, clientes e valores;
- um lugar para anotar e lembrar (notas, lembretes, tarefas);
- histórico de tudo.

**Imagens**: o Instagram não entrega as fotos para acesso automático, porque mostra a tela de login. Os arquivos (logo e fotos) vão para `02-design/referencias/raca-fight/`, enviados pelo Alex.

## 15/10/2026 — A cara do app passa a ser a da Raça Fight (magenta, preto e branco)

**Visto**: o logo da foto de perfil tem magenta `#C90071`, preto e branco, e o "FIGHT" vai dentro de uma faixa de luta (detalhes em `02-design/referencias/raca-fight/00-LEIA-ME.md`).
**Consequência**: o verde-água `#39F0CD` e o logo "Barra e mais" eram da marca genérica "Academia Plus". Para a Raça Fight, a paleta e o logo passam a ser os da academia. O que vem do P09 continua valendo: o sistema de design (escala, componentes, vidro, foto, proporção e movimento). Só trocam os valores de cor e as imagens, como o projeto já previa para white-label.
**Pendente [decidir]**:
- o nome do app na loja: "Raça Fight", "Raça Fight Gravataí" ou outro;
- se o "Academia Plus" continua como produto por trás, white-label para outras academias, ou some;
- o logo em alta resolução e as fotos, que o Alex vai mandar.

## 15/10/2026 — CORREÇÃO: a marca da Raça Fight é VERMELHO, preto e branco

A página salva do Instagram (54 imagens) mostra a marca em vermelho `#C42024`, fundo escuro `#1C1C1C` e branco, em todos os cartazes, no letreiro e nas camisetas. **O magenta da foto de perfil é campanha (Outubro Rosa), não a marca.** A entrada anterior ("magenta, preto e branco") fica corrigida por esta.

**Dados reais** guardados em `02-design/referencias/raca-fight/01-DADOS-REAIS.md`:
- a grade de horários;
- as modalidades, incluindo **MMA** e as turmas **Kids** de Muay Thai e de Jiu-Jitsu;
- a Sexta OPEN e o sábado de competição;
- o endereço, o WhatsApp, os treinadores e um evento.

**Exemplos no app**: nomes fictícios até a academia autorizar. Fotos de menores só com autorização dos responsáveis.

## 15/10/2026 — Luta: graduação como dado, presença confirmada pela chamada, rounds no cronômetro que já existe (agente AJ, P12)

**Decidido** (técnico e de especificação; detalhe em `01-especificacao/luta/`, regras R14 a R22, e `docs/revisao/AJ-LUTA.md`):
- **A graduação é um dado, não código** (R16.1, R16.2): cada modalidade tem zero ou mais "sistemas de graduação" (por público: adulto, kids), com os níveis em ordem, cores, graus, idade, tempo e presenças mínimos. O IBJJF (junho de 2026) vem como modelo pronto; Muay Thai e Luta Livre nascem para a academia preencher. **Por quê**: a pesquisa achou cerca de 20 entidades de Muay Thai no Brasil, sem régua única, e o cordão amarelo da Raça Fight não está na lista atribuída à CBMT; Boxe e MMA não têm faixa. **Descartado**: a régua do jiu-jitsu escrita no código, com exceções por modalidade.
- **Mínimo da federação separado do mínimo da academia** (R16.3): a IBJJF exige idade e tempo, nunca número de aulas; presença mínima é sempre da academia. **O app nunca gradua sozinho** (R16.11): só lista quem atingiu os mínimos.
- **O tempo na faixa conta da data registrada no app** (R16.7) e a tela diz isso: não é prova perante a federação.
- **Graduação e presença não se apagam**: anulam-se com motivo (R16.13, R15.5).
- **Presença**: o check-in do aluno nasce `pendente`; a chamada do professor confirma ou retira; o que ficar pendente às 23:59 confirma sozinho, com a marca "sem chamada" (R15.4, R15.5). **Por quê**: o aluno não pode perder a presença porque o professor esqueceu de fechar a chamada, e o professor continua sendo quem garante. **Descartado**: GPS (dado de localização para pouco ganho), catraca e QR na v1, presença só pelo aluno (número inflado, a pergunta 9 antiga) e só pelo professor (fila e esquecimento).
- **Check-in e chamada entram na fila offline** com o mesmo dono do item e as regras de sessão vencida do R12.3; no servidor, aluno + aula é uma presença só, e a ação do professor vence o check-in (R15.9). **Por quê**: tatame sem Wi-Fi é a cena do "porão" da musculação.
- **A aula existe pela grade e só vira linha no banco quando alguém faz check-in, a chamada, ou a cancela** (R14.4a); mudar um horário vale da próxima semana em diante (R14.4b).
- **Turma pode ter mais de uma modalidade** (R14.3: o Jiu-Jitsu / Luta Livre da grade real); a presença conta para uma, escolhida no check-in.
- **O cronômetro de rounds é o intervalado que já existe**: predefinições de luta (Boxe e Muay Thai 3 × 3 min/1 min, MMA 3 × 5 min/1 min, com fonte), aviso dos 10 s e gongo **com o app aberto** (R17). Continua sem áudio em segundo plano (decisão de 10/10). O tempo do cronômetro não vira registro (R9.10 sai).
- **Nenhum dado financeiro chega ao professor nem ao app do aluno na hora do check-in** (R14.6a, R15.7): atraso não aparece; só a matrícula encerrada tira o direito. O bloqueio por atraso, se a academia quiser, é do Admin.
- **Criança não tem conta na v1**: o responsável entra, com dependentes (R20.1); autorização de imagem separada e desligada por padrão (R20.6); base no art. 14 da LGPD e no Enunciado CD/ANPD nº 1/2023.
- **Aula experimental pelo WhatsApp na v1** (R19.2): link `wa.me` com a modalidade na mensagem; o app não registra o toque; o registro nasce na recepção.
- **Nomes compartilhados com o Admin** (glossário em `01-especificacao/luta/00-LEIA-ME.md`): modalidade, turma, horário, aula, presença, graduação, evento, interessado, aula experimental, professor (`instrutor` no dado), plano, matrícula e mensalidade (estes três, do AI).

**Mudaria se**: a academia mostrar que a chamada não é feita na prática (aí QR na parede ou tablet no balcão, L17); o volume de aulas pedir que a aula seja gerada por tarefa agendada em vez de sob demanda; a Raça Fight quiser bloquear o check-in por atraso (L8); um advogado disser que a criança precisa de consentimento para a presença também (aí a matrícula do Admin colhe esse consentimento).

**Pendente [decidir]**: 34 perguntas em `01-especificacao/luta/90-PERGUNTAS-PARA-O-ALEX.md` (L1 a L34), das quais travam a construção L1, L3, L4, L5, L12, L13, L14, L19 e L32.

## 15/10/2026 — A área do administrador: especificação, modelo e domínio financeiro (agente AI, P12)

**Decidido** (técnico e de especificação; detalhe em `01-especificacao/admin/`, `03-arquitetura/05-ADMIN.md`, `03-arquitetura/01-MODELO-DE-DADOS.md` (Parte 2, seções 26 a 41) e `docs/revisao/AI-ADMIN.md`):

- **Admin = terceiro app, web instalável (PWA) na pasta `admin/`**, ao lado de `app/`, com o mesmo Supabase e o mesmo `app/dominio/` importado por apelido. É a sugestão do Alex quanto ao lugar, trocando a ferramenta: Vite + React no lugar de Expo.
  - **Por quê**: o centro do Admin é uma planilha (edição na célula, teclado, colar do Excel, ler e baixar arquivo), e isso é nativo do navegador. O PC (2040 × 790) vem primeiro. Não passa por loja.
  - **Descartado**: segundo app Expo (a grade luta contra o React Native, e é mais um app na loja); painel em outro repositório (duas cópias do domínio).
  - **Mudaria se**: o Alex quiser o Admin na loja, ou o Web Push no iPhone não servir ao dono. **[decidir] A23**.
- **Domínio financeiro em `app/dominio/financeiro/`**, TypeScript puro, com 86 testes:
  - dinheiro em centavos e **percentual em pontos-base** (inteiro), sem fração no dado;
  - adaptado do núcleo do Valores, com quatro correções: aceita a célula numérica e a data de série do XLSX; o separador é contado fora das aspas; a linha errada volta com o erro em vez de sumir; a data da planilha exige o ano.
  - **Descartado**: copiar o `lerData` do Valores, que assume o ano corrente em "26/10" (na importação isso grava o ano errado em silêncio).
- **Regime de caixa** no resultado do mês (proposta, **[decidir] A4**). O pendente aparece ao lado, nunca somado.
- **Tudo o que é [decidir] e mexe em conta entra como parâmetro obrigatório, sem padrão**: o primeiro mês, a multa e os juros, os dias para o retorno da experimental, os descontos de família e de indicação, e o prazo do interessado. Em produção, esses valores vêm de `RegrasDeCobranca`.
- **Multa até 2 % e juros até 1 % ao mês, validados no domínio.** O CDC (art. 52, § 1º) é o teto que as fontes citam. Desde a Lei 14.905/2024, sem taxa escrita valem a Selic menos o IPCA. A academia confirma com o contador.
- **Pagamento parcial recusado** na primeira entrega (**[decidir] A11**). O caminho é anotar e lembrar o combinado.
- **Combo repartido em partes iguais** entre as modalidades, com pesos opcionais no plano (**[decidir] A10**). A repartição é **congelada** na cobrança e no lançamento.
- **Kids: a cobrança vai ao pagador (o responsável)**, e a criança é `alunoPessoaId`. Mesmo pagador = família. O desconto de família é **sugerido**, nunca aplicado sozinho.
- **"Matriculado" ≠ "ativo"**. Matriculado tem matrícula ativa. Ativo (R8.5) treinou nos últimos 30 dias. As duas palavras convivem no painel.
- **Pessoa do cadastro existe sem conta no app.** `usuarioId` liga as duas quando houver. Funcionário (função e remuneração) é diferente de papel (vínculo).
- **Mês fechado trava as linhas**, nos dois lados de uma mudança de data. Reabrir pede motivo.
- **Histórico gravado por gatilho**, sem `update` nem `delete` para ninguém.
- **Sem fila offline no Admin**: dinheiro não grava sem rede. As gravações de várias linhas são uma transação no servidor.
- **Exportação CSV** em UTF-8 com BOM, `;`, CRLF e vírgula decimal, com a proteção contra fórmula da OWASP. O que sai volta igual pela importação (há teste). **XLSX**: o pacote `xlsx` 0.18.5 do npm **não entra**, por causa das CVE-2023-30533 e CVE-2024-22363 (o Valores usa essa versão: recomendação no relatório).
- **Funil da aula experimental calculado** a partir do Interessado e da AulaExperimental do AJ (R19), sem coluna de etapa.
- **Exemplos com nomes fictícios** e valores inventados (`dominio/financeiro/exemplo.ts`), com as modalidades e turmas reais da Raça Fight.

**Por quê**: o pedido do Alex de 15/10 ("controle total", "tipo um Excel", "realmente bem completo e bem profundo", app separado e conectado) e a regra de que dado financeiro é tão sensível quanto o de saúde.

**Pendente [decidir]**: 24 perguntas em `01-especificacao/admin/90-PERGUNTAS-PARA-O-ALEX.md` (A1 a A24). Travam o código: A1, A3, A7, A13 (**a planilha atual dele**), A18 e A19.


## 15/10/2026 — Cara de luta (AL) e os três PDFs (P13)

- **`tokens.json` 2.0.0, marca Raça Fight.** O verde saiu. Entram o vermelho `#C42024`, o preto `#1C1C1C`/`#343434` e o branco. Os nomes dos tokens não mudaram, então o gerador de tema do app continua servindo. O antigo está em `historico/tokens-1.8.0-academia-plus.json`.
- **Vermelho como texto no escuro é `#FF6B6B` (6,14:1).** O `#C42024` sobre o preto dá 2,90:1, então ele só aparece como preenchimento, com branco por cima (5,87:1). O erro também é vermelho, por isso vem sempre com o ícone de alerta e uma frase.
  - **Descartado:** escurecer o fundo até o vermelho da marca passar como texto, porque a marca deixaria de ser preta.
- **Abertura preta nos dois temas**, com o logo branco e a ponta vermelha.
- **Logo PROVISÓRIO**, redesenhado a partir das fotos (`02-design/marca-e-proposta/logo-raca-fight/`). Entra o original quando a academia mandar.
- **Fotos:** nenhuma foto de uso público mostra rosto de criança. 11 fotos ficam "só com autorização".
- **Ícones:** os de luta que faltam nas bibliotecas são desenho próprio (luva, faixa, tatame, saco, gongo, kimono, caneleira, cronômetro de round). Os de musculação saem das telas, mas os arquivos ficam até o AM tirar o catálogo do `app/`, porque os testes do catálogo leem esses arquivos.
- **Três PDFs separados** (pedido do Alex): admin primeiro (feito, 27 p.), depois professor e aluno. O PDF antigo, o de musculação, fica como histórico.
- **Hospedagem recomendada:** Supabase Pro em São Paulo, com cópia própria guardada 30 dias, cerca de R$ 162 por mês (`docs/hospedagem/`).
  - **Descartado:** o plano grátis (pausa e não tem cópia) e a VPS (manutenção e cópia só semanal).

**[decidir] da AL:**
- o ícone do app: o logo compacto inteiro ou só "RAÇA" com a ponta vermelha;
- de quem é o emblema "Cyborg Martial Arts" das camisetas;
- a autorização de quem aparece nas fotos (L34).

## 15/10/2026 — A23 aprovada: o Admin é um app web instalável

- **O Alex aprovou** ("ok") que o Admin seja um app web instalável (Vite + React, PWA) na pasta `admin/`, ao lado de `app/`. Ele usa o mesmo Supabase e o mesmo domínio, que fica em `app/dominio/`, e não passa pela loja.
- **Construção com valores PROVISÓRIOS** enquanto a academia não responde. As perguntas que ainda faltam são A1, A3, A7, A13, A18 e A19, mais o logo.
- **Divisão da onda 3:**
  - **AM1** é dono de `admin/` e de `app/dominio/financeiro/`.
  - **AM2** é dono do resto de `app/`, para a virada de luta do aluno e do professor.

## 15/10/2026 — A construção do Admin (agente AM1, P12)

- **XLSX: `read-excel-file` 9.3.10 (MIT), só leitura**, carregado só quando o arquivo é .xlsx.
  - **Por quê**: lê o que precisamos (célula com número e data), é mantido (versão de 07/10/2026), não tem script de instalação nem `eval`/rede no código, e o `npm audit` do `admin/` fica em **0 vulnerabilidades**. As dependências são `fflate`, `saxen`, `unzipper-esm` e `worker-f`.
  - **Descartado**: o `xlsx` 0.18.5 do npm (CVE-2023-30533 e CVE-2024-22363); o SheetJS do CDN (fora do npm, mais difícil de auditar e de atualizar); o `exceljs` (escreve e lê, bem maior, última versão de 12/2024).
  - **Mudaria se**: o Admin precisar ESCREVER XLSX (v2, RA8.7), ou a planilha real da academia (A13) usar algo que ele não lê (fórmula sem valor guardado, .xls antigo).
  - O arquivo tem teto de 5 MB e 20 mil linhas; nada dele é guardado, só o que vira lançamento.
- **Os três achados do AR corrigidos no domínio**, com o teste antes (`revisao-ar.test.ts`): o painel compara o mesmo trecho dos dois meses e traz o mês anterior inteiro à parte (`periodoAteODia`, `mesmoPeriodoDoMesAnterior`, `ResumoDoPainel.mesAnterior`); o histórico sai em frase com rótulo humano para todo campo e o fechamento diz o mês; a mensalidade sai "Boxe 2× — outubro/2026" (`nomeDoMesComAno`). O aviso de mês fechado diz "Setembro de 2026 está fechado". A mesma regra do mesmo trecho vale na comparação dos relatórios.
- **`RegrasDeCobranca` virou tipo do domínio** e os valores provisórios moram num arquivo só (`admin/src/dados/regras-provisorias.ts`): primeiro mês cheio (A7), sem multa e juros até o contador confirmar (A3), gerar no dia 1 desligado (A6), 3 dias para chamar de volta (A15), família 10 % e indicação R$ 30 por 1 mês só como exemplo (A8, A9). A tela marca "provisório" até o dono dizer que são os reais.
- **Repositório com duas implementações e um contrato**: cada operação é uma intenção do dono e uma transação. O local usa as mesmas funções do domínio e grava o histórico como o gatilho grava; o Supabase chama uma função `security definer` por intenção. **Descartado**: a tela falar direto com as tabelas (a regra de várias linhas ficaria espalhada).
- **Cobrança em aberto aparece na grade como linha "virtual"** com "Marcar como paga", sem virar lançamento antes de paga (RA4.7), e entra no "a receber" do rodapé. **Mudaria se** o Alex preferir a mensalidade pendente como linha de verdade (aí muda o regime, A4).
- **Tema gerado do `tokens.json`** (`admin/ferramentas/gerar-tokens-css.mjs`). O que o token não tem (barra lateral preta nos dois temas, linha selecionada, zebra, barra cinza do gráfico) e as duas cores do claro que o AK mediu (sucesso `#087033`, atenção `#A84700`) estão numa tabela explícita no gerador, como proposta ao AL.
- **PWA sem plugin**: manifesto e um service worker de 40 linhas que guarda só a casca; nada de dado financeiro em cache. **Descartado**: o `vite-plugin-pwa`/Workbox (dependência grande para um cache de casca).
- **Login**: e-mail e senha e o segundo fator TOTP do Supabase Auth (aal2) antes de abrir; quem decide se é dono é a função `minha_academia_de_dono()` no banco. No modo local, entra direto como "Alex, dono".

## 16/10/2026 — Um esquema só para os três apps (agente AU, P12, onda 4)

- **Pasta única: `app/supabase/migrations/`**, com sete arquivos numa ordem só (base → pessoas e luta → dinheiro → equipe, avisos e saúde → histórico e travas → funções → permissões) e um `seed.sql` com a grade real da Raça Fight. As cinco migrações do Admin e as duas do app foram juntadas lá, e as pastas antigas ficaram sem SQL.
  - **Por quê**: a CLI do Supabase só lê `supabase/migrations/`, então o nome em inglês é exigência da ferramenta, como `token`. Também conta que `app/supabase/` já era a pasta do banco no modelo e no LEIA-ME. As duas pastas antigas não rodavam juntas num banco novo: o `20261015000200` do Admin **falha num Postgres de verdade** (índice com `to_char`, que não é imutável), e por isso tudo que vinha depois dele também falhava.
  - **Descartado**: manter as duas pastas com `if not exists` (a ordem dependia da sorte e escondia duplicata); uma pasta `supabase/` na raiz (fora das pastas que o AU podia mexer e longe da CLI, que roda de `app/`).
  - **Mudaria se**: o projeto virar monorepo com workspaces (aí `supabase/` sobe para a raiz, e é só mover a pasta).
- **Ids: uuid em toda tabela**, e o nome legível vira coluna `chave` (`modalidades.chave` = `muay_thai`, `turmas.chave` = `muay-thai-noite-1`).
  - **Por quê**: a conta do Supabase Auth já é uuid; o Admin já usava uuid; o aparelho gera uuid sem sinal; a chave estrangeira confere o tipo; e texto como chave primária colide entre academias (`muay-thai` de duas academias), que é o [decidir] de uma ou várias academias.
  - **Descartado**: texto em tudo (o que o exemplo do app usa hoje).
  - Os ids fixos da Raça Fight estão no `seed.sql` e em `03-arquitetura/06-INTEGRACAO.md`, seção 5. A aula continua sem tabela, com a chave `<horario_id>@<data>` calculada por gatilho.
- **O aluno no banco é a PESSOA** (`pessoa_id`), não a conta. Isso vale para o adulto com conta, para a criança sem conta e para quem só existe no cadastro do dono. A conta de aluno que fica ativa cria a pessoa sozinha, e é assim que o aluno do app aparece no Admin.
  - **Descartado**: presença e graduação apontando para `auth.users`, porque a criança não tem conta (R20.1).
- **Quem vê o quê é do banco** (44 casos provados): o aluno vê só o dele e o dos dependentes; o professor vê as turmas e modalidades dele, e nenhum valor em reais; a recepção vê o balcão (vínculos, funil com WhatsApp, contato do responsável) e nenhum dinheiro; o dono vê tudo da academia dele; o dinheiro é só do dono (`pode_financeiro`, A1 em aberto).
  - `pessoas` só o dono lê pela tabela. Os outros leem por função, com as colunas cortadas (`minhas_fichas`, `fichas_da_academia`), porque a observação e o documento são do dono.
  - O histórico fica sem insert, update e delete para todos, e um gatilho recusa a mudança até para o dono do banco. Ficam fora dele o dado de saúde e o motivo de saída por pessoa.
- **"Nada se apaga" virou permissão**: o `delete` e o `truncate` foram revogados de todas as tabelas. Ficam três exceções com motivo: o dispositivo, a medição do mesmo dia e o aviso dispensado.
- **A presença sobe por uma função**, `registrar_presencas`. Ela confere a janela pelo instante do aparelho e aceita só o check-in do próprio aluno ou do responsável. A matrícula precisa liberar a modalidade; quem nunca teve matrícula passa só com o vínculo, o provisório do R14.6. A equipe vence o aluno, até 7 dias para trás.
- **Plus, dieta e conversa ficaram fora do esquema** porque estão desligados por `RECURSOS`. Quando ligarem, entram numa migração própria.
- **Prova sem nuvem**: um Postgres 18 descartável (PGlite, em memória), com os papéis e o `auth.uid()` do Supabase imitados (`app/supabase/testes/`). O PGlite já estava instalado em outro projeto do Alex, então nada foi instalado e nenhuma conta foi criada. O teste morde: com uma regra quebrada de propósito, os casos certos caem.

## 16/10/2026 — Varredura de bugs do Admin (agente AO, P12, onda 4)

- **Uma escrita por vez no repositório local** (uma fila): duas escritas juntas liam a mesma cópia e a segunda apagava a primeira. No Supabase, quem garante isso é a transação do banco. Os botões que gravam dinheiro também ficam desligados enquanto gravam (`useEnvio`). **Descartado**: só desligar o botão, porque o Enter rápido em duas células passa por outro caminho. **Mudaria se** o modo local deixar de existir.
- **Colar UMA coluna (sem tabulação) preenche para baixo as linhas que já existem**, como no Excel, numa ação só. Várias colunas continuam virando linhas novas (RA4.4). Antes, a coluna colada virava linhas novas sem descrição, todas com erro. Um valor colado com várias células marcadas vai para todas. **Mudaria se** o Alex quiser que toda colagem crie linha nova.
- **Trocar o tipo** (na coluna Tipo ou digitando "-20") numa linha com categoria do outro tipo **tira a categoria**: o que a pessoa acabou de dizer vale (RA4.3), e a linha continua gravável. Na colagem e na folha do celular, onde o tipo e a categoria chegam juntos e brigam, isso é erro no campo da categoria. **Descartado**: o erro na célula, porque quebrava o "-20 vira saída" da regra.
- **Importar a planilhazinha**: sem coluna de descrição, a descrição sai da categoria e da pessoa ("Mensalidades — Bruno Almeida"), com aviso. Sem coluna de tipo, a tela pergunta se as linhas são entradas ou saídas (`tipoPadrao`), e o sinal ou a categoria continuam valendo antes desse padrão. O valor aceita "+150,00" e "150,00 D/C" do extrato; a data aceita a hora depois. A linha "TOTAL" na primeira coluna sai.
- **Pagamento**: a data não pode passar de hoje (é caixa), e o valor maior que o esperado pede um segundo clique. Pagamento parcial continua recusado (A11).
- **O pacote JS principal caiu de 762 kB para 411 kB**: o supabase-js e o login (`EntradaSupabase.tsx`) e as telas menos usadas vêm por import dinâmico. O dia a dia (painel, planilha, cobranças, fechamento, pessoas) fica no principal.
- **Pedidos do AU**: o lote da família usa `marcar_como_pagas` e o funil usa `matricular_interessado` (uma transação cada). O desconto de quem indicou ainda vai numa segunda escrita, porque a função não o recebe. A experimental leva `horarioId`, e foi criada a tela Ajustes › Turmas e horários (a turma com os horários dela; o horário que sai fica inativo). A duração das aulas segue [decidir] L1 (o exemplo usa 60 min, como o seed).

## 18/10/2026 — onda 5 (entrega)
- **Abertura no Android 12+:** `imageWidth` do splash 396 → 288 no `app.json`, porque o logo era cortado ("R" e último "A" sumiam). Agente AP.
- **Cronômetro de rounds em tema claro:** o número ficava cinza-escuro sobre preto; corrigido em `TelaCronometroDeRounds.tsx`. Agente AP.
- **Aviso da turma:** o professor abre `/alunos/novo-aviso?turma=…`; o aviso para todos segue só dono e recepção (`podeAbrirNaEquipe` recebe os parâmetros). Agente principal.
- **Exemplo do Admin sem nomes de atletas reais:** Bruno→Breno, Leonardo→Leandro, Juliana→Jordana, César→Célio, Duarte→Dutra, Arthur→Otto.
- **Admin no PC:** servidor local na porta fixa 4174 (só este PC), atalho "Raça Fight — Admin" na Área de Trabalho; arquivos em `A:\Projetos\Academia Plus\Admin\`.
